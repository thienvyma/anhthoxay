/**
 * Contractor Routes Module
 *
 * Handles contractor profile management and admin verification.
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-2.2**
 *
 * @route /api/contractor - Contractor profile routes
 * @route /api/admin/contractors - Admin contractor management routes
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';
import { ContractorService, ContractorError } from '../services/contractor.service';
import {
  UpdateContractorProfileSchema,
  ListContractorsQuerySchema,
  VerifyContractorSchema,
  type UpdateContractorProfileInput,
  type ListContractorsQuery,
  type VerifyContractorInput,
} from '../schemas/contractor.schema';

// ============================================
// CONTRACTOR ROUTES FACTORY
// ============================================

/**
 * Create contractor routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with contractor routes
 */
export function createContractorRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const contractorService = new ContractorService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // CONTRACTOR PROFILE ROUTES
  // ============================================

  /**
   * @route GET /api/contractor/profile
   * @description Get current contractor's profile
   * @access CONTRACTOR only
   */
  app.get('/profile', authenticate(), requireRole('CONTRACTOR'), async (c) => {
    try {
      const user = getUser(c);
      const profile = await contractorService.getProfile(user.sub);

      if (!profile) {
        return successResponse(c, {
          profile: null,
          message: 'Chưa có hồ sơ năng lực',
        });
      }

      return successResponse(c, profile);
    } catch (error) {
      console.error('Get contractor profile error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get profile', 500);
    }
  });

  /**
   * @route PUT /api/contractor/profile
   * @description Create or update contractor profile
   * @access CONTRACTOR only
   */
  app.put(
    '/profile',
    authenticate(),
    requireRole('CONTRACTOR'),
    validate(UpdateContractorProfileSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const data = getValidatedBody<UpdateContractorProfileInput>(c);
        const profile = await contractorService.createOrUpdateProfile(user.sub, data);
        return successResponse(c, profile);
      } catch (error) {
        if (error instanceof ContractorError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        console.error('Update contractor profile error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update profile', 500);
      }
    }
  );

  /**
   * @route POST /api/contractor/submit-verification
   * @description Submit profile for verification
   * @access CONTRACTOR only (PENDING or REJECTED status)
   */
  app.post('/submit-verification', authenticate(), requireRole('CONTRACTOR'), async (c) => {
    try {
      const user = getUser(c);
      const result = await contractorService.submitVerification(user.sub);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof ContractorError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Submit verification error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to submit verification', 500);
    }
  });

  return app;
}

// ============================================
// ADMIN CONTRACTOR ROUTES FACTORY
// ============================================

/**
 * Create admin contractor routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with admin contractor routes
 */
export function createAdminContractorRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const contractorService = new ContractorService(prisma);
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // ADMIN CONTRACTOR MANAGEMENT ROUTES
  // ============================================

  /**
   * @route GET /api/admin/contractors
   * @description List contractors with pagination and filtering
   * @access ADMIN only
   * @query status - Filter by verification status (PENDING, VERIFIED, REJECTED)
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 20, max: 100)
   * @query search - Search by name, email, or company name
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(ListContractorsQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<ListContractorsQuery>(c);
        const result = await contractorService.listContractors(query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        console.error('List contractors error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list contractors', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/contractors/:id
   * @description Get contractor detail by ID
   * @access ADMIN only
   */
  app.get('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const contractor = await contractorService.getContractorById(id);

      if (!contractor) {
        return errorResponse(c, 'NOT_FOUND', 'Contractor not found', 404);
      }

      return successResponse(c, contractor);
    } catch (error) {
      console.error('Get contractor error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get contractor', 500);
    }
  });

  /**
   * @route PUT /api/admin/contractors/:id/verify
   * @description Verify or reject contractor
   * @access ADMIN only
   */
  app.put(
    '/:id/verify',
    authenticate(),
    requireRole('ADMIN'),
    validate(VerifyContractorSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const data = getValidatedBody<VerifyContractorInput>(c);
        const result = await contractorService.verifyContractor(id, data.status, data.note);
        return successResponse(c, result);
      } catch (error) {
        if (error instanceof ContractorError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        console.error('Verify contractor error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to verify contractor', 500);
      }
    }
  );

  return app;
}

export default { createContractorRoutes, createAdminContractorRoutes };
