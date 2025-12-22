/**
 * Dispute Zod Schemas
 *
 * Validation schemas for dispute management operations.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 16.1, 16.2, 16.4**
 */

import { z } from 'zod';

// ============================================
// DISPUTE STATUS ENUM
// ============================================

/**
 * Dispute status enum
 * Follows the status flow defined in requirements
 */
export const disputeStatusEnum = z.enum([
  'OPEN',
  'RESOLVED_REFUND',
  'RESOLVED_RELEASE',
]);
export type DisputeStatus = z.infer<typeof disputeStatusEnum>;

// ============================================
// DISPUTE RESOLUTION TYPE ENUM
// ============================================

/**
 * Resolution type enum for admin resolving disputes
 * Requirements: 16.4 - Allow refund to homeowner or release to contractor
 */
export const disputeResolutionTypeEnum = z.enum([
  'REFUND_TO_HOMEOWNER',
  'RELEASE_TO_CONTRACTOR',
]);
export type DisputeResolutionType = z.infer<typeof disputeResolutionTypeEnum>;

// ============================================
// RAISE DISPUTE SCHEMA (Homeowner or Contractor)
// ============================================

/**
 * Schema for raising a dispute
 * Requirements: 16.1, 16.2 - Homeowner or contractor raises dispute with reason and evidence
 */
export const RaiseDisputeSchema = z.object({
  reason: z.string()
    .min(10, 'Lý do tranh chấp phải có ít nhất 10 ký tự')
    .max(2000, 'Lý do tranh chấp tối đa 2000 ký tự'),
  evidence: z.array(z.string().url('URL không hợp lệ'))
    .max(10, 'Tối đa 10 file bằng chứng')
    .optional(),
});
export type RaiseDisputeInput = z.infer<typeof RaiseDisputeSchema>;

// ============================================
// RESOLVE DISPUTE SCHEMA (Admin)
// ============================================

/**
 * Schema for admin resolving a dispute
 * Requirements: 16.4 - Admin resolves with refund or release decision
 */
export const ResolveDisputeSchema = z.object({
  resolution: disputeResolutionTypeEnum,
  note: z.string()
    .min(10, 'Ghi chú giải quyết phải có ít nhất 10 ký tự')
    .max(2000, 'Ghi chú giải quyết tối đa 2000 ký tự'),
});
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;

// ============================================
// DISPUTE QUERY SCHEMA (Admin)
// ============================================

/**
 * Schema for querying disputes (admin listing)
 * Requirements: 16.3 - Admin reviews disputes
 */
export const DisputeQuerySchema = z.object({
  status: disputeStatusEnum.optional(),
  projectId: z.string().optional(),
  raisedBy: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type DisputeQuery = z.infer<typeof DisputeQuerySchema>;
