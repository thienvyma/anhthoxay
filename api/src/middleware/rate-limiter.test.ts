/**
 * Rate Limiter Middleware Tests
 * Tests request rate limiting, headers, and key generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { rateLimiter, checkLimit, resetLimit, clearAllLimits } from './rate-limiter';

describe('Rate Limiter Core Functions', () => {
  beforeEach(() => {
    clearAllLimits();
  });

  afterEach(() => {
    clearAllLimits();
  });

  describe('checkLimit function', () => {
    it('should allow first request', () => {
      const key = 'test-key';
      const result = checkLimit(key, 5, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should allow requests within limit', () => {
      const key = 'test-key';
      const maxAttempts = 3;

      const result1 = checkLimit(key, maxAttempts, 60000);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = checkLimit(key, maxAttempts, 60000);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = checkLimit(key, maxAttempts, 60000);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests over limit', () => {
      const key = 'test-key';
      const maxAttempts = 2;

      checkLimit(key, maxAttempts, 60000);
      checkLimit(key, maxAttempts, 60000);

      const result = checkLimit(key, maxAttempts, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle different keys independently', () => {
      const key1 = 'user-1';
      const key2 = 'user-2';

      const result1 = checkLimit(key1, 2, 60000);
      const result2 = checkLimit(key2, 2, 60000);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);

      checkLimit(key1, 2, 60000);
      const result1Blocked = checkLimit(key1, 2, 60000);
      const result2StillAllowed = checkLimit(key2, 2, 60000);

      expect(result1Blocked.allowed).toBe(false);
      expect(result2StillAllowed.allowed).toBe(true);
    });
  });

  describe('resetLimit function', () => {
    it('should reset rate limit for specific key', () => {
      const key = 'test-key';

      checkLimit(key, 1, 60000);
      let result = checkLimit(key, 1, 60000);
      expect(result.allowed).toBe(false);

      resetLimit(key);
      result = checkLimit(key, 1, 60000);
      expect(result.allowed).toBe(true);
    });

    it('should not affect other keys', () => {
      const key1 = 'user-1';
      const key2 = 'user-2';

      checkLimit(key1, 1, 60000);
      checkLimit(key2, 1, 60000);
      checkLimit(key1, 1, 60000);
      checkLimit(key2, 1, 60000);

      resetLimit(key1);

      expect(checkLimit(key1, 1, 60000).allowed).toBe(true);
      expect(checkLimit(key2, 1, 60000).allowed).toBe(false);
    });
  });

  describe('clearAllLimits function', () => {
    it('should clear all rate limits', () => {
      const key1 = 'user-1';
      const key2 = 'user-2';

      checkLimit(key1, 1, 60000);
      checkLimit(key2, 1, 60000);
      checkLimit(key1, 1, 60000);
      checkLimit(key2, 1, 60000);

      expect(checkLimit(key1, 1, 60000).allowed).toBe(false);
      expect(checkLimit(key2, 1, 60000).allowed).toBe(false);

      clearAllLimits();

      expect(checkLimit(key1, 1, 60000).allowed).toBe(true);
      expect(checkLimit(key2, 1, 60000).allowed).toBe(true);
    });
  });
});

describe('Rate Limiter Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    clearAllLimits();
    app = new Hono();
  });

  afterEach(() => {
    clearAllLimits();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      app.use('/api/*', rateLimiter({ maxAttempts: 3, windowMs: 60000 }));
      app.get('/api/test', (c) => c.json({ success: true }));

      const req = new Request('http://localhost/api/test');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('3');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('2');
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should block requests over limit', async () => {
      app.use('/api/*', rateLimiter({ maxAttempts: 2, windowMs: 60000 }));
      app.get('/api/test', (c) => c.json({ success: true }));

      // Use up the limit
      await app.fetch(new Request('http://localhost/api/test'));
      await app.fetch(new Request('http://localhost/api/test'));

      // Third request should be blocked
      const res = await app.fetch(new Request('http://localhost/api/test'));

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error.code).toBe('AUTH_RATE_LIMITED');
    });

    it('should include rate limit headers', async () => {
      app.use('/api/*', rateLimiter({ maxAttempts: 5, windowMs: 60000 }));
      app.get('/api/test', (c) => c.json({ success: true }));

      const res = await app.fetch(new Request('http://localhost/api/test'));

      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('4');
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should include retry-after header when blocked', async () => {
      app.use('/api/*', rateLimiter({ maxAttempts: 1, windowMs: 60000 }));
      app.get('/api/test', (c) => c.json({ success: true }));

      await app.fetch(new Request('http://localhost/api/test'));
      const res = await app.fetch(new Request('http://localhost/api/test'));

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('Custom Key Generators', () => {
    it('should use custom key generator', async () => {
      app.use('/api/*', rateLimiter({
        maxAttempts: 1,
        windowMs: 60000,
        keyGenerator: (c) => `path:${c.req.path}`,
      }));

      app.get('/api/endpoint1', (c) => c.json({ endpoint: 1 }));
      app.get('/api/endpoint2', (c) => c.json({ endpoint: 2 }));

      // Block endpoint1
      await app.fetch(new Request('http://localhost/api/endpoint1'));
      const blockedRes = await app.fetch(new Request('http://localhost/api/endpoint1'));
      expect(blockedRes.status).toBe(429);

      // endpoint2 should still work
      const allowedRes = await app.fetch(new Request('http://localhost/api/endpoint2'));
      expect(allowedRes.status).toBe(200);
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should use IP address as default key', async () => {
      app.use('/api/*', rateLimiter({ maxAttempts: 2, windowMs: 60000 }));
      app.get('/api/test', (c) => c.json({ success: true }));

      // First request with IP
      const req1 = new Request('http://localhost/api/test', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      });
      const res1 = await app.fetch(req1);
      expect(res1.status).toBe(200);

      // Second request with same IP
      const req2 = new Request('http://localhost/api/test', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      });
      const res2 = await app.fetch(req2);
      expect(res2.status).toBe(200);

      // Third request should be blocked
      const req3 = new Request('http://localhost/api/test', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      });
      const res3 = await app.fetch(req3);
      expect(res3.status).toBe(429);
    });

    it('should handle different IPs separately', async () => {
      app.use('/api/*', rateLimiter({ maxAttempts: 1, windowMs: 60000 }));
      app.get('/api/test', (c) => c.json({ success: true }));

      // IP 1 - allowed
      const req1 = new Request('http://localhost/api/test', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      });
      const res1 = await app.fetch(req1);
      expect(res1.status).toBe(200);

      // IP 1 - blocked
      const req1Again = new Request('http://localhost/api/test', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      });
      const res1Blocked = await app.fetch(req1Again);
      expect(res1Blocked.status).toBe(429);

      // IP 2 - still allowed
      const req2 = new Request('http://localhost/api/test', {
        headers: { 'X-Forwarded-For': '192.168.1.2' },
      });
      const res2 = await app.fetch(req2);
      expect(res2.status).toBe(200);
    });

    it('should handle X-Real-IP header', async () => {
      app.use('/api/*', rateLimiter({ maxAttempts: 1, windowMs: 60000 }));
      app.get('/api/test', (c) => c.json({ success: true }));

      const req = new Request('http://localhost/api/test', {
        headers: { 'X-Real-IP': '10.0.0.1' },
      });
      const res = await app.fetch(req);
      expect(res.status).toBe(200);
    });
  });

  describe('Configuration Options', () => {
    it('should use default options when not specified', async () => {
      app.use('/api/*', rateLimiter());
      app.get('/api/test', (c) => c.json({ success: true }));

      const res = await app.fetch(new Request('http://localhost/api/test'));

      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    });

    it('should accept custom configuration', async () => {
      app.use('/api/*', rateLimiter({
        maxAttempts: 10,
        windowMs: 30000,
      }));
      app.get('/api/test', (c) => c.json({ success: true }));

      const res = await app.fetch(new Request('http://localhost/api/test'));

      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    });
  });
});
