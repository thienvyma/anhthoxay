/**
 * Bid Zod Schemas
 *
 * Validation schemas for bid management operations.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 6.3, 7.1-7.7, 8.3, 8.4**
 */

import { z } from 'zod';

// ============================================
// BID STATUS ENUM
// ============================================

/**
 * Bid status enum
 * Follows the status flow defined in requirements
 */
export const bidStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SELECTED',
  'NOT_SELECTED',
  'WITHDRAWN',
]);
export type BidStatus = z.infer<typeof bidStatusEnum>;

// ============================================
// ATTACHMENT SCHEMA
// ============================================

/**
 * Schema for bid attachments
 * Requirements: 6.4 - JSON array of attachments (max 5 files)
 */
export const BidAttachmentSchema = z.object({
  name: z.string().min(1, 'Tên file không được để trống'),
  url: z.string().min(1, 'URL file không được để trống'), // Accept both relative and absolute URLs
  type: z.string().min(1, 'Loại file không được để trống'),
  size: z.number().positive('Kích thước file phải lớn hơn 0').optional(),
});
export type BidAttachment = z.infer<typeof BidAttachmentSchema>;


// ============================================
// CREATE BID SCHEMA
// ============================================

/**
 * Schema for creating a new bid
 * Requirements: 6.3 - price, timeline, proposal required
 */
export const CreateBidSchema = z.object({
  projectId: z.string().min(1, 'ID công trình không được để trống'),
  price: z.number()
    .positive('Giá đề xuất phải lớn hơn 0')
    .max(100000000000, 'Giá đề xuất không được vượt quá 100 tỷ'),
  timeline: z.string()
    .min(1, 'Timeline không được để trống')
    .max(100, 'Timeline tối đa 100 ký tự'),
  proposal: z.string()
    .min(1, 'Mô tả đề xuất không được để trống')
    .max(5000, 'Mô tả đề xuất tối đa 5000 ký tự'),
  attachments: z.array(BidAttachmentSchema)
    .max(5, 'Tối đa 5 file đính kèm')
    .optional(),
});

// ============================================
// UPDATE BID SCHEMA
// ============================================

/**
 * Schema for updating an existing bid
 * Requirements: 7.6 - Only allow updates if bid status is PENDING
 */
export const UpdateBidSchema = z.object({
  price: z.number()
    .positive('Giá đề xuất phải lớn hơn 0')
    .max(100000000000, 'Giá đề xuất không được vượt quá 100 tỷ')
    .optional(),
  timeline: z.string()
    .min(1, 'Timeline không được để trống')
    .max(100, 'Timeline tối đa 100 ký tự')
    .optional(),
  proposal: z.string()
    .min(1, 'Mô tả đề xuất không được để trống')
    .max(5000, 'Mô tả đề xuất tối đa 5000 ký tự')
    .optional(),
  attachments: z.array(BidAttachmentSchema)
    .max(5, 'Tối đa 5 file đính kèm')
    .optional(),
});


// ============================================
// BID QUERY SCHEMA (Contractor)
// ============================================

/**
 * Schema for querying contractor's bids
 * Requirements: 7.1-7.7 - List bids by contractor
 */
export const BidQuerySchema = z.object({
  status: bidStatusEnum.optional(),
  projectId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'price']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// ADMIN BID QUERY SCHEMA
// ============================================

/**
 * Schema for admin querying all bids
 * Requirements: 8.1 - Filter by status and projectId
 */
export const AdminBidQuerySchema = z.object({
  status: bidStatusEnum.optional(),
  projectId: z.string().optional(),
  contractorId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'price', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});


// ============================================
// BID REVIEW SCHEMA (Admin)
// ============================================

/**
 * Schema for admin approving a bid
 * Requirements: 8.3 - Approve with optional note
 */
export const ApproveBidSchema = z.object({
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

/**
 * Schema for admin rejecting a bid
 * Requirements: 8.4 - Reject with required note
 */
export const RejectBidSchema = z.object({
  note: z.string()
    .min(1, 'Lý do từ chối không được để trống')
    .max(500, 'Lý do từ chối tối đa 500 ký tự'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateBidInput = z.infer<typeof CreateBidSchema>;
export type UpdateBidInput = z.infer<typeof UpdateBidSchema>;
export type BidQuery = z.infer<typeof BidQuerySchema>;
export type AdminBidQuery = z.infer<typeof AdminBidQuerySchema>;
export type ApproveBidInput = z.infer<typeof ApproveBidSchema>;
export type RejectBidInput = z.infer<typeof RejectBidSchema>;
