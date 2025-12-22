/**
 * Bid Routes Module
 *
 * Handles bid management for contractor and admin operations.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 7.1-7.7, 8.1-8.5**
 *
 * @route /api/contractor/bids - Contractor bid management routes
 * @route /api/admin/bids - Admin bid management routes
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { BidService, BidError } from '../services/bid.service';
import { MatchService, MatchError } from '../services/match';
import { MilestoneService, MilestoneError } from '../services/milestone.service';
import {
  CreateBidSchema,
  UpdateBidSchema,
  BidQuerySchema,
  AdminBidQuerySchema,
  ApproveBidSchema,
  RejectBidSchema,
  type CreateBidInput,
  type UpdateBidInput,
  type BidQuery,
  type AdminBidQuery,
  type ApproveBidInput,
  type RejectBidInput,
} from '../schemas/bid.schema';
import {
  RequestMilestoneSchema,
  type RequestMilestoneInput,
} from '../schemas/milestone.schema';

// ============================================
// CONTRACTOR BID ROUTES FACTORY
// ============================================

/**
 * Create contractor bid routes with dependency injection
 * Requirements: 7.1-7.7 - Contractor bid management
 * @param prisma - Prisma client instance
 * @returns Hono app with contractor bid routes
 */
export function createContractorBidRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const bidService = new BidService(prisma);
  const matchService = new MatchService(prisma);
  const milestoneService = new MilestoneService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // Apply auth middleware to all routes
  app.use('*', authenticate());
  app.use('*', requireRole('CONTRACTOR'));


  /**
   * @route POST /api/contractor/bids
   * @description Create a new bid
   * @access CONTRACTOR (must be VERIFIED)
   * Requirements: 7.1-7.5
   */
  app.post('/', validate(CreateBidSchema), async (c) => {
    try {
      const user = getUser(c);
      const data = getValidatedBody<CreateBidInput>(c);
      const bid = await bidService.create(user.sub, data);
      return successResponse(c, bid, 201);
    } catch (error) {
      if (error instanceof BidError) {
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
   * Requirements: 7.1-7.7
   */
  app.get('/', validateQuery(BidQuerySchema), async (c) => {
    try {
      const user = getUser(c);
      const query = getValidatedQuery<BidQuery>(c);
      const result = await bidService.getByContractor(user.sub, query);
      return successResponse(c, result);
    } catch (error) {
      console.error('Get contractor bids error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get bids', 500);
    }
  });

  /**
   * @route GET /api/contractor/bids/:id
   * @description Get my bid detail
   * @access CONTRACTOR
   */
  app.get('/:id', async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const bid = await bidService.getByIdForContractor(id, user.sub);

      if (!bid) {
        return errorResponse(c, 'BID_NOT_FOUND', 'Bid không tồn tại', 404);
      }

      return successResponse(c, bid);
    } catch (error) {
      if (error instanceof BidError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Get contractor bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get bid', 500);
    }
  });

  /**
   * @route PUT /api/contractor/bids/:id
   * @description Update bid
   * @access CONTRACTOR
   * Requirements: 7.6
   */
  app.put('/:id', validate(UpdateBidSchema), async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateBidInput>(c);
      const bid = await bidService.update(id, user.sub, data);
      return successResponse(c, bid);
    } catch (error) {
      if (error instanceof BidError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Update bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update bid', 500);
    }
  });

  /**
   * @route DELETE /api/contractor/bids/:id
   * @description Withdraw bid
   * @access CONTRACTOR
   * Requirements: 7.7
   */
  app.delete('/:id', async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const bid = await bidService.withdraw(id, user.sub);
      return successResponse(c, { message: 'Đã rút bid thành công', bid });
    } catch (error) {
      if (error instanceof BidError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Withdraw bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to withdraw bid', 500);
    }
  });

  // ============================================
  // MATCH ROUTES (Phase 3)
  // ============================================

  /**
   * @route GET /api/contractor/bids/:id/match
   * @description Get match details with homeowner contact information
   * @access CONTRACTOR
   * Requirements: 9.1-9.5 - Return homeowner contact info, full project address, escrow status, win fee info
   *
   * **Feature: bidding-phase3-matching**
   */
  app.get('/:id/match', async (c) => {
    try {
      const user = getUser(c);
      const bidId = c.req.param('id');
      
      const result = await matchService.getMatchDetailsByBid(bidId, user.sub);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MatchError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Get contractor match details error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get match details', 500);
    }
  });

  // ============================================
  // MILESTONE ROUTES (Phase 3)
  // ============================================

  /**
   * @route POST /api/contractor/bids/:id/milestone/:milestoneId/request
   * @description Request milestone completion
   * @access CONTRACTOR
   * Requirements: 15.2 - Contractor reports milestone completion
   *
   * **Feature: bidding-phase3-matching**
   */
  app.post('/:id/milestone/:milestoneId/request', validate(RequestMilestoneSchema), async (c) => {
    try {
      const user = getUser(c);
      const milestoneId = c.req.param('milestoneId');
      const data = getValidatedBody<RequestMilestoneInput>(c);
      
      const result = await milestoneService.requestCompletion(milestoneId, user.sub, data);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MilestoneError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Request milestone error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to request milestone completion', 500);
    }
  });

  return app;
}

// ============================================
// ADMIN BID ROUTES FACTORY
// ============================================

/**
 * Create admin bid routes with dependency injection
 * Requirements: 8.1-8.5 - Admin bid management
 * @param prisma - Prisma client instance
 * @returns Hono app with admin bid routes
 */
export function createAdminBidRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const bidService = new BidService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // Apply auth middleware to all routes
  app.use('*', authenticate());
  app.use('*', requireRole('ADMIN'));

  /**
   * @route GET /api/admin/bids
   * @description List all bids
   * @access ADMIN
   * Requirements: 8.1
   */
  app.get('/', validateQuery(AdminBidQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<AdminBidQuery>(c);
      const result = await bidService.getAdminList(query);
      return successResponse(c, result);
    } catch (error) {
      console.error('Get admin bids error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get bids', 500);
    }
  });

  /**
   * @route GET /api/admin/bids/:id
   * @description Get bid detail
   * @access ADMIN
   * Requirements: 8.2
   */
  app.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const bid = await bidService.getAdminById(id);

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
   * @route PUT /api/admin/bids/:id/approve
   * @description Approve bid
   * @access ADMIN
   * Requirements: 8.3, 8.5
   */
  app.put('/:id/approve', validate(ApproveBidSchema), async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<ApproveBidInput>(c);
      const bid = await bidService.approve(id, user.sub, data.note);
      return successResponse(c, bid);
    } catch (error) {
      if (error instanceof BidError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Approve bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to approve bid', 500);
    }
  });

  /**
   * @route PUT /api/admin/bids/:id/reject
   * @description Reject bid
   * @access ADMIN
   * Requirements: 8.4
   */
  app.put('/:id/reject', validate(RejectBidSchema), async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<RejectBidInput>(c);
      const bid = await bidService.reject(id, user.sub, data.note);
      return successResponse(c, bid);
    } catch (error) {
      if (error instanceof BidError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Reject bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reject bid', 500);
    }
  });

  return app;
}

export default {
  createContractorBidRoutes,
  createAdminBidRoutes,
};
