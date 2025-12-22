/**
 * Reminder Service
 *
 * Reminder-specific logic for scheduled notifications including
 * bid deadline, no-bids, escrow pending, review, and saved project reminders.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 20.1, 20.2, 20.3, 20.4**
 */

import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification.service';
import { SchedulerService } from './scheduler.service';
import {
  type ScheduledNotificationResponse,
  type ScheduledNotificationType,
  ScheduledNotificationError,
  transformScheduledNotification,
  HOURS_24,
  HOURS_48,
  DAYS_3,
  DAYS_7,
} from './types';

// ============================================
// REMINDER SERVICE CLASS
// ============================================

export class ReminderService {
  private prisma: PrismaClient;
  private notificationService: NotificationService;
  private schedulerService: SchedulerService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.notificationService = new NotificationService(prisma);
    this.schedulerService = new SchedulerService(prisma);
  }

  // ============================================
  // SCHEDULE REMINDER OPERATIONS
  // ============================================

  /**
   * Schedule bid deadline reminder (24h before deadline)
   * Requirements: 20.1 - Schedule 24h before deadline
   *
   * @param projectId - Project ID
   * @param homeownerId - Homeowner user ID
   * @param bidDeadline - Bid deadline date
   * @returns Created scheduled notification or null if deadline too soon
   */
  async scheduleBidDeadlineReminder(
    projectId: string,
    homeownerId: string,
    bidDeadline: Date
  ): Promise<ScheduledNotificationResponse | null> {
    const reminderTime = new Date(bidDeadline.getTime() - HOURS_24);
    
    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      return null;
    }

    return this.schedulerService.create({
      type: 'BID_DEADLINE_REMINDER',
      userId: homeownerId,
      projectId,
      scheduledFor: reminderTime,
    });
  }

  /**
   * Schedule no-bids reminder (3 days after project open)
   * Requirements: 20.2 - Check projects after 3 days
   *
   * @param projectId - Project ID
   * @param homeownerId - Homeowner user ID
   * @param publishedAt - Project published date
   * @returns Created scheduled notification
   */
  async scheduleNoBidsReminder(
    projectId: string,
    homeownerId: string,
    publishedAt: Date
  ): Promise<ScheduledNotificationResponse> {
    const reminderTime = new Date(publishedAt.getTime() + DAYS_3);

    return this.schedulerService.create({
      type: 'NO_BIDS_REMINDER',
      userId: homeownerId,
      projectId,
      scheduledFor: reminderTime,
    });
  }

  /**
   * Schedule escrow pending reminder (48h after creation)
   * Requirements: 20.3 - Check pending escrows after 48h
   *
   * @param escrowId - Escrow ID
   * @param projectId - Project ID
   * @param homeownerId - Homeowner user ID
   * @param createdAt - Escrow creation date
   * @returns Created scheduled notification
   */
  async scheduleEscrowPendingReminder(
    escrowId: string,
    projectId: string,
    homeownerId: string,
    createdAt: Date
  ): Promise<ScheduledNotificationResponse> {
    const reminderTime = new Date(createdAt.getTime() + HOURS_48);

    return this.schedulerService.create({
      type: 'ESCROW_PENDING_REMINDER',
      userId: homeownerId,
      projectId,
      escrowId,
      scheduledFor: reminderTime,
    });
  }

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
      return transformScheduledNotification(existing);
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

    return transformScheduledNotification(scheduled);
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
      return transformScheduledNotification(existing);
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

    return transformScheduledNotification(scheduled);
  }

  /**
   * Schedule saved project deadline reminder (24h before deadline)
   * Requirements: 21.4 - Send reminder 24h before deadline for saved projects
   *
   * @param projectId - Project ID
   * @param contractorId - Contractor user ID
   * @param bidDeadline - Bid deadline date
   * @returns Created scheduled notification or null if deadline too soon
   */
  async scheduleSavedProjectDeadlineReminder(
    projectId: string,
    contractorId: string,
    bidDeadline: Date
  ): Promise<ScheduledNotificationResponse | null> {
    const reminderTime = new Date(bidDeadline.getTime() - HOURS_24);
    
    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      return null;
    }

    // Check for existing scheduled notification
    const existing = await this.prisma.scheduledNotification.findFirst({
      where: {
        type: 'SAVED_PROJECT_DEADLINE_REMINDER',
        userId: contractorId,
        projectId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return transformScheduledNotification(existing);
    }

    const scheduled = await this.prisma.scheduledNotification.create({
      data: {
        type: 'SAVED_PROJECT_DEADLINE_REMINDER',
        userId: contractorId,
        projectId,
        scheduledFor: reminderTime,
        status: 'PENDING',
      },
    });

    return transformScheduledNotification(scheduled);
  }

  // ============================================
  // CANCEL REMINDER OPERATIONS
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

  /**
   * Cancel saved project deadline reminders for a contractor
   *
   * @param contractorId - Contractor user ID
   * @param projectId - Project ID
   * @returns Number of cancelled reminders
   */
  async cancelSavedProjectDeadlineReminder(
    contractorId: string,
    projectId: string
  ): Promise<number> {
    const result = await this.prisma.scheduledNotification.updateMany({
      where: {
        type: 'SAVED_PROJECT_DEADLINE_REMINDER',
        userId: contractorId,
        projectId,
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
  // SEND REMINDER OPERATIONS
  // ============================================

  /**
   * Send a scheduled notification based on its type
   *
   * @param notification - Scheduled notification to send
   */
  async sendScheduledNotification(notification: {
    id: string;
    type: string;
    userId: string;
    projectId: string | null;
    escrowId: string | null;
  }): Promise<void> {
    const type = notification.type as ScheduledNotificationType;

    switch (type) {
      case 'BID_DEADLINE_REMINDER':
        await this.sendBidDeadlineReminder(notification);
        break;
      case 'NO_BIDS_REMINDER':
        await this.sendNoBidsReminder(notification);
        break;
      case 'ESCROW_PENDING_REMINDER':
        await this.sendEscrowPendingReminder(notification);
        break;
      case 'REVIEW_REMINDER_3_DAY':
        await this.sendReviewReminder3Day(notification);
        break;
      case 'REVIEW_REMINDER_7_DAY':
        await this.sendReviewReminder7Day(notification);
        break;
      case 'SAVED_PROJECT_DEADLINE_REMINDER':
        await this.sendSavedProjectDeadlineReminder(notification);
        break;
      default:
        throw new ScheduledNotificationError(
          'UNKNOWN_TYPE',
          `Unknown scheduled notification type: ${type}`,
          400
        );
    }
  }

  /**
   * Send bid deadline reminder notification
   * Requirements: 20.1 - Send reminder 24h before deadline
   */
  private async sendBidDeadlineReminder(notification: {
    userId: string;
    projectId: string | null;
  }): Promise<void> {
    if (!notification.projectId) {
      throw new ScheduledNotificationError(
        'MISSING_PROJECT_ID',
        'Project ID is required for bid deadline reminder',
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
        bidDeadline: true,
        _count: { select: { bids: true } },
      },
    });

    if (!project) {
      throw new ScheduledNotificationError(
        'PROJECT_NOT_FOUND',
        'Project not found',
        404
      );
    }

    // Only send if project is still OPEN
    if (project.status !== 'OPEN') {
      return; // Silently skip - project status changed
    }

    const bidCount = project._count.bids;
    const deadlineStr = project.bidDeadline
      ? project.bidDeadline.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    await this.notificationService.create({
      userId: notification.userId,
      type: 'BID_RECEIVED', // Reuse existing type for reminder
      title: 'Nhắc nhở: Hạn nhận báo giá sắp hết',
      content: `Công trình "${project.title}" (${project.code}) sẽ hết hạn nhận báo giá vào ${deadlineStr}. Hiện có ${bidCount} báo giá.`,
      data: {
        projectId: project.id,
        projectCode: project.code,
      },
    });
  }

  /**
   * Send no-bids reminder notification
   * Requirements: 20.2 - Notify homeowner with suggestions
   */
  private async sendNoBidsReminder(notification: {
    userId: string;
    projectId: string | null;
  }): Promise<void> {
    if (!notification.projectId) {
      throw new ScheduledNotificationError(
        'MISSING_PROJECT_ID',
        'Project ID is required for no-bids reminder',
        400
      );
    }

    // Get project details with bid count
    const project = await this.prisma.project.findUnique({
      where: { id: notification.projectId },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        _count: { select: { bids: true } },
      },
    });

    if (!project) {
      throw new ScheduledNotificationError(
        'PROJECT_NOT_FOUND',
        'Project not found',
        404
      );
    }

    // Only send if project is still OPEN and has no bids
    if (project.status !== 'OPEN' || project._count.bids > 0) {
      return; // Silently skip - conditions changed
    }

    await this.notificationService.create({
      userId: notification.userId,
      type: 'BID_RECEIVED', // Reuse existing type
      title: 'Công trình chưa có báo giá',
      content: `Công trình "${project.title}" (${project.code}) đã đăng 3 ngày nhưng chưa nhận được báo giá nào. Bạn có thể cập nhật mô tả hoặc điều chỉnh ngân sách để thu hút nhà thầu.`,
      data: {
        projectId: project.id,
        projectCode: project.code,
      },
    });
  }

  /**
   * Send escrow pending reminder notification
   * Requirements: 20.3 - Remind homeowner to complete payment
   */
  private async sendEscrowPendingReminder(notification: {
    userId: string;
    projectId: string | null;
    escrowId: string | null;
  }): Promise<void> {
    if (!notification.escrowId) {
      throw new ScheduledNotificationError(
        'MISSING_ESCROW_ID',
        'Escrow ID is required for escrow pending reminder',
        400
      );
    }

    // Get escrow details
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: notification.escrowId },
      select: {
        id: true,
        code: true,
        status: true,
        amount: true,
        project: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    if (!escrow) {
      throw new ScheduledNotificationError(
        'ESCROW_NOT_FOUND',
        'Escrow not found',
        404
      );
    }

    // Only send if escrow is still PENDING
    if (escrow.status !== 'PENDING') {
      return; // Silently skip - escrow status changed
    }

    const amountStr = escrow.amount.toLocaleString('vi-VN');

    await this.notificationService.create({
      userId: notification.userId,
      type: 'ESCROW_PENDING',
      title: 'Nhắc nhở: Hoàn tất đặt cọc',
      content: `Đặt cọc ${escrow.code} cho công trình "${escrow.project.title}" (${escrow.project.code}) đang chờ thanh toán. Số tiền: ${amountStr} VNĐ. Vui lòng hoàn tất để tiến hành thi công.`,
      data: {
        projectId: escrow.project.id,
        projectCode: escrow.project.code,
        escrowId: escrow.id,
        escrowCode: escrow.code,
        amount: escrow.amount,
      },
    });
  }

  /**
   * Send 3-day review reminder notification
   * Requirements: 20.1 - Send first reminder 3 days after completion
   */
  private async sendReviewReminder3Day(notification: {
    userId: string;
    projectId: string | null;
  }): Promise<void> {
    if (!notification.projectId) {
      throw new ScheduledNotificationError(
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
      throw new ScheduledNotificationError(
        'PROJECT_NOT_FOUND',
        'Project not found',
        404
      );
    }

    // Check if project already has a review (Property 14: Review Reminder Suppression)
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
  }

  /**
   * Send 7-day final review reminder notification
   * Requirements: 20.2, 20.3 - Send final reminder with direct link
   */
  private async sendReviewReminder7Day(notification: {
    userId: string;
    projectId: string | null;
  }): Promise<void> {
    if (!notification.projectId) {
      throw new ScheduledNotificationError(
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
      throw new ScheduledNotificationError(
        'PROJECT_NOT_FOUND',
        'Project not found',
        404
      );
    }

    // Check if project already has a review (Property 14: Review Reminder Suppression)
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

    await this.notificationService.create({
      userId: notification.userId,
      type: 'PROJECT_COMPLETED',
      title: 'Nhắc nhở cuối: Đánh giá nhà thầu',
      content: `Đây là lời nhắc cuối cùng để đánh giá nhà thầu cho công trình "${project.title}" (${project.code}). Đánh giá của bạn rất quan trọng! Nhấn vào đây để đánh giá: ${reviewLink}`,
      data: {
        projectId: project.id,
        projectCode: project.code,
        reviewLink,
      },
    });
  }

  /**
   * Send saved project deadline reminder notification
   * Requirements: 21.4 - Send reminder 24h before deadline
   */
  private async sendSavedProjectDeadlineReminder(notification: {
    userId: string;
    projectId: string | null;
  }): Promise<void> {
    if (!notification.projectId) {
      throw new ScheduledNotificationError(
        'MISSING_PROJECT_ID',
        'Project ID is required for saved project deadline reminder',
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
        bidDeadline: true,
      },
    });

    if (!project) {
      throw new ScheduledNotificationError(
        'PROJECT_NOT_FOUND',
        'Project not found',
        404
      );
    }

    // Only send if project is still OPEN
    if (project.status !== 'OPEN') {
      return; // Silently skip - project status changed
    }

    // Check if contractor still has this project saved
    const savedProject = await this.prisma.savedProject.findFirst({
      where: {
        contractorId: notification.userId,
        projectId: notification.projectId,
      },
    });

    if (!savedProject) {
      return; // Silently skip - project no longer saved
    }

    const deadlineStr = project.bidDeadline
      ? project.bidDeadline.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    await this.notificationService.create({
      userId: notification.userId,
      type: 'BID_RECEIVED', // Reuse existing type for reminder
      title: 'Nhắc nhở: Dự án đã lưu sắp hết hạn',
      content: `Dự án "${project.title}" (${project.code}) mà bạn đã lưu sẽ hết hạn nhận báo giá vào ${deadlineStr}. Hãy gửi đề xuất ngay!`,
      data: {
        projectId: project.id,
        projectCode: project.code,
      },
    });
  }
}
