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
   * Get leads statistics
   */
  private async getLeadsStats(): Promise<LeadsStats> {
    const leads = await this.prisma.customerLead.findMany({
      select: { status: true, source: true, createdAt: true },
    });

    // Daily leads for last 30 days
    const dailyLeadsMap = new Map<string, number>();
    for (let i = 0; i < DAILY_LEADS_DAYS; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyLeadsMap.set(dateStr, 0);
    }

    leads.forEach((lead) => {
      const dateStr = lead.createdAt.toISOString().split('T')[0];
      if (dailyLeadsMap.has(dateStr)) {
        dailyLeadsMap.set(dateStr, (dailyLeadsMap.get(dateStr) || 0) + 1);
      }
    });

    const dailyLeads = Array.from(dailyLeadsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Status distribution
    const byStatus: Record<string, number> = {};
    leads.forEach((lead) => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    });

    // Source distribution
    const bySource: Record<string, number> = {};
    leads.forEach((lead) => {
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
    });

    // Conversion rate
    const totalNonCancelled = leads.filter((l) => l.status !== 'CANCELLED').length;
    const converted = byStatus['CONVERTED'] || 0;
    const conversionRate =
      totalNonCancelled > 0
        ? Math.round((converted / totalNonCancelled) * 100 * 100) / 100
        : 0;

    return {
      total: leads.length,
      new: byStatus['NEW'] || 0,
      byStatus,
      bySource,
      conversionRate,
      dailyLeads,
    };
  }

  /**
   * Get projects statistics
   */
  private async getProjectsStats(): Promise<ProjectsStats> {
    const projects = await this.prisma.project.findMany({
      select: { status: true },
    });

    const byStatus: Record<string, number> = {};
    projects.forEach((p) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    return {
      total: projects.length,
      pending: byStatus['PENDING_APPROVAL'] || 0,
      open: byStatus['OPEN'] || 0,
      matched: byStatus['MATCHED'] || 0,
      inProgress: byStatus['IN_PROGRESS'] || 0,
      completed: byStatus['COMPLETED'] || 0,
    };
  }

  /**
   * Get bids statistics
   */
  private async getBidsStats(): Promise<BidsStats> {
    const bids = await this.prisma.bid.findMany({
      select: { status: true },
    });

    const byStatus: Record<string, number> = {};
    bids.forEach((b) => {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    });

    return {
      total: bids.length,
      pending: byStatus['PENDING'] || 0,
      approved: byStatus['APPROVED'] || 0,
    };
  }

  /**
   * Get contractors statistics
   */
  private async getContractorsStats(): Promise<ContractorsStats> {
    const contractors = await this.prisma.user.findMany({
      where: { role: 'CONTRACTOR' },
      select: { verificationStatus: true },
    });

    const byStatus: Record<string, number> = {};
    contractors.forEach((c) => {
      byStatus[c.verificationStatus] = (byStatus[c.verificationStatus] || 0) + 1;
    });

    return {
      total: contractors.length,
      pending: byStatus['PENDING'] || 0,
      verified: byStatus['VERIFIED'] || 0,
    };
  }

  /**
   * Get blog posts statistics
   */
  private async getBlogPostsStats(): Promise<BlogPostsStats> {
    const posts = await this.prisma.blogPost.findMany({
      select: { status: true },
    });

    const byStatus: Record<string, number> = {};
    posts.forEach((p) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    return {
      total: posts.length,
      published: byStatus['PUBLISHED'] || 0,
      draft: byStatus['DRAFT'] || 0,
    };
  }

  /**
   * Get users statistics
   */
  private async getUsersStats(): Promise<UsersStats> {
    const users = await this.prisma.user.findMany({
      select: { role: true },
    });

    const byRole: Record<string, number> = {};
    users.forEach((u) => {
      byRole[u.role] = (byRole[u.role] || 0) + 1;
    });

    return {
      total: users.length,
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
   * @param limit - Maximum number of items to return (default: 10)
   * @returns Array of activity items sorted by createdAt descending
   */
  async getActivityFeed(limit: number = DEFAULT_ACTIVITY_LIMIT): Promise<ActivityItem[]> {
    // Fetch recent items from each source
    const [leads, projects, bids, contractors] = await Promise.all([
      this.getRecentLeads(limit),
      this.getRecentProjects(limit),
      this.getRecentBids(limit),
      this.getRecentContractors(limit),
    ]);

    // Combine and sort by createdAt descending
    const allItems = [...leads, ...projects, ...bids, ...contractors];
    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Return only the requested limit
    return allItems.slice(0, limit);
  }

  /**
   * Get recent leads as activity items
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
