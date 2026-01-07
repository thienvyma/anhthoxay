/**
 * Redis-based Response Caching Middleware
 *
 * Caches GET responses in Redis with configurable TTL.
 * Supports cache invalidation and cache-control headers.
 *
 * **Feature: production-readiness**
 * **Requirements: FR-3.3**
 */

import type { Context, Next } from 'hono';
import { getRedisClient, isRedisConnected } from '../config/redis';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Key prefix for cache entries */
  keyPrefix?: string;
  /** Custom key generator */
  keyGenerator?: (c: Context) => string;
  /** Skip cache for certain conditions */
  skip?: (c: Context) => boolean;
}

interface CachedResponse {
  body: string;
  contentType: string;
  status: number;
  cachedAt: number;
}


// ============================================
// CACHE FUNCTIONS
// ============================================

/**
 * Get cached response from Redis
 */
async function getCachedResponse(key: string): Promise<CachedResponse | null> {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    return null;
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as CachedResponse;
    }
    return null;
  } catch (error) {
    logger.error('Cache get error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
    });
    return null;
  }
}

/**
 * Set cached response in Redis
 */
async function setCachedResponse(
  key: string,
  response: CachedResponse,
  ttl: number
): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    return;
  }

  try {
    await redis.setex(key, ttl, JSON.stringify(response));
  } catch (error) {
    logger.error('Cache set error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
    });
  }
}


/**
 * Invalidate cache for a specific key
 */
export async function invalidateCache(key: string): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    return;
  }

  try {
    await redis.del(key);
    logger.debug('Cache invalidated', { key });
  } catch (error) {
    logger.error('Cache invalidation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
    });
  }
}

/**
 * Invalidate all cache entries with a specific prefix
 */
export async function invalidateCacheByPrefix(prefix: string): Promise<number> {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    return 0;
  }

  try {
    const keys = await redis.keys(`${prefix}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Invalidated ${keys.length} cache entries`, { prefix });
      return keys.length;
    }
    return 0;
  } catch (error) {
    logger.error('Cache prefix invalidation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      prefix,
    });
    return 0;
  }
}


// ============================================
// MIDDLEWARE
// ============================================

/**
 * Response caching middleware
 * Only caches GET requests with successful responses
 * 
 * @param options - Cache configuration
 * @returns Hono middleware
 * 
 * @example
 * ```ts
 * // Cache for 5 minutes
 * app.get('/api/settings', cache({ ttl: 300 }), handler);
 * 
 * // Cache with custom key
 * app.get('/api/regions', cache({ 
 *   ttl: 3600,
 *   keyGenerator: (c) => `regions:${c.req.query('level') || 'all'}`
 * }), handler);
 * ```
 */
export function cache(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'cache',
    keyGenerator = (c) => c.req.url,
    skip = () => false,
  } = options;

  return async (c: Context, next: Next) => {
    // Only cache GET requests
    if (c.req.method !== 'GET') {
      await next();
      return;
    }

    // Check skip condition
    if (skip(c)) {
      c.header('X-Cache-Status', 'SKIP');
      await next();
      return;
    }

    // Check if Redis is available
    if (!isRedisConnected()) {
      c.header('X-Cache-Status', 'DISABLED');
      await next();
      return;
    }

    const cacheKey = `${keyPrefix}:${keyGenerator(c)}`;


    // Try to get cached response
    const cached = await getCachedResponse(cacheKey);
    
    if (cached) {
      // Return cached response
      c.header('X-Cache-Status', 'HIT');
      c.header('X-Cache-Age', String(Math.floor((Date.now() - cached.cachedAt) / 1000)));
      c.header('Content-Type', cached.contentType);
      return c.body(cached.body, cached.status as 200);
    }

    // Cache miss - proceed with request
    c.header('X-Cache-Status', 'MISS');
    
    await next();

    // Only cache successful responses
    const response = c.res;
    if (response.status >= 200 && response.status < 300) {
      try {
        const body = await response.clone().text();
        const contentType = response.headers.get('Content-Type') || 'application/json';
        
        const cacheEntry: CachedResponse = {
          body,
          contentType,
          status: response.status,
          cachedAt: Date.now(),
        };
        
        await setCachedResponse(cacheKey, cacheEntry, ttl);
      } catch (error) {
        logger.error('Failed to cache response', {
          error: error instanceof Error ? error.message : 'Unknown error',
          key: cacheKey,
        });
      }
    }
  };
}

/**
 * Create cache key for settings
 */
export function settingsCacheKey(): string {
  return 'cache:settings:public';
}

/**
 * Create cache key for regions
 */
export function regionsCacheKey(level?: string): string {
  return `cache:regions:${level || 'all'}`;
}

/**
 * Create cache key for blog posts
 */
export function blogPostsCacheKey(page?: number, limit?: number): string {
  return `cache:blog:posts:${page || 1}:${limit || 10}`;
}
