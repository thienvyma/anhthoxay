/**
 * External API - Projects Routes
 *
 * API key authenticated routes for projects management
 */

import { Hono } from 'hono';
import { PrismaClient, Prisma } from '@prisma/client';
import { validateQuery, getValidatedQuery } from '../../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';
import { ProjectFilterSchema, ProjectFilter } from './schemas';
import type { ApiKeyAuthFn } from './types';

/**
 * Create projects routes for external API
 */
export function createProjectsRoutes(prisma: PrismaClient, apiKeyAuth: ApiKeyAuthFn) {
  const app = new Hono();

  /**
   * @route GET /projects
   * @description Get open projects via API key
   * @access API Key (projects permission required)
   */
  app.get('/', apiKeyAuth(), validateQuery(ProjectFilterSchema), async (c) => {
    try {
      const { regionId, categoryId, page, limit } = getValidatedQuery<ProjectFilter>(c);
      const skip = (page - 1) * limit;

      const where: Prisma.ProjectWhereInput = {
        status: 'OPEN', // Only show open projects
      };

      if (regionId) {
        where.regionId = regionId;
      }
      if (categoryId) {
        where.categoryId = categoryId;
      }

      const [total, projects] = await Promise.all([
        prisma.project.count({ where }),
        prisma.project.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
            categoryId: true,
            regionId: true,
            area: true,
            budgetMin: true,
            budgetMax: true,
            timeline: true,
            status: true,
            bidDeadline: true,
            maxBids: true,
            createdAt: true,
            // Exclude sensitive info: address, owner info
            category: { select: { id: true, name: true } },
            region: { select: { id: true, name: true } },
            _count: { select: { bids: true } },
          },
        }),
      ]);

      return paginatedResponse(c, projects, { total, page, limit });
    } catch (error) {
      console.error('External API - Get projects error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get projects', 500);
    }
  });

  /**
   * @route GET /projects/:id
   * @description Get project detail via API key (limited info)
   * @access API Key (projects permission required)
   */
  app.get('/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');

      const project = await prisma.project.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          categoryId: true,
          regionId: true,
          area: true,
          budgetMin: true,
          budgetMax: true,
          timeline: true,
          requirements: true,
          images: true,
          status: true,
          bidDeadline: true,
          maxBids: true,
          createdAt: true,
          // Exclude sensitive info: address, owner info
          category: { select: { id: true, name: true } },
          region: { select: { id: true, name: true } },
          _count: { select: { bids: true } },
        },
      });

      if (!project) {
        return errorResponse(c, 'NOT_FOUND', 'Project not found', 404);
      }

      return successResponse(c, project);
    } catch (error) {
      console.error('External API - Get project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get project', 500);
    }
  });

  return app;
}
