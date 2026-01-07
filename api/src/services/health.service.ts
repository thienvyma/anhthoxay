/**
 * Health Check Service
 *
 * Provides comprehensive health monitoring for load balancers and orchestrators.
 * Implements liveness and readiness probes with dependency health checks.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 4.1, 4.2, 4.3, 4.4, 4.6**
 */

import { PrismaClient } from '@prisma/client';
import { testRedisConnection, isRedisConnected } from '../config/redis';
import { getClusterConfig, getInstanceMetadata } from '../config/cluster';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface HealthCheck {
  /** Status of the dependency */
  status: 'up' | 'down' | 'degraded';
  /** Latency in milliseconds */
  latencyMs?: number;
  /** Error message if any */
  message?: string;
}

export interface HealthStatus {
  /** Overall status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Individual dependency checks */
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
  };
  /** Uptime in seconds */
  uptime: number;
  /** API version */
  version: string;
  /** Instance metadata */
  instance: {
    id: string;
    hostname: string;
    pid: number;
  };
  /** Timestamp */
  timestamp: string;
}

export interface LivenessStatus {
  /** Status */
  status: 'alive' | 'dead';
  /** Timestamp */
  timestamp: string;
  /** Uptime in seconds */
  uptime: number;
  /** Process ID */
  pid: number;
  /** Memory usage */
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

export interface ReadinessStatus {
  /** Status */
  status: 'ready' | 'not_ready';
  /** Timestamp */
  timestamp: string;
  /** Reason if not ready */
  reason?: string;
  /** Individual checks */
  checks?: {
    database: boolean;
    redis: boolean;
    shuttingDown: boolean;
  };
}

// ============================================
// CONSTANTS
// ============================================

/** Database query timeout (ms) */
const DB_CHECK_TIMEOUT = 50;

/** Redis check timeout (ms) */
const REDIS_CHECK_TIMEOUT = 50;

// ============================================
// STATE
// ============================================

let isShuttingDown = false;
const startTime = Date.now();

// ============================================
// SHUTDOWN STATE MANAGEMENT
// ============================================

/**
 * Set shutdown state
 *
 * When shutdown is initiated, health checks will return 503
 * to stop load balancer from routing new traffic.
 *
 * @param shuttingDown - Whether shutdown is in progress
 */
export function setShutdownState(shuttingDown: boolean): void {
  isShuttingDown = shuttingDown;
  if (shuttingDown) {
    logger.info('Health service: Shutdown state activated, will return 503 on readiness checks');
  }
}

/**
 * Check if shutdown is in progress
 *
 * @returns true if shutdown has been initiated
 */
export function isShutdownInProgress(): boolean {
  return isShuttingDown;
}

// ============================================
// HEALTH CHECK FUNCTIONS
// ============================================

/**
 * Check database health with timeout
 *
 * @param prisma - Prisma client instance
 * @returns Health check result
 */
async function checkDatabaseHealth(prisma: PrismaClient): Promise<HealthCheck> {
  const start = Date.now();

  try {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database check timeout')), DB_CHECK_TIMEOUT);
    });

    // Race between query and timeout
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);

    const latency = Date.now() - start;
    return {
      status: 'up',
      latencyMs: latency,
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'down',
      latencyMs: latency,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis health with timeout
 *
 * @returns Health check result
 */
async function checkRedisHealth(): Promise<HealthCheck> {
  const start = Date.now();

  // If Redis is not configured, return degraded (not down)
  if (!isRedisConnected()) {
    return {
      status: 'degraded',
      message: 'Redis not configured or not connected',
    };
  }

  try {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Redis check timeout')), REDIS_CHECK_TIMEOUT);
    });

    // Race between connection test and timeout
    const isConnected = await Promise.race([testRedisConnection(), timeoutPromise]);

    const latency = Date.now() - start;

    if (isConnected) {
      return {
        status: 'up',
        latencyMs: latency,
      };
    } else {
      return {
        status: 'degraded',
        latencyMs: latency,
        message: 'Redis connection test failed',
      };
    }
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'degraded',
      latencyMs: latency,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Perform comprehensive health check
 *
 * Checks all dependencies and returns overall status.
 * Response time should be under 100ms.
 *
 * @param prisma - Prisma client instance
 * @returns Health status
 */
export async function getHealthStatus(prisma: PrismaClient): Promise<HealthStatus> {
  const config = getClusterConfig();
  const metadata = getInstanceMetadata();

  // Run checks in parallel for speed
  const [dbCheck, redisCheck] = await Promise.all([
    checkDatabaseHealth(prisma),
    checkRedisHealth(),
  ]);

  // Determine overall status
  // - unhealthy: database is down
  // - degraded: database up but redis down/degraded
  // - healthy: all services up
  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (dbCheck.status === 'down') {
    status = 'unhealthy';
  } else if (redisCheck.status !== 'up') {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return {
    status,
    checks: {
      database: dbCheck,
      redis: redisCheck,
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    instance: {
      id: config.instanceId,
      hostname: config.hostname,
      pid: metadata.pid as number,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Perform liveness check
 *
 * Simple check that the process is running.
 * Used by orchestrators to determine if container should be restarted.
 *
 * @returns Liveness status
 */
export function getLivenessStatus(): LivenessStatus {
  const memUsage = process.memoryUsage();

  return {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    pid: process.pid,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    },
  };
}

/**
 * Perform readiness check
 *
 * Checks if the service is ready to accept traffic.
 * Returns 503 if:
 * - Shutdown is in progress
 * - Database is not connected
 *
 * Redis being down results in degraded mode, not unready.
 *
 * @param prisma - Prisma client instance
 * @returns Readiness status and HTTP status code
 */
export async function getReadinessStatus(
  prisma: PrismaClient
): Promise<{ status: ReadinessStatus; httpStatus: number }> {
  // Check shutdown state first (fastest check)
  if (isShuttingDown) {
    return {
      status: {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'Shutdown in progress',
        checks: {
          database: false,
          redis: false,
          shuttingDown: true,
        },
      },
      httpStatus: 503,
    };
  }

  // Check database (required for readiness)
  const dbCheck = await checkDatabaseHealth(prisma);

  if (dbCheck.status === 'down') {
    return {
      status: {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: dbCheck.message || 'Database unavailable',
        checks: {
          database: false,
          redis: isRedisConnected(),
          shuttingDown: false,
        },
      },
      httpStatus: 503,
    };
  }

  // Redis is optional - degraded mode is still ready
  const redisUp = isRedisConnected();

  return {
    status: {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: true,
        redis: redisUp,
        shuttingDown: false,
      },
    },
    httpStatus: 200,
  };
}

/**
 * Reset health service state (for testing)
 */
export function resetHealthService(): void {
  isShuttingDown = false;
}
