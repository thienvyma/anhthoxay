/**
 * API Keys Routes Module
 *
 * Handles CRUD operations for API key management.
 * Includes listing, creating, updating, deleting, toggling status, testing, and usage logs.
 * All endpoints require ADMIN role.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 9.1, 10.1, 11.1, 11.2, 12.1, 13.1, 14.1, 15.1, 18.3**
 *
 * @route /api/admin/api-keys
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { ApiKeyService, ApiKeyError } from '../services/api-key.service';
import {
  CreateApiKeySchema,
  UpdateApiKeySchema,
  ListApiKeysQuerySchema,
  type CreateApiKeyInput,
  type UpdateApiKeyInput,
  type ListApiKeysQuery,
} from '../schemas/api-key.schema';

// ============================================
// API KEYS ROUTES FACTORY
// ============================================

/**
 * Create API keys routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with API keys routes
 */
export function createApiKeysRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const apiKeyService = new ApiKeyService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // STATIC ROUTES (must come before parameterized routes)
  // ============================================

  /**
   * @route GET /api/admin/api-keys
   * @description List all API keys with optional filtering
   * @access Admin only
   * @query status - Filter by status (ACTIVE, INACTIVE, EXPIRED)
   * @query search - Search by name
   * Requirements: 9.1
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(ListApiKeysQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<ListApiKeysQuery>(c);
        const apiKeys = await apiKeyService.list(query);
        return successResponse(c, apiKeys);
      } catch (error) {
        console.error('List API keys error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy danh sách API keys', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/api-keys
   * @description Create a new API key
   * @access Admin only
   * @body name - API key name (required, 3-100 chars)
   * @body description - Description (optional)
   * @body scope - Permission scope (READ_ONLY, READ_WRITE, FULL_ACCESS)
   * @body allowedEndpoints - Array of endpoint groups
   * @body expiresAt - Expiration date (optional)
   * Requirements: 10.1
   */
  app.post(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validate(CreateApiKeySchema),
    async (c) => {
      try {
        const data = getValidatedBody<CreateApiKeyInput>(c);
        const user = getUser(c);

        const result = await apiKeyService.create({
          ...data,
          createdBy: user.sub,
        });

        // Return both apiKey and rawKey (rawKey shown only once)
        return successResponse(c, {
          apiKey: result.apiKey,
          rawKey: result.rawKey,
        }, 201);
      } catch (error) {
        if (error instanceof ApiKeyError) {
          if (error.code === 'NAME_EXISTS') {
            return errorResponse(c, 'API_KEY_NAME_EXISTS', error.message, 400);
          }
        }
        console.error('Create API key error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể tạo API key', 500);
      }
    }
  );

  // ============================================
  // API KEY EXPIRATION MANAGEMENT ROUTES
  // (Static paths - must come before /:id routes)
  // ============================================

  /**
   * @route POST /api/admin/api-keys/check-expired
   * @description Check and update expired API keys to EXPIRED status
   * @access Admin only
   * @returns Number of keys updated
   *
   * **Feature: admin-guide-api-keys, Property 15: Expiration Auto-Status**
   * **Validates: Requirements 18.3**
   *
   * This endpoint can be called manually or via a scheduled job (cron)
   * to update the status of expired keys.
   */
  app.post('/check-expired', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const updatedCount = await apiKeyService.checkAndUpdateExpiredKeys();
      return successResponse(c, {
        updatedCount,
        message: updatedCount > 0
          ? `Đã cập nhật ${updatedCount} API key hết hạn`
          : 'Không có API key nào hết hạn cần cập nhật',
      });
    } catch (error) {
      console.error('Check expired API keys error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể kiểm tra API keys hết hạn', 500);
    }
  });

  /**
   * @route GET /api/admin/api-keys/expiring-soon
   * @description Get API keys expiring within a specified number of days
   * @access Admin only
   * @query days - Number of days to look ahead (default: 7)
   * @returns Array of API keys expiring soon
   *
   * **Validates: Requirements 18.1, 18.2**
   */
  app.get('/expiring-soon', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const days = parseInt(c.req.query('days') || '7', 10);
      const keys = await apiKeyService.getKeysExpiringSoon(days);
      return successResponse(c, {
        count: keys.length,
        keys,
        days,
      });
    } catch (error) {
      console.error('Get expiring API keys error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy danh sách API keys sắp hết hạn', 500);
    }
  });

  // ============================================
  // PARAMETERIZED ROUTES (/:id)
  // ============================================

  /**
   * @route GET /api/admin/api-keys/:id
   * @description Get API key details by ID
   * @access Admin only
   * Requirements: 14.1
   */
  app.get('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const apiKey = await apiKeyService.getById(id);

      if (!apiKey) {
        return errorResponse(c, 'API_KEY_NOT_FOUND', 'Không tìm thấy API key', 404);
      }

      return successResponse(c, apiKey);
    } catch (error) {
      console.error('Get API key error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy thông tin API key', 500);
    }
  });

  /**
   * @route PUT /api/admin/api-keys/:id
   * @description Update an existing API key
   * @access Admin only
   * @body name - API key name (optional)
   * @body description - Description (optional)
   * @body scope - Permission scope (optional)
   * @body allowedEndpoints - Array of endpoint groups (optional)
   * @body expiresAt - Expiration date (optional, null to remove)
   * Requirements: 15.1
   */
  app.put(
    '/:id',
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateApiKeySchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const data = getValidatedBody<UpdateApiKeyInput>(c);

        const apiKey = await apiKeyService.update(id, data);
        return successResponse(c, apiKey);
      } catch (error) {
        if (error instanceof ApiKeyError) {
          if (error.code === 'NOT_FOUND') {
            return errorResponse(c, 'API_KEY_NOT_FOUND', error.message, 404);
          }
          if (error.code === 'NAME_EXISTS') {
            return errorResponse(c, 'API_KEY_NAME_EXISTS', error.message, 400);
          }
        }
        console.error('Update API key error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể cập nhật API key', 500);
      }
    }
  );

  /**
   * @route DELETE /api/admin/api-keys/:id
   * @description Delete an API key permanently
   * @access Admin only
   * Requirements: 12.1
   */
  app.delete('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      await apiKeyService.delete(id);
      return successResponse(c, { ok: true });
    } catch (error) {
      if (error instanceof ApiKeyError && error.code === 'NOT_FOUND') {
        return errorResponse(c, 'API_KEY_NOT_FOUND', error.message, 404);
      }
      console.error('Delete API key error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể xóa API key', 500);
    }
  });

  // ============================================
  // API KEY STATUS & TESTING ROUTES
  // ============================================

  /**
   * @route PUT /api/admin/api-keys/:id/toggle
   * @description Toggle API key status between ACTIVE and INACTIVE
   * @access Admin only
   * Requirements: 11.1, 11.2
   */
  app.put('/:id/toggle', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const apiKey = await apiKeyService.toggleStatus(id);
      return successResponse(c, apiKey);
    } catch (error) {
      if (error instanceof ApiKeyError && error.code === 'NOT_FOUND') {
        return errorResponse(c, 'API_KEY_NOT_FOUND', error.message, 404);
      }
      console.error('Toggle API key status error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể thay đổi trạng thái API key', 500);
    }
  });

  /**
   * @route POST /api/admin/api-keys/:id/test
   * @description Test an API key by making an internal API call
   * @access Admin only
   * @body endpoint - The endpoint to test (e.g., /api/leads)
   * Requirements: 13.1
   */
  app.post('/:id/test', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const endpoint = body.endpoint || '/api/leads';

      const result = await apiKeyService.testKey(id, endpoint);
      return successResponse(c, result);
    } catch (error) {
      console.error('Test API key error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể test API key', 500);
    }
  });

  /**
   * @route GET /api/admin/api-keys/:id/logs
   * @description Get usage logs for an API key
   * @access Admin only
   * @query limit - Maximum number of logs to return (default: 10)
   * Requirements: 14.1
   */
  app.get('/:id/logs', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const limit = parseInt(c.req.query('limit') || '10', 10);

      // Verify API key exists
      const apiKey = await apiKeyService.getById(id);
      if (!apiKey) {
        return errorResponse(c, 'API_KEY_NOT_FOUND', 'Không tìm thấy API key', 404);
      }

      const logs = await apiKeyService.getUsageLogs(id, limit);
      return successResponse(c, logs);
    } catch (error) {
      console.error('Get API key logs error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy lịch sử sử dụng', 500);
    }
  });

  return app;
}

export default { createApiKeysRoutes };
