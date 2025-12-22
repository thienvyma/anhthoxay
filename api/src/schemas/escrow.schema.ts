/**
 * Escrow Zod Schemas
 *
 * Validation schemas for escrow management operations.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 3.2, 5.1**
 */

import { z } from 'zod';

// ============================================
// ESCROW STATUS ENUM
// ============================================

/**
 * Escrow status enum
 * Follows the status flow defined in requirements
 */
export const escrowStatusEnum = z.enum([
  'PENDING',
  'HELD',
  'PARTIAL_RELEASED',
  'RELEASED',
  'REFUNDED',
  'DISPUTED',
  'CANCELLED',
]);
export type EscrowStatus = z.infer<typeof escrowStatusEnum>;

// ============================================
// ESCROW TRANSACTION SCHEMA
// ============================================

/**
 * Schema for escrow transaction log entries
 * Requirements: 3.6 - Store transactions as JSON array
 */
export const EscrowTransactionSchema = z.object({
  type: z.enum([
    'CREATED',
    'DEPOSIT_CONFIRMED',
    'PARTIAL_RELEASE',
    'FULL_RELEASE',
    'REFUND',
    'DISPUTED',
    'CANCELLED',
  ]),
  amount: z.number().optional(),
  date: z.string().datetime(),
  note: z.string().optional(),
  adminId: z.string().optional(),
});
export type EscrowTransaction = z.infer<typeof EscrowTransactionSchema>;

// ============================================
// CREATE ESCROW SCHEMA (Internal use)
// ============================================

/**
 * Schema for creating a new escrow (internal use)
 * Requirements: 3.2 - Associate with project, bid, and homeowner
 */
export const CreateEscrowSchema = z.object({
  projectId: z.string().min(1, 'ID công trình không được để trống'),
  bidId: z.string().min(1, 'ID bid không được để trống'),
  homeownerId: z.string().min(1, 'ID chủ nhà không được để trống'),
  amount: z.number().positive('Số tiền đặt cọc phải lớn hơn 0'),
});
export type CreateEscrowInput = z.infer<typeof CreateEscrowSchema>;

// ============================================
// UPDATE ESCROW SCHEMA
// ============================================

/**
 * Schema for updating escrow (admin use)
 */
export const UpdateEscrowSchema = z.object({
  status: escrowStatusEnum.optional(),
  note: z.string().max(1000, 'Ghi chú tối đa 1000 ký tự').optional(),
});
export type UpdateEscrowInput = z.infer<typeof UpdateEscrowSchema>;

// ============================================
// ESCROW QUERY SCHEMA
// ============================================

/**
 * Schema for querying escrows (admin listing)
 * Requirements: 5.1 - Filter by status and projectId
 */
export const EscrowQuerySchema = z.object({
  status: escrowStatusEnum.optional(),
  projectId: z.string().optional(),
  homeownerId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type EscrowQuery = z.infer<typeof EscrowQuerySchema>;

// ============================================
// ESCROW ACTION SCHEMAS (Admin)
// ============================================

/**
 * Schema for admin confirming escrow deposit
 * Requirements: 5.3 - Confirm deposit (PENDING → HELD)
 */
export const ConfirmEscrowSchema = z.object({
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});
export type ConfirmEscrowInput = z.infer<typeof ConfirmEscrowSchema>;

/**
 * Schema for admin releasing escrow
 * Requirements: 5.4 - Release escrow
 */
export const ReleaseEscrowSchema = z.object({
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});
export type ReleaseEscrowInput = z.infer<typeof ReleaseEscrowSchema>;

/**
 * Schema for admin partially releasing escrow
 * Requirements: 5.5 - Partial release
 */
export const PartialReleaseEscrowSchema = z.object({
  amount: z.number()
    .positive('Số tiền giải phóng phải lớn hơn 0'),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});
export type PartialReleaseEscrowInput = z.infer<typeof PartialReleaseEscrowSchema>;

/**
 * Schema for admin refunding escrow
 * Requirements: 5.6 - Refund escrow
 */
export const RefundEscrowSchema = z.object({
  reason: z.string()
    .min(1, 'Lý do hoàn tiền không được để trống')
    .max(500, 'Lý do hoàn tiền tối đa 500 ký tự'),
});
export type RefundEscrowInput = z.infer<typeof RefundEscrowSchema>;

/**
 * Schema for admin marking escrow as disputed
 * Requirements: 5.7 - Mark disputed
 */
export const DisputeEscrowSchema = z.object({
  reason: z.string()
    .min(1, 'Lý do tranh chấp không được để trống')
    .max(500, 'Lý do tranh chấp tối đa 500 ký tự'),
});
export type DisputeEscrowInput = z.infer<typeof DisputeEscrowSchema>;
