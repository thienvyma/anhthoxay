/**
 * Security Headers Middleware Tests
 * Tests security header configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import {
  securityHeaders,
  buildCSPHeader,
  buildHSTSHeader,
  buildPermissionsPolicyHeader,
  isProduction,
} from './security-headers';

describe('Security Headers Middleware', () => {
  let app: Hono;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    app = new Hono();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('isProduction', () => {
    it('should return true in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    it('should return false in development', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
    });

    it('should return false in test', () => {
      process.env.NODE_ENV = 'test';
      expect(isProduction()).toBe(false);
    });
  });

  describe('buildCSPHeader', () => {
    it('should build valid CSP header', () => {
      const csp = buildCSPHeader();

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should include all required directives', () => {
      const csp = buildCSPHeader();
      const directives = csp.split('; ');

      expect(directives.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('buildHSTSHeader', () => {
    it('should build HSTS header with default max-age', () => {
      const hsts = buildHSTSHeader();

      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
    });

    it('should accept custom max-age', () => {
      const hsts = buildHSTSHeader(86400);

      expect(hsts).toContain('max-age=86400');
    });
  });

  describe('buildPermissionsPolicyHeader', () => {
    it('should disable geolocation, microphone, and camera', () => {
      const policy = buildPermissionsPolicyHeader();

      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('camera=()');
    });
  });

  describe('securityHeaders middleware', () => {
    it('should add X-Content-Type-Options header', async () => {
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should add X-Frame-Options header', async () => {
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should add X-XSS-Protection header', async () => {
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should add Referrer-Policy header', async () => {
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should add Content-Security-Policy header', async () => {
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.fetch(new Request('http://localhost/test'));

      const csp = res.headers.get('Content-Security-Policy');
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
    });

    it('should add Permissions-Policy header', async () => {
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.headers.get('Permissions-Policy')).toContain('geolocation=()');
    });

    it('should add X-Permitted-Cross-Domain-Policies header', async () => {
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.fetch(new Request('http://localhost/test'));

      expect(res.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
    });

    describe('HSTS header', () => {
      it('should not add HSTS in development by default', async () => {
        process.env.NODE_ENV = 'development';
        app.use('*', securityHeaders());
        app.get('/test', (c) => c.json({ ok: true }));

        const res = await app.fetch(new Request('http://localhost/test'));

        expect(res.headers.get('Strict-Transport-Security')).toBeNull();
      });

      it('should add HSTS in production by default', async () => {
        process.env.NODE_ENV = 'production';
        app.use('*', securityHeaders());
        app.get('/test', (c) => c.json({ ok: true }));

        const res = await app.fetch(new Request('http://localhost/test'));

        expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
      });

      it('should allow forcing HSTS on', async () => {
        process.env.NODE_ENV = 'development';
        app.use('*', securityHeaders({ enableHSTS: true }));
        app.get('/test', (c) => c.json({ ok: true }));

        const res = await app.fetch(new Request('http://localhost/test'));

        expect(res.headers.get('Strict-Transport-Security')).toBeDefined();
      });

      it('should allow custom HSTS max-age', async () => {
        app.use('*', securityHeaders({ enableHSTS: true, hstsMaxAge: 86400 }));
        app.get('/test', (c) => c.json({ ok: true }));

        const res = await app.fetch(new Request('http://localhost/test'));

        expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=86400');
      });
    });

    describe('Cache-Control for authenticated requests', () => {
      it('should add no-cache headers for authenticated requests', async () => {
        app.use('*', securityHeaders());
        app.get('/test', (c) => c.json({ ok: true }));

        const res = await app.fetch(
          new Request('http://localhost/test', {
            headers: { Authorization: 'Bearer token' },
          })
        );

        expect(res.headers.get('Cache-Control')).toContain('no-store');
        expect(res.headers.get('Pragma')).toBe('no-cache');
      });

      it('should not add cache headers for unauthenticated requests', async () => {
        app.use('*', securityHeaders());
        app.get('/test', (c) => c.json({ ok: true }));

        const res = await app.fetch(new Request('http://localhost/test'));

        expect(res.headers.get('Cache-Control')).toBeNull();
        expect(res.headers.get('Pragma')).toBeNull();
      });
    });
  });

  describe('All headers present', () => {
    it('should add all security headers', async () => {
      process.env.NODE_ENV = 'production';
      app.use('*', securityHeaders());
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.fetch(new Request('http://localhost/test'));

      const expectedHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'Permissions-Policy',
        'X-Permitted-Cross-Domain-Policies',
      ];

      expectedHeaders.forEach((header) => {
        expect(res.headers.get(header)).not.toBeNull();
      });
    });
  });
});
