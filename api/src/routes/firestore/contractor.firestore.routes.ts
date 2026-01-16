/**
 * Contractor Firestore Routes
 * 
 * Handles contractor profile management and verification using Firestore.
 * 
 * @route /api/firestore/contractor, /api/firestore/admin/contractors
 * @requirements 3.1
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole, getCurrentUid } from '../../middleware/firebase-auth.middleware';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';
import {
  getUsersFirestoreService,
  UsersFirestoreError,
} from '../../services/firestore/users.firestore';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const UpdateContractorProfileSchema = z.object({
  description: z.string().min(10).max(2000).optional(),
  experience: z.number().int().min(0).max(100).optional(),
  specialties: z.array(z.string().min(1).max(100)).max(20).optional(),
  serviceAreas: z.array(z.string().min(1).max(100)).max(20).optional(),
  portfolioImages: z.array(z.string().url()).max(20).optional(),
  certificates: z.array(z.object({
    name: z.string().min(1).max(200),
    imageUrl: z.string().url(),
    issuedDate: z.string().optional(),
  })).max(10).optional(),
  idCardFront: z.string().url().optional(),
  idCardBack: z.string().url().optional(),
  businessLicenseImage: z.string().url().optional(),
});

const VerifyContractorSchema = z.object({
  approved: z.boolean(),
  note: z.string().max(1000).optional(),
});

type UpdateContractorProfileInput = z.infer<typeof UpdateContractorProfileSchema>;
type VerifyContractorInput = z.infer<typeof VerifyContractorSchema>;

// ============================================
// CONTRACTOR ROUTES (for contractors)
// ============================================

const contractorFirestoreRoutes = new Hono();
const usersService = getUsersFirestoreService();

/**
 * @route GET /api/firestore/contractor/profile
 * @description Get current contractor's profile
 * @access Contractor only
 */
contractorFirestoreRoutes.get(
  '/profile',
  firebaseAuth(),
  requireRole('CONTRACTOR'),
  async (c) => {
    try {
      const uid = getCurrentUid(c);
      
      const result = await usersService.getContractorWithProfile(uid);
      if (!result) {
        return errorResponse(c, 'NOT_FOUND', 'Contractor not found', 404);
      }

      return successResponse(c, {
        user: result.user,
        profile: result.profile,
      });
    } catch (error) {
      logger.error('Get contractor profile error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get profile', 500);
    }
  }
);

/**
 * @route PUT /api/firestore/contractor/profile
 * @description Update current contractor's profile
 * @access Contractor only
 */
contractorFirestoreRoutes.put(
  '/profile',
  firebaseAuth(),
  requireRole('CONTRACTOR'),
  validate(UpdateContractorProfileSchema),
  async (c) => {
    try {
      const uid = getCurrentUid(c);
      const data = getValidatedBody<UpdateContractorProfileInput>(c);

      // Check if profile exists, create if not
      let profile = await usersService.getContractorProfile(uid);
      
      if (!profile) {
        profile = await usersService.createContractorProfile(uid, data);
      } else {
        profile = await usersService.updateContractorProfile(uid, data);
      }

      return successResponse(c, profile);
    } catch (error) {
      if (error instanceof UsersFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode as 400 | 404 | 409);
      }
      logger.error('Update contractor profile error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update profile', 500);
    }
  }
);

/**
 * @route POST /api/firestore/contractor/submit-verification
 * @description Submit contractor profile for verification
 * @access Contractor only
 */
contractorFirestoreRoutes.post(
  '/submit-verification',
  firebaseAuth(),
  requireRole('CONTRACTOR'),
  async (c) => {
    try {
      const uid = getCurrentUid(c);

      // Check if profile exists
      const profile = await usersService.getContractorProfile(uid);
      if (!profile) {
        return errorResponse(c, 'PROFILE_REQUIRED', 'Please complete your profile first', 400);
      }

      // Validate required fields for verification
      if (!profile.idCardFront || !profile.idCardBack) {
        return errorResponse(c, 'MISSING_DOCUMENTS', 'ID card images are required', 400);
      }

      const user = await usersService.submitForVerification(uid);

      logger.info('Contractor submitted for verification', { uid });

      return successResponse(c, {
        message: 'Profile submitted for verification',
        verificationStatus: user.verificationStatus,
      });
    } catch (error) {
      if (error instanceof UsersFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode as 400 | 404 | 409);
      }
      logger.error('Submit verification error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to submit for verification', 500);
    }
  }
);

// ============================================
// ADMIN CONTRACTOR ROUTES
// ============================================

const adminContractorFirestoreRoutes = new Hono();

/**
 * @route GET /api/firestore/admin/contractors
 * @description List all contractors with filtering
 * @access Admin only
 */
adminContractorFirestoreRoutes.get(
  '/',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const status = c.req.query('status') as 'PENDING' | 'VERIFIED' | 'REJECTED' | undefined;
      const limit = parseInt(c.req.query('limit') || '20');
      const page = parseInt(c.req.query('page') || '1');

      let contractors;
      if (status === 'PENDING') {
        contractors = await usersService.listPendingContractors({ limit });
      } else if (status === 'VERIFIED') {
        contractors = await usersService.listVerifiedContractors({ limit });
      } else {
        contractors = await usersService.listByRole('CONTRACTOR', { limit });
      }

      // Filter by status if provided and not already filtered
      if (status && status !== 'PENDING' && status !== 'VERIFIED') {
        contractors = contractors.filter(c => c.verificationStatus === status);
      }

      return paginatedResponse(c, contractors, {
        total: contractors.length,
        page,
        limit,
      });
    } catch (error) {
      logger.error('List contractors error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list contractors', 500);
    }
  }
);

/**
 * @route GET /api/firestore/admin/contractors/:id
 * @description Get contractor details with profile
 * @access Admin only
 */
adminContractorFirestoreRoutes.get(
  '/:id',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const id = c.req.param('id');
      
      const result = await usersService.getContractorWithProfile(id);
      if (!result) {
        return errorResponse(c, 'NOT_FOUND', 'Contractor not found', 404);
      }

      return successResponse(c, {
        user: result.user,
        profile: result.profile,
      });
    } catch (error) {
      logger.error('Get contractor error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get contractor', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/contractors/:id/verify
 * @description Verify or reject contractor
 * @access Admin only
 */
adminContractorFirestoreRoutes.post(
  '/:id/verify',
  firebaseAuth(),
  requireRole('ADMIN'),
  validate(VerifyContractorSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const adminUid = getCurrentUid(c);
      const data = getValidatedBody<VerifyContractorInput>(c);

      const user = await usersService.verifyContractor(
        id,
        adminUid,
        data.approved,
        data.note
      );

      logger.info('Contractor verification processed', {
        contractorId: id,
        adminId: adminUid,
        approved: data.approved,
      });

      return successResponse(c, {
        message: data.approved ? 'Contractor verified' : 'Contractor rejected',
        user,
      });
    } catch (error) {
      if (error instanceof UsersFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode as 400 | 404 | 409);
      }
      logger.error('Verify contractor error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to verify contractor', 500);
    }
  }
);

export { contractorFirestoreRoutes, adminContractorFirestoreRoutes };
export default contractorFirestoreRoutes;
