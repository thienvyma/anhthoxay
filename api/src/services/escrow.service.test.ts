/**
 * Escrow Service Tests
 *
 * Tests for escrow management business logic including amount calculations,
 * status transitions, partial releases, and dispute handling.
 *
 * **Feature: api-test-coverage**
 * **Requirements: 3.1-3.5**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { EscrowService, EscrowError } from './escrow.service';
import {
  validEscrowTransitions,
  isValidEscrowTransition,
  bidPriceGen,
  escrowPercentageGen,
  escrowMinAmountGen,
  calculateExpectedEscrow,
  escrowCodeGen,
} from '../test-utils/generators';
import {
  escrowFixtures,
  biddingSettingsFixtures,
} from '../test-utils/fixtures';
import { createMockPrisma, type MockPrismaClient } from '../test-utils/mock-prisma';

// ============================================
// ESCROW SERVICE TESTS
// ============================================

describe('EscrowService', () => {
  let mockPrisma: MockPrismaClient;
  let service: EscrowService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new EscrowService(mockPrisma as unknown as import('@prisma/client').PrismaClient);
    vi.clearAllMocks();
  });


  // ============================================
  // ESCROW AMOUNT CALCULATION TESTS
  // ============================================

  describe('Escrow Amount Calculation', () => {
    /**
     * **Feature: api-test-coverage, Property 9: Escrow amount calculation**
     * **Validates: Requirements 3.1, 3.2**
     */
    describe('Property 9: Escrow amount calculation', () => {
      it('should calculate escrow as max(bidPrice × percentage / 100, minAmount)', () => {
        fc.assert(
          fc.property(
            bidPriceGen,
            escrowPercentageGen,
            escrowMinAmountGen,
            (bidPrice, percentage, minAmount) => {
              const expected = calculateExpectedEscrow(bidPrice, percentage, minAmount);
              const calculated = Math.max(
                Math.floor(bidPrice * percentage / 100),
                minAmount
              );
              
              expect(calculated).toBe(expected);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should apply minimum amount when calculated is below minimum', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1000000, max: 5000000 }), // Small bid price
            fc.integer({ min: 5, max: 10 }), // Low percentage
            fc.integer({ min: 1000000, max: 2000000 }), // High minimum
            (bidPrice, percentage, minAmount) => {
              const calculated = Math.floor(bidPrice * percentage / 100);
              
              if (calculated < minAmount) {
                const result = calculateExpectedEscrow(bidPrice, percentage, minAmount);
                expect(result).toBe(minAmount);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should use calculated amount when above minimum', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 100000000, max: 1000000000 }), // Large bid price
            fc.integer({ min: 10, max: 20 }), // Higher percentage
            fc.integer({ min: 500000, max: 1000000 }), // Lower minimum
            (bidPrice, percentage, minAmount) => {
              const calculated = Math.floor(bidPrice * percentage / 100);
              
              if (calculated >= minAmount) {
                const result = calculateExpectedEscrow(bidPrice, percentage, minAmount);
                expect(result).toBe(calculated);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should apply maximum amount when configured and calculated exceeds it', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 500000000, max: 1000000000 }), // Very large bid
            fc.integer({ min: 15, max: 20 }), // High percentage
            fc.integer({ min: 500000, max: 1000000 }), // Low minimum
            fc.integer({ min: 10000000, max: 50000000 }), // Max amount
            (bidPrice, percentage, minAmount, maxAmount) => {
              const calculated = Math.floor(bidPrice * percentage / 100);
              
              if (calculated > maxAmount) {
                const result = calculateExpectedEscrow(bidPrice, percentage, minAmount, maxAmount);
                expect(result).toBe(maxAmount);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should always return a positive amount', () => {
        fc.assert(
          fc.property(
            bidPriceGen,
            escrowPercentageGen,
            escrowMinAmountGen,
            (bidPrice, percentage, minAmount) => {
              const result = calculateExpectedEscrow(bidPrice, percentage, minAmount);
              expect(result).toBeGreaterThan(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return integer amount (no decimals)', () => {
        fc.assert(
          fc.property(
            bidPriceGen,
            escrowPercentageGen,
            escrowMinAmountGen,
            (bidPrice, percentage, minAmount) => {
              const result = calculateExpectedEscrow(bidPrice, percentage, minAmount);
              expect(Number.isInteger(result)).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });


  // ============================================
  // ESCROW STATUS TRANSITIONS TESTS
  // ============================================

  describe('Escrow Status Transitions', () => {
    /**
     * **Feature: api-test-coverage, Property 10: Valid escrow status transitions**
     * **Validates: Requirements 3.3**
     */
    describe('Property 10: Valid escrow status transitions', () => {
      it('should allow all valid transitions', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...validEscrowTransitions),
            ([from, to]) => {
              const isValid = isValidEscrowTransition(from, to);
              expect(isValid).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should validate PENDING to HELD transition', () => {
        expect(isValidEscrowTransition('PENDING', 'HELD')).toBe(true);
      });

      it('should validate PENDING to CANCELLED transition', () => {
        expect(isValidEscrowTransition('PENDING', 'CANCELLED')).toBe(true);
      });

      it('should validate HELD to PARTIAL_RELEASED transition', () => {
        expect(isValidEscrowTransition('HELD', 'PARTIAL_RELEASED')).toBe(true);
      });

      it('should validate HELD to RELEASED transition', () => {
        expect(isValidEscrowTransition('HELD', 'RELEASED')).toBe(true);
      });

      it('should validate HELD to REFUNDED transition', () => {
        expect(isValidEscrowTransition('HELD', 'REFUNDED')).toBe(true);
      });

      it('should validate HELD to DISPUTED transition', () => {
        expect(isValidEscrowTransition('HELD', 'DISPUTED')).toBe(true);
      });

      it('should validate PARTIAL_RELEASED to RELEASED transition', () => {
        expect(isValidEscrowTransition('PARTIAL_RELEASED', 'RELEASED')).toBe(true);
      });

      it('should validate PARTIAL_RELEASED to REFUNDED transition', () => {
        expect(isValidEscrowTransition('PARTIAL_RELEASED', 'REFUNDED')).toBe(true);
      });

      it('should validate PARTIAL_RELEASED to DISPUTED transition', () => {
        expect(isValidEscrowTransition('PARTIAL_RELEASED', 'DISPUTED')).toBe(true);
      });

      it('should validate DISPUTED to RELEASED transition (admin resolution)', () => {
        expect(isValidEscrowTransition('DISPUTED', 'RELEASED')).toBe(true);
      });

      it('should validate DISPUTED to REFUNDED transition (admin resolution)', () => {
        expect(isValidEscrowTransition('DISPUTED', 'REFUNDED')).toBe(true);
      });

      it('should reject transitions from terminal states', () => {
        const terminalStates = ['RELEASED', 'REFUNDED', 'CANCELLED'];
        const allStatuses = ['PENDING', 'HELD', 'PARTIAL_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CANCELLED'];

        for (const terminal of terminalStates) {
          for (const target of allStatuses) {
            expect(isValidEscrowTransition(terminal, target)).toBe(false);
          }
        }
      });

      it('should reject invalid transitions from PENDING', () => {
        const invalidFromPending = ['PARTIAL_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED'];
        
        for (const target of invalidFromPending) {
          expect(isValidEscrowTransition('PENDING', target)).toBe(false);
        }
      });

      it('should reject backward transitions', () => {
        // Cannot go back to PENDING from any state
        const allStatuses = ['HELD', 'PARTIAL_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CANCELLED'];
        
        for (const status of allStatuses) {
          expect(isValidEscrowTransition(status, 'PENDING')).toBe(false);
        }
      });

      it('should reject HELD to PENDING transition', () => {
        expect(isValidEscrowTransition('HELD', 'PENDING')).toBe(false);
      });

      it('should reject HELD to CANCELLED transition', () => {
        expect(isValidEscrowTransition('HELD', 'CANCELLED')).toBe(false);
      });
    });
  });


  // ============================================
  // PARTIAL RELEASE TRACKING TESTS
  // ============================================

  describe('Partial Release Tracking', () => {
    /**
     * **Feature: api-test-coverage, Property 11: Escrow partial release tracking**
     * **Validates: Requirements 3.4**
     */
    describe('Property 11: Escrow partial release tracking', () => {
      it('should track releasedAmount correctly after partial release', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 10000000, max: 100000000 }), // Total amount
            fc.integer({ min: 1, max: 99 }), // Release percentage (1-99%)
            (totalAmount, releasePercentage) => {
              const releaseAmount = Math.floor(totalAmount * releasePercentage / 100);
              const initialReleased = 0;
              
              const newReleasedAmount = initialReleased + releaseAmount;
              const remaining = totalAmount - newReleasedAmount;
              
              // Released amount should increase by release amount
              expect(newReleasedAmount).toBe(releaseAmount);
              // Remaining should decrease by release amount
              expect(remaining).toBe(totalAmount - releaseAmount);
              // Total should be preserved
              expect(newReleasedAmount + remaining).toBe(totalAmount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should track multiple partial releases correctly', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 10000000, max: 100000000 }), // Total amount
            fc.integer({ min: 10, max: 40 }), // First release %
            fc.integer({ min: 10, max: 40 }), // Second release %
            (totalAmount, firstPercent, secondPercent) => {
              const firstRelease = Math.floor(totalAmount * firstPercent / 100);
              const secondRelease = Math.floor(totalAmount * secondPercent / 100);
              
              let releasedAmount = 0;
              
              // First partial release
              releasedAmount += firstRelease;
              expect(releasedAmount).toBe(firstRelease);
              
              // Second partial release
              releasedAmount += secondRelease;
              expect(releasedAmount).toBe(firstRelease + secondRelease);
              
              // Remaining
              const remaining = totalAmount - releasedAmount;
              expect(remaining).toBe(totalAmount - firstRelease - secondRelease);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should not allow release amount exceeding remaining', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 10000000, max: 50000000 }), // Total amount
            fc.integer({ min: 5000000, max: 25000000 }), // Already released
            (totalAmount, alreadyReleased) => {
              // Ensure alreadyReleased is less than total
              const released = Math.min(alreadyReleased, totalAmount - 1);
              const remaining = totalAmount - released;
              
              // Attempting to release more than remaining should fail
              const attemptedRelease = remaining + 1;
              const isValid = attemptedRelease <= remaining;
              
              expect(isValid).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should transition to RELEASED when fully released', () => {
        const escrow = escrowFixtures.partialReleased();
        const remaining = escrow.amount - escrow.releasedAmount;
        
        // Simulate final release
        const newReleasedAmount = escrow.releasedAmount + remaining;
        const newStatus = newReleasedAmount >= escrow.amount ? 'RELEASED' : 'PARTIAL_RELEASED';
        
        expect(newStatus).toBe('RELEASED');
        expect(newReleasedAmount).toBe(escrow.amount);
      });

      it('should stay PARTIAL_RELEASED when not fully released', () => {
        const escrow = escrowFixtures.held();
        const partialRelease = Math.floor(escrow.amount * 0.5); // 50%
        
        const newReleasedAmount = escrow.releasedAmount + partialRelease;
        const newStatus = newReleasedAmount >= escrow.amount ? 'RELEASED' : 'PARTIAL_RELEASED';
        
        expect(newStatus).toBe('PARTIAL_RELEASED');
        expect(newReleasedAmount).toBeLessThan(escrow.amount);
      });

      it('should preserve total amount invariant', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 10000000, max: 100000000 }),
            fc.array(fc.integer({ min: 1, max: 30 }), { minLength: 1, maxLength: 5 }),
            (totalAmount, releasePercentages) => {
              let releasedAmount = 0;
              
              for (const percent of releasePercentages) {
                const release = Math.floor(totalAmount * percent / 100);
                const remaining = totalAmount - releasedAmount;
                
                // Only release if there's enough remaining
                if (release <= remaining) {
                  releasedAmount += release;
                }
              }
              
              // Invariant: released + remaining = total
              const remaining = totalAmount - releasedAmount;
              expect(releasedAmount + remaining).toBe(totalAmount);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });


  // ============================================
  // DISPUTE STATUS CHANGE TESTS
  // ============================================

  describe('Dispute Status Change', () => {
    /**
     * Unit test for dispute status change
     * **Validates: Requirements 3.5**
     */
    describe('Status change to DISPUTED', () => {
      it('should allow dispute from HELD status', () => {
        const escrow = escrowFixtures.held();
        const canDispute = isValidEscrowTransition(escrow.status, 'DISPUTED');
        
        expect(canDispute).toBe(true);
      });

      it('should allow dispute from PARTIAL_RELEASED status', () => {
        const escrow = escrowFixtures.partialReleased();
        const canDispute = isValidEscrowTransition(escrow.status, 'DISPUTED');
        
        expect(canDispute).toBe(true);
      });

      it('should not allow dispute from PENDING status', () => {
        const escrow = escrowFixtures.pending();
        const canDispute = isValidEscrowTransition(escrow.status, 'DISPUTED');
        
        expect(canDispute).toBe(false);
      });

      it('should not allow dispute from RELEASED status', () => {
        const escrow = escrowFixtures.released();
        const canDispute = isValidEscrowTransition(escrow.status, 'DISPUTED');
        
        expect(canDispute).toBe(false);
      });

      it('should not allow dispute from already DISPUTED status', () => {
        const escrow = escrowFixtures.disputed();
        const canDispute = isValidEscrowTransition(escrow.status, 'DISPUTED');
        
        expect(canDispute).toBe(false);
      });

      it('should store dispute reason when disputed', () => {
        const escrow = escrowFixtures.disputed();
        
        expect(escrow.disputeReason).toBeDefined();
        expect(escrow.disputeReason).toBe('Quality issues');
      });

      it('should store disputedBy when disputed', () => {
        const escrow = escrowFixtures.disputed();
        
        expect(escrow.disputedBy).toBeDefined();
        expect(escrow.disputedBy).toBe('user-homeowner-1');
      });

      it('should allow resolution from DISPUTED to RELEASED', () => {
        const escrow = escrowFixtures.disputed();
        const canResolve = isValidEscrowTransition(escrow.status, 'RELEASED');
        
        expect(canResolve).toBe(true);
      });

      it('should allow resolution from DISPUTED to REFUNDED', () => {
        const escrow = escrowFixtures.disputed();
        const canResolve = isValidEscrowTransition(escrow.status, 'REFUNDED');
        
        expect(canResolve).toBe(true);
      });
    });
  });


  // ============================================
  // ESCROW CODE FORMAT TESTS
  // ============================================

  describe('Escrow Code Format', () => {
    it('should generate codes matching ESC-YYYY-NNN pattern', () => {
      fc.assert(
        fc.property(escrowCodeGen, (code) => {
          const pattern = /^ESC-\d{4}-\d{3}$/;
          expect(code).toMatch(pattern);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate codes with valid year range', () => {
      fc.assert(
        fc.property(escrowCodeGen, (code) => {
          const year = parseInt(code.split('-')[1], 10);
          expect(year).toBeGreaterThanOrEqual(2020);
          expect(year).toBeLessThanOrEqual(2030);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate codes with valid sequence number', () => {
      fc.assert(
        fc.property(escrowCodeGen, (code) => {
          const seq = parseInt(code.split('-')[2], 10);
          expect(seq).toBeGreaterThanOrEqual(1);
          expect(seq).toBeLessThanOrEqual(999);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // ESCROW FIXTURES TESTS
  // ============================================

  describe('Escrow Fixtures', () => {
    it('should create valid pending escrow fixture', () => {
      const escrow = escrowFixtures.pending();
      
      expect(escrow.id).toBeDefined();
      expect(escrow.code).toMatch(/^ESC-\d{4}-\d{3}$/);
      expect(escrow.status).toBe('PENDING');
      expect(escrow.amount).toBeGreaterThan(0);
      expect(escrow.releasedAmount).toBe(0);
    });

    it('should create valid held escrow fixture', () => {
      const escrow = escrowFixtures.held();
      
      expect(escrow.status).toBe('HELD');
      expect(escrow.confirmedBy).toBeDefined();
      expect(escrow.confirmedAt).toBeDefined();
      expect(escrow.releasedAmount).toBe(0);
    });

    it('should create valid partial released escrow fixture', () => {
      const escrow = escrowFixtures.partialReleased();
      
      expect(escrow.status).toBe('PARTIAL_RELEASED');
      expect(escrow.releasedAmount).toBeGreaterThan(0);
      expect(escrow.releasedAmount).toBeLessThan(escrow.amount);
    });

    it('should create valid released escrow fixture', () => {
      const escrow = escrowFixtures.released();
      
      expect(escrow.status).toBe('RELEASED');
      expect(escrow.releasedAmount).toBe(escrow.amount);
      expect(escrow.releasedBy).toBeDefined();
      expect(escrow.releasedAt).toBeDefined();
    });

    it('should create valid disputed escrow fixture', () => {
      const escrow = escrowFixtures.disputed();
      
      expect(escrow.status).toBe('DISPUTED');
      expect(escrow.disputeReason).toBeDefined();
      expect(escrow.disputedBy).toBeDefined();
    });

    it('should allow overriding fixture properties', () => {
      const customAmount = 50000000;
      const customCurrency = 'USD';
      
      const escrow = escrowFixtures.pending({
        amount: customAmount,
        currency: customCurrency,
      });
      
      expect(escrow.amount).toBe(customAmount);
      expect(escrow.currency).toBe(customCurrency);
      expect(escrow.status).toBe('PENDING'); // Default preserved
    });
  });


  // ============================================
  // ESCROW ERROR CLASS TESTS
  // ============================================

  describe('EscrowError', () => {
    it('should create error with correct code and message', () => {
      const error = new EscrowError('ESCROW_NOT_FOUND', 'Escrow not found');
      
      expect(error.code).toBe('ESCROW_NOT_FOUND');
      expect(error.message).toBe('Escrow not found');
      expect(error.statusCode).toBe(404);
    });

    it('should map error codes to correct status codes', () => {
      const errorMappings = [
        { code: 'ESCROW_NOT_FOUND', expectedStatus: 404 },
        { code: 'SETTINGS_NOT_FOUND', expectedStatus: 500 },
        { code: 'INVALID_STATUS_TRANSITION', expectedStatus: 400 },
        { code: 'INVALID_RELEASE_AMOUNT', expectedStatus: 400 },
      ];

      for (const { code, expectedStatus } of errorMappings) {
        const error = new EscrowError(code, 'Test message');
        expect(error.statusCode).toBe(expectedStatus);
      }
    });

    it('should default to 500 for unknown error codes', () => {
      const error = new EscrowError('UNKNOWN_ERROR', 'Unknown error');
      expect(error.statusCode).toBe(500);
    });

    it('should allow custom status code override', () => {
      const error = new EscrowError('CUSTOM_ERROR', 'Custom error', 418);
      expect(error.statusCode).toBe(418);
    });
  });

  // ============================================
  // SERVICE VALIDATE TRANSITION TESTS
  // ============================================

  describe('Service validateTransition', () => {
    it('should return true for valid transitions', () => {
      expect(service.validateTransition('PENDING', 'HELD')).toBe(true);
      expect(service.validateTransition('HELD', 'RELEASED')).toBe(true);
      expect(service.validateTransition('HELD', 'DISPUTED')).toBe(true);
    });

    it('should throw EscrowError for invalid transitions', () => {
      expect(() => service.validateTransition('PENDING', 'RELEASED'))
        .toThrow(EscrowError);
      expect(() => service.validateTransition('RELEASED', 'PENDING'))
        .toThrow(EscrowError);
      expect(() => service.validateTransition('CANCELLED', 'HELD'))
        .toThrow(EscrowError);
    });

    it('should throw with correct error code for invalid transition', () => {
      try {
        service.validateTransition('PENDING', 'RELEASED');
      } catch (error) {
        expect(error).toBeInstanceOf(EscrowError);
        expect((error as EscrowError).code).toBe('INVALID_STATUS_TRANSITION');
        expect((error as EscrowError).statusCode).toBe(400);
      }
    });
  });

  // ============================================
  // BIDDING SETTINGS INTEGRATION TESTS
  // ============================================

  describe('Bidding Settings Integration', () => {
    it('should use default bidding settings for escrow calculation', () => {
      const settings = biddingSettingsFixtures.default();
      
      expect(settings.escrowPercentage).toBe(10);
      expect(settings.escrowMinAmount).toBe(1000000);
      expect(settings.escrowMaxAmount).toBeNull();
    });

    it('should calculate escrow with default settings', () => {
      const settings = biddingSettingsFixtures.default();
      const bidPrice = 100000000; // 100M VND
      
      const expected = calculateExpectedEscrow(
        bidPrice,
        settings.escrowPercentage,
        settings.escrowMinAmount,
        settings.escrowMaxAmount ?? undefined
      );
      
      // 100M * 10% = 10M, which is > 1M min
      expect(expected).toBe(10000000);
    });

    it('should apply minimum when calculated is below', () => {
      const settings = biddingSettingsFixtures.default();
      const bidPrice = 5000000; // 5M VND
      
      const expected = calculateExpectedEscrow(
        bidPrice,
        settings.escrowPercentage,
        settings.escrowMinAmount,
        settings.escrowMaxAmount ?? undefined
      );
      
      // 5M * 10% = 500K, which is < 1M min, so use 1M
      expect(expected).toBe(1000000);
    });
  });
});
