/**
 * Unsubscribe Schemas
 *
 * Zod validation schemas for email unsubscribe operations.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 21.1, 21.2, 21.3, 21.4**
 */

import { z } from 'zod';

// ============================================
// UNSUBSCRIBE TOKEN VALIDATION
// ============================================

/**
 * Schema for validating unsubscribe token
 * Requirements: 21.3 - Validate token
 */
export const UnsubscribeTokenSchema = z.object({
  token: z.string().min(32, 'Token không hợp lệ').max(64, 'Token không hợp lệ'),
});

export type UnsubscribeTokenInput = z.infer<typeof UnsubscribeTokenSchema>;

// ============================================
// UNSUBSCRIBE PREFERENCES UPDATE
// ============================================

/**
 * Schema for updating preferences via unsubscribe
 * Requirements: 21.3 - Update preferences
 */
export const UnsubscribePreferencesSchema = z.object({
  token: z.string().min(32, 'Token không hợp lệ').max(64, 'Token không hợp lệ'),
  
  // Email preferences to disable
  emailEnabled: z.boolean().optional(),
  emailBidReceived: z.boolean().optional(),
  emailBidApproved: z.boolean().optional(),
  emailProjectMatched: z.boolean().optional(),
  emailNewMessage: z.boolean().optional(),
  emailEscrowReleased: z.boolean().optional(),
  
  // Unsubscribe all non-critical emails
  unsubscribeAll: z.boolean().optional(),
});

export type UnsubscribePreferencesInput = z.infer<typeof UnsubscribePreferencesSchema>;

// ============================================
// UNSUBSCRIBE RESPONSE TYPES
// ============================================

/**
 * Response type for unsubscribe page data
 */
export interface UnsubscribePageData {
  email: string;
  name: string;
  preferences: {
    emailEnabled: boolean;
    emailBidReceived: boolean;
    emailBidApproved: boolean;
    emailProjectMatched: boolean;
    emailNewMessage: boolean;
    emailEscrowReleased: boolean;
  };
}

/**
 * Response type for unsubscribe result
 */
export interface UnsubscribeResult {
  success: boolean;
  message: string;
  preferences: {
    emailEnabled: boolean;
    emailBidReceived: boolean;
    emailBidApproved: boolean;
    emailProjectMatched: boolean;
    emailNewMessage: boolean;
    emailEscrowReleased: boolean;
  };
}

// ============================================
// CRITICAL NOTIFICATION TYPES
// ============================================

/**
 * Critical notification types that cannot be unsubscribed
 * Requirements: 21.4 - Still send critical notifications
 */
export const CRITICAL_NOTIFICATION_TYPES = [
  'ESCROW_HELD',
  'ESCROW_RELEASED',
  'ESCROW_REFUNDED',
  'ESCROW_DISPUTED',
  'PROJECT_MATCHED',
  'BID_SELECTED',
] as const;

export type CriticalNotificationType = typeof CRITICAL_NOTIFICATION_TYPES[number];

/**
 * Check if a notification type is critical
 */
export function isCriticalNotificationType(type: string): boolean {
  return CRITICAL_NOTIFICATION_TYPES.includes(type as CriticalNotificationType);
}
