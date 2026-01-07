/**
 * Prometheus Metrics Middleware
 *
 * Records HTTP request metrics for Prometheus monitoring.
 *
 * **Feature: production-scalability**
 * **Requirements: 12.2, 12.3**
 */

import type { Context, Next } from 'hono';
import { prometheusMetrics } from '../services/prometheus.service';

/**
 * Middleware to record HTTP request metrics
 *
 * Records:
 * - http_requests_total counter with method, path, status labels
 * - http_request_duration_seconds histogram
 *
 * @example
 * ```ts
 * app.use('*', prometheusMiddleware());
 * ```
 */
export function prometheusMiddleware() {
  return async (c: Context, next: Next) => {
    const start = Date.now();

    await next();

    const duration = Date.now() - start;
    const method = c.req.method;
    const path = c.req.path;
    const status = c.res.status;

    // Record metrics
    prometheusMetrics.recordHttpRequest(method, path, status, duration);
  };
}
