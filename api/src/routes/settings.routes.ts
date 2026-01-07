/**
 * Settings Routes Module
 * 
 * Handles CRUD operations for application settings.
 * Settings are key-value pairs stored in the database.
 * 
 * **Feature: api-refactoring**
 * **Requirements: 1.1, 1.2, 1.3, 3.5, 5.1, 6.1, 6.2**
 */

import { Hono } from 'hono';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, getValidatedBody } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { cacheService, CacheKeys, CacheTTL } from '../services/cache.service';
import { logger } from '../utils/logger';

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Schema for updating a setting value
 * Value can be any JSON-serializable data
 */
export const updateSettingSchema = z.object({
  value: z.any(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

// ============================================
// SETTINGS ROUTES FACTORY
// ============================================

/**
 * Create settings routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with settings routes
 */
export function createSettingsRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

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
          const settings = await prisma.settings.findMany();
          const settingsObj: Record<string, Prisma.JsonValue> = {};
          
          settings.forEach((s) => {
            try {
              settingsObj[s.key] = JSON.parse(s.value) as Prisma.JsonValue;
            } catch {
              // If parsing fails, store as string
              settingsObj[s.key] = s.value;
            }
          });
          
          return settingsObj;
        }
      );

      // Set cache status header
      c.header('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
      
      return successResponse(c, result);
    } catch (error) {
      console.error('Get settings error:', error);
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
          const setting = await prisma.settings.findUnique({ where: { key } });
          
          // Return null value instead of 404 for non-existent settings
          // This allows frontend to handle missing settings gracefully
          if (!setting) {
            return { key, value: null };
          }
          
          let value: Prisma.JsonValue;
          try {
            value = JSON.parse(setting.value) as Prisma.JsonValue;
          } catch {
            // If parsing fails, return as string
            value = setting.value;
          }
          
          return { key, value };
        }
      );

      // Set cache status header
      c.header('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
      
      return successResponse(c, result);
    } catch (error) {
      console.error('Get setting error:', error);
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
    authenticate(),
    requireRole('ADMIN'),
    validate(updateSettingSchema),
    async (c) => {
      try {
        const key = c.req.param('key');
        const body = getValidatedBody<UpdateSettingInput>(c);
        
        const setting = await prisma.settings.upsert({
          where: { key },
          update: { value: JSON.stringify(body.value) },
          create: { key, value: JSON.stringify(body.value) },
        });
        
        let value: Prisma.JsonValue;
        try {
          value = JSON.parse(setting.value) as Prisma.JsonValue;
        } catch {
          value = setting.value;
        }
        
        // Invalidate settings cache (all settings and specific key)
        await cacheService.invalidateByPattern('cache:settings*');
        logger.debug('Settings cache invalidated', { key });
        
        return successResponse(c, value);
      } catch (error) {
        console.error('Update setting error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update setting', 500);
      }
    }
  );

  return app;
}

export default { createSettingsRoutes };
