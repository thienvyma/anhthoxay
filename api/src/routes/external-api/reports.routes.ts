/**
 * External API - Reports Routes
 *
 * API key authenticated routes for reports and dashboard
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../../utils/response';
import type { ApiKeyAuthFn } from './types';

/**
 * Create reports routes for external API
 */
export function createReportsRoutes(prisma: PrismaClient, apiKeyAuth: ApiKeyAuthFn) {
  const app = new Hono();

  /**
   * @route GET /reports/dashboard
   * @description Get dashboard statistics via API key
   * @access API Key (reports permission required)
   */
  app.get('/dashboard', apiKeyAuth(), async (c) => {
    try {
      const [
        totalLeads,
        newLeads,
        totalProjects,
        openProjects,
        totalContractors,
        verifiedContractors,
      ] = await Promise.all([
        prisma.customerLead.count(),
        prisma.customerLead.count({ where: { status: 'NEW' } }),
        prisma.project.count(),
        prisma.project.count({ where: { status: 'OPEN' } }),
        prisma.contractorProfile.count(),
        prisma.contractorProfile.count({ where: { user: { verificationStatus: 'VERIFIED' } } }),
      ]);

      return successResponse(c, {
        leads: {
          total: totalLeads,
          new: newLeads,
        },
        projects: {
          total: totalProjects,
          open: openProjects,
        },
        contractors: {
          total: totalContractors,
          verified: verifiedContractors,
        },
      });
    } catch (error) {
      console.error('External API - Dashboard stats error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get dashboard stats', 500);
    }
  });

  return app;
}
