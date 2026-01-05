/**
 * External API Schemas
 *
 * Shared validation schemas for external API routes
 */

import { z } from 'zod';

// ============================================
// LEADS SCHEMAS
// ============================================

/**
 * Schema for lead list query parameters
 */
export const LeadsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schema for creating a lead via API key
 */
export const CreateLeadSchema = z.object({
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(100),
  phone: z.string().regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ').min(10),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  content: z.string().min(10, 'Nội dung tối thiểu 10 ký tự').max(2000),
  source: z.enum(['QUOTE_FORM', 'CONTACT_FORM', 'FURNITURE_QUOTE', 'API']).default('API'),
});

// ============================================
// BLOG SCHEMAS
// ============================================

/**
 * Schema for blog post filter
 */
export const BlogPostFilterSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// PROJECT SCHEMAS
// ============================================

/**
 * Schema for project filter
 */
export const ProjectFilterSchema = z.object({
  regionId: z.string().optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// CONTRACTOR SCHEMAS
// ============================================

/**
 * Schema for contractor filter
 */
export const ContractorFilterSchema = z.object({
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// REORDER SCHEMA
// ============================================

/**
 * Schema for reorder items
 */
export const ReorderItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LeadsQuery = z.infer<typeof LeadsQuerySchema>;
export type CreateLead = z.infer<typeof CreateLeadSchema>;
export type BlogPostFilter = z.infer<typeof BlogPostFilterSchema>;
export type ProjectFilter = z.infer<typeof ProjectFilterSchema>;
export type ContractorFilter = z.infer<typeof ContractorFilterSchema>;
export type ReorderItems = z.infer<typeof ReorderItemsSchema>;
