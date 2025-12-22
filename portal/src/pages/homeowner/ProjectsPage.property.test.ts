/**
 * Property-Based Tests for Project Ownership Filter and Status Filter
 * Using fast-check for property testing
 *
 * **Feature: bidding-phase6-portal, Property 4: Project Ownership Filter**
 * **Validates: Requirements 5.1**
 *
 * Property 4: *For any* homeowner viewing their projects, only projects they own
 * should be displayed.
 *
 * **Feature: bidding-phase6-portal, Property 5: Project Status Filter**
 * **Validates: Requirements 5.2**
 *
 * Property 5: *For any* project filter by status, only projects matching the
 * selected status should be returned.
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';

// ============================================
// TYPES (matching api.ts and ProjectsPage.tsx)
// ============================================

type ProjectStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'OPEN'
  | 'BIDDING_CLOSED'
  | 'MATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  ownerId: string;
  status: ProjectStatus;
  createdAt: string;
}

// User type is used for type documentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface User {
  id: string;
  email: string;
  name: string;
  role: 'HOMEOWNER' | 'CONTRACTOR' | 'ADMIN' | 'MANAGER';
}

// Tab status type matching ProjectsPage.tsx
type TabStatus = 'all' | 'draft' | 'active' | 'completed';

interface Tab {
  id: TabStatus;
  label: string;
  statuses: ProjectStatus[];
}

// Tab configuration matching ProjectsPage.tsx
const TABS: Tab[] = [
  { id: 'all', label: 'Tất cả', statuses: [] },
  { id: 'draft', label: 'Nháp', statuses: ['DRAFT', 'PENDING_APPROVAL', 'REJECTED'] },
  { id: 'active', label: 'Đang hoạt động', statuses: ['OPEN', 'BIDDING_CLOSED', 'MATCHED', 'IN_PROGRESS'] },
  { id: 'completed', label: 'Hoàn thành', statuses: ['COMPLETED', 'CANCELLED'] },
];

interface ProjectQuery {
  status?: ProjectStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ProjectListResult {
  data: Project[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// PROJECT OWNERSHIP FILTER LOGIC (isolated for testing)
// ============================================

/**
 * Pure function that filters projects by owner ID
 * This simulates the backend filtering logic from ProjectService.getByOwner
 *
 * Requirements: 5.1 - Return only projects owned by user
 */
function filterProjectsByOwner(
  allProjects: Project[],
  ownerId: string,
  query: ProjectQuery = {}
): ProjectListResult {
  // Filter by owner ID - this is the core ownership filter
  let filtered = allProjects.filter((project) => project.ownerId === ownerId);

  // Apply status filter if provided
  if (query.status) {
    filtered = filtered.filter((project) => project.status === query.status);
  }

  // Apply search filter if provided
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filtered = filtered.filter(
      (project) =>
        project.title.toLowerCase().includes(searchLower) ||
        project.code.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder || 'desc';
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof Project] ?? '';
    const bVal = b[sortBy as keyof Project] ?? '';
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Apply pagination
  const page = query.page || 1;
  const limit = query.limit || 10;
  const startIndex = (page - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    meta: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
}

// ============================================
// GENERATORS
// ============================================

// Project status generator
const projectStatusArb = fc.constantFrom<ProjectStatus>(
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'OPEN',
  'BIDDING_CLOSED',
  'MATCHED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

// User ID generator
const userIdArb = fc.uuid();

// Project code generator (format: PRJ-YYYY-NNN)
const projectCodeArb = fc
  .tuple(fc.integer({ min: 2020, max: 2030 }), fc.integer({ min: 1, max: 999 }))
  .map(([year, num]) => `PRJ-${year}-${String(num).padStart(3, '0')}`);

// Project title generator
const projectTitleArb = fc
  .string({ minLength: 5, maxLength: 100 })
  .filter((s) => s.trim().length >= 5);

// Project description generator
const projectDescriptionArb = fc
  .string({ minLength: 10, maxLength: 500 })
  .filter((s) => s.trim().length >= 10);

// ISO date string generator - use integer timestamp to avoid invalid date issues
const isoDateArb = fc
  .integer({
    min: new Date('2020-01-01').getTime(),
    max: new Date('2030-12-31').getTime(),
  })
  .map((timestamp) => new Date(timestamp).toISOString());

// Single project generator with specific owner (used in some test scenarios)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const projectWithOwnerArb = (ownerId: string) =>
  fc.record({
    id: fc.uuid(),
    code: projectCodeArb,
    title: projectTitleArb,
    description: projectDescriptionArb,
    ownerId: fc.constant(ownerId),
    status: projectStatusArb,
    createdAt: isoDateArb,
  });

// Single project generator with random owner
const projectArb = fc.record({
  id: fc.uuid(),
  code: projectCodeArb,
  title: projectTitleArb,
  description: projectDescriptionArb,
  ownerId: userIdArb,
  status: projectStatusArb,
  createdAt: isoDateArb,
});

// User generator
const homeownerUserArb = fc.record({
  id: userIdArb,
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  role: fc.constant('HOMEOWNER' as const),
});

// Project query generator
const projectQueryArb = fc.record({
  status: fc.option(projectStatusArb, { nil: undefined }),
  search: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  page: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
  limit: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
  sortBy: fc.option(fc.constantFrom('createdAt', 'title', 'code'), { nil: undefined }),
  sortOrder: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
});

// ============================================
// PROPERTY 4: Project Ownership Filter
// **Feature: bidding-phase6-portal, Property 4: Project Ownership Filter**
// **Validates: Requirements 5.1**
// ============================================

describe('Property 4: Project Ownership Filter', () => {
  it('*For any* homeowner viewing their projects, only projects they own should be displayed', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        fc.array(projectArb, { minLength: 0, maxLength: 50 }),
        projectQueryArb,
        (user, allProjects, query) => {
          const result = filterProjectsByOwner(allProjects, user.id, query);

          // CORE PROPERTY: All returned projects must be owned by the user
          const allOwnedByUser = result.data.every((project) => project.ownerId === user.id);

          return allOwnedByUser;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* homeowner, projects owned by other users should never appear in results', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        userIdArb, // Another user's ID
        fc.array(projectArb, { minLength: 1, maxLength: 30 }),
        (user, otherUserId, allProjects) => {
          // Ensure we have projects from both users
          const projectsWithMixedOwners = allProjects.map((p, i) => ({
            ...p,
            ownerId: i % 2 === 0 ? user.id : otherUserId,
          }));

          const result = filterProjectsByOwner(projectsWithMixedOwners, user.id);

          // No projects from other users should appear
          const noOtherUserProjects = result.data.every((project) => project.ownerId !== otherUserId);

          // All projects should be owned by the requesting user
          const allOwnedByUser = result.data.every((project) => project.ownerId === user.id);

          return noOtherUserProjects && allOwnedByUser;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* homeowner with projects, all their projects should be included (before pagination)', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        fc.integer({ min: 1, max: 20 }),
        fc.array(projectArb, { minLength: 0, maxLength: 30 }),
        (user, ownedCount, otherProjects) => {
          // Create specific number of projects owned by user
          const userProjects: Project[] = Array.from({ length: ownedCount }, (_, i) => ({
            id: `user-project-${i}`,
            code: `PRJ-2024-${String(i + 1).padStart(3, '0')}`,
            title: `User Project ${i}`,
            description: `Description for project ${i}`,
            ownerId: user.id,
            status: 'DRAFT' as ProjectStatus,
            createdAt: new Date().toISOString(),
          }));

          // Mix with other projects
          const allProjects = [...userProjects, ...otherProjects];

          // Query with high limit to get all results
          const result = filterProjectsByOwner(allProjects, user.id, { limit: 1000 });

          // Total should match the number of user's projects
          return result.meta.total === ownedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* homeowner with no projects, result should be empty', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        fc.array(projectArb, { minLength: 0, maxLength: 20 }),
        (user, allProjects) => {
          // Ensure no projects are owned by this user
          const projectsWithoutUser = allProjects.map((p) => ({
            ...p,
            ownerId: p.ownerId === user.id ? `other-${p.ownerId}` : p.ownerId,
          }));

          const result = filterProjectsByOwner(projectsWithoutUser, user.id);

          return result.data.length === 0 && result.meta.total === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* status filter, ownership filter should still apply', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        projectStatusArb,
        fc.array(projectArb, { minLength: 1, maxLength: 30 }),
        (user, statusFilter, allProjects) => {
          // Create mixed projects with various statuses and owners
          const mixedProjects = allProjects.map((p, i) => ({
            ...p,
            ownerId: i % 3 === 0 ? user.id : p.ownerId,
          }));

          const result = filterProjectsByOwner(mixedProjects, user.id, { status: statusFilter });

          // All returned projects must be owned by user AND match status
          const allValid = result.data.every(
            (project) => project.ownerId === user.id && project.status === statusFilter
          );

          return allValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* search query, ownership filter should still apply', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.array(projectArb, { minLength: 1, maxLength: 30 }),
        (user, searchTerm, allProjects) => {
          // Create mixed projects
          const mixedProjects = allProjects.map((p, i) => ({
            ...p,
            ownerId: i % 2 === 0 ? user.id : p.ownerId,
            title: i % 4 === 0 ? `${searchTerm} Project` : p.title,
          }));

          const result = filterProjectsByOwner(mixedProjects, user.id, { search: searchTerm });

          // All returned projects must be owned by user
          const allOwnedByUser = result.data.every((project) => project.ownerId === user.id);

          return allOwnedByUser;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PAGINATION WITH OWNERSHIP TESTS
// ============================================

describe('Pagination with Ownership Filter', () => {
  it('*For any* pagination parameters, ownership filter should apply before pagination', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        fc.array(projectArb, { minLength: 10, maxLength: 50 }),
        (user, page, limit, allProjects) => {
          // Create projects with mixed ownership
          const mixedProjects = allProjects.map((p, i) => ({
            ...p,
            ownerId: i % 2 === 0 ? user.id : `other-user-${i}`,
          }));

          const result = filterProjectsByOwner(mixedProjects, user.id, { page, limit });

          // All returned projects must be owned by user
          const allOwnedByUser = result.data.every((project) => project.ownerId === user.id);

          // Pagination should work correctly
          const correctPageSize = result.data.length <= limit;

          return allOwnedByUser && correctPageSize;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* homeowner, total count should reflect only their projects', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        fc.integer({ min: 5, max: 30 }),
        fc.integer({ min: 5, max: 30 }),
        (user, userProjectCount, otherProjectCount) => {
          // Create specific number of projects for user
          const userProjects: Project[] = Array.from({ length: userProjectCount }, (_, i) => ({
            id: `user-${i}`,
            code: `PRJ-2024-${String(i + 1).padStart(3, '0')}`,
            title: `User Project ${i}`,
            description: `Description ${i}`,
            ownerId: user.id,
            status: 'DRAFT' as ProjectStatus,
            createdAt: new Date().toISOString(),
          }));

          // Create projects for other users
          const otherProjects: Project[] = Array.from({ length: otherProjectCount }, (_, i) => ({
            id: `other-${i}`,
            code: `PRJ-2024-${String(i + 100).padStart(3, '0')}`,
            title: `Other Project ${i}`,
            description: `Description ${i}`,
            ownerId: `other-user-${i}`,
            status: 'DRAFT' as ProjectStatus,
            createdAt: new Date().toISOString(),
          }));

          const allProjects = [...userProjects, ...otherProjects];
          const result = filterProjectsByOwner(allProjects, user.id, { limit: 1000 });

          // Total should only count user's projects
          return result.meta.total === userProjectCount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('Project Ownership Edge Cases', () => {
  it('should handle empty project list', () => {
    fc.assert(
      fc.property(homeownerUserArb, (user) => {
        const result = filterProjectsByOwner([], user.id);

        return result.data.length === 0 && result.meta.total === 0 && result.meta.totalPages === 0;
      }),
      { numRuns: 50 }
    );
  });

  it('should handle user ID that matches no projects', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 20 }),
        (projects) => {
          const nonExistentUserId = 'non-existent-user-id-12345';

          // Ensure no project has this owner ID
          const projectsWithoutUser = projects.map((p) => ({
            ...p,
            ownerId: p.ownerId === nonExistentUserId ? 'other-id' : p.ownerId,
          }));

          const result = filterProjectsByOwner(projectsWithoutUser, nonExistentUserId);

          return result.data.length === 0 && result.meta.total === 0;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should be deterministic - same input produces same output', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        fc.array(projectArb, { minLength: 1, maxLength: 20 }),
        projectQueryArb,
        (user, projects, query) => {
          const result1 = filterProjectsByOwner(projects, user.id, query);
          const result2 = filterProjectsByOwner(projects, user.id, query);

          // Same input should produce same output
          const sameData = JSON.stringify(result1.data) === JSON.stringify(result2.data);
          const sameMeta = JSON.stringify(result1.meta) === JSON.stringify(result2.meta);

          return sameData && sameMeta;
        }
      ),
      { numRuns: 50 }
    );
  });
});


// ============================================
// PROJECT STATUS FILTER LOGIC (isolated for testing)
// ============================================

/**
 * Pure function that filters projects by status
 * This simulates the filtering logic from ProjectsPage.tsx
 *
 * Requirements: 5.2 - Filter by status
 */
function filterProjectsByStatus(
  projects: Project[],
  statusFilter?: ProjectStatus
): Project[] {
  if (!statusFilter) {
    return projects;
  }
  return projects.filter((project) => project.status === statusFilter);
}

/**
 * Pure function that filters projects by tab (multiple statuses)
 * This simulates the tab filtering logic from ProjectsPage.tsx
 *
 * Requirements: 5.2 - Filter by status tabs
 */
function filterProjectsByTab(
  projects: Project[],
  tabId: TabStatus
): Project[] {
  const tab = TABS.find((t) => t.id === tabId);
  if (!tab || tab.statuses.length === 0) {
    // 'all' tab returns all projects
    return projects;
  }
  return projects.filter((project) => tab.statuses.includes(project.status));
}

// ============================================
// ADDITIONAL GENERATORS FOR PROPERTY 5
// ============================================

// Tab status generator
const tabStatusArb = fc.constantFrom<TabStatus>('all', 'draft', 'active', 'completed');

// ============================================
// PROPERTY 5: Project Status Filter
// **Feature: bidding-phase6-portal, Property 5: Project Status Filter**
// **Validates: Requirements 5.2**
// ============================================

describe('Property 5: Project Status Filter', () => {
  it('*For any* project filter by status, only projects matching the selected status should be returned', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 0, maxLength: 50 }),
        projectStatusArb,
        (projects, statusFilter) => {
          const result = filterProjectsByStatus(projects, statusFilter);

          // CORE PROPERTY: All returned projects must match the status filter
          const allMatchStatus = result.every((project) => project.status === statusFilter);

          return allMatchStatus;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* status filter, no projects with different status should appear in results', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        projectStatusArb,
        (projects, statusFilter) => {
          const result = filterProjectsByStatus(projects, statusFilter);

          // No projects with different status should appear
          const noDifferentStatus = result.every((project) => project.status === statusFilter);

          return noDifferentStatus;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* status filter, all projects with matching status should be included', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        projectStatusArb,
        (projects, statusFilter) => {
          const result = filterProjectsByStatus(projects, statusFilter);

          // Count projects with matching status in original list
          const expectedCount = projects.filter((p) => p.status === statusFilter).length;

          // Result should contain all matching projects
          return result.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* empty status filter, all projects should be returned', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 0, maxLength: 50 }),
        (projects) => {
          const result = filterProjectsByStatus(projects, undefined);

          // All projects should be returned when no filter
          return result.length === projects.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* status with no matching projects, result should be empty', () => {
    fc.assert(
      fc.property(
        projectStatusArb,
        fc.array(projectArb, { minLength: 1, maxLength: 30 }),
        (targetStatus, projects) => {
          // Ensure no projects have the target status
          const projectsWithoutTargetStatus = projects.map((p) => ({
            ...p,
            status: p.status === targetStatus ? 'DRAFT' as ProjectStatus : p.status,
          })).filter((p) => p.status !== targetStatus);

          // If we filtered out all projects, skip this test case
          if (projectsWithoutTargetStatus.length === 0) {
            return true;
          }

          const result = filterProjectsByStatus(projectsWithoutTargetStatus, targetStatus);

          return result.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// TAB-BASED STATUS FILTERING (Multiple Statuses)
// **Feature: bidding-phase6-portal, Property 5: Project Status Filter**
// **Validates: Requirements 5.2**
// ============================================

describe('Property 5: Tab-based Status Filter', () => {
  it('*For any* tab filter, only projects with statuses in that tab should be returned', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 0, maxLength: 50 }),
        tabStatusArb,
        (projects, tabId) => {
          const result = filterProjectsByTab(projects, tabId);
          const tab = TABS.find((t) => t.id === tabId);

          if (!tab || tab.statuses.length === 0) {
            // 'all' tab should return all projects
            return result.length === projects.length;
          }

          // All returned projects must have status in tab's statuses
          const allMatchTab = result.every((project) => tab.statuses.includes(project.status));

          return allMatchTab;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* draft tab, only DRAFT, PENDING_APPROVAL, REJECTED projects should appear', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        (projects) => {
          const result = filterProjectsByTab(projects, 'draft');
          const draftStatuses: ProjectStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'REJECTED'];

          // All returned projects must be in draft statuses
          const allDraft = result.every((project) => draftStatuses.includes(project.status));

          // Count expected projects
          const expectedCount = projects.filter((p) => draftStatuses.includes(p.status)).length;

          return allDraft && result.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* active tab, only OPEN, BIDDING_CLOSED, MATCHED, IN_PROGRESS projects should appear', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        (projects) => {
          const result = filterProjectsByTab(projects, 'active');
          const activeStatuses: ProjectStatus[] = ['OPEN', 'BIDDING_CLOSED', 'MATCHED', 'IN_PROGRESS'];

          // All returned projects must be in active statuses
          const allActive = result.every((project) => activeStatuses.includes(project.status));

          // Count expected projects
          const expectedCount = projects.filter((p) => activeStatuses.includes(p.status)).length;

          return allActive && result.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* completed tab, only COMPLETED, CANCELLED projects should appear', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        (projects) => {
          const result = filterProjectsByTab(projects, 'completed');
          const completedStatuses: ProjectStatus[] = ['COMPLETED', 'CANCELLED'];

          // All returned projects must be in completed statuses
          const allCompleted = result.every((project) => completedStatuses.includes(project.status));

          // Count expected projects
          const expectedCount = projects.filter((p) => completedStatuses.includes(p.status)).length;

          return allCompleted && result.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* all tab, all projects should be returned regardless of status', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 0, maxLength: 50 }),
        (projects) => {
          const result = filterProjectsByTab(projects, 'all');

          // All projects should be returned
          return result.length === projects.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* tab, projects should be mutually exclusive across tabs (except all)', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        (projects) => {
          const draftResult = filterProjectsByTab(projects, 'draft');
          const activeResult = filterProjectsByTab(projects, 'active');
          const completedResult = filterProjectsByTab(projects, 'completed');

          // No overlap between tabs
          const draftIds = new Set(draftResult.map((p) => p.id));
          const activeIds = new Set(activeResult.map((p) => p.id));
          const completedIds = new Set(completedResult.map((p) => p.id));

          const noOverlapDraftActive = [...draftIds].every((id) => !activeIds.has(id));
          const noOverlapDraftCompleted = [...draftIds].every((id) => !completedIds.has(id));
          const noOverlapActiveCompleted = [...activeIds].every((id) => !completedIds.has(id));

          // Sum of all tabs should equal total projects
          const totalInTabs = draftResult.length + activeResult.length + completedResult.length;

          return noOverlapDraftActive && noOverlapDraftCompleted && noOverlapActiveCompleted && totalInTabs === projects.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// COMBINED OWNERSHIP AND STATUS FILTER
// ============================================

describe('Combined Ownership and Status Filter', () => {
  it('*For any* homeowner with status filter, both filters should apply', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        projectStatusArb,
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        (user, statusFilter, allProjects) => {
          // Create mixed projects
          const mixedProjects = allProjects.map((p, i) => ({
            ...p,
            ownerId: i % 2 === 0 ? user.id : `other-user-${i}`,
          }));

          const result = filterProjectsByOwner(mixedProjects, user.id, { status: statusFilter });

          // All returned projects must be owned by user AND match status
          const allValid = result.data.every(
            (project) => project.ownerId === user.id && project.status === statusFilter
          );

          return allValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* homeowner with tab filter, ownership and tab filters should both apply', () => {
    fc.assert(
      fc.property(
        homeownerUserArb,
        tabStatusArb,
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        (user, tabId, allProjects) => {
          // Create mixed projects
          const mixedProjects = allProjects.map((p, i) => ({
            ...p,
            ownerId: i % 2 === 0 ? user.id : `other-user-${i}`,
          }));

          // First filter by owner
          const ownerFiltered = filterProjectsByOwner(mixedProjects, user.id, { limit: 1000 });
          // Then filter by tab
          const result = filterProjectsByTab(ownerFiltered.data, tabId);

          const tab = TABS.find((t) => t.id === tabId);

          // All returned projects must be owned by user
          const allOwnedByUser = result.every((project) => project.ownerId === user.id);

          // All returned projects must match tab statuses (if not 'all')
          const allMatchTab = !tab || tab.statuses.length === 0 || result.every((project) => tab.statuses.includes(project.status));

          return allOwnedByUser && allMatchTab;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// STATUS FILTER EDGE CASES
// ============================================

describe('Status Filter Edge Cases', () => {
  it('should handle empty project list with status filter', () => {
    fc.assert(
      fc.property(projectStatusArb, (statusFilter) => {
        const result = filterProjectsByStatus([], statusFilter);

        return result.length === 0;
      }),
      { numRuns: 50 }
    );
  });

  it('should handle empty project list with tab filter', () => {
    fc.assert(
      fc.property(tabStatusArb, (tabId) => {
        const result = filterProjectsByTab([], tabId);

        return result.length === 0;
      }),
      { numRuns: 50 }
    );
  });

  it('status filter should be deterministic - same input produces same output', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 30 }),
        projectStatusArb,
        (projects, statusFilter) => {
          const result1 = filterProjectsByStatus(projects, statusFilter);
          const result2 = filterProjectsByStatus(projects, statusFilter);

          // Same input should produce same output
          return JSON.stringify(result1) === JSON.stringify(result2);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('tab filter should be deterministic - same input produces same output', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 30 }),
        tabStatusArb,
        (projects, tabId) => {
          const result1 = filterProjectsByTab(projects, tabId);
          const result2 = filterProjectsByTab(projects, tabId);

          // Same input should produce same output
          return JSON.stringify(result1) === JSON.stringify(result2);
        }
      ),
      { numRuns: 50 }
    );
  });
});
