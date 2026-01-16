/**
 * Project Firestore Routes
 * 
 * Handles project management using Firestore backend.
 * 
 * @route /api/projects - Public project routes
 * @route /api/homeowner/projects - Homeowner project management routes
 * @route /api/admin/projects - Admin project management routes
 * 
 * @module routes/firestore/project.firestore.routes
 * @requirements 5.1, 5.2, 5.5
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole, getCurrentUser } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { 
  getProjectFirestoreService, 
  ProjectFirestoreError,
  type CreateProjectInput,
  type ProjectQueryParams,
} from '../../services/firestore/project.firestore';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CreateProjectSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  categoryId: z.string().min(1),
  regionId: z.string().min(1),
  address: z.string().min(5).max(500),
  area: z.number().positive().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  timeline: z.string().max(200).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  requirements: z.string().max(2000).optional(),
  maxBids: z.number().int().min(1).max(50).optional(),
});

const UpdateProjectSchema = CreateProjectSchema.partial();

const SubmitProjectSchema = z.object({
  bidDeadline: z.string().datetime().transform(s => new Date(s)),
});

const ProjectQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'bidDeadline', 'publishedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const PublicProjectQuerySchema = z.object({
  categoryId: z.string().optional(),
  regionId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'bidDeadline', 'publishedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const AdminProjectQuerySchema = z.object({
  status: z.string().optional(),
  ownerId: z.string().optional(),
  categoryId: z.string().optional(),
  regionId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'bidDeadline', 'publishedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const ApproveProjectSchema = z.object({
  note: z.string().max(500).optional(),
});

const RejectProjectSchema = z.object({
  note: z.string().min(10).max(500),
});

// ============================================
// PUBLIC PROJECT ROUTES
// ============================================

export function createPublicProjectFirestoreRoutes() {
  const app = new Hono();
  const projectService = getProjectFirestoreService();

  /**
   * @route GET /api/projects
   * @description List open projects (for contractors)
   * @access Public
   */
  app.get('/', validateQuery(PublicProjectQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<z.infer<typeof PublicProjectQuerySchema>>(c);
      const result = await projectService.getOpenProjects(query as ProjectQueryParams);
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
// HOMEOWNER PROJECT ROUTES
// ============================================

export function createHomeownerProjectFirestoreRoutes() {
  const app = new Hono();
  const projectService = getProjectFirestoreService();

  // Apply auth middleware to all routes
  app.use('*', firebaseAuth());
  app.use('*', requireRole('HOMEOWNER', 'ADMIN'));

  /**
   * @route POST /api/homeowner/projects
   * @description Create a new project
   * @access HOMEOWNER
   */
  app.post('/', validate(CreateProjectSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const data = getValidatedBody<CreateProjectInput>(c);
      const project = await projectService.createProject({
        ...data,
        ownerId: user.uid,
      });
      return successResponse(c, project, 201);
    } catch (error) {
      if (error instanceof ProjectFirestoreError) {
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
   */
  app.get('/', validateQuery(ProjectQuerySchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const query = getValidatedQuery<z.infer<typeof ProjectQuerySchema>>(c);
      const result = await projectService.getByOwner(user.uid, query as ProjectQueryParams);
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
   */
  app.get('/:id', async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const project = await projectService.getById(id);

      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }

      if (project.ownerId !== user.uid) {
        return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Bạn không có quyền xem công trình này', 403);
      }

      // Get bid count
      const bidCount = await projectService.getBidService().countBids(id);

      return successResponse(c, { ...project, bidCount });
    } catch (error) {
      if (error instanceof ProjectFirestoreError) {
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
   */
  app.put('/:id', validate(UpdateProjectSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<Partial<CreateProjectInput>>(c);
      
      // Verify ownership
      const existing = await projectService.getById(id);
      if (!existing) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (existing.ownerId !== user.uid) {
        return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Bạn không có quyền sửa công trình này', 403);
      }
      if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
        return errorResponse(c, 'PROJECT_INVALID_STATUS', 'Chỉ có thể sửa công trình ở trạng thái DRAFT hoặc REJECTED', 400);
      }

      const project = await projectService.updateProject(id, data);
      return successResponse(c, project);
    } catch (error) {
      if (error instanceof ProjectFirestoreError) {
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
   */
  app.post('/:id/submit', validate(SubmitProjectSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<{ bidDeadline: Date }>(c);
      const project = await projectService.submit(id, user.uid, data.bidDeadline);
      return successResponse(c, project);
    } catch (error) {
      if (error instanceof ProjectFirestoreError) {
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
   */
  app.delete('/:id', async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      
      // Verify ownership and status
      const existing = await projectService.getById(id);
      if (!existing) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (existing.ownerId !== user.uid) {
        return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Bạn không có quyền xóa công trình này', 403);
      }
      if (existing.status !== 'DRAFT') {
        return errorResponse(c, 'PROJECT_INVALID_STATUS', 'Chỉ có thể xóa công trình ở trạng thái DRAFT', 400);
      }

      await projectService.delete(id);
      return successResponse(c, { message: 'Đã xóa công trình thành công' });
    } catch (error) {
      if (error instanceof ProjectFirestoreError) {
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
   */
  app.get('/:id/bids', async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      
      // Verify ownership
      const project = await projectService.getById(id);
      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }
      if (project.ownerId !== user.uid) {
        return errorResponse(c, 'PROJECT_ACCESS_DENIED', 'Bạn không có quyền xem bids của công trình này', 403);
      }

      const bids = await projectService.getBids(id, 'APPROVED');
      return successResponse(c, { data: bids, total: bids.length });
    } catch (error) {
      if (error instanceof ProjectFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Get project bids error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get bids', 500);
    }
  });

  return app;
}


// ============================================
// ADMIN PROJECT ROUTES
// ============================================

export function createAdminProjectFirestoreRoutes() {
  const app = new Hono();
  const projectService = getProjectFirestoreService();

  // Apply auth middleware to all routes
  app.use('*', firebaseAuth());
  app.use('*', requireRole('ADMIN'));

  /**
   * @route GET /api/admin/projects
   * @description List all projects
   * @access ADMIN
   */
  app.get('/', validateQuery(AdminProjectQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<z.infer<typeof AdminProjectQuerySchema>>(c);
      
      // Build query params
      const params: ProjectQueryParams = {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      if (query.status) {
        params.status = query.status as ProjectQueryParams['status'];
      }
      if (query.ownerId) {
        params.ownerId = query.ownerId;
      }
      if (query.categoryId) {
        params.categoryId = query.categoryId;
      }
      if (query.regionId) {
        params.regionId = query.regionId;
      }

      // Get all projects (admin view)
      const allProjects = await projectService.query({
        orderBy: [{ field: params.sortBy || 'createdAt', direction: params.sortOrder || 'desc' }],
      });

      // Filter by params
      let filtered = allProjects;
      if (params.status) {
        filtered = filtered.filter(p => p.status === params.status);
      }
      if (params.ownerId) {
        filtered = filtered.filter(p => p.ownerId === params.ownerId);
      }
      if (params.categoryId) {
        filtered = filtered.filter(p => p.categoryId === params.categoryId);
      }
      if (params.regionId) {
        filtered = filtered.filter(p => p.regionId === params.regionId);
      }

      // Paginate
      const total = filtered.length;
      const start = ((params.page || 1) - 1) * (params.limit || 20);
      const data = filtered.slice(start, start + (params.limit || 20));

      // Add bid counts
      const projectsWithCounts = await Promise.all(
        data.map(async (project) => {
          const bidCount = await projectService.getBidService().countBids(project.id);
          return { ...project, bidCount };
        })
      );

      return successResponse(c, {
        data: projectsWithCounts,
        meta: {
          total,
          page: params.page || 1,
          limit: params.limit || 20,
          totalPages: Math.ceil(total / (params.limit || 20)),
        },
      });
    } catch (error) {
      console.error('Get admin projects error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get projects', 500);
    }
  });

  /**
   * @route GET /api/admin/projects/:id
   * @description Get project detail
   * @access ADMIN
   */
  app.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const project = await projectService.getById(id);

      if (!project) {
        return errorResponse(c, 'PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
      }

      // Get bids
      const bids = await projectService.getBids(id);
      const bidCount = bids.length;

      return successResponse(c, { ...project, bids, bidCount });
    } catch (error) {
      console.error('Get admin project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get project', 500);
    }
  });

  /**
   * @route PUT /api/admin/projects/:id/approve
   * @description Approve project
   * @access ADMIN
   */
  app.put('/:id/approve', validate(ApproveProjectSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<{ note?: string }>(c);
      const project = await projectService.approve(id, user.uid, data.note);
      return successResponse(c, project);
    } catch (error) {
      if (error instanceof ProjectFirestoreError) {
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
   */
  app.put('/:id/reject', validate(RejectProjectSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<{ note: string }>(c);
      const project = await projectService.reject(id, user.uid, data.note);
      return successResponse(c, project);
    } catch (error) {
      if (error instanceof ProjectFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Reject project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reject project', 500);
    }
  });

  return app;
}

export default {
  createPublicProjectFirestoreRoutes,
  createHomeownerProjectFirestoreRoutes,
  createAdminProjectFirestoreRoutes,
};
