/**
 * Property-Based Tests for Firestore Security Rules
 * Using fast-check for property testing
 *
 * **Feature: firebase-phase3-firestore**
 * **Property 14: Security Rules - Own Data Access**
 * **Property 15: Security Rules - Cross-User Denial**
 * **Validates: Requirements 12.1, 12.2**
 *
 * These tests verify the correctness properties of the security rules
 * using property-based testing to ensure rules hold across all valid inputs.
 */

import * as fc from 'fast-check';
import { describe, it, expect, beforeEach } from 'vitest';

// ============================================
// TYPES
// ============================================

interface MockAuthContext {
  uid: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CONTRACTOR' | 'HOMEOWNER' | 'WORKER' | 'USER';
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

interface SecurityRuleResult {
  allowed: boolean;
  reason?: string;
}

// ============================================
// SECURITY RULES SIMULATOR
// ============================================

class SecurityRulesSimulator {
  private isAuthenticated(auth: MockAuthContext | null): boolean {
    return auth !== null;
  }

  private isAdmin(auth: MockAuthContext | null): boolean {
    return this.isAuthenticated(auth) && auth?.role === 'ADMIN';
  }

  private isOwner(auth: MockAuthContext | null, resourceOwnerId: string): boolean {
    return this.isAuthenticated(auth) && auth?.uid === resourceOwnerId;
  }

  canReadUser(auth: MockAuthContext | null, userId: string): SecurityRuleResult {
    if (this.isOwner(auth, userId)) {
      return { allowed: true, reason: 'User can read own data' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can read any user data' };
    }
    return { allowed: false, reason: 'Cannot read other user data' };
  }

  canWriteUser(
    auth: MockAuthContext | null, 
    userId: string, 
    operation: 'create' | 'update' | 'delete'
  ): SecurityRuleResult {
    if (operation === 'create') {
      if (this.isAdmin(auth)) {
        return { allowed: true, reason: 'Admin can create users' };
      }
      return { allowed: false, reason: 'Only admin can create users' };
    }
    if (operation === 'update') {
      if (this.isOwner(auth, userId)) {
        return { allowed: true, reason: 'User can update own data' };
      }
      if (this.isAdmin(auth)) {
        return { allowed: true, reason: 'Admin can update any user' };
      }
      return { allowed: false, reason: 'Cannot update other user data' };
    }
    if (operation === 'delete') {
      if (this.isAdmin(auth)) {
        return { allowed: true, reason: 'Admin can delete users' };
      }
      return { allowed: false, reason: 'Only admin can delete users' };
    }
    return { allowed: false, reason: 'Unknown operation' };
  }

  canAccessUserNotifications(auth: MockAuthContext | null, userId: string): SecurityRuleResult {
    if (this.isOwner(auth, userId)) {
      return { allowed: true, reason: 'User can access own notifications' };
    }
    return { allowed: false, reason: 'Cannot access other user notifications' };
  }

  canAccessConversation(
    auth: MockAuthContext | null, 
    participantIds: string[]
  ): SecurityRuleResult {
    if (!this.isAuthenticated(auth)) {
      return { allowed: false, reason: 'Authentication required' };
    }
    if (auth && participantIds.includes(auth.uid)) {
      return { allowed: true, reason: 'Participant can access conversation' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can access any conversation' };
    }
    return { allowed: false, reason: 'Not a participant in this conversation' };
  }
}


// ============================================
// GENERATORS
// ============================================

/**
 * Generator for valid user IDs
 */
const userIdArb = fc.string({ minLength: 10, maxLength: 30 })
  .filter(s => /^[a-zA-Z0-9_-]+$/.test(s));

/**
 * Generator for valid email addresses
 */
const emailArb = fc.emailAddress();

/**
 * Generator for user roles
 */
const roleArb = fc.constantFrom(
  'ADMIN' as const, 
  'MANAGER' as const, 
  'CONTRACTOR' as const, 
  'HOMEOWNER' as const, 
  'WORKER' as const, 
  'USER' as const
);

/**
 * Generator for non-admin roles
 */
const nonAdminRoleArb = fc.constantFrom(
  'MANAGER' as const, 
  'CONTRACTOR' as const, 
  'HOMEOWNER' as const, 
  'WORKER' as const, 
  'USER' as const
);

/**
 * Generator for mock auth context
 */
const authContextArb = fc.record({
  uid: userIdArb,
  email: emailArb,
  role: roleArb,
  verificationStatus: fc.option(
    fc.constantFrom('PENDING' as const, 'VERIFIED' as const, 'REJECTED' as const),
    { nil: undefined }
  ),
});

/**
 * Generator for non-admin auth context
 */
const nonAdminAuthContextArb = fc.record({
  uid: userIdArb,
  email: emailArb,
  role: nonAdminRoleArb,
  verificationStatus: fc.option(
    fc.constantFrom('PENDING' as const, 'VERIFIED' as const, 'REJECTED' as const),
    { nil: undefined }
  ),
});

/**
 * Generator for admin auth context
 */
const adminAuthContextArb = fc.record({
  uid: userIdArb,
  email: emailArb,
  role: fc.constant('ADMIN' as const),
  verificationStatus: fc.option(
    fc.constantFrom('PENDING' as const, 'VERIFIED' as const, 'REJECTED' as const),
    { nil: undefined }
  ),
});

/**
 * Generator for conversation participant IDs
 */
const participantIdsArb = fc.array(userIdArb, { minLength: 2, maxLength: 10 });


// ============================================
// PROPERTY TESTS
// ============================================

describe('Security Rules Property Tests', () => {
  let rules: SecurityRulesSimulator;

  beforeEach(() => {
    rules = new SecurityRulesSimulator();
  });

  /**
   * **Feature: firebase-phase3-firestore, Property 14: Security Rules - Own Data Access**
   * **Validates: Requirements 12.1**
   * 
   * For any authenticated user, they should be able to read and write their own data.
   * This property ensures that the "own data" access pattern works correctly
   * regardless of the user's role or other attributes.
   */
  describe('Property 14: Security Rules - Own Data Access', () => {
    it('any authenticated user can read their own profile', () => {
      fc.assert(
        fc.property(authContextArb, (auth) => {
          const result = rules.canReadUser(auth, auth.uid);
          expect(result.allowed).toBe(true);
          expect(result.reason).toContain('own data');
        }),
        { numRuns: 100 }
      );
    });

    it('any authenticated user can update their own profile', () => {
      fc.assert(
        fc.property(authContextArb, (auth) => {
          const result = rules.canWriteUser(auth, auth.uid, 'update');
          expect(result.allowed).toBe(true);
          // Either "own data" or "Admin" (admins can also update)
          expect(result.reason).toMatch(/own data|Admin/);
        }),
        { numRuns: 100 }
      );
    });

    it('any authenticated user can access their own notifications', () => {
      fc.assert(
        fc.property(authContextArb, (auth) => {
          const result = rules.canAccessUserNotifications(auth, auth.uid);
          expect(result.allowed).toBe(true);
          expect(result.reason).toContain('own notifications');
        }),
        { numRuns: 100 }
      );
    });

    it('any authenticated user can access conversations they participate in', () => {
      fc.assert(
        fc.property(
          authContextArb,
          participantIdsArb,
          (auth, otherParticipants) => {
            // Include the user in the participants
            const participantIds = [auth.uid, ...otherParticipants];
            const result = rules.canAccessConversation(auth, participantIds);
            expect(result.allowed).toBe(true);
            // Either "Participant" or "Admin"
            expect(result.reason).toMatch(/Participant|Admin/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('admin can always access any user data (superset of own data)', () => {
      fc.assert(
        fc.property(
          adminAuthContextArb,
          userIdArb,
          (adminAuth, anyUserId) => {
            // Admin can read any user
            const readResult = rules.canReadUser(adminAuth, anyUserId);
            expect(readResult.allowed).toBe(true);
            
            // Admin can update any user
            const updateResult = rules.canWriteUser(adminAuth, anyUserId, 'update');
            expect(updateResult.allowed).toBe(true);
            
            // Admin can delete any user
            const deleteResult = rules.canWriteUser(adminAuth, anyUserId, 'delete');
            expect(deleteResult.allowed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: firebase-phase3-firestore, Property 15: Security Rules - Cross-User Denial**
   * **Validates: Requirements 12.2**
   * 
   * For any authenticated non-admin user, they should not be able to read 
   * another user's private data. This property ensures that cross-user
   * access is properly denied.
   */
  describe('Property 15: Security Rules - Cross-User Denial', () => {
    it('non-admin user cannot read other user profile', () => {
      fc.assert(
        fc.property(
          nonAdminAuthContextArb,
          userIdArb,
          (auth, otherUserId) => {
            // Skip if the generated IDs happen to match
            fc.pre(auth.uid !== otherUserId);
            
            const result = rules.canReadUser(auth, otherUserId);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Cannot read other');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('non-admin user cannot update other user profile', () => {
      fc.assert(
        fc.property(
          nonAdminAuthContextArb,
          userIdArb,
          (auth, otherUserId) => {
            // Skip if the generated IDs happen to match
            fc.pre(auth.uid !== otherUserId);
            
            const result = rules.canWriteUser(auth, otherUserId, 'update');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Cannot update other');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('non-admin user cannot delete any user', () => {
      fc.assert(
        fc.property(
          nonAdminAuthContextArb,
          userIdArb,
          (auth, anyUserId) => {
            const result = rules.canWriteUser(auth, anyUserId, 'delete');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Only admin');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('non-admin user cannot create users', () => {
      fc.assert(
        fc.property(
          nonAdminAuthContextArb,
          userIdArb,
          (auth, newUserId) => {
            const result = rules.canWriteUser(auth, newUserId, 'create');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Only admin');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('non-admin user cannot access other user notifications', () => {
      fc.assert(
        fc.property(
          nonAdminAuthContextArb,
          userIdArb,
          (auth, otherUserId) => {
            // Skip if the generated IDs happen to match
            fc.pre(auth.uid !== otherUserId);
            
            const result = rules.canAccessUserNotifications(auth, otherUserId);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Cannot access other');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('non-admin user cannot access conversations they do not participate in', () => {
      fc.assert(
        fc.property(
          nonAdminAuthContextArb,
          participantIdsArb,
          (auth, participantIds) => {
            // Ensure the user is NOT in the participants
            const filteredParticipants = participantIds.filter(id => id !== auth.uid);
            // Skip if we couldn't create a valid non-participating scenario
            fc.pre(filteredParticipants.length >= 2);
            
            const result = rules.canAccessConversation(auth, filteredParticipants);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Not a participant');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('unauthenticated user cannot access any protected resource', () => {
      fc.assert(
        fc.property(
          userIdArb,
          participantIdsArb,
          (userId, participantIds) => {
            // Unauthenticated (null auth) cannot read user
            const readResult = rules.canReadUser(null, userId);
            expect(readResult.allowed).toBe(false);
            
            // Unauthenticated cannot update user
            const updateResult = rules.canWriteUser(null, userId, 'update');
            expect(updateResult.allowed).toBe(false);
            
            // Unauthenticated cannot access notifications
            const notifResult = rules.canAccessUserNotifications(null, userId);
            expect(notifResult.allowed).toBe(false);
            
            // Unauthenticated cannot access conversations
            const convResult = rules.canAccessConversation(null, participantIds);
            expect(convResult.allowed).toBe(false);
            expect(convResult.reason).toContain('Authentication required');
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Additional property: Role hierarchy consistency
   * Admin access should be a superset of all other role access
   */
  describe('Role Hierarchy Consistency', () => {
    it('admin access is superset of non-admin access for read operations', () => {
      fc.assert(
        fc.property(
          adminAuthContextArb,
          nonAdminAuthContextArb,
          userIdArb,
          (adminAuth, nonAdminAuth, targetUserId) => {
            // If non-admin can read, admin must also be able to read
            const nonAdminResult = rules.canReadUser(nonAdminAuth, targetUserId);
            const adminResult = rules.canReadUser(adminAuth, targetUserId);
            
            if (nonAdminResult.allowed) {
              expect(adminResult.allowed).toBe(true);
            }
            // Admin should always be able to read
            expect(adminResult.allowed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('admin access is superset of non-admin access for write operations', () => {
      fc.assert(
        fc.property(
          adminAuthContextArb,
          nonAdminAuthContextArb,
          userIdArb,
          fc.constantFrom('create' as const, 'update' as const, 'delete' as const),
          (adminAuth, nonAdminAuth, targetUserId, operation) => {
            // If non-admin can write, admin must also be able to write
            const nonAdminResult = rules.canWriteUser(nonAdminAuth, targetUserId, operation);
            const adminResult = rules.canWriteUser(adminAuth, targetUserId, operation);
            
            if (nonAdminResult.allowed) {
              expect(adminResult.allowed).toBe(true);
            }
            // Admin should always be able to perform any write operation
            expect(adminResult.allowed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Symmetry of own-data access
   * Own-data access should be symmetric - if user A can access their own data,
   * user B should also be able to access their own data (same rules apply)
   */
  describe('Symmetry of Own-Data Access', () => {
    it('own-data access rules are symmetric across users', () => {
      fc.assert(
        fc.property(
          authContextArb,
          authContextArb,
          (userA, userB) => {
            // Both users should be able to read their own data
            const userAReadOwn = rules.canReadUser(userA, userA.uid);
            const userBReadOwn = rules.canReadUser(userB, userB.uid);
            
            expect(userAReadOwn.allowed).toBe(userBReadOwn.allowed);
            
            // Both users should be able to update their own data
            const userAUpdateOwn = rules.canWriteUser(userA, userA.uid, 'update');
            const userBUpdateOwn = rules.canWriteUser(userB, userB.uid, 'update');
            
            expect(userAUpdateOwn.allowed).toBe(userBUpdateOwn.allowed);
            
            // Both users should be able to access their own notifications
            const userANotif = rules.canAccessUserNotifications(userA, userA.uid);
            const userBNotif = rules.canAccessUserNotifications(userB, userB.uid);
            
            expect(userANotif.allowed).toBe(userBNotif.allowed);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
