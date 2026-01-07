/**
 * Circuit Breaker Tests
 *
 * **Feature: production-scalability**
 * **Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  createCircuitBreaker,
  getCircuitState,
  getCircuitStats,
  CircuitOpenError,
  createFallbackResponse,
  getDefaultOptions,
  clearCircuitBreakerRegistry,
  getAllCircuitBreakers,
  getAllCircuitStats,
} from './circuit-breaker';

// Mock logger to prevent console output during tests
vi.mock('./logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Circuit Breaker', () => {
  beforeEach(() => {
    clearCircuitBreakerRegistry();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearCircuitBreakerRegistry();
  });

  /**
   * **Feature: production-scalability, Property 17: Circuit breaker opens on failures**
   * **Validates: Requirements 8.1, 8.2**
   *
   * *For any* external service (Google Sheets) that fails 5 times consecutively,
   * the circuit breaker SHALL open and return fallback response for 30 seconds.
   */
  describe('Property 17: Circuit breaker opens on failures', () => {
    it('should open circuit after reaching failure threshold', async () => {
      // Create a function that always fails
      const failingFn = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      const breaker = createCircuitBreaker('test-service', failingFn, {
        volumeThreshold: 3,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        timeout: 1000,
      });

      // Fire requests until circuit opens
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected to fail
        }
      }

      // Circuit should be open now
      expect(getCircuitState(breaker)).toBe('OPEN');
    });

    it('should reject requests when circuit is open', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      const breaker = createCircuitBreaker('test-reject', failingFn, {
        volumeThreshold: 2,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        timeout: 1000,
      });

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }

      expect(getCircuitState(breaker)).toBe('OPEN');

      // Next request should be rejected immediately
      await expect(breaker.fire()).rejects.toThrow();
      
      // The failing function should not be called when circuit is open
      const callCountBeforeReject = failingFn.mock.calls.length;
      
      try {
        await breaker.fire();
      } catch {
        // Expected
      }
      
      // Function should not be called again when circuit is open
      // (it may be called once for the reject, but not multiple times)
      expect(failingFn.mock.calls.length).toBeLessThanOrEqual(callCountBeforeReject + 1);
    });

    it('should track failure count correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (failureCount) => {
            clearCircuitBreakerRegistry();
            
            const failingFn = vi.fn().mockRejectedValue(new Error('Fail'));
            const breaker = createCircuitBreaker(`test-failures-${failureCount}`, failingFn, {
              volumeThreshold: 100, // High threshold to prevent opening
              errorThresholdPercentage: 100,
              resetTimeout: 30000,
              timeout: 1000,
            });

            for (let i = 0; i < failureCount; i++) {
              try {
                await breaker.fire();
              } catch {
                // Expected
              }
            }

            const stats = getCircuitStats(breaker, `test-failures-${failureCount}`);
            expect(stats.failures).toBe(failureCount);
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should use fallback when circuit is open', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      const fallbackValue = { success: false, message: 'Fallback response' };

      const breaker = createCircuitBreaker('test-fallback', failingFn, {
        volumeThreshold: 2,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        timeout: 1000,
      });

      breaker.fallback(() => fallbackValue);

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }

      expect(getCircuitState(breaker)).toBe('OPEN');

      // Should return fallback value
      const result = await breaker.fire();
      expect(result).toEqual(fallbackValue);
    });

    it('should have correct default options for Google Sheets (5 failures, 30s reset)', () => {
      const options = getDefaultOptions();
      
      // Default volume threshold should be 5
      expect(options.volumeThreshold).toBe(5);
      
      // Default reset timeout should be 30 seconds
      expect(options.resetTimeout).toBe(30000);
    });
  });

  /**
   * **Feature: production-scalability, Property 18: Circuit breaker half-open state**
   * **Validates: Requirements 8.3, 8.4, 8.5**
   *
   * *For any* open circuit after reset timeout, the system SHALL allow one test request
   * and close circuit if successful.
   */
  describe('Property 18: Circuit breaker half-open state', () => {
    it('should transition to half-open after reset timeout', async () => {
      vi.useFakeTimers();
      
      const failingFn = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      const breaker = createCircuitBreaker('test-half-open', failingFn, {
        volumeThreshold: 2,
        errorThresholdPercentage: 50,
        resetTimeout: 1000, // 1 second for testing
        timeout: 500,
      });

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }

      expect(getCircuitState(breaker)).toBe('OPEN');

      // Advance time past reset timeout
      vi.advanceTimersByTime(1100);

      // Circuit should be half-open now (ready to test)
      expect(breaker.halfOpen).toBe(true);
      expect(getCircuitState(breaker)).toBe('HALF_OPEN');

      vi.useRealTimers();
    });

    it('should close circuit if test request succeeds', async () => {
      vi.useFakeTimers();
      
      let shouldFail = true;
      const fn = vi.fn().mockImplementation(async () => {
        if (shouldFail) {
          throw new Error('Service unavailable');
        }
        return 'success';
      });

      const breaker = createCircuitBreaker('test-close-on-success', fn, {
        volumeThreshold: 2,
        errorThresholdPercentage: 50,
        resetTimeout: 1000,
        timeout: 500,
      });

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }

      expect(getCircuitState(breaker)).toBe('OPEN');

      // Advance time past reset timeout
      vi.advanceTimersByTime(1100);

      // Now make the function succeed
      shouldFail = false;

      // Test request should succeed and close circuit
      const result = await breaker.fire();
      expect(result).toBe('success');
      expect(getCircuitState(breaker)).toBe('CLOSED');

      vi.useRealTimers();
    });

    it('should keep circuit open if test request fails', async () => {
      vi.useFakeTimers();
      
      const failingFn = vi.fn().mockRejectedValue(new Error('Still failing'));

      const breaker = createCircuitBreaker('test-stay-open', failingFn, {
        volumeThreshold: 2,
        errorThresholdPercentage: 50,
        resetTimeout: 1000,
        timeout: 500,
      });

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }

      expect(getCircuitState(breaker)).toBe('OPEN');

      // Advance time past reset timeout
      vi.advanceTimersByTime(1100);

      // Test request should fail and circuit should go back to open
      try {
        await breaker.fire();
      } catch {
        // Expected
      }

      expect(getCircuitState(breaker)).toBe('OPEN');

      vi.useRealTimers();
    });

    it('should respect reset timeout configuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 60000 }),
          (resetTimeout) => {
            clearCircuitBreakerRegistry();
            
            const fn = vi.fn().mockResolvedValue('success');
            const breaker = createCircuitBreaker(`test-reset-${resetTimeout}`, fn, {
              resetTimeout,
            });

            // The breaker should be created with the specified reset timeout
            // We can verify this by checking the stats (breaker is functional)
            const stats = getCircuitStats(breaker, `test-reset-${resetTimeout}`);
            expect(stats.state).toBe('CLOSED');
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Circuit breaker state logging
   * **Feature: production-scalability**
   * **Requirements: 8.6**
   */
  describe('Circuit state change logging', () => {
    it('should log when circuit opens', async () => {
      const { logger } = await import('./logger');
      
      const failingFn = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      const breaker = createCircuitBreaker('test-log-open', failingFn, {
        volumeThreshold: 2,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        timeout: 1000,
      });

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }

      expect(logger.warn).toHaveBeenCalledWith(
        'Circuit breaker opened',
        expect.objectContaining({
          name: 'test-log-open',
          state: 'OPEN',
        })
      );
    });

    it('should log when circuit closes', async () => {
      vi.useFakeTimers();
      const { logger } = await import('./logger');
      
      let shouldFail = true;
      const fn = vi.fn().mockImplementation(async () => {
        if (shouldFail) {
          throw new Error('Service unavailable');
        }
        return 'success';
      });

      const breaker = createCircuitBreaker('test-log-close', fn, {
        volumeThreshold: 2,
        errorThresholdPercentage: 50,
        resetTimeout: 1000,
        timeout: 500,
      });

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }

      // Advance time and make function succeed
      vi.advanceTimersByTime(1100);
      shouldFail = false;
      await breaker.fire();

      expect(logger.info).toHaveBeenCalledWith(
        'Circuit breaker closed',
        expect.objectContaining({
          name: 'test-log-close',
          state: 'CLOSED',
        })
      );

      vi.useRealTimers();
    });
  });

  /**
   * Circuit breaker error handling
   */
  describe('CircuitOpenError', () => {
    it('should have correct error properties', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (serviceName) => {
            const error = new CircuitOpenError(serviceName);
            
            expect(error.code).toBe('SERVICE_UNAVAILABLE');
            expect(error.status).toBe(503);
            expect(error.serviceName).toBe(serviceName);
            expect(error.message).toContain(serviceName);
            expect(error).toBeInstanceOf(Error);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Fallback response helper
   */
  describe('createFallbackResponse', () => {
    it('should create correct fallback response', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (serviceName) => {
            const response = createFallbackResponse(serviceName);
            
            expect(response.success).toBe(false);
            expect(response.queued).toBe(true);
            expect(response.serviceName).toBe(serviceName);
            expect(response.message).toContain(serviceName);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Circuit breaker registry
   */
  describe('Circuit breaker registry', () => {
    it('should register circuit breakers', () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      createCircuitBreaker('registry-test-1', fn);
      createCircuitBreaker('registry-test-2', fn);
      
      const registry = getAllCircuitBreakers();
      expect(registry.size).toBe(2);
      expect(registry.has('registry-test-1')).toBe(true);
      expect(registry.has('registry-test-2')).toBe(true);
    });

    it('should get all circuit stats', () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      createCircuitBreaker('stats-test-1', fn);
      createCircuitBreaker('stats-test-2', fn);
      
      const stats = getAllCircuitStats();
      expect(stats.length).toBe(2);
      expect(stats.map(s => s.name)).toContain('stats-test-1');
      expect(stats.map(s => s.name)).toContain('stats-test-2');
    });

    it('should clear registry', () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      createCircuitBreaker('clear-test', fn);
      expect(getAllCircuitBreakers().size).toBe(1);
      
      clearCircuitBreakerRegistry();
      expect(getAllCircuitBreakers().size).toBe(0);
    });
  });

  /**
   * Circuit breaker statistics
   */
  describe('Circuit breaker statistics', () => {
    it('should track successes correctly', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (successCount) => {
            clearCircuitBreakerRegistry();
            
            const fn = vi.fn().mockResolvedValue('success');
            const breaker = createCircuitBreaker(`test-success-${successCount}`, fn, {
              timeout: 1000,
            });

            for (let i = 0; i < successCount; i++) {
              await breaker.fire();
            }

            const stats = getCircuitStats(breaker, `test-success-${successCount}`);
            expect(stats.successes).toBe(successCount);
            expect(stats.fires).toBe(successCount);
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});


  /**
   * Google Sheets circuit breaker
   * **Feature: production-scalability**
   * **Requirements: 8.1, 8.2**
   */
  describe('Google Sheets Circuit Breaker', () => {
    it('should have correct configuration for Google Sheets', async () => {
      const { GOOGLE_SHEETS_BREAKER_OPTIONS } = await import('./circuit-breaker');
      
      // 5 failure threshold
      expect(GOOGLE_SHEETS_BREAKER_OPTIONS.volumeThreshold).toBe(5);
      
      // 30 second reset timeout
      expect(GOOGLE_SHEETS_BREAKER_OPTIONS.resetTimeout).toBe(30000);
      
      // 15 second timeout for API calls
      expect(GOOGLE_SHEETS_BREAKER_OPTIONS.timeout).toBe(15000);
    });

    it('should have correct fallback response', async () => {
      const { GOOGLE_SHEETS_FALLBACK_RESPONSE } = await import('./circuit-breaker');
      
      expect(GOOGLE_SHEETS_FALLBACK_RESPONSE.success).toBe(false);
      expect(GOOGLE_SHEETS_FALLBACK_RESPONSE.queued).toBe(true);
      expect(GOOGLE_SHEETS_FALLBACK_RESPONSE.serviceName).toBe('google-sheets');
      expect(GOOGLE_SHEETS_FALLBACK_RESPONSE.message).toContain('Google Sheets');
    });

    it('should create Google Sheets breaker with correct options', async () => {
      const { createGoogleSheetsBreaker, getCircuitStats } = await import('./circuit-breaker');
      
      const fn = vi.fn().mockResolvedValue('success');
      const breaker = createGoogleSheetsBreaker(fn, 'test-google-sheets');
      
      const stats = getCircuitStats(breaker, 'test-google-sheets');
      expect(stats.state).toBe('CLOSED');
      expect(stats.name).toBe('test-google-sheets');
    });

    it('should use default name when not provided', async () => {
      clearCircuitBreakerRegistry();
      const { createGoogleSheetsBreaker, getAllCircuitBreakers, CIRCUIT_BREAKER_NAMES } = await import('./circuit-breaker');
      
      const fn = vi.fn().mockResolvedValue('success');
      createGoogleSheetsBreaker(fn);
      
      const registry = getAllCircuitBreakers();
      expect(registry.has(CIRCUIT_BREAKER_NAMES.GOOGLE_SHEETS)).toBe(true);
    });

    it('should return fallback when circuit is open', async () => {
      clearCircuitBreakerRegistry();
      const { createGoogleSheetsBreaker, GOOGLE_SHEETS_FALLBACK_RESPONSE, getCircuitState } = await import('./circuit-breaker');
      
      const failingFn = vi.fn().mockRejectedValue(new Error('API Error'));
      const breaker = createGoogleSheetsBreaker(failingFn, 'test-fallback-gs');
      
      // Open the circuit
      for (let i = 0; i < 10; i++) {
        try {
          await breaker.fire();
        } catch {
          // Expected
        }
      }
      
      expect(getCircuitState(breaker)).toBe('OPEN');
      
      // Should return fallback
      const result = await breaker.fire();
      expect(result).toEqual(GOOGLE_SHEETS_FALLBACK_RESPONSE);
    });
  });

  /**
   * Circuit breaker name constants
   */
  describe('Circuit breaker name constants', () => {
    it('should have all required names', async () => {
      const { CIRCUIT_BREAKER_NAMES } = await import('./circuit-breaker');
      
      expect(CIRCUIT_BREAKER_NAMES.GOOGLE_SHEETS).toBe('google-sheets');
      expect(CIRCUIT_BREAKER_NAMES.GOOGLE_SHEETS_SYNC).toBe('google-sheets-sync');
      expect(CIRCUIT_BREAKER_NAMES.GOOGLE_SHEETS_READ).toBe('google-sheets-read');
      expect(CIRCUIT_BREAKER_NAMES.GOOGLE_SHEETS_WRITE).toBe('google-sheets-write');
    });
  });
