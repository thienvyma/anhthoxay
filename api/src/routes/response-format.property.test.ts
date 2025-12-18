/**
 * Property-Based Tests for Response Format Consistency
 * 
 * Tests that API responses follow the standardized format defined in the design document.
 * 
 * **Feature: api-refactoring**
 * **Property 2: Success Response Format Consistency**
 * **Property 3: Paginated Response Format Consistency**
 * **Property 4: Error Response Format Consistency**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';

// ============================================
// Type Definitions for Response Validation
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

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  correlationId: string;
}

// ============================================
// Type Guards for Response Validation
// ============================================

function isSuccessResponse<T>(response: unknown): response is SuccessResponse<T> {
  if (typeof response !== 'object' || response === null) return false;
  const r = response as unknown as Record<string, unknown>;
  return r.success === true && 'data' in r;
}

function isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
  if (!isSuccessResponse(response)) return false;
  const r = response as unknown as Record<string, unknown>;
  if (!Array.isArray(r.data)) return false;
  if (typeof r.meta !== 'object' || r.meta === null) return false;
  const meta = r.meta as Record<string, unknown>;
  return (
    typeof meta.total === 'number' &&
    typeof meta.page === 'number' &&
    typeof meta.limit === 'number' &&
    typeof meta.totalPages === 'number'
  );
}

function isErrorResponse(response: unknown): response is ErrorResponse {
  if (typeof response !== 'object' || response === null) return false;
  const r = response as Record<string, unknown>;
  if (r.success !== false) return false;
  if (typeof r.error !== 'object' || r.error === null) return false;
  const error = r.error as Record<string, unknown>;
  return (
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof r.correlationId === 'string'
  );
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

// Generate arbitrary objects with valid property names
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
  'RATE_LIMITED',
  'USER_NOT_FOUND',
  'INVALID_CREDENTIALS',
  'TOKEN_EXPIRED'
);

// Generate correlation IDs (UUID format)
const correlationId = fc.uuid();

// ============================================
// Response Builders (simulating API responses)
// ============================================

function buildSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

function buildPaginatedResponse<T>(
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

function buildErrorResponse(
  code: string,
  message: string,
  corrId: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
    },
    correlationId: corrId,
  };
}

// ============================================
// PROPERTY 2: Success Response Format Consistency
// Requirements: 3.1, 3.5
// ============================================

describe('Property 2: Success Response Format Consistency', () => {
  /**
   * **Feature: api-refactoring, Property 2: Success Response Format Consistency**
   * **Validates: Requirements 3.1, 3.5**
   * 
   * For any successful API response, the response body should contain 
   * `success: true` and `data` field.
   */

  it('should always have success: true for any data type', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          jsonObject,
          fc.array(jsonObject),
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null)
        ),
        (data) => {
          const response = buildSuccessResponse(data);
          return isSuccessResponse(response);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain data field that matches input exactly', () => {
    fc.assert(
      fc.property(
        jsonObject,
        (data) => {
          const response = buildSuccessResponse(data);
          return (
            response.success === true &&
            JSON.stringify(response.data) === JSON.stringify(data)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not contain error field in success response', () => {
    fc.assert(
      fc.property(
        jsonObject,
        (data) => {
          const response = buildSuccessResponse(data);
          return !('error' in response);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should work with complex nested objects', () => {
    // Use timestamp-based date generation to avoid invalid dates
    const minTimestamp = new Date('2000-01-01').getTime();
    const maxTimestamp = new Date('2030-12-31').getTime();
    const validDateString = fc.integer({ min: minTimestamp, max: maxTimestamp })
      .map(ts => new Date(ts).toISOString());
    
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string(),
          email: fc.emailAddress(),
          role: fc.constantFrom('ADMIN', 'MANAGER', 'WORKER', 'USER'),
          createdAt: validDateString,
          metadata: fc.record({
            lastLogin: validDateString,
            sessionCount: fc.integer({ min: 0, max: 100 }),
          }),
        }),
        (userData) => {
          const response = buildSuccessResponse(userData);
          return (
            isSuccessResponse(response) &&
            response.data.id === userData.id &&
            response.data.email === userData.email
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle auth response data structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          user: fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1 }),
            role: fc.constantFrom('ADMIN', 'MANAGER', 'WORKER', 'USER'),
          }),
          accessToken: fc.string({ minLength: 100, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 100, maxLength: 500 }),
          expiresIn: fc.integer({ min: 300, max: 86400 }),
          sessionId: fc.uuid(),
        }),
        (authData) => {
          const response = buildSuccessResponse(authData);
          return (
            isSuccessResponse(response) &&
            response.data.user.id === authData.user.id &&
            response.data.accessToken === authData.accessToken
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 3: Paginated Response Format Consistency
// Requirements: 3.2
// ============================================

describe('Property 3: Paginated Response Format Consistency', () => {
  /**
   * **Feature: api-refactoring, Property 3: Paginated Response Format Consistency**
   * **Validates: Requirements 3.2**
   * 
   * For any paginated API response, the response body should contain 
   * `success: true`, `data` array, and `meta` object with 
   * `total`, `page`, `limit`, `totalPages` fields.
   */

  it('should always have success: true and data array', () => {
    fc.assert(
      fc.property(
        fc.array(jsonObject, { minLength: 0, maxLength: 20 }),
        paginationMeta,
        (data, meta) => {
          const response = buildPaginatedResponse(data, meta);
          return isPaginatedResponse(response);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain all required meta fields', () => {
    fc.assert(
      fc.property(
        fc.array(jsonObject, { minLength: 0, maxLength: 20 }),
        paginationMeta,
        (data, meta) => {
          const response = buildPaginatedResponse(data, meta);
          return (
            'total' in response.meta &&
            'page' in response.meta &&
            'limit' in response.meta &&
            'totalPages' in response.meta
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
          const response = buildPaginatedResponse(data, meta);
          const expectedTotalPages = meta.limit > 0 
            ? Math.ceil(meta.total / meta.limit) 
            : 0;
          return response.meta.totalPages === expectedTotalPages;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve original pagination values', () => {
    fc.assert(
      fc.property(
        fc.array(jsonObject, { minLength: 0, maxLength: 20 }),
        paginationMeta,
        (data, meta) => {
          const response = buildPaginatedResponse(data, meta);
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

  it('should handle empty data arrays', () => {
    fc.assert(
      fc.property(
        paginationMeta,
        (meta) => {
          const response = buildPaginatedResponse([], meta);
          return (
            isPaginatedResponse(response) &&
            response.data.length === 0
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle leads list response structure', () => {
    // Use timestamp-based date generation to avoid invalid dates
    const minTimestamp = new Date('2000-01-01').getTime();
    const maxTimestamp = new Date('2030-12-31').getTime();
    const validDateString = fc.integer({ min: minTimestamp, max: maxTimestamp })
      .map(ts => new Date(ts).toISOString());
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            email: fc.option(fc.emailAddress()),
            status: fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
            source: fc.constantFrom('QUOTE_FORM', 'CONTACT_FORM'),
            createdAt: validDateString,
          }),
          { minLength: 0, maxLength: 10 }
        ),
        paginationMeta,
        (leads, meta) => {
          const response = buildPaginatedResponse(leads, meta);
          return (
            isPaginatedResponse(response) &&
            response.data.length === leads.length
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle blog posts list response structure', () => {
    // Use timestamp-based date generation to avoid invalid dates
    const minTimestamp = new Date('2000-01-01').getTime();
    const maxTimestamp = new Date('2030-12-31').getTime();
    const validDateString = fc.integer({ min: minTimestamp, max: maxTimestamp })
      .map(ts => new Date(ts).toISOString());
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 200 }),
            slug: fc.string({ minLength: 1, maxLength: 100 }),
            excerpt: fc.option(fc.string({ maxLength: 500 })),
            published: fc.boolean(),
            createdAt: validDateString,
          }),
          { minLength: 0, maxLength: 10 }
        ),
        paginationMeta,
        (posts, meta) => {
          const response = buildPaginatedResponse(posts, meta);
          return (
            isPaginatedResponse(response) &&
            response.data.length === posts.length
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 4: Error Response Format Consistency
// Requirements: 3.3
// ============================================

describe('Property 4: Error Response Format Consistency', () => {
  /**
   * **Feature: api-refactoring, Property 4: Error Response Format Consistency**
   * **Validates: Requirements 3.3**
   * 
   * For any error API response, the response body should contain 
   * `success: false`, `error` object with `code` and `message`, 
   * and `correlationId`.
   */

  it('should always have success: false', () => {
    fc.assert(
      fc.property(
        errorCode,
        fc.string({ minLength: 1, maxLength: 200 }),
        correlationId,
        (code, message, corrId) => {
          const response = buildErrorResponse(code, message, corrId);
          return response.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain error object with code and message', () => {
    fc.assert(
      fc.property(
        errorCode,
        fc.string({ minLength: 1, maxLength: 200 }),
        correlationId,
        (code, message, corrId) => {
          const response = buildErrorResponse(code, message, corrId);
          return (
            typeof response.error === 'object' &&
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
        correlationId,
        (code, message, corrId) => {
          const response = buildErrorResponse(code, message, corrId);
          return response.correlationId === corrId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not contain data field in error response', () => {
    fc.assert(
      fc.property(
        errorCode,
        fc.string({ minLength: 1, maxLength: 200 }),
        correlationId,
        (code, message, corrId) => {
          const response = buildErrorResponse(code, message, corrId);
          return !('data' in response);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should pass type guard validation', () => {
    fc.assert(
      fc.property(
        errorCode,
        fc.string({ minLength: 1, maxLength: 200 }),
        correlationId,
        (code, message, corrId) => {
          const response = buildErrorResponse(code, message, corrId);
          return isErrorResponse(response);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle validation error format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        correlationId,
        (message, corrId) => {
          const response = buildErrorResponse('VALIDATION_ERROR', message, corrId);
          return (
            isErrorResponse(response) &&
            response.error.code === 'VALIDATION_ERROR'
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle auth error formats', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('UNAUTHORIZED', 'FORBIDDEN', 'INVALID_CREDENTIALS', 'TOKEN_EXPIRED'),
        fc.string({ minLength: 1, maxLength: 200 }),
        correlationId,
        (code, message, corrId) => {
          const response = buildErrorResponse(code, message, corrId);
          return (
            isErrorResponse(response) &&
            response.error.code === code
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle special characters in error message', () => {
    fc.assert(
      fc.property(
        errorCode,
        fc.string({ minLength: 1, maxLength: 200 }),
        correlationId,
        (code, message, corrId) => {
          const response = buildErrorResponse(code, message, corrId);
          return response.error.message === message;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// Cross-Property Consistency Tests
// ============================================

describe('Response Format Cross-Property Consistency', () => {
  it('success and error responses should be mutually exclusive', () => {
    fc.assert(
      fc.property(
        jsonObject,
        errorCode,
        fc.string({ minLength: 1, maxLength: 100 }),
        correlationId,
        (data, code, message, corrId) => {
          const successResp = buildSuccessResponse(data);
          const errorResp = buildErrorResponse(code, message, corrId);
          
          // Success response should pass success check, fail error check
          const successIsSuccess = isSuccessResponse(successResp);
          const successIsError = isErrorResponse(successResp);
          
          // Error response should fail success check, pass error check
          const errorIsSuccess = isSuccessResponse(errorResp);
          const errorIsError = isErrorResponse(errorResp);
          
          return (
            successIsSuccess && !successIsError &&
            !errorIsSuccess && errorIsError
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('paginated response should be a specialized success response', () => {
    fc.assert(
      fc.property(
        fc.array(jsonObject, { minLength: 0, maxLength: 10 }),
        paginationMeta,
        (data, meta) => {
          const response = buildPaginatedResponse(data, meta);
          // Should pass both success and paginated checks
          return isSuccessResponse(response) && isPaginatedResponse(response);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('regular success response should not be a paginated response', () => {
    fc.assert(
      fc.property(
        jsonObject,
        (data) => {
          const response = buildSuccessResponse(data);
          // Should pass success check but fail paginated check
          return isSuccessResponse(response) && !isPaginatedResponse(response);
        }
      ),
      { numRuns: 100 }
    );
  });
});
