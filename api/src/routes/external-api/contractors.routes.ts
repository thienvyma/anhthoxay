/**
 * External API - Contractors Routes
 *
 * API key authenticated routes for contractors management
 */

import { Hono } from 'hono';
import { PrismaClient, Prisma } from '@prisma/client';
import { validateQuery, getValidatedQuery } from '../../middleware/validation';
import { paginatedResponse, errorResponse } from '../../utils/response';
import { ContractorFilterSchema, ContractorFilter } from './schemas';
import type { ApiKeyAuthFn } from './types';

/**
 * Create contractors routes for external API
 */
export function createContractorsRoutes(prisma: PrismaClient, apiKeyAuth: ApiKeyAuthFn) {
  const app = new Hono();

  /**
   * @route GET /contractors
   * @description Get verified contractors via API key
   * @access API Key (contractors permission required)
   */
  app.get('/', apiKeyAuth(), validateQuery(ContractorFilterSchema), async (c) => {
    try {
      const { verificationStatus, page, limit } = getValidatedQuery<ContractorFilter>(c);
      const skip = (page - 1) * limit;

      const where: Prisma.ContractorProfileWhereInput = {
        user: {
          verificationStatus: verificationStatus || 'VERIFIED',
        },
      };

      const [total, contractors] = await Promise.all([
        prisma.contractorProfile.count({ where }),
        prisma.contractorProfile.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            description: true,
            experience: true,
            specialties: true,
            serviceAreas: true,
            portfolioImages: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                verificationStatus: true,
              },
            },
          },
        }),
      ]);

      return paginatedResponse(c, contractors, { total, page, limit });
    } catch (error) {
      console.error('External API - Get contractors error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get contractors', 500);
    }
  });

  return app;
}
