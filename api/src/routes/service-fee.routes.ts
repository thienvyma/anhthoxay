/**
 * Service Fee Routes Module
 *
 * Handles service fee endpoints.
 * - Public endpoint for listing active fees
 * - Admin endpoints for full CRUD management
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-5.2**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { ServiceFeeService, ServiceFeeError } from '../services/service-fee.service';
import {
  CreateServiceFeeSchema,
  UpdateServiceFeeSchema,
  ServiceFeeQuerySchema,
  type CreateServiceFeeInput,
  type UpdateServiceFeeInput,
  type ServiceFeeQuery,
} from '../schemas/service-fee.schema';

// ============================================
// PUBLIC SERVICE FEE ROUTES
// ============================================

/**
 * Create public service fee routes
 * @param prisma - Prisma client instance
 * @returns Hono app with public service fee routes
 */
export function createServiceFeeRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const serviceFeeService = new ServiceFeeService(prisma);

  /**
   * @route GET /api/service-fees
   * @description Get list of service fees (public - only active fees)
   * @access Public
   * @query activeOnly - Optional, defaults to true for public endpoint
   */
  app.get('/', validateQuery(ServiceFeeQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<ServiceFeeQuery>(c);
      // Public endpoint defaults to active only
      const activeOnly = query.activeOnly !== false;
      const fees = await serviceFeeService.list(activeOnly);
      return successResponse(c, fees);
    } catch (error) {
      console.error('Get service fees error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy danh sách phí dịch vụ', 500);
    }
  });

  return app;
}

// ============================================
// ADMIN SERVICE FEE ROUTES
// ============================================

/**
 * Create admin service fee routes
 * @param prisma - Prisma client instance
 * @returns Hono app with admin service fee routes
 */
export function createAdminServiceFeeRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const serviceFeeService = new ServiceFeeService(prisma);

  /**
   * @route GET /api/admin/service-fees
   * @description Get all service fees (admin - includes inactive)
   * @access Admin only
   */
  app.get('/', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const fees = await serviceFeeService.list(false);
      return successResponse(c, fees);
    } catch (error) {
      console.error('Admin get service fees error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy danh sách phí dịch vụ', 500);
    }
  });

  /**
   * @route GET /api/admin/service-fees/:id
   * @description Get service fee by ID (admin only)
   * @access Admin only
   */
  app.get('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const fee = await serviceFeeService.getById(id);
      
      if (!fee) {
        return errorResponse(c, 'NOT_FOUND', 'Không tìm thấy phí dịch vụ', 404);
      }
      
      return successResponse(c, fee);
    } catch (error) {
      console.error('Admin get service fee error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy thông tin phí dịch vụ', 500);
    }
  });

  /**
   * @route POST /api/admin/service-fees
   * @description Create a new service fee (admin only)
   * @access Admin only
   * @body CreateServiceFeeInput
   */
  app.post(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validate(CreateServiceFeeSchema),
    async (c) => {
      try {
        const data = getValidatedBody<CreateServiceFeeInput>(c);
        const fee = await serviceFeeService.create(data);
        return successResponse(c, fee, 201);
      } catch (error) {
        console.error('Create service fee error:', error);

        if (error instanceof ServiceFeeError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể tạo phí dịch vụ', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/service-fees/:id
   * @description Update a service fee (admin only)
   * @access Admin only
   * @body UpdateServiceFeeInput
   */
  app.put(
    '/:id',
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateServiceFeeSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const data = getValidatedBody<UpdateServiceFeeInput>(c);
        const fee = await serviceFeeService.update(id, data);
        return successResponse(c, fee);
      } catch (error) {
        console.error('Update service fee error:', error);

        if (error instanceof ServiceFeeError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể cập nhật phí dịch vụ', 500);
      }
    }
  );

  /**
   * @route DELETE /api/admin/service-fees/:id
   * @description Delete a service fee (admin only)
   * @access Admin only
   */
  app.delete('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      await serviceFeeService.delete(id);
      return successResponse(c, { message: 'Đã xóa phí dịch vụ thành công' });
    } catch (error) {
      console.error('Delete service fee error:', error);

      if (error instanceof ServiceFeeError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }

      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể xóa phí dịch vụ', 500);
    }
  });

  return app;
}

export default { createServiceFeeRoutes, createAdminServiceFeeRoutes };
