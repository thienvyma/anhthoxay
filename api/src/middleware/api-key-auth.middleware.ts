/**
 * API Key Authentication Middleware
 *
 * Middleware for authenticating external API requests using API keys.
 * Supports both JWT auth and API key auth for flexibility.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 16.1, 16.2, 16.3, 16.4, 17.1, 17.2, 17.3**
 */

import type { Context, Next } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { ApiKeyService, type ApiKey } from '../services/api-key.service';
import { getCorrelationId } from './correlation-id';

// ============================================
// TYPES
// ============================================

export interface ApiKeyAuthContext {
  apiKey: ApiKey;
}

// ============================================
// ERROR CODES & MESSAGES
// ============================================

export const API_KEY_ERROR_CODES = {
  API_KEY_REQUIRED: 'API_KEY_REQUIRED',
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_KEY_INACTIVE: 'API_KEY_INACTIVE',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ENDPOINT_NOT_ALLOWED: 'ENDPOINT_NOT_ALLOWED',
  SCOPE_INSUFFICIENT: 'SCOPE_INSUFFICIENT',
} as const;

export const API_KEY_ERROR_MESSAGES: Record<string, string> = {
  [API_KEY_ERROR_CODES.API_KEY_REQUIRED]: 'Yêu cầu API key',
  [API_KEY_ERROR_CODES.API_KEY_INVALID]: 'API key không hợp lệ',
  [API_KEY_ERROR_CODES.API_KEY_INACTIVE]: 'API key đã bị tắt',
  [API_KEY_ERROR_CODES.API_KEY_EXPIRED]: 'API key đã hết hạn',
  [API_KEY_ERROR_CODES.PERMISSION_DENIED]: 'Không có quyền truy cập',
  [API_KEY_ERROR_CODES.ENDPOINT_NOT_ALLOWED]: 'Endpoint không được phép',
  [API_KEY_ERROR_CODES.SCOPE_INSUFFICIENT]: 'Quyền không đủ cho thao tác này',
  SCOPE_READ_ONLY: 'Key này chỉ có quyền đọc',
  SCOPE_NO_DELETE: 'Key này không có quyền xóa',
};

// ============================================
// MIDDLEWARE FACTORY
// ============================================

/**
 * Create API Key authentication middleware factory
 * @param prisma - Prisma client instance
 * @returns Middleware functions for API key authentication
 */
export function createApiKeyAuthMiddleware(prisma: PrismaClient) {
  const apiKeyService = new ApiKeyService(prisma);

  /**
   * API Key authentication middleware
   * Extracts X-API-Key header, validates key, checks permissions, and logs usage
   *
   * @returns Hono middleware function
   *
   * @example
   * ```ts
   * // Apply to a route
   * app.get('/api/leads', apiKeyAuth(), async (c) => {
   *   const apiKey = c.get('apiKey');
   *   // ... handle request
   * });
   * ```
   */
  function apiKeyAuth() {
    return async (c: Context, next: Next) => {
      const startTime = Date.now();
      const correlationId = getCorrelationId(c);

      // Extract X-API-Key header
      const rawKey = c.req.header('X-API-Key');

      if (!rawKey) {
        return c.json(
          {
            success: false,
            error: {
              code: API_KEY_ERROR_CODES.API_KEY_REQUIRED,
              message: API_KEY_ERROR_MESSAGES[API_KEY_ERROR_CODES.API_KEY_REQUIRED],
            },
            correlationId,
          },
          401
        );
      }

      // Validate key using apiKeyService.validateKey()
      const apiKey = await apiKeyService.validateKey(rawKey);

      if (!apiKey) {
        return c.json(
          {
            success: false,
            error: {
              code: API_KEY_ERROR_CODES.API_KEY_INVALID,
              message: API_KEY_ERROR_MESSAGES[API_KEY_ERROR_CODES.API_KEY_INVALID],
            },
            correlationId,
          },
          401
        );
      }

      // Check if key is inactive
      if (apiKey.status === 'INACTIVE') {
        return c.json(
          {
            success: false,
            error: {
              code: API_KEY_ERROR_CODES.API_KEY_INACTIVE,
              message: API_KEY_ERROR_MESSAGES[API_KEY_ERROR_CODES.API_KEY_INACTIVE],
            },
            correlationId,
          },
          401
        );
      }

      // Check if key is expired
      if (apiKey.status === 'EXPIRED') {
        return c.json(
          {
            success: false,
            error: {
              code: API_KEY_ERROR_CODES.API_KEY_EXPIRED,
              message: API_KEY_ERROR_MESSAGES[API_KEY_ERROR_CODES.API_KEY_EXPIRED],
            },
            correlationId,
          },
          401
        );
      }

      // Check permissions using apiKeyService.checkPermission()
      const method = c.req.method;
      const path = c.req.path;
      const permissionCheck = apiKeyService.checkPermission(apiKey, method, path);

      if (!permissionCheck.allowed) {
        const errorCode = permissionCheck.errorCode || API_KEY_ERROR_CODES.PERMISSION_DENIED;
        const message =
          API_KEY_ERROR_MESSAGES[errorCode] ||
          API_KEY_ERROR_MESSAGES[API_KEY_ERROR_CODES.PERMISSION_DENIED];

        return c.json(
          {
            success: false,
            error: {
              code: errorCode,
              message,
            },
            correlationId,
          },
          403
        );
      }

      // Set API key in context
      c.set('apiKey', apiKey);

      // Continue to next middleware/handler
      await next();

      // Log usage on success (after response)
      const responseTime = Date.now() - startTime;
      const statusCode = c.res.status;

      // Log usage asynchronously (don't block response)
      apiKeyService
        .logUsage(apiKey.id, {
          endpoint: path,
          method,
          statusCode,
          responseTime,
          ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
          userAgent: c.req.header('user-agent'),
        })
        .catch((err) => {
          console.error('Failed to log API key usage:', err);
        });
    };
  }

  /**
   * Optional API Key or JWT authentication middleware
   * Allows both JWT auth (Bearer token) and API key auth (X-API-Key header)
   * Useful for routes that should work with both authentication methods
   *
   * @returns Hono middleware function
   *
   * @example
   * ```ts
   * // Apply to a route that accepts both auth methods
   * app.get('/api/leads', optionalApiKeyOrJwt(), async (c) => {
   *   const apiKey = c.get('apiKey');
   *   const user = c.get('user');
   *   // Either apiKey or user will be set
   * });
   * ```
   */
  function optionalApiKeyOrJwt() {
    return async (c: Context, next: Next) => {
      const startTime = Date.now();

      // Check for X-API-Key header first
      const rawKey = c.req.header('X-API-Key');

      if (rawKey) {
        // Validate API key
        const apiKey = await apiKeyService.validateKey(rawKey);

        if (apiKey && apiKey.status === 'ACTIVE') {
          // Check permissions
          const method = c.req.method;
          const path = c.req.path;
          const permissionCheck = apiKeyService.checkPermission(apiKey, method, path);

          if (permissionCheck.allowed) {
            // Set API key in context
            c.set('apiKey', apiKey);

            // Continue to next middleware/handler
            await next();

            // Log usage on success
            const responseTime = Date.now() - startTime;
            const statusCode = c.res.status;

            apiKeyService
              .logUsage(apiKey.id, {
                endpoint: path,
                method,
                statusCode,
                responseTime,
                ipAddress:
                  c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
                userAgent: c.req.header('user-agent'),
              })
              .catch((err) => {
                console.error('Failed to log API key usage:', err);
              });

            return;
          }
        }
      }

      // If no valid API key, continue without setting apiKey
      // JWT auth middleware will handle Bearer token if present
      await next();
    };
  }

  return {
    apiKeyAuth,
    optionalApiKeyOrJwt,
    apiKeyService,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get API key from context (use after apiKeyAuth middleware)
 * @param c - Hono context
 * @returns The validated API key or undefined
 */
export function getApiKey(c: Context): ApiKey | undefined {
  return c.get('apiKey') as ApiKey | undefined;
}

/**
 * Check if request is authenticated via API key
 * @param c - Hono context
 * @returns True if request has valid API key
 */
export function isApiKeyAuth(c: Context): boolean {
  return !!getApiKey(c);
}
