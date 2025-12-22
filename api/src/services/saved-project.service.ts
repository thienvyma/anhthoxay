/**
 * Saved Project Service
 *
 * Business logic for contractor saved projects.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 21.1, 21.2, 21.3, 21.4, 21.5**
 */

import { PrismaClient } from '@prisma/client';
import type { ListSavedProjectsQuery, SavedProjectResponse } from '../schemas/saved-project.schema';
import { ScheduledNotificationService } from './scheduled-notification';

// ============================================
// ERROR CLASS
// ============================================

export class SavedProjectError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = 'SavedProjectError';
  }
}

// ============================================
// SERVICE CLASS
// ============================================

export class SavedProjectService {
  private scheduledNotificationService: ScheduledNotificationService;

  constructor(private prisma: PrismaClient) {
    this.scheduledNotificationService = new ScheduledNotificationService(prisma);
  }

  /**
   * Get saved projects for a contractor
   * Requirements: 21.3
   */
  async getSavedProjects(
    contractorId: string,
    query: ListSavedProjectsQuery
  ): Promise<{ data: SavedProjectResponse[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [savedProjects, total] = await Promise.all([
      this.prisma.savedProject.findMany({
        where: { contractorId },
        include: {
          project: {
            include: {
              category: { select: { id: true, name: true } },
              region: { select: { id: true, name: true } },
              _count: { select: { bids: true } },
            },
          },
        },
        orderBy: { savedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.savedProject.count({ where: { contractorId } }),
    ]);

    const data: SavedProjectResponse[] = savedProjects.map((sp) => ({
      id: sp.id,
      projectId: sp.projectId,
      project: {
        id: sp.project.id,
        code: sp.project.code,
        title: sp.project.title,
        description: sp.project.description,
        category: sp.project.category,
        region: sp.project.region,
        area: sp.project.area ?? undefined,
        budgetMin: sp.project.budgetMin ?? undefined,
        budgetMax: sp.project.budgetMax ?? undefined,
        timeline: sp.project.timeline ?? undefined,
        images: sp.project.images ? JSON.parse(sp.project.images) : undefined,
        status: sp.project.status,
        bidDeadline: sp.project.bidDeadline?.toISOString(),
        bidCount: sp.project._count.bids,
        createdAt: sp.project.createdAt.toISOString(),
      },
      savedAt: sp.savedAt.toISOString(),
      isExpired: this.isProjectExpired(sp.project.status, sp.project.bidDeadline),
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Save a project
   * Requirements: 21.1
   */
  async saveProject(contractorId: string, projectId: string): Promise<SavedProjectResponse> {
    // Check if project exists and is OPEN
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        category: { select: { id: true, name: true } },
        region: { select: { id: true, name: true } },
        _count: { select: { bids: true } },
      },
    });

    if (!project) {
      throw new SavedProjectError('PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
    }

    if (project.status !== 'OPEN') {
      throw new SavedProjectError('PROJECT_NOT_OPEN', 'Chỉ có thể lưu công trình đang mở', 400);
    }

    // Check if already saved
    const existing = await this.prisma.savedProject.findUnique({
      where: {
        contractorId_projectId: { contractorId, projectId },
      },
    });

    if (existing) {
      throw new SavedProjectError('ALREADY_SAVED', 'Công trình đã được lưu', 400);
    }

    // Create saved project
    const savedProject = await this.prisma.savedProject.create({
      data: {
        contractorId,
        projectId,
      },
      include: {
        project: {
          include: {
            category: { select: { id: true, name: true } },
            region: { select: { id: true, name: true } },
            _count: { select: { bids: true } },
          },
        },
      },
    });

    // Schedule deadline reminder if project has a deadline (Requirement 21.4)
    if (savedProject.project.bidDeadline) {
      await this.scheduledNotificationService.scheduleSavedProjectDeadlineReminder(
        projectId,
        contractorId,
        savedProject.project.bidDeadline
      );
    }

    return {
      id: savedProject.id,
      projectId: savedProject.projectId,
      project: {
        id: savedProject.project.id,
        code: savedProject.project.code,
        title: savedProject.project.title,
        description: savedProject.project.description,
        category: savedProject.project.category,
        region: savedProject.project.region,
        area: savedProject.project.area ?? undefined,
        budgetMin: savedProject.project.budgetMin ?? undefined,
        budgetMax: savedProject.project.budgetMax ?? undefined,
        timeline: savedProject.project.timeline ?? undefined,
        images: savedProject.project.images ? JSON.parse(savedProject.project.images) : undefined,
        status: savedProject.project.status,
        bidDeadline: savedProject.project.bidDeadline?.toISOString(),
        bidCount: savedProject.project._count.bids,
        createdAt: savedProject.project.createdAt.toISOString(),
      },
      savedAt: savedProject.savedAt.toISOString(),
      isExpired: this.isProjectExpired(savedProject.project.status, savedProject.project.bidDeadline),
    };
  }

  /**
   * Unsave a project
   * Requirements: 21.2
   */
  async unsaveProject(contractorId: string, projectId: string): Promise<void> {
    const existing = await this.prisma.savedProject.findUnique({
      where: {
        contractorId_projectId: { contractorId, projectId },
      },
    });

    if (!existing) {
      throw new SavedProjectError('NOT_SAVED', 'Công trình chưa được lưu', 404);
    }

    await this.prisma.savedProject.delete({
      where: {
        contractorId_projectId: { contractorId, projectId },
      },
    });

    // Cancel any pending deadline reminders (Requirement 21.4)
    await this.scheduledNotificationService.cancelSavedProjectDeadlineReminder(
      contractorId,
      projectId
    );
  }

  /**
   * Check if a project is saved
   */
  async isSaved(contractorId: string, projectId: string): Promise<boolean> {
    const existing = await this.prisma.savedProject.findUnique({
      where: {
        contractorId_projectId: { contractorId, projectId },
      },
    });

    return !!existing;
  }

  /**
   * Check if a project is expired (no longer OPEN)
   * Requirements: 21.5
   */
  private isProjectExpired(status: string, bidDeadline: Date | null): boolean {
    // Project is expired if status is not OPEN
    if (status !== 'OPEN') {
      return true;
    }

    // Project is expired if bid deadline has passed
    if (bidDeadline && new Date(bidDeadline) < new Date()) {
      return true;
    }

    return false;
  }

  /**
   * Get saved projects with approaching deadlines (for reminder notifications)
   * Requirements: 21.4
   */
  async getSavedProjectsWithApproachingDeadlines(hoursBeforeDeadline = 24): Promise<
    Array<{
      contractorId: string;
      projectId: string;
      projectCode: string;
      projectTitle: string;
      bidDeadline: Date;
    }>
  > {
    const now = new Date();
    const deadlineThreshold = new Date(now.getTime() + hoursBeforeDeadline * 60 * 60 * 1000);

    const savedProjects = await this.prisma.savedProject.findMany({
      where: {
        project: {
          status: 'OPEN',
          bidDeadline: {
            gte: now,
            lte: deadlineThreshold,
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            title: true,
            bidDeadline: true,
          },
        },
      },
    });

    return savedProjects
      .filter((sp): sp is typeof sp & { project: { bidDeadline: Date } } => sp.project.bidDeadline !== null)
      .map((sp) => ({
        contractorId: sp.contractorId,
        projectId: sp.project.id,
        projectCode: sp.project.code,
        projectTitle: sp.project.title,
        bidDeadline: sp.project.bidDeadline,
      }));
  }
}
