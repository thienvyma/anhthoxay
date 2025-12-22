/**
 * Saved Project Routes Module
 *
 * Handles contractor saved projects management.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 21.1, 21.2, 21.3**
 *
 * @route /api/contractor/saved-projects - Contractor saved projects routes
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validateQuery, getValidatedQuery } from '../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';
import { SavedProjectService, SavedProjectError } from '../services/saved-project.service';
import { ListSavedProjectsQuerySchema, type ListSavedProjectsQuery } from '../schemas/saved-project.schema';

// ============================================
// SAVED PROJECT ROUTES FACTORY
// ============================================

/**
 * Create saved project routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with saved project routes
 */
export function createSavedProjectRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const savedProjectService = new SavedProjectService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // CONTRACTOR SAVED PROJECT ROUTES
  // ============================================

  /**
   * @route GET /api/contractor/saved-projects
   * @description Get saved projects for current contractor
   * @access CONTRACTOR only
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 20, max: 100)
   */
  app.get(
    '/',
    authenticate(),
    requireRole('CONTRACTOR'),
    validateQuery(ListSavedProjectsQuerySchema),
    async (c) => {
      try {
        const user = getUser(c);
        const query = getValidatedQuery<ListSavedProjectsQuery>(c);
        const result = await savedProjectService.getSavedProjects(user.sub, query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        console.error('Get saved projects error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get saved projects', 500);
      }
    }
  );

  /**
   * @route POST /api/contractor/saved-projects/:projectId
   * @description Save a project
   * @access CONTRACTOR only
   */
  app.post('/:projectId', authenticate(), requireRole('CONTRACTOR'), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('projectId');
      const savedProject = await savedProjectService.saveProject(user.sub, projectId);
      return successResponse(c, savedProject, 201);
    } catch (error) {
      if (error instanceof SavedProjectError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Save project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to save project', 500);
    }
  });

  /**
   * @route DELETE /api/contractor/saved-projects/:projectId
   * @description Unsave a project
   * @access CONTRACTOR only
   */
  app.delete('/:projectId', authenticate(), requireRole('CONTRACTOR'), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('projectId');
      await savedProjectService.unsaveProject(user.sub, projectId);
      return successResponse(c, { message: 'Đã bỏ lưu công trình' });
    } catch (error) {
      if (error instanceof SavedProjectError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Unsave project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to unsave project', 500);
    }
  });

  /**
   * @route GET /api/contractor/saved-projects/:projectId/check
   * @description Check if a project is saved
   * @access CONTRACTOR only
   */
  app.get('/:projectId/check', authenticate(), requireRole('CONTRACTOR'), async (c) => {
    try {
      const user = getUser(c);
      const projectId = c.req.param('projectId');
      const isSaved = await savedProjectService.isSaved(user.sub, projectId);
      return successResponse(c, { isSaved });
    } catch (error) {
      console.error('Check saved project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to check saved project', 500);
    }
  });

  return app;
}

export default { createSavedProjectRoutes };
