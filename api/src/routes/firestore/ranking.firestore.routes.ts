/**
 * Ranking Firestore Routes
 *
 * API endpoints for contractor ranking management using Firestore.
 * Includes public rankings, featured contractors, and admin operations.
 *
 * @module routes/firestore/ranking.firestore.routes
 * @requirements 7.2, 7.4
 */

import { Hono } from 'hono';
import {
  firebaseAuth,
  requireRole,
  getCurrentUid,
} from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import {
  RankingQuerySchema,
  FeaturedQuerySchema,
  SetFeaturedSchema,
  StatsQuerySchema,
  type RankingQuery,
  type FeaturedQuery,
  type SetFeaturedInput,
  type StatsQuery,
} from '../../schemas/ranking.schema';
import {
  getRankingFirestoreService,
  RankingFirestoreError,
} from '../../services/firestore/ranking.firestore';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';

// ============================================
// PUBLIC RANKING ROUTES
// ============================================

/**
 * Creates public ranking routes (no auth required)
 */
export function createPublicRankingFirestoreRoutes() {
  const app = new Hono();
  const rankingService = getRankingFirestoreService();

  /**
   * @route GET /
   * @description List contractor rankings with pagination and filters
   * @access Public
   */
  app.get(
    '/',
    validateQuery(RankingQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<RankingQuery>(c);

        const result = await rankingService.getRanking({
          regionId: query.regionId,
          specialty: query.specialty,
          minRating: query.minRating,
          isFeatured: query.isFeatured,
          responseTimeRange: query.responseTimeRange,
          maxResponseTime: query.maxResponseTime,
          limit: query.limit,
          sortBy: query.sortBy as 'totalScore' | 'rank' | 'averageRating',
          sortOrder: query.sortOrder,
        });

        return paginatedResponse(c, result.data, {
          total: result.data.length,
          page: query.page,
          limit: query.limit,
        });
      } catch (error) {
        if (error instanceof RankingFirestoreError) {
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
   */
  app.get(
    '/featured',
    validateQuery(FeaturedQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<FeaturedQuery>(c);
        const featured = await rankingService.getFeaturedContractors({
          limit: query.limit,
          regionId: query.regionId,
        });
        return successResponse(c, featured);
      } catch (error) {
        if (error instanceof RankingFirestoreError) {
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
      if (error instanceof RankingFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  return app;
}

// ============================================
// CONTRACTOR RANKING ROUTES
// ============================================

/**
 * Creates contractor ranking routes
 */
export function createContractorRankingFirestoreRoutes() {
  const app = new Hono();
  const rankingService = getRankingFirestoreService();

  /**
   * @route GET /stats
   * @description Get contractor's statistics
   * @access Contractor only
   */
  app.get(
    '/stats',
    firebaseAuth(),
    requireRole('CONTRACTOR', 'ADMIN'),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const stats = await rankingService.getContractorStats(uid);
        return successResponse(c, stats);
      } catch (error) {
        if (error instanceof RankingFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /ranking
   * @description Get contractor's current ranking
   * @access Contractor only
   */
  app.get(
    '/ranking',
    firebaseAuth(),
    requireRole('CONTRACTOR', 'ADMIN'),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const ranking = await rankingService.getContractorRank(uid);

        if (!ranking) {
          return successResponse(c, {
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
        if (error instanceof RankingFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /monthly-stats
   * @description Get contractor's monthly statistics
   * @access Contractor only
   */
  app.get(
    '/monthly-stats',
    firebaseAuth(),
    requireRole('CONTRACTOR', 'ADMIN'),
    validateQuery(StatsQuerySchema),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const query = getValidatedQuery<StatsQuery>(c);
        const stats = await rankingService.getMonthlyStats(uid, query.months);
        return successResponse(c, stats);
      } catch (error) {
        if (error instanceof RankingFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}

// ============================================
// ADMIN RANKING ROUTES
// ============================================

/**
 * Creates admin ranking routes
 */
export function createAdminRankingFirestoreRoutes() {
  const app = new Hono();
  const rankingService = getRankingFirestoreService();

  /**
   * @route POST /recalculate
   * @description Trigger ranking recalculation for all contractors
   * @access Admin only
   */
  app.post(
    '/recalculate',
    firebaseAuth(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const result = await rankingService.recalculateAllScores();
        return successResponse(c, {
          success: result.success,
          message: result.success
            ? 'Đã tính toán lại xếp hạng cho tất cả nhà thầu'
            : 'Tính toán xếp hạng hoàn thành với một số lỗi',
          contractorsProcessed: result.contractorsProcessed,
          errors: result.errors.length > 0 ? result.errors : undefined,
        });
      } catch (error) {
        if (error instanceof RankingFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route POST /update-featured
   * @description Update featured contractors based on ranking
   * @access Admin only
   */
  app.post(
    '/update-featured',
    firebaseAuth(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const updatedCount = await rankingService.updateFeaturedContractors();
        return successResponse(c, {
          success: true,
          message: 'Đã cập nhật danh sách nhà thầu nổi bật',
          updatedCount,
        });
      } catch (error) {
        if (error instanceof RankingFirestoreError) {
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
   */
  app.put(
    '/contractors/:id/featured',
    firebaseAuth(),
    requireRole('ADMIN'),
    validate(SetFeaturedSchema),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const contractorId = c.req.param('id');
        const data = getValidatedBody<SetFeaturedInput>(c);

        const ranking = await rankingService.setFeatured(contractorId, uid, data.isFeatured);
        return successResponse(c, ranking);
      } catch (error) {
        if (error instanceof RankingFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route POST /contractors/:id/recalculate
   * @description Recalculate ranking for a single contractor
   * @access Admin only
   */
  app.post(
    '/contractors/:id/recalculate',
    firebaseAuth(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const contractorId = c.req.param('id');
        const ranking = await rankingService.updateContractorRanking(contractorId);
        return successResponse(c, ranking);
      } catch (error) {
        if (error instanceof RankingFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
