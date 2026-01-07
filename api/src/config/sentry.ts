/**
 * Sentry Error Tracking Configuration
 *
 * Provides error tracking and performance monitoring for production.
 *
 * Setup:
 * 1. Install Sentry SDK: pnpm add @sentry/node
 * 2. Create a Sentry account at https://sentry.io
 * 3. Create a new project for Node.js
 * 4. Copy the DSN and set SENTRY_DSN environment variable
 *
 * **Feature: production-readiness**
 * **Requirements: FR-5.3**
 */

import { logger } from '../utils/logger';

// Sentry module reference (dynamically imported)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

/**
 * Initialize Sentry error tracking
 *
 * Only initializes in production when SENTRY_DSN is configured.
 * In development, errors are logged to console instead.
 *
 * @example
 * ```ts
 * // In main.ts, before app initialization
 * await initSentry();
 * ```
 */
export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!dsn) {
    if (environment === 'production') {
      logger.warn('SENTRY_DSN not configured - error tracking disabled in production');
    } else {
      logger.info('Sentry disabled in development (no SENTRY_DSN)');
    }
    return;
  }

  try {
    // Dynamic import to avoid bundling Sentry in development
    Sentry = await import('@sentry/node');

    const config: SentryConfig = {
      dsn,
      environment,
      release: process.env.npm_package_version || '1.0.0',
      // Capture 10% of transactions for performance monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Capture 10% of transactions for profiling
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    };

    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      tracesSampleRate: config.tracesSampleRate,
      // Integrations for Node.js
      integrations: [
        // HTTP integration for tracing requests
        Sentry.httpIntegration(),
        // Node.js specific integrations
        Sentry.onUncaughtExceptionIntegration(),
        Sentry.onUnhandledRejectionIntegration(),
      ],
      // Filter out sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }
        return event;
      },
    });

    logger.info('Sentry initialized successfully', { environment, release: config.release });
  } catch (error) {
    logger.error('Failed to initialize Sentry', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Capture an exception in Sentry
 *
 * @param error - The error to capture
 * @param context - Additional context to attach to the error
 *
 * @example
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error, { userId: user.id, action: 'riskyOperation' });
 * }
 * ```
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  if (Sentry) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // Fallback to console logging in development
    logger.error('Exception captured', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    });
  }
}

/**
 * Capture a message in Sentry
 *
 * @param message - The message to capture
 * @param level - Severity level
 * @param context - Additional context
 *
 * @example
 * ```ts
 * captureMessage('User performed unusual action', 'warning', { userId: user.id });
 * ```
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, unknown>
): void {
  if (Sentry) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    // Fallback to console logging
    const logFn = level === 'error' || level === 'fatal' ? logger.error : logger.info;
    logFn(message, context);
  }
}

/**
 * Set user context for Sentry
 *
 * @param user - User information to attach to errors
 *
 * @example
 * ```ts
 * // After user authentication
 * setUser({ id: user.id, email: user.email, role: user.role });
 * ```
 */
export function setUser(user: { id: string; email?: string; role?: string } | null): void {
  if (Sentry) {
    Sentry.setUser(user);
  }
}

/**
 * Add breadcrumb for debugging
 *
 * @param breadcrumb - Breadcrumb data
 *
 * @example
 * ```ts
 * addBreadcrumb({
 *   category: 'auth',
 *   message: 'User logged in',
 *   level: 'info',
 * });
 * ```
 */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
}): void {
  if (Sentry) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return Sentry !== null;
}

/**
 * Flush Sentry events before shutdown
 *
 * @param timeout - Timeout in milliseconds
 */
export async function flushSentry(timeout = 2000): Promise<void> {
  if (Sentry) {
    await Sentry.close(timeout);
    logger.info('Sentry flushed successfully');
  }
}
