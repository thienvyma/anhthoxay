/**
 * Property-Based Tests for Bid Comparison Limit
 * Using fast-check for property testing
 *
 * **Feature: bidding-phase6-portal, Property 12: Bid Comparison Limit**
 * **Validates: Requirements 20.1**
 *
 * Property: *For any* bid comparison, at most 3 bids should be selectable for comparison.
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import {
  MAX_COMPARISON_BIDS,
  validateBidComparisonSelection,
} from './BidComparison';

// ============================================
// TYPES
// ============================================

interface MockBid {
  id: string;
  price: number;
  timeline: string;
  proposal: string;
  contractor?: {
    rating?: number;
    totalProjects?: number;
  };
}

// ============================================
// GENERATORS
// ============================================

// Generate a valid bid ID
const bidIdArb = fc.uuid();

// Generate multiple unique bid IDs
const multipleBidIdsArb = (minLength: number, maxLength: number) =>
  fc.array(bidIdArb, { minLength, maxLength })
    .filter(ids => new Set(ids).size === ids.length); // Ensure unique IDs

// Generate a mock bid
const mockBidArb: fc.Arbitrary<MockBid> = fc.record({
  id: bidIdArb,
  price: fc.integer({ min: 1000000, max: 100000000 }), // 1M - 100M VND
  timeline: fc.oneof(
    fc.integer({ min: 1, max: 365 }).map(days => `${days} ngày`),
    fc.integer({ min: 1, max: 52 }).map(weeks => `${weeks} tuần`),
    fc.integer({ min: 1, max: 12 }).map(months => `${months} tháng`)
  ),
  proposal: fc.string({ minLength: 100, maxLength: 500 }),
  contractor: fc.option(
    fc.record({
      rating: fc.option(fc.float({ min: 1, max: 5, noNaN: true })),
      totalProjects: fc.option(fc.integer({ min: 0, max: 100 })),
    }),
    { nil: undefined }
  ),
});

// Generate multiple unique mock bids (kept for potential future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const multipleBidsArb = (minLength: number, maxLength: number) =>
  fc.array(mockBidArb, { minLength, maxLength })
    .map(bids => {
      // Ensure unique IDs
      const seenIds = new Set<string>();
      return bids.filter(bid => {
        if (seenIds.has(bid.id)) return false;
        seenIds.add(bid.id);
        return true;
      });
    })
    .filter(bids => bids.length >= minLength);

// ============================================
// BID COMPARISON SELECTION LOGIC (isolated for testing)
// Mirrors the logic in BidComparison.tsx and ProjectDetailPage.tsx
// ============================================

/**
 * Simulates the bid comparison selection state management
 */
class BidComparisonState {
  private selectedBidIds: string[] = [];

  getSelectedBidIds(): string[] {
    return [...this.selectedBidIds];
  }

  getSelectedCount(): number {
    return this.selectedBidIds.length;
  }

  isSelected(bidId: string): boolean {
    return this.selectedBidIds.includes(bidId);
  }

  /**
   * Toggle bid selection for comparison
   * Returns true if the operation was successful
   */
  toggleSelection(bidId: string): boolean {
    if (this.selectedBidIds.includes(bidId)) {
      // Remove from selection
      this.selectedBidIds = this.selectedBidIds.filter(id => id !== bidId);
      return true;
    }

    // Validate before adding
    const validation = validateBidComparisonSelection(this.selectedBidIds, bidId);
    if (!validation.canAdd) {
      return false;
    }

    this.selectedBidIds.push(bidId);
    return true;
  }

  /**
   * Clear all selections
   */
  clear(): void {
    this.selectedBidIds = [];
  }
}

// ============================================
// PROPERTY 12: Bid Comparison Limit
// **Feature: bidding-phase6-portal, Property 12: Bid Comparison Limit**
// **Validates: Requirements 20.1**
// ============================================

describe('Property 12: Bid Comparison Limit', () => {
  it('*For any* bid comparison, at most 3 bids should be selectable', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(1, 10),
        (bidIds) => {
          const state = new BidComparisonState();

          // Try to select all bids
          bidIds.forEach(bidId => {
            state.toggleSelection(bidId);
          });

          // Should never exceed MAX_COMPARISON_BIDS
          const selectedCount = state.getSelectedCount();
          expect(selectedCount).toBeLessThanOrEqual(MAX_COMPARISON_BIDS);

          return selectedCount <= MAX_COMPARISON_BIDS;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* selection attempt when at limit, new bids should be rejected', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(MAX_COMPARISON_BIDS + 1, 10),
        (bidIds) => {
          const state = new BidComparisonState();

          // Select first MAX_COMPARISON_BIDS bids
          const firstBids = bidIds.slice(0, MAX_COMPARISON_BIDS);
          firstBids.forEach(bidId => {
            const success = state.toggleSelection(bidId);
            expect(success).toBe(true);
          });

          expect(state.getSelectedCount()).toBe(MAX_COMPARISON_BIDS);

          // Try to select additional bids - should fail
          const additionalBids = bidIds.slice(MAX_COMPARISON_BIDS);
          additionalBids.forEach(bidId => {
            const success = state.toggleSelection(bidId);
            expect(success).toBe(false);
          });

          // Count should still be MAX_COMPARISON_BIDS
          expect(state.getSelectedCount()).toBe(MAX_COMPARISON_BIDS);

          return state.getSelectedCount() === MAX_COMPARISON_BIDS;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* selected bid, toggling should remove it from comparison', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(1, MAX_COMPARISON_BIDS),
        fc.integer({ min: 0, max: MAX_COMPARISON_BIDS - 1 }),
        (bidIds, toggleIndex) => {
          const state = new BidComparisonState();

          // Select all provided bids
          bidIds.forEach(bidId => {
            state.toggleSelection(bidId);
          });

          const initialCount = state.getSelectedCount();
          const validIndex = toggleIndex % bidIds.length;
          const bidToToggle = bidIds[validIndex];

          // Toggle the selected bid (should remove it)
          expect(state.isSelected(bidToToggle)).toBe(true);
          state.toggleSelection(bidToToggle);
          expect(state.isSelected(bidToToggle)).toBe(false);

          // Count should decrease by 1
          expect(state.getSelectedCount()).toBe(initialCount - 1);

          return state.getSelectedCount() === initialCount - 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* deselected bid, it should be selectable again if under limit', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(MAX_COMPARISON_BIDS, MAX_COMPARISON_BIDS),
        fc.integer({ min: 0, max: MAX_COMPARISON_BIDS - 1 }),
        (bidIds, toggleIndex) => {
          const state = new BidComparisonState();

          // Select all bids (at limit)
          bidIds.forEach(bidId => {
            state.toggleSelection(bidId);
          });
          expect(state.getSelectedCount()).toBe(MAX_COMPARISON_BIDS);

          // Deselect one bid
          const bidToToggle = bidIds[toggleIndex];
          state.toggleSelection(bidToToggle);
          expect(state.getSelectedCount()).toBe(MAX_COMPARISON_BIDS - 1);

          // Should be able to select it again
          const success = state.toggleSelection(bidToToggle);
          expect(success).toBe(true);
          expect(state.getSelectedCount()).toBe(MAX_COMPARISON_BIDS);

          return state.getSelectedCount() === MAX_COMPARISON_BIDS;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* sequence of toggle operations, count should never exceed limit', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(5, 15),
        fc.array(fc.integer({ min: 0, max: 14 }), { minLength: 10, maxLength: 50 }),
        (bidIds, toggleSequence) => {
          const state = new BidComparisonState();

          // Apply random toggle sequence
          toggleSequence.forEach(index => {
            const bidIndex = index % bidIds.length;
            const bidId = bidIds[bidIndex];
            state.toggleSelection(bidId);

            // After each operation, count should never exceed limit
            expect(state.getSelectedCount()).toBeLessThanOrEqual(MAX_COMPARISON_BIDS);
          });

          return state.getSelectedCount() <= MAX_COMPARISON_BIDS;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// VALIDATION FUNCTION TESTS
// ============================================

describe('validateBidComparisonSelection', () => {
  it('should allow adding when under limit', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(0, MAX_COMPARISON_BIDS - 1),
        bidIdArb,
        (selectedBids, newBidId) => {
          // Ensure newBidId is not already in selectedBids
          if (selectedBids.includes(newBidId)) {
            return true; // Skip this case
          }

          const result = validateBidComparisonSelection(selectedBids, newBidId);
          expect(result.canAdd).toBe(true);
          expect(result.reason).toBeUndefined();

          return result.canAdd === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject adding when at limit', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(MAX_COMPARISON_BIDS, MAX_COMPARISON_BIDS),
        bidIdArb,
        (selectedBids, newBidId) => {
          // Ensure newBidId is not already in selectedBids
          if (selectedBids.includes(newBidId)) {
            return true; // Skip this case - toggling off is allowed
          }

          const result = validateBidComparisonSelection(selectedBids, newBidId);
          expect(result.canAdd).toBe(false);
          expect(result.reason).toBeDefined();

          return result.canAdd === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow toggling off already selected bid', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(1, MAX_COMPARISON_BIDS),
        fc.integer({ min: 0, max: MAX_COMPARISON_BIDS - 1 }),
        (selectedBids, index) => {
          const validIndex = index % selectedBids.length;
          const bidToToggle = selectedBids[validIndex];

          const result = validateBidComparisonSelection(selectedBids, bidToToggle);
          expect(result.canAdd).toBe(true); // Toggling off is always allowed

          return result.canAdd === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('Bid Comparison Edge Cases', () => {
  it('should handle empty selection', () => {
    const state = new BidComparisonState();
    expect(state.getSelectedCount()).toBe(0);
    expect(state.getSelectedBidIds()).toEqual([]);
  });

  it('should handle selecting same bid multiple times', () => {
    fc.assert(
      fc.property(
        bidIdArb,
        fc.integer({ min: 2, max: 10 }),
        (bidId, toggleCount) => {
          const state = new BidComparisonState();

          // Toggle the same bid multiple times
          for (let i = 0; i < toggleCount; i++) {
            state.toggleSelection(bidId);
          }

          // Final state depends on whether toggleCount is odd or even
          const expectedSelected = toggleCount % 2 === 1;
          expect(state.isSelected(bidId)).toBe(expectedSelected);
          expect(state.getSelectedCount()).toBe(expectedSelected ? 1 : 0);

          return state.isSelected(bidId) === expectedSelected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain selection order', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(MAX_COMPARISON_BIDS, MAX_COMPARISON_BIDS),
        (bidIds) => {
          const state = new BidComparisonState();

          // Select bids in order
          bidIds.forEach(bidId => {
            state.toggleSelection(bidId);
          });

          // Selected IDs should be in the same order
          const selectedIds = state.getSelectedBidIds();
          expect(selectedIds).toEqual(bidIds);

          return JSON.stringify(selectedIds) === JSON.stringify(bidIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear all selections', () => {
    fc.assert(
      fc.property(
        multipleBidIdsArb(1, MAX_COMPARISON_BIDS),
        (bidIds) => {
          const state = new BidComparisonState();

          // Select some bids
          bidIds.forEach(bidId => {
            state.toggleSelection(bidId);
          });
          expect(state.getSelectedCount()).toBeGreaterThan(0);

          // Clear all
          state.clear();
          expect(state.getSelectedCount()).toBe(0);
          expect(state.getSelectedBidIds()).toEqual([]);

          return state.getSelectedCount() === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// MAX_COMPARISON_BIDS CONSTANT TEST
// ============================================

describe('MAX_COMPARISON_BIDS constant', () => {
  it('should be exactly 3 as per requirements', () => {
    expect(MAX_COMPARISON_BIDS).toBe(3);
  });
});
