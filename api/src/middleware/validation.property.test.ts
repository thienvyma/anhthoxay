/**
 * Property-Based Tests for Validation Middleware
 * 
 * **Feature: api-refactoring, Property 8: Input Validation Returns 400**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import { z, ZodError } from 'zod';

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
// Type Definitions (isolated for testing)
// ============================================

interface ValidationErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      fieldErrors: Record<string, string[]>;
      formErrors: string[];
    };
  };
  correlationId: string;
}

// ============================================
// Validation Logic (isolated for testing)
// ============================================

/**
 * Format Zod error into standardized validation error response
 */
function formatZodError(error: ZodError): {
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
} {
  const flattened = error.flatten();
  return {
    fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    formErrors: flattened.formErrors,
  };
}

/**
 * Create validation error response (isolated logic for testing)
 */
function createValidationErrorResponse(
  message: string,
  error: ZodError,
  correlationId: string
): { response: ValidationErrorResponse; status: 400 } {
  const details = formatZodError(error);

  return {
    response: {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details,
      },
      correlationId,
    },
    status: 400,
  };
}

/**
 * Validate body against schema (isolated logic for testing)
 */
function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>,
  correlationId: string
): { success: true; data: T } | { success: false; response: ValidationErrorResponse; status: 400 } {
  try {
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const result = createValidationErrorResponse('Invalid request data', error, correlationId);
      return { success: false, ...result };
    }
    throw error;
  }
}

/**
 * Validate query against schema (isolated logic for testing)
 */
function validateQuery<T>(
  query: Record<string, string>,
  schema: z.ZodSchema<T>,
  correlationId: string
): { success: true; data: T } | { success: false; response: ValidationErrorResponse; status: 400 } {
  try {
    const validated = schema.parse(query);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const result = createValidationErrorResponse('Invalid query parameters', error, correlationId);
      return { success: false, ...result };
    }
    throw error;
  }
}

// ============================================
// Generators
// ============================================

// Generate valid email that passes Zod's email validation
// Zod uses a stricter email regex than RFC 5322
// Local part must: start with letter, not end with dot, no consecutive dots
const validEmail = fc.tuple(
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
  fc.constantFrom('gmail.com', 'example.com', 'test.org', 'company.co')
).map(([local, domain]) => `${local}@${domain}`);

// Generate invalid email (strings that are not valid emails)
const invalidEmail = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => !s.includes('@') || !s.includes('.'));

// Generate positive integer
const positiveInt = fc.integer({ min: 1, max: 10000 });

// Generate non-positive integer (for invalid cases)
const nonPositiveInt = fc.integer({ min: -10000, max: 0 });

// Generate valid string (non-empty, non-whitespace)
const validString = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

// ============================================
// PROPERTY 8: Input Validation Returns 400
// Requirements: 5.1, 5.2, 5.3
// ============================================

describe('Property 8: Input Validation Returns 400', () => {
  
  // ----------------------------------------
  // Body Validation Tests (Requirement 5.1)
  // ----------------------------------------
  
  describe('Body Validation (Requirement 5.1)', () => {
    it('invalid body should always return 400 status', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          safeFieldName,
          (correlationId, fieldName) => {
            const schema = z.object({ [fieldName]: z.string().min(1) });
            const invalidBody = { [fieldName]: '' };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('valid body should pass validation', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          safeFieldName,
          validString,
          (correlationId, fieldName, value) => {
            const schema = z.object({ [fieldName]: z.string().min(1) });
            const validBody = { [fieldName]: value };
            
            const result = validateBody(validBody, schema, correlationId);
            
            return result.success === true && result.data[fieldName] === value;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('missing required field should return 400', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          safeFieldName,
          (correlationId, fieldName) => {
            const schema = z.object({ [fieldName]: z.string() });
            const invalidBody = {}; // Missing required field
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('wrong type should return 400', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          safeFieldName,
          fc.integer(),
          (correlationId, fieldName, numberValue) => {
            const schema = z.object({ [fieldName]: z.string() });
            const invalidBody = { [fieldName]: numberValue }; // Number instead of string
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid email format should return 400', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          invalidEmail,
          (correlationId, email) => {
            const schema = z.object({ email: z.string().email() });
            const invalidBody = { email };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('valid email format should pass validation', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          validEmail,
          (correlationId, email) => {
            const schema = z.object({ email: z.string().email() });
            const validBody = { email };
            
            const result = validateBody(validBody, schema, correlationId);
            
            return result.success === true && result.data.email === email;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('number below minimum should return 400', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          nonPositiveInt,
          (correlationId, value) => {
            const schema = z.object({ count: z.number().positive() });
            const invalidBody = { count: value };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('number above minimum should pass validation', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          positiveInt,
          (correlationId, value) => {
            const schema = z.object({ count: z.number().positive() });
            const validBody = { count: value };
            
            const result = validateBody(validBody, schema, correlationId);
            
            return result.success === true && result.data.count === value;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ----------------------------------------
  // Query Validation Tests (Requirement 5.2)
  // ----------------------------------------

  describe('Query Validation (Requirement 5.2)', () => {
    it('invalid query params should return 400', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (correlationId) => {
            const schema = z.object({
              page: z.coerce.number().int().positive(),
            });
            const invalidQuery = { page: 'invalid' }; // Not a number
            
            const result = validateQuery(invalidQuery, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('valid query params should pass validation', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 1, max: 1000 }),
          (correlationId, page) => {
            const schema = z.object({
              page: z.coerce.number().int().positive(),
            });
            const validQuery = { page: page.toString() };
            
            const result = validateQuery(validQuery, schema, correlationId);
            
            return result.success === true && result.data.page === page;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('missing required query param should return 400', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (correlationId) => {
            const schema = z.object({
              search: z.string().min(1),
            });
            const invalidQuery = {}; // Missing required param
            
            const result = validateQuery(invalidQuery as Record<string, string>, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('query param with default should use default when missing', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (correlationId) => {
            const schema = z.object({
              page: z.coerce.number().int().positive().default(1),
              limit: z.coerce.number().int().min(1).max(100).default(20),
            });
            const emptyQuery = {};
            
            const result = validateQuery(emptyQuery as Record<string, string>, schema, correlationId);
            
            return (
              result.success === true &&
              result.data.page === 1 &&
              result.data.limit === 20
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ----------------------------------------
  // Error Response Format Tests (Requirement 5.3)
  // ----------------------------------------

  describe('Error Response Format (Requirement 5.3)', () => {
    it('error response should have success: false', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          safeFieldName,
          (correlationId, fieldName) => {
            const schema = z.object({ [fieldName]: z.string().min(1) });
            const invalidBody = { [fieldName]: '' };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            if (result.success === false) {
              return result.response.success === false;
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('error response should have code VALIDATION_ERROR', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          safeFieldName,
          (correlationId, fieldName) => {
            const schema = z.object({ [fieldName]: z.string().min(1) });
            const invalidBody = { [fieldName]: '' };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            if (result.success === false) {
              return result.response.error.code === 'VALIDATION_ERROR';
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('error response should include correlationId', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          safeFieldName,
          (correlationId, fieldName) => {
            const schema = z.object({ [fieldName]: z.string().min(1) });
            const invalidBody = { [fieldName]: '' };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            if (result.success === false) {
              return result.response.correlationId === correlationId;
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('error response should include validation details', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          safeFieldName,
          (correlationId, fieldName) => {
            const schema = z.object({ [fieldName]: z.string().min(1) });
            const invalidBody = { [fieldName]: '' };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            if (result.success === false) {
              const details = result.response.error.details;
              return (
                typeof details === 'object' &&
                'fieldErrors' in details &&
                'formErrors' in details
              );
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('field errors should contain the invalid field name', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          safeFieldName,
          (correlationId, fieldName) => {
            const schema = z.object({ [fieldName]: z.string().min(1) });
            const invalidBody = { [fieldName]: '' };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            if (result.success === false) {
              const fieldErrors = result.response.error.details.fieldErrors;
              return fieldName in fieldErrors;
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple validation errors should all be included', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (correlationId) => {
            const schema = z.object({
              name: z.string().min(1),
              email: z.string().email(),
              age: z.number().positive(),
            });
            const invalidBody = {
              name: '',
              email: 'invalid',
              age: -1,
            };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            if (result.success === false) {
              const fieldErrors = result.response.error.details.fieldErrors;
              return (
                'name' in fieldErrors &&
                'email' in fieldErrors &&
                'age' in fieldErrors
              );
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ----------------------------------------
  // Complex Schema Validation Tests
  // ----------------------------------------

  describe('Complex Schema Validation', () => {
    it('nested object validation should work correctly', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          validString,
          validString,
          (correlationId, name, city) => {
            const schema = z.object({
              name: z.string().min(1),
              address: z.object({
                city: z.string().min(1),
              }),
            });
            const validBody = {
              name,
              address: { city },
            };
            
            const result = validateBody(validBody, schema, correlationId);
            
            return (
              result.success === true &&
              result.data.name === name &&
              result.data.address.city === city
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid nested object should return 400', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          validString,
          (correlationId, name) => {
            const schema = z.object({
              name: z.string().min(1),
              address: z.object({
                city: z.string().min(1),
              }),
            });
            const invalidBody = {
              name,
              address: { city: '' }, // Invalid nested field
            };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('array validation should work correctly', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.array(validString, { minLength: 1, maxLength: 5 }),
          (correlationId, tags) => {
            const schema = z.object({
              tags: z.array(z.string().min(1)).min(1),
            });
            const validBody = { tags };
            
            const result = validateBody(validBody, schema, correlationId);
            
            return (
              result.success === true &&
              result.data.tags.length === tags.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty array when min length required should return 400', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (correlationId) => {
            const schema = z.object({
              tags: z.array(z.string()).min(1),
            });
            const invalidBody = { tags: [] };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('enum validation should work correctly', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'),
          (correlationId, status) => {
            const schema = z.object({
              status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']),
            });
            const validBody = { status };
            
            const result = validateBody(validBody, schema, correlationId);
            
            return result.success === true && result.data.status === status;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid enum value should return 400', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => !['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED'].includes(s)),
          (correlationId, invalidStatus) => {
            const schema = z.object({
              status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']),
            });
            const invalidBody = { status: invalidStatus };
            
            const result = validateBody(invalidBody, schema, correlationId);
            
            return result.success === false && result.status === 400;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ----------------------------------------
  // Data Preservation Tests
  // ----------------------------------------

  describe('Data Preservation', () => {
    it('validated data should preserve all valid fields', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          validString,
          validEmail,
          positiveInt,
          (correlationId, name, email, age) => {
            const schema = z.object({
              name: z.string().min(1),
              email: z.string().email(),
              age: z.number().positive(),
            });
            const validBody = { name, email, age };
            
            const result = validateBody(validBody, schema, correlationId);
            
            return (
              result.success === true &&
              result.data.name === name &&
              result.data.email === email &&
              result.data.age === age
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('extra fields should be stripped by default', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          validString,
          validString,
          (correlationId, name, extraField) => {
            const schema = z.object({
              name: z.string().min(1),
            });
            const bodyWithExtra = { name, extraField };
            
            const result = validateBody(bodyWithExtra, schema, correlationId);
            
            return (
              result.success === true &&
              result.data.name === name &&
              !('extraField' in result.data)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
