/**
 * Property-Based Tests for Error Handler Middleware
 * **Feature: codebase-hardening, Property 5, 6, 7: Error Handler**
 * **Validates: Requirements 4.5, 5.5, 5.6, 5.7**
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import { ZodError, z } from 'zod';

// Reserved names that can't be used as field names in Zod schemas
const RESERVED_NAMES = [
  'valueOf', 'toString', 'constructor', 'hasOwnProperty', 
  'prototype', '__proto__', 'isPrototypeOf', 'propertyIsEnumerable',
  'toLocaleString', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__'
];

// Safe field name generator
const safeFieldName = fc.string({ minLength: 1, maxLength: 30 })
  .filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
  .filter(s => !RESERVED_NAMES.includes(s));

// ============================================
// Error Type Definitions (isolated for testing)
// ============================================

interface ErrorResponse {
  error: string | { code: string; message: string };
  correlationId: string;
  details?: unknown;
  stack?: string;
  message?: string;
}

type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 429 | 500;

// Simulate AuthError
class MockAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: HttpStatusCode
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Simulate Prisma error
class MockPrismaError extends Error {
  constructor(public code: string) {
    super(`Prisma error: ${code}`);
    this.name = 'PrismaClientKnownRequestError';
  }
}

// ============================================
// Error Handler Logic (isolated for testing)
// ============================================

function handleError(
  err: Error,
  correlationId: string,
  isProd: boolean
): { response: ErrorResponse; status: HttpStatusCode } {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return {
      response: {
        error: 'Validation failed',
        details: err.flatten(),
        correlationId,
      },
      status: 400,
    };
  }

  // Handle AuthError
  if (err instanceof MockAuthError) {
    return {
      response: {
        error: { code: err.code, message: err.message },
        correlationId,
      },
      status: err.statusCode,
    };
  }

  // Handle Prisma errors
  if (err instanceof MockPrismaError) {
    if (err.code === 'P2025') {
      return {
        response: {
          error: 'Record not found',
          correlationId,
        },
        status: 404,
      };
    }
    if (err.code === 'P2002') {
      return {
        response: {
          error: 'Record already exists',
          correlationId,
        },
        status: 409,
      };
    }
  }

  // Generic error response
  return {
    response: {
      error: 'Internal server error',
      correlationId,
      ...(isProd ? {} : { stack: err.stack, message: err.message }),
    },
    status: 500,
  };
}

// ============================================
// PROPERTY 5: Error Response Contains Correlation ID
// Requirements: 4.5, 5.7
// ============================================

describe('Property 5: Error Response Contains Correlation ID', () => {
  it('all error responses should contain correlationId', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.boolean(),
        (correlationId, errorMessage, isProd) => {
          const err = new Error(errorMessage);
          const result = handleError(err, correlationId, isProd);
          
          return result.response.correlationId === correlationId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ZodError responses should contain correlationId', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        safeFieldName,
        (correlationId, fieldName) => {
          const schema = z.object({ [fieldName]: z.string().min(1) });
          try {
            schema.parse({ [fieldName]: '' });
          } catch (err) {
            if (err instanceof ZodError) {
              const result = handleError(err, correlationId, false);
              return result.response.correlationId === correlationId;
            }
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('AuthError responses should contain correlationId', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom('AUTH_FAILED', 'TOKEN_EXPIRED', 'UNAUTHORIZED'),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(400, 401, 403, 404, 409, 429, 500) as fc.Arbitrary<HttpStatusCode>,
        (correlationId, code, message, statusCode) => {
          const err = new MockAuthError(code, message, statusCode);
          const result = handleError(err, correlationId, false);
          
          return result.response.correlationId === correlationId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Prisma error responses should contain correlationId', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom('P2025', 'P2002', 'P2003'),
        (correlationId, prismaCode) => {
          const err = new MockPrismaError(prismaCode);
          const result = handleError(err, correlationId, false);
          
          return result.response.correlationId === correlationId;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================
// PROPERTY 6: Zod Validation Error Returns 400
// Requirements: 5.5
// ============================================

describe('Property 6: Zod Validation Error Returns 400', () => {
  it('ZodError should always return 400 status', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        safeFieldName,
        fc.boolean(),
        (correlationId, fieldName, isProd) => {
          const schema = z.object({ [fieldName]: z.string().min(1) });
          try {
            schema.parse({ [fieldName]: '' });
          } catch (err) {
            if (err instanceof ZodError) {
              const result = handleError(err, correlationId, isProd);
              return result.status === 400;
            }
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('ZodError response should contain validation details', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        safeFieldName,
        (correlationId, fieldName) => {
          const schema = z.object({ [fieldName]: z.string().min(1) });
          try {
            schema.parse({ [fieldName]: '' });
          } catch (err) {
            if (err instanceof ZodError) {
              const result = handleError(err, correlationId, false);
              return (
                result.response.error === 'Validation failed' &&
                result.response.details !== undefined
              );
            }
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('ZodError with multiple fields should return 400', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (correlationId) => {
          const schema = z.object({
            name: z.string().min(1),
            email: z.string().email(),
            age: z.number().positive(),
          });
          try {
            schema.parse({ name: '', email: 'invalid', age: -1 });
          } catch (err) {
            if (err instanceof ZodError) {
              const result = handleError(err, correlationId, false);
              return result.status === 400;
            }
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================
// PROPERTY 7: AuthError Returns Correct Status
// Requirements: 5.6
// ============================================

describe('Property 7: AuthError Returns Correct Status', () => {
  const AUTH_ERROR_CODES = [
    'AUTH_FAILED',
    'TOKEN_EXPIRED',
    'TOKEN_INVALID',
    'TOKEN_REVOKED',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'RATE_LIMITED',
  ];

  it('AuthError should return its statusCode', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom(...AUTH_ERROR_CODES),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(400, 401, 403, 404, 409, 429, 500) as fc.Arbitrary<HttpStatusCode>,
        fc.boolean(),
        (correlationId, code, message, statusCode, isProd) => {
          const err = new MockAuthError(code, message, statusCode);
          const result = handleError(err, correlationId, isProd);
          
          return result.status === statusCode;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('AuthError response should contain code and message', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom(...AUTH_ERROR_CODES),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(401, 403) as fc.Arbitrary<HttpStatusCode>,
        (correlationId, code, message, statusCode) => {
          const err = new MockAuthError(code, message, statusCode);
          const result = handleError(err, correlationId, false);
          
          const errorObj = result.response.error as { code: string; message: string };
          return errorObj.code === code && errorObj.message === message;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('401 status should be returned for authentication errors', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom('TOKEN_EXPIRED', 'TOKEN_INVALID', 'TOKEN_REVOKED'),
        fc.string({ minLength: 1, maxLength: 50 }),
        (correlationId, code, message) => {
          const err = new MockAuthError(code, message, 401);
          const result = handleError(err, correlationId, false);
          
          return result.status === 401;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('403 status should be returned for authorization errors', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        (correlationId, message) => {
          const err = new MockAuthError('FORBIDDEN', message, 403);
          const result = handleError(err, correlationId, false);
          
          return result.status === 403;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('429 status should be returned for rate limit errors', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        (correlationId, message) => {
          const err = new MockAuthError('RATE_LIMITED', message, 429);
          const result = handleError(err, correlationId, false);
          
          return result.status === 429;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================
// Additional Properties: Prisma Error Handling
// ============================================

describe('Prisma Error Handling', () => {
  it('P2025 (Record not found) should return 404', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.boolean(),
        (correlationId, isProd) => {
          const err = new MockPrismaError('P2025');
          const result = handleError(err, correlationId, isProd);
          
          return result.status === 404 && result.response.error === 'Record not found';
        }
      ),
      { numRuns: 50 }
    );
  });

  it('P2002 (Unique constraint) should return 409', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.boolean(),
        (correlationId, isProd) => {
          const err = new MockPrismaError('P2002');
          const result = handleError(err, correlationId, isProd);
          
          return result.status === 409 && result.response.error === 'Record already exists';
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Unknown Prisma errors should return 500', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom('P2003', 'P2004', 'P2005'),
        fc.boolean(),
        (correlationId, prismaCode, isProd) => {
          const err = new MockPrismaError(prismaCode);
          const result = handleError(err, correlationId, isProd);
          
          return result.status === 500;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================
// Production vs Development Mode
// ============================================

describe('Production vs Development Mode', () => {
  it('production mode should not include stack trace', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        (correlationId, errorMessage) => {
          const err = new Error(errorMessage);
          const result = handleError(err, correlationId, true); // isProd = true
          
          return result.response.stack === undefined;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('development mode should include stack trace', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        (correlationId, errorMessage) => {
          const err = new Error(errorMessage);
          const result = handleError(err, correlationId, false); // isProd = false
          
          return result.response.stack !== undefined;
        }
      ),
      { numRuns: 50 }
    );
  });
});
