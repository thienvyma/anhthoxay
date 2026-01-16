/**
 * Firebase Auth Middleware
 * Verifies Firebase ID tokens and extracts user info
 */

import type { Context, Next } from 'hono';
import type { DecodedIdToken } from 'firebase-admin/auth';
import {
  verifyIdToken,
  hasRole as checkRole,
  isContractorVerified,
  mapFirebaseError,
  FirebaseAuthError,
} from '../services/firebase-admin.service';
import type { UserRole } from '@app/shared';

// ============================================
// TYPES
// ============================================

export interface FirebaseAuthContext {
  user: DecodedIdToken;
  uid: string;
  email: string;
  role: UserRole;
  verificationStatus?: string;
}

/**
 * Firebase User type for context
 */
export interface FirebaseUser {
  uid: string;
  email: string;
  name?: string;
  role: UserRole;
  verificationStatus?: string;
}

// Extend Hono context
declare module 'hono' {
  interface ContextVariableMap {
    firebaseUser: DecodedIdToken;
    uid: string;
    email: string;
    role: UserRole;
    verificationStatus?: string;
  }
}

// ============================================
// MIDDLEWARE
// ============================================

interface FirebaseAuthOptions {
  optional?: boolean;
}

/**
 * Firebase Authentication middleware
 * Verifies the Firebase ID token from Authorization header
 * Sets user info in context for downstream handlers
 */
export function firebaseAuth(options: FirebaseAuthOptions = {}) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (options.optional) {
        await next();
        return;
      }
      return c.json(
        {
          success: false,
          error: {
            code: 'AUTH_TOKEN_MISSING',
            message: 'Missing or invalid authorization header',
          },
        },
        401
      );
    }

    const idToken = authHeader.substring(7);

    try {
      const decodedToken = await verifyIdToken(idToken);

      // Set user info in context
      c.set('firebaseUser', decodedToken);
      c.set('uid', decodedToken.uid);
      c.set('email', decodedToken.email || '');
      c.set('role', (decodedToken.role as UserRole) || 'USER');
      c.set('verificationStatus', decodedToken.verificationStatus as string | undefined);

      await next();
    } catch (error) {
      if (options.optional) {
        await next();
        return;
      }
      const authError = mapFirebaseError(error as { code?: string; message?: string });
      return c.json(
        {
          success: false,
          error: {
            code: authError.code,
            message: authError.message,
          },
        },
        authError.statusCode as 401 | 403 | 404
      );
    }
  };
}

/**
 * Require specific role(s) middleware
 * Must be used after firebaseAuth()
 * Checks if user has one of the allowed roles (or higher in hierarchy)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const decodedToken = c.get('firebaseUser') as DecodedIdToken | undefined;

    if (!decodedToken) {
      return c.json(
        {
          success: false,
          error: {
            code: 'AUTH_TOKEN_MISSING',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Check if user has any of the allowed roles
    const hasPermission = allowedRoles.some((role) => checkRole(decodedToken, role));

    if (!hasPermission) {
      return c.json(
        {
          success: false,
          error: {
            code: 'AUTH_FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        403
      );
    }

    await next();
  };
}

/**
 * Require verified contractor middleware
 * Must be used after firebaseAuth()
 * Checks if user is a contractor with VERIFIED status
 */
export function requireVerifiedContractor() {
  return async (c: Context, next: Next) => {
    const decodedToken = c.get('firebaseUser') as DecodedIdToken | undefined;

    if (!decodedToken) {
      return c.json(
        {
          success: false,
          error: {
            code: 'AUTH_TOKEN_MISSING',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    const role = (decodedToken.role as UserRole) || 'USER';

    // Admin and Manager can bypass verification check
    if (role === 'ADMIN' || role === 'MANAGER') {
      await next();
      return;
    }

    // Contractors must be verified
    if (role === 'CONTRACTOR' && !isContractorVerified(decodedToken)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CONTRACTOR_NOT_VERIFIED',
            message: 'Contractor verification required',
          },
        },
        403
      );
    }

    await next();
  };
}

/**
 * Optional Firebase auth middleware
 * Doesn't fail if no token provided
 * Useful for routes that work differently for authenticated users
 */
export function optionalFirebaseAuth() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7);

      try {
        const decodedToken = await verifyIdToken(idToken);

        c.set('firebaseUser', decodedToken);
        c.set('uid', decodedToken.uid);
        c.set('email', decodedToken.email || '');
        c.set('role', (decodedToken.role as UserRole) || 'USER');
        c.set('verificationStatus', decodedToken.verificationStatus as string | undefined);
      } catch {
        // Token invalid, but we don't fail - just don't set user
      }
    }

    await next();
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current user from context
 * Throws if not authenticated
 */
export function getCurrentUser(c: Context): DecodedIdToken {
  const user = c.get('firebaseUser') as DecodedIdToken | undefined;
  if (!user) {
    throw new FirebaseAuthError('AUTH_TOKEN_MISSING', 'User not found in context', 401);
  }
  return user;
}

/**
 * Get Firebase user info from context
 * Returns a simplified user object
 */
export function getFirebaseUser(c: Context): FirebaseUser {
  const decodedToken = getCurrentUser(c);
  return {
    uid: decodedToken.uid,
    email: decodedToken.email || '',
    name: decodedToken.name as string | undefined,
    role: (decodedToken.role as UserRole) || 'USER',
    verificationStatus: decodedToken.verificationStatus as string | undefined,
  };
}

/**
 * Get current user UID from context
 */
export function getCurrentUid(c: Context): string {
  return c.get('uid') as string;
}

/**
 * Get current user role from context
 */
export function getCurrentRole(c: Context): UserRole {
  return c.get('role') as UserRole;
}

/**
 * Check if current user is admin
 */
export function isAdmin(c: Context): boolean {
  return getCurrentRole(c) === 'ADMIN';
}

/**
 * Check if current user is manager or admin
 */
export function isManager(c: Context): boolean {
  const role = getCurrentRole(c);
  return role === 'ADMIN' || role === 'MANAGER';
}

/**
 * Check if current user owns a resource
 */
export function isOwner(c: Context, resourceOwnerId: string): boolean {
  return getCurrentUid(c) === resourceOwnerId;
}

/**
 * Check if current user can access a resource (owner or admin)
 */
export function canAccess(c: Context, resourceOwnerId: string): boolean {
  return isOwner(c, resourceOwnerId) || isAdmin(c);
}
