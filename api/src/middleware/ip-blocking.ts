/**
 * IP Blocking Middleware
 *
 * Middleware that checks if incoming requests are from blocked IPs
 * and returns 403 Forbidden for blocked IPs.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.1, 14.2**
 */

import type { Context, Next } from 'hono';
import { getIPBlockingService } from '../services/ip-blocking.service';
import { logger } from '../utils/logger';

// ============================================
// Helper Functions
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
// Middleware
// ============================================

/**
 * IP Blocking Middleware
 * 
 * Checks if the request IP is blocked and returns 403 if so.
 * Should be placed early in the middleware chain.
 * 
 * **Property 7: IP Blocking Enforcement**
 * **Validates: Requirements 14.1, 14.2**
 * 
 * @example
 * ```ts
 * // Apply to all routes
 * app.use('*', ipBlockingMiddleware());
 * 
 * // Or apply to specific routes
 * app.use('/api/*', ipBlockingMiddleware());
 * ```
 */
export function ipBlockingMiddleware() {
  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    
    // Skip blocking check for unknown IPs
    if (ip === 'unknown') {
      await next();
      return;
    }

    try {
      const ipBlockingService = getIPBlockingService();
      const isBlocked = await ipBlockingService.isBlocked(ip);

      if (isBlocked) {
        const details = await ipBlockingService.getBlockedIPDetails(ip);
        
        logger.warn('[IP_BLOCKING] Blocked IP attempted access', {
          ip,
          path: c.req.path,
          method: c.req.method,
          userAgent: c.req.header('user-agent'),
          reason: details?.reason,
          expiresAt: details?.expiresAt?.toISOString(),
        });

        return c.json(
          {
            success: false,
            error: {
              code: 'IP_BLOCKED',
              message: 'Your IP address has been temporarily blocked due to suspicious activity.',
            },
            correlationId: c.get('correlationId') || 'unknown',
          },
          403
        );
      }
    } catch (error) {
      // Log error but don't block the request on service failure
      logger.error('[IP_BLOCKING] Middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip,
        path: c.req.path,
      });
    }

    await next();
  };
}

/**
 * Enhanced Rate Limiter with IP Blocking Integration
 * 
 * Wraps the existing rate limiter to record violations for IP blocking.
 * When rate limit is exceeded, records the violation for potential auto-blocking.
 * 
 * @param options - Rate limiter options
 * 
 * @example
 * ```ts
 * app.use('/api/auth/login', rateLimiterWithBlocking({ maxAttempts: 5, windowMs: 60000 }));
 * ```
 */
export function rateLimiterWithBlocking(options: {
  maxAttempts?: number;
  windowMs?: number;
  keyGenerator?: (c: Context) => string;
} = {}) {
  const {
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000,
    keyGenerator = (c) => getClientIp(c),
  } = options;

  // Import the existing rate limiter
  const { checkLimit } = require('./rate-limiter');

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const ip = getClientIp(c);
    const result = checkLimit(key, maxAttempts, windowMs);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxAttempts.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      // Record violation for IP blocking
      try {
        const ipBlockingService = getIPBlockingService();
        await ipBlockingService.recordViolation(ip);
      } catch (error) {
        logger.error('[IP_BLOCKING] Failed to record violation', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip,
        });
      }

      return c.json(
        {
          success: false,
          error: {
            code: 'AUTH_RATE_LIMITED',
            message: 'Too many attempts. Please try again later.',
            retryAfter,
          },
          correlationId: c.get('correlationId') || 'unknown',
        },
        429
      );
    }

    await next();
  };
}

/**
 * Record rate limit violation for IP blocking
 * 
 * Utility function to record a violation from other rate limiters.
 * 
 * @param ip - The IP address that violated rate limits
 */
export async function recordRateLimitViolation(ip: string): Promise<void> {
  try {
    const ipBlockingService = getIPBlockingService();
    await ipBlockingService.recordViolation(ip);
  } catch (error) {
    logger.error('[IP_BLOCKING] Failed to record violation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip,
    });
  }
}
