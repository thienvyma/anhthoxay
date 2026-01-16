// Dashboard APIs - NỘI THẤT NHANH Admin Dashboard
// Dashboard statistics and activity feed
//
// **Feature: admin-dashboard-enhancement**
// **Requirements: 6.1**

import { apiFetch } from './client';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Leads statistics
 */
export interface LeadsStats {
  total: number;
  new: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  conversionRate: number;
  dailyLeads: Array<{ date: string; count: number }>;
}

/**
 * Blog posts statistics
 */
export interface BlogPostsStats {
  total: number;
  published: number;
  draft: number;
}

/**
 * Users statistics
 */
export interface UsersStats {
  total: number;
  byRole: Record<string, number>;
}

/**
 * Media statistics
 */
export interface MediaStats {
  total: number;
}

/**
 * Complete dashboard stats response
 */
export interface DashboardStats {
  leads: LeadsStats;
  blogPosts: BlogPostsStats;
  users: UsersStats;
  media: MediaStats;
}

/**
 * Activity item types
 */
export type ActivityType = 'LEAD' | 'BLOG_POST' | 'USER' | 'MEDIA';

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  entityId: string;
  createdAt: string;
}

// ============================================
// DASHBOARD API
// ============================================

/**
 * Dashboard API client
 *
 * **Feature: admin-dashboard-enhancement**
 * **Requirements: 6.1**
 */
export const dashboardApi = {
  /**
   * Get dashboard statistics
   * Returns all stats in a single response including pending items
   *
   * @returns Dashboard stats with leads, projects, bids, contractors, etc.
   */
  getStats: () =>
    apiFetch<DashboardStats>('/api/admin/dashboard'),

  /**
   * Get activity feed
   * Returns recent activity items from multiple sources
   *
   * @param limit - Maximum number of items to return (default: 10, max: 50)
   * @returns Array of activity items sorted by createdAt descending
   */
  getActivityFeed: (limit = 10) =>
    apiFetch<ActivityItem[]>(`/api/admin/dashboard/activity?limit=${limit}`),
};
