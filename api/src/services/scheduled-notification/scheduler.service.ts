/**
 * Scheduler Service
 *
 * Core scheduling operations for scheduled notifications including
 * create, cancel, list, and process operations.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 20.1, 20.2, 20.3, 20.4**
 */

import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification.service';
import {
  type CreateScheduledNotificationInput,
  type ScheduledNotificationQuery,
  type ScheduledNotificationResponse,
  type ScheduledNotificationListResult,
  type JobProcessingResult,
  transformScheduledNotification,
} from './types';

// ============================================
// SCHEDULER SERVICE CLASS
// ============================================

export class SchedulerService {
  private prisma: PrismaClient;
  private notificationService: NotificationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.notificationService = new NotificationService(prisma);
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create a scheduled notification
   * Requirements: 20.4 - Use background job queue
   *
   * @param input - Scheduled notification input
   * @returns Created scheduled notification
   */
  async create(input: CreateScheduledNotificationInput): Promise<ScheduledNotificationResponse> {
    // Check for duplicate scheduled notification
    const existing = await this.prisma.scheduledNotification.findFirst({
      where: {
        type: input.type,
        userId: input.userId,
        projectId: input.projectId ?? null,
        escrowId: input.escrowId ?? null,
        status: 'PENDING',
      },
    });

    if (existing) {
      // Return existing instead of creating duplicate
      return transformScheduledNotification(existing);
    }

    const scheduled = await this.prisma.scheduledNotification.create({
      data: {
        type: input.type,
        userId: input.userId,
        projectId: input.projectId,
        escrowId: input.escrowId,
        scheduledFor: input.scheduledFor,
        status: 'PENDING',
      },
    });

    return transformScheduledNotification(scheduled);
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * List scheduled notifications
   *
   * @param query - Query parameters
   * @returns Paginated list of scheduled notifications
   */
  async list(query: ScheduledNotificationQuery): Promise<ScheduledNotificationListResult> {
    const { type, status, userId, projectId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(type && { type }),
      ...(status && { status }),
      ...(userId && { userId }),
      ...(projectId && { projectId }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.scheduledNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledFor: 'asc' },
      }),
      this.prisma.scheduledNotification.count({ where }),
    ]);

    return {
      data: notifications.map((n) => transformScheduledNotification(n)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get scheduled notification by ID
   *
   * @param id - Scheduled notification ID
   * @returns Scheduled notification or null
   */
  async getById(id: string): Promise<ScheduledNotificationResponse | null> {
    const notification = await this.prisma.scheduledNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      return null;
    }

    return transformScheduledNotification(notification);
  }

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  /**
   * Cancel a scheduled notification
   *
   * @param id - Scheduled notification ID
   * @returns Updated scheduled notification or null
   */
  async cancel(id: string): Promise<ScheduledNotificationResponse | null> {
    const notification = await this.prisma.scheduledNotification.findUnique({
      where: { id },
    });

    if (!notification || notification.status !== 'PENDING') {
      return null;
    }

    const updated = await this.prisma.scheduledNotification.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return transformScheduledNotification(updated);
  }

  /**
   * Cancel all pending notifications for a project
   *
   * @param projectId - Project ID
   * @returns Number of cancelled notifications
   */
  async cancelByProject(projectId: string): Promise<number> {
    const result = await this.prisma.scheduledNotification.updateMany({
      where: {
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

  /**
   * Cancel all pending notifications for an escrow
   *
   * @param escrowId - Escrow ID
   * @returns Number of cancelled notifications
   */
  async cancelByEscrow(escrowId: string): Promise<number> {
    const result = await this.prisma.scheduledNotification.updateMany({
      where: {
        escrowId,
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
  // JOB PROCESSING
  // ============================================

  /**
   * Process due scheduled notifications
   * Requirements: 20.4 - Use background job queue
   *
   * This method should be called periodically (e.g., every minute)
   * by a cron job or background worker.
   *
   * @param sendNotificationFn - Function to send notification by type
   * @returns Processing result
   */
  async processDueNotifications(
    sendNotificationFn: (notification: {
      id: string;
      type: string;
      userId: string;
      projectId: string | null;
      escrowId: string | null;
    }) => Promise<void>
  ): Promise<JobProcessingResult> {
    const now = new Date();
    const result: JobProcessingResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Get all due notifications
    const dueNotifications = await this.prisma.scheduledNotification.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: now },
      },
      take: 100, // Process in batches
    });

    result.processed = dueNotifications.length;

    for (const notification of dueNotifications) {
      try {
        await sendNotificationFn(notification);
        
        // Mark as sent
        await this.prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        result.sent++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.failed++;
        result.errors.push({ id: notification.id, error: errorMessage });
        
        // Log error but don't mark as failed - will retry on next run
        console.error(`Failed to send scheduled notification ${notification.id}:`, error);
      }
    }

    return result;
  }
}
