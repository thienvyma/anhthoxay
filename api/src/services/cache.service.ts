/**
 * Redis Cache Service
 *
 * Provides a centralized caching layer with TTL support,
 * pattern-based invalidation, and Redis fallback handling.
 *
 * **Feature: production-scalability**
 * **Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 12.5**
 */

import { getRedisClient, isRedisConnected } from '../config/redis';
import { logger } from '../utils/logger';
import { prometheusMetrics } from './prometheus.service';

// ============================================
// TYPES
// ============================================

/**
 * Result from cache operations
 */
export interface CacheResult<T> {
  data: T;
  fromCache: boolean;
}

/**
 * Cache entry stored in Redis
 */
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number;
}

// ============================================
// CACHE KEYS
// ============================================

/**
 * Predefined cache keys for common data
 */
export const CacheKeys = {
  serviceCategories: 'cache:service-categories',
  materials: (categoryId?: string) =>
    categoryId ? `cache:materials:${categoryId}` : 'cache:materials:all',
  settings: 'cache:settings',
  regions: (level?: string) => (level ? `cache:regions:${level}` : 'cache:regions:all'),
  biddingSettings: 'cache:bidding-settings',
};

/**
 * TTL values in seconds
 */
export const CacheTTL = {
  serviceCategories: 300, // 5 minutes
  materials: 300, // 5 minutes
  settings: 60, // 1 minute
  regions: 600, // 10 minutes
  biddingSettings: 60, // 1 minute
};

// ============================================
// CACHE SERVICE CLASS
// ============================================

/**
 * CacheService provides a centralized caching layer
 *
 * Features:
 * - getOrSet: Get cached data or fetch and cache
 * - invalidate: Remove specific cache entries
 * - invalidateByPattern: Remove entries matching a pattern
 * - Connection status tracking with fallback
 *
 * @example
 * ```ts
 * const cacheService = new CacheService();
 *
 * // Get or set with TTL
 * const { data, fromCache } = await cacheService.getOrSet(
 *   'cache:settings',
 *   60,
 *   async () => prisma.settings.findMany()
 * );
 *
 * // Invalidate on update
 * await cacheService.invalidate('cache:settings');
 * ```
 */
export class CacheService {
  /**
   * Get data from cache or fetch and cache it
   *
   * @param key - Cache key
   * @param ttlSeconds - Time to live in seconds
   * @param fetchFn - Function to fetch data if not cached
   * @returns Data and cache status
   * 
   * **Feature: production-scalability**
   * **Requirements: 12.5**
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const redis = getRedisClient();

    // Fallback to database if Redis unavailable
    if (!redis || !isRedisConnected()) {
      logger.warn('Redis unavailable, falling back to database', { key });
      prometheusMetrics.recordCacheMiss();
      return { data: await fetchFn(), fromCache: false };
    }

    try {
      // Try to get from cache
      const cached = await redis.get(key);
      if (cached) {
        const entry = JSON.parse(cached) as CacheEntry<T>;
        logger.debug('Cache hit', { key });
        prometheusMetrics.recordCacheHit();
        return { data: entry.data, fromCache: true };
      }

      // Cache miss - fetch data
      logger.debug('Cache miss', { key });
      prometheusMetrics.recordCacheMiss();
      const data = await fetchFn();

      // Store in cache
      const entry: CacheEntry<T> = {
        data,
        cachedAt: Date.now(),
        ttl: ttlSeconds,
      };
      await redis.setex(key, ttlSeconds, JSON.stringify(entry));

      return { data, fromCache: false };
    } catch (error) {
      logger.error('Cache error, falling back to database', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      prometheusMetrics.recordCacheMiss();
      return { data: await fetchFn(), fromCache: false };
    }
  }

  /**
   * Get data from cache without fetching
   *
   * @param key - Cache key
   * @returns Cached data or null
   * 
   * **Feature: production-scalability**
   * **Requirements: 12.5**
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();

    if (!redis || !isRedisConnected()) {
      prometheusMetrics.recordCacheMiss();
      return null;
    }

    try {
      const cached = await redis.get(key);
      if (cached) {
        const entry = JSON.parse(cached) as CacheEntry<T>;
        prometheusMetrics.recordCacheHit();
        return entry.data;
      }
      prometheusMetrics.recordCacheMiss();
      return null;
    } catch (error) {
      logger.error('Cache get error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      prometheusMetrics.recordCacheMiss();
      return null;
    }
  }

  /**
   * Set data in cache
   *
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Time to live in seconds
   */
  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    const redis = getRedisClient();

    if (!redis || !isRedisConnected()) {
      logger.warn('Redis unavailable, skipping cache set', { key });
      return;
    }

    try {
      const entry: CacheEntry<T> = {
        data,
        cachedAt: Date.now(),
        ttl: ttlSeconds,
      };
      await redis.setex(key, ttlSeconds, JSON.stringify(entry));
      logger.debug('Cache set', { key, ttl: ttlSeconds });
    } catch (error) {
      logger.error('Cache set error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Invalidate a specific cache entry
   *
   * @param key - Cache key to invalidate
   */
  async invalidate(key: string): Promise<void> {
    const redis = getRedisClient();

    if (!redis || !isRedisConnected()) {
      return;
    }

    try {
      await redis.del(key);
      logger.info('Cache invalidated', { key });
    } catch (error) {
      logger.error('Cache invalidation error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Invalidate all cache entries matching a pattern
   *
   * @param pattern - Pattern to match (e.g., 'cache:materials:*')
   * @returns Number of keys invalidated
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    const redis = getRedisClient();

    if (!redis || !isRedisConnected()) {
      return 0;
    }

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Cache invalidated by pattern', { pattern, count: keys.length });
        return keys.length;
      }
      return 0;
    } catch (error) {
      logger.error('Cache pattern invalidation error', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Check if cache service is available
   *
   * @returns true if Redis is connected
   */
  isAvailable(): boolean {
    return isRedisConnected();
  }

  /**
   * Get TTL remaining for a key
   *
   * @param key - Cache key
   * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async getTTL(key: string): Promise<number> {
    const redis = getRedisClient();

    if (!redis || !isRedisConnected()) {
      return -2;
    }

    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return -2;
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Singleton cache service instance
 */
export const cacheService = new CacheService();

export default CacheService;
