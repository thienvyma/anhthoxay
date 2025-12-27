/**
 * Dashboard Zod Schemas
 *
 * Validation schemas for admin dashboard API responses.
 *
 * **Feature: admin-dashboard-enhancement**
 * **Requirements: 6.1, 6.2**
 */

import { z } from 'zod';

// ============================================
// STATS SCHEMAS
// ============================================

/**
 * Schema for leads statistics
 */
export const leadsStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  new: z.number().int().nonnegative(),
  byStatus: z.record(z.string(), z.number().int().nonnegative()),
  bySource: z.record(z.string(), z.number().int().nonnegative()),
  conversionRate: z.number().nonnegative(),
  dailyLeads: z.array(z.object({
    date: z.string(),
    count: z.number().int().nonnegative(),
  })),
});

/**
 * Schema for projects statistics
 */
export const projectsStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  open: z.number().int().nonnegative(),
  matched: z.number().int().nonnegative(),
  inProgress: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
});

/**
 * Schema for bids statistics
 */
export const bidsStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  approved: z.number().int().nonnegative(),
});

/**
 * Schema for contractors statistics
 */
export const contractorsStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  verified: z.number().int().nonnegative(),
});

/**
 * Schema for blog posts statistics
 */
export const blogPostsStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  published: z.number().int().nonnegative(),
  draft: z.number().int().nonnegative(),
});

/**
 * Schema for users statistics
 */
export const usersStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  byRole: z.record(z.string(), z.number().int().nonnegative()),
});

/**
 * Schema for media statistics
 */
export const mediaStatsSchema = z.object({
  total: z.number().int().nonnegative(),
});

// ============================================
// PENDING ITEMS SCHEMAS
// ============================================

/**
 * Schema for pending project item
 */
export const pendingProjectSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  ownerName: z.string(),
  createdAt: z.string(),
});

/**
 * Schema for pending bid item
 */
export const pendingBidSchema = z.object({
  id: z.string(),
  code: z.string(),
  projectCode: z.string(),
  contractorName: z.string(),
  price: z.number(),
  createdAt: z.string(),
});

/**
 * Schema for pending contractor item
 */
export const pendingContractorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  companyName: z.string().optional(),
  submittedAt: z.string().optional(),
});

/**
 * Schema for pending items section
 */
export const pendingItemsSchema = z.object({
  projects: z.array(pendingProjectSchema).max(5),
  bids: z.array(pendingBidSchema).max(5),
  contractors: z.array(pendingContractorSchema).max(5),
});

// ============================================
// DASHBOARD STATS RESPONSE SCHEMA
// ============================================

/**
 * Schema for complete dashboard stats response
 */
export const dashboardStatsResponseSchema = z.object({
  leads: leadsStatsSchema,
  projects: projectsStatsSchema,
  bids: bidsStatsSchema,
  contractors: contractorsStatsSchema,
  blogPosts: blogPostsStatsSchema,
  users: usersStatsSchema,
  media: mediaStatsSchema,
  pendingItems: pendingItemsSchema,
});

// ============================================
// ACTIVITY FEED SCHEMAS
// ============================================

/**
 * Activity item types
 */
export const activityTypeSchema = z.enum([
  'LEAD',
  'PROJECT',
  'BID',
  'CONTRACTOR',
]);

/**
 * Schema for activity feed item
 */
export const activityItemSchema = z.object({
  id: z.string().min(1),
  type: activityTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  entityId: z.string().min(1),
  createdAt: z.string().min(1),
});

/**
 * Schema for activity feed query parameters
 */
export const activityFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * Schema for activity feed response
 */
export const activityFeedResponseSchema = z.array(activityItemSchema);

// ============================================
// TYPE EXPORTS
// ============================================

export type LeadsStats = z.infer<typeof leadsStatsSchema>;
export type ProjectsStats = z.infer<typeof projectsStatsSchema>;
export type BidsStats = z.infer<typeof bidsStatsSchema>;
export type ContractorsStats = z.infer<typeof contractorsStatsSchema>;
export type BlogPostsStats = z.infer<typeof blogPostsStatsSchema>;
export type UsersStats = z.infer<typeof usersStatsSchema>;
export type MediaStats = z.infer<typeof mediaStatsSchema>;
export type PendingProject = z.infer<typeof pendingProjectSchema>;
export type PendingBid = z.infer<typeof pendingBidSchema>;
export type PendingContractor = z.infer<typeof pendingContractorSchema>;
export type PendingItems = z.infer<typeof pendingItemsSchema>;
export type DashboardStatsResponse = z.infer<typeof dashboardStatsResponseSchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type ActivityItem = z.infer<typeof activityItemSchema>;
export type ActivityFeedQuery = z.infer<typeof activityFeedQuerySchema>;
export type ActivityFeedResponse = z.infer<typeof activityFeedResponseSchema>;
