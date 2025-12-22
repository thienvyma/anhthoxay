/**
 * Bidding Settings Zod Schemas
 *
 * Validation schemas for bidding configuration settings.
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-4.2**
 */

import { z } from 'zod';

// ============================================
// UPDATE BIDDING SETTINGS SCHEMA
// ============================================

/**
 * Schema for updating bidding settings
 * All fields are optional - only provided fields will be updated
 */
export const UpdateBiddingSettingsSchema = z.object({
  // Bidding config
  maxBidsPerProject: z.number().int().min(1).max(100).optional(),
  defaultBidDuration: z.number().int().min(1).max(90).optional(),
  minBidDuration: z.number().int().min(1).max(30).optional(),
  maxBidDuration: z.number().int().min(1).max(90).optional(),

  // Escrow config
  escrowPercentage: z.number().min(0).max(100).optional(),
  escrowMinAmount: z.number().min(0).optional(),
  escrowMaxAmount: z.number().min(0).nullable().optional(),

  // Fees config
  verificationFee: z.number().min(0).optional(),
  winFeePercentage: z.number().min(0).max(100).optional(),

  // Auto-approval
  autoApproveHomeowner: z.boolean().optional(),
  autoApproveProject: z.boolean().optional(),
}).refine(
  (data) => {
    // Validate minBidDuration <= defaultBidDuration <= maxBidDuration
    if (data.minBidDuration !== undefined && data.maxBidDuration !== undefined) {
      if (data.minBidDuration > data.maxBidDuration) {
        return false;
      }
    }
    if (data.defaultBidDuration !== undefined && data.minBidDuration !== undefined) {
      if (data.defaultBidDuration < data.minBidDuration) {
        return false;
      }
    }
    if (data.defaultBidDuration !== undefined && data.maxBidDuration !== undefined) {
      if (data.defaultBidDuration > data.maxBidDuration) {
        return false;
      }
    }
    // Validate escrowMinAmount <= escrowMaxAmount
    if (data.escrowMinAmount !== undefined && data.escrowMaxAmount !== undefined && data.escrowMaxAmount !== null) {
      if (data.escrowMinAmount > data.escrowMaxAmount) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'Invalid duration or escrow amount configuration',
  }
);

// ============================================
// TYPE EXPORTS
// ============================================

export type UpdateBiddingSettingsInput = z.infer<typeof UpdateBiddingSettingsSchema>;

/**
 * Public bidding settings (subset of full settings)
 * Only includes fields that should be visible to public users
 */
export interface PublicBiddingSettings {
  maxBidsPerProject: number;
  defaultBidDuration: number;
  minBidDuration: number;
  maxBidDuration: number;
  escrowPercentage: number;
  escrowMinAmount: number;
  winFeePercentage: number; // Needed for contractors to see win fee preview
}

/**
 * Full bidding settings (for admin)
 */
export interface BiddingSettings {
  id: string;
  maxBidsPerProject: number;
  defaultBidDuration: number;
  minBidDuration: number;
  maxBidDuration: number;
  escrowPercentage: number;
  escrowMinAmount: number;
  escrowMaxAmount: number | null;
  verificationFee: number;
  winFeePercentage: number;
  autoApproveHomeowner: boolean;
  autoApproveProject: boolean;
  createdAt: Date;
  updatedAt: Date;
}
