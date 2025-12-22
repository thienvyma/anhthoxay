/**
 * Review Response Service
 *
 * Handles contractor response operations for reviews.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 3.1-3.4**
 */

import { PrismaClient } from '@prisma/client';
import { NotificationChannelService } from '../notification-channel.service';
import type { AddResponseInput } from '../../schemas/review.schema';
import {
  ReviewWithRelations,
  ReviewError,
  getReviewInclude,
  transformReview,
} from './types';

// ============================================
// REVIEW RESPONSE SERVICE CLASS
// ============================================

export class ReviewResponseService {
  private prisma: PrismaClient;
  private notificationChannelService: NotificationChannelService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.notificationChannelService = new NotificationChannelService(prisma);
  }

  // ============================================
  // RESPONSE OPERATIONS
  // ============================================

  /**
   * Add contractor response to a review
   * Requirements: 3.1-3.4 - Contractor can respond once, notify reviewer
   */
  async addResponse(
    reviewId: string,
    contractorId: string,
    data: AddResponseInput
  ): Promise<ReviewWithRelations> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        project: { select: { id: true, code: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    // Requirements: 3.1 - Check contractor owns this review
    if (review.contractorId !== contractorId) {
      throw new ReviewError('NOT_CONTRACTOR', 'Only the reviewed contractor can respond', 403);
    }

    if (review.isDeleted) {
      throw new ReviewError('REVIEW_DELETED', 'Cannot respond to deleted review', 400);
    }

    // Requirements: 3.3 - Check if already responded
    if (review.response) {
      throw new ReviewError(
        'RESPONSE_ALREADY_EXISTS',
        'You have already responded to this review',
        409
      );
    }

    // Requirements: 3.2 - Add response with timestamp
    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        response: data.response,
        respondedAt: new Date(),
      },
      include: getReviewInclude(),
    });

    // Requirements: 3.4 - Notify reviewer
    try {
      await this.notificationChannelService.send({
        userId: review.reviewerId,
        type: 'BID_RECEIVED',
        title: 'Nhà thầu đã phản hồi đánh giá của bạn',
        content: `Nhà thầu đã phản hồi đánh giá của bạn cho dự án ${review.project.code}.`,
        data: {
          projectId: review.project.id,
          projectCode: review.project.code,
        },
        channels: ['EMAIL'],
      });
    } catch (error) {
      console.error('Failed to send response notification:', error);
    }

    return transformReview(updated);
  }

  /**
   * Get response for a review
   */
  async getResponse(reviewId: string): Promise<{
    response: string | null;
    respondedAt: Date | null;
  } | null> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        response: true,
        respondedAt: true,
      },
    });

    if (!review) {
      return null;
    }

    return {
      response: review.response,
      respondedAt: review.respondedAt,
    };
  }

  /**
   * Check if contractor has responded to a review
   */
  async hasResponded(reviewId: string): Promise<boolean> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { response: true },
    });

    return review?.response !== null;
  }
}
