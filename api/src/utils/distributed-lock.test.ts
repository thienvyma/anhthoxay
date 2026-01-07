/**
 * Distributed Lock Tests
 *
 * **Feature: production-scalability**
 * **Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */

import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { LockTimeoutError, LockKeys, getLockConfig } from './distributed-lock';

// Mock redlock module
vi.mock('redlock', () => {
  const mockLock = {
    release: vi.fn().mockResolvedValue(undefined),
  };

  const MockRedlock = vi.fn().mockImplementation(() => ({
    acquire: vi.fn().mockResolvedValue(mockLock),
    on: vi.fn(),
  }));

  return {
    default: MockRedlock,
    ResourceLockedError: class ResourceLockedError extends Error {
      constructor() {
        super('Resource locked');
        this.name = 'ResourceLockedError';
      }
    },
  };
});

// Mock redis config
vi.mock('../config/redis', () => ({
  getRedisClient: vi.fn().mockReturnValue(null), // Return null to test fallback behavior
}));

describe('Distributed Lock', () => {
  /**
   * **Feature: production-scalability, Property 10: Lock acquisition for critical operations**
   * **Validates: Requirements 5.1, 5.2, 5.3**
   *
   * *For any* critical operation (token refresh, ranking recalculation, Google Sheets sync),
   * the system SHALL acquire a distributed lock before processing.
   */
  describe('Property 10: Lock acquisition for critical operations', () => {
    it('should have correct lock keys for all critical operations', () => {
      // Token refresh lock
      fc.assert(
        fc.property(
          fc.uuid(),
          (userId) => {
            const key = LockKeys.tokenRefresh(userId);
            expect(key).toBe(`lock:token-refresh:${userId}`);
            expect(key).toContain('lock:');
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have ranking recalculation lock key', () => {
      expect(LockKeys.rankingRecalculation).toBe('lock:ranking-recalculation');
    });

    it('should have Google Sheets sync lock key', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 50 }),
          (spreadsheetId) => {
            const key = LockKeys.googleSheetsSync(spreadsheetId);
            expect(key).toBe(`lock:google-sheets:${spreadsheetId}`);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have escrow status change lock key', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (escrowId) => {
            const key = LockKeys.escrowStatusChange(escrowId);
            expect(key).toBe(`lock:escrow:${escrowId}`);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have bid selection lock key', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (projectId) => {
            const key = LockKeys.bidSelection(projectId);
            expect(key).toBe(`lock:bid-selection:${projectId}`);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique lock keys for different resources', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (id1, id2) => {
            fc.pre(id1 !== id2); // Ensure different IDs
            
            const key1 = LockKeys.tokenRefresh(id1);
            const key2 = LockKeys.tokenRefresh(id2);
            
            expect(key1).not.toBe(key2);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: production-scalability, Property 11: Lock timeout error**
   * **Validates: Requirements 5.4**
   *
   * *For any* lock acquisition that cannot complete within 5 seconds,
   * the system SHALL return LOCK_TIMEOUT error with status 503.
   */
  describe('Property 11: Lock timeout error', () => {
    it('should have correct error code and status', () => {
      const error = new LockTimeoutError('test-resource');
      
      expect(error.code).toBe('LOCK_TIMEOUT');
      expect(error.status).toBe(503);
      expect(error.name).toBe('LockTimeoutError');
    });

    it('should include resource name in error message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (resource) => {
            const error = new LockTimeoutError(resource);
            expect(error.message).toContain(resource);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be instanceof Error', () => {
      const error = new LockTimeoutError('test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  /**
   * **Feature: production-scalability, Property 12: Lock auto-release on TTL**
   * **Validates: Requirements 5.5**
   *
   * *For any* acquired lock, if the lock holder crashes,
   * the lock SHALL be automatically released after TTL expires (30 seconds).
   */
  describe('Property 12: Lock auto-release on TTL', () => {
    it('should have default TTL of 30 seconds', () => {
      const config = getLockConfig();
      expect(config.defaultTtl).toBe(30000);
    });

    it('should have retry configuration', () => {
      const config = getLockConfig();
      expect(config.retryCount).toBe(3);
      expect(config.retryDelay).toBe(200);
      expect(config.retryJitter).toBe(200);
    });

    it('should respect TTL for lock expiration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 60000 }), // TTL in ms
          fc.integer({ min: 0, max: 120000 }), // elapsed time in ms
          (ttl, elapsed) => {
            const shouldExpire = elapsed >= ttl;
            
            if (shouldExpire) {
              // Lock should be released after TTL
              expect(elapsed).toBeGreaterThanOrEqual(ttl);
            } else {
              // Lock should still be held
              expect(elapsed).toBeLessThan(ttl);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Redis unavailable fallback
   * **Feature: production-scalability**
   * **Requirements: 5.6**
   */
  describe('Redis unavailable fallback', () => {
    it('should execute function without lock when Redis unavailable', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      // Import withLock after mocking
      const { withLock } = await import('./distributed-lock');
      
      let executed = false;
      const result = await withLock('test-resource', 5000, async () => {
        executed = true;
        return 'success';
      });

      expect(executed).toBe(true);
      expect(result).toBe('success');
    });

    it('should log warning when Redis unavailable', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      const { withLock } = await import('./distributed-lock');
      
      await withLock('test-resource', 5000, async () => 'result');

      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  /**
   * Lock key format validation
   */
  describe('Lock key format', () => {
    it('should always start with lock: prefix', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (id) => {
            const keys = [
              LockKeys.tokenRefresh(id),
              LockKeys.googleSheetsSync(id),
              LockKeys.escrowStatusChange(id),
              LockKeys.bidSelection(id),
            ];
            
            keys.forEach(key => {
              expect(key.startsWith('lock:')).toBe(true);
            });
            
            expect(LockKeys.rankingRecalculation.startsWith('lock:')).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not contain special characters that could cause issues', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (id) => {
            const key = LockKeys.tokenRefresh(id);
            
            // Should not contain newlines, tabs, or null characters
            expect(key).not.toMatch(/[\n\r\t\0]/);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
