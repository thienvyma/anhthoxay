/**
 * Turnstile CAPTCHA Middleware Property Tests
 *
 * Property-based tests for CAPTCHA verification middleware.
 *
 * **Feature: production-scalability**
 * **Property 7: CAPTCHA verification required**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { Hono } from 'hono';
import { turnstileMiddleware, optionalTurnstileMiddleware } from './turnstile';
import { turnstileService } from '../services/turnstile.service';

// ============================================
// MOCKS
// ============================================

// Mock the turnstile service
vi.mock('../services/turnstile.service', () => ({
  turnstileService: {
    isEnabled: vi.fn(),
    verify: vi.fn(),
  },
}));

// Mock logger to prevent console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ============================================
// GENERATORS
// ============================================

/**
 * Generator for valid Turnstile tokens (non-empty strings)
 */
const validTokenGen = fc.string({ minLength: 10, maxLength: 500 });

/**
 * Generator for invalid/empty tokens
 */
const invalidTokenGen = fc.constantFrom('', ' ', '   ', null, undefined);

/**
 * Generator for request body with token
 */
const bodyWithTokenGen = (tokenField: string) =>
  fc.record({
    [tokenField]: validTokenGen,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    email: fc.emailAddress(),
    content: fc.string({ minLength: 10, maxLength: 1000 }),
  });

/**
 * Generator for request body without token
 */
const bodyWithoutTokenGen = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  content: fc.string({ minLength: 10, maxLength: 1000 }),
});

/**
 * Generator for IP addresses
 */
const ipAddressGen = fc.ipV4();

// ============================================
// TEST HELPERS
// ============================================

/**
 * Create a test app with turnstile middleware
 */
function createTestApp(middlewareOptions = {}) {
  const app = new Hono();

  app.post('/test', turnstileMiddleware(middlewareOptions), async (c) => {
    return c.json({ success: true, data: c.get('validatedBody') });
  });

  return app;
}

/**
 * Create a test app with optional turnstile middleware
 */
function createOptionalTestApp(middlewareOptions = {}) {
  const app = new Hono();

  app.post('/test', optionalTurnstileMiddleware(middlewareOptions), async (c) => {
    return c.json({ success: true, data: c.get('validatedBody') });
  });

  return app;
}

// ============================================
// PROPERTY TESTS
// ============================================

describe('Turnstile Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Turnstile is enabled
    vi.mocked(turnstileService.isEnabled).mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * **Feature: production-scalability, Property 7: CAPTCHA verification required**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   *
   * Property: For any request to a protected endpoint, if no valid CAPTCHA token
   * is provided, the request should be rejected with CAPTCHA_REQUIRED error.
   */
  describe('Property 7: CAPTCHA verification required', () => {
    it('should reject requests without turnstile token when enabled', async () => {
      const app = createTestApp();

      await fc.assert(
        fc.asyncProperty(bodyWithoutTokenGen, async (body) => {
          const response = await app.request('/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          expect(response.status).toBe(400);
          const json = await response.json();
          expect(json.success).toBe(false);
          expect(json.error.code).toBe('CAPTCHA_REQUIRED');
        }),
        { numRuns: 50 }
      );
    });

    it('should reject requests with invalid/empty token when enabled', async () => {
      const app = createTestApp();
      // Mock verify to return failure for any token (simulating invalid tokens)
      vi.mocked(turnstileService.verify).mockResolvedValue({
        success: false,
        errorCodes: ['invalid-input-response'],
      });

      await fc.assert(
        fc.asyncProperty(
          bodyWithoutTokenGen,
          invalidTokenGen,
          async (body, invalidToken) => {
            const bodyWithInvalidToken = { ...body, turnstileToken: invalidToken };

            const response = await app.request('/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyWithInvalidToken),
            });

            expect(response.status).toBe(400);
            const json = await response.json();
            expect(json.success).toBe(false);
            // Either CAPTCHA_REQUIRED (missing/null/undefined) or CAPTCHA_FAILED (whitespace)
            expect(['CAPTCHA_REQUIRED', 'CAPTCHA_FAILED']).toContain(json.error.code);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject requests when verification fails', async () => {
      const app = createTestApp();
      vi.mocked(turnstileService.verify).mockResolvedValue({
        success: false,
        errorCodes: ['invalid-input-response'],
      });

      await fc.assert(
        fc.asyncProperty(bodyWithTokenGen('turnstileToken'), async (body) => {
          const response = await app.request('/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          expect(response.status).toBe(400);
          const json = await response.json();
          expect(json.success).toBe(false);
          expect(json.error.code).toBe('CAPTCHA_FAILED');
        }),
        { numRuns: 50 }
      );
    });

    it('should allow requests with valid token when verification succeeds', async () => {
      const app = createTestApp();
      vi.mocked(turnstileService.verify).mockResolvedValue({
        success: true,
        timestamp: new Date().toISOString(),
      });

      await fc.assert(
        fc.asyncProperty(bodyWithTokenGen('turnstileToken'), async (body) => {
          const response = await app.request('/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          expect(response.status).toBe(200);
          const json = await response.json();
          expect(json.success).toBe(true);
        }),
        { numRuns: 50 }
      );
    });

    it('should remove token from validated body after verification', async () => {
      const app = createTestApp();
      vi.mocked(turnstileService.verify).mockResolvedValue({
        success: true,
      });

      await fc.assert(
        fc.asyncProperty(bodyWithTokenGen('turnstileToken'), async (body) => {
          const response = await app.request('/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          expect(response.status).toBe(200);
          const json = await response.json();
          expect(json.data).toBeDefined();
          // Token should be removed from validated body
          expect(json.data.turnstileToken).toBeUndefined();
          // Other fields should be preserved
          expect(json.data.name).toBe(body.name);
          expect(json.data.email).toBe(body.email);
        }),
        { numRuns: 50 }
      );
    });

    it('should support alternative token field names', async () => {
      const app = createTestApp({ tokenField: 'captchaToken' });
      vi.mocked(turnstileService.verify).mockResolvedValue({
        success: true,
      });

      await fc.assert(
        fc.asyncProperty(bodyWithTokenGen('captchaToken'), async (body) => {
          const response = await app.request('/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          expect(response.status).toBe(200);
          const json = await response.json();
          expect(json.success).toBe(true);
          expect(json.data.captchaToken).toBeUndefined();
        }),
        { numRuns: 50 }
      );
    });

    it('should pass IP address to verification service', async () => {
      const app = createTestApp();
      vi.mocked(turnstileService.verify).mockResolvedValue({
        success: true,
      });

      await fc.assert(
        fc.asyncProperty(
          bodyWithTokenGen('turnstileToken'),
          ipAddressGen,
          async (body, ip) => {
            await app.request('/test', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': ip,
              },
              body: JSON.stringify(body),
            });

            // Verify that the service was called with the IP
            expect(turnstileService.verify).toHaveBeenCalledWith(
              body.turnstileToken,
              ip
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should skip verification when Turnstile is not enabled', async () => {
      vi.mocked(turnstileService.isEnabled).mockReturnValue(false);
      const app = createTestApp();

      await fc.assert(
        fc.asyncProperty(bodyWithoutTokenGen, async (body) => {
          const response = await app.request('/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          // Should pass through without verification
          expect(response.status).toBe(200);
          // Verify service was not called
          expect(turnstileService.verify).not.toHaveBeenCalled();
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Optional Turnstile Middleware', () => {
    it('should allow requests without token when using optional middleware', async () => {
      const app = createOptionalTestApp();

      await fc.assert(
        fc.asyncProperty(bodyWithoutTokenGen, async (body) => {
          const response = await app.request('/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          expect(response.status).toBe(200);
          const json = await response.json();
          expect(json.success).toBe(true);
        }),
        { numRuns: 50 }
      );
    });

    it('should still verify token if provided with optional middleware', async () => {
      const app = createOptionalTestApp();
      vi.mocked(turnstileService.verify).mockResolvedValue({
        success: false,
        errorCodes: ['invalid-input-response'],
      });

      await fc.assert(
        fc.asyncProperty(bodyWithTokenGen('turnstileToken'), async (body) => {
          const response = await app.request('/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          // Should fail verification
          expect(response.status).toBe(400);
          const json = await response.json();
          expect(json.error.code).toBe('CAPTCHA_FAILED');
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON body gracefully', async () => {
      const app = createTestApp();

      const response = await app.request('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_REQUEST');
    });
  });
});
