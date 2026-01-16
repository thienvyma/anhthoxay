/**
 * Bid Firestore Routes
 * 
 * Handles bid management using Firestore backend.
 * 
 * @route /api/contractor/bids - Contractor bid management routes
 * @route /api/admin/bids - Admin bid management routes
 * 
 * @module routes/firestore/bid.firestore.routes
 * @requirements 5.2
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole, getCurrentUser } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { 
  getBidFirestoreService, 
  BidFirestoreError,
  type CreateBidInput,
  type UpdateBidInput,
  type BidQueryParams,
} from '../../services/firestore/bid.firestore';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CreateBidSchema = z.object({
  projectId: z.string().min(1),
  price: z.number().positive(),
  timeline: z.string().min(5).max(500),
  proposal: z.string().min(50).max(5000),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).max(10).optional(),
});

const UpdateBidSchema = z.object({
  price: z.number().positive().optional(),
  timeline: z.string().min(5).max(500).optional(),
  proposal: z.string().min(50).max(5000).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).max(10).optional(),
});

const BidQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'price']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const AdminBidQuerySchema = z.object({
  status: z.string().optional(),
  projectId: z.string().optional(),
  contractorId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'price']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const ApproveBidSchema = z.object({
  note: z.string().max(500).optional(),
});

const RejectBidSchema = z.object({
  note: z.string().min(10).max(500),
});

// ============================================
// CONTRACTOR BID ROUTES
// ============================================

export function createContractorBidFirestoreRoutes() {
  const app = new Hono();
  const bidService = getBidFirestoreService();

  // Apply auth middleware to all routes
  app.use('*', firebaseAuth());
  app.use('*', requireRole('CONTRACTOR', 'ADMIN'));

  /**
   * @route POST /api/contractor/bids
   * @description Create a new bid
   * @access CONTRACTOR
   */
  app.post('/', validate(CreateBidSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const data = getValidatedBody<CreateBidInput>(c);
      const bid = await bidService.create(user.uid, data);
      return successResponse(c, bid, 201);
    } catch (error) {
      if (error instanceof BidFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Create bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create bid', 500);
    }
  });

  /**
   * @route GET /api/contractor/bids
   * @description List my bids
   * @access CONTRACTOR
   */
  app.get('/', validateQuery(BidQuerySchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const query = getValidatedQuery<z.infer<typeof BidQuerySchema>>(c);
      const result = await bidService.getByContractor(user.uid, query as BidQueryParams);
      return successResponse(c, result);
    } catch (error) {
      console.error('Get contractor bids error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get bids', 500);
    }
  });

  /**
   * @route GET /api/contractor/bids/:projectId/:bidId
   * @description Get my bid detail
   * @access CONTRACTOR
   */
  app.get('/:projectId/:bidId', async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('projectId');
      const bidId = c.req.param('bidId');
      
      const bid = await bidService.getByIdWithRelations(projectId, bidId);

      if (!bid) {
        return errorResponse(c, 'BID_NOT_FOUND', 'Bid không tồn tại', 404);
      }

      if (bid.contractorId !== user.uid) {
        return errorResponse(c, 'BID_ACCESS_DENIED', 'Bạn không có quyền xem bid này', 403);
      }

      return successResponse(c, bid);
    } catch (error) {
      if (error instanceof BidFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Get contractor bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get bid', 500);
    }
  });

  /**
   * @route PUT /api/contractor/bids/:projectId/:bidId
   * @description Update my bid
   * @access CONTRACTOR
   */
  app.put('/:projectId/:bidId', validate(UpdateBidSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('projectId');
      const bidId = c.req.param('bidId');
      const data = getValidatedBody<UpdateBidInput>(c);
      
      const bid = await bidService.update(projectId, bidId, user.uid, data);
      return successResponse(c, bid);
    } catch (error) {
      if (error instanceof BidFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Update bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update bid', 500);
    }
  });

  /**
   * @route DELETE /api/contractor/bids/:projectId/:bidId
   * @description Withdraw my bid
   * @access CONTRACTOR
   */
  app.delete('/:projectId/:bidId', async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('projectId');
      const bidId = c.req.param('bidId');
      
      const bid = await bidService.withdraw(projectId, bidId, user.uid);
      return successResponse(c, bid);
    } catch (error) {
      if (error instanceof BidFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Withdraw bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to withdraw bid', 500);
    }
  });

  return app;
}


// ============================================
// ADMIN BID ROUTES
// ============================================

export function createAdminBidFirestoreRoutes() {
  const app = new Hono();
  const bidService = getBidFirestoreService();

  // Apply auth middleware to all routes
  app.use('*', firebaseAuth());
  app.use('*', requireRole('ADMIN'));

  /**
   * @route GET /api/admin/bids
   * @description List all bids
   * @access ADMIN
   */
  app.get('/', validateQuery(AdminBidQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<z.infer<typeof AdminBidQuerySchema>>(c);
      const result = await bidService.getAdminList(query as BidQueryParams);
      return successResponse(c, result);
    } catch (error) {
      console.error('Get admin bids error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get bids', 500);
    }
  });

  /**
   * @route GET /api/admin/bids/:projectId/:bidId
   * @description Get bid detail
   * @access ADMIN
   */
  app.get('/:projectId/:bidId', async (c) => {
    try {
      const projectId = c.req.param('projectId');
      const bidId = c.req.param('bidId');
      
      const bid = await bidService.getByIdWithRelations(projectId, bidId);

      if (!bid) {
        return errorResponse(c, 'BID_NOT_FOUND', 'Bid không tồn tại', 404);
      }

      return successResponse(c, bid);
    } catch (error) {
      console.error('Get admin bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get bid', 500);
    }
  });

  /**
   * @route PUT /api/admin/bids/:projectId/:bidId/approve
   * @description Approve bid
   * @access ADMIN
   */
  app.put('/:projectId/:bidId/approve', validate(ApproveBidSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('projectId');
      const bidId = c.req.param('bidId');
      const data = getValidatedBody<{ note?: string }>(c);
      
      const bid = await bidService.approve(projectId, bidId, user.uid, data.note);
      return successResponse(c, bid);
    } catch (error) {
      if (error instanceof BidFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Approve bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to approve bid', 500);
    }
  });

  /**
   * @route PUT /api/admin/bids/:projectId/:bidId/reject
   * @description Reject bid
   * @access ADMIN
   */
  app.put('/:projectId/:bidId/reject', validate(RejectBidSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('projectId');
      const bidId = c.req.param('bidId');
      const data = getValidatedBody<{ note: string }>(c);
      
      const bid = await bidService.reject(projectId, bidId, user.uid, data.note);
      return successResponse(c, bid);
    } catch (error) {
      if (error instanceof BidFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Reject bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reject bid', 500);
    }
  });

  return app;
}

export default {
  createContractorBidFirestoreRoutes,
  createAdminBidFirestoreRoutes,
};
