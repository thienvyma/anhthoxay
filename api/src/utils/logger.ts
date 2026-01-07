/**
 * Structured Logger Utility
 *
 * Provides consistent JSON logging with correlation ID tracking
 * for distributed tracing support.
 *
 * **Feature: high-traffic-resilience**
 * **Validates: Requirements 10.1, 10.2**
 */

import { Context } from 'hono';
import {
  getCorrelationId,
  getCorrelationContext,
  type CorrelationContext,
} from '../middleware/correlation-id';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId: string;
  spanId?: string;
  parentId?: string;
  path?: string;
  method?: string;
  userId?: string;
  errorCode?: string;
  stack?: string;
  [key: string]: unknown;
}

/**
 * Create a structured logger instance
 *
 * @param c - Optional Hono context to extract request info
 * @returns Logger object with debug, info, warn, error methods
 *
 * @example
 * ```ts
 * // In route handler
 * app.get('/api/test', (c) => {
 *   const logger = createLogger(c);
 *   logger.info('Processing request');
 *   logger.error('Something went wrong', { errorCode: 'ERR_001' });
 * });
 *
 * // Without context (system logs)
 * const logger = createLogger();
 * logger.info('Server started');
 * ```
 */
export function createLogger(c?: Context) {
  let correlationId = 'system';
  let spanId: string | undefined;
  let parentId: string | undefined;
  let userId: string | undefined;
  let path: string | undefined;
  let method: string | undefined;

  if (c) {
    correlationId = getCorrelationId(c);
    const context = getCorrelationContext(c);
    spanId = context.spanId;
    parentId = context.parentId;
    userId = c.get('user')?.id;
    path = c.req.path;
    method = c.req.method;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const log = (
    level: LogLevel,
    message: string,
    extra?: Record<string, unknown>
  ) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      spanId,
      parentId,
      path,
      method,
      userId,
      ...extra,
    };

    // Output as JSON for structured logging
    // Use appropriate console method based on level
    const output = JSON.stringify(entry);
    switch (level) {
      case 'error':
        // Always log errors
        console.error(output);
        break;
      case 'warn':
        // Always log warnings
        console.warn(output);
        break;
      case 'debug':
        // Only log debug in development
        if (!isProduction) {
          // eslint-disable-next-line no-console -- Structured logger output
          console.debug(output);
        }
        break;
      case 'info':
        // Only log info in development
        // In production, send to logging service (future enhancement)
        if (!isProduction) {
          // eslint-disable-next-line no-console -- Structured logger output
          console.info(output);
        }
        break;
    }
  };

  return {
    debug: (msg: string, extra?: Record<string, unknown>) =>
      log('debug', msg, extra),
    info: (msg: string, extra?: Record<string, unknown>) =>
      log('info', msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) =>
      log('warn', msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) =>
      log('error', msg, extra),
  };
}

/**
 * Create a logger with explicit correlation context
 * Use this when you need to log with a specific context (e.g., in queue workers)
 *
 * @param context - Correlation context
 * @returns Logger object with debug, info, warn, error methods
 *
 * @example
 * ```ts
 * // In queue worker
 * const logger = createLoggerWithContext({
 *   correlationId: job.data.correlationId,
 *   spanId: 'worker-123',
 * });
 * logger.info('Processing job');
 * ```
 */
export function createLoggerWithContext(
  context: Partial<CorrelationContext> & { correlationId: string }
) {
  const isProduction = process.env.NODE_ENV === 'production';

  const log = (
    level: LogLevel,
    message: string,
    extra?: Record<string, unknown>
  ) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: context.correlationId,
      spanId: context.spanId,
      parentId: context.parentId,
      ...extra,
    };

    const output = JSON.stringify(entry);
    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        if (!isProduction) {
          // eslint-disable-next-line no-console -- Structured logger output
          console.debug(output);
        }
        break;
      case 'info':
        if (!isProduction) {
          // eslint-disable-next-line no-console -- Structured logger output
          console.info(output);
        }
        break;
    }
  };

  return {
    debug: (msg: string, extra?: Record<string, unknown>) =>
      log('debug', msg, extra),
    info: (msg: string, extra?: Record<string, unknown>) =>
      log('info', msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) =>
      log('warn', msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) =>
      log('error', msg, extra),
  };
}

/**
 * Simple logger instance for use without Hono context
 * Use this for system-level logging (startup, shutdown, etc.)
 *
 * @example
 * ```ts
 * import { logger } from './utils/logger';
 *
 * logger.info('Server started');
 * logger.error('Failed to connect to database', { error: err.message });
 * ```
 */
export const logger = createLogger();

export default createLogger;
