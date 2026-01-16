/**
 * Dashboard Firestore Routes Module
 * 
 * Provides admin dashboard statistics and activity feed.
 * Aggregates data from multiple Firestore collections.
 * 
 * @module routes/firestore/dashboard.firestore.routes
 * @requirements 6.1, 6.2
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole } from '../../middleware/firebase-auth.middleware';
import { successResponse, errorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { getLeadsFirestoreService } from '../../services/firestore/leads.firestore';
import type { 
  DashboardStatsResponse, 
  ActivityItem,
  ActivityFeedQuery 
} from '../../schemas/dashboard.schema';
import { activityFeedQuerySchema } from '../../schemas/dashboard.schema';

// ============================================
// DASHBOARD FIRESTORE ROUTES FACTORY
// ============================================

/**
 * Create dashboard routes using Firestore
 * @returns Hono app with dashboard routes
 */
export function createDashboardFirestoreRoutes() {
  const app = new Hono();

  /**
   * @route GET /api/admin/dashboard
   * @description Get dashboard statistics
   * @access Admin, Manager
   */
  app.get(
    '/',
    firebaseAuth(),
    requireRole('ADMIN', 'MANAGER'),
    async (c) => {
      try {
        const leadsService = getLeadsFirestoreService();

        // Fetch stats in parallel
        const leadsStats = await leadsService.getStats().catch(() => null);

        const stats: DashboardStatsResponse = {
          leads: leadsStats || {
            total: 0,
            new: 0,
            byStatus: {},
            bySource: {},
            conversionRate: 0,
            dailyLeads: [],
          },
          projects: {
            total: 0,
            pending: 0,
            open: 0,
            matched: 0,
            inProgress: 0,
            completed: 0,
          },
          bids: {
            total: 0,
            pending: 0,
            approved: 0,
          },
          contractors: {
            total: 0,
            pending: 0,
            verified: 0,
          },
          blogPosts: {
            total: 0,
            published: 0,
            draft: 0,
          },
          users: {
            total: 0,
            byRole: {},
          },
          media: {
            total: 0,
          },
          pendingItems: {
            projects: [],
            bids: [],
            contractors: [],
          },
        };

        return successResponse(c, stats);
      } catch (error) {
        logger.error('Dashboard stats error:', { error });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get dashboard stats', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/dashboard/activity
   * @description Get activity feed
   * @access Admin, Manager
   */
  app.get(
    '/activity',
    firebaseAuth(),
    requireRole('ADMIN', 'MANAGER'),
    async (c) => {
      try {
        const queryResult = activityFeedQuerySchema.safeParse({
          limit: c.req.query('limit'),
        });
        
        const query: ActivityFeedQuery = queryResult.success 
          ? queryResult.data 
          : { limit: 10 };

        const leadsService = getLeadsFirestoreService();
        
        // Get recent leads as activity
        const recentLeads = await leadsService.getLeads({ 
          page: 1,
          limit: query.limit,
        }).catch(() => ({ data: [], total: 0 }));

        const activities: ActivityItem[] = recentLeads.data.map((lead) => ({
          id: lead.id,
          type: 'LEAD' as const,
          title: `Khách hàng mới: ${lead.name}`,
          description: lead.phone || lead.email || 'Không có thông tin liên hệ',
          entityId: lead.id,
          createdAt: lead.createdAt instanceof Date 
            ? lead.createdAt.toISOString() 
            : String(lead.createdAt),
        }));

        return successResponse(c, activities);
      } catch (error) {
        logger.error('Activity feed error:', { error });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get activity feed', 500);
      }
    }
  );

  return app;
}

export const dashboardFirestoreRoutes = createDashboardFirestoreRoutes();

export default { createDashboardFirestoreRoutes, dashboardFirestoreRoutes };
