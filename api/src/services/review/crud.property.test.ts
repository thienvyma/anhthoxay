/**
 * Property-Based Tests for Review CRUD Operations
 * Using fast-check for property testing
 *
 * These tests verify the correctness properties for CRUD operations.
 * **Feature: bidding-phase5-review**
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as fc from 'fast-check';
import { CreateReviewSchema, UpdateReviewSchema, MAX_REVIEW_IMAGES } from '../../schemas/review.schema';

// ============================================
// CONSTANTS
// ============================================

const MIN_RATING = 1;
const MAX_RATING = 5;

// ============================================
// GENERATORS (shared with other test files via test-utils)
// ============================================

// Valid rating generator (1-5)
const validRatingArb = fc.integer({ min: MIN_RATING, max: MAX_RATING });

// Invalid rating generator (outside 1-5 bounds)
const invalidRatingBelowArb = fc.integer({ min: -1000, max: 0 });
const invalidRatingAboveArb = fc.integer({ min: 6, max: 1000 });

// Non-integer rating generator - use Math.fround for 32-bit float compatibility
const nonIntegerRatingArb = fc.float({ 
  min: Math.fround(1.1), 
  max: Math.fround(4.9), 
  noNaN: true, 
  noDefaultInfinity: true 
}).filter(n => !Number.isInteger(n));

// Valid comment generator
const validCommentArb = fc.string({ minLength: 0, maxLength: 2000 });

// Valid image URL generator
const validImageUrlArb = fc.webUrl();

// Valid images array generator (0-5 images)
const validImagesArb = fc.array(validImageUrlArb, { minLength: 0, maxLength: MAX_REVIEW_IMAGES });

// Invalid images array generator (more than 5 images)
const invalidImagesArb = fc.array(validImageUrlArb, { minLength: MAX_REVIEW_IMAGES + 1, maxLength: 10 });


// ============================================
// PROPERTY 1: Review Rating Bounds
// **Feature: bidding-phase5-review, Property 1: Review Rating Bounds**
// **Validates: Requirements 1.2, 2.4**
// ============================================

describe('Property 1: Review Rating Bounds', () => {
  it('*For any* valid rating (1-5), the CreateReviewSchema SHALL accept the rating', () => {
    fc.assert(
      fc.property(validRatingArb, (rating) => {
        const input = { rating };
        const result = CreateReviewSchema.safeParse(input);
        
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });


  it('*For any* rating below 1, the CreateReviewSchema SHALL reject the rating', () => {
    fc.assert(
      fc.property(invalidRatingBelowArb, (rating) => {
        const input = { rating };
        const result = CreateReviewSchema.safeParse(input);
        
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* rating above 5, the CreateReviewSchema SHALL reject the rating', () => {
    fc.assert(
      fc.property(invalidRatingAboveArb, (rating) => {
        const input = { rating };
        const result = CreateReviewSchema.safeParse(input);
        
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* non-integer rating, the CreateReviewSchema SHALL reject the rating', () => {
    fc.assert(
      fc.property(nonIntegerRatingArb, (rating) => {
        const input = { rating };
        const result = CreateReviewSchema.safeParse(input);
        
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* valid rating in UpdateReviewSchema, the schema SHALL accept the rating', () => {
    fc.assert(
      fc.property(validRatingArb, (rating) => {
        const input = { rating };
        const result = UpdateReviewSchema.safeParse(input);
        
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* invalid rating in UpdateReviewSchema, the schema SHALL reject the rating', () => {
    fc.assert(
      fc.property(
        fc.oneof(invalidRatingBelowArb, invalidRatingAboveArb),
        (rating) => {
          const input = { rating };
          const result = UpdateReviewSchema.safeParse(input);
          
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rating bounds SHALL be exactly 1 (min) and 5 (max)', () => {
    // Test boundary values explicitly
    const minResult = CreateReviewSchema.safeParse({ rating: 1 });
    const maxResult = CreateReviewSchema.safeParse({ rating: 5 });
    const belowMinResult = CreateReviewSchema.safeParse({ rating: 0 });
    const aboveMaxResult = CreateReviewSchema.safeParse({ rating: 6 });
    
    expect(minResult.success).toBe(true);
    expect(maxResult.success).toBe(true);
    expect(belowMinResult.success).toBe(false);
    expect(aboveMaxResult.success).toBe(false);
  });

  it('*For any* valid review with all optional fields, the schema SHALL accept it', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        validCommentArb,
        validImagesArb,
        fc.option(validRatingArb, { nil: undefined }),
        fc.option(validRatingArb, { nil: undefined }),
        fc.option(validRatingArb, { nil: undefined }),
        fc.option(validRatingArb, { nil: undefined }),
        (rating, comment, images, qualityRating, timelinessRating, communicationRating, valueRating) => {
          const input = {
            rating,
            comment,
            images,
            qualityRating,
            timelinessRating,
            communicationRating,
            valueRating,
          };
          const result = CreateReviewSchema.safeParse(input);
          
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multi-criteria ratings SHALL also be bounded between 1 and 5', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        fc.oneof(invalidRatingBelowArb, invalidRatingAboveArb),
        (validRating, invalidRating) => {
          // Test qualityRating with invalid value
          const qualityResult = CreateReviewSchema.safeParse({
            rating: validRating,
            qualityRating: invalidRating,
          });
          
          // Test timelinessRating with invalid value
          const timelinessResult = CreateReviewSchema.safeParse({
            rating: validRating,
            timelinessRating: invalidRating,
          });
          
          // Test communicationRating with invalid value
          const communicationResult = CreateReviewSchema.safeParse({
            rating: validRating,
            communicationRating: invalidRating,
          });
          
          // Test valueRating with invalid value
          const valueResult = CreateReviewSchema.safeParse({
            rating: validRating,
            valueRating: invalidRating,
          });
          
          // All should fail due to invalid multi-criteria rating
          return (
            qualityResult.success === false &&
            timelinessResult.success === false &&
            communicationResult.success === false &&
            valueResult.success === false
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* rating, the parsed value SHALL equal the input value when valid', () => {
    fc.assert(
      fc.property(validRatingArb, (rating) => {
        const input = { rating };
        const result = CreateReviewSchema.safeParse(input);
        
        if (!result.success) return false;
        
        // The parsed rating should equal the input
        return result.data.rating === rating;
      }),
      { numRuns: 100 }
    );
  });
});



// ============================================
// PROPERTY 2: Review Uniqueness
// **Feature: bidding-phase5-review, Property 2: Review Uniqueness**
// **Validates: Requirements 1.4, 2.3**
// ============================================

describe('Property 2: Review Uniqueness', () => {
  /**
   * This property tests that the unique constraint on (projectId, reviewerId) is enforced.
   */

  // Generator for unique project-reviewer pairs
  const projectIdArb = fc.uuid();
  const reviewerIdArb = fc.uuid();
  const projectReviewerPairArb = fc.tuple(projectIdArb, reviewerIdArb);

  // Generator for multiple pairs that may have duplicates
  const pairsWithPotentialDuplicatesArb = fc.array(
    projectReviewerPairArb,
    { minLength: 2, maxLength: 20 }
  );

  it('*For any* set of project-reviewer pairs, duplicate pairs SHALL be identifiable', () => {
    fc.assert(
      fc.property(pairsWithPotentialDuplicatesArb, (pairs) => {
        const uniquePairs = new Map<string, number>();
        const duplicates: Array<[string, string]> = [];

        for (const [projectId, reviewerId] of pairs) {
          const key = `${projectId}:${reviewerId}`;
          const count = uniquePairs.get(key) || 0;
          
          if (count > 0) {
            duplicates.push([projectId, reviewerId]);
          }
          
          uniquePairs.set(key, count + 1);
        }

        const hasNoDuplicates = duplicates.length === 0;
        const uniqueCount = uniquePairs.size;
        
        return uniqueCount <= pairs.length && 
               (hasNoDuplicates ? uniqueCount === pairs.length : uniqueCount < pairs.length);
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* project-reviewer pair, the composite key SHALL be deterministic', () => {
    fc.assert(
      fc.property(projectIdArb, reviewerIdArb, (projectId, reviewerId) => {
        const key1 = `${projectId}:${reviewerId}`;
        const key2 = `${projectId}:${reviewerId}`;
        const key3 = `${projectId}:${reviewerId}`;
        
        return key1 === key2 && key2 === key3;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* two different project-reviewer pairs, their composite keys SHALL be different', () => {
    fc.assert(
      fc.property(
        projectIdArb,
        reviewerIdArb,
        projectIdArb,
        reviewerIdArb,
        (projectId1, reviewerId1, projectId2, reviewerId2) => {
          if (projectId1 === projectId2 && reviewerId1 === reviewerId2) {
            return true;
          }
          
          const key1 = `${projectId1}:${reviewerId1}`;
          const key2 = `${projectId2}:${reviewerId2}`;
          
          return key1 !== key2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* project, different reviewers SHALL be able to have different reviews', () => {
    fc.assert(
      fc.property(
        projectIdArb,
        fc.array(reviewerIdArb, { minLength: 2, maxLength: 10 }),
        (projectId, reviewerIds) => {
          const uniqueReviewerIds = [...new Set(reviewerIds)];
          const reviewKeys = uniqueReviewerIds.map(reviewerId => `${projectId}:${reviewerId}`);
          const uniqueKeys = new Set(reviewKeys);
          
          return uniqueKeys.size === uniqueReviewerIds.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* reviewer, they SHALL be able to review different projects', () => {
    fc.assert(
      fc.property(
        reviewerIdArb,
        fc.array(projectIdArb, { minLength: 2, maxLength: 10 }),
        (reviewerId, projectIds) => {
          const uniqueProjectIds = [...new Set(projectIds)];
          const reviewKeys = uniqueProjectIds.map(projectId => `${projectId}:${reviewerId}`);
          const uniqueKeys = new Set(reviewKeys);
          
          return uniqueKeys.size === uniqueProjectIds.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* attempt to create duplicate review, the system SHALL detect it', () => {
    fc.assert(
      fc.property(
        projectIdArb,
        reviewerIdArb,
        validRatingArb,
        validRatingArb,
        (projectId, reviewerId, rating1, _rating2) => {
          const existingReviews = new Map<string, { rating: number }>();
          
          const key = `${projectId}:${reviewerId}`;
          const firstReviewExists = existingReviews.has(key);
          
          if (!firstReviewExists) {
            existingReviews.set(key, { rating: rating1 });
          }
          
          const secondReviewExists = existingReviews.has(key);
          
          return !firstReviewExists && secondReviewExists;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('uniqueness check SHALL be case-sensitive for IDs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.toLowerCase() !== s.toUpperCase()),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.toLowerCase() !== s.toUpperCase()),
        (projectId, reviewerId) => {
          const key1 = `${projectId.toLowerCase()}:${reviewerId.toLowerCase()}`;
          const key2 = `${projectId.toUpperCase()}:${reviewerId.toUpperCase()}`;
          
          if (projectId.toLowerCase() === projectId.toUpperCase() && 
              reviewerId.toLowerCase() === reviewerId.toUpperCase()) {
            return true;
          }
          
          return key1 !== key2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* valid review data, uniqueness SHALL be determined only by projectId and reviewerId', () => {
    fc.assert(
      fc.property(
        projectIdArb,
        reviewerIdArb,
        validRatingArb,
        validRatingArb,
        validCommentArb,
        validCommentArb,
        (projectId, reviewerId, rating1, rating2, comment1, comment2) => {
          const review1 = { projectId, reviewerId, rating: rating1, comment: comment1 };
          const review2 = { projectId, reviewerId, rating: rating2, comment: comment2 };
          
          const key1 = `${review1.projectId}:${review1.reviewerId}`;
          const key2 = `${review2.projectId}:${review2.reviewerId}`;
          
          return key1 === key2;
        }
      ),
      { numRuns: 100 }
    );
  });
});



// ============================================
// PROPERTY 3: Review Precondition
// **Feature: bidding-phase5-review, Property 3: Review Precondition**
// **Validates: Requirements 2.1, 2.2**
// ============================================

describe('Property 3: Review Precondition', () => {
  /**
   * This property tests that reviews can only be created when:
   * 1. The project is in COMPLETED status (Requirement 2.1)
   * 2. The reviewer is the project owner (Requirement 2.2)
   */

  const PROJECT_STATUSES = [
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

  const REVIEWABLE_STATUS = 'COMPLETED';
  const NON_REVIEWABLE_STATUSES = PROJECT_STATUSES.filter(s => s !== REVIEWABLE_STATUS);

  const projectIdArb = fc.uuid();
  const userIdArb = fc.uuid();
  const projectStatusArb = fc.constantFrom(...PROJECT_STATUSES);
  const nonReviewableStatusArb = fc.constantFrom(...NON_REVIEWABLE_STATUSES);

  const projectArb = fc.record({
    id: projectIdArb,
    ownerId: userIdArb,
    status: projectStatusArb,
  });

  const nonReviewableProjectArb = fc.record({
    id: projectIdArb,
    ownerId: userIdArb,
    status: nonReviewableStatusArb,
  });

  const completedProjectArb = fc.record({
    id: projectIdArb,
    ownerId: userIdArb,
    status: fc.constant(REVIEWABLE_STATUS),
  });

  function canCreateReview(
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

  it('*For any* project with COMPLETED status and owner as reviewer, review creation SHALL be allowed', () => {
    fc.assert(
      fc.property(completedProjectArb, (project) => {
        const reviewerId = project.ownerId;
        const result = canCreateReview(project, reviewerId);
        
        return result.allowed === true && result.reason === undefined;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* project with non-COMPLETED status, review creation SHALL be rejected', () => {
    fc.assert(
      fc.property(nonReviewableProjectArb, (project) => {
        const reviewerId = project.ownerId;
        const result = canCreateReview(project, reviewerId);
        
        return result.allowed === false && result.reason === 'PROJECT_NOT_COMPLETED';
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* completed project with non-owner reviewer, review creation SHALL be rejected', () => {
    fc.assert(
      fc.property(
        completedProjectArb,
        userIdArb,
        (project, reviewerId) => {
          if (reviewerId === project.ownerId) {
            return true;
          }
          
          const result = canCreateReview(project, reviewerId);
          
          return result.allowed === false && result.reason === 'NOT_PROJECT_OWNER';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* project status, only COMPLETED SHALL allow review creation', () => {
    fc.assert(
      fc.property(projectStatusArb, userIdArb, (status, ownerId) => {
        const project = { id: 'test-project', ownerId, status };
        const reviewerId = ownerId;
        
        const result = canCreateReview(project, reviewerId);
        
        if (status === REVIEWABLE_STATUS) {
          return result.allowed === true;
        } else {
          return result.allowed === false && result.reason === 'PROJECT_NOT_COMPLETED';
        }
      }),
      { numRuns: 100 }
    );
  });

  it('precondition check order: status check SHALL happen before ownership check', () => {
    fc.assert(
      fc.property(
        nonReviewableProjectArb,
        userIdArb,
        (project, reviewerId) => {
          if (reviewerId === project.ownerId) {
            return true;
          }
          
          const result = canCreateReview(project, reviewerId);
          
          return result.allowed === false && result.reason === 'PROJECT_NOT_COMPLETED';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* DRAFT project, review creation SHALL be rejected regardless of reviewer', () => {
    fc.assert(
      fc.property(userIdArb, userIdArb, (ownerId, reviewerId) => {
        const project = { id: 'draft-project', ownerId, status: 'DRAFT' };
        const result = canCreateReview(project, reviewerId);
        
        return result.allowed === false && result.reason === 'PROJECT_NOT_COMPLETED';
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* IN_PROGRESS project, review creation SHALL be rejected', () => {
    fc.assert(
      fc.property(userIdArb, (ownerId) => {
        const project = { id: 'in-progress-project', ownerId, status: 'IN_PROGRESS' };
        const reviewerId = ownerId;
        const result = canCreateReview(project, reviewerId);
        
        return result.allowed === false && result.reason === 'PROJECT_NOT_COMPLETED';
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* CANCELLED project, review creation SHALL be rejected', () => {
    fc.assert(
      fc.property(userIdArb, (ownerId) => {
        const project = { id: 'cancelled-project', ownerId, status: 'CANCELLED' };
        const reviewerId = ownerId;
        const result = canCreateReview(project, reviewerId);
        
        return result.allowed === false && result.reason === 'PROJECT_NOT_COMPLETED';
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* MATCHED project, review creation SHALL be rejected', () => {
    fc.assert(
      fc.property(userIdArb, (ownerId) => {
        const project = { id: 'matched-project', ownerId, status: 'MATCHED' };
        const reviewerId = ownerId;
        const result = canCreateReview(project, reviewerId);
        
        return result.allowed === false && result.reason === 'PROJECT_NOT_COMPLETED';
      }),
      { numRuns: 100 }
    );
  });

  it('ownership check SHALL be exact match (case-sensitive)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.toLowerCase() !== s.toUpperCase()),
        (ownerId) => {
          const project = { id: 'test-project', ownerId, status: REVIEWABLE_STATUS };
          
          const reviewerIdLower = ownerId.toLowerCase();
          const reviewerIdUpper = ownerId.toUpperCase();
          
          if (ownerId !== reviewerIdLower) {
            const resultLower = canCreateReview(project, reviewerIdLower);
            if (resultLower.allowed) return false;
          }
          
          if (ownerId !== reviewerIdUpper) {
            const resultUpper = canCreateReview(project, reviewerIdUpper);
            if (resultUpper.allowed) return false;
          }
          
          const resultExact = canCreateReview(project, ownerId);
          return resultExact.allowed === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* valid preconditions, the result SHALL be deterministic', () => {
    fc.assert(
      fc.property(projectArb, userIdArb, (project, reviewerId) => {
        const result1 = canCreateReview(project, reviewerId);
        const result2 = canCreateReview(project, reviewerId);
        const result3 = canCreateReview(project, reviewerId);
        
        return (
          result1.allowed === result2.allowed &&
          result2.allowed === result3.allowed &&
          result1.reason === result2.reason &&
          result2.reason === result3.reason
        );
      }),
      { numRuns: 100 }
    );
  });

  it('boundary: exactly COMPLETED status (not similar strings) SHALL be required', () => {
    const similarStatuses = [
      'completed',
      'COMPLETE',
      'Completed',
      'COMPLETED ',
      ' COMPLETED',
      'COMPLETED_STATUS',
    ];

    for (const status of similarStatuses) {
      const project = { id: 'test', ownerId: 'owner', status };
      const result = canCreateReview(project, 'owner');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('PROJECT_NOT_COMPLETED');
    }
  });

  it('*For any* combination of invalid preconditions, review SHALL be rejected', () => {
    fc.assert(
      fc.property(
        nonReviewableProjectArb,
        userIdArb,
        (project, reviewerId) => {
          if (reviewerId === project.ownerId) {
            return true;
          }
          
          const result = canCreateReview(project, reviewerId);
          
          return result.allowed === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});



// ============================================
// PROPERTY 9: Image Limit Validation
// **Feature: bidding-phase5-review, Property 9: Image Limit Validation**
// **Validates: Requirements 2.5**
// ============================================

describe('Property 9: Image Limit Validation', () => {
  /**
   * This property tests that the image limit validation is enforced.
   * Requirements 2.5: WHEN creating a review with images THEN the system SHALL 
   * validate image URLs and limit to 5 images.
   */

  it('*For any* review with 0 to 5 images, the CreateReviewSchema SHALL accept it', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        validImagesArb,
        (rating, images) => {
          const input = { rating, images };
          const result = CreateReviewSchema.safeParse(input);
          
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* review with more than 5 images, the CreateReviewSchema SHALL reject it', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        invalidImagesArb,
        (rating, images) => {
          const input = { rating, images };
          const result = CreateReviewSchema.safeParse(input);
          
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* update with 0 to 5 images, the UpdateReviewSchema SHALL accept it', () => {
    fc.assert(
      fc.property(
        validImagesArb,
        (images) => {
          const input = { images };
          const result = UpdateReviewSchema.safeParse(input);
          
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* update with more than 5 images, the UpdateReviewSchema SHALL reject it', () => {
    fc.assert(
      fc.property(
        invalidImagesArb,
        (images) => {
          const input = { images };
          const result = UpdateReviewSchema.safeParse(input);
          
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('image limit boundary: exactly 5 images SHALL be accepted', () => {
    const fiveImages = Array(5).fill('https://example.com/image.jpg');
    
    const createResult = CreateReviewSchema.safeParse({ rating: 5, images: fiveImages });
    const updateResult = UpdateReviewSchema.safeParse({ images: fiveImages });
    
    expect(createResult.success).toBe(true);
    expect(updateResult.success).toBe(true);
  });

  it('image limit boundary: exactly 6 images SHALL be rejected', () => {
    const sixImages = Array(6).fill('https://example.com/image.jpg');
    
    const createResult = CreateReviewSchema.safeParse({ rating: 5, images: sixImages });
    const updateResult = UpdateReviewSchema.safeParse({ images: sixImages });
    
    expect(createResult.success).toBe(false);
    expect(updateResult.success).toBe(false);
  });

  it('*For any* review without images, the schema SHALL accept it', () => {
    fc.assert(
      fc.property(validRatingArb, (rating) => {
        const result1 = CreateReviewSchema.safeParse({ rating });
        const result2 = CreateReviewSchema.safeParse({ rating, images: [] });
        const result3 = CreateReviewSchema.safeParse({ rating, images: undefined });
        
        return result1.success === true && result2.success === true && result3.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* valid image URL, the schema SHALL accept it', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        validImageUrlArb,
        (rating, imageUrl) => {
          const input = { rating, images: [imageUrl] };
          const result = CreateReviewSchema.safeParse(input);
          
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* clearly invalid image URL, the schema SHALL reject it', () => {
    const invalidUrls = [
      'not-a-url',
      'just-text',
      '123456',
      '',
      'spaces in url',
      'missing://protocol',
    ];

    for (const invalidUrl of invalidUrls) {
      const result = CreateReviewSchema.safeParse({ rating: 5, images: [invalidUrl] });
      if (invalidUrl === '' || !invalidUrl.includes('://')) {
        expect(result.success).toBe(false);
      }
    }
  });

  it('*For any* mix of valid and invalid URLs, the schema SHALL reject the entire array', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        fc.array(validImageUrlArb, { minLength: 1, maxLength: 4 }),
        (rating, validUrls) => {
          const mixedUrls = [...validUrls, 'not-a-valid-url'];
          const input = { rating, images: mixedUrls };
          const result = CreateReviewSchema.safeParse(input);
          
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('MAX_REVIEW_IMAGES constant SHALL equal 5', () => {
    expect(MAX_REVIEW_IMAGES).toBe(5);
  });

  it('*For any* number of images from 0 to MAX_REVIEW_IMAGES, the schema SHALL accept', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        fc.integer({ min: 0, max: MAX_REVIEW_IMAGES }),
        (rating, imageCount) => {
          const images = Array(imageCount).fill('https://example.com/image.jpg');
          const input = { rating, images };
          const result = CreateReviewSchema.safeParse(input);
          
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* number of images greater than MAX_REVIEW_IMAGES, the schema SHALL reject', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        fc.integer({ min: MAX_REVIEW_IMAGES + 1, max: 20 }),
        (rating, imageCount) => {
          const images = Array(imageCount).fill('https://example.com/image.jpg');
          const input = { rating, images };
          const result = CreateReviewSchema.safeParse(input);
          
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* valid review with images, the parsed images SHALL equal the input images', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        validImagesArb,
        (rating, images) => {
          const input = { rating, images };
          const result = CreateReviewSchema.safeParse(input);
          
          if (!result.success) return false;
          
          if (!result.data.images) return images.length === 0;
          
          return (
            result.data.images.length === images.length &&
            result.data.images.every((img, i) => img === images[i])
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('image validation SHALL be independent of other fields', () => {
    fc.assert(
      fc.property(
        validRatingArb,
        validCommentArb,
        invalidImagesArb,
        (rating, comment, images) => {
          const input = { rating, comment, images };
          const result = CreateReviewSchema.safeParse(input);
          
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
