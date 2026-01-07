/**
 * Property-Based Tests for Google Sheets Batch Service
 * Using fast-check for property testing
 *
 * **Feature: production-scalability, Property 27: Google Sheets batch size**
 * **Validates: Requirements 14.1, 14.4**
 *
 * Tests batch splitting logic to ensure:
 * - Rows are split into batches of maximum 100 rows
 * - All rows are preserved after splitting
 * - Batch count is ceil(N/100) for N rows
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  GoogleSheetsBatchService,
  BATCH_SIZE,
  MAX_RETRIES,
} from './google-sheets-batch.service';

// ============================================
// TEST HELPERS
// ============================================

/**
 * Create a mock OAuth2 client for testing
 */
function createMockAuth() {
  return {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setCredentials: () => {},
    getAccessToken: () => Promise.resolve({ token: 'mock-token' }),
  };
}

/**
 * Generate a row of data for testing
 */
function generateRow(index: number): unknown[] {
  return [`id-${index}`, `name-${index}`, `value-${index}`, index];
}

/**
 * Generate multiple rows of data
 */
function generateRows(count: number): unknown[][] {
  return Array.from({ length: count }, (_, i) => generateRow(i));
}

// ============================================
// PROPERTY-BASED TESTS
// ============================================

describe('GoogleSheetsBatchService', () => {
  describe('Constants', () => {
    it('should have BATCH_SIZE of 100', () => {
      expect(BATCH_SIZE).toBe(100);
    });

    it('should have MAX_RETRIES of 3', () => {
      expect(MAX_RETRIES).toBe(3);
    });
  });

  describe('splitIntoBatches', () => {
    /**
     * **Feature: production-scalability, Property 27: Google Sheets batch size**
     * **Validates: Requirements 14.1, 14.4**
     *
     * Property: For any array of N rows where N > 100, the system SHALL split
     * into ceil(N/100) batches.
     */
    it('should split rows into correct number of batches', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (rowCount) => {
            const service = new GoogleSheetsBatchService(createMockAuth());
            const rows = generateRows(rowCount);
            const batches = service.splitIntoBatches(rows, BATCH_SIZE);

            const expectedBatchCount = Math.ceil(rowCount / BATCH_SIZE);
            expect(batches.length).toBe(expectedBatchCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: production-scalability, Property 27: Google Sheets batch size**
     * **Validates: Requirements 14.1, 14.4**
     *
     * Property: Each batch should have at most BATCH_SIZE rows.
     */
    it('should ensure each batch has at most BATCH_SIZE rows', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (rowCount) => {
            const service = new GoogleSheetsBatchService(createMockAuth());
            const rows = generateRows(rowCount);
            const batches = service.splitIntoBatches(rows, BATCH_SIZE);

            for (const batch of batches) {
              expect(batch.length).toBeLessThanOrEqual(BATCH_SIZE);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: production-scalability, Property 27: Google Sheets batch size**
     * **Validates: Requirements 14.1, 14.4**
     *
     * Property: All rows should be preserved after splitting (no data loss).
     */
    it('should preserve all rows after splitting', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (rowCount) => {
            const service = new GoogleSheetsBatchService(createMockAuth());
            const rows = generateRows(rowCount);
            const batches = service.splitIntoBatches(rows, BATCH_SIZE);

            // Total rows in all batches should equal original row count
            const totalRowsInBatches = batches.reduce(
              (sum, batch) => sum + batch.length,
              0
            );
            expect(totalRowsInBatches).toBe(rowCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: production-scalability, Property 27: Google Sheets batch size**
     * **Validates: Requirements 14.1, 14.4**
     *
     * Property: Row order should be preserved after splitting.
     */
    it('should preserve row order after splitting', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }),
          (rowCount) => {
            const service = new GoogleSheetsBatchService(createMockAuth());
            const rows = generateRows(rowCount);
            const batches = service.splitIntoBatches(rows, BATCH_SIZE);

            // Flatten batches and compare with original
            const flattenedRows = batches.flat();
            expect(flattenedRows).toEqual(rows);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: production-scalability, Property 27: Google Sheets batch size**
     * **Validates: Requirements 14.1, 14.4**
     *
     * Property: Only the last batch may have fewer than BATCH_SIZE rows.
     */
    it('should only have last batch with fewer than BATCH_SIZE rows', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: BATCH_SIZE + 1, max: 1000 }),
          (rowCount) => {
            const service = new GoogleSheetsBatchService(createMockAuth());
            const rows = generateRows(rowCount);
            const batches = service.splitIntoBatches(rows, BATCH_SIZE);

            // All batches except the last should have exactly BATCH_SIZE rows
            for (let i = 0; i < batches.length - 1; i++) {
              expect(batches[i].length).toBe(BATCH_SIZE);
            }

            // Last batch should have remaining rows
            const expectedLastBatchSize = rowCount % BATCH_SIZE || BATCH_SIZE;
            expect(batches[batches.length - 1].length).toBe(expectedLastBatchSize);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Empty array should return empty batches array.
     */
    it('should return empty array for empty input', () => {
      const service = new GoogleSheetsBatchService(createMockAuth());
      const batches = service.splitIntoBatches([], BATCH_SIZE);
      expect(batches).toEqual([]);
    });

    /**
     * Property: Single row should return single batch with one row.
     */
    it('should handle single row correctly', () => {
      const service = new GoogleSheetsBatchService(createMockAuth());
      const rows = generateRows(1);
      const batches = service.splitIntoBatches(rows, BATCH_SIZE);

      expect(batches.length).toBe(1);
      expect(batches[0].length).toBe(1);
      expect(batches[0]).toEqual(rows);
    });

    /**
     * Property: Exactly BATCH_SIZE rows should return single batch.
     */
    it('should handle exactly BATCH_SIZE rows correctly', () => {
      const service = new GoogleSheetsBatchService(createMockAuth());
      const rows = generateRows(BATCH_SIZE);
      const batches = service.splitIntoBatches(rows, BATCH_SIZE);

      expect(batches.length).toBe(1);
      expect(batches[0].length).toBe(BATCH_SIZE);
    });

    /**
     * Property: BATCH_SIZE + 1 rows should return exactly 2 batches.
     */
    it('should handle BATCH_SIZE + 1 rows correctly', () => {
      const service = new GoogleSheetsBatchService(createMockAuth());
      const rows = generateRows(BATCH_SIZE + 1);
      const batches = service.splitIntoBatches(rows, BATCH_SIZE);

      expect(batches.length).toBe(2);
      expect(batches[0].length).toBe(BATCH_SIZE);
      expect(batches[1].length).toBe(1);
    });

    /**
     * Property: Custom batch size should be respected.
     */
    it('should respect custom batch size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 50 }),
          (rowCount, customBatchSize) => {
            const service = new GoogleSheetsBatchService(createMockAuth());
            const rows = generateRows(rowCount);
            const batches = service.splitIntoBatches(rows, customBatchSize);

            const expectedBatchCount = Math.ceil(rowCount / customBatchSize);
            expect(batches.length).toBe(expectedBatchCount);

            // Each batch should have at most customBatchSize rows
            for (const batch of batches) {
              expect(batch.length).toBeLessThanOrEqual(customBatchSize);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Batch count formula', () => {
    /**
     * **Feature: production-scalability, Property 27: Google Sheets batch size**
     * **Validates: Requirements 14.1, 14.4**
     *
     * Property: Batch count should always be ceil(N/100) for N rows.
     */
    it('should follow ceil(N/100) formula for batch count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2000 }),
          (rowCount) => {
            const service = new GoogleSheetsBatchService(createMockAuth());
            const rows = generateRows(rowCount);
            const batches = service.splitIntoBatches(rows, BATCH_SIZE);

            if (rowCount === 0) {
              expect(batches.length).toBe(0);
            } else {
              const expectedBatchCount = Math.ceil(rowCount / BATCH_SIZE);
              expect(batches.length).toBe(expectedBatchCount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Specific test cases for batch count formula.
     */
    it.each([
      [0, 0],
      [1, 1],
      [50, 1],
      [99, 1],
      [100, 1],
      [101, 2],
      [150, 2],
      [200, 2],
      [201, 3],
      [500, 5],
      [1000, 10],
    ])('should split %i rows into %i batches', (rowCount, expectedBatches) => {
      const service = new GoogleSheetsBatchService(createMockAuth());
      const rows = generateRows(rowCount);
      const batches = service.splitIntoBatches(rows, BATCH_SIZE);

      expect(batches.length).toBe(expectedBatches);
    });
  });
});
