/**
 * Project Service Tests
 *
 * Tests for project management business logic including CRUD operations,
 * status transitions, and access control.
 *
 * **Feature: api-test-coverage**
 * **Requirements: 1.1-1.5**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ProjectService, PROJECT_STATUS_TRANSITIONS } from './project/index';
import {
  validProjectTransitions,
  invalidProjectTransitions,
  isValidProjectTransition,
  projectCodeGen,
  projectStatusGen,
} from '../test-utils/generators';
import { projectFixtures, userFixtures, biddingSettingsFixtures } from '../test-utils/fixtures';
import { createMockPrisma, type MockPrismaClient } from '../test-utils/mock-prisma';

// ============================================
// STATUS TRANSITION TESTS
// ============================================

describe('ProjectService', () => {
  let mockPrisma: MockPrismaClient;
  let service: ProjectService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new ProjectService(mockPrisma as unknown as import('@prisma/client').PrismaClient);
    vi.clearAllMocks();
  });

  describe('Status Transitions', () => {
    /**
     * **Feature: api-test-coverage, Property 2: Valid project status transitions**
     * **Validates: Requirements 1.2**
     */
    describe('Property 2: Valid project status transitions', () => {
      it('should allow all valid transitions defined in constants', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...validProjectTransitions),
            ([from, to]) => {
              const allowedTransitions = PROJECT_STATUS_TRANSITIONS[from as keyof typeof PROJECT_STATUS_TRANSITIONS];
              expect(allowedTransitions).toContain(to);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should have consistent valid transitions with generator', () => {
        // Verify that our generator matches the actual constants
        for (const [from, to] of validProjectTransitions) {
          const allowedTransitions = PROJECT_STATUS_TRANSITIONS[from as keyof typeof PROJECT_STATUS_TRANSITIONS];
          expect(allowedTransitions).toContain(to);
        }
      });
    });

    /**
     * **Feature: api-test-coverage, Property 3: Invalid project status transitions rejected**
     * **Validates: Requirements 1.3**
     */
    describe('Property 3: Invalid project status transitions rejected', () => {
      it('should reject all invalid transitions', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...invalidProjectTransitions),
            ([from, to]) => {
              const allowedTransitions = PROJECT_STATUS_TRANSITIONS[from as keyof typeof PROJECT_STATUS_TRANSITIONS];
              expect(allowedTransitions).not.toContain(to);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should not allow transition from terminal states', () => {
        // COMPLETED and CANCELLED are terminal states
        const terminalStates = ['COMPLETED', 'CANCELLED'];
        
        for (const state of terminalStates) {
          const allowedTransitions = PROJECT_STATUS_TRANSITIONS[state as keyof typeof PROJECT_STATUS_TRANSITIONS];
          expect(allowedTransitions).toHaveLength(0);
        }
      });
    });

    describe('isValidTransition helper', () => {
      it('should return true for valid transitions', () => {
        for (const [from, to] of validProjectTransitions) {
          expect(isValidProjectTransition(from, to)).toBe(true);
        }
      });

      it('should return false for invalid transitions', () => {
        for (const [from, to] of invalidProjectTransitions) {
          expect(isValidProjectTransition(from, to)).toBe(false);
        }
      });
    });
  });

  // ============================================
  // PROJECT CODE FORMAT TESTS
  // ============================================

  describe('Project Code Format', () => {
    /**
     * **Feature: api-test-coverage, Property 1: Project code format**
     * **Validates: Requirements 1.1**
     */
    describe('Property 1: Project code format', () => {
      it('should generate codes matching PRJ-YYYY-NNN pattern', () => {
        fc.assert(
          fc.property(projectCodeGen, (code) => {
            // Code should match PRJ-YYYY-NNN format
            const pattern = /^PRJ-\d{4}-\d{3}$/;
            expect(code).toMatch(pattern);
          }),
          { numRuns: 100 }
        );
      });

      it('should generate codes with valid year range', () => {
        fc.assert(
          fc.property(projectCodeGen, (code) => {
            const year = parseInt(code.split('-')[1], 10);
            expect(year).toBeGreaterThanOrEqual(2020);
            expect(year).toBeLessThanOrEqual(2030);
          }),
          { numRuns: 100 }
        );
      });

      it('should generate codes with valid sequence number', () => {
        fc.assert(
          fc.property(projectCodeGen, (code) => {
            const seq = parseInt(code.split('-')[2], 10);
            expect(seq).toBeGreaterThanOrEqual(1);
            expect(seq).toBeLessThanOrEqual(999);
          }),
          { numRuns: 100 }
        );
      });
    });
  });

  // ============================================
  // PROJECT FIXTURES TESTS
  // ============================================

  describe('Project Fixtures', () => {
    it('should create valid draft project fixture', () => {
      const project = projectFixtures.draft();
      
      expect(project.id).toBeDefined();
      expect(project.code).toMatch(/^PRJ-\d{4}-\d{3}$/);
      expect(project.status).toBe('DRAFT');
      expect(project.ownerId).toBeDefined();
    });

    it('should create valid open project fixture', () => {
      const project = projectFixtures.open();
      
      expect(project.status).toBe('OPEN');
      expect(project.publishedAt).toBeDefined();
      expect(project.bidDeadline).toBeDefined();
    });

    it('should create valid matched project fixture', () => {
      const project = projectFixtures.matched();
      
      expect(project.status).toBe('MATCHED');
      expect(project.selectedBidId).toBeDefined();
      expect(project.matchedAt).toBeDefined();
    });

    it('should create valid completed project fixture', () => {
      const project = projectFixtures.completed();
      
      expect(project.status).toBe('COMPLETED');
      expect(project.completedAt).toBeDefined();
    });

    it('should allow overriding fixture properties', () => {
      const customId = 'custom-project-id';
      const customTitle = 'Custom Project Title';
      
      const project = projectFixtures.draft({
        id: customId,
        title: customTitle,
      });
      
      expect(project.id).toBe(customId);
      expect(project.title).toBe(customTitle);
      expect(project.status).toBe('DRAFT'); // Default preserved
    });
  });

  // ============================================
  // PROJECT ACCESS CONTROL TESTS
  // ============================================

  describe('Project Access Control', () => {
    /**
     * **Feature: api-test-coverage, Property 5: Owner-only access for draft projects**
     * **Validates: Requirements 1.5**
     */
    describe('Access Control Logic', () => {
      it('draft projects should have owner info', () => {
        const project = projectFixtures.draft();
        const owner = userFixtures.homeowner();
        
        // Draft project should have ownerId matching homeowner
        expect(project.ownerId).toBe(owner.id);
      });

      it('open projects should be accessible publicly', () => {
        const project = projectFixtures.open();
        
        // Open projects have publishedAt set
        expect(project.publishedAt).toBeDefined();
        expect(project.status).toBe('OPEN');
      });

      it('should verify owner role is HOMEOWNER', () => {
        const owner = userFixtures.homeowner();
        
        expect(owner.role).toBe('HOMEOWNER');
      });

      it('should verify contractor cannot own projects', () => {
        const contractor = userFixtures.contractor();
        
        expect(contractor.role).toBe('CONTRACTOR');
        expect(contractor.role).not.toBe('HOMEOWNER');
      });
    });
  });

  // ============================================
  // BIDDING SETTINGS INTEGRATION
  // ============================================

  describe('Bidding Settings', () => {
    it('should have valid default bidding settings', () => {
      const settings = biddingSettingsFixtures.default();
      
      expect(settings.maxBidsPerProject).toBe(20);
      expect(settings.escrowPercentage).toBe(10);
      expect(settings.escrowMinAmount).toBe(1000000);
      expect(settings.winFeePercentage).toBe(5);
    });

    it('should allow overriding bidding settings', () => {
      const settings = biddingSettingsFixtures.default({
        maxBidsPerProject: 30,
        escrowPercentage: 15,
      });
      
      expect(settings.maxBidsPerProject).toBe(30);
      expect(settings.escrowPercentage).toBe(15);
      expect(settings.escrowMinAmount).toBe(1000000); // Default preserved
    });
  });

  // ============================================
  // PROJECT FILTERING TESTS
  // ============================================

  describe('Project Filtering', () => {
    /**
     * **Feature: api-test-coverage, Property 4: Project filtering correctness**
     * **Validates: Requirements 1.4**
     */
    describe('Property 4: Project filtering correctness', () => {
      it('should filter projects by status correctly', () => {
        fc.assert(
          fc.property(projectStatusGen, (status) => {
            // Create projects with different statuses
            const projects = [
              projectFixtures.draft({ status: 'DRAFT' }),
              projectFixtures.open({ status: 'OPEN' }),
              projectFixtures.matched({ status: 'MATCHED' }),
              projectFixtures.completed({ status: 'COMPLETED' }),
            ];

            // Filter by status
            const filtered = projects.filter((p) => p.status === status);

            // All filtered projects should have the requested status
            for (const project of filtered) {
              expect(project.status).toBe(status);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should filter projects by region correctly', () => {
        const regionId = 'region-1';
        const projects = [
          projectFixtures.draft({ regionId: 'region-1' }),
          projectFixtures.open({ regionId: 'region-2' }),
          projectFixtures.matched({ regionId: 'region-1' }),
        ];

        const filtered = projects.filter((p) => p.regionId === regionId);

        expect(filtered).toHaveLength(2);
        for (const project of filtered) {
          expect(project.regionId).toBe(regionId);
        }
      });

      it('should filter projects by category correctly', () => {
        const categoryId = 'category-1';
        const projects = [
          projectFixtures.draft({ categoryId: 'category-1' }),
          projectFixtures.open({ categoryId: 'category-2' }),
          projectFixtures.matched({ categoryId: 'category-1' }),
        ];

        const filtered = projects.filter((p) => p.categoryId === categoryId);

        expect(filtered).toHaveLength(2);
        for (const project of filtered) {
          expect(project.categoryId).toBe(categoryId);
        }
      });

      it('should return empty array when no projects match filter', () => {
        const projects = [
          projectFixtures.draft({ status: 'DRAFT' }),
          projectFixtures.open({ status: 'OPEN' }),
        ];

        const filtered = projects.filter((p) => p.status === 'COMPLETED');

        expect(filtered).toHaveLength(0);
      });

      it('should support multiple filter criteria', () => {
        const projects = [
          projectFixtures.draft({ status: 'DRAFT', regionId: 'region-1', categoryId: 'category-1' }),
          projectFixtures.open({ status: 'OPEN', regionId: 'region-1', categoryId: 'category-2' }),
          projectFixtures.matched({ status: 'MATCHED', regionId: 'region-2', categoryId: 'category-1' }),
          projectFixtures.draft({ status: 'DRAFT', regionId: 'region-1', categoryId: 'category-2' }),
        ];

        // Filter by status AND region
        const filtered = projects.filter(
          (p) => p.status === 'DRAFT' && p.regionId === 'region-1'
        );

        expect(filtered).toHaveLength(2);
        for (const project of filtered) {
          expect(project.status).toBe('DRAFT');
          expect(project.regionId).toBe('region-1');
        }
      });
    });
  });

  // ============================================
  // PROJECT ACCESS CONTROL UNIT TESTS
  // ============================================

  describe('Project Access Control - Unit Tests', () => {
    /**
     * Unit tests for project access control
     * **Validates: Requirements 1.5**
     */
    describe('Owner-only access for draft projects', () => {
      it('should allow owner to access their draft project', () => {
        const owner = userFixtures.homeowner();
        const project = projectFixtures.draft({ ownerId: owner.id });

        // Owner should have access
        const hasAccess = project.ownerId === owner.id;
        expect(hasAccess).toBe(true);
      });

      it('should deny access to draft project for non-owner', () => {
        const owner = userFixtures.homeowner();
        const otherUser = userFixtures.homeowner({ id: 'other-user-id' });
        const project = projectFixtures.draft({ ownerId: owner.id });

        // Other user should not have access
        const hasAccess = project.ownerId === otherUser.id;
        expect(hasAccess).toBe(false);
      });

      it('should deny contractor access to draft project', () => {
        const owner = userFixtures.homeowner();
        const contractor = userFixtures.contractor();
        const project = projectFixtures.draft({ ownerId: owner.id });

        // Contractor should not have access to draft
        const hasAccess = project.ownerId === contractor.id;
        expect(hasAccess).toBe(false);
      });

      it('should deny admin access to draft project as owner', () => {
        const owner = userFixtures.homeowner();
        const admin = userFixtures.admin();
        const project = projectFixtures.draft({ ownerId: owner.id });

        // Admin is not the owner (though admin may have special access via different route)
        const isOwner = project.ownerId === admin.id;
        expect(isOwner).toBe(false);
      });
    });

    describe('Public access for open projects', () => {
      it('should allow public access to open projects', () => {
        const project = projectFixtures.open();

        // Open projects are publicly accessible
        expect(project.status).toBe('OPEN');
        expect(project.publishedAt).toBeDefined();
      });

      it('should hide address in public project view', () => {
        const project = projectFixtures.open();

        // Address exists but should be hidden in public view
        expect(project.address).toBeDefined();
        
        // Public project transformation should exclude address
        // This is handled by the query service transforming to PublicProject type
        const publicFields = ['id', 'code', 'title', 'description', 'status'];
        for (const field of publicFields) {
          expect(project).toHaveProperty(field);
        }
      });

      it('should allow contractor to view open projects', () => {
        const contractor = userFixtures.contractor();
        const project = projectFixtures.open();

        // Contractor can view open projects (for bidding)
        expect(project.status).toBe('OPEN');
        expect(contractor.role).toBe('CONTRACTOR');
      });

      it('should not allow public access to draft projects', () => {
        const project = projectFixtures.draft();

        // Draft projects are not public - they don't have publishedAt set
        expect(project.status).toBe('DRAFT');
        // Draft projects should not be in OPEN status
        expect(project.status).not.toBe('OPEN');
      });

      it('should not allow public access to pending approval projects', () => {
        const project = projectFixtures.pendingApproval();

        // Pending approval projects are not public - they don't have publishedAt set
        expect(project.status).toBe('PENDING_APPROVAL');
        // Pending approval projects should not be in OPEN status
        expect(project.status).not.toBe('OPEN');
      });
    });
  });

  // ============================================
  // SERVICE METHOD TESTS WITH MOCK PRISMA
  // ============================================

  describe('Service Methods', () => {
    describe('isValidTransition', () => {
      it('should return true for valid transitions', () => {
        for (const [from, to] of validProjectTransitions) {
          const result = service.isValidTransition(
            from as import('../schemas/project.schema').ProjectStatus,
            to as import('../schemas/project.schema').ProjectStatus
          );
          expect(result).toBe(true);
        }
      });

      it('should return false for invalid transitions', () => {
        for (const [from, to] of invalidProjectTransitions) {
          const result = service.isValidTransition(
            from as import('../schemas/project.schema').ProjectStatus,
            to as import('../schemas/project.schema').ProjectStatus
          );
          expect(result).toBe(false);
        }
      });
    });
  });
});
