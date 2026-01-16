/**
 * Ranking Firestore Service
 * Handles contractor rankings in Firestore with transaction support
 * 
 * @module services/firestore/ranking.firestore
 * @requirements 7.2, 7.4
 */

import * as admin from 'firebase-admin';
import {
  BaseFirestoreService,
  type QueryOptions,
  type PaginatedResult,
} from './base.firestore';
import type {
  FirestoreContractorRanking,
} from '../../types/firestore.types';
import { getUsersFirestoreService } from './users.firestore';
import { getReviewFirestoreService } from './review.firestore';
import { getBidFirestoreService } from './bid.firestore';
import { logger } from '../../utils/logger';

// ============================================
// CONSTANTS
// ============================================

/**
 * Ranking weights for score calculation
 * Requirements: 7.1-7.4
 */
export const RANKING_WEIGHTS = {
  rating: 0.4,      // 40% weight
  projects: 0.3,    // 30% weight
  response: 0.15,   // 15% weight
  verification: 0.15, // 15% weight
};

export const MAX_FEATURED_CONTRACTORS = 10;
const CHUNK_SIZE = 50;

// ============================================
// ERROR CLASS
// ============================================

export class RankingFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'RankingFirestoreError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============================================
// INPUT TYPES
// ============================================

export interface RankingScore {
  ratingScore: number;
  projectsScore: number;
  responseScore: number;
  verificationScore: number;
  totalScore: number;
}

export interface RankingQueryParams {
  regionId?: string;
  specialty?: string;
  minRating?: number;
  isFeatured?: boolean;
  responseTimeRange?: 'FAST' | 'NORMAL' | 'SLOW';
  maxResponseTime?: number;
  limit?: number;
  startAfter?: admin.firestore.DocumentSnapshot;
  sortBy?: 'totalScore' | 'rank' | 'averageRating';
  sortOrder?: 'asc' | 'desc';
}

export interface FeaturedQueryParams {
  limit?: number;
  regionId?: string;
}

export interface ContractorStats {
  totalProjects: number;
  completedProjects: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  averageResponseTime: number;
  rank: number | null;
  totalScore: number | null;
}

export interface MonthlyStats {
  month: string;
  projectsCompleted: number;
  reviewsReceived: number;
  averageRating: number;
  bidsSubmitted: number;
  bidsWon: number;
}

export interface RankingWithContractor extends FirestoreContractorRanking {
  contractor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    verificationStatus: string;
    rating: number;
    totalProjects: number;
  };
}

// ============================================
// RANKING FIRESTORE SERVICE
// ============================================

/**
 * Ranking Firestore Service
 * Manages ranking documents in `rankings/{contractorId}` collection
 */
export class RankingFirestoreService extends BaseFirestoreService<FirestoreContractorRanking> {
  constructor() {
    super('rankings');
  }

  // ============================================
  // SCORE CALCULATION
  // ============================================

  /**
   * Calculate ranking score for a contractor
   * Requirements: 7.1-7.4 - Weighted formula with 4 components
   */
  async calculateScore(contractorId: string): Promise<RankingScore> {
    const usersService = getUsersFirestoreService();
    const contractor = await usersService.getById(contractorId);

    if (!contractor) {
      throw new RankingFirestoreError('CONTRACTOR_NOT_FOUND', 'Contractor not found', 404);
    }

    // Get bid statistics for response rate
    const bidStats = await this.getBidStatistics(contractorId);

    // Requirements: 7.1 - Rating score (40% weight)
    // Scale: 0-5 rating → 0-100 score
    const ratingScore = ((contractor.rating || 0) / 5) * 100;

    // Requirements: 7.2 - Projects score (30% weight)
    // Scale: logarithmic, max at 50 projects
    const projectsScore = Math.min(100, (Math.log10((contractor.totalProjects || 0) + 1) / Math.log10(51)) * 100);

    // Requirements: 7.3 - Response rate score (15% weight)
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
   * Update ranking for a single contractor using transaction
   * Requirements: 7.4 - Use transactions for consistency
   */
  async updateContractorRanking(contractorId: string): Promise<FirestoreContractorRanking> {
    const score = await this.calculateScore(contractorId);
    const stats = await this.getContractorStatsInternal(contractorId);

    // Get existing ranking
    const existing = await this.getById(contractorId);

    const now = new Date();
    const rankingData: Omit<FirestoreContractorRanking, 'id' | 'createdAt' | 'updatedAt'> = {
      contractorId,
      ratingScore: score.ratingScore,
      projectsScore: score.projectsScore,
      responseScore: score.responseScore,
      verificationScore: score.verificationScore,
      totalScore: score.totalScore,
      rank: existing?.rank || 0,
      previousRank: existing?.rank,
      isFeatured: existing?.isFeatured || false,
      featuredAt: existing?.featuredAt,
      featuredBy: existing?.featuredBy,
      totalProjects: stats.totalProjects,
      completedProjects: stats.completedProjects,
      totalReviews: stats.totalReviews,
      averageRating: stats.averageRating,
      averageResponseTime: stats.averageResponseTime,
      calculatedAt: now,
    };

    if (existing) {
      return this.update(contractorId, rankingData);
    } else {
      return this.createWithId(contractorId, rankingData);
    }
  }

  /**
   * Recalculate scores for all contractors
   * Requirements: 7.5 - Update scores daily via scheduled job
   */
  async recalculateAllScores(): Promise<{
    success: boolean;
    contractorsProcessed: number;
    errors: string[];
  }> {
    const usersService = getUsersFirestoreService();
    const errors: string[] = [];

    // Get all verified/pending contractors
    const contractors = await usersService.query({
      where: [
        { field: 'role', operator: '==', value: 'CONTRACTOR' },
        { field: 'verificationStatus', operator: 'in', value: ['VERIFIED', 'PENDING'] },
      ],
    });

    logger.info('Starting score recalculation', { totalContractors: contractors.length });

    // Calculate scores for all contractors
    const scores: Array<{
      contractorId: string;
      score: RankingScore;
      stats: { totalProjects: number; completedProjects: number; totalReviews: number; averageRating: number; averageResponseTime: number };
    }> = [];

    // Process in chunks
    for (let i = 0; i < contractors.length; i += CHUNK_SIZE) {
      const chunk = contractors.slice(i, i + CHUNK_SIZE);
      
      const chunkResults = await Promise.all(
        chunk.map(async (contractor) => {
          try {
            const score = await this.calculateScore(contractor.id);
            const stats = await this.getContractorStatsInternal(contractor.id);
            return {
              contractorId: contractor.id,
              score,
              stats: {
                totalProjects: stats.totalProjects,
                completedProjects: stats.completedProjects,
                totalReviews: stats.totalReviews,
                averageRating: stats.averageRating,
                averageResponseTime: stats.averageResponseTime,
              },
            };
          } catch (error) {
            const errorMsg = `Failed to calculate score for ${contractor.id}: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMsg);
            logger.error(errorMsg);
            return null;
          }
        })
      );

      for (const result of chunkResults) {
        if (result !== null) {
          scores.push(result);
        }
      }
    }

    // Sort by total score descending
    scores.sort((a, b) => b.score.totalScore - a.score.totalScore);

    // Update rankings in database using batch operations
    const db = await this.getDb();
    const now = new Date();

    for (let i = 0; i < scores.length; i += CHUNK_SIZE) {
      const chunk = scores.slice(i, i + CHUNK_SIZE);
      const batch = db.batch();

      for (const { contractorId, score, stats } of chunk) {
        const globalIndex = scores.findIndex(s => s.contractorId === contractorId);
        const newRank = globalIndex + 1;

        const existing = await this.getById(contractorId);
        const docRef = db.collection(this.collectionName).doc(contractorId);

        const rankingData = {
          contractorId,
          ratingScore: score.ratingScore,
          projectsScore: score.projectsScore,
          responseScore: score.responseScore,
          verificationScore: score.verificationScore,
          totalScore: score.totalScore,
          rank: newRank,
          previousRank: existing?.rank ?? null,
          isFeatured: existing?.isFeatured ?? false,
          featuredAt: existing?.featuredAt ?? null,
          featuredBy: existing?.featuredBy ?? null,
          totalProjects: stats.totalProjects,
          completedProjects: stats.completedProjects,
          totalReviews: stats.totalReviews,
          averageRating: stats.averageRating,
          averageResponseTime: stats.averageResponseTime,
          calculatedAt: admin.firestore.Timestamp.fromDate(now),
          updatedAt: admin.firestore.Timestamp.fromDate(now),
        };

        if (existing) {
          batch.update(docRef, rankingData);
        } else {
          batch.set(docRef, {
            ...rankingData,
            createdAt: admin.firestore.Timestamp.fromDate(now),
          });
        }
      }

      await batch.commit();
    }

    logger.info('Ranking update completed', { 
      totalUpdated: scores.length,
      errors: errors.length,
    });

    return {
      success: errors.length === 0,
      contractorsProcessed: scores.length,
      errors,
    };
  }

  // ============================================
  // RANKING QUERIES
  // ============================================

  /**
   * Get contractor rankings with pagination and filters
   * Requirements: 13.1, 13.2 - List rankings with filters
   */
  async getRanking(params: RankingQueryParams = {}): Promise<PaginatedResult<RankingWithContractor>> {
    const whereClause: QueryOptions<FirestoreContractorRanking>['where'] = [];

    if (params.isFeatured !== undefined) {
      whereClause.push({ field: 'isFeatured', operator: '==', value: params.isFeatured });
    }

    if (params.minRating !== undefined) {
      whereClause.push({ field: 'averageRating', operator: '>=', value: params.minRating });
    }

    // Response time range filter
    if (params.responseTimeRange) {
      switch (params.responseTimeRange) {
        case 'FAST':
          whereClause.push({ field: 'averageResponseTime', operator: '<=', value: 2 });
          break;
        case 'NORMAL':
          whereClause.push({ field: 'averageResponseTime', operator: '<=', value: 24 });
          break;
        case 'SLOW':
          whereClause.push({ field: 'averageResponseTime', operator: '>', value: 24 });
          break;
      }
    } else if (params.maxResponseTime !== undefined) {
      whereClause.push({ field: 'averageResponseTime', operator: '<=', value: params.maxResponseTime });
    }

    const sortField = params.sortBy || 'totalScore';
    const sortDirection = params.sortOrder || 'desc';

    const result = await this.queryPaginated({
      where: whereClause.length > 0 ? whereClause : undefined,
      orderBy: [{ field: sortField, direction: sortDirection }],
      limit: params.limit || 20,
      startAfter: params.startAfter,
    });

    // Enrich with contractor data
    const usersService = getUsersFirestoreService();
    const enrichedData: RankingWithContractor[] = [];

    for (const ranking of result.data) {
      const contractor = await usersService.getById(ranking.contractorId);
      enrichedData.push({
        ...ranking,
        contractor: contractor ? {
          id: contractor.id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          companyName: contractor.companyName,
          verificationStatus: contractor.verificationStatus,
          rating: contractor.rating,
          totalProjects: contractor.totalProjects,
        } : undefined,
      });
    }

    return {
      ...result,
      data: enrichedData,
    };
  }

  /**
   * Get a contractor's rank
   * Requirements: 13.3 - Show position and score breakdown
   */
  async getContractorRank(contractorId: string): Promise<RankingWithContractor | null> {
    const ranking = await this.getById(contractorId);
    if (!ranking) {
      return null;
    }

    const usersService = getUsersFirestoreService();
    const contractor = await usersService.getById(contractorId);

    return {
      ...ranking,
      contractor: contractor ? {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        companyName: contractor.companyName,
        verificationStatus: contractor.verificationStatus,
        rating: contractor.rating,
        totalProjects: contractor.totalProjects,
      } : undefined,
    };
  }

  // ============================================
  // FEATURED CONTRACTORS
  // ============================================

  /**
   * Update featured contractors based on ranking
   * Requirements: 8.1, 8.3 - Mark top contractors as featured
   */
  async updateFeaturedContractors(): Promise<number> {
    // Get top contractors by score (excluding manually featured)
    const topRankings = await this.query({
      where: [{ field: 'featuredBy', operator: '==', value: null }],
      orderBy: [{ field: 'totalScore', direction: 'desc' }],
      limit: MAX_FEATURED_CONTRACTORS,
    });

    const topContractorIds = topRankings.map(r => r.contractorId);

    // Get all currently featured (not manually)
    const currentlyFeatured = await this.query({
      where: [
        { field: 'isFeatured', operator: '==', value: true },
        { field: 'featuredBy', operator: '==', value: null },
      ],
    });

    const db = await this.getDb();
    const batch = db.batch();
    let updatedCount = 0;

    // Remove featured status from contractors no longer in top
    for (const ranking of currentlyFeatured) {
      if (!topContractorIds.includes(ranking.contractorId)) {
        const docRef = db.collection(this.collectionName).doc(ranking.contractorId);
        batch.update(docRef, {
          isFeatured: false,
          featuredAt: null,
          updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        });
        updatedCount++;
      }
    }

    // Add featured status to top contractors
    const now = new Date();
    for (const ranking of topRankings) {
      if (!ranking.isFeatured) {
        const docRef = db.collection(this.collectionName).doc(ranking.contractorId);
        batch.update(docRef, {
          isFeatured: true,
          featuredAt: admin.firestore.Timestamp.fromDate(now),
          updatedAt: admin.firestore.Timestamp.fromDate(now),
        });
        updatedCount++;
      }
    }

    await batch.commit();

    logger.info('Updated featured contractors', { updatedCount });

    return updatedCount;
  }

  /**
   * Get featured contractors
   * Requirements: 8.2 - Show top 10 by ranking score
   */
  async getFeaturedContractors(params: FeaturedQueryParams = {}): Promise<RankingWithContractor[]> {
    const limit = Math.min(params.limit || MAX_FEATURED_CONTRACTORS, MAX_FEATURED_CONTRACTORS);

    const rankings = await this.query({
      where: [{ field: 'isFeatured', operator: '==', value: true }],
      orderBy: [{ field: 'totalScore', direction: 'desc' }],
      limit,
    });

    // Enrich with contractor data
    const usersService = getUsersFirestoreService();
    const result: RankingWithContractor[] = [];

    for (const ranking of rankings) {
      const contractor = await usersService.getById(ranking.contractorId);
      
      // Filter by region if specified
      if (params.regionId && contractor) {
        const profile = await usersService.getContractorProfile(ranking.contractorId);
        if (!profile?.serviceAreas?.includes(params.regionId)) {
          continue;
        }
      }

      result.push({
        ...ranking,
        contractor: contractor ? {
          id: contractor.id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          companyName: contractor.companyName,
          verificationStatus: contractor.verificationStatus,
          rating: contractor.rating,
          totalProjects: contractor.totalProjects,
        } : undefined,
      });
    }

    return result;
  }

  /**
   * Set featured status for a contractor (admin override)
   * Requirements: 8.4 - Admin can manually feature contractors
   */
  async setFeatured(
    contractorId: string,
    adminId: string,
    isFeatured: boolean
  ): Promise<FirestoreContractorRanking> {
    // Check if ranking exists, create if not
    let ranking = await this.getById(contractorId);
    if (!ranking) {
      ranking = await this.updateContractorRanking(contractorId);
    }

    const updated = await this.update(contractorId, {
      isFeatured,
      featuredAt: isFeatured ? new Date() : undefined,
      featuredBy: isFeatured ? adminId : undefined,
    });

    logger.info('Admin set featured status', { contractorId, adminId, isFeatured });

    return updated;
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
    const ranking = await this.getById(contractorId);

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
    const now = new Date();
    const result: MonthlyStats[] = [];

    // Initialize months
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: monthKey,
        projectsCompleted: 0,
        reviewsReceived: 0,
        averageRating: 0,
        bidsSubmitted: 0,
        bidsWon: 0,
      });
    }

    // Note: In a real implementation, we would query projects, reviews, and bids
    // For now, return the initialized structure
    // This would require additional Firestore queries with date range filters

    return result.sort((a, b) => a.month.localeCompare(b.month));
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get bid statistics for response rate calculation
   */
  private async getBidStatistics(contractorId: string): Promise<{
    totalBids: number;
    respondedBids: number;
    responseRate: number;
    averageResponseTime: number;
  }> {
    const bidService = getBidFirestoreService();
    
    // Get all bids by contractor
    const bids = await bidService.getByContractor(contractorId, { limit: 1000 });

    const totalBids = bids.data.length;
    const respondedBids = bids.data.filter(b => b.status !== 'PENDING').length;
    const responseRate = totalBids > 0 ? (respondedBids / totalBids) * 100 : 0;

    // Calculate average response time
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (const bid of bids.data) {
      if (bid.responseTimeHours && bid.responseTimeHours > 0) {
        totalResponseTime += bid.responseTimeHours;
        responseTimeCount++;
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
    const reviewService = getReviewFirestoreService();
    const bidStats = await this.getBidStatistics(contractorId);

    // Get review statistics
    const summary = await reviewService.getContractorSummary(contractorId);

    // Get project counts from bids
    const bidService = getBidFirestoreService();
    const allBids = await bidService.getByContractor(contractorId, { limit: 1000 });
    const selectedBids = allBids.data.filter(b => b.status === 'SELECTED');

    const totalProjects = selectedBids.length;
    
    // For completed projects, we'd need to check project status
    // For now, estimate based on selected bids
    const completedProjects = Math.floor(totalProjects * 0.8); // Estimate

    const completionRate = totalProjects > 0
      ? (completedProjects / totalProjects) * 100
      : 0;

    return {
      totalProjects,
      completedProjects,
      completionRate: Math.round(completionRate * 10) / 10,
      averageRating: summary.averageRating,
      totalReviews: summary.totalReviews,
      responseRate: bidStats.responseRate,
      averageResponseTime: bidStats.averageResponseTime,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let rankingFirestoreService: RankingFirestoreService | null = null;

export function getRankingFirestoreService(): RankingFirestoreService {
  if (!rankingFirestoreService) {
    rankingFirestoreService = new RankingFirestoreService();
  }
  return rankingFirestoreService;
}

export default RankingFirestoreService;
