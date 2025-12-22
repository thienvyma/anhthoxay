/**
 * Ranking Service
 *
 * Business logic for contractor ranking management including score calculation,
 * ranking queries, featured contractors, and statistics.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 6.1-6.4, 7.1-7.5, 8.1-8.4, 13.1-13.4**
 */

import { PrismaClient } from '@prisma/client';
import {
  RANKING_WEIGHTS,
  MAX_FEATURED_CONTRACTORS,
  type RankingQuery,
  type FeaturedQuery,
} from '../schemas/ranking.schema';

// ============================================
// TYPES
// ============================================

export interface RankingScore {
  ratingScore: number;      // 0-100
  projectsScore: number;    // 0-100
  responseScore: number;    // 0-100
  verificationScore: number; // 0-100
  totalScore: number;       // Weighted sum
}

export interface ContractorRankingWithRelations {
  id: string;
  contractorId: string;
  ratingScore: number;
  projectsScore: number;
  responseScore: number;
  verificationScore: number;
  totalScore: number;
  rank: number;
  previousRank: number | null;
  isFeatured: boolean;
  featuredAt: Date | null;
  featuredBy: string | null;
  totalProjects: number;
  completedProjects: number;
  totalReviews: number;
  averageRating: number;
  averageResponseTime: number;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  contractor: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    companyName: string | null;
    verificationStatus: string;
    rating: number;
    totalProjects: number;
  };
}

export interface RankingListResult {
  data: ContractorRankingWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContractorStats {
  totalProjects: number;
  completedProjects: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  averageResponseTime: number; // hours
  rank: number | null;
  totalScore: number | null;
}

export interface MonthlyStats {
  month: string; // YYYY-MM format
  projectsCompleted: number;
  reviewsReceived: number;
  averageRating: number;
  bidsSubmitted: number;
  bidsWon: number;
}

// ============================================
// RANKING SERVICE CLASS
// ============================================

export class RankingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // SCORE CALCULATION
  // ============================================

  /**
   * Calculate ranking score for a contractor
   * Requirements: 7.1-7.4 - Weighted formula with 4 components
   */
  async calculateScore(contractorId: string): Promise<RankingScore> {
    // Get contractor data
    const contractor = await this.prisma.user.findUnique({
      where: { id: contractorId },
      select: {
        id: true,
        rating: true,
        totalProjects: true,
        verificationStatus: true,
      },
    });

    if (!contractor) {
      throw new RankingError('CONTRACTOR_NOT_FOUND', 'Contractor not found', 404);
    }

    // Get bid statistics for response rate
    const bidStats = await this.getBidStatistics(contractorId);

    // Requirements: 7.1 - Rating score (40% weight)
    // Scale: 0-5 rating → 0-100 score
    const ratingScore = (contractor.rating / 5) * 100;

    // Requirements: 7.2 - Projects score (30% weight)
    // Scale: logarithmic, max at 50 projects
    const projectsScore = Math.min(100, (Math.log10(contractor.totalProjects + 1) / Math.log10(51)) * 100);

    // Requirements: 7.3 - Response rate score (15% weight)
    // Based on bid response rate
    const responseScore = bidStats.responseRate;

    // Requirements: 7.4 - Verification score (15% weight)
    // VERIFIED = 100, PENDING = 50, REJECTED = 0
    const verificationScore = contractor.verificationStatus === 'VERIFIED' ? 100 :
                              contractor.verificationStatus === 'PENDING' ? 50 : 0;

    // Calculate total score with weights
    const totalScore = 
      (ratingScore * RANKING_WEIGHTS.rating) +
      (projectsScore * RANKING_WEIGHTS.projects) +
      (responseScore * RANKING_WEIGHTS.response) +
      (verificationScore * RANKING_WEIGHTS.verification);

    return {
      ratingScore: Math.round(ratingScore * 10) / 10,
      projectsScore: Math.round(projectsScore * 10) / 10,
      responseScore: Math.round(responseScore * 10) / 10,
      verificationScore: Math.round(verificationScore * 10) / 10,
      totalScore: Math.round(totalScore * 10) / 10,
    };
  }


  /**
   * Recalculate scores for all contractors
   * Requirements: 7.5 - Update scores daily via scheduled job
   */
  async recalculateAllScores(): Promise<void> {
    // Get all verified contractors
    const contractors = await this.prisma.user.findMany({
      where: {
        role: 'CONTRACTOR',
        verificationStatus: { in: ['VERIFIED', 'PENDING'] },
      },
      select: { id: true },
    });

    // Calculate scores for each contractor
    const scores: Array<{
      contractorId: string;
      score: RankingScore;
      stats: { totalProjects: number; completedProjects: number; totalReviews: number; averageRating: number; averageResponseTime: number };
    }> = [];

    for (const contractor of contractors) {
      try {
        const score = await this.calculateScore(contractor.id);
        const stats = await this.getContractorStatsInternal(contractor.id);
        scores.push({
          contractorId: contractor.id,
          score,
          stats: {
            totalProjects: stats.totalProjects,
            completedProjects: stats.completedProjects,
            totalReviews: stats.totalReviews,
            averageRating: stats.averageRating,
            averageResponseTime: stats.averageResponseTime,
          },
        });
      } catch (error) {
        console.error(`Failed to calculate score for contractor ${contractor.id}:`, error);
      }
    }

    // Sort by total score descending
    scores.sort((a, b) => b.score.totalScore - a.score.totalScore);

    // Update rankings in database
    for (let i = 0; i < scores.length; i++) {
      const { contractorId, score, stats } = scores[i];
      const newRank = i + 1;

      // Get existing ranking to preserve previousRank
      const existing = await this.prisma.contractorRanking.findUnique({
        where: { contractorId },
      });

      await this.prisma.contractorRanking.upsert({
        where: { contractorId },
        create: {
          contractorId,
          ratingScore: score.ratingScore,
          projectsScore: score.projectsScore,
          responseScore: score.responseScore,
          verificationScore: score.verificationScore,
          totalScore: score.totalScore,
          rank: newRank,
          previousRank: null,
          totalProjects: stats.totalProjects,
          completedProjects: stats.completedProjects,
          totalReviews: stats.totalReviews,
          averageRating: stats.averageRating,
          averageResponseTime: stats.averageResponseTime,
          calculatedAt: new Date(),
        },
        update: {
          ratingScore: score.ratingScore,
          projectsScore: score.projectsScore,
          responseScore: score.responseScore,
          verificationScore: score.verificationScore,
          totalScore: score.totalScore,
          previousRank: existing?.rank ?? null,
          rank: newRank,
          totalProjects: stats.totalProjects,
          completedProjects: stats.completedProjects,
          totalReviews: stats.totalReviews,
          averageRating: stats.averageRating,
          averageResponseTime: stats.averageResponseTime,
          calculatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Update ranking for a single contractor
   */
  async updateContractorRanking(contractorId: string): Promise<ContractorRankingWithRelations> {
    const score = await this.calculateScore(contractorId);
    const stats = await this.getContractorStatsInternal(contractorId);

    // Get existing ranking
    const existing = await this.prisma.contractorRanking.findUnique({
      where: { contractorId },
    });

    // Upsert ranking
    const ranking = await this.prisma.contractorRanking.upsert({
      where: { contractorId },
      create: {
        contractorId,
        ratingScore: score.ratingScore,
        projectsScore: score.projectsScore,
        responseScore: score.responseScore,
        verificationScore: score.verificationScore,
        totalScore: score.totalScore,
        rank: 0, // Will be updated by recalculateAllScores
        totalProjects: stats.totalProjects,
        completedProjects: stats.completedProjects,
        totalReviews: stats.totalReviews,
        averageRating: stats.averageRating,
        averageResponseTime: stats.averageResponseTime,
        calculatedAt: new Date(),
      },
      update: {
        ratingScore: score.ratingScore,
        projectsScore: score.projectsScore,
        responseScore: score.responseScore,
        verificationScore: score.verificationScore,
        totalScore: score.totalScore,
        previousRank: existing?.rank ?? null,
        totalProjects: stats.totalProjects,
        completedProjects: stats.completedProjects,
        totalReviews: stats.totalReviews,
        averageRating: stats.averageRating,
        averageResponseTime: stats.averageResponseTime,
        calculatedAt: new Date(),
      },
      include: this.getRankingInclude(),
    });

    return this.transformRanking(ranking);
  }

  // ============================================
  // RANKING QUERIES
  // ============================================

  /**
   * Get contractor rankings with pagination and filters
   * Requirements: 13.1, 13.2 - List rankings with filters
   * Requirements: 22.4 - Filter by response time ranges
   */
  async getRanking(query: RankingQuery): Promise<RankingListResult> {
    const { regionId, specialty, minRating, isFeatured, responseTimeRange, maxResponseTime, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }
    
    if (minRating !== undefined) {
      where.averageRating = { gte: minRating };
    }

    // Requirements: 22.4 - Filter by response time ranges
    if (responseTimeRange) {
      switch (responseTimeRange) {
        case 'FAST':
          // Under 2 hours
          where.averageResponseTime = { gt: 0, lte: 2 };
          break;
        case 'NORMAL':
          // 2-24 hours
          where.averageResponseTime = { gt: 2, lte: 24 };
          break;
        case 'SLOW':
          // Over 24 hours
          where.averageResponseTime = { gt: 24 };
          break;
      }
    } else if (maxResponseTime !== undefined) {
      // Custom max response time filter
      where.averageResponseTime = { gt: 0, lte: maxResponseTime };
    }

    // Filter by region or specialty requires joining with contractor profile
    if (regionId || specialty) {
      where.contractor = {
        contractorProfile: {
          ...(regionId && { serviceAreas: { contains: regionId } }),
          ...(specialty && { specialties: { contains: specialty } }),
        },
      };
    }

    const [rankings, total] = await Promise.all([
      this.prisma.contractorRanking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getRankingInclude(),
      }),
      this.prisma.contractorRanking.count({ where }),
    ]);

    return {
      data: rankings.map((r) => this.transformRanking(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a contractor's rank
   * Requirements: 13.3 - Show position and score breakdown
   */
  async getContractorRank(contractorId: string): Promise<ContractorRankingWithRelations | null> {
    const ranking = await this.prisma.contractorRanking.findUnique({
      where: { contractorId },
      include: this.getRankingInclude(),
    });

    if (!ranking) {
      return null;
    }

    return this.transformRanking(ranking);
  }


  // ============================================
  // FEATURED CONTRACTORS
  // ============================================

  /**
   * Update featured contractors based on ranking
   * Requirements: 8.1, 8.3 - Mark top contractors as featured, remove when ranking drops
   */
  async updateFeaturedContractors(): Promise<void> {
    // Get top contractors by score (excluding manually featured)
    const topContractors = await this.prisma.contractorRanking.findMany({
      where: {
        featuredBy: null, // Not manually featured
        contractor: {
          verificationStatus: 'VERIFIED',
        },
      },
      orderBy: { totalScore: 'desc' },
      take: MAX_FEATURED_CONTRACTORS,
      select: { contractorId: true },
    });

    const topContractorIds = topContractors.map((c) => c.contractorId);

    // Remove featured status from contractors no longer in top (except manually featured)
    await this.prisma.contractorRanking.updateMany({
      where: {
        isFeatured: true,
        featuredBy: null, // Not manually featured
        contractorId: { notIn: topContractorIds },
      },
      data: {
        isFeatured: false,
        featuredAt: null,
      },
    });

    // Add featured status to top contractors
    await this.prisma.contractorRanking.updateMany({
      where: {
        contractorId: { in: topContractorIds },
        isFeatured: false,
      },
      data: {
        isFeatured: true,
        featuredAt: new Date(),
      },
    });
  }

  /**
   * Get featured contractors
   * Requirements: 8.2 - Show top 10 by ranking score
   */
  async getFeaturedContractors(query: FeaturedQuery): Promise<ContractorRankingWithRelations[]> {
    const { limit, regionId } = query;

    const where: Record<string, unknown> = {
      isFeatured: true,
      contractor: {
        verificationStatus: 'VERIFIED',
      },
    };

    // Filter by region if provided
    if (regionId) {
      where.contractor = {
        ...where.contractor as object,
        contractorProfile: {
          serviceAreas: { contains: regionId },
        },
      };
    }

    const rankings = await this.prisma.contractorRanking.findMany({
      where,
      orderBy: { totalScore: 'desc' },
      take: Math.min(limit, MAX_FEATURED_CONTRACTORS),
      include: this.getRankingInclude(),
    });

    return rankings.map((r) => this.transformRanking(r));
  }

  /**
   * Set featured status for a contractor (admin override)
   * Requirements: 8.4 - Admin can manually feature contractors
   */
  async setFeatured(
    contractorId: string,
    adminId: string,
    isFeatured: boolean
  ): Promise<ContractorRankingWithRelations> {
    // Check if ranking exists
    const existing = await this.prisma.contractorRanking.findUnique({
      where: { contractorId },
    });

    if (!existing) {
      // Create ranking first
      await this.updateContractorRanking(contractorId);
    }

    // Update featured status
    const ranking = await this.prisma.contractorRanking.update({
      where: { contractorId },
      data: {
        isFeatured,
        featuredAt: isFeatured ? new Date() : null,
        featuredBy: isFeatured ? adminId : null,
      },
      include: this.getRankingInclude(),
    });

    return this.transformRanking(ranking);
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get contractor statistics
   * Requirements: 6.1-6.4 - Performance statistics
   */
  async getContractorStats(contractorId: string): Promise<ContractorStats> {
    const stats = await this.getContractorStatsInternal(contractorId);
    
    // Get ranking info
    const ranking = await this.prisma.contractorRanking.findUnique({
      where: { contractorId },
      select: { rank: true, totalScore: true },
    });

    return {
      ...stats,
      rank: ranking?.rank ?? null,
      totalScore: ranking?.totalScore ?? null,
    };
  }

  /**
   * Get monthly statistics for a contractor
   * Requirements: 6.4 - Monthly statistics
   */
  async getMonthlyStats(contractorId: string, months = 6): Promise<MonthlyStats[]> {
    const result: MonthlyStats[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

      // Get projects completed in this month
      const projectsCompleted = await this.prisma.project.count({
        where: {
          selectedBid: {
            contractorId,
          },
          status: 'COMPLETED',
          updatedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      // Get reviews received in this month
      const reviews = await this.prisma.review.findMany({
        where: {
          contractorId,
          isDeleted: false,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: { rating: true },
      });

      const reviewsReceived = reviews.length;
      const averageRating = reviewsReceived > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived
        : 0;

      // Get bids submitted in this month
      const bidsSubmitted = await this.prisma.bid.count({
        where: {
          contractorId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      // Get bids won in this month
      const bidsWon = await this.prisma.bid.count({
        where: {
          contractorId,
          status: 'SELECTED',
          updatedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      result.push({
        month: monthKey,
        projectsCompleted,
        reviewsReceived,
        averageRating: Math.round(averageRating * 10) / 10,
        bidsSubmitted,
        bidsWon,
      });
    }

    // Return in chronological order (oldest first)
    return result.reverse();
  }


  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get bid statistics for response rate calculation
   * Requirements: 22.2 - Add averageResponseTime calculation
   */
  private async getBidStatistics(contractorId: string): Promise<{
    totalBids: number;
    respondedBids: number;
    responseRate: number;
    averageResponseTime: number;
  }> {
    // Get all bids by contractor with stored response time
    const bids = await this.prisma.bid.findMany({
      where: { contractorId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        responseTimeHours: true,
        project: {
          select: {
            publishedAt: true,
          },
        },
      },
    });

    const totalBids = bids.length;
    
    // Count responded bids (any status except PENDING means responded)
    const respondedBids = bids.filter((b) => b.status !== 'PENDING').length;
    
    // Calculate response rate (0-100)
    const responseRate = totalBids > 0 ? (respondedBids / totalBids) * 100 : 0;

    // Calculate average response time using stored responseTimeHours
    // Fall back to calculating from timestamps if not stored
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const bid of bids) {
      // Use stored responseTimeHours if available
      if (bid.responseTimeHours !== null && bid.responseTimeHours > 0) {
        totalResponseTime += bid.responseTimeHours;
        responseTimeCount++;
      } else if (bid.project.publishedAt) {
        // Fall back to calculating from timestamps
        const responseTime = (bid.createdAt.getTime() - bid.project.publishedAt.getTime()) / (1000 * 60 * 60);
        if (responseTime > 0) {
          totalResponseTime += responseTime;
          responseTimeCount++;
        }
      }
    }

    const averageResponseTime = responseTimeCount > 0 
      ? totalResponseTime / responseTimeCount 
      : 0;

    return {
      totalBids,
      respondedBids,
      responseRate: Math.round(responseRate * 10) / 10,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
    };
  }

  /**
   * Get contractor statistics (internal helper)
   */
  private async getContractorStatsInternal(contractorId: string): Promise<{
    totalProjects: number;
    completedProjects: number;
    completionRate: number;
    averageRating: number;
    totalReviews: number;
    responseRate: number;
    averageResponseTime: number;
  }> {
    // Get project counts
    const [totalProjects, completedProjects] = await Promise.all([
      this.prisma.project.count({
        where: {
          selectedBid: {
            contractorId,
          },
          status: { in: ['MATCHED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      }),
      this.prisma.project.count({
        where: {
          selectedBid: {
            contractorId,
          },
          status: 'COMPLETED',
        },
      }),
    ]);

    // Get review statistics
    const reviews = await this.prisma.review.findMany({
      where: {
        contractorId,
        isDeleted: false,
      },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Get bid statistics
    const bidStats = await this.getBidStatistics(contractorId);

    // Calculate completion rate
    const completionRate = totalProjects > 0
      ? (completedProjects / totalProjects) * 100
      : 0;

    return {
      totalProjects,
      completedProjects,
      completionRate: Math.round(completionRate * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      responseRate: bidStats.responseRate,
      averageResponseTime: bidStats.averageResponseTime,
    };
  }

  /**
   * Get standard include for ranking queries
   */
  private getRankingInclude() {
    return {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          verificationStatus: true,
          rating: true,
          totalProjects: true,
        },
      },
    };
  }

  /**
   * Transform ranking from Prisma to response format
   */
  private transformRanking(ranking: {
    id: string;
    contractorId: string;
    ratingScore: number;
    projectsScore: number;
    responseScore: number;
    verificationScore: number;
    totalScore: number;
    rank: number;
    previousRank: number | null;
    isFeatured: boolean;
    featuredAt: Date | null;
    featuredBy: string | null;
    totalProjects: number;
    completedProjects: number;
    totalReviews: number;
    averageRating: number;
    averageResponseTime: number;
    calculatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    contractor: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      companyName: string | null;
      verificationStatus: string;
      rating: number;
      totalProjects: number;
    };
  }): ContractorRankingWithRelations {
    return {
      id: ranking.id,
      contractorId: ranking.contractorId,
      ratingScore: ranking.ratingScore,
      projectsScore: ranking.projectsScore,
      responseScore: ranking.responseScore,
      verificationScore: ranking.verificationScore,
      totalScore: ranking.totalScore,
      rank: ranking.rank,
      previousRank: ranking.previousRank,
      isFeatured: ranking.isFeatured,
      featuredAt: ranking.featuredAt,
      featuredBy: ranking.featuredBy,
      totalProjects: ranking.totalProjects,
      completedProjects: ranking.completedProjects,
      totalReviews: ranking.totalReviews,
      averageRating: ranking.averageRating,
      averageResponseTime: ranking.averageResponseTime,
      calculatedAt: ranking.calculatedAt,
      createdAt: ranking.createdAt,
      updatedAt: ranking.updatedAt,
      contractor: ranking.contractor,
    };
  }
}

// ============================================
// RANKING ERROR CLASS
// ============================================

export class RankingError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'RankingError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      CONTRACTOR_NOT_FOUND: 404,
      RANKING_NOT_FOUND: 404,
      INVALID_CONTRACTOR: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
