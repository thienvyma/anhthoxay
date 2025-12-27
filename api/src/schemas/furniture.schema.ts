/**
 * Furniture Zod Schemas
 *
 * Validation schemas for furniture quotation system:
 * - Developers (Chủ đầu tư)
 * - Projects (Dự án)
 * - Buildings (Tòa nhà)
 * - Layouts (Layout căn hộ)
 * - Apartment Types (Loại căn hộ)
 * - Categories (Danh mục sản phẩm)
 * - Products (Sản phẩm nội thất)
 * - Combos (Gói combo)
 * - Fees (Phí)
 * - Quotations (Báo giá)
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.7, 1.11, 1.13, 2.3, 2.6, 3.2, 3.3, 4.2, 7.8, 11.2**
 */

import { z } from 'zod';

// ============================================
// DEVELOPER SCHEMAS
// _Requirements: 1.11_
// ============================================

/**
 * Schema for creating a developer
 */
export const createDeveloperSchema = z.object({
  name: z.string().min(1, 'Tên chủ đầu tư không được trống').max(100),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
});

/**
 * Schema for updating a developer
 */
export const updateDeveloperSchema = createDeveloperSchema.partial();

// ============================================
// PROJECT SCHEMAS
// _Requirements: 1.11_
// ============================================

/**
 * Schema for creating a project
 */
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Tên dự án không được trống').max(200),
  code: z.string().min(1, 'Mã dự án không được trống').max(50),
  developerId: z.string().cuid('ID chủ đầu tư không hợp lệ'),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
});

/**
 * Schema for updating a project (exclude developerId)
 */
export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Tên dự án không được trống').max(200).optional(),
  code: z.string().min(1, 'Mã dự án không được trống').max(50).optional(),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
});

// ============================================
// BUILDING SCHEMAS
// _Requirements: 1.11, 1.13_
// ============================================

/**
 * Schema for creating a building
 */
export const createBuildingSchema = z.object({
  name: z.string().min(1, 'Tên tòa nhà không được trống').max(100),
  code: z.string().min(1, 'Mã tòa nhà không được trống').max(20),
  projectId: z.string().cuid('ID dự án không hợp lệ'),
  maxFloor: z.number().int().min(1, 'Số tầng tối thiểu là 1').max(200, 'Số tầng tối đa là 200'),
  maxAxis: z.number().int().min(0, 'Số trục không được âm').max(100, 'Số trục tối đa là 100'),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
});

/**
 * Schema for updating a building (exclude projectId)
 */
export const updateBuildingSchema = z.object({
  name: z.string().min(1, 'Tên tòa nhà không được trống').max(100).optional(),
  code: z.string().min(1, 'Mã tòa nhà không được trống').max(20).optional(),
  maxFloor: z.number().int().min(1, 'Số tầng tối thiểu là 1').max(200, 'Số tầng tối đa là 200').optional(),
  maxAxis: z.number().int().min(0, 'Số trục không được âm').max(100, 'Số trục tối đa là 100').optional(),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
});

// ============================================
// LAYOUT SCHEMAS
// _Requirements: 1.7, 1.11_
// ============================================

/**
 * Schema for creating a layout
 * apartmentType is transformed to trim + lowercase
 */
export const createLayoutSchema = z.object({
  buildingCode: z.string().min(1, 'Mã tòa nhà không được trống').max(20),
  axis: z.number().int().min(0, 'Số trục không được âm'),
  apartmentType: z
    .string()
    .min(1, 'Loại căn hộ không được trống')
    .max(20)
    .transform((val) => val.trim().toLowerCase()),
});

/**
 * Schema for updating a layout
 */
export const updateLayoutSchema = z.object({
  apartmentType: z
    .string()
    .min(1, 'Loại căn hộ không được trống')
    .max(20)
    .transform((val) => val.trim().toLowerCase())
    .optional(),
});

// ============================================
// APARTMENT TYPE SCHEMAS
// _Requirements: 1.11_
// ============================================

/**
 * Schema for creating an apartment type
 */
export const createApartmentTypeSchema = z.object({
  buildingCode: z.string().min(1, 'Mã tòa nhà không được trống').max(20),
  apartmentType: z
    .string()
    .min(1, 'Loại căn hộ không được trống')
    .max(20)
    .transform((val) => val.trim().toLowerCase()),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

/**
 * Schema for updating an apartment type
 */
export const updateApartmentTypeSchema = z.object({
  apartmentType: z
    .string()
    .min(1, 'Loại căn hộ không được trống')
    .max(20)
    .transform((val) => val.trim().toLowerCase())
    .optional(),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

// ============================================
// CATEGORY SCHEMAS
// _Requirements: 2.6_
// ============================================

/**
 * Schema for creating a category
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được trống').max(100),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a category
 */
export const updateCategorySchema = createCategorySchema.partial();

// ============================================
// PRODUCT SCHEMAS
// _Requirements: 2.3_
// ============================================

/**
 * Schema for creating a product
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được trống').max(200),
  categoryId: z.string().cuid('ID danh mục không hợp lệ'),
  price: z.number().positive('Giá phải lớn hơn 0'),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  dimensions: z.string().max(200).optional().nullable(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a product
 */
export const updateProductSchema = createProductSchema.partial();

// ============================================
// COMBO SCHEMAS
// _Requirements: 3.2, 3.3_
// ============================================

/**
 * Schema for combo item
 */
export const comboItemSchema = z.object({
  productId: z.string().cuid('ID sản phẩm không hợp lệ'),
  quantity: z.number().int().min(1, 'Số lượng tối thiểu là 1'),
});

/**
 * Schema for creating a combo
 */
export const createComboSchema = z.object({
  name: z.string().min(1, 'Tên combo không được trống').max(200),
  apartmentTypes: z
    .array(z.string().min(1).max(20))
    .min(1, 'Phải chọn ít nhất 1 loại căn hộ'),
  price: z.number().positive('Giá phải lớn hơn 0'),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
  items: z.array(comboItemSchema).min(1, 'Combo phải có ít nhất 1 sản phẩm'),
});

/**
 * Schema for updating a combo
 */
export const updateComboSchema = z.object({
  name: z.string().min(1, 'Tên combo không được trống').max(200).optional(),
  apartmentTypes: z
    .array(z.string().min(1).max(20))
    .min(1, 'Phải chọn ít nhất 1 loại căn hộ')
    .optional(),
  price: z.number().positive('Giá phải lớn hơn 0').optional(),
  imageUrl: z.string().url('URL ảnh không hợp lệ').optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
  items: z.array(comboItemSchema).min(1, 'Combo phải có ít nhất 1 sản phẩm').optional(),
});

// ============================================
// FEE SCHEMAS
// _Requirements: 4.2_
// ============================================

/**
 * Fee type enum
 */
export const feeTypeEnum = z.enum(['FIXED', 'PERCENTAGE']);

/**
 * Fee applicability enum
 */
export const feeApplicabilityEnum = z.enum(['COMBO', 'CUSTOM', 'BOTH']);

/**
 * Schema for creating a fee
 */
export const createFeeSchema = z.object({
  name: z.string().min(1, 'Tên phí không được trống').max(100),
  type: feeTypeEnum,
  value: z.number().positive('Giá trị phải lớn hơn 0'),
  applicability: feeApplicabilityEnum,
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

/**
 * Schema for updating a fee
 */
export const updateFeeSchema = createFeeSchema.partial();

// ============================================
// QUOTATION SCHEMAS
// _Requirements: 7.8, 11.2_
// ============================================

/**
 * Selection type enum
 */
export const selectionTypeEnum = z.enum(['COMBO', 'CUSTOM']);

/**
 * Schema for quotation item
 */
export const quotationItemSchema = z.object({
  productId: z.string().cuid('ID sản phẩm không hợp lệ'),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1),
});

/**
 * Schema for lead data when creating quotation without existing lead
 */
export const leadDataSchema = z.object({
  name: z.string().min(1, 'Tên không được trống'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional().nullable(),
  content: z.string().optional().nullable(),
});

/**
 * Schema for creating a quotation
 * Supports either leadId (existing lead) or leadData (create new lead)
 */
export const createQuotationSchema = z.object({
  leadId: z.string().cuid('ID khách hàng không hợp lệ').optional().nullable(),
  leadData: leadDataSchema.optional().nullable(),
  developerName: z.string().min(1, 'Tên chủ đầu tư không được trống'),
  projectName: z.string().min(1, 'Tên dự án không được trống'),
  buildingName: z.string().min(1, 'Tên tòa nhà không được trống'),
  buildingCode: z.string().min(1, 'Mã tòa nhà không được trống'),
  floor: z.number().int().min(1, 'Tầng phải lớn hơn 0'),
  axis: z.number().int().min(0, 'Trục không được âm'),
  apartmentType: z.string().min(1, 'Loại căn hộ không được trống'),
  layoutImageUrl: z.string().url('URL ảnh không hợp lệ').optional().nullable(),
  selectionType: selectionTypeEnum,
  comboId: z.string().cuid('ID combo không hợp lệ').optional().nullable(),
  comboName: z.string().optional().nullable(),
  items: z.array(quotationItemSchema),
}).refine(
  (data) => data.leadId || data.leadData,
  { message: 'Phải có leadId hoặc leadData', path: ['leadId'] }
);

// ============================================
// QUERY SCHEMAS
// ============================================

/**
 * Schema for querying projects
 */
export const queryProjectsSchema = z.object({
  developerId: z.string().cuid().optional(),
});

/**
 * Schema for querying buildings
 */
export const queryBuildingsSchema = z.object({
  projectId: z.string().cuid().optional(),
});

/**
 * Schema for querying layouts
 */
export const queryLayoutsSchema = z.object({
  buildingCode: z.string().min(1),
});

/**
 * Schema for querying layout by axis
 */
export const queryLayoutByAxisSchema = z.object({
  buildingCode: z.string().min(1),
  axis: z.coerce.number().int().min(0),
});

/**
 * Schema for querying apartment types
 */
export const queryApartmentTypesSchema = z.object({
  buildingCode: z.string().min(1),
  type: z.string().optional(),
});

/**
 * Schema for querying products
 */
export const queryProductsSchema = z.object({
  categoryId: z.string().cuid().optional(),
});

/**
 * Schema for querying combos
 */
export const queryCombosSchema = z.object({
  apartmentType: z.string().optional(),
});

/**
 * Schema for querying fees
 */
export const queryFeesSchema = z.object({
  applicability: feeApplicabilityEnum.optional(),
});

/**
 * Schema for querying quotations
 */
export const queryQuotationsSchema = z.object({
  leadId: z.string().cuid(),
});

// ============================================
// SYNC SCHEMAS
// _Requirements: 9.3, 9.4_
// ============================================

/**
 * Schema for Google Sheets sync operations
 */
export const syncSchema = z.object({
  spreadsheetId: z.string().min(1, 'Spreadsheet ID không được trống'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateDeveloperInput = z.infer<typeof createDeveloperSchema>;
export type UpdateDeveloperInput = z.infer<typeof updateDeveloperSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
export type CreateLayoutInput = z.infer<typeof createLayoutSchema>;
export type UpdateLayoutInput = z.infer<typeof updateLayoutSchema>;
export type CreateApartmentTypeInput = z.infer<typeof createApartmentTypeSchema>;
export type UpdateApartmentTypeInput = z.infer<typeof updateApartmentTypeSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ComboItemInput = z.infer<typeof comboItemSchema>;
export type CreateComboInput = z.infer<typeof createComboSchema>;
export type UpdateComboInput = z.infer<typeof updateComboSchema>;
export type CreateFeeInput = z.infer<typeof createFeeSchema>;
export type UpdateFeeInput = z.infer<typeof updateFeeSchema>;
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type QueryProjectsInput = z.infer<typeof queryProjectsSchema>;
export type QueryBuildingsInput = z.infer<typeof queryBuildingsSchema>;
export type QueryLayoutsInput = z.infer<typeof queryLayoutsSchema>;
export type QueryLayoutByAxisInput = z.infer<typeof queryLayoutByAxisSchema>;
export type QueryApartmentTypesInput = z.infer<typeof queryApartmentTypesSchema>;
export type QueryProductsInput = z.infer<typeof queryProductsSchema>;
export type QueryCombosInput = z.infer<typeof queryCombosSchema>;
export type QueryFeesInput = z.infer<typeof queryFeesSchema>;
export type QueryQuotationsInput = z.infer<typeof queryQuotationsSchema>;
export type SyncInput = z.infer<typeof syncSchema>;
