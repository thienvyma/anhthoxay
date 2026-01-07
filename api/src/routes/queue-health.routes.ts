/**
 * Queue Health Routes
 *
 * Provides endpoints for monitoring queue health, depth,
 * processing rates, and dead letter queue.
 *
 * **Feature: production-scalability**
 * **Requirements: 13.3**
 */

import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { queueHealthService } from '../services/queue-health.service';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Creates queue health monitoring routes
 * @param prisma - Prisma client instance
 */
export function createQueueHealthRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  /**
   * @route GET /api/admin/queues/status
   * @description Get status of all queues
   * @access Admin only
   *
   * Returns:
   * - queues: Array of queue health status
   * - totalDepth: Total jobs across all queues
   * - totalFailed: Total failed jobs
   * - overallHealth: 'healthy' | 'warning' | 'critical'
   * - timestamp: ISO timestamp
   */
  app.get('/status', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const summary = await queueHealthService.getQueueStatusSummary();

      return successResponse(c, {
        ...summary,
        deadLetterCount: queueHealthService.getDeadLetterCount(),
      });
    } catch {
      return errorResponse(
        c,
        'QUEUE_STATUS_ERROR',
        'Failed to get queue status',
        500
      );
    }
  });

  /**
   * @route GET /api/admin/queues/:name
   * @description Get health status of a specific queue
   * @access Admin only
   *
   * Returns queue health including:
   * - depth, waiting, active, completed, failed, delayed
   * - processingRate (jobs per minute)
   * - avgProcessingTime (milliseconds)
   * - isHealthy, healthStatus
   */
  app.get('/:name', authenticate(), requireRole('ADMIN'), async (c) => {
    const queueName = c.req.param('name');

    try {
      const health = await queueHealthService.getQueueHealth(queueName);

      if (!health) {
        return errorResponse(
          c,
          'QUEUE_NOT_FOUND',
          `Queue "${queueName}" not found or not registered`,
          404
        );
      }

      return successResponse(c, health);
    } catch {
      return errorResponse(
        c,
        'QUEUE_HEALTH_ERROR',
        'Failed to get queue health',
        500
      );
    }
  });

  /**
   * @route GET /api/admin/queues/dead-letter/list
   * @description Get dead letter queue jobs
   * @access Admin only
   *
   * Query params:
   * - limit: Maximum number of jobs to return (default: 100)
   *
   * Returns:
   * - jobs: Array of dead letter jobs
   * - count: Total count of dead letter jobs
   */
  app.get('/dead-letter/list', authenticate(), requireRole('ADMIN'), async (c) => {
    const limit = parseInt(c.req.query('limit') || '100', 10);

    try {
      const jobs = queueHealthService.getDeadLetterJobs(limit);
      const count = queueHealthService.getDeadLetterCount();

      return successResponse(c, {
        jobs,
        count,
      });
    } catch {
      return errorResponse(
        c,
        'DEAD_LETTER_ERROR',
        'Failed to get dead letter jobs',
        500
      );
    }
  });

  /**
   * @route DELETE /api/admin/queues/dead-letter/clear
   * @description Clear dead letter queue
   * @access Admin only
   */
  app.delete('/dead-letter/clear', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      queueHealthService.clearDeadLetterQueue();

      return successResponse(c, {
        message: 'Dead letter queue cleared',
      });
    } catch {
      return errorResponse(
        c,
        'CLEAR_DEAD_LETTER_ERROR',
        'Failed to clear dead letter queue',
        500
      );
    }
  });

  return app;
}
