/**
 * Milestone Zod Schemas
 *
 * Validation schemas for project milestone operations.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 15.2, 15.3, 15.6**
 */

import { z } from 'zod';

// ============================================
// MILESTONE STATUS ENUM
// ============================================

/**
 * Milestone status enum
 * Follows the status flow defined in requirements
 */
export const milestoneStatusEnum = z.enum([
  'PENDING',
  'REQUESTED',
  'CONFIRMED',
  'DISPUTED',
]);
export type MilestoneStatus = z.infer<typeof milestoneStatusEnum>;

// ============================================
// REQUEST MILESTONE SCHEMA (Contractor)
// ============================================

/**
 * Schema for contractor requesting milestone completion
 * Requirements: 15.2 - Contractor reports milestone completion
 */
export const RequestMilestoneSchema = z.object({
  note: z.string()
    .max(1000, 'Ghi chú tối đa 1000 ký tự')
    .optional(),
});
export type RequestMilestoneInput = z.infer<typeof RequestMilestoneSchema>;

// ============================================
// CONFIRM MILESTONE SCHEMA (Homeowner)
// ============================================

/**
 * Schema for homeowner confirming milestone completion
 * Requirements: 15.3 - Homeowner confirms milestone completion
 */
export const ConfirmMilestoneSchema = z.object({
  note: z.string()
    .max(1000, 'Ghi chú tối đa 1000 ký tự')
    .optional(),
});
export type ConfirmMilestoneInput = z.infer<typeof ConfirmMilestoneSchema>;

// ============================================
// DISPUTE MILESTONE SCHEMA (Homeowner)
// ============================================

/**
 * Schema for homeowner disputing a milestone
 * Requirements: 15.6 - Homeowner disputes milestone
 */
export const DisputeMilestoneSchema = z.object({
  reason: z.string()
    .min(1, 'Lý do tranh chấp không được để trống')
    .max(2000, 'Lý do tranh chấp tối đa 2000 ký tự'),
});
export type DisputeMilestoneInput = z.infer<typeof DisputeMilestoneSchema>;

// ============================================
// MILESTONE QUERY SCHEMA
// ============================================

/**
 * Schema for querying milestones
 */
export const MilestoneQuerySchema = z.object({
  projectId: z.string().optional(),
  escrowId: z.string().optional(),
  status: milestoneStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type MilestoneQuery = z.infer<typeof MilestoneQuerySchema>;
