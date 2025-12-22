/**
 * Project Routes Module
 *
 * Handles project management for public, homeowner, and admin operations.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 3.1-3.6, 4.1-4.5, 5.1-5.5, 9.1-9.5**
 *
 * @route /api/projects - Public project routes
 * @route /api/homeowner/projects - Homeowner project management routes
 * @route /api/admin/projects - Admin project management routes
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { ProjectService, ProjectError } from '../services/project.service';
import { BidService, BidError } from '../services/bid.service';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  SubmitProjectSchema,
  ProjectQuerySchema,
  PublicProjectQuerySchema,
  AdminProjectQuerySchema,
  ApproveProjectSchema,
  RejectProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type SubmitProjectInput,
  type ProjectQuery,
  type PublicProjectQuery,
  type AdminProjectQuery,
  type ApproveProjectInput,
  type RejectProjectInput,
} from '../schemas/project.schema';
import { MatchService, MatchError } from '../services/match';
import { MilestoneService, MilestoneError } from '../services/milestone.service';
import {
  SelectBidSchema,
  StartProjectSchema,
  CompleteProjectSchema,
  CancelMatchSchema,
  type SelectBidInput,
  type CancelMatchInput,
} from '../schemas/match.schema';
import {
  ConfirmMilestoneSchema,
  DisputeMilestoneSchema,
  type ConfirmMilestoneInput,
  type DisputeMilestoneInput,
} from '../schemas/milestone.schema';

// ============================================
// PUBLIC PROJECT ROUTES FACTORY
// ============================================

/**
 * Create public project routes with dependency injection
 * Requirements: 5.1-5.5 - Public project listing for contractors
 * @param prisma - Prisma client instance
 * @returns Hono app with public project routes
 */
export function createPublicProjectRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const projectService = new ProjectService(prisma);

  /**
   * @route GET /api/projects
   * @description List open projects (for contractors)
   * @access Public
   * @query regionId - Filter by region
   * @query categoryId - Filter by category
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 20)
   * @query search - Search by title, code, description
   * @query sortBy - Sort field (createdAt, bidDeadline, bidCount)
   * @query sortOrder - Sort order (asc, desc)
   * Requirements: 5.1, 5.4, 5.5, 5.6
   */
  app.get('/', validateQuery(PublicProjectQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<PublicProjectQuery>(c);
      const result = await projectService.getPublicList(query);
      return successResponse(c, result);
    } catch (error) {
      console.error('Get public projects error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get projects', 500);
    }
  });

  /**
   * @route GET /api/projects/:id
   * @description Get project detail (limited info, no address)
   * @access Public
   * Requirements: 5.2, 5.3, 12.1, 12.2
   */
  app.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const project = await projectService.getPublicById(id);

      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại hoặc không còn mở', 404);
      }

      return successResponse(c, project);
    } catch (error) {
      console.error('Get public project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get project', 500);
    }
  });

  return app;
}

// ============================================
// HOMEOWNER PROJECT ROUTES FACTORY
// ============================================

/**
 * Create homeowner project routes with dependency injection
 * Requirements: 3.1-3.6, 9.1-9.5 - Homeowner project management
 * @param prisma - Prisma client instance
 * @returns Hono app with homeowner project routes
 */
export function createHomeownerProjectRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const projectService = new ProjectService(prisma);
  const bidService = new BidService(prisma);
  const matchService = new MatchService(prisma);
  const milestoneService = new MilestoneService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // Apply auth middleware to all routes
  app.use('*', authenticate());
  app.use('*', requireRole('HOMEOWNER'));

  /**
   * @route POST /api/homeowner/projects
   * @description Create a new project
   * @access HOMEOWNER
   * Requirements: 3.1
   */
  app.post('/', validate(CreateProjectSchema), async (c) => {
    try {
      const user = getUser(c);
      const data = getValidatedBody<CreateProjectInput>(c);
      const project = await projectService.create(user.sub, data);
      return successResponse(c, project, 201);
    } catch (error) {
      if (error instanceof ProjectError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Create project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create project', 500);
    }
  });

  /**
   * @route GET /api/homeowner/projects
   * @description List my projects
   * @access HOMEOWNER
   * Requirements: 3.6
   */
  app.get('/', validateQuery(ProjectQuerySchema), async (c) => {
    try {
      const user = getUser(c);
      const query = getValidatedQuery<ProjectQuery>(c);
      const result = await projectService.getByOwner(user.sub, query);
      return successResponse(c, result);
    } catch (error) {
      console.error('Get homeowner projects error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get projects', 500);
    }
  });

  /**
   * @route GET /api/homeowner/projects/:id
   * @description Get my project detail
   * @access HOMEOWNER
   * Requirements: 3.7
   */
  app.get('/:id', async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const project = await projectService.getByIdForOwner(id, user.sub);

      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }

      return successResponse(c, project);
    } catch (error) {
      if (error instanceof ProjectError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Get homeowner project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get project', 500);
    }
  });

  /**
   * @route PUT /api/homeowner/projects/:id
   * @description Update project
   * @access HOMEOWNER
   * Requirements: 3.2
   */
  app.put('/:id', validate(UpdateProjectSchema), async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateProjectInput>(c);
      const project = await projectService.update(id, user.sub, data);
      return successResponse(c, project);
    } catch (error) {
      if (error instanceof ProjectError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Update project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update project', 500);
    }
  });

  /**
   * @route POST /api/homeowner/projects/:id/submit
   * @description Submit project for approval
   * @access HOMEOWNER
   * Requirements: 3.3, 3.4
   */
  app.post('/:id/submit', validate(SubmitProjectSchema), async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<SubmitProjectInput>(c);
      const project = await projectService.submit(id, user.sub, data.bidDeadline);
      return successResponse(c, project);
    } catch (error) {
      if (error instanceof ProjectError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Submit project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to submit project', 500);
    }
  });

  /**
   * @route DELETE /api/homeowner/projects/:id
   * @description Delete project
   * @access HOMEOWNER
   * Requirements: 3.5
   */
  app.delete('/:id', async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      await projectService.delete(id, user.sub);
      return successResponse(c, { message: 'Đã xóa công trình thành công' });
    } catch (error) {
      if (error instanceof ProjectError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Delete project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete project', 500);
    }
  });

  /**
   * @route GET /api/homeowner/projects/:id/bids
   * @description View approved bids on my project
   * @access HOMEOWNER
   * Requirements: 9.1-9.5
   */
  app.get('/:id/bids', async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      
      // Parse query params for pagination/sorting
      const page = parseInt(c.req.query('page') || '1', 10);
      const limit = parseInt(c.req.query('limit') || '20', 10);
      const sortBy = c.req.query('sortBy') || 'createdAt';
      const sortOrder = (c.req.query('sortOrder') || 'desc') as 'asc' | 'desc';

      const result = await bidService.getApprovedByProject(id, user.sub, {
        page,
        limit,
        sortBy,
        sortOrder,
      });
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof BidError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Get project bids error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get bids', 500);
    }
  });

  // ============================================
  // MATCH ROUTES (Phase 3)
  // ============================================

  /**
   * @route POST /api/homeowner/projects/:id/select-bid
   * @description Select a bid for the project
   * @access HOMEOWNER
   * Requirements: 8.1 - Validate all preconditions and perform the match
   *
   * **Feature: bidding-phase3-matching**
   */
  app.post('/:id/select-bid', validate(SelectBidSchema), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('id');
      const data = getValidatedBody<SelectBidInput>(c);
      
      const result = await matchService.selectBid(projectId, data.bidId, user.sub);
      return successResponse(c, result, 201);
    } catch (error) {
      if (error instanceof MatchError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Select bid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to select bid', 500);
    }
  });

  /**
   * @route GET /api/homeowner/projects/:id/match
   * @description Get match details with contractor contact information
   * @access HOMEOWNER
   * Requirements: 8.2, 8.3, 8.4 - Return contractor contact info, escrow status, win fee info
   *
   * **Feature: bidding-phase3-matching**
   */
  app.get('/:id/match', async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('id');
      
      const result = await matchService.getMatchDetails(projectId, user.sub);
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
   * @route POST /api/homeowner/projects/:id/start
   * @description Start the matched project (transition to IN_PROGRESS)
   * @access HOMEOWNER
   * Requirements: 11.6 - Allow transition to IN_PROGRESS status
   *
   * **Feature: bidding-phase3-matching**
   */
  app.post('/:id/start', validate(StartProjectSchema), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('id');
      
      const result = await matchService.startProject(projectId, user.sub);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MatchError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Start project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to start project', 500);
    }
  });

  /**
   * @route POST /api/homeowner/projects/:id/complete
   * @description Complete the project
   * @access HOMEOWNER
   * Requirements: 17.1, 17.2 - Confirm completion and release escrow
   *
   * **Feature: bidding-phase3-matching**
   */
  app.post('/:id/complete', validate(CompleteProjectSchema), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('id');
      
      const result = await matchService.completeProject(projectId, user.sub);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MatchError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Complete project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to complete project', 500);
    }
  });

  /**
   * @route POST /api/homeowner/projects/:id/cancel
   * @description Cancel the matched project
   * @access HOMEOWNER
   * Requirements: 8.5 - Validate project status allows cancellation
   *
   * **Feature: bidding-phase3-matching**
   */
  app.post('/:id/cancel', validate(CancelMatchSchema), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('id');
      const data = getValidatedBody<CancelMatchInput>(c);
      
      const result = await matchService.cancelMatch(projectId, user.sub, data);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MatchError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Cancel match error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel match', 500);
    }
  });

  // ============================================
  // MILESTONE ROUTES (Phase 3)
  // ============================================

  /**
   * @route POST /api/homeowner/projects/:id/milestone/:milestoneId/confirm
   * @description Confirm milestone completion
   * @access HOMEOWNER
   * Requirements: 15.3 - Homeowner confirms milestone completion
   *
   * **Feature: bidding-phase3-matching**
   */
  app.post('/:id/milestone/:milestoneId/confirm', validate(ConfirmMilestoneSchema), async (c) => {
    try {
      const user = getUser(c);
      const milestoneId = c.req.param('milestoneId');
      const data = getValidatedBody<ConfirmMilestoneInput>(c);
      
      const result = await milestoneService.confirmCompletion(milestoneId, user.sub, data);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MilestoneError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Confirm milestone error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to confirm milestone', 500);
    }
  });

  /**
   * @route POST /api/homeowner/projects/:id/milestone/:milestoneId/dispute
   * @description Dispute a milestone
   * @access HOMEOWNER
   * Requirements: 15.6 - Homeowner disputes milestone
   *
   * **Feature: bidding-phase3-matching**
   */
  app.post('/:id/milestone/:milestoneId/dispute', validate(DisputeMilestoneSchema), async (c) => {
    try {
      const user = getUser(c);
      const milestoneId = c.req.param('milestoneId');
      const data = getValidatedBody<DisputeMilestoneInput>(c);
      
      const result = await milestoneService.disputeMilestone(milestoneId, user.sub, data);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof MilestoneError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Dispute milestone error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to dispute milestone', 500);
    }
  });

  return app;
}

// ============================================
// ADMIN PROJECT ROUTES FACTORY
// ============================================

/**
 * Create admin project routes with dependency injection
 * Requirements: 4.1-4.5 - Admin project management
 * @param prisma - Prisma client instance
 * @returns Hono app with admin project routes
 */
export function createAdminProjectRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const projectService = new ProjectService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // Apply auth middleware to all routes
  app.use('*', authenticate());
  app.use('*', requireRole('ADMIN'));

  /**
   * @route GET /api/admin/projects
   * @description List all projects
   * @access ADMIN
   * Requirements: 4.1
   */
  app.get('/', validateQuery(AdminProjectQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<AdminProjectQuery>(c);
      const result = await projectService.getAdminList(query);
      return successResponse(c, result);
    } catch (error) {
      console.error('Get admin projects error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get projects', 500);
    }
  });

  /**
   * @route GET /api/admin/projects/:id
   * @description Get project detail
   * @access ADMIN
   * Requirements: 4.2
   */
  app.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const project = await projectService.getAdminById(id);

      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }

      return successResponse(c, project);
    } catch (error) {
      console.error('Get admin project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get project', 500);
    }
  });

  /**
   * @route PUT /api/admin/projects/:id/approve
   * @description Approve project
   * @access ADMIN
   * Requirements: 4.3, 4.5
   */
  app.put('/:id/approve', validate(ApproveProjectSchema), async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<ApproveProjectInput>(c);
      const project = await projectService.approve(id, user.sub, data.note);
      return successResponse(c, project);
    } catch (error) {
      if (error instanceof ProjectError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Approve project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to approve project', 500);
    }
  });

  /**
   * @route PUT /api/admin/projects/:id/reject
   * @description Reject project
   * @access ADMIN
   * Requirements: 4.4
   */
  app.put('/:id/reject', validate(RejectProjectSchema), async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<RejectProjectInput>(c);
      const project = await projectService.reject(id, user.sub, data.note);
      return successResponse(c, project);
    } catch (error) {
      if (error instanceof ProjectError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Reject project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reject project', 500);
    }
  });

  return app;
}

export default {
  createPublicProjectRoutes,
  createHomeownerProjectRoutes,
  createAdminProjectRoutes,
};
