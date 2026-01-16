/**
 * Idempotency Middleware
 *
 * Ensures that duplicate requests with the same Idempotency-Key header
 * return the same response without re-processing.
 * Uses in-memory cache (Redis removed).
 *
 * **Feature: production-scalability**
 * **Requirements: 6.1, 6.2, 6.3, 6.4, 6.5**
 */

import { Context, Next } from 'hono';
import { logger } from '../utils/logger';

/**
 * TTL for idempotency cache entries (24 hours)
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
 * In-memory cache for idempotency
 */
const idempotencyCache = new Map<string, IdempotencyEntry>();

/**
 * Get idempotency TTL for testing
 */
export function getIdempotencyTTL(): number {
  return IDEMPOTENCY_TTL;
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const ttlMs = IDEMPOTENCY_TTL * 1000;
  
  for (const [key, entry] of idempotencyCache.entries()) {
    if (now - entry.createdAt > ttlMs) {
      idempotencyCache.delete(key);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

/**
 * Idempotency middleware factory
 *
 * When a request includes an Idempotency-Key header:
 * 1. Check if we have a cached response for this key
 * 2. If yes, return the cached response with X-Idempotency-Replayed header
 * 3. If no, process the request and cache the response
 *
 * Requests without Idempotency-Key are processed normally.
 */
export function idempotencyMiddleware() {
  return async (c: Context, next: Next) => {
    const idempotencyKey = c.req.header('Idempotency-Key');

    // Requests without idempotency key are processed normally
    if (!idempotencyKey) {
      return next();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;

    try {
      // Check for existing cached response
      const cached = idempotencyCache.get(cacheKey);

      if (cached) {
        // Check if entry is still valid
        const now = Date.now();
        const ttlMs = IDEMPOTENCY_TTL * 1000;
        
        if (now - cached.createdAt <= ttlMs) {
          logger.info('[IDEMPOTENCY] Returning cached response', {
            idempotencyKey,
            originalCreatedAt: new Date(cached.createdAt).toISOString(),
          });

          // Set cached headers
          Object.entries(cached.headers).forEach(([key, value]) => {
            c.header(key, value);
          });

          // Mark as replayed response
          c.header('X-Idempotency-Replayed', 'true');

          // Return cached response
          return c.json(cached.body, cached.status as 200 | 201 | 400 | 404 | 500);
        } else {
          // Entry expired, remove it
          idempotencyCache.delete(cacheKey);
        }
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
          idempotencyCache.set(cacheKey, entry);

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
 */
export async function getIdempotencyEntry(idempotencyKey: string): Promise<IdempotencyEntry | null> {
  const cacheKey = `idempotency:${idempotencyKey}`;
  const cached = idempotencyCache.get(cacheKey);

  if (!cached) return null;

  // Check if entry is still valid
  const now = Date.now();
  const ttlMs = IDEMPOTENCY_TTL * 1000;
  
  if (now - cached.createdAt > ttlMs) {
    idempotencyCache.delete(cacheKey);
    return null;
  }

  return cached;
}

/**
 * Clear an idempotency entry (for testing)
 */
export async function clearIdempotencyEntry(idempotencyKey: string): Promise<void> {
  const cacheKey = `idempotency:${idempotencyKey}`;
  idempotencyCache.delete(cacheKey);
}
