/**
 * Per-User Rate Limiter Tests
 *
 * Tests for per-user rate limiting middleware including
 * property-based tests for rate limiting behavior and role-based limits.
 *
 * **Feature: production-scalability**
 * **Requirements: 15.1, 15.2, 15.3, 15.4, 15.5**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  checkUserLimit,
  resetUserLimit,
  getRateLimitForRole,
  getUserLimitStatus,
  clearAllUserLimits,
  DEFAULT_ROLE_MULTIPLIERS,
  DEFAULT_BASE_LIMIT,
  DEFAULT_WINDOW_MS,
} from './user-rate-limiter';

// Mock the rate-limit-monitoring service
vi.mock('../services/rate-limit-monitoring.service', () => ({
  logViolation: vi.fn().mockResolvedValue(undefined),
}));

describe('Per-User Rate Limiter', () => {
  beforeEach(() => {
    clearAllUserLimits();
    vi.clearAllMocks();
  });

  describe('getRateLimitForRole', () => {
    it('should return base limit multiplied by role multiplier', () => {
      expect(getRateLimitForRole('ADMIN', 100, DEFAULT_ROLE_MULTIPLIERS)).toBe(500);
      expect(getRateLimitForRole('MANAGER', 100, DEFAULT_ROLE_MULTIPLIERS)).toBe(300);
      expect(getRateLimitForRole('USER', 100, DEFAULT_ROLE_MULTIPLIERS)).toBe(100);
    });

    it('should return base limit for unknown roles', () => {
      expect(getRateLimitForRole('UNKNOWN', 100, DEFAULT_ROLE_MULTIPLIERS)).toBe(100);
    });

    it('should use custom multipliers when provided', () => {
      const customMultipliers = { ADMIN: 10, USER: 2 };
      expect(getRateLimitForRole('ADMIN', 100, customMultipliers)).toBe(1000);
      expect(getRateLimitForRole('USER', 100, customMultipliers)).toBe(200);
    });
  });

  describe('checkUserLimit', () => {
    it('should allow first request', () => {
      const result = checkUserLimit('user-1', 100, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
      expect(result.limit).toBe(100);
    });

    it('should decrement remaining on each request', () => {
      const userId = 'user-2';
      const limit = 5;
      const windowMs = 60000;

      for (let i = 0; i < limit; i++) {
        const result = checkUserLimit(userId, limit, windowMs);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(limit - i - 1);
      }
    });

    it('should block requests after limit exceeded', () => {
      const userId = 'user-3';
      const limit = 3;
      const windowMs = 60000;

      // Use up all attempts
      for (let i = 0; i < limit; i++) {
        checkUserLimit(userId, limit, windowMs);
      }

      // Next request should be blocked
      const result = checkUserLimit(userId, limit, windowMs);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', () => {
      const userId = 'user-4';
      const limit = 3;
      const windowMs = 100; // 100ms window

      // Use up all attempts
      for (let i = 0; i < limit; i++) {
        checkUserLimit(userId, limit, windowMs);
      }

      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = checkUserLimit(userId, limit, windowMs);
          expect(result.allowed).toBe(true);
          expect(result.remaining).toBe(limit - 1);
          resolve();
        }, 150);
      });
    });
  });

  describe('resetUserLimit', () => {
    it('should reset user limit', () => {
      const userId = 'user-5';
      const limit = 3;
      const windowMs = 60000;

      // Use up all attempts
      for (let i = 0; i < limit; i++) {
        checkUserLimit(userId, limit, windowMs);
      }

      // Reset
      resetUserLimit(userId);

      // Should be allowed again
      const result = checkUserLimit(userId, limit, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(limit - 1);
    });
  });

  describe('getUserLimitStatus', () => {
    it('should return current status without incrementing', () => {
      const userId = 'user-6';
      const limit = 5;
      const windowMs = 60000;

      // Make 2 requests
      checkUserLimit(userId, limit, windowMs);
      checkUserLimit(userId, limit, windowMs);

      // Get status (should not increment)
      const status1 = getUserLimitStatus(userId, limit, windowMs);
      expect(status1.remaining).toBe(3);

      const status2 = getUserLimitStatus(userId, limit, windowMs);
      expect(status2.remaining).toBe(3); // Still 3, not decremented
    });
  });

  // ============================================
  // PROPERTY-BASED TESTS
  // ============================================

  /**
   * Property 28: Per-user rate limiting
   * Requirements: 15.1, 15.5
   *
   * Property: For any user ID and limit, the system should:
   * - Allow exactly `limit` requests within the window
   * - Block all subsequent requests until window resets
   * - Track limits independently per user
   */
  describe('Property 28: Per-user rate limiting', () => {
    it('should allow exactly limit requests and block subsequent ones', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // userId
          fc.integer({ min: 1, max: 100 }), // limit
          (userId, limit) => {
            clearAllUserLimits();
            const windowMs = 60000;

            // Make exactly `limit` requests - all should be allowed
            for (let i = 0; i < limit; i++) {
              const result = checkUserLimit(userId, limit, windowMs);
              if (!result.allowed) {
                return false; // Should be allowed
              }
            }

            // Next request should be blocked
            const blockedResult = checkUserLimit(userId, limit, windowMs);
            return blockedResult.allowed === false && blockedResult.remaining === 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should track limits independently per user', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // userId1
          fc.uuid(), // userId2
          fc.integer({ min: 1, max: 50 }), // limit
          (userId1, userId2, limit) => {
            // Skip if same user ID generated
            if (userId1 === userId2) return true;

            clearAllUserLimits();
            const windowMs = 60000;

            // Exhaust user1's limit
            for (let i = 0; i < limit; i++) {
              checkUserLimit(userId1, limit, windowMs);
            }

            // User1 should be blocked
            const user1Result = checkUserLimit(userId1, limit, windowMs);
            if (user1Result.allowed) return false;

            // User2 should still be allowed
            const user2Result = checkUserLimit(userId2, limit, windowMs);
            return user2Result.allowed === true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly report remaining requests', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // userId
          fc.integer({ min: 5, max: 100 }), // limit
          fc.integer({ min: 1, max: 4 }), // requestCount (less than limit)
          (userId, limit, requestCount) => {
            clearAllUserLimits();
            const windowMs = 60000;

            let lastResult;
            for (let i = 0; i < requestCount; i++) {
              lastResult = checkUserLimit(userId, limit, windowMs);
            }

            // Remaining should be limit - requestCount
            return lastResult?.remaining === limit - requestCount;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 29: Role-based rate limits
   * Requirements: 15.3
   *
   * Property: For any role and base limit, the effective limit should be:
   * - base_limit * role_multiplier
   * - ADMIN gets 5x, MANAGER gets 3x, others get 1x
   */
  describe('Property 29: Role-based rate limits', () => {
    it('should apply correct multiplier for each role', () => {
      const roles = ['ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER'];

      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 1000 }), // baseLimit
          fc.constantFrom(...roles), // role
          (baseLimit, role) => {
            const expectedMultiplier = DEFAULT_ROLE_MULTIPLIERS[role] ?? 1;
            const expectedLimit = Math.floor(baseLimit * expectedMultiplier);
            const actualLimit = getRateLimitForRole(role, baseLimit, DEFAULT_ROLE_MULTIPLIERS);

            return actualLimit === expectedLimit;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should give ADMIN 5x the base limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 1000 }), // baseLimit
          (baseLimit) => {
            const adminLimit = getRateLimitForRole('ADMIN', baseLimit, DEFAULT_ROLE_MULTIPLIERS);
            const userLimit = getRateLimitForRole('USER', baseLimit, DEFAULT_ROLE_MULTIPLIERS);

            return adminLimit === userLimit * 5;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should give MANAGER 3x the base limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 1000 }), // baseLimit
          (baseLimit) => {
            const managerLimit = getRateLimitForRole('MANAGER', baseLimit, DEFAULT_ROLE_MULTIPLIERS);
            const userLimit = getRateLimitForRole('USER', baseLimit, DEFAULT_ROLE_MULTIPLIERS);

            return managerLimit === userLimit * 3;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should use custom multipliers when provided', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 1000 }), // baseLimit
          fc.integer({ min: 1, max: 20 }), // customMultiplier
          (baseLimit, customMultiplier) => {
            const customMultipliers = { CUSTOM_ROLE: customMultiplier };
            const limit = getRateLimitForRole('CUSTOM_ROLE', baseLimit, customMultipliers);

            return limit === Math.floor(baseLimit * customMultiplier);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should default to 1x for unknown roles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 1000 }), // baseLimit
          fc.string({ minLength: 5, maxLength: 20 }), // unknownRole
          (baseLimit, unknownRole) => {
            // Skip if role happens to match a known role
            if (DEFAULT_ROLE_MULTIPLIERS[unknownRole]) return true;

            const limit = getRateLimitForRole(unknownRole, baseLimit, DEFAULT_ROLE_MULTIPLIERS);
            return limit === baseLimit;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Default values', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_BASE_LIMIT).toBe(100);
      expect(DEFAULT_WINDOW_MS).toBe(60000);
      expect(DEFAULT_ROLE_MULTIPLIERS.ADMIN).toBe(5);
      expect(DEFAULT_ROLE_MULTIPLIERS.MANAGER).toBe(3);
      expect(DEFAULT_ROLE_MULTIPLIERS.USER).toBe(1);
    });
  });
});
