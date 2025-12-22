/**
 * Badge Job Service
 *
 * Scheduled job service for checking and awarding contractor badges.
 * Runs daily to check badge criteria for all contractors.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 21.1, 21.2, 21.3**
 */

import { PrismaClient } from '@prisma/client';
import { BadgeService } from './badge.service';

// ============================================
// TYPES
// ============================================

export interface BadgeJobResult {
  success: boolean;
  contractorsChecked: number;
  badgesAwarded: number;
  errors: string[];
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

// ============================================
// BADGE JOB SERVICE CLASS
// ============================================

export class BadgeJobService {
  private prisma: PrismaClient;
  private badgeService: BadgeService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.badgeService = new BadgeService(prisma);
  }

  /**
   * Run the daily badge check job
   * Requirements: 21.1, 21.2, 21.3 - Check and award badges automatically
   */
  async runDailyBadgeCheck(): Promise<BadgeJobResult> {
    const startedAt = new Date();
    const errors: string[] = [];
    let contractorsChecked = 0;
    let badgesAwarded = 0;

    try {
      // Get all verified contractors
      const contractors = await this.prisma.user.findMany({
        where: {
          role: 'CONTRACTOR',
          verificationStatus: 'VERIFIED',
        },
        select: { id: true, name: true },
      });

      contractorsChecked = contractors.length;

      // Check and award badges for each contractor
      for (const contractor of contractors) {
        try {
          const awarded = await this.badgeService.checkAndAwardBadges(contractor.id);
          badgesAwarded += awarded.length;

          if (awarded.length > 0) {
            console.log(
              `[BadgeJob] Awarded ${awarded.length} badge(s) to contractor ${contractor.name} (${contractor.id})`
            );
          }
        } catch (error) {
          const errorMessage = `Failed to check badges for contractor ${contractor.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          console.error(`[BadgeJob] ${errorMessage}`);
        }
      }

      const completedAt = new Date();

      console.log(
        `[BadgeJob] Completed: ${contractorsChecked} contractors checked, ${badgesAwarded} badges awarded`
      );

      return {
        success: errors.length === 0,
        contractorsChecked,
        badgesAwarded,
        errors,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      };
    } catch (error) {
      const completedAt = new Date();
      const errorMessage = `Badge job failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error(`[BadgeJob] ${errorMessage}`);

      return {
        success: false,
        contractorsChecked,
        badgesAwarded,
        errors,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      };
    }
  }

  /**
   * Check badges for a single contractor
   * Can be called after project completion or other events
   */
  async checkContractorBadges(contractorId: string): Promise<{
    checked: boolean;
    awarded: string[];
    error?: string;
  }> {
    try {
      const awarded = await this.badgeService.checkAndAwardBadges(contractorId);

      return {
        checked: true,
        awarded: awarded.map((b) => b.badgeType),
      };
    } catch (error) {
      return {
        checked: false,
        awarded: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
