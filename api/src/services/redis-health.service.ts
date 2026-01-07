/**
 * Redis Health Service
 *
 * Provides centralized Redis health monitoring and degraded mode handling.
 * When Redis is unavailable, the system operates in degraded mode with
 * in-memory fallbacks and appropriate logging.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.6**
 */

import { getRedisClient, isRedisConnected, testRedisConnection } from '../config/redis';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface RedisHealthStatus {
  /** Whether Redis is connected */
  connected: boolean;
  /** Whether the system is in degraded mode */
  degradedMode: boolean;
  /** Last successful connection time */
  lastConnectedAt: Date | null;
  /** Last error message */
  lastError: string | null;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Latency of last ping in ms */
  latencyMs: number | null;
}

export interface DegradedModeConfig {
  /** Whether to log warnings when entering degraded mode */
  logWarnings: boolean;
  /** Interval to check Redis health in ms */
  healthCheckInterval: number;
  /** Number of failures before entering degraded mode */
  failureThreshold: number;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_CONFIG: DegradedModeConfig = {
  logWarnings: true,
  healthCheckInterval: 30000, // 30 seconds
  failureThreshold: 3,
};

// ============================================
// STATE
// ============================================

let healthStatus: RedisHealthStatus = {
  connected: false,
  degradedMode: false,
  lastConnectedAt: null,
  lastError: null,
  consecutiveFailures: 0,
  latencyMs: null,
};

let healthCheckInterval: NodeJS.Timeout | null = null;
let config: DegradedModeConfig = { ...DEFAULT_CONFIG };
let degradedModeCallbacks: Array<(isDegraded: boolean) => void> = [];

// ============================================
// HEALTH CHECK FUNCTIONS
// ============================================

/**
 * Check Redis health and update status
 *
 * @returns Current health status
 */
export async function checkRedisHealth(): Promise<RedisHealthStatus> {
  const redis = getRedisClient();

  if (!redis) {
    // Redis not configured
    healthStatus = {
      connected: false,
      degradedMode: true,
      lastConnectedAt: healthStatus.lastConnectedAt,
      lastError: 'Redis not configured',
      consecutiveFailures: healthStatus.consecutiveFailures + 1,
      latencyMs: null,
    };
    return healthStatus;
  }

  try {
    const start = Date.now();
    const isConnected = await testRedisConnection();
    const latency = Date.now() - start;

    if (isConnected) {
      const wasInDegraded = healthStatus.degradedMode;
      
      healthStatus = {
        connected: true,
        degradedMode: false,
        lastConnectedAt: new Date(),
        lastError: null,
        consecutiveFailures: 0,
        latencyMs: latency,
      };

      // Notify if recovering from degraded mode
      if (wasInDegraded) {
        logger.info('Redis connection restored, exiting degraded mode', {
          latencyMs: latency,
        });
        notifyDegradedModeChange(false);
      }
    } else {
      handleConnectionFailure('Connection test failed');
    }
  } catch (error) {
    handleConnectionFailure(error instanceof Error ? error.message : 'Unknown error');
  }

  return healthStatus;
}

/**
 * Handle Redis connection failure
 */
function handleConnectionFailure(errorMessage: string): void {
  const wasConnected = healthStatus.connected;
  
  healthStatus.connected = false;
  healthStatus.lastError = errorMessage;
  healthStatus.consecutiveFailures++;
  healthStatus.latencyMs = null;

  // Enter degraded mode after threshold failures
  if (healthStatus.consecutiveFailures >= config.failureThreshold && !healthStatus.degradedMode) {
    healthStatus.degradedMode = true;
    
    if (config.logWarnings) {
      logger.warn('Entering degraded mode due to Redis unavailability', {
        consecutiveFailures: healthStatus.consecutiveFailures,
        lastError: errorMessage,
        lastConnectedAt: healthStatus.lastConnectedAt?.toISOString(),
      });
    }
    
    notifyDegradedModeChange(true);
  }

  // Log connection loss
  if (wasConnected && config.logWarnings) {
    logger.error('Redis connection lost', {
      error: errorMessage,
      consecutiveFailures: healthStatus.consecutiveFailures,
    });
  }
}

/**
 * Notify callbacks of degraded mode change
 */
function notifyDegradedModeChange(isDegraded: boolean): void {
  for (const callback of degradedModeCallbacks) {
    try {
      callback(isDegraded);
    } catch (error) {
      logger.error('Error in degraded mode callback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get current Redis health status
 */
export function getRedisHealthStatus(): RedisHealthStatus {
  return { ...healthStatus };
}

/**
 * Check if system is in degraded mode
 *
 * @returns true if Redis is unavailable and system is operating with fallbacks
 */
export function isInDegradedMode(): boolean {
  return healthStatus.degradedMode;
}

/**
 * Check if Redis is available
 *
 * @returns true if Redis is connected and healthy
 */
export function isRedisAvailable(): boolean {
  return healthStatus.connected && isRedisConnected();
}

/**
 * Start periodic health checks
 *
 * @param customConfig - Optional custom configuration
 */
export function startHealthChecks(customConfig?: Partial<DegradedModeConfig>): void {
  if (healthCheckInterval) {
    return; // Already running
  }

  config = { ...DEFAULT_CONFIG, ...customConfig };

  // Initial check
  checkRedisHealth();

  // Start periodic checks
  healthCheckInterval = setInterval(() => {
    checkRedisHealth();
  }, config.healthCheckInterval);

  logger.info('Redis health checks started', {
    interval: config.healthCheckInterval,
    failureThreshold: config.failureThreshold,
  });
}

/**
 * Stop periodic health checks
 */
export function stopHealthChecks(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Redis health checks stopped');
  }
}

/**
 * Register a callback for degraded mode changes
 *
 * @param callback - Function to call when degraded mode changes
 * @returns Unsubscribe function
 */
export function onDegradedModeChange(callback: (isDegraded: boolean) => void): () => void {
  degradedModeCallbacks.push(callback);
  
  return () => {
    const index = degradedModeCallbacks.indexOf(callback);
    if (index > -1) {
      degradedModeCallbacks.splice(index, 1);
    }
  };
}

/**
 * Execute a function with Redis fallback
 *
 * If Redis is unavailable, executes the fallback function instead.
 * Logs a warning when using fallback.
 *
 * @param redisOperation - Function that uses Redis
 * @param fallbackOperation - Function to use when Redis is unavailable
 * @param operationName - Name for logging
 * @returns Result from either operation
 *
 * @example
 * ```ts
 * const result = await withRedisFallback(
 *   async () => redis.get('key'),
 *   async () => inMemoryCache.get('key'),
 *   'cache-get'
 * );
 * ```
 */
export async function withRedisFallback<T>(
  redisOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>,
  operationName: string
): Promise<T> {
  if (!isRedisAvailable()) {
    if (config.logWarnings) {
      logger.debug('Using fallback for Redis operation', {
        operation: operationName,
        degradedMode: healthStatus.degradedMode,
      });
    }
    return fallbackOperation();
  }

  try {
    return await redisOperation();
  } catch (error) {
    logger.warn('Redis operation failed, using fallback', {
      operation: operationName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Update health status
    handleConnectionFailure(error instanceof Error ? error.message : 'Unknown error');
    
    return fallbackOperation();
  }
}

/**
 * Execute a function only if Redis is available
 *
 * If Redis is unavailable, returns the default value without executing.
 *
 * @param operation - Function that requires Redis
 * @param defaultValue - Value to return if Redis is unavailable
 * @param operationName - Name for logging
 * @returns Result or default value
 */
export async function withRedisOrDefault<T>(
  operation: () => Promise<T>,
  defaultValue: T,
  operationName: string
): Promise<T> {
  if (!isRedisAvailable()) {
    if (config.logWarnings) {
      logger.debug('Skipping Redis operation, returning default', {
        operation: operationName,
      });
    }
    return defaultValue;
  }

  try {
    return await operation();
  } catch (error) {
    logger.warn('Redis operation failed, returning default', {
      operation: operationName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return defaultValue;
  }
}

/**
 * Reset health status (for testing)
 */
export function resetHealthStatus(): void {
  healthStatus = {
    connected: false,
    degradedMode: false,
    lastConnectedAt: null,
    lastError: null,
    consecutiveFailures: 0,
    latencyMs: null,
  };
  degradedModeCallbacks = [];
  stopHealthChecks();
}
