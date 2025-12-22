/**
 * Match Zod Schemas
 *
 * Validation schemas for match management operations.
 * Handles bid selection, contact reveal, and match lifecycle.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 1.1, 8.1, 8.5**
 */

import { z } from 'zod';

// ============================================
// SELECT BID SCHEMA
// ============================================

/**
 * Schema for homeowner selecting a bid
 * Requirements: 1.1 - Validate project status is BIDDING_CLOSED
 * Requirements: 8.1 - Validate all preconditions
 */
export const SelectBidSchema = z.object({
  bidId: z.string().min(1, 'ID bid không được để trống'),
});

// ============================================
// MATCH QUERY SCHEMA
// ============================================

/**
 * Schema for querying matched projects (admin)
 * Requirements: 10.1 - List matched projects with filters
 */
export const MatchQuerySchema = z.object({
  escrowStatus: z.enum([
    'PENDING',
    'HELD',
    'PARTIAL_RELEASED',
    'RELEASED',
    'REFUNDED',
    'DISPUTED',
    'CANCELLED',
  ]).optional(),
  feeStatus: z.enum(['PENDING', 'PAID', 'CANCELLED']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['matchedAt', 'createdAt', 'escrowAmount']).default('matchedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// CANCEL MATCH SCHEMA
// ============================================

/**
 * Schema for cancelling a match
 * Requirements: 8.5 - Validate project status allows cancellation
 */
export const CancelMatchSchema = z.object({
  reason: z.string()
    .min(1, 'Lý do hủy không được để trống')
    .max(500, 'Lý do hủy tối đa 500 ký tự'),
});

// ============================================
// START PROJECT SCHEMA
// ============================================

/**
 * Schema for starting a matched project
 * Requirements: 11.6 - Transition to IN_PROGRESS status
 */
export const StartProjectSchema = z.object({
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

// ============================================
// COMPLETE PROJECT SCHEMA
// ============================================

/**
 * Schema for completing a project
 * Requirements: 17.1 - Confirm project completion
 */
export const CompleteProjectSchema = z.object({
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type SelectBidInput = z.infer<typeof SelectBidSchema>;
export type MatchQuery = z.infer<typeof MatchQuerySchema>;
export type CancelMatchInput = z.infer<typeof CancelMatchSchema>;
export type StartProjectInput = z.infer<typeof StartProjectSchema>;
export type CompleteProjectInput = z.infer<typeof CompleteProjectSchema>;
