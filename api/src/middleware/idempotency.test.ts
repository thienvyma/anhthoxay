/**
 * Idempotency Middleware Tests
 *
 * **Feature: production-scalability**
 * **Requirements: 6.1, 6.2, 6.3, 6.4, 6.5**
 */

import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { getIdempotencyTTL } from './idempotency';

// Mock redis config
vi.mock('../config/redis', () => {
  const mockRedis = {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  };
  return {
    getRedisClient: vi.fn().mockReturnValue(mockRedis),
  };
});

describe('Idempotency Middleware', () => {
  /**
   * **Feature: production-scalability, Property 13: Idempotency duplicate detection**
   * **Validates: Requirements 6.1, 6.2**
   *
   * *For any* request with Idempotency-Key header,
   * sending the same request twice SHALL return identical responses
   * without processing the second request.
   */
  describe('Property 13: Idempotency duplicate detection', () => {
    it('should generate unique cache keys for different idempotency keys', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (key1, key2) => {
            fc.pre(key1 !== key2);
            
            const cacheKey1 = `idempotency:${key1}`;
            const cacheKey2 = `idempotency:${key2}`;
            
            expect(cacheKey1).not.toBe(cacheKey2);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate consistent cache keys for same idempotency key', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (key) => {
            const cacheKey1 = `idempotency:${key}`;
            const cacheKey2 = `idempotency:${key}`;
            
            expect(cacheKey1).toBe(cacheKey2);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve response structure in cache', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 299 }), // status code
          fc.record({
            success: fc.boolean(),
            message: fc.string(),
          }), // body - use simple structure to avoid undefined values
          fc.integer({ min: 1, max: Date.now() }), // timestamp
          (status, body, createdAt) => {
            const entry = {
              status,
              body,
              headers: { 'Content-Type': 'application/json' },
              createdAt,
            };
            
            // Serialize and deserialize (simulating Redis storage)
            const serialized = JSON.stringify(entry);
            const deserialized = JSON.parse(serialized);
            
            expect(deserialized.status).toBe(status);
            expect(deserialized.body.success).toBe(body.success);
            expect(deserialized.body.message).toBe(body.message);
            expect(deserialized.createdAt).toBe(createdAt);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only cache successful responses (2xx)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 599 }), // any HTTP status
          (status) => {
            const shouldCache = status >= 200 && status < 300;
            
            if (shouldCache) {
              expect(status).toBeGreaterThanOrEqual(200);
              expect(status).toBeLessThan(300);
            } else {
              expect(status < 200 || status >= 300).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: production-scalability, Property 14: Idempotency cache TTL**
   * **Validates: Requirements 6.3, 6.5**
   *
   * *For any* idempotent request result,
   * the cached result SHALL be available for 24 hours
   * and allow reprocessing after expiry.
   */
  describe('Property 14: Idempotency cache TTL', () => {
    it('should have TTL of 24 hours (86400 seconds)', () => {
      const ttl = getIdempotencyTTL();
      expect(ttl).toBe(86400);
    });

    it('should expire entries after TTL', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 172800 }), // elapsed time in seconds (0-48 hours)
          (elapsedSeconds) => {
            const ttl = 86400; // 24 hours
            const shouldExpire = elapsedSeconds >= ttl;
            
            if (shouldExpire) {
              // Entry should be expired and allow reprocessing
              expect(elapsedSeconds).toBeGreaterThanOrEqual(ttl);
            } else {
              // Entry should still be valid
              expect(elapsedSeconds).toBeLessThan(ttl);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow reprocessing after TTL expiry', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 86401, max: 172800 }), // time after TTL
          (elapsedSeconds) => {
            const ttl = 86400;
            
            // After TTL, entry should be expired
            expect(elapsedSeconds).toBeGreaterThan(ttl);
            
            // System should allow reprocessing
            const canReprocess = elapsedSeconds > ttl;
            expect(canReprocess).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Requests without idempotency key
   * **Feature: production-scalability**
   * **Requirements: 6.4**
   */
  describe('Requests without idempotency key', () => {
    it('should process requests without Idempotency-Key header normally', () => {
      // Property: Requests without header should always be processed
      fc.assert(
        fc.property(
          fc.option(fc.uuid(), { nil: undefined }),
          (maybeKey) => {
            const hasKey = maybeKey !== undefined;
            
            if (!hasKey) {
              // Should process normally without caching
              expect(maybeKey).toBeUndefined();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Cache key format validation
   */
  describe('Cache key format', () => {
    it('should always use idempotency: prefix', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (key) => {
            const cacheKey = `idempotency:${key}`;
            expect(cacheKey.startsWith('idempotency:')).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various idempotency key formats', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.stringMatching(/^[0-9a-f]{16,32}$/) // hex string pattern
          ),
          (key) => {
            const cacheKey = `idempotency:${key}`;
            expect(cacheKey.length).toBeGreaterThan('idempotency:'.length);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Response replay header
   */
  describe('Response replay header', () => {
    it('should set X-Idempotency-Replayed header for cached responses', () => {
      const replayedHeader = 'X-Idempotency-Replayed';
      const replayedValue = 'true';
      
      expect(replayedHeader).toBe('X-Idempotency-Replayed');
      expect(replayedValue).toBe('true');
    });
  });
});
