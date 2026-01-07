/**
 * Idempotency Middleware
 *
 * Ensures that duplicate requests with the same Idempotency-Key header
 * return the same response without re-processing.
 *
 * **Feature: production-scalability**
 * **Requirements: 6.1, 6.2, 6.3, 6.4, 6.5**
 */

import { Context, Next } from 'hono';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * TTL for idempotency cache entries (24 hours)
 * **Feature: production-scalability**
 * **Requirements: 6.3**
 */
const IDEMPOTENCY_TTL = 86400; // 24 hours in seconds

/**
 * Cached response entry structure
 */
interface IdempotencyEntry {
  status: number;
  body: unknown;
  headers: Record<string, string>;
  createdAt: number;
}

/**
 * Get idempotency TTL for testing
 */
export function getIdempotencyTTL(): number {
  return IDEMPOTENCY_TTL;
}

/**
 * Idempotency middleware factory
 *
 * When a request includes an Idempotency-Key header:
 * 1. Check if we have a cached response for this key
 * 2. If yes, return the cached response with X-Idempotency-Replayed header
 * 3. If no, process the request and cache the response
 *
 * Requests without Idempotency-Key are processed normally.
 *
 * **Feature: production-scalability, Property 13: Idempotency duplicate detection**
 * **Validates: Requirements 6.1, 6.2**
 *
 * @example
 * ```typescript
 * app.post('/leads', idempotencyMiddleware(), async (c) => {
 *   // This handler will only run once per unique Idempotency-Key
 * });
 * ```
 */
export function idempotencyMiddleware() {
  return async (c: Context, next: Next) => {
    const idempotencyKey = c.req.header('Idempotency-Key');

    // **Feature: production-scalability, Requirements: 6.4**
    // Requests without idempotency key are processed normally
    if (!idempotencyKey) {
      return next();
    }

    const redis = getRedisClient();

    // If Redis unavailable, process without idempotency
    if (!redis) {
      console.warn('[IDEMPOTENCY] Redis unavailable, processing without idempotency check');
      return next();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;

    try {
      // Check for existing cached response
      const cached = await redis.get(cacheKey);

      if (cached) {
        // **Feature: production-scalability, Property 13: Idempotency duplicate detection**
        // **Validates: Requirements 6.1, 6.2**
        const entry: IdempotencyEntry = JSON.parse(cached);

        logger.info('[IDEMPOTENCY] Returning cached response', {
          idempotencyKey,
          originalCreatedAt: new Date(entry.createdAt).toISOString(),
        });

        // Set cached headers
        Object.entries(entry.headers).forEach(([key, value]) => {
          c.header(key, value);
        });

        // Mark as replayed response
        c.header('X-Idempotency-Replayed', 'true');

        // Return cached response
        return c.json(entry.body, entry.status as 200 | 201 | 400 | 404 | 500);
      }

      // Process the request
      await next();

      // Only cache successful responses (2xx status codes)
      if (c.res.status >= 200 && c.res.status < 300) {
        try {
          // Clone response to read body
          const responseClone = c.res.clone();
          const body = await responseClone.json();

          // Create cache entry
          const entry: IdempotencyEntry = {
            status: c.res.status,
            body,
            headers: {
              'Content-Type': c.res.headers.get('Content-Type') || 'application/json',
            },
            createdAt: Date.now(),
          };

          // Cache the response
          // **Feature: production-scalability, Property 14: Idempotency cache TTL**
          // **Validates: Requirements 6.3, 6.5**
          await redis.setex(cacheKey, IDEMPOTENCY_TTL, JSON.stringify(entry));

          logger.info('[IDEMPOTENCY] Cached response', {
            idempotencyKey,
            status: entry.status,
          });
        } catch (cacheError) {
          // Log but don't fail the request
          console.error('[IDEMPOTENCY] Failed to cache response:', (cacheError as Error).message);
        }
      }
    } catch (error) {
      // Log error but don't fail the request
      console.error('[IDEMPOTENCY] Middleware error:', (error as Error).message);
      return next();
    }
  };
}

/**
 * Check if a response is cached for an idempotency key
 * Useful for testing and debugging
 *
 * @param idempotencyKey - The idempotency key to check
 * @returns The cached entry or null
 */
export async function getIdempotencyEntry(idempotencyKey: string): Promise<IdempotencyEntry | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const cacheKey = `idempotency:${idempotencyKey}`;
  const cached = await redis.get(cacheKey);

  if (!cached) return null;

  return JSON.parse(cached);
}

/**
 * Clear an idempotency entry (for testing)
 *
 * @param idempotencyKey - The idempotency key to clear
 */
export async function clearIdempotencyEntry(idempotencyKey: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const cacheKey = `idempotency:${idempotencyKey}`;
  await redis.del(cacheKey);
}
