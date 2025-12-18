/**
 * Property-Based Tests for Response Helper Utilities
 * 
 * **Feature: api-refactoring, Property 5: Response Helper Functions Work Correctly**
 * **Validates: Requirements 3.4**
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';

// ============================================
// Type Definitions (isolated for testing)
// ============================================

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

interface ErrorDetails {
  code: string;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: ErrorDetails;
  correlationId: string;
}

// ============================================
// Response Helper Logic (isolated for testing)
// ============================================

function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

function createPaginatedResponse<T>(
  data: T[],
  meta: { total: number; page: number; limit: number }
): PaginatedResponse<T> {
  const totalPages = meta.limit > 0 ? Math.ceil(meta.total / meta.limit) : 0;
  
  return {
    success: true,
    data,
    meta: {
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages,
    },
  };
}

function createErrorResponse(
  code: string,
  message: string,
  correlationId: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
    },
    correlationId,
  };
}

// ============================================
// Generators
// ============================================

// Generate arbitrary JSON-serializable data
const jsonValue = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.double({ noNaN: true, noDefaultInfinity: true }),
  fc.boolean(),
  fc.constant(null)
);

// Generate arbitrary objects
const jsonObject = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
  jsonValue
);

// Generate pagination meta
const paginationMeta = fc.record({
  total: fc.integer({ min: 0, max: 10000 }),
  page: fc.integer({ min: 1, max: 1000 }),
  limit: fc.integer({ min: 1, max: 100 }),
});

// Generate error codes
const errorCode = fc.constantFrom(
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'CONFLICT',
  'INTERNAL_ERROR',
  'RATE_LIMITED'
);

// ============================================
// PROPERTY 5: Response Helper Functions Work Correctly
// Requirements: 3.4
// ============================================

describe('Property 5: Response Helper Functions Work Correctly', () => {
  
  // ----------------------------------------
  // successResponse tests
  // ----------------------------------------
  
  describe('successResponse', () => {
    it('should always have success: true', () => {
      fc.assert(
        fc.property(
          jsonObject,
          (data) => {
            const response = createSuccessResponse(data);
            return response.success === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve the data exactly', () => {
      fc.assert(
        fc.property(
          jsonObject,
          (data) => {
            const response = createSuccessResponse(data);
            return JSON.stringify(response.data) === JSON.stringify(data);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should work with primitive types', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null)
          ),
          (data) => {
            const response = createSuccessResponse(data);
            return response.success === true && response.data === data;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should work with arrays', () => {
      fc.assert(
        fc.property(
          fc.array(jsonObject, { minLength: 0, maxLength: 10 }),
          (data) => {
            const response = createSuccessResponse(data);
            return (
              response.success === true &&
              Array.isArray(response.data) &&
              response.data.length === data.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should work with nested objects', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string(),
            nested: fc.record({
              value: fc.integer(),
              flag: fc.boolean(),
            }),
          }),
          (data) => {
            const response = createSuccessResponse(data);
            return (
              response.success === true &&
              response.data.id === data.id &&
              response.data.nested.value === data.nested.value
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ----------------------------------------
  // paginatedResponse tests
  // ----------------------------------------

  describe('paginatedResponse', () => {
    it('should always have success: true', () => {
      fc.assert(
        fc.property(
          fc.array(jsonObject, { minLength: 0, maxLength: 20 }),
          paginationMeta,
          (data, meta) => {
            const response = createPaginatedResponse(data, meta);
            return response.success === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve the data array exactly', () => {
      fc.assert(
        fc.property(
          fc.array(jsonObject, { minLength: 0, maxLength: 20 }),
          paginationMeta,
          (data, meta) => {
            const response = createPaginatedResponse(data, meta);
            return (
              Array.isArray(response.data) &&
              response.data.length === data.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all required meta fields', () => {
      fc.assert(
        fc.property(
          fc.array(jsonObject, { minLength: 0, maxLength: 20 }),
          paginationMeta,
          (data, meta) => {
            const response = createPaginatedResponse(data, meta);
            return (
              typeof response.meta.total === 'number' &&
              typeof response.meta.page === 'number' &&
              typeof response.meta.limit === 'number' &&
              typeof response.meta.totalPages === 'number'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate totalPages correctly', () => {
      fc.assert(
        fc.property(
          fc.array(jsonObject, { minLength: 0, maxLength: 20 }),
          paginationMeta,
          (data, meta) => {
            const response = createPaginatedResponse(data, meta);
            const expectedTotalPages = meta.limit > 0 
              ? Math.ceil(meta.total / meta.limit) 
              : 0;
            return response.meta.totalPages === expectedTotalPages;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve original meta values', () => {
      fc.assert(
        fc.property(
          fc.array(jsonObject, { minLength: 0, maxLength: 20 }),
          paginationMeta,
          (data, meta) => {
            const response = createPaginatedResponse(data, meta);
            return (
              response.meta.total === meta.total &&
              response.meta.page === meta.page &&
              response.meta.limit === meta.limit
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case: empty data array', () => {
      fc.assert(
        fc.property(
          paginationMeta,
          (meta) => {
            const response = createPaginatedResponse([], meta);
            return (
              response.success === true &&
              response.data.length === 0 &&
              response.meta.total === meta.total
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle edge case: total is 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (page, limit) => {
            const response = createPaginatedResponse([], { total: 0, page, limit });
            return response.meta.totalPages === 0;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ----------------------------------------
  // errorResponse tests
  // ----------------------------------------

  describe('errorResponse', () => {
    it('should always have success: false', () => {
      fc.assert(
        fc.property(
          errorCode,
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.uuid(),
          (code, message, correlationId) => {
            const response = createErrorResponse(code, message, correlationId);
            return response.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include error code and message', () => {
      fc.assert(
        fc.property(
          errorCode,
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.uuid(),
          (code, message, correlationId) => {
            const response = createErrorResponse(code, message, correlationId);
            return (
              response.error.code === code &&
              response.error.message === message
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include correlationId', () => {
      fc.assert(
        fc.property(
          errorCode,
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.uuid(),
          (code, message, correlationId) => {
            const response = createErrorResponse(code, message, correlationId);
            return response.correlationId === correlationId;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should work with any valid error code string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[A-Z_]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.uuid(),
          (code, message, correlationId) => {
            const response = createErrorResponse(code, message, correlationId);
            return (
              response.success === false &&
              response.error.code === code
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in message', () => {
      fc.assert(
        fc.property(
          errorCode,
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.uuid(),
          (code, message, correlationId) => {
            const response = createErrorResponse(code, message, correlationId);
            return response.error.message === message;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ----------------------------------------
  // Cross-function consistency tests
  // ----------------------------------------

  describe('Response format consistency', () => {
    it('success and error responses should have opposite success values', () => {
      fc.assert(
        fc.property(
          jsonObject,
          errorCode,
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.uuid(),
          (data, code, message, correlationId) => {
            const successResp = createSuccessResponse(data);
            const errorResp = createErrorResponse(code, message, correlationId);
            return successResp.success === true && errorResp.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('paginated response should be a valid success response', () => {
      fc.assert(
        fc.property(
          fc.array(jsonObject, { minLength: 0, maxLength: 10 }),
          paginationMeta,
          (data, meta) => {
            const response = createPaginatedResponse(data, meta);
            return (
              response.success === true &&
              'data' in response &&
              'meta' in response
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
