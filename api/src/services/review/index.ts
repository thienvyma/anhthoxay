/**
 * Review Service Module
 *
 * Barrel export for review services. Provides backward compatible
 * ReviewService class that composes all sub-services.
 *
 * **Feature: bidding-phase5-review**
 */

import { PrismaClient } from '@prisma/client';
import { ReviewCrudService } from './crud.service';
import { ReviewStatsService } from './stats.service';
import { ReviewResponseService } from './response.service';
import { ReviewHelpfulnessService } from './helpfulness.service';

// Re-export all types
export * from './types';

// Re-export individual services
export { ReviewCrudService } from './crud.service';
export { ReviewStatsService } from './stats.service';
export { ReviewResponseService } from './response.service';
export { ReviewHelpfulnessService } from './helpfulness.service';

// ============================================
// BACKWARD COMPATIBLE REVIEW SERVICE
// ============================================

/**
 * ReviewService - Backward compatible class that composes all review sub-services
 *
 * This class maintains the same interface as the original ReviewService
 * while delegating to the new focused service modules.
 */
export class ReviewService {
  private crudService: ReviewCrudService;
  private statsService: ReviewStatsService;
  private responseService: ReviewResponseService;
  private helpfulnessService: ReviewHelpfulnessService;

  constructor(prisma: PrismaClient) {
    this.crudService = new ReviewCrudService(prisma);
    this.statsService = new ReviewStatsService(prisma);
    this.responseService = new ReviewResponseService(prisma);
    this.helpfulnessService = new ReviewHelpfulnessService(prisma);
  }

  // ============================================
  // CRUD METHODS
  // ============================================

  create(
    projectId: string,
    reviewerId: string,
    data: Parameters<ReviewCrudService['create']>[2]
  ) {
    return this.crudService.create(projectId, reviewerId, data);
  }

  update(
    reviewId: string,
    reviewerId: string,
    data: Parameters<ReviewCrudService['update']>[2]
  ) {
    return this.crudService.update(reviewId, reviewerId, data);
  }

  delete(reviewId: string, reviewerId: string) {
    return this.crudService.delete(reviewId, reviewerId);
  }

  getById(reviewId: string) {
    return this.crudService.getById(reviewId);
  }

  getByIdForHomeowner(reviewId: string, reviewerId: string) {
    return this.crudService.getByIdForHomeowner(reviewId, reviewerId);
  }

  listByContractor(
    contractorId: string,
    query: Parameters<ReviewCrudService['listByContractor']>[1]
  ) {
    return this.crudService.listByContractor(contractorId, query);
  }

  listByReviewer(
    reviewerId: string,
    query: Parameters<ReviewCrudService['listByReviewer']>[1]
  ) {
    return this.crudService.listByReviewer(reviewerId, query);
  }

  listAdmin(query: Parameters<ReviewCrudService['listAdmin']>[0]) {
    return this.crudService.listAdmin(query);
  }

  hide(reviewId: string, adminId: string) {
    return this.crudService.hide(reviewId, adminId);
  }

  unhide(reviewId: string, adminId: string) {
    return this.crudService.unhide(reviewId, adminId);
  }

  adminDelete(reviewId: string, adminId: string) {
    return this.crudService.adminDelete(reviewId, adminId);
  }

  recalculateContractorRating(contractorId: string) {
    return this.crudService.recalculateContractorRating(contractorId);
  }

  // ============================================
  // STATS METHODS
  // ============================================

  listPublic(
    contractorId: string,
    query: Parameters<ReviewStatsService['listPublic']>[1]
  ) {
    return this.statsService.listPublic(contractorId, query);
  }

  getContractorSummary(contractorId: string) {
    return this.statsService.getContractorSummary(contractorId);
  }

  getContractorStats(contractorId: string) {
    return this.statsService.getContractorStats(contractorId);
  }

  getMonthlyStats(contractorId: string, months?: number) {
    return this.statsService.getMonthlyStats(contractorId, months);
  }

  // ============================================
  // RESPONSE METHODS
  // ============================================

  addResponse(
    reviewId: string,
    contractorId: string,
    data: Parameters<ReviewResponseService['addResponse']>[2]
  ) {
    return this.responseService.addResponse(reviewId, contractorId, data);
  }

  getResponse(reviewId: string) {
    return this.responseService.getResponse(reviewId);
  }

  hasResponded(reviewId: string) {
    return this.responseService.hasResponded(reviewId);
  }

  // ============================================
  // HELPFULNESS METHODS
  // ============================================

  voteHelpful(reviewId: string, userId: string) {
    return this.helpfulnessService.voteHelpful(reviewId, userId);
  }

  removeHelpfulVote(reviewId: string, userId: string) {
    return this.helpfulnessService.removeVote(reviewId, userId);
  }

  getHelpfulCount(reviewId: string) {
    return this.helpfulnessService.getHelpfulCount(reviewId);
  }

  hasUserVoted(reviewId: string, userId: string) {
    return this.helpfulnessService.hasUserVoted(reviewId, userId);
  }

  getHelpfulnessStatus(reviewIds: string[], userId: string) {
    return this.helpfulnessService.getHelpfulnessStatus(reviewIds, userId);
  }
}
