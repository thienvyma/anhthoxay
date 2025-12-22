/**
 * Review Reminder Service
 *
 * Business logic for review reminder scheduled jobs including
 * checking completed projects without reviews and sending reminders.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 20.1, 20.2, 20.3, 20.4**
 */

import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';
import { NotificationChannelService } from './notification-channel.service';
import type {
  ScheduledNotificationType,
  ScheduledNotificationResponse,
} from '../schemas/scheduled-notification.schema';

// ============================================
// CONSTANTS
// ============================================

// Time constants in milliseconds
const DAYS_3 = 3 * 24 * 60 * 60 * 1000;
const DAYS_7 = 7 * 24 * 60 * 60 * 1000;

// ============================================
// TYPES
// ============================================

export interface ReviewReminderJobResult {
  success: boolean;
  projectsChecked: number;
  remindersScheduled: number;
  remindersSent: number;
  errors: string[];
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

export interface ReviewReminderJobStatus {
  lastRunAt: Date | null;
  lastRunResult: ReviewReminderJobResult | null;
  isRunning: boolean;
}

// ============================================
// REVIEW REMINDER SERVICE CLASS
// ============================================

export class ReviewReminderService {
  private prisma: PrismaClient;
  private notificationService: NotificationService;
  private notificationChannelService: NotificationChannelService;
  private isRunning = false;
  private lastRunResult: ReviewReminderJobResult | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.notificationService = new NotificationService(prisma);
    this.notificationChannelService = new NotificationChannelService(prisma);
  }

  // ============================================
  // SCHEDULE OPERATIONS
  // ============================================

  /**
   * Schedule a 3-day review reminder
   * Requirements: 20.1 - Send first reminder 3 days after completion
   *
   * @param projectId - Project ID
   * @param homeownerId - Homeowner user ID
   * @param completedAt - Project completion date
   * @returns Created scheduled notification or null if already exists
   */
  async scheduleReviewReminder3Day(
    projectId: string,
    homeownerId: string,
    completedAt: Date
  ): Promise<ScheduledNotificationResponse | null> {
    const reminderTime = new Date(completedAt.getTime() + DAYS_3);

    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      return null;
    }

    // Check if project already has a review (Property 14: Review Reminder Suppression)
    const existingReview = await this.prisma.review.findFirst({
      where: { projectId, isDeleted: false },
    });

    if (existingReview) {
      return null; // Don't send reminder if review exists
    }

    // Check for existing scheduled notification
    const existing = await this.prisma.scheduledNotification.findFirst({
      where: {
        type: 'REVIEW_REMINDER_3_DAY',
        projectId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return this.transformScheduledNotification(existing);
    }

    const scheduled = await this.prisma.scheduledNotification.create({
      data: {
        type: 'REVIEW_REMINDER_3_DAY',
        userId: homeownerId,
        projectId,
        scheduledFor: reminderTime,
        status: 'PENDING',
      },
    });

    return this.transformScheduledNotification(scheduled);
  }

  /**
   * Schedule a 7-day final review reminder
   * Requirements: 20.2 - Send final reminder 7 days after completion
   *
   * @param projectId - Project ID
   * @param homeownerId - Homeowner user ID
   * @param completedAt - Project completion date
   * @returns Created scheduled notification or null if already exists
   */
  async scheduleReviewReminder7Day(
    projectId: string,
    homeownerId: string,
    completedAt: Date
  ): Promise<ScheduledNotificationResponse | null> {
    const reminderTime = new Date(completedAt.getTime() + DAYS_7);

    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      return null;
    }

    // Check if project already has a review (Property 14: Review Reminder Suppression)
    const existingReview = await this.prisma.review.findFirst({
      where: { projectId, isDeleted: false },
    });

    if (existingReview) {
      return null; // Don't send reminder if review exists
    }

    // Check for existing scheduled notification
    const existing = await this.prisma.scheduledNotification.findFirst({
      where: {
        type: 'REVIEW_REMINDER_7_DAY',
        projectId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return this.transformScheduledNotification(existing);
    }

    const scheduled = await this.prisma.scheduledNotification.create({
      data: {
        type: 'REVIEW_REMINDER_7_DAY',
        userId: homeownerId,
        projectId,
        scheduledFor: reminderTime,
        status: 'PENDING',
      },
    });

    return this.transformScheduledNotification(scheduled);
  }

  /**
   * Schedule both 3-day and 7-day reminders for a completed project
   * Called when a project is marked as completed
   *
   * @param projectId - Project ID
   * @param homeownerId - Homeowner user ID
   * @param completedAt - Project completion date
   */
  async scheduleReviewReminders(
    projectId: string,
    homeownerId: string,
    completedAt: Date
  ): Promise<void> {
    await Promise.all([
      this.scheduleReviewReminder3Day(projectId, homeownerId, completedAt),
      this.scheduleReviewReminder7Day(projectId, homeownerId, completedAt),
    ]);
  }

  // ============================================
  // CANCEL OPERATIONS
  // ============================================

  /**
   * Cancel all pending review reminders for a project
   * Requirements: 20.4 - Don't send reminders if review exists
   *
   * @param projectId - Project ID
   * @returns Number of cancelled reminders
   */
  async cancelReviewReminders(projectId: string): Promise<number> {
    const result = await this.prisma.scheduledNotification.updateMany({
      where: {
        projectId,
        type: { in: ['REVIEW_REMINDER_3_DAY', 'REVIEW_REMINDER_7_DAY'] },
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return result.count;
  }

  // ============================================
  // SEND OPERATIONS
  // ============================================

  /**
   * Send a 3-day review reminder notification
   * Requirements: 20.1 - Send first reminder notification
   */
  async sendReviewReminder3Day(notification: {
    userId: string;
    projectId: string | null;
  }): Promise<void> {
    if (!notification.projectId) {
      throw new ReviewReminderError(
        'MISSING_PROJECT_ID',
        'Project ID is required for review reminder',
        400
      );
    }

    // Get project details
    const project = await this.prisma.project.findUnique({
      where: { id: notification.projectId },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
      },
    });

    if (!project) {
      throw new ReviewReminderError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check if project already has a review (Property 14)
    const existingReview = await this.prisma.review.findFirst({
      where: { projectId: notification.projectId, isDeleted: false },
    });

    if (existingReview) {
      return; // Silently skip - review already exists
    }

    // Only send if project is still COMPLETED
    if (project.status !== 'COMPLETED') {
      return; // Silently skip - project status changed
    }

    // Send in-app notification
    await this.notificationService.create({
      userId: notification.userId,
      type: 'PROJECT_COMPLETED',
      title: 'Nhắc nhở: Đánh giá nhà thầu',
      content: `Công trình "${project.title}" (${project.code}) đã hoàn thành. Hãy đánh giá nhà thầu để giúp cộng đồng có thêm thông tin hữu ích.`,
      data: {
        projectId: project.id,
        projectCode: project.code,
      },
    });

    // Send email notification
    try {
      await this.notificationChannelService.send({
        userId: notification.userId,
        type: 'PROJECT_COMPLETED',
        title: 'Nhắc nhở: Đánh giá nhà thầu',
        content: `Công trình "${project.title}" (${project.code}) đã hoàn thành. Hãy đánh giá nhà thầu để giúp cộng đồng có thêm thông tin hữu ích.`,
        data: {
          projectId: project.id,
          projectCode: project.code,
        },
        channels: ['EMAIL'],
      });
    } catch (error) {
      console.error('Failed to send review reminder email:', error);
    }
  }

  /**
   * Send a 7-day final review reminder notification
   * Requirements: 20.2, 20.3 - Send final reminder with direct link
   */
  async sendReviewReminder7Day(notification: {
    userId: string;
    projectId: string | null;
  }): Promise<void> {
    if (!notification.projectId) {
      throw new ReviewReminderError(
        'MISSING_PROJECT_ID',
        'Project ID is required for review reminder',
        400
      );
    }

    // Get project details
    const project = await this.prisma.project.findUnique({
      where: { id: notification.projectId },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
      },
    });

    if (!project) {
      throw new ReviewReminderError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check if project already has a review (Property 14)
    const existingReview = await this.prisma.review.findFirst({
      where: { projectId: notification.projectId, isDeleted: false },
    });

    if (existingReview) {
      return; // Silently skip - review already exists
    }

    // Only send if project is still COMPLETED
    if (project.status !== 'COMPLETED') {
      return; // Silently skip - project status changed
    }

    // Requirements: 20.3 - Include direct link to review form
    const reviewLink = `/homeowner/projects/${project.id}/review`;

    // Send in-app notification
    await this.notificationService.create({
      userId: notification.userId,
      type: 'PROJECT_COMPLETED',
      title: 'Nhắc nhở cuối: Đánh giá nhà thầu',
      content: `Đây là lời nhắc cuối cùng để đánh giá nhà thầu cho công trình "${project.title}" (${project.code}). Đánh giá của bạn rất quan trọng!`,
      data: {
        projectId: project.id,
        projectCode: project.code,
        reviewLink,
      },
    });

    // Send email notification with direct link
    try {
      await this.notificationChannelService.send({
        userId: notification.userId,
        type: 'PROJECT_COMPLETED',
        title: 'Nhắc nhở cuối: Đánh giá nhà thầu',
        content: `Đây là lời nhắc cuối cùng để đánh giá nhà thầu cho công trình "${project.title}" (${project.code}). Đánh giá của bạn rất quan trọng! Nhấn vào đây để đánh giá ngay: ${reviewLink}`,
        data: {
          projectId: project.id,
          projectCode: project.code,
          reviewLink,
        },
        channels: ['EMAIL'],
      });
    } catch (error) {
      console.error('Failed to send final review reminder email:', error);
    }
  }

  // ============================================
  // JOB PROCESSING
  // ============================================

  /**
   * Process due review reminder notifications
   * Requirements: 20.1, 20.2, 20.4 - Process scheduled reminders
   *
   * @returns Job processing result
   */
  async processDueReminders(): Promise<ReviewReminderJobResult> {
    if (this.isRunning) {
      throw new ReviewReminderError(
        'JOB_ALREADY_RUNNING',
        'Review reminder job is already running',
        409
      );
    }

    this.isRunning = true;
    const startedAt = new Date();
    const errors: string[] = [];
    let remindersSent = 0;

    try {
      const now = new Date();

      // Get all due review reminders
      const dueReminders = await this.prisma.scheduledNotification.findMany({
        where: {
          type: { in: ['REVIEW_REMINDER_3_DAY', 'REVIEW_REMINDER_7_DAY'] },
          status: 'PENDING',
          scheduledFor: { lte: now },
        },
        take: 100, // Process in batches
      });

      for (const reminder of dueReminders) {
        try {
          // Check if review already exists before sending (Property 14)
          if (reminder.projectId) {
            const existingReview = await this.prisma.review.findFirst({
              where: { projectId: reminder.projectId, isDeleted: false },
            });

            if (existingReview) {
              // Cancel the reminder instead of sending
              await this.prisma.scheduledNotification.update({
                where: { id: reminder.id },
                data: {
                  status: 'CANCELLED',
                  cancelledAt: new Date(),
                },
              });
              continue;
            }
          }

          // Send the appropriate reminder
          if (reminder.type === 'REVIEW_REMINDER_3_DAY') {
            await this.sendReviewReminder3Day({
              userId: reminder.userId,
              projectId: reminder.projectId,
            });
          } else if (reminder.type === 'REVIEW_REMINDER_7_DAY') {
            await this.sendReviewReminder7Day({
              userId: reminder.userId,
              projectId: reminder.projectId,
            });
          }

          // Mark as sent
          await this.prisma.scheduledNotification.update({
            where: { id: reminder.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          remindersSent++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to send reminder ${reminder.id}: ${errorMessage}`);
          console.error(`Failed to send review reminder ${reminder.id}:`, error);
        }
      }

      const completedAt = new Date();
      const result: ReviewReminderJobResult = {
        success: errors.length === 0,
        projectsChecked: dueReminders.length,
        remindersScheduled: 0,
        remindersSent,
        errors,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      };

      this.lastRunResult = result;
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  // ============================================
  // SCAN OPERATIONS
  // ============================================

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
        const result = await this.scheduleReviewReminder3Day(
          project.id,
          project.ownerId,
          completedAt
        );
        if (result) scheduled++;
      }

      // Schedule 7-day reminder if within window
      if (daysSinceCompletion < 7) {
        const result = await this.scheduleReviewReminder7Day(
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
   * Get the current job status
   *
   * @returns Current job status
   */
  getStatus(): ReviewReminderJobStatus {
    return {
      lastRunAt: this.lastRunResult?.completedAt ?? null,
      lastRunResult: this.lastRunResult,
      isRunning: this.isRunning,
    };
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Transform scheduled notification from Prisma to response format
   */
  private transformScheduledNotification(notification: {
    id: string;
    type: string;
    userId: string;
    projectId: string | null;
    escrowId: string | null;
    scheduledFor: Date;
    status: string;
    sentAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
  }): ScheduledNotificationResponse {
    return {
      id: notification.id,
      type: notification.type as ScheduledNotificationType,
      userId: notification.userId,
      projectId: notification.projectId,
      escrowId: notification.escrowId,
      scheduledFor: notification.scheduledFor,
      status: notification.status as 'PENDING' | 'SENT' | 'CANCELLED',
      sentAt: notification.sentAt,
      cancelledAt: notification.cancelledAt,
      createdAt: notification.createdAt,
    };
  }
}

// ============================================
// REVIEW REMINDER ERROR CLASS
// ============================================

export class ReviewReminderError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ReviewReminderError';

    const statusMap: Record<string, number> = {
      PROJECT_NOT_FOUND: 404,
      MISSING_PROJECT_ID: 400,
      JOB_ALREADY_RUNNING: 409,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
