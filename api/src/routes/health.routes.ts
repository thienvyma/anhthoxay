/**
 * Health Check Routes
 *
 * Provides health check endpoints for monitoring and orchestration:
 * - /health - Overall system health (database + Redis)
 * - /health/ready - Readiness probe (can accept traffic)
 * - /health/live - Liveness probe (process is running)
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { successResponse } from '../utils/response';
import { metricsCollector } from '../middleware/monitoring';
import {
  getHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
} from '../services/health.service';

/**
 * Creates health check routes
 * @param prisma - Prisma client instance
 */
export function createHealthRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const startTime = Date.now();

  /**
   * @route GET /health
   * @description Overall system health check
   * @access Public
   *
   * Checks:
   * - Database connection (required)
   * - Redis connection (optional)
   *
   * Returns:
   * - 200 if all required services are healthy
   * - 503 if any required service is unhealthy
   *
   * **Requirements: 4.2, 4.3, 4.4**
   */
  app.get('/', async (c) => {
    const status = await getHealthStatus(prisma);

    if (status.status === 'unhealthy') {
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service is unhealthy',
          },
          ...status,
        },
        503
      );
    }

    return successResponse(c, status);
  });

  /**
   * @route GET /health/ready
   * @description Readiness probe for Kubernetes/orchestrators
   * @access Public
   *
   * Returns 200 if the service is ready to accept traffic.
   * Returns 503 if:
   * - Database is not connected
   * - Shutdown is in progress
   *
   * Used by load balancers to determine if traffic should be routed to this instance.
   *
   * **Requirements: 4.2, 4.3, 4.4, 4.6**
   */
  app.get('/ready', async (c) => {
    const { status, httpStatus } = await getReadinessStatus(prisma);

    if (httpStatus !== 200) {
      return c.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: status.reason || 'Service is not ready',
          },
          ...status,
        },
        503
      );
    }

    return successResponse(c, status);
  });

  /**
   * @route GET /health/live
   * @description Liveness probe for Kubernetes/orchestrators
   * @access Public
   *
   * Returns 200 if the process is running.
   * Used by orchestrators to determine if the container should be restarted.
   *
   * This is a simple check that doesn't verify external dependencies.
   * Response time should be under 100ms.
   *
   * **Requirements: 4.1, 4.5**
   */
  app.get('/live', (c) => {
    const status = getLivenessStatus();
    return successResponse(c, status);
  });

  /**
   * @route GET /health/metrics
   * @description Request metrics for monitoring dashboards
   * @access Public (consider adding auth in production)
   *
   * Returns aggregated request metrics including:
   * - Total requests
   * - Average response time
   * - Slow request count
   * - Error rate
   * - Top paths by request count
   */
  app.get('/metrics', (c) => {
    const metrics = metricsCollector.getMetrics();
    return successResponse(c, {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      ...metrics,
    });
  });

  return app;
}
