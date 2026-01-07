/**
 * Rate Limit Routes Module
 *
 * Handles rate limit monitoring and metrics API endpoints.
 *
 * **Feature: production-scalability**
 * **Requirements: 7.3, 7.5**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import {
  getRateLimitMetrics,
  getViolationCountForIP,
} from '../services/rate-limit-monitoring.service';

// ============================================
// RATE LIMIT ROUTES FACTORY
// ============================================

/**
 * Create rate limit monitoring routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with rate limit routes
 */
export function createRateLimitRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // PROTECTED ROUTES (Admin only)
  // ============================================

  /**
   * @route GET /api/admin/rate-limits/metrics
   * @description Get rate limit metrics for the last hour
   * @access Admin only
   * 
   * **Validates: Requirements 7.3**
   */
  app.get('/metrics', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const metrics = await getRateLimitMetrics();
      return successResponse(c, metrics);
    } catch (error) {
      console.error('Rate limit metrics error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get rate limit metrics', 500);
    }
  });

  /**
   * @route GET /api/admin/rate-limits/violations/:ip
   * @description Get violation count for a specific IP
   * @access Admin only
   */
  app.get('/violations/:ip', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const ip = c.req.param('ip');
      
      if (!ip) {
        return errorResponse(c, 'VALIDATION_ERROR', 'IP address is required', 400);
      }

      const count = await getViolationCountForIP(ip);
      return successResponse(c, { ip, violationCount: count });
    } catch (error) {
      console.error('Violation count error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get violation count', 500);
    }
  });

  /**
   * @route GET /api/admin/rate-limits/dashboard
   * @description Get rate limit dashboard data (top violators, endpoints)
   * @access Admin only
   * 
   * **Validates: Requirements 7.5**
   */
  app.get('/dashboard', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const metrics = await getRateLimitMetrics();
      
      // Format for dashboard display
      const dashboardData = {
        summary: {
          totalViolations: metrics.totalViolations,
          lastHourViolations: metrics.lastHourViolations,
          uniqueEndpoints: metrics.violationsByEndpoint.length,
          uniqueIPs: metrics.topViolatingIPs.length,
        },
        topViolatingIPs: metrics.topViolatingIPs.slice(0, 10),
        topViolatingEndpoints: metrics.violationsByEndpoint.slice(0, 10),
        alertThreshold: {
          threshold: 10,
          windowMinutes: 5,
          description: 'Alert triggered when IP exceeds 10 violations in 5 minutes',
        },
      };
      
      return successResponse(c, dashboardData);
    } catch (error) {
      console.error('Rate limit dashboard error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get rate limit dashboard', 500);
    }
  });

  return app;
}

export default { createRateLimitRoutes };
