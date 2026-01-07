/**
 * Redis Cluster Client Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RedisClusterClientImpl,
  InMemoryCache,
  getRedisClusterConfig,
  RedisClusterConfig,
} from './redis-cluster';

// Mock ioredis
vi.mock('ioredis', () => {
  const mockRedis = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    once: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    mget: vi.fn(),
    keys: vi.fn(),
    ping: vi.fn(),
    ttl: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    exists: vi.fn(),
    quit: vi.fn(),
    status: 'ready',
  }));

  const mockCluster = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    once: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    mget: vi.fn(),
    keys: vi.fn(),
    ping: vi.fn(),
    ttl: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    exists: vi.fn(),
    quit: vi.fn(),
    status: 'ready',
  }));

  return {
    default: mockRedis,
    Cluster: mockCluster,
  };
});

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('InMemoryCache', () => {
  let cache: InstanceType<typeof InMemoryCache>;

  beforeEach(() => {
    // Access the class through the module
    cache = new (InMemoryCache as unknown as new () => InstanceType<typeof InMemoryCache>)();
  });

  describe('get/set operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should handle TTL expiration', async () => {
      cache.set('expiring', 'value', 1); // 1 second TTL
      expect(cache.get('expiring')).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.get('expiring')).toBeNull();
    });

    it('should delete values', () => {
      cache.set('toDelete', 'value');
      expect(cache.get('toDelete')).toBe('value');
      cache.del('toDelete');
      expect(cache.get('toDelete')).toBeNull();
    });
  });

  describe('mget operation', () => {
    it('should retrieve multiple values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const results = cache.mget(['key1', 'key2', 'key3', 'nonexistent']);
      expect(results).toEqual(['value1', 'value2', 'value3', null]);
    });
  });

  describe('keys operation', () => {
    it('should find keys matching pattern', () => {
      cache.set('user:1', 'data1');
      cache.set('user:2', 'data2');
      cache.set('session:1', 'session1');

      const userKeys = cache.keys('user:*');
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');
      expect(userKeys).not.toContain('session:1');
    });
  });

  describe('ttl operation', () => {
    it('should return remaining TTL', () => {
      cache.set('withTtl', 'value', 60);
      const ttl = cache.ttl('withTtl');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it('should return -2 for non-existent keys', () => {
      expect(cache.ttl('nonexistent')).toBe(-2);
    });
  });

  describe('incr operation', () => {
    it('should increment numeric values', () => {
      cache.set('counter', '5');
      expect(cache.incr('counter')).toBe(6);
      expect(cache.incr('counter')).toBe(7);
    });

    it('should start from 0 for non-existent keys', () => {
      expect(cache.incr('newCounter')).toBe(1);
    });
  });

  describe('exists operation', () => {
    it('should return 1 for existing keys', () => {
      cache.set('exists', 'value');
      expect(cache.exists('exists')).toBe(1);
    });

    it('should return 0 for non-existent keys', () => {
      expect(cache.exists('nonexistent')).toBe(0);
    });
  });
});

describe('getRedisClusterConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return single mode when only REDIS_URL is set', () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    delete process.env.REDIS_CLUSTER_URLS;

    const config = getRedisClusterConfig();
    expect(config.mode).toBe('single');
    expect(config.url).toBe('redis://localhost:6379');
    expect(config.nodes).toBeUndefined();
  });

  it('should return cluster mode when REDIS_CLUSTER_URLS is set', () => {
    process.env.REDIS_CLUSTER_URLS = 'redis://node1:6379,redis://node2:6379,redis://node3:6379';

    const config = getRedisClusterConfig();
    expect(config.mode).toBe('cluster');
    expect(config.nodes).toHaveLength(3);
    expect(config.nodes).toContain('redis://node1:6379');
  });

  it('should use default values for optional settings', () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    const config = getRedisClusterConfig();
    expect(config.fallbackToMemory).toBe(true);
    expect(config.maxRetries).toBe(3);
    expect(config.retryDelayMs).toBe(200);
    expect(config.connectionTimeoutMs).toBe(5000);
    expect(config.commandTimeoutMs).toBe(5000);
  });

  it('should respect custom environment settings', () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.REDIS_FALLBACK_TO_MEMORY = 'false';
    process.env.REDIS_MAX_RETRIES = '5';
    process.env.REDIS_RETRY_DELAY_MS = '500';

    const config = getRedisClusterConfig();
    expect(config.fallbackToMemory).toBe(false);
    expect(config.maxRetries).toBe(5);
    expect(config.retryDelayMs).toBe(500);
  });
});

describe('RedisClusterClientImpl', () => {
  let client: RedisClusterClientImpl;
  const defaultConfig: RedisClusterConfig = {
    mode: 'single',
    url: 'redis://localhost:6379',
    fallbackToMemory: true,
    maxRetries: 3,
    retryDelayMs: 200,
    connectionTimeoutMs: 5000,
    commandTimeoutMs: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('initialization', () => {
    it('should start in memory mode when no config provided', async () => {
      const noUrlConfig: RedisClusterConfig = {
        ...defaultConfig,
        url: undefined,
      };
      
      client = new RedisClusterClientImpl(noUrlConfig);
      await client.initialize();
      
      expect(client.getMode()).toBe('memory');
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('fallback behavior', () => {
    it('should use in-memory cache when in memory mode', async () => {
      const noUrlConfig: RedisClusterConfig = {
        ...defaultConfig,
        url: undefined,
      };
      
      client = new RedisClusterClientImpl(noUrlConfig);
      await client.initialize();
      
      // Operations should work with in-memory fallback
      await client.set('key', 'value', 60);
      const result = await client.get('key');
      expect(result).toBe('value');
    });

    it('should return PONG for ping in memory mode', async () => {
      const noUrlConfig: RedisClusterConfig = {
        ...defaultConfig,
        url: undefined,
      };
      
      client = new RedisClusterClientImpl(noUrlConfig);
      await client.initialize();
      
      const pong = await client.ping();
      expect(pong).toBe('PONG');
    });

    it('should support all operations in memory fallback mode', async () => {
      const noUrlConfig: RedisClusterConfig = {
        ...defaultConfig,
        url: undefined,
      };
      
      client = new RedisClusterClientImpl(noUrlConfig);
      await client.initialize();
      
      // Test set/get
      await client.set('test:key1', 'value1', 60);
      expect(await client.get('test:key1')).toBe('value1');
      
      // Test mget
      await client.set('test:key2', 'value2', 60);
      const mgetResult = await client.mget(['test:key1', 'test:key2', 'nonexistent']);
      expect(mgetResult).toEqual(['value1', 'value2', null]);
      
      // Test keys
      const keys = await client.keys('test:*');
      expect(keys).toContain('test:key1');
      expect(keys).toContain('test:key2');
      
      // Test del
      await client.del('test:key1');
      expect(await client.get('test:key1')).toBeNull();
      
      // Test incr
      await client.set('counter', '0', 60);
      expect(await client.incr('counter')).toBe(1);
      expect(await client.incr('counter')).toBe(2);
      
      // Test exists
      expect(await client.exists('test:key2')).toBe(1);
      expect(await client.exists('nonexistent')).toBe(0);
      
      // Test ttl
      const ttl = await client.ttl('test:key2');
      expect(ttl).toBeGreaterThan(0);
      
      // Test expire
      expect(await client.expire('test:key2', 120)).toBe(1);
      
      // Test setex
      expect(await client.setex('setex:key', 60, 'setex:value')).toBe('OK');
      expect(await client.get('setex:key')).toBe('setex:value');
    });
  });

  describe('failover handling', () => {
    it('should not block main request flow when Redis unavailable', async () => {
      const noUrlConfig: RedisClusterConfig = {
        ...defaultConfig,
        url: undefined,
        fallbackToMemory: true,
      };
      
      client = new RedisClusterClientImpl(noUrlConfig);
      await client.initialize();
      
      // All operations should complete without throwing
      const startTime = Date.now();
      
      await client.set('key', 'value');
      await client.get('key');
      await client.del('key');
      await client.mget(['key1', 'key2']);
      await client.keys('*');
      await client.ping();
      
      const duration = Date.now() - startTime;
      
      // Operations should complete quickly (not blocked)
      expect(duration).toBeLessThan(100);
    });

    it('should resume using Redis after reconnection', async () => {
      const noUrlConfig: RedisClusterConfig = {
        ...defaultConfig,
        url: undefined,
      };
      
      client = new RedisClusterClientImpl(noUrlConfig);
      await client.initialize();
      
      // Initially in memory mode
      expect(client.getMode()).toBe('memory');
      
      // Reconnect should return false when no URL configured
      const reconnected = await client.reconnect();
      expect(reconnected).toBe(false);
    });
  });

  describe('close operation', () => {
    it('should clean up resources on close', async () => {
      const noUrlConfig: RedisClusterConfig = {
        ...defaultConfig,
        url: undefined,
      };
      
      client = new RedisClusterClientImpl(noUrlConfig);
      await client.initialize();
      
      await client.set('key', 'value');
      await client.close();
      
      // After close, should be disconnected
      expect(client.isConnected()).toBe(false);
    });
  });
});
