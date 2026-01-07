/**
 * Correlation ID Middleware for Distributed Tracing
 *
 * Provides request tracing across services with support for:
 * - X-Request-ID header propagation (standard)
 * - X-Correlation-ID header (legacy support)
 * - Child context creation for spans
 * - External service header injection
 *
 * **Feature: high-traffic-resilience**
 * **Validates: Requirements 10.1, 10.3, 10.4, 10.5**
 */

import { Context, Next } from 'hono';
import { randomUUID } from 'crypto';

// Header names
const REQUEST_ID_HEADER = 'X-Request-ID';
const CORRELATION_ID_HEADER = 'X-Correlation-ID';
const PARENT_ID_HEADER = 'X-Parent-ID';
const SPAN_ID_HEADER = 'X-Span-ID';

/**
 * Correlation context for distributed tracing
 */
export interface CorrelationContext {
  /** Main correlation ID for the request chain */
  correlationId: string;
  /** Parent span ID (if this is a child context) */
  parentId?: string;
  /** Current span ID */
  spanId: string;
  /** Timestamp when context was created */
  timestamp: number;
}

/**
 * Generate a unique ID
 * Uses UUID v4 for uniqueness across distributed systems
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Generate a shorter span ID (8 chars)
 * Used for span identification within a trace
 */
export function generateSpanId(): string {
  return randomUUID().substring(0, 8);
}

/**
 * Generate a unique correlation ID
 * @deprecated Use generateId() instead
 */
export function generateCorrelationId(): string {
  return generateId();
}

/**
 * Create a new correlation context
 *
 * @param correlationId - Optional existing correlation ID to use
 * @param parentId - Optional parent span ID
 * @returns New correlation context
 */
export function createCorrelationContext(
  correlationId?: string,
  parentId?: string
): CorrelationContext {
  return {
    correlationId: correlationId || generateId(),
    parentId,
    spanId: generateSpanId(),
    timestamp: Date.now(),
  };
}

/**
 * Create a child context from a parent context
 * Used for creating spans within a trace
 *
 * @param parent - Parent correlation context
 * @returns Child correlation context with same correlationId but new spanId
 */
export function createChildContext(parent: CorrelationContext): CorrelationContext {
  return {
    correlationId: parent.correlationId,
    parentId: parent.spanId,
    spanId: generateSpanId(),
    timestamp: Date.now(),
  };
}

/**
 * Extract correlation context from incoming request headers
 *
 * Supports both X-Request-ID (standard) and X-Correlation-ID (legacy)
 *
 * @param headers - Request headers object or Headers instance
 * @returns Correlation context extracted from headers
 */
export function extractCorrelationContext(
  headers: Headers | Record<string, string | undefined>
): CorrelationContext {
  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) || undefined;
    }
    return headers[name] || headers[name.toLowerCase()];
  };

  // Prefer X-Request-ID, fall back to X-Correlation-ID
  const correlationId =
    getHeader(REQUEST_ID_HEADER) ||
    getHeader(CORRELATION_ID_HEADER) ||
    generateId();

  const parentId = getHeader(PARENT_ID_HEADER);
  const spanId = getHeader(SPAN_ID_HEADER) || generateSpanId();

  return {
    correlationId,
    parentId,
    spanId,
    timestamp: Date.now(),
  };
}

/**
 * Inject correlation context into outgoing request headers
 * Use this when making external API calls
 *
 * @param context - Correlation context to inject
 * @returns Headers object with correlation headers
 *
 * @example
 * ```ts
 * const headers = injectCorrelationHeaders(context);
 * await fetch('https://api.example.com', { headers });
 * ```
 */
export function injectCorrelationHeaders(
  context: CorrelationContext
): Record<string, string> {
  const headers: Record<string, string> = {
    [REQUEST_ID_HEADER]: context.correlationId,
    [CORRELATION_ID_HEADER]: context.correlationId, // Legacy support
    [SPAN_ID_HEADER]: context.spanId,
  };

  if (context.parentId) {
    headers[PARENT_ID_HEADER] = context.parentId;
  }

  return headers;
}

/**
 * Correlation ID middleware for Hono
 *
 * - Extracts correlation ID from request header if present (X-Request-ID or X-Correlation-ID)
 * - Generates new ID if not present
 * - Creates correlation context with span ID
 * - Stores in Hono context for access by other middleware/routes
 * - Adds to response headers
 *
 * @example
 * ```ts
 * app.use('*', correlationId());
 *
 * // In route handler
 * app.get('/api/test', (c) => {
 *   const id = getCorrelationId(c);
 *   const context = getCorrelationContext(c);
 *   return c.json({ correlationId: id, spanId: context.spanId });
 * });
 * ```
 */
export function correlationId() {
  return async (c: Context, next: Next) => {
    // Extract or create correlation context
    const context = extractCorrelationContext(c.req.raw.headers);

    // Store in Hono context for access by other middleware/routes
    c.set('correlationId', context.correlationId);
    c.set('correlationContext', context);

    // Add to response headers (both standard and legacy)
    c.header(REQUEST_ID_HEADER, context.correlationId);
    c.header(CORRELATION_ID_HEADER, context.correlationId);
    c.header(SPAN_ID_HEADER, context.spanId);

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

/**
 * Helper to get full correlation context from Hono context
 * Returns a new context if not set
 */
export function getCorrelationContext(c: Context): CorrelationContext {
  const context = c.get('correlationContext') as CorrelationContext | undefined;
  if (context) {
    return context;
  }

  // Fallback: create new context
  const correlationId = c.get('correlationId') || generateId();
  return createCorrelationContext(correlationId);
}

/**
 * Create headers for external service calls with correlation context
 * Convenience function that combines getCorrelationContext and injectCorrelationHeaders
 *
 * @param c - Hono context
 * @returns Headers object with correlation headers
 *
 * @example
 * ```ts
 * app.get('/api/external', async (c) => {
 *   const headers = getExternalServiceHeaders(c);
 *   const response = await fetch('https://api.example.com', {
 *     headers: { ...headers, 'Authorization': 'Bearer token' }
 *   });
 *   return c.json(await response.json());
 * });
 * ```
 */
export function getExternalServiceHeaders(c: Context): Record<string, string> {
  const context = getCorrelationContext(c);
  return injectCorrelationHeaders(context);
}

/**
 * Create a child span context for nested operations
 * Use this when you want to track sub-operations within a request
 *
 * @param c - Hono context
 * @returns Child correlation context
 *
 * @example
 * ```ts
 * app.get('/api/complex', async (c) => {
 *   const childContext = createChildSpan(c);
 *   // Use childContext.spanId for logging sub-operations
 *   logger.info('Sub-operation started', { spanId: childContext.spanId });
 * });
 * ```
 */
export function createChildSpan(c: Context): CorrelationContext {
  const parentContext = getCorrelationContext(c);
  return createChildContext(parentContext);
}

export default correlationId;
