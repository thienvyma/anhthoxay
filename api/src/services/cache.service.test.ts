/**
 * Cache Service Property Tests
 *
 * Property-based tests for Redis cache layer including
 * TTL behavior, invalidation, and cache status headers.
 *
 * **Feature: production-scalability**
 * **Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { CacheService, CacheKeys, CacheTTL } from './cache.service';

// ============================================
// MOCKS
// ============================================

// Mock Redis client
const mockRedisClient = {
  get: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  ttl: vi.fn(),
  scan: vi.fn(),
};

let mockIsConnected = true;

vi.mock('../config/redis', () => ({
  getRedisClient: () => mockRedisClient,
  isRedisConnected: () => mockIsConnected,
}));

vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ============================================
// GENERATORS
// ============================================

/**
 * Generator for cache keys
 */
const cacheKeyGen = fc.string({ minLength: 5, maxLength: 50 }).filter((s) => /^[a-z0-9:_-]+$/.test(s));

/**
 * Generator for TTL values (1 second to 1 hour)
 */
const ttlGen = fc.integer({ min: 1, max: 3600 });

/**
 * Generator for cacheable data - using string for simplicity
 */
const cacheableDataGen = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Generator for service category data
 */
const serviceCategoryGen = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  coefficient: fc.float({ min: Math.fround(0.1), max: Math.fround(10) }),
  isActive: fc.boolean(),
});

/**
 * Generator for material data
 */
const materialGen = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  price: fc.integer({ min: 0, max: 1000000 }),
  categoryId: fc.uuid(),
});

/**
 * Generator for settings data
 */
const settingsGen = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 50 }),
  fc.jsonValue()
);

/**
 * Generator for region data
 */
const regionGen = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  level: fc.integer({ min: 1, max: 3 }),
  isActive: fc.boolean(),
});

// ============================================
// PROPERTY TESTS
// ============================================

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConnected = true;
    cacheService = new CacheService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Property 4: Cache returns data with correct TTL
  // ============================================

  /**
   * **Feature: production-scalability, Property 4: Cache returns data with correct TTL**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   *
   * Property: For any data and TTL, the cache should:
   * 1. Return cached data on hit
   * 2. Store data with correct TTL on miss
   * 3. Fall back to fetch function when Redis unavailable
   */
  describe('Property 4: Cache returns data with correct TTL', () => {
    it('should return cached data on cache hit', async () => {
      await fc.assert(
        fc.asyncProperty(cacheKeyGen, cacheableDataGen, async (key, data) => {
          // Setup: data is in cache
          const cachedEntry = JSON.stringify({
            data,
            cachedAt: Date.now(),
            ttl: 300,
          });
          mockRedisClient.get.mockResolvedValueOnce(cachedEntry);

          const fetchFn = vi.fn().mockResolvedValue('should not be called');
          const result = await cacheService.getOrSet(key, 300, fetchFn);

          // Should return cached data
          expect(result.data).toEqual(data);
          expect(result.fromCache).toBe(true);
          // Fetch function should not be called
          expect(fetchFn).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });

    it('should fetch and cache data on cache miss', async () => {
      await fc.assert(
        fc.asyncProperty(cacheKeyGen, cacheableDataGen, ttlGen, async (key, data, ttl) => {
          // Setup: cache miss
          mockRedisClient.get.mockResolvedValueOnce(null);
          mockRedisClient.setex.mockResolvedValueOnce('OK');

          const fetchFn = vi.fn().mockResolvedValue(data);
          const result = await cacheService.getOrSet(key, ttl, fetchFn);

          // Should return fetched data
          expect(result.data).toEqual(data);
          expect(result.fromCache).toBe(false);
          // Fetch function should be called
          expect(fetchFn).toHaveBeenCalledTimes(1);
          // Data should be cached with correct TTL
          expect(mockRedisClient.setex).toHaveBeenCalledWith(
            key,
            ttl,
            expect.stringContaining('"data"')
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should fall back to fetch when Redis unavailable', async () => {
      mockIsConnected = false;

      await fc.assert(
        fc.asyncProperty(cacheKeyGen, cacheableDataGen, ttlGen, async (key, data, ttl) => {
          const fetchFn = vi.fn().mockResolvedValue(data);
          const result = await cacheService.getOrSet(key, ttl, fetchFn);

          // Should return fetched data
          expect(result.data).toEqual(data);
          expect(result.fromCache).toBe(false);
          // Fetch function should be called
          expect(fetchFn).toHaveBeenCalledTimes(1);
          // Redis should not be called
          expect(mockRedisClient.get).not.toHaveBeenCalled();
          expect(mockRedisClient.setex).not.toHaveBeenCalled();
        }),
        { numRuns: 50 }
      );
    });

    it('should use correct TTL for service categories (5 minutes)', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(serviceCategoryGen, { minLength: 1, maxLength: 5 }), async (categories) => {
          mockRedisClient.get.mockResolvedValueOnce(null);
          mockRedisClient.setex.mockResolvedValueOnce('OK');

          const fetchFn = vi.fn().mockResolvedValue(categories);
          await cacheService.getOrSet(CacheKeys.serviceCategories, CacheTTL.serviceCategories, fetchFn);

          // Should use 5 minute TTL (300 seconds)
          expect(mockRedisClient.setex).toHaveBeenCalledWith(
            CacheKeys.serviceCategories,
            300,
            expect.any(String)
          );
        }),
        { numRuns: 50 }
      );
    });

    it('should use correct TTL for materials (5 minutes)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(materialGen, { minLength: 1, maxLength: 5 }),
          fc.option(fc.uuid(), { nil: undefined }),
          async (materials, categoryId) => {
            mockRedisClient.get.mockResolvedValueOnce(null);
            mockRedisClient.setex.mockResolvedValueOnce('OK');

            const key = CacheKeys.materials(categoryId);
            const fetchFn = vi.fn().mockResolvedValue(materials);
            await cacheService.getOrSet(key, CacheTTL.materials, fetchFn);

            // Should use 5 minute TTL (300 seconds)
            expect(mockRedisClient.setex).toHaveBeenCalledWith(key, 300, expect.any(String));
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should use correct TTL for settings (1 minute)', async () => {
      await fc.assert(
        fc.asyncProperty(settingsGen, async (settings) => {
          mockRedisClient.get.mockResolvedValueOnce(null);
          mockRedisClient.setex.mockResolvedValueOnce('OK');

          const fetchFn = vi.fn().mockResolvedValue(settings);
          await cacheService.getOrSet(CacheKeys.settings, CacheTTL.settings, fetchFn);

          // Should use 1 minute TTL (60 seconds)
          expect(mockRedisClient.setex).toHaveBeenCalledWith(
            CacheKeys.settings,
            60,
            expect.any(String)
          );
        }),
        { numRuns: 50 }
      );
    });

    it('should use correct TTL for regions (10 minutes)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(regionGen, { minLength: 1, maxLength: 5 }),
          fc.option(fc.constantFrom('1', '2', '3'), { nil: undefined }),
          async (regions, level) => {
            mockRedisClient.get.mockResolvedValueOnce(null);
            mockRedisClient.setex.mockResolvedValueOnce('OK');

            const key = CacheKeys.regions(level);
            const fetchFn = vi.fn().mockResolvedValue(regions);
            await cacheService.getOrSet(key, CacheTTL.regions, fetchFn);

            // Should use 10 minute TTL (600 seconds)
            expect(mockRedisClient.setex).toHaveBeenCalledWith(key, 600, expect.any(String));
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ============================================
  // Property 5: Cache invalidation on modification
  // ============================================

  /**
   * **Feature: production-scalability, Property 5: Cache invalidation on modification**
   * **Validates: Requirements 2.5**
   *
   * Property: When data is modified, the relevant cache entries
   * should be invalidated immediately.
   */
  describe('Property 5: Cache invalidation on modification', () => {
    it('should invalidate specific cache key', async () => {
      await fc.assert(
        fc.asyncProperty(cacheKeyGen, async (key) => {
          mockRedisClient.del.mockResolvedValueOnce(1);

          await cacheService.invalidate(key);

          expect(mockRedisClient.del).toHaveBeenCalledWith(key);
        }),
        { numRuns: 100 }
      );
    });

    it('should invalidate all keys matching pattern', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('cache:materials:*', 'cache:regions:*', 'cache:settings:*'),
          fc.integer({ min: 0, max: 10 }),
          async (pattern, keyCount) => {
            // Reset mocks for each iteration
            vi.clearAllMocks();
            
            const matchingKeys = Array.from({ length: keyCount }, (_, i) =>
              pattern.replace('*', `key${i}`)
            );
            // Mock scan to return keys in first call, then '0' cursor to end
            mockRedisClient.scan.mockResolvedValueOnce(['0', matchingKeys]);
            if (keyCount > 0) {
              mockRedisClient.del.mockResolvedValueOnce(keyCount);
            }

            const result = await cacheService.invalidateByPattern(pattern);

            expect(mockRedisClient.scan).toHaveBeenCalledWith('0', 'MATCH', pattern, 'COUNT', 100);
            if (keyCount > 0) {
              expect(mockRedisClient.del).toHaveBeenCalledWith(...matchingKeys);
              expect(result).toBe(keyCount);
            } else {
              expect(result).toBe(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not throw when Redis unavailable during invalidation', async () => {
      mockIsConnected = false;

      await fc.assert(
        fc.asyncProperty(cacheKeyGen, async (key) => {
          // Should not throw
          await expect(cacheService.invalidate(key)).resolves.not.toThrow();
          // Redis should not be called
          expect(mockRedisClient.del).not.toHaveBeenCalled();
        }),
        { numRuns: 50 }
      );
    });

    it('should return 0 when Redis unavailable during pattern invalidation', async () => {
      mockIsConnected = false;

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('cache:materials:*', 'cache:regions:*'),
          async (pattern) => {
            const result = await cacheService.invalidateByPattern(pattern);
            expect(result).toBe(0);
            expect(mockRedisClient.keys).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ============================================
  // Property 6: Cache status header
  // ============================================

  /**
   * **Feature: production-scalability, Property 6: Cache status header**
   * **Validates: Requirements 2.7, 2.8**
   *
   * Property: The cache result should correctly indicate
   * whether data came from cache (HIT) or was fetched (MISS).
   */
  describe('Property 6: Cache status header', () => {
    it('should return fromCache=true on cache hit', async () => {
      await fc.assert(
        fc.asyncProperty(cacheKeyGen, cacheableDataGen, async (key, data) => {
          const cachedEntry = JSON.stringify({
            data,
            cachedAt: Date.now(),
            ttl: 300,
          });
          mockRedisClient.get.mockResolvedValueOnce(cachedEntry);

          const result = await cacheService.getOrSet(key, 300, async () => data);

          // fromCache should be true for cache hit
          expect(result.fromCache).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return fromCache=false on cache miss', async () => {
      await fc.assert(
        fc.asyncProperty(cacheKeyGen, cacheableDataGen, async (key, data) => {
          mockRedisClient.get.mockResolvedValueOnce(null);
          mockRedisClient.setex.mockResolvedValueOnce('OK');

          const result = await cacheService.getOrSet(key, 300, async () => data);

          // fromCache should be false for cache miss
          expect(result.fromCache).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should return fromCache=false when Redis unavailable', async () => {
      mockIsConnected = false;

      await fc.assert(
        fc.asyncProperty(cacheKeyGen, cacheableDataGen, async (key, data) => {
          const result = await cacheService.getOrSet(key, 300, async () => data);

          // fromCache should be false when Redis unavailable
          expect(result.fromCache).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve data integrity regardless of cache status', async () => {
      await fc.assert(
        fc.asyncProperty(cacheKeyGen, cacheableDataGen, fc.boolean(), async (key, data, isCached) => {
          if (isCached) {
            const cachedEntry = JSON.stringify({
              data,
              cachedAt: Date.now(),
              ttl: 300,
            });
            mockRedisClient.get.mockResolvedValueOnce(cachedEntry);
          } else {
            mockRedisClient.get.mockResolvedValueOnce(null);
            mockRedisClient.setex.mockResolvedValueOnce('OK');
          }

          const result = await cacheService.getOrSet(key, 300, async () => data);

          // Data should be identical regardless of cache status
          expect(result.data).toEqual(data);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Additional Tests
  // ============================================

  describe('Cache Key Generation', () => {
    it('should generate correct service categories key', () => {
      expect(CacheKeys.serviceCategories).toBe('cache:service-categories');
    });

    it('should generate correct materials key with category', () => {
      fc.assert(
        fc.property(fc.uuid(), (categoryId) => {
          const key = CacheKeys.materials(categoryId);
          expect(key).toBe(`cache:materials:${categoryId}`);
        }),
        { numRuns: 50 }
      );
    });

    it('should generate correct materials key without category', () => {
      expect(CacheKeys.materials()).toBe('cache:materials:all');
      expect(CacheKeys.materials(undefined)).toBe('cache:materials:all');
    });

    it('should generate correct regions key with level', () => {
      fc.assert(
        fc.property(fc.constantFrom('1', '2', '3'), (level) => {
          const key = CacheKeys.regions(level);
          expect(key).toBe(`cache:regions:${level}`);
        }),
        { numRuns: 10 }
      );
    });

    it('should generate correct regions key without level', () => {
      expect(CacheKeys.regions()).toBe('cache:regions:all');
      expect(CacheKeys.regions(undefined)).toBe('cache:regions:all');
    });
  });

  describe('TTL Values', () => {
    it('should have correct TTL for service categories', () => {
      expect(CacheTTL.serviceCategories).toBe(300); // 5 minutes
    });

    it('should have correct TTL for materials', () => {
      expect(CacheTTL.materials).toBe(300); // 5 minutes
    });

    it('should have correct TTL for settings', () => {
      expect(CacheTTL.settings).toBe(60); // 1 minute
    });

    it('should have correct TTL for regions', () => {
      expect(CacheTTL.regions).toBe(600); // 10 minutes
    });
  });

  describe('isAvailable', () => {
    it('should return true when Redis is connected', () => {
      mockIsConnected = true;
      expect(cacheService.isAvailable()).toBe(true);
    });

    it('should return false when Redis is disconnected', () => {
      mockIsConnected = false;
      expect(cacheService.isAvailable()).toBe(false);
    });
  });
});
