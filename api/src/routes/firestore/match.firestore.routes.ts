/**
 * Match Firestore Routes
 * 
 * Handles match management using Firestore backend.
 * 
 * @route /api/homeowner/projects/:id/select-bid - Homeowner selects a bid
 * @route /api/admin/matches - Admin match management routes
 * 
 * @module routes/firestore/match.firestore.routes
 * @requirements 5.6
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole, getCurrentUser } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { getProjectFirestoreService, ProjectFirestoreError } from '../../services/firestore/project.firestore';
import { getBidFirestoreService, BidFirestoreError } from '../../services/firestore/bid.firestore';
import { getEscrowFirestoreService, EscrowFirestoreError } from '../../services/firestore/escrow.firestore';
import { getFeeFirestoreService, FeeFirestoreError } from '../../services/firestore/fee.firestore';
import { getUsersFirestoreService } from '../../services/firestore/users.firestore';
import { getSettingsFirestoreService } from '../../services/firestore/settings.firestore';
import { z } from 'zod';
import { logger } from '../../utils/logger';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const SelectBidSchema = z.object({
  bidId: z.string().min(1, 'ID bid không được để trống'),
});

const MatchQuerySchema = z.object({
  escrowStatus: z.string().optional(),
  feeStatus: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['matchedAt', 'createdAt']).default('matchedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const CancelMatchSchema = z.object({
  reason: z.string().min(1).max(500),
});

const ApproveMatchSchema = z.object({
  note: z.string().max(500).optional(),
});

const RejectMatchSchema = z.object({
  note: z.string().min(1, 'Lý do từ chối là bắt buộc').max(500),
});

const StartProjectSchema = z.object({
  note: z.string().max(500).optional(),
});

const CompleteProjectSchema = z.object({
  note: z.string().max(500).optional(),
});

// ============================================
// MATCH ERROR CLASS
// ============================================

export class MatchFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'MatchFirestoreError';

    const statusMap: Record<string, number> = {
      PROJECT_NOT_FOUND: 404,
      BID_NOT_FOUND: 404,
      MATCH_NOT_FOUND: 404,
      PROJECT_ACCESS_DENIED: 403,
      PROJECT_INVALID_STATUS: 400,
      BID_INVALID_STATUS: 400,
      MATCH_ALREADY_EXISTS: 409,
      ESCROW_CREATION_FAILED: 500,
      FEE_CREATION_FAILED: 500,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// HOMEOWNER MATCH ROUTES
// ============================================

export function createHomeownerMatchFirestoreRoutes() {
  const app = new Hono();
  const projectService = getProjectFirestoreService();
  const bidService = getBidFirestoreService();
  const escrowService = getEscrowFirestoreService();
  const feeService = getFeeFirestoreService();
  const settingsService = getSettingsFirestoreService();

  // Apply auth middleware to all routes
  app.use('*', firebaseAuth());
  app.use('*', requireRole('HOMEOWNER', 'ADMIN'));

  /**
   * @route POST /api/homeowner/projects/:id/select-bid
   * @description Select a bid for a project (creates PENDING_MATCH)
   * @access HOMEOWNER
   */
  app.post('/:id/select-bid', validate(SelectBidSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('id');
      const { bidId } = getValidatedBody<{ bidId: string }>(c);

      // Verify project ownership and status
      const project = await projectService.getById(projectId);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (project.ownerId !== user.uid) {
        return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Bạn không có quyền chọn bid cho công trình này', 403);
      }
      if (project.status !== 'BIDDING_CLOSED') {
        return errorResponse(c, 'PROJECT_INVALID_STATUS', 'Chỉ có thể chọn bid khi công trình ở trạng thái BIDDING_CLOSED', 400);
      }

      // Verify bid exists and is approved
      const bid = await bidService.getById(projectId, bidId);
      if (!bid) {
        return errorResponse(c, 'BID_NOT_FOUND', 'Bid không tồn tại', 404);
      }
      if (bid.status !== 'APPROVED') {
        return errorResponse(c, 'BID_INVALID_STATUS', 'Chỉ có thể chọn bid đã được duyệt', 400);
      }

      // Select the bid and mark others as not selected
      await bidService.select(projectId, bidId);
      await bidService.markOthersNotSelected(projectId, bidId);

      // Update project to PENDING_MATCH (waiting for admin approval)
      const updatedProject = await projectService.update(projectId, {
        status: 'MATCHED',
        selectedBidId: bidId,
        matchedAt: new Date(),
      } as Parameters<typeof projectService.update>[1]);

      // Get bidding settings for escrow/fee calculation
      const biddingSettings = await settingsService.getBiddingSettings();
      
      // Calculate escrow amount
      const escrowPercentage = biddingSettings?.escrowPercentage || 10;
      const escrowMinAmount = biddingSettings?.escrowMinAmount || 1000000;
      const escrowMaxAmount = biddingSettings?.escrowMaxAmount;
      
      let escrowAmount = Math.max(bid.price * escrowPercentage / 100, escrowMinAmount);
      if (escrowMaxAmount) {
        escrowAmount = Math.min(escrowAmount, escrowMaxAmount);
      }

      // Create escrow
      const escrow = await escrowService.createEscrow({
        projectId,
        bidId,
        homeownerId: user.uid,
        amount: escrowAmount,
      });

      // Calculate win fee
      const winFeePercentage = biddingSettings?.winFeePercentage || 5;
      const winFeeAmount = bid.price * winFeePercentage / 100;

      // Create fee transaction
      const fee = await feeService.createFee({
        userId: bid.contractorId,
        projectId,
        bidId,
        type: 'WIN_FEE',
        amount: winFeeAmount,
      });

      logger.info('Match created', { projectId, bidId, escrowId: escrow.id, feeId: fee.id });

      return successResponse(c, {
        project: updatedProject,
        escrow,
        fee,
        message: 'Đã chọn bid thành công. Vui lòng đặt cọc để tiếp tục.',
      });
    } catch (error) {
      if (error instanceof ProjectFirestoreError || 
          error instanceof BidFirestoreError ||
          error instanceof EscrowFirestoreError ||
          error instanceof FeeFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Select bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to select bid', 500);
    }
  });

  /**
   * @route GET /api/homeowner/projects/:id/match
   * @description Get match details for a project
   * @access HOMEOWNER
   */
  app.get('/:id/match', async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('id');

      // Verify project ownership
      const project = await projectService.getById(projectId);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (project.ownerId !== user.uid) {
        return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Bạn không có quyền xem match này', 403);
      }
      if (!project.selectedBidId) {
        return errorResponse(c, 'MATCH_NOT_FOUND', 'Công trình chưa có match', 404);
      }

      // Get bid and contractor info
      const bid = await bidService.getByIdWithRelations(projectId, project.selectedBidId);
      
      // Get escrow
      const escrow = await escrowService.getByProject(projectId);
      
      // Get fee
      const fees = await feeService.getByProject(projectId);

      return successResponse(c, {
        project,
        bid,
        escrow,
        fees,
      });
    } catch (error) {
      console.error('Get match error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get match details', 500);
    }
  });

  /**
   * @route POST /api/homeowner/projects/:id/start
   * @description Start project (MATCHED → IN_PROGRESS)
   * @access HOMEOWNER
   */
  app.post('/:id/start', validate(StartProjectSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('id');

      // Verify project ownership and status
      const project = await projectService.getById(projectId);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (project.ownerId !== user.uid) {
        return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Bạn không có quyền bắt đầu công trình này', 403);
      }
      if (project.status !== 'MATCHED') {
        return errorResponse(c, 'PROJECT_INVALID_STATUS', 'Chỉ có thể bắt đầu công trình ở trạng thái MATCHED', 400);
      }

      // Verify escrow is HELD
      const escrow = await escrowService.getByProject(projectId);
      if (!escrow || escrow.status !== 'HELD') {
        return errorResponse(c, 'ESCROW_NOT_HELD', 'Escrow phải được xác nhận trước khi bắt đầu công trình', 400);
      }

      // Transition project to IN_PROGRESS
      const updatedProject = await projectService.transitionStatus(projectId, 'IN_PROGRESS');

      // Create default milestones
      await escrowService.createDefaultMilestones(escrow.id, projectId);

      logger.info('Project started', { projectId });

      return successResponse(c, {
        project: updatedProject,
        message: 'Đã bắt đầu công trình thành công.',
      });
    } catch (error) {
      if (error instanceof ProjectFirestoreError || error instanceof EscrowFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Start project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to start project', 500);
    }
  });

  /**
   * @route POST /api/homeowner/projects/:id/complete
   * @description Complete project (IN_PROGRESS → COMPLETED)
   * @access HOMEOWNER
   */
  app.post('/:id/complete', validate(CompleteProjectSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('id');

      // Verify project ownership and status
      const project = await projectService.getById(projectId);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (project.ownerId !== user.uid) {
        return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Bạn không có quyền hoàn thành công trình này', 403);
      }
      if (project.status !== 'IN_PROGRESS') {
        return errorResponse(c, 'PROJECT_INVALID_STATUS', 'Chỉ có thể hoàn thành công trình ở trạng thái IN_PROGRESS', 400);
      }

      // Transition project to COMPLETED
      const updatedProject = await projectService.transitionStatus(projectId, 'COMPLETED');

      // Release remaining escrow
      const escrow = await escrowService.getByProject(projectId);
      if (escrow && ['HELD', 'PARTIAL_RELEASED'].includes(escrow.status)) {
        await escrowService.release(escrow.id, user.uid, 'Project completed');
      }

      logger.info('Project completed', { projectId });

      return successResponse(c, {
        project: updatedProject,
        message: 'Đã hoàn thành công trình thành công.',
      });
    } catch (error) {
      if (error instanceof ProjectFirestoreError || error instanceof EscrowFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Complete project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to complete project', 500);
    }
  });

  /**
   * @route POST /api/homeowner/projects/:id/cancel
   * @description Cancel match
   * @access HOMEOWNER
   */
  app.post('/:id/cancel', validate(CancelMatchSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('id');
      const { reason } = getValidatedBody<{ reason: string }>(c);

      // Verify project ownership and status
      const project = await projectService.getById(projectId);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (project.ownerId !== user.uid) {
        return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Bạn không có quyền hủy match này', 403);
      }
      if (!['MATCHED', 'IN_PROGRESS'].includes(project.status)) {
        return errorResponse(c, 'PROJECT_INVALID_STATUS', 'Không thể hủy match ở trạng thái này', 400);
      }

      // Handle escrow refund
      const escrow = await escrowService.getByProject(projectId);
      if (escrow && ['PENDING', 'HELD', 'PARTIAL_RELEASED'].includes(escrow.status)) {
        if (escrow.status === 'PENDING') {
          await escrowService.cancel(escrow.id, user.uid, reason);
        } else {
          await escrowService.refund(escrow.id, user.uid, { reason });
        }
      }

      // Cancel fee
      const fees = await feeService.getByProject(projectId);
      for (const fee of fees) {
        if (fee.status === 'PENDING') {
          await feeService.cancel(fee.id, user.uid, { reason });
        }
      }

      // Transition project to CANCELLED
      const updatedProject = await projectService.transitionStatus(projectId, 'CANCELLED');

      logger.info('Match cancelled by homeowner', { projectId, reason });

      return successResponse(c, {
        project: updatedProject,
        message: 'Đã hủy match thành công.',
      });
    } catch (error) {
      if (error instanceof ProjectFirestoreError || 
          error instanceof EscrowFirestoreError ||
          error instanceof FeeFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Cancel match error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel match', 500);
    }
  });

  return app;
}

// ============================================
// ADMIN MATCH ROUTES
// ============================================

export function createAdminMatchFirestoreRoutes() {
  const app = new Hono();
  const projectService = getProjectFirestoreService();
  const bidService = getBidFirestoreService();
  const escrowService = getEscrowFirestoreService();
  const feeService = getFeeFirestoreService();
  const usersService = getUsersFirestoreService();

  // Apply auth middleware to all routes
  app.use('*', firebaseAuth());
  app.use('*', requireRole('ADMIN'));

  /**
   * @route GET /api/admin/matches
   * @description List matched projects
   * @access ADMIN
   */
  app.get('/', validateQuery(MatchQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<z.infer<typeof MatchQuerySchema>>(c);
      
      // Get projects with MATCHED or IN_PROGRESS status
      const allProjects = await projectService.query({
        where: [
          { field: 'status', operator: 'in', value: ['MATCHED', 'IN_PROGRESS', 'COMPLETED'] },
        ],
        orderBy: [{ field: query.sortBy === 'matchedAt' ? 'matchedAt' : 'createdAt', direction: query.sortOrder }],
      });

      // Filter by escrow/fee status if provided
      const matchedProjects = [];
      for (const project of allProjects) {
        if (!project.selectedBidId) continue;

        const escrow = await escrowService.getByProject(project.id);
        const fees = await feeService.getByProject(project.id);
        const winFee = fees.find(f => f.type === 'WIN_FEE');

        // Apply filters
        if (query.escrowStatus && escrow?.status !== query.escrowStatus) continue;
        if (query.feeStatus && winFee?.status !== query.feeStatus) continue;

        // Get bid and users
        const bid = await bidService.getByIdWithRelations(project.id, project.selectedBidId);
        const homeowner = await usersService.getById(project.ownerId);
        const contractor = bid?.contractorId ? await usersService.getById(bid.contractorId) : null;

        matchedProjects.push({
          project,
          bid,
          escrow,
          fee: winFee,
          homeowner: homeowner ? {
            id: homeowner.id,
            name: homeowner.name,
            email: homeowner.email,
            phone: homeowner.phone,
          } : null,
          contractor: contractor ? {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
            rating: contractor.rating,
            verificationStatus: contractor.verificationStatus,
          } : null,
        });
      }

      // Paginate
      const total = matchedProjects.length;
      const start = (query.page - 1) * query.limit;
      const data = matchedProjects.slice(start, start + query.limit);

      return successResponse(c, {
        data,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    } catch (error) {
      console.error('List matches error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list matches', 500);
    }
  });

  /**
   * @route GET /api/admin/matches/:projectId
   * @description Get match details
   * @access ADMIN
   */
  app.get('/:projectId', async (c) => {
    try {
      const projectId = c.req.param('projectId');

      const project = await projectService.getById(projectId);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (!project.selectedBidId) {
        return errorResponse(c, 'MATCH_NOT_FOUND', 'Công trình chưa có match', 404);
      }

      // Get all related data
      const bid = await bidService.getByIdWithRelations(projectId, project.selectedBidId);
      const escrow = await escrowService.getByProject(projectId);
      const fees = await feeService.getByProject(projectId);
      const homeowner = await usersService.getById(project.ownerId);
      const contractor = bid?.contractorId ? await usersService.getById(bid.contractorId) : null;

      // Get milestones if escrow exists
      const milestones = escrow ? await escrowService.getMilestones(escrow.id) : [];

      return successResponse(c, {
        project,
        bid,
        escrow,
        milestones,
        fees,
        homeowner: homeowner ? {
          id: homeowner.id,
          name: homeowner.name,
          email: homeowner.email,
          phone: homeowner.phone,
        } : null,
        contractor: contractor ? {
          id: contractor.id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          companyName: contractor.companyName,
          rating: contractor.rating,
          totalProjects: contractor.totalProjects,
          verificationStatus: contractor.verificationStatus,
        } : null,
      });
    } catch (error) {
      console.error('Get match details error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get match details', 500);
    }
  });

  /**
   * @route PUT /api/admin/matches/:projectId/approve
   * @description Approve a pending match
   * @access ADMIN
   */
  app.put('/:projectId/approve', validate(ApproveMatchSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('projectId');
      const { note } = getValidatedBody<{ note?: string }>(c);

      const project = await projectService.getById(projectId);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (project.status !== 'MATCHED') {
        return errorResponse(c, 'PROJECT_INVALID_STATUS', 'Chỉ có thể duyệt match ở trạng thái MATCHED', 400);
      }

      // Confirm escrow deposit
      const escrow = await escrowService.getByProject(projectId);
      if (escrow && escrow.status === 'PENDING') {
        await escrowService.confirmDeposit(escrow.id, user.uid, note);
      }

      logger.info('Match approved', { projectId, adminId: user.uid });

      return successResponse(c, {
        project,
        escrow: escrow ? await escrowService.getById(escrow.id) : null,
        message: 'Đã duyệt match thành công.',
      });
    } catch (error) {
      if (error instanceof ProjectFirestoreError || error instanceof EscrowFirestoreError) {
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
   */
  app.put('/:projectId/reject', validate(RejectMatchSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('projectId');
      const { note } = getValidatedBody<{ note: string }>(c);

      const project = await projectService.getById(projectId);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (project.status !== 'MATCHED') {
        return errorResponse(c, 'PROJECT_INVALID_STATUS', 'Chỉ có thể từ chối match ở trạng thái MATCHED', 400);
      }

      // Cancel escrow
      const escrow = await escrowService.getByProject(projectId);
      if (escrow && escrow.status === 'PENDING') {
        await escrowService.cancel(escrow.id, user.uid, note);
      }

      // Cancel fee
      const fees = await feeService.getByProject(projectId);
      for (const fee of fees) {
        if (fee.status === 'PENDING') {
          await feeService.cancel(fee.id, user.uid, { reason: note });
        }
      }

      // Revert project to BIDDING_CLOSED
      const updatedProject = await projectService.update(projectId, {
        status: 'BIDDING_CLOSED',
        selectedBidId: undefined,
        matchedAt: undefined,
      } as Parameters<typeof projectService.update>[1]);

      // Revert bid status
      if (project.selectedBidId) {
        const bidSubcollection = bidService.getBidSubcollection();
        await bidSubcollection.updateStatus(projectId, project.selectedBidId, 'APPROVED');
      }

      logger.info('Match rejected', { projectId, adminId: user.uid, note });

      return successResponse(c, {
        project: updatedProject,
        message: 'Đã từ chối match thành công.',
      });
    } catch (error) {
      if (error instanceof ProjectFirestoreError || 
          error instanceof EscrowFirestoreError ||
          error instanceof FeeFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Reject match error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reject match', 500);
    }
  });

  /**
   * @route PUT /api/admin/matches/:projectId/cancel
   * @description Cancel match (admin)
   * @access ADMIN
   */
  app.put('/:projectId/cancel', validate(CancelMatchSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const projectId = c.req.param('projectId');
      const { reason } = getValidatedBody<{ reason: string }>(c);

      const project = await projectService.getById(projectId);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (!['MATCHED', 'IN_PROGRESS'].includes(project.status)) {
        return errorResponse(c, 'PROJECT_INVALID_STATUS', 'Không thể hủy match ở trạng thái này', 400);
      }

      // Handle escrow
      const escrow = await escrowService.getByProject(projectId);
      if (escrow) {
        if (escrow.status === 'PENDING') {
          await escrowService.cancel(escrow.id, user.uid, reason);
        } else if (['HELD', 'PARTIAL_RELEASED'].includes(escrow.status)) {
          await escrowService.refund(escrow.id, user.uid, { reason });
        }
      }

      // Cancel fees
      const fees = await feeService.getByProject(projectId);
      for (const fee of fees) {
        if (fee.status === 'PENDING') {
          await feeService.cancel(fee.id, user.uid, { reason });
        }
      }

      // Transition project to CANCELLED
      const updatedProject = await projectService.transitionStatus(projectId, 'CANCELLED');

      logger.info('Match cancelled by admin', { projectId, adminId: user.uid, reason });

      return successResponse(c, {
        project: updatedProject,
        message: 'Đã hủy match thành công.',
      });
    } catch (error) {
      if (error instanceof ProjectFirestoreError || 
          error instanceof EscrowFirestoreError ||
          error instanceof FeeFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Cancel match error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel match', 500);
    }
  });

  return app;
}

export default {
  createHomeownerMatchFirestoreRoutes,
  createAdminMatchFirestoreRoutes,
};
