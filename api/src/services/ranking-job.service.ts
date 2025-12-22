/**
 * Ranking Job Service
 *
 * Business logic for scheduled ranking updates including daily recalculation
 * of all contractor rankings and featured contractor updates.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 7.5 - Update scores daily via scheduled job**
 */

import { PrismaClient } from '@prisma/client';
import { RankingService } from './ranking.service';
import { BadgeService } from './badge.service';

// ============================================
// TYPES
// ============================================

export interface RankingJobResult {
  success: boolean;
  contractorsProcessed: number;
  featuredUpdated: number;
  badgesAwarded: number;
  errors: string[];
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

export interface RankingJobStatus {
  lastRunAt: Date | null;
  lastRunResult: RankingJobResult | null;
  isRunning: boolean;
}

// ============================================
// RANKING JOB SERVICE CLASS
// ============================================

export class RankingJobService {
  private prisma: PrismaClient;
  private rankingService: RankingService;
  private badgeService: BadgeService;
  private isRunning = false;
  private lastRunResult: RankingJobResult | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.rankingService = new RankingService(prisma);
    this.badgeService = new BadgeService(prisma);
  }

  /**
   * Run the daily ranking update job
   * Requirements: 7.5 - Update scores daily via scheduled job
   * Requirements: 21.1, 21.2, 21.3 - Check and award badges
   *
   * This job:
   * 1. Recalculates scores for all contractors
   * 2. Updates rankings based on new scores
   * 3. Updates featured contractor status
   * 4. Checks and awards badges
   *
   * @returns Job result with statistics
   */
  async runDailyRankingUpdate(): Promise<RankingJobResult> {
    // Prevent concurrent runs
    if (this.isRunning) {
      throw new RankingJobError(
        'JOB_ALREADY_RUNNING',
        'Daily ranking update job is already running',
        409
      );
    }

    this.isRunning = true;
    const startedAt = new Date();
    const errors: string[] = [];
    let contractorsProcessed = 0;
    let featuredUpdated = 0;
    let badgesAwarded = 0;

    try {
      // Step 1: Get all contractors that need ranking
      const contractors = await this.prisma.user.findMany({
        where: {
          role: 'CONTRACTOR',
          verificationStatus: { in: ['VERIFIED', 'PENDING'] },
        },
        select: { id: true, name: true },
      });

      contractorsProcessed = contractors.length;

      // Step 2: Recalculate all scores
      // This method handles score calculation and rank assignment
      try {
        await this.rankingService.recalculateAllScores();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to recalculate scores: ${errorMessage}`);
      }

      // Step 3: Update featured contractors
      try {
        // Get current featured count before update
        const beforeFeatured = await this.prisma.contractorRanking.count({
          where: { isFeatured: true },
        });

        await this.rankingService.updateFeaturedContractors();

        // Get featured count after update
        const afterFeatured = await this.prisma.contractorRanking.count({
          where: { isFeatured: true },
        });

        featuredUpdated = Math.abs(afterFeatured - beforeFeatured);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to update featured contractors: ${errorMessage}`);
      }

      // Step 4: Check and award badges (Requirements 21.1, 21.2, 21.3)
      try {
        const badgeResult = await this.badgeService.checkAndAwardAllBadges();
        badgesAwarded = badgeResult.awarded;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to check badges: ${errorMessage}`);
      }

      const completedAt = new Date();
      const result: RankingJobResult = {
        success: errors.length === 0,
        contractorsProcessed,
        featuredUpdated,
        badgesAwarded,
        errors,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      };

      this.lastRunResult = result;
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get the current job status
   *
   * @returns Current job status
   */
  getStatus(): RankingJobStatus {
    return {
      lastRunAt: this.lastRunResult?.completedAt ?? null,
      lastRunResult: this.lastRunResult,
      isRunning: this.isRunning,
    };
  }

  /**
   * Recalculate ranking for a single contractor
   * Useful for immediate updates after significant events
   *
   * @param contractorId - The contractor ID
   * @returns Updated ranking
   */
  async recalculateSingleContractor(contractorId: string): Promise<void> {
    await this.rankingService.updateContractorRanking(contractorId);
  }
}

// ============================================
// RANKING JOB ERROR CLASS
// ============================================

export class RankingJobError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'RankingJobError';

    const statusMap: Record<string, number> = {
      JOB_ALREADY_RUNNING: 409,
      JOB_FAILED: 500,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
