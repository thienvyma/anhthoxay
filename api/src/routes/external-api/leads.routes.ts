/**
 * External API - Leads Routes
 *
 * API key authenticated routes for leads management
 */

import { Hono } from 'hono';
import { PrismaClient, Prisma } from '@prisma/client';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';
import { LeadsQuerySchema, CreateLeadSchema, LeadsQuery, CreateLead } from './schemas';
import type { ApiKeyAuthFn } from './types';

/**
 * Create leads routes for external API
 */
export function createLeadsRoutes(prisma: PrismaClient, apiKeyAuth: ApiKeyAuthFn) {
  const app = new Hono();

  /**
   * @route GET /leads
   * @description Get leads list via API key
   * @access API Key (leads permission required)
   */
  app.get('/', apiKeyAuth(), validateQuery(LeadsQuerySchema), async (c) => {
    try {
      const { search, status, page, limit } = getValidatedQuery<LeadsQuery>(c);
      const skip = (page - 1) * limit;

      const where: Prisma.CustomerLeadWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        const searchLower = search.toLowerCase();
        where.OR = [
          { name: { contains: searchLower } },
          { phone: { contains: searchLower } },
          { email: { contains: searchLower } },
        ];
      }

      const [total, leads] = await Promise.all([
        prisma.customerLead.count({ where }),
        prisma.customerLead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return paginatedResponse(c, leads, { total, page, limit });
    } catch (error) {
      console.error('External API - Get leads error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get leads', 500);
    }
  });

  /**
   * @route POST /leads
   * @description Create a new lead via API key
   * @access API Key (leads permission, READ_WRITE or FULL_ACCESS scope required)
   */
  app.post('/', apiKeyAuth(), validate(CreateLeadSchema), async (c) => {
    try {
      const body = getValidatedBody<CreateLead>(c);

      const lead = await prisma.customerLead.create({
        data: {
          name: body.name,
          phone: body.phone,
          email: body.email || null,
          content: body.content,
          source: body.source,
        },
      });

      return successResponse(c, lead, 201);
    } catch (error) {
      console.error('External API - Create lead error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create lead', 500);
    }
  });

  /**
   * @route GET /leads/stats
   * @description Get leads statistics via API key
   * @access API Key (reports permission required)
   */
  app.get('/stats', apiKeyAuth(), async (c) => {
    try {
      const leads = await prisma.customerLead.findMany({
        select: { status: true, source: true, createdAt: true },
      });

      // Status distribution
      const byStatus: Record<string, number> = {};
      leads.forEach((lead) => {
        byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      });

      // Source distribution
      const bySource: Record<string, number> = {};
      leads.forEach((lead) => {
        bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      });

      // Conversion rate
      const totalNonCancelled = leads.filter((l) => l.status !== 'CANCELLED').length;
      const converted = byStatus['CONVERTED'] || 0;
      const conversionRate =
        totalNonCancelled > 0
          ? Math.round((converted / totalNonCancelled) * 100 * 100) / 100
          : 0;

      return successResponse(c, {
        byStatus,
        bySource,
        conversionRate,
        totalLeads: leads.length,
        newLeads: byStatus['NEW'] || 0,
      });
    } catch (error) {
      console.error('External API - Leads stats error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get stats', 500);
    }
  });

  return app;
}
