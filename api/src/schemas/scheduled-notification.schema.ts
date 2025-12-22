/**
 * Scheduled Notification Schemas
 *
 * Zod validation schemas for scheduled notification operations.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 20.1, 20.2, 20.3, 20.4**
 */

import { z } from 'zod';

// ============================================
// SCHEDULED NOTIFICATION TYPES
// ============================================

export const SCHEDULED_NOTIFICATION_TYPES = [
  'BID_DEADLINE_REMINDER',    // 24h before deadline
  'NO_BIDS_REMINDER',         // 3 days after project open with no bids
  'ESCROW_PENDING_REMINDER',  // 48h after escrow created but not confirmed
  'REVIEW_REMINDER_3_DAY',    // 3 days after project completed without review
  'REVIEW_REMINDER_7_DAY',    // 7 days after project completed without review (final)
  'SAVED_PROJECT_DEADLINE_REMINDER', // 24h before saved project deadline (Phase 6)
] as const;

export type ScheduledNotificationType = typeof SCHEDULED_NOTIFICATION_TYPES[number];

export const SCHEDULED_NOTIFICATION_STATUSES = [
  'PENDING',
  'SENT',
  'CANCELLED',
] as const;

export type ScheduledNotificationStatus = typeof SCHEDULED_NOTIFICATION_STATUSES[number];

// ============================================
// CREATE SCHEMAS
// ============================================

/**
 * Schema for creating a scheduled notification
 */
export const CreateScheduledNotificationSchema = z.object({
  type: z.enum(SCHEDULED_NOTIFICATION_TYPES),
  userId: z.string().min(1, 'User ID là bắt buộc'),
  projectId: z.string().optional(),
  escrowId: z.string().optional(),
  scheduledFor: z.date(),
});

export type CreateScheduledNotificationInput = z.infer<typeof CreateScheduledNotificationSchema>;

// ============================================
// QUERY SCHEMAS
// ============================================

/**
 * Schema for querying scheduled notifications
 */
export const ScheduledNotificationQuerySchema = z.object({
  type: z.enum(SCHEDULED_NOTIFICATION_TYPES).optional(),
  status: z.enum(SCHEDULED_NOTIFICATION_STATUSES).optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ScheduledNotificationQuery = z.infer<typeof ScheduledNotificationQuerySchema>;

// ============================================
// RESPONSE TYPES
// ============================================

export interface ScheduledNotificationResponse {
  id: string;
  type: ScheduledNotificationType;
  userId: string;
  projectId: string | null;
  escrowId: string | null;
  scheduledFor: Date;
  status: ScheduledNotificationStatus;
  sentAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

export interface ScheduledNotificationListResult {
  data: ScheduledNotificationResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// JOB PROCESSING TYPES
// ============================================

export interface JobProcessingResult {
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
