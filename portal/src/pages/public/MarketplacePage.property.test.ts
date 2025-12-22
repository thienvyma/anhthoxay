/**
 * Property-Based Tests for Public Marketplace
 * Using fast-check for property testing
 *
 * **Feature: bidding-phase6-portal, Property 9: Public Filter Support**
 * **Validates: Requirements 13.4**
 *
 * Property 9: *For any* public marketplace filter, filtering by region and category
 * should return matching projects.
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';

// ============================================
// TYPES (matching api.ts and MarketplacePage.tsx)
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

interface Region {
  id: string;
  name: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  status: ProjectStatus;
  region?: Region;
  regionId?: string;
  category?: ServiceCategory;
  categoryId?: string;
  budgetMin?: number;
  budgetMax?: number;
  createdAt: string;
}

interface MarketplaceQuery {
  page?: number;
  limit?: number;
  regionId?: string;
  categoryId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface MarketplaceResult {
  data: Project[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// PUBLIC MARKETPLACE FILTER LOGIC (isolated for testing)
// ============================================

/**
 * Pure function that filters projects for public marketplace display.
 * Only OPEN status projects should be shown.
 * Supports filtering by region and category.
 *
 * Requirements: 13.1, 13.4 - Only OPEN status projects with filter support
 */
function filterPublicMarketplaceProjects(
  allProjects: Project[],
  query: MarketplaceQuery = {}
): MarketplaceResult {
  // CORE FILTER: Only OPEN status projects (Requirement 13.1)
  let filtered = allProjects.filter((project) => project.status === 'OPEN');

  // Apply region filter (Requirement 13.4)
  if (query.regionId) {
    filtered = filtered.filter((project) => project.regionId === query.regionId);
  }

  // Apply category filter (Requirement 13.4)
  if (query.categoryId) {
    filtered = filtered.filter((project) => project.categoryId === query.categoryId);
  }

  // Apply search filter
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
  const limit = query.limit || 12;
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

// Project code generator
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

// ISO date string generator
const isoDateArb = fc
  .integer({
    min: new Date('2020-01-01').getTime(),
    max: new Date('2030-12-31').getTime(),
  })
  .map((timestamp) => new Date(timestamp).toISOString());

// Region generator
const regionArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
});

// Category generator
const categoryArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
});

// Project generator with random status
const projectArb = fc.record({
  id: fc.uuid(),
  code: projectCodeArb,
  title: projectTitleArb,
  description: projectDescriptionArb,
  status: projectStatusArb,
  region: fc.option(regionArb, { nil: undefined }),
  regionId: fc.option(fc.uuid(), { nil: undefined }),
  category: fc.option(categoryArb, { nil: undefined }),
  categoryId: fc.option(fc.uuid(), { nil: undefined }),
  budgetMin: fc.option(fc.integer({ min: 1000000, max: 100000000 }), { nil: undefined }),
  budgetMax: fc.option(fc.integer({ min: 10000000, max: 500000000 }), { nil: undefined }),
  createdAt: isoDateArb,
});

// Project with OPEN status
const openProjectArb = projectArb.map((p) => ({ ...p, status: 'OPEN' as ProjectStatus }));

// Marketplace query generator
const marketplaceQueryArb = fc.record({
  page: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
  limit: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
  regionId: fc.option(fc.uuid(), { nil: undefined }),
  categoryId: fc.option(fc.uuid(), { nil: undefined }),
  search: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  sortBy: fc.option(fc.constantFrom('createdAt', 'title', 'budgetMax'), { nil: undefined }),
  sortOrder: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
});

// ============================================
// PROPERTY 9: Public Filter Support
// **Feature: bidding-phase6-portal, Property 9: Public Filter Support**
// **Validates: Requirements 13.4**
// ============================================

describe('Property 9: Public Filter Support', () => {
  it('*For any* region filter, only OPEN projects in that region should appear', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        fc.uuid(),
        (projects, regionId) => {
          // Assign some projects to the target region
          const projectsWithRegion = projects.map((p, i) => ({
            ...p,
            regionId: i % 3 === 0 ? regionId : p.regionId,
          }));

          const result = filterPublicMarketplaceProjects(projectsWithRegion, { regionId });

          // All results must be OPEN AND in the specified region
          const allValid = result.data.every(
            (project) => project.status === 'OPEN' && project.regionId === regionId
          );

          return allValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* category filter, only OPEN projects in that category should appear', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        fc.uuid(),
        (projects, categoryId) => {
          // Assign some projects to the target category
          const projectsWithCategory = projects.map((p, i) => ({
            ...p,
            categoryId: i % 3 === 0 ? categoryId : p.categoryId,
          }));

          const result = filterPublicMarketplaceProjects(projectsWithCategory, { categoryId });

          // All results must be OPEN AND in the specified category
          const allValid = result.data.every(
            (project) => project.status === 'OPEN' && project.categoryId === categoryId
          );

          return allValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* combined region and category filter, only matching OPEN projects should appear', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        fc.uuid(),
        fc.uuid(),
        (projects, regionId, categoryId) => {
          // Assign some projects to both target region and category
          const projectsWithFilters = projects.map((p, i) => ({
            ...p,
            regionId: i % 2 === 0 ? regionId : p.regionId,
            categoryId: i % 3 === 0 ? categoryId : p.categoryId,
          }));

          const result = filterPublicMarketplaceProjects(projectsWithFilters, {
            regionId,
            categoryId,
          });

          // All results must be OPEN AND match both filters
          const allValid = result.data.every(
            (project) =>
              project.status === 'OPEN' &&
              project.regionId === regionId &&
              project.categoryId === categoryId
          );

          return allValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* filter combination, OPEN status filter should always apply', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        marketplaceQueryArb,
        (projects, query) => {
          const result = filterPublicMarketplaceProjects(projects, query);

          // Regardless of other filters, all results must be OPEN
          return result.data.every((project) => project.status === 'OPEN');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* region filter with no matching projects, result should be empty', () => {
    fc.assert(
      fc.property(
        fc.array(openProjectArb, { minLength: 1, maxLength: 30 }),
        fc.uuid(),
        (projects, nonExistentRegionId) => {
          // Ensure no project has the target region
          const projectsWithoutRegion = projects.map((p) => ({
            ...p,
            regionId: p.regionId === nonExistentRegionId ? undefined : p.regionId,
          }));

          const result = filterPublicMarketplaceProjects(projectsWithoutRegion, {
            regionId: nonExistentRegionId,
          });

          // Should return empty results
          return result.data.length === 0 && result.meta.total === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* category filter with no matching projects, result should be empty', () => {
    fc.assert(
      fc.property(
        fc.array(openProjectArb, { minLength: 1, maxLength: 30 }),
        fc.uuid(),
        (projects, nonExistentCategoryId) => {
          // Ensure no project has the target category
          const projectsWithoutCategory = projects.map((p) => ({
            ...p,
            categoryId: p.categoryId === nonExistentCategoryId ? undefined : p.categoryId,
          }));

          const result = filterPublicMarketplaceProjects(projectsWithoutCategory, {
            categoryId: nonExistentCategoryId,
          });

          // Should return empty results
          return result.data.length === 0 && result.meta.total === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* search query, only matching OPEN projects should appear', () => {
    fc.assert(
      fc.property(
        fc.array(openProjectArb, { minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 3, maxLength: 10 }).filter((s) => s.trim().length >= 3),
        (projects, searchTerm) => {
          // Add search term to some project titles
          const projectsWithSearchTerm = projects.map((p, i) => ({
            ...p,
            title: i % 2 === 0 ? `${searchTerm} ${p.title}` : p.title,
          }));

          const result = filterPublicMarketplaceProjects(projectsWithSearchTerm, {
            search: searchTerm,
          });

          // All results must contain the search term in title, code, or description
          const searchLower = searchTerm.toLowerCase();
          const allMatch = result.data.every(
            (project) =>
              project.title.toLowerCase().includes(searchLower) ||
              project.code.toLowerCase().includes(searchLower) ||
              project.description.toLowerCase().includes(searchLower)
          );

          return allMatch;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* filter, result count should match filtered projects', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 50 }),
        fc.uuid(),
        (projects, regionId) => {
          // Assign some projects to the target region
          const projectsWithRegion = projects.map((p, i) => ({
            ...p,
            regionId: i % 3 === 0 ? regionId : p.regionId,
          }));

          const result = filterPublicMarketplaceProjects(projectsWithRegion, {
            regionId,
            limit: 1000, // High limit to get all results
          });

          // Count expected matches
          const expectedCount = projectsWithRegion.filter(
            (p) => p.status === 'OPEN' && p.regionId === regionId
          ).length;

          return result.meta.total === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('Public Marketplace Filter Edge Cases', () => {
  it('should handle empty project list with any filter', () => {
    fc.assert(
      fc.property(marketplaceQueryArb, (query) => {
        const result = filterPublicMarketplaceProjects([], query);

        return result.data.length === 0 && result.meta.total === 0;
      }),
      { numRuns: 50 }
    );
  });

  it('should be deterministic - same input produces same output', () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 20 }),
        marketplaceQueryArb,
        (projects, query) => {
          const result1 = filterPublicMarketplaceProjects(projects, query);
          const result2 = filterPublicMarketplaceProjects(projects, query);

          const sameData = JSON.stringify(result1.data) === JSON.stringify(result2.data);
          const sameMeta = JSON.stringify(result1.meta) === JSON.stringify(result2.meta);

          return sameData && sameMeta;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('pagination should work correctly with filters', () => {
    fc.assert(
      fc.property(
        fc.array(openProjectArb, { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        (projects, page, limit) => {
          const result = filterPublicMarketplaceProjects(projects, { page, limit });

          // Page size should be correct
          const correctPageSize = result.data.length <= limit;

          // All results should still be OPEN
          const allOpen = result.data.every((p) => p.status === 'OPEN');

          return correctPageSize && allOpen;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle undefined filter values gracefully', () => {
    fc.assert(
      fc.property(
        fc.array(openProjectArb, { minLength: 1, maxLength: 20 }),
        (projects) => {
          const result = filterPublicMarketplaceProjects(projects, {
            regionId: undefined,
            categoryId: undefined,
            search: undefined,
          });

          // Should return all OPEN projects
          const expectedCount = projects.filter((p) => p.status === 'OPEN').length;
          return result.meta.total === expectedCount;
        }
      ),
      { numRuns: 50 }
    );
  });
});
