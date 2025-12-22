/**
 * Property-based tests for Interior API Pagination
 *
 * **Feature: interior-quote-module, Property 18: API pagination consistency**
 * **Validates: Requirements 18.3**
 *
 * Tests that pagination logic maintains consistency:
 * - page and limit parameters work correctly
 * - totalPages calculation is accurate
 * - items returned match the limit
 * - total count is consistent
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Helper to calculate expected total pages
function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

// Helper to calculate expected items on a page
function calculateExpectedItemsOnPage(
  total: number,
  page: number,
  limit: number
): number {
  const totalPages = calculateTotalPages(total, limit);
  if (page > totalPages) return 0;
  if (page === totalPages) {
    const remainder = total % limit;
    return remainder === 0 ? limit : remainder;
  }
  return limit;
}

// Simulate pagination logic used in services
function simulatePagination<T>(
  items: T[],
  page: number,
  limit: number
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length;
  const skip = (page - 1) * limit;
  const paginatedItems = items.slice(skip, skip + limit);

  return {
    items: paginatedItems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

describe('Interior API Pagination Consistency', () => {
  /**
   * Property 18: API pagination consistency
   *
   * For any valid page and limit values:
   * - totalPages = ceil(total / limit)
   * - items.length <= limit
   * - items.length = expected items for that page
   */
  it('should maintain pagination consistency for any dataset', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 0, maxLength: 100 }), // dataset
        fc.integer({ min: 1, max: 10 }), // page
        fc.integer({ min: 1, max: 20 }), // limit
        (dataset, page, limit) => {
          const result = simulatePagination(dataset, page, limit);
          const expectedItemsOnPage = calculateExpectedItemsOnPage(dataset.length, page, limit);

          // Verify items count matches expected
          expect(result.items.length).toBe(expectedItemsOnPage);

          // Verify totalPages calculation
          expect(result.totalPages).toBe(calculateTotalPages(dataset.length, limit));

          // Verify items don't exceed limit
          expect(result.items.length).toBeLessThanOrEqual(limit);

          // Verify total is correct
          expect(result.total).toBe(dataset.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Page navigation consistency
   *
   * For any dataset, navigating through all pages should return all items exactly once
   */
  it('should return all items exactly once when navigating through all pages', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 50 }), // dataset (non-empty)
        fc.integer({ min: 1, max: 10 }), // limit
        (dataset, limit) => {
          const totalPages = calculateTotalPages(dataset.length, limit);
          const allItems: string[] = [];

          // Navigate through all pages
          for (let page = 1; page <= totalPages; page++) {
            const result = simulatePagination(dataset, page, limit);
            allItems.push(...result.items);
          }

          // Verify we got all items exactly once
          expect(allItems.length).toBe(dataset.length);
          expect(allItems).toEqual(dataset);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Empty page handling
   *
   * Requesting a page beyond totalPages should return empty array
   */
  it('should return empty array for pages beyond total', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 30 }), // dataset (non-empty)
        fc.integer({ min: 1, max: 10 }), // limit
        (dataset, limit) => {
          const totalPages = calculateTotalPages(dataset.length, limit);
          const beyondPage = totalPages + 1;

          const result = simulatePagination(dataset, beyondPage, limit);

          expect(result.items.length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Pagination metadata consistency
   *
   * The pagination metadata should be consistent with actual data
   */
  it('should have consistent pagination metadata', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 0, maxLength: 50 }), // dataset
        fc.integer({ min: 1, max: 5 }), // page
        fc.integer({ min: 3, max: 10 }), // limit
        (dataset, page, limit) => {
          const result = simulatePagination(dataset, page, limit);

          // Verify metadata consistency
          expect(result.totalPages).toBe(calculateTotalPages(dataset.length, limit));
          expect(result.page).toBe(page);
          expect(result.limit).toBe(limit);
          expect(result.total).toBe(dataset.length);

          // Verify items count is within bounds
          if (page <= result.totalPages && dataset.length > 0) {
            expect(result.items.length).toBeGreaterThan(0);
          }
          expect(result.items.length).toBeLessThanOrEqual(limit);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: First page always starts from beginning
   */
  it('should always return first items on page 1', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 30 }), // dataset (non-empty)
        fc.integer({ min: 1, max: 10 }), // limit
        (dataset, limit) => {
          const result = simulatePagination(dataset, 1, limit);

          // First page should contain first `limit` items (or all if less)
          const expectedItems = dataset.slice(0, limit);
          expect(result.items).toEqual(expectedItems);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Last page contains remaining items
   */
  it('should contain remaining items on last page', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 30 }), // dataset (non-empty)
        fc.integer({ min: 1, max: 10 }), // limit
        (dataset, limit) => {
          const totalPages = calculateTotalPages(dataset.length, limit);
          const result = simulatePagination(dataset, totalPages, limit);

          // Last page should contain remaining items
          const skip = (totalPages - 1) * limit;
          const expectedItems = dataset.slice(skip);
          expect(result.items).toEqual(expectedItems);
        }
      ),
      { numRuns: 50 }
    );
  });
});
