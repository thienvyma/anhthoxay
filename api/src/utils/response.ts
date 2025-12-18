/**
 * Response Helper Utilities
 * 
 * Standardized response format for all API endpoints.
 * 
 * **Feature: api-refactoring**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 */

import type { Context } from 'hono';
import { getCorrelationId } from '../middleware/correlation-id';

// ============================================
// Response Type Definitions
// ============================================

/**
 * Standard success response format
 * @template T - Type of the data payload
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated response format
 * @template T - Type of items in the data array
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

/**
 * Error details object
 */
export interface ErrorDetails {
  code: string;
  message: string;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: ErrorDetails;
  correlationId: string;
}

// ============================================
// Response Helper Functions
// ============================================

/**
 * Create a standardized success response
 * 
 * @template T - Type of the data payload
 * @param c - Hono context
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns JSON response with success format
 * 
 * @example
 * ```ts
 * // In route handler
 * app.get('/api/users/:id', async (c) => {
 *   const user = await getUser(id);
 *   return successResponse(c, user);
 * });
 * 
 * // With custom status
 * app.post('/api/users', async (c) => {
 *   const user = await createUser(data);
 *   return successResponse(c, user, 201);
 * });
 * ```
 */
export function successResponse<T>(
  c: Context,
  data: T,
  status = 200
) {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  return c.json(response, status as 200 | 201);
}

/**
 * Create a standardized paginated response
 * 
 * @template T - Type of items in the data array
 * @param c - Hono context
 * @param data - Array of items
 * @param meta - Pagination metadata (total, page, limit)
 * @returns JSON response with paginated format
 * 
 * @example
 * ```ts
 * app.get('/api/users', async (c) => {
 *   const page = parseInt(c.req.query('page') || '1');
 *   const limit = parseInt(c.req.query('limit') || '20');
 *   
 *   const [users, total] = await Promise.all([
 *     getUsers({ skip: (page - 1) * limit, take: limit }),
 *     countUsers(),
 *   ]);
 *   
 *   return paginatedResponse(c, users, { total, page, limit });
 * });
 * ```
 */
export function paginatedResponse<T>(
  c: Context,
  data: T[],
  meta: { total: number; page: number; limit: number }
) {
  const totalPages = meta.limit > 0 ? Math.ceil(meta.total / meta.limit) : 0;
  
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    meta: {
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages,
    },
  };
  
  return c.json(response, 200);
}

/**
 * Create a standardized error response
 * 
 * @param c - Hono context
 * @param code - Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 400)
 * @returns JSON response with error format
 * 
 * @example
 * ```ts
 * // Validation error
 * app.post('/api/users', async (c) => {
 *   if (!isValid(data)) {
 *     return errorResponse(c, 'VALIDATION_ERROR', 'Invalid email format', 400);
 *   }
 * });
 * 
 * // Not found error
 * app.get('/api/users/:id', async (c) => {
 *   const user = await getUser(id);
 *   if (!user) {
 *     return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
 *   }
 * });
 * 
 * // Unauthorized error
 * app.get('/api/admin', async (c) => {
 *   if (!isAdmin(user)) {
 *     return errorResponse(c, 'FORBIDDEN', 'Admin access required', 403);
 *   }
 * });
 * ```
 */
export function errorResponse(
  c: Context,
  code: string,
  message: string,
  status = 400
) {
  const correlationId = getCorrelationId(c);
  
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
    correlationId,
  };
  
  return c.json(response, status as 400 | 401 | 403 | 404 | 409 | 500);
}

export default {
  successResponse,
  paginatedResponse,
  errorResponse,
};
