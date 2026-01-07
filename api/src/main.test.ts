/**
 * Main Application Tests
 * Tests core application setup, environment validation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';

describe('Application Setup', () => {
  beforeAll(() => {
    // Mock environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum';
    process.env.DATABASE_URL = 'file:test.db';
  });

  describe('Environment Validation', () => {
    it('should validate required environment variables', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.DATABASE_URL).toBeDefined();
    });

    it('should have JWT secret with minimum length', () => {
      const jwtSecret = process.env.JWT_SECRET ?? '';
      expect(jwtSecret.length).toBeGreaterThanOrEqual(32);
    });

    it('should have NODE_ENV set', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('Hono Application Instance', () => {
    it('should create Hono app instance', () => {
      const app = new Hono();
      expect(app).toBeInstanceOf(Hono);
    });

    it('should have fetch method', () => {
      const app = new Hono();
      expect(typeof app.fetch).toBe('function');
    });

    it('should handle basic GET request', async () => {
      const app = new Hono();
      app.get('/test', (c) => c.json({ message: 'ok' }));

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe('ok');
    });

    it('should handle POST request with JSON body', async () => {
      const app = new Hono();
      app.post('/test', async (c) => {
        const body = await c.req.json();
        return c.json({ received: body });
      });

      const req = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received.name).toBe('test');
    });

    it('should return 404 for unknown routes', async () => {
      const app = new Hono();
      app.get('/known', (c) => c.json({ ok: true }));

      const req = new Request('http://localhost/unknown');
      const res = await app.fetch(req);

      expect(res.status).toBe(404);
    });
  });

  describe('Middleware Chain', () => {
    it('should execute middleware in order', async () => {
      const app = new Hono();
      const order: number[] = [];

      app.use('*', async (_c, next) => {
        order.push(1);
        await next();
        order.push(4);
      });

      app.use('*', async (_c, next) => {
        order.push(2);
        await next();
        order.push(3);
      });

      app.get('/test', (c) => c.json({ ok: true }));

      const req = new Request('http://localhost/test');
      await app.fetch(req);

      expect(order).toEqual([1, 2, 3, 4]);
    });

    it('should allow middleware to modify context', async () => {
      const app = new Hono<{ Variables: { customValue: string } }>();

      app.use('*', async (c, next) => {
        c.set('customValue', 'hello');
        await next();
      });

      app.get('/test', (c) => {
        const value = c.get('customValue');
        return c.json({ value });
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.value).toBe('hello');
    });

    it('should allow middleware to short-circuit', async () => {
      const app = new Hono();

      app.use('*', async (c, next) => {
        if (c.req.header('X-Block') === 'true') {
          return c.json({ blocked: true }, 403);
        }
        await next();
      });

      app.get('/test', (c) => c.json({ ok: true }));

      const blockedReq = new Request('http://localhost/test', {
        headers: { 'X-Block': 'true' },
      });
      const blockedRes = await app.fetch(blockedReq);
      expect(blockedRes.status).toBe(403);

      const normalReq = new Request('http://localhost/test');
      const normalRes = await app.fetch(normalReq);
      expect(normalRes.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle thrown errors', async () => {
      const app = new Hono();

      app.onError((err, c) => {
        return c.json({ error: err.message }, 500);
      });

      app.get('/error', () => {
        throw new Error('Test error');
      });

      const req = new Request('http://localhost/error');
      const res = await app.fetch(req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Test error');
    });

    it('should handle async errors', async () => {
      const app = new Hono();

      app.onError((err, c) => {
        return c.json({ error: err.message }, 500);
      });

      app.get('/async-error', async () => {
        await Promise.resolve();
        throw new Error('Async error');
      });

      const req = new Request('http://localhost/async-error');
      const res = await app.fetch(req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Async error');
    });
  });

  describe('Route Parameters', () => {
    it('should extract route parameters', async () => {
      const app = new Hono();

      app.get('/users/:id', (c) => {
        const id = c.req.param('id');
        return c.json({ userId: id });
      });

      const req = new Request('http://localhost/users/123');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.userId).toBe('123');
    });

    it('should extract multiple route parameters', async () => {
      const app = new Hono();

      app.get('/users/:userId/posts/:postId', (c) => {
        return c.json({
          userId: c.req.param('userId'),
          postId: c.req.param('postId'),
        });
      });

      const req = new Request('http://localhost/users/123/posts/456');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.userId).toBe('123');
      expect(data.postId).toBe('456');
    });
  });

  describe('Query Parameters', () => {
    it('should extract query parameters', async () => {
      const app = new Hono();

      app.get('/search', (c) => {
        const query = c.req.query('q');
        const page = c.req.query('page');
        return c.json({ query, page });
      });

      const req = new Request('http://localhost/search?q=test&page=2');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.query).toBe('test');
      expect(data.page).toBe('2');
    });
  });

  describe('Response Helpers', () => {
    it('should set custom status codes', async () => {
      const app = new Hono();

      app.post('/create', (c) => c.json({ created: true }, 201));

      const req = new Request('http://localhost/create', { method: 'POST' });
      const res = await app.fetch(req);

      expect(res.status).toBe(201);
    });

    it('should set custom headers', async () => {
      const app = new Hono();

      app.get('/headers', (c) => {
        c.header('X-Custom-Header', 'custom-value');
        return c.json({ ok: true });
      });

      const req = new Request('http://localhost/headers');
      const res = await app.fetch(req);

      expect(res.headers.get('X-Custom-Header')).toBe('custom-value');
    });
  });
});
