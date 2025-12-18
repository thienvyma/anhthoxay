/**
 * Pricing Zod Schemas
 *
 * Validation schemas for pricing-related entities:
 * - Service Categories
 * - Unit Prices
 * - Material Categories
 * - Materials
 * - Formulas
 * - Quote Calculation
 *
 * **Feature: api-refactoring**
 * **Requirements: 5.4**
 */

import { z } from 'zod';

// ============================================
// SERVICE CATEGORY SCHEMAS
// ============================================

/**
 * Schema for creating a service category
 */
export const createServiceCategorySchema = z.object({
  name: z.string().min(1, 'Tên hạng mục không được trống').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  coefficient: z.number().positive('Hệ số phải lớn hơn 0').default(1.0),
  formulaId: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  materialCategoryIds: z.array(z.string()).optional(),
});

/**
 * Schema for updating a service category
 */
export const updateServiceCategorySchema = createServiceCategorySchema.partial();

// ============================================
// UNIT PRICE SCHEMAS
// ============================================

/**
 * Schema for creating a unit price
 */
export const createUnitPriceSchema = z.object({
  category: z.string().min(1, 'Thể loại không được trống').max(50),
  name: z.string().min(1, 'Tên đơn giá không được trống').max(100),
  price: z.number().nonnegative('Giá không được âm'),
  tag: z
    .string()
    .regex(/^[A-Z0-9_]+$/, 'Tag chỉ chứa chữ in hoa, số và dấu gạch dưới')
    .max(50),
  unit: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a unit price
 */
export const updateUnitPriceSchema = createUnitPriceSchema.partial();

// ============================================
// MATERIAL CATEGORY SCHEMAS
// ============================================

/**
 * Schema for creating a material category
 */
export const createMaterialCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được trống').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a material category
 */
export const updateMaterialCategorySchema = createMaterialCategorySchema.partial();

// ============================================
// MATERIAL SCHEMAS
// ============================================

/**
 * Schema for creating a material
 */
export const createMaterialSchema = z.object({
  name: z.string().min(1, 'Tên vật dụng không được trống').max(100),
  categoryId: z.string().min(1, 'Danh mục không được trống'),
  imageUrl: z.string().optional().nullable(),
  price: z.number().nonnegative('Giá không được âm'),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a material
 */
export const updateMaterialSchema = createMaterialSchema.partial();

// ============================================
// FORMULA SCHEMAS
// ============================================

/**
 * Schema for creating a formula
 */
export const createFormulaSchema = z.object({
  name: z.string().min(1, 'Tên công thức không được trống').max(100),
  expression: z.string().min(1, 'Biểu thức không được trống').max(500),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a formula
 */
export const updateFormulaSchema = createFormulaSchema.partial();

// ============================================
// QUOTE CALCULATION SCHEMA
// ============================================

/**
 * Schema for quote calculation
 */
export const calculateQuoteSchema = z.object({
  categoryId: z.string().min(1, 'Chọn hạng mục'),
  area: z.number().positive('Diện tích phải lớn hơn 0'),
  materialIds: z.array(z.string()).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;
export type UpdateServiceCategoryInput = z.infer<typeof updateServiceCategorySchema>;
export type CreateUnitPriceInput = z.infer<typeof createUnitPriceSchema>;
export type UpdateUnitPriceInput = z.infer<typeof updateUnitPriceSchema>;
export type CreateMaterialCategoryInput = z.infer<typeof createMaterialCategorySchema>;
export type UpdateMaterialCategoryInput = z.infer<typeof updateMaterialCategorySchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type CreateFormulaInput = z.infer<typeof createFormulaSchema>;
export type UpdateFormulaInput = z.infer<typeof updateFormulaSchema>;
export type CalculateQuoteInput = z.infer<typeof calculateQuoteSchema>;
