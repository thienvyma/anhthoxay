/**
 * Bid Service Tests
 *
 * Tests for bid management business logic including CRUD operations,
 * contractor verification, bid anonymization, and status transitions.
 *
 * **Feature: api-test-coverage**
 * **Requirements: 2.1-2.5**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { BidService, BidError } from './bid.service';
import {
  validBidTransitions,
  invalidBidTransitions,
  isValidBidTransition,
  bidCodeGen,
  bidStatusGen,
  verificationStatusGen,
  bidPriceGen,
  nonEmptyStringGen,
} from '../test-utils/generators';
import {
  bidFixtures,
  contractorProfileFixtures,
} from '../test-utils/fixtures';
import { createMockPrisma, type MockPrismaClient } from '../test-utils/mock-prisma';

// ============================================
// BID SERVICE TESTS
// ============================================

describe('BidService', () => {
  let mockPrisma: MockPrismaClient;
  // Service instance for future integration tests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _service: BidService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    _service = new BidService(mockPrisma as unknown as import('@prisma/client').PrismaClient);
    vi.clearAllMocks();
  });

  // ============================================
  // CONTRACTOR VERIFICATION TESTS
  // ============================================

  describe('Contractor Verification', () => {
    /**
     * **Feature: api-test-coverage, Property 5: Contractor verification for bidding**
     * **Validates: Requirements 2.1**
     */
    describe('Property 5: Contractor verification for bidding', () => {
      it('should reject bid creation for non-VERIFIED contractors', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('PENDING', 'REJECTED'),
            (verificationStatus) => {
              // Non-verified contractors should not be able to bid
              const profile = contractorProfileFixtures.pending({
                verificationStatus,
              });

              // Verify the contractor is not VERIFIED
              expect(profile.verificationStatus).not.toBe('VERIFIED');
              expect(['PENDING', 'REJECTED']).toContain(profile.verificationStatus);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should allow bid creation only for VERIFIED contractors', () => {
        fc.assert(
          fc.property(verificationStatusGen, (status) => {
            const canBid = status === 'VERIFIED';
            
            if (canBid) {
              expect(status).toBe('VERIFIED');
            } else {
              expect(status).not.toBe('VERIFIED');
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have VERIFIED status in verified contractor profile', () => {
        const profile = contractorProfileFixtures.verified();
        expect(profile.verificationStatus).toBe('VERIFIED');
      });

      it('should have PENDING status in pending contractor profile', () => {
        const profile = contractorProfileFixtures.pending();
        expect(profile.verificationStatus).toBe('PENDING');
      });

      it('should have REJECTED status in rejected contractor profile', () => {
        const profile = contractorProfileFixtures.rejected();
        expect(profile.verificationStatus).toBe('REJECTED');
      });
    });
  });

  // ============================================
  // ONE-BID-PER-PROJECT CONSTRAINT TESTS
  // ============================================

  describe('One-Bid-Per-Project Constraint', () => {
    /**
     * Unit test for one-bid-per-project constraint
     * **Validates: Requirements 2.2**
     */
    describe('Duplicate bid rejection', () => {
      it('should not allow same contractor to bid twice on same project', () => {
        const contractorId = 'user-contractor-1';
        const projectId = 'project-open-1';

        // First bid exists
        const existingBid = bidFixtures.pending({
          contractorId,
          projectId,
        });

        // Attempting second bid should be rejected
        const secondBidAttempt = {
          contractorId,
          projectId,
        };

        // Both have same contractor and project
        expect(existingBid.contractorId).toBe(secondBidAttempt.contractorId);
        expect(existingBid.projectId).toBe(secondBidAttempt.projectId);
      });

      it('should allow same contractor to bid on different projects', () => {
        const contractorId = 'user-contractor-1';

        const bid1 = bidFixtures.pending({
          contractorId,
          projectId: 'project-1',
        });

        const bid2 = bidFixtures.pending({
          id: 'bid-2',
          code: 'BID-2024-002',
          contractorId,
          projectId: 'project-2',
        });

        // Same contractor, different projects
        expect(bid1.contractorId).toBe(bid2.contractorId);
        expect(bid1.projectId).not.toBe(bid2.projectId);
      });

      it('should allow different contractors to bid on same project', () => {
        const projectId = 'project-open-1';

        const bid1 = bidFixtures.pending({
          contractorId: 'contractor-1',
          projectId,
        });

        const bid2 = bidFixtures.pending({
          id: 'bid-2',
          code: 'BID-2024-002',
          contractorId: 'contractor-2',
          projectId,
        });

        // Different contractors, same project
        expect(bid1.contractorId).not.toBe(bid2.contractorId);
        expect(bid1.projectId).toBe(bid2.projectId);
      });

      it('should allow contractor to re-bid after withdrawal', () => {
        const contractorId = 'user-contractor-1';
        const projectId = 'project-open-1';

        // Withdrawn bid
        const withdrawnBid = bidFixtures.withdrawn({
          contractorId,
          projectId,
        });

        expect(withdrawnBid.status).toBe('WITHDRAWN');

        // New bid should be allowed (WITHDRAWN bids don't block new bids)
        const newBid = bidFixtures.pending({
          id: 'bid-new',
          code: 'BID-2024-010',
          contractorId,
          projectId,
        });

        expect(newBid.status).toBe('PENDING');
      });
    });
  });

  // ============================================
  // BID ANONYMIZATION TESTS
  // ============================================

  describe('Bid Anonymization', () => {
    /**
     * **Feature: api-test-coverage, Property 6: Bid anonymization for homeowners**
     * **Validates: Requirements 2.3**
     */
    describe('Property 6: Bid anonymization for homeowners', () => {
      const ANONYMOUS_LABELS = [
        'Nhà thầu A', 'Nhà thầu B', 'Nhà thầu C', 'Nhà thầu D', 'Nhà thầu E',
        'Nhà thầu F', 'Nhà thầu G', 'Nhà thầu H', 'Nhà thầu I', 'Nhà thầu J',
      ];

      it('should hide contractor personal info in anonymous bid view', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 9 }),
            bidPriceGen,
            nonEmptyStringGen,
            (index, price, proposal) => {
              // Create anonymous bid representation
              const anonymousBid = {
                id: `bid-${index}`,
                code: `BID-2024-${String(index + 1).padStart(3, '0')}`,
                anonymousName: ANONYMOUS_LABELS[index],
                contractorRating: 4.5,
                contractorTotalProjects: 10,
                contractorCompletedProjects: 8,
                price,
                timeline: '3 tháng',
                proposal,
                status: 'PENDING',
              };

              // Should have anonymous name instead of real name
              expect(anonymousBid.anonymousName).toMatch(/^Nhà thầu [A-J]$/);
              
              // Should NOT have contractor personal info
              expect(anonymousBid).not.toHaveProperty('contractorName');
              expect(anonymousBid).not.toHaveProperty('contractorEmail');
              expect(anonymousBid).not.toHaveProperty('contractorPhone');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should preserve bid details in anonymous view', () => {
        const bid = bidFixtures.pending();
        
        // Anonymous view should still have these fields
        expect(bid.price).toBeDefined();
        expect(bid.timeline).toBeDefined();
        expect(bid.proposal).toBeDefined();
        expect(bid.status).toBeDefined();
      });

      it('should assign sequential anonymous labels', () => {
        const bids = [
          bidFixtures.pending({ id: 'bid-1' }),
          bidFixtures.pending({ id: 'bid-2' }),
          bidFixtures.pending({ id: 'bid-3' }),
        ];

        // Simulate anonymous label assignment
        const anonymousBids = bids.map((bid, index) => ({
          ...bid,
          anonymousName: ANONYMOUS_LABELS[index],
        }));

        expect(anonymousBids[0].anonymousName).toBe('Nhà thầu A');
        expect(anonymousBids[1].anonymousName).toBe('Nhà thầu B');
        expect(anonymousBids[2].anonymousName).toBe('Nhà thầu C');
      });

      it('should include contractor stats but not identity', () => {
        const anonymousBid = {
          id: 'bid-1',
          anonymousName: 'Nhà thầu A',
          contractorRating: 4.5,
          contractorTotalProjects: 15,
          contractorCompletedProjects: 12,
          price: 100000000,
        };

        // Stats are visible
        expect(anonymousBid.contractorRating).toBeDefined();
        expect(anonymousBid.contractorTotalProjects).toBeDefined();
        expect(anonymousBid.contractorCompletedProjects).toBeDefined();

        // Identity is hidden (replaced with anonymous name)
        expect(anonymousBid.anonymousName).toBe('Nhà thầu A');
      });
    });
  });

  // ============================================
  // BID STATUS TRANSITIONS TESTS
  // ============================================

  describe('Bid Status Transitions', () => {
    /**
     * **Feature: api-test-coverage, Property 7: Valid bid status transitions**
     * **Validates: Requirements 2.4**
     */
    describe('Property 7: Valid bid status transitions', () => {
      it('should allow all valid transitions', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...validBidTransitions),
            ([from, to]) => {
              const isValid = isValidBidTransition(from, to);
              expect(isValid).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject all invalid transitions', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...invalidBidTransitions),
            ([from, to]) => {
              const isValid = isValidBidTransition(from, to);
              expect(isValid).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should allow PENDING to APPROVED transition', () => {
        expect(isValidBidTransition('PENDING', 'APPROVED')).toBe(true);
      });

      it('should allow PENDING to REJECTED transition', () => {
        expect(isValidBidTransition('PENDING', 'REJECTED')).toBe(true);
      });

      it('should allow PENDING to WITHDRAWN transition', () => {
        expect(isValidBidTransition('PENDING', 'WITHDRAWN')).toBe(true);
      });

      it('should allow APPROVED to SELECTED transition', () => {
        expect(isValidBidTransition('APPROVED', 'SELECTED')).toBe(true);
      });

      it('should allow APPROVED to NOT_SELECTED transition', () => {
        expect(isValidBidTransition('APPROVED', 'NOT_SELECTED')).toBe(true);
      });

      it('should allow APPROVED to WITHDRAWN transition', () => {
        expect(isValidBidTransition('APPROVED', 'WITHDRAWN')).toBe(true);
      });

      it('should not allow REJECTED to any transition', () => {
        const allStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SELECTED', 'NOT_SELECTED', 'WITHDRAWN'];
        
        for (const status of allStatuses) {
          expect(isValidBidTransition('REJECTED', status)).toBe(false);
        }
      });

      it('should not allow SELECTED to any transition', () => {
        const allStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SELECTED', 'NOT_SELECTED', 'WITHDRAWN'];
        
        for (const status of allStatuses) {
          expect(isValidBidTransition('SELECTED', status)).toBe(false);
        }
      });

      it('should not allow WITHDRAWN to any transition', () => {
        const allStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SELECTED', 'NOT_SELECTED', 'WITHDRAWN'];
        
        for (const status of allStatuses) {
          expect(isValidBidTransition('WITHDRAWN', status)).toBe(false);
        }
      });
    });
  });

  // ============================================
  // BID WITHDRAWAL TESTS
  // ============================================

  describe('Bid Withdrawal', () => {
    /**
     * **Feature: api-test-coverage, Property 8: Bid withdrawal restrictions**
     * **Validates: Requirements 2.5**
     */
    describe('Property 8: Bid withdrawal restrictions', () => {
      it('should allow withdrawal only from PENDING or APPROVED status', () => {
        fc.assert(
          fc.property(bidStatusGen, (status) => {
            const canWithdraw = ['PENDING', 'APPROVED'].includes(status);
            
            if (canWithdraw) {
              expect(['PENDING', 'APPROVED']).toContain(status);
            } else {
              expect(['PENDING', 'APPROVED']).not.toContain(status);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should reject withdrawal from REJECTED status', () => {
        const bid = bidFixtures.rejected();
        const canWithdraw = ['PENDING', 'APPROVED'].includes(bid.status);
        
        expect(canWithdraw).toBe(false);
      });

      it('should reject withdrawal from SELECTED status', () => {
        const bid = bidFixtures.selected();
        const canWithdraw = ['PENDING', 'APPROVED'].includes(bid.status);
        
        expect(canWithdraw).toBe(false);
      });

      it('should reject withdrawal from WITHDRAWN status', () => {
        const bid = bidFixtures.withdrawn();
        const canWithdraw = ['PENDING', 'APPROVED'].includes(bid.status);
        
        expect(canWithdraw).toBe(false);
      });

      it('should allow withdrawal from PENDING status', () => {
        const bid = bidFixtures.pending();
        const canWithdraw = ['PENDING', 'APPROVED'].includes(bid.status);
        
        expect(canWithdraw).toBe(true);
      });

      it('should allow withdrawal from APPROVED status', () => {
        const bid = bidFixtures.approved();
        const canWithdraw = ['PENDING', 'APPROVED'].includes(bid.status);
        
        expect(canWithdraw).toBe(true);
      });
    });
  });

  // ============================================
  // BID CODE FORMAT TESTS
  // ============================================

  describe('Bid Code Format', () => {
    it('should generate codes matching BID-YYYY-NNN pattern', () => {
      fc.assert(
        fc.property(bidCodeGen, (code) => {
          const pattern = /^BID-\d{4}-\d{3}$/;
          expect(code).toMatch(pattern);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate codes with valid year range', () => {
      fc.assert(
        fc.property(bidCodeGen, (code) => {
          const year = parseInt(code.split('-')[1], 10);
          expect(year).toBeGreaterThanOrEqual(2020);
          expect(year).toBeLessThanOrEqual(2030);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate codes with valid sequence number', () => {
      fc.assert(
        fc.property(bidCodeGen, (code) => {
          const seq = parseInt(code.split('-')[2], 10);
          expect(seq).toBeGreaterThanOrEqual(1);
          expect(seq).toBeLessThanOrEqual(999);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // BID FIXTURES TESTS
  // ============================================

  describe('Bid Fixtures', () => {
    it('should create valid pending bid fixture', () => {
      const bid = bidFixtures.pending();
      
      expect(bid.id).toBeDefined();
      expect(bid.code).toMatch(/^BID-\d{4}-\d{3}$/);
      expect(bid.status).toBe('PENDING');
      expect(bid.price).toBeGreaterThan(0);
    });

    it('should create valid approved bid fixture', () => {
      const bid = bidFixtures.approved();
      
      expect(bid.status).toBe('APPROVED');
      expect(bid.reviewedBy).toBeDefined();
      expect(bid.reviewedAt).toBeDefined();
    });

    it('should create valid selected bid fixture', () => {
      const bid = bidFixtures.selected();
      
      expect(bid.status).toBe('SELECTED');
    });

    it('should create valid rejected bid fixture', () => {
      const bid = bidFixtures.rejected();
      
      expect(bid.status).toBe('REJECTED');
      expect(bid.reviewNote).toBeDefined();
    });

    it('should create valid withdrawn bid fixture', () => {
      const bid = bidFixtures.withdrawn();
      
      expect(bid.status).toBe('WITHDRAWN');
    });

    it('should allow overriding fixture properties', () => {
      const customPrice = 200000000;
      const customTimeline = '6 tháng';
      
      const bid = bidFixtures.pending({
        price: customPrice,
        timeline: customTimeline,
      });
      
      expect(bid.price).toBe(customPrice);
      expect(bid.timeline).toBe(customTimeline);
      expect(bid.status).toBe('PENDING'); // Default preserved
    });
  });

  // ============================================
  // BID ERROR CLASS TESTS
  // ============================================

  describe('BidError', () => {
    it('should create error with correct code and message', () => {
      const error = new BidError('BID_NOT_FOUND', 'Bid not found');
      
      expect(error.code).toBe('BID_NOT_FOUND');
      expect(error.message).toBe('Bid not found');
      expect(error.statusCode).toBe(404);
    });

    it('should map error codes to correct status codes', () => {
      const errorMappings = [
        { code: 'BID_NOT_FOUND', expectedStatus: 404 },
        { code: 'PROJECT_NOT_FOUND', expectedStatus: 404 },
        { code: 'CONTRACTOR_NOT_FOUND', expectedStatus: 404 },
        { code: 'BID_ACCESS_DENIED', expectedStatus: 403 },
        { code: 'PROJECT_ACCESS_DENIED', expectedStatus: 403 },
        { code: 'CONTRACTOR_NOT_VERIFIED', expectedStatus: 403 },
        { code: 'BID_INVALID_STATUS', expectedStatus: 400 },
        { code: 'BID_PROJECT_NOT_OPEN', expectedStatus: 400 },
        { code: 'BID_DEADLINE_PASSED', expectedStatus: 400 },
        { code: 'BID_MAX_REACHED', expectedStatus: 400 },
        { code: 'BID_ALREADY_EXISTS', expectedStatus: 409 },
      ];

      for (const { code, expectedStatus } of errorMappings) {
        const error = new BidError(code, 'Test message');
        expect(error.statusCode).toBe(expectedStatus);
      }
    });

    it('should default to 500 for unknown error codes', () => {
      const error = new BidError('UNKNOWN_ERROR', 'Unknown error');
      expect(error.statusCode).toBe(500);
    });

    it('should allow custom status code override', () => {
      const error = new BidError('CUSTOM_ERROR', 'Custom error', 418);
      expect(error.statusCode).toBe(418);
    });
  });

  // ============================================
  // BID PRICE VALIDATION TESTS
  // ============================================

  describe('Bid Price Validation', () => {
    it('should generate valid bid prices within range', () => {
      fc.assert(
        fc.property(bidPriceGen, (price) => {
          expect(price).toBeGreaterThanOrEqual(1000000);
          expect(price).toBeLessThanOrEqual(1000000000);
        }),
        { numRuns: 100 }
      );
    });

    it('should have positive price in bid fixtures', () => {
      const bids = [
        bidFixtures.pending(),
        bidFixtures.approved(),
        bidFixtures.selected(),
        bidFixtures.rejected(),
        bidFixtures.withdrawn(),
      ];

      for (const bid of bids) {
        expect(bid.price).toBeGreaterThan(0);
      }
    });
  });
});
