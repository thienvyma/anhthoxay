/**
 * Users Firestore Routes
 * 
 * Handles CRUD operations for user management using Firestore.
 * All endpoints require ADMIN role.
 * 
 * @route /api/firestore/users
 * @requirements 3.1, 4.6
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole, getCurrentUid } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';
import {
  getUsersFirestoreService,
  UsersFirestoreError,
} from '../../services/firestore/users.firestore';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ListUsersQuerySchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ListUsersQuery,
} from '../../schemas/users.schema';
import { getFirebaseAuth } from '../../services/firebase-admin.service';
import { logger } from '../../utils/logger';

// ============================================
// USERS FIRESTORE ROUTES
// ============================================

const usersFirestoreRoutes = new Hono();
const usersService = getUsersFirestoreService();

// ============================================
// USER CRUD ROUTES
// ============================================

/**
 * @route GET /api/firestore/users
 * @description List all users with pagination and filtering
 * @access Admin only
 */
usersFirestoreRoutes.get(
  '/',
  firebaseAuth(),
  requireRole('ADMIN'),
  validateQuery(ListUsersQuerySchema),
  async (c) => {
    try {
      const query = getValidatedQuery<ListUsersQuery>(c);
      
      const result = await usersService.listUsers({
        role: query.role,
        search: query.search,
        limit: query.limit || 20,
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
      });

      // Calculate pagination meta
      const page = query.page || 1;
      const limit = query.limit || 20;
      const total = result.data.length; // Note: Firestore doesn't have efficient count

      return paginatedResponse(c, result.data, {
        total,
        page,
        limit,
      });
    } catch (error) {
      logger.error('List users error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list users', 500);
    }
  }
);

/**
 * @route GET /api/firestore/users/:id
 * @description Get user by ID
 * @access Admin only
 */
usersFirestoreRoutes.get(
  '/:id',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const user = await usersService.getById(id);

      if (!user) {
        return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
      }

      // Get contractor profile if applicable
      let profile = null;
      if (user.role === 'CONTRACTOR') {
        profile = await usersService.getContractorProfile(id);
      }

      return successResponse(c, { ...user, contractorProfile: profile });
    } catch (error) {
      logger.error('Get user error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get user', 500);
    }
  }
);

/**
 * @route POST /api/firestore/users
 * @description Create new user (creates Firebase Auth user + Firestore document)
 * @access Admin only
 */
usersFirestoreRoutes.post(
  '/',
  firebaseAuth(),
  requireRole('ADMIN'),
  validate(CreateUserSchema),
  async (c) => {
    try {
      const data = getValidatedBody<CreateUserInput>(c);

      // Create Firebase Auth user first
      const auth = await getFirebaseAuth();
      let authUser;
      
      try {
        authUser = await auth.createUser({
          email: data.email,
          password: data.password,
          displayName: data.name,
        });
      } catch (authError) {
        const error = authError as { code?: string };
        if (error.code === 'auth/email-already-exists') {
          return errorResponse(c, 'CONFLICT', 'Email already exists', 409);
        }
        throw authError;
      }

      // Create Firestore user document
      const user = await usersService.createUser(authUser.uid, {
        email: data.email,
        name: data.name,
        role: data.role,
      });

      logger.info('Created user via admin', { uid: authUser.uid, email: data.email });

      return successResponse(c, user, 201);
    } catch (error) {
      if (error instanceof UsersFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode as 400 | 404 | 409);
      }
      logger.error('Create user error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create user', 500);
    }
  }
);

/**
 * @route PUT /api/firestore/users/:id
 * @description Update user
 * @access Admin only
 */
usersFirestoreRoutes.put(
  '/:id',
  firebaseAuth(),
  requireRole('ADMIN'),
  validate(UpdateUserSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateUserInput>(c);

      // Check if user exists
      const existing = await usersService.getById(id);
      if (!existing) {
        return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
      }

      // Update password in Firebase Auth if provided
      if (data.password) {
        const auth = await getFirebaseAuth();
        await auth.updateUser(id, { password: data.password });
      }

      // Update Firestore document (exclude password)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...updateData } = data;
      const user = await usersService.updateUser(id, updateData);

      // Update display name in Firebase Auth if name changed
      if (data.name) {
        const auth = await getFirebaseAuth();
        await auth.updateUser(id, { displayName: data.name });
      }

      return successResponse(c, user);
    } catch (error) {
      if (error instanceof UsersFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode as 400 | 404 | 409);
      }
      logger.error('Update user error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update user', 500);
    }
  }
);

/**
 * @route DELETE /api/firestore/users/:id
 * @description Delete user (cannot delete self)
 * @access Admin only
 */
usersFirestoreRoutes.delete(
  '/:id',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const currentUid = getCurrentUid(c);

      // Cannot delete self
      if (id === currentUid) {
        return errorResponse(c, 'FORBIDDEN', 'Cannot delete yourself', 403);
      }

      // Check if user exists
      const existing = await usersService.getById(id);
      if (!existing) {
        return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
      }

      // Delete from Firebase Auth
      try {
        const auth = await getFirebaseAuth();
        await auth.deleteUser(id);
      } catch {
        // User might not exist in Auth, continue with Firestore deletion
      }

      // Delete from Firestore
      await usersService.deleteUser(id);

      logger.info('Deleted user', { uid: id, deletedBy: currentUid });

      return successResponse(c, { ok: true });
    } catch (error) {
      logger.error('Delete user error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete user', 500);
    }
  }
);

// ============================================
// USER BAN ROUTE
// ============================================

/**
 * @route POST /api/firestore/users/:id/ban
 * @description Ban user - disables Firebase Auth account
 * @access Admin only
 */
usersFirestoreRoutes.post(
  '/:id/ban',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const currentUid = getCurrentUid(c);

      // Cannot ban self
      if (id === currentUid) {
        return errorResponse(c, 'FORBIDDEN', 'Cannot ban yourself', 403);
      }

      // Check if user exists
      const existing = await usersService.getById(id);
      if (!existing) {
        return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
      }

      // Disable Firebase Auth account
      const auth = await getFirebaseAuth();
      await auth.updateUser(id, { disabled: true });

      // Revoke all refresh tokens
      await auth.revokeRefreshTokens(id);

      logger.info('Banned user', { uid: id, bannedBy: currentUid });

      return successResponse(c, { 
        ok: true, 
        message: 'User banned and all sessions revoked' 
      });
    } catch (error) {
      logger.error('Ban user error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to ban user', 500);
    }
  }
);

/**
 * @route POST /api/firestore/users/:id/unban
 * @description Unban user - re-enables Firebase Auth account
 * @access Admin only
 */
usersFirestoreRoutes.post(
  '/:id/unban',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const id = c.req.param('id');

      // Check if user exists
      const existing = await usersService.getById(id);
      if (!existing) {
        return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
      }

      // Re-enable Firebase Auth account
      const auth = await getFirebaseAuth();
      await auth.updateUser(id, { disabled: false });

      logger.info('Unbanned user', { uid: id });

      return successResponse(c, { ok: true, message: 'User unbanned' });
    } catch (error) {
      logger.error('Unban user error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to unban user', 500);
    }
  }
);

export { usersFirestoreRoutes };
export default usersFirestoreRoutes;
