/**
 * Firestore Security Rules Tests
 * 
 * Tests the Firestore security rules defined in infra/firebase/firestore.rules
 * These tests verify access control at the database level.
 * 
 * **Feature: firebase-phase3-firestore**
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
 * 
 * Note: These tests use a SecurityRulesSimulator to verify the security
 * rules logic. For full integration testing, use Firebase Emulator.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================
// TYPES
// ============================================

interface MockAuthContext {
  uid: string;
  email: string;
  role: string;
  verificationStatus?: string;
}

interface SecurityRuleResult {
  allowed: boolean;
  reason?: string;
}

// ============================================
// SECURITY RULES SIMULATOR (Mirrors firestore.rules)
// ============================================

/**
 * Simulates the security rules logic from firestore.rules
 * This allows us to test the rules without requiring Firebase Emulator
 */
class SecurityRulesSimulator {
  private isAuthenticated(auth: MockAuthContext | null): boolean {
    return auth !== null;
  }

  private isAdmin(auth: MockAuthContext | null): boolean {
    return this.isAuthenticated(auth) && auth?.role === 'ADMIN';
  }

  private isManager(auth: MockAuthContext | null): boolean {
    return this.isAuthenticated(auth) && 
           (auth?.role === 'ADMIN' || auth?.role === 'MANAGER');
  }

  private isContractor(auth: MockAuthContext | null): boolean {
    return this.isAuthenticated(auth) && auth?.role === 'CONTRACTOR';
  }

  private isHomeowner(auth: MockAuthContext | null): boolean {
    return this.isAuthenticated(auth) && auth?.role === 'HOMEOWNER';
  }

  private isOwner(auth: MockAuthContext | null, resourceOwnerId: string): boolean {
    return this.isAuthenticated(auth) && auth?.uid === resourceOwnerId;
  }

  // ==================== USERS COLLECTION ====================
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

  // ==================== USER NOTIFICATIONS SUBCOLLECTION ====================
  canAccessUserNotifications(auth: MockAuthContext | null, userId: string): SecurityRuleResult {
    if (this.isOwner(auth, userId)) {
      return { allowed: true, reason: 'User can access own notifications' };
    }
    return { allowed: false, reason: 'Cannot access other user notifications' };
  }

  // ==================== PUBLIC CONTENT COLLECTIONS ====================
  canReadPublicContent(): SecurityRuleResult {
    return { allowed: true, reason: 'Public content is readable by anyone' };
  }

  canWritePublicContent(auth: MockAuthContext | null): SecurityRuleResult {
    if (this.isManager(auth)) {
      return { allowed: true, reason: 'Manager can write public content' };
    }
    return { allowed: false, reason: 'Only manager/admin can write public content' };
  }

  // ==================== PRICING COLLECTIONS ====================
  canWritePricing(auth: MockAuthContext | null): SecurityRuleResult {
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can write pricing data' };
    }
    return { allowed: false, reason: 'Only admin can write pricing data' };
  }

  // ==================== LEADS COLLECTION ====================
  canReadLeads(auth: MockAuthContext | null): SecurityRuleResult {
    if (this.isManager(auth)) {
      return { allowed: true, reason: 'Manager can read leads' };
    }
    return { allowed: false, reason: 'Only manager/admin can read leads' };
  }

  canCreateLead(): SecurityRuleResult {
    return { allowed: true, reason: 'Anyone can submit a lead' };
  }

  canModifyLead(auth: MockAuthContext | null): SecurityRuleResult {
    if (this.isManager(auth)) {
      return { allowed: true, reason: 'Manager can modify leads' };
    }
    return { allowed: false, reason: 'Only manager/admin can modify leads' };
  }

  // ==================== PROJECTS & BIDDING ====================
  canReadProject(
    auth: MockAuthContext | null, 
    projectOwnerId: string, 
    projectStatus: string
  ): SecurityRuleResult {
    if (projectStatus === 'OPEN') {
      return { allowed: true, reason: 'Open projects are publicly readable' };
    }
    if (this.isOwner(auth, projectOwnerId)) {
      return { allowed: true, reason: 'Owner can read own project' };
    }
    if (this.isContractor(auth)) {
      return { allowed: true, reason: 'Contractors can read projects' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can read any project' };
    }
    return { allowed: false, reason: 'Cannot read this project' };
  }

  canCreateProject(auth: MockAuthContext | null): SecurityRuleResult {
    if (this.isHomeowner(auth)) {
      return { allowed: true, reason: 'Homeowner can create projects' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can create projects' };
    }
    return { allowed: false, reason: 'Only homeowners can create projects' };
  }

  canUpdateProject(auth: MockAuthContext | null, projectOwnerId: string): SecurityRuleResult {
    if (this.isOwner(auth, projectOwnerId)) {
      return { allowed: true, reason: 'Owner can update own project' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can update any project' };
    }
    return { allowed: false, reason: 'Cannot update this project' };
  }

  // ==================== BIDS SUBCOLLECTION ====================
  canReadBid(
    auth: MockAuthContext | null, 
    bidContractorId: string, 
    projectOwnerId: string
  ): SecurityRuleResult {
    if (this.isOwner(auth, bidContractorId)) {
      return { allowed: true, reason: 'Contractor can read own bid' };
    }
    if (this.isOwner(auth, projectOwnerId)) {
      return { allowed: true, reason: 'Project owner can read bids' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can read any bid' };
    }
    return { allowed: false, reason: 'Cannot read this bid' };
  }

  canCreateBid(auth: MockAuthContext | null): SecurityRuleResult {
    if (this.isContractor(auth)) {
      return { allowed: true, reason: 'Contractor can create bids' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can create bids' };
    }
    return { allowed: false, reason: 'Only contractors can create bids' };
  }

  // ==================== ESCROW & FEES ====================
  canReadEscrow(
    auth: MockAuthContext | null, 
    homeownerId: string, 
    contractorId: string
  ): SecurityRuleResult {
    if (this.isOwner(auth, homeownerId)) {
      return { allowed: true, reason: 'Homeowner can read own escrow' };
    }
    if (this.isOwner(auth, contractorId)) {
      return { allowed: true, reason: 'Contractor can read own escrow' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can read any escrow' };
    }
    return { allowed: false, reason: 'Cannot read this escrow' };
  }

  canWriteEscrow(auth: MockAuthContext | null): SecurityRuleResult {
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can write escrows' };
    }
    return { allowed: false, reason: 'Only admin can write escrows' };
  }

  // ==================== CHAT ====================
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

  // ==================== REVIEWS ====================
  canReadReview(auth: MockAuthContext | null, isPublic: boolean): SecurityRuleResult {
    if (isPublic) {
      return { allowed: true, reason: 'Public reviews are readable by anyone' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can read any review' };
    }
    return { allowed: false, reason: 'Cannot read private review' };
  }

  canCreateReview(auth: MockAuthContext | null): SecurityRuleResult {
    if (this.isHomeowner(auth)) {
      return { allowed: true, reason: 'Homeowner can create reviews' };
    }
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can create reviews' };
    }
    return { allowed: false, reason: 'Only homeowners can create reviews' };
  }

  // ==================== SETTINGS & ADMIN ====================
  canWriteSettings(auth: MockAuthContext | null): SecurityRuleResult {
    if (this.isAdmin(auth)) {
      return { allowed: true, reason: 'Admin can write settings' };
    }
    return { allowed: false, reason: 'Only admin can write settings' };
  }

  canAccessAuditLogs(
    auth: MockAuthContext | null, 
    operation: 'read' | 'create' | 'update' | 'delete'
  ): SecurityRuleResult {
    if (operation === 'read') {
      if (this.isAdmin(auth)) {
        return { allowed: true, reason: 'Admin can read audit logs' };
      }
      return { allowed: false, reason: 'Only admin can read audit logs' };
    }
    if (operation === 'create') {
      if (this.isAuthenticated(auth)) {
        return { allowed: true, reason: 'Authenticated users can create audit logs' };
      }
      return { allowed: false, reason: 'Authentication required to create audit logs' };
    }
    return { allowed: false, reason: 'Audit logs cannot be modified or deleted' };
  }
}


// ============================================
// TEST FIXTURES
// ============================================

const adminUser: MockAuthContext = {
  uid: 'admin-user-123',
  email: 'admin@example.com',
  role: 'ADMIN',
};

const managerUser: MockAuthContext = {
  uid: 'manager-user-123',
  email: 'manager@example.com',
  role: 'MANAGER',
};

const contractorUser: MockAuthContext = {
  uid: 'contractor-user-123',
  email: 'contractor@example.com',
  role: 'CONTRACTOR',
  verificationStatus: 'VERIFIED',
};

const homeownerUser: MockAuthContext = {
  uid: 'homeowner-user-123',
  email: 'homeowner@example.com',
  role: 'HOMEOWNER',
};

const regularUser: MockAuthContext = {
  uid: 'regular-user-123',
  email: 'user@example.com',
  role: 'USER',
};

const otherUser: MockAuthContext = {
  uid: 'other-user-456',
  email: 'other@example.com',
  role: 'USER',
};


// ============================================
// UNIT TESTS
// ============================================

describe('Firestore Security Rules Tests', () => {
  let rules: SecurityRulesSimulator;

  beforeEach(() => {
    rules = new SecurityRulesSimulator();
  });

  // ==================== REQUIREMENT 12.1: Own Data Access ====================
  describe('Requirement 12.1: User can read/write own data', () => {
    it('user can read own profile', () => {
      const result = rules.canReadUser(regularUser, regularUser.uid);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('own data');
    });

    it('user can update own profile', () => {
      const result = rules.canWriteUser(regularUser, regularUser.uid, 'update');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('own data');
    });

    it('user can access own notifications', () => {
      const result = rules.canAccessUserNotifications(regularUser, regularUser.uid);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('own notifications');
    });

    it('homeowner can read own project', () => {
      const result = rules.canReadProject(homeownerUser, homeownerUser.uid, 'DRAFT');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('own project');
    });

    it('homeowner can update own project', () => {
      const result = rules.canUpdateProject(homeownerUser, homeownerUser.uid);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('own project');
    });

    it('contractor can read own bid', () => {
      const result = rules.canReadBid(contractorUser, contractorUser.uid, 'other-owner');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('own bid');
    });

    it('homeowner can read escrow where they are homeowner', () => {
      const result = rules.canReadEscrow(homeownerUser, homeownerUser.uid, 'other-contractor');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Homeowner can read');
    });

    it('contractor can read escrow where they are contractor', () => {
      const result = rules.canReadEscrow(contractorUser, 'other-homeowner', contractorUser.uid);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Contractor can read');
    });

    it('user can access conversation they participate in', () => {
      const result = rules.canAccessConversation(regularUser, [regularUser.uid, 'other-user']);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Participant');
    });
  });


  // ==================== REQUIREMENT 12.2: Cross-User Denial ====================
  describe('Requirement 12.2: User cannot read other user private data', () => {
    it('user cannot read other user profile', () => {
      const result = rules.canReadUser(regularUser, otherUser.uid);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot read other');
    });

    it('user cannot update other user profile', () => {
      const result = rules.canWriteUser(regularUser, otherUser.uid, 'update');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot update other');
    });

    it('user cannot access other user notifications', () => {
      const result = rules.canAccessUserNotifications(regularUser, otherUser.uid);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot access other');
    });

    it('user cannot read other user private project', () => {
      const result = rules.canReadProject(regularUser, otherUser.uid, 'DRAFT');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot read');
    });

    it('user cannot update other user project', () => {
      const result = rules.canUpdateProject(regularUser, otherUser.uid);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot update');
    });

    it('user cannot read bid they are not involved in', () => {
      const result = rules.canReadBid(regularUser, 'other-contractor', 'other-owner');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot read');
    });

    it('user cannot read escrow they are not involved in', () => {
      const result = rules.canReadEscrow(regularUser, 'other-homeowner', 'other-contractor');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot read');
    });

    it('user cannot access conversation they do not participate in', () => {
      const result = rules.canAccessConversation(regularUser, ['user-a', 'user-b']);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Not a participant');
    });

    it('user cannot read private review', () => {
      const result = rules.canReadReview(regularUser, false);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cannot read private');
    });
  });


  // ==================== REQUIREMENT 12.3: Admin Access ====================
  describe('Requirement 12.3: Admin can access all data', () => {
    it('admin can read any user profile', () => {
      const result = rules.canReadUser(adminUser, otherUser.uid);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can create users', () => {
      const result = rules.canWriteUser(adminUser, 'new-user', 'create');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can update any user', () => {
      const result = rules.canWriteUser(adminUser, otherUser.uid, 'update');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can delete users', () => {
      const result = rules.canWriteUser(adminUser, otherUser.uid, 'delete');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can read any project', () => {
      const result = rules.canReadProject(adminUser, otherUser.uid, 'DRAFT');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can update any project', () => {
      const result = rules.canUpdateProject(adminUser, otherUser.uid);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can read any bid', () => {
      const result = rules.canReadBid(adminUser, 'contractor-id', 'owner-id');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can create bids', () => {
      const result = rules.canCreateBid(adminUser);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can read any escrow', () => {
      const result = rules.canReadEscrow(adminUser, 'homeowner-id', 'contractor-id');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can write escrows', () => {
      const result = rules.canWriteEscrow(adminUser);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can access any conversation', () => {
      const result = rules.canAccessConversation(adminUser, ['user-a', 'user-b']);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can read private reviews', () => {
      const result = rules.canReadReview(adminUser, false);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can write settings', () => {
      const result = rules.canWriteSettings(adminUser);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can write pricing', () => {
      const result = rules.canWritePricing(adminUser);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });

    it('admin can read audit logs', () => {
      const result = rules.canAccessAuditLogs(adminUser, 'read');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Admin');
    });
  });


  // ==================== REQUIREMENT 12.4: Public Collections ====================
  describe('Requirement 12.4: Public collections allow read without auth', () => {
    it('anyone can read public content (pages, blog, pricing)', () => {
      const result = rules.canReadPublicContent();
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Public content');
    });

    it('anyone can read public reviews', () => {
      const result = rules.canReadReview(null, true);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Public reviews');
    });

    it('anyone can read OPEN projects', () => {
      const result = rules.canReadProject(null, 'any-owner', 'OPEN');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Open projects');
    });

    it('anyone can submit a lead', () => {
      const result = rules.canCreateLead();
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Anyone can submit');
    });

    it('unauthenticated user cannot read private project', () => {
      const result = rules.canReadProject(null, 'any-owner', 'DRAFT');
      expect(result.allowed).toBe(false);
    });

    it('unauthenticated user cannot access conversations', () => {
      const result = rules.canAccessConversation(null, ['user-a', 'user-b']);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Authentication required');
    });
  });


  // ==================== REQUIREMENT 12.5: Role-Based Access ====================
  describe('Requirement 12.5: Protected collections require appropriate role', () => {
    // Manager role tests
    describe('Manager role', () => {
      it('manager can write public content', () => {
        const result = rules.canWritePublicContent(managerUser);
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('Manager');
      });

      it('manager can read leads', () => {
        const result = rules.canReadLeads(managerUser);
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('Manager');
      });

      it('manager can modify leads', () => {
        const result = rules.canModifyLead(managerUser);
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('Manager');
      });

      it('manager cannot write pricing (admin only)', () => {
        const result = rules.canWritePricing(managerUser);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only admin');
      });

      it('manager cannot write settings (admin only)', () => {
        const result = rules.canWriteSettings(managerUser);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only admin');
      });
    });

    // Contractor role tests
    describe('Contractor role', () => {
      it('contractor can read projects', () => {
        const result = rules.canReadProject(contractorUser, 'other-owner', 'BIDDING_CLOSED');
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('Contractors');
      });

      it('contractor can create bids', () => {
        const result = rules.canCreateBid(contractorUser);
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('Contractor');
      });

      it('contractor cannot create projects', () => {
        const result = rules.canCreateProject(contractorUser);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only homeowners');
      });

      it('contractor cannot write public content', () => {
        const result = rules.canWritePublicContent(contractorUser);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only manager');
      });

      it('contractor cannot read leads', () => {
        const result = rules.canReadLeads(contractorUser);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only manager');
      });
    });

    // Homeowner role tests
    describe('Homeowner role', () => {
      it('homeowner can create projects', () => {
        const result = rules.canCreateProject(homeownerUser);
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('Homeowner');
      });

      it('homeowner can create reviews', () => {
        const result = rules.canCreateReview(homeownerUser);
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('Homeowner');
      });

      it('homeowner cannot create bids', () => {
        const result = rules.canCreateBid(homeownerUser);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only contractors');
      });

      it('homeowner cannot write public content', () => {
        const result = rules.canWritePublicContent(homeownerUser);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only manager');
      });
    });

    // Regular user role tests
    describe('Regular user role', () => {
      it('regular user cannot create users', () => {
        const result = rules.canWriteUser(regularUser, 'new-user', 'create');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only admin');
      });

      it('regular user cannot delete users', () => {
        const result = rules.canWriteUser(regularUser, otherUser.uid, 'delete');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only admin');
      });

      it('regular user cannot write escrows', () => {
        const result = rules.canWriteEscrow(regularUser);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only admin');
      });

      it('regular user cannot create reviews', () => {
        const result = rules.canCreateReview(regularUser);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only homeowners');
      });

      it('regular user can create audit logs', () => {
        const result = rules.canAccessAuditLogs(regularUser, 'create');
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('Authenticated users');
      });

      it('regular user cannot read audit logs', () => {
        const result = rules.canAccessAuditLogs(regularUser, 'read');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Only admin');
      });

      it('no one can update audit logs', () => {
        const result = rules.canAccessAuditLogs(adminUser, 'update');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('cannot be modified');
      });

      it('no one can delete audit logs', () => {
        const result = rules.canAccessAuditLogs(adminUser, 'delete');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('cannot be modified');
      });
    });
  });
});
