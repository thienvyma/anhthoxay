/**
 * Match Workflow Service
 *
 * Handles bid selection, project start, and project completion workflows.
 *
 * **Feature: bidding-phase3-matching, bidding-phase4-communication**
 * **Requirements: 1.1-1.7, 11.1-11.6, 12.3, 17.1-17.4, 20.1-20.2**
 */

import { PrismaClient } from '@prisma/client';
import { EscrowService } from '../escrow.service';
import { FeeService } from '../fee.service';
import { NotificationService } from '../notification.service';
import { NotificationChannelService } from '../notification-channel.service';
import { ScheduledNotificationService } from '../scheduled-notification';
import {
  MatchError,
  MatchResult,
  VALID_PROJECT_TRANSITIONS,
} from './types';

// ============================================
// MATCH WORKFLOW SERVICE CLASS
// ============================================

export class MatchWorkflowService {
  private prisma: PrismaClient;
  private escrowService: EscrowService;
  private feeService: FeeService;
  private notificationService: NotificationService;
  private notificationChannelService: NotificationChannelService;
  private scheduledNotificationService: ScheduledNotificationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.escrowService = new EscrowService(prisma);
    this.feeService = new FeeService(prisma);
    this.notificationService = new NotificationService(prisma);
    this.notificationChannelService = new NotificationChannelService(prisma);
    this.scheduledNotificationService = new ScheduledNotificationService(prisma);
  }

  // ============================================
  // BID SELECTION
  // ============================================

  /**
   * Select a bid for a project (homeowner action)
   * NEW FLOW: Homeowner selects a PENDING bid → Project goes to PENDING_MATCH
   * Admin will approve the match later
   *
   * @param projectId - The project ID
   * @param bidId - The bid ID to select
   * @param homeownerId - The homeowner user ID
   * @returns Selected bid info (no escrow/fee yet - created when admin approves)
   */
  async selectBid(
    projectId: string,
    bidId: string,
    homeownerId: string
  ): Promise<{ project: { id: string; code: string; title: string; status: string }; selectedBid: { id: string; code: string; price: number; status: string } }> {
    // Get project with owner info
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
      },
    });

    if (!project) {
      throw new MatchError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Validate homeowner owns the project
    if (project.ownerId !== homeownerId) {
      throw new MatchError(
        'NOT_PROJECT_OWNER',
        'You are not the owner of this project',
        403
      );
    }

    // Validate project status is BIDDING_CLOSED
    if (project.status !== 'BIDDING_CLOSED') {
      throw new MatchError(
        'INVALID_PROJECT_STATUS',
        `Cannot select bid when project status is ${project.status}. Expected BIDDING_CLOSED`,
        400
      );
    }

    // Get the bid
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        contractor: { select: { id: true } },
      },
    });

    if (!bid) {
      throw new MatchError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    // Validate bid belongs to this project
    if (bid.projectId !== projectId) {
      throw new MatchError(
        'BID_NOT_FOR_PROJECT',
        'This bid does not belong to the specified project',
        400
      );
    }

    // NEW: Accept PENDING bids (not just APPROVED)
    if (bid.status !== 'PENDING') {
      throw new MatchError(
        'INVALID_BID_STATUS',
        `Cannot select bid with status ${bid.status}. Expected PENDING`,
        400
      );
    }

    // Perform updates in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update selected bid status to SELECTED
      const updatedBid = await tx.bid.update({
        where: { id: bidId },
        data: { status: 'SELECTED' },
      });

      // Update project to PENDING_MATCH with selectedBidId
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'PENDING_MATCH',
          selectedBidId: bidId,
        },
      });

      return { updatedBid, updatedProject };
    });

    // Notify contractor that their bid was selected (pending admin approval)
    try {
      await this.notificationService.create({
        userId: bid.contractorId,
        type: 'BID_SELECTED',
        title: 'Bid của bạn đã được chủ nhà chọn!',
        content: `Bid ${result.updatedBid.code} cho dự án ${result.updatedProject.code} đã được chủ nhà chọn. Đang chờ Admin duyệt để kết nối.`,
        data: {
          projectId: result.updatedProject.id,
          projectCode: result.updatedProject.code,
          bidId: result.updatedBid.id,
          bidCode: result.updatedBid.code,
        },
      });
    } catch (error) {
      console.error('Failed to send BID_SELECTED notification:', error);
    }

    return {
      project: {
        id: result.updatedProject.id,
        code: result.updatedProject.code,
        title: result.updatedProject.title,
        status: result.updatedProject.status,
      },
      selectedBid: {
        id: result.updatedBid.id,
        code: result.updatedBid.code,
        price: result.updatedBid.price,
        status: result.updatedBid.status,
      },
    };
  }

  /**
   * Admin approves a match (final step)
   * Creates escrow, fee transaction, and notifies both parties
   *
   * @param projectId - The project ID
   * @param adminId - The admin user ID
   * @param note - Optional approval note
   * @returns Match result with escrow and fee
   */
  async approveMatch(
    projectId: string,
    adminId: string,
    note?: string
  ): Promise<MatchResult> {
    // Get project with selected bid
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
        selectedBid: {
          include: {
            contractor: { select: { id: true } },
          },
        },
      },
    });

    if (!project) {
      throw new MatchError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Validate project status is PENDING_MATCH
    if (project.status !== 'PENDING_MATCH') {
      throw new MatchError(
        'INVALID_PROJECT_STATUS',
        `Cannot approve match when project status is ${project.status}. Expected PENDING_MATCH`,
        400
      );
    }

    if (!project.selectedBid) {
      throw new MatchError('BID_NOT_FOUND', 'No bid selected for this project', 400);
    }

    const bid = project.selectedBid;

    // Calculate escrow amount
    const escrowAmount = await this.escrowService.calculateAmount(bid.price);

    // Calculate win fee
    const winFee = await this.feeService.calculateWinFee(bid.price);

    // Perform all updates in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update bid status to APPROVED
      const updatedBid = await tx.bid.update({
        where: { id: bid.id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNote: note ?? null,
        },
      });

      // Update all other bids to NOT_SELECTED
      await tx.bid.updateMany({
        where: {
          projectId,
          id: { not: bid.id },
          status: { in: ['PENDING', 'SELECTED'] },
        },
        data: { status: 'NOT_SELECTED' },
      });

      // Update project to MATCHED
      const matchedAt = new Date();
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'MATCHED',
          matchedAt,
        },
      });

      return { updatedBid, updatedProject, matchedAt };
    });

    // Create escrow (outside transaction for code generation)
    const escrow = await this.escrowService.create(
      projectId,
      bid.id,
      project.ownerId,
      escrowAmount.amount
    );

    // Create fee transaction
    const feeTransaction = await this.feeService.create(
      'WIN_FEE',
      bid.contractorId,
      winFee.amount,
      projectId,
      bid.id
    );

    // Notify both parties
    try {
      // Notify contractor
      await this.notificationChannelService.send({
        userId: bid.contractorId,
        type: 'PROJECT_MATCHED',
        title: 'Chúc mừng! Bạn đã được kết nối với chủ nhà',
        content: `Dự án ${result.updatedProject.code} đã được Admin duyệt. Bạn có thể xem thông tin liên hệ của chủ nhà.`,
        data: {
          projectId: result.updatedProject.id,
          projectCode: result.updatedProject.code,
          bidId: result.updatedBid.id,
          bidCode: result.updatedBid.code,
        },
        channels: ['EMAIL', 'SMS'],
      });

      // Notify homeowner
      await this.notificationChannelService.send({
        userId: project.ownerId,
        type: 'PROJECT_MATCHED',
        title: 'Dự án đã được kết nối với nhà thầu',
        content: `Dự án ${result.updatedProject.code} đã được Admin duyệt. Bạn có thể xem thông tin liên hệ của nhà thầu.`,
        data: {
          projectId: result.updatedProject.id,
          projectCode: result.updatedProject.code,
          bidId: result.updatedBid.id,
          bidCode: result.updatedBid.code,
        },
        channels: ['EMAIL', 'SMS'],
      });
    } catch (error) {
      console.error('Failed to send PROJECT_MATCHED notifications:', error);
    }

    return {
      project: {
        id: result.updatedProject.id,
        code: result.updatedProject.code,
        title: result.updatedProject.title,
        status: result.updatedProject.status,
        matchedAt: result.matchedAt,
      },
      selectedBid: {
        id: result.updatedBid.id,
        code: result.updatedBid.code,
        price: result.updatedBid.price,
        status: result.updatedBid.status,
      },
      escrow: {
        id: escrow.id,
        code: escrow.code,
        amount: escrow.amount,
        status: escrow.status,
      },
      feeTransaction: {
        id: feeTransaction.id,
        code: feeTransaction.code,
        amount: feeTransaction.amount,
        status: feeTransaction.status,
      },
    };
  }

  /**
   * Admin rejects a match
   * Reverts project to BIDDING_CLOSED, bid to PENDING
   *
   * @param projectId - The project ID
   * @param adminId - The admin user ID
   * @param note - Rejection reason (required)
   */
  async rejectMatch(
    projectId: string,
    adminId: string,
    note: string
  ): Promise<{ project: { id: string; code: string; status: string }; bid: { id: string; code: string; status: string } }> {
    // Get project with selected bid
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
        selectedBid: {
          include: {
            contractor: { select: { id: true } },
          },
        },
      },
    });

    if (!project) {
      throw new MatchError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Validate project status is PENDING_MATCH
    if (project.status !== 'PENDING_MATCH') {
      throw new MatchError(
        'INVALID_PROJECT_STATUS',
        `Cannot reject match when project status is ${project.status}. Expected PENDING_MATCH`,
        400
      );
    }

    if (!project.selectedBid) {
      throw new MatchError('BID_NOT_FOUND', 'No bid selected for this project', 400);
    }

    const bid = project.selectedBid;

    // Perform updates in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Revert bid status to PENDING
      const updatedBid = await tx.bid.update({
        where: { id: bid.id },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNote: note,
        },
      });

      // Revert project to BIDDING_CLOSED
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'BIDDING_CLOSED',
          selectedBidId: null,
        },
      });

      return { updatedBid, updatedProject };
    });

    // Notify both parties
    try {
      // Notify contractor
      await this.notificationService.create({
        userId: bid.contractorId,
        type: 'BID_NOT_SELECTED',
        title: 'Kết nối không được duyệt',
        content: `Kết nối cho dự án ${result.updatedProject.code} không được Admin duyệt. Lý do: ${note}`,
        data: {
          projectId: result.updatedProject.id,
          projectCode: result.updatedProject.code,
          bidId: result.updatedBid.id,
          bidCode: result.updatedBid.code,
        },
      });

      // Notify homeowner
      await this.notificationService.create({
        userId: project.ownerId,
        type: 'BID_NOT_SELECTED',
        title: 'Kết nối không được duyệt',
        content: `Kết nối cho dự án ${result.updatedProject.code} không được Admin duyệt. Lý do: ${note}. Bạn có thể chọn nhà thầu khác.`,
        data: {
          projectId: result.updatedProject.id,
          projectCode: result.updatedProject.code,
        },
      });
    } catch (error) {
      console.error('Failed to send rejection notifications:', error);
    }

    return {
      project: {
        id: result.updatedProject.id,
        code: result.updatedProject.code,
        status: result.updatedProject.status,
      },
      bid: {
        id: result.updatedBid.id,
        code: result.updatedBid.code,
        status: result.updatedBid.status,
      },
    };
  }

  // ============================================
  // PROJECT STATUS TRANSITIONS
  // ============================================

  /**
   * Validate project status transition
   * Requirements: 11.1-11.6 - Define valid status transitions
   *
   * @param currentStatus - Current project status
   * @param newStatus - Target status
   * @returns true if valid, throws error otherwise
   */
  validateProjectTransition(currentStatus: string, newStatus: string): boolean {
    const validNextStatuses = VALID_PROJECT_TRANSITIONS[currentStatus] || [];

    if (!validNextStatuses.includes(newStatus)) {
      throw new MatchError(
        'INVALID_PROJECT_STATUS_TRANSITION',
        `Cannot transition project from ${currentStatus} to ${newStatus}`,
        400
      );
    }

    return true;
  }

  /**
   * Start a matched project (transition to IN_PROGRESS)
   * Requirements: 11.6 - Allow transition to IN_PROGRESS status
   *
   * @param projectId - The project ID
   * @param homeownerId - The homeowner user ID
   * @returns Updated project
   */
  async startProject(
    projectId: string,
    homeownerId: string
  ): Promise<{ id: string; code: string; status: string }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new MatchError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.ownerId !== homeownerId) {
      throw new MatchError(
        'NOT_PROJECT_OWNER',
        'You are not the owner of this project',
        403
      );
    }

    // Validate transition
    this.validateProjectTransition(project.status, 'IN_PROGRESS');

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'IN_PROGRESS' },
    });

    return {
      id: updated.id,
      code: updated.code,
      status: updated.status,
    };
  }

  /**
   * Complete a project
   * Requirements: 17.1, 17.2 - Confirm completion and release escrow
   * Requirements: 6.1 - Increment contractor totalProjects on project completion
   *
   * @param projectId - The project ID
   * @param homeownerId - The homeowner user ID
   * @returns Updated project
   */
  async completeProject(
    projectId: string,
    homeownerId: string
  ): Promise<{ id: string; code: string; status: string }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        escrow: true,
        selectedBid: {
          include: {
            contractor: true,
          },
        },
      },
    });

    if (!project) {
      throw new MatchError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.ownerId !== homeownerId) {
      throw new MatchError(
        'NOT_PROJECT_OWNER',
        'You are not the owner of this project',
        403
      );
    }

    // Validate transition
    this.validateProjectTransition(project.status, 'COMPLETED');

    // Update project status
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'COMPLETED' },
    });

    // Requirements: 17.4, 6.1 - Update contractor's totalProjects count
    if (project.selectedBid) {
      const contractorId = project.selectedBid.contractorId;
      
      // Update User model totalProjects
      await this.prisma.user.update({
        where: { id: contractorId },
        data: {
          totalProjects: { increment: 1 },
        },
      });

      // Requirements: 6.1 - Update ContractorRanking stats if exists
      const existingRanking = await this.prisma.contractorRanking.findUnique({
        where: { contractorId },
      });

      if (existingRanking) {
        // Increment totalProjects and completedProjects in ContractorRanking
        await this.prisma.contractorRanking.update({
          where: { contractorId },
          data: {
            totalProjects: { increment: 1 },
            completedProjects: { increment: 1 },
          },
        });
      } else {
        // Create ContractorRanking if it doesn't exist
        // Get current stats for the contractor
        const completedCount = await this.prisma.project.count({
          where: {
            selectedBid: { contractorId },
            status: 'COMPLETED',
          },
        });

        const totalCount = await this.prisma.project.count({
          where: {
            selectedBid: { contractorId },
            status: { in: ['MATCHED', 'IN_PROGRESS', 'COMPLETED'] },
          },
        });

        const reviews = await this.prisma.review.findMany({
          where: { contractorId, isDeleted: false },
          select: { rating: true },
        });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

        await this.prisma.contractorRanking.create({
          data: {
            contractorId,
            totalProjects: totalCount,
            completedProjects: completedCount,
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10,
          },
        });
      }
    }

    // Requirements: 20.1, 20.2 - Schedule review reminders
    await this.scheduleReviewReminders(projectId, homeownerId);

    return {
      id: updated.id,
      code: updated.code,
      status: updated.status,
    };
  }

  /**
   * Schedule review reminders after project completion
   * Requirements: 20.1, 20.2 - Schedule 3-day and 7-day reminders
   *
   * @param projectId - The project ID
   * @param homeownerId - The homeowner user ID
   */
  private async scheduleReviewReminders(
    projectId: string,
    homeownerId: string
  ): Promise<void> {
    const completedAt = new Date();
    
    try {
      // Schedule 3-day reminder
      await this.scheduledNotificationService.scheduleReviewReminder3Day(
        projectId,
        homeownerId,
        completedAt
      );
      
      // Schedule 7-day reminder
      await this.scheduledNotificationService.scheduleReviewReminder7Day(
        projectId,
        homeownerId,
        completedAt
      );
    } catch (error) {
      // Log error but don't fail the completion
      console.error('Failed to schedule review reminders:', error);
    }
  }
}
