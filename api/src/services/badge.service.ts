/**
 * Badge Service
 *
 * Business logic for contractor badge management including badge criteria checking,
 * awarding badges, and retrieving badges.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 21.1, 21.2, 21.3, 21.4**
 */

import { PrismaClient } from '@prisma/client';
import {
  BADGE_TYPES,
  BADGE_CRITERIA,
  BADGE_INFO,
  type BadgeType,
  type BadgeResponse,
} from '../schemas/badge.schema';

// ============================================
// TYPES
// ============================================

export interface BadgeCheckResult {
  badgeType: BadgeType;
  eligible: boolean;
  currentValue: number;
  requiredValue: number;
  alreadyAwarded: boolean;
}

export interface ContractorBadgeStats {
  completedProjects: number;
  averageRating: number;
  ratingMonths: number;
  responseRate: number;
  averageResponseTimeHours: number;
}

// ============================================
// BADGE SERVICE CLASS
// ============================================

export class BadgeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // BADGE RETRIEVAL
  // ============================================

  /**
   * Get all badges for a contractor
   * Requirements: 21.4 - Display earned badges prominently
   */
  async getBadges(contractorId: string): Promise<BadgeResponse[]> {
    const badges = await this.prisma.contractorBadge.findMany({
      where: { contractorId },
      orderBy: { awardedAt: 'desc' },
    });

    return badges.map((badge) => this.transformBadge(badge));
  }

  /**
   * Get a specific badge
   */
  async getBadge(contractorId: string, badgeType: BadgeType): Promise<BadgeResponse | null> {
    const badge = await this.prisma.contractorBadge.findUnique({
      where: {
        contractorId_badgeType: {
          contractorId,
          badgeType,
        },
      },
    });

    return badge ? this.transformBadge(badge) : null;
  }

  /**
   * Check if contractor has a specific badge
   */
  async hasBadge(contractorId: string, badgeType: BadgeType): Promise<boolean> {
    const badge = await this.prisma.contractorBadge.findUnique({
      where: {
        contractorId_badgeType: {
          contractorId,
          badgeType,
        },
      },
    });

    return badge !== null;
  }

  // ============================================
  // BADGE CRITERIA CHECKING
  // ============================================

  /**
   * Check and award badges for a contractor
   * Requirements: 21.1, 21.2, 21.3 - Award badges when criteria are met
   */
  async checkAndAwardBadges(contractorId: string): Promise<BadgeResponse[]> {
    const awardedBadges: BadgeResponse[] = [];

    // Get contractor stats
    const stats = await this.getContractorBadgeStats(contractorId);

    // Check each badge type
    for (const badgeType of Object.values(BADGE_TYPES)) {
      const checkResult = await this.checkBadgeCriteria(contractorId, badgeType, stats);

      if (checkResult.eligible && !checkResult.alreadyAwarded) {
        const badge = await this.awardBadge(contractorId, badgeType);
        awardedBadges.push(badge);
      }
    }

    return awardedBadges;
  }

  /**
   * Check if contractor meets criteria for a specific badge
   */
  async checkBadgeCriteria(
    contractorId: string,
    badgeType: BadgeType,
    stats?: ContractorBadgeStats
  ): Promise<BadgeCheckResult> {
    // Get stats if not provided
    const contractorStats = stats || (await this.getContractorBadgeStats(contractorId));

    // Check if already awarded
    const alreadyAwarded = await this.hasBadge(contractorId, badgeType);

    switch (badgeType) {
      case BADGE_TYPES.ACTIVE_CONTRACTOR:
        return this.checkActiveContractorCriteria(contractorStats, alreadyAwarded);

      case BADGE_TYPES.HIGH_QUALITY:
        return this.checkHighQualityCriteria(contractorStats, alreadyAwarded);

      case BADGE_TYPES.FAST_RESPONDER:
        return this.checkFastResponderCriteria(contractorStats, alreadyAwarded);

      default:
        throw new BadgeError('INVALID_BADGE_TYPE', `Invalid badge type: ${badgeType}`, 400);
    }
  }

  /**
   * Check ACTIVE_CONTRACTOR badge criteria
   * Requirement 21.1: Completes 10 projects
   */
  private checkActiveContractorCriteria(
    stats: ContractorBadgeStats,
    alreadyAwarded: boolean
  ): BadgeCheckResult {
    const { minCompletedProjects } = BADGE_CRITERIA.ACTIVE_CONTRACTOR;

    return {
      badgeType: BADGE_TYPES.ACTIVE_CONTRACTOR,
      eligible: stats.completedProjects >= minCompletedProjects,
      currentValue: stats.completedProjects,
      requiredValue: minCompletedProjects,
      alreadyAwarded,
    };
  }

  /**
   * Check HIGH_QUALITY badge criteria
   * Requirement 21.2: Maintains 4.5+ rating for 6 months
   */
  private checkHighQualityCriteria(
    stats: ContractorBadgeStats,
    alreadyAwarded: boolean
  ): BadgeCheckResult {
    const { minRating, minMonths } = BADGE_CRITERIA.HIGH_QUALITY;

    const eligible = stats.averageRating >= minRating && stats.ratingMonths >= minMonths;

    return {
      badgeType: BADGE_TYPES.HIGH_QUALITY,
      eligible,
      currentValue: stats.averageRating,
      requiredValue: minRating,
      alreadyAwarded,
    };
  }

  /**
   * Check FAST_RESPONDER badge criteria
   * Requirement 21.3: Responds to 90%+ bids within 24h
   */
  private checkFastResponderCriteria(
    stats: ContractorBadgeStats,
    alreadyAwarded: boolean
  ): BadgeCheckResult {
    const { minResponseRate, maxResponseTimeHours } = BADGE_CRITERIA.FAST_RESPONDER;

    const eligible =
      stats.responseRate >= minResponseRate &&
      stats.averageResponseTimeHours <= maxResponseTimeHours;

    return {
      badgeType: BADGE_TYPES.FAST_RESPONDER,
      eligible,
      currentValue: stats.responseRate,
      requiredValue: minResponseRate,
      alreadyAwarded,
    };
  }

  // ============================================
  // BADGE AWARDING
  // ============================================

  /**
   * Award a badge to a contractor
   */
  async awardBadge(contractorId: string, badgeType: BadgeType): Promise<BadgeResponse> {
    // Check if already awarded
    const existing = await this.prisma.contractorBadge.findUnique({
      where: {
        contractorId_badgeType: {
          contractorId,
          badgeType,
        },
      },
    });

    if (existing) {
      throw new BadgeError('BADGE_ALREADY_AWARDED', 'Badge already awarded to this contractor', 409);
    }

    // Award the badge
    const badge = await this.prisma.contractorBadge.create({
      data: {
        contractorId,
        badgeType,
      },
    });

    return this.transformBadge(badge);
  }

  /**
   * Remove a badge from a contractor (admin only)
   */
  async removeBadge(contractorId: string, badgeType: BadgeType): Promise<void> {
    await this.prisma.contractorBadge.delete({
      where: {
        contractorId_badgeType: {
          contractorId,
          badgeType,
        },
      },
    });
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get contractor stats for badge criteria checking
   */
  async getContractorBadgeStats(contractorId: string): Promise<ContractorBadgeStats> {
    // Get completed projects count
    const completedProjects = await this.prisma.project.count({
      where: {
        selectedBid: {
          contractorId,
        },
        status: 'COMPLETED',
      },
    });

    // Get average rating and rating history
    const reviews = await this.prisma.review.findMany({
      where: {
        contractorId,
        isDeleted: false,
      },
      select: {
        rating: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    // Calculate how many months the contractor has maintained 4.5+ rating
    const ratingMonths = this.calculateRatingMonths(reviews, BADGE_CRITERIA.HIGH_QUALITY.minRating);

    // Get bid response statistics
    const bidStats = await this.getBidResponseStats(contractorId);

    return {
      completedProjects,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingMonths,
      responseRate: bidStats.responseRate,
      averageResponseTimeHours: bidStats.averageResponseTimeHours,
    };
  }

  /**
   * Calculate how many consecutive months the contractor has maintained a minimum rating
   */
  private calculateRatingMonths(
    reviews: Array<{ rating: number; createdAt: Date }>,
    minRating: number
  ): number {
    if (reviews.length === 0) return 0;

    const now = new Date();
    let consecutiveMonths = 0;

    // Group reviews by month and calculate monthly averages
    const monthlyRatings = new Map<string, number[]>();

    for (const review of reviews) {
      const monthKey = `${review.createdAt.getFullYear()}-${String(review.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyRatings.get(monthKey) || [];
      existing.push(review.rating);
      monthlyRatings.set(monthKey, existing);
    }

    // Check consecutive months from now going backwards
    for (let i = 0; i < 12; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;

      const ratings = monthlyRatings.get(monthKey);
      if (!ratings || ratings.length === 0) {
        // No reviews this month - break the streak if we've started counting
        if (consecutiveMonths > 0) break;
        continue;
      }

      const monthAverage = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      if (monthAverage >= minRating) {
        consecutiveMonths++;
      } else {
        break; // Streak broken
      }
    }

    return consecutiveMonths;
  }

  /**
   * Get bid response statistics for a contractor
   */
  private async getBidResponseStats(
    contractorId: string
  ): Promise<{ responseRate: number; averageResponseTimeHours: number }> {
    // Get all bids by contractor with project publish time
    const bids = await this.prisma.bid.findMany({
      where: { contractorId },
      select: {
        createdAt: true,
        project: {
          select: {
            publishedAt: true,
          },
        },
      },
    });

    if (bids.length === 0) {
      return { responseRate: 0, averageResponseTimeHours: 0 };
    }

    // Calculate response times
    const responseTimes: number[] = [];
    let fastResponses = 0;

    for (const bid of bids) {
      if (bid.project.publishedAt) {
        const responseTimeHours =
          (bid.createdAt.getTime() - bid.project.publishedAt.getTime()) / (1000 * 60 * 60);

        if (responseTimeHours > 0) {
          responseTimes.push(responseTimeHours);

          if (responseTimeHours <= BADGE_CRITERIA.FAST_RESPONDER.maxResponseTimeHours) {
            fastResponses++;
          }
        }
      }
    }

    const responseRate =
      responseTimes.length > 0 ? (fastResponses / responseTimes.length) * 100 : 0;

    const averageResponseTimeHours =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    return {
      responseRate: Math.round(responseRate * 10) / 10,
      averageResponseTimeHours: Math.round(averageResponseTimeHours * 10) / 10,
    };
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Check and award badges for all contractors
   * Used by scheduled job
   */
  async checkAndAwardAllBadges(): Promise<{ checked: number; awarded: number }> {
    // Get all verified contractors
    const contractors = await this.prisma.user.findMany({
      where: {
        role: 'CONTRACTOR',
        verificationStatus: 'VERIFIED',
      },
      select: { id: true },
    });

    let totalAwarded = 0;

    for (const contractor of contractors) {
      try {
        const awarded = await this.checkAndAwardBadges(contractor.id);
        totalAwarded += awarded.length;
      } catch (error) {
        console.error(`Failed to check badges for contractor ${contractor.id}:`, error);
      }
    }

    return {
      checked: contractors.length,
      awarded: totalAwarded,
    };
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Transform badge from Prisma to response format
   */
  private transformBadge(badge: {
    id: string;
    contractorId: string;
    badgeType: string;
    awardedAt: Date;
  }): BadgeResponse {
    const badgeType = badge.badgeType as BadgeType;
    const info = BADGE_INFO[badgeType];

    return {
      id: badge.id,
      contractorId: badge.contractorId,
      badgeType,
      awardedAt: badge.awardedAt,
      info,
    };
  }
}

// ============================================
// BADGE ERROR CLASS
// ============================================

export class BadgeError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'BadgeError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      BADGE_NOT_FOUND: 404,
      BADGE_ALREADY_AWARDED: 409,
      INVALID_BADGE_TYPE: 400,
      CONTRACTOR_NOT_FOUND: 404,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
