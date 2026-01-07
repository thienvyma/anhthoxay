/**
 * CDN Headers Middleware
 *
 * Adds appropriate Cache-Control headers for CDN caching based on content type.
 * Supports different caching strategies for static assets, public API responses,
 * and private/authenticated content.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.1, 2.2**
 */

import type { Context, Next } from 'hono';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * CDN Headers Configuration
 */
export interface CDNHeadersConfig {
  /** Max-age for immutable static assets (default: 1 year) */
  staticAssetMaxAge: number;
  /** Max-age for public API responses (default: 5 minutes) */
  apiCacheMaxAge: number;
  /** Stale-while-revalidate duration (default: 60 seconds) */
  staleWhileRevalidate: number;
  /** CDN domain for asset URLs (from env CDN_DOMAIN) */
  cdnDomain?: string;
  /** Whether to add Vary headers */
  addVaryHeaders: boolean;
}

/**
 * Content type categories for cache control
 */
export type ContentCategory = 'immutable' | 'publicApi' | 'private' | 'noStore';

// ============================================
// CACHE PATTERNS
// ============================================

/**
 * Cache-Control header patterns for different content types
 * **Validates: Requirements 2.1, 2.2**
 */
export const cachePatterns: Record<ContentCategory, string> = {
  /** Immutable static assets (images, fonts, CSS with content hash) - 1 year */
  immutable: 'public, max-age=31536000, immutable',
  /** Public API responses (regions, categories, settings) - 5 minutes with CDN */
  publicApi: 'public, s-maxage=300, stale-while-revalidate=60',
  /** Private/authenticated content - no caching */
  private: 'private, no-cache, no-store, must-revalidate',
  /** Sensitive data - never cache */
  noStore: 'no-store',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get default CDN headers configuration
 */
export function getDefaultConfig(): CDNHeadersConfig {
  return {
    staticAssetMaxAge: 31536000, // 1 year
    apiCacheMaxAge: 300, // 5 minutes
    staleWhileRevalidate: 60, // 1 minute
    cdnDomain: process.env.CDN_DOMAIN,
    addVaryHeaders: true,
  };
}

/**
 * Determine content category based on path and content type
 * **Validates: Requirements 2.1, 2.2**
 */
export function determineContentCategory(
  path: string,
  contentType: string | null,
  isAuthenticated: boolean
): ContentCategory {
  // Authenticated requests should not be cached
  if (isAuthenticated) {
    return 'private';
  }

  // Static assets with content hash (immutable)
  // Matches patterns like: /media/abc123.webp, /assets/style-abc123.css
  const hasContentHash = /[a-f0-9]{8,}\./.test(path);
  const isStaticAsset =
    path.startsWith('/media/') ||
    path.startsWith('/assets/') ||
    path.startsWith('/static/');

  if (isStaticAsset && hasContentHash) {
    return 'immutable';
  }

  // Image files (even without hash, cache for shorter period)
  const isImage =
    contentType?.startsWith('image/') ||
    /\.(webp|png|jpg|jpeg|gif|svg|ico)$/i.test(path);

  if (isImage && isStaticAsset) {
    return 'immutable';
  }

  // Font files
  const isFont =
    contentType?.includes('font') ||
    /\.(woff|woff2|ttf|otf|eot)$/i.test(path);

  if (isFont) {
    return 'immutable';
  }

  // Public API endpoints that can be cached
  const publicApiPaths = [
    '/api/regions',
    '/api/service-categories',
    '/api/materials',
    '/api/settings/public',
    '/api/settings/bidding',
    '/api/service-fees',
    '/api/rankings',
    '/api/rankings/featured',
    '/blog/posts',
    '/media/featured',
    '/media/gallery',
  ];

  const isPublicApi = publicApiPaths.some(
    (apiPath) => path === apiPath || path.startsWith(`${apiPath}/`) || path.startsWith(`${apiPath}?`)
  );

  if (isPublicApi) {
    return 'publicApi';
  }

  // Default: no caching for other content
  return 'noStore';
}

/**
 * Build Cache-Control header value based on category and config
 */
export function buildCacheControlHeader(
  category: ContentCategory,
  config: CDNHeadersConfig
): string {
  switch (category) {
    case 'immutable':
      return `public, max-age=${config.staticAssetMaxAge}, immutable`;
    case 'publicApi':
      return `public, s-maxage=${config.apiCacheMaxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`;
    case 'private':
      return 'private, no-cache, no-store, must-revalidate';
    case 'noStore':
    default:
      return 'no-store';
  }
}

/**
 * Get CDN URL for a given path
 */
export function getCdnUrl(path: string, cdnDomain?: string): string {
  if (!cdnDomain) {
    return path;
  }
  // Ensure CDN domain doesn't have trailing slash
  const domain = cdnDomain.replace(/\/$/, '');
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}${normalizedPath}`;
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * CDN Headers Middleware
 *
 * Adds appropriate Cache-Control headers based on content type and path.
 * Supports different caching strategies for:
 * - Immutable static assets (1 year)
 * - Public API responses (5 minutes with CDN)
 * - Private/authenticated content (no cache)
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.1, 2.2**
 *
 * @param config - Optional configuration overrides
 * @returns Hono middleware
 *
 * @example
 * ```ts
 * // Apply to all routes
 * app.use('*', cdnHeaders());
 *
 * // Apply with custom config
 * app.use('*', cdnHeaders({ staticAssetMaxAge: 86400 }));
 * ```
 */
export function cdnHeaders(config?: Partial<CDNHeadersConfig>) {
  const finalConfig: CDNHeadersConfig = {
    ...getDefaultConfig(),
    ...config,
  };

  return async (c: Context, next: Next) => {
    await next();

    const path = c.req.path;
    const contentType = c.res.headers.get('Content-Type');
    const isAuthenticated = !!c.req.header('Authorization');

    // Determine content category
    const category = determineContentCategory(path, contentType, isAuthenticated);

    // Build and set Cache-Control header
    const cacheControl = buildCacheControlHeader(category, finalConfig);
    c.header('Cache-Control', cacheControl);

    // Add Vary headers for proper CDN caching
    if (finalConfig.addVaryHeaders) {
      // Vary by Accept-Encoding for compression
      c.header('Vary', 'Accept-Encoding');

      // For API responses, also vary by Accept header
      if (category === 'publicApi') {
        c.header('Vary', 'Accept-Encoding, Accept');
      }
    }

    // Add CDN-specific headers
    if (category === 'immutable' || category === 'publicApi') {
      // Surrogate-Control for CDN-specific caching (Cloudflare, Fastly, etc.)
      if (category === 'immutable') {
        c.header('Surrogate-Control', `max-age=${finalConfig.staticAssetMaxAge}`);
      } else {
        c.header('Surrogate-Control', `max-age=${finalConfig.apiCacheMaxAge}`);
      }
    }

    // Add X-Cache-Category header for debugging
    c.header('X-Cache-Category', category);
  };
}

/**
 * Middleware specifically for media/static file routes
 * Always applies immutable caching for static assets
 *
 * @example
 * ```ts
 * app.use('/media/*', staticAssetHeaders());
 * ```
 */
export function staticAssetHeaders(config?: Partial<CDNHeadersConfig>) {
  const finalConfig: CDNHeadersConfig = {
    ...getDefaultConfig(),
    ...config,
  };

  return async (c: Context, next: Next) => {
    await next();

    // Always use immutable caching for static assets
    c.header('Cache-Control', buildCacheControlHeader('immutable', finalConfig));
    c.header('Surrogate-Control', `max-age=${finalConfig.staticAssetMaxAge}`);
    c.header('X-Cache-Category', 'immutable');

    // Add Vary header
    if (finalConfig.addVaryHeaders) {
      c.header('Vary', 'Accept-Encoding');
    }
  };
}

/**
 * Middleware for public API routes
 * Applies CDN-friendly caching with stale-while-revalidate
 *
 * @example
 * ```ts
 * app.use('/api/regions', publicApiHeaders());
 * ```
 */
export function publicApiHeaders(config?: Partial<CDNHeadersConfig>) {
  const finalConfig: CDNHeadersConfig = {
    ...getDefaultConfig(),
    ...config,
  };

  return async (c: Context, next: Next) => {
    await next();

    // Skip caching for authenticated requests
    if (c.req.header('Authorization')) {
      c.header('Cache-Control', buildCacheControlHeader('private', finalConfig));
      c.header('X-Cache-Category', 'private');
      return;
    }

    // Apply public API caching
    c.header('Cache-Control', buildCacheControlHeader('publicApi', finalConfig));
    c.header('Surrogate-Control', `max-age=${finalConfig.apiCacheMaxAge}`);
    c.header('X-Cache-Category', 'publicApi');

    // Add Vary headers
    if (finalConfig.addVaryHeaders) {
      c.header('Vary', 'Accept-Encoding, Accept');
    }
  };
}

export default { cdnHeaders, staticAssetHeaders, publicApiHeaders };
