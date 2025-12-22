/**
 * Notification Preference Schemas
 *
 * Zod validation schemas for notification preference operations.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 9.2**
 */

import { z } from 'zod';

// ============================================
// NOTIFICATION CHANNEL ENUM
// ============================================

/**
 * Notification channels
 */
export const notificationChannelEnum = z.enum(['EMAIL', 'SMS', 'IN_APP']);

export type NotificationChannel = z.infer<typeof notificationChannelEnum>;

// ============================================
// NOTIFICATION EVENT TYPES
// ============================================

/**
 * Notification event types for preferences
 */
export const notificationEventTypeEnum = z.enum([
  'BID_RECEIVED',
  'BID_APPROVED',
  'PROJECT_MATCHED',
  'NEW_MESSAGE',
  'ESCROW_RELEASED',
]);

export type NotificationEventType = z.infer<typeof notificationEventTypeEnum>;

// ============================================
// UPDATE PREFERENCE SCHEMA
// ============================================

/**
 * Schema for updating notification preferences
 * Requirements: 9.2 - Validate preference values
 */
export const UpdateNotificationPreferenceSchema = z.object({
  // Email notifications
  emailEnabled: z.boolean().optional(),
  emailBidReceived: z.boolean().optional(),
  emailBidApproved: z.boolean().optional(),
  emailProjectMatched: z.boolean().optional(),
  emailNewMessage: z.boolean().optional(),
  emailEscrowReleased: z.boolean().optional(),

  // SMS notifications
  smsEnabled: z.boolean().optional(),
  smsBidReceived: z.boolean().optional(),
  smsBidApproved: z.boolean().optional(),
  smsProjectMatched: z.boolean().optional(),
  smsNewMessage: z.boolean().optional(),
  smsEscrowReleased: z.boolean().optional(),
});

export type UpdateNotificationPreferenceInput = z.infer<
  typeof UpdateNotificationPreferenceSchema
>;

// ============================================
// NOTIFICATION PREFERENCE RESPONSE TYPE
// ============================================

/**
 * Full notification preference type
 */
export interface NotificationPreferenceResponse {
  id: string;
  userId: string;

  // Email notifications
  emailEnabled: boolean;
  emailBidReceived: boolean;
  emailBidApproved: boolean;
  emailProjectMatched: boolean;
  emailNewMessage: boolean;
  emailEscrowReleased: boolean;

  // SMS notifications
  smsEnabled: boolean;
  smsBidReceived: boolean;
  smsBidApproved: boolean;
  smsProjectMatched: boolean;
  smsNewMessage: boolean;
  smsEscrowReleased: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DEFAULT PREFERENCES
// ============================================

/**
 * Default notification preferences for new users
 * Requirements: 9.1 - Create default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  // Email notifications - mostly enabled by default
  emailEnabled: true,
  emailBidReceived: true,
  emailBidApproved: true,
  emailProjectMatched: true,
  emailNewMessage: true,
  emailEscrowReleased: true,

  // SMS notifications - only critical ones enabled by default
  smsEnabled: true,
  smsBidReceived: false,
  smsBidApproved: true,
  smsProjectMatched: true,
  smsNewMessage: false,
  smsEscrowReleased: true,
} as const;

// ============================================
// SEND NOTIFICATION INPUT SCHEMA
// ============================================

/**
 * Schema for sending a notification through channels
 * Requirements: 8.1 - Record target channels
 */
export const SendNotificationInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.string().min(1, 'Notification type is required'),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(1000),
  data: z.record(z.string(), z.unknown()).optional(),
  channels: z.array(notificationChannelEnum).optional(),
});

export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

// ============================================
// BULK SEND NOTIFICATION INPUT SCHEMA
// ============================================

/**
 * Schema for sending notifications to multiple users
 */
export const BulkSendNotificationInputSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'At least one user ID is required'),
  type: z.string().min(1, 'Notification type is required'),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(1000),
  data: z.record(z.string(), z.unknown()).optional(),
  channels: z.array(notificationChannelEnum).optional(),
});

export type BulkSendNotificationInput = z.infer<
  typeof BulkSendNotificationInputSchema
>;

// ============================================
// EMAIL NOTIFICATION INPUT SCHEMA
// ============================================

/**
 * Schema for sending email notification
 * Requirements: 10.2 - Use HTML templates with Vietnamese content
 */
export const SendEmailInputSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(), // Plain text fallback
});

export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

// ============================================
// SMS NOTIFICATION INPUT SCHEMA
// ============================================

/**
 * Schema for sending SMS notification
 * Requirements: 11.2 - Format message within 160 characters
 */
export const SendSMSInputSchema = z.object({
  to: z.string().min(10, 'Phone number is required'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(160, 'SMS message must be 160 characters or less'),
});

export type SendSMSInput = z.infer<typeof SendSMSInputSchema>;
