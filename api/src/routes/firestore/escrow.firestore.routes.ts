/**
 * Escrow Firestore Routes
 * 
 * Handles escrow management using Firestore backend.
 * 
 * @route /api/admin/escrows - Admin escrow management routes
 * 
 * @module routes/firestore/escrow.firestore.routes
 * @requirements 5.3
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole, getCurrentUser } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { 
  getEscrowFirestoreService, 
  EscrowFirestoreError,
  type EscrowQueryParams,
  type PartialReleaseInput,
  type RefundInput,
  type DisputeInput,
} from '../../services/firestore/escrow.firestore';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const EscrowQuerySchema = z.object({
  status: z.string().optional(),
  projectId: z.string().optional(),
  homeownerId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const ConfirmEscrowSchema = z.object({
  note: z.string().max(500).optional(),
});

const ReleaseEscrowSchema = z.object({
  note: z.string().max(500).optional(),
});

const PartialReleaseSchema = z.object({
  amount: z.number().positive(),
  note: z.string().max(500).optional(),
});

const RefundEscrowSchema = z.object({
  reason: z.string().min(10).max(500),
});

const DisputeEscrowSchema = z.object({
  reason: z.string().min(10).max(500),
});

const ResolveDisputeSchema = z.object({
  resolution: z.enum(['RELEASE', 'REFUND']),
  note: z.string().max(500).optional(),
});

// ============================================
// ADMIN ESCROW ROUTES
// ============================================

export function createAdminEscrowFirestoreRoutes() {
  const app = new Hono();
  const escrowService = getEscrowFirestoreService();

  // Apply auth middleware to all routes
  app.use('*', firebaseAuth());
  app.use('*', requireRole('ADMIN'));

  /**
   * @route GET /api/admin/escrows
   * @description List all escrows
   * @access ADMIN
   */
  app.get('/', validateQuery(EscrowQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<z.infer<typeof EscrowQuerySchema>>(c);
      const result = await escrowService.list(query as EscrowQueryParams);
      return successResponse(c, result);
    } catch (error) {
      console.error('Get admin escrows error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get escrows', 500);
    }
  });

  /**
   * @route GET /api/admin/escrows/:id
   * @description Get escrow detail
   * @access ADMIN
   */
  app.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const escrow = await escrowService.getById(id);

      if (!escrow) {
        return errorResponse(c, 'ESCROW_NOT_FOUND', 'Escrow không tồn tại', 404);
      }

      // Get milestones
      const milestones = await escrowService.getMilestones(id);

      return successResponse(c, { ...escrow, milestones });
    } catch (error) {
      console.error('Get admin escrow error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get escrow', 500);
    }
  });

  /**
   * @route PUT /api/admin/escrows/:id/confirm
   * @description Confirm escrow deposit
   * @access ADMIN
   */
  app.put('/:id/confirm', validate(ConfirmEscrowSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<{ note?: string }>(c);
      
      const escrow = await escrowService.confirmDeposit(id, user.uid, data.note);
      return successResponse(c, escrow);
    } catch (error) {
      if (error instanceof EscrowFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Confirm escrow error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to confirm escrow', 500);
    }
  });

  /**
   * @route PUT /api/admin/escrows/:id/release
   * @description Release escrow fully
   * @access ADMIN
   */
  app.put('/:id/release', validate(ReleaseEscrowSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<{ note?: string }>(c);
      
      const escrow = await escrowService.release(id, user.uid, data.note);
      return successResponse(c, escrow);
    } catch (error) {
      if (error instanceof EscrowFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Release escrow error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to release escrow', 500);
    }
  });

  /**
   * @route PUT /api/admin/escrows/:id/partial
   * @description Partially release escrow
   * @access ADMIN
   */
  app.put('/:id/partial', validate(PartialReleaseSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<PartialReleaseInput>(c);
      
      const escrow = await escrowService.partialRelease(id, user.uid, data);
      return successResponse(c, escrow);
    } catch (error) {
      if (error instanceof EscrowFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Partial release escrow error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to partially release escrow', 500);
    }
  });

  /**
   * @route PUT /api/admin/escrows/:id/refund
   * @description Refund escrow
   * @access ADMIN
   */
  app.put('/:id/refund', validate(RefundEscrowSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<RefundInput>(c);
      
      const escrow = await escrowService.refund(id, user.uid, data);
      return successResponse(c, escrow);
    } catch (error) {
      if (error instanceof EscrowFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Refund escrow error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to refund escrow', 500);
    }
  });

  /**
   * @route PUT /api/admin/escrows/:id/dispute
   * @description Mark escrow as disputed
   * @access ADMIN
   */
  app.put('/:id/dispute', validate(DisputeEscrowSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<DisputeInput>(c);
      
      const escrow = await escrowService.markDisputed(id, user.uid, data);
      return successResponse(c, escrow);
    } catch (error) {
      if (error instanceof EscrowFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Dispute escrow error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to dispute escrow', 500);
    }
  });

  /**
   * @route PUT /api/admin/escrows/:id/resolve
   * @description Resolve escrow dispute
   * @access ADMIN
   */
  app.put('/:id/resolve', validate(ResolveDisputeSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<{ resolution: 'RELEASE' | 'REFUND'; note?: string }>(c);
      
      const escrow = await escrowService.resolveDispute(id, user.uid, data.resolution, data.note);
      return successResponse(c, escrow);
    } catch (error) {
      if (error instanceof EscrowFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Resolve dispute error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to resolve dispute', 500);
    }
  });

  return app;
}

export default {
  createAdminEscrowFirestoreRoutes,
};
