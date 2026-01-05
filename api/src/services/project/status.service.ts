/**
 * Project Status Service
 *
 * Status transition operations for project management.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 7.1, 7.4**
 */

import { PrismaClient } from '@prisma/client';
import { ScheduledNotificationService } from '../scheduled-notification';
import type { ProjectStatus } from '../../schemas/project.schema';
import type { ProjectWithRelations } from './types';
import { PROJECT_STATUS_TRANSITIONS } from './constants';
import { getProjectInclude, transformProject, ProjectError } from './helpers';

// ============================================
// PROJECT STATUS SERVICE
// ============================================

export class ProjectStatusService {
  private scheduledNotificationService: ScheduledNotificationService;

  constructor(private prisma: PrismaClient) {
    this.scheduledNotificationService = new ScheduledNotificationService(prisma);
  }

  // ============================================
  // STATUS TRANSITION HELPERS
  // ============================================

  /**
   * Check if a status transition is valid
   * Requirements: 2.1-2.6
   */
  isValidTransition(currentStatus: ProjectStatus, newStatus: ProjectStatus): boolean {
    const allowedTransitions = PROJECT_STATUS_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Transition project status
   * Requirements: 2.1-2.6 - Validate transition before applying
   * Optimized: Use select to limit returned fields for validation
   */
  async transitionStatus(
    id: string,
    newStatus: ProjectStatus,
    userId?: string
  ): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    const currentStatus = project.status as ProjectStatus;

    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new ProjectError(
        'PROJECT_INVALID_TRANSITION',
        `Cannot transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    // Set additional fields based on transition
    if (newStatus === 'MATCHED') {
      updateData.matchedAt = new Date();
    }

    if (userId) {
      updateData.reviewedBy = userId;
      updateData.reviewedAt = new Date();
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: getProjectInclude(),
    });

    return transformProject(updated);
  }

  // ============================================
  // HOMEOWNER STATUS OPERATIONS
  // ============================================

  /**
   * Submit project for approval
   * Requirements: 3.3, 3.4 - Change status to PENDING_APPROVAL and validate bidDeadline
   * Optimized: Combined project and settings queries using Promise.all
   */
  async submit(id: string, ownerId: string, bidDeadline: Date): Promise<ProjectWithRelations> {
    // Optimized: Fetch project and settings in parallel
    const [project, settings] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id },
        select: {
          id: true,
          ownerId: true,
          status: true,
        },
      }),
      this.prisma.biddingSettings.findUnique({
        where: { id: 'default' },
        select: {
          minBidDuration: true,
          maxBidDuration: true,
        },
      }),
    ]);

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check ownership
    if (project.ownerId !== ownerId) {
      throw new ProjectError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    // Check status allows submission
    if (project.status !== 'DRAFT') {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Can only submit projects in DRAFT status',
        400
      );
    }

    // Validate bidDeadline against BiddingSettings
    const minDays = settings?.minBidDuration ?? 3;
    const maxDays = settings?.maxBidDuration ?? 30;

    const now = new Date();
    const minDeadline = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
    const maxDeadline = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

    if (bidDeadline < minDeadline) {
      throw new ProjectError(
        'PROJECT_DEADLINE_TOO_SHORT',
        `Bid deadline must be at least ${minDays} days from now`,
        400
      );
    }

    if (bidDeadline > maxDeadline) {
      throw new ProjectError(
        'PROJECT_DEADLINE_TOO_LONG',
        `Bid deadline cannot exceed ${maxDays} days from now`,
        400
      );
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
        bidDeadline,
      },
      include: getProjectInclude(),
    });

    return transformProject(updated);
  }

  // ============================================
  // ADMIN STATUS OPERATIONS
  // ============================================

  /**
   * Approve a project
   * Requirements: 4.3, 4.5 - Change status to OPEN, set publishedAt, validate deadline
   * Requirements: 20.1, 20.2 - Schedule bid deadline and no-bids reminders
   * Optimized: Use select to limit returned fields for validation
   */
  async approve(id: string, adminId: string, note?: string): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        status: true,
        bidDeadline: true,
      },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check status allows approval
    if (project.status !== 'PENDING_APPROVAL') {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Can only approve projects in PENDING_APPROVAL status',
        400
      );
    }

    // Validate bidDeadline is in the future
    if (!project.bidDeadline || project.bidDeadline <= new Date()) {
      throw new ProjectError(
        'PROJECT_DEADLINE_PAST',
        'Bid deadline must be in the future',
        400
      );
    }

    const publishedAt = new Date();

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: 'OPEN',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note ?? null,
        publishedAt,
      },
      include: getProjectInclude(),
    });

    // Schedule bid deadline reminder (24h before deadline)
    // Requirements: 20.1
    try {
      await this.scheduledNotificationService.scheduleBidDeadlineReminder(
        project.id,
        project.ownerId,
        project.bidDeadline
      );
    } catch (error) {
      // Log but don't fail the approval
      console.error('Failed to schedule bid deadline reminder:', error);
    }

    // Schedule no-bids reminder (3 days after publish)
    // Requirements: 20.2
    try {
      await this.scheduledNotificationService.scheduleNoBidsReminder(
        project.id,
        project.ownerId,
        publishedAt
      );
    } catch (error) {
      // Log but don't fail the approval
      console.error('Failed to schedule no-bids reminder:', error);
    }

    return transformProject(updated);
  }

  /**
   * Reject a project
   * Requirements: 4.4 - Change status to REJECTED and store rejection note
   * Optimized: Use select to limit returned fields for validation
   */
  async reject(id: string, adminId: string, note: string): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check status allows rejection
    if (project.status !== 'PENDING_APPROVAL') {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Can only reject projects in PENDING_APPROVAL status',
        400
      );
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
      include: getProjectInclude(),
    });

    return transformProject(updated);
  }
}
