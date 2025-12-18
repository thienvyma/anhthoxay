/**
 * Validation Middleware
 * 
 * Zod-based validation middleware for request body and query parameters.
 * Returns standardized error responses with correlationId.
 * 
 * **Feature: api-refactoring**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */

import type { Context, Next } from 'hono';
import { type ZodSchema, ZodError } from 'zod';
import { getCorrelationId } from './correlation-id';

// ============================================
// Types
// ============================================

/**
 * Validation error details for a single field
 */
export interface ValidationFieldError {
  field: string;
  message: string;
}

/**
 * Validation error response format
 */
export interface ValidationErrorResponse {
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
// Helper Functions
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
 * Create validation error response
 */
function createValidationErrorResponse(
  c: Context,
  message: string,
  error: ZodError
): Response {
  const correlationId = getCorrelationId(c);
  const details = formatZodError(error);

  const response: ValidationErrorResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      details,
    },
    correlationId,
  };

  return c.json(response, 400);
}

// ============================================
// Validation Middleware
// ============================================

/**
 * Validate request body against a Zod schema
 * 
 * @template T - Type of the validated data
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 * 
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { validate } from '../middleware/validation';
 * 
 * const CreateUserSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 * 
 * app.post('/users', validate(CreateUserSchema), async (c) => {
 *   const data = c.get('validatedBody');
 *   // data is typed as { name: string; email: string }
 * });
 * ```
 */
export function validate<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      
      // Store validated data in context
      c.set('validatedBody', validated);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return createValidationErrorResponse(
          c,
          'Invalid request data',
          error
        );
      }
      
      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        const correlationId = getCorrelationId(c);
        return c.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
            details: {
              fieldErrors: {},
              formErrors: ['Request body must be valid JSON'],
            },
          },
          correlationId,
        }, 400);
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @template T - Type of the validated data
 * @param schema - Zod schema to validate against
 * @returns Hono middleware function
 * 
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { validateQuery } from '../middleware/validation';
 * 
 * const PaginationSchema = z.object({
 *   page: z.coerce.number().int().positive().default(1),
 *   limit: z.coerce.number().int().min(1).max(100).default(20),
 * });
 * 
 * app.get('/users', validateQuery(PaginationSchema), async (c) => {
 *   const { page, limit } = c.get('validatedQuery');
 *   // page and limit are typed as numbers
 * });
 * ```
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validated = schema.parse(query);
      
      // Store validated data in context
      c.set('validatedQuery', validated);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return createValidationErrorResponse(
          c,
          'Invalid query parameters',
          error
        );
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  };
}

/**
 * Get validated body from context
 * Use after validate() middleware
 * 
 * @template T - Expected type of the validated data
 * @param c - Hono context
 * @returns Validated body data
 * @throws Error if validation middleware was not applied
 */
export function getValidatedBody<T>(c: Context): T {
  const data = c.get('validatedBody') as T | undefined;
  if (data === undefined) {
    throw new Error('Validated body not found. Did you apply validate() middleware?');
  }
  return data;
}

/**
 * Get validated query from context
 * Use after validateQuery() middleware
 * 
 * @template T - Expected type of the validated data
 * @param c - Hono context
 * @returns Validated query data
 * @throws Error if validation middleware was not applied
 */
export function getValidatedQuery<T>(c: Context): T {
  const data = c.get('validatedQuery') as T | undefined;
  if (data === undefined) {
    throw new Error('Validated query not found. Did you apply validateQuery() middleware?');
  }
  return data;
}

export default {
  validate,
  validateQuery,
  getValidatedBody,
  getValidatedQuery,
};
