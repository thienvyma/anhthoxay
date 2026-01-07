/**
 * CDN Headers Middleware Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.1, 2.2**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import {
  cdnHeaders,
  staticAssetHeaders,
  publicApiHeaders,
  determineContentCategory,
  buildCacheControlHeader,
  getCdnUrl,
  getDefaultConfig,
  cachePatterns,
} from './cdn-headers';

describe('CDN Headers Middleware', () => {
  describe('determineContentCategory', () => {
    it('should return private for authenticated requests', () => {
      expect(determineContentCategory('/api/users', 'application/json', true)).toBe('private');
      expect(determineContentCategory('/media/test.webp', 'image/webp', true)).toBe('private');
    });

    it('should return immutable for static assets with content hash', () => {
      expect(determineContentCategory('/media/abc12345.webp', 'image/webp', false)).toBe('immutable');
      expect(determineContentCategory('/assets/style-abc12345.css', 'text/css', false)).toBe('immutable');
      expect(determineContentCategory('/static/bundle-12345678.js', 'application/javascript', false)).toBe('immutable');
    });

    it('should return immutable for image files in static directories', () => {
      expect(determineContentCategory('/media/test.webp', 'image/webp', false)).toBe('immutable');
      expect(determineContentCategory('/media/photo.jpg', 'image/jpeg', false)).toBe('immutable');
      expect(determineContentCategory('/assets/logo.png', 'image/png', false)).toBe('immutable');
    });

    it('should return immutable for font files', () => {
      expect(determineContentCategory('/fonts/roboto.woff2', 'font/woff2', false)).toBe('immutable');
      expect(determineContentCategory('/assets/icon.ttf', 'font/ttf', false)).toBe('immutable');
    });

    it('should return publicApi for public API endpoints', () => {
      expect(determineContentCategory('/api/regions', 'application/json', false)).toBe('publicApi');
      expect(determineContentCategory('/api/regions/123', 'application/json', false)).toBe('publicApi');
      expect(determineContentCategory('/api/service-categories', 'application/json', false)).toBe('publicApi');
      expect(determineContentCategory('/api/settings/public', 'application/json', false)).toBe('publicApi');
      expect(determineContentCategory('/api/rankings', 'application/json', false)).toBe('publicApi');
      expect(determineContentCategory('/blog/posts', 'application/json', false)).toBe('publicApi');
      expect(determineContentCategory('/media/featured', 'application/json', false)).toBe('publicApi');
    });

    it('should return noStore for other paths', () => {
      expect(determineContentCategory('/api/users', 'application/json', false)).toBe('noStore');
      expect(determineContentCategory('/api/admin/settings', 'application/json', false)).toBe('noStore');
      expect(determineContentCategory('/unknown/path', 'text/html', false)).toBe('noStore');
    });
  });

  describe('buildCacheControlHeader', () => {
    const config = getDefaultConfig();

    it('should build immutable cache header', () => {
      const header = buildCacheControlHeader('immutable', config);
      expect(header).toBe('public, max-age=31536000, immutable');
    });

    it('should build publicApi cache header', () => {
      const header = buildCacheControlHeader('publicApi', config);
      expect(header).toBe('public, s-maxage=300, stale-while-revalidate=60');
    });

    it('should build private cache header', () => {
      const header = buildCacheControlHeader('private', config);
      expect(header).toBe('private, no-cache, no-store, must-revalidate');
    });

    it('should build noStore cache header', () => {
      const header = buildCacheControlHeader('noStore', config);
      expect(header).toBe('no-store');
    });

    it('should use custom config values', () => {
      const customConfig = {
        ...config,
        staticAssetMaxAge: 86400,
        apiCacheMaxAge: 600,
        staleWhileRevalidate: 120,
      };
      expect(buildCacheControlHeader('immutable', customConfig)).toBe('public, max-age=86400, immutable');
      expect(buildCacheControlHeader('publicApi', customConfig)).toBe('public, s-maxage=600, stale-while-revalidate=120');
    });
  });

  describe('getCdnUrl', () => {
    it('should return original path when no CDN domain', () => {
      expect(getCdnUrl('/media/test.webp')).toBe('/media/test.webp');
      expect(getCdnUrl('/media/test.webp', undefined)).toBe('/media/test.webp');
    });

    it('should prepend CDN domain to path', () => {
      expect(getCdnUrl('/media/test.webp', 'https://cdn.example.com')).toBe('https://cdn.example.com/media/test.webp');
    });

    it('should handle CDN domain with trailing slash', () => {
      expect(getCdnUrl('/media/test.webp', 'https://cdn.example.com/')).toBe('https://cdn.example.com/media/test.webp');
    });

    it('should handle path without leading slash', () => {
      expect(getCdnUrl('media/test.webp', 'https://cdn.example.com')).toBe('https://cdn.example.com/media/test.webp');
    });
  });

  describe('cachePatterns', () => {
    it('should have correct immutable pattern', () => {
      expect(cachePatterns.immutable).toBe('public, max-age=31536000, immutable');
    });

    it('should have correct publicApi pattern', () => {
      expect(cachePatterns.publicApi).toBe('public, s-maxage=300, stale-while-revalidate=60');
    });

    it('should have correct private pattern', () => {
      expect(cachePatterns.private).toBe('private, no-cache, no-store, must-revalidate');
    });

    it('should have correct noStore pattern', () => {
      expect(cachePatterns.noStore).toBe('no-store');
    });
  });

  describe('cdnHeaders middleware', () => {
    let app: Hono;

    beforeEach(() => {
      app = new Hono();
      app.use('*', cdnHeaders());
    });

    it('should add Cache-Control header for static assets', async () => {
      app.get('/media/test.webp', (c) => {
        c.header('Content-Type', 'image/webp');
        return c.body('image data');
      });

      const res = await app.request('/media/test.webp');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
      expect(res.headers.get('X-Cache-Category')).toBe('immutable');
    });

    it('should add Cache-Control header for public API', async () => {
      app.get('/api/regions', (c) => {
        return c.json({ regions: [] });
      });

      const res = await app.request('/api/regions');
      expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=60');
      expect(res.headers.get('X-Cache-Category')).toBe('publicApi');
    });

    it('should add private Cache-Control for authenticated requests', async () => {
      app.get('/api/regions', (c) => {
        return c.json({ regions: [] });
      });

      const res = await app.request('/api/regions', {
        headers: { Authorization: 'Bearer token' },
      });
      expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
      expect(res.headers.get('X-Cache-Category')).toBe('private');
    });

    it('should add Vary header', async () => {
      app.get('/api/regions', (c) => {
        return c.json({ regions: [] });
      });

      const res = await app.request('/api/regions');
      expect(res.headers.get('Vary')).toContain('Accept-Encoding');
    });

    it('should add Surrogate-Control for CDN', async () => {
      app.get('/media/test.webp', (c) => {
        c.header('Content-Type', 'image/webp');
        return c.body('image data');
      });

      const res = await app.request('/media/test.webp');
      expect(res.headers.get('Surrogate-Control')).toBe('max-age=31536000');
    });
  });

  describe('staticAssetHeaders middleware', () => {
    let app: Hono;

    beforeEach(() => {
      app = new Hono();
      app.use('/media/*', staticAssetHeaders());
    });

    it('should always apply immutable caching', async () => {
      app.get('/media/test.webp', (c) => {
        return c.body('image data');
      });

      const res = await app.request('/media/test.webp');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
      expect(res.headers.get('X-Cache-Category')).toBe('immutable');
    });
  });

  describe('publicApiHeaders middleware', () => {
    let app: Hono;

    beforeEach(() => {
      app = new Hono();
      app.use('/api/regions', publicApiHeaders());
    });

    it('should apply public API caching', async () => {
      app.get('/api/regions', (c) => {
        return c.json({ regions: [] });
      });

      const res = await app.request('/api/regions');
      expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=60');
      expect(res.headers.get('X-Cache-Category')).toBe('publicApi');
    });

    it('should skip caching for authenticated requests', async () => {
      app.get('/api/regions', (c) => {
        return c.json({ regions: [] });
      });

      const res = await app.request('/api/regions', {
        headers: { Authorization: 'Bearer token' },
      });
      expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
      expect(res.headers.get('X-Cache-Category')).toBe('private');
    });
  });
});
