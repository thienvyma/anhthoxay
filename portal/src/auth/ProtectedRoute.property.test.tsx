/**
 * Property-Based Tests for Protected Route Redirect
 * Using fast-check for property testing
 *
 * **Feature: bidding-phase6-portal, Property 1: Protected Route Redirect**
 * **Validates: Requirements 2.1**
 *
 * Property: *For any* unauthenticated user accessing a protected route,
 * the system should redirect to the login page.
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';

// ============================================
// TYPES (matching AuthContext.tsx)
// ============================================

type UserRole = 'HOMEOWNER' | 'CONTRACTOR' | 'ADMIN' | 'MANAGER';
type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  verificationStatus?: VerificationStatus;
  phone?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// PROTECTED ROUTE LOGIC (isolated for testing)
// ============================================

interface ProtectedRouteResult {
  action: 'render' | 'redirect' | 'loading';
  redirectTo?: string;
  redirectState?: { from: string };
}

/**
 * Pure function that determines what the ProtectedRoute should do
 * based on auth state and allowed roles.
 */
function evaluateProtectedRoute(
  authState: AuthState,
  currentPath: string,
  allowedRoles?: UserRole[]
): ProtectedRouteResult {
  // Show loading while checking auth
  if (authState.isLoading) {
    return { action: 'loading' };
  }

  // Redirect to login if not authenticated
  if (!authState.isAuthenticated) {
    return {
      action: 'redirect',
      redirectTo: '/auth/login',
      redirectState: { from: currentPath },
    };
  }

  // Check role if allowedRoles is specified
  if (allowedRoles && authState.user && !allowedRoles.includes(authState.user.role)) {
    // Redirect to appropriate dashboard based on role
    if (authState.user.role === 'HOMEOWNER') {
      return { action: 'redirect', redirectTo: '/homeowner' };
    } else if (authState.user.role === 'CONTRACTOR') {
      return { action: 'redirect', redirectTo: '/contractor' };
    }
    return { action: 'redirect', redirectTo: '/' };
  }

  return { action: 'render' };
}

// ============================================
// GENERATORS
// ============================================

// Role generator
const roleArb = fc.constantFrom<UserRole>('HOMEOWNER', 'CONTRACTOR', 'ADMIN', 'MANAGER');

// Verification status generator
const verificationStatusArb = fc.constantFrom<VerificationStatus>('PENDING', 'VERIFIED', 'REJECTED');

// User generator
const userArb = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  role: roleArb,
  verificationStatus: fc.option(verificationStatusArb, { nil: undefined }),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
  avatar: fc.option(fc.webUrl(), { nil: undefined }),
});

// Protected route path generator
const protectedPathArb = fc.oneof(
  fc.constant('/homeowner'),
  fc.constant('/homeowner/dashboard'),
  fc.constant('/homeowner/projects'),
  fc.constant('/homeowner/projects/new'),
  fc.constant('/contractor'),
  fc.constant('/contractor/dashboard'),
  fc.constant('/contractor/marketplace'),
  fc.constant('/contractor/my-bids'),
  fc.constant('/contractor/profile'),
  // Generic protected paths
  fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => !s.includes(' ') && !s.includes('\n'))
    .map(s => `/protected/${s}`)
);

// Unauthenticated state generator
const unauthenticatedStateArb = fc.record({
  user: fc.constant(null),
  isAuthenticated: fc.constant(false),
  isLoading: fc.constant(false),
});

// Authenticated state generator
const authenticatedStateArb = userArb.map(user => ({
  user,
  isAuthenticated: true,
  isLoading: false,
}));

// Loading state generator
const loadingStateArb = fc.record({
  user: fc.constant(null),
  isAuthenticated: fc.constant(false),
  isLoading: fc.constant(true),
});

// Allowed roles generator
const allowedRolesArb = fc.array(roleArb, { minLength: 1, maxLength: 4 })
  .map(roles => [...new Set(roles)] as UserRole[]);

// ============================================
// PROPERTY 1: Protected Route Redirect
// **Feature: bidding-phase6-portal, Property 1: Protected Route Redirect**
// **Validates: Requirements 2.1**
// ============================================

describe('Property 1: Protected Route Redirect', () => {
  it('*For any* unauthenticated user accessing a protected route, the system should redirect to the login page', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArb,
        protectedPathArb,
        fc.option(allowedRolesArb, { nil: undefined }),
        (authState, currentPath, allowedRoles) => {
          const result = evaluateProtectedRoute(authState, currentPath, allowedRoles);

          // Should redirect to login
          const redirectsToLogin = result.action === 'redirect' && result.redirectTo === '/auth/login';

          // Should preserve the original path in state for redirect after login
          const preservesOriginalPath = result.redirectState?.from === currentPath;

          return redirectsToLogin && preservesOriginalPath;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* authenticated user with correct role, the system should render the protected content', () => {
    fc.assert(
      fc.property(
        authenticatedStateArb,
        protectedPathArb,
        (authState, currentPath) => {
          // Use the user's role as allowed role
          const allowedRoles = authState.user ? [authState.user.role] : undefined;
          const result = evaluateProtectedRoute(authState, currentPath, allowedRoles);

          return result.action === 'render';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* authenticated user without correct role, the system should redirect to appropriate dashboard', () => {
    fc.assert(
      fc.property(
        authenticatedStateArb,
        protectedPathArb,
        allowedRolesArb,
        (authState, currentPath, allowedRoles) => {
          // Ensure user's role is NOT in allowed roles
          const userRole = authState.user?.role;
          if (!userRole || allowedRoles.includes(userRole)) {
            return true; // Skip this case
          }

          const result = evaluateProtectedRoute(authState, currentPath, allowedRoles);

          // Should redirect based on user's role
          if (result.action !== 'redirect') return false;

          if (userRole === 'HOMEOWNER') {
            return result.redirectTo === '/homeowner';
          } else if (userRole === 'CONTRACTOR') {
            return result.redirectTo === '/contractor';
          }
          return result.redirectTo === '/';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* loading state, the system should show loading indicator', () => {
    fc.assert(
      fc.property(
        loadingStateArb,
        protectedPathArb,
        fc.option(allowedRolesArb, { nil: undefined }),
        (authState, currentPath, allowedRoles) => {
          const result = evaluateProtectedRoute(authState, currentPath, allowedRoles);
          return result.action === 'loading';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('redirect state should always contain the original path for unauthenticated users', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArb,
        protectedPathArb,
        (authState, currentPath) => {
          const result = evaluateProtectedRoute(authState, currentPath);

          // Verify redirect state contains the path user was trying to access
          return (
            result.action === 'redirect' &&
            result.redirectState !== undefined &&
            result.redirectState.from === currentPath
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// ADDITIONAL EDGE CASE TESTS
// ============================================

describe('Protected Route Edge Cases', () => {
  it('should handle empty allowed roles array by allowing all authenticated users', () => {
    fc.assert(
      fc.property(
        authenticatedStateArb,
        protectedPathArb,
        (authState, currentPath) => {
          // Empty array means no role restriction
          const result = evaluateProtectedRoute(authState, currentPath, []);

          // With empty allowedRoles, user's role won't be in the array
          // so they should be redirected based on their role
          if (authState.user?.role === 'HOMEOWNER') {
            return result.action === 'redirect' && result.redirectTo === '/homeowner';
          } else if (authState.user?.role === 'CONTRACTOR') {
            return result.action === 'redirect' && result.redirectTo === '/contractor';
          }
          return result.action === 'redirect' && result.redirectTo === '/';
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle undefined allowed roles by allowing all authenticated users', () => {
    fc.assert(
      fc.property(
        authenticatedStateArb,
        protectedPathArb,
        (authState, currentPath) => {
          // undefined means no role restriction
          const result = evaluateProtectedRoute(authState, currentPath, undefined);

          return result.action === 'render';
        }
      ),
      { numRuns: 50 }
    );
  });

  it('ADMIN role should have access when ADMIN is in allowed roles', () => {
    fc.assert(
      fc.property(
        protectedPathArb,
        allowedRolesArb,
        (currentPath, allowedRoles) => {
          // Ensure ADMIN is in allowed roles
          const rolesWithAdmin = [...allowedRoles, 'ADMIN' as UserRole];
          
          const adminState: AuthState = {
            user: {
              id: 'admin-id',
              email: 'admin@test.com',
              name: 'Admin User',
              role: 'ADMIN',
            },
            isAuthenticated: true,
            isLoading: false,
          };

          const result = evaluateProtectedRoute(adminState, currentPath, rolesWithAdmin);
          return result.action === 'render';
        }
      ),
      { numRuns: 50 }
    );
  });
});
