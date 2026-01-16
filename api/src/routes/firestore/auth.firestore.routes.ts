/**
 * Firebase Auth Routes
 * 
 * Handles authentication using Firebase Auth.
 * Note: Most auth operations (login, register, password reset) are handled
 * client-side with Firebase Auth SDK. These routes handle server-side operations.
 * 
 * @module routes/firestore/auth
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { firebaseAuth, requireRole, getFirebaseUser } from '../../middleware/firebase-auth.middleware';
import { getFirebaseAdmin } from '../../services/firebase-admin.service';
import { UsersFirestoreService } from '../../services/firestore/users.firestore';
import { successResponse, errorResponse } from '../../utils/response';
import type { UserRole } from '../../types/firestore.types';

// ============================================
// ZOD SCHEMAS
// ============================================

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

const SetCustomClaimsSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER']),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
});

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER']).default('USER'),
  phone: z.string().optional(),
});

// ============================================
// AUTH ROUTES
// ============================================

export function createAuthFirestoreRoutes() {
  const app = new Hono();
  const usersService = new UsersFirestoreService();

  // ============================================
  // GET /auth/me - Get current user info
  // ============================================
  app.get('/me', firebaseAuth(), async (c) => {
    try {
      const firebaseUser = getFirebaseUser(c);
      const user = await usersService.getById(firebaseUser.uid);

      if (!user) {
        // User exists in Firebase Auth but not in Firestore
        // Create a basic profile
        const newUser = await usersService.create({
          email: firebaseUser.email,
          name: firebaseUser.name || firebaseUser.email.split('@')[0],
          role: firebaseUser.role || 'USER',
          verificationStatus: 'PENDING',
          rating: 0,
          totalProjects: 0,
        });
        return successResponse(c, newUser);
      }

      return successResponse(c, user);
    } catch (error) {
      console.error('Error getting user:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get user info', 500);
    }
  });

  // ============================================
  // PUT /auth/profile - Update current user profile
  // ============================================
  app.put('/profile', firebaseAuth(), async (c) => {
    try {
      const firebaseUser = getFirebaseUser(c);
      const body = await c.req.json();
      const result = UpdateProfileSchema.safeParse(body);
      
      if (!result.success) {
        return errorResponse(c, 'VALIDATION_ERROR', result.error.issues[0]?.message || 'Validation failed', 400);
      }

      const user = await usersService.update(firebaseUser.uid, result.data);
      return successResponse(c, user);
    } catch (error) {
      console.error('Error updating profile:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update profile', 500);
    }
  });

  // ============================================
  // POST /auth/sync - Sync Firebase Auth user to Firestore
  // Called after Firebase Auth signup to create Firestore profile
  // ============================================
  app.post('/sync', firebaseAuth(), async (c) => {
    try {
      const firebaseUser = getFirebaseUser(c);
      
      // Check if user already exists in Firestore
      let user = await usersService.getById(firebaseUser.uid);
      
      if (!user) {
        // Create user profile in Firestore
        const body = await c.req.json().catch(() => ({}));
        
        user = await usersService.createWithId(firebaseUser.uid, {
          email: firebaseUser.email,
          name: body.name || firebaseUser.name || firebaseUser.email.split('@')[0],
          phone: body.phone,
          role: (body.accountType === 'contractor' ? 'CONTRACTOR' : 
                 body.accountType === 'homeowner' ? 'HOMEOWNER' : 'USER') as UserRole,
          verificationStatus: 'PENDING',
          rating: 0,
          totalProjects: 0,
          companyName: body.companyName,
        });

        // Set custom claims in Firebase Auth
        const admin = await getFirebaseAdmin();
        await admin.auth().setCustomUserClaims(firebaseUser.uid, {
          role: user.role,
          verificationStatus: user.verificationStatus,
        });
      }

      return successResponse(c, user, 201);
    } catch (error) {
      console.error('Error syncing user:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to sync user', 500);
    }
  });

  // ============================================
  // ADMIN ROUTES
  // ============================================

  // POST /auth/admin/create-user - Create user (Admin only)
  app.post('/admin/create-user', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const body = await c.req.json();
      const result = CreateUserSchema.safeParse(body);
      
      if (!result.success) {
        return errorResponse(c, 'VALIDATION_ERROR', result.error.issues[0]?.message || 'Validation failed', 400);
      }

      const validated = result.data;
      const admin = await getFirebaseAdmin();

      // Create user in Firebase Auth
      const authUser = await admin.auth().createUser({
        email: validated.email,
        password: validated.password,
        displayName: validated.name,
      });

      // Set custom claims
      await admin.auth().setCustomUserClaims(authUser.uid, {
        role: validated.role,
        verificationStatus: 'PENDING',
      });

      // Create user profile in Firestore
      const user = await usersService.createWithId(authUser.uid, {
        email: validated.email,
        name: validated.name,
        phone: validated.phone,
        role: validated.role as UserRole,
        verificationStatus: 'PENDING',
        rating: 0,
        totalProjects: 0,
      });

      return successResponse(c, user, 201);
    } catch (error) {
      console.error('Error creating user:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create user', 500);
    }
  });

  // POST /auth/admin/set-claims - Set custom claims (Admin only)
  app.post('/admin/set-claims', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const body = await c.req.json();
      const result = SetCustomClaimsSchema.safeParse(body);
      
      if (!result.success) {
        return errorResponse(c, 'VALIDATION_ERROR', result.error.issues[0]?.message || 'Validation failed', 400);
      }

      const validated = result.data;
      const admin = await getFirebaseAdmin();

      // Update custom claims in Firebase Auth
      await admin.auth().setCustomUserClaims(validated.userId, {
        role: validated.role,
        verificationStatus: validated.verificationStatus || 'PENDING',
      });

      // Update user in Firestore
      await usersService.update(validated.userId, {
        role: validated.role as UserRole,
        ...(validated.verificationStatus && { verificationStatus: validated.verificationStatus }),
      });

      return successResponse(c, { 
        message: 'Custom claims updated. User needs to refresh token.',
        userId: validated.userId,
        role: validated.role,
      });
    } catch (error) {
      console.error('Error setting claims:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to set claims', 500);
    }
  });

  // DELETE /auth/admin/users/:id - Delete user (Admin only)
  app.delete('/admin/users/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const userId = c.req.param('id');
      const admin = await getFirebaseAdmin();

      // Delete from Firebase Auth
      await admin.auth().deleteUser(userId);

      // Delete from Firestore
      await usersService.delete(userId);

      return successResponse(c, { message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete user', 500);
    }
  });

  return app;
}

export const authFirestoreRoutes = createAuthFirestoreRoutes();
