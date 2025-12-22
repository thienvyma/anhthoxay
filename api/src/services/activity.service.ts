/**
 * Activity Service
 *
 * Service for aggregating user activity history from various sources:
 * - Projects (created, submitted, approved, rejected, started, completed)
 * - Bids (submitted, approved, rejected, selected)
 * - Reviews (written)
 * - Matches (created)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 23.1, 23.2, 23.3, 23.4**
 */

import { PrismaClient } from '@prisma/client';
import type { Activity, ActivityQuery, ActivityType } from '../schemas/activity.schema';

export class ActivityError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = 'ActivityError';
  }
}

export class ActivityService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get activity history for a user
   * Requirements: 23.1, 23.3
   */
  async getActivities(
    userId: string,
    query: ActivityQuery
  ): Promise<{ data: Activity[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page, limit, type, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Aggregate activities from different sources
    const activities: Activity[] = [];

    // Get user role to determine which activities to fetch
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ActivityError('USER_NOT_FOUND', 'Người dùng không tồn tại', 404);
    }

    const isHomeowner = user.role === 'HOMEOWNER';
    const isContractor = user.role === 'CONTRACTOR';

    // Fetch project activities (for homeowners)
    if (isHomeowner && (!type || this.isProjectActivityType(type))) {
      const projectActivities = await this.getProjectActivities(userId, dateFilter, type);
      activities.push(...projectActivities);
    }

    // Fetch bid activities (for contractors)
    if (isContractor && (!type || this.isBidActivityType(type))) {
      const bidActivities = await this.getBidActivities(userId, dateFilter, type);
      activities.push(...bidActivities);
    }

    // Fetch review activities (for both)
    if (!type || type === 'REVIEW_WRITTEN') {
      const reviewActivities = await this.getReviewActivities(userId, dateFilter);
      activities.push(...reviewActivities);
    }

    // Sort by createdAt descending
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const total = activities.length;
    const paginatedActivities = activities.slice(skip, skip + limit);

    return {
      data: paginatedActivities,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private isProjectActivityType(type: ActivityType): boolean {
    return [
      'PROJECT_CREATED',
      'PROJECT_SUBMITTED',
      'PROJECT_APPROVED',
      'PROJECT_REJECTED',
      'PROJECT_STARTED',
      'PROJECT_COMPLETED',
      'MATCH_CREATED',
    ].includes(type);
  }

  private isBidActivityType(type: ActivityType): boolean {
    return [
      'BID_SUBMITTED',
      'BID_APPROVED',
      'BID_REJECTED',
      'BID_SELECTED',
      'MATCH_CREATED',
    ].includes(type);
  }

  /**
   * Get project-related activities for homeowner
   */
  private async getProjectActivities(
    userId: string,
    dateFilter: { gte?: Date; lte?: Date },
    type?: ActivityType
  ): Promise<Activity[]> {
    const activities: Activity[] = [];

    const projects = await this.prisma.project.findMany({
      where: {
        ownerId: userId,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      include: {
        category: { select: { name: true } },
        region: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const project of projects) {
      // PROJECT_CREATED
      if (!type || type === 'PROJECT_CREATED') {
        activities.push({
          id: `project-created-${project.id}`,
          userId,
          type: 'PROJECT_CREATED',
          title: 'Tạo công trình mới',
          description: `Đã tạo công trình "${project.title}"`,
          data: {
            projectId: project.id,
            projectCode: project.code,
            projectTitle: project.title,
            category: project.category?.name,
            region: project.region?.name,
          },
          createdAt: project.createdAt.toISOString(),
        });
      }

      // PROJECT_SUBMITTED (when status changed to PENDING_APPROVAL)
      if (
        (!type || type === 'PROJECT_SUBMITTED') &&
        project.status !== 'DRAFT'
      ) {
        activities.push({
          id: `project-submitted-${project.id}`,
          userId,
          type: 'PROJECT_SUBMITTED',
          title: 'Gửi duyệt công trình',
          description: `Đã gửi công trình "${project.title}" để duyệt`,
          data: {
            projectId: project.id,
            projectCode: project.code,
            projectTitle: project.title,
          },
          createdAt: project.updatedAt.toISOString(),
        });
      }

      // PROJECT_APPROVED
      if (
        (!type || type === 'PROJECT_APPROVED') &&
        project.reviewedAt &&
        ['OPEN', 'BIDDING_CLOSED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(project.status)
      ) {
        activities.push({
          id: `project-approved-${project.id}`,
          userId,
          type: 'PROJECT_APPROVED',
          title: 'Công trình được duyệt',
          description: `Công trình "${project.title}" đã được duyệt`,
          data: {
            projectId: project.id,
            projectCode: project.code,
            projectTitle: project.title,
          },
          createdAt: project.reviewedAt.toISOString(),
        });
      }

      // PROJECT_REJECTED
      if (
        (!type || type === 'PROJECT_REJECTED') &&
        project.status === 'REJECTED' &&
        project.reviewedAt
      ) {
        activities.push({
          id: `project-rejected-${project.id}`,
          userId,
          type: 'PROJECT_REJECTED',
          title: 'Công trình bị từ chối',
          description: `Công trình "${project.title}" bị từ chối: ${project.reviewNote || 'Không có lý do'}`,
          data: {
            projectId: project.id,
            projectCode: project.code,
            projectTitle: project.title,
            reviewNote: project.reviewNote,
          },
          createdAt: project.reviewedAt.toISOString(),
        });
      }

      // MATCH_CREATED
      if (
        (!type || type === 'MATCH_CREATED') &&
        project.matchedAt
      ) {
        activities.push({
          id: `match-created-${project.id}`,
          userId,
          type: 'MATCH_CREATED',
          title: 'Đã chọn nhà thầu',
          description: `Đã chọn nhà thầu cho công trình "${project.title}"`,
          data: {
            projectId: project.id,
            projectCode: project.code,
            projectTitle: project.title,
          },
          createdAt: project.matchedAt.toISOString(),
        });
      }

      // PROJECT_STARTED (IN_PROGRESS)
      if (
        (!type || type === 'PROJECT_STARTED') &&
        ['IN_PROGRESS', 'COMPLETED'].includes(project.status)
      ) {
        activities.push({
          id: `project-started-${project.id}`,
          userId,
          type: 'PROJECT_STARTED',
          title: 'Bắt đầu thi công',
          description: `Công trình "${project.title}" đã bắt đầu thi công`,
          data: {
            projectId: project.id,
            projectCode: project.code,
            projectTitle: project.title,
          },
          createdAt: project.updatedAt.toISOString(),
        });
      }

      // PROJECT_COMPLETED
      if (
        (!type || type === 'PROJECT_COMPLETED') &&
        project.status === 'COMPLETED'
      ) {
        activities.push({
          id: `project-completed-${project.id}`,
          userId,
          type: 'PROJECT_COMPLETED',
          title: 'Hoàn thành công trình',
          description: `Công trình "${project.title}" đã hoàn thành`,
          data: {
            projectId: project.id,
            projectCode: project.code,
            projectTitle: project.title,
          },
          createdAt: project.updatedAt.toISOString(),
        });
      }
    }

    return activities;
  }

  /**
   * Get bid-related activities for contractor
   */
  private async getBidActivities(
    userId: string,
    dateFilter: { gte?: Date; lte?: Date },
    type?: ActivityType
  ): Promise<Activity[]> {
    const activities: Activity[] = [];

    const bids = await this.prisma.bid.findMany({
      where: {
        contractorId: userId,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            title: true,
            matchedAt: true,
            selectedBidId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const bid of bids) {
      // BID_SUBMITTED
      if (!type || type === 'BID_SUBMITTED') {
        activities.push({
          id: `bid-submitted-${bid.id}`,
          userId,
          type: 'BID_SUBMITTED',
          title: 'Gửi đề xuất',
          description: `Đã gửi đề xuất cho công trình "${bid.project.title}"`,
          data: {
            bidId: bid.id,
            bidCode: bid.code,
            projectId: bid.project.id,
            projectCode: bid.project.code,
            projectTitle: bid.project.title,
            price: bid.price,
          },
          createdAt: bid.createdAt.toISOString(),
        });
      }

      // BID_APPROVED
      if (
        (!type || type === 'BID_APPROVED') &&
        bid.reviewedAt &&
        ['APPROVED', 'SELECTED', 'NOT_SELECTED'].includes(bid.status)
      ) {
        activities.push({
          id: `bid-approved-${bid.id}`,
          userId,
          type: 'BID_APPROVED',
          title: 'Đề xuất được duyệt',
          description: `Đề xuất cho công trình "${bid.project.title}" đã được duyệt`,
          data: {
            bidId: bid.id,
            bidCode: bid.code,
            projectId: bid.project.id,
            projectCode: bid.project.code,
            projectTitle: bid.project.title,
          },
          createdAt: bid.reviewedAt.toISOString(),
        });
      }

      // BID_REJECTED
      if (
        (!type || type === 'BID_REJECTED') &&
        bid.status === 'REJECTED' &&
        bid.reviewedAt
      ) {
        activities.push({
          id: `bid-rejected-${bid.id}`,
          userId,
          type: 'BID_REJECTED',
          title: 'Đề xuất bị từ chối',
          description: `Đề xuất cho công trình "${bid.project.title}" bị từ chối: ${bid.reviewNote || 'Không có lý do'}`,
          data: {
            bidId: bid.id,
            bidCode: bid.code,
            projectId: bid.project.id,
            projectCode: bid.project.code,
            projectTitle: bid.project.title,
            reviewNote: bid.reviewNote,
          },
          createdAt: bid.reviewedAt.toISOString(),
        });
      }

      // BID_SELECTED
      if (
        (!type || type === 'BID_SELECTED') &&
        bid.status === 'SELECTED' &&
        bid.project.matchedAt
      ) {
        activities.push({
          id: `bid-selected-${bid.id}`,
          userId,
          type: 'BID_SELECTED',
          title: 'Đề xuất được chọn',
          description: `Bạn đã được chọn cho công trình "${bid.project.title}"`,
          data: {
            bidId: bid.id,
            bidCode: bid.code,
            projectId: bid.project.id,
            projectCode: bid.project.code,
            projectTitle: bid.project.title,
          },
          createdAt: bid.project.matchedAt.toISOString(),
        });
      }

      // MATCH_CREATED (for contractor)
      if (
        (!type || type === 'MATCH_CREATED') &&
        bid.status === 'SELECTED' &&
        bid.project.matchedAt
      ) {
        activities.push({
          id: `match-created-contractor-${bid.id}`,
          userId,
          type: 'MATCH_CREATED',
          title: 'Ghép nối thành công',
          description: `Đã được ghép nối với chủ nhà cho công trình "${bid.project.title}"`,
          data: {
            bidId: bid.id,
            bidCode: bid.code,
            projectId: bid.project.id,
            projectCode: bid.project.code,
            projectTitle: bid.project.title,
          },
          createdAt: bid.project.matchedAt.toISOString(),
        });
      }
    }

    return activities;
  }

  /**
   * Get review-related activities
   */
  private async getReviewActivities(
    userId: string,
    dateFilter: { gte?: Date; lte?: Date }
  ): Promise<Activity[]> {
    const activities: Activity[] = [];

    const reviews = await this.prisma.review.findMany({
      where: {
        reviewerId: userId,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const review of reviews) {
      activities.push({
        id: `review-written-${review.id}`,
        userId,
        type: 'REVIEW_WRITTEN',
        title: 'Viết đánh giá',
        description: `Đã đánh giá ${review.rating} sao cho nhà thầu "${review.contractor.name}"`,
        data: {
          reviewId: review.id,
          projectId: review.project.id,
          projectCode: review.project.code,
          projectTitle: review.project.title,
          contractorId: review.contractor.id,
          contractorName: review.contractor.name,
          rating: review.rating,
        },
        createdAt: review.createdAt.toISOString(),
      });
    }

    return activities;
  }
}
