/**
 * Redis-based Rate Limiter Middleware
 *
 * Implements sliding window rate limiting using Redis sorted sets.
 * Falls back to in-memory rate limiting if Redis is not available.
 *
 * **Feature: production-readiness**
 * **Requirements: FR-3.2, 7.1, 7.2**
 */

import type { Context, Next } from 'hono';
import { getRedisClient, isRedisConnected } from '../config/redis';
import { logger } from '../utils/logger';
import { checkLimit as inMemoryCheckLimit, resetLimit as inMemoryResetLimit } from './rate-limiter';
import { logViolation } from '../services/rate-limit-monitoring.service';
import { recordRateLimitViolation } from './ip-blocking';

// ============================================
// TYPES
// ============================================

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

interface RedisRateLimiterOptions {
  maxAttempts?: number;
  windowMs?: number;
  keyPrefix?: string;
  keyGenerator?: (c: Context) => string;
}

// ============================================
// REDIS RATE LIMITER FUNCTIONS
// ============================================

/**
 * Check rate limit using Redis sliding window algorithm
 * Uses sorted sets with timestamps as scores
 */
async function checkLimitRedis(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    // Fallback to in-memory rate limiter
    logger.debug('Redis not available, using in-memory rate limiter');
    return inMemoryCheckLimit(key, maxAttempts, windowMs);
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const resetAt = new Date(now + windowMs);


  try {
    // Use Redis transaction for atomic operations
    const pipeline = redis.pipeline();
    
    // Remove expired entries (outside the window)
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current entries in window
    pipeline.zcard(key);
    
    // Add current request with timestamp as score
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiry on the key (cleanup)
    pipeline.expire(key, Math.ceil(windowMs / 1000) + 60);
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline returned null');
    }
    
    // Get count from zcard result (index 1)
    const countResult = results[1];
    const currentCount = countResult && countResult[1] ? Number(countResult[1]) : 0;
    
    // Check if over limit (count is before adding current request)
    if (currentCount >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }
    
    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - currentCount - 1),
      resetAt,
    };
  } catch (error) {
    logger.error('Redis rate limiter error, falling back to in-memory', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
    });
    // Fallback to in-memory on error
    return inMemoryCheckLimit(key, maxAttempts, windowMs);
  }
}

/**
 * Reset rate limit for a key in Redis
 */
async function resetLimitRedis(key: string): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    inMemoryResetLimit(key);
    return;
  }

  try {
    await redis.del(key);
  } catch (error) {
    logger.error('Redis reset limit error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
    });
    inMemoryResetLimit(key);
  }
}


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get client IP from request
 */
function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Redis-based rate limiter middleware factory
 * Falls back to in-memory if Redis is not available
 * 
 * @param options - Rate limiter configuration
 * @returns Hono middleware
 * 
 * @example
 * ```ts
 * // Basic usage
 * app.use('/api/auth/login', redisRateLimiter({ maxAttempts: 5, windowMs: 60000 }));
 * 
 * // Custom key generator
 * app.use('/api/leads', redisRateLimiter({
 *   maxAttempts: 10,
 *   windowMs: 60000,
 *   keyGenerator: (c) => `leads:${getClientIp(c)}`
 * }));
 * ```
 */
export function redisRateLimiter(options: RedisRateLimiterOptions = {}) {
  const {
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000, // 15 minutes
    keyPrefix = 'ratelimit',
    keyGenerator = (c) => getClientIp(c),
  } = options;

  return async (c: Context, next: Next) => {
    const clientKey = keyGenerator(c);
    const key = `${keyPrefix}:${clientKey}`;
    
    const result = await checkLimitRedis(key, maxAttempts, windowMs);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxAttempts.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      // Log violation for monitoring
      // **Property 15: Rate limit violation logging**
      // **Validates: Requirements 7.1**
      const ip = getClientIp(c);
      const path = c.req.path;
      const userAgent = c.req.header('user-agent');
      const user = c.get('user');
      
      await logViolation({
        ip,
        path,
        timestamp: Date.now(),
        userAgent,
        userId: user?.id,
      });

      // Record violation for IP blocking auto-block feature
      // **Feature: high-traffic-resilience**
      // **Requirements: 14.1**
      await recordRateLimitViolation(ip);

      return c.json(
        {
          error: {
            code: 'AUTH_RATE_LIMITED',
            message: 'Too many attempts. Please try again later.',
            retryAfter,
          },
        },
        429
      );
    }

    await next();
  };
}

/**
 * Login-specific Redis rate limiter
 * Uses IP as key for rate limiting
 * Development mode: 100 attempts per 15 minutes
 * Production mode: 5 attempts per 15 minutes
 */
export function loginRedisRateLimiter() {
  const isDev = process.env.NODE_ENV !== 'production';
  return redisRateLimiter({
    maxAttempts: isDev ? 100 : 5,
    windowMs: 15 * 60 * 1000,
    keyPrefix: 'ratelimit:login',
    keyGenerator: (c) => getClientIp(c),
  });
}

/**
 * Clear rate limit for a specific key
 */
export async function clearRateLimit(key: string): Promise<void> {
  await resetLimitRedis(key);
}

/**
 * Clear all rate limits with a specific prefix
 * Use with caution - mainly for testing
 */
export async function clearAllRateLimits(prefix = 'ratelimit'): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis || !isRedisConnected()) {
    logger.warn('Redis not available, cannot clear rate limits');
    return;
  }

  try {
    const keys = await redis.keys(`${prefix}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cleared ${keys.length} rate limit keys`);
    }
  } catch (error) {
    logger.error('Failed to clear rate limits', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
