/**
 * Distributed Lock Tests
 *
 * Tests for in-memory distributed lock implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { LockTimeoutError, LockKeys, getLockConfig, withLock } from './distributed-lock';

describe('Distributed Lock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Lock key format tests
   */
  describe('Lock Keys', () => {
    it('should have correct lock keys for all critical operations', () => {
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

  /**
   * Lock timeout error tests
   */
  describe('LockTimeoutError', () => {
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
   * Lock configuration tests
   */
  describe('Lock Configuration', () => {
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
  });

  /**
   * withLock function tests
   */
  describe('withLock', () => {
    it('should execute function and return result', async () => {
      const result = await withLock('test-resource', 5000, async () => {
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should execute async functions', async () => {
      let executed = false;
      
      await withLock('test-resource-async', 5000, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executed = true;
        return 'done';
      });

      expect(executed).toBe(true);
    });

    it('should handle errors in the function', async () => {
      await expect(
        withLock('test-resource-error', 5000, async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    it('should allow sequential locks on same resource', async () => {
      const results: number[] = [];

      await withLock('sequential-resource', 5000, async () => {
        results.push(1);
      });

      await withLock('sequential-resource', 5000, async () => {
        results.push(2);
      });

      expect(results).toEqual([1, 2]);
    });

    it('should allow concurrent locks on different resources', async () => {
      const results: string[] = [];

      await Promise.all([
        withLock('resource-a', 5000, async () => {
          results.push('a');
        }),
        withLock('resource-b', 5000, async () => {
          results.push('b');
        }),
      ]);

      expect(results).toHaveLength(2);
      expect(results).toContain('a');
      expect(results).toContain('b');
    });
  });
});
