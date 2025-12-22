/**
 * Region Routes Module
 *
 * Handles region management (public listing and admin CRUD).
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-3.2**
 *
 * @route /api/regions - Public region routes
 * @route /api/admin/regions - Admin region management routes
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { RegionService, RegionError } from '../services/region.service';
import {
  CreateRegionSchema,
  UpdateRegionSchema,
  RegionQuerySchema,
  type CreateRegionInput,
  type UpdateRegionInput,
  type RegionQuery,
} from '../schemas/region.schema';

// ============================================
// PUBLIC REGION ROUTES FACTORY
// ============================================

/**
 * Create public region routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with public region routes
 */
export function createRegionRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const regionService = new RegionService(prisma);

  // ============================================
  // PUBLIC REGION ROUTES
  // ============================================

  /**
   * @route GET /api/regions
   * @description Get all regions (flat or tree structure)
   * @access Public
   * @query flat - Return flat list instead of tree (default: false)
   * @query parentId - Filter by parent ID (for flat list)
   * @query level - Filter by level (1: Tỉnh/TP, 2: Quận/Huyện, 3: Phường/Xã)
   * @query isActive - Filter by active status
   */
  app.get('/', validateQuery(RegionQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<RegionQuery>(c);
      const regions = await regionService.getAll(query);
      return successResponse(c, regions);
    } catch (error) {
      console.error('Get regions error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get regions', 500);
    }
  });

  /**
   * @route GET /api/regions/:id
   * @description Get region by ID
   * @access Public
   */
  app.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const region = await regionService.getById(id);

      if (!region) {
        return errorResponse(c, 'NOT_FOUND', 'Khu vực không tồn tại', 404);
      }

      return successResponse(c, region);
    } catch (error) {
      console.error('Get region error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get region', 500);
    }
  });

  return app;
}

// ============================================
// ADMIN REGION ROUTES FACTORY
// ============================================

/**
 * Create admin region routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with admin region routes
 */
export function createAdminRegionRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const regionService = new RegionService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

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
    authenticate(),
    requireRole('ADMIN'),
    validate(CreateRegionSchema),
    async (c) => {
      try {
        const data = getValidatedBody<CreateRegionInput>(c);
        const region = await regionService.create(data);
        return successResponse(c, region, 201);
      } catch (error) {
        if (error instanceof RegionError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        console.error('Create region error:', error);
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
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateRegionSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const data = getValidatedBody<UpdateRegionInput>(c);
        const region = await regionService.update(id, data);
        return successResponse(c, region);
      } catch (error) {
        if (error instanceof RegionError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        console.error('Update region error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update region', 500);
      }
    }
  );

  /**
   * @route DELETE /api/admin/regions/:id
   * @description Delete a region
   * @access ADMIN only
   */
  app.delete('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const result = await regionService.delete(id);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof RegionError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Delete region error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete region', 500);
    }
  });

  return app;
}

export default { createRegionRoutes, createAdminRegionRoutes };
