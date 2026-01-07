/**
 * Cloudflare Turnstile CAPTCHA Middleware
 *
 * Middleware for verifying Turnstile tokens on public form submissions.
 * Supports emergency mode with increased CAPTCHA challenge rate.
 *
 * **Feature: production-scalability, high-traffic-resilience**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 14.5, 14.6**
 */

import type { Context, Next } from 'hono';
import { turnstileService } from '../services/turnstile.service';
import { getIPBlockingService } from '../services/ip-blocking.service';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

/**
 * Options for Turnstile middleware
 */
export interface TurnstileMiddlewareOptions {
  /**
   * Field name in request body containing the Turnstile token
   * @default 'turnstileToken'
   */
  tokenField?: string;

  /**
   * Alternative field names to check for the token
   * @default ['captchaToken', 'cfTurnstileResponse']
   */
  alternativeFields?: string[];

  /**
   * Whether to skip verification in development mode
   * @default true
   */
  skipInDevelopment?: boolean;

  /**
   * Whether to require CAPTCHA in emergency mode even if normally optional
   * @default true
   */
  enforceInEmergencyMode?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get client IP address from request headers
 */
function getClientIp(c: Context): string | undefined {
  return (
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    c.req.header('X-Real-IP')
  );
}

/**
 * Extract Turnstile token from request body
 */
function extractToken(
  body: Record<string, unknown>,
  tokenField: string,
  alternativeFields: string[]
): string | undefined {
  // Check primary field
  if (body[tokenField] && typeof body[tokenField] === 'string') {
    return body[tokenField] as string;
  }

  // Check alternative fields
  for (const field of alternativeFields) {
    if (body[field] && typeof body[field] === 'string') {
      return body[field] as string;
    }
  }

  return undefined;
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Turnstile verification middleware
 *
 * Verifies the Turnstile token before allowing the request to proceed.
 * Returns CAPTCHA_REQUIRED if token is missing, CAPTCHA_FAILED if verification fails.
 *
 * @param options - Middleware configuration options
 * @returns Hono middleware function
 *
 * @example
 * ```ts
 * // Basic usage
 * app.post('/leads', turnstileMiddleware(), validate(schema), async (c) => {
 *   // Token already verified, proceed with handler
 * });
 *
 * // With custom token field
 * app.post('/signup', turnstileMiddleware({ tokenField: 'captcha' }), async (c) => {
 *   // ...
 * });
 * ```
 */
export function turnstileMiddleware(options: TurnstileMiddlewareOptions = {}) {
  const {
    tokenField = 'turnstileToken',
    alternativeFields = ['captchaToken', 'cfTurnstileResponse'],
    skipInDevelopment = true,
  } = options;

  return async (c: Context, next: Next) => {
    // Skip in development if configured and Turnstile is not enabled
    if (skipInDevelopment && !turnstileService.isEnabled()) {
      logger.warn('Turnstile verification skipped - not configured');
      await next();
      return;
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request body',
          },
        },
        400
      );
    }

    // Extract token from body
    const token = extractToken(body, tokenField, alternativeFields);

    if (!token) {
      logger.warn('Turnstile token missing from request', {
        path: c.req.path,
        method: c.req.method,
      });

      return c.json(
        {
          success: false,
          error: {
            code: 'CAPTCHA_REQUIRED',
            message: 'CAPTCHA verification required',
          },
        },
        400
      );
    }

    // Verify token
    const ip = getClientIp(c);
    const result = await turnstileService.verify(token, ip);

    if (!result.success) {
      logger.warn('Turnstile verification failed', {
        path: c.req.path,
        method: c.req.method,
        errorCodes: result.errorCodes,
        ip,
      });

      return c.json(
        {
          success: false,
          error: {
            code: 'CAPTCHA_FAILED',
            message: 'CAPTCHA verification failed',
          },
        },
        400
      );
    }

    // Remove turnstile token fields from body before passing to handler
    const cleanedBody = { ...body };
    delete cleanedBody[tokenField];
    for (const field of alternativeFields) {
      delete cleanedBody[field];
    }

    // Store cleaned body in context for downstream handlers
    c.set('validatedBody', cleanedBody);
    c.set('rawBody', body);

    await next();
  };
}

/**
 * Optional Turnstile middleware - doesn't fail if token is missing
 *
 * Useful for endpoints that should work with or without CAPTCHA,
 * but should verify if a token is provided.
 * 
 * In emergency mode, CAPTCHA becomes required (enforceInEmergencyMode option).
 * 
 * **Feature: high-traffic-resilience**
 * **Validates: Requirements 14.5, 14.6**
 *
 * @param options - Middleware configuration options
 * @returns Hono middleware function
 */
export function optionalTurnstileMiddleware(options: TurnstileMiddlewareOptions = {}) {
  const {
    tokenField = 'turnstileToken',
    alternativeFields = ['captchaToken', 'cfTurnstileResponse'],
    enforceInEmergencyMode = true,
  } = options;

  return async (c: Context, next: Next) => {
    // Skip if Turnstile is not enabled
    if (!turnstileService.isEnabled()) {
      await next();
      return;
    }

    // Check if emergency mode is active
    let isEmergency = false;
    if (enforceInEmergencyMode) {
      try {
        const ipBlockingService = getIPBlockingService();
        isEmergency = await ipBlockingService.isEmergencyMode();
      } catch {
        // Ignore errors checking emergency mode
      }
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      await next();
      return;
    }

    // Extract token from body
    const token = extractToken(body, tokenField, alternativeFields);

    // If no token and emergency mode is active, require CAPTCHA
    if (!token && isEmergency) {
      logger.warn('CAPTCHA required in emergency mode', {
        path: c.req.path,
        method: c.req.method,
      });

      return c.json(
        {
          success: false,
          error: {
            code: 'CAPTCHA_REQUIRED',
            message: 'CAPTCHA verification required (emergency mode active)',
          },
        },
        400
      );
    }

    // If no token and not emergency mode, just proceed
    if (!token) {
      await next();
      return;
    }

    // Verify token if provided
    const ip = getClientIp(c);
    const result = await turnstileService.verify(token, ip);

    if (!result.success) {
      logger.warn('Optional Turnstile verification failed', {
        path: c.req.path,
        errorCodes: result.errorCodes,
      });

      return c.json(
        {
          success: false,
          error: {
            code: 'CAPTCHA_FAILED',
            message: 'CAPTCHA verification failed',
          },
        },
        400
      );
    }

    // Remove turnstile token fields from body
    const cleanedBody = { ...body };
    delete cleanedBody[tokenField];
    for (const field of alternativeFields) {
      delete cleanedBody[field];
    }

    c.set('validatedBody', cleanedBody);
    c.set('rawBody', body);

    await next();
  };
}

export default turnstileMiddleware;
