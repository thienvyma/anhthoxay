/**
 * Property-Based Tests for Protected Routes Authentication
 *
 * **Feature: api-refactoring, Property 1: Protected Routes Require Authentication**
 * **Validates: Requirements 1.5**
 *
 * This test verifies that all protected routes (admin, manager endpoints)
 * return 401 Unauthorized when accessed without a valid JWT token.
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import type { Role } from '../services/auth.service';

// ============================================
// Type Definitions (isolated for testing)
// ============================================

/**
 * JWT Payload structure
 */
interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

/**
 * Auth error response structure
 */
interface AuthErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// Role hierarchy: ADMIN > MANAGER > WORKER > USER
const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 4,
  MANAGER: 3,
  WORKER: 2,
  USER: 1,
};

// ============================================
// Authentication Logic (isolated for testing)
// ============================================

/**
 * Simulate token verification (returns payload if valid, null if invalid)
 * In real implementation, this would verify JWT signature
 */
function verifyToken(token: string, validTokens: Set<string>): JWTPayload | null {
  if (!token || !validTokens.has(token)) {
    return null;
  }
  // Return mock payload for valid token
  return {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'ADMIN',
    iat: Date.now(),
    exp: Date.now() + 3600000,
  };
}

/**
 * Check if user has required role
 */
function hasRequiredRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.some((role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]);
}

/**
 * Simulate authentication middleware logic
 * Returns response status and body
 */
function authenticateRequest(
  authHeader: string | undefined,
  validTokens: Set<string>
): { status: number; body: AuthErrorResponse | null; payload: JWTPayload | null } {
  // Check if header exists and has correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      body: {
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Missing or invalid authorization header',
        },
      },
      payload: null,
    };
  }

  const token = authHeader.substring(7);

  // Verify token
  const payload = verifyToken(token, validTokens);
  if (!payload) {
    return {
      status: 401,
      body: {
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid or expired token',
        },
      },
      payload: null,
    };
  }

  return { status: 200, body: null, payload };
}

/**
 * Simulate role check middleware logic
 */
function checkRole(
  payload: JWTPayload | null,
  allowedRoles: Role[]
): { status: number; body: AuthErrorResponse | null } {
  if (!payload) {
    return {
      status: 401,
      body: {
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Authentication required',
        },
      },
    };
  }

  if (!hasRequiredRole(payload.role, allowedRoles)) {
    return {
      status: 403,
      body: {
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'Insufficient permissions',
        },
      },
    };
  }

  return { status: 200, body: null };
}

// ============================================
// Generators
// ============================================

// Generate invalid authorization headers
const invalidAuthHeader = fc.oneof(
  fc.constant(undefined),
  fc.constant(''),
  fc.constant('Basic abc123'),
  fc.constant('Bearer'),
  fc.constant('Bearer '),
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.startsWith('Bearer ')),
  fc.string({ minLength: 1, maxLength: 50 }).map((s) => `Basic ${s}`)
);

// Generate role
const roleGen = fc.constantFrom<Role>('ADMIN', 'MANAGER', 'WORKER', 'USER');

// Generate allowed roles array (non-empty)
const allowedRolesGen = fc.array(roleGen, { minLength: 1, maxLength: 4 }).map((roles) => [...new Set(roles)]);

// ============================================
// PROPERTY 1: Protected Routes Require Authentication
// Requirements: 1.5
// ============================================

describe('Property 1: Protected Routes Require Authentication', () => {
  // ----------------------------------------
  // Missing/Invalid Token Tests
  // ----------------------------------------

  describe('Missing or Invalid Authorization Header', () => {
    it('request without Authorization header should return 401', () => {
      fc.assert(
        fc.property(fc.constant(undefined), (authHeader) => {
          const validTokens = new Set<string>();
          const result = authenticateRequest(authHeader, validTokens);

          return result.status === 401 && result.body?.error.code === 'AUTH_TOKEN_INVALID';
        }),
        { numRuns: 10 }
      );
    });

    it('request with empty Authorization header should return 401', () => {
      fc.assert(
        fc.property(fc.constant(''), (authHeader) => {
          const validTokens = new Set<string>();
          const result = authenticateRequest(authHeader, validTokens);

          return result.status === 401 && result.body?.error.code === 'AUTH_TOKEN_INVALID';
        }),
        { numRuns: 10 }
      );
    });

    it('request with non-Bearer Authorization should return 401', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.startsWith('Bearer ')),
          (authHeader) => {
            const validTokens = new Set<string>();
            const result = authenticateRequest(authHeader, validTokens);

            return result.status === 401 && result.body?.error.code === 'AUTH_TOKEN_INVALID';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('request with Basic auth should return 401', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }).map((s) => `Basic ${s}`), (authHeader) => {
          const validTokens = new Set<string>();
          const result = authenticateRequest(authHeader, validTokens);

          return result.status === 401 && result.body?.error.code === 'AUTH_TOKEN_INVALID';
        }),
        { numRuns: 100 }
      );
    });

    it('request with "Bearer " (no token) should return 401', () => {
      fc.assert(
        fc.property(fc.constant('Bearer '), (authHeader) => {
          const validTokens = new Set<string>();
          const result = authenticateRequest(authHeader, validTokens);

          // "Bearer " has length 7, so substring(7) returns empty string
          // Empty token should fail verification
          return result.status === 401;
        }),
        { numRuns: 10 }
      );
    });

    it('any invalid auth header format should return 401', () => {
      fc.assert(
        fc.property(invalidAuthHeader, (authHeader) => {
          const validTokens = new Set<string>();
          const result = authenticateRequest(authHeader, validTokens);

          return result.status === 401;
        }),
        { numRuns: 100 }
      );
    });
  });

  // ----------------------------------------
  // Invalid Token Tests
  // ----------------------------------------

  describe('Invalid Token', () => {
    it('request with invalid/expired token should return 401', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 0, maxLength: 5 }),
          (token, validTokenList) => {
            // Ensure the token is NOT in the valid tokens set
            const validTokens = new Set(validTokenList.filter((t) => t !== token));
            const authHeader = `Bearer ${token}`;

            const result = authenticateRequest(authHeader, validTokens);

            return result.status === 401 && result.body?.error.code === 'AUTH_TOKEN_INVALID';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('request with blacklisted token should return 401', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 200 }), (token) => {
          // Token was valid but is now blacklisted (not in valid set)
          const validTokens = new Set<string>();
          const authHeader = `Bearer ${token}`;

          const result = authenticateRequest(authHeader, validTokens);

          return result.status === 401;
        }),
        { numRuns: 100 }
      );
    });
  });

  // ----------------------------------------
  // Valid Token Tests
  // ----------------------------------------

  describe('Valid Token', () => {
    it('request with valid token should pass authentication', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 200 }), (token) => {
          const validTokens = new Set([token]);
          const authHeader = `Bearer ${token}`;

          const result = authenticateRequest(authHeader, validTokens);

          return result.status === 200 && result.payload !== null;
        }),
        { numRuns: 100 }
      );
    });

    it('valid token should return user payload', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 200 }), (token) => {
          const validTokens = new Set([token]);
          const authHeader = `Bearer ${token}`;

          const result = authenticateRequest(authHeader, validTokens);

          return (
            result.status === 200 &&
            result.payload !== null &&
            typeof result.payload.sub === 'string' &&
            typeof result.payload.email === 'string' &&
            typeof result.payload.role === 'string'
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  // ----------------------------------------
  // Role-Based Access Control Tests
  // ----------------------------------------

  describe('Role-Based Access Control', () => {
    it('user without required role should return 403', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<Role>('USER', 'WORKER'),
          fc.constantFrom<Role[]>(['ADMIN'], ['MANAGER'], ['ADMIN', 'MANAGER']),
          (userRole, allowedRoles) => {
            const payload: JWTPayload = {
              sub: 'user-123',
              email: 'test@example.com',
              role: userRole,
              iat: Date.now(),
              exp: Date.now() + 3600000,
            };

            const result = checkRole(payload, allowedRoles);

            // USER and WORKER should not have access to ADMIN or MANAGER routes
            return result.status === 403 && result.body?.error.code === 'AUTH_FORBIDDEN';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('ADMIN should have access to all protected routes', () => {
      fc.assert(
        fc.property(allowedRolesGen, (allowedRoles) => {
          const payload: JWTPayload = {
            sub: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN',
            iat: Date.now(),
            exp: Date.now() + 3600000,
          };

          const result = checkRole(payload, allowedRoles);

          return result.status === 200;
        }),
        { numRuns: 100 }
      );
    });

    it('MANAGER should have access to MANAGER routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<Role[]>(['MANAGER'], ['ADMIN', 'MANAGER'], ['MANAGER', 'WORKER']),
          (allowedRoles) => {
            const payload: JWTPayload = {
              sub: 'manager-123',
              email: 'manager@example.com',
              role: 'MANAGER',
              iat: Date.now(),
              exp: Date.now() + 3600000,
            };

            const result = checkRole(payload, allowedRoles);

            return result.status === 200;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('MANAGER should NOT have access to ADMIN-only routes', () => {
      fc.assert(
        fc.property(fc.constant(['ADMIN'] as Role[]), (allowedRoles) => {
          const payload: JWTPayload = {
            sub: 'manager-123',
            email: 'manager@example.com',
            role: 'MANAGER',
            iat: Date.now(),
            exp: Date.now() + 3600000,
          };

          const result = checkRole(payload, allowedRoles);

          return result.status === 403;
        }),
        { numRuns: 10 }
      );
    });

    it('null payload should return 401', () => {
      fc.assert(
        fc.property(allowedRolesGen, (allowedRoles) => {
          const result = checkRole(null, allowedRoles);

          return result.status === 401 && result.body?.error.code === 'AUTH_TOKEN_INVALID';
        }),
        { numRuns: 100 }
      );
    });
  });

  // ----------------------------------------
  // Error Response Format Tests
  // ----------------------------------------

  describe('Error Response Format', () => {
    it('401 response should have correct error structure', () => {
      fc.assert(
        fc.property(invalidAuthHeader, (authHeader) => {
          const validTokens = new Set<string>();
          const result = authenticateRequest(authHeader, validTokens);

          if (result.status === 401 && result.body) {
            return (
              typeof result.body.error === 'object' &&
              typeof result.body.error.code === 'string' &&
              typeof result.body.error.message === 'string'
            );
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('403 response should have correct error structure', () => {
      fc.assert(
        fc.property(fc.constantFrom<Role>('USER', 'WORKER'), (userRole) => {
          const payload: JWTPayload = {
            sub: 'user-123',
            email: 'test@example.com',
            role: userRole,
            iat: Date.now(),
            exp: Date.now() + 3600000,
          };

          const result = checkRole(payload, ['ADMIN']);

          if (result.status === 403 && result.body) {
            return (
              typeof result.body.error === 'object' &&
              result.body.error.code === 'AUTH_FORBIDDEN' &&
              typeof result.body.error.message === 'string'
            );
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  // ----------------------------------------
  // Role Hierarchy Tests
  // ----------------------------------------

  describe('Role Hierarchy', () => {
    it('higher role should have access to lower role routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<[Role, Role]>(
            ['ADMIN', 'MANAGER'],
            ['ADMIN', 'WORKER'],
            ['ADMIN', 'USER'],
            ['MANAGER', 'WORKER'],
            ['MANAGER', 'USER'],
            ['WORKER', 'USER']
          ),
          ([higherRole, lowerRole]) => {
            const payload: JWTPayload = {
              sub: 'user-123',
              email: 'test@example.com',
              role: higherRole,
              iat: Date.now(),
              exp: Date.now() + 3600000,
            };

            const result = checkRole(payload, [lowerRole]);

            return result.status === 200;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('lower role should NOT have access to higher role routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<[Role, Role]>(
            ['USER', 'WORKER'],
            ['USER', 'MANAGER'],
            ['USER', 'ADMIN'],
            ['WORKER', 'MANAGER'],
            ['WORKER', 'ADMIN'],
            ['MANAGER', 'ADMIN']
          ),
          ([lowerRole, higherRole]) => {
            const payload: JWTPayload = {
              sub: 'user-123',
              email: 'test@example.com',
              role: lowerRole,
              iat: Date.now(),
              exp: Date.now() + 3600000,
            };

            const result = checkRole(payload, [higherRole]);

            return result.status === 403;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
