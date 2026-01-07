/**
 * Prometheus Metrics Service
 *
 * Provides application metrics in Prometheus text format for
 * monitoring and alerting via Grafana.
 *
 * **Feature: production-scalability**
 * **Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**
 */

// ============================================
// TYPES
// ============================================

/**
 * Duration histogram buckets
 */
interface HistogramData {
  sum: number;
  count: number;
  buckets: Map<number, number>;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Default histogram buckets for HTTP request duration (in seconds)
 */
const HTTP_DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

/**
 * Default histogram buckets for DB query duration (in seconds)
 */
const DB_DURATION_BUCKETS = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5];

// ============================================
// PROMETHEUS METRICS CLASS
// ============================================

/**
 * PrometheusMetrics provides application metrics collection
 * and export in Prometheus text format.
 *
 * Features:
 * - HTTP request metrics (count, duration)
 * - Database query metrics (duration)
 * - Cache metrics (hits, misses)
 * - Queue job metrics (by queue and status)
 * - Rate limit exceeded metrics
 *
 * @example
 * ```ts
 * // Record HTTP request
 * prometheusMetrics.recordHttpRequest('GET', '/api/users', 200, 45);
 *
 * // Record cache hit/miss
 * prometheusMetrics.recordCacheHit();
 * prometheusMetrics.recordCacheMiss();
 *
 * // Export metrics
 * const metricsText = prometheusMetrics.toPrometheusFormat();
 * ```
 */
export class PrometheusMetrics {
  // HTTP request metrics
  private httpRequestsTotal: Map<string, number> = new Map();
  private httpRequestDuration: HistogramData = {
    sum: 0,
    count: 0,
    buckets: new Map(HTTP_DURATION_BUCKETS.map((b) => [b, 0])),
  };

  // Database query metrics
  private dbQueryDuration: HistogramData = {
    sum: 0,
    count: 0,
    buckets: new Map(DB_DURATION_BUCKETS.map((b) => [b, 0])),
  };

  // Cache metrics
  private cacheHits = 0;
  private cacheMisses = 0;

  // Queue job metrics
  private queueJobsTotal: Map<string, number> = new Map();

  // Rate limit metrics
  private rateLimitExceeded: Map<string, number> = new Map();

  // ============================================
  // HTTP REQUEST METRICS
  // ============================================

  /**
   * Record an HTTP request
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - Request path (normalized)
   * @param status - HTTP status code
   * @param durationMs - Request duration in milliseconds
   */
  recordHttpRequest(method: string, path: string, status: number, durationMs: number): void {
    // Normalize path to avoid high cardinality
    const normalizedPath = this.normalizePath(path);
    // Use | as separator to avoid conflicts with : in paths
    const key = `${method}|${normalizedPath}|${status}`;

    // Increment counter
    this.httpRequestsTotal.set(key, (this.httpRequestsTotal.get(key) || 0) + 1);

    // Record duration in histogram (convert to seconds)
    const durationSeconds = durationMs / 1000;
    this.httpRequestDuration.sum += durationSeconds;
    this.httpRequestDuration.count++;

    // Update histogram buckets
    for (const bucket of HTTP_DURATION_BUCKETS) {
      if (durationSeconds <= bucket) {
        this.httpRequestDuration.buckets.set(
          bucket,
          (this.httpRequestDuration.buckets.get(bucket) || 0) + 1
        );
      }
    }
  }

  // ============================================
  // DATABASE QUERY METRICS
  // ============================================

  /**
   * Record a database query duration
   *
   * @param durationMs - Query duration in milliseconds
   */
  recordDbQuery(durationMs: number): void {
    const durationSeconds = durationMs / 1000;
    this.dbQueryDuration.sum += durationSeconds;
    this.dbQueryDuration.count++;

    // Update histogram buckets
    for (const bucket of DB_DURATION_BUCKETS) {
      if (durationSeconds <= bucket) {
        this.dbQueryDuration.buckets.set(
          bucket,
          (this.dbQueryDuration.buckets.get(bucket) || 0) + 1
        );
      }
    }
  }

  // ============================================
  // CACHE METRICS
  // ============================================

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Get current cache hit count
   */
  getCacheHits(): number {
    return this.cacheHits;
  }

  /**
   * Get current cache miss count
   */
  getCacheMisses(): number {
    return this.cacheMisses;
  }

  // ============================================
  // QUEUE JOB METRICS
  // ============================================

  /**
   * Record a queue job
   *
   * @param queue - Queue name
   * @param status - Job status (completed, failed, active, waiting)
   */
  recordQueueJob(queue: string, status: 'completed' | 'failed' | 'active' | 'waiting'): void {
    const key = `${queue}|${status}`;
    this.queueJobsTotal.set(key, (this.queueJobsTotal.get(key) || 0) + 1);
  }

  /**
   * Get queue job count
   *
   * @param queue - Queue name
   * @param status - Job status
   */
  getQueueJobCount(queue: string, status: 'completed' | 'failed' | 'active' | 'waiting'): number {
    const key = `${queue}|${status}`;
    return this.queueJobsTotal.get(key) || 0;
  }

  // ============================================
  // RATE LIMIT METRICS
  // ============================================

  /**
   * Record a rate limit exceeded event
   *
   * @param ip - Client IP address
   * @param path - Request path
   */
  recordRateLimitExceeded(ip: string, path: string): void {
    // Anonymize IP for privacy (keep first 3 octets)
    const anonymizedIp = this.anonymizeIp(ip);
    const normalizedPath = this.normalizePath(path);
    const key = `${anonymizedIp}|${normalizedPath}`;
    this.rateLimitExceeded.set(key, (this.rateLimitExceeded.get(key) || 0) + 1);
  }

  /**
   * Get rate limit exceeded count
   *
   * @param ip - Client IP address
   * @param path - Request path
   */
  getRateLimitExceededCount(ip: string, path: string): number {
    const anonymizedIp = this.anonymizeIp(ip);
    const normalizedPath = this.normalizePath(path);
    const key = `${anonymizedIp}|${normalizedPath}`;
    return this.rateLimitExceeded.get(key) || 0;
  }

  // ============================================
  // PROMETHEUS FORMAT EXPORT
  // ============================================

  /**
   * Export all metrics in Prometheus text format
   *
   * @returns Metrics in Prometheus exposition format
   */
  toPrometheusFormat(): string {
    const lines: string[] = [];

    // HTTP requests total counter
    lines.push('# HELP http_requests_total Total number of HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    this.httpRequestsTotal.forEach((count, key) => {
      const [method, path, status] = key.split('|');
      lines.push(
        `http_requests_total{method="${method}",path="${this.escapeLabel(path)}",status="${status}"} ${count}`
      );
    });

    // HTTP request duration histogram
    lines.push('');
    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds');
    lines.push('# TYPE http_request_duration_seconds histogram');
    this.httpRequestDuration.buckets.forEach((count, bucket) => {
      lines.push(`http_request_duration_seconds_bucket{le="${bucket}"} ${count}`);
    });
    lines.push(`http_request_duration_seconds_bucket{le="+Inf"} ${this.httpRequestDuration.count}`);
    lines.push(`http_request_duration_seconds_sum ${this.httpRequestDuration.sum.toFixed(6)}`);
    lines.push(`http_request_duration_seconds_count ${this.httpRequestDuration.count}`);

    // Database query duration histogram
    lines.push('');
    lines.push('# HELP db_query_duration_seconds Database query duration in seconds');
    lines.push('# TYPE db_query_duration_seconds histogram');
    this.dbQueryDuration.buckets.forEach((count, bucket) => {
      lines.push(`db_query_duration_seconds_bucket{le="${bucket}"} ${count}`);
    });
    lines.push(`db_query_duration_seconds_bucket{le="+Inf"} ${this.dbQueryDuration.count}`);
    lines.push(`db_query_duration_seconds_sum ${this.dbQueryDuration.sum.toFixed(6)}`);
    lines.push(`db_query_duration_seconds_count ${this.dbQueryDuration.count}`);

    // Cache metrics
    lines.push('');
    lines.push('# HELP cache_hits_total Total number of cache hits');
    lines.push('# TYPE cache_hits_total counter');
    lines.push(`cache_hits_total ${this.cacheHits}`);

    lines.push('');
    lines.push('# HELP cache_misses_total Total number of cache misses');
    lines.push('# TYPE cache_misses_total counter');
    lines.push(`cache_misses_total ${this.cacheMisses}`);

    // Queue job metrics
    lines.push('');
    lines.push('# HELP queue_jobs_total Total number of queue jobs by queue and status');
    lines.push('# TYPE queue_jobs_total counter');
    this.queueJobsTotal.forEach((count, key) => {
      const [queue, status] = key.split('|');
      lines.push(`queue_jobs_total{queue="${queue}",status="${status}"} ${count}`);
    });

    // Rate limit exceeded metrics
    lines.push('');
    lines.push('# HELP rate_limit_exceeded_total Total number of rate limit exceeded events');
    lines.push('# TYPE rate_limit_exceeded_total counter');
    this.rateLimitExceeded.forEach((count, key) => {
      const [ip, path] = key.split('|');
      lines.push(
        `rate_limit_exceeded_total{ip="${this.escapeLabel(ip)}",path="${this.escapeLabel(path)}"} ${count}`
      );
    });

    return lines.join('\n');
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Normalize path to reduce cardinality
   * Replaces UUIDs and numeric IDs with placeholders
   *
   * @param path - Original request path
   * @returns Normalized path
   */
  private normalizePath(path: string): string {
    return path
      // Replace UUIDs
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      // Replace numeric IDs
      .replace(/\/\d+/g, '/:id')
      // Remove trailing slashes
      .replace(/\/+$/, '')
      // Ensure leading slash
      .replace(/^([^/])/, '/$1');
  }

  /**
   * Anonymize IP address for privacy
   * Keeps first 3 octets for IPv4, first 3 groups for IPv6
   *
   * @param ip - Original IP address
   * @returns Anonymized IP
   */
  private anonymizeIp(ip: string): string {
    if (ip.includes(':')) {
      // IPv6: keep first 3 groups
      const parts = ip.split(':');
      return parts.slice(0, 3).join(':') + ':x:x:x:x:x';
    }
    // IPv4: keep first 3 octets
    const parts = ip.split('.');
    return parts.slice(0, 3).join('.') + '.x';
  }

  /**
   * Escape label value for Prometheus format
   *
   * @param value - Label value
   * @returns Escaped value
   */
  private escapeLabel(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.httpRequestsTotal.clear();
    this.httpRequestDuration = {
      sum: 0,
      count: 0,
      buckets: new Map(HTTP_DURATION_BUCKETS.map((b) => [b, 0])),
    };
    this.dbQueryDuration = {
      sum: 0,
      count: 0,
      buckets: new Map(DB_DURATION_BUCKETS.map((b) => [b, 0])),
    };
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.queueJobsTotal.clear();
    this.rateLimitExceeded.clear();
  }

  /**
   * Get HTTP request count for a specific endpoint
   *
   * @param method - HTTP method
   * @param path - Request path
   * @param status - HTTP status code
   */
  getHttpRequestCount(method: string, path: string, status: number): number {
    const normalizedPath = this.normalizePath(path);
    const key = `${method}|${normalizedPath}|${status}`;
    return this.httpRequestsTotal.get(key) || 0;
  }

  /**
   * Get total HTTP request count
   */
  getTotalHttpRequests(): number {
    let total = 0;
    this.httpRequestsTotal.forEach((count) => {
      total += count;
    });
    return total;
  }

  /**
   * Get average HTTP request duration in milliseconds
   */
  getAverageHttpDuration(): number {
    if (this.httpRequestDuration.count === 0) return 0;
    return (this.httpRequestDuration.sum / this.httpRequestDuration.count) * 1000;
  }

  /**
   * Get total DB query count
   */
  getTotalDbQueries(): number {
    return this.dbQueryDuration.count;
  }

  /**
   * Get average DB query duration in milliseconds
   */
  getAverageDbDuration(): number {
    if (this.dbQueryDuration.count === 0) return 0;
    return (this.dbQueryDuration.sum / this.dbQueryDuration.count) * 1000;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Singleton Prometheus metrics instance
 */
export const prometheusMetrics = new PrometheusMetrics();

export default PrometheusMetrics;
