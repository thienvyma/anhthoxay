/**
 * Prometheus Metrics Routes
 *
 * Provides metrics endpoint in Prometheus text format for
 * scraping by Prometheus server.
 *
 * **Feature: production-scalability**
 * **Requirements: 12.1**
 */

import { Hono } from 'hono';
import { prometheusMetrics } from '../services/prometheus.service';

/**
 * Creates Prometheus metrics routes
 */
export function createMetricsRoutes() {
  const app = new Hono();

  /**
   * @route GET /metrics
   * @description Prometheus metrics endpoint
   * @access Public (should be protected in production via network policy)
   *
   * Returns metrics in Prometheus text exposition format.
   * This endpoint is designed to be scraped by Prometheus.
   *
   * Metrics included:
   * - http_requests_total - Total HTTP requests by method, path, status
   * - http_request_duration_seconds - HTTP request duration histogram
   * - db_query_duration_seconds - Database query duration histogram
   * - cache_hits_total - Total cache hits
   * - cache_misses_total - Total cache misses
   * - queue_jobs_total - Total queue jobs by queue and status
   * - rate_limit_exceeded_total - Total rate limit exceeded events
   */
  app.get('/', (c) => {
    const metricsText = prometheusMetrics.toPrometheusFormat();

    // Set content type for Prometheus
    c.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');

    return c.text(metricsText);
  });

  return app;
}
