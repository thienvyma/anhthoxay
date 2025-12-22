/**
 * Scheduled Notification Types
 *
 * Shared types and constants for scheduled notification services.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 20.1, 20.2, 20.3, 20.4**
 */

import type {
  CreateScheduledNotificationInput,
  ScheduledNotificationQuery,
  ScheduledNotificationResponse,
  ScheduledNotificationListResult,
  ScheduledNotificationType,
  JobProcessingResult,
} from '../../schemas/scheduled-notification.schema';

// Re-export schema types
export type {
  CreateScheduledNotificationInput,
  ScheduledNotificationQuery,
  ScheduledNotificationResponse,
  ScheduledNotificationListResult,
  ScheduledNotificationType,
  JobProcessingResult,
};

// ============================================
// CONSTANTS
// ============================================

// Time constants in milliseconds
export const HOURS_24 = 24 * 60 * 60 * 1000;
export const HOURS_48 = 48 * 60 * 60 * 1000;
export const DAYS_3 = 3 * 24 * 60 * 60 * 1000;
export const DAYS_7 = 7 * 24 * 60 * 60 * 1000;

// ============================================
// SCHEDULED NOTIFICATION ERROR CLASS
// ============================================

export class ScheduledNotificationError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ScheduledNotificationError';

    const statusMap: Record<string, number> = {
      NOTIFICATION_NOT_FOUND: 404,
      PROJECT_NOT_FOUND: 404,
      ESCROW_NOT_FOUND: 404,
      MISSING_PROJECT_ID: 400,
      MISSING_ESCROW_ID: 400,
      UNKNOWN_TYPE: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Transform scheduled notification from Prisma to response format
 */
export function transformScheduledNotification(notification: {
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
