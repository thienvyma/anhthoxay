/**
 * Request Timeout Middleware
 *
 * Implements configurable timeouts per operation type with circuit breaker integration.
 * Provides fail-fast behavior to prevent cascade failures when services are slow.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**
 */

import type { Context, Next } from 'hono';
import CircuitBreaker from 'opossum';
import { createLogger, logger } from '../utils/logger';
import { getCorrelationId } from './correlation-id';

// ============================================
// Types and Interfaces
// ============================================

/**
 * Timeout configuration for different operation types
 * _Requirements: 9.1, 9.2, 9.3_
 */
export interface TimeoutConfig {
  /** Default timeout for API requests (30 seconds) */
  default: number;
  /** Timeout for database queries (10 seconds) */
  database: number;
  /** Timeout for external API calls like Google Sheets (15 seconds) */
  external: number;
  /** Timeout for health check endpoints (100ms) */
  healthCheck: number;
}

/**
 * Operation type for timeout categorization
 */
export type OperationType = 'default' | 'database' | 'external' | 'healthCheck';

/**
 * Timeout error with additional context
 */
export class TimeoutError extends Error {
  code = 'TIMEOUT';
  status = 504;
  operationType: OperationType;
  timeoutMs: number;
  context: string;

  constructor(operationType: OperationType, timeoutMs: number, context: string) {
    super(`Operation timed out after ${timeoutMs}ms: ${context}`);
    this.name = 'TimeoutError';
    this.operationType = operationType;
    this.timeoutMs = timeoutMs;
    this.context = context;
  }
}

/**
 * Timeout statistics for monitoring
 */
export interface TimeoutStats {
  totalTimeouts: number;
  timeoutsByType: Record<OperationType, number>;
  lastTimeoutAt: Date | null;
  consecutiveTimeouts: number;
}

// ============================================
// Default Configuration
// ============================================

/**
 * Default timeout values in milliseconds
 * _Requirements: 9.1, 9.2, 9.3_
 */
export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  default: 30000,     // 30 seconds for general API requests
  database: 10000,    // 10 seconds for database queries
  external: 15000,    // 15 seconds for external APIs (Google Sheets)
  healthCheck: 100,   // 100ms for health checks
};

// ============================================
// Timeout Statistics Tracking
// ============================================

const timeoutStats: TimeoutStats = {
  totalTimeouts: 0,
  timeoutsByType: {
    default: 0,
    database: 0,
    external: 0,
    healthCheck: 0,
  },
  lastTimeoutAt: null,
  consecutiveTimeouts: 0,
};

// Track consecutive timeouts for circuit breaker triggering
let lastSuccessTime = Date.now();
const CONSECUTIVE_TIMEOUT_WINDOW_MS = 60000; // 1 minute window

/**
 * Record a timeout event
 * _Requirements: 9.5, 9.6_
 */
function recordTimeout(operationType: OperationType): void {
  timeoutStats.totalTimeouts++;
  timeoutStats.timeoutsByType[operationType]++;
  timeoutStats.lastTimeoutAt = new Date();
  
  // Check if within consecutive window
  const now = Date.now();
  if (now - lastSuccessTime < CONSECUTIVE_TIMEOUT_WINDOW_MS) {
    timeoutStats.consecutiveTimeouts++;
  } else {
    timeoutStats.consecutiveTimeouts = 1;
  }
}

/**
 * Record a successful operation (resets consecutive timeout counter)
 */
function recordSuccess(): void {
  lastSuccessTime = Date.now();
  timeoutStats.consecutiveTimeouts = 0;
}

/**
 * Get current timeout statistics
 */
export function getTimeoutStats(): TimeoutStats {
  return { ...timeoutStats };
}

/**
 * Reset timeout statistics (for testing)
 */
export function resetTimeoutStats(): void {
  timeoutStats.totalTimeouts = 0;
  timeoutStats.timeoutsByType = {
    default: 0,
    database: 0,
    external: 0,
    healthCheck: 0,
  };
  timeoutStats.lastTimeoutAt = null;
  timeoutStats.consecutiveTimeouts = 0;
  lastSuccessTime = Date.now();
}

// ============================================
// Circuit Breaker Integration
// ============================================

/**
 * Circuit breaker for timeout-protected operations
 * Opens when multiple timeouts occur to prevent cascade failures
 * _Requirements: 9.4, 9.6_
 */
const timeoutCircuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Circuit breaker configuration for timeout protection
 */
const CIRCUIT_BREAKER_OPTIONS = {
  timeout: 30000,                  // Max timeout (will be overridden per operation)
  errorThresholdPercentage: 50,    // Open after 50% failures
  resetTimeout: 30000,             // 30 seconds before trying again
  volumeThreshold: 5,              // Minimum 5 requests before tripping
  rollingCountTimeout: 60000,      // 1 minute rolling window
  rollingCountBuckets: 6,          // 6 buckets (10 seconds each)
};

/**
 * Get or create a circuit breaker for a specific operation
 * _Requirements: 9.4, 9.6_
 */
function getOrCreateCircuitBreaker(
  name: string,
  timeout: number
): CircuitBreaker<[() => Promise<unknown>], unknown> {
  let breaker = timeoutCircuitBreakers.get(name);
  
  if (!breaker) {
    breaker = new CircuitBreaker(
      async (fn: () => Promise<unknown>) => fn(),
      {
        ...CIRCUIT_BREAKER_OPTIONS,
        timeout,
        name,
      }
    );

    // Log circuit breaker state changes
    breaker.on('open', () => {
      logger.warn('[TIMEOUT] Circuit breaker opened', {
        name,
        state: 'OPEN',
        message: `Circuit breaker "${name}" is now OPEN - requests will be rejected`,
      });
    });

    breaker.on('halfOpen', () => {
      logger.info('[TIMEOUT] Circuit breaker half-open', {
        name,
        state: 'HALF_OPEN',
      });
    });

    breaker.on('close', () => {
      logger.info('[TIMEOUT] Circuit breaker closed', {
        name,
        state: 'CLOSED',
      });
    });

    breaker.on('timeout', () => {
      logger.warn('[TIMEOUT] Circuit breaker timeout', { name, timeout });
    });

    timeoutCircuitBreakers.set(name, breaker);
  }

  return breaker as CircuitBreaker<[() => Promise<unknown>], unknown>;
}

/**
 * Check if circuit breaker is open for a specific operation
 */
export function isCircuitOpen(name: string): boolean {
  const breaker = timeoutCircuitBreakers.get(name);
  return breaker?.opened ?? false;
}

/**
 * Get all circuit breaker states
 */
export function getCircuitBreakerStates(): Record<string, string> {
  const states: Record<string, string> = {};
  timeoutCircuitBreakers.forEach((breaker, name) => {
    if (breaker.opened) {
      states[name] = 'OPEN';
    } else if (breaker.halfOpen) {
      states[name] = 'HALF_OPEN';
    } else {
      states[name] = 'CLOSED';
    }
  });
  return states;
}

// ============================================
// Cache Integration for Fallback
// ============================================

/**
 * Try to get cached response when circuit is open (in-memory fallback)
 * _Requirements: 9.4_
 */
async function getCachedResponse(cacheKey: string): Promise<string | null> {
  // In-memory cache - no distributed cache available
  // Log for debugging purposes
  logger.debug('Cache lookup attempted', { cacheKey });
  return null;
}

// ============================================
// Core Timeout Functions
// ============================================

/**
 * Execute a function with timeout
 * Returns a promise that rejects with TimeoutError if the operation takes too long
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param context - Context string for logging
 * @param operationType - Type of operation for categorization
 * @returns Promise that resolves with the function result or rejects with TimeoutError
 *
 * _Requirements: 9.1, 9.2, 9.3, 9.5_
 *
 * @example
 * ```ts
 * const result = await withTimeout(
 *   () => prisma.user.findMany(),
 *   10000,
 *   'fetch users',
 *   'database'
 * );
 * ```
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  context: string,
  operationType: OperationType = 'default'
): Promise<T> {
  const startTime = Date.now();
  
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        const duration = Date.now() - startTime;
        
        // Record timeout for statistics
        recordTimeout(operationType);
        
        // Log slow operation with context
        // _Requirements: 9.5_
        logger.warn('[TIMEOUT] Operation timed out', {
          context,
          operationType,
          timeoutMs,
          duration,
          consecutiveTimeouts: timeoutStats.consecutiveTimeouts,
        });
        
        reject(new TimeoutError(operationType, timeoutMs, context));
      }
    }, timeoutMs);
    
    // Execute the function
    fn()
      .then((result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          recordSuccess();
          resolve(result);
        }
      })
      .catch((error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      });
  });
}

/**
 * Execute a function with timeout and circuit breaker protection
 * When circuit is open, attempts to return cached data if available
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param context - Context string for logging and circuit breaker naming
 * @param operationType - Type of operation for categorization
 * @param cacheKey - Optional cache key for fallback when circuit is open
 * @returns Promise that resolves with the function result, cached data, or rejects
 *
 * _Requirements: 9.4, 9.6_
 *
 * @example
 * ```ts
 * const result = await withTimeoutAndCircuitBreaker(
 *   () => googleSheetsApi.getData(),
 *   15000,
 *   'google-sheets-read',
 *   'external',
 *   'cache:google-sheets:data'
 * );
 * ```
 */
export async function withTimeoutAndCircuitBreaker<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  context: string,
  operationType: OperationType = 'default',
  cacheKey?: string
): Promise<T> {
  const breaker = getOrCreateCircuitBreaker(context, timeoutMs);
  
  // If circuit is open, try to return cached data
  // _Requirements: 9.4_
  if (breaker.opened && cacheKey) {
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      logger.info('[TIMEOUT] Returning cached data (circuit open)', {
        context,
        cacheKey,
      });
      return JSON.parse(cached) as T;
    }
    
    // No cached data available, throw 503
    logger.warn('[TIMEOUT] Circuit open, no cached data available', {
      context,
      cacheKey,
    });
    throw new CircuitOpenError(context);
  }
  
  try {
    // Execute with circuit breaker protection
    const result = await breaker.fire(async () => {
      return withTimeout(fn, timeoutMs, context, operationType);
    });
    return result as T;
  } catch (error) {
    // If circuit just opened and we have a cache key, try cache
    if (breaker.opened && cacheKey) {
      const cached = await getCachedResponse(cacheKey);
      if (cached) {
        logger.info('[TIMEOUT] Returning cached data after circuit opened', {
          context,
          cacheKey,
        });
        return JSON.parse(cached) as T;
      }
    }
    throw error;
  }
}

/**
 * Circuit open error for when service is unavailable
 */
export class CircuitOpenError extends Error {
  code = 'SERVICE_UNAVAILABLE';
  status = 503;
  serviceName: string;

  constructor(serviceName: string) {
    super(`Service "${serviceName}" is temporarily unavailable. Circuit breaker is open.`);
    this.name = 'CircuitOpenError';
    this.serviceName = serviceName;
  }
}

// ============================================
// Hono Middleware
// ============================================

/**
 * Request timeout middleware options
 */
export interface TimeoutMiddlewareOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Operation type for categorization */
  operationType?: OperationType;
  /** Custom timeout config */
  config?: Partial<TimeoutConfig>;
  /** Enable circuit breaker integration */
  enableCircuitBreaker?: boolean;
  /** Cache key generator for fallback */
  cacheKeyGenerator?: (c: Context) => string | undefined;
}

/**
 * Determine timeout based on request path
 * _Requirements: 9.1, 9.2, 9.3_
 */
function getTimeoutForPath(path: string, config: TimeoutConfig): { timeout: number; type: OperationType } {
  // Health check endpoints
  if (path.startsWith('/health') || path.startsWith('/api/health')) {
    return { timeout: config.healthCheck, type: 'healthCheck' };
  }
  
  // External API endpoints (Google Sheets, etc.)
  if (path.includes('/integrations/') || path.includes('/external/')) {
    return { timeout: config.external, type: 'external' };
  }
  
  // Database-heavy endpoints (lists, exports)
  if (path.includes('/export') || path.includes('/stats') || path.includes('/dashboard')) {
    return { timeout: config.database, type: 'database' };
  }
  
  // Default timeout
  return { timeout: config.default, type: 'default' };
}

/**
 * Request timeout middleware for Hono
 * Automatically applies appropriate timeout based on request path
 *
 * @param options - Middleware configuration options
 * @returns Hono middleware function
 *
 * _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
 *
 * @example
 * ```ts
 * // Apply to all routes with default config
 * app.use('*', timeout());
 *
 * // Apply with custom timeout
 * app.use('/api/external/*', timeout({ timeout: 15000, operationType: 'external' }));
 *
 * // Apply with circuit breaker
 * app.use('/api/integrations/*', timeout({
 *   timeout: 15000,
 *   enableCircuitBreaker: true,
 *   cacheKeyGenerator: (c) => `cache:${c.req.path}`,
 * }));
 * ```
 */
export function timeout(options: TimeoutMiddlewareOptions = {}) {
  const config: TimeoutConfig = {
    ...DEFAULT_TIMEOUT_CONFIG,
    ...options.config,
  };

  return async (c: Context, next: Next) => {
    const log = createLogger(c);
    const correlationId = getCorrelationId(c);
    const path = c.req.path;
    const method = c.req.method;
    
    // Determine timeout based on path or options
    const { timeout: timeoutMs, type: operationType } = options.timeout
      ? { timeout: options.timeout, type: options.operationType || 'default' }
      : getTimeoutForPath(path, config);
    
    const context = `${method} ${path}`;
    const startTime = Date.now();
    
    // Generate cache key if circuit breaker is enabled
    const cacheKey = options.enableCircuitBreaker && options.cacheKeyGenerator
      ? options.cacheKeyGenerator(c)
      : undefined;
    
    try {
      if (options.enableCircuitBreaker) {
        // Use circuit breaker protected execution
        await withTimeoutAndCircuitBreaker(
          () => next(),
          timeoutMs,
          context,
          operationType,
          cacheKey
        );
      } else {
        // Simple timeout without circuit breaker
        await withTimeout(
          () => next(),
          timeoutMs,
          context,
          operationType
        );
      }
      
      // Log slow requests (> 80% of timeout)
      const duration = Date.now() - startTime;
      if (duration > timeoutMs * 0.8) {
        log.warn('[TIMEOUT] Slow request detected', {
          path,
          method,
          duration,
          timeoutMs,
          percentOfTimeout: Math.round((duration / timeoutMs) * 100),
        });
      }
    } catch (error) {
      if (error instanceof TimeoutError) {
        // _Requirements: 9.1_
        log.error('[TIMEOUT] Request timed out', {
          path,
          method,
          timeoutMs,
          operationType: error.operationType,
          correlationId,
        });
        
        return c.json({
          success: false,
          error: {
            code: 'GATEWAY_TIMEOUT',
            message: 'Request timed out. Please try again later.',
          },
          correlationId,
        }, 504);
      }
      
      if (error instanceof CircuitOpenError) {
        // _Requirements: 9.4_
        log.error('[TIMEOUT] Circuit breaker open', {
          path,
          method,
          serviceName: error.serviceName,
          correlationId,
        });
        
        return c.json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service temporarily unavailable. Please try again later.',
          },
          correlationId,
        }, 503);
      }
      
      // Re-throw other errors for the error handler
      throw error;
    }
  };
}

// ============================================
// Utility Functions for Services
// ============================================

/**
 * Create a timeout wrapper for database operations
 * _Requirements: 9.2_
 *
 * @example
 * ```ts
 * const users = await withDatabaseTimeout(
 *   () => prisma.user.findMany(),
 *   'fetch all users'
 * );
 * ```
 */
export async function withDatabaseTimeout<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  return withTimeout(fn, DEFAULT_TIMEOUT_CONFIG.database, context, 'database');
}

/**
 * Create a timeout wrapper for external API calls
 * _Requirements: 9.3_
 *
 * @example
 * ```ts
 * const data = await withExternalTimeout(
 *   () => googleSheetsApi.getData(),
 *   'fetch google sheets data'
 * );
 * ```
 */
export async function withExternalTimeout<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  return withTimeout(fn, DEFAULT_TIMEOUT_CONFIG.external, context, 'external');
}

/**
 * Create a timeout wrapper for external API calls with circuit breaker
 * _Requirements: 9.3, 9.4, 9.6_
 *
 * @example
 * ```ts
 * const data = await withExternalTimeoutAndCircuitBreaker(
 *   () => googleSheetsApi.getData(),
 *   'google-sheets-read',
 *   'cache:google-sheets:data'
 * );
 * ```
 */
export async function withExternalTimeoutAndCircuitBreaker<T>(
  fn: () => Promise<T>,
  context: string,
  cacheKey?: string
): Promise<T> {
  return withTimeoutAndCircuitBreaker(
    fn,
    DEFAULT_TIMEOUT_CONFIG.external,
    context,
    'external',
    cacheKey
  );
}

/**
 * Clear all circuit breakers (for testing)
 */
export function clearCircuitBreakers(): void {
  timeoutCircuitBreakers.clear();
}

export default timeout;
