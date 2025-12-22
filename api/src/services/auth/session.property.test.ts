/**
 * Property-Based Tests for Auth System - Session Operations
 * Using fast-check for property testing
 *
 * These tests verify session-related properties defined in the design document.
 * **Feature: auth-system**
 */

import * as fc from 'fast-check';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import {
  // Constants
  BCRYPT_COST,
  MAX_LOGIN_ATTEMPTS,
  // Generators
  userArb,
  roleArb,
  ipAddressArb,
  // Helper functions
  generateAccessToken,
  generateRefreshToken,
  hasRole,
  checkRoleAccess,
  authenticateRequest,
  // Mock stores
  MockRateLimiter,
  MockSessionManager,
} from './test-utils';

// ============================================
// PROPERTY 7: Logout invalidates session
// **Feature: auth-system, Property 7: Logout invalidates session**
// **Validates: Requirements 4.1, 4.2**
// ============================================

describe('Property 7: Logout invalidates session', () => {
  class MockLogoutSessionStore {
    private sessions = new Map<string, { userId: string; tokenHash: string }>();

    async createSession(userId: string, refreshToken: string): Promise<string> {
      const sessionId = randomBytes(16).toString('hex');
      const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_COST);
      this.sessions.set(sessionId, { userId, tokenHash });
      return sessionId;
    }

    deleteSession(sessionId: string): boolean {
      return this.sessions.delete(sessionId);
    }

    hasSession(sessionId: string): boolean {
      return this.sessions.has(sessionId);
    }

    async validateRefreshToken(refreshToken: string): Promise<boolean> {
      for (const [, session] of this.sessions) {
        const isValid = await bcrypt.compare(refreshToken, session.tokenHash);
        if (isValid) return true;
      }
      return false;
    }
  }

  it('*For any* successful logout, the session SHALL be deleted from database', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const store = new MockLogoutSessionStore();
        const refreshToken = generateRefreshToken();
        
        // Create session
        const sessionId = await store.createSession(user.id, refreshToken);
        
        // Verify session exists
        if (!store.hasSession(sessionId)) return false;
        
        // Logout (delete session)
        store.deleteSession(sessionId);
        
        // Session should no longer exist
        return !store.hasSession(sessionId);
      }),
      { numRuns: 30 }
    );
  });

  it('subsequent requests with that sessions tokens SHALL fail', async () => {
    await fc.assert(
      fc.asyncProperty(userArb, async (user) => {
        const store = new MockLogoutSessionStore();
        const refreshToken = generateRefreshToken();
        
        // Create session
        const sessionId = await store.createSession(user.id, refreshToken);
        
        // Verify token works before logout
        const beforeLogout = await store.validateRefreshToken(refreshToken);
        if (!beforeLogout) return false;
        
        // Logout
        store.deleteSession(sessionId);
        
        // Token should no longer work
        const afterLogout = await store.validateRefreshToken(refreshToken);
        
        return !afterLogout;
      }),
      { numRuns: 20 }
    );
  });
});

// ============================================
// PROPERTY 8: Protected route enforcement
// **Feature: auth-system, Property 8: Protected route enforcement**
// **Validates: Requirements 5.1, 5.2**
// ============================================

describe('Property 8: Protected route enforcement', () => {
  it('*For any* protected route, requests without valid token SHALL return 401', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('Basic abc123'),
          fc.constant('Bearer '),
          fc.constant('Bearer invalid-token'),
          fc.string().map(s => `Bearer ${s}`)
        ),
        (authHeader) => {
          // Skip if it happens to be a valid token format
          if (authHeader?.startsWith('Bearer ey')) {
            return true; // Skip this case
          }
          
          const result = authenticateRequest(authHeader);
          return !result.success && result.status === 401;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* protected route, requests with valid token SHALL succeed', () => {
    fc.assert(
      fc.property(userArb, (user) => {
        const token = generateAccessToken(user);
        const authHeader = `Bearer ${token}`;
        
        const result = authenticateRequest(authHeader);
        
        return result.success && result.user.sub === user.id;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 9: Role-based access
// **Feature: auth-system, Property 9: Role-based access**
// **Validates: Requirements 5.4, 5.5, 6.1, 6.2, 6.3**
// ============================================

describe('Property 9: Role-based access', () => {
  it('*For any* role-restricted endpoint, users with insufficient role SHALL receive 403', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('USER', 'WORKER'),
        fc.constantFrom('ADMIN'),
        (userRole, requiredRole) => {
          // USER and WORKER should not have ADMIN access
          const result = checkRoleAccess(userRole, [requiredRole]);
          return !result.allowed && result.status === 403;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('*For any* role-restricted endpoint, users with sufficient role SHALL succeed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ADMIN', 'MANAGER'),
        fc.constantFrom('MANAGER', 'WORKER', 'USER'),
        (userRole, requiredRole) => {
          // ADMIN and MANAGER should have access to MANAGER and below
          const result = checkRoleAccess(userRole, [requiredRole]);
          return result.allowed;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('ADMIN SHALL have access to all endpoints', () => {
    fc.assert(
      fc.property(roleArb, (requiredRole) => {
        const result = checkRoleAccess('ADMIN', [requiredRole]);
        return result.allowed;
      }),
      { numRuns: 20 }
    );
  });

  it('role hierarchy: ADMIN > MANAGER > WORKER > USER', () => {
    // Test specific hierarchy relationships
    expect(hasRole('ADMIN', 'MANAGER')).toBe(true);
    expect(hasRole('ADMIN', 'WORKER')).toBe(true);
    expect(hasRole('ADMIN', 'USER')).toBe(true);
    expect(hasRole('MANAGER', 'WORKER')).toBe(true);
    expect(hasRole('MANAGER', 'USER')).toBe(true);
    expect(hasRole('WORKER', 'USER')).toBe(true);
    
    // Lower roles should not have higher access
    expect(hasRole('USER', 'WORKER')).toBe(false);
    expect(hasRole('USER', 'MANAGER')).toBe(false);
    expect(hasRole('USER', 'ADMIN')).toBe(false);
    expect(hasRole('WORKER', 'MANAGER')).toBe(false);
    expect(hasRole('WORKER', 'ADMIN')).toBe(false);
    expect(hasRole('MANAGER', 'ADMIN')).toBe(false);
  });
});

// ============================================
// PROPERTY 11: Rate limiting
// **Feature: auth-system, Property 11: Rate limiting**
// **Validates: Requirements 9.1, 9.2**
// ============================================

describe('Property 11: Rate limiting', () => {
  it('*For any* IP address with more than 5 failed login attempts within 15 minutes, subsequent attempts SHALL return 429', () => {
    fc.assert(
      fc.property(ipAddressArb, (ip) => {
        const limiter = new MockRateLimiter();
        const key = `login:${ip}`;

        // Make 5 attempts (should all be allowed)
        for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
          const result = limiter.checkLimit(key);
          if (!result.allowed) return false;
        }

        // 6th attempt should be blocked
        const blocked = limiter.checkLimit(key);
        return !blocked.allowed && blocked.status === 429;
      }),
      { numRuns: 100 }
    );
  });

  it('first 5 attempts SHALL be allowed', () => {
    fc.assert(
      fc.property(ipAddressArb, (ip) => {
        const limiter = new MockRateLimiter();
        const key = `login:${ip}`;

        for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
          const result = limiter.checkLimit(key);
          if (!result.allowed) return false;
          if (result.remaining !== MAX_LOGIN_ATTEMPTS - i - 1) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 12: Session management
// **Feature: auth-system, Property 12: Session management**
// **Validates: Requirements 10.2, 10.3**
// ============================================

describe('Property 12: Session management', () => {
  it('*For any* user with multiple sessions, revoking all sessions SHALL invalidate all except current session', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 2, max: 10 }),
        (userId, sessionCount) => {
          const manager = new MockSessionManager();
          const sessionIds: string[] = [];

          // Create multiple sessions
          for (let i = 0; i < sessionCount; i++) {
            sessionIds.push(manager.createSession(userId));
          }

          // Current session is the last one
          const currentSessionId = sessionIds[sessionIds.length - 1];

          // Revoke all except current
          const revokedCount = manager.revokeAllSessionsExcept(userId, currentSessionId);

          // Should have revoked all but one
          if (revokedCount !== sessionCount - 1) return false;

          // Only current session should remain
          const remaining = manager.getUserSessions(userId);
          return remaining.length === 1 && remaining[0].id === currentSessionId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('revoking a specific session SHALL invalidate only that session', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 2, max: 5 }),
        (userId, sessionCount) => {
          const manager = new MockSessionManager();
          const sessionIds: string[] = [];

          // Create multiple sessions
          for (let i = 0; i < sessionCount; i++) {
            sessionIds.push(manager.createSession(userId));
          }

          // Revoke first session
          const toRevoke = sessionIds[0];
          manager.revokeSession(toRevoke);

          // Check remaining sessions
          const remaining = manager.getUserSessions(userId);
          
          // Should have one less session
          if (remaining.length !== sessionCount - 1) return false;
          
          // Revoked session should not be in remaining
          return !remaining.some(s => s.id === toRevoke);
        }
      ),
      { numRuns: 100 }
    );
  });
});
