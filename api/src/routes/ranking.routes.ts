/**
 * Ranking Routes
 *
 * API endpoints for contractor ranking management including public rankings,
 * featured contractors, and admin operations.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 7.5, 8.4, 13.1-13.4**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validateQuery, getValidatedQuery, validate, getValidatedBody } from '../middleware/validation';
import {
  RankingQuerySchema,
  FeaturedQuerySchema,
  SetFeaturedSchema,
  type RankingQuery,
  type FeaturedQuery,
  type SetFeaturedInput,
} from '../schemas/ranking.schema';
import { RankingService, RankingError } from '../services/ranking.service';
import { RankingJobService, RankingJobError } from '../services/ranking-job.service';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';

// ============================================
// PUBLIC RANKING ROUTES
// ============================================

/**
 * Creates public ranking routes (no auth required)
 * @param prisma - Prisma client instance
 * Requirements: 13.1, 13.2, 13.3
 */
export function createPublicRankingRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const rankingService = new RankingService(prisma);

  /**
   * @route GET /
   * @description List contractor rankings with pagination and filters
   * @access Public
   * Requirements: 13.1 - Return contractors sorted by ranking score
   */
  app.get(
    '/',
    validateQuery(RankingQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<RankingQuery>(c);
        const result = await rankingService.getRanking(query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof RankingError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /featured
   * @description Get featured contractors
   * @access Public
   * Requirements: 13.2 - Support filtering by region
   */
  app.get(
    '/featured',
    validateQuery(FeaturedQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<FeaturedQuery>(c);
        const featured = await rankingService.getFeaturedContractors(query);
        return successResponse(c, featured);
      } catch (error) {
        if (error instanceof RankingError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /contractors/:id
   * @description Get a contractor's rank and score breakdown
   * @access Public
   * Requirements: 13.3 - Show position and score breakdown
   */
  app.get('/contractors/:id', async (c) => {
    try {
      const contractorId = c.req.param('id');
      const ranking = await rankingService.getContractorRank(contractorId);

      if (!ranking) {
        return successResponse(c, {
          contractorId,
          rank: null,
          totalScore: 0,
          ratingScore: 0,
          projectsScore: 0,
          responseScore: 0,
          verificationScore: 0,
          message: 'Xếp hạng chưa được tính toán',
        });
      }

      return successResponse(c, ranking);
    } catch (error) {
      if (error instanceof RankingError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  return app;
}

// ============================================
// ADMIN RANKING ROUTES
// ============================================

/**
 * Creates admin ranking routes
 * @param prisma - Prisma client instance
 * Requirements: 7.5, 8.4
 */
export function createAdminRankingRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const rankingService = new RankingService(prisma);
  const rankingJobService = new RankingJobService(prisma);

  /**
   * @route POST /recalculate
   * @description Trigger daily ranking update job for all contractors
   * @access Admin only
   * Requirements: 7.5 - Update scores daily via scheduled job
   */
  app.post(
    '/recalculate',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const result = await rankingJobService.runDailyRankingUpdate();
        return successResponse(c, {
          success: result.success,
          message: result.success 
            ? 'Đã tính toán lại xếp hạng cho tất cả nhà thầu'
            : 'Tính toán xếp hạng hoàn thành với một số lỗi',
          contractorsProcessed: result.contractorsProcessed,
          featuredUpdated: result.featuredUpdated,
          durationMs: result.durationMs,
          errors: result.errors.length > 0 ? result.errors : undefined,
        });
      } catch (error) {
        if (error instanceof RankingJobError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        if (error instanceof RankingError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /job-status
   * @description Get the status of the daily ranking update job
   * @access Admin only
   * Requirements: 7.5 - Monitor scheduled job status
   */
  app.get(
    '/job-status',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const status = rankingJobService.getStatus();
        return successResponse(c, status);
      } catch (error) {
        if (error instanceof RankingJobError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /contractors/:id/featured
   * @description Set featured status for a contractor (admin override)
   * @access Admin only
   * Requirements: 8.4 - Admin can manually feature contractors
   */
  app.put(
    '/contractors/:id/featured',
    authenticate(),
    requireRole('ADMIN'),
    validate(SetFeaturedSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const contractorId = c.req.param('id');
        const data = getValidatedBody<SetFeaturedInput>(c);
        const ranking = await rankingService.setFeatured(contractorId, user.sub, data.isFeatured);
        return successResponse(c, ranking);
      } catch (error) {
        if (error instanceof RankingError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
