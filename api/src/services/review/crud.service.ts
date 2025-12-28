/**
 * Review CRUD Service
 *
 * Handles create, read, update, delete operations for reviews.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 1.1-1.5, 2.1-2.5, 9.1-9.4, 12.1-12.3**
 */

import { PrismaClient } from '@prisma/client';
import { NotificationChannelService } from '../notification-channel.service';
import { ScheduledNotificationService } from '../scheduled-notification';
import {
  REVIEW_UPDATE_WINDOW_DAYS,
  MAX_REVIEW_IMAGES,
  type CreateReviewInput,
  type UpdateReviewInput,
  type ReviewQuery,
  type AdminReviewQuery,
} from '../../schemas/review.schema';
import {
  ReviewWithRelations,
  ReviewListResult,
  ReviewError,
  calculateWeightedRating,
  getReviewInclude,
  transformReview,
} from './types';

// ============================================
// REVIEW CRUD SERVICE CLASS
// ============================================

export class ReviewCrudService {
  private prisma: PrismaClient;
  private notificationChannelService: NotificationChannelService;
  private scheduledNotificationService: ScheduledNotificationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.notificationChannelService = new NotificationChannelService(prisma);
    this.scheduledNotificationService = new ScheduledNotificationService(prisma);
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create a new review
   * Requirements: 2.1-2.5 - Validate project status, ownership, uniqueness, rating bounds, image limit
   */
  async create(
    projectId: string,
    reviewerId: string,
    data: CreateReviewInput
  ): Promise<ReviewWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        selectedBid: {
          select: { contractorId: true },
        },
      },
    });

    if (!project) {
      throw new ReviewError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Requirements: 2.1 - Project must be COMPLETED
    if (project.status !== 'COMPLETED') {
      throw new ReviewError(
        'PROJECT_NOT_COMPLETED',
        'Can only review completed projects',
        400
      );
    }

    // Requirements: 2.2 - Reviewer must be project owner
    if (project.ownerId !== reviewerId) {
      throw new ReviewError(
        'NOT_PROJECT_OWNER',
        'Only project owner can create a review',
        403
      );
    }

    if (!project.selectedBid) {
      throw new ReviewError(
        'NO_SELECTED_BID',
        'Project has no selected contractor',
        400
      );
    }
    const contractorId = project.selectedBid.contractorId;

    // Requirements: 2.3, 1.4 - Check for existing review
    const existingReview = await this.prisma.review.findUnique({
      where: {
        projectId_reviewerId: {
          projectId,
          reviewerId,
        },
      },
    });

    if (existingReview) {
      throw new ReviewError(
        'REVIEW_ALREADY_EXISTS',
        'You have already reviewed this project',
        409
      );
    }

    // Requirements: 2.5 - Validate image limit
    if (data.images && data.images.length > MAX_REVIEW_IMAGES) {
      throw new ReviewError(
        'TOO_MANY_IMAGES',
        `Maximum ${MAX_REVIEW_IMAGES} images allowed`,
        400
      );
    }

    // Requirements: 17.2 - Calculate weighted average if multi-criteria ratings provided
    let finalRating = data.rating;
    const weightedRating = calculateWeightedRating({
      qualityRating: data.qualityRating,
      timelinessRating: data.timelinessRating,
      communicationRating: data.communicationRating,
      valueRating: data.valueRating,
    });
    
    if (weightedRating !== null) {
      finalRating = Math.round(weightedRating);
    }

    const review = await this.prisma.review.create({
      data: {
        projectId,
        reviewerId,
        contractorId,
        rating: finalRating,
        comment: data.comment ?? null,
        images: data.images ? JSON.stringify(data.images) : null,
        qualityRating: data.qualityRating ?? null,
        timelinessRating: data.timelinessRating ?? null,
        communicationRating: data.communicationRating ?? null,
        valueRating: data.valueRating ?? null,
        isPublic: true,
      },
      include: getReviewInclude(),
    });

    // Recalculate contractor rating
    await this.recalculateContractorRating(contractorId);

    // Notify contractor about new review
    try {
      await this.notificationChannelService.send({
        userId: contractorId,
        type: 'BID_RECEIVED',
        title: 'Bạn nhận được đánh giá mới',
        content: `Chủ nhà đã đánh giá ${finalRating} sao cho dự án ${project.code}.`,
        data: {
          projectId: project.id,
          projectCode: project.code,
        },
        channels: ['EMAIL'],
      });
    } catch (error) {
      console.error('Failed to send review notification:', error);
    }

    // Requirements: 20.4 - Cancel pending review reminders
    try {
      await this.scheduledNotificationService.cancelReviewReminders(projectId);
    } catch (error) {
      console.error('Failed to cancel review reminders:', error);
    }

    return transformReview(review);
  }

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  /**
   * Update a review
   * Requirements: 9.2 - Allow updates within 7 days of creation
   */
  async update(
    reviewId: string,
    reviewerId: string,
    data: UpdateReviewInput
  ): Promise<ReviewWithRelations> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    if (review.reviewerId !== reviewerId) {
      throw new ReviewError('REVIEW_ACCESS_DENIED', 'Access denied', 403);
    }

    if (review.isDeleted) {
      throw new ReviewError('REVIEW_DELETED', 'Cannot update deleted review', 400);
    }

    // Requirements: 9.2 - Check 7-day update window
    const daysSinceCreation = Math.floor(
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreation > REVIEW_UPDATE_WINDOW_DAYS) {
      throw new ReviewError(
        'REVIEW_UPDATE_EXPIRED',
        `Can only update reviews within ${REVIEW_UPDATE_WINDOW_DAYS} days of creation`,
        400
      );
    }

    if (data.images && data.images.length > MAX_REVIEW_IMAGES) {
      throw new ReviewError(
        'TOO_MANY_IMAGES',
        `Maximum ${MAX_REVIEW_IMAGES} images allowed`,
        400
      );
    }

    const updateData: Record<string, unknown> = {};
    if (data.comment !== undefined) updateData.comment = data.comment;
    if (data.images !== undefined) {
      updateData.images = JSON.stringify(data.images);
    }
    if (data.qualityRating !== undefined) updateData.qualityRating = data.qualityRating;
    if (data.timelinessRating !== undefined) updateData.timelinessRating = data.timelinessRating;
    if (data.communicationRating !== undefined) updateData.communicationRating = data.communicationRating;
    if (data.valueRating !== undefined) updateData.valueRating = data.valueRating;

    const hasMultiCriteriaUpdate = 
      data.qualityRating !== undefined ||
      data.timelinessRating !== undefined ||
      data.communicationRating !== undefined ||
      data.valueRating !== undefined;

    if (hasMultiCriteriaUpdate) {
      const mergedCriteria = {
        qualityRating: data.qualityRating !== undefined ? data.qualityRating : review.qualityRating,
        timelinessRating: data.timelinessRating !== undefined ? data.timelinessRating : review.timelinessRating,
        communicationRating: data.communicationRating !== undefined ? data.communicationRating : review.communicationRating,
        valueRating: data.valueRating !== undefined ? data.valueRating : review.valueRating,
      };

      const weightedRating = calculateWeightedRating(mergedCriteria);
      if (weightedRating !== null) {
        updateData.rating = Math.round(weightedRating);
      }
    } else if (data.rating !== undefined) {
      updateData.rating = data.rating;
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: getReviewInclude(),
    });

    if (updateData.rating !== undefined) {
      await this.recalculateContractorRating(review.contractorId);
    }

    return transformReview(updated);
  }

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  /**
   * Soft delete a review (homeowner)
   * Requirements: 9.3 - Soft delete the review
   */
  async delete(reviewId: string, reviewerId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    if (review.reviewerId !== reviewerId) {
      throw new ReviewError('REVIEW_ACCESS_DENIED', 'Access denied', 403);
    }

    if (review.isDeleted) {
      throw new ReviewError('REVIEW_ALREADY_DELETED', 'Review already deleted', 400);
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: reviewerId,
      },
    });

    await this.recalculateContractorRating(review.contractorId);
  }

  // ============================================
  // GET OPERATIONS
  // ============================================

  /**
   * Get review by ID
   */
  async getById(reviewId: string): Promise<ReviewWithRelations | null> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: getReviewInclude(),
    });

    if (!review) {
      return null;
    }

    return transformReview(review);
  }

  /**
   * Get review by ID for homeowner (must be owner)
   */
  async getByIdForHomeowner(
    reviewId: string,
    reviewerId: string
  ): Promise<ReviewWithRelations | null> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: getReviewInclude(),
    });

    if (!review) {
      return null;
    }

    if (review.reviewerId !== reviewerId) {
      throw new ReviewError('REVIEW_ACCESS_DENIED', 'Access denied', 403);
    }

    return transformReview(review);
  }

  // ============================================
  // LISTING OPERATIONS
  // ============================================

  /**
   * List reviews by contractor
   * Requirements: 10.1, 4.4 - Return all reviews including hidden ones for contractor
   */
  async listByContractor(
    contractorId: string,
    query: ReviewQuery
  ): Promise<ReviewListResult> {
    const { rating, fromDate, toDate, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      contractorId,
      isDeleted: false,
      ...(rating && { rating }),
      ...(fromDate && { createdAt: { gte: fromDate } }),
      ...(toDate && { createdAt: { lte: toDate } }),
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: getReviewInclude(),
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map((r) => transformReview(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List reviews by reviewer (homeowner)
   * Requirements: 9.4 - Return all reviews created by homeowner
   */
  async listByReviewer(
    reviewerId: string,
    query: ReviewQuery
  ): Promise<ReviewListResult> {
    const { rating, fromDate, toDate, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      reviewerId,
      isDeleted: false,
      ...(rating && { rating }),
      ...(fromDate && { createdAt: { gte: fromDate } }),
      ...(toDate && { createdAt: { lte: toDate } }),
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: getReviewInclude(),
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map((r) => transformReview(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List all reviews (admin)
   * Requirements: 12.1 - Return all reviews with filters
   */
  async listAdmin(query: AdminReviewQuery): Promise<ReviewListResult> {
    const {
      contractorId,
      reviewerId,
      projectId,
      rating,
      isPublic,
      isDeleted,
      fromDate,
      toDate,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(contractorId && { contractorId }),
      ...(reviewerId && { reviewerId }),
      ...(projectId && { projectId }),
      ...(rating && { rating }),
      ...(isPublic !== undefined && { isPublic }),
      ...(isDeleted !== undefined && { isDeleted }),
      ...(fromDate && { createdAt: { gte: fromDate } }),
      ...(toDate && { createdAt: { lte: toDate } }),
      ...(search && {
        OR: [
          { comment: { contains: search } },
          { response: { contains: search } },
        ],
      }),
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: getReviewInclude(),
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map((r) => transformReview(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // ADMIN OPERATIONS
  // ============================================

  /**
   * Hide a review (admin)
   * Requirements: 4.2, 12.2 - Set isPublic to false
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async hide(reviewId: string, adminId: string): Promise<ReviewWithRelations> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    if (!review.isPublic) {
      throw new ReviewError('REVIEW_ALREADY_HIDDEN', 'Review is already hidden', 400);
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isPublic: false },
      include: getReviewInclude(),
    });

    return transformReview(updated);
  }

  /**
   * Unhide a review (admin)
   * Requirements: 12.2 - Set isPublic to true
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async unhide(reviewId: string, adminId: string): Promise<ReviewWithRelations> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    if (review.isPublic) {
      throw new ReviewError('REVIEW_NOT_HIDDEN', 'Review is not hidden', 400);
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isPublic: true },
      include: getReviewInclude(),
    });

    return transformReview(updated);
  }

  /**
   * Permanently delete a review (admin)
   * Requirements: 12.3 - Permanently remove the review
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async adminDelete(reviewId: string, adminId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    await this.prisma.reviewHelpfulness.deleteMany({
      where: { reviewId },
    });
    await this.prisma.reviewReport.deleteMany({
      where: { reviewId },
    });

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    await this.recalculateContractorRating(review.contractorId);
  }

  // ============================================
  // RATING CALCULATION
  // ============================================

  /**
   * Recalculate contractor's average rating
   * Requirements: 5.1-5.5 - Recalculate on create/update/delete with weighted average
   * Note: Uses in-memory calculation for time-weighted averaging.
   * This is intentional as the weighting formula requires individual review dates.
   * Optimized: Uses minimal select to reduce data transfer.
   */
  async recalculateContractorRating(contractorId: string): Promise<void> {
    // Optimized: Only select needed fields for weighted calculation
    const reviews = await this.prisma.review.findMany({
      where: {
        contractorId,
        isDeleted: false,
      },
      select: {
        rating: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) {
      await this.prisma.user.update({
        where: { id: contractorId },
        data: { rating: 0 },
      });
      return;
    }

    const now = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;

    for (const review of reviews) {
      const ageInDays = (now - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const weight = Math.max(1, 180 - ageInDays) / 180;
      
      weightedSum += review.rating * weight;
      totalWeight += weight;
    }

    const rawAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const fixedAverage = parseFloat(rawAverage.toFixed(10));
    const averageRating = totalWeight > 0 
      ? Math.round(fixedAverage * 10) / 10 
      : 0;

    await this.prisma.user.update({
      where: { id: contractorId },
      data: { rating: averageRating },
    });

    const ranking = await this.prisma.contractorRanking.findUnique({
      where: { contractorId },
    });

    if (ranking) {
      await this.prisma.contractorRanking.update({
        where: { contractorId },
        data: {
          averageRating,
          totalReviews: reviews.length,
        },
      });
    }
  }
}
