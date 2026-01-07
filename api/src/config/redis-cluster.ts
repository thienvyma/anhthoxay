/**
 * Redis Cluster Client Configuration
 *
 * Provides a Redis client that supports both single node and cluster modes
 * with automatic failover handling and in-memory fallback.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
 */

import Redis, { Cluster, RedisOptions, ClusterOptions, ClusterNode } from 'ioredis';
import { logger } from '../utils/logger';

// ============================================
// Types and Interfaces
// ============================================

export type RedisMode = 'single' | 'cluster';

export interface RedisClusterConfig {
  mode: RedisMode;
  nodes?: string[];           // For cluster mode (REDIS_CLUSTER_URLS)
  url?: string;               // For single mode (REDIS_URL)
  fallbackToMemory: boolean;
  maxRetries: number;
  retryDelayMs: number;
  connectionTimeoutMs: number;
  commandTimeoutMs: number;
}

export interface RedisClusterClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  mget(keys: string[]): Promise<(string | null)[]>;
  keys(pattern: string): Promise<string[]>;
  ping(): Promise<string>;
  ttl(key: string): Promise<number>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  exists(key: string): Promise<number>;
  isConnected(): boolean;
  getMode(): RedisMode | 'memory';
  close(): Promise<void>;
}

// ============================================
// In-Memory Fallback Cache
// ============================================

interface MemoryCacheEntry {
  value: string;
  expiresAt: number | null;
}

class InMemoryCache {
  private cache: Map<string, MemoryCacheEntry> = new Map();
  private readonly maxSize: number = 10000;
  private readonly defaultTtl: number = 60; // 60 seconds for fallback

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  set(key: string, value: string, ttl?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    // Use reduced TTL for fallback mode
    const effectiveTtl = ttl ? Math.min(ttl, this.defaultTtl) : this.defaultTtl;
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (effectiveTtl * 1000),
    });
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  mget(keys: string[]): (string | null)[] {
    return keys.map(key => this.get(key));
  }

  keys(pattern: string): string[] {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  ttl(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  incr(key: string): number {
    const current = this.get(key);
    const newValue = (parseInt(current || '0', 10) + 1).toString();
    const entry = this.cache.get(key);
    this.set(key, newValue, entry?.expiresAt ? Math.ceil((entry.expiresAt - Date.now()) / 1000) : undefined);
    return parseInt(newValue, 10);
  }

  exists(key: string): number {
    return this.get(key) !== null ? 1 : 0;
  }

  clear(): void {
    this.cache.clear();
  }
}

// ============================================
// Redis Cluster Client Implementation
// ============================================

class RedisClusterClientImpl implements RedisClusterClient {
  private client: Redis | Cluster | null = null;
  private memoryCache: InMemoryCache;
  private config: RedisClusterConfig;
  private connected = false;
  private currentMode: RedisMode | 'memory' = 'memory';
  private reconnecting = false;
  private reconnectAttempts = 0;

  constructor(config: RedisClusterConfig) {
    this.config = config;
    this.memoryCache = new InMemoryCache();
  }

  async initialize(): Promise<void> {
    if (this.config.mode === 'cluster' && this.config.nodes && this.config.nodes.length > 0) {
      await this.initializeCluster();
    } else if (this.config.url) {
      await this.initializeSingle();
    } else {
      logger.info('[REDIS_CLUSTER] No Redis configuration found, using in-memory fallback');
      this.currentMode = 'memory';
    }
  }

  private async initializeSingle(): Promise<void> {
    try {
      const options = this.getSingleNodeOptions();
      this.client = new Redis(options);
      this.setupEventHandlers(this.client);
      this.currentMode = 'single';
      
      // Wait for connection
      await this.waitForConnection();
    } catch (error) {
      logger.error('[REDIS_CLUSTER] Failed to initialize single node', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.fallbackToMemory();
    }
  }

  private async initializeCluster(): Promise<void> {
    try {
      const nodes = this.parseClusterNodes();
      const options = this.getClusterOptions();
      
      this.client = new Cluster(nodes, options);
      this.setupClusterEventHandlers(this.client as Cluster);
      this.currentMode = 'cluster';
      
      // Wait for connection
      await this.waitForConnection();
    } catch (error) {
      logger.error('[REDIS_CLUSTER] Failed to initialize cluster', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.fallbackToMemory();
    }
  }

  private getSingleNodeOptions(): RedisOptions {
    if (!this.config.url) {
      throw new Error('Redis URL not configured');
    }
    const url = new URL(this.config.url);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: this.config.maxRetries,
      connectTimeout: this.config.connectionTimeoutMs,
      commandTimeout: this.config.commandTimeoutMs,
      retryStrategy: (times: number) => this.retryStrategy(times),
      lazyConnect: false,
      enableReadyCheck: true,
    };
  }

  private getClusterOptions(): ClusterOptions {
    return {
      clusterRetryStrategy: (times: number) => this.retryStrategy(times),
      enableReadyCheck: true,
      scaleReads: 'slave', // Read from replicas for better distribution
      maxRedirections: 16,
      retryDelayOnFailover: this.config.retryDelayMs,
      retryDelayOnClusterDown: this.config.retryDelayMs,
      retryDelayOnTryAgain: this.config.retryDelayMs,
      redisOptions: {
        maxRetriesPerRequest: this.config.maxRetries,
        connectTimeout: this.config.connectionTimeoutMs,
        commandTimeout: this.config.commandTimeoutMs,
      },
    };
  }

  private parseClusterNodes(): ClusterNode[] {
    if (!this.config.nodes) return [];
    
    return this.config.nodes.map(nodeUrl => {
      const url = new URL(nodeUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port, 10) || 6379,
      };
    });
  }

  private retryStrategy(times: number): number | null {
    this.reconnectAttempts = times;
    
    if (times > this.config.maxRetries) {
      logger.warn('[REDIS_CLUSTER] Max retries exceeded, falling back to memory', {
        attempts: times,
        maxRetries: this.config.maxRetries,
      });
      
      if (this.config.fallbackToMemory) {
        this.fallbackToMemory();
      }
      return null;
    }
    
    const delay = Math.min(times * this.config.retryDelayMs, 5000);
    logger.info('[REDIS_CLUSTER] Retrying connection', { attempt: times, delayMs: delay });
    return delay;
  }

  private setupEventHandlers(client: Redis): void {
    client.on('connect', () => {
      this.connected = true;
      this.reconnecting = false;
      this.reconnectAttempts = 0;
      logger.info('[REDIS_CLUSTER] Connected to Redis (single node)');
    });

    client.on('ready', () => {
      this.connected = true;
      logger.info('[REDIS_CLUSTER] Redis ready');
    });

    client.on('error', (err) => {
      logger.error('[REDIS_CLUSTER] Redis error', { error: err.message });
      // Don't set connected to false immediately - let retry strategy handle it
    });

    client.on('close', () => {
      this.connected = false;
      logger.warn('[REDIS_CLUSTER] Redis connection closed');
    });

    client.on('reconnecting', () => {
      this.reconnecting = true;
      logger.info('[REDIS_CLUSTER] Reconnecting to Redis...');
    });

    client.on('end', () => {
      this.connected = false;
      logger.info('[REDIS_CLUSTER] Redis connection ended');
    });
  }

  private setupClusterEventHandlers(cluster: Cluster): void {
    cluster.on('connect', () => {
      this.connected = true;
      this.reconnecting = false;
      this.reconnectAttempts = 0;
      logger.info('[REDIS_CLUSTER] Connected to Redis cluster');
    });

    cluster.on('ready', () => {
      this.connected = true;
      logger.info('[REDIS_CLUSTER] Redis cluster ready');
    });

    cluster.on('error', (err) => {
      logger.error('[REDIS_CLUSTER] Redis cluster error', { error: err.message });
    });

    cluster.on('close', () => {
      this.connected = false;
      logger.warn('[REDIS_CLUSTER] Redis cluster connection closed');
    });

    cluster.on('+node', (node) => {
      logger.info('[REDIS_CLUSTER] Node added to cluster', { node: node.options?.host });
    });

    cluster.on('-node', (node) => {
      logger.warn('[REDIS_CLUSTER] Node removed from cluster', { node: node.options?.host });
    });

    cluster.on('node error', (err, node) => {
      logger.error('[REDIS_CLUSTER] Node error', {
        error: err.message,
        node: node?.options?.host,
      });
    });
  }

  private async waitForConnection(timeoutMs = 5000): Promise<void> {
    if (!this.client) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeoutMs);

      // If already connected, resolve immediately
      if (this.client?.status === 'ready') {
        this.connected = true;
        clearTimeout(timeout);
        resolve();
        return;
      }

      this.client?.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client?.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  private fallbackToMemory(): void {
    if (this.currentMode === 'memory') return;
    
    logger.warn('[REDIS_CLUSTER] Falling back to in-memory cache');
    this.currentMode = 'memory';
    this.connected = false;
    
    // Don't close the client - keep trying to reconnect
  }

  private async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallback: () => T
  ): Promise<T> {
    // If in memory mode or not connected, use fallback
    if (this.currentMode === 'memory' || !this.connected || !this.client) {
      return fallback();
    }

    try {
      return await operation();
    } catch (error) {
      logger.warn('[REDIS_CLUSTER] Operation failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Check if we should fallback to memory
      if (this.config.fallbackToMemory) {
        return fallback();
      }
      
      throw error;
    }
  }

  // ============================================
  // Public API
  // ============================================

  async get(key: string): Promise<string | null> {
    return this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        return this.client.get(key);
      },
      () => this.memoryCache.get(key)
    );
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        if (ttl) {
          await this.client.setex(key, ttl, value);
        } else {
          await this.client.set(key, value);
        }
      },
      () => this.memoryCache.set(key, value, ttl)
    );
  }

  async del(key: string): Promise<void> {
    await this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        await this.client.del(key);
      },
      () => this.memoryCache.del(key)
    );
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        return this.client.mget(...keys);
      },
      () => this.memoryCache.mget(keys)
    );
  }

  async keys(pattern: string): Promise<string[]> {
    return this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        return this.client.keys(pattern);
      },
      () => this.memoryCache.keys(pattern)
    );
  }

  async ping(): Promise<string> {
    return this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        return this.client.ping();
      },
      () => 'PONG'
    );
  }

  async ttl(key: string): Promise<number> {
    return this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        return this.client.ttl(key);
      },
      () => this.memoryCache.ttl(key)
    );
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    await this.set(key, value, seconds);
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    return this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        return this.client.incr(key);
      },
      () => this.memoryCache.incr(key)
    );
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        return this.client.expire(key, seconds);
      },
      () => {
        const value = this.memoryCache.get(key);
        if (value) {
          this.memoryCache.set(key, value, seconds);
          return 1;
        }
        return 0;
      }
    );
  }

  async exists(key: string): Promise<number> {
    return this.executeWithFallback(
      async () => {
        if (!this.client) throw new Error('Client not initialized');
        return this.client.exists(key);
      },
      () => this.memoryCache.exists(key)
    );
  }

  isConnected(): boolean {
    return this.connected && this.currentMode !== 'memory';
  }

  getMode(): RedisMode | 'memory' {
    return this.currentMode;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.connected = false;
      logger.info('[REDIS_CLUSTER] Connection closed');
    }
    this.memoryCache.clear();
  }

  /**
   * Attempt to reconnect to Redis
   * Called when Redis becomes available again
   */
  async reconnect(): Promise<boolean> {
    if (this.connected) return true;
    
    logger.info('[REDIS_CLUSTER] Attempting to reconnect...');
    
    try {
      if (this.config.mode === 'cluster' && this.config.nodes) {
        await this.initializeCluster();
      } else if (this.config.url) {
        await this.initializeSingle();
      }
      
      return this.connected;
    } catch (error) {
      logger.error('[REDIS_CLUSTER] Reconnection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let clusterClient: RedisClusterClientImpl | null = null;

/**
 * Get the default Redis cluster configuration from environment
 */
export function getRedisClusterConfig(): RedisClusterConfig {
  const clusterUrls = process.env.REDIS_CLUSTER_URLS;
  const singleUrl = process.env.REDIS_URL;
  
  // Determine mode based on environment variables
  const mode: RedisMode = clusterUrls ? 'cluster' : 'single';
  
  return {
    mode,
    nodes: clusterUrls ? clusterUrls.split(',').map(url => url.trim()) : undefined,
    url: singleUrl,
    fallbackToMemory: process.env.REDIS_FALLBACK_TO_MEMORY !== 'false',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY_MS || '200', 10),
    connectionTimeoutMs: parseInt(process.env.REDIS_CONNECTION_TIMEOUT_MS || '5000', 10),
    commandTimeoutMs: parseInt(process.env.REDIS_COMMAND_TIMEOUT_MS || '5000', 10),
  };
}

/**
 * Get or create the Redis cluster client singleton
 * 
 * @returns RedisClusterClient instance
 * 
 * @example
 * ```ts
 * const redis = await getRedisClusterClient();
 * await redis.set('key', 'value', 300);
 * const value = await redis.get('key');
 * ```
 */
export async function getRedisClusterClient(): Promise<RedisClusterClient> {
  if (clusterClient) {
    return clusterClient;
  }

  const config = getRedisClusterConfig();
  clusterClient = new RedisClusterClientImpl(config);
  await clusterClient.initialize();
  
  return clusterClient;
}

/**
 * Get the Redis cluster client synchronously (may not be initialized)
 * Use this only when you're sure the client has been initialized
 */
export function getRedisClusterClientSync(): RedisClusterClient | null {
  return clusterClient;
}

/**
 * Check if Redis cluster is connected
 */
export function isRedisClusterConnected(): boolean {
  return clusterClient?.isConnected() ?? false;
}

/**
 * Get current Redis mode
 */
export function getRedisClusterMode(): RedisMode | 'memory' | null {
  return clusterClient?.getMode() ?? null;
}

/**
 * Close Redis cluster connection
 */
export async function closeRedisClusterConnection(): Promise<void> {
  if (clusterClient) {
    await clusterClient.close();
    clusterClient = null;
  }
}

/**
 * Test Redis cluster connection
 */
export async function testRedisClusterConnection(): Promise<boolean> {
  if (!clusterClient) {
    return false;
  }

  try {
    const pong = await clusterClient.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('[REDIS_CLUSTER] Ping failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// Export for testing
export { RedisClusterClientImpl, InMemoryCache };
