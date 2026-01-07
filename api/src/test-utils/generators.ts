/**
 * Test Generators for Property-Based Testing
 *
 * Provides fast-check generators for creating random test data.
 * Used for property-based testing to verify business rules.
 *
 * **Feature: api-test-coverage**
 * **Requirements: 1.2, 2.4, 3.3**
 */

import * as fc from 'fast-check';

// ============================================
// STATUS GENERATORS
// ============================================

/**
 * Generator for project statuses
 */
export const projectStatusGen = fc.constantFrom(
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'OPEN',
  'BIDDING_CLOSED',
  'MATCHED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

/**
 * Generator for bid statuses
 */
export const bidStatusGen = fc.constantFrom(
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SELECTED',
  'NOT_SELECTED',
  'WITHDRAWN'
);

/**
 * Generator for escrow statuses
 */
export const escrowStatusGen = fc.constantFrom(
  'PENDING',
  'HELD',
  'PARTIAL_RELEASED',
  'RELEASED',
  'REFUNDED',
  'DISPUTED',
  'CANCELLED'
);

/**
 * Generator for verification statuses
 */
export const verificationStatusGen = fc.constantFrom(
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

/**
 * Generator for user roles
 */
export const roleGen = fc.constantFrom(
  'ADMIN',
  'MANAGER',
  'CONTRACTOR',
  'HOMEOWNER',
  'WORKER',
  'USER'
);

// ============================================
// TRANSITION GENERATORS
// ============================================

/**
 * Valid project status transitions
 */
export const validProjectTransitions: [string, string][] = [
  ['DRAFT', 'PENDING_APPROVAL'],
  ['DRAFT', 'CANCELLED'],
  ['PENDING_APPROVAL', 'OPEN'],
  ['PENDING_APPROVAL', 'REJECTED'],
  ['REJECTED', 'PENDING_APPROVAL'],
  ['REJECTED', 'CANCELLED'],
  ['OPEN', 'BIDDING_CLOSED'],
  ['OPEN', 'CANCELLED'],
  ['BIDDING_CLOSED', 'MATCHED'],
  ['BIDDING_CLOSED', 'OPEN'],
  ['BIDDING_CLOSED', 'CANCELLED'],
  ['MATCHED', 'IN_PROGRESS'],
  ['MATCHED', 'CANCELLED'],
  ['IN_PROGRESS', 'COMPLETED'],
  ['IN_PROGRESS', 'CANCELLED'],
];

/**
 * Invalid project status transitions
 */
export const invalidProjectTransitions: [string, string][] = [
  ['DRAFT', 'OPEN'],
  ['DRAFT', 'COMPLETED'],
  ['DRAFT', 'MATCHED'],
  ['OPEN', 'DRAFT'],
  ['OPEN', 'COMPLETED'],
  ['COMPLETED', 'DRAFT'],
  ['COMPLETED', 'OPEN'],
  ['COMPLETED', 'CANCELLED'],
  ['CANCELLED', 'DRAFT'],
  ['CANCELLED', 'OPEN'],
  ['CANCELLED', 'COMPLETED'],
  ['MATCHED', 'DRAFT'],
  ['MATCHED', 'OPEN'],
  ['IN_PROGRESS', 'DRAFT'],
  ['IN_PROGRESS', 'OPEN'],
];

/**
 * Generator for valid project transitions
 */
export const validProjectTransitionGen = fc.constantFrom(...validProjectTransitions);

/**
 * Generator for invalid project transitions
 */
export const invalidProjectTransitionGen = fc.constantFrom(...invalidProjectTransitions);

/**
 * Valid bid status transitions
 */
export const validBidTransitions: [string, string][] = [
  ['PENDING', 'APPROVED'],
  ['PENDING', 'REJECTED'],
  ['PENDING', 'WITHDRAWN'],
  ['APPROVED', 'SELECTED'],
  ['APPROVED', 'NOT_SELECTED'],
  ['APPROVED', 'WITHDRAWN'],
];

/**
 * Invalid bid status transitions
 */
export const invalidBidTransitions: [string, string][] = [
  ['PENDING', 'SELECTED'],
  ['PENDING', 'NOT_SELECTED'],
  ['REJECTED', 'APPROVED'],
  ['REJECTED', 'SELECTED'],
  ['SELECTED', 'PENDING'],
  ['SELECTED', 'APPROVED'],
  ['NOT_SELECTED', 'SELECTED'],
  ['WITHDRAWN', 'PENDING'],
  ['WITHDRAWN', 'APPROVED'],
];

/**
 * Generator for valid bid transitions
 */
export const validBidTransitionGen = fc.constantFrom(...validBidTransitions);

/**
 * Generator for invalid bid transitions
 */
export const invalidBidTransitionGen = fc.constantFrom(...invalidBidTransitions);

/**
 * Valid escrow status transitions
 */
export const validEscrowTransitions: [string, string][] = [
  ['PENDING', 'HELD'],
  ['PENDING', 'CANCELLED'],
  ['HELD', 'PARTIAL_RELEASED'],
  ['HELD', 'RELEASED'],
  ['HELD', 'REFUNDED'],
  ['HELD', 'DISPUTED'],
  ['PARTIAL_RELEASED', 'RELEASED'],
  ['PARTIAL_RELEASED', 'REFUNDED'],
  ['PARTIAL_RELEASED', 'DISPUTED'],
  ['DISPUTED', 'RELEASED'],
  ['DISPUTED', 'REFUNDED'],
];

/**
 * Generator for valid escrow transitions
 */
export const validEscrowTransitionGen = fc.constantFrom(...validEscrowTransitions);

// ============================================
// VALUE GENERATORS
// ============================================

/**
 * Generator for bid prices (1M - 1B VND)
 */
export const bidPriceGen = fc.integer({ min: 1000000, max: 1000000000 });

/**
 * Generator for escrow percentages (5-20%)
 */
export const escrowPercentageGen = fc.integer({ min: 5, max: 20 });

/**
 * Generator for escrow minimum amounts
 */
export const escrowMinAmountGen = fc.integer({ min: 500000, max: 5000000 });

/**
 * Generator for ratings (1-5)
 */
export const ratingGen = fc.integer({ min: 1, max: 5 });

/**
 * Generator for project areas (10-1000 m²)
 */
export const areaGen = fc.integer({ min: 10, max: 1000 });

/**
 * Generator for experience years (0-50)
 */
export const experienceGen = fc.integer({ min: 0, max: 50 });

/**
 * Generator for response time in hours (1-168)
 */
export const responseTimeGen = fc.integer({ min: 1, max: 168 });

// ============================================
// STRING GENERATORS
// ============================================

/**
 * Generator for project codes (PRJ-YYYY-NNN)
 */
export const projectCodeGen = fc.integer({ min: 2020, max: 2030 }).chain((year) =>
  fc.integer({ min: 1, max: 999 }).map((num) =>
    `PRJ-${year}-${num.toString().padStart(3, '0')}`
  )
);

/**
 * Generator for bid codes (BID-YYYY-NNN)
 */
export const bidCodeGen = fc.integer({ min: 2020, max: 2030 }).chain((year) =>
  fc.integer({ min: 1, max: 999 }).map((num) =>
    `BID-${year}-${num.toString().padStart(3, '0')}`
  )
);

/**
 * Generator for escrow codes (ESC-YYYY-NNN)
 */
export const escrowCodeGen = fc.integer({ min: 2020, max: 2030 }).chain((year) =>
  fc.integer({ min: 1, max: 999 }).map((num) =>
    `ESC-${year}-${num.toString().padStart(3, '0')}`
  )
);

/**
 * Generator for Vietnamese phone numbers
 */
export const phoneGen = fc.integer({ min: 900000000, max: 999999999 }).map(
  (num) => `0${num}`
);

/**
 * Generator for email addresses
 */
export const emailGen = fc.emailAddress();

/**
 * Generator for UUIDs
 */
export const uuidGen = fc.uuid();

/**
 * Generator for non-empty strings
 */
export const nonEmptyStringGen = fc.string({ minLength: 1, maxLength: 100 });

// ============================================
// COMPOSITE GENERATORS
// ============================================

/**
 * Generator for user data
 */
export const userGen = fc.record({
  id: uuidGen,
  email: emailGen,
  name: nonEmptyStringGen,
  phone: phoneGen,
  role: roleGen,
});

/**
 * Generator for project data
 */
export const projectGen = fc.record({
  id: uuidGen,
  code: projectCodeGen,
  title: nonEmptyStringGen,
  description: nonEmptyStringGen,
  area: areaGen,
  budgetMin: bidPriceGen,
  status: projectStatusGen,
});

/**
 * Generator for bid data
 */
export const bidGen = fc.record({
  id: uuidGen,
  code: bidCodeGen,
  price: bidPriceGen,
  timeline: nonEmptyStringGen,
  proposal: nonEmptyStringGen,
  status: bidStatusGen,
});

/**
 * Generator for escrow calculation inputs
 */
export const escrowCalcInputGen = fc.record({
  bidPrice: bidPriceGen,
  escrowPercentage: escrowPercentageGen,
  minAmount: escrowMinAmountGen,
});

/**
 * Generator for ranking score inputs
 */
export const rankingInputGen = fc.record({
  averageRating: fc.float({ min: 1, max: 5, noNaN: true }),
  completedProjects: fc.integer({ min: 0, max: 100 }),
  averageResponseTime: responseTimeGen,
  isVerified: fc.boolean(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate expected escrow amount
 */
export function calculateExpectedEscrow(
  bidPrice: number,
  escrowPercentage: number,
  minAmount: number,
  maxAmount?: number
): number {
  let amount = Math.floor(bidPrice * escrowPercentage / 100);
  amount = Math.max(amount, minAmount);
  if (maxAmount) {
    amount = Math.min(amount, maxAmount);
  }
  return amount;
}

/**
 * Calculate expected ranking score
 */
export function calculateExpectedRankingScore(
  averageRating: number,
  completedProjects: number,
  averageResponseTime: number,
  isVerified: boolean
): number {
  const ratingScore = (averageRating / 5) * 100;
  const projectsScore = Math.min(completedProjects / 10, 1) * 100;
  const responseScore = Math.max(0, 100 - (averageResponseTime / 24) * 10);
  const verificationScore = isVerified ? 100 : 0;

  return (
    ratingScore * 0.4 +
    projectsScore * 0.3 +
    responseScore * 0.15 +
    verificationScore * 0.15
  );
}

/**
 * Check if a project transition is valid
 */
export function isValidProjectTransition(from: string, to: string): boolean {
  return validProjectTransitions.some(
    ([f, t]) => f === from && t === to
  );
}

/**
 * Check if a bid transition is valid
 */
export function isValidBidTransition(from: string, to: string): boolean {
  return validBidTransitions.some(
    ([f, t]) => f === from && t === to
  );
}

/**
 * Check if an escrow transition is valid
 */
export function isValidEscrowTransition(from: string, to: string): boolean {
  return validEscrowTransitions.some(
    ([f, t]) => f === from && t === to
  );
}
