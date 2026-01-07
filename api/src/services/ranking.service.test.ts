/**
 * Ranking Service Tests
 *
 * Tests for contractor ranking management including score calculation,
 * ranking queries, featured contractors, and statistics.
 *
 * **Feature: api-test-coverage**
 * **Requirements: 5.3, 5.4**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RankingService, RankingError } from './ranking.service';
import { createMockPrisma, type MockPrismaClient } from '../test-utils/mock-prisma';
import { userFixtures, rankingFixtures } from '../test-utils/fixtures';

// ============================================
// RANKING SERVICE TESTS
// ============================================

describe('RankingService', () => {
  let mockPrisma: MockPrismaClient;
  let service: RankingService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new RankingService(mockPrisma as unknown as import('@prisma/client').PrismaClient);
    vi.clearAllMocks();
  });

  // ============================================
  // SCORE CALCULATION TESTS
  // ============================================

  describe('Score Calculation', () => {
    describe('calculateScore', () => {
      it('should calculate score for a verified contractor', async () => {
        const contractor = {
          ...userFixtures.contractor(),
          rating: 4.5,
          totalProjects: 10,
          verificationStatus: 'VERIFIED',
        };

        mockPrisma.user.findUnique.mockResolvedValue(contractor);
        mockPrisma.bid.findMany.mockResolvedValue([]);

        const result = await service.calculateScore(contractor.id);

        expect(result).toHaveProperty('ratingScore');
        expect(result).toHaveProperty('projectsScore');
        expect(result).toHaveProperty('responseScore');
        expect(result).toHaveProperty('verificationScore');
        expect(result).toHaveProperty('totalScore');
        expect(result.verificationScore).toBe(100); // VERIFIED = 100
      });

      it('should calculate score for a pending contractor', async () => {
        const contractor = {
          ...userFixtures.contractor(),
          rating: 3.0,
          totalProjects: 5,
          verificationStatus: 'PENDING',
        };

        mockPrisma.user.findUnique.mockResolvedValue(contractor);
        mockPrisma.bid.findMany.mockResolvedValue([]);

        const result = await service.calculateScore(contractor.id);

        expect(result.verificationScore).toBe(50); // PENDING = 50
      });

      it('should calculate score for a rejected contractor', async () => {
        const contractor = {
          ...userFixtures.contractor(),
          rating: 2.0,
          totalProjects: 2,
          verificationStatus: 'REJECTED',
        };

        mockPrisma.user.findUnique.mockResolvedValue(contractor);
        mockPrisma.bid.findMany.mockResolvedValue([]);

        const result = await service.calculateScore(contractor.id);

        expect(result.verificationScore).toBe(0); // REJECTED = 0
      });

      it('should throw CONTRACTOR_NOT_FOUND when contractor does not exist', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          service.calculateScore('non-existent')
        ).rejects.toThrow(RankingError);

        await expect(
          service.calculateScore('non-existent')
        ).rejects.toMatchObject({
          code: 'CONTRACTOR_NOT_FOUND',
          statusCode: 404,
        });
      });

      it('should calculate rating score based on 0-5 scale', async () => {
        const contractor = {
          ...userFixtures.contractor(),
          rating: 5.0,
          totalProjects: 0,
          verificationStatus: 'VERIFIED',
        };

        mockPrisma.user.findUnique.mockResolvedValue(contractor);
        mockPrisma.bid.findMany.mockResolvedValue([]);

        const result = await service.calculateScore(contractor.id);

        // Rating 5/5 = 100%
        expect(result.ratingScore).toBe(100);
      });

      it('should calculate projects score with logarithmic scale', async () => {
        const contractor = {
          ...userFixtures.contractor(),
          rating: 0,
          totalProjects: 50,
          verificationStatus: 'VERIFIED',
        };

        mockPrisma.user.findUnique.mockResolvedValue(contractor);
        mockPrisma.bid.findMany.mockResolvedValue([]);

        const result = await service.calculateScore(contractor.id);

        // 50 projects should give close to max score
        expect(result.projectsScore).toBeGreaterThan(90);
      });
    });

    describe('updateContractorRanking', () => {
      it('should create ranking if not exists', async () => {
        const contractor = {
          ...userFixtures.contractor(),
          rating: 4.0,
          totalProjects: 5,
          verificationStatus: 'VERIFIED',
        };

        mockPrisma.user.findUnique.mockResolvedValue(contractor);
        mockPrisma.bid.findMany.mockResolvedValue([]);
        mockPrisma.project.count.mockResolvedValue(5);
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(null);
        mockPrisma.contractorRanking.upsert.mockResolvedValue({
          ...rankingFixtures.topRanked(),
          contractorId: contractor.id,
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
            companyName: null,
            verificationStatus: 'VERIFIED',
            rating: 4.0,
            totalProjects: 5,
          },
        });

        const result = await service.updateContractorRanking(contractor.id);

        expect(result.contractorId).toBe(contractor.id);
        expect(mockPrisma.contractorRanking.upsert).toHaveBeenCalled();
      });

      it('should update existing ranking with previousRank', async () => {
        const contractor = {
          ...userFixtures.contractor(),
          rating: 4.5,
          totalProjects: 10,
          verificationStatus: 'VERIFIED',
        };
        const existingRanking = rankingFixtures.topRanked();

        mockPrisma.user.findUnique.mockResolvedValue(contractor);
        mockPrisma.bid.findMany.mockResolvedValue([]);
        mockPrisma.project.count.mockResolvedValue(10);
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(existingRanking);
        mockPrisma.contractorRanking.upsert.mockResolvedValue({
          ...existingRanking,
          previousRank: existingRanking.rank,
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
            companyName: null,
            verificationStatus: 'VERIFIED',
            rating: 4.5,
            totalProjects: 10,
          },
        });

        const result = await service.updateContractorRanking(contractor.id);

        expect(result.previousRank).toBe(existingRanking.rank);
      });
    });
  });

  // ============================================
  // RANKING QUERIES TESTS
  // ============================================

  describe('Ranking Queries', () => {
    describe('getRanking', () => {
      it('should return paginated rankings', async () => {
        const rankings = [
          {
            ...rankingFixtures.topRanked(),
            contractor: {
              id: 'contractor-1',
              name: 'Top Contractor',
              email: 'top@test.com',
              phone: '0901234567',
              companyName: null,
              verificationStatus: 'VERIFIED',
              rating: 4.5,
              totalProjects: 15,
            },
          },
          {
            ...rankingFixtures.midRanked(),
            contractor: {
              id: 'contractor-2',
              name: 'Mid Contractor',
              email: 'mid@test.com',
              phone: '0901234568',
              companyName: null,
              verificationStatus: 'VERIFIED',
              rating: 3.5,
              totalProjects: 8,
            },
          },
        ];

        mockPrisma.contractorRanking.findMany.mockResolvedValue(rankings);
        mockPrisma.contractorRanking.count.mockResolvedValue(2);

        const result = await service.getRanking({
          page: 1,
          limit: 20,
          sortBy: 'totalScore',
          sortOrder: 'desc',
        });

        expect(result.data).toHaveLength(2);
        expect(result.meta.total).toBe(2);
        expect(result.meta.page).toBe(1);
        expect(result.meta.limit).toBe(20);
      });

      it('should filter by isFeatured', async () => {
        const featuredRanking = {
          ...rankingFixtures.topRanked(),
          isFeatured: true,
          contractor: {
            id: 'contractor-1',
            name: 'Featured Contractor',
            email: 'featured@test.com',
            phone: '0901234567',
            companyName: null,
            verificationStatus: 'VERIFIED',
            rating: 4.5,
            totalProjects: 15,
          },
        };

        mockPrisma.contractorRanking.findMany.mockResolvedValue([featuredRanking]);
        mockPrisma.contractorRanking.count.mockResolvedValue(1);

        const result = await service.getRanking({
          page: 1,
          limit: 20,
          sortBy: 'totalScore',
          sortOrder: 'desc',
          isFeatured: true,
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].isFeatured).toBe(true);
      });

      it('should filter by minRating', async () => {
        mockPrisma.contractorRanking.findMany.mockResolvedValue([]);
        mockPrisma.contractorRanking.count.mockResolvedValue(0);

        await service.getRanking({
          page: 1,
          limit: 20,
          sortBy: 'totalScore',
          sortOrder: 'desc',
          minRating: 4.0,
        });

        expect(mockPrisma.contractorRanking.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              averageRating: { gte: 4.0 },
            }),
          })
        );
      });

      it('should filter by responseTimeRange FAST', async () => {
        mockPrisma.contractorRanking.findMany.mockResolvedValue([]);
        mockPrisma.contractorRanking.count.mockResolvedValue(0);

        await service.getRanking({
          page: 1,
          limit: 20,
          sortBy: 'totalScore',
          sortOrder: 'desc',
          responseTimeRange: 'FAST',
        });

        expect(mockPrisma.contractorRanking.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              averageResponseTime: { gt: 0, lte: 2 },
            }),
          })
        );
      });

      it('should filter by responseTimeRange NORMAL', async () => {
        mockPrisma.contractorRanking.findMany.mockResolvedValue([]);
        mockPrisma.contractorRanking.count.mockResolvedValue(0);

        await service.getRanking({
          page: 1,
          limit: 20,
          sortBy: 'totalScore',
          sortOrder: 'desc',
          responseTimeRange: 'NORMAL',
        });

        expect(mockPrisma.contractorRanking.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              averageResponseTime: { gt: 2, lte: 24 },
            }),
          })
        );
      });

      it('should filter by responseTimeRange SLOW', async () => {
        mockPrisma.contractorRanking.findMany.mockResolvedValue([]);
        mockPrisma.contractorRanking.count.mockResolvedValue(0);

        await service.getRanking({
          page: 1,
          limit: 20,
          sortBy: 'totalScore',
          sortOrder: 'desc',
          responseTimeRange: 'SLOW',
        });

        expect(mockPrisma.contractorRanking.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              averageResponseTime: { gt: 24 },
            }),
          })
        );
      });
    });

    describe('getContractorRank', () => {
      it('should return contractor ranking when found', async () => {
        const contractorId = 'user-contractor-1';
        const ranking = {
          ...rankingFixtures.topRanked(),
          contractorId,
          contractor: {
            id: contractorId,
            name: 'Top Contractor',
            email: 'top@test.com',
            phone: '0901234567',
            companyName: null,
            verificationStatus: 'VERIFIED',
            rating: 4.5,
            totalProjects: 15,
          },
        };

        mockPrisma.contractorRanking.findUnique.mockResolvedValue(ranking);

        const result = await service.getContractorRank(contractorId);

        expect(result).not.toBeNull();
        expect(result?.contractorId).toBe(contractorId);
        expect(result?.rank).toBe(1);
      });

      it('should return null when ranking not found', async () => {
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(null);

        const result = await service.getContractorRank('non-existent');

        expect(result).toBeNull();
      });
    });
  });

  // ============================================
  // FEATURED CONTRACTORS TESTS
  // ============================================

  describe('Featured Contractors', () => {
    describe('getFeaturedContractors', () => {
      it('should return featured contractors', async () => {
        const featuredRankings = [
          {
            ...rankingFixtures.topRanked(),
            isFeatured: true,
            contractor: {
              id: 'contractor-1',
              name: 'Featured Contractor 1',
              email: 'featured1@test.com',
              phone: '0901234567',
              companyName: null,
              verificationStatus: 'VERIFIED',
              rating: 4.5,
              totalProjects: 15,
            },
          },
        ];

        mockPrisma.contractorRanking.findMany.mockResolvedValue(featuredRankings);

        const result = await service.getFeaturedContractors({ limit: 10 });

        expect(result).toHaveLength(1);
        expect(result[0].isFeatured).toBe(true);
      });

      it('should respect limit parameter', async () => {
        mockPrisma.contractorRanking.findMany.mockResolvedValue([]);

        await service.getFeaturedContractors({ limit: 5 });

        expect(mockPrisma.contractorRanking.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 5,
          })
        );
      });

      it('should filter by regionId when provided', async () => {
        mockPrisma.contractorRanking.findMany.mockResolvedValue([]);

        await service.getFeaturedContractors({ limit: 10, regionId: 'region-1' });

        expect(mockPrisma.contractorRanking.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              contractor: expect.objectContaining({
                contractorProfile: {
                  serviceAreas: { contains: 'region-1' },
                },
              }),
            }),
          })
        );
      });
    });

    describe('setFeatured', () => {
      it('should set featured status for contractor', async () => {
        const contractor = userFixtures.contractor();
        const ranking = {
          ...rankingFixtures.topRanked(),
          contractorId: contractor.id,
          isFeatured: false,
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
            companyName: null,
            verificationStatus: 'VERIFIED',
            rating: 4.5,
            totalProjects: 15,
          },
        };

        mockPrisma.contractorRanking.findUnique.mockResolvedValue(ranking);
        mockPrisma.contractorRanking.update.mockResolvedValue({
          ...ranking,
          isFeatured: true,
          featuredAt: new Date(),
          featuredBy: 'admin-1',
        });

        const result = await service.setFeatured(contractor.id, 'admin-1', true);

        expect(result.isFeatured).toBe(true);
        expect(result.featuredBy).toBe('admin-1');
      });

      it('should create ranking if not exists before setting featured', async () => {
        const contractor = {
          ...userFixtures.contractor(),
          rating: 4.0,
          totalProjects: 5,
          verificationStatus: 'VERIFIED',
        };

        // First findUnique returns null (no ranking exists)
        mockPrisma.contractorRanking.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);
        
        // Setup for updateContractorRanking
        mockPrisma.user.findUnique.mockResolvedValue(contractor);
        mockPrisma.bid.findMany.mockResolvedValue([]);
        mockPrisma.project.count.mockResolvedValue(5);
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.contractorRanking.upsert.mockResolvedValue({
          ...rankingFixtures.topRanked(),
          contractorId: contractor.id,
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
            companyName: null,
            verificationStatus: 'VERIFIED',
            rating: 4.0,
            totalProjects: 5,
          },
        });
        mockPrisma.contractorRanking.update.mockResolvedValue({
          ...rankingFixtures.topRanked(),
          contractorId: contractor.id,
          isFeatured: true,
          featuredAt: new Date(),
          featuredBy: 'admin-1',
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
            companyName: null,
            verificationStatus: 'VERIFIED',
            rating: 4.0,
            totalProjects: 5,
          },
        });

        const result = await service.setFeatured(contractor.id, 'admin-1', true);

        expect(result.isFeatured).toBe(true);
        expect(mockPrisma.contractorRanking.upsert).toHaveBeenCalled();
      });

      it('should remove featured status', async () => {
        const contractor = userFixtures.contractor();
        const ranking = {
          ...rankingFixtures.topRanked(),
          contractorId: contractor.id,
          isFeatured: true,
          featuredAt: new Date(),
          featuredBy: 'admin-1',
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
            companyName: null,
            verificationStatus: 'VERIFIED',
            rating: 4.5,
            totalProjects: 15,
          },
        };

        mockPrisma.contractorRanking.findUnique.mockResolvedValue(ranking);
        mockPrisma.contractorRanking.update.mockResolvedValue({
          ...ranking,
          isFeatured: false,
          featuredAt: null,
          featuredBy: null,
        });

        const result = await service.setFeatured(contractor.id, 'admin-1', false);

        expect(result.isFeatured).toBe(false);
        expect(result.featuredAt).toBeNull();
        expect(result.featuredBy).toBeNull();
      });
    });
  });

  // ============================================
  // STATISTICS TESTS
  // ============================================

  describe('Statistics', () => {
    describe('getContractorStats', () => {
      it('should return contractor statistics', async () => {
        const contractor = userFixtures.contractor();

        mockPrisma.project.count
          .mockResolvedValueOnce(10) // totalProjects
          .mockResolvedValueOnce(8);  // completedProjects
        mockPrisma.review.findMany.mockResolvedValue([
          { rating: 5 },
          { rating: 4 },
          { rating: 5 },
        ]);
        mockPrisma.bid.findMany.mockResolvedValue([
          { id: 'bid-1', status: 'APPROVED', createdAt: new Date(), responseTimeHours: 12, project: { publishedAt: new Date() } },
          { id: 'bid-2', status: 'SELECTED', createdAt: new Date(), responseTimeHours: 24, project: { publishedAt: new Date() } },
        ]);
        mockPrisma.contractorRanking.findUnique.mockResolvedValue({
          rank: 5,
          totalScore: 75,
        });

        const result = await service.getContractorStats(contractor.id);

        expect(result).toHaveProperty('totalProjects');
        expect(result).toHaveProperty('completedProjects');
        expect(result).toHaveProperty('completionRate');
        expect(result).toHaveProperty('averageRating');
        expect(result).toHaveProperty('totalReviews');
        expect(result).toHaveProperty('responseRate');
        expect(result).toHaveProperty('averageResponseTime');
        expect(result).toHaveProperty('rank');
        expect(result).toHaveProperty('totalScore');
      });

      it('should return null rank when no ranking exists', async () => {
        const contractor = userFixtures.contractor();

        mockPrisma.project.count.mockResolvedValue(0);
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.bid.findMany.mockResolvedValue([]);
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(null);

        const result = await service.getContractorStats(contractor.id);

        expect(result.rank).toBeNull();
        expect(result.totalScore).toBeNull();
      });
    });

    describe('getMonthlyStats', () => {
      it('should return monthly statistics for specified months', async () => {
        const contractor = userFixtures.contractor();

        mockPrisma.project.findMany.mockResolvedValue([]);
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.bid.findMany
          .mockResolvedValueOnce([]) // bidsSubmitted
          .mockResolvedValueOnce([]); // bidsWon

        const result = await service.getMonthlyStats(contractor.id, 6);

        expect(result).toHaveLength(6);
        result.forEach((month) => {
          expect(month).toHaveProperty('month');
          expect(month).toHaveProperty('projectsCompleted');
          expect(month).toHaveProperty('reviewsReceived');
          expect(month).toHaveProperty('averageRating');
          expect(month).toHaveProperty('bidsSubmitted');
          expect(month).toHaveProperty('bidsWon');
        });
      });

      it('should aggregate data by month correctly', async () => {
        const contractor = userFixtures.contractor();
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        mockPrisma.project.findMany.mockResolvedValue([
          { updatedAt: now },
          { updatedAt: now },
        ]);
        mockPrisma.review.findMany.mockResolvedValue([
          { rating: 5, createdAt: now },
          { rating: 4, createdAt: now },
        ]);
        mockPrisma.bid.findMany
          .mockResolvedValueOnce([
            { createdAt: now },
            { createdAt: now },
            { createdAt: now },
          ])
          .mockResolvedValueOnce([
            { updatedAt: now },
          ]);

        const result = await service.getMonthlyStats(contractor.id, 6);

        const currentMonthStats = result.find((m) => m.month === currentMonth);
        expect(currentMonthStats).toBeDefined();
        expect(currentMonthStats?.projectsCompleted).toBe(2);
        expect(currentMonthStats?.reviewsReceived).toBe(2);
        expect(currentMonthStats?.averageRating).toBe(4.5);
        expect(currentMonthStats?.bidsSubmitted).toBe(3);
        expect(currentMonthStats?.bidsWon).toBe(1);
      });
    });
  });

  // ============================================
  // RANKING ERROR TESTS
  // ============================================

  describe('RankingError', () => {
    it('should create error with correct code and message', () => {
      const error = new RankingError('CONTRACTOR_NOT_FOUND', 'Contractor not found');

      expect(error.code).toBe('CONTRACTOR_NOT_FOUND');
      expect(error.message).toBe('Contractor not found');
      expect(error.statusCode).toBe(404);
    });

    it('should map RANKING_NOT_FOUND to 404', () => {
      const error = new RankingError('RANKING_NOT_FOUND', 'Ranking not found');

      expect(error.statusCode).toBe(404);
    });

    it('should map INVALID_CONTRACTOR to 400', () => {
      const error = new RankingError('INVALID_CONTRACTOR', 'Invalid contractor');

      expect(error.statusCode).toBe(400);
    });

    it('should allow custom status code override', () => {
      const error = new RankingError('CUSTOM_ERROR', 'Custom error', 418);

      expect(error.statusCode).toBe(418);
    });
  });

  // ============================================
  // RANKING FIXTURES TESTS
  // ============================================

  describe('Ranking Fixtures', () => {
    it('should create valid top ranked fixture', () => {
      const ranking = rankingFixtures.topRanked();

      expect(ranking.id).toBeDefined();
      expect(ranking.contractorId).toBeDefined();
      expect(ranking.rank).toBe(1);
      expect(ranking.isFeatured).toBe(true);
      expect(ranking.totalScore).toBeGreaterThan(0);
    });

    it('should create valid mid ranked fixture', () => {
      const ranking = rankingFixtures.midRanked();

      expect(ranking.id).toBeDefined();
      expect(ranking.contractorId).toBeDefined();
      expect(ranking.rank).toBe(5);
      expect(ranking.isFeatured).toBe(false);
    });

    it('should allow overriding fixture properties', () => {
      const customRank = 10;
      const customScore = 50;

      const ranking = rankingFixtures.topRanked({
        rank: customRank,
        totalScore: customScore,
      });

      expect(ranking.rank).toBe(customRank);
      expect(ranking.totalScore).toBe(customScore);
    });
  });

  // ============================================
  // PROPERTY-BASED TESTS PLACEHOLDER
  // ============================================

  describe('Properties', () => {
    /**
     * Placeholder for Property 15: Ranking score calculation
     * **Validates: Requirements 5.3**
     * Will be implemented in task 11.2
     */
    describe('Property 15: Ranking score calculation', () => {
      it.todo('should calculate score using weighted formula');
    });

    /**
     * Placeholder for Property 16: Ranking ordering
     * **Validates: Requirements 5.4**
     * Will be implemented in task 11.3
     */
    describe('Property 16: Ranking ordering', () => {
      it.todo('should order rankings by totalScore descending');
    });
  });
});
