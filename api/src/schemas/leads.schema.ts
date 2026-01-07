/**
 * Leads Zod Schemas
 *
 * Validation schemas for customer lead operations.
 *
 * **Feature: api-refactoring**
 * **Requirements: 5.4**
 */

import { z } from 'zod';

// ============================================
// LEAD SCHEMAS
// ============================================

/**
 * Schema for creating a new lead (public endpoint)
 */
export const createLeadSchema = z.object({
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(100),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ')
    .min(10),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  content: z.string().min(10, 'Nội dung tối thiểu 10 ký tự').max(2000),
  source: z.enum(['QUOTE_FORM', 'CONTACT_FORM', 'FURNITURE_QUOTE']).default('CONTACT_FORM'),
  quoteData: z.string().optional(), // JSON string of quote calculation
});

/**
 * Schema for updating a lead (admin/manager only)
 */
export const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema for lead list query parameters
 * 
 * **Feature: lead-duplicate-management**
 * **Requirements: 8.1, 8.2**
 */
export const leadsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']).optional(),
  // Duplicate management filters (Requirements 8.1, 8.2)
  duplicateStatus: z.enum(['all', 'duplicates_only', 'no_duplicates']).default('all'),
  hasRelated: z.coerce.boolean().optional(),
  source: z.enum(['QUOTE_FORM', 'CONTACT_FORM', 'FURNITURE_QUOTE']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schema for manual merge leads request
 * 
 * **Feature: lead-duplicate-management**
 * **Requirements: 6.2, 6.3**
 */
export const mergeLeadsSchema = z.object({
  secondaryLeadIds: z.array(z.string()).min(1, 'Phải có ít nhất một lead phụ để merge'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadsQueryInput = z.infer<typeof leadsQuerySchema>;
export type MergeLeadsInput = z.infer<typeof mergeLeadsSchema>;
