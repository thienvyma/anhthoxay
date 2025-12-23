/**
 * Dashboard Routes Module
 *
 * Handles admin dashboard API endpoints for stats and activity feed.
 *
 * **Feature: admin-dashboard-enhancement**
 * **Requirements: 6.1, 6.3, 6.4**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validateQuery, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { DashboardService } from '../services/dashboard.service';
import { activityFeedQuerySchema, type ActivityFeedQuery } from '../schemas/dashboard.schema';

// ============================================
// DASHBOARD ROUTES FACTORY
// ============================================

/**
 * Create admin dashboard routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with dashboard routes
 */
export function createAdminDashboardRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const dashboardService = new DashboardService(prisma);

  // ============================================
  // PROTECTED ROUTES (Admin only)
  // ============================================

  /**
   * @route GET /api/admin/dashboard
   * @description Get all dashboard statistics
   * @access Admin only
   */
  app.get('/', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const stats = await dashboardService.getStats();
      return successResponse(c, stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get dashboard stats', 500);
    }
  });

  /**
   * @route GET /api/admin/dashboard/activity
   * @description Get recent activity feed
   * @access Admin only
   */
  app.get(
    '/activity',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(activityFeedQuerySchema),
    async (c) => {
      try {
        const { limit } = getValidatedQuery<ActivityFeedQuery>(c);
        const activityFeed = await dashboardService.getActivityFeed(limit);
        return successResponse(c, activityFeed);
      } catch (error) {
        console.error('Activity feed error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get activity feed', 500);
      }
    }
  );

  return app;
}

export default { createAdminDashboardRoutes };
