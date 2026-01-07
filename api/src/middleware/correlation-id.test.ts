/**
 * Correlation ID Middleware Tests
 *
 * Tests for distributed tracing correlation ID propagation.
 *
 * **Feature: high-traffic-resilience**
 * **Validates: Requirements 10.1, 10.3, 10.4, 10.5**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import {
  correlationId,
  getCorrelationId,
  getCorrelationContext,
  generateId,
  generateSpanId,
  createCorrelationContext,
  createChildContext,
  extractCorrelationContext,
  injectCorrelationHeaders,
  getExternalServiceHeaders,
  createChildSpan,
  type CorrelationContext,
} from './correlation-id';

describe('Correlation ID Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('*', correlationId());
  });

  describe('generateId', () => {
    it('should generate unique UUIDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateSpanId', () => {
    it('should generate 8-character span IDs', () => {
      const spanId = generateSpanId();

      expect(spanId).toHaveLength(8);
      expect(spanId).toMatch(/^[0-9a-f]{8}$/i);
    });

    it('should generate unique span IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSpanId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('createCorrelationContext', () => {
    it('should create context with new correlation ID', () => {
      const context = createCorrelationContext();

      expect(context.correlationId).toBeDefined();
      expect(context.spanId).toBeDefined();
      expect(context.parentId).toBeUndefined();
      expect(context.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should use provided correlation ID', () => {
      const correlationId = 'test-correlation-id';
      const context = createCorrelationContext(correlationId);

      expect(context.correlationId).toBe(correlationId);
    });

    it('should use provided parent ID', () => {
      const parentId = 'parent-span-id';
      const context = createCorrelationContext(undefined, parentId);

      expect(context.parentId).toBe(parentId);
    });
  });

  describe('createChildContext', () => {
    it('should create child with same correlation ID', () => {
      const parent = createCorrelationContext('parent-correlation');
      const child = createChildContext(parent);

      expect(child.correlationId).toBe(parent.correlationId);
    });

    it('should set parent span ID as parentId', () => {
      const parent = createCorrelationContext();
      const child = createChildContext(parent);

      expect(child.parentId).toBe(parent.spanId);
    });

    it('should generate new span ID for child', () => {
      const parent = createCorrelationContext();
      const child = createChildContext(parent);

      expect(child.spanId).not.toBe(parent.spanId);
    });
  });

  describe('extractCorrelationContext', () => {
    it('should extract X-Request-ID header', () => {
      const headers = new Headers();
      headers.set('X-Request-ID', 'request-id-123');

      const context = extractCorrelationContext(headers);

      expect(context.correlationId).toBe('request-id-123');
    });

    it('should fall back to X-Correlation-ID header', () => {
      const headers = new Headers();
      headers.set('X-Correlation-ID', 'correlation-id-456');

      const context = extractCorrelationContext(headers);

      expect(context.correlationId).toBe('correlation-id-456');
    });

    it('should prefer X-Request-ID over X-Correlation-ID', () => {
      const headers = new Headers();
      headers.set('X-Request-ID', 'request-id');
      headers.set('X-Correlation-ID', 'correlation-id');

      const context = extractCorrelationContext(headers);

      expect(context.correlationId).toBe('request-id');
    });

    it('should generate new ID if no header present', () => {
      const headers = new Headers();

      const context = extractCorrelationContext(headers);

      expect(context.correlationId).toBeDefined();
      expect(context.correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('should extract parent and span IDs', () => {
      const headers = new Headers();
      headers.set('X-Request-ID', 'request-id');
      headers.set('X-Parent-ID', 'parent-id');
      headers.set('X-Span-ID', 'span-id');

      const context = extractCorrelationContext(headers);

      expect(context.parentId).toBe('parent-id');
      expect(context.spanId).toBe('span-id');
    });

    it('should work with plain object headers', () => {
      const headers = {
        'X-Request-ID': 'request-id-obj',
        'X-Parent-ID': 'parent-id-obj',
      };

      const context = extractCorrelationContext(headers);

      expect(context.correlationId).toBe('request-id-obj');
      expect(context.parentId).toBe('parent-id-obj');
    });
  });

  describe('injectCorrelationHeaders', () => {
    it('should inject all correlation headers', () => {
      const context: CorrelationContext = {
        correlationId: 'corr-123',
        parentId: 'parent-456',
        spanId: 'span-789',
        timestamp: Date.now(),
      };

      const headers = injectCorrelationHeaders(context);

      expect(headers['X-Request-ID']).toBe('corr-123');
      expect(headers['X-Correlation-ID']).toBe('corr-123');
      expect(headers['X-Parent-ID']).toBe('parent-456');
      expect(headers['X-Span-ID']).toBe('span-789');
    });

    it('should not include parent ID if not set', () => {
      const context: CorrelationContext = {
        correlationId: 'corr-123',
        spanId: 'span-789',
        timestamp: Date.now(),
      };

      const headers = injectCorrelationHeaders(context);

      expect(headers['X-Parent-ID']).toBeUndefined();
    });
  });

  describe('middleware integration', () => {
    it('should set correlation ID in response headers', async () => {
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test');

      expect(res.headers.get('X-Request-ID')).toBeDefined();
      expect(res.headers.get('X-Correlation-ID')).toBeDefined();
      expect(res.headers.get('X-Span-ID')).toBeDefined();
    });

    it('should propagate incoming X-Request-ID', async () => {
      app.get('/test', (c) => c.json({ id: getCorrelationId(c) }));

      const res = await app.request('/test', {
        headers: { 'X-Request-ID': 'incoming-request-id' },
      });

      expect(res.headers.get('X-Request-ID')).toBe('incoming-request-id');
      const body = await res.json();
      expect(body.id).toBe('incoming-request-id');
    });

    it('should propagate incoming X-Correlation-ID', async () => {
      app.get('/test', (c) => c.json({ id: getCorrelationId(c) }));

      const res = await app.request('/test', {
        headers: { 'X-Correlation-ID': 'incoming-correlation-id' },
      });

      expect(res.headers.get('X-Correlation-ID')).toBe('incoming-correlation-id');
      const body = await res.json();
      expect(body.id).toBe('incoming-correlation-id');
    });

    it('should provide full correlation context', async () => {
      let capturedContext: CorrelationContext | undefined;

      app.get('/test', (c) => {
        capturedContext = getCorrelationContext(c);
        return c.json({ ok: true });
      });

      await app.request('/test', {
        headers: { 'X-Request-ID': 'test-id' },
      });

      expect(capturedContext).toBeDefined();
      expect(capturedContext?.correlationId).toBe('test-id');
      expect(capturedContext?.spanId).toBeDefined();
    });
  });

  describe('getExternalServiceHeaders', () => {
    it('should return headers for external service calls', async () => {
      let headers: Record<string, string> | undefined;

      app.get('/test', (c) => {
        headers = getExternalServiceHeaders(c);
        return c.json({ ok: true });
      });

      await app.request('/test', {
        headers: { 'X-Request-ID': 'external-test-id' },
      });

      expect(headers).toBeDefined();
      expect(headers?.['X-Request-ID']).toBe('external-test-id');
      expect(headers?.['X-Correlation-ID']).toBe('external-test-id');
      expect(headers?.['X-Span-ID']).toBeDefined();
    });
  });

  describe('createChildSpan', () => {
    it('should create child span with parent reference', async () => {
      let parentContext: CorrelationContext | undefined;
      let childContext: CorrelationContext | undefined;

      app.get('/test', (c) => {
        parentContext = getCorrelationContext(c);
        childContext = createChildSpan(c);
        return c.json({ ok: true });
      });

      await app.request('/test');

      expect(parentContext).toBeDefined();
      expect(childContext).toBeDefined();
      expect(childContext?.correlationId).toBe(parentContext?.correlationId);
      expect(childContext?.parentId).toBe(parentContext?.spanId);
      expect(childContext?.spanId).not.toBe(parentContext?.spanId);
    });
  });

  describe('Property: Correlation ID Propagation', () => {
    /**
     * **Feature: high-traffic-resilience, Property 6: Correlation ID Propagation**
     * **Validates: Requirements 10.1, 10.3, 10.4, 10.5**
     *
     * For any request with X-Request-ID header, all downstream operations
     * (logs, external calls, queue jobs, error responses) SHALL include
     * the same correlation ID.
     */
    it('should maintain same correlation ID across all operations', async () => {
      const incomingId = 'test-propagation-id';
      let contextId: string | undefined;
      let externalHeaders: Record<string, string> | undefined;
      let childSpanId: string | undefined;

      app.get('/test', (c) => {
        contextId = getCorrelationId(c);
        externalHeaders = getExternalServiceHeaders(c);
        const child = createChildSpan(c);
        childSpanId = child.correlationId;
        return c.json({ correlationId: contextId });
      });

      const res = await app.request('/test', {
        headers: { 'X-Request-ID': incomingId },
      });

      const body = await res.json();

      // All should have the same correlation ID
      expect(contextId).toBe(incomingId);
      expect(externalHeaders?.['X-Request-ID']).toBe(incomingId);
      expect(childSpanId).toBe(incomingId);
      expect(body.correlationId).toBe(incomingId);
      expect(res.headers.get('X-Request-ID')).toBe(incomingId);
    });

    it('should include correlation ID in error responses', async () => {
      const incomingId = 'error-test-id';

      app.get('/error', (c) => {
        const correlationId = getCorrelationId(c);
        return c.json(
          { error: 'Test error', correlationId },
          500
        );
      });

      const res = await app.request('/error', {
        headers: { 'X-Request-ID': incomingId },
      });

      const body = await res.json();
      expect(body.correlationId).toBe(incomingId);
    });
  });
});
