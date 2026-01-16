/**
 * Review Firestore Service
 * Handles reviews, helpfulness votes, and review reports in Firestore
 * 
 * @module services/firestore/review.firestore
 * @requirements 7.1
 */

import * as admin from 'firebase-admin';
import {
  BaseFirestoreService,
  SubcollectionFirestoreService,
  type QueryOptions,
  type PaginatedResult,
} from './base.firestore';
import type {
  FirestoreReview,
  FirestoreReviewHelpfulness,
  FirestoreReviewReport,
  ReviewReportReason,
  ReviewReportStatus,
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// ERROR CLASS
// ============================================

export class ReviewFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'ReviewFirestoreError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateReviewInput {
  projectId: string;
  reviewerId: string;
  contractorId: string;
  rating: number;
  comment?: string;
  images?: string[];
  qualityRating?: number;
  timelinessRating?: number;
  communicationRating?: number;
  valueRating?: number;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
  images?: string[];
  qualityRating?: number;
  timelinessRating?: number;
  communicationRating?: number;
  valueRating?: number;
}

export interface AddResponseInput {
  response: string;
}

export interface ReviewQueryParams {
  contractorId?: string;
  reviewerId?: string;
  projectId?: string;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
  isDeleted?: boolean;
  hasResponse?: boolean;
  limit?: number;
  startAfter?: admin.firestore.DocumentSnapshot;
  orderBy?: 'createdAt' | 'rating' | 'helpfulCount';
  orderDirection?: 'asc' | 'desc';
}

export interface CreateReportInput {
  reason: ReviewReportReason;
  description?: string;
}

export interface ResolveReportInput {
  resolution: 'hide' | 'delete' | 'dismiss';
}

export interface ReportQueryParams {
  reviewId?: string;
  reporterId?: string;
  status?: ReviewReportStatus;
  reason?: ReviewReportReason;
  limit?: number;
  startAfter?: admin.firestore.DocumentSnapshot;
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  qualityAverage: number | null;
  timelinessAverage: number | null;
  communicationAverage: number | null;
  valueAverage: number | null;
  responseRate: number;
}

export interface ReviewWithRelations extends FirestoreReview {
  reviewer?: { id: string; name: string; avatar?: string };
  contractor?: { id: string; name: string; companyName?: string };
  project?: { id: string; title: string; code: string };
}

// ============================================
// REVIEW FIRESTORE SERVICE
// ============================================

/**
 * Review Firestore Service
 * Manages review documents in `reviews/{reviewId}` collection
 */
export class ReviewFirestoreService extends BaseFirestoreService<FirestoreReview> {
  private helpfulVotesService: SubcollectionFirestoreService<FirestoreReviewHelpfulness>;

  constructor() {
    super('reviews');
    this.helpfulVotesService = new SubcollectionFirestoreService<FirestoreReviewHelpfulness>(
      'reviews',
      'helpfulVotes'
    );
  }

  // ============================================
  // REVIEW CRUD OPERATIONS
  // ============================================

  /**
   * Create a new review
   */
  async createReview(data: CreateReviewInput): Promise<FirestoreReview> {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new ReviewFirestoreError('INVALID_RATING', 'Rating must be between 1 and 5', 400);
    }

    // Check for existing review for this project by this reviewer
    const existing = await this.getByProjectAndReviewer(data.projectId, data.reviewerId);
    if (existing) {
      throw new ReviewFirestoreError(
        'REVIEW_EXISTS',
        'You have already reviewed this project',
        409
      );
    }

    const review = await this.create({
      projectId: data.projectId,
      reviewerId: data.reviewerId,
      contractorId: data.contractorId,
      rating: data.rating,
      comment: data.comment,
      images: data.images,
      qualityRating: data.qualityRating,
      timelinessRating: data.timelinessRating,
      communicationRating: data.communicationRating,
      valueRating: data.valueRating,
      isPublic: true,
      isDeleted: false,
      helpfulCount: 0,
    });

    logger.info('Created review', { reviewId: review.id, projectId: data.projectId });

    return review;
  }

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    reviewerId: string,
    data: UpdateReviewInput
  ): Promise<FirestoreReview> {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new ReviewFirestoreError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    if (review.reviewerId !== reviewerId) {
      throw new ReviewFirestoreError('REVIEW_ACCESS_DENIED', 'Not authorized to update this review', 403);
    }

    // Check if within 7 days of creation
    const daysSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) {
      throw new ReviewFirestoreError(
        'REVIEW_UPDATE_EXPIRED',
        'Reviews can only be updated within 7 days of creation',
        400
      );
    }

    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new ReviewFirestoreError('INVALID_RATING', 'Rating must be between 1 and 5', 400);
    }

    const updated = await this.update(reviewId, data);

    logger.info('Updated review', { reviewId });

    return updated;
  }

  /**
   * Soft delete a review
   */
  async softDelete(reviewId: string, userId: string): Promise<void> {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new ReviewFirestoreError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    if (review.reviewerId !== userId) {
      throw new ReviewFirestoreError('REVIEW_ACCESS_DENIED', 'Not authorized to delete this review', 403);
    }

    await this.update(reviewId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
    });

    logger.info('Soft deleted review', { reviewId, userId });
  }

  /**
   * Add contractor response to a review
   */
  async addResponse(
    reviewId: string,
    contractorId: string,
    data: AddResponseInput
  ): Promise<FirestoreReview> {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new ReviewFirestoreError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    if (review.contractorId !== contractorId) {
      throw new ReviewFirestoreError('REVIEW_ACCESS_DENIED', 'Not authorized to respond to this review', 403);
    }

    if (review.response) {
      throw new ReviewFirestoreError('RESPONSE_EXISTS', 'You have already responded to this review', 409);
    }

    const updated = await this.update(reviewId, {
      response: data.response,
      respondedAt: new Date(),
    });

    logger.info('Added response to review', { reviewId, contractorId });

    return updated;
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Get review by project and reviewer
   */
  async getByProjectAndReviewer(
    projectId: string,
    reviewerId: string
  ): Promise<FirestoreReview | null> {
    const reviews = await this.query({
      where: [
        { field: 'projectId', operator: '==', value: projectId },
        { field: 'reviewerId', operator: '==', value: reviewerId },
      ],
      limit: 1,
    });

    return reviews.length > 0 ? reviews[0] : null;
  }

  /**
   * List reviews by contractor
   */
  async listByContractor(
    contractorId: string,
    params: Omit<ReviewQueryParams, 'contractorId'> = {}
  ): Promise<PaginatedResult<FirestoreReview>> {
    return this.listReviews({ ...params, contractorId });
  }

  /**
   * List reviews by reviewer
   */
  async listByReviewer(
    reviewerId: string,
    params: Omit<ReviewQueryParams, 'reviewerId'> = {}
  ): Promise<PaginatedResult<FirestoreReview>> {
    return this.listReviews({ ...params, reviewerId });
  }

  /**
   * List public reviews for a contractor
   */
  async listPublicReviews(
    contractorId: string,
    params: Omit<ReviewQueryParams, 'contractorId' | 'isPublic' | 'isDeleted'> = {}
  ): Promise<PaginatedResult<FirestoreReview>> {
    return this.listReviews({
      ...params,
      contractorId,
      isPublic: true,
      isDeleted: false,
    });
  }

  /**
   * List reviews with filters
   */
  async listReviews(params: ReviewQueryParams = {}): Promise<PaginatedResult<FirestoreReview>> {
    const whereClause: QueryOptions<FirestoreReview>['where'] = [];

    if (params.contractorId) {
      whereClause.push({ field: 'contractorId', operator: '==', value: params.contractorId });
    }

    if (params.reviewerId) {
      whereClause.push({ field: 'reviewerId', operator: '==', value: params.reviewerId });
    }

    if (params.projectId) {
      whereClause.push({ field: 'projectId', operator: '==', value: params.projectId });
    }

    if (params.minRating !== undefined) {
      whereClause.push({ field: 'rating', operator: '>=', value: params.minRating });
    }

    if (params.maxRating !== undefined) {
      whereClause.push({ field: 'rating', operator: '<=', value: params.maxRating });
    }

    if (params.isPublic !== undefined) {
      whereClause.push({ field: 'isPublic', operator: '==', value: params.isPublic });
    }

    if (params.isDeleted !== undefined) {
      whereClause.push({ field: 'isDeleted', operator: '==', value: params.isDeleted });
    }

    const orderField = params.orderBy || 'createdAt';
    const orderDirection = params.orderDirection || 'desc';

    return this.queryPaginated({
      where: whereClause.length > 0 ? whereClause : undefined,
      orderBy: [{ field: orderField, direction: orderDirection }],
      limit: params.limit || 20,
      startAfter: params.startAfter,
    });
  }

  /**
   * Get contractor review summary
   */
  async getContractorSummary(contractorId: string): Promise<ReviewSummary> {
    const reviews = await this.query({
      where: [
        { field: 'contractorId', operator: '==', value: contractorId },
        { field: 'isPublic', operator: '==', value: true },
        { field: 'isDeleted', operator: '==', value: false },
      ],
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        qualityAverage: null,
        timelinessAverage: null,
        communicationAverage: null,
        valueAverage: null,
        responseRate: 0,
      };
    }

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let qualitySum = 0, qualityCount = 0;
    let timelinessSum = 0, timelinessCount = 0;
    let communicationSum = 0, communicationCount = 0;
    let valueSum = 0, valueCount = 0;
    let responseCount = 0;

    for (const review of reviews) {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
      totalRating += review.rating;

      if (review.qualityRating) {
        qualitySum += review.qualityRating;
        qualityCount++;
      }
      if (review.timelinessRating) {
        timelinessSum += review.timelinessRating;
        timelinessCount++;
      }
      if (review.communicationRating) {
        communicationSum += review.communicationRating;
        communicationCount++;
      }
      if (review.valueRating) {
        valueSum += review.valueRating;
        valueCount++;
      }
      if (review.response) {
        responseCount++;
      }
    }

    return {
      totalReviews: reviews.length,
      averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
      ratingDistribution,
      qualityAverage: qualityCount > 0 ? Math.round((qualitySum / qualityCount) * 10) / 10 : null,
      timelinessAverage: timelinessCount > 0 ? Math.round((timelinessSum / timelinessCount) * 10) / 10 : null,
      communicationAverage: communicationCount > 0 ? Math.round((communicationSum / communicationCount) * 10) / 10 : null,
      valueAverage: valueCount > 0 ? Math.round((valueSum / valueCount) * 10) / 10 : null,
      responseRate: Math.round((responseCount / reviews.length) * 100 * 10) / 10,
    };
  }

  // ============================================
  // ADMIN OPERATIONS
  // ============================================

  /**
   * Hide a review (admin)
   */
  async hideReview(reviewId: string, adminId: string): Promise<FirestoreReview> {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new ReviewFirestoreError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    const updated = await this.update(reviewId, { isPublic: false });

    logger.info('Admin hid review', { reviewId, adminId });

    return updated;
  }

  /**
   * Unhide a review (admin)
   */
  async unhideReview(reviewId: string, adminId: string): Promise<FirestoreReview> {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new ReviewFirestoreError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    const updated = await this.update(reviewId, { isPublic: true });

    logger.info('Admin unhid review', { reviewId, adminId });

    return updated;
  }

  /**
   * Permanently delete a review (admin)
   */
  async adminDelete(reviewId: string, adminId: string): Promise<void> {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new ReviewFirestoreError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    // Delete helpful votes subcollection first
    await this.helpfulVotesService.deleteAll(reviewId);

    // Delete the review
    await this.delete(reviewId);

    logger.info('Admin permanently deleted review', { reviewId, adminId });
  }

  // ============================================
  // HELPFUL VOTES OPERATIONS
  // ============================================

  /**
   * Vote a review as helpful
   */
  async voteHelpful(reviewId: string, userId: string): Promise<{ helpfulCount: number }> {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new ReviewFirestoreError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    // Check if user already voted
    const existingVote = await this.getHelpfulVote(reviewId, userId);
    if (existingVote) {
      throw new ReviewFirestoreError('ALREADY_VOTED', 'You have already voted for this review', 409);
    }

    // Add vote
    await this.helpfulVotesService.create(reviewId, {
      reviewId,
      userId,
    });

    // Increment helpful count
    const newCount = (review.helpfulCount || 0) + 1;
    await this.update(reviewId, { helpfulCount: newCount });

    logger.debug('User voted review as helpful', { reviewId, userId });

    return { helpfulCount: newCount };
  }

  /**
   * Remove helpful vote
   */
  async removeHelpfulVote(reviewId: string, userId: string): Promise<{ helpfulCount: number }> {
    const review = await this.getById(reviewId);
    if (!review) {
      throw new ReviewFirestoreError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    // Find and delete the vote
    const votes = await this.helpfulVotesService.query(reviewId, {
      where: [{ field: 'userId', operator: '==', value: userId }],
      limit: 1,
    });

    if (votes.length === 0) {
      throw new ReviewFirestoreError('VOTE_NOT_FOUND', 'You have not voted for this review', 404);
    }

    await this.helpfulVotesService.delete(reviewId, votes[0].id);

    // Decrement helpful count
    const newCount = Math.max(0, (review.helpfulCount || 0) - 1);
    await this.update(reviewId, { helpfulCount: newCount });

    logger.debug('User removed helpful vote', { reviewId, userId });

    return { helpfulCount: newCount };
  }

  /**
   * Check if user has voted for a review
   */
  async hasUserVoted(reviewId: string, userId: string): Promise<boolean> {
    const vote = await this.getHelpfulVote(reviewId, userId);
    return vote !== null;
  }

  /**
   * Get helpful vote by user
   */
  private async getHelpfulVote(
    reviewId: string,
    userId: string
  ): Promise<FirestoreReviewHelpfulness | null> {
    const votes = await this.helpfulVotesService.query(reviewId, {
      where: [{ field: 'userId', operator: '==', value: userId }],
      limit: 1,
    });

    return votes.length > 0 ? votes[0] : null;
  }

  /**
   * Get helpful count for a review
   */
  async getHelpfulCount(reviewId: string): Promise<number> {
    const review = await this.getById(reviewId);
    return review?.helpfulCount || 0;
  }
}

// ============================================
// REVIEW REPORT FIRESTORE SERVICE
// ============================================

/**
 * Review Report Firestore Service
 * Manages review report documents in `reviewReports/{reportId}` collection
 */
export class ReviewReportFirestoreService extends BaseFirestoreService<FirestoreReviewReport> {
  private reviewService: ReviewFirestoreService;

  constructor() {
    super('reviewReports');
    this.reviewService = new ReviewFirestoreService();
  }

  /**
   * Create a report for a review
   */
  async createReport(
    reviewId: string,
    reporterId: string,
    data: CreateReportInput
  ): Promise<FirestoreReviewReport> {
    // Check if review exists
    const review = await this.reviewService.getById(reviewId);
    if (!review) {
      throw new ReviewFirestoreError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    // Check if user already reported this review
    const existing = await this.getByReviewAndReporter(reviewId, reporterId);
    if (existing) {
      throw new ReviewFirestoreError(
        'REPORT_EXISTS',
        'You have already reported this review',
        409
      );
    }

    const report = await this.create({
      reviewId,
      reporterId,
      reason: data.reason,
      description: data.description,
      status: 'PENDING',
    });

    logger.info('Created review report', { reportId: report.id, reviewId, reporterId });

    return report;
  }

  /**
   * Get report by review and reporter
   */
  async getByReviewAndReporter(
    reviewId: string,
    reporterId: string
  ): Promise<FirestoreReviewReport | null> {
    const reports = await this.query({
      where: [
        { field: 'reviewId', operator: '==', value: reviewId },
        { field: 'reporterId', operator: '==', value: reporterId },
      ],
      limit: 1,
    });

    return reports.length > 0 ? reports[0] : null;
  }

  /**
   * List reports with filters
   */
  async listReports(params: ReportQueryParams = {}): Promise<PaginatedResult<FirestoreReviewReport>> {
    const whereClause: QueryOptions<FirestoreReviewReport>['where'] = [];

    if (params.reviewId) {
      whereClause.push({ field: 'reviewId', operator: '==', value: params.reviewId });
    }

    if (params.reporterId) {
      whereClause.push({ field: 'reporterId', operator: '==', value: params.reporterId });
    }

    if (params.status) {
      whereClause.push({ field: 'status', operator: '==', value: params.status });
    }

    if (params.reason) {
      whereClause.push({ field: 'reason', operator: '==', value: params.reason });
    }

    return this.queryPaginated({
      where: whereClause.length > 0 ? whereClause : undefined,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: params.limit || 20,
      startAfter: params.startAfter,
    });
  }

  /**
   * Resolve a report (admin)
   */
  async resolveReport(
    reportId: string,
    adminId: string,
    data: ResolveReportInput
  ): Promise<FirestoreReviewReport> {
    const report = await this.getById(reportId);
    if (!report) {
      throw new ReviewFirestoreError('REPORT_NOT_FOUND', 'Report not found', 404);
    }

    if (report.status !== 'PENDING') {
      throw new ReviewFirestoreError('REPORT_ALREADY_RESOLVED', 'Report has already been resolved', 400);
    }

    // Apply resolution action to the review
    if (data.resolution === 'hide') {
      await this.reviewService.hideReview(report.reviewId, adminId);
    } else if (data.resolution === 'delete') {
      await this.reviewService.adminDelete(report.reviewId, adminId);
    }
    // 'dismiss' does nothing to the review

    // Update report status
    const updated = await this.update(reportId, {
      status: 'RESOLVED',
      resolvedBy: adminId,
      resolvedAt: new Date(),
      resolution: data.resolution,
    });

    logger.info('Resolved review report', { reportId, adminId, resolution: data.resolution });

    return updated;
  }

  /**
   * Get report statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
    byReason: Record<string, number>;
  }> {
    const allReports = await this.query({});

    const stats = {
      total: allReports.length,
      pending: 0,
      resolved: 0,
      dismissed: 0,
      byReason: {} as Record<string, number>,
    };

    for (const report of allReports) {
      if (report.status === 'PENDING') stats.pending++;
      else if (report.status === 'RESOLVED') stats.resolved++;
      else if (report.status === 'DISMISSED') stats.dismissed++;

      stats.byReason[report.reason] = (stats.byReason[report.reason] || 0) + 1;
    }

    return stats;
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

let reviewFirestoreService: ReviewFirestoreService | null = null;
let reviewReportFirestoreService: ReviewReportFirestoreService | null = null;

export function getReviewFirestoreService(): ReviewFirestoreService {
  if (!reviewFirestoreService) {
    reviewFirestoreService = new ReviewFirestoreService();
  }
  return reviewFirestoreService;
}

export function getReviewReportFirestoreService(): ReviewReportFirestoreService {
  if (!reviewReportFirestoreService) {
    reviewReportFirestoreService = new ReviewReportFirestoreService();
  }
  return reviewReportFirestoreService;
}

export default ReviewFirestoreService;
