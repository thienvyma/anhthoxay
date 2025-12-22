/**
 * Users Routes Module
 * 
 * Handles CRUD operations for user management.
 * Includes listing, creating, updating, deleting users, and session management.
 * All endpoints require ADMIN role.
 * 
 * **Feature: user-management**
 * **Requirements: Admin-only user management, session control**
 * 
 * @route /api/users
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';
import { UsersService } from '../services/users.service';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ListUsersQuerySchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ListUsersQuery,
} from '../schemas/users.schema';

// ============================================
// USERS ROUTES FACTORY
// ============================================

/**
 * Create users routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with users routes
 */
export function createUsersRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const usersService = new UsersService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // USER CRUD ROUTES
  // ============================================

  /**
   * @route GET /api/users
   * @description List all users with pagination and filtering
   * @access Admin only
   * @query search - Search by name or email
   * @query role - Filter by role (ADMIN, MANAGER, WORKER, USER)
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 20, max: 100)
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(ListUsersQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<ListUsersQuery>(c);
        const result = await usersService.list(query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        console.error('List users error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list users', 500);
      }
    }
  );

  /**
   * @route GET /api/users/:id
   * @description Get user by ID
   * @access Admin only
   */
  app.get('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const user = await usersService.getById(id);

      if (!user) {
        return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
      }

      return successResponse(c, user);
    } catch (error) {
      console.error('Get user error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get user', 500);
    }
  });

  /**
   * @route POST /api/users
   * @description Create new user
   * @access Admin only
   */
  app.post(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validate(CreateUserSchema),
    async (c) => {
      try {
        const data = getValidatedBody<CreateUserInput>(c);
        const user = await usersService.create(data);
        return successResponse(c, user, 201);
      } catch (error) {
        if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
          return errorResponse(c, 'CONFLICT', 'Email already exists', 409);
        }
        console.error('Create user error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create user', 500);
      }
    }
  );

  /**
   * @route PUT /api/users/:id
   * @description Update user
   * @access Admin only
   */
  app.put(
    '/:id',
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateUserSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const data = getValidatedBody<UpdateUserInput>(c);
        const user = await usersService.update(id, data);
        return successResponse(c, user);
      } catch (error) {
        if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
          return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
        }
        console.error('Update user error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update user', 500);
      }
    }
  );

  /**
   * @route DELETE /api/users/:id
   * @description Delete user (cannot delete self)
   * @access Admin only
   */
  app.delete('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const currentUser = getUser(c);

      await usersService.delete(id, currentUser.sub);
      return successResponse(c, { ok: true });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_FOUND') {
          return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
        }
        if (error.message === 'CANNOT_DELETE_SELF') {
          return errorResponse(c, 'FORBIDDEN', 'Cannot delete yourself', 403);
        }
      }
      console.error('Delete user error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete user', 500);
    }
  });

  // ============================================
  // USER BAN & SESSION ROUTES
  // ============================================

  /**
   * @route POST /api/users/:id/ban
   * @description Ban user - revokes all sessions (cannot ban self)
   * @access Admin only
   */
  app.post('/:id/ban', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const currentUser = getUser(c);

      const result = await usersService.banUser(id, currentUser.sub);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_FOUND') {
          return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
        }
        if (error.message === 'CANNOT_BAN_SELF') {
          return errorResponse(c, 'FORBIDDEN', 'Cannot ban yourself', 403);
        }
      }
      console.error('Ban user error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to ban user', 500);
    }
  });

  /**
   * @route GET /api/users/:id/sessions
   * @description Get user's active sessions
   * @access Admin only
   */
  app.get('/:id/sessions', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const sessions = await usersService.getUserSessions(id);
      return successResponse(c, sessions);
    } catch (error) {
      console.error('Get user sessions error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get user sessions', 500);
    }
  });

  /**
   * @route DELETE /api/users/:id/sessions/:sessionId
   * @description Revoke specific user session
   * @access Admin only
   */
  app.delete(
    '/:id/sessions/:sessionId',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const sessionId = c.req.param('sessionId');
        await usersService.revokeUserSession(sessionId);
        return successResponse(c, { ok: true });
      } catch (error) {
        if (error instanceof Error && error.message === 'SESSION_NOT_FOUND') {
          return errorResponse(c, 'NOT_FOUND', 'Session not found', 404);
        }
        console.error('Revoke session error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to revoke session', 500);
      }
    }
  );

  return app;
}

export default { createUsersRoutes };
