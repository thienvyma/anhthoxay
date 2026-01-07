import type { Context, Next } from 'hono';

/**
 * Security Headers Configuration
 * **Feature: security-hardening**
 * **Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 */
export interface SecurityHeadersConfig {
  enableHSTS: boolean; // false in development
  hstsMaxAge: number; // 31536000 (1 year)
}

/**
 * Check if running in production mode
 * Uses NODE_ENV environment variable
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Build Content-Security-Policy header value
 * For API responses, use restrictive defaults
 * For responses that may include HTML (error pages, etc.), allow basic resources
 * **Validates: Requirements 3.1, 3.3**
 */
export function buildCSPHeader(): string {
  // Restrictive CSP for API responses
  // - default-src 'self': Only allow resources from same origin
  // - script-src 'self': Only allow scripts from same origin
  // - style-src 'self' 'unsafe-inline': Allow inline styles for error pages
  // - img-src 'self' data: https:: Allow images from same origin, data URIs, and HTTPS
  // - font-src 'self' data:: Allow fonts from same origin and data URIs
  // - connect-src 'self' https:: Allow connections to same origin and HTTPS
  // - frame-ancestors 'none': Prevent embedding in iframes
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join('; ');
}

/**
 * Build Strict-Transport-Security header value
 * Only enabled in production to avoid localhost issues
 * **Validates: Requirements 3.2, 3.4**
 */
export function buildHSTSHeader(maxAge = 31536000): string {
  return `max-age=${maxAge}; includeSubDomains`;
}

/**
 * Build Permissions-Policy header value
 * Disables unnecessary browser features
 * **Validates: Requirements 3.6**
 */
export function buildPermissionsPolicyHeader(): string {
  return 'geolocation=(), microphone=(), camera=()';
}

/**
 * Security Headers Middleware
 * Adds security headers to all responses to mitigate common web vulnerabilities
 *
 * **Feature: security-hardening**
 * **Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 */
export function securityHeaders(config?: Partial<SecurityHeadersConfig>) {
  const enableHSTS = config?.enableHSTS ?? isProduction();
  const hstsMaxAge = config?.hstsMaxAge ?? 31536000; // 1 year default

  return async (c: Context, next: Next) => {
    await next();

    // Prevent MIME type sniffing
    c.header('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    c.header('X-Frame-Options', 'DENY');

    // XSS Protection (legacy browsers)
    c.header('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content-Security-Policy (CSP)
    // **Validates: Requirements 3.1, 3.3**
    c.header('Content-Security-Policy', buildCSPHeader());

    // Strict-Transport-Security (HSTS) - Production only
    // **Validates: Requirements 3.2, 3.4, 3.5**
    if (enableHSTS) {
      c.header('Strict-Transport-Security', buildHSTSHeader(hstsMaxAge));
    }

    // Permissions-Policy
    // **Validates: Requirements 3.6**
    c.header('Permissions-Policy', buildPermissionsPolicyHeader());

    // Prevent Adobe Flash and PDF from loading data from this domain
    c.header('X-Permitted-Cross-Domain-Policies', 'none');

    // For authenticated responses, prevent caching
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
      c.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      c.header('Pragma', 'no-cache');
    }
  };
}
