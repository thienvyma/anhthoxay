/**
 * Per-User Rate Limiter Middleware
 *
 * Provides rate limiting based on authenticated user ID in addition to IP.
 * Supports role-based rate limit multipliers.
 *
 * **Feature: production-scalability**
 * **Requirements: 15.1, 15.2, 15.3, 15.4, 15.5**
 */

import type { Context, Next } from 'hono';
import { logViolation } from '../services/rate-limit-monitoring.service';

// ============================================
// TYPES
// ============================================

interface UserRateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

interface UserRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

interface UserRateLimiterOptions {
  /** Base rate limit for regular users (default: 100) */
  baseLimit?: number;
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
  /** Role-based multipliers (default: ADMIN=5, MANAGER=3, others=1) */
  roleMultipliers?: Record<string, number>;
}

/**
 * User info from auth context
 */
interface AuthUser {
  id: string;
  role: string;
  email?: string;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Default role multipliers
 * Requirements: 15.3, 15.4
 */
export const DEFAULT_ROLE_MULTIPLIERS: Record<string, number> = {
  ADMIN: 5,
  MANAGER: 3,
  CONTRACTOR: 1,
  HOMEOWNER: 1,
  WORKER: 1,
  USER: 1,
};

/**
 * Default base limit (requests per window)
 */
export const DEFAULT_BASE_LIMIT = 100;

/**
 * Default window in milliseconds (1 minute)
 */
export const DEFAULT_WINDOW_MS = 60000;

// ============================================
// IN-MEMORY STORE
// ============================================

const userStore = new Map<string, UserRateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userStore.entries()) {
    // Remove entries older than 15 minutes
    if (now - entry.firstAttempt > 15 * 60 * 1000) {
      userStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================
// RATE LIMIT FUNCTIONS
// ============================================

/**
 * Get rate limit for a user based on their role
 * Requirements: 15.3, 15.4
 *
 * @param role - User role
 * @param baseLimit - Base rate limit
 * @param roleMultipliers - Role-based multipliers
 * @returns Effective rate limit for the user
 */
export function getRateLimitForRole(
  role: string,
  baseLimit: number,
  roleMultipliers: Record<string, number>
): number {
  const multiplier = roleMultipliers[role] ?? 1;
  return Math.floor(baseLimit * multiplier);
}

/**
 * Check if user request is within rate limit
 * Requirements: 15.1, 15.5
 *
 * @param userId - User ID
 * @param limit - Rate limit for this user
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
export function checkUserLimit(
  userId: string,
  limit: number,
  windowMs: number
): UserRateLimitResult {
  const now = Date.now();
  const key = `user:${userId}`;
  const entry = userStore.get(key);

  // No previous attempts
  if (!entry) {
    userStore.set(key, { attempts: 1, firstAttempt: now });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowMs),
      limit,
    };
  }

  // Window expired, reset
  if (now - entry.firstAttempt > windowMs) {
    userStore.set(key, { attempts: 1, firstAttempt: now });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowMs),
      limit,
    };
  }

  // Within window
  entry.attempts++;
  const resetAt = new Date(entry.firstAttempt + windowMs);

  if (entry.attempts > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      limit,
    };
  }

  return {
    allowed: true,
    remaining: limit - entry.attempts,
    resetAt,
    limit,
  };
}

/**
 * Reset rate limit for a user
 *
 * @param userId - User ID
 */
export function resetUserLimit(userId: string): void {
  userStore.delete(`user:${userId}`);
}

/**
 * Get current rate limit status for a user (without incrementing)
 *
 * @param userId - User ID
 * @param limit - Rate limit for this user
 * @param windowMs - Time window in milliseconds
 * @returns Current rate limit status
 */
export function getUserLimitStatus(
  userId: string,
  limit: number,
  windowMs: number
): UserRateLimitResult {
  const now = Date.now();
  const key = `user:${userId}`;
  const entry = userStore.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(now + windowMs),
      limit,
    };
  }

  const resetAt = new Date(entry.firstAttempt + windowMs);
  const remaining = Math.max(0, limit - entry.attempts);

  return {
    allowed: entry.attempts < limit,
    remaining,
    resetAt,
    limit,
  };
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Per-user rate limiter middleware factory
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 *
 * This middleware should be applied AFTER authentication middleware
 * to have access to the authenticated user.
 *
 * @example
 * ```ts
 * // Apply to authenticated routes
 * app.use('/api/protected/*', authenticate(), userRateLimiter());
 *
 * // With custom options
 * app.use('/api/heavy/*', authenticate(), userRateLimiter({
 *   baseLimit: 50,
 *   windowMs: 60000,
 *   roleMultipliers: { ADMIN: 10, MANAGER: 5 }
 * }));
 * ```
 */
export function userRateLimiter(options: UserRateLimiterOptions = {}) {
  const {
    baseLimit = DEFAULT_BASE_LIMIT,
    windowMs = DEFAULT_WINDOW_MS,
    roleMultipliers = DEFAULT_ROLE_MULTIPLIERS,
  } = options;

  return async (c: Context, next: Next) => {
    // Get authenticated user from context
    const user = c.get('user') as AuthUser | undefined;

    // If no authenticated user, skip user rate limiting
    // (IP-based rate limiting should still apply via rateLimiter middleware)
    if (!user?.id) {
      await next();
      return;
    }

    // Calculate rate limit based on user's role
    const userLimit = getRateLimitForRole(user.role, baseLimit, roleMultipliers);

    // Check user rate limit
    const result = checkUserLimit(user.id, userLimit, windowMs);

    // Set user-specific rate limit headers
    // Requirements: 15.2
    c.header('X-RateLimit-User-Limit', result.limit.toString());
    c.header('X-RateLimit-User-Remaining', result.remaining.toString());
    c.header('X-RateLimit-User-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      // Log violation for monitoring
      const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
                 c.req.header('x-real-ip') ||
                 'unknown';
      const path = c.req.path;
      const userAgent = c.req.header('user-agent');

      // Fire and forget - don't block the response
      logViolation({
        ip,
        path,
        timestamp: Date.now(),
        userAgent,
        userId: user.id,
      }).catch(() => {
        // Ignore errors in violation logging
      });

      return c.json(
        {
          success: false,
          error: {
            code: 'USER_RATE_LIMITED',
            message: 'User rate limit exceeded. Please try again later.',
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
 * Clear all user rate limits (for development/testing)
 */
export function clearAllUserLimits(): void {
  userStore.clear();
}

/**
 * Get store size (for testing)
 */
export function getUserStoreSize(): number {
  return userStore.size;
}

export default userRateLimiter;
