/**
 * Dashboard Service Module
 *
 * Handles business logic for admin dashboard including stats aggregation,
 * pending items retrieval, and activity feed generation.
 *
 * **Feature: admin-dashboard-enhancement**
 * **Requirements: 6.1, 6.2, 2.3, 4.2**
 */

import { PrismaClient } from '@prisma/client';
import type {
  DashboardStatsResponse,
  LeadsStats,
  ProjectsStats,
  BidsStats,
  ContractorsStats,
  BlogPostsStats,
  UsersStats,
  MediaStats,
  PendingItems,
  PendingProject,
  PendingBid,
  PendingContractor,
  ActivityItem,
  ActivityType,
} from '../schemas/dashboard.schema';

// ============================================
// CONSTANTS
// ============================================

const MAX_PENDING_ITEMS = 5;
const DEFAULT_ACTIVITY_LIMIT = 10;
const MAX_ACTIVITY_LIMIT = 50;
const DAILY_LEADS_DAYS = 30;

// ============================================
// ERROR CLASS
// ============================================

export class DashboardServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 500) {
    super(message);
    this.code = code;
    this.name = 'DashboardServiceError';
    this.statusCode = statusCode;
  }
}

// ============================================
// DASHBOARD SERVICE CLASS
// ============================================

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // MAIN STATS METHOD
  // ============================================

  /**
   * Get all dashboard statistics
   * @returns Complete dashboard stats including all modules and pending items
   */
  async getStats(): Promise<DashboardStatsResponse> {
    const [
      leads,
      projects,
      bids,
      contractors,
      blogPosts,
      users,
      media,
      pendingItems,
    ] = await Promise.all([
      this.getLeadsStats(),
      this.getProjectsStats(),
      this.getBidsStats(),
      this.getContractorsStats(),
      this.getBlogPostsStats(),
      this.getUsersStats(),
      this.getMediaStats(),
      this.getPendingItems(),
    ]);

    return {
      leads,
      projects,
      bids,
      contractors,
      blogPosts,
      users,
      media,
      pendingItems,
    };
  }

  // ============================================
  // INDIVIDUAL STATS METHODS
  // ============================================

  /**
   * Get leads statistics using aggregation queries
   * Optimized: Uses count() and groupBy() instead of fetching all records
   */
  private async getLeadsStats(): Promise<LeadsStats> {
    // Get total count
    const total = await this.prisma.customerLead.count();

    // Get counts by status using groupBy
    const statusGroups = await this.prisma.customerLead.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const byStatus: Record<string, number> = {};
    statusGroups.forEach((group) => {
      byStatus[group.status] = group._count.status;
    });

    // Get counts by source using groupBy
    const sourceGroups = await this.prisma.customerLead.groupBy({
      by: ['source'],
      _count: { source: true },
    });

    const bySource: Record<string, number> = {};
    sourceGroups.forEach((group) => {
      bySource[group.source] = group._count.source;
    });

    // Calculate conversion rate using counts
    const totalNonCancelled = total - (byStatus['CANCELLED'] || 0);
    const converted = byStatus['CONVERTED'] || 0;
    const conversionRate =
      totalNonCancelled > 0
        ? Math.round((converted / totalNonCancelled) * 100 * 100) / 100
        : 0;

    // Daily leads for last 30 days - only fetch records from this period
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - DAILY_LEADS_DAYS);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentLeads = await this.prisma.customerLead.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });

    // Initialize daily leads map
    const dailyLeadsMap = new Map<string, number>();
    for (let i = 0; i < DAILY_LEADS_DAYS; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyLeadsMap.set(dateStr, 0);
    }

    recentLeads.forEach((lead) => {
      const dateStr = lead.createdAt.toISOString().split('T')[0];
      if (dailyLeadsMap.has(dateStr)) {
        dailyLeadsMap.set(dateStr, (dailyLeadsMap.get(dateStr) || 0) + 1);
      }
    });

    const dailyLeads = Array.from(dailyLeadsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total,
      new: byStatus['NEW'] || 0,
      byStatus,
      bySource,
      conversionRate,
      dailyLeads,
    };
  }

  /**
   * Get projects statistics using aggregation queries
   * Optimized: Uses count() and groupBy() instead of fetching all records
   */
  private async getProjectsStats(): Promise<ProjectsStats> {
    // Get total count
    const total = await this.prisma.project.count();

    // Get counts by status using groupBy
    const statusGroups = await this.prisma.project.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const byStatus: Record<string, number> = {};
    statusGroups.forEach((group) => {
      byStatus[group.status] = group._count.status;
    });

    return {
      total,
      pending: byStatus['PENDING_APPROVAL'] || 0,
      open: byStatus['OPEN'] || 0,
      matched: byStatus['MATCHED'] || 0,
      inProgress: byStatus['IN_PROGRESS'] || 0,
      completed: byStatus['COMPLETED'] || 0,
    };
  }

  /**
   * Get bids statistics using aggregation queries
   * Optimized: Uses count() and groupBy() instead of fetching all records
   */
  private async getBidsStats(): Promise<BidsStats> {
    // Get total count
    const total = await this.prisma.bid.count();

    // Get counts by status using groupBy
    const statusGroups = await this.prisma.bid.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const byStatus: Record<string, number> = {};
    statusGroups.forEach((group) => {
      byStatus[group.status] = group._count.status;
    });

    return {
      total,
      pending: byStatus['PENDING'] || 0,
      approved: byStatus['APPROVED'] || 0,
    };
  }

  /**
   * Get contractors statistics using aggregation queries
   * Optimized: Uses count() and groupBy() instead of fetching all records
   */
  private async getContractorsStats(): Promise<ContractorsStats> {
    // Get total count of contractors
    const total = await this.prisma.user.count({
      where: { role: 'CONTRACTOR' },
    });

    // Get counts by verification status using groupBy
    const statusGroups = await this.prisma.user.groupBy({
      by: ['verificationStatus'],
      where: { role: 'CONTRACTOR' },
      _count: { verificationStatus: true },
    });

    const byStatus: Record<string, number> = {};
    statusGroups.forEach((group) => {
      byStatus[group.verificationStatus] = group._count.verificationStatus;
    });

    return {
      total,
      pending: byStatus['PENDING'] || 0,
      verified: byStatus['VERIFIED'] || 0,
    };
  }

  /**
   * Get blog posts statistics using aggregation queries
   * Optimized: Uses count() and groupBy() instead of fetching all records
   */
  private async getBlogPostsStats(): Promise<BlogPostsStats> {
    // Get total count
    const total = await this.prisma.blogPost.count();

    // Get counts by status using groupBy
    const statusGroups = await this.prisma.blogPost.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const byStatus: Record<string, number> = {};
    statusGroups.forEach((group) => {
      byStatus[group.status] = group._count.status;
    });

    return {
      total,
      published: byStatus['PUBLISHED'] || 0,
      draft: byStatus['DRAFT'] || 0,
    };
  }

  /**
   * Get users statistics using aggregation queries
   * Optimized: Uses count() and groupBy() instead of fetching all records
   */
  private async getUsersStats(): Promise<UsersStats> {
    // Get total count
    const total = await this.prisma.user.count();

    // Get counts by role using groupBy
    const roleGroups = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const byRole: Record<string, number> = {};
    roleGroups.forEach((group) => {
      byRole[group.role] = group._count.role;
    });

    return {
      total,
      byRole,
    };
  }

  /**
   * Get media statistics
   */
  private async getMediaStats(): Promise<MediaStats> {
    const total = await this.prisma.mediaAsset.count();
    return { total };
  }

  // ============================================
  // PENDING ITEMS METHOD
  // ============================================

  /**
   * Get pending items for all categories (max 5 each)
   * @returns Pending projects, bids, and contractors
   */
  async getPendingItems(): Promise<PendingItems> {
    const [projects, bids, contractors] = await Promise.all([
      this.getPendingProjects(),
      this.getPendingBids(),
      this.getPendingContractors(),
    ]);

    return { projects, bids, contractors };
  }

  /**
   * Get pending projects (PENDING_APPROVAL status)
   */
  private async getPendingProjects(): Promise<PendingProject[]> {
    const projects = await this.prisma.project.findMany({
      where: { status: 'PENDING_APPROVAL' },
      select: {
        id: true,
        code: true,
        title: true,
        owner: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_PENDING_ITEMS,
    });

    return projects.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      ownerName: p.owner.name,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * Get pending bids (PENDING status)
   */
  private async getPendingBids(): Promise<PendingBid[]> {
    const bids = await this.prisma.bid.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        code: true,
        price: true,
        project: { select: { code: true } },
        contractor: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_PENDING_ITEMS,
    });

    return bids.map((b) => ({
      id: b.id,
      code: b.code,
      projectCode: b.project.code,
      contractorName: b.contractor.name,
      price: b.price,
      createdAt: b.createdAt.toISOString(),
    }));
  }

  /**
   * Get pending contractors (PENDING verification status)
   */
  private async getPendingContractors(): Promise<PendingContractor[]> {
    const contractors = await this.prisma.user.findMany({
      where: {
        role: 'CONTRACTOR',
        verificationStatus: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        contractorProfile: { select: { submittedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_PENDING_ITEMS,
    });

    return contractors.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      companyName: c.companyName || undefined,
      submittedAt: c.contractorProfile?.submittedAt?.toISOString(),
    }));
  }

  // ============================================
  // ACTIVITY FEED METHOD
  // ============================================

  /**
   * Get recent activity feed from multiple sources
   * Optimized: Fetches only necessary items per source to minimize database load
   * @param limit - Maximum number of items to return (default: 10, max: 50)
   * @returns Array of activity items sorted by createdAt descending
   */
  async getActivityFeed(limit: number = DEFAULT_ACTIVITY_LIMIT): Promise<ActivityItem[]> {
    // Validate and cap the limit to prevent unbounded queries
    const validatedLimit = Math.min(Math.max(1, limit), MAX_ACTIVITY_LIMIT);
    
    // Calculate per-source limit: fetch enough items from each source
    // to ensure we can fill the requested limit after merging and sorting
    // We divide by 4 (number of sources) and add buffer for better distribution
    const perSourceLimit = Math.ceil(validatedLimit / 2);
    
    // Fetch recent items from each source with optimized limits
    const [leads, projects, bids, contractors] = await Promise.all([
      this.getRecentLeads(perSourceLimit),
      this.getRecentProjects(perSourceLimit),
      this.getRecentBids(perSourceLimit),
      this.getRecentContractors(perSourceLimit),
    ]);

    // Combine and sort by createdAt descending
    const allItems = [...leads, ...projects, ...bids, ...contractors];
    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Return only the requested limit
    return allItems.slice(0, validatedLimit);
  }

  /**
   * Get recent leads as activity items
   * @param limit - Maximum number of leads to fetch
   */
  private async getRecentLeads(limit: number): Promise<ActivityItem[]> {
    const leads = await this.prisma.customerLead.findMany({
      select: { id: true, name: true, source: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return leads.map((l) => ({
      id: `lead-${l.id}`,
      type: 'LEAD' as ActivityType,
      title: 'Khách hàng mới',
      description: `${l.name} từ ${l.source === 'QUOTE_FORM' ? 'form báo giá' : 'form liên hệ'}`,
      entityId: l.id,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  /**
   * Get recent projects as activity items
   * @param limit - Maximum number of projects to fetch
   */
  private async getRecentProjects(limit: number): Promise<ActivityItem[]> {
    const projects = await this.prisma.project.findMany({
      select: { id: true, code: true, title: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return projects.map((p) => ({
      id: `project-${p.id}`,
      type: 'PROJECT' as ActivityType,
      title: 'Công trình mới',
      description: `${p.code}: ${p.title}`,
      entityId: p.id,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * Get recent bids as activity items
   * @param limit - Maximum number of bids to fetch
   */
  private async getRecentBids(limit: number): Promise<ActivityItem[]> {
    const bids = await this.prisma.bid.findMany({
      select: {
        id: true,
        code: true,
        price: true,
        contractor: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return bids.map((b) => ({
      id: `bid-${b.id}`,
      type: 'BID' as ActivityType,
      title: 'Đề xuất thầu mới',
      description: `${b.code} từ ${b.contractor.name} - ${b.price.toLocaleString('vi-VN')}đ`,
      entityId: b.id,
      createdAt: b.createdAt.toISOString(),
    }));
  }

  /**
   * Get recent contractor registrations as activity items
   * @param limit - Maximum number of contractors to fetch
   */
  private async getRecentContractors(limit: number): Promise<ActivityItem[]> {
    const contractors = await this.prisma.user.findMany({
      where: { role: 'CONTRACTOR' },
      select: { id: true, name: true, companyName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return contractors.map((c) => ({
      id: `contractor-${c.id}`,
      type: 'CONTRACTOR' as ActivityType,
      title: 'Nhà thầu đăng ký',
      description: c.companyName ? `${c.name} (${c.companyName})` : c.name,
      entityId: c.id,
      createdAt: c.createdAt.toISOString(),
    }));
  }

}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a new DashboardService instance
 * @param prisma - Prisma client instance
 * @returns DashboardService instance
 */
export function createDashboardService(prisma: PrismaClient): DashboardService {
  return new DashboardService(prisma);
}
