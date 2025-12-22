/**
 * Scheduled Notification Services - Barrel Export
 *
 * Re-exports all scheduled notification services and provides
 * backward compatible ScheduledNotificationService export.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 20.1, 20.2, 20.3, 20.4**
 */

import { PrismaClient } from '@prisma/client';
import { SchedulerService } from './scheduler.service';
import { ReminderService } from './reminder.service';
import { ScannerService } from './scanner.service';
import type {
  ScheduledNotificationResponse,
  ScheduledNotificationQuery,
  ScheduledNotificationListResult,
  JobProcessingResult,
} from './types';

// Re-export individual services
export { SchedulerService } from './scheduler.service';
export { ReminderService } from './reminder.service';
export { ScannerService } from './scanner.service';

// Re-export types and error class
export {
  ScheduledNotificationError,
  transformScheduledNotification,
  HOURS_24,
  HOURS_48,
  DAYS_3,
  DAYS_7,
} from './types';

export type {
  CreateScheduledNotificationInput,
  ScheduledNotificationQuery,
  ScheduledNotificationResponse,
  ScheduledNotificationListResult,
  ScheduledNotificationType,
  JobProcessingResult,
} from './types';

// ============================================
// BACKWARD COMPATIBLE SERVICE CLASS
// ============================================

/**
 * ScheduledNotificationService - Backward compatible facade
 *
 * This class provides the same interface as the original
 * scheduled-notification.service.ts for backward compatibility.
 */
export class ScheduledNotificationService {
  private schedulerService: SchedulerService;
  private reminderService: ReminderService;
  private scannerService: ScannerService;

  constructor(prisma: PrismaClient) {
    this.schedulerService = new SchedulerService(prisma);
    this.reminderService = new ReminderService(prisma);
    this.scannerService = new ScannerService(prisma);
  }

  // ============================================
  // SCHEDULER SERVICE METHODS
  // ============================================

  async create(input: Parameters<SchedulerService['create']>[0]) {
    return this.schedulerService.create(input);
  }

  async list(query: ScheduledNotificationQuery): Promise<ScheduledNotificationListResult> {
    return this.schedulerService.list(query);
  }

  async getById(id: string): Promise<ScheduledNotificationResponse | null> {
    return this.schedulerService.getById(id);
  }

  async cancel(id: string): Promise<ScheduledNotificationResponse | null> {
    return this.schedulerService.cancel(id);
  }

  async cancelByProject(projectId: string): Promise<number> {
    return this.schedulerService.cancelByProject(projectId);
  }

  async cancelByEscrow(escrowId: string): Promise<number> {
    return this.schedulerService.cancelByEscrow(escrowId);
  }

  async processDueNotifications(): Promise<JobProcessingResult> {
    return this.schedulerService.processDueNotifications(
      this.reminderService.sendScheduledNotification.bind(this.reminderService)
    );
  }

  // ============================================
  // REMINDER SERVICE METHODS
  // ============================================

  async scheduleBidDeadlineReminder(
    projectId: string,
    homeownerId: string,
    bidDeadline: Date
  ): Promise<ScheduledNotificationResponse | null> {
    return this.reminderService.scheduleBidDeadlineReminder(projectId, homeownerId, bidDeadline);
  }

  async scheduleNoBidsReminder(
    projectId: string,
    homeownerId: string,
    publishedAt: Date
  ): Promise<ScheduledNotificationResponse> {
    return this.reminderService.scheduleNoBidsReminder(projectId, homeownerId, publishedAt);
  }

  async scheduleEscrowPendingReminder(
    escrowId: string,
    projectId: string,
    homeownerId: string,
    createdAt: Date
  ): Promise<ScheduledNotificationResponse> {
    return this.reminderService.scheduleEscrowPendingReminder(escrowId, projectId, homeownerId, createdAt);
  }

  async scheduleReviewReminder3Day(
    projectId: string,
    homeownerId: string,
    completedAt: Date
  ): Promise<ScheduledNotificationResponse | null> {
    return this.reminderService.scheduleReviewReminder3Day(projectId, homeownerId, completedAt);
  }

  async scheduleReviewReminder7Day(
    projectId: string,
    homeownerId: string,
    completedAt: Date
  ): Promise<ScheduledNotificationResponse | null> {
    return this.reminderService.scheduleReviewReminder7Day(projectId, homeownerId, completedAt);
  }

  async scheduleSavedProjectDeadlineReminder(
    projectId: string,
    contractorId: string,
    bidDeadline: Date
  ): Promise<ScheduledNotificationResponse | null> {
    return this.reminderService.scheduleSavedProjectDeadlineReminder(projectId, contractorId, bidDeadline);
  }

  async cancelReviewReminders(projectId: string): Promise<number> {
    return this.reminderService.cancelReviewReminders(projectId);
  }

  async cancelSavedProjectDeadlineReminder(
    contractorId: string,
    projectId: string
  ): Promise<number> {
    return this.reminderService.cancelSavedProjectDeadlineReminder(contractorId, projectId);
  }

  // ============================================
  // SCANNER SERVICE METHODS
  // ============================================

  async scanAndScheduleBidDeadlineReminders(): Promise<number> {
    return this.scannerService.scanAndScheduleBidDeadlineReminders();
  }

  async scanAndScheduleNoBidsReminders(): Promise<number> {
    return this.scannerService.scanAndScheduleNoBidsReminders();
  }

  async scanAndScheduleEscrowPendingReminders(): Promise<number> {
    return this.scannerService.scanAndScheduleEscrowPendingReminders();
  }

  async scanAndScheduleReviewReminders(): Promise<number> {
    return this.scannerService.scanAndScheduleReviewReminders();
  }

  async scanAndScheduleSavedProjectDeadlineReminders(): Promise<number> {
    return this.scannerService.scanAndScheduleSavedProjectDeadlineReminders();
  }
}
