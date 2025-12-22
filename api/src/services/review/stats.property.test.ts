/**
 * Property-Based Tests for Review Stats Operations
 * Using fast-check for property testing
 *
 * These tests verify the correctness properties for stats operations.
 * **Feature: bidding-phase5-review**
 */

import * as fc from 'fast-check';
import { calculateWeightedRating, MULTI_CRITERIA_WEIGHTS } from './index';

// ============================================
// CONSTANTS
// ============================================

const MIN_RATING = 1;
const MAX_RATING = 5;

// ============================================
// GENERATORS
// ============================================

// Valid rating generator (1-5)
const validRatingArb = fc.integer({ min: MIN_RATING, max: MAX_RATING });

// Valid comment generator
const validCommentArb = fc.string({ minLength: 0, maxLength: 2000 });

// Generator for review with rating and age
const reviewWithAgeArb = fc.record({
  rating: validRatingArb,
  ageInDays: fc.integer({ min: 0, max: 365 }),
});

// Generator for array of reviews
const reviewsArb = fc.array(reviewWithAgeArb, { minLength: 0, maxLength: 20 });


// ============================================
// PROPERTY 6: Rating Recalculation
// **Feature: bidding-phase5-review, Property 6: Rating Recalculation**
// **Validates: Requirements 5.1, 5.2, 5.3**
// ============================================

describe('Property 6: Rating Recalculation', () => {
  /**
   * This property tests that the contractor's average rating is correctly recalculated
   * when reviews are created, updated, or deleted.
   */

  function calculateWeight(ageInDays: number): number {
    return Math.max(1, 180 - ageInDays) / 180;
  }

  function calculateWeightedAverage(reviews: Array<{ rating: number; ageInDays: number }>): number {
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

  it('*For any* empty review set, the average rating SHALL be 0', () => {
    const result = calculateWeightedAverage([]);
    expect(result).toBe(0);
  });

  it('*For any* single review, the average rating SHALL equal that review rating', () => {
    fc.assert(
      fc.property(reviewWithAgeArb, (review) => {
        const result = calculateWeightedAverage([review]);
        const expected = Math.round(review.rating * 10) / 10;
        return result === expected;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* set of reviews with same rating, the average SHALL equal that rating', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        fc.array(fc.integer({ min: 0, max: 365 }), { minLength: 1, maxLength: 10 }),
        (rating, ages) => {
          const reviews = ages.map(ageInDays => ({ rating, ageInDays }));
          const result = calculateWeightedAverage(reviews);
          return result === rating;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* set of reviews, the average SHALL be between 1 and 5', () => {
    fc.assert(
      fc.property(
        fc.array(reviewWithAgeArb, { minLength: 1, maxLength: 20 }),
        (reviews) => {
          const result = calculateWeightedAverage(reviews);
          return result >= 1 && result <= 5;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* set of reviews, the average SHALL be rounded to 1 decimal place', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = calculateWeightedAverage(reviews);
        const roundedResult = Math.round(result * 10) / 10;
        return result === roundedResult;
      }),
      { numRuns: 100 }
    );
  });


  it('*For any* two reviews with same rating but different ages, recent review SHALL have more weight', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        validRatingArb,
        fc.integer({ min: 0, max: 90 }),
        fc.integer({ min: 181, max: 365 }),
        (recentRating, oldRating, recentAge, oldAge) => {
          if (recentRating === oldRating) return true;
          
          const reviews = [
            { rating: recentRating, ageInDays: recentAge },
            { rating: oldRating, ageInDays: oldAge },
          ];
          
          const result = calculateWeightedAverage(reviews);
          const recentWeight = calculateWeight(recentAge);
          const oldWeight = calculateWeight(oldAge);
          
          if (recentWeight <= oldWeight) return true;
          
          const distanceToRecent = Math.abs(result - recentRating);
          const distanceToOld = Math.abs(result - oldRating);
          
          return distanceToRecent <= distanceToOld;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('weight calculation: reviews at 0 days SHALL have weight 1', () => {
    const weight = calculateWeight(0);
    expect(weight).toBe(1);
  });

  it('weight calculation: reviews at 180 days SHALL have weight close to 0', () => {
    const weight = calculateWeight(180);
    expect(weight).toBeCloseTo(1 / 180, 4);
  });

  it('weight calculation: reviews older than 180 days SHALL have minimum weight', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 181, max: 1000 }),
        (ageInDays) => {
          const weight = calculateWeight(ageInDays);
          const expectedMinWeight = 1 / 180;
          return Math.abs(weight - expectedMinWeight) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* review age, weight SHALL be positive', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        (ageInDays) => {
          const weight = calculateWeight(ageInDays);
          return weight > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* review age, weight SHALL be at most 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        (ageInDays) => {
          const weight = calculateWeight(ageInDays);
          return weight <= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('weight SHALL decrease monotonically with age (up to 180 days)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 179 }),
        fc.integer({ min: 1, max: 180 }),
        (age1, delta) => {
          const age2 = Math.min(age1 + delta, 180);
          if (age1 >= age2) return true;
          
          const weight1 = calculateWeight(age1);
          const weight2 = calculateWeight(age2);
          
          return weight1 >= weight2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* review addition, recalculation SHALL produce valid result', () => {
    fc.assert(
      fc.property(
        reviewsArb,
        reviewWithAgeArb,
        (existingReviews, newReview) => {
          const afterReviews = [...existingReviews, newReview];
          const afterAvg = calculateWeightedAverage(afterReviews);
          
          if (afterReviews.length === 0) {
            return afterAvg === 0;
          }
          
          return afterAvg >= 1 && afterAvg <= 5;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* review update, recalculation SHALL reflect the new rating', () => {
    fc.assert(
      fc.property(
        fc.array(reviewWithAgeArb, { minLength: 1, maxLength: 10 }),
        fc.nat({ max: 9 }),
        validRatingArb,
        (reviews, indexToUpdate, newRating) => {
          const idx = indexToUpdate % reviews.length;
          const beforeAvg = calculateWeightedAverage(reviews);
          
          const updatedReviews = reviews.map((r, i) => 
            i === idx ? { ...r, rating: newRating } : r
          );
          const afterAvg = calculateWeightedAverage(updatedReviews);
          
          if (reviews[idx].rating === newRating) {
            return beforeAvg === afterAvg;
          }
          
          return afterAvg >= 1 && afterAvg <= 5;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* review deletion, recalculation SHALL exclude the deleted review', () => {
    fc.assert(
      fc.property(
        fc.array(reviewWithAgeArb, { minLength: 1, maxLength: 10 }),
        fc.nat({ max: 9 }),
        (reviews, indexToDelete) => {
          const idx = indexToDelete % reviews.length;
          const remainingReviews = reviews.filter((_, i) => i !== idx);
          const afterAvg = calculateWeightedAverage(remainingReviews);
          
          if (remainingReviews.length === 0) {
            return afterAvg === 0;
          }
          
          return afterAvg >= 1 && afterAvg <= 5;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* set of reviews, calculation SHALL be deterministic', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result1 = calculateWeightedAverage(reviews);
        const result2 = calculateWeightedAverage(reviews);
        const result3 = calculateWeightedAverage(reviews);
        
        return result1 === result2 && result2 === result3;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* set of reviews, order SHALL not affect the result', () => {
    fc.assert(
      fc.property(
        fc.array(reviewWithAgeArb, { minLength: 2, maxLength: 10 }),
        (reviews) => {
          const result1 = calculateWeightedAverage(reviews);
          const reversed = [...reviews].reverse();
          const result2 = calculateWeightedAverage(reversed);
          const sortedByRating = [...reviews].sort((a, b) => a.rating - b.rating);
          const result3 = calculateWeightedAverage(sortedByRating);
          const sortedByAge = [...reviews].sort((a, b) => a.ageInDays - b.ageInDays);
          const result4 = calculateWeightedAverage(sortedByAge);
          
          return result1 === result2 && result2 === result3 && result3 === result4;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('simple average vs weighted average: recent reviews SHALL pull average toward them', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 4, max: 5 }),
        (oldRating, recentRating) => {
          const reviews = [
            { rating: oldRating, ageInDays: 300 },
            { rating: recentRating, ageInDays: 10 },
          ];
          
          const weightedAvg = calculateWeightedAverage(reviews);
          const simpleAvg = (oldRating + recentRating) / 2;
          
          const weightedDistToRecent = Math.abs(weightedAvg - recentRating);
          const simpleDistToRecent = Math.abs(simpleAvg - recentRating);
          
          return weightedDistToRecent <= simpleDistToRecent;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* all-recent reviews (0 days), weighted average SHALL equal simple average', () => {
    fc.assert(
      fc.property(
        fc.array(validRatingArb, { minLength: 1, maxLength: 10 }),
        (ratings) => {
          const reviews = ratings.map(rating => ({ rating, ageInDays: 0 }));
          
          const weightedAvg = calculateWeightedAverage(reviews);
          const simpleAvg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
          
          return weightedAvg === simpleAvg;
        }
      ),
      { numRuns: 100 }
    );
  });
});



// ============================================
// PROPERTY 5: Public Review Filtering
// **Feature: bidding-phase5-review, Property 5: Public Review Filtering**
// **Validates: Requirements 4.3**
// ============================================

describe('Property 5: Public Review Filtering', () => {
  /**
   * This property tests that public review listings only return reviews with isPublic=true.
   */

  const reviewIdArb = fc.uuid();
  const contractorIdArb = fc.uuid();
  const projectIdArb = fc.uuid();
  const reviewerIdArb = fc.uuid();

  const reviewArb = fc.record({
    id: reviewIdArb,
    projectId: projectIdArb,
    reviewerId: reviewerIdArb,
    contractorId: contractorIdArb,
    rating: validRatingArb,
    comment: fc.option(validCommentArb, { nil: null }),
    isPublic: fc.boolean(),
    isDeleted: fc.boolean(),
  });

  const publicReviewArb = fc.record({
    id: reviewIdArb,
    projectId: projectIdArb,
    reviewerId: reviewerIdArb,
    contractorId: contractorIdArb,
    rating: validRatingArb,
    comment: fc.option(validCommentArb, { nil: null }),
    isPublic: fc.constant(true),
    isDeleted: fc.constant(false),
  });

  const hiddenReviewArb = fc.record({
    id: reviewIdArb,
    projectId: projectIdArb,
    reviewerId: reviewerIdArb,
    contractorId: contractorIdArb,
    rating: validRatingArb,
    comment: fc.option(validCommentArb, { nil: null }),
    isPublic: fc.constant(false),
    isDeleted: fc.constant(false),
  });

  const deletedReviewArb = fc.record({
    id: reviewIdArb,
    projectId: projectIdArb,
    reviewerId: reviewerIdArb,
    contractorId: contractorIdArb,
    rating: validRatingArb,
    comment: fc.option(validCommentArb, { nil: null }),
    isPublic: fc.boolean(),
    isDeleted: fc.constant(true),
  });


  const reviewListArb = fc.array(reviewArb, { minLength: 0, maxLength: 20 });

  function filterPublicReviews<T extends { isPublic: boolean; isDeleted: boolean }>(
    reviews: T[]
  ): T[] {
    return reviews.filter(review => review.isPublic === true && review.isDeleted === false);
  }

  function isVisiblePublicly(review: { isPublic: boolean; isDeleted: boolean }): boolean {
    return review.isPublic === true && review.isDeleted === false;
  }

  it('*For any* list of reviews, public listing SHALL only include reviews with isPublic=true AND isDeleted=false', () => {
    fc.assert(
      fc.property(reviewListArb, (reviews) => {
        const publicReviews = filterPublicReviews(reviews);
        return publicReviews.every(review => 
          review.isPublic === true && review.isDeleted === false
        );
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* review with isPublic=false, it SHALL NOT appear in public listing', () => {
    fc.assert(
      fc.property(hiddenReviewArb, (hiddenReview) => {
        const reviews = [hiddenReview];
        const publicReviews = filterPublicReviews(reviews);
        return publicReviews.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* review with isDeleted=true, it SHALL NOT appear in public listing', () => {
    fc.assert(
      fc.property(deletedReviewArb, (deletedReview) => {
        const reviews = [deletedReview];
        const publicReviews = filterPublicReviews(reviews);
        return publicReviews.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* review with isPublic=true AND isDeleted=false, it SHALL appear in public listing', () => {
    fc.assert(
      fc.property(publicReviewArb, (publicReview) => {
        const reviews = [publicReview];
        const publicReviews = filterPublicReviews(reviews);
        return publicReviews.length === 1 && publicReviews[0].id === publicReview.id;
      }),
      { numRuns: 100 }
    );
  });


  it('*For any* mixed list, the count of public reviews SHALL equal reviews with isPublic=true AND isDeleted=false', () => {
    fc.assert(
      fc.property(reviewListArb, (reviews) => {
        const publicReviews = filterPublicReviews(reviews);
        const expectedCount = reviews.filter(r => r.isPublic && !r.isDeleted).length;
        return publicReviews.length === expectedCount;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* list with only hidden reviews, public listing SHALL be empty', () => {
    fc.assert(
      fc.property(
        fc.array(hiddenReviewArb, { minLength: 1, maxLength: 10 }),
        (hiddenReviews) => {
          const publicReviews = filterPublicReviews(hiddenReviews);
          return publicReviews.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* list with only deleted reviews, public listing SHALL be empty', () => {
    fc.assert(
      fc.property(
        fc.array(deletedReviewArb, { minLength: 1, maxLength: 10 }),
        (deletedReviews) => {
          const publicReviews = filterPublicReviews(deletedReviews);
          return publicReviews.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* list with only public non-deleted reviews, all SHALL appear in public listing', () => {
    fc.assert(
      fc.property(
        fc.array(publicReviewArb, { minLength: 1, maxLength: 10 }),
        (publicReviews) => {
          const filteredReviews = filterPublicReviews(publicReviews);
          return filteredReviews.length === publicReviews.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('public filtering SHALL preserve review data integrity', () => {
    fc.assert(
      fc.property(publicReviewArb, (review) => {
        const reviews = [review];
        const publicReviews = filterPublicReviews(reviews);
        
        if (publicReviews.length !== 1) return false;
        
        const filtered = publicReviews[0];
        return (
          filtered.id === review.id &&
          filtered.projectId === review.projectId &&
          filtered.reviewerId === review.reviewerId &&
          filtered.contractorId === review.contractorId &&
          filtered.rating === review.rating &&
          filtered.comment === review.comment &&
          filtered.isPublic === review.isPublic &&
          filtered.isDeleted === review.isDeleted
        );
      }),
      { numRuns: 100 }
    );
  });


  it('*For any* contractor, public listing SHALL only show their public reviews', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        reviewListArb,
        (targetContractorId, reviews) => {
          const contractorReviews = reviews.filter(r => r.contractorId === targetContractorId);
          const publicContractorReviews = filterPublicReviews(contractorReviews);
          
          return publicContractorReviews.every(review => 
            review.contractorId === targetContractorId &&
            review.isPublic === true &&
            review.isDeleted === false
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isPublic check SHALL be strict boolean comparison', () => {
    const truthyValues = [1, 'true', {}, [], 'yes'];
    
    for (const truthyValue of truthyValues) {
      const review = {
        id: 'test',
        projectId: 'proj',
        reviewerId: 'reviewer',
        contractorId: 'contractor',
        rating: 5,
        comment: null,
        isPublic: truthyValue as unknown as boolean,
        isDeleted: false,
      };
      
      const isVisible = review.isPublic === true && review.isDeleted === false;
      expect(isVisible).toBe(false);
    }
  });

  it('isDeleted check SHALL be strict boolean comparison', () => {
    const falsyValues = [0, '', null, undefined];
    
    for (const falsyValue of falsyValues) {
      const review = {
        id: 'test',
        projectId: 'proj',
        reviewerId: 'reviewer',
        contractorId: 'contractor',
        rating: 5,
        comment: null,
        isPublic: true,
        isDeleted: falsyValue as unknown as boolean,
      };
      
      const isVisible = review.isPublic === true && review.isDeleted === false;
      expect(isVisible).toBe(false);
    }
  });

  it('*For any* review, visibility check SHALL be deterministic', () => {
    fc.assert(
      fc.property(reviewArb, (review) => {
        const result1 = isVisiblePublicly(review);
        const result2 = isVisiblePublicly(review);
        const result3 = isVisiblePublicly(review);
        return result1 === result2 && result2 === result3;
      }),
      { numRuns: 100 }
    );
  });


  it('*For any* review, visibility SHALL depend only on isPublic and isDeleted', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        validRatingArb,
        validRatingArb,
        validCommentArb,
        validCommentArb,
        (isPublic, isDeleted, rating1, rating2, comment1, comment2) => {
          const review1 = {
            id: 'r1',
            projectId: 'p1',
            reviewerId: 'rev1',
            contractorId: 'c1',
            rating: rating1,
            comment: comment1,
            isPublic,
            isDeleted,
          };
          
          const review2 = {
            id: 'r2',
            projectId: 'p2',
            reviewerId: 'rev2',
            contractorId: 'c2',
            rating: rating2,
            comment: comment2,
            isPublic,
            isDeleted,
          };
          
          return isVisiblePublicly(review1) === isVisiblePublicly(review2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtering SHALL be idempotent', () => {
    fc.assert(
      fc.property(reviewListArb, (reviews) => {
        const filtered1 = filterPublicReviews(reviews);
        const filtered2 = filterPublicReviews(filtered1);
        
        return (
          filtered1.length === filtered2.length &&
          filtered1.every((r, i) => r.id === filtered2[i].id)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* empty list, public listing SHALL be empty', () => {
    const emptyList: Array<{ isPublic: boolean; isDeleted: boolean }> = [];
    const result = filterPublicReviews(emptyList);
    expect(result.length).toBe(0);
  });

  it('filtering SHALL preserve order of reviews', () => {
    fc.assert(
      fc.property(
        fc.array(publicReviewArb, { minLength: 2, maxLength: 10 }),
        (reviews) => {
          const filtered = filterPublicReviews(reviews);
          
          for (let i = 0; i < filtered.length - 1; i++) {
            const originalIndex1 = reviews.findIndex(r => r.id === filtered[i].id);
            const originalIndex2 = reviews.findIndex(r => r.id === filtered[i + 1].id);
            
            if (originalIndex1 >= originalIndex2) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});



// ============================================
// PROPERTY 10: Contractor View All Reviews
// **Feature: bidding-phase5-review, Property 10: Contractor View All Reviews**
// **Validates: Requirements 4.4**
// ============================================

describe('Property 10: Contractor View All Reviews', () => {
  /**
   * This property tests that contractors can view ALL their reviews, including hidden ones.
   */

  const reviewIdArb = fc.uuid();
  const contractorIdArb = fc.uuid();
  const projectIdArb = fc.uuid();
  const reviewerIdArb = fc.uuid();

  const reviewArb = fc.record({
    id: reviewIdArb,
    projectId: projectIdArb,
    reviewerId: reviewerIdArb,
    contractorId: contractorIdArb,
    rating: validRatingArb,
    comment: fc.option(validCommentArb, { nil: null }),
    isPublic: fc.boolean(),
    isDeleted: fc.boolean(),
  });

  const publicReviewArb = fc.record({
    id: reviewIdArb,
    projectId: projectIdArb,
    reviewerId: reviewerIdArb,
    contractorId: contractorIdArb,
    rating: validRatingArb,
    comment: fc.option(validCommentArb, { nil: null }),
    isPublic: fc.constant(true),
    isDeleted: fc.constant(false),
  });

  const hiddenReviewArb = fc.record({
    id: reviewIdArb,
    projectId: projectIdArb,
    reviewerId: reviewerIdArb,
    contractorId: contractorIdArb,
    rating: validRatingArb,
    comment: fc.option(validCommentArb, { nil: null }),
    isPublic: fc.constant(false),
    isDeleted: fc.constant(false),
  });

  const deletedReviewArb = fc.record({
    id: reviewIdArb,
    projectId: projectIdArb,
    reviewerId: reviewerIdArb,
    contractorId: contractorIdArb,
    rating: validRatingArb,
    comment: fc.option(validCommentArb, { nil: null }),
    isPublic: fc.boolean(),
    isDeleted: fc.constant(true),
  });


  const nonDeletedReviewArb = fc.record({
    id: reviewIdArb,
    projectId: projectIdArb,
    reviewerId: reviewerIdArb,
    contractorId: contractorIdArb,
    rating: validRatingArb,
    comment: fc.option(validCommentArb, { nil: null }),
    isPublic: fc.boolean(),
    isDeleted: fc.constant(false),
  });

  const reviewListArb = fc.array(reviewArb, { minLength: 0, maxLength: 20 });

  function filterContractorReviews<T extends { contractorId: string; isDeleted: boolean }>(
    reviews: T[],
    targetContractorId: string
  ): T[] {
    return reviews.filter(
      review => review.contractorId === targetContractorId && review.isDeleted === false
    );
  }

  function filterPublicReviews<T extends { contractorId: string; isPublic: boolean; isDeleted: boolean }>(
    reviews: T[],
    targetContractorId: string
  ): T[] {
    return reviews.filter(
      review => 
        review.contractorId === targetContractorId && 
        review.isPublic === true && 
        review.isDeleted === false
    );
  }

  it('*For any* contractor, their view SHALL include ALL non-deleted reviews (including hidden)', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        fc.array(nonDeletedReviewArb, { minLength: 1, maxLength: 10 }),
        (targetContractorId, reviews) => {
          const contractorReviews = reviews.map(r => ({ ...r, contractorId: targetContractorId }));
          const contractorView = filterContractorReviews(contractorReviews, targetContractorId);
          return contractorView.length === contractorReviews.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* hidden review, contractor SHALL see it but public SHALL NOT', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        hiddenReviewArb,
        (targetContractorId, hiddenReview) => {
          const review = { ...hiddenReview, contractorId: targetContractorId };
          const reviews = [review];
          
          const contractorView = filterContractorReviews(reviews, targetContractorId);
          const publicView = filterPublicReviews(reviews, targetContractorId);
          
          return contractorView.length === 1 && publicView.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });


  it('*For any* public review, both contractor and public SHALL see it', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        publicReviewArb,
        (targetContractorId, publicReview) => {
          const review = { ...publicReview, contractorId: targetContractorId };
          const reviews = [review];
          
          const contractorView = filterContractorReviews(reviews, targetContractorId);
          const publicView = filterPublicReviews(reviews, targetContractorId);
          
          return contractorView.length === 1 && publicView.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* deleted review, neither contractor nor public SHALL see it', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        deletedReviewArb,
        (targetContractorId, deletedReview) => {
          const review = { ...deletedReview, contractorId: targetContractorId };
          const reviews = [review];
          
          const contractorView = filterContractorReviews(reviews, targetContractorId);
          const publicView = filterPublicReviews(reviews, targetContractorId);
          
          return contractorView.length === 0 && publicView.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* mix of public and hidden reviews, contractor view count SHALL be >= public view count', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        reviewListArb,
        (targetContractorId, reviews) => {
          const mixedReviews = reviews.map((r, i) => ({
            ...r,
            contractorId: i % 2 === 0 ? targetContractorId : r.contractorId,
          }));
          
          const contractorView = filterContractorReviews(mixedReviews, targetContractorId);
          const publicView = filterPublicReviews(mixedReviews, targetContractorId);
          
          return contractorView.length >= publicView.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* contractor with only hidden reviews, contractor SHALL see all but public SHALL see none', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        fc.array(hiddenReviewArb, { minLength: 1, maxLength: 10 }),
        (targetContractorId, hiddenReviews) => {
          const reviews = hiddenReviews.map(r => ({ ...r, contractorId: targetContractorId }));
          
          const contractorView = filterContractorReviews(reviews, targetContractorId);
          const publicView = filterPublicReviews(reviews, targetContractorId);
          
          return contractorView.length === reviews.length && publicView.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });


  it('contractor view SHALL NOT filter by isPublic flag', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        fc.boolean(),
        validRatingArb,
        (targetContractorId, isPublic, rating) => {
          const review = {
            id: 'test-review',
            projectId: 'test-project',
            reviewerId: 'test-reviewer',
            contractorId: targetContractorId,
            rating,
            comment: null,
            isPublic,
            isDeleted: false,
          };
          
          const contractorView = filterContractorReviews([review], targetContractorId);
          return contractorView.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* contractor, they SHALL only see their own reviews (not other contractors)', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        contractorIdArb,
        nonDeletedReviewArb,
        (contractor1Id, contractor2Id, review) => {
          if (contractor1Id === contractor2Id) return true;
          
          const reviewForContractor2 = { ...review, contractorId: contractor2Id };
          const contractor1View = filterContractorReviews([reviewForContractor2], contractor1Id);
          
          return contractor1View.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* set of reviews, contractor view SHALL preserve all review data', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        nonDeletedReviewArb,
        (targetContractorId, review) => {
          const originalReview = { ...review, contractorId: targetContractorId };
          const contractorView = filterContractorReviews([originalReview], targetContractorId);
          
          if (contractorView.length !== 1) return false;
          
          const viewedReview = contractorView[0];
          return (
            viewedReview.id === originalReview.id &&
            viewedReview.projectId === originalReview.projectId &&
            viewedReview.reviewerId === originalReview.reviewerId &&
            viewedReview.contractorId === originalReview.contractorId &&
            viewedReview.rating === originalReview.rating &&
            viewedReview.comment === originalReview.comment &&
            viewedReview.isPublic === originalReview.isPublic &&
            viewedReview.isDeleted === originalReview.isDeleted
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('the difference between contractor and public view SHALL be exactly the hidden reviews', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        fc.array(nonDeletedReviewArb, { minLength: 0, maxLength: 10 }),
        (targetContractorId, reviews) => {
          const contractorReviews = reviews.map(r => ({ ...r, contractorId: targetContractorId }));
          
          const contractorView = filterContractorReviews(contractorReviews, targetContractorId);
          const publicView = filterPublicReviews(contractorReviews, targetContractorId);
          
          const hiddenCount = contractorReviews.filter(r => !r.isPublic).length;
          const difference = contractorView.length - publicView.length;
          
          return difference === hiddenCount;
        }
      ),
      { numRuns: 100 }
    );
  });


  it('contractor view filtering SHALL be deterministic', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        reviewListArb,
        (targetContractorId, reviews) => {
          const result1 = filterContractorReviews(reviews, targetContractorId);
          const result2 = filterContractorReviews(reviews, targetContractorId);
          const result3 = filterContractorReviews(reviews, targetContractorId);
          
          return (
            result1.length === result2.length &&
            result2.length === result3.length &&
            result1.every((r, i) => r.id === result2[i].id && r.id === result3[i].id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('contractor view SHALL preserve order of reviews', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        fc.array(nonDeletedReviewArb, { minLength: 2, maxLength: 10 }),
        (targetContractorId, reviews) => {
          const contractorReviews = reviews.map(r => ({ ...r, contractorId: targetContractorId }));
          const filtered = filterContractorReviews(contractorReviews, targetContractorId);
          
          for (let i = 0; i < filtered.length - 1; i++) {
            const originalIndex1 = contractorReviews.findIndex(r => r.id === filtered[i].id);
            const originalIndex2 = contractorReviews.findIndex(r => r.id === filtered[i + 1].id);
            
            if (originalIndex1 >= originalIndex2) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* empty review list, contractor view SHALL be empty', () => {
    fc.assert(
      fc.property(contractorIdArb, (targetContractorId) => {
        const emptyList: Array<{ contractorId: string; isDeleted: boolean }> = [];
        const result = filterContractorReviews(emptyList, targetContractorId);
        return result.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('contractor view filtering SHALL be idempotent', () => {
    fc.assert(
      fc.property(
        contractorIdArb,
        fc.array(nonDeletedReviewArb, { minLength: 0, maxLength: 10 }),
        (targetContractorId, reviews) => {
          const contractorReviews = reviews.map(r => ({ ...r, contractorId: targetContractorId }));
          
          const filtered1 = filterContractorReviews(contractorReviews, targetContractorId);
          const filtered2 = filterContractorReviews(filtered1, targetContractorId);
          
          return (
            filtered1.length === filtered2.length &&
            filtered1.every((r, i) => r.id === filtered2[i].id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});



// ============================================
// PROPERTY 11: Multi-Criteria Rating Calculation
// **Feature: bidding-phase5-review, Property 11: Multi-Criteria Rating Calculation**
// **Validates: Requirements 17.1, 17.2**
// ============================================

describe('Property 11: Multi-Criteria Rating Calculation', () => {
  /**
   * This property tests that the overall rating is correctly calculated
   * as a weighted average of multi-criteria ratings.
   */

  const validCriteriaRatingArb = fc.integer({ min: 1, max: 5 });
  const optionalCriteriaRatingArb = fc.option(validCriteriaRatingArb, { nil: null });

  const completeCriteriaArb = fc.record({
    qualityRating: validCriteriaRatingArb,
    timelinessRating: validCriteriaRatingArb,
    communicationRating: validCriteriaRatingArb,
    valueRating: validCriteriaRatingArb,
  });

  const partialCriteriaArb = fc.record({
    qualityRating: optionalCriteriaRatingArb,
    timelinessRating: optionalCriteriaRatingArb,
    communicationRating: optionalCriteriaRatingArb,
    valueRating: optionalCriteriaRatingArb,
  });

  it('*For any* complete multi-criteria ratings, the weighted average SHALL be between 1 and 5', () => {
    fc.assert(
      fc.property(completeCriteriaArb, (criteria) => {
        const result = calculateWeightedRating(criteria);
        if (result === null) return false;
        return result >= 1 && result <= 5;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* partial multi-criteria ratings with at least one value, the weighted average SHALL be between 1 and 5', () => {
    fc.assert(
      fc.property(
        partialCriteriaArb.filter(c => 
          c.qualityRating !== null || 
          c.timelinessRating !== null || 
          c.communicationRating !== null || 
          c.valueRating !== null
        ),
        (criteria) => {
          const result = calculateWeightedRating(criteria);
          if (result === null) return false;
          return result >= 1 && result <= 5;
        }
      ),
      { numRuns: 100 }
    );
  });


  it('*For any* empty multi-criteria ratings, the weighted average SHALL be null', () => {
    const emptyCriteria = {
      qualityRating: null,
      timelinessRating: null,
      communicationRating: null,
      valueRating: null,
    };
    
    const result = calculateWeightedRating(emptyCriteria);
    expect(result).toBeNull();
  });

  it('*For any* uniform multi-criteria ratings, the weighted average SHALL equal that rating', () => {
    fc.assert(
      fc.property(validCriteriaRatingArb, (uniformRating) => {
        const criteria = {
          qualityRating: uniformRating,
          timelinessRating: uniformRating,
          communicationRating: uniformRating,
          valueRating: uniformRating,
        };
        
        const result = calculateWeightedRating(criteria);
        return result === uniformRating;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* multi-criteria ratings, the weighted average SHALL be deterministic', () => {
    fc.assert(
      fc.property(completeCriteriaArb, (criteria) => {
        const result1 = calculateWeightedRating(criteria);
        const result2 = calculateWeightedRating(criteria);
        const result3 = calculateWeightedRating(criteria);
        return result1 === result2 && result2 === result3;
      }),
      { numRuns: 100 }
    );
  });

  it('weights SHALL sum to 1.0 (100%)', () => {
    const totalWeight = 
      MULTI_CRITERIA_WEIGHTS.quality +
      MULTI_CRITERIA_WEIGHTS.timeliness +
      MULTI_CRITERIA_WEIGHTS.communication +
      MULTI_CRITERIA_WEIGHTS.value;
    
    expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.0001);
  });

  it('*For any* single criteria rating, the weighted average SHALL equal that rating', () => {
    fc.assert(
      fc.property(validCriteriaRatingArb, (rating) => {
        const qualityOnly = calculateWeightedRating({
          qualityRating: rating,
          timelinessRating: null,
          communicationRating: null,
          valueRating: null,
        });
        
        const timelinessOnly = calculateWeightedRating({
          qualityRating: null,
          timelinessRating: rating,
          communicationRating: null,
          valueRating: null,
        });
        
        const communicationOnly = calculateWeightedRating({
          qualityRating: null,
          timelinessRating: null,
          communicationRating: rating,
          valueRating: null,
        });
        
        const valueOnly = calculateWeightedRating({
          qualityRating: null,
          timelinessRating: null,
          communicationRating: null,
          valueRating: rating,
        });
        
        return (
          qualityOnly === rating &&
          timelinessOnly === rating &&
          communicationOnly === rating &&
          valueOnly === rating
        );
      }),
      { numRuns: 100 }
    );
  });


  it('*For any* multi-criteria ratings, higher individual ratings SHALL result in higher or equal weighted average', () => {
    fc.assert(
      fc.property(
        completeCriteriaArb,
        fc.constantFrom('qualityRating', 'timelinessRating', 'communicationRating', 'valueRating'),
        (criteria, criteriaToIncrease) => {
          const originalResult = calculateWeightedRating(criteria);
          
          if (criteria[criteriaToIncrease] >= 5) return true;
          
          const increasedCriteria = {
            ...criteria,
            [criteriaToIncrease]: criteria[criteriaToIncrease] + 1,
          };
          
          const increasedResult = calculateWeightedRating(increasedCriteria);
          
          if (originalResult === null || increasedResult === null) return false;
          
          return increasedResult >= originalResult;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* multi-criteria ratings, the weighted average SHALL be rounded to 1 decimal place', () => {
    fc.assert(
      fc.property(completeCriteriaArb, (criteria) => {
        const result = calculateWeightedRating(criteria);
        
        if (result === null) return false;
        
        const rounded = Math.round(result * 10) / 10;
        return Math.abs(result - rounded) < 0.0001;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* extreme ratings (all 1s or all 5s), the weighted average SHALL be exact', () => {
    const allOnes = {
      qualityRating: 1,
      timelinessRating: 1,
      communicationRating: 1,
      valueRating: 1,
    };
    
    const allFives = {
      qualityRating: 5,
      timelinessRating: 5,
      communicationRating: 5,
      valueRating: 5,
    };
    
    expect(calculateWeightedRating(allOnes)).toBe(1);
    expect(calculateWeightedRating(allFives)).toBe(5);
  });

  it('*For any* two criteria with equal weights, swapping their values SHALL not change the result', () => {
    fc.assert(
      fc.property(
        validCriteriaRatingArb,
        validCriteriaRatingArb,
        validCriteriaRatingArb,
        validCriteriaRatingArb,
        (quality, timeliness, communication, value) => {
          const original = calculateWeightedRating({
            qualityRating: quality,
            timelinessRating: timeliness,
            communicationRating: communication,
            valueRating: value,
          });
          
          // Swap timeliness and value (both have 0.25 weight)
          const swapped = calculateWeightedRating({
            qualityRating: quality,
            timelinessRating: value,
            communicationRating: communication,
            valueRating: timeliness,
          });
          
          if (original === null || swapped === null) return false;
          return Math.abs(original - swapped) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });
});
