/**
 * Review Firestore Routes
 *
 * API endpoints for review management using Firestore.
 * Includes homeowner, contractor, public, and admin operations.
 *
 * @module routes/firestore/review.firestore.routes
 * @requirements 7.1
 */

import { Hono } from 'hono';
import {
  firebaseAuth,
  requireRole,
  getCurrentUid,
} from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
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
} from '../../schemas/review.schema';
import {
  getReviewFirestoreService,
  ReviewFirestoreError,
} from '../../services/firestore/review.firestore';
import { getProjectFirestoreService } from '../../services/firestore/project.firestore';
import { getRankingFirestoreService } from '../../services/firestore/ranking.firestore';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';

// ============================================
// HOMEOWNER REVIEW ROUTES
// ============================================

/**
 * Creates review routes for homeowners
 */
export function createHomeownerReviewFirestoreRoutes() {
  const app = new Hono();
  const reviewService = getReviewFirestoreService();
  const projectService = getProjectFirestoreService();

  /**
   * @route POST /projects/:projectId/review
   * @description Create a review for a completed project
   * @access Homeowner only
   */
  app.post(
    '/projects/:projectId/review',
    firebaseAuth(),
    requireRole('HOMEOWNER', 'ADMIN'),
    validate(CreateReviewSchema),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const projectId = c.req.param('projectId');
        const data = getValidatedBody<CreateReviewInput>(c);

        // Get project to verify ownership and get contractor ID
        const project = await projectService.getById(projectId);
        if (!project) {
          return errorResponse(c, 'PROJECT_NOT_FOUND', 'Project not found', 404);
        }

        if (project.ownerId !== uid) {
          return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Not authorized to review this project', 403);
        }

        if (project.status !== 'COMPLETED') {
          return errorResponse(c, 'PROJECT_NOT_COMPLETED', 'Can only review completed projects', 400);
        }

        if (!project.selectedBidId) {
          return errorResponse(c, 'NO_SELECTED_BID', 'Project has no selected contractor', 400);
        }

        // Get the selected bid to find contractor ID
        const { getBidFirestoreService } = await import('../../services/firestore/bid.firestore');
        const bidService = getBidFirestoreService();
        const bid = await bidService.getById(projectId, project.selectedBidId);
        
        if (!bid) {
          return errorResponse(c, 'BID_NOT_FOUND', 'Selected bid not found', 404);
        }

        const review = await reviewService.createReview({
          projectId,
          reviewerId: uid,
          contractorId: bid.contractorId,
          rating: data.rating,
          comment: data.comment,
          images: data.images,
          qualityRating: data.qualityRating,
          timelinessRating: data.timelinessRating,
          communicationRating: data.communicationRating,
          valueRating: data.valueRating,
        });

        return successResponse(c, review, 201);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.put(
    '/reviews/:id',
    firebaseAuth(),
    requireRole('HOMEOWNER', 'ADMIN'),
    validate(UpdateReviewSchema),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        const data = getValidatedBody<UpdateReviewInput>(c);

        const review = await reviewService.updateReview(reviewId, uid, data);
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.delete(
    '/reviews/:id',
    firebaseAuth(),
    requireRole('HOMEOWNER', 'ADMIN'),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');

        await reviewService.softDelete(reviewId, uid);
        return successResponse(c, { success: true });
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.get(
    '/reviews',
    firebaseAuth(),
    requireRole('HOMEOWNER', 'ADMIN'),
    validateQuery(ReviewQuerySchema),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const query = getValidatedQuery<ReviewQuery>(c);

        const result = await reviewService.listByReviewer(uid, {
          limit: query.limit,
          orderBy: query.sortBy,
          orderDirection: query.sortOrder,
        });

        return paginatedResponse(c, result.data, {
          total: result.data.length,
          page: query.page,
          limit: query.limit,
        });
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
 */
export function createContractorReviewFirestoreRoutes() {
  const app = new Hono();
  const reviewService = getReviewFirestoreService();
  const rankingService = getRankingFirestoreService();

  /**
   * @route GET /
   * @description List reviews for contractor's projects
   * @access Contractor only
   */
  app.get(
    '/',
    firebaseAuth(),
    requireRole('CONTRACTOR', 'ADMIN'),
    validateQuery(ReviewQuerySchema),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const query = getValidatedQuery<ReviewQuery>(c);

        const result = await reviewService.listByContractor(uid, {
          limit: query.limit,
          orderBy: query.sortBy,
          orderDirection: query.sortOrder,
        });

        return paginatedResponse(c, result.data, {
          total: result.data.length,
          page: query.page,
          limit: query.limit,
        });
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
        if (error instanceof ReviewFirestoreError) {
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
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.get(
    '/:id',
    firebaseAuth(),
    requireRole('CONTRACTOR', 'ADMIN'),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        const review = await reviewService.getById(reviewId);

        if (!review) {
          return errorResponse(c, 'REVIEW_NOT_FOUND', 'Đánh giá không tồn tại', 404);
        }

        if (review.contractorId !== uid) {
          return errorResponse(c, 'REVIEW_ACCESS_DENIED', 'Không có quyền truy cập', 403);
        }

        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.post(
    '/:id/response',
    firebaseAuth(),
    requireRole('CONTRACTOR', 'ADMIN'),
    validate(AddResponseSchema),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        const data = getValidatedBody<AddResponseInput>(c);

        const review = await reviewService.addResponse(reviewId, uid, data);
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
 */
export function createPublicReviewFirestoreRoutes() {
  const app = new Hono();
  const reviewService = getReviewFirestoreService();

  /**
   * @route GET /contractors/:id
   * @description List public reviews for a contractor
   * @access Public
   */
  app.get(
    '/contractors/:id',
    validateQuery(PublicReviewQuerySchema),
    async (c) => {
      try {
        const contractorId = c.req.param('id');
        const query = getValidatedQuery<PublicReviewQuery>(c);

        const result = await reviewService.listPublicReviews(contractorId, {
          limit: query.limit,
          orderBy: query.sortBy,
          orderDirection: query.sortOrder,
        });

        return paginatedResponse(c, result.data, {
          total: result.data.length,
          page: query.page,
          limit: query.limit,
        });
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.get('/contractors/:id/summary', async (c) => {
    try {
      const contractorId = c.req.param('id');
      const summary = await reviewService.getContractorSummary(contractorId);
      return successResponse(c, summary);
    } catch (error) {
      if (error instanceof ReviewFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route POST /:id/helpful
   * @description Vote a review as helpful
   * @access Authenticated users
   */
  app.post(
    '/:id/helpful',
    firebaseAuth(),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        const result = await reviewService.voteHelpful(reviewId, uid);
        return successResponse(c, result);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.delete(
    '/:id/helpful',
    firebaseAuth(),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        const result = await reviewService.removeHelpfulVote(reviewId, uid);
        return successResponse(c, result);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.get(
    '/:id/helpful/status',
    firebaseAuth(),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        const hasVoted = await reviewService.hasUserVoted(reviewId, uid);
        const helpfulCount = await reviewService.getHelpfulCount(reviewId);
        return successResponse(c, { hasVoted, helpfulCount });
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
 */
export function createAdminReviewFirestoreRoutes() {
  const app = new Hono();
  const reviewService = getReviewFirestoreService();

  /**
   * @route GET /
   * @description List all reviews with filters
   * @access Admin only
   */
  app.get(
    '/',
    firebaseAuth(),
    requireRole('ADMIN'),
    validateQuery(AdminReviewQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<AdminReviewQuery>(c);

        const result = await reviewService.listReviews({
          contractorId: query.contractorId,
          reviewerId: query.reviewerId,
          projectId: query.projectId,
          minRating: query.rating,
          isPublic: query.isPublic,
          isDeleted: query.isDeleted,
          limit: query.limit,
          orderBy: query.sortBy === 'updatedAt' ? 'createdAt' : query.sortBy,
          orderDirection: query.sortOrder,
        });

        return paginatedResponse(c, result.data, {
          total: result.data.length,
          page: query.page,
          limit: query.limit,
        });
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.get(
    '/stats',
    firebaseAuth(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        // Get all reviews for stats
        const allReviews = await reviewService.query({});
        const publicReviews = allReviews.filter(r => r.isPublic && !r.isDeleted);
        const hiddenReviews = allReviews.filter(r => !r.isPublic && !r.isDeleted);
        const deletedReviews = allReviews.filter(r => r.isDeleted);

        // Calculate rating distribution
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;
        let reviewsWithResponses = 0;

        for (const review of allReviews.filter(r => !r.isDeleted)) {
          distribution[review.rating] = (distribution[review.rating] || 0) + 1;
          totalRating += review.rating;
          if (review.response) reviewsWithResponses++;
        }

        const activeReviews = allReviews.filter(r => !r.isDeleted);
        const avgRating = activeReviews.length > 0 ? totalRating / activeReviews.length : 0;

        // Get reviews this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const reviewsThisMonth = allReviews.filter(r => r.createdAt >= startOfMonth).length;

        return successResponse(c, {
          totalReviews: allReviews.length,
          publicReviews: publicReviews.length,
          hiddenReviews: hiddenReviews.length,
          deletedReviews: deletedReviews.length,
          averageRating: Math.round(avgRating * 10) / 10,
          ratingDistribution: distribution,
          reviewsWithResponses,
          responseRate: activeReviews.length > 0
            ? Math.round((reviewsWithResponses / activeReviews.length) * 100 * 10) / 10
            : 0,
          reviewsThisMonth,
        });
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.get(
    '/:id',
    firebaseAuth(),
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
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.put(
    '/:id/hide',
    firebaseAuth(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        const review = await reviewService.hideReview(reviewId, uid);
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.put(
    '/:id/unhide',
    firebaseAuth(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        const review = await reviewService.unhideReview(reviewId, uid);
        return successResponse(c, review);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.delete(
    '/:id',
    firebaseAuth(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        await reviewService.adminDelete(reviewId, uid);
        return successResponse(c, { success: true });
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
