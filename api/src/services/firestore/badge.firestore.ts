/**
 * Badge Firestore Service
 * Handles contractor badges stored as subcollection in Firestore
 * 
 * @module services/firestore/badge.firestore
 * @requirements 7.3
 */

import {
  SubcollectionFirestoreService,
} from './base.firestore';
import type {
  FirestoreContractorBadge,
  BadgeType,
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// CONSTANTS
// ============================================

/**
 * Badge definitions with criteria
 */
export const BADGE_DEFINITIONS: Record<BadgeType, {
  name: string;
  description: string;
  criteria: string;
}> = {
  ACTIVE_CONTRACTOR: {
    name: 'Nhà thầu tích cực',
    description: 'Hoàn thành nhiều dự án trong tháng',
    criteria: 'Hoàn thành ít nhất 3 dự án trong 30 ngày qua',
  },
  HIGH_QUALITY: {
    name: 'Chất lượng cao',
    description: 'Đánh giá trung bình cao',
    criteria: 'Đánh giá trung bình >= 4.5 sao với ít nhất 5 đánh giá',
  },
  FAST_RESPONDER: {
    name: 'Phản hồi nhanh',
    description: 'Thời gian phản hồi nhanh',
    criteria: 'Thời gian phản hồi trung bình dưới 2 giờ',
  },
};

// ============================================
// ERROR CLASS
// ============================================

export class BadgeFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'BadgeFirestoreError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============================================
// INPUT TYPES
// ============================================

export interface AwardBadgeInput {
  badgeType: BadgeType;
}

export interface BadgeWithDefinition extends FirestoreContractorBadge {
  name: string;
  description: string;
  criteria: string;
}

// ============================================
// BADGE FIRESTORE SERVICE
// ============================================

/**
 * Badge Firestore Service
 * Manages badge documents in `users/{userId}/badges/{badgeId}` subcollection
 */
export class BadgeFirestoreService extends SubcollectionFirestoreService<FirestoreContractorBadge> {
  constructor() {
    super('users', 'badges');
  }

  // ============================================
  // BADGE OPERATIONS
  // ============================================

  /**
   * Award a badge to a contractor
   */
  async awardBadge(contractorId: string, badgeType: BadgeType): Promise<FirestoreContractorBadge> {
    // Check if badge already exists
    const existing = await this.getBadgeByType(contractorId, badgeType);
    if (existing) {
      throw new BadgeFirestoreError(
        'BADGE_EXISTS',
        `Contractor already has the ${badgeType} badge`,
        409
      );
    }

    const badge = await this.create(contractorId, {
      contractorId,
      badgeType,
      awardedAt: new Date(),
    });

    logger.info('Awarded badge to contractor', { contractorId, badgeType });

    return badge;
  }

  /**
   * Remove a badge from a contractor
   */
  async removeBadge(contractorId: string, badgeType: BadgeType): Promise<void> {
    const badge = await this.getBadgeByType(contractorId, badgeType);
    if (!badge) {
      throw new BadgeFirestoreError(
        'BADGE_NOT_FOUND',
        `Contractor does not have the ${badgeType} badge`,
        404
      );
    }

    await this.delete(contractorId, badge.id);

    logger.info('Removed badge from contractor', { contractorId, badgeType });
  }

  /**
   * Get a specific badge by type
   */
  async getBadgeByType(
    contractorId: string,
    badgeType: BadgeType
  ): Promise<FirestoreContractorBadge | null> {
    const badges = await this.query(contractorId, {
      where: [{ field: 'badgeType', operator: '==', value: badgeType }],
      limit: 1,
    });

    return badges.length > 0 ? badges[0] : null;
  }

  /**
   * Get all badges for a contractor
   */
  async getContractorBadges(contractorId: string): Promise<BadgeWithDefinition[]> {
    const badges = await this.getAll(contractorId);

    return badges.map(badge => ({
      ...badge,
      ...BADGE_DEFINITIONS[badge.badgeType],
    }));
  }

  /**
   * Check if contractor has a specific badge
   */
  async hasBadge(contractorId: string, badgeType: BadgeType): Promise<boolean> {
    const badge = await this.getBadgeByType(contractorId, badgeType);
    return badge !== null;
  }

  /**
   * Get badge counts by type across all contractors
   */
  async getBadgeStats(): Promise<Record<BadgeType, number>> {
    const db = await this.getDb();
    const stats: Record<BadgeType, number> = {
      ACTIVE_CONTRACTOR: 0,
      HIGH_QUALITY: 0,
      FAST_RESPONDER: 0,
    };

    // Query all users and their badges
    // Note: This is a simplified implementation
    // In production, you might want to use a counter document or aggregation
    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const badgesSnapshot = await userDoc.ref.collection('badges').get();
      for (const badgeDoc of badgesSnapshot.docs) {
        const badge = badgeDoc.data() as FirestoreContractorBadge;
        if (badge.badgeType in stats) {
          stats[badge.badgeType]++;
        }
      }
    }

    return stats;
  }

  // ============================================
  // BADGE EVALUATION
  // ============================================

  /**
   * Evaluate and update badges for a contractor based on their stats
   */
  async evaluateBadges(
    contractorId: string,
    stats: {
      completedProjectsLast30Days: number;
      averageRating: number;
      totalReviews: number;
      averageResponseTime: number;
    }
  ): Promise<{
    awarded: BadgeType[];
    removed: BadgeType[];
  }> {
    const awarded: BadgeType[] = [];
    const removed: BadgeType[] = [];

    // Evaluate ACTIVE_CONTRACTOR badge
    const hasActiveBadge = await this.hasBadge(contractorId, 'ACTIVE_CONTRACTOR');
    const qualifiesForActive = stats.completedProjectsLast30Days >= 3;

    if (qualifiesForActive && !hasActiveBadge) {
      await this.awardBadge(contractorId, 'ACTIVE_CONTRACTOR');
      awarded.push('ACTIVE_CONTRACTOR');
    } else if (!qualifiesForActive && hasActiveBadge) {
      await this.removeBadge(contractorId, 'ACTIVE_CONTRACTOR');
      removed.push('ACTIVE_CONTRACTOR');
    }

    // Evaluate HIGH_QUALITY badge
    const hasQualityBadge = await this.hasBadge(contractorId, 'HIGH_QUALITY');
    const qualifiesForQuality = stats.averageRating >= 4.5 && stats.totalReviews >= 5;

    if (qualifiesForQuality && !hasQualityBadge) {
      await this.awardBadge(contractorId, 'HIGH_QUALITY');
      awarded.push('HIGH_QUALITY');
    } else if (!qualifiesForQuality && hasQualityBadge) {
      await this.removeBadge(contractorId, 'HIGH_QUALITY');
      removed.push('HIGH_QUALITY');
    }

    // Evaluate FAST_RESPONDER badge
    const hasFastBadge = await this.hasBadge(contractorId, 'FAST_RESPONDER');
    const qualifiesForFast = stats.averageResponseTime > 0 && stats.averageResponseTime <= 2;

    if (qualifiesForFast && !hasFastBadge) {
      await this.awardBadge(contractorId, 'FAST_RESPONDER');
      awarded.push('FAST_RESPONDER');
    } else if (!qualifiesForFast && hasFastBadge) {
      await this.removeBadge(contractorId, 'FAST_RESPONDER');
      removed.push('FAST_RESPONDER');
    }

    if (awarded.length > 0 || removed.length > 0) {
      logger.info('Evaluated badges for contractor', { contractorId, awarded, removed });
    }

    return { awarded, removed };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let badgeFirestoreService: BadgeFirestoreService | null = null;

export function getBadgeFirestoreService(): BadgeFirestoreService {
  if (!badgeFirestoreService) {
    badgeFirestoreService = new BadgeFirestoreService();
  }
  return badgeFirestoreService;
}

export default BadgeFirestoreService;
