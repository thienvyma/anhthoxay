/**
 * Region Zod Schemas
 *
 * Validation schemas for region management operations.
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-3.2**
 */

import { z } from 'zod';

// ============================================
// REGION LEVEL ENUM
// ============================================

/**
 * Region level enum
 * 1: Tỉnh/Thành phố
 * 2: Quận/Huyện
 * 3: Phường/Xã
 */
export const regionLevelEnum = z.enum(['1', '2', '3']);
export type RegionLevel = z.infer<typeof regionLevelEnum>;

// ============================================
// CREATE REGION SCHEMA
// ============================================

/**
 * Schema for creating a new region
 */
export const CreateRegionSchema = z.object({
  name: z.string().min(1, 'Tên khu vực không được để trống').max(100, 'Tên khu vực tối đa 100 ký tự'),
  slug: z.string()
    .min(1, 'Slug không được để trống')
    .max(100, 'Slug tối đa 100 ký tự')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'),
  parentId: z.string().optional().nullable(),
  level: z.coerce.number().int().min(1).max(3).default(1),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});

// ============================================
// UPDATE REGION SCHEMA
// ============================================

/**
 * Schema for updating an existing region
 */
export const UpdateRegionSchema = z.object({
  name: z.string().min(1, 'Tên khu vực không được để trống').max(100, 'Tên khu vực tối đa 100 ký tự').optional(),
  slug: z.string()
    .min(1, 'Slug không được để trống')
    .max(100, 'Slug tối đa 100 ký tự')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang')
    .optional(),
  parentId: z.string().optional().nullable(),
  level: z.coerce.number().int().min(1).max(3).optional(),
  isActive: z.boolean().optional(),
  order: z.coerce.number().int().min(0).optional(),
});

// ============================================
// REGION QUERY SCHEMA
// ============================================

/**
 * Schema for querying regions
 * Note: Query params come as strings, so we need to handle "true"/"false" strings
 */
export const RegionQuerySchema = z.object({
  flat: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(false)
  ),
  parentId: z.string().optional(),
  level: z.coerce.number().int().min(1).max(3).optional(),
  isActive: z.preprocess(
    (val) => val === undefined ? undefined : val === 'true' || val === true,
    z.boolean().optional()
  ),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateRegionInput = z.infer<typeof CreateRegionSchema>;
export type UpdateRegionInput = z.infer<typeof UpdateRegionSchema>;
export type RegionQuery = z.infer<typeof RegionQuerySchema>;
