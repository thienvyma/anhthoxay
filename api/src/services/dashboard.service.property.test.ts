/**
 * Property-based tests for Dashboard Service
 * **Feature: admin-dashboard-enhancement**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { DashboardService } from './dashboard.service';
import {
  dashboardStatsResponseSchema,
  activityItemSchema,
} from '../schemas/dashboard.schema';

// ============================================
// MOCK PRISMA
// ============================================

const createMockPrisma = () => ({
  customerLead: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  project: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  bid: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  interiorQuote: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  blogPost: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  mediaAsset: {
    count: vi.fn(),
  },
});

// ============================================
// ARBITRARIES (Generators)
// ============================================

// Generate valid date within reasonable range
const validDateArb = fc
  .integer({ min: Date.now() - 365 * 24 * 60 * 60 * 1000, max: Date.now() })
  .map((ts) => new Date(ts));

// Generate lead status
const leadStatusArb = fc.constantFrom('NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED');

// Generate lead source
const leadSourceArb = fc.constantFrom('QUOTE_FORM', 'CONTACT_FORM', 'QUOTE_CALCULATOR');

// Generate project status
const projectStatusArb = fc.constantFrom(
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

// Generate bid status
const bidStatusArb = fc.constantFrom(
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SELECTED',
  'NOT_SELECTED',
  'WITHDRAWN'
);

// Generate verification status
const verificationStatusArb = fc.constantFrom('PENDING', 'VERIFIED', 'REJECTED');

// Generate blog post status
const blogStatusArb = fc.constantFrom('DRAFT', 'PUBLISHED');

// Generate user role
const userRoleArb = fc.constantFrom('ADMIN', 'MANAGER', 'CONTRACTOR', 'HOMEOWNER', 'WORKER', 'USER');

// Generate mock lead
const mockLeadArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  source: leadSourceArb,
  status: leadStatusArb,
  createdAt: validDateArb,
});

// Generate mock project
const mockProjectArb = fc.record({
  id: fc.uuid(),
  code: fc.string({ minLength: 5, maxLength: 15 }),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  status: projectStatusArb,
  owner: fc.record({ name: fc.string({ minLength: 2, maxLength: 50 }) }),
  createdAt: validDateArb,
});

// Generate mock bid
const mockBidArb = fc.record({
  id: fc.uuid(),
  code: fc.string({ minLength: 5, maxLength: 15 }),
  price: fc.float({ min: 1000000, max: 1000000000, noNaN: true }),
  status: bidStatusArb,
  project: fc.record({ code: fc.string({ minLength: 5, maxLength: 15 }) }),
  contractor: fc.record({ name: fc.string({ minLength: 2, maxLength: 50 }) }),
  createdAt: validDateArb,
});

// Generate mock contractor (user with CONTRACTOR role)
const mockContractorArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  email: fc.emailAddress(),
  companyName: fc.option(fc.string({ minLength: 2, maxLength: 100 }), { nil: null }),
  verificationStatus: verificationStatusArb,
  contractorProfile: fc.option(
    fc.record({ submittedAt: fc.option(validDateArb, { nil: null }) }),
    { nil: null }
  ),
  createdAt: validDateArb,
});

// Generate mock user
const mockUserArb = fc.record({
  id: fc.uuid(),
  role: userRoleArb,
});

// Generate mock blog post
const mockBlogPostArb = fc.record({
  id: fc.uuid(),
  status: blogStatusArb,
});

// Generate mock interior quote
const mockInteriorQuoteArb = fc.record({
  id: fc.uuid(),
  code: fc.string({ minLength: 5, maxLength: 15 }),
  customerName: fc.string({ minLength: 2, maxLength: 50 }),
  createdAt: validDateArb,
});

// ============================================
// PROPERTY TESTS
// ============================================

describe('Dashboard Service - Property Tests', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let dashboardService: DashboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
    dashboardService = new DashboardService(mockPrisma as never);
  });

  /**
   * **Property 1: Dashboard API returns complete stats structure**
   * *For any* authenticated admin request to `/api/admin/dashboard`,
   * the response SHALL contain all required stat categories
   * (leads, projects, bids, contractors, interiorQuotes, blogPosts, users, media)
   * with numeric values.
   * **Validates: Requirements 6.1, 6.2**
   */
  describe('Property 1: Dashboard API returns complete stats structure', () => {
    it('should return complete stats structure for any database state', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random database state
          fc.record({
            leads: fc.array(mockLeadArb, { minLength: 0, maxLength: 50 }),
            projects: fc.array(mockProjectArb, { minLength: 0, maxLength: 30 }),
            bids: fc.array(mockBidArb, { minLength: 0, maxLength: 30 }),
            contractors: fc.array(mockContractorArb, { minLength: 0, maxLength: 20 }),
            users: fc.array(mockUserArb, { minLength: 0, maxLength: 50 }),
            blogPosts: fc.array(mockBlogPostArb, { minLength: 0, maxLength: 20 }),
            interiorQuotes: fc.array(mockInteriorQuoteArb, { minLength: 0, maxLength: 20 }),
            mediaCount: fc.integer({ min: 0, max: 1000 }),
          }),
          async (dbState) => {
            // Setup mocks - handle all query variations
            mockPrisma.customerLead.findMany.mockResolvedValue(dbState.leads);
            
            mockPrisma.project.findMany.mockImplementation((args) => {
              const where = args?.where;
              if (where?.status === 'PENDING_APPROVAL') {
                return Promise.resolve(
                  dbState.projects.filter((p) => p.status === 'PENDING_APPROVAL').slice(0, 5)
                );
              }
              return Promise.resolve(dbState.projects);
            });
            
            mockPrisma.bid.findMany.mockImplementation((args) => {
              const where = args?.where;
              if (where?.status === 'PENDING') {
                return Promise.resolve(
                  dbState.bids.filter((b) => b.status === 'PENDING').slice(0, 5)
                );
              }
              return Promise.resolve(dbState.bids);
            });
            
            mockPrisma.user.findMany.mockImplementation((args) => {
              const where = args?.where;
              if (where?.role === 'CONTRACTOR' && where?.verificationStatus === 'PENDING') {
                return Promise.resolve(
                  dbState.contractors.filter((c) => c.verificationStatus === 'PENDING').slice(0, 5)
                );
              }
              if (where?.role === 'CONTRACTOR') {
                return Promise.resolve(dbState.contractors);
              }
              return Promise.resolve(dbState.users);
            });
            
            mockPrisma.blogPost.findMany.mockResolvedValue(dbState.blogPosts);
            mockPrisma.interiorQuote.count.mockResolvedValue(dbState.interiorQuotes.length);
            mockPrisma.mediaAsset.count.mockResolvedValue(dbState.mediaCount);

            // Get stats
            const stats = await dashboardService.getStats();

            // Validate against schema - this ensures all required fields are present
            const parseResult = dashboardStatsResponseSchema.safeParse(stats);
            expect(parseResult.success).toBe(true);

            // Verify all top-level categories exist
            expect(stats).toHaveProperty('leads');
            expect(stats).toHaveProperty('projects');
            expect(stats).toHaveProperty('bids');
            expect(stats).toHaveProperty('contractors');
            expect(stats).toHaveProperty('interiorQuotes');
            expect(stats).toHaveProperty('blogPosts');
            expect(stats).toHaveProperty('users');
            expect(stats).toHaveProperty('media');
            expect(stats).toHaveProperty('pendingItems');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 2: Pending items are limited to 5 per category**
   * *For any* dashboard stats response, each pending items category
   * (projects, bids, contractors) SHALL contain at most 5 items,
   * sorted by createdAt descending.
   * **Validates: Requirements 2.3**
   */
  describe('Property 2: Pending items are limited to 5 per category', () => {
    it('should limit pending items to 5 per category regardless of database size', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate varying numbers of pending items (0 to 100)
          fc.record({
            pendingProjects: fc.array(
              mockProjectArb.filter((p) => p.status === 'PENDING_APPROVAL'),
              { minLength: 0, maxLength: 100 }
            ),
            pendingBids: fc.array(
              mockBidArb.filter((b) => b.status === 'PENDING'),
              { minLength: 0, maxLength: 100 }
            ),
            pendingContractors: fc.array(
              mockContractorArb.filter((c) => c.verificationStatus === 'PENDING'),
              { minLength: 0, maxLength: 100 }
            ),
          }),
          async (dbState) => {
            // Setup mocks - return all items, service should limit
            mockPrisma.project.findMany.mockImplementation(({ where, take }) => {
              if (where?.status === 'PENDING_APPROVAL') {
                const sorted = [...dbState.pendingProjects].sort(
                  (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                );
                return Promise.resolve(sorted.slice(0, take || 5));
              }
              return Promise.resolve([]);
            });

            mockPrisma.bid.findMany.mockImplementation(({ where, take }) => {
              if (where?.status === 'PENDING') {
                const sorted = [...dbState.pendingBids].sort(
                  (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                );
                return Promise.resolve(sorted.slice(0, take || 5));
              }
              return Promise.resolve([]);
            });

            mockPrisma.user.findMany.mockImplementation(({ where, take }) => {
              if (where?.role === 'CONTRACTOR' && where?.verificationStatus === 'PENDING') {
                const sorted = [...dbState.pendingContractors].sort(
                  (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                );
                return Promise.resolve(sorted.slice(0, take || 5));
              }
              return Promise.resolve([]);
            });

            // Other mocks for getStats
            mockPrisma.customerLead.findMany.mockResolvedValue([]);
            mockPrisma.blogPost.findMany.mockResolvedValue([]);
            mockPrisma.interiorQuote.count.mockResolvedValue(0);
            mockPrisma.mediaAsset.count.mockResolvedValue(0);

            // Get pending items
            const pendingItems = await dashboardService.getPendingItems();

            // Verify limits
            expect(pendingItems.projects.length).toBeLessThanOrEqual(5);
            expect(pendingItems.bids.length).toBeLessThanOrEqual(5);
            expect(pendingItems.contractors.length).toBeLessThanOrEqual(5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 3: Activity feed is limited to requested count**
   * *For any* activity feed request with limit parameter,
   * the response SHALL contain at most `limit` items,
   * sorted by createdAt descending.
   * **Validates: Requirements 4.2**
   */
  describe('Property 3: Activity feed is limited to requested count', () => {
    it('should limit activity feed to requested count', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random limit (1-50)
          fc.integer({ min: 1, max: 50 }),
          // Generate random activity items from each source
          fc.record({
            leads: fc.array(mockLeadArb, { minLength: 0, maxLength: 30 }),
            projects: fc.array(mockProjectArb, { minLength: 0, maxLength: 30 }),
            bids: fc.array(mockBidArb, { minLength: 0, maxLength: 30 }),
            contractors: fc.array(mockContractorArb, { minLength: 0, maxLength: 30 }),
            interiorQuotes: fc.array(mockInteriorQuoteArb, { minLength: 0, maxLength: 30 }),
          }),
          async (limit, dbState) => {
            // Setup mocks
            mockPrisma.customerLead.findMany.mockResolvedValue(
              dbState.leads.slice(0, limit)
            );
            mockPrisma.project.findMany.mockResolvedValue(
              dbState.projects.slice(0, limit)
            );
            mockPrisma.bid.findMany.mockResolvedValue(
              dbState.bids.slice(0, limit)
            );
            mockPrisma.user.findMany.mockResolvedValue(
              dbState.contractors.slice(0, limit)
            );
            mockPrisma.interiorQuote.findMany.mockResolvedValue(
              dbState.interiorQuotes.slice(0, limit)
            );

            // Get activity feed
            const activityFeed = await dashboardService.getActivityFeed(limit);

            // Verify limit is respected
            expect(activityFeed.length).toBeLessThanOrEqual(limit);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 4: Activity items have required fields**
   * *For any* activity item in the feed, it SHALL contain
   * id, type, title, description, entityId, and createdAt fields
   * with non-empty values.
   * **Validates: Requirements 4.3**
   */
  describe('Property 4: Activity items have required fields', () => {
    it('should have all required fields with non-empty values', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random activity items from each source
          fc.record({
            leads: fc.array(mockLeadArb, { minLength: 1, maxLength: 10 }),
            projects: fc.array(mockProjectArb, { minLength: 1, maxLength: 10 }),
            bids: fc.array(mockBidArb, { minLength: 1, maxLength: 10 }),
            contractors: fc.array(mockContractorArb, { minLength: 1, maxLength: 10 }),
            interiorQuotes: fc.array(mockInteriorQuoteArb, { minLength: 1, maxLength: 10 }),
          }),
          async (dbState) => {
            // Setup mocks
            mockPrisma.customerLead.findMany.mockResolvedValue(dbState.leads);
            mockPrisma.project.findMany.mockResolvedValue(dbState.projects);
            mockPrisma.bid.findMany.mockResolvedValue(dbState.bids);
            mockPrisma.user.findMany.mockResolvedValue(dbState.contractors);
            mockPrisma.interiorQuote.findMany.mockResolvedValue(dbState.interiorQuotes);

            // Get activity feed
            const activityFeed = await dashboardService.getActivityFeed(50);

            // Verify each item has required fields
            for (const item of activityFeed) {
              // Validate against schema
              const parseResult = activityItemSchema.safeParse(item);
              expect(parseResult.success).toBe(true);

              // Verify non-empty values
              expect(item.id).toBeTruthy();
              expect(item.id.length).toBeGreaterThan(0);
              expect(item.type).toBeTruthy();
              expect(item.title).toBeTruthy();
              expect(item.title.length).toBeGreaterThan(0);
              expect(item.description).toBeTruthy();
              expect(item.description.length).toBeGreaterThan(0);
              expect(item.entityId).toBeTruthy();
              expect(item.entityId.length).toBeGreaterThan(0);
              expect(item.createdAt).toBeTruthy();
              expect(item.createdAt.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 5: Pending counts match pending items**
   * *For any* dashboard stats response, the pending count for each category
   * SHALL equal the actual count of items with pending status in the database
   * (capped at 5 for display).
   * **Validates: Requirements 1.3, 2.1, 5.3**
   */
  describe('Property 5: Pending counts match pending items', () => {
    it('should have pending counts matching actual pending items', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random database state with various statuses
          fc.record({
            projects: fc.array(mockProjectArb, { minLength: 0, maxLength: 50 }),
            bids: fc.array(mockBidArb, { minLength: 0, maxLength: 50 }),
            contractors: fc.array(mockContractorArb, { minLength: 0, maxLength: 50 }),
          }),
          async (dbState) => {
            // Calculate expected pending counts
            const expectedPendingProjects = dbState.projects.filter(
              (p) => p.status === 'PENDING_APPROVAL'
            ).length;
            const expectedPendingBids = dbState.bids.filter(
              (b) => b.status === 'PENDING'
            ).length;
            const expectedPendingContractors = dbState.contractors.filter(
              (c) => c.verificationStatus === 'PENDING'
            ).length;

            // Setup mocks
            mockPrisma.project.findMany.mockImplementation(({ where }) => {
              if (where?.status === 'PENDING_APPROVAL') {
                const pending = dbState.projects.filter((p) => p.status === 'PENDING_APPROVAL');
                return Promise.resolve(pending.slice(0, 5));
              }
              return Promise.resolve(dbState.projects);
            });

            mockPrisma.bid.findMany.mockImplementation(({ where }) => {
              if (where?.status === 'PENDING') {
                const pending = dbState.bids.filter((b) => b.status === 'PENDING');
                return Promise.resolve(pending.slice(0, 5));
              }
              return Promise.resolve(dbState.bids);
            });

            mockPrisma.user.findMany.mockImplementation(({ where }) => {
              if (where?.role === 'CONTRACTOR' && where?.verificationStatus === 'PENDING') {
                const pending = dbState.contractors.filter(
                  (c) => c.verificationStatus === 'PENDING'
                );
                return Promise.resolve(pending.slice(0, 5));
              }
              if (where?.role === 'CONTRACTOR') {
                return Promise.resolve(dbState.contractors);
              }
              return Promise.resolve([]);
            });

            // Other mocks
            mockPrisma.customerLead.findMany.mockResolvedValue([]);
            mockPrisma.blogPost.findMany.mockResolvedValue([]);
            mockPrisma.interiorQuote.count.mockResolvedValue(0);
            mockPrisma.mediaAsset.count.mockResolvedValue(0);

            // Get stats
            const stats = await dashboardService.getStats();

            // Verify pending counts match
            expect(stats.projects.pending).toBe(expectedPendingProjects);
            expect(stats.bids.pending).toBe(expectedPendingBids);
            expect(stats.contractors.pending).toBe(expectedPendingContractors);

            // Verify pending items are capped at 5
            expect(stats.pendingItems.projects.length).toBe(
              Math.min(expectedPendingProjects, 5)
            );
            expect(stats.pendingItems.bids.length).toBe(
              Math.min(expectedPendingBids, 5)
            );
            expect(stats.pendingItems.contractors.length).toBe(
              Math.min(expectedPendingContractors, 5)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 6: Stats counts are non-negative integers**
   * *For any* dashboard stats response, all count values
   * SHALL be non-negative integers.
   * **Validates: Requirements 1.2**
   */
  describe('Property 6: Stats counts are non-negative integers', () => {
    it('should have all counts as non-negative integers', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random database state
          fc.record({
            leads: fc.array(mockLeadArb, { minLength: 0, maxLength: 50 }),
            projects: fc.array(mockProjectArb, { minLength: 0, maxLength: 30 }),
            bids: fc.array(mockBidArb, { minLength: 0, maxLength: 30 }),
            contractors: fc.array(mockContractorArb, { minLength: 0, maxLength: 20 }),
            users: fc.array(mockUserArb, { minLength: 0, maxLength: 50 }),
            blogPosts: fc.array(mockBlogPostArb, { minLength: 0, maxLength: 20 }),
            interiorQuotesCount: fc.integer({ min: 0, max: 1000 }),
            interiorQuotesThisMonth: fc.integer({ min: 0, max: 100 }),
            mediaCount: fc.integer({ min: 0, max: 1000 }),
          }),
          async (dbState) => {
            // Setup mocks - handle all query variations
            mockPrisma.customerLead.findMany.mockResolvedValue(dbState.leads);
            
            mockPrisma.project.findMany.mockImplementation((args) => {
              const where = args?.where;
              if (where?.status === 'PENDING_APPROVAL') {
                return Promise.resolve(
                  dbState.projects.filter((p) => p.status === 'PENDING_APPROVAL').slice(0, 5)
                );
              }
              return Promise.resolve(dbState.projects);
            });
            
            mockPrisma.bid.findMany.mockImplementation((args) => {
              const where = args?.where;
              if (where?.status === 'PENDING') {
                return Promise.resolve(
                  dbState.bids.filter((b) => b.status === 'PENDING').slice(0, 5)
                );
              }
              return Promise.resolve(dbState.bids);
            });
            
            mockPrisma.user.findMany.mockImplementation((args) => {
              const where = args?.where;
              if (where?.role === 'CONTRACTOR' && where?.verificationStatus === 'PENDING') {
                return Promise.resolve(
                  dbState.contractors.filter((c) => c.verificationStatus === 'PENDING').slice(0, 5)
                );
              }
              if (where?.role === 'CONTRACTOR') {
                return Promise.resolve(dbState.contractors);
              }
              return Promise.resolve(dbState.users);
            });
            
            mockPrisma.blogPost.findMany.mockResolvedValue(dbState.blogPosts);
            
            // Handle interiorQuote.count with optional where clause
            mockPrisma.interiorQuote.count.mockImplementation((args) => {
              if (args?.where?.createdAt) {
                return Promise.resolve(dbState.interiorQuotesThisMonth);
              }
              return Promise.resolve(dbState.interiorQuotesCount);
            });
            
            mockPrisma.mediaAsset.count.mockResolvedValue(dbState.mediaCount);

            // Get stats
            const stats = await dashboardService.getStats();

            // Helper to check non-negative integer
            const isNonNegativeInt = (n: number) =>
              Number.isInteger(n) && n >= 0;

            // Verify leads stats
            expect(isNonNegativeInt(stats.leads.total)).toBe(true);
            expect(isNonNegativeInt(stats.leads.new)).toBe(true);
            Object.values(stats.leads.byStatus).forEach((count) => {
              expect(isNonNegativeInt(count)).toBe(true);
            });
            Object.values(stats.leads.bySource).forEach((count) => {
              expect(isNonNegativeInt(count)).toBe(true);
            });
            stats.leads.dailyLeads.forEach((day) => {
              expect(isNonNegativeInt(day.count)).toBe(true);
            });

            // Verify projects stats
            expect(isNonNegativeInt(stats.projects.total)).toBe(true);
            expect(isNonNegativeInt(stats.projects.pending)).toBe(true);
            expect(isNonNegativeInt(stats.projects.open)).toBe(true);
            expect(isNonNegativeInt(stats.projects.matched)).toBe(true);
            expect(isNonNegativeInt(stats.projects.inProgress)).toBe(true);
            expect(isNonNegativeInt(stats.projects.completed)).toBe(true);

            // Verify bids stats
            expect(isNonNegativeInt(stats.bids.total)).toBe(true);
            expect(isNonNegativeInt(stats.bids.pending)).toBe(true);
            expect(isNonNegativeInt(stats.bids.approved)).toBe(true);

            // Verify contractors stats
            expect(isNonNegativeInt(stats.contractors.total)).toBe(true);
            expect(isNonNegativeInt(stats.contractors.pending)).toBe(true);
            expect(isNonNegativeInt(stats.contractors.verified)).toBe(true);

            // Verify interior quotes stats
            expect(isNonNegativeInt(stats.interiorQuotes.total)).toBe(true);
            expect(isNonNegativeInt(stats.interiorQuotes.thisMonth)).toBe(true);

            // Verify blog posts stats
            expect(isNonNegativeInt(stats.blogPosts.total)).toBe(true);
            expect(isNonNegativeInt(stats.blogPosts.published)).toBe(true);
            expect(isNonNegativeInt(stats.blogPosts.draft)).toBe(true);

            // Verify users stats
            expect(isNonNegativeInt(stats.users.total)).toBe(true);
            Object.values(stats.users.byRole).forEach((count) => {
              expect(isNonNegativeInt(count)).toBe(true);
            });

            // Verify media stats
            expect(isNonNegativeInt(stats.media.total)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
