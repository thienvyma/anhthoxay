/**
 * Response Time Monitoring Middleware
 *
 * Tracks response times and logs slow requests for performance monitoring.
 *
 * Features:
 * - Adds X-Response-Time header to all responses
 * - Logs requests taking longer than threshold
 * - Provides request timing metrics
 *
 * **Feature: production-readiness**
 * **Requirements: FR-5.2**
 */

import { Context, Next } from 'hono';
import { logger } from '../utils/logger';

interface MonitoringOptions {
  /**
   * Threshold in milliseconds for slow request logging
   * @default 500
   */
  slowThreshold?: number;

  /**
   * Whether to log all requests (not just slow ones)
   * @default false
   */
  logAllRequests?: boolean;

  /**
   * Paths to exclude from monitoring
   * @default ['/health', '/health/ready', '/health/live']
   */
  excludePaths?: string[];
}

/**
 * Response time monitoring middleware
 *
 * @param options - Monitoring configuration options
 * @returns Hono middleware function
 *
 * @example
 * ```ts
 * // Basic usage
 * app.use('*', responseTimeMonitoring());
 *
 * // With custom threshold
 * app.use('*', responseTimeMonitoring({ slowThreshold: 1000 }));
 *
 * // Log all requests
 * app.use('*', responseTimeMonitoring({ logAllRequests: true }));
 * ```
 */
export function responseTimeMonitoring(options: MonitoringOptions = {}) {
  const {
    slowThreshold = 500,
    logAllRequests = false,
    excludePaths = ['/health', '/health/ready', '/health/live'],
  } = options;

  return async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    // Skip excluded paths
    if (excludePaths.some((p) => path.startsWith(p))) {
      await next();
      return;
    }

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    // Add response time header
    c.header('X-Response-Time', `${duration}ms`);

    // Log slow requests
    if (duration > slowThreshold) {
      logger.warn('Slow request detected', {
        method,
        path,
        duration,
        status,
        threshold: slowThreshold,
      });
    } else if (logAllRequests) {
      logger.info('Request completed', {
        method,
        path,
        duration,
        status,
      });
    }
  };
}

/**
 * Request metrics collector
 *
 * Collects and aggregates request metrics for monitoring dashboards.
 * Can be extended to send metrics to external services (Prometheus, DataDog, etc.)
 */
interface RequestMetrics {
  totalRequests: number;
  totalDuration: number;
  slowRequests: number;
  errorRequests: number;
  pathMetrics: Map<string, PathMetrics>;
}

interface PathMetrics {
  count: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  errors: number;
}

class MetricsCollector {
  private metrics: RequestMetrics = {
    totalRequests: 0,
    totalDuration: 0,
    slowRequests: 0,
    errorRequests: 0,
    pathMetrics: new Map(),
  };

  private slowThreshold: number;

  constructor(slowThreshold = 500) {
    this.slowThreshold = slowThreshold;
  }

  record(path: string, duration: number, status: number): void {
    this.metrics.totalRequests++;
    this.metrics.totalDuration += duration;

    if (duration > this.slowThreshold) {
      this.metrics.slowRequests++;
    }

    if (status >= 400) {
      this.metrics.errorRequests++;
    }

    // Update path-specific metrics
    const pathMetrics = this.metrics.pathMetrics.get(path) || {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errors: 0,
    };

    pathMetrics.count++;
    pathMetrics.totalDuration += duration;
    pathMetrics.minDuration = Math.min(pathMetrics.minDuration, duration);
    pathMetrics.maxDuration = Math.max(pathMetrics.maxDuration, duration);

    if (status >= 400) {
      pathMetrics.errors++;
    }

    this.metrics.pathMetrics.set(path, pathMetrics);
  }

  getMetrics(): {
    totalRequests: number;
    averageDuration: number;
    slowRequests: number;
    errorRate: number;
    topPaths: Array<{ path: string; count: number; avgDuration: number }>;
  } {
    const avgDuration =
      this.metrics.totalRequests > 0
        ? Math.round(this.metrics.totalDuration / this.metrics.totalRequests)
        : 0;

    const errorRate =
      this.metrics.totalRequests > 0
        ? Math.round((this.metrics.errorRequests / this.metrics.totalRequests) * 100)
        : 0;

    // Get top 10 paths by request count
    const topPaths = Array.from(this.metrics.pathMetrics.entries())
      .map(([path, metrics]) => ({
        path,
        count: metrics.count,
        avgDuration: Math.round(metrics.totalDuration / metrics.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests: this.metrics.totalRequests,
      averageDuration: avgDuration,
      slowRequests: this.metrics.slowRequests,
      errorRate,
      topPaths,
    };
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      totalDuration: 0,
      slowRequests: 0,
      errorRequests: 0,
      pathMetrics: new Map(),
    };
  }
}

// Singleton metrics collector
export const metricsCollector = new MetricsCollector();

/**
 * Advanced monitoring middleware with metrics collection
 *
 * @param options - Monitoring configuration options
 * @returns Hono middleware function
 */
export function advancedMonitoring(options: MonitoringOptions = {}) {
  const {
    slowThreshold = 500,
    excludePaths = ['/health', '/health/ready', '/health/live'],
  } = options;

  return async (c: Context, next: Next) => {
    const start = Date.now();
    const path = c.req.path;

    // Skip excluded paths
    if (excludePaths.some((p) => path.startsWith(p))) {
      await next();
      return;
    }

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    // Add response time header
    c.header('X-Response-Time', `${duration}ms`);

    // Record metrics
    metricsCollector.record(path, duration, status);

    // Log slow requests
    if (duration > slowThreshold) {
      logger.warn('Slow request detected', {
        method: c.req.method,
        path,
        duration,
        status,
      });
    }
  };
}
