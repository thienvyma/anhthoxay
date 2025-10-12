import { Context } from 'hono';
import { z } from 'zod';

/**
 * Validation middleware factory
 * Validates request body against a Zod schema
 */
export function validate<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      
      // Store validated data in context for use in handler
      c.set('validatedData' as never, validated);
      
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Validation failed',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          400
        );
      }
      return c.json({ error: 'Invalid request body' }, 400);
    }
  };
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based solution
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const rateLimitStore: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetAt < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyGenerator?: (c: Context) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Simple rate limiting middleware
 * Limits requests per IP address
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator, skipSuccessfulRequests = false } = options;

  return async (c: Context, next: () => Promise<void>) => {
    // Generate key (default: IP address)
    const key = keyGenerator
      ? keyGenerator(c)
      : c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    const now = Date.now();
    const record = rateLimitStore[key];

    // Initialize or reset if window expired
    if (!record || record.resetAt < now) {
      rateLimitStore[key] = {
        count: 1,
        resetAt: now + windowMs,
      };
      await next();
      return;
    }

    // Check if limit exceeded
    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      c.header('Retry-After', retryAfter.toString());
      c.header('X-RateLimit-Limit', max.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', new Date(record.resetAt).toISOString());

      return c.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        429
      );
    }

    // Increment counter before processing
    const previousCount = record.count;
    record.count++;

    // Set rate limit headers
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', (max - record.count).toString());
    c.header('X-RateLimit-Reset', new Date(record.resetAt).toISOString());

    await next();

    // If skipSuccessfulRequests and request was successful, rollback count
    if (skipSuccessfulRequests && c.res.status < 400) {
      record.count = previousCount;
    }
  };
}

/**
 * Sanitize string input to prevent XSS
 * Basic implementation - for production use a library like DOMPurify
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML tags
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

