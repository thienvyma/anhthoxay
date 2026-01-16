/**
 * Service Fee Firestore Routes Module
 *
 * Handles service fee endpoints using Firestore.
 * - Public endpoint for listing active fees
 * - Admin endpoints for full CRUD management
 *
 * @module routes/firestore/service-fee.firestore.routes
 * @requirements 3.5
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { 
  getServiceFeeFirestoreService, 
  ServiceFeeFirestoreError,
  type CreateServiceFeeInput,
  type UpdateServiceFeeInput,
} from '../../services/firestore/service-fee.firestore';
import { logger } from '../../utils/logger';
import {
  CreateServiceFeeSchema,
  UpdateServiceFeeSchema,
  ServiceFeeQuerySchema,
  type ServiceFeeQuery,
} from '../../schemas/service-fee.schema';

// ============================================
// PUBLIC SERVICE FEE FIRESTORE ROUTES
// ============================================

/**
 * Create public service fee routes using Firestore
 * @returns Hono app with public service fee routes
 */
export function createServiceFeeFirestoreRoutes() {
  const app = new Hono();
  const serviceFeeService = getServiceFeeFirestoreService();

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
      logger.error('Get service fees error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy danh sách phí dịch vụ', 500);
    }
  });

  return app;
}

// ============================================
// ADMIN SERVICE FEE FIRESTORE ROUTES
// ============================================

/**
 * Create admin service fee routes using Firestore
 * @returns Hono app with admin service fee routes
 */
export function createAdminServiceFeeFirestoreRoutes() {
  const app = new Hono();
  const serviceFeeService = getServiceFeeFirestoreService();

  /**
   * @route GET /api/admin/service-fees
   * @description Get all service fees (admin - includes inactive)
   * @access Admin only
   */
  app.get('/', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const fees = await serviceFeeService.list(false);
      return successResponse(c, fees);
    } catch (error) {
      logger.error('Admin get service fees error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy danh sách phí dịch vụ', 500);
    }
  });

  /**
   * @route GET /api/admin/service-fees/:id
   * @description Get service fee by ID (admin only)
   * @access Admin only
   */
  app.get('/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const fee = await serviceFeeService.getById(id);
      
      if (!fee) {
        return errorResponse(c, 'NOT_FOUND', 'Không tìm thấy phí dịch vụ', 404);
      }
      
      return successResponse(c, fee);
    } catch (error) {
      logger.error('Admin get service fee error:', { error });
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
    firebaseAuth(),
    requireRole('ADMIN'),
    validate(CreateServiceFeeSchema),
    async (c) => {
      try {
        const data = getValidatedBody<CreateServiceFeeInput>(c);
        const fee = await serviceFeeService.createServiceFee(data);
        return successResponse(c, fee, 201);
      } catch (error) {
        logger.error('Create service fee error:', { error });

        if (error instanceof ServiceFeeFirestoreError) {
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
    firebaseAuth(),
    requireRole('ADMIN'),
    validate(UpdateServiceFeeSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const data = getValidatedBody<UpdateServiceFeeInput>(c);
        const fee = await serviceFeeService.updateServiceFee(id, data);
        return successResponse(c, fee);
      } catch (error) {
        logger.error('Update service fee error:', { error });

        if (error instanceof ServiceFeeFirestoreError) {
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
  app.delete('/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      await serviceFeeService.deleteServiceFee(id);
      return successResponse(c, { message: 'Đã xóa phí dịch vụ thành công' });
    } catch (error) {
      logger.error('Delete service fee error:', { error });

      if (error instanceof ServiceFeeFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }

      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể xóa phí dịch vụ', 500);
    }
  });

  return app;
}

export default { createServiceFeeFirestoreRoutes, createAdminServiceFeeFirestoreRoutes };
