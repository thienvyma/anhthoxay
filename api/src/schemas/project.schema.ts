/**
 * Project Zod Schemas
 *
 * Validation schemas for project management operations.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 1.3, 3.1, 3.3, 4.3, 4.4**
 */

import { z } from 'zod';

// ============================================
// PROJECT STATUS ENUM
// ============================================

/**
 * Project status enum
 * Follows the status flow defined in requirements 2.1-2.6
 */
export const projectStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'OPEN',
  'BIDDING_CLOSED',
  'MATCHED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
export type ProjectStatus = z.infer<typeof projectStatusEnum>;

// ============================================
// CREATE PROJECT SCHEMA
// ============================================

/**
 * Schema for creating a new project
 * Requirements: 1.3 - title, description, categoryId, regionId, address required
 */
export const CreateProjectSchema = z.object({
  title: z.string()
    .min(1, 'Tiêu đề không được để trống')
    .max(200, 'Tiêu đề tối đa 200 ký tự'),
  description: z.string()
    .min(1, 'Mô tả không được để trống')
    .max(5000, 'Mô tả tối đa 5000 ký tự'),
  categoryId: z.string().min(1, 'Danh mục không được để trống'),
  regionId: z.string().min(1, 'Khu vực không được để trống'),
  address: z.string()
    .min(1, 'Địa chỉ không được để trống')
    .max(500, 'Địa chỉ tối đa 500 ký tự'),
  area: z.number().positive('Diện tích phải lớn hơn 0').optional(),
  budgetMin: z.number().min(0, 'Ngân sách tối thiểu không được âm').optional(),
  budgetMax: z.number().min(0, 'Ngân sách tối đa không được âm').optional(),
  timeline: z.string().max(100, 'Timeline tối đa 100 ký tự').optional(),
  images: z.array(z.string().url('URL ảnh không hợp lệ'))
    .max(10, 'Tối đa 10 ảnh')
    .optional(),
  requirements: z.string().max(2000, 'Yêu cầu đặc biệt tối đa 2000 ký tự').optional(),
}).refine(
  (data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
      return data.budgetMin <= data.budgetMax;
    }
    return true;
  },
  {
    message: 'Ngân sách tối thiểu không được lớn hơn ngân sách tối đa',
    path: ['budgetMin'],
  }
);

// ============================================
// UPDATE PROJECT SCHEMA
// ============================================

/**
 * Schema for updating an existing project
 * Requirements: 3.2 - Only allow updates if status is DRAFT or REJECTED
 */
export const UpdateProjectSchema = z.object({
  title: z.string()
    .min(1, 'Tiêu đề không được để trống')
    .max(200, 'Tiêu đề tối đa 200 ký tự')
    .optional(),
  description: z.string()
    .min(1, 'Mô tả không được để trống')
    .max(5000, 'Mô tả tối đa 5000 ký tự')
    .optional(),
  categoryId: z.string().min(1, 'Danh mục không được để trống').optional(),
  regionId: z.string().min(1, 'Khu vực không được để trống').optional(),
  address: z.string()
    .min(1, 'Địa chỉ không được để trống')
    .max(500, 'Địa chỉ tối đa 500 ký tự')
    .optional(),
  area: z.number().positive('Diện tích phải lớn hơn 0').optional().nullable(),
  budgetMin: z.number().min(0, 'Ngân sách tối thiểu không được âm').optional().nullable(),
  budgetMax: z.number().min(0, 'Ngân sách tối đa không được âm').optional().nullable(),
  timeline: z.string().max(100, 'Timeline tối đa 100 ký tự').optional().nullable(),
  images: z.array(z.string().url('URL ảnh không hợp lệ'))
    .max(10, 'Tối đa 10 ảnh')
    .optional(),
  requirements: z.string().max(2000, 'Yêu cầu đặc biệt tối đa 2000 ký tự').optional().nullable(),
});

// ============================================
// SUBMIT PROJECT SCHEMA
// ============================================

/**
 * Schema for submitting a project for approval
 * Requirements: 3.3, 3.4 - bidDeadline must be within min/max duration
 */
export const SubmitProjectSchema = z.object({
  bidDeadline: z.string()
    .datetime({ message: 'Định dạng ngày không hợp lệ' })
    .transform((val) => new Date(val)),
});

// ============================================
// PROJECT QUERY SCHEMA (Homeowner)
// ============================================

/**
 * Schema for querying homeowner's projects
 * Requirements: 3.6 - List projects owned by user
 */
export const ProjectQuerySchema = z.object({
  status: projectStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'bidDeadline', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// PUBLIC PROJECT QUERY SCHEMA
// ============================================

/**
 * Schema for querying public projects (contractors)
 * Requirements: 5.1, 5.4, 5.6 - Filter by region, category, sort options
 */
export const PublicProjectQuerySchema = z.object({
  regionId: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'bidDeadline', 'bidCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// ADMIN PROJECT QUERY SCHEMA
// ============================================

/**
 * Schema for admin querying all projects
 * Requirements: 4.1 - Filter by status, region, category
 */
export const AdminProjectQuerySchema = z.object({
  status: projectStatusEnum.optional(),
  regionId: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'bidDeadline', 'title', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// PROJECT REVIEW SCHEMA (Admin)
// ============================================

/**
 * Schema for admin approving a project
 * Requirements: 4.3 - Approve with optional note
 */
export const ApproveProjectSchema = z.object({
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

/**
 * Schema for admin rejecting a project
 * Requirements: 4.4 - Reject with required note
 */
export const RejectProjectSchema = z.object({
  note: z.string()
    .min(1, 'Lý do từ chối không được để trống')
    .max(500, 'Lý do từ chối tối đa 500 ký tự'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type SubmitProjectInput = z.infer<typeof SubmitProjectSchema>;
export type ProjectQuery = z.infer<typeof ProjectQuerySchema>;
export type PublicProjectQuery = z.infer<typeof PublicProjectQuerySchema>;
export type AdminProjectQuery = z.infer<typeof AdminProjectQuerySchema>;
export type ApproveProjectInput = z.infer<typeof ApproveProjectSchema>;
export type RejectProjectInput = z.infer<typeof RejectProjectSchema>;
