/**
 * Shared Test Utilities for Review Service Property Tests
 * 
 * This file contains common generators, constants, and helper functions
 * used across review service property tests.
 * 
 * **Feature: bidding-phase5-review**
 */

import * as fc from 'fast-check';
import { MAX_REVIEW_IMAGES } from '../../schemas/review.schema';

// ============================================
// CONSTANTS
// ============================================

export const MIN_RATING = 1;
export const MAX_RATING = 5;

export const PROJECT_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'OPEN',
  'BIDDING_CLOSED',
  'MATCHED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export const REVIEWABLE_STATUS = 'COMPLETED';
export const NON_REVIEWABLE_STATUSES = PROJECT_STATUSES.filter(s => s !== REVIEWABLE_STATUS);

// ============================================
// GENERATORS - Basic Types
// ============================================

/** Valid rating generator (1-5) */
export const validRatingArb = fc.integer({ min: MIN_RATING, max: MAX_RATING });

/** Invalid rating generator (below 1) */
export const invalidRatingBelowArb = fc.integer({ min: -1000, max: 0 });

/** Invalid rating generator (above 5) */
export const invalidRatingAboveArb = fc.integer({ min: 6, max: 1000 });

/** Non-integer rating generator */
export const nonIntegerRatingArb = fc.float({ 
  min: Math.fround(1.1), 
  max: Math.fround(4.9), 
  noNaN: true, 
  noDefaultInfinity: true 
}).filter(n => !Number.isInteger(n));

/** Valid comment generator */
export const validCommentArb = fc.string({ minLength: 0, maxLength: 2000 });

/** Valid response text generator */
export const responseTextArb = fc.string({ minLength: 1, maxLength: 2000 });

/** Valid image URL generator */
export const validImageUrlArb = fc.webUrl();

/** Valid images array generator (0-5 images) */
export const validImagesArb = fc.array(validImageUrlArb, { minLength: 0, maxLength: MAX_REVIEW_IMAGES });

/** Invalid images array generator (more than 5 images) */
export const invalidImagesArb = fc.array(validImageUrlArb, { minLength: MAX_REVIEW_IMAGES + 1, maxLength: 10 });

// ============================================
// GENERATORS - IDs
// ============================================

export const reviewIdArb = fc.uuid();
export const projectIdArb = fc.uuid();
export const reviewerIdArb = fc.uuid();
export const contractorIdArb = fc.uuid();
export const userIdArb = fc.uuid();


// ============================================
// GENERATORS - Complex Types
// ============================================

/** Generator for project status */
export const projectStatusArb = fc.constantFrom(...PROJECT_STATUSES);

/** Generator for non-reviewable project status */
export const nonReviewableStatusArb = fc.constantFrom(...NON_REVIEWABLE_STATUSES);

/** Generator for review with rating and age */
export const reviewWithAgeArb = fc.record({
  rating: validRatingArb,
  ageInDays: fc.integer({ min: 0, max: 365 }),
});

/** Generator for array of reviews with age */
export const reviewsWithAgeArb = fc.array(reviewWithAgeArb, { minLength: 0, maxLength: 20 });

/** Generator for project with owner */
export const projectArb = fc.record({
  id: projectIdArb,
  ownerId: userIdArb,
  status: projectStatusArb,
});

/** Generator for project with non-reviewable status */
export const nonReviewableProjectArb = fc.record({
  id: projectIdArb,
  ownerId: userIdArb,
  status: nonReviewableStatusArb,
});

/** Generator for completed project */
export const completedProjectArb = fc.record({
  id: projectIdArb,
  ownerId: userIdArb,
  status: fc.constant(REVIEWABLE_STATUS),
});

/** Generator for review with visibility flags */
export const reviewWithVisibilityArb = fc.record({
  id: reviewIdArb,
  projectId: projectIdArb,
  reviewerId: reviewerIdArb,
  contractorId: contractorIdArb,
  rating: validRatingArb,
  comment: fc.option(validCommentArb, { nil: null }),
  isPublic: fc.boolean(),
  isDeleted: fc.boolean(),
});

/** Generator for public, non-deleted review */
export const publicReviewArb = fc.record({
  id: reviewIdArb,
  projectId: projectIdArb,
  reviewerId: reviewerIdArb,
  contractorId: contractorIdArb,
  rating: validRatingArb,
  comment: fc.option(validCommentArb, { nil: null }),
  isPublic: fc.constant(true),
  isDeleted: fc.constant(false),
});

/** Generator for hidden review (isPublic=false) */
export const hiddenReviewArb = fc.record({
  id: reviewIdArb,
  projectId: projectIdArb,
  reviewerId: reviewerIdArb,
  contractorId: contractorIdArb,
  rating: validRatingArb,
  comment: fc.option(validCommentArb, { nil: null }),
  isPublic: fc.constant(false),
  isDeleted: fc.constant(false),
});

/** Generator for deleted review */
export const deletedReviewArb = fc.record({
  id: reviewIdArb,
  projectId: projectIdArb,
  reviewerId: reviewerIdArb,
  contractorId: contractorIdArb,
  rating: validRatingArb,
  comment: fc.option(validCommentArb, { nil: null }),
  isPublic: fc.boolean(),
  isDeleted: fc.constant(true),
});

/** Generator for non-deleted review */
export const nonDeletedReviewArb = fc.record({
  id: reviewIdArb,
  projectId: projectIdArb,
  reviewerId: reviewerIdArb,
  contractorId: contractorIdArb,
  rating: validRatingArb,
  comment: fc.option(validCommentArb, { nil: null }),
  isPublic: fc.boolean(),
  isDeleted: fc.constant(false),
});


/** Generator for review without response */
export const reviewWithoutResponseArb = fc.record({
  id: reviewIdArb,
  projectId: projectIdArb,
  reviewerId: reviewerIdArb,
  contractorId: contractorIdArb,
  rating: validRatingArb,
  comment: fc.option(validCommentArb, { nil: null }),
  response: fc.constant(null),
  respondedAt: fc.constant(null),
  isDeleted: fc.constant(false),
});

/** Generator for review with response */
export const reviewWithResponseArb = fc.record({
  id: reviewIdArb,
  projectId: projectIdArb,
  reviewerId: reviewerIdArb,
  contractorId: contractorIdArb,
  rating: validRatingArb,
  comment: fc.option(validCommentArb, { nil: null }),
  response: responseTextArb,
  respondedAt: fc.date(),
  isDeleted: fc.constant(false),
});

/** Generator for complete multi-criteria ratings */
export const completeCriteriaArb = fc.record({
  qualityRating: validRatingArb,
  timelinessRating: validRatingArb,
  communicationRating: validRatingArb,
  valueRating: validRatingArb,
});

/** Generator for partial multi-criteria ratings */
export const partialCriteriaArb = fc.record({
  qualityRating: fc.option(validRatingArb, { nil: null }),
  timelinessRating: fc.option(validRatingArb, { nil: null }),
  communicationRating: fc.option(validRatingArb, { nil: null }),
  valueRating: fc.option(validRatingArb, { nil: null }),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate weight based on recency (same formula as in ReviewService)
 */
export function calculateWeight(ageInDays: number): number {
  return Math.max(1, 180 - ageInDays) / 180;
}

/**
 * Calculate weighted average rating (same formula as in ReviewService)
 */
export function calculateWeightedAverage(reviews: Array<{ rating: number; ageInDays: number }>): number {
  if (reviews.length === 0) {
    return 0;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const review of reviews) {
    const weight = calculateWeight(review.ageInDays);
    weightedSum += review.rating * weight;
    totalWeight += weight;
  }

  const rawAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const fixedAverage = parseFloat(rawAverage.toFixed(10));
  return totalWeight > 0 
    ? Math.round(fixedAverage * 10) / 10 
    : 0;
}

/**
 * Check if a review can be created (precondition validation)
 */
export function canCreateReview(
  project: { id: string; ownerId: string; status: string },
  reviewerId: string
): { allowed: boolean; reason?: string } {
  if (project.status !== REVIEWABLE_STATUS) {
    return { allowed: false, reason: 'PROJECT_NOT_COMPLETED' };
  }

  if (project.ownerId !== reviewerId) {
    return { allowed: false, reason: 'NOT_PROJECT_OWNER' };
  }

  return { allowed: true };
}

/**
 * Check if a response can be added to a review
 */
export function canAddResponse(
  review: { 
    contractorId: string; 
    response: string | null; 
    isDeleted: boolean;
  },
  requestingContractorId: string
): { allowed: boolean; reason?: string } {
  if (review.contractorId !== requestingContractorId) {
    return { allowed: false, reason: 'NOT_CONTRACTOR' };
  }

  if (review.isDeleted) {
    return { allowed: false, reason: 'REVIEW_DELETED' };
  }

  if (review.response !== null) {
    return { allowed: false, reason: 'RESPONSE_ALREADY_EXISTS' };
  }

  return { allowed: true };
}

/**
 * Filter reviews for public display
 */
export function filterPublicReviews<T extends { isPublic: boolean; isDeleted: boolean }>(
  reviews: T[]
): T[] {
  return reviews.filter(review => review.isPublic === true && review.isDeleted === false);
}

/**
 * Check if a review is visible publicly
 */
export function isVisiblePublicly(review: { isPublic: boolean; isDeleted: boolean }): boolean {
  return review.isPublic === true && review.isDeleted === false;
}

/**
 * Filter reviews for contractor view
 */
export function filterContractorReviews<T extends { contractorId: string; isDeleted: boolean }>(
  reviews: T[],
  targetContractorId: string
): T[] {
  return reviews.filter(
    review => review.contractorId === targetContractorId && review.isDeleted === false
  );
}
