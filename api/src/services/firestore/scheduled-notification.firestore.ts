/**
 * Scheduled Notification Firestore Service
 *
 * Firestore implementation for scheduled notification management.
 * Stores scheduled items in `scheduledNotifications/{id}`
 *
 * @module services/firestore/scheduled-notification.firestore
 * @requirements 6.5
 */

import * as admin from 'firebase-admin';
import { BaseFirestoreService, type QueryOptions } from './base.firestore';
import { getFirestore } from '../firebase-admin.service';
import type {
  FirestoreScheduledNotification,
  ScheduledNotificationStatus,
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';
import { notificationFirestoreService } from './notification.firestore';
import type { NotificationType } from '../../types/firestore.types';

// ============================================
// TYPES
// ============================================

export interface CreateScheduledNotificationInput {
  type: string;
  userId: string;
  projectId?: string;
  escrowId?: string;
  scheduledFor: Date;
}

export interface ScheduledNotificationQuery {
  status?: ScheduledNotificationStatus;
  userId?: string;
  projectId?: string;
  type?: string;
  scheduledBefore?: Date;
  scheduledAfter?: Date;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ScheduledNotificationListResult {
  data: FirestoreScheduledNotification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// ERROR CLASS
// ============================================

export class ScheduledNotificationFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ScheduledNotificationFirestoreError';

    const statusMap: Record<string, number> = {
      SCHEDULED_NOTIFICATION_NOT_FOUND: 404,
      ALREADY_SENT: 400,
      ALREADY_CANCELLED: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// BASE SERVICE
// ============================================

class ScheduledNotificationBaseService extends BaseFirestoreService<FirestoreScheduledNotification> {
  constructor() {
    super('scheduledNotifications');
  }
}

// ============================================
// MAIN SERVICE
// ============================================

export class ScheduledNotificationFirestoreService {
  private baseService: ScheduledNotificationBaseService;
  private db: admin.firestore.Firestore | null = null;

  constructor() {
    this.baseService = new ScheduledNotificationBaseService();
  }

  private async getDb(): Promise<admin.firestore.Firestore> {
    if (!this.db) {
      this.db = await getFirestore();
    }
    return this.db;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a scheduled notification
   */
  async create(input: CreateScheduledNotificationInput): Promise<FirestoreScheduledNotification> {
    const scheduled = await this.baseService.create({
      type: input.type,
      userId: input.userId,
      projectId: input.projectId,
      escrowId: input.escrowId,
      scheduledFor: input.scheduledFor,
      status: 'PENDING',
    });

    logger.info('Created scheduled notification', {
      id: scheduled.id,
      type: input.type,
      userId: input.userId,
      scheduledFor: input.scheduledFor,
    });

    return scheduled;
  }

  /**
   * Get scheduled notification by ID
   */
  async getById(id: string): Promise<FirestoreScheduledNotification | null> {
    return this.baseService.getById(id);
  }

  /**
   * List scheduled notifications with filters
   */
  async list(query: ScheduledNotificationQuery): Promise<ScheduledNotificationListResult> {
    const {
      status,
      userId,
      projectId,
      type,
      scheduledBefore,
      scheduledAfter,
      page,
      limit,
      sortBy = 'scheduledFor',
      sortOrder = 'asc',
    } = query;

    const where: QueryOptions<FirestoreScheduledNotification>['where'] = [];

    if (status) {
      where.push({ field: 'status', operator: '==', value: status });
    }
    if (userId) {
      where.push({ field: 'userId', operator: '==', value: userId });
    }
    if (projectId) {
      where.push({ field: 'projectId', operator: '==', value: projectId });
    }
    if (type) {
      where.push({ field: 'type', operator: '==', value: type });
    }
    if (scheduledBefore) {
      where.push({ field: 'scheduledFor', operator: '<=', value: scheduledBefore });
    }
    if (scheduledAfter) {
      where.push({ field: 'scheduledFor', operator: '>=', value: scheduledAfter });
    }

    // Get all matching for total count
    const allItems = await this.baseService.query({
      where: where.length > 0 ? where : undefined,
    });
    const total = allItems.length;

    // Get paginated results
    const items = await this.baseService.query({
      where: where.length > 0 ? where : undefined,
      orderBy: [{ field: sortBy, direction: sortOrder }],
      limit,
    });

    // Manual pagination
    const start = (page - 1) * limit;
    const paginatedData = items.slice(start, start + limit);

    return {
      data: paginatedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel a scheduled notification
   */
  async cancel(id: string): Promise<FirestoreScheduledNotification> {
    const scheduled = await this.getById(id);
    if (!scheduled) {
      throw new ScheduledNotificationFirestoreError(
        'SCHEDULED_NOTIFICATION_NOT_FOUND',
        `Scheduled notification ${id} not found`
      );
    }

    if (scheduled.status === 'SENT') {
      throw new ScheduledNotificationFirestoreError(
        'ALREADY_SENT',
        'Cannot cancel a notification that has already been sent'
      );
    }

    if (scheduled.status === 'CANCELLED') {
      throw new ScheduledNotificationFirestoreError(
        'ALREADY_CANCELLED',
        'Notification is already cancelled'
      );
    }

    const updated = await this.baseService.update(id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    });

    logger.info('Cancelled scheduled notification', { id });

    return updated;
  }

  // ============================================
  // PROCESSING OPERATIONS
  // ============================================

  /**
   * Get pending notifications that are due
   */
  async getDueNotifications(): Promise<FirestoreScheduledNotification[]> {
    const now = new Date();

    return this.baseService.query({
      where: [
        { field: 'status', operator: '==', value: 'PENDING' },
        { field: 'scheduledFor', operator: '<=', value: now },
      ],
      orderBy: [{ field: 'scheduledFor', direction: 'asc' }],
      limit: 100, // Process in batches
    });
  }

  /**
   * Process due notifications
   */
  async processDueNotifications(): Promise<{ processed: number; failed: number }> {
    const dueNotifications = await this.getDueNotifications();
    let processed = 0;
    let failed = 0;

    for (const scheduled of dueNotifications) {
      try {
        await this.processNotification(scheduled);
        processed++;
      } catch (error) {
        logger.error('Failed to process scheduled notification', {
          id: scheduled.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    logger.info('Processed due notifications', { processed, failed });

    return { processed, failed };
  }

  /**
   * Process a single scheduled notification
   */
  private async processNotification(scheduled: FirestoreScheduledNotification): Promise<void> {
    // Create the actual notification
    await notificationFirestoreService.createFromTemplate(
      scheduled.userId,
      scheduled.type as NotificationType,
      {
        projectId: scheduled.projectId,
        escrowId: scheduled.escrowId,
      }
    );

    // Mark as sent
    await this.baseService.update(scheduled.id, {
      status: 'SENT',
      sentAt: new Date(),
    });

    logger.debug('Processed scheduled notification', {
      id: scheduled.id,
      type: scheduled.type,
      userId: scheduled.userId,
    });
  }

  // ============================================
  // REMINDER SCHEDULING
  // ============================================

  /**
   * Schedule bid deadline reminder
   */
  async scheduleBidDeadlineReminder(
    userId: string,
    projectId: string,
    deadline: Date
  ): Promise<FirestoreScheduledNotification> {
    // Schedule reminder 24 hours before deadline
    const reminderTime = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);

    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      throw new ScheduledNotificationFirestoreError(
        'INVALID_SCHEDULE_TIME',
        'Reminder time is in the past',
        400
      );
    }

    return this.create({
      type: 'BID_DEADLINE_REMINDER',
      userId,
      projectId,
      scheduledFor: reminderTime,
    });
  }

  /**
   * Schedule no bids reminder
   */
  async scheduleNoBidsReminder(
    userId: string,
    projectId: string,
    checkTime: Date
  ): Promise<FirestoreScheduledNotification> {
    return this.create({
      type: 'NO_BIDS_REMINDER',
      userId,
      projectId,
      scheduledFor: checkTime,
    });
  }

  /**
   * Schedule escrow pending reminder
   */
  async scheduleEscrowPendingReminder(
    userId: string,
    projectId: string,
    escrowId: string,
    reminderTime: Date
  ): Promise<FirestoreScheduledNotification> {
    return this.create({
      type: 'ESCROW_PENDING_REMINDER',
      userId,
      projectId,
      escrowId,
      scheduledFor: reminderTime,
    });
  }

  /**
   * Schedule review reminder
   */
  async scheduleReviewReminder(
    userId: string,
    projectId: string,
    reminderTime: Date
  ): Promise<FirestoreScheduledNotification> {
    return this.create({
      type: 'REVIEW_REMINDER',
      userId,
      projectId,
      scheduledFor: reminderTime,
    });
  }

  /**
   * Cancel all pending reminders for a project
   */
  async cancelProjectReminders(projectId: string): Promise<number> {
    const pending = await this.baseService.query({
      where: [
        { field: 'projectId', operator: '==', value: projectId },
        { field: 'status', operator: '==', value: 'PENDING' },
      ],
    });

    const db = await this.getDb();
    const batch = db.batch();
    const now = admin.firestore.Timestamp.fromDate(new Date());

    for (const scheduled of pending) {
      const docRef = db.collection('scheduledNotifications').doc(scheduled.id);
      batch.update(docRef, {
        status: 'CANCELLED',
        cancelledAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();

    logger.info('Cancelled project reminders', { projectId, count: pending.length });

    return pending.length;
  }

  /**
   * Cancel all pending reminders for an escrow
   */
  async cancelEscrowReminders(escrowId: string): Promise<number> {
    const pending = await this.baseService.query({
      where: [
        { field: 'escrowId', operator: '==', value: escrowId },
        { field: 'status', operator: '==', value: 'PENDING' },
      ],
    });

    const db = await this.getDb();
    const batch = db.batch();
    const now = admin.firestore.Timestamp.fromDate(new Date());

    for (const scheduled of pending) {
      const docRef = db.collection('scheduledNotifications').doc(scheduled.id);
      batch.update(docRef, {
        status: 'CANCELLED',
        cancelledAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();

    logger.info('Cancelled escrow reminders', { escrowId, count: pending.length });

    return pending.length;
  }

  // ============================================
  // SCAN OPERATIONS
  // ============================================

  /**
   * Scan projects and schedule reminders
   * This should be called periodically (e.g., daily)
   */
  async scanAndScheduleReminders(context: {
    getOpenProjects: () => Promise<
      Array<{
        id: string;
        ownerId: string;
        bidDeadline?: Date;
        bidCount: number;
      }>
    >;
    getPendingEscrows: () => Promise<
      Array<{
        id: string;
        projectId: string;
        homeownerId: string;
        createdAt: Date;
      }>
    >;
  }): Promise<{ bidDeadlineReminders: number; noBidsReminders: number; escrowReminders: number }> {
    let bidDeadlineReminders = 0;
    let noBidsReminders = 0;
    let escrowReminders = 0;

    // Schedule bid deadline reminders
    const openProjects = await context.getOpenProjects();
    for (const project of openProjects) {
      if (project.bidDeadline) {
        try {
          // Check if reminder already scheduled
          const existing = await this.baseService.query({
            where: [
              { field: 'projectId', operator: '==', value: project.id },
              { field: 'type', operator: '==', value: 'BID_DEADLINE_REMINDER' },
              { field: 'status', operator: '==', value: 'PENDING' },
            ],
            limit: 1,
          });

          if (existing.length === 0) {
            await this.scheduleBidDeadlineReminder(
              project.ownerId,
              project.id,
              project.bidDeadline
            );
            bidDeadlineReminders++;
          }
        } catch {
          // Ignore errors (e.g., reminder time in past)
        }
      }

      // Schedule no bids reminder if no bids after 3 days
      if (project.bidCount === 0) {
        const existing = await this.baseService.query({
          where: [
            { field: 'projectId', operator: '==', value: project.id },
            { field: 'type', operator: '==', value: 'NO_BIDS_REMINDER' },
            { field: 'status', operator: '==', value: 'PENDING' },
          ],
          limit: 1,
        });

        if (existing.length === 0) {
          const checkTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
          await this.scheduleNoBidsReminder(project.ownerId, project.id, checkTime);
          noBidsReminders++;
        }
      }
    }

    // Schedule escrow pending reminders
    const pendingEscrows = await context.getPendingEscrows();
    for (const escrow of pendingEscrows) {
      const existing = await this.baseService.query({
        where: [
          { field: 'escrowId', operator: '==', value: escrow.id },
          { field: 'type', operator: '==', value: 'ESCROW_PENDING_REMINDER' },
          { field: 'status', operator: '==', value: 'PENDING' },
        ],
        limit: 1,
      });

      if (existing.length === 0) {
        // Remind after 24 hours
        const reminderTime = new Date(escrow.createdAt.getTime() + 24 * 60 * 60 * 1000);
        if (reminderTime > new Date()) {
          await this.scheduleEscrowPendingReminder(
            escrow.homeownerId,
            escrow.projectId,
            escrow.id,
            reminderTime
          );
          escrowReminders++;
        }
      }
    }

    logger.info('Scanned and scheduled reminders', {
      bidDeadlineReminders,
      noBidsReminders,
      escrowReminders,
    });

    return { bidDeadlineReminders, noBidsReminders, escrowReminders };
  }
}

// Export singleton instance
export const scheduledNotificationFirestoreService = new ScheduledNotificationFirestoreService();
