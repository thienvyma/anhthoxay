import { Context } from 'hono';
import { ZodError } from 'zod';
import { FirestoreError, NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../errors/firestore.errors';
import { createLogger } from '../utils/logger';
import { getCorrelationId } from './correlation-id';
import { captureException, setUser } from '../config/sentry';

/**
 * Centralized error handler for Hono (Firebase/Firestore)
 * 
 * Handles:
 * - ZodError → 400 with validation details
 * - FirestoreError → status from error.statusCode
 * - NotFoundError → 404 Not Found
 * - ValidationError → 400 Bad Request
 * - ConflictError → 409 Conflict
 * - ForbiddenError → 403 Forbidden
 * - Other errors → 500 Internal Server Error
 * 
 * Always includes correlationId in response for debugging
 * Stack trace included in dev mode only
 * Captures errors to Sentry in production
 *
 * **Feature: firebase-phase3-firestore**
 * **Requirements: 13.1, 13.2, 13.3, 13.4, 13.5**
 * 
 * @example
 * ```ts
 * // In main.ts
 * app.onError(errorHandler());
 * ```
 */
export function errorHandler() {
  return async (err: Error, c: Context) => {
    const logger = createLogger(c);
    const correlationId = getCorrelationId(c);
    const isProd = process.env.NODE_ENV === 'production';

    // Log error with full details (always include stack in logs)
    logger.error(err.message, {
      errorCode: (err as FirestoreError).code,
      stack: err.stack,
      errorName: err.name,
    });

    // Set user context for Sentry if available
    const user = c.get('user');
    if (user) {
      setUser({ id: user.uid, email: user.email, role: user.role });
    }

    // Handle Zod validation errors (don't send to Sentry - client errors)
    if (err instanceof ZodError) {
      return c.json({
        error: 'Validation failed',
        details: err.format(),
        correlationId,
      }, 400);
    }

    // Handle Firestore errors
    if (err instanceof FirestoreError) {
      // Only capture 5xx errors to Sentry
      if (err.statusCode >= 500) {
        captureException(err, {
          correlationId,
          path: c.req.path,
          method: c.req.method,
        });
      }

      // Handle specific error types
      if (err instanceof NotFoundError) {
        return c.json({
          error: err.message,
          code: err.code,
          correlationId,
        }, 404);
      }

      if (err instanceof ValidationError) {
        return c.json({
          error: err.message,
          code: err.code,
          fields: err.fields,
          correlationId,
        }, 400);
      }

      if (err instanceof ConflictError) {
        return c.json({
          error: err.message,
          code: err.code,
          correlationId,
        }, 409);
      }

      if (err instanceof ForbiddenError) {
        return c.json({
          error: err.message,
          code: err.code,
          correlationId,
        }, 403);
      }

      // Generic Firestore error
      return c.json({
        error: err.message,
        code: err.code,
        correlationId,
      }, err.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503);
    }

    // Handle Firebase Auth errors
    if (err.name === 'FirebaseAuthError' || (err as { code?: string }).code?.startsWith('auth/')) {
      const authCode = (err as { code?: string }).code;
      
      if (authCode === 'auth/id-token-expired') {
        return c.json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          correlationId,
        }, 401);
      }

      if (authCode === 'auth/id-token-revoked') {
        return c.json({
          error: 'Token revoked',
          code: 'TOKEN_REVOKED',
          correlationId,
        }, 401);
      }

      if (authCode === 'auth/invalid-id-token' || authCode === 'auth/argument-error') {
        return c.json({
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
          correlationId,
        }, 401);
      }

      return c.json({
        error: 'Authentication failed',
        code: authCode || 'AUTH_ERROR',
        correlationId,
      }, 401);
    }

    // Capture all 500 errors to Sentry
    captureException(err, {
      correlationId,
      path: c.req.path,
      method: c.req.method,
    });

    // Generic error response
    // Include stack trace in development mode for debugging
    return c.json({
      error: 'Internal server error',
      correlationId,
      ...(isProd ? {} : { stack: err.stack, message: err.message }),
    }, 500);
  };
}

export default errorHandler;
