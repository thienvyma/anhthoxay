/**
 * Fee Transaction Zod Schemas
 *
 * Validation schemas for fee transaction management operations.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 7.3, 10.4**
 */

import { z } from 'zod';

// ============================================
// FEE TYPE ENUM
// ============================================

/**
 * Fee type enum
 * Requirements: 7.3 - Record the fee type
 */
export const feeTypeEnum = z.enum(['WIN_FEE', 'VERIFICATION_FEE']);
export type FeeType = z.infer<typeof feeTypeEnum>;

// ============================================
// FEE STATUS ENUM
// ============================================

/**
 * Fee transaction status enum
 * Requirements: 7.5 - Initial status is PENDING
 */
export const feeStatusEnum = z.enum(['PENDING', 'PAID', 'CANCELLED']);
export type FeeStatus = z.infer<typeof feeStatusEnum>;

// ============================================
// CREATE FEE SCHEMA (Internal use)
// ============================================

/**
 * Schema for creating a new fee transaction (internal use)
 * Requirements: 7.2, 7.3, 7.4 - Associate with user, project, and bid
 */
export const CreateFeeSchema = z.object({
  userId: z.string().min(1, 'ID người dùng không được để trống'),
  projectId: z.string().min(1, 'ID công trình không được để trống'),
  bidId: z.string().min(1, 'ID bid không được để trống'),
  type: feeTypeEnum,
  amount: z.number().positive('Số tiền phí phải lớn hơn 0'),
});
export type CreateFeeInput = z.infer<typeof CreateFeeSchema>;

// ============================================
// FEE QUERY SCHEMA
// ============================================

/**
 * Schema for querying fee transactions (admin listing)
 * Requirements: 10.4 - Filter by status and type
 */
export const FeeQuerySchema = z.object({
  status: feeStatusEnum.optional(),
  type: feeTypeEnum.optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  code: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'amount', 'status', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type FeeQuery = z.infer<typeof FeeQuerySchema>;

// ============================================
// FEE ACTION SCHEMAS (Admin)
// ============================================

/**
 * Schema for admin marking fee as paid
 * Requirements: 10.5 - Mark fee as paid
 */
export const MarkFeePaidSchema = z.object({
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});
export type MarkFeePaidInput = z.infer<typeof MarkFeePaidSchema>;

/**
 * Schema for admin cancelling fee
 */
export const CancelFeeSchema = z.object({
  reason: z.string()
    .min(1, 'Lý do hủy không được để trống')
    .max(500, 'Lý do hủy tối đa 500 ký tự'),
});
export type CancelFeeInput = z.infer<typeof CancelFeeSchema>;

/**
 * Schema for fee export query
 */
export const FeeExportQuerySchema = z.object({
  status: feeStatusEnum.optional(),
  type: feeTypeEnum.optional(),
  userId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});
export type FeeExportQuery = z.infer<typeof FeeExportQuerySchema>;
