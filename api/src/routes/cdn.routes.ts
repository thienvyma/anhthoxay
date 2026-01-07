/**
 * CDN Routes Module
 *
 * Admin endpoints for CDN cache management and purging.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.4, 2.6**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, getValidatedBody } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { getCDNService } from '../services/cdn.service';
import { logger } from '../utils/logger';

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Schema for purge paths request
 */
const PurgePathsSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(100),
});

/**
 * Schema for purge media request
 */
const PurgeMediaSchema = z.object({
  urls: z.array(z.string().min(1)).min(1).max(100),
});

/**
 * Schema for purge API cache request
 */
const PurgeApiSchema = z.object({
  apiPaths: z.array(z.string().min(1)).min(1).max(50),
});

type PurgePathsInput = z.infer<typeof PurgePathsSchema>;
type PurgeMediaInput = z.infer<typeof PurgeMediaSchema>;
type PurgeApiInput = z.infer<typeof PurgeApiSchema>;

// ============================================
// CDN ROUTES FACTORY
// ============================================

/**
 * Create CDN routes with dependency injection
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.4, 2.6**
 *
 * @param prisma - Prisma client instance
 * @returns Hono app with CDN routes
 */
export function createCDNRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const cdnService = getCDNService();

  // ============================================
  // CDN STATUS & CONFIG
  // ============================================

  /**
   * @route GET /api/admin/cdn/status
   * @description Get CDN configuration status
   * @access Admin only
   */
  app.get('/status', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const config = cdnService.getConfig();
      const isEnabled = cdnService.isEnabled();

      return successResponse(c, {
        enabled: isEnabled,
        provider: config.provider,
        domain: config.domain || null,
        configured: !!(config.zoneId),
      });
    } catch (error) {
      logger.error('Failed to get CDN status', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get CDN status', 500);
    }
  });

  // ============================================
  // CACHE PURGE ENDPOINTS
  // ============================================

  /**
   * @route POST /api/admin/cdn/purge
   * @description Purge specific paths from CDN cache
   * @access Admin only
   *
   * **Requirements: 2.4**
   */
  app.post('/purge', authenticate(), requireRole('ADMIN'), validate(PurgePathsSchema), async (c) => {
    try {
      const { paths } = getValidatedBody<PurgePathsInput>(c);
      const user = c.get('user');

      logger.info('CDN purge requested', {
        userId: user?.id,
        pathCount: paths.length,
        paths: paths.slice(0, 5), // Log first 5 paths only
      });

      const result = await cdnService.purge({ paths });

      if (result.success) {
        return successResponse(c, {
          message: 'Cache purged successfully',
          purgedPaths: result.purgedPaths,
          provider: result.provider,
        });
      } else {
        return errorResponse(c, 'CDN_PURGE_FAILED', result.message || 'Cache purge failed', 500);
      }
    } catch (error) {
      logger.error('CDN purge error', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to purge cache', 500);
    }
  });

  /**
   * @route POST /api/admin/cdn/purge-media
   * @description Purge media files from CDN cache
   * @access Admin only
   *
   * **Requirements: 2.4**
   */
  app.post('/purge-media', authenticate(), requireRole('ADMIN'), validate(PurgeMediaSchema), async (c) => {
    try {
      const { urls } = getValidatedBody<PurgeMediaInput>(c);
      const user = c.get('user');

      logger.info('CDN media purge requested', {
        userId: user?.id,
        urlCount: urls.length,
      });

      const result = await cdnService.purgeMedia(urls);

      if (result.success) {
        return successResponse(c, {
          message: 'Media cache purged successfully',
          purgedPaths: result.purgedPaths,
          provider: result.provider,
        });
      } else {
        return errorResponse(c, 'CDN_PURGE_FAILED', result.message || 'Media cache purge failed', 500);
      }
    } catch (error) {
      logger.error('CDN media purge error', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to purge media cache', 500);
    }
  });

  /**
   * @route POST /api/admin/cdn/purge-api
   * @description Purge API response cache from CDN
   * @access Admin only
   *
   * **Requirements: 2.4**
   */
  app.post('/purge-api', authenticate(), requireRole('ADMIN'), validate(PurgeApiSchema), async (c) => {
    try {
      const { apiPaths } = getValidatedBody<PurgeApiInput>(c);
      const user = c.get('user');

      logger.info('CDN API purge requested', {
        userId: user?.id,
        pathCount: apiPaths.length,
        paths: apiPaths,
      });

      const result = await cdnService.purgeApi(apiPaths);

      if (result.success) {
        return successResponse(c, {
          message: 'API cache purged successfully',
          purgedPaths: result.purgedPaths,
          provider: result.provider,
        });
      } else {
        return errorResponse(c, 'CDN_PURGE_FAILED', result.message || 'API cache purge failed', 500);
      }
    } catch (error) {
      logger.error('CDN API purge error', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to purge API cache', 500);
    }
  });

  /**
   * @route POST /api/admin/cdn/purge-all
   * @description Purge ALL CDN cache (use with caution!)
   * @access Admin only
   *
   * **Requirements: 2.4**
   */
  app.post('/purge-all', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const user = c.get('user');

      logger.warn('CDN purge ALL requested', {
        userId: user?.id,
        email: user?.email,
      });

      const result = await cdnService.purgeAll();

      if (result.success) {
        return successResponse(c, {
          message: 'All cache purged successfully',
          provider: result.provider,
        });
      } else {
        return errorResponse(c, 'CDN_PURGE_FAILED', result.message || 'Full cache purge failed', 500);
      }
    } catch (error) {
      logger.error('CDN purge all error', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to purge all cache', 500);
    }
  });

  return app;
}

export default { createCDNRoutes };
