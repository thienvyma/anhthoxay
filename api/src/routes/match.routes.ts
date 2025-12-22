/**
 * Match Routes Module
 *
 * Handles admin match management operations.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 10.1-10.3**
 *
 * @route /api/admin/matches - Admin match management routes
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { MatchService, MatchError } from '../services/match';
import {
  MatchQuerySchema,
  CancelMatchSchema,
  type MatchQuery,
  type CancelMatchInput,
} from '../schemas/match.schema';

// Schemas for approve/reject match
const ApproveMatchSchema = z.object({
  note: z.string().optional(),
});

const RejectMatchSchema = z.object({
  note: z.string().min(1, 'Lý do từ chối là bắt buộc'),
});

type ApproveMatchInput = z.infer<typeof ApproveMatchSchema>;
type RejectMatchInput = z.infer<typeof RejectMatchSchema>;

// ============================================
// ADMIN MATCH ROUTES FACTORY
// ============================================

/**
 * Create admin match routes with dependency injection
 * Requirements: 10.1-10.3 - Admin match management
 * @param prisma - Prisma client instance
 * @returns Hono app with admin match routes
 */
export function createAdminMatchRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const matchService = new MatchService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // Apply auth middleware to all routes
  app.use('*', authenticate());
  app.use('*', requireRole('ADMIN'));

  /**
   * @route GET /api/admin/matches
   * @description List matched projects (includes PENDING_MATCH and MATCHED)
   * @access ADMIN
   * Requirements: 10.1 - Return projects with PENDING_MATCH or MATCHED status
   *
   * **Feature: bidding-phase3-matching**
   */
  app.get('/', validateQuery(MatchQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<MatchQuery>(c);
      const result = await matchService.listMatches(query);
      return successResponse(c, result);
    } catch (error) {
      console.error('List matches error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list matches', 500);
    }
  });

  /**
   * @route GET /api/admin/matches/:projectId
   * @description Get match details
   * @access ADMIN
   * Requirements: 10.2 - Return full details of homeowner, contractor, escrow, and fees
   *
   * **Feature: bidding-phase3-matching**
   */
  app.get('/:projectId', async (c) => {
    try {
      const projectId = c.req.param('projectId');
      const result = await matchService.getMatchDetailsAdmin(projectId);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MatchError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Get match details error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get match details', 500);
    }
  });

  /**
   * @route PUT /api/admin/matches/:projectId/approve
   * @description Approve a pending match (final step)
   * @access ADMIN
   * NEW: Admin approves match → Creates escrow, fee, notifies both parties
   *
   * **Feature: bidding-phase3-matching**
   */
  app.put('/:projectId/approve', validate(ApproveMatchSchema), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('projectId');
      const data = getValidatedBody<ApproveMatchInput>(c);
      
      const result = await matchService.approveMatch(projectId, user.sub, data.note);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MatchError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Approve match error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to approve match', 500);
    }
  });

  /**
   * @route PUT /api/admin/matches/:projectId/reject
   * @description Reject a pending match
   * @access ADMIN
   * NEW: Admin rejects match → Reverts project to BIDDING_CLOSED
   *
   * **Feature: bidding-phase3-matching**
   */
  app.put('/:projectId/reject', validate(RejectMatchSchema), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('projectId');
      const data = getValidatedBody<RejectMatchInput>(c);
      
      const result = await matchService.rejectMatch(projectId, user.sub, data.note);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MatchError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Reject match error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reject match', 500);
    }
  });

  /**
   * @route PUT /api/admin/matches/:projectId/cancel
   * @description Cancel match (for already MATCHED projects)
   * @access ADMIN
   * Requirements: 10.3 - Revert project status and handle escrow appropriately
   *
   * **Feature: bidding-phase3-matching**
   */
  app.put('/:projectId/cancel', validate(CancelMatchSchema), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('projectId');
      const data = getValidatedBody<CancelMatchInput>(c);
      
      const result = await matchService.cancelMatchAdmin(projectId, user.sub, data);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MatchError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Cancel match error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel match', 500);
    }
  });

  return app;
}

export default {
  createAdminMatchRoutes,
};
