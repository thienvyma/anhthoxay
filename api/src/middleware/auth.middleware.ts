import type { Context, Next } from 'hono';
import { AuthService, AuthError, type Role, type JWTPayload } from '../services/auth.service';
import type { PrismaClient } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface AuthContext {
  user: JWTPayload;
  sessionId?: string;
}

// Role hierarchy: ADMIN > MANAGER > WORKER > USER
const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 4,
  MANAGER: 3,
  WORKER: 2,
  USER: 1,
};

// ============================================
// MIDDLEWARE FACTORY
// ============================================

export function createAuthMiddleware(prisma: PrismaClient) {
  const authService = new AuthService(prisma);

  /**
   * Authenticate middleware - verifies JWT token
   * Returns 401 if token is missing or invalid
   */
  function authenticate() {
    return async (c: Context, next: Next) => {
      const authHeader = c.req.header('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json(
          { error: { code: 'AUTH_TOKEN_INVALID', message: 'Missing or invalid authorization header' } },
          401
        );
      }

      const token = authHeader.substring(7);
      const payload = authService.verifyAccessToken(token);

      if (!payload) {
        return c.json(
          { error: { code: 'AUTH_TOKEN_INVALID', message: 'Invalid or expired token' } },
          401
        );
      }

      // Attach user to context
      c.set('user', payload);
      await next();
    };
  }

  /**
   * Require role middleware - checks if user has required role
   * Must be used after authenticate()
   * Returns 403 if user doesn't have sufficient permissions
   */
  function requireRole(...allowedRoles: Role[]) {
    return async (c: Context, next: Next) => {
      const user = c.get('user') as JWTPayload | undefined;

      if (!user) {
        return c.json(
          { error: { code: 'AUTH_TOKEN_INVALID', message: 'Authentication required' } },
          401
        );
      }

      const userRole = user.role as Role;
      const hasPermission = allowedRoles.some(
        (role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]
      );

      if (!hasPermission) {
        return c.json(
          { error: { code: 'AUTH_FORBIDDEN', message: 'Insufficient permissions' } },
          403
        );
      }

      await next();
    };
  }

  /**
   * Optional auth middleware - doesn't fail if no token
   * Useful for routes that work differently for authenticated users
   */
  function optionalAuth() {
    return async (c: Context, next: Next) => {
      const authHeader = c.req.header('Authorization');

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = authService.verifyAccessToken(token);
        if (payload) {
          c.set('user', payload);
        }
      }

      await next();
    };
  }

  return {
    authenticate,
    requireRole,
    optionalAuth,
    authService,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get user from context (use after authenticate middleware)
 */
export function getUser(c: Context): JWTPayload {
  const user = c.get('user') as JWTPayload | undefined;
  if (!user) {
    throw new AuthError('AUTH_TOKEN_INVALID', 'User not found in context');
  }
  return user;
}

/**
 * Check if user has specific role or higher
 */
export function hasRole(user: JWTPayload, role: Role): boolean {
  return ROLE_HIERARCHY[user.role as Role] >= ROLE_HIERARCHY[role];
}
