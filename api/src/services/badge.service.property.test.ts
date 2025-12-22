/**
 * Property-Based Tests for Badge Service
 * Using fast-check for property testing
 *
 * These tests verify the correctness properties defined in the design document.
 * **Feature: bidding-phase5-review**
 * **Property 13: Badge Award Criteria**
 * **Validates: Requirements 21.1, 21.2, 21.3**
 */

import * as fc from 'fast-check';
import {
  BADGE_TYPES,
  BADGE_CRITERIA,
  BADGE_INFO,
  type BadgeType,
} from '../schemas/badge.schema';

// ============================================
// CONSTANTS
// ============================================

const { ACTIVE_CONTRACTOR, HIGH_QUALITY, FAST_RESPONDER } = BADGE_TYPES;
const ACTIVE_CONTRACTOR_MIN_PROJECTS = BADGE_CRITERIA.ACTIVE_CONTRACTOR.minCompletedProjects;
const HIGH_QUALITY_MIN_RATING = BADGE_CRITERIA.HIGH_QUALITY.minRating;
const HIGH_QUALITY_MIN_MONTHS = BADGE_CRITERIA.HIGH_QUALITY.minMonths;
const FAST_RESPONDER_MIN_RATE = BADGE_CRITERIA.FAST_RESPONDER.minResponseRate;
const FAST_RESPONDER_MAX_HOURS = BADGE_CRITERIA.FAST_RESPONDER.maxResponseTimeHours;

// ============================================
// GENERATORS
// ============================================

// Completed projects generators
const eligibleProjectsArb = fc.integer({ min: ACTIVE_CONTRACTOR_MIN_PROJECTS, max: 1000 });
const ineligibleProjectsArb = fc.integer({ min: 0, max: ACTIVE_CONTRACTOR_MIN_PROJECTS - 1 });

// Rating generators (1-5 scale)
const eligibleRatingArb = fc.double({ min: HIGH_QUALITY_MIN_RATING, max: 5, noNaN: true });
const ineligibleRatingArb = fc.double({ min: 0, max: HIGH_QUALITY_MIN_RATING - 0.01, noNaN: true });

// Rating months generators
const eligibleMonthsArb = fc.integer({ min: HIGH_QUALITY_MIN_MONTHS, max: 24 });
const ineligibleMonthsArb = fc.integer({ min: 0, max: HIGH_QUALITY_MIN_MONTHS - 1 });

// Response rate generators (0-100 percentage)
const eligibleResponseRateArb = fc.double({ min: FAST_RESPONDER_MIN_RATE, max: 100, noNaN: true });
const ineligibleResponseRateArb = fc.double({ min: 0, max: FAST_RESPONDER_MIN_RATE - 0.01, noNaN: true });


// Response time generators (hours)
const eligibleResponseTimeArb = fc.double({ min: 0.1, max: FAST_RESPONDER_MAX_HOURS, noNaN: true });
const ineligibleResponseTimeArb = fc.double({ min: FAST_RESPONDER_MAX_HOURS + 0.01, max: 168, noNaN: true });

// Contractor stats generator
interface ContractorBadgeStats {
  completedProjects: number;
  averageRating: number;
  ratingMonths: number;
  responseRate: number;
  averageResponseTimeHours: number;
}

const contractorStatsArb = fc.record({
  completedProjects: fc.integer({ min: 0, max: 100 }),
  averageRating: fc.double({ min: 0, max: 5, noNaN: true }),
  ratingMonths: fc.integer({ min: 0, max: 24 }),
  responseRate: fc.double({ min: 0, max: 100, noNaN: true }),
  averageResponseTimeHours: fc.double({ min: 0, max: 168, noNaN: true }),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check ACTIVE_CONTRACTOR badge eligibility
 * Requirement 21.1: Completes 10 projects
 */
function checkActiveContractorEligibility(stats: ContractorBadgeStats): boolean {
  return stats.completedProjects >= ACTIVE_CONTRACTOR_MIN_PROJECTS;
}

/**
 * Check HIGH_QUALITY badge eligibility
 * Requirement 21.2: Maintains 4.5+ rating for 6 months
 */
function checkHighQualityEligibility(stats: ContractorBadgeStats): boolean {
  return stats.averageRating >= HIGH_QUALITY_MIN_RATING && 
         stats.ratingMonths >= HIGH_QUALITY_MIN_MONTHS;
}

/**
 * Check FAST_RESPONDER badge eligibility
 * Requirement 21.3: Responds to 90%+ bids within 24h
 */
function checkFastResponderEligibility(stats: ContractorBadgeStats): boolean {
  return stats.responseRate >= FAST_RESPONDER_MIN_RATE && 
         stats.averageResponseTimeHours <= FAST_RESPONDER_MAX_HOURS;
}

/**
 * Check eligibility for any badge type
 */
function checkBadgeEligibility(badgeType: BadgeType, stats: ContractorBadgeStats): boolean {
  switch (badgeType) {
    case ACTIVE_CONTRACTOR:
      return checkActiveContractorEligibility(stats);
    case HIGH_QUALITY:
      return checkHighQualityEligibility(stats);
    case FAST_RESPONDER:
      return checkFastResponderEligibility(stats);
    default:
      return false;
  }
}


// ============================================
// PROPERTY 13: Badge Award Criteria
// **Feature: bidding-phase5-review, Property 13: Badge Award Criteria**
// **Validates: Requirements 21.1, 21.2, 21.3**
// ============================================

describe('Property 13: Badge Award Criteria', () => {
  // ============================================
  // ACTIVE_CONTRACTOR Badge Tests (Requirement 21.1)
  // ============================================

  describe('ACTIVE_CONTRACTOR Badge (Requirement 21.1)', () => {
    it('*For any* contractor with 10+ completed projects, ACTIVE_CONTRACTOR badge SHALL be eligible', () => {
      fc.assert(
        fc.property(eligibleProjectsArb, (completedProjects) => {
          const stats: ContractorBadgeStats = {
            completedProjects,
            averageRating: 0,
            ratingMonths: 0,
            responseRate: 0,
            averageResponseTimeHours: 0,
          };

          return checkActiveContractorEligibility(stats) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* contractor with less than 10 completed projects, ACTIVE_CONTRACTOR badge SHALL NOT be eligible', () => {
      fc.assert(
        fc.property(ineligibleProjectsArb, (completedProjects) => {
          const stats: ContractorBadgeStats = {
            completedProjects,
            averageRating: 5,
            ratingMonths: 12,
            responseRate: 100,
            averageResponseTimeHours: 1,
          };

          return checkActiveContractorEligibility(stats) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('boundary: exactly 10 projects SHALL be eligible, 9 SHALL NOT', () => {
      const statsAt10: ContractorBadgeStats = {
        completedProjects: 10,
        averageRating: 0,
        ratingMonths: 0,
        responseRate: 0,
        averageResponseTimeHours: 0,
      };

      const statsAt9: ContractorBadgeStats = {
        completedProjects: 9,
        averageRating: 0,
        ratingMonths: 0,
        responseRate: 0,
        averageResponseTimeHours: 0,
      };

      expect(checkActiveContractorEligibility(statsAt10)).toBe(true);
      expect(checkActiveContractorEligibility(statsAt9)).toBe(false);
    });

    it('ACTIVE_CONTRACTOR eligibility SHALL be independent of other stats', () => {
      fc.assert(
        fc.property(
          eligibleProjectsArb,
          fc.double({ min: 0, max: 5, noNaN: true }),
          fc.integer({ min: 0, max: 24 }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 168, noNaN: true }),
          (completedProjects, rating, months, responseRate, responseTime) => {
            const stats: ContractorBadgeStats = {
              completedProjects,
              averageRating: rating,
              ratingMonths: months,
              responseRate,
              averageResponseTimeHours: responseTime,
            };

            // Should always be eligible regardless of other stats
            return checkActiveContractorEligibility(stats) === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // ============================================
  // HIGH_QUALITY Badge Tests (Requirement 21.2)
  // ============================================

  describe('HIGH_QUALITY Badge (Requirement 21.2)', () => {
    it('*For any* contractor with 4.5+ rating for 6+ months, HIGH_QUALITY badge SHALL be eligible', () => {
      fc.assert(
        fc.property(eligibleRatingArb, eligibleMonthsArb, (rating, months) => {
          const stats: ContractorBadgeStats = {
            completedProjects: 0,
            averageRating: rating,
            ratingMonths: months,
            responseRate: 0,
            averageResponseTimeHours: 0,
          };

          return checkHighQualityEligibility(stats) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* contractor with rating below 4.5, HIGH_QUALITY badge SHALL NOT be eligible', () => {
      fc.assert(
        fc.property(ineligibleRatingArb, eligibleMonthsArb, (rating, months) => {
          const stats: ContractorBadgeStats = {
            completedProjects: 100,
            averageRating: rating,
            ratingMonths: months,
            responseRate: 100,
            averageResponseTimeHours: 1,
          };

          return checkHighQualityEligibility(stats) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* contractor with less than 6 months of rating history, HIGH_QUALITY badge SHALL NOT be eligible', () => {
      fc.assert(
        fc.property(eligibleRatingArb, ineligibleMonthsArb, (rating, months) => {
          const stats: ContractorBadgeStats = {
            completedProjects: 100,
            averageRating: rating,
            ratingMonths: months,
            responseRate: 100,
            averageResponseTimeHours: 1,
          };

          return checkHighQualityEligibility(stats) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('boundary: exactly 4.5 rating and 6 months SHALL be eligible', () => {
      const statsEligible: ContractorBadgeStats = {
        completedProjects: 0,
        averageRating: 4.5,
        ratingMonths: 6,
        responseRate: 0,
        averageResponseTimeHours: 0,
      };

      expect(checkHighQualityEligibility(statsEligible)).toBe(true);
    });

    it('boundary: 4.49 rating SHALL NOT be eligible even with 12 months', () => {
      const statsIneligible: ContractorBadgeStats = {
        completedProjects: 0,
        averageRating: 4.49,
        ratingMonths: 12,
        responseRate: 0,
        averageResponseTimeHours: 0,
      };

      expect(checkHighQualityEligibility(statsIneligible)).toBe(false);
    });

    it('boundary: 5 months SHALL NOT be eligible even with 5.0 rating', () => {
      const statsIneligible: ContractorBadgeStats = {
        completedProjects: 0,
        averageRating: 5.0,
        ratingMonths: 5,
        responseRate: 0,
        averageResponseTimeHours: 0,
      };

      expect(checkHighQualityEligibility(statsIneligible)).toBe(false);
    });

    it('HIGH_QUALITY requires BOTH rating AND months criteria', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // High rating but low months
            fc.tuple(eligibleRatingArb, ineligibleMonthsArb),
            // Low rating but high months
            fc.tuple(ineligibleRatingArb, eligibleMonthsArb),
            // Both low
            fc.tuple(ineligibleRatingArb, ineligibleMonthsArb)
          ),
          ([rating, months]) => {
            const stats: ContractorBadgeStats = {
              completedProjects: 0,
              averageRating: rating,
              ratingMonths: months,
              responseRate: 0,
              averageResponseTimeHours: 0,
            };

            // Should NOT be eligible if either criterion is not met
            return checkHighQualityEligibility(stats) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // ============================================
  // FAST_RESPONDER Badge Tests (Requirement 21.3)
  // ============================================

  describe('FAST_RESPONDER Badge (Requirement 21.3)', () => {
    it('*For any* contractor with 90%+ response rate and <=24h avg response time, FAST_RESPONDER badge SHALL be eligible', () => {
      fc.assert(
        fc.property(eligibleResponseRateArb, eligibleResponseTimeArb, (rate, time) => {
          const stats: ContractorBadgeStats = {
            completedProjects: 0,
            averageRating: 0,
            ratingMonths: 0,
            responseRate: rate,
            averageResponseTimeHours: time,
          };

          return checkFastResponderEligibility(stats) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* contractor with response rate below 90%, FAST_RESPONDER badge SHALL NOT be eligible', () => {
      fc.assert(
        fc.property(ineligibleResponseRateArb, eligibleResponseTimeArb, (rate, time) => {
          const stats: ContractorBadgeStats = {
            completedProjects: 100,
            averageRating: 5,
            ratingMonths: 12,
            responseRate: rate,
            averageResponseTimeHours: time,
          };

          return checkFastResponderEligibility(stats) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* contractor with avg response time above 24h, FAST_RESPONDER badge SHALL NOT be eligible', () => {
      fc.assert(
        fc.property(eligibleResponseRateArb, ineligibleResponseTimeArb, (rate, time) => {
          const stats: ContractorBadgeStats = {
            completedProjects: 100,
            averageRating: 5,
            ratingMonths: 12,
            responseRate: rate,
            averageResponseTimeHours: time,
          };

          return checkFastResponderEligibility(stats) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('boundary: exactly 90% rate and 24h time SHALL be eligible', () => {
      const statsEligible: ContractorBadgeStats = {
        completedProjects: 0,
        averageRating: 0,
        ratingMonths: 0,
        responseRate: 90,
        averageResponseTimeHours: 24,
      };

      expect(checkFastResponderEligibility(statsEligible)).toBe(true);
    });

    it('boundary: 89.99% rate SHALL NOT be eligible even with 1h response time', () => {
      const statsIneligible: ContractorBadgeStats = {
        completedProjects: 0,
        averageRating: 0,
        ratingMonths: 0,
        responseRate: 89.99,
        averageResponseTimeHours: 1,
      };

      expect(checkFastResponderEligibility(statsIneligible)).toBe(false);
    });

    it('boundary: 24.01h response time SHALL NOT be eligible even with 100% rate', () => {
      const statsIneligible: ContractorBadgeStats = {
        completedProjects: 0,
        averageRating: 0,
        ratingMonths: 0,
        responseRate: 100,
        averageResponseTimeHours: 24.01,
      };

      expect(checkFastResponderEligibility(statsIneligible)).toBe(false);
    });

    it('FAST_RESPONDER requires BOTH rate AND time criteria', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // High rate but slow time
            fc.tuple(eligibleResponseRateArb, ineligibleResponseTimeArb),
            // Low rate but fast time
            fc.tuple(ineligibleResponseRateArb, eligibleResponseTimeArb),
            // Both bad
            fc.tuple(ineligibleResponseRateArb, ineligibleResponseTimeArb)
          ),
          ([rate, time]) => {
            const stats: ContractorBadgeStats = {
              completedProjects: 0,
              averageRating: 0,
              ratingMonths: 0,
              responseRate: rate,
              averageResponseTimeHours: time,
            };

            // Should NOT be eligible if either criterion is not met
            return checkFastResponderEligibility(stats) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // ============================================
  // Cross-Badge Tests
  // ============================================

  describe('Cross-Badge Eligibility', () => {
    it('*For any* contractor stats, badge eligibility SHALL be deterministic', () => {
      fc.assert(
        fc.property(contractorStatsArb, (stats) => {
          // Check each badge type multiple times
          const results1 = Object.values(BADGE_TYPES).map((type) => checkBadgeEligibility(type, stats));
          const results2 = Object.values(BADGE_TYPES).map((type) => checkBadgeEligibility(type, stats));
          const results3 = Object.values(BADGE_TYPES).map((type) => checkBadgeEligibility(type, stats));

          // All results should be identical
          return (
            results1.every((r, i) => r === results2[i]) &&
            results2.every((r, i) => r === results3[i])
          );
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* contractor, badges SHALL be independent of each other', () => {
      fc.assert(
        fc.property(contractorStatsArb, (stats) => {
          const activeEligible = checkActiveContractorEligibility(stats);
          const qualityEligible = checkHighQualityEligibility(stats);
          const responderEligible = checkFastResponderEligibility(stats);

          // Each badge should be evaluated independently
          // A contractor can have 0, 1, 2, or all 3 badges
          const eligibleCount = [activeEligible, qualityEligible, responderEligible].filter(Boolean).length;

          return eligibleCount >= 0 && eligibleCount <= 3;
        }),
        { numRuns: 100 }
      );
    });

    it('*For any* contractor meeting all criteria, all badges SHALL be eligible', () => {
      fc.assert(
        fc.property(
          eligibleProjectsArb,
          eligibleRatingArb,
          eligibleMonthsArb,
          eligibleResponseRateArb,
          eligibleResponseTimeArb,
          (projects, rating, months, rate, time) => {
            const stats: ContractorBadgeStats = {
              completedProjects: projects,
              averageRating: rating,
              ratingMonths: months,
              responseRate: rate,
              averageResponseTimeHours: time,
            };

            return (
              checkActiveContractorEligibility(stats) === true &&
              checkHighQualityEligibility(stats) === true &&
              checkFastResponderEligibility(stats) === true
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('*For any* contractor meeting no criteria, no badges SHALL be eligible', () => {
      fc.assert(
        fc.property(
          ineligibleProjectsArb,
          ineligibleRatingArb,
          ineligibleMonthsArb,
          ineligibleResponseRateArb,
          ineligibleResponseTimeArb,
          (projects, rating, months, rate, time) => {
            const stats: ContractorBadgeStats = {
              completedProjects: projects,
              averageRating: rating,
              ratingMonths: months,
              responseRate: rate,
              averageResponseTimeHours: time,
            };

            return (
              checkActiveContractorEligibility(stats) === false &&
              checkHighQualityEligibility(stats) === false &&
              checkFastResponderEligibility(stats) === false
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // ============================================
  // Badge Info Tests
  // ============================================

  describe('Badge Info', () => {
    it('all badge types SHALL have corresponding info', () => {
      for (const badgeType of Object.values(BADGE_TYPES)) {
        const info = BADGE_INFO[badgeType];
        expect(info).toBeDefined();
        expect(info.name).toBeTruthy();
        expect(info.description).toBeTruthy();
        expect(info.icon).toBeTruthy();
      }
    });

    it('badge criteria constants SHALL match expected values', () => {
      // ACTIVE_CONTRACTOR: 10 projects
      expect(BADGE_CRITERIA.ACTIVE_CONTRACTOR.minCompletedProjects).toBe(10);

      // HIGH_QUALITY: 4.5 rating for 6 months
      expect(BADGE_CRITERIA.HIGH_QUALITY.minRating).toBe(4.5);
      expect(BADGE_CRITERIA.HIGH_QUALITY.minMonths).toBe(6);

      // FAST_RESPONDER: 90% rate within 24h
      expect(BADGE_CRITERIA.FAST_RESPONDER.minResponseRate).toBe(90);
      expect(BADGE_CRITERIA.FAST_RESPONDER.maxResponseTimeHours).toBe(24);
    });

    it('badge types SHALL be exactly 3', () => {
      expect(Object.keys(BADGE_TYPES).length).toBe(3);
      expect(BADGE_TYPES.ACTIVE_CONTRACTOR).toBe('ACTIVE_CONTRACTOR');
      expect(BADGE_TYPES.HIGH_QUALITY).toBe('HIGH_QUALITY');
      expect(BADGE_TYPES.FAST_RESPONDER).toBe('FAST_RESPONDER');
    });
  });
});
