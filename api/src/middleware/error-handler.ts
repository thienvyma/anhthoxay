import { Context } from 'hono';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AuthError } from '../services/auth.service';
import { createLogger } from '../utils/logger';
import { getCorrelationId } from './correlation-id';
import { captureException, setUser } from '../config/sentry';

/**
 * Centralized error handler for Hono
 * 
 * Handles:
 * - ZodError → 400 with validation details
 * - AuthError → status from error.statusCode
 * - Prisma P2025 → 404 Not Found
 * - Prisma P2002 → 409 Conflict
 * - Other errors → 500 Internal Server Error
 * 
 * Always includes correlationId in response for debugging
 * Stack trace included in dev mode only
 * Captures errors to Sentry in production
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
      errorCode: (err as AuthError).code,
      stack: err.stack,
      errorName: err.name,
    });

    // Set user context for Sentry if available
    const user = c.get('user');
    if (user) {
      setUser({ id: user.id, email: user.email, role: user.role });
    }

    // Handle Zod validation errors (don't send to Sentry - client errors)
    if (err instanceof ZodError) {
      return c.json({
        error: 'Validation failed',
        details: err.format(),
        correlationId,
      }, 400);
    }

    // Handle AuthError (custom auth errors - don't send to Sentry for 4xx)
    if (err instanceof AuthError) {
      // Only capture 5xx auth errors to Sentry
      if (err.statusCode >= 500) {
        captureException(err, {
          correlationId,
          path: c.req.path,
          method: c.req.method,
        });
      }
      return c.json({
        error: { code: err.code, message: err.message },
        correlationId,
      }, err.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500);
    }

    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return c.json({
          error: 'Record not found',
          correlationId,
        }, 404);
      }
      if (err.code === 'P2002') {
        return c.json({
          error: 'Record already exists',
          correlationId,
        }, 409);
      }
      // Capture other Prisma errors to Sentry
      captureException(err, {
        correlationId,
        path: c.req.path,
        method: c.req.method,
        prismaCode: err.code,
      });
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
