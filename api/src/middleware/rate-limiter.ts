import type { Context, Next } from 'hono';

// ============================================
// TYPES
// ============================================

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

interface RateLimiterOptions {
  maxAttempts?: number;
  windowMs?: number;
  keyGenerator?: (c: Context) => string;
}

// ============================================
// IN-MEMORY STORE
// ============================================

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.firstAttempt > 15 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================
// RATE LIMITER FUNCTIONS
// ============================================

/**
 * Check if request is within rate limit
 */
export function checkLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // No previous attempts
  if (!entry) {
    store.set(key, { attempts: 1, firstAttempt: now });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  // Window expired, reset
  if (now - entry.firstAttempt > windowMs) {
    store.set(key, { attempts: 1, firstAttempt: now });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  // Within window
  entry.attempts++;
  const resetAt = new Date(entry.firstAttempt + windowMs);

  if (entry.attempts > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - entry.attempts,
    resetAt,
  };
}

/**
 * Reset rate limit for a key
 */
export function resetLimit(key: string): void {
  store.delete(key);
}

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
 * Rate limiter middleware factory
 * Default: 5 attempts per 15 minutes
 * 
 * TODO: [TESTING] Tạm thời tăng default lên 1000. Sau khi test xong cần:
 * 1. Đổi maxAttempts default về 5
 * 2. Xóa comment TODO này
 */
export function rateLimiter(options: RateLimiterOptions = {}) {
  const {
    // TODO: [TESTING] Tạm thời 1000, production cần đổi về 5
    maxAttempts = 1000,
    windowMs = 15 * 60 * 1000, // 15 minutes
    keyGenerator = (c) => getClientIp(c),
  } = options;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const result = checkLimit(key, maxAttempts, windowMs);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxAttempts.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

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
 * Login-specific rate limiter
 * Uses IP + email as key for more granular control
 * Development mode: 100 attempts per 15 minutes
 * Production mode: 5 attempts per 15 minutes
 * 
 * TODO: [TESTING] Tạm thời tăng lên 1000 để test. Sau khi test xong cần:
 * 1. Đổi maxAttempts về: isDev ? 100 : 5
 * 2. Xóa comment TODO này
 */
export function loginRateLimiter() {
  const isDev = process.env.NODE_ENV !== 'production';
  return rateLimiter({
    // TODO: [TESTING] Tạm thời 1000, production cần đổi về: isDev ? 100 : 5
    maxAttempts: 1000,
    windowMs: 15 * 60 * 1000,
    keyGenerator: (c) => {
      const ip = getClientIp(c);
      // For login, we'll just use IP since email is in body
      return `login:${ip}`;
    },
  });
}

/**
 * Clear all rate limits (for development/testing)
 */
export function clearAllLimits(): void {
  store.clear();
}
