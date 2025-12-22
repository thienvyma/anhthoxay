/**
 * Review Routes
 *
 * API endpoints for review management including homeowner, contractor,
 * public, and admin operations.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 9.1-9.4, 10.1-10.4, 11.1-11.4, 12.1-12.4**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewQuerySchema,
  PublicReviewQuerySchema,
  AdminReviewQuerySchema,
  AddResponseSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
  type ReviewQuery,
  type PublicReviewQuery,
  type AdminReviewQuery,
  type AddResponseInput,
} from '../schemas/review.schema';
import { ReviewService, ReviewError } from '../services/review';
import { RankingService, RankingError } from '../services/ranking.service';
import { StatsQuerySchema, type StatsQuery } from '../schemas/ranking.schema';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';

// ============================================
// HOMEOWNER REVIEW ROUTES
// ============================================

/**
 * Creates review routes for homeowners
 * @param prisma - Prisma client instance
 * Requirements: 9.1-9.4
 */
export function createHomeownerReviewRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const reviewService = new ReviewService(prisma);

  /**
   * @route POST /projects/:projectId/review
   * @description Create a review for a completed project
   * @access Homeowner only
   * Requirements: 9.1 - Validate project ownership and completion
   */
  app.post(
    '/projects/:projectId/review',
    authenticate(),
    requireRole('HOMEOWNER', 'ADMIN'),
    validate(CreateReviewSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const projectId = c.req.param('projectId');
        const data = getValidatedBody<CreateReviewInput>(c);
        const review = await reviewService.create(projectId, user.sub, data);
        return successResponse(c, review, 201);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /reviews/:id
   * @description Update a review (within 7 days of creation)
   * @access Homeowner only (owner)
   * Requirements: 9.2 - Allow updates within 7 days
   */
  app.put(
    '/reviews/:id',
    authenticate(),
    requireRole('HOMEOWNER', 'ADMIN'),
    validate(UpdateReviewSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        const data = getValidatedBody<UpdateReviewInput>(c);
        const review = await reviewService.update(reviewId, user.sub, data);
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route DELETE /reviews/:id
   * @description Soft delete a review
   * @access Homeowner only (owner)
   * Requirements: 9.3 - Soft delete the review
   */
  app.delete(
    '/reviews/:id',
    authenticate(),
    requireRole('HOMEOWNER', 'ADMIN'),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        await reviewService.delete(reviewId, user.sub);
        return successResponse(c, { success: true });
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /reviews
   * @description List reviews created by the homeowner
   * @access Homeowner only
   * Requirements: 9.4 - Return all reviews created by homeowner
   */
  app.get(
    '/reviews',
    authenticate(),
    requireRole('HOMEOWNER', 'ADMIN'),
    validateQuery(ReviewQuerySchema),
    async (c) => {
      try {
        const user = getUser(c);
        const query = getValidatedQuery<ReviewQuery>(c);
        const result = await reviewService.listByReviewer(user.sub, query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}


// ============================================
// CONTRACTOR REVIEW ROUTES
// ============================================

/**
 * Creates review routes for contractors
 * @param prisma - Prisma client instance
 * Requirements: 10.1-10.4
 */
export function createContractorReviewRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const reviewService = new ReviewService(prisma);
  const rankingService = new RankingService(prisma);

  /**
   * @route GET /
   * @description List reviews for contractor's projects
   * @access Contractor only
   * Requirements: 10.1 - Return all reviews including hidden ones
   */
  app.get(
    '/',
    authenticate(),
    requireRole('CONTRACTOR', 'ADMIN'),
    validateQuery(ReviewQuerySchema),
    async (c) => {
      try {
        const user = getUser(c);
        const query = getValidatedQuery<ReviewQuery>(c);
        const result = await reviewService.listByContractor(user.sub, query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /stats
   * @description Get contractor's review statistics
   * @access Contractor only
   * Requirements: 10.3 - Return aggregated performance data
   */
  app.get(
    '/stats',
    authenticate(),
    requireRole('CONTRACTOR', 'ADMIN'),
    async (c) => {
      try {
        const user = getUser(c);
        const stats = await rankingService.getContractorStats(user.sub);
        return successResponse(c, stats);
      } catch (error) {
        if (error instanceof RankingError) {
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
   * Requirements: 10.4 - Return current rank and score
   */
  app.get(
    '/ranking',
    authenticate(),
    requireRole('CONTRACTOR', 'ADMIN'),
    async (c) => {
      try {
        const user = getUser(c);
        const ranking = await rankingService.getContractorRank(user.sub);
        
        if (!ranking) {
          // Return default ranking if not yet calculated
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
        if (error instanceof RankingError) {
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
   * Requirements: 6.4 - Show monthly statistics
   */
  app.get(
    '/monthly-stats',
    authenticate(),
    requireRole('CONTRACTOR', 'ADMIN'),
    validateQuery(StatsQuerySchema),
    async (c) => {
      try {
        const user = getUser(c);
        const query = getValidatedQuery<StatsQuery>(c);
        const stats = await rankingService.getMonthlyStats(user.sub, query.months);
        return successResponse(c, stats);
      } catch (error) {
        if (error instanceof RankingError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /:id
   * @description Get review detail
   * @access Contractor only (for their reviews)
   * Requirements: 10.2
   */
  app.get(
    '/:id',
    authenticate(),
    requireRole('CONTRACTOR', 'ADMIN'),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        const review = await reviewService.getById(reviewId);
        
        if (!review) {
          return errorResponse(c, 'REVIEW_NOT_FOUND', 'Đánh giá không tồn tại', 404);
        }
        
        // Verify contractor owns this review
        if (review.contractorId !== user.sub) {
          return errorResponse(c, 'REVIEW_ACCESS_DENIED', 'Không có quyền truy cập', 403);
        }
        
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route POST /:id/response
   * @description Add response to a review
   * @access Contractor only (for their reviews)
   * Requirements: 10.2 - Validate they haven't responded before
   */
  app.post(
    '/:id/response',
    authenticate(),
    requireRole('CONTRACTOR', 'ADMIN'),
    validate(AddResponseSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        const data = getValidatedBody<AddResponseInput>(c);
        const review = await reviewService.addResponse(reviewId, user.sub, data);
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}


// ============================================
// PUBLIC REVIEW ROUTES
// ============================================

/**
 * Creates public review routes (no auth required)
 * @param prisma - Prisma client instance
 * Requirements: 11.1-11.4, 18.1
 */
export function createPublicReviewRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate } = createAuthMiddleware(prisma);
  const reviewService = new ReviewService(prisma);

  /**
   * @route GET /contractors/:id
   * @description List public reviews for a contractor
   * @access Public
   * Requirements: 11.1 - Return public reviews with pagination
   */
  app.get(
    '/contractors/:id',
    validateQuery(PublicReviewQuerySchema),
    async (c) => {
      try {
        const contractorId = c.req.param('id');
        const query = getValidatedQuery<PublicReviewQuery>(c);
        const result = await reviewService.listPublic(contractorId, query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /contractors/:id/summary
   * @description Get review summary for a contractor
   * @access Public
   * Requirements: 11.2 - Return rating distribution and averages
   */
  app.get('/contractors/:id/summary', async (c) => {
    try {
      const contractorId = c.req.param('id');
      const summary = await reviewService.getContractorSummary(contractorId);
      return successResponse(c, summary);
    } catch (error) {
      if (error instanceof ReviewError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route POST /:id/helpful
   * @description Vote a review as helpful
   * @access Authenticated users
   * Requirements: 18.1 - Display "Hữu ích" button, increment count
   */
  app.post(
    '/:id/helpful',
    authenticate(),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        const result = await reviewService.voteHelpful(reviewId, user.sub);
        return successResponse(c, result);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route DELETE /:id/helpful
   * @description Remove helpful vote from a review
   * @access Authenticated users
   * Requirements: 18.2 - Allow removing vote
   */
  app.delete(
    '/:id/helpful',
    authenticate(),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        const result = await reviewService.removeHelpfulVote(reviewId, user.sub);
        return successResponse(c, result);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /:id/helpful/status
   * @description Check if current user has voted for a review
   * @access Authenticated users
   * Requirements: 18.2 - Track user votes
   */
  app.get(
    '/:id/helpful/status',
    authenticate(),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        const hasVoted = await reviewService.hasUserVoted(reviewId, user.sub);
        const helpfulCount = await reviewService.getHelpfulCount(reviewId);
        return successResponse(c, { hasVoted, helpfulCount });
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}


// ============================================
// ADMIN REVIEW ROUTES
// ============================================

/**
 * Creates admin review routes
 * @param prisma - Prisma client instance
 * Requirements: 12.1-12.4
 */
export function createAdminReviewRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const reviewService = new ReviewService(prisma);

  /**
   * @route GET /
   * @description List all reviews with filters
   * @access Admin only
   * Requirements: 12.1 - Return all reviews with filters
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(AdminReviewQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<AdminReviewQuery>(c);
        const result = await reviewService.listAdmin(query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /stats
   * @description Get platform-wide review statistics
   * @access Admin only
   * Requirements: 12.4 - Return platform-wide metrics
   */
  app.get(
    '/stats',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        // Get platform-wide statistics
        const [totalReviews, publicReviews, hiddenReviews, deletedReviews, avgRating] = await Promise.all([
          prisma.review.count(),
          prisma.review.count({ where: { isPublic: true, isDeleted: false } }),
          prisma.review.count({ where: { isPublic: false, isDeleted: false } }),
          prisma.review.count({ where: { isDeleted: true } }),
          prisma.review.aggregate({
            where: { isDeleted: false },
            _avg: { rating: true },
          }),
        ]);

        // Get rating distribution
        const ratingDistribution = await prisma.review.groupBy({
          by: ['rating'],
          where: { isDeleted: false },
          _count: { rating: true },
        });

        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const item of ratingDistribution) {
          distribution[item.rating] = item._count.rating;
        }

        // Get reviews with responses
        const reviewsWithResponses = await prisma.review.count({
          where: { isDeleted: false, response: { not: null } },
        });

        // Get reviews this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const reviewsThisMonth = await prisma.review.count({
          where: { createdAt: { gte: startOfMonth } },
        });

        return successResponse(c, {
          totalReviews,
          publicReviews,
          hiddenReviews,
          deletedReviews,
          averageRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : 0,
          ratingDistribution: distribution,
          reviewsWithResponses,
          responseRate: totalReviews > 0 
            ? Math.round((reviewsWithResponses / totalReviews) * 100 * 10) / 10 
            : 0,
          reviewsThisMonth,
        });
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /:id
   * @description Get review detail
   * @access Admin only
   * Requirements: 12.1
   */
  app.get(
    '/:id',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const reviewId = c.req.param('id');
        const review = await reviewService.getById(reviewId);
        
        if (!review) {
          return errorResponse(c, 'REVIEW_NOT_FOUND', 'Đánh giá không tồn tại', 404);
        }
        
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /:id/hide
   * @description Hide a review
   * @access Admin only
   * Requirements: 12.2 - Set isPublic to false
   */
  app.put(
    '/:id/hide',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        const review = await reviewService.hide(reviewId, user.sub);
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /:id/unhide
   * @description Unhide a review
   * @access Admin only
   * Requirements: 12.2 - Set isPublic to true
   */
  app.put(
    '/:id/unhide',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        const review = await reviewService.unhide(reviewId, user.sub);
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route DELETE /:id
   * @description Permanently delete a review
   * @access Admin only
   * Requirements: 12.3 - Permanently remove the review
   */
  app.delete(
    '/:id',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        await reviewService.adminDelete(reviewId, user.sub);
        return successResponse(c, { success: true });
      } catch (error) {
        if (error instanceof ReviewError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
