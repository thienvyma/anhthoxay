/**
 * Circuit Breaker Utility
 *
 * Implements the circuit breaker pattern to prevent cascading failures
 * when external services are unavailable.
 *
 * **Feature: production-scalability**
 * **Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
 */

import CircuitBreaker from 'opossum';
import { logger } from './logger';

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  /** Timeout in milliseconds for the action (default: 10000) */
  timeout?: number;
  /** Percentage of failures before opening circuit (default: 50) */
  errorThresholdPercentage?: number;
  /** Time in milliseconds to wait before trying again (default: 30000) */
  resetTimeout?: number;
  /** Minimum number of requests before tripping (default: 5) */
  volumeThreshold?: number;
  /** Whether to enable rolling stats (default: true) */
  rollingCountTimeout?: number;
  /** Number of buckets for rolling stats (default: 10) */
  rollingCountBuckets?: number;
}

/**
 * Default circuit breaker options
 * _Requirements: 8.1, 8.2, 8.3_
 */
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  timeout: 10000,                  // 10 seconds
  errorThresholdPercentage: 50,    // Open after 50% failures
  resetTimeout: 30000,             // Try again after 30 seconds
  volumeThreshold: 5,              // Minimum requests before tripping
  rollingCountTimeout: 10000,      // 10 second rolling window
  rollingCountBuckets: 10,         // 10 buckets for stats
};

/**
 * Circuit breaker state type
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker stats interface
 */
export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  fallbacks: number;
  timeouts: number;
  cacheHits: number;
  fires: number;
  rejects: number;
}

/**
 * Registry to track all circuit breakers
 */
const circuitBreakerRegistry = new Map<string, CircuitBreaker>();

/**
 * Create a circuit breaker for an async function
 *
 * @param name - Unique name for the circuit breaker (used for logging)
 * @param fn - The async function to wrap
 * @param options - Circuit breaker configuration options
 * @returns Configured circuit breaker instance
 *
 * _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
 *
 * @example
 * ```ts
 * const breaker = createCircuitBreaker(
 *   'google-sheets',
 *   async (data) => await googleSheetsApi.append(data),
 *   { timeout: 15000, resetTimeout: 30000 }
 * );
 *
 * // Use the breaker
 * const result = await breaker.fire(data);
 * ```
 */
export function createCircuitBreaker<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>,
  options?: CircuitBreakerOptions
): CircuitBreaker<TArgs, TResult> {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    name,
  };

  const breaker = new CircuitBreaker(fn, mergedOptions);

  // Log state changes
  // _Requirements: 8.6_
  breaker.on('open', () => {
    logger.warn('Circuit breaker opened', {
      name,
      state: 'OPEN',
      message: `Circuit breaker "${name}" is now OPEN - requests will be rejected`,
    });
  });

  breaker.on('halfOpen', () => {
    logger.info('Circuit breaker half-open', {
      name,
      state: 'HALF_OPEN',
      message: `Circuit breaker "${name}" is now HALF_OPEN - allowing test request`,
    });
  });

  breaker.on('close', () => {
    logger.info('Circuit breaker closed', {
      name,
      state: 'CLOSED',
      message: `Circuit breaker "${name}" is now CLOSED - normal operation resumed`,
    });
  });

  breaker.on('fallback', (result) => {
    logger.info('Circuit breaker fallback triggered', {
      name,
      fallbackResult: typeof result,
    });
  });

  breaker.on('timeout', () => {
    logger.warn('Circuit breaker timeout', {
      name,
      timeout: mergedOptions.timeout,
    });
  });

  breaker.on('reject', () => {
    logger.warn('Circuit breaker rejected request', {
      name,
      state: 'OPEN',
    });
  });

  breaker.on('success', () => {
    logger.debug('Circuit breaker success', { name });
  });

  breaker.on('failure', (error) => {
    logger.warn('Circuit breaker failure', {
      name,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  // Register the breaker
  circuitBreakerRegistry.set(name, breaker as CircuitBreaker);

  return breaker;
}

/**
 * Get circuit breaker state
 *
 * @param breaker - Circuit breaker instance
 * @returns Current state of the circuit breaker
 */
export function getCircuitState(breaker: CircuitBreaker): CircuitState {
  if (breaker.opened) {
    return 'OPEN';
  }
  if (breaker.halfOpen) {
    return 'HALF_OPEN';
  }
  return 'CLOSED';
}

/**
 * Get circuit breaker statistics
 *
 * @param breaker - Circuit breaker instance
 * @param name - Name of the circuit breaker
 * @returns Statistics about the circuit breaker
 */
export function getCircuitStats(breaker: CircuitBreaker, name: string): CircuitBreakerStats {
  const stats = breaker.stats;
  return {
    name,
    state: getCircuitState(breaker),
    failures: stats.failures,
    successes: stats.successes,
    fallbacks: stats.fallbacks,
    timeouts: stats.timeouts,
    cacheHits: stats.cacheHits,
    fires: stats.fires,
    rejects: stats.rejects,
  };
}

/**
 * Get all registered circuit breakers
 *
 * @returns Map of all registered circuit breakers
 */
export function getAllCircuitBreakers(): Map<string, CircuitBreaker> {
  return circuitBreakerRegistry;
}

/**
 * Get a registered circuit breaker by name
 *
 * @param name - Name of the circuit breaker
 * @returns Circuit breaker instance or undefined
 */
export function getCircuitBreaker(name: string): CircuitBreaker | undefined {
  return circuitBreakerRegistry.get(name);
}

/**
 * Get statistics for all registered circuit breakers
 *
 * @returns Array of statistics for all circuit breakers
 */
export function getAllCircuitStats(): CircuitBreakerStats[] {
  const stats: CircuitBreakerStats[] = [];
  circuitBreakerRegistry.forEach((breaker, name) => {
    stats.push(getCircuitStats(breaker, name));
  });
  return stats;
}

/**
 * Circuit breaker error class
 * Thrown when circuit is open and request is rejected
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

/**
 * Default fallback response for when circuit is open
 * _Requirements: 8.2_
 */
export interface CircuitBreakerFallbackResponse {
  success: false;
  queued: boolean;
  message: string;
  serviceName: string;
}

/**
 * Create a standard fallback response
 *
 * @param serviceName - Name of the service that is unavailable
 * @returns Standard fallback response object
 */
export function createFallbackResponse(serviceName: string): CircuitBreakerFallbackResponse {
  return {
    success: false,
    queued: true,
    message: `${serviceName} service temporarily unavailable, request queued for retry`,
    serviceName,
  };
}

/**
 * Get default circuit breaker options
 * Useful for testing and configuration
 */
export function getDefaultOptions(): CircuitBreakerOptions {
  return { ...DEFAULT_OPTIONS };
}

/**
 * Clear all registered circuit breakers
 * Useful for testing
 */
export function clearCircuitBreakerRegistry(): void {
  circuitBreakerRegistry.clear();
}


// ============================================
// PRE-CONFIGURED CIRCUIT BREAKERS
// ============================================

/**
 * Google Sheets circuit breaker configuration
 * _Requirements: 8.1, 8.2_
 *
 * - Opens after 5 consecutive failures (volumeThreshold: 5)
 * - Stays open for 30 seconds (resetTimeout: 30000)
 * - 15 second timeout for API calls
 */
export const GOOGLE_SHEETS_BREAKER_OPTIONS: CircuitBreakerOptions = {
  timeout: 15000,                  // 15 seconds for API calls
  errorThresholdPercentage: 50,    // Open after 50% failures
  resetTimeout: 30000,             // 30 seconds before trying again
  volumeThreshold: 5,              // Minimum 5 requests before tripping
  rollingCountTimeout: 10000,      // 10 second rolling window
  rollingCountBuckets: 10,         // 10 buckets for stats
};

/**
 * Google Sheets fallback response
 * _Requirements: 8.2_
 */
export const GOOGLE_SHEETS_FALLBACK_RESPONSE: CircuitBreakerFallbackResponse = {
  success: false,
  queued: true,
  message: 'Google Sheets service temporarily unavailable, request queued for retry',
  serviceName: 'google-sheets',
};

/**
 * Circuit breaker name constants
 */
export const CIRCUIT_BREAKER_NAMES = {
  GOOGLE_SHEETS: 'google-sheets',
  GOOGLE_SHEETS_SYNC: 'google-sheets-sync',
  GOOGLE_SHEETS_READ: 'google-sheets-read',
  GOOGLE_SHEETS_WRITE: 'google-sheets-write',
  GOOGLE_SHEETS_BATCH: 'google-sheets-batch',
} as const;

/**
 * Create a pre-configured Google Sheets circuit breaker
 *
 * @param fn - The async function to wrap (Google Sheets API call)
 * @param name - Optional custom name (defaults to 'google-sheets')
 * @returns Configured circuit breaker with fallback
 *
 * _Requirements: 8.1, 8.2_
 *
 * @example
 * ```ts
 * const breaker = createGoogleSheetsBreaker(
 *   async (data) => await sheets.spreadsheets.values.append(data)
 * );
 *
 * // With fallback
 * breaker.fallback(() => GOOGLE_SHEETS_FALLBACK_RESPONSE);
 *
 * // Use the breaker
 * const result = await breaker.fire(data);
 * ```
 */
export function createGoogleSheetsBreaker<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  name: string = CIRCUIT_BREAKER_NAMES.GOOGLE_SHEETS
): CircuitBreaker<TArgs, TResult> {
  const breaker = createCircuitBreaker(name, fn, GOOGLE_SHEETS_BREAKER_OPTIONS);

  // Set default fallback
  breaker.fallback(() => GOOGLE_SHEETS_FALLBACK_RESPONSE as unknown as TResult);

  return breaker;
}

/**
 * Execute a function with Google Sheets circuit breaker protection
 *
 * @param fn - The async function to execute
 * @param breakerName - Name of the circuit breaker to use
 * @returns Result of the function or fallback response
 *
 * _Requirements: 8.1, 8.2_
 *
 * @example
 * ```ts
 * const result = await withGoogleSheetsBreaker(
 *   async () => await sheets.spreadsheets.values.append(data),
 *   'google-sheets-sync'
 * );
 * ```
 */
export async function withGoogleSheetsBreaker<TResult>(
  fn: () => Promise<TResult>,
  breakerName: string = CIRCUIT_BREAKER_NAMES.GOOGLE_SHEETS
): Promise<TResult | CircuitBreakerFallbackResponse> {
  // Check if breaker already exists
  let breaker = getCircuitBreaker(breakerName) as CircuitBreaker<[], TResult> | undefined;

  if (!breaker) {
    // Create new breaker
    breaker = createGoogleSheetsBreaker(fn, breakerName);
  }

  try {
    return await breaker.fire();
  } catch (error) {
    // If circuit is open, return fallback
    if (breaker.opened) {
      logger.warn('Google Sheets circuit breaker is open, returning fallback', {
        breakerName,
        error: error instanceof Error ? error.message : String(error),
      });
      return GOOGLE_SHEETS_FALLBACK_RESPONSE;
    }
    throw error;
  }
}
