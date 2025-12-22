/**
 * Notification Schemas
 *
 * Zod validation schemas for notification operations.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 14.5**
 */

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

/**
 * Notification types
 */
export const notificationTypeEnum = z.enum([
  // Bid notifications
  'BID_RECEIVED',
  'BID_APPROVED',
  'BID_REJECTED',
  'BID_SELECTED',
  'BID_NOT_SELECTED',
  // Escrow notifications
  'ESCROW_PENDING',
  'ESCROW_HELD',
  'ESCROW_PARTIAL_RELEASED',
  'ESCROW_RELEASED',
  'ESCROW_REFUNDED',
  'ESCROW_DISPUTED',
  // Fee notifications
  'FEE_PENDING',
  'FEE_PAID',
  // Project notifications
  'PROJECT_MATCHED',
  'PROJECT_STARTED',
  'PROJECT_COMPLETED',
  // Milestone notifications
  'MILESTONE_REQUESTED',
  'MILESTONE_CONFIRMED',
  'MILESTONE_DISPUTED',
  // Message notifications
  'NEW_MESSAGE',
]);

export type NotificationType = z.infer<typeof notificationTypeEnum>;

// ============================================
// CREATE NOTIFICATION SCHEMA (Internal use)
// ============================================

/**
 * Schema for creating a notification (internal use)
 */
export const CreateNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: notificationTypeEnum,
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(1000),
  data: z
    .object({
      projectId: z.string().optional(),
      projectCode: z.string().optional(),
      bidId: z.string().optional(),
      bidCode: z.string().optional(),
      escrowId: z.string().optional(),
      escrowCode: z.string().optional(),
      feeId: z.string().optional(),
      feeCode: z.string().optional(),
      amount: z.number().optional(),
      reviewLink: z.string().optional(), // Direct link to review form
    })
    .optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

// ============================================
// NOTIFICATION QUERY SCHEMA
// ============================================

/**
 * Schema for listing notifications
 */
export const NotificationQuerySchema = z.object({
  type: notificationTypeEnum.optional(),
  isRead: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;

// ============================================
// MARK READ SCHEMA
// ============================================

/**
 * Schema for marking notifications as read
 */
export const MarkNotificationReadSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1).max(100).optional(),
});

export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;
