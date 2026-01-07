/**
 * Review Service Tests
 *
 * Tests for review management business logic including creation,
 * one-review-per-project constraint, and project completion check.
 *
 * **Feature: api-test-coverage**
 * **Requirements: 5.1, 5.2**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ReviewCrudService } from './crud.service';
import { ReviewError } from './types';
import { createMockPrisma, type MockPrismaClient } from '../../test-utils/mock-prisma';
import { userFixtures, projectFixtures, reviewFixtures } from '../../test-utils/fixtures';
import { projectStatusGen } from '../../test-utils/generators';

// ============================================
// MOCK DEPENDENCIES
// ============================================

// Mock notification services to avoid side effects
vi.mock('../notification-channel.service', () => ({
  NotificationChannelService: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../scheduled-notification', () => ({
  ScheduledNotificationService: vi.fn().mockImplementation(() => ({
    cancelReviewReminders: vi.fn().mockResolvedValue(undefined),
  })),
}));

// ============================================
// REVIEW SERVICE TESTS
// ============================================

describe('ReviewCrudService', () => {
  let mockPrisma: MockPrismaClient;
  let service: ReviewCrudService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new ReviewCrudService(mockPrisma as unknown as import('@prisma/client').PrismaClient);
    vi.clearAllMocks();
  });

  // ============================================
  // REVIEW CREATION TESTS
  // ============================================

  describe('Review Creation', () => {
    describe('create', () => {
      it('should create a review for a completed project', async () => {
        const project = projectFixtures.completed();
        const homeowner = userFixtures.homeowner();
        const contractor = userFixtures.contractor();

        mockPrisma.project.findUnique.mockResolvedValue({
          ...project,
          selectedBid: { contractorId: contractor.id },
        });
        mockPrisma.review.findUnique.mockResolvedValue(null);
        mockPrisma.review.create.mockResolvedValue({
          id: 'review-1',
          projectId: project.id,
          reviewerId: homeowner.id,
          contractorId: contractor.id,
          rating: 5,
          comment: 'Great work!',
          images: null,
          qualityRating: 5,
          timelinessRating: 4,
          communicationRating: 5,
          valueRating: 4,
          response: null,
          respondedAt: null,
          isPublic: true,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          helpfulCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: project.id,
            code: project.code,
            title: project.title,
            status: project.status,
          },
          reviewer: {
            id: homeowner.id,
            name: homeowner.name,
          },
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
          },
        });
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.user.update.mockResolvedValue({ ...contractor, rating: 5 });
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(null);

        const result = await service.create(project.id, homeowner.id, {
          rating: 5,
          comment: 'Great work!',
          qualityRating: 5,
          timelinessRating: 4,
          communicationRating: 5,
          valueRating: 4,
        });

        expect(result.id).toBe('review-1');
        expect(result.rating).toBe(5);
        expect(result.comment).toBe('Great work!');
        expect(result.isPublic).toBe(true);
      });

      it('should throw PROJECT_NOT_FOUND when project does not exist', async () => {
        mockPrisma.project.findUnique.mockResolvedValue(null);

        await expect(
          service.create('non-existent-project', 'user-1', { rating: 5 })
        ).rejects.toThrow(ReviewError);

        await expect(
          service.create('non-existent-project', 'user-1', { rating: 5 })
        ).rejects.toMatchObject({
          code: 'PROJECT_NOT_FOUND',
          statusCode: 404,
        });
      });

      it('should throw NOT_PROJECT_OWNER when reviewer is not the owner', async () => {
        const project = projectFixtures.completed();

        mockPrisma.project.findUnique.mockResolvedValue({
          ...project,
          selectedBid: { contractorId: 'contractor-1' },
        });

        await expect(
          service.create(project.id, 'different-user', { rating: 5 })
        ).rejects.toThrow(ReviewError);

        await expect(
          service.create(project.id, 'different-user', { rating: 5 })
        ).rejects.toMatchObject({
          code: 'NOT_PROJECT_OWNER',
          statusCode: 403,
        });
      });

      it('should throw NO_SELECTED_BID when project has no selected contractor', async () => {
        const project = projectFixtures.completed();
        const homeowner = userFixtures.homeowner();

        mockPrisma.project.findUnique.mockResolvedValue({
          ...project,
          ownerId: homeowner.id,
          selectedBid: null,
        });

        await expect(
          service.create(project.id, homeowner.id, { rating: 5 })
        ).rejects.toThrow(ReviewError);

        await expect(
          service.create(project.id, homeowner.id, { rating: 5 })
        ).rejects.toMatchObject({
          code: 'NO_SELECTED_BID',
          statusCode: 400,
        });
      });
    });


    // ============================================
    // ONE-REVIEW-PER-PROJECT CONSTRAINT TESTS
    // ============================================

    /**
     * Unit test for one-review-per-project constraint
     * **Validates: Requirements 5.1**
     */
    describe('One-review-per-project constraint', () => {
      it('should reject duplicate review for the same project', async () => {
        const project = projectFixtures.completed();
        const homeowner = userFixtures.homeowner();
        const contractor = userFixtures.contractor();
        const existingReview = reviewFixtures.published();

        mockPrisma.project.findUnique.mockResolvedValue({
          ...project,
          ownerId: homeowner.id,
          selectedBid: { contractorId: contractor.id },
        });
        mockPrisma.review.findUnique.mockResolvedValue(existingReview);

        await expect(
          service.create(project.id, homeowner.id, { rating: 4 })
        ).rejects.toThrow(ReviewError);

        await expect(
          service.create(project.id, homeowner.id, { rating: 4 })
        ).rejects.toMatchObject({
          code: 'REVIEW_ALREADY_EXISTS',
          statusCode: 409,
        });
      });

      it('should allow review when no existing review exists', async () => {
        const project = projectFixtures.completed();
        const homeowner = userFixtures.homeowner();
        const contractor = userFixtures.contractor();

        mockPrisma.project.findUnique.mockResolvedValue({
          ...project,
          ownerId: homeowner.id,
          selectedBid: { contractorId: contractor.id },
        });
        mockPrisma.review.findUnique.mockResolvedValue(null);
        mockPrisma.review.create.mockResolvedValue({
          id: 'review-new',
          projectId: project.id,
          reviewerId: homeowner.id,
          contractorId: contractor.id,
          rating: 4,
          comment: null,
          images: null,
          qualityRating: null,
          timelinessRating: null,
          communicationRating: null,
          valueRating: null,
          response: null,
          respondedAt: null,
          isPublic: true,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          helpfulCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: project.id,
            code: project.code,
            title: project.title,
            status: project.status,
          },
          reviewer: {
            id: homeowner.id,
            name: homeowner.name,
          },
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
          },
        });
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.user.update.mockResolvedValue({ ...contractor, rating: 4 });
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(null);

        const result = await service.create(project.id, homeowner.id, { rating: 4 });

        expect(result.id).toBe('review-new');
        expect(result.rating).toBe(4);
      });

      it('should check for existing review with correct project and reviewer IDs', async () => {
        const project = projectFixtures.completed();
        const homeowner = userFixtures.homeowner();
        const contractor = userFixtures.contractor();

        mockPrisma.project.findUnique.mockResolvedValue({
          ...project,
          ownerId: homeowner.id,
          selectedBid: { contractorId: contractor.id },
        });
        mockPrisma.review.findUnique.mockResolvedValue(null);
        mockPrisma.review.create.mockResolvedValue({
          id: 'review-1',
          projectId: project.id,
          reviewerId: homeowner.id,
          contractorId: contractor.id,
          rating: 5,
          comment: null,
          images: null,
          qualityRating: null,
          timelinessRating: null,
          communicationRating: null,
          valueRating: null,
          response: null,
          respondedAt: null,
          isPublic: true,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          helpfulCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: project.id,
            code: project.code,
            title: project.title,
            status: project.status,
          },
          reviewer: {
            id: homeowner.id,
            name: homeowner.name,
          },
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
          },
        });
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.user.update.mockResolvedValue({ ...contractor, rating: 5 });
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(null);

        await service.create(project.id, homeowner.id, { rating: 5 });

        expect(mockPrisma.review.findUnique).toHaveBeenCalledWith({
          where: {
            projectId_reviewerId: {
              projectId: project.id,
              reviewerId: homeowner.id,
            },
          },
        });
      });
    });


    // ============================================
    // PROJECT COMPLETION CHECK TESTS
    // ============================================

    /**
     * **Feature: api-test-coverage, Property 14: Review project completion check**
     * **Validates: Requirements 5.2**
     */
    describe('Property 14: Review project completion check', () => {
      it('should reject review creation for any non-COMPLETED project status', async () => {
        // Property: For any project with status != COMPLETED, review creation is rejected
        const nonCompletedStatuses = [
          'DRAFT',
          'PENDING_APPROVAL',
          'REJECTED',
          'OPEN',
          'BIDDING_CLOSED',
          'MATCHED',
          'IN_PROGRESS',
          'CANCELLED',
        ];

        for (const status of nonCompletedStatuses) {
          // Reset mocks for each iteration
          mockPrisma.project.findUnique.mockReset();

          const project = {
            ...projectFixtures.completed(),
            status,
          };
          const homeowner = userFixtures.homeowner();

          mockPrisma.project.findUnique.mockResolvedValue({
            ...project,
            ownerId: homeowner.id,
            selectedBid: { contractorId: 'contractor-1' },
          });

          await expect(
            service.create(project.id, homeowner.id, { rating: 5 })
          ).rejects.toMatchObject({
            code: 'PROJECT_NOT_COMPLETED',
            statusCode: 400,
          });
        }
      });

      it('should accept review creation only for COMPLETED project status', async () => {
        const project = projectFixtures.completed();
        const homeowner = userFixtures.homeowner();
        const contractor = userFixtures.contractor();

        mockPrisma.project.findUnique.mockResolvedValue({
          ...project,
          status: 'COMPLETED',
          ownerId: homeowner.id,
          selectedBid: { contractorId: contractor.id },
        });
        mockPrisma.review.findUnique.mockResolvedValue(null);
        mockPrisma.review.create.mockResolvedValue({
          id: 'review-1',
          projectId: project.id,
          reviewerId: homeowner.id,
          contractorId: contractor.id,
          rating: 5,
          comment: null,
          images: null,
          qualityRating: null,
          timelinessRating: null,
          communicationRating: null,
          valueRating: null,
          response: null,
          respondedAt: null,
          isPublic: true,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          helpfulCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: project.id,
            code: project.code,
            title: project.title,
            status: 'COMPLETED',
          },
          reviewer: {
            id: homeowner.id,
            name: homeowner.name,
          },
          contractor: {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
          },
        });
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.user.update.mockResolvedValue({ ...contractor, rating: 5 });
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(null);

        const result = await service.create(project.id, homeowner.id, { rating: 5 });

        expect(result.id).toBe('review-1');
        expect(result.project.status).toBe('COMPLETED');
      });

      it('should verify project status check using property-based testing', async () => {
        // Property: For any randomly generated non-COMPLETED status, review creation fails
        await fc.assert(
          fc.asyncProperty(
            projectStatusGen.filter((status) => status !== 'COMPLETED'),
            async (status) => {
              // Reset mocks for each iteration
              mockPrisma.project.findUnique.mockReset();

              const project = {
                ...projectFixtures.completed(),
                status,
              };
              const homeowner = userFixtures.homeowner();

              mockPrisma.project.findUnique.mockResolvedValue({
                ...project,
                ownerId: homeowner.id,
                selectedBid: { contractorId: 'contractor-1' },
              });

              try {
                await service.create(project.id, homeowner.id, { rating: 5 });
                // Should not reach here
                return false;
              } catch (error) {
                if (error instanceof ReviewError) {
                  return error.code === 'PROJECT_NOT_COMPLETED' && error.statusCode === 400;
                }
                return false;
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });


  // ============================================
  // REVIEW UPDATE TESTS
  // ============================================

  describe('Review Update', () => {
    describe('update', () => {
      it('should update review within 7-day window', async () => {
        const review = {
          ...reviewFixtures.published(),
          createdAt: new Date(), // Created now, within window
        };

        mockPrisma.review.findUnique.mockResolvedValue(review);
        mockPrisma.review.update.mockResolvedValue({
          ...review,
          comment: 'Updated comment',
          updatedAt: new Date(),
          project: {
            id: review.projectId,
            code: 'PRJ-2024-001',
            title: 'Test Project',
            status: 'COMPLETED',
          },
          reviewer: {
            id: review.reviewerId,
            name: 'Homeowner User',
          },
          contractor: {
            id: review.contractorId,
            name: 'Contractor User',
            email: 'contractor@test.com',
            phone: '0901234569',
          },
        });
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.user.update.mockResolvedValue({ id: review.contractorId, rating: 5 });
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(null);

        const result = await service.update(review.id, review.reviewerId, {
          comment: 'Updated comment',
        });

        expect(result.comment).toBe('Updated comment');
      });

      it('should reject update after 7-day window', async () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

        const review = {
          ...reviewFixtures.published(),
          createdAt: oldDate,
        };

        mockPrisma.review.findUnique.mockResolvedValue(review);

        await expect(
          service.update(review.id, review.reviewerId, { comment: 'Updated' })
        ).rejects.toMatchObject({
          code: 'REVIEW_UPDATE_EXPIRED',
          statusCode: 400,
        });
      });

      it('should throw REVIEW_NOT_FOUND when review does not exist', async () => {
        mockPrisma.review.findUnique.mockResolvedValue(null);

        await expect(
          service.update('non-existent', 'user-1', { comment: 'Updated' })
        ).rejects.toMatchObject({
          code: 'REVIEW_NOT_FOUND',
          statusCode: 404,
        });
      });

      it('should throw REVIEW_ACCESS_DENIED when user is not the reviewer', async () => {
        const review = reviewFixtures.published();

        mockPrisma.review.findUnique.mockResolvedValue(review);

        await expect(
          service.update(review.id, 'different-user', { comment: 'Updated' })
        ).rejects.toMatchObject({
          code: 'REVIEW_ACCESS_DENIED',
          statusCode: 403,
        });
      });

      it('should throw REVIEW_DELETED when review is already deleted', async () => {
        const review = {
          ...reviewFixtures.published(),
          isDeleted: true,
          deletedAt: new Date(),
        };

        mockPrisma.review.findUnique.mockResolvedValue(review);

        await expect(
          service.update(review.id, review.reviewerId, { comment: 'Updated' })
        ).rejects.toMatchObject({
          code: 'REVIEW_DELETED',
          statusCode: 400,
        });
      });
    });
  });

  // ============================================
  // REVIEW DELETE TESTS
  // ============================================

  describe('Review Delete', () => {
    describe('delete (soft delete)', () => {
      it('should soft delete a review', async () => {
        const review = reviewFixtures.published();

        mockPrisma.review.findUnique.mockResolvedValue(review);
        mockPrisma.review.update.mockResolvedValue({
          ...review,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: review.reviewerId,
        });
        mockPrisma.review.findMany.mockResolvedValue([]);
        mockPrisma.user.update.mockResolvedValue({ id: review.contractorId, rating: 0 });
        mockPrisma.contractorRanking.findUnique.mockResolvedValue(null);

        await service.delete(review.id, review.reviewerId);

        expect(mockPrisma.review.update).toHaveBeenCalledWith({
          where: { id: review.id },
          data: {
            isDeleted: true,
            deletedAt: expect.any(Date),
            deletedBy: review.reviewerId,
          },
        });
      });

      it('should throw REVIEW_NOT_FOUND when review does not exist', async () => {
        mockPrisma.review.findUnique.mockResolvedValue(null);

        await expect(
          service.delete('non-existent', 'user-1')
        ).rejects.toMatchObject({
          code: 'REVIEW_NOT_FOUND',
          statusCode: 404,
        });
      });

      it('should throw REVIEW_ACCESS_DENIED when user is not the reviewer', async () => {
        const review = reviewFixtures.published();

        mockPrisma.review.findUnique.mockResolvedValue(review);

        await expect(
          service.delete(review.id, 'different-user')
        ).rejects.toMatchObject({
          code: 'REVIEW_ACCESS_DENIED',
          statusCode: 403,
        });
      });

      it('should throw REVIEW_ALREADY_DELETED when review is already deleted', async () => {
        const review = {
          ...reviewFixtures.published(),
          isDeleted: true,
          deletedAt: new Date(),
        };

        mockPrisma.review.findUnique.mockResolvedValue(review);

        await expect(
          service.delete(review.id, review.reviewerId)
        ).rejects.toMatchObject({
          code: 'REVIEW_ALREADY_DELETED',
          statusCode: 400,
        });
      });
    });
  });

  // ============================================
  // REVIEW GET TESTS
  // ============================================

  describe('Review Get', () => {
    describe('getById', () => {
      it('should return review when found', async () => {
        const review = {
          ...reviewFixtures.published(),
          images: null,
          project: {
            id: 'project-completed-1',
            code: 'PRJ-2024-006',
            title: 'Completed Project',
            status: 'COMPLETED',
          },
          reviewer: {
            id: 'user-homeowner-1',
            name: 'Homeowner User',
          },
          contractor: {
            id: 'user-contractor-1',
            name: 'Contractor User',
            email: 'contractor@test.com',
            phone: '0901234569',
          },
        };

        mockPrisma.review.findUnique.mockResolvedValue(review);

        const result = await service.getById(review.id);

        expect(result).not.toBeNull();
        if (result) {
          expect(result.id).toBe(review.id);
          expect(result.rating).toBe(review.rating);
        }
      });

      it('should return null when review not found', async () => {
        mockPrisma.review.findUnique.mockResolvedValue(null);

        const result = await service.getById('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('getByIdForHomeowner', () => {
      it('should return review when user is the reviewer', async () => {
        const review = {
          ...reviewFixtures.published(),
          images: null,
          project: {
            id: 'project-completed-1',
            code: 'PRJ-2024-006',
            title: 'Completed Project',
            status: 'COMPLETED',
          },
          reviewer: {
            id: 'user-homeowner-1',
            name: 'Homeowner User',
          },
          contractor: {
            id: 'user-contractor-1',
            name: 'Contractor User',
            email: 'contractor@test.com',
            phone: '0901234569',
          },
        };

        mockPrisma.review.findUnique.mockResolvedValue(review);

        const result = await service.getByIdForHomeowner(review.id, review.reviewerId);

        expect(result).not.toBeNull();
        if (result) {
          expect(result.id).toBe(review.id);
        }
      });

      it('should throw REVIEW_ACCESS_DENIED when user is not the reviewer', async () => {
        const review = {
          ...reviewFixtures.published(),
          images: null,
          project: {
            id: 'project-completed-1',
            code: 'PRJ-2024-006',
            title: 'Completed Project',
            status: 'COMPLETED',
          },
          reviewer: {
            id: 'user-homeowner-1',
            name: 'Homeowner User',
          },
          contractor: {
            id: 'user-contractor-1',
            name: 'Contractor User',
            email: 'contractor@test.com',
            phone: '0901234569',
          },
        };

        mockPrisma.review.findUnique.mockResolvedValue(review);

        await expect(
          service.getByIdForHomeowner(review.id, 'different-user')
        ).rejects.toMatchObject({
          code: 'REVIEW_ACCESS_DENIED',
          statusCode: 403,
        });
      });
    });
  });

  // ============================================
  // REVIEW ERROR TESTS
  // ============================================

  describe('ReviewError', () => {
    it('should create error with correct code and message', () => {
      const error = new ReviewError('REVIEW_NOT_FOUND', 'Review not found');

      expect(error.code).toBe('REVIEW_NOT_FOUND');
      expect(error.message).toBe('Review not found');
      expect(error.statusCode).toBe(404);
    });

    it('should map PROJECT_NOT_COMPLETED to 400', () => {
      const error = new ReviewError('PROJECT_NOT_COMPLETED', 'Project not completed');

      expect(error.statusCode).toBe(400);
    });

    it('should map REVIEW_ALREADY_EXISTS to 409', () => {
      const error = new ReviewError('REVIEW_ALREADY_EXISTS', 'Review already exists');

      expect(error.statusCode).toBe(409);
    });

    it('should allow custom status code override', () => {
      const error = new ReviewError('CUSTOM_ERROR', 'Custom error', 418);

      expect(error.statusCode).toBe(418);
    });
  });

  // ============================================
  // REVIEW FIXTURES TESTS
  // ============================================

  describe('Review Fixtures', () => {
    it('should create valid published review fixture', () => {
      const review = reviewFixtures.published();

      expect(review.id).toBeDefined();
      expect(review.projectId).toBeDefined();
      expect(review.reviewerId).toBeDefined();
      expect(review.contractorId).toBeDefined();
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
      expect(review.isPublic).toBe(true);
      expect(review.isDeleted).toBe(false);
    });

    it('should create valid review with response fixture', () => {
      const review = reviewFixtures.withResponse();

      expect(review.response).toBeDefined();
      expect(review.respondedAt).toBeDefined();
      expect(review.respondedAt).toBeInstanceOf(Date);
    });

    it('should allow overriding fixture properties', () => {
      const customRating = 3;
      const customComment = 'Custom comment';

      const review = reviewFixtures.published({
        rating: customRating,
        comment: customComment,
      });

      expect(review.rating).toBe(customRating);
      expect(review.comment).toBe(customComment);
      expect(review.isPublic).toBe(true); // Default preserved
    });
  });
});
