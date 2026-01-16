/**
 * Settings Firestore Routes Module
 * 
 * Handles CRUD operations for application settings using Firestore.
 * Settings are key-value pairs stored in Firestore.
 * 
 * @module routes/firestore/settings.firestore.routes
 * @requirements 3.5
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { firebaseAuth, requireRole } from '../../middleware/firebase-auth.middleware';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { getSettingsFirestoreService } from '../../services/firestore/settings.firestore';
import { cacheService, CacheKeys, CacheTTL } from '../../services/cache.service';
import { logger } from '../../utils/logger';

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Schema for updating a setting value
 * Value can be any JSON-serializable data
 */
export const updateSettingSchema = z.object({
  value: z.unknown(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

// ============================================
// SETTINGS FIRESTORE ROUTES FACTORY
// ============================================

/**
 * Create settings routes using Firestore
 * @returns Hono app with settings routes
 */
export function createSettingsFirestoreRoutes() {
  const app = new Hono();
  const settingsService = getSettingsFirestoreService();

  /**
   * @route GET /settings
   * @description Get all settings as key-value object
   * @access Public
   * @cache 1 minute (TTL: 60 seconds)
   */
  app.get('/', async (c) => {
    try {
      const { data: result, fromCache } = await cacheService.getOrSet(
        CacheKeys.settings,
        CacheTTL.settings,
        async () => {
          return settingsService.getAll();
        }
      );

      // Set cache status header
      c.header('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
      
      return successResponse(c, result);
    } catch (error) {
      logger.error('Get settings error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get settings', 500);
    }
  });

  /**
   * @route GET /settings/:key
   * @description Get a single setting by key
   * @access Public
   * @cache 1 minute (TTL: 60 seconds)
   * @returns { key, value } or { key, value: null } if not found
   */
  app.get('/:key', async (c) => {
    try {
      const key = c.req.param('key');
      const cacheKey = `${CacheKeys.settings}:${key}`;

      const { data: result, fromCache } = await cacheService.getOrSet(
        cacheKey,
        CacheTTL.settings,
        async () => {
          const value = await settingsService.get(key);
          return { key, value };
        }
      );

      // Set cache status header
      c.header('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
      
      return successResponse(c, result);
    } catch (error) {
      logger.error('Get setting error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get setting', 500);
    }
  });

  /**
   * @route PUT /settings/:key
   * @description Create or update a setting by key
   * @access Admin only
   * @body { value: any } - The setting value (JSON-serializable)
   */
  app.put(
    '/:key',
    firebaseAuth(),
    requireRole('ADMIN'),
    validate(updateSettingSchema),
    async (c) => {
      try {
        const key = c.req.param('key');
        const body = getValidatedBody<UpdateSettingInput>(c);
        
        const value = await settingsService.set(key, body.value);
        
        // Invalidate settings cache (all settings and specific key)
        await cacheService.invalidateByPattern('cache:settings*');
        logger.debug('Settings cache invalidated', { key });
        
        return successResponse(c, { key, value });
      } catch (error) {
        logger.error('Update setting error:', { error });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update setting', 500);
      }
    }
  );

  /**
   * @route DELETE /settings/:key
   * @description Delete a setting by key
   * @access Admin only
   */
  app.delete(
    '/:key',
    firebaseAuth(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const key = c.req.param('key');
        
        await settingsService.delete(key);
        
        // Invalidate settings cache
        await cacheService.invalidateByPattern('cache:settings*');
        logger.debug('Settings cache invalidated after delete', { key });
        
        return successResponse(c, { message: `Setting '${key}' deleted successfully` });
      } catch (error) {
        logger.error('Delete setting error:', { error });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete setting', 500);
      }
    }
  );

  return app;
}

export default { createSettingsFirestoreRoutes };
