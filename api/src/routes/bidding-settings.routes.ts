/**
 * Bidding Settings Routes Module
 *
 * Handles bidding configuration endpoints.
 * - Public endpoint for basic settings
 * - Admin endpoints for full settings management
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-4.2**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, getValidatedBody } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { BiddingSettingsService, BiddingSettingsError } from '../services/bidding-settings.service';
import { UpdateBiddingSettingsSchema, type UpdateBiddingSettingsInput } from '../schemas/bidding-settings.schema';

// ============================================
// PUBLIC BIDDING SETTINGS ROUTES
// ============================================

/**
 * Create public bidding settings routes
 * @param prisma - Prisma client instance
 * @returns Hono app with public bidding settings routes
 */
export function createBiddingSettingsRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const biddingSettingsService = new BiddingSettingsService(prisma);

  /**
   * @route GET /api/settings/bidding
   * @description Get public bidding settings
   * @access Public
   */
  app.get('/', async (c) => {
    try {
      const settings = await biddingSettingsService.getPublic();
      return successResponse(c, settings);
    } catch (error) {
      console.error('Get public bidding settings error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy cấu hình đấu giá', 500);
    }
  });

  return app;
}

// ============================================
// ADMIN BIDDING SETTINGS ROUTES
// ============================================

/**
 * Create admin bidding settings routes
 * @param prisma - Prisma client instance
 * @returns Hono app with admin bidding settings routes
 */
export function createAdminBiddingSettingsRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const biddingSettingsService = new BiddingSettingsService(prisma);

  /**
   * @route GET /api/admin/settings/bidding
   * @description Get full bidding settings (admin only)
   * @access Admin only
   */
  app.get('/', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const settings = await biddingSettingsService.get();
      return successResponse(c, settings);
    } catch (error) {
      console.error('Get admin bidding settings error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy cấu hình đấu giá', 500);
    }
  });

  /**
   * @route PUT /api/admin/settings/bidding
   * @description Update bidding settings (admin only)
   * @access Admin only
   * @body UpdateBiddingSettingsInput
   */
  app.put(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateBiddingSettingsSchema),
    async (c) => {
      try {
        const data = getValidatedBody<UpdateBiddingSettingsInput>(c);
        const settings = await biddingSettingsService.update(data);
        return successResponse(c, settings);
      } catch (error) {
        console.error('Update bidding settings error:', error);

        if (error instanceof BiddingSettingsError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể cập nhật cấu hình đấu giá', 500);
      }
    }
  );

  return app;
}

export default { createBiddingSettingsRoutes, createAdminBiddingSettingsRoutes };
