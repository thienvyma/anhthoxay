import { Context, Next } from 'hono';
import { randomUUID } from 'crypto';

const CORRELATION_ID_HEADER = 'X-Correlation-ID';

/**
 * Generate a unique correlation ID
 * Abstracted to utility function for future customization (UUID v4, nanoid, etc.)
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Correlation ID middleware for Hono
 * 
 * - Extracts correlation ID from request header if present
 * - Generates new ID if not present
 * - Stores in Hono context for access by other middleware/routes
 * - Adds to response header
 * 
 * @example
 * ```ts
 * app.use('*', correlationId());
 * 
 * // In route handler
 * app.get('/api/test', (c) => {
 *   const id = getCorrelationId(c);
 *   return c.json({ correlationId: id });
 * });
 * ```
 */
export function correlationId() {
  return async (c: Context, next: Next) => {
    // Get from header or generate new
    const id = c.req.header(CORRELATION_ID_HEADER) || generateCorrelationId();
    
    // Store in context for access by other middleware/routes
    c.set('correlationId', id);
    
    // Add to response header
    c.header(CORRELATION_ID_HEADER, id);
    
    await next();
  };
}

/**
 * Helper to get correlation ID from context
 * Returns 'unknown' if not set (should not happen if middleware is applied)
 */
export function getCorrelationId(c: Context): string {
  return c.get('correlationId') || 'unknown';
}

export default correlationId;
