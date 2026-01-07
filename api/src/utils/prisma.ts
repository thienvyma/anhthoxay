import { PrismaClient } from '@prisma/client';
import { prometheusMetrics } from '../services/prometheus.service';

/**
 * Slow query threshold in milliseconds
 * Queries exceeding this threshold will be logged as warnings
 *
 * **Feature: production-scalability**
 * **Requirements: 4.2**
 */
const SLOW_QUERY_THRESHOLD = 100;

/**
 * Global Prisma client instance with query logging
 *
 * Features:
 * - Slow query detection and logging (>100ms)
 * - Query event logging for debugging
 * - Connection pool management via DATABASE_URL params
 * - Prometheus metrics recording
 *
 * **Feature: production-scalability**
 * **Requirements: 4.1, 4.2, 4.3, 4.5, 12.4**
 */
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

/**
 * Query event handler
 * - Records query duration in Prometheus metrics
 * - Logs slow queries that exceed the threshold
 *
 * **Feature: production-scalability, Property 8: Slow query logging**
 * **Validates: Requirements 4.2, 12.4**
 */
prisma.$on('query', (e) => {
  // Record query duration in Prometheus metrics
  // **Feature: production-scalability**
  // **Requirements: 12.4**
  prometheusMetrics.recordDbQuery(e.duration);

  // Log slow queries
  if (e.duration > SLOW_QUERY_THRESHOLD) {
    console.warn('[SLOW_QUERY]', {
      duration: e.duration,
      query: e.query.length > 500 ? e.query.substring(0, 500) + '...' : e.query,
      params: e.params,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get slow query threshold for testing
 */
export function getSlowQueryThreshold(): number {
  return SLOW_QUERY_THRESHOLD;
}

// Export type for use in services
export type { PrismaClient };
