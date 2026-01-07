/**
 * Prometheus Metrics Service Property Tests
 *
 * Property-based tests for Prometheus metrics collection
 * and export in Prometheus text format.
 *
 * **Feature: production-scalability**
 * **Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PrometheusMetrics } from './prometheus.service';

// ============================================
// GENERATORS
// ============================================

/**
 * Generator for HTTP methods
 */
const httpMethodGen = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

/**
 * Generator for API paths
 */
const apiPathGen = fc.oneof(
  fc.constant('/api/users'),
  fc.constant('/api/leads'),
  fc.constant('/api/projects'),
  fc.constant('/api/settings'),
  fc.constant('/api/auth/login'),
  fc.constant('/api/blog/posts'),
  // Paths with IDs
  fc.uuid().map((id) => `/api/users/${id}`),
  fc.uuid().map((id) => `/api/projects/${id}`),
  fc.integer({ min: 1, max: 9999 }).map((id) => `/api/leads/${id}`)
);

/**
 * Generator for HTTP status codes
 */
const httpStatusGen = fc.constantFrom(200, 201, 204, 400, 401, 403, 404, 500, 502, 503);

/**
 * Generator for request duration in milliseconds (1ms to 10s)
 */
const durationMsGen = fc.integer({ min: 1, max: 10000 });

/**
 * Generator for queue names
 */
const queueNameGen = fc.constantFrom('email', 'sync', 'notification');

/**
 * Generator for queue job status
 */
const queueStatusGen = fc.constantFrom('completed', 'failed', 'active', 'waiting') as fc.Arbitrary<
  'completed' | 'failed' | 'active' | 'waiting'
>;

/**
 * Generator for IP addresses
 */
const ipAddressGen = fc.oneof(
  // IPv4
  fc
    .tuple(
      fc.integer({ min: 1, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    )
    .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
  // IPv6 (simplified)
  fc.constant('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
);

// ============================================
// HELPER FUNCTION
// ============================================

/**
 * Create a fresh metrics instance for each test
 */
function createFreshMetrics(): PrometheusMetrics {
  return new PrometheusMetrics();
}

// ============================================
// PROPERTY TESTS
// ============================================

describe('PrometheusMetrics', () => {
  // ============================================
  // Property 24: Prometheus metrics format
  // ============================================

  /**
   * **Feature: production-scalability, Property 24: Prometheus metrics format**
   * **Validates: Requirements 12.1, 12.2, 12.3, 12.5, 12.6, 12.7**
   *
   * Property: The metrics output should always be valid Prometheus text format
   * with correct HELP, TYPE, and metric lines.
   */
  describe('Property 24: Prometheus metrics format', () => {
    it('should produce valid Prometheus format for HTTP request metrics', () => {
      fc.assert(
        fc.property(
          httpMethodGen,
          apiPathGen,
          httpStatusGen,
          durationMsGen,
          (method, path, status, duration) => {
            const metrics = createFreshMetrics();
            metrics.recordHttpRequest(method, path, status, duration);
            const output = metrics.toPrometheusFormat();

            // Should contain http_requests_total metric
            expect(output).toContain('# HELP http_requests_total');
            expect(output).toContain('# TYPE http_requests_total counter');
            expect(output).toMatch(/http_requests_total\{method="[A-Z]+",path="[^"]+",status="\d+"\} \d+/);

            // Should contain http_request_duration_seconds histogram
            expect(output).toContain('# HELP http_request_duration_seconds');
            expect(output).toContain('# TYPE http_request_duration_seconds histogram');
            expect(output).toMatch(/http_request_duration_seconds_bucket\{le="[^"]+"\} \d+/);
            expect(output).toMatch(/http_request_duration_seconds_sum \d+\.\d+/);
            expect(output).toMatch(/http_request_duration_seconds_count \d+/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid Prometheus format for cache metrics', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (hits, misses) => {
            const metrics = createFreshMetrics();
            
            // Record cache hits and misses
            for (let i = 0; i < hits; i++) {
              metrics.recordCacheHit();
            }
            for (let i = 0; i < misses; i++) {
              metrics.recordCacheMiss();
            }

            const output = metrics.toPrometheusFormat();

            // Should contain cache_hits_total metric
            expect(output).toContain('# HELP cache_hits_total');
            expect(output).toContain('# TYPE cache_hits_total counter');
            expect(output).toContain(`cache_hits_total ${hits}`);

            // Should contain cache_misses_total metric
            expect(output).toContain('# HELP cache_misses_total');
            expect(output).toContain('# TYPE cache_misses_total counter');
            expect(output).toContain(`cache_misses_total ${misses}`);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should produce valid Prometheus format for queue job metrics', () => {
      fc.assert(
        fc.property(queueNameGen, queueStatusGen, fc.integer({ min: 1, max: 50 }), (queue, status, count) => {
          const metrics = createFreshMetrics();
          
          // Record queue jobs
          for (let i = 0; i < count; i++) {
            metrics.recordQueueJob(queue, status);
          }

          const output = metrics.toPrometheusFormat();

          // Should contain queue_jobs_total metric
          expect(output).toContain('# HELP queue_jobs_total');
          expect(output).toContain('# TYPE queue_jobs_total counter');
          expect(output).toContain(`queue_jobs_total{queue="${queue}",status="${status}"} ${count}`);
        }),
        { numRuns: 50 }
      );
    });

    it('should produce valid Prometheus format for rate limit metrics', () => {
      fc.assert(
        fc.property(ipAddressGen, apiPathGen, fc.integer({ min: 1, max: 20 }), (ip, path, count) => {
          const metrics = createFreshMetrics();
          
          // Record rate limit exceeded events
          for (let i = 0; i < count; i++) {
            metrics.recordRateLimitExceeded(ip, path);
          }

          const output = metrics.toPrometheusFormat();

          // Should contain rate_limit_exceeded_total metric
          expect(output).toContain('# HELP rate_limit_exceeded_total');
          expect(output).toContain('# TYPE rate_limit_exceeded_total counter');
          expect(output).toMatch(/rate_limit_exceeded_total\{ip="[^"]+",path="[^"]+"\} \d+/);
        }),
        { numRuns: 50 }
      );
    });

    it('should produce valid Prometheus format for DB query metrics', () => {
      fc.assert(
        fc.property(fc.array(durationMsGen, { minLength: 1, maxLength: 50 }), (durations) => {
          const metrics = createFreshMetrics();
          
          // Record DB queries
          for (const duration of durations) {
            metrics.recordDbQuery(duration);
          }

          const output = metrics.toPrometheusFormat();

          // Should contain db_query_duration_seconds histogram
          expect(output).toContain('# HELP db_query_duration_seconds');
          expect(output).toContain('# TYPE db_query_duration_seconds histogram');
          expect(output).toMatch(/db_query_duration_seconds_bucket\{le="[^"]+"\} \d+/);
          expect(output).toMatch(/db_query_duration_seconds_sum \d+\.\d+/);
          expect(output).toContain(`db_query_duration_seconds_count ${durations.length}`);
        }),
        { numRuns: 50 }
      );
    });

    it('should correctly count HTTP requests', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(httpMethodGen, apiPathGen, httpStatusGen, durationMsGen), {
            minLength: 1,
            maxLength: 20,
          }),
          (requests) => {
            const metrics = createFreshMetrics();
            
            // Record all requests
            for (const [method, path, status, duration] of requests) {
              metrics.recordHttpRequest(method, path, status, duration);
            }

            // Total count should match
            expect(metrics.getTotalHttpRequests()).toBe(requests.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly track cache hit/miss counts', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (hits, misses) => {
            const metrics = createFreshMetrics();
            
            for (let i = 0; i < hits; i++) {
              metrics.recordCacheHit();
            }
            for (let i = 0; i < misses; i++) {
              metrics.recordCacheMiss();
            }

            expect(metrics.getCacheHits()).toBe(hits);
            expect(metrics.getCacheMisses()).toBe(misses);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly track queue job counts', () => {
      fc.assert(
        fc.property(queueNameGen, queueStatusGen, fc.integer({ min: 1, max: 50 }), (queue, status, count) => {
          const metrics = createFreshMetrics();
          
          for (let i = 0; i < count; i++) {
            metrics.recordQueueJob(queue, status);
          }

          expect(metrics.getQueueJobCount(queue, status)).toBe(count);
        }),
        { numRuns: 50 }
      );
    });

    it('should normalize paths with UUIDs', () => {
      fc.assert(
        fc.property(httpMethodGen, fc.uuid(), httpStatusGen, durationMsGen, (method, uuid, status, duration) => {
          const metrics = createFreshMetrics();
          const pathWithUuid = `/api/users/${uuid}`;
          metrics.recordHttpRequest(method, pathWithUuid, status, duration);

          const output = metrics.toPrometheusFormat();

          // Path should be normalized to :id
          expect(output).toContain('/api/users/:id');
          expect(output).not.toContain(uuid);
        }),
        { numRuns: 50 }
      );
    });

    it('should normalize paths with numeric IDs', () => {
      fc.assert(
        fc.property(
          httpMethodGen,
          fc.integer({ min: 1, max: 99999 }),
          httpStatusGen,
          durationMsGen,
          (method, numericId, status, duration) => {
            const metrics = createFreshMetrics();
            const pathWithId = `/api/leads/${numericId}`;
            metrics.recordHttpRequest(method, pathWithId, status, duration);

            const output = metrics.toPrometheusFormat();

            // Path should be normalized to :id
            expect(output).toContain('/api/leads/:id');
            expect(output).not.toContain(`/${numericId}`);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should anonymize IP addresses in rate limit metrics', () => {
      fc.assert(
        fc.property(apiPathGen, (path) => {
          const metrics = createFreshMetrics();
          const ipv4 = '192.168.1.100';
          metrics.recordRateLimitExceeded(ipv4, path);

          const output = metrics.toPrometheusFormat();

          // Should contain anonymized IP (last octet replaced)
          expect(output).toContain('192.168.1.x');
          expect(output).not.toContain('192.168.1.100');
        }),
        { numRuns: 20 }
      );
    });

    it('should escape special characters in labels', () => {
      const metrics = createFreshMetrics();
      
      // Test with path containing special characters
      const specialPath = '/api/search?q=test&page=1';
      metrics.recordHttpRequest('GET', specialPath, 200, 50);

      const output = metrics.toPrometheusFormat();

      // Should not break Prometheus format
      expect(output).toContain('http_requests_total{method="GET"');
      // Output should be parseable (no unescaped quotes or newlines)
      expect(() => {
        // Simple validation: each line should be valid
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.startsWith('#') || line.trim() === '') continue;
          // Metric line should have format: metric_name{labels} value
          expect(line).toMatch(/^[a-z_]+(\{[^}]*\})? \d+(\.\d+)?$/);
        }
      }).not.toThrow();
    });

    it('should produce consistent output format', () => {
      const metrics = createFreshMetrics();
      
      // Record various metrics
      metrics.recordHttpRequest('GET', '/api/users', 200, 50);
      metrics.recordHttpRequest('POST', '/api/leads', 201, 100);
      metrics.recordCacheHit();
      metrics.recordCacheMiss();
      metrics.recordQueueJob('email', 'completed');
      metrics.recordDbQuery(25);
      metrics.recordRateLimitExceeded('10.0.0.1', '/api/auth/login');

      const output = metrics.toPrometheusFormat();

      // Should have all metric types
      expect(output).toContain('http_requests_total');
      expect(output).toContain('http_request_duration_seconds');
      expect(output).toContain('db_query_duration_seconds');
      expect(output).toContain('cache_hits_total');
      expect(output).toContain('cache_misses_total');
      expect(output).toContain('queue_jobs_total');
      expect(output).toContain('rate_limit_exceeded_total');

      // Each metric should have HELP and TYPE
      const metricNames = [
        'http_requests_total',
        'http_request_duration_seconds',
        'db_query_duration_seconds',
        'cache_hits_total',
        'cache_misses_total',
        'queue_jobs_total',
        'rate_limit_exceeded_total',
      ];

      for (const name of metricNames) {
        expect(output).toContain(`# HELP ${name}`);
        expect(output).toContain(`# TYPE ${name}`);
      }
    });

    it('should reset all metrics correctly', () => {
      const metrics = createFreshMetrics();
      
      // Record some metrics
      metrics.recordHttpRequest('GET', '/api/users', 200, 50);
      metrics.recordCacheHit();
      metrics.recordQueueJob('email', 'completed');
      metrics.recordDbQuery(25);
      metrics.recordRateLimitExceeded('10.0.0.1', '/api/test');

      // Reset
      metrics.reset();

      // All counts should be zero
      expect(metrics.getTotalHttpRequests()).toBe(0);
      expect(metrics.getCacheHits()).toBe(0);
      expect(metrics.getCacheMisses()).toBe(0);
      expect(metrics.getQueueJobCount('email', 'completed')).toBe(0);
      expect(metrics.getTotalDbQueries()).toBe(0);
    });

    it('should calculate average durations correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 10, max: 1000 }), { minLength: 1, maxLength: 20 }),
          (durations) => {
            const metrics = createFreshMetrics();
            
            for (const duration of durations) {
              metrics.recordHttpRequest('GET', '/api/test', 200, duration);
            }

            const expectedAvg = durations.reduce((a, b) => a + b, 0) / durations.length;
            const actualAvg = metrics.getAverageHttpDuration();

            // Allow small floating point difference
            expect(Math.abs(actualAvg - expectedAvg)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
