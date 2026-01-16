/**
 * Cache Service
 *
 * Provides a centralized caching layer with TTL support.
 * Uses in-memory storage. For distributed caching,
 * consider using Firebase or external cache service.
 */

import { logger } from '../utils/logger';
import { prometheusMetrics } from './prometheus.service';

// ============================================
// TYPES
// ============================================

export interface CacheResult<T> {
  data: T;
  fromCache: boolean;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

// ============================================
// IN-MEMORY CACHE STORE
// ============================================

const cacheStore: Map<string, CacheEntry<unknown>> = new Map();

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt <= now) {
      cacheStore.delete(key);
    }
  }
}, 60 * 1000);

// ============================================
// CACHE KEYS
// ============================================

export const CacheKeys = {
  serviceCategories: 'cache:service-categories',
  materials: (categoryId?: string) =>
    categoryId ? `cache:materials:${categoryId}` : 'cache:materials:all',
  settings: 'cache:settings',
  regions: (level?: string) => (level ? `cache:regions:${level}` : 'cache:regions:all'),
  biddingSettings: 'cache:bidding-settings',
};

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

export class CacheService {
  /**
   * Get data from cache or fetch and cache it
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    try {
      const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
      
      if (cached && cached.expiresAt > Date.now()) {
        logger.debug('Cache hit', { key });
        prometheusMetrics.recordCacheHit();
        return { data: cached.data, fromCache: true };
      }

      // Cache miss - fetch data
      logger.debug('Cache miss', { key });
      prometheusMetrics.recordCacheMiss();
      const data = await fetchFn();

      // Store in cache
      const entry: CacheEntry<T> = {
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttlSeconds * 1000,
      };
      cacheStore.set(key, entry);

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
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
      
      if (cached && cached.expiresAt > Date.now()) {
        prometheusMetrics.recordCacheHit();
        return cached.data;
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
   */
  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttlSeconds * 1000,
      };
      cacheStore.set(key, entry);
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
   */
  async invalidate(key: string): Promise<void> {
    cacheStore.delete(key);
    logger.info('Cache invalidated', { key });
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;
    
    for (const key of cacheStore.keys()) {
      if (regex.test(key)) {
        cacheStore.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      logger.info('Cache invalidated by pattern', { pattern, count });
    }
    return count;
  }

  /**
   * Check if cache service is available
   */
  isAvailable(): boolean {
    return true; // In-memory cache is always available
  }

  /**
   * Get TTL remaining for a key
   */
  async getTTL(key: string): Promise<number> {
    const cached = cacheStore.get(key);
    if (!cached) return -2;
    
    const remaining = Math.ceil((cached.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  /**
   * Clear all cache entries (for testing)
   */
  clear(): void {
    cacheStore.clear();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const cacheService = new CacheService();

export default CacheService;
