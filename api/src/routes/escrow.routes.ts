/**
 * Escrow Routes Module
 *
 * Handles escrow management endpoints for admin.
 * - List escrows with filtering
 * - Get escrow details
 * - Confirm deposit (PENDING → HELD)
 * - Release escrow
 * - Partial release
 * - Refund escrow
 * - Mark as disputed
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 5.1-5.7**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { EscrowService, EscrowError } from '../services/escrow.service';
import {
  EscrowQuerySchema,
  ConfirmEscrowSchema,
  ReleaseEscrowSchema,
  PartialReleaseEscrowSchema,
  RefundEscrowSchema,
  DisputeEscrowSchema,
  type EscrowQuery,
  type ConfirmEscrowInput,
  type ReleaseEscrowInput,
  type PartialReleaseEscrowInput,
  type RefundEscrowInput,
  type DisputeEscrowInput,
} from '../schemas/escrow.schema';

// ============================================
// ADMIN ESCROW ROUTES
// ============================================

/**
 * Create admin escrow routes
 * @param prisma - Prisma client instance
 * @returns Hono app with admin escrow routes
 */
export function createAdminEscrowRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const escrowService = new EscrowService(prisma);

  /**
   * @route GET /api/admin/escrows
   * @description List escrows with filtering and pagination
   * @access Admin only
   * @query status - Filter by escrow status
   * @query projectId - Filter by project ID
   * @query homeownerId - Filter by homeowner ID
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 20)
   * @query sortBy - Sort field (default: createdAt)
   * @query sortOrder - Sort order (default: desc)
   * Requirements: 5.1
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(EscrowQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<EscrowQuery>(c);
        const result = await escrowService.list(query);
        return successResponse(c, result);
      } catch (error) {
        console.error('List escrows error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy danh sách escrow', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/escrows/:id
   * @description Get escrow details by ID
   * @access Admin only
   * Requirements: 5.2
   */
  app.get('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const escrow = await escrowService.getById(id);

      if (!escrow) {
        return errorResponse(c, 'NOT_FOUND', 'Không tìm thấy escrow', 404);
      }

      return successResponse(c, escrow);
    } catch (error) {
      console.error('Get escrow error:', error);

      if (error instanceof EscrowError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }

      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy thông tin escrow', 500);
    }
  });

  /**
   * @route PUT /api/admin/escrows/:id/confirm
   * @description Confirm escrow deposit (PENDING → HELD)
   * @access Admin only
   * @body ConfirmEscrowInput (optional note)
   * Requirements: 5.3
   */
  app.put(
    '/:id/confirm',
    authenticate(),
    requireRole('ADMIN'),
    validate(ConfirmEscrowSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const user = c.get('user');
        const data = getValidatedBody<ConfirmEscrowInput>(c);

        if (!user) {
          return errorResponse(c, 'UNAUTHORIZED', 'Không có quyền truy cập', 401);
        }

        const escrow = await escrowService.confirmDeposit(id, user.id, data);
        return successResponse(c, escrow);
      } catch (error) {
        console.error('Confirm escrow error:', error);

        if (error instanceof EscrowError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể xác nhận đặt cọc', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/escrows/:id/release
   * @description Release escrow (full release)
   * @access Admin only
   * @body ReleaseEscrowInput (optional note)
   * Requirements: 5.4
   */
  app.put(
    '/:id/release',
    authenticate(),
    requireRole('ADMIN'),
    validate(ReleaseEscrowSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const user = c.get('user');
        const data = getValidatedBody<ReleaseEscrowInput>(c);

        if (!user) {
          return errorResponse(c, 'UNAUTHORIZED', 'Không có quyền truy cập', 401);
        }

        const escrow = await escrowService.release(id, user.id, data);
        return successResponse(c, escrow);
      } catch (error) {
        console.error('Release escrow error:', error);

        if (error instanceof EscrowError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể giải phóng escrow', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/escrows/:id/partial
   * @description Partial release escrow
   * @access Admin only
   * @body PartialReleaseEscrowInput (amount, optional note)
   * Requirements: 5.5
   */
  app.put(
    '/:id/partial',
    authenticate(),
    requireRole('ADMIN'),
    validate(PartialReleaseEscrowSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const user = c.get('user');
        const data = getValidatedBody<PartialReleaseEscrowInput>(c);

        if (!user) {
          return errorResponse(c, 'UNAUTHORIZED', 'Không có quyền truy cập', 401);
        }

        const escrow = await escrowService.partialRelease(id, user.id, data);
        return successResponse(c, escrow);
      } catch (error) {
        console.error('Partial release escrow error:', error);

        if (error instanceof EscrowError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể giải phóng một phần escrow', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/escrows/:id/refund
   * @description Refund escrow to homeowner
   * @access Admin only
   * @body RefundEscrowInput (reason required)
   * Requirements: 5.6
   */
  app.put(
    '/:id/refund',
    authenticate(),
    requireRole('ADMIN'),
    validate(RefundEscrowSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const user = c.get('user');
        const data = getValidatedBody<RefundEscrowInput>(c);

        if (!user) {
          return errorResponse(c, 'UNAUTHORIZED', 'Không có quyền truy cập', 401);
        }

        const escrow = await escrowService.refund(id, user.id, data);
        return successResponse(c, escrow);
      } catch (error) {
        console.error('Refund escrow error:', error);

        if (error instanceof EscrowError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể hoàn tiền escrow', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/escrows/:id/dispute
   * @description Mark escrow as disputed
   * @access Admin only
   * @body DisputeEscrowInput (reason required)
   * Requirements: 5.7
   */
  app.put(
    '/:id/dispute',
    authenticate(),
    requireRole('ADMIN'),
    validate(DisputeEscrowSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const user = c.get('user');
        const data = getValidatedBody<DisputeEscrowInput>(c);

        if (!user) {
          return errorResponse(c, 'UNAUTHORIZED', 'Không có quyền truy cập', 401);
        }

        const escrow = await escrowService.markDisputed(id, user.id, data);
        return successResponse(c, escrow);
      } catch (error) {
        console.error('Dispute escrow error:', error);

        if (error instanceof EscrowError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể đánh dấu tranh chấp escrow', 500);
      }
    }
  );

  return app;
}

export default { createAdminEscrowRoutes };
