/**
 * Review Helpfulness Service
 *
 * Handles helpfulness voting operations for reviews.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 18.1-18.2**
 */

import { PrismaClient } from '@prisma/client';
import { ReviewError } from './types';

// ============================================
// REVIEW HELPFULNESS SERVICE CLASS
// ============================================

export class ReviewHelpfulnessService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // VOTE OPERATIONS
  // ============================================

  /**
   * Vote a review as helpful
   * Requirements: 18.1, 18.2 - Max 1 vote per user per review
   */
  async voteHelpful(
    reviewId: string,
    userId: string
  ): Promise<{ helpfulCount: number; hasVoted: boolean }> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    if (!review.isPublic || review.isDeleted) {
      throw new ReviewError('REVIEW_NOT_AVAILABLE', 'Review is not available for voting', 400);
    }

    const existingVote = await this.prisma.reviewHelpfulness.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existingVote) {
      throw new ReviewError('ALREADY_VOTED', 'You have already voted for this review', 409);
    }

    const [, updatedReview] = await this.prisma.$transaction([
      this.prisma.reviewHelpfulness.create({
        data: {
          reviewId,
          userId,
        },
      }),
      this.prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: { increment: 1 },
        },
        select: { helpfulCount: true },
      }),
    ]);

    return {
      helpfulCount: updatedReview.helpfulCount,
      hasVoted: true,
    };
  }

  /**
   * Remove helpful vote from a review
   * Requirements: 18.2 - Allow removing vote
   */
  async removeVote(
    reviewId: string,
    userId: string
  ): Promise<{ helpfulCount: number; hasVoted: boolean }> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    const existingVote = await this.prisma.reviewHelpfulness.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (!existingVote) {
      throw new ReviewError('NOT_VOTED', 'You have not voted for this review', 400);
    }

    const [, updatedReview] = await this.prisma.$transaction([
      this.prisma.reviewHelpfulness.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      }),
      this.prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: { decrement: 1 },
        },
        select: { helpfulCount: true },
      }),
    ]);

    return {
      helpfulCount: Math.max(0, updatedReview.helpfulCount),
      hasVoted: false,
    };
  }

  // ============================================
  // STATUS OPERATIONS
  // ============================================

  /**
   * Get helpful count for a review
   * Requirements: 18.1 - Display helpful count
   */
  async getHelpfulCount(reviewId: string): Promise<number> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { helpfulCount: true },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    return review.helpfulCount;
  }

  /**
   * Check if user has voted for a review
   * Requirements: 18.2 - Track user votes
   */
  async hasUserVoted(reviewId: string, userId: string): Promise<boolean> {
    const vote = await this.prisma.reviewHelpfulness.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    return !!vote;
  }

  /**
   * Get vote status for a review
   */
  async getVoteStatus(
    reviewId: string,
    userId: string
  ): Promise<{ helpfulCount: number; hasVoted: boolean }> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { helpfulCount: true },
    });

    if (!review) {
      throw new ReviewError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    const hasVoted = await this.hasUserVoted(reviewId, userId);

    return {
      helpfulCount: review.helpfulCount,
      hasVoted,
    };
  }

  /**
   * Get helpfulness status for multiple reviews (for listing)
   * Requirements: 18.1, 18.2 - Efficient batch check
   */
  async getHelpfulnessStatus(
    reviewIds: string[],
    userId: string
  ): Promise<Map<string, boolean>> {
    const votes = await this.prisma.reviewHelpfulness.findMany({
      where: {
        reviewId: { in: reviewIds },
        userId,
      },
      select: { reviewId: true },
    });

    const votedMap = new Map<string, boolean>();
    for (const reviewId of reviewIds) {
      votedMap.set(reviewId, false);
    }
    for (const vote of votes) {
      votedMap.set(vote.reviewId, true);
    }

    return votedMap;
  }
}
