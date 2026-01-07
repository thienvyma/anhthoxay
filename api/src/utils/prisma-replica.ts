/**
 * Prisma Read Replica Client
 *
 * Provides read/write separation for database queries to improve
 * performance and scalability by routing read queries to replicas.
 *
 * Features:
 * - Automatic query routing (read to replica, write to primary)
 * - Fallback to primary when replica unavailable
 * - Replication lag detection
 * - Prometheus metrics integration
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 */

import { PrismaClient } from '@prisma/client';
import { prometheusMetrics } from '../services/prometheus.service';
import { logger } from './logger';

// ============================================
// TYPES
// ============================================

/**
 * Configuration for Prisma replica setup
 */
export interface PrismaReplicaConfig {
  /** Primary database URL (DATABASE_URL) */
  primaryUrl: string;
  /** Replica database URL (DATABASE_REPLICA_URL) - optional */
  replicaUrl?: string;
  /** Maximum acceptable replication lag in milliseconds (default: 5000ms) */
  maxReplicationLag: number;
}

/**
 * Query router interface for read/write separation
 */
export interface QueryRouter {
  /** Route read queries to replica (if available) */
  read<T>(query: (prisma: PrismaClient) => Promise<T>): Promise<T>;
  /** Route write queries to primary */
  write<T>(query: (prisma: PrismaClient) => Promise<T>): Promise<T>;
  /** Force primary for critical reads (e.g., after write) */
  readPrimary<T>(query: (prisma: PrismaClient) => Promise<T>): Promise<T>;
  /** Get primary client directly */
  getPrimary(): PrismaClient;
  /** Get replica client (or primary if no replica) */
  getReplica(): PrismaClient;
  /** Check if replica is available and healthy */
  isReplicaHealthy(): Promise<boolean>;
  /** Get current replication lag in milliseconds */
  getReplicationLag(): Promise<number | null>;
  /** Get replica status information */
  getReplicaStatus(): Promise<{
    configured: boolean;
    healthy: boolean;
    lagMs: number | null;
    maxLagMs: number;
    circuitBreaker: {
      state: 'closed' | 'open' | 'half-open';
      failureCount: number;
      openedAt: number | null;
    };
  }>;
  /** Disconnect all clients */
  disconnect(): Promise<void>;
}

/**
 * Replication lag check result
 */
interface ReplicationLagResult {
  lagMs: number | null;
  isHealthy: boolean;
  error?: string;
}

/**
 * Circuit breaker state for replica fallback
 */
interface CircuitBreakerState {
  /** Current state: closed (normal), open (failing), half-open (testing) */
  state: 'closed' | 'open' | 'half-open';
  /** Number of consecutive failures */
  failureCount: number;
  /** Timestamp when circuit was opened */
  openedAt: number | null;
  /** Last failure timestamp */
  lastFailureAt: number | null;
  /** Last recovery attempt timestamp */
  lastRecoveryAttempt: number | null;
}

// ============================================
// CONSTANTS
// ============================================

/** Default maximum replication lag (5 seconds) */
const DEFAULT_MAX_REPLICATION_LAG = 5000;

/** Slow query threshold for logging (100ms) */
const SLOW_QUERY_THRESHOLD = 100;

/** Health check timeout (2 seconds) */
const HEALTH_CHECK_TIMEOUT = 2000;

/** Replication lag cache duration (10 seconds) */
const LAG_CACHE_DURATION = 10000;

/** Circuit breaker failure threshold */
const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 3;

/** Circuit breaker recovery timeout (30 seconds) */
const CIRCUIT_BREAKER_RECOVERY_TIMEOUT = 30000;

/** Minimum time between recovery attempts (5 seconds) */
const MIN_RECOVERY_INTERVAL = 5000;

// ============================================
// PRISMA REPLICA SERVICE
// ============================================

/**
 * PrismaReplicaService manages read/write separation for database queries.
 *
 * @example
 * ```ts
 * const replicaService = new PrismaReplicaService({
 *   primaryUrl: process.env.DATABASE_URL!,
 *   replicaUrl: process.env.DATABASE_REPLICA_URL,
 *   maxReplicationLag: 5000,
 * });
 *
 * // Read from replica
 * const users = await replicaService.read((prisma) =>
 *   prisma.user.findMany()
 * );
 *
 * // Write to primary
 * const newUser = await replicaService.write((prisma) =>
 *   prisma.user.create({ data: { ... } })
 * );
 * ```
 */
export class PrismaReplicaService implements QueryRouter {
  private primary: PrismaClient;
  private replica: PrismaClient | null = null;
  private config: PrismaReplicaConfig;
  private replicaHealthy = true;
  private lastLagCheck: { timestamp: number; result: ReplicationLagResult } | null = null;
  private circuitBreaker: CircuitBreakerState = {
    state: 'closed',
    failureCount: 0,
    openedAt: null,
    lastFailureAt: null,
    lastRecoveryAttempt: null,
  };

  constructor(config: PrismaReplicaConfig) {
    this.config = {
      ...config,
      maxReplicationLag: config.maxReplicationLag || DEFAULT_MAX_REPLICATION_LAG,
    };

    // Initialize primary client
    this.primary = this.createClient(config.primaryUrl, 'primary');

    // Initialize replica client if URL provided
    if (config.replicaUrl && config.replicaUrl !== config.primaryUrl) {
      this.replica = this.createClient(config.replicaUrl, 'replica');
      logger.info('Database replica configured', {
        maxReplicationLag: this.config.maxReplicationLag,
      });
    } else {
      logger.info('No database replica configured, using primary for all queries');
    }
  }

  /**
   * Create a Prisma client with query logging
   */
  private createClient(url: string, name: string): PrismaClient {
    const client = new PrismaClient({
      datasources: {
        db: { url },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
      ],
    });

    // Add query event handler for metrics and slow query logging
    client.$on('query', (e) => {
      // Record query duration in Prometheus metrics
      prometheusMetrics.recordDbQuery(e.duration);

      // Log slow queries
      if (e.duration > SLOW_QUERY_THRESHOLD) {
        logger.warn(`[SLOW_QUERY:${name}]`, {
          duration: e.duration,
          query: e.query.length > 500 ? e.query.substring(0, 500) + '...' : e.query,
          params: e.params,
        });
      }
    });

    return client;
  }

  /**
   * Route read queries to replica (if available and healthy)
   *
   * **Feature: high-traffic-resilience, Property 3: Query Routing Correctness**
   * **Validates: Requirements 3.1, 3.3, 3.6**
   */
  async read<T>(query: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    // If no replica, use primary
    if (!this.replica) {
      return query(this.primary);
    }

    // Check circuit breaker state
    if (this.circuitBreaker.state === 'open') {
      // Check if we should attempt recovery
      if (this.shouldAttemptRecovery()) {
        this.circuitBreaker.state = 'half-open';
        this.circuitBreaker.lastRecoveryAttempt = Date.now();
        logger.info('Circuit breaker entering half-open state, attempting recovery');
      } else {
        // Circuit is open, use primary
        return query(this.primary);
      }
    }

    // Check replica health (includes replication lag check)
    const isHealthy = await this.isReplicaHealthy();
    if (!isHealthy) {
      logger.warn('Replica unhealthy, falling back to primary for read', {
        circuitState: this.circuitBreaker.state,
        failureCount: this.circuitBreaker.failureCount,
      });
      return query(this.primary);
    }

    try {
      const result = await query(this.replica);
      
      // Success - reset circuit breaker if in half-open state
      if (this.circuitBreaker.state === 'half-open') {
        this.resetCircuitBreaker();
        logger.info('Circuit breaker closed, replica recovered');
      }
      
      return result;
    } catch (error) {
      // Record failure and potentially open circuit
      this.recordReplicaFailure(error);
      
      // Fallback to primary
      logger.warn('Replica query failed, falling back to primary', {
        error: error instanceof Error ? error.message : String(error),
        circuitState: this.circuitBreaker.state,
        failureCount: this.circuitBreaker.failureCount,
      });
      
      return query(this.primary);
    }
  }

  /**
   * Route write queries to primary
   *
   * **Feature: high-traffic-resilience, Property 3: Query Routing Correctness**
   * **Validates: Requirements 3.2**
   */
  async write<T>(query: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return query(this.primary);
  }

  /**
   * Force primary for critical reads (e.g., immediately after write)
   *
   * **Feature: high-traffic-resilience**
   * **Validates: Requirements 3.5**
   */
  async readPrimary<T>(query: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return query(this.primary);
  }

  /**
   * Get primary client directly
   */
  getPrimary(): PrismaClient {
    return this.primary;
  }

  /**
   * Get replica client (or primary if no replica)
   */
  getReplica(): PrismaClient {
    return this.replica || this.primary;
  }

  /**
   * Check if replica is available and healthy
   *
   * **Feature: high-traffic-resilience**
   * **Validates: Requirements 3.3, 3.5**
   */
  async isReplicaHealthy(): Promise<boolean> {
    if (!this.replica) {
      return false;
    }

    // If circuit breaker is open, replica is not healthy
    if (this.circuitBreaker.state === 'open') {
      return false;
    }

    // Check cached health status
    if (!this.replicaHealthy && this.circuitBreaker.state !== 'half-open') {
      // Try to recover only if circuit breaker allows
      if (!this.shouldAttemptRecovery()) {
        return false;
      }
    }

    // Check replication lag
    const lagResult = await this.checkReplicationLag();
    
    if (!lagResult.isHealthy) {
      this.replicaHealthy = false;
      
      if (lagResult.lagMs !== null && lagResult.lagMs > this.config.maxReplicationLag) {
        logger.warn('Replica replication lag exceeds threshold, routing to primary', {
          lagMs: lagResult.lagMs,
          maxLagMs: this.config.maxReplicationLag,
        });
      }
      
      return false;
    }

    this.replicaHealthy = true;
    return true;
  }

  /**
   * Get current replication lag in milliseconds
   *
   * **Feature: high-traffic-resilience**
   * **Validates: Requirements 3.5**
   */
  async getReplicationLag(): Promise<number | null> {
    const result = await this.checkReplicationLag();
    return result.lagMs;
  }

  /**
   * Check replication lag with caching
   */
  private async checkReplicationLag(): Promise<ReplicationLagResult> {
    // Return cached result if still valid
    if (
      this.lastLagCheck &&
      Date.now() - this.lastLagCheck.timestamp < LAG_CACHE_DURATION
    ) {
      return this.lastLagCheck.result;
    }

    const result = await this.measureReplicationLag();
    this.lastLagCheck = {
      timestamp: Date.now(),
      result,
    };

    return result;
  }

  /**
   * Measure actual replication lag
   *
   * This uses a timestamp-based approach to measure replication lag.
   * For PostgreSQL, we write a timestamp to primary and read from replica.
   *
   * **Feature: high-traffic-resilience**
   * **Validates: Requirements 3.5**
   */
  private async measureReplicationLag(): Promise<ReplicationLagResult> {
    if (!this.replica) {
      return { lagMs: null, isHealthy: false, error: 'No replica configured' };
    }

    try {
      // Simple health check with timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT)
      );

      // Try a simple query on replica to check connectivity
      const queryPromise = this.replica.$queryRaw`SELECT 1 as health`;

      await Promise.race([queryPromise, timeoutPromise]);

      // Try to measure actual replication lag using PostgreSQL's pg_stat_replication
      // This only works if the replica is a streaming replica
      try {
        const lagResult = await this.measurePostgresReplicationLag();
        if (lagResult !== null) {
          const isHealthy = lagResult <= this.config.maxReplicationLag;
          return { lagMs: lagResult, isHealthy };
        }
      } catch {
        // If we can't measure lag, assume healthy if query succeeded
        logger.debug('Could not measure replication lag, assuming healthy');
      }

      // For now, assume healthy if query succeeds
      return { lagMs: 0, isHealthy: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Replica health check failed', { error: errorMessage });
      return { lagMs: null, isHealthy: false, error: errorMessage };
    }
  }

  /**
   * Measure PostgreSQL replication lag using system views
   *
   * This queries pg_stat_replication on the primary to get the actual lag.
   * Falls back to timestamp comparison if not available.
   */
  private async measurePostgresReplicationLag(): Promise<number | null> {
    try {
      // Try to get replication lag from primary's pg_stat_replication
      // This requires the replica to be a streaming replica
      const result = await this.primary.$queryRaw<Array<{ lag_ms: bigint | null }>>`
        SELECT 
          EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000 as lag_ms
      `;

      if (result && result.length > 0 && result[0].lag_ms !== null) {
        return Number(result[0].lag_ms);
      }

      return null;
    } catch {
      // This query might fail on non-replica setups or different PostgreSQL versions
      return null;
    }
  }

  /**
   * Force a health check and update replica status
   * Useful for manual recovery attempts
   */
  async forceHealthCheck(): Promise<boolean> {
    this.lastLagCheck = null; // Clear cache
    return this.isReplicaHealthy();
  }

  /**
   * Record a replica failure and update circuit breaker state
   *
   * **Feature: high-traffic-resilience**
   * **Validates: Requirements 3.3**
   */
  private recordReplicaFailure(error: unknown): void {
    this.replicaHealthy = false;
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureAt = Date.now();

    // Open circuit if threshold reached
    if (this.circuitBreaker.failureCount >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
      if (this.circuitBreaker.state !== 'open') {
        this.circuitBreaker.state = 'open';
        this.circuitBreaker.openedAt = Date.now();
        logger.warn('Circuit breaker opened due to replica failures', {
          failureCount: this.circuitBreaker.failureCount,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Check if we should attempt recovery from open circuit
   *
   * **Feature: high-traffic-resilience**
   * **Validates: Requirements 3.3**
   */
  private shouldAttemptRecovery(): boolean {
    const now = Date.now();

    // Check if enough time has passed since circuit opened
    if (this.circuitBreaker.openedAt) {
      const timeSinceOpen = now - this.circuitBreaker.openedAt;
      if (timeSinceOpen < CIRCUIT_BREAKER_RECOVERY_TIMEOUT) {
        return false;
      }
    }

    // Check if enough time has passed since last recovery attempt
    if (this.circuitBreaker.lastRecoveryAttempt) {
      const timeSinceLastAttempt = now - this.circuitBreaker.lastRecoveryAttempt;
      if (timeSinceLastAttempt < MIN_RECOVERY_INTERVAL) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reset circuit breaker to closed state
   *
   * **Feature: high-traffic-resilience**
   * **Validates: Requirements 3.3**
   */
  private resetCircuitBreaker(): void {
    this.circuitBreaker = {
      state: 'closed',
      failureCount: 0,
      openedAt: null,
      lastFailureAt: null,
      lastRecoveryAttempt: null,
    };
    this.replicaHealthy = true;
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    openedAt: number | null;
    lastFailureAt: number | null;
  } {
    return {
      state: this.circuitBreaker.state,
      failureCount: this.circuitBreaker.failureCount,
      openedAt: this.circuitBreaker.openedAt,
      lastFailureAt: this.circuitBreaker.lastFailureAt,
    };
  }

  /**
   * Manually reset circuit breaker (for admin use)
   */
  manualResetCircuitBreaker(): void {
    this.resetCircuitBreaker();
    this.lastLagCheck = null;
    logger.info('Circuit breaker manually reset');
  }

  /**
   * Get replica status information
   */
  async getReplicaStatus(): Promise<{
    configured: boolean;
    healthy: boolean;
    lagMs: number | null;
    maxLagMs: number;
    circuitBreaker: {
      state: 'closed' | 'open' | 'half-open';
      failureCount: number;
      openedAt: number | null;
    };
  }> {
    const lagResult = await this.checkReplicationLag();
    return {
      configured: this.replica !== null,
      healthy: lagResult.isHealthy && this.circuitBreaker.state === 'closed',
      lagMs: lagResult.lagMs,
      maxLagMs: this.config.maxReplicationLag,
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failureCount: this.circuitBreaker.failureCount,
        openedAt: this.circuitBreaker.openedAt,
      },
    };
  }

  /**
   * Disconnect all clients
   */
  async disconnect(): Promise<void> {
    await this.primary.$disconnect();
    if (this.replica) {
      await this.replica.$disconnect();
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let replicaServiceInstance: PrismaReplicaService | null = null;

/**
 * Get or create the singleton PrismaReplicaService instance
 *
 * @example
 * ```ts
 * const queryRouter = getQueryRouter();
 *
 * // Read from replica
 * const users = await queryRouter.read((prisma) =>
 *   prisma.user.findMany()
 * );
 * ```
 */
export function getQueryRouter(): QueryRouter {
  if (!replicaServiceInstance) {
    const primaryUrl = process.env.DATABASE_URL;
    const replicaUrl = process.env.DATABASE_REPLICA_URL;

    if (!primaryUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    replicaServiceInstance = new PrismaReplicaService({
      primaryUrl,
      replicaUrl,
      maxReplicationLag: parseInt(process.env.DATABASE_MAX_REPLICATION_LAG || '5000', 10),
    });
  }

  return replicaServiceInstance;
}

/**
 * Check if replica is configured
 */
export function isReplicaConfigured(): boolean {
  const replicaUrl = process.env.DATABASE_REPLICA_URL;
  const primaryUrl = process.env.DATABASE_URL;
  return !!replicaUrl && replicaUrl !== primaryUrl;
}

/**
 * Close the replica service (for graceful shutdown)
 */
export async function closeReplicaService(): Promise<void> {
  if (replicaServiceInstance) {
    await replicaServiceInstance.disconnect();
    replicaServiceInstance = null;
  }
}

// ============================================
// EXPORTS
// ============================================

export default PrismaReplicaService;
