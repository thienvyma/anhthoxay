/**
 * Dispute Routes Module
 *
 * Handles dispute management endpoints for homeowner, contractor, and admin.
 * - Homeowner raises dispute on project
 * - Contractor raises dispute on bid
 * - Admin lists and resolves disputes
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 16.1-16.6**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { DisputeService, DisputeError } from '../services/dispute.service';
import {
  RaiseDisputeSchema,
  ResolveDisputeSchema,
  DisputeQuerySchema,
  type RaiseDisputeInput,
  type ResolveDisputeInput,
  type DisputeQuery,
} from '../schemas/dispute.schema';

// ============================================
// HOMEOWNER DISPUTE ROUTES FACTORY
// ============================================

/**
 * Create homeowner dispute routes with dependency injection
 * Requirements: 16.1, 16.2 - Homeowner raises dispute
 * @param prisma - Prisma client instance
 * @returns Hono app with homeowner dispute routes
 */
export function createHomeownerDisputeRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const disputeService = new DisputeService(prisma);

  /**
   * @route POST /api/homeowner/projects/:id/dispute
   * @description Raise a dispute on a project (homeowner)
   * @access HOMEOWNER
   * @body RaiseDisputeInput (reason, optional evidence)
   * Requirements: 16.1, 16.2
   */
  app.post(
    '/:id/dispute',
    authenticate(),
    requireRole('HOMEOWNER'),
    validate(RaiseDisputeSchema),
    async (c) => {
      try {
        const projectId = c.req.param('id');
        const user = getUser(c);
        const data = getValidatedBody<RaiseDisputeInput>(c);

        const dispute = await disputeService.raiseDispute(projectId, user.sub, data);
        return successResponse(c, dispute, 201);
      } catch (error) {
        console.error('Raise dispute (homeowner) error:', error);

        if (error instanceof DisputeError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể tạo tranh chấp', 500);
      }
    }
  );

  return app;
}

// ============================================
// CONTRACTOR DISPUTE ROUTES FACTORY
// ============================================

/**
 * Create contractor dispute routes with dependency injection
 * Requirements: 16.1, 16.2 - Contractor raises dispute
 * @param prisma - Prisma client instance
 * @returns Hono app with contractor dispute routes
 */
export function createContractorDisputeRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const disputeService = new DisputeService(prisma);

  /**
   * @route POST /api/contractor/bids/:id/dispute
   * @description Raise a dispute on a bid (contractor)
   * @access CONTRACTOR
   * @body RaiseDisputeInput (reason, optional evidence)
   * Requirements: 16.1, 16.2
   */
  app.post(
    '/:id/dispute',
    authenticate(),
    requireRole('CONTRACTOR'),
    validate(RaiseDisputeSchema),
    async (c) => {
      try {
        const bidId = c.req.param('id');
        const user = getUser(c);
        const data = getValidatedBody<RaiseDisputeInput>(c);

        // Get project ID from bid
        const bid = await prisma.bid.findUnique({
          where: { id: bidId },
          select: { projectId: true, contractorId: true },
        });

        if (!bid) {
          return errorResponse(c, 'BID_NOT_FOUND', 'Bid không tồn tại', 404);
        }

        // Verify contractor owns this bid
        if (bid.contractorId !== user.sub) {
          return errorResponse(c, 'UNAUTHORIZED', 'Bạn không có quyền tạo tranh chấp cho bid này', 403);
        }

        const dispute = await disputeService.raiseDispute(bid.projectId, user.sub, data);
        return successResponse(c, dispute, 201);
      } catch (error) {
        console.error('Raise dispute (contractor) error:', error);

        if (error instanceof DisputeError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể tạo tranh chấp', 500);
      }
    }
  );

  return app;
}

// ============================================
// ADMIN DISPUTE ROUTES FACTORY
// ============================================

/**
 * Create admin dispute routes with dependency injection
 * Requirements: 16.3-16.6 - Admin lists and resolves disputes
 * @param prisma - Prisma client instance
 * @returns Hono app with admin dispute routes
 */
export function createAdminDisputeRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const disputeService = new DisputeService(prisma);

  /**
   * @route GET /api/admin/disputes
   * @description List disputes with filtering and pagination
   * @access Admin only
   * @query status - Filter by dispute status (OPEN, RESOLVED_REFUND, RESOLVED_RELEASE)
   * @query projectId - Filter by project ID
   * @query raisedBy - Filter by user who raised the dispute
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 20)
   * @query sortBy - Sort field (default: createdAt)
   * @query sortOrder - Sort order (default: desc)
   * Requirements: 16.3
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(DisputeQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<DisputeQuery>(c);
        const result = await disputeService.listDisputes(query);
        return successResponse(c, result);
      } catch (error) {
        console.error('List disputes error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy danh sách tranh chấp', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/disputes/:id
   * @description Get dispute details by escrow ID
   * @access Admin only
   * Requirements: 16.3
   */
  app.get('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const dispute = await disputeService.getByEscrowId(id);

      if (!dispute) {
        return errorResponse(c, 'NOT_FOUND', 'Không tìm thấy tranh chấp', 404);
      }

      return successResponse(c, dispute);
    } catch (error) {
      console.error('Get dispute error:', error);

      if (error instanceof DisputeError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }

      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy thông tin tranh chấp', 500);
    }
  });

  /**
   * @route PUT /api/admin/disputes/:id/resolve
   * @description Resolve a dispute (refund to homeowner or release to contractor)
   * @access Admin only
   * @body ResolveDisputeInput (resolution, note)
   * Requirements: 16.4, 16.5, 16.6
   */
  app.put(
    '/:id/resolve',
    authenticate(),
    requireRole('ADMIN'),
    validate(ResolveDisputeSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const user = getUser(c);
        const data = getValidatedBody<ResolveDisputeInput>(c);

        const dispute = await disputeService.resolveDispute(id, user.sub, data);
        return successResponse(c, dispute);
      } catch (error) {
        console.error('Resolve dispute error:', error);

        if (error instanceof DisputeError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể giải quyết tranh chấp', 500);
      }
    }
  );

  return app;
}

export default {
  createHomeownerDisputeRoutes,
  createContractorDisputeRoutes,
  createAdminDisputeRoutes,
};
