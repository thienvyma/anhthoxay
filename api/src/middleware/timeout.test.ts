/**
 * Timeout Middleware Tests
 *
 * Tests for request timeout functionality with circuit breaker integration.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  withTimeout,
  withTimeoutAndCircuitBreaker,
  withDatabaseTimeout,
  withExternalTimeout,
  TimeoutError,
  CircuitOpenError,
  getTimeoutStats,
  resetTimeoutStats,
  clearCircuitBreakers,
  isCircuitOpen,
  DEFAULT_TIMEOUT_CONFIG,
} from './timeout';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock correlation-id
vi.mock('./correlation-id', () => ({
  getCorrelationId: () => 'test-correlation-id',
}));

// Mock redis-cluster
vi.mock('../config/redis-cluster', () => ({
  getRedisClusterClientSync: () => null,
}));

describe('Timeout Middleware', () => {
  beforeEach(() => {
    resetTimeoutStats();
    clearCircuitBreakers();
    vi.clearAllMocks();
  });

  describe('withTimeout', () => {
    it('should resolve when operation completes within timeout', async () => {
      const result = await withTimeout(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'success';
        },
        1000,
        'test operation'
      );

      expect(result).toBe('success');
    });

    it('should reject with TimeoutError when operation exceeds timeout', async () => {
      await expect(
        withTimeout(
          async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return 'success';
          },
          50,
          'slow operation'
        )
      ).rejects.toThrow(TimeoutError);
    });

    it('should include correct properties in TimeoutError', async () => {
      try {
        await withTimeout(
          async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
          },
          50,
          'test context',
          'database'
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        const timeoutError = error as TimeoutError;
        expect(timeoutError.operationType).toBe('database');
        expect(timeoutError.timeoutMs).toBe(50);
        expect(timeoutError.context).toBe('test context');
        expect(timeoutError.status).toBe(504);
        expect(timeoutError.code).toBe('TIMEOUT');
      }
    });

    it('should propagate errors from the wrapped function', async () => {
      const customError = new Error('Custom error');
      
      await expect(
        withTimeout(
          async () => {
            throw customError;
          },
          1000,
          'error operation'
        )
      ).rejects.toThrow('Custom error');
    });

    it('should track timeout statistics', async () => {
      // Cause a timeout
      try {
        await withTimeout(
          async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
          },
          50,
          'stats test',
          'database'
        );
      } catch {
        // Expected
      }

      const stats = getTimeoutStats();
      expect(stats.totalTimeouts).toBe(1);
      expect(stats.timeoutsByType.database).toBe(1);
      expect(stats.lastTimeoutAt).not.toBeNull();
    });
  });

  describe('withDatabaseTimeout', () => {
    it('should use database timeout configuration', async () => {
      const result = await withDatabaseTimeout(
        async () => 'db result',
        'database query'
      );

      expect(result).toBe('db result');
    });

    it('should timeout with database timeout value', async () => {
      // This test verifies the timeout is applied
      // We use a shorter timeout for testing
      const startTime = Date.now();
      
      try {
        await withTimeout(
          async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
          },
          50,
          'db timeout test',
          'database'
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        expect(error).toBeInstanceOf(TimeoutError);
        expect(duration).toBeLessThan(150); // Should timeout quickly
      }
    });
  });

  describe('withExternalTimeout', () => {
    it('should use external timeout configuration', async () => {
      const result = await withExternalTimeout(
        async () => 'external result',
        'external api call'
      );

      expect(result).toBe('external result');
    });
  });

  describe('withTimeoutAndCircuitBreaker', () => {
    it('should execute successfully when circuit is closed', async () => {
      const result = await withTimeoutAndCircuitBreaker(
        async () => 'success',
        1000,
        'circuit-test',
        'default'
      );

      expect(result).toBe('success');
      expect(isCircuitOpen('circuit-test')).toBe(false);
    });

    it('should open circuit after multiple failures', async () => {
      const context = 'circuit-failure-test';
      
      // Trigger multiple failures to open circuit
      for (let i = 0; i < 6; i++) {
        try {
          await withTimeoutAndCircuitBreaker(
            async () => {
              await new Promise(resolve => setTimeout(resolve, 200));
            },
            50,
            context,
            'default'
          );
        } catch {
          // Expected timeouts
        }
      }

      // Circuit should be open after multiple failures
      expect(isCircuitOpen(context)).toBe(true);
    });

    it('should throw CircuitOpenError when circuit is open and no cache', async () => {
      const context = 'circuit-open-test';
      
      // Open the circuit
      for (let i = 0; i < 6; i++) {
        try {
          await withTimeoutAndCircuitBreaker(
            async () => {
              await new Promise(resolve => setTimeout(resolve, 200));
            },
            50,
            context,
            'default'
          );
        } catch {
          // Expected
        }
      }

      // Now try with circuit open
      await expect(
        withTimeoutAndCircuitBreaker(
          async () => 'should not execute',
          1000,
          context,
          'default',
          'cache:test'
        )
      ).rejects.toThrow(CircuitOpenError);
    });
  });

  describe('TimeoutError', () => {
    it('should have correct properties', () => {
      const error = new TimeoutError('database', 10000, 'test query');
      
      expect(error.name).toBe('TimeoutError');
      expect(error.code).toBe('TIMEOUT');
      expect(error.status).toBe(504);
      expect(error.operationType).toBe('database');
      expect(error.timeoutMs).toBe(10000);
      expect(error.context).toBe('test query');
      expect(error.message).toContain('10000ms');
      expect(error.message).toContain('test query');
    });
  });

  describe('CircuitOpenError', () => {
    it('should have correct properties', () => {
      const error = new CircuitOpenError('google-sheets');
      
      expect(error.name).toBe('CircuitOpenError');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.status).toBe(503);
      expect(error.serviceName).toBe('google-sheets');
      expect(error.message).toContain('google-sheets');
      expect(error.message).toContain('temporarily unavailable');
    });
  });

  describe('DEFAULT_TIMEOUT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_TIMEOUT_CONFIG.default).toBe(30000);
      expect(DEFAULT_TIMEOUT_CONFIG.database).toBe(10000);
      expect(DEFAULT_TIMEOUT_CONFIG.external).toBe(15000);
      expect(DEFAULT_TIMEOUT_CONFIG.healthCheck).toBe(100);
    });
  });

  describe('getTimeoutStats', () => {
    it('should return initial stats', () => {
      const stats = getTimeoutStats();
      
      expect(stats.totalTimeouts).toBe(0);
      expect(stats.timeoutsByType.default).toBe(0);
      expect(stats.timeoutsByType.database).toBe(0);
      expect(stats.timeoutsByType.external).toBe(0);
      expect(stats.timeoutsByType.healthCheck).toBe(0);
      expect(stats.lastTimeoutAt).toBeNull();
      expect(stats.consecutiveTimeouts).toBe(0);
    });

    it('should track timeouts by type', async () => {
      // Reset stats and circuit breakers to ensure clean state
      resetTimeoutStats();
      clearCircuitBreakers();
      
      // Get initial stats
      const initialStats = getTimeoutStats();
      const initialDatabase = initialStats.timeoutsByType.database;
      const initialExternal = initialStats.timeoutsByType.external;
      
      // Cause timeouts of different types
      try {
        await withTimeout(
          async () => { await new Promise(r => setTimeout(r, 200)); },
          50,
          'test1-stats',
          'database'
        );
      } catch { /* expected */ }

      try {
        await withTimeout(
          async () => { await new Promise(r => setTimeout(r, 200)); },
          50,
          'test2-stats',
          'external'
        );
      } catch { /* expected */ }

      const stats = getTimeoutStats();
      // Check that we added exactly 1 to each type
      expect(stats.timeoutsByType.database).toBe(initialDatabase + 1);
      expect(stats.timeoutsByType.external).toBe(initialExternal + 1);
    });
  });

  describe('resetTimeoutStats', () => {
    it('should reset all statistics', async () => {
      // Cause a timeout
      try {
        await withTimeout(
          async () => { await new Promise(r => setTimeout(r, 200)); },
          50,
          'test',
          'database'
        );
      } catch { /* expected */ }

      // Verify stats were recorded
      expect(getTimeoutStats().totalTimeouts).toBe(1);

      // Reset
      resetTimeoutStats();

      // Verify reset
      const stats = getTimeoutStats();
      expect(stats.totalTimeouts).toBe(0);
      expect(stats.lastTimeoutAt).toBeNull();
    });
  });
});
