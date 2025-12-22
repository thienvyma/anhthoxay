/**
 * Scanner Service
 *
 * Scan and auto-schedule logic for scheduled notifications.
 * Scans for projects/escrows that need reminders and schedules them.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 20.1, 20.2, 20.3, 20.4**
 */

import { PrismaClient } from '@prisma/client';
import { ReminderService } from './reminder.service';
import { HOURS_24, HOURS_48, DAYS_3 } from './types';

// ============================================
// SCANNER SERVICE CLASS
// ============================================

export class ScannerService {
  private prisma: PrismaClient;
  private reminderService: ReminderService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.reminderService = new ReminderService(prisma);
  }

  // ============================================
  // SCAN OPERATIONS (for initial scheduling)
  // ============================================

  /**
   * Scan and schedule bid deadline reminders for all open projects
   * This should be run once on startup or periodically to catch any missed schedules
   *
   * @returns Number of reminders scheduled
   */
  async scanAndScheduleBidDeadlineReminders(): Promise<number> {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + HOURS_24);

    // Find projects with deadlines in the next 24h that don't have reminders
    const projects = await this.prisma.project.findMany({
      where: {
        status: 'OPEN',
        bidDeadline: {
          gt: now,
          lte: reminderWindow,
        },
      },
      select: {
        id: true,
        ownerId: true,
        bidDeadline: true,
      },
    });

    let scheduled = 0;
    for (const project of projects) {
      if (project.bidDeadline) {
        const result = await this.reminderService.scheduleBidDeadlineReminder(
          project.id,
          project.ownerId,
          project.bidDeadline
        );
        if (result) scheduled++;
      }
    }

    return scheduled;
  }

  /**
   * Scan and schedule no-bids reminders for projects without bids
   *
   * @returns Number of reminders scheduled
   */
  async scanAndScheduleNoBidsReminders(): Promise<number> {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - DAYS_3);

    // Find projects published more than 3 days ago with no bids
    const projects = await this.prisma.project.findMany({
      where: {
        status: 'OPEN',
        publishedAt: {
          lte: threeDaysAgo,
        },
        bids: {
          none: {},
        },
      },
      select: {
        id: true,
        ownerId: true,
        publishedAt: true,
      },
    });

    let scheduled = 0;
    for (const project of projects) {
      if (project.publishedAt) {
        await this.reminderService.scheduleNoBidsReminder(
          project.id,
          project.ownerId,
          project.publishedAt
        );
        scheduled++;
      }
    }

    return scheduled;
  }

  /**
   * Scan and schedule escrow pending reminders
   *
   * @returns Number of reminders scheduled
   */
  async scanAndScheduleEscrowPendingReminders(): Promise<number> {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - HOURS_48);

    // Find pending escrows created more than 48h ago
    const escrows = await this.prisma.escrow.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lte: fortyEightHoursAgo,
        },
      },
      select: {
        id: true,
        projectId: true,
        homeownerId: true,
        createdAt: true,
      },
    });

    let scheduled = 0;
    for (const escrow of escrows) {
      await this.reminderService.scheduleEscrowPendingReminder(
        escrow.id,
        escrow.projectId,
        escrow.homeownerId,
        escrow.createdAt
      );
      scheduled++;
    }

    return scheduled;
  }

  /**
   * Scan and schedule review reminders for completed projects without reviews
   * Requirements: 20.1, 20.2 - Check completed projects without reviews
   *
   * @returns Number of reminders scheduled
   */
  async scanAndScheduleReviewReminders(): Promise<number> {
    const now = new Date();
    let scheduled = 0;

    // Find completed projects without reviews
    const completedProjects = await this.prisma.project.findMany({
      where: {
        status: 'COMPLETED',
        reviews: {
          none: {
            isDeleted: false,
          },
        },
      },
      select: {
        id: true,
        ownerId: true,
        updatedAt: true, // Use updatedAt as completion time
      },
    });

    for (const project of completedProjects) {
      const completedAt = project.updatedAt;
      const daysSinceCompletion = (now.getTime() - completedAt.getTime()) / (24 * 60 * 60 * 1000);

      // Schedule 3-day reminder if within window
      if (daysSinceCompletion < 3) {
        const result = await this.reminderService.scheduleReviewReminder3Day(
          project.id,
          project.ownerId,
          completedAt
        );
        if (result) scheduled++;
      }

      // Schedule 7-day reminder if within window
      if (daysSinceCompletion < 7) {
        const result = await this.reminderService.scheduleReviewReminder7Day(
          project.id,
          project.ownerId,
          completedAt
        );
        if (result) scheduled++;
      }
    }

    return scheduled;
  }

  /**
   * Scan and schedule saved project deadline reminders
   * Requirements: 21.4 - Check saved projects with approaching deadlines
   *
   * @returns Number of reminders scheduled
   */
  async scanAndScheduleSavedProjectDeadlineReminders(): Promise<number> {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + HOURS_24);

    // Find saved projects with deadlines in the next 24h
    const savedProjects = await this.prisma.savedProject.findMany({
      where: {
        project: {
          status: 'OPEN',
          bidDeadline: {
            gt: now,
            lte: reminderWindow,
          },
        },
      },
      select: {
        contractorId: true,
        projectId: true,
        project: {
          select: {
            bidDeadline: true,
          },
        },
      },
    });

    let scheduled = 0;
    for (const savedProject of savedProjects) {
      if (savedProject.project.bidDeadline) {
        const result = await this.reminderService.scheduleSavedProjectDeadlineReminder(
          savedProject.projectId,
          savedProject.contractorId,
          savedProject.project.bidDeadline
        );
        if (result) scheduled++;
      }
    }

    return scheduled;
  }

  /**
   * Run all scan operations
   *
   * @returns Total number of reminders scheduled by category
   */
  async scanAll(): Promise<{
    bidDeadlineReminders: number;
    noBidsReminders: number;
    escrowPendingReminders: number;
    reviewReminders: number;
    savedProjectReminders: number;
    total: number;
  }> {
    const [bidDeadline, noBids, escrowPending, review, savedProject] = await Promise.all([
      this.scanAndScheduleBidDeadlineReminders(),
      this.scanAndScheduleNoBidsReminders(),
      this.scanAndScheduleEscrowPendingReminders(),
      this.scanAndScheduleReviewReminders(),
      this.scanAndScheduleSavedProjectDeadlineReminders(),
    ]);

    return {
      bidDeadlineReminders: bidDeadline,
      noBidsReminders: noBids,
      escrowPendingReminders: escrowPending,
      reviewReminders: review,
      savedProjectReminders: savedProject,
      total: bidDeadline + noBids + escrowPending + review + savedProject,
    };
  }
}
