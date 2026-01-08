import type { Context, Next } from 'hono';
import { logViolation } from '../services/rate-limit-monitoring.service';
import { recordRateLimitViolation } from './ip-blocking';

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
 * 
 * SECURITY NOTE: x-forwarded-for can be spoofed by clients.
 * This should only be trusted when behind a trusted reverse proxy
 * (e.g., Cloud Run, nginx, load balancer) that overwrites this header.
 * 
 * For Cloud Run: The first IP in x-forwarded-for is set by Google's load balancer
 * and can be trusted. Additional IPs may be spoofed.
 */
function getClientIp(c: Context): string {
  // In production behind a trusted proxy, use x-forwarded-for
  // The proxy should be configured to overwrite (not append) this header
  const forwardedFor = c.req.header('x-forwarded-for');
  
  if (forwardedFor) {
    // Take only the first IP (set by the trusted proxy)
    // Additional IPs in the chain may be spoofed by the client
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp && isValidIp(firstIp)) {
      return firstIp;
    }
  }
  
  // Fallback to x-real-ip (set by some proxies like nginx)
  const realIp = c.req.header('x-real-ip');
  if (realIp && isValidIp(realIp)) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Basic IP address validation
 * Prevents header injection attacks
 */
function isValidIp(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Pattern.test(ip)) {
    // Validate each octet is 0-255
    const octets = ip.split('.');
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Pattern.test(ip);
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Rate limiter middleware factory
 * Default: 5 attempts per 15 minutes
 * 
 * **Feature: production-scalability**
 * **Requirements: 7.1**
 */
export function rateLimiter(options: RateLimiterOptions = {}) {
  const {
    maxAttempts = 5,
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

      // Log violation for monitoring
      // **Property 15: Rate limit violation logging**
      // **Validates: Requirements 7.1**
      const ip = getClientIp(c);
      const path = c.req.path;
      const userAgent = c.req.header('user-agent');
      const user = c.get('user');
      
      // Fire and forget - don't block the response
      logViolation({
        ip,
        path,
        timestamp: Date.now(),
        userAgent,
        userId: user?.id,
      }).catch(() => {
        // Ignore errors in violation logging
      });

      // Record violation for IP blocking auto-block feature
      // **Feature: high-traffic-resilience**
      // **Requirements: 14.1**
      recordRateLimitViolation(ip).catch(() => {
        // Ignore errors in IP blocking
      });

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
 */
export function loginRateLimiter() {
  const isDev = process.env.NODE_ENV !== 'production';
  return rateLimiter({
    maxAttempts: isDev ? 100 : 5,
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
