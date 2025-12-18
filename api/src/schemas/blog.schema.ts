/**
 * Blog Zod Schemas
 *
 * Validation schemas for blog posts and categories.
 *
 * **Feature: api-refactoring**
 * **Requirements: 5.4**
 */

import { z } from 'zod';

// ============================================
// BLOG CATEGORY SCHEMAS
// ============================================

/**
 * Schema for creating a blog category
 */
export const createBlogCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được trống').max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu không hợp lệ')
    .optional(),
});

/**
 * Schema for updating a blog category
 */
export const updateBlogCategorySchema = createBlogCategorySchema.partial();

// ============================================
// BLOG POST SCHEMAS
// ============================================

/**
 * Schema for creating a blog post
 */
export const createBlogPostSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được trống').max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, 'Nội dung không được trống'),
  featuredImage: z
    .string()
    .url('URL hình ảnh không hợp lệ')
    .optional()
    .or(z.literal('')),
  categoryId: z.string().min(1, 'Chọn danh mục'),
  tags: z.string().max(200).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

/**
 * Schema for updating a blog post
 */
export const updateBlogPostSchema = createBlogPostSchema.partial();

/**
 * Schema for filtering blog posts
 */
export const blogPostFilterSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().optional(),
});

// ============================================
// BLOG COMMENT SCHEMAS
// ============================================

/**
 * Schema for creating a blog comment
 * 
 * **Feature: security-hardening**
 * **Validates: Requirements 4.1, 4.2**
 */
export const createBlogCommentSchema = z.object({
  name: z.string()
    .min(1, 'Tên không được trống')
    .max(100, 'Tên tối đa 100 ký tự')
    .refine(s => s.trim().length > 0, 'Tên không được chỉ chứa khoảng trắng'),
  email: z.string().email('Email không hợp lệ'),
  content: z.string()
    .min(1, 'Nội dung không được trống')
    .max(2000, 'Nội dung tối đa 2000 ký tự')
    .refine(s => s.trim().length > 0, 'Nội dung không được chỉ chứa khoảng trắng'),
});

/**
 * Schema for updating comment status (approve/reject)
 * 
 * **Feature: security-hardening**
 * **Validates: Requirements 4.4, 4.5**
 */
export const updateCommentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'Trạng thái phải là APPROVED hoặc REJECTED',
  }),
});

/**
 * Schema for filtering comments (admin listing)
 * 
 * **Feature: security-hardening**
 * **Validates: Requirements 4.7**
 */
export const commentFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  postId: z.string().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type BlogPostFilter = z.infer<typeof blogPostFilterSchema>;
export type CreateBlogCommentInput = z.infer<typeof createBlogCommentSchema>;
export type UpdateCommentStatusInput = z.infer<typeof updateCommentStatusSchema>;
export type CommentFilter = z.infer<typeof commentFilterSchema>;
