/**
 * In-Memory Response Caching Middleware
 *
 * Caches GET responses in memory with configurable TTL.
 * Supports cache invalidation and cache-control headers.
 * (Redis removed - using in-memory cache)
 *
 * **Feature: production-readiness**
 * **Requirements: FR-3.3**
 */

import type { Context, Next } from 'hono';
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
  expiresAt: number;
  ttl?: number;
}

// ============================================
// IN-MEMORY CACHE
// ============================================

const memoryCache = new Map<string, CachedResponse>();

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

// ============================================
// CACHE FUNCTIONS
// ============================================

/**
 * Get cached response from memory
 */
async function getCachedResponse(key: string): Promise<CachedResponse | null> {
  const cached = memoryCache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached;
}

/**
 * Set cached response in memory
 */
async function setCachedResponse(
  key: string,
  response: CachedResponse,
  ttl: number
): Promise<void> {
  memoryCache.set(key, response);
  // TTL is handled by cleanup interval, but we store it for reference
  response.ttl = ttl;
}

/**
 * Invalidate cache for a specific key
 */
export async function invalidateCache(key: string): Promise<void> {
  memoryCache.delete(key);
  logger.debug('Cache invalidated', { key });
}

/**
 * Invalidate all cache entries with a specific prefix
 */
export async function invalidateCacheByPrefix(prefix: string): Promise<number> {
  let totalDeleted = 0;
  const pattern = `${prefix}:`;
  
  for (const key of memoryCache.keys()) {
    if (key.startsWith(pattern)) {
      memoryCache.delete(key);
      totalDeleted++;
    }
  }
  
  if (totalDeleted > 0) {
    logger.info(`Invalidated ${totalDeleted} cache entries`, { prefix });
  }
  return totalDeleted;
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Response caching middleware
 * Only caches GET requests with successful responses
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
          expiresAt: Date.now() + (ttl * 1000),
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
