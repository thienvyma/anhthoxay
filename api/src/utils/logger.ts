import { Context } from 'hono';
import { getCorrelationId } from '../middleware/correlation-id';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId: string;
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
  const correlationId = c ? getCorrelationId(c) : 'system';
  const userId = c?.get('user')?.id;
  const path = c?.req.path;
  const method = c?.req.method;

  const log = (level: LogLevel, message: string, extra?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
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
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        // Only log debug in development
        if (process.env.NODE_ENV !== 'production') {
          console.log(output);
        }
        break;
      default:
        console.log(output);
    }
  };

  return {
    debug: (msg: string, extra?: Record<string, unknown>) => log('debug', msg, extra),
    info: (msg: string, extra?: Record<string, unknown>) => log('info', msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) => log('warn', msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => log('error', msg, extra),
  };
}

export default createLogger;
