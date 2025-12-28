/**
 * Property-Based Tests for useBulkSelection Hook
 * **Feature: code-quality-refactor, Property 2: Component Extraction Completeness**
 * **Validates: Requirements 1.2**
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkSelection } from './useBulkSelection';

// Generate items with unique IDs
const itemArbitrary = fc.array(
  fc.record({
    id: fc.uuid(),
    name: fc.string(),
  }),
  { minLength: 0, maxLength: 20 }
).map(items => {
  // Ensure unique IDs
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
});

describe('Property 2: Component Extraction Completeness - useBulkSelection', () => {
  describe('toggleSelectAll', () => {
    it('should select all items when none are selected', () => {
      fc.assert(
        fc.property(
          itemArbitrary.filter(items => items.length > 0),
          (items) => {
            const { result } = renderHook(() => useBulkSelection(items));
            
            // Initially nothing selected
            expect(result.current.selectedCount).toBe(0);
            
            // Toggle select all
            act(() => {
              result.current.toggleSelectAll();
            });
            
            // All should be selected
            return result.current.selectedCount === items.length &&
                   result.current.isAllSelected === true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should deselect all items when all are selected', () => {
      fc.assert(
        fc.property(
          itemArbitrary.filter(items => items.length > 0),
          (items) => {
            const { result } = renderHook(() => useBulkSelection(items));
            
            // Select all first
            act(() => {
              result.current.toggleSelectAll();
            });
            
            // Toggle again to deselect
            act(() => {
              result.current.toggleSelectAll();
            });
            
            // None should be selected
            return result.current.selectedCount === 0 &&
                   result.current.isAllSelected === false;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('toggleSelectOne', () => {
    it('should toggle individual item selection', () => {
      fc.assert(
        fc.property(
          itemArbitrary.filter(items => items.length > 0),
          fc.nat(),
          (items, indexSeed) => {
            const index = indexSeed % items.length;
            const targetId = items[index].id;
            
            const { result } = renderHook(() => useBulkSelection(items));
            
            // Initially not selected
            expect(result.current.selectedIds.has(targetId)).toBe(false);
            
            // Select one
            act(() => {
              result.current.toggleSelectOne(targetId);
            });
            
            // Should be selected
            expect(result.current.selectedIds.has(targetId)).toBe(true);
            expect(result.current.selectedCount).toBe(1);
            
            // Toggle again
            act(() => {
              result.current.toggleSelectOne(targetId);
            });
            
            // Should be deselected
            return result.current.selectedIds.has(targetId) === false &&
                   result.current.selectedCount === 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain other selections when toggling one', () => {
      fc.assert(
        fc.property(
          itemArbitrary.filter(items => items.length >= 2),
          (items) => {
            const { result } = renderHook(() => useBulkSelection(items));
            
            // Select first two items
            act(() => {
              result.current.toggleSelectOne(items[0].id);
              result.current.toggleSelectOne(items[1].id);
            });
            
            expect(result.current.selectedCount).toBe(2);
            
            // Toggle first item off
            act(() => {
              result.current.toggleSelectOne(items[0].id);
            });
            
            // Second item should still be selected
            return result.current.selectedIds.has(items[1].id) === true &&
                   result.current.selectedIds.has(items[0].id) === false &&
                   result.current.selectedCount === 1;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      fc.assert(
        fc.property(
          itemArbitrary.filter(items => items.length > 0),
          (items) => {
            const { result } = renderHook(() => useBulkSelection(items));
            
            // Select all
            act(() => {
              result.current.toggleSelectAll();
            });
            
            expect(result.current.selectedCount).toBe(items.length);
            
            // Clear
            act(() => {
              result.current.clearSelection();
            });
            
            return result.current.selectedCount === 0 &&
                   result.current.isAllSelected === false;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('isAllSelected', () => {
    it('should be false for empty items array', () => {
      const { result } = renderHook(() => useBulkSelection([]));
      expect(result.current.isAllSelected).toBe(false);
    });

    it('should correctly reflect selection state', () => {
      fc.assert(
        fc.property(
          itemArbitrary.filter(items => items.length > 0),
          (items) => {
            const { result } = renderHook(() => useBulkSelection(items));
            
            // Initially false
            expect(result.current.isAllSelected).toBe(false);
            
            // Select all but one
            for (let i = 0; i < items.length - 1; i++) {
              act(() => {
                result.current.toggleSelectOne(items[i].id);
              });
            }
            
            // Should not be all selected yet
            expect(result.current.isAllSelected).toBe(false);
            
            // Select the last one
            act(() => {
              result.current.toggleSelectOne(items[items.length - 1].id);
            });
            
            // Now should be all selected
            return result.current.isAllSelected === true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('selectedCount', () => {
    it('should accurately count selected items', () => {
      fc.assert(
        fc.property(
          itemArbitrary.filter(items => items.length >= 3),
          fc.integer({ min: 1, max: 3 }),
          (items, selectCount) => {
            const toSelect = Math.min(selectCount, items.length);
            const { result } = renderHook(() => useBulkSelection(items));
            
            // Select specific number of items
            for (let i = 0; i < toSelect; i++) {
              act(() => {
                result.current.toggleSelectOne(items[i].id);
              });
            }
            
            return result.current.selectedCount === toSelect;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
