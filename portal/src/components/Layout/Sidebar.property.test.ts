/**
 * Property-Based Tests for Role-based Menu Items
 * Using fast-check for property testing
 *
 * **Feature: bidding-phase6-portal, Property 2: Role-based Menu Items**
 * **Validates: Requirements 3.2**
 *
 * Property: *For any* authenticated user, the sidebar should display menu items
 * appropriate for their role (HOMEOWNER or CONTRACTOR).
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import { getMenuItemsForRole, type MenuItem } from './Sidebar';
import type { UserRole } from '../../auth/AuthContext';

// ============================================
// EXPECTED MENU ITEMS BY ROLE
// ============================================

// Expected paths for homeowner role
const HOMEOWNER_EXPECTED_PATHS = [
  '/homeowner',
  '/homeowner/projects',
  '/homeowner/projects/new',
  '/homeowner/notifications',
];

// Expected paths for contractor role
const CONTRACTOR_EXPECTED_PATHS = [
  '/contractor',
  '/contractor/marketplace',
  '/contractor/my-bids',
  '/contractor/saved-projects',
  '/contractor/profile',
  '/contractor/notifications',
];

// ============================================
// GENERATORS
// ============================================

// User ID generator
const userIdArb = fc.uuid();

// Email generator
const emailArb = fc.emailAddress();

// Name generator
const nameArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

// Role generators
const homeownerRoleArb = fc.constant('HOMEOWNER' as UserRole);
const contractorRoleArb = fc.constant('CONTRACTOR' as UserRole);
const adminRoleArb = fc.constant('ADMIN' as UserRole);
const managerRoleArb = fc.constant('MANAGER' as UserRole);

// All valid roles
const allRolesArb = fc.oneof(
  homeownerRoleArb,
  contractorRoleArb,
  adminRoleArb,
  managerRoleArb
);

// User with specific role
const userWithRoleArb = (roleArb: fc.Arbitrary<UserRole>) =>
  fc.record({
    id: userIdArb,
    email: emailArb,
    name: nameArb,
    role: roleArb,
  });

// Homeowner user
const homeownerUserArb = userWithRoleArb(homeownerRoleArb);

// Contractor user
const contractorUserArb = userWithRoleArb(contractorRoleArb);

// Admin user
const adminUserArb = userWithRoleArb(adminRoleArb);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extracts paths from menu items
 */
function extractPaths(menuItems: MenuItem[]): string[] {
  return menuItems.map(item => item.path);
}

/**
 * Checks if all expected paths are present in menu items
 */
function hasAllExpectedPaths(menuItems: MenuItem[], expectedPaths: string[]): boolean {
  const actualPaths = extractPaths(menuItems);
  return expectedPaths.every(path => actualPaths.includes(path));
}

/**
 * Checks if menu items contain only paths from expected set
 */
function hasOnlyExpectedPaths(menuItems: MenuItem[], expectedPaths: string[]): boolean {
  const actualPaths = extractPaths(menuItems);
  return actualPaths.every(path => expectedPaths.includes(path));
}

/**
 * Checks if menu items don't contain paths from another role
 */
function doesNotContainOtherRolePaths(menuItems: MenuItem[], otherRolePaths: string[]): boolean {
  const actualPaths = extractPaths(menuItems);
  return !actualPaths.some(path => otherRolePaths.includes(path));
}

// ============================================
// PROPERTY 2: Role-based Menu Items
// **Feature: bidding-phase6-portal, Property 2: Role-based Menu Items**
// **Validates: Requirements 3.2**
// ============================================

describe('Property 2: Role-based Menu Items', () => {
  it('*For any* HOMEOWNER user, the sidebar should display homeowner-specific menu items', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        (user) => {
          const menuItems = getMenuItemsForRole(user.role);
          
          // Should have all expected homeowner paths
          const hasAllPaths = hasAllExpectedPaths(menuItems, HOMEOWNER_EXPECTED_PATHS);
          
          // Should only have homeowner paths
          const hasOnlyHomeownerPaths = hasOnlyExpectedPaths(menuItems, HOMEOWNER_EXPECTED_PATHS);
          
          // Should NOT have contractor paths
          const noContractorPaths = doesNotContainOtherRolePaths(menuItems, CONTRACTOR_EXPECTED_PATHS);
          
          return hasAllPaths && hasOnlyHomeownerPaths && noContractorPaths;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* CONTRACTOR user, the sidebar should display contractor-specific menu items', () => {
    fc.assert(
      fc.property(
        contractorUserArb,
        (user) => {
          const menuItems = getMenuItemsForRole(user.role);
          
          // Should have all expected contractor paths
          const hasAllPaths = hasAllExpectedPaths(menuItems, CONTRACTOR_EXPECTED_PATHS);
          
          // Should only have contractor paths
          const hasOnlyContractorPaths = hasOnlyExpectedPaths(menuItems, CONTRACTOR_EXPECTED_PATHS);
          
          // Should NOT have homeowner paths
          const noHomeownerPaths = doesNotContainOtherRolePaths(menuItems, HOMEOWNER_EXPECTED_PATHS);
          
          return hasAllPaths && hasOnlyContractorPaths && noHomeownerPaths;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* ADMIN user, the sidebar should display appropriate menu items (defaults to homeowner)', () => {
    fc.assert(
      fc.property(
        adminUserArb,
        (user) => {
          const menuItems = getMenuItemsForRole(user.role);
          
          // Admin defaults to homeowner menu items
          const hasAllPaths = hasAllExpectedPaths(menuItems, HOMEOWNER_EXPECTED_PATHS);
          const hasOnlyHomeownerPaths = hasOnlyExpectedPaths(menuItems, HOMEOWNER_EXPECTED_PATHS);
          
          return hasAllPaths && hasOnlyHomeownerPaths;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* undefined role, the sidebar should display empty menu items', () => {
    fc.assert(
      fc.property(
        fc.constant(undefined),
        (role) => {
          const menuItems = getMenuItemsForRole(role);
          
          // Should return empty array for undefined role
          return menuItems.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* user role, menu items should have required properties', () => {
    fc.assert(
      fc.property(
        allRolesArb,
        (role) => {
          const menuItems = getMenuItemsForRole(role);
          
          // Each menu item should have path, label, and icon
          return menuItems.every(item => 
            typeof item.path === 'string' &&
            item.path.length > 0 &&
            typeof item.label === 'string' &&
            item.label.length > 0 &&
            typeof item.icon === 'string' &&
            item.icon.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* user role, menu items should have unique paths', () => {
    fc.assert(
      fc.property(
        allRolesArb,
        (role) => {
          const menuItems = getMenuItemsForRole(role);
          const paths = extractPaths(menuItems);
          const uniquePaths = new Set(paths);
          
          // All paths should be unique
          return paths.length === uniquePaths.size;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* HOMEOWNER role, menu items should start with /homeowner prefix', () => {
    fc.assert(
      fc.property(
        homeownerRoleArb,
        (role) => {
          const menuItems = getMenuItemsForRole(role);
          
          // All paths should start with /homeowner
          return menuItems.every(item => item.path.startsWith('/homeowner'));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* CONTRACTOR role, menu items should start with /contractor prefix', () => {
    fc.assert(
      fc.property(
        contractorRoleArb,
        (role) => {
          const menuItems = getMenuItemsForRole(role);
          
          // All paths should start with /contractor
          return menuItems.every(item => item.path.startsWith('/contractor'));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// ROLE ISOLATION TESTS
// ============================================

describe('Role Isolation', () => {
  it('*For any* two different roles (HOMEOWNER vs CONTRACTOR), menu items should be completely different', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        contractorUserArb,
        (homeowner, contractor) => {
          const homeownerMenuItems = getMenuItemsForRole(homeowner.role);
          const contractorMenuItems = getMenuItemsForRole(contractor.role);
          
          const homeownerPaths = new Set(extractPaths(homeownerMenuItems));
          const contractorPaths = new Set(extractPaths(contractorMenuItems));
          
          // No overlap between homeowner and contractor paths
          const noOverlap = ![...homeownerPaths].some(path => contractorPaths.has(path));
          
          return noOverlap;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* role, getMenuItemsForRole should be deterministic (same input = same output)', () => {
    fc.assert(
      fc.property(
        allRolesArb,
        (role) => {
          const firstCall = getMenuItemsForRole(role);
          const secondCall = getMenuItemsForRole(role);
          
          // Same role should always return same menu items
          const samePaths = JSON.stringify(extractPaths(firstCall)) === JSON.stringify(extractPaths(secondCall));
          const sameLabels = JSON.stringify(firstCall.map(i => i.label)) === JSON.stringify(secondCall.map(i => i.label));
          
          return samePaths && sameLabels;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// MENU ITEM STRUCTURE TESTS
// ============================================

describe('Menu Item Structure', () => {
  it('*For any* role with menu items, first item should be Dashboard', () => {
    fc.assert(
      fc.property(
        fc.oneof(homeownerRoleArb, contractorRoleArb),
        (role) => {
          const menuItems = getMenuItemsForRole(role);
          
          if (menuItems.length === 0) return true;
          
          // First item should be Dashboard
          const firstItem = menuItems[0];
          return firstItem.label === 'Dashboard' && firstItem.icon === 'ri-dashboard-line';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* role, menu items should have valid icon class names', () => {
    fc.assert(
      fc.property(
        allRolesArb,
        (role) => {
          const menuItems = getMenuItemsForRole(role);
          
          // All icons should follow ri-*-line pattern (Remix Icon)
          return menuItems.every(item => 
            item.icon.startsWith('ri-') && item.icon.endsWith('-line')
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
