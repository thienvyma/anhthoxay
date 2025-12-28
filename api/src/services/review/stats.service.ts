/**
 * Review Stats Service
 *
 * Handles statistics, summary, and public listing operations for reviews.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 10.1-10.4, 11.1-11.2, 18.3-18.4**
 */

import { PrismaClient } from '@prisma/client';
import type { PublicReviewQuery } from '../../schemas/review.schema';
import {
  PublicReview,
  PublicReviewListResult,
  ReviewSummary,
  anonymizeReviewerName,
  parseJsonArray,
} from './types';

// ============================================
// REVIEW STATS SERVICE CLASS
// ============================================

export class ReviewStatsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // PUBLIC LISTING OPERATIONS
  // ============================================

  /**
   * List public reviews for a contractor
   * Requirements: 11.1, 4.3, 18.3, 18.4 - Return only public reviews, support sorting by helpfulness
   */
  async listPublic(
    contractorId: string,
    query: PublicReviewQuery
  ): Promise<PublicReviewListResult> {
    const { rating, fromDate, toDate, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Requirements: 4.3 - Only show public reviews
    const where = {
      contractorId,
      isPublic: true,
      isDeleted: false,
      ...(rating && { rating }),
      ...(fromDate && { createdAt: { gte: fromDate } }),
      ...(toDate && { createdAt: { lte: toDate } }),
    };

    // Requirements: 18.4 - Get top helpful reviews to mark as "Most Helpful"
    const topHelpfulReviews = await this.prisma.review.findMany({
      where: {
        contractorId,
        isPublic: true,
        isDeleted: false,
        helpfulCount: { gte: 3 },
      },
      orderBy: { helpfulCount: 'desc' },
      take: 3,
      select: { id: true },
    });
    const mostHelpfulIds = new Set(topHelpfulReviews.map(r => r.id));

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    // Transform to public format (anonymize reviewer name)
    const data: PublicReview[] = reviews.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      projectCode: r.project.code,
      projectTitle: r.project.title,
      reviewerName: anonymizeReviewerName(r.reviewer.name),
      rating: r.rating,
      comment: r.comment,
      images: parseJsonArray(r.images),
      qualityRating: r.qualityRating,
      timelinessRating: r.timelinessRating,
      communicationRating: r.communicationRating,
      valueRating: r.valueRating,
      response: r.response,
      respondedAt: r.respondedAt,
      helpfulCount: r.helpfulCount,
      isMostHelpful: mostHelpfulIds.has(r.id),
      createdAt: r.createdAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // SUMMARY OPERATIONS
  // ============================================

  /**
   * Get review summary for a contractor
   * Requirements: 11.2 - Return rating distribution and averages
   * Optimized: Use Prisma aggregation queries instead of fetching all records
   */
  async getContractorSummary(contractorId: string): Promise<ReviewSummary> {
    // Optimized: Use aggregation queries to calculate stats at database level
    const [aggregateResult, ratingDistribution, criteriaAverages] = await Promise.all([
      // Get total count and average rating
      this.prisma.review.aggregate({
        where: {
          contractorId,
          isPublic: true,
          isDeleted: false,
        },
        _count: { id: true },
        _avg: { rating: true },
      }),
      // Get rating distribution using groupBy
      this.prisma.review.groupBy({
        by: ['rating'],
        where: {
          contractorId,
          isPublic: true,
          isDeleted: false,
        },
        _count: { rating: true },
      }),
      // Get averages for multi-criteria ratings
      this.prisma.review.aggregate({
        where: {
          contractorId,
          isPublic: true,
          isDeleted: false,
        },
        _avg: {
          qualityRating: true,
          timelinessRating: true,
          communicationRating: true,
          valueRating: true,
        },
      }),
    ]);

    const totalReviews = aggregateResult._count.id;
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageQualityRating: null,
        averageTimelinessRating: null,
        averageCommunicationRating: null,
        averageValueRating: null,
      };
    }

    // Build rating distribution from groupBy result
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const group of ratingDistribution) {
      const rating = group.rating as 1 | 2 | 3 | 4 | 5;
      distribution[rating] = group._count.rating;
    }

    // Helper function for consistent rounding
    const roundToOneDecimal = (value: number | null): number | null => {
      if (value === null) return null;
      const fixed = parseFloat(value.toFixed(10));
      return Math.round(fixed * 10) / 10;
    };

    return {
      totalReviews,
      averageRating: roundToOneDecimal(aggregateResult._avg.rating) ?? 0,
      ratingDistribution: distribution,
      averageQualityRating: roundToOneDecimal(criteriaAverages._avg.qualityRating),
      averageTimelinessRating: roundToOneDecimal(criteriaAverages._avg.timelinessRating),
      averageCommunicationRating: roundToOneDecimal(criteriaAverages._avg.communicationRating),
      averageValueRating: roundToOneDecimal(criteriaAverages._avg.valueRating),
    };
  }

  // ============================================
  // STATS OPERATIONS
  // ============================================

  /**
   * Get contractor stats for ranking
   * Requirements: 10.2 - Return stats for contractor
   * Optimized: Use aggregation queries instead of fetching all records
   */
  async getContractorStats(contractorId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    responseRate: number;
  }> {
    // Use aggregation queries to calculate stats at database level
    const [aggregateResult, respondedCount] = await Promise.all([
      // Get total count and average rating
      this.prisma.review.aggregate({
        where: {
          contractorId,
          isDeleted: false,
        },
        _count: { id: true },
        _avg: { rating: true },
      }),
      // Count reviews with responses
      this.prisma.review.count({
        where: {
          contractorId,
          isDeleted: false,
          response: { not: null },
        },
      }),
    ]);

    const totalReviews = aggregateResult._count.id;
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        responseRate: 0,
      };
    }

    return {
      totalReviews,
      averageRating: Math.round((aggregateResult._avg.rating ?? 0) * 10) / 10,
      responseRate: Math.round((respondedCount / totalReviews) * 100),
    };
  }

  /**
   * Get monthly stats for contractor
   * Requirements: 10.3 - Return monthly review stats
   * Note: Uses in-memory grouping because SQLite doesn't support date functions in groupBy.
   * For PostgreSQL migration, this can be optimized with raw SQL date_trunc.
   * Optimized: Uses minimal select to reduce data transfer.
   */
  async getMonthlyStats(
    contractorId: string,
    months = 12
  ): Promise<Array<{
    month: string;
    totalReviews: number;
    averageRating: number;
  }>> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Optimized: Only select needed fields
    const reviews = await this.prisma.review.findMany({
      where: {
        contractorId,
        isDeleted: false,
        createdAt: { gte: startDate },
      },
      select: {
        rating: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month (in-memory due to SQLite limitations)
    const monthlyData = new Map<string, { total: number; sum: number }>();
    
    for (const review of reviews) {
      const monthKey = `${review.createdAt.getFullYear()}-${String(review.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyData.get(monthKey) || { total: 0, sum: 0 };
      existing.total++;
      existing.sum += review.rating;
      monthlyData.set(monthKey, existing);
    }

    // Convert to array and fill missing months
    const result: Array<{ month: string; totalReviews: number; averageRating: number }> = [];
    const current = new Date(startDate);
    const now = new Date();

    while (current <= now) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const data = monthlyData.get(monthKey);
      
      result.push({
        month: monthKey,
        totalReviews: data?.total || 0,
        averageRating: data ? Math.round((data.sum / data.total) * 10) / 10 : 0,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }
}
