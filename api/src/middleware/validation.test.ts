/**
 * Validation Middleware Tests
 * Tests Zod-based request validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { z } from 'zod';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from './validation';
import { correlationId } from './correlation-id';

describe('Validation Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('*', correlationId());
  });

  describe('validate (body validation)', () => {
    const TestSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().int().positive().optional(),
    });

    it('should pass valid body', async () => {
      app.post('/test', validate(TestSchema), (c) => {
        const body = getValidatedBody(c);
        return c.json({ success: true, data: body });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('John');
    });

    it('should reject invalid body', async () => {
      app.post('/test', validate(TestSchema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '', email: 'invalid' }),
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details.fieldErrors).toBeDefined();
    });

    it('should include field errors in response', async () => {
      app.post('/test', validate(TestSchema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '', email: 'invalid' }),
        })
      );

      const data = await res.json();
      expect(data.error.details.fieldErrors.name).toBeDefined();
      expect(data.error.details.fieldErrors.email).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      app.post('/test', validate(TestSchema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.details.fieldErrors.name).toBeDefined();
      expect(data.error.details.fieldErrors.email).toBeDefined();
    });

    it('should handle invalid JSON', async () => {
      app.post('/test', validate(TestSchema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json',
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Invalid JSON');
    });

    it('should include correlation ID in error response', async () => {
      app.post('/test', validate(TestSchema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'test-correlation-id',
          },
          body: JSON.stringify({ name: '' }),
        })
      );

      const data = await res.json();
      expect(data.correlationId).toBe('test-correlation-id');
    });

    it('should handle optional fields', async () => {
      app.post('/test', validate(TestSchema), (c) => {
        const body = getValidatedBody(c);
        return c.json({ success: true, data: body });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'John', email: 'john@example.com', age: 25 }),
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.age).toBe(25);
    });

    it('should reject invalid optional field type', async () => {
      app.post('/test', validate(TestSchema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'John', email: 'john@example.com', age: 'not-a-number' }),
        })
      );

      expect(res.status).toBe(400);
    });
  });

  describe('validateQuery (query parameter validation)', () => {
    const QuerySchema = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
    });

    it('should pass valid query parameters', async () => {
      app.get('/test', validateQuery(QuerySchema), (c) => {
        const query = getValidatedQuery(c);
        return c.json({ success: true, query });
      });

      const res = await app.fetch(
        new Request('http://localhost/test?page=2&limit=50')
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.query.page).toBe(2);
      expect(data.query.limit).toBe(50);
    });

    it('should use default values', async () => {
      app.get('/test', validateQuery(QuerySchema), (c) => {
        const query = getValidatedQuery(c);
        return c.json({ success: true, query });
      });

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.query.page).toBe(1);
      expect(data.query.limit).toBe(20);
    });

    it('should reject invalid query parameters', async () => {
      app.get('/test', validateQuery(QuerySchema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.fetch(
        new Request('http://localhost/test?page=-1')
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject limit over max', async () => {
      app.get('/test', validateQuery(QuerySchema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.fetch(
        new Request('http://localhost/test?limit=200')
      );

      expect(res.status).toBe(400);
    });

    it('should handle optional search parameter', async () => {
      app.get('/test', validateQuery(QuerySchema), (c) => {
        const query = getValidatedQuery(c);
        return c.json({ success: true, query });
      });

      const res = await app.fetch(
        new Request('http://localhost/test?search=hello')
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.query.search).toBe('hello');
    });

    it('should coerce string numbers to numbers', async () => {
      app.get('/test', validateQuery(QuerySchema), (c) => {
        const query = getValidatedQuery(c);
        return c.json({ success: true, query });
      });

      const res = await app.fetch(
        new Request('http://localhost/test?page=5&limit=25')
      );

      const data = await res.json();
      expect(typeof data.query.page).toBe('number');
      expect(typeof data.query.limit).toBe('number');
    });
  });

  describe('getValidatedBody', () => {
    it('should throw if validation middleware not applied', async () => {
      app.post('/test', (c) => {
        try {
          getValidatedBody(c);
          return c.json({ error: 'Should have thrown' });
        } catch (err: unknown) {
          const error = err as Error;
          return c.json({ error: error.message }, 500);
        }
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true }),
        })
      );

      const data = await res.json();
      expect(data.error).toContain('Validated body not found');
    });
  });

  describe('getValidatedQuery', () => {
    it('should throw if validation middleware not applied', async () => {
      app.get('/test', (c) => {
        try {
          getValidatedQuery(c);
          return c.json({ error: 'Should have thrown' });
        } catch (err: unknown) {
          const error = err as Error;
          return c.json({ error: error.message }, 500);
        }
      });

      const res = await app.fetch(new Request('http://localhost/test'));

      const data = await res.json();
      expect(data.error).toContain('Validated query not found');
    });
  });

  describe('Complex validation scenarios', () => {
    it('should validate nested objects', async () => {
      const NestedSchema = z.object({
        user: z.object({
          name: z.string(),
          address: z.object({
            city: z.string(),
            zip: z.string(),
          }),
        }),
      });

      app.post('/test', validate(NestedSchema), (c) => {
        const body = getValidatedBody(c);
        return c.json({ success: true, data: body });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: {
              name: 'John',
              address: { city: 'NYC', zip: '10001' },
            },
          }),
        })
      );

      expect(res.status).toBe(200);
    });

    it('should validate arrays', async () => {
      const ArraySchema = z.object({
        items: z.array(z.string()).min(1),
      });

      app.post('/test', validate(ArraySchema), (c) => {
        const body = getValidatedBody(c);
        return c.json({ success: true, data: body });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: ['a', 'b', 'c'] }),
        })
      );

      expect(res.status).toBe(200);
    });

    it('should reject empty array when min is set', async () => {
      const ArraySchema = z.object({
        items: z.array(z.string()).min(1),
      });

      app.post('/test', validate(ArraySchema), (c) => {
        return c.json({ success: true });
      });

      const res = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [] }),
        })
      );

      expect(res.status).toBe(400);
    });

    it('should validate enum values', async () => {
      const EnumSchema = z.object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
      });

      app.post('/test', validate(EnumSchema), (c) => {
        const body = getValidatedBody(c);
        return c.json({ success: true, data: body });
      });

      const validRes = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        })
      );
      expect(validRes.status).toBe(200);

      const invalidRes = await app.fetch(
        new Request('http://localhost/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'INVALID' }),
        })
      );
      expect(invalidRes.status).toBe(400);
    });
  });
});
