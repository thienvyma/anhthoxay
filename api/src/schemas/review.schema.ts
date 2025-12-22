/**
 * Review Zod Schemas
 *
 * Validation schemas for review management operations.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 1.2, 2.4, 2.5, 9.1-9.4, 10.1-10.4, 11.1-11.4, 12.1-12.4**
 */

import { z } from 'zod';

// ============================================
// CONSTANTS
// ============================================

/**
 * Maximum number of images allowed per review
 * Requirements: 2.5 - Limit to 5 images
 */
export const MAX_REVIEW_IMAGES = 5;

/**
 * Number of days within which a review can be updated
 * Requirements: 9.2 - Allow updates within 7 days
 */
export const REVIEW_UPDATE_WINDOW_DAYS = 7;

// ============================================
// CREATE REVIEW SCHEMA
// ============================================

/**
 * Schema for creating a new review
 * Requirements: 1.2, 2.4, 2.5 - Rating 1-5, optional comment, max 5 images
 */
export const CreateReviewSchema = z.object({
  rating: z.number()
    .int('Đánh giá phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao'),
  comment: z.string()
    .max(2000, 'Nhận xét tối đa 2000 ký tự')
    .optional(),
  images: z.array(z.string().url('URL hình ảnh không hợp lệ'))
    .max(MAX_REVIEW_IMAGES, `Tối đa ${MAX_REVIEW_IMAGES} hình ảnh`)
    .optional(),
  // Multi-criteria ratings (optional)
  qualityRating: z.number()
    .int('Đánh giá chất lượng phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao')
    .optional(),
  timelinessRating: z.number()
    .int('Đánh giá tiến độ phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao')
    .optional(),
  communicationRating: z.number()
    .int('Đánh giá giao tiếp phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao')
    .optional(),
  valueRating: z.number()
    .int('Đánh giá giá cả phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao')
    .optional(),
});

// ============================================
// UPDATE REVIEW SCHEMA
// ============================================

/**
 * Schema for updating an existing review
 * Requirements: 9.2 - Allow updates within 7 days
 */
export const UpdateReviewSchema = z.object({
  rating: z.number()
    .int('Đánh giá phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao')
    .optional(),
  comment: z.string()
    .max(2000, 'Nhận xét tối đa 2000 ký tự')
    .optional(),
  images: z.array(z.string().url('URL hình ảnh không hợp lệ'))
    .max(MAX_REVIEW_IMAGES, `Tối đa ${MAX_REVIEW_IMAGES} hình ảnh`)
    .optional(),
  // Multi-criteria ratings (optional)
  qualityRating: z.number()
    .int('Đánh giá chất lượng phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao')
    .optional()
    .nullable(),
  timelinessRating: z.number()
    .int('Đánh giá tiến độ phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao')
    .optional()
    .nullable(),
  communicationRating: z.number()
    .int('Đánh giá giao tiếp phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao')
    .optional()
    .nullable(),
  valueRating: z.number()
    .int('Đánh giá giá cả phải là số nguyên')
    .min(1, 'Đánh giá tối thiểu là 1 sao')
    .max(5, 'Đánh giá tối đa là 5 sao')
    .optional()
    .nullable(),
});

// ============================================
// REVIEW QUERY SCHEMA
// ============================================

/**
 * Schema for querying reviews (homeowner/contractor)
 * Requirements: 9.4, 10.1 - List reviews with pagination
 */
export const ReviewQuerySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'rating', 'helpfulCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// PUBLIC REVIEW QUERY SCHEMA
// ============================================

/**
 * Schema for querying public reviews
 * Requirements: 11.1-11.4 - Public review listing with filters
 */
export const PublicReviewQuerySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'rating', 'helpfulCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// ADMIN REVIEW QUERY SCHEMA
// ============================================

/**
 * Schema for admin querying all reviews
 * Requirements: 12.1 - Admin review listing with filters
 */
export const AdminReviewQuerySchema = z.object({
  contractorId: z.string().optional(),
  reviewerId: z.string().optional(),
  projectId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isPublic: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  isDeleted: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'rating', 'helpfulCount', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// RESPONSE SCHEMA
// ============================================

/**
 * Schema for contractor response to a review
 * Requirements: 3.1-3.4 - Contractor can respond once
 */
export const AddResponseSchema = z.object({
  response: z.string()
    .min(1, 'Phản hồi không được để trống')
    .max(1000, 'Phản hồi tối đa 1000 ký tự'),
});

// ============================================
// ADMIN HIDE/UNHIDE SCHEMA
// ============================================

/**
 * Schema for admin hiding a review
 * Requirements: 4.2, 12.2 - Admin can hide reviews
 */
export const HideReviewSchema = z.object({
  reason: z.string()
    .max(500, 'Lý do tối đa 500 ký tự')
    .optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type ReviewQuery = z.infer<typeof ReviewQuerySchema>;
export type PublicReviewQuery = z.infer<typeof PublicReviewQuerySchema>;
export type AdminReviewQuery = z.infer<typeof AdminReviewQuerySchema>;
export type AddResponseInput = z.infer<typeof AddResponseSchema>;
export type HideReviewInput = z.infer<typeof HideReviewSchema>;
