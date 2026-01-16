/**
 * Region Firestore Routes Module
 *
 * Handles region management using Firestore (public listing and admin CRUD).
 *
 * @module routes/firestore/region.firestore.routes
 * @requirements 3.8
 *
 * @route /api/regions - Public region routes
 * @route /api/admin/regions - Admin region management routes
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { 
  getRegionFirestoreService, 
  RegionFirestoreError,
  type RegionQueryOptions,
  type CreateRegionInput,
  type UpdateRegionInput,
} from '../../services/firestore/region.firestore';
import { cacheService, CacheKeys, CacheTTL } from '../../services/cache.service';
import { logger } from '../../utils/logger';
import {
  CreateRegionSchema,
  UpdateRegionSchema,
  RegionQuerySchema,
  type RegionQuery,
} from '../../schemas/region.schema';

// ============================================
// PUBLIC REGION FIRESTORE ROUTES FACTORY
// ============================================

/**
 * Create public region routes using Firestore
 * @returns Hono app with public region routes
 */
export function createRegionFirestoreRoutes() {
  const app = new Hono();
  const regionService = getRegionFirestoreService();

  // ============================================
  // PUBLIC REGION ROUTES
  // ============================================

  /**
   * @route GET /api/regions
   * @description Get all regions (flat or tree structure)
   * @access Public
   * @cache 10 minutes (TTL: 600 seconds)
   * @query flat - Return flat list instead of tree (default: false)
   * @query parentId - Filter by parent ID (for flat list)
   * @query level - Filter by level (1: Tỉnh/TP, 2: Quận/Huyện, 3: Phường/Xã)
   * @query isActive - Filter by active status
   */
  app.get('/', validateQuery(RegionQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<RegionQuery>(c);
      const cacheKey = CacheKeys.regions(query.level?.toString());

      const { data: regions, fromCache } = await cacheService.getOrSet(
        cacheKey,
        CacheTTL.regions,
        async () => {
          const options: RegionQueryOptions = {
            flat: query.flat,
            parentId: query.parentId,
            level: query.level,
            isActive: query.isActive,
          };
          return regionService.getAll(options);
        }
      );

      // Set cache status header
      c.header('X-Cache-Status', fromCache ? 'HIT' : 'MISS');

      return successResponse(c, regions);
    } catch (error) {
      logger.error('Get regions error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get regions', 500);
    }
  });

  /**
   * @route GET /api/regions/:id
   * @description Get region by ID
   * @access Public
   * @cache 10 minutes (TTL: 600 seconds)
   */
  app.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const cacheKey = `${CacheKeys.regions()}:${id}`;

      const { data: region, fromCache } = await cacheService.getOrSet(
        cacheKey,
        CacheTTL.regions,
        async () => {
          return regionService.getById(id);
        }
      );

      if (!region) {
        return errorResponse(c, 'NOT_FOUND', 'Khu vực không tồn tại', 404);
      }

      // Set cache status header
      c.header('X-Cache-Status', fromCache ? 'HIT' : 'MISS');

      return successResponse(c, region);
    } catch (error) {
      logger.error('Get region error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get region', 500);
    }
  });

  return app;
}

// ============================================
// ADMIN REGION FIRESTORE ROUTES FACTORY
// ============================================

/**
 * Create admin region routes using Firestore
 * @returns Hono app with admin region routes
 */
export function createAdminRegionFirestoreRoutes() {
  const app = new Hono();
  const regionService = getRegionFirestoreService();

  // ============================================
  // ADMIN REGION MANAGEMENT ROUTES
  // ============================================

  /**
   * @route POST /api/admin/regions
   * @description Create a new region
   * @access ADMIN only
   */
  app.post(
    '/',
    firebaseAuth(),
    requireRole('ADMIN'),
    validate(CreateRegionSchema),
    async (c) => {
      try {
        const data = getValidatedBody<CreateRegionInput>(c);
        const region = await regionService.createRegion(data);
        
        // Invalidate regions cache
        await cacheService.invalidateByPattern('cache:regions*');
        logger.debug('Regions cache invalidated after create');
        
        return successResponse(c, region, 201);
      } catch (error) {
        if (error instanceof RegionFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        logger.error('Create region error:', { error });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create region', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/regions/:id
   * @description Update an existing region
   * @access ADMIN only
   */
  app.put(
    '/:id',
    firebaseAuth(),
    requireRole('ADMIN'),
    validate(UpdateRegionSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const data = getValidatedBody<UpdateRegionInput>(c);
        const region = await regionService.updateRegion(id, data);
        
        // Invalidate regions cache
        await cacheService.invalidateByPattern('cache:regions*');
        logger.debug('Regions cache invalidated after update', { id });
        
        return successResponse(c, region);
      } catch (error) {
        if (error instanceof RegionFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        logger.error('Update region error:', { error });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update region', 500);
      }
    }
  );

  /**
   * @route DELETE /api/admin/regions/:id
   * @description Delete a region
   * @access ADMIN only
   */
  app.delete('/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const result = await regionService.deleteRegion(id);
      
      // Invalidate regions cache
      await cacheService.invalidateByPattern('cache:regions*');
      logger.debug('Regions cache invalidated after delete', { id });
      
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof RegionFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      logger.error('Delete region error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete region', 500);
    }
  });

  return app;
}

export default { createRegionFirestoreRoutes, createAdminRegionFirestoreRoutes };
