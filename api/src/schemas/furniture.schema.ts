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
// _Requirements: 2.3, 3.1, 3.2, 3.3, 9.1_
// ============================================

/**
 * Pricing type enum
 */
export const pricingTypeEnum = z.enum(['M2', 'LINEAR']);

/**
 * Schema for product-apartment mapping input
 * _Requirements: 1.1, 9.2_
 */
export const productMappingInputSchema = z.object({
  projectName: z.string().min(1, 'Tên dự án không được trống').max(200),
  buildingCode: z.string().min(1, 'Mã tòa nhà không được trống').max(50),
  apartmentType: z.string().min(1, 'Loại căn hộ không được trống').max(50),
}).transform(data => ({
  ...data,
  apartmentType: data.apartmentType.trim().toLowerCase(),
}));

/**
 * Schema for adding a mapping to a product (API request body)
 * _Requirements: 10.3_
 */
export const addProductMappingSchema = z.object({
  projectName: z.string().min(1, 'Tên dự án không được trống').max(200),
  buildingCode: z.string().min(1, 'Mã tòa nhà không được trống').max(50),
  apartmentType: z.string().min(1, 'Loại căn hộ không được trống').max(50),
});

/**
 * Schema for creating a product
 * NEW: Added material, pricePerUnit, pricingType, length, width, calculatedPrice, allowFitIn, mappings
 * _Requirements: 2.1, 3.1, 3.2, 3.3, 1.1_
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được trống').max(200),
  material: z.string().min(1, 'Chất liệu không được trống').max(100),
  categoryId: z.string().cuid('ID danh mục không hợp lệ'),
  pricePerUnit: z.number().positive('Giá trên 1 mét phải lớn hơn 0'),
  pricingType: pricingTypeEnum.default('LINEAR'),
  length: z.number().positive('Chiều dài phải lớn hơn 0'),
  width: z.number().positive('Chiều rộng phải lớn hơn 0').optional().nullable(),
  calculatedPrice: z.number().nonnegative('Giá đã tính không được âm').optional(), // Auto-calculated if not provided
  allowFitIn: z.boolean().default(false),
  mappings: z.array(productMappingInputSchema).optional().default([]), // Optional - can add mappings later via API
  price: z.number().nonnegative('Giá không được âm').optional(), // DEPRECATED: Keep for backward compatibility
  imageUrl: z.string().max(500).optional().nullable().or(z.literal('')), // Accept relative path or URL
  description: z.string().max(1000).optional().nullable(),
  dimensions: z.string().max(200).optional().nullable(), // DEPRECATED
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // Width is required when pricingType is M2
    if (data.pricingType === 'M2' && (data.width === undefined || data.width === null)) {
      return false;
    }
    return true;
  },
  { message: 'Chiều rộng là bắt buộc khi loại tính giá là M2', path: ['width'] }
);

/**
 * Schema for updating a product
 */
export const updateProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được trống').max(200).optional(),
  material: z.string().min(1, 'Chất liệu không được trống').max(100).optional(),
  categoryId: z.string().cuid('ID danh mục không hợp lệ').optional(),
  pricePerUnit: z.number().positive('Giá trên 1 mét phải lớn hơn 0').optional(),
  pricingType: pricingTypeEnum.optional(),
  length: z.number().positive('Chiều dài phải lớn hơn 0').optional(),
  width: z.number().positive('Chiều rộng phải lớn hơn 0').optional().nullable(),
  calculatedPrice: z.number().nonnegative('Giá đã tính không được âm').optional(),
  allowFitIn: z.boolean().optional(),
  price: z.number().positive('Giá phải lớn hơn 0').optional(), // DEPRECATED
  imageUrl: z.string().max(500).optional().nullable().or(z.literal('')), // Accept relative path or URL
  description: z.string().max(1000).optional().nullable(),
  dimensions: z.string().max(200).optional().nullable(), // DEPRECATED
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
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
 * Fee applicability enum - kept for DB compatibility, COMBO removed
 */
export const feeApplicabilityEnum = z.enum(['CUSTOM', 'BOTH']);

/**
 * Schema for creating a fee
 * NEW: Added code field (unique identifier)
 */
export const createFeeSchema = z.object({
  name: z.string().min(1, 'Tên phí không được trống').max(100),
  code: z.string().min(1, 'Mã phí không được trống').max(50).regex(/^[A-Z_]+$/, 'Mã phí chỉ chứa chữ in hoa và dấu gạch dưới'),
  type: feeTypeEnum,
  value: z.number().positive('Giá trị phải lớn hơn 0'),
  applicability: feeApplicabilityEnum.default('BOTH'),  // Default to BOTH
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

/**
 * Schema for updating a fee
 */
export const updateFeeSchema = z.object({
  name: z.string().min(1, 'Tên phí không được trống').max(100).optional(),
  code: z.string().min(1, 'Mã phí không được trống').max(50).regex(/^[A-Z_]+$/, 'Mã phí chỉ chứa chữ in hoa và dấu gạch dưới').optional(),
  type: feeTypeEnum.optional(),
  value: z.number().positive('Giá trị phải lớn hơn 0').optional(),
  applicability: feeApplicabilityEnum.optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

// ============================================
// QUOTATION SCHEMAS
// _Requirements: 7.8, 11.2_
// ============================================

/**
 * Schema for quotation item
 * 
 * **Feature: furniture-product-mapping**
 * **Validates: Requirements 8.3**
 * 
 * Includes material, calculatedPrice, fitInSelected, fitInFee for complete quotation data
 */
export const quotationItemSchema = z.object({
  productId: z.string().min(1, 'ID sản phẩm không được trống'),
  name: z.string().min(1),
  material: z.string().min(1, 'Chất liệu không được trống').optional(),  // NEW: Material variant
  price: z.number().nonnegative(),                                       // Base price (calculatedPrice)
  quantity: z.number().int().min(1),
  fitInSelected: z.boolean().optional().default(false),                  // NEW: Whether Fit-in is selected
  fitInFee: z.number().nonnegative().optional(),                         // NEW: Fit-in fee amount (if selected)
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
 * Items must have at least 1 product
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
  // Accept both relative paths (/uploads/...) and full URLs (http://...)
  layoutImageUrl: z.string().optional().nullable(),
  items: z.array(quotationItemSchema).min(1, 'Phải chọn ít nhất một sản phẩm'),
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
 * Schema for querying fees
 */
export const queryFeesSchema = z.object({});

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
// PRODUCT BASE SCHEMAS (NEW - furniture-product-restructure)
// _Requirements: 3.2, 3.3, 9.2, 9.3, 9.4_
// ============================================

/**
 * Schema for creating a variant (used in product base creation)
 * _Requirements: 4.2, 4.3_
 */
export const createVariantSchema = z.object({
  materialId: z.string().cuid('ID chất liệu không hợp lệ'),
  pricePerUnit: z.number().positive('Giá trên 1 mét phải lớn hơn 0'),
  pricingType: pricingTypeEnum.default('LINEAR'),
  length: z.number().positive('Chiều dài phải lớn hơn 0'),
  width: z.number().positive('Chiều rộng phải lớn hơn 0').optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable().or(z.literal('')),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // Width is required when pricingType is M2
    if (data.pricingType === 'M2' && (data.width === undefined || data.width === null)) {
      return false;
    }
    return true;
  },
  { message: 'Chiều rộng là bắt buộc khi loại tính giá là M2', path: ['width'] }
);

/**
 * Schema for updating a variant
 * _Requirements: 4.4_
 */
export const updateVariantSchema = z.object({
  materialId: z.string().cuid('ID chất liệu không hợp lệ').optional(),
  pricePerUnit: z.number().positive('Giá trên 1 mét phải lớn hơn 0').optional(),
  pricingType: pricingTypeEnum.optional(),
  length: z.number().positive('Chiều dài phải lớn hơn 0').optional(),
  width: z.number().positive('Chiều rộng phải lớn hơn 0').optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable().or(z.literal('')),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema for creating a product base with variants
 * _Requirements: 3.2, 9.3_
 */
export const createProductBaseSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được trống').max(200),
  categoryId: z.string().cuid('ID danh mục không hợp lệ'),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable().or(z.literal('')),
  allowFitIn: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  variants: z.array(createVariantSchema).min(1, 'Phải có ít nhất một biến thể'),
  mappings: z.array(productMappingInputSchema).optional().default([]),
});

/**
 * Schema for updating a product base (partial updates)
 * _Requirements: 3.3, 9.4_
 */
export const updateProductBaseSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được trống').max(200).optional(),
  categoryId: z.string().cuid('ID danh mục không hợp lệ').optional(),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable().or(z.literal('')),
  allowFitIn: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema for querying product bases (admin)
 * _Requirements: 9.2_
 */
export const queryProductBasesAdminSchema = z.object({
  categoryId: z.string().cuid().optional(),
  materialId: z.string().cuid().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  sortBy: z.enum(['name', 'order', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Schema for bulk mapping
 * _Requirements: 5.5_
 */
export const bulkMappingSchema = z.object({
  productBaseIds: z.array(z.string().cuid('ID sản phẩm không hợp lệ')).min(1, 'Phải chọn ít nhất một sản phẩm'),
  mapping: productMappingInputSchema,
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
export type ProductMappingInput = z.infer<typeof productMappingInputSchema>;
export type AddProductMappingInput = z.infer<typeof addProductMappingSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
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
export type QueryFeesInput = z.infer<typeof queryFeesSchema>;
export type QueryQuotationsInput = z.infer<typeof queryQuotationsSchema>;
export type SyncInput = z.infer<typeof syncSchema>;
export type CreateVariantSchemaInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantSchemaInput = z.infer<typeof updateVariantSchema>;
export type CreateProductBaseSchemaInput = z.infer<typeof createProductBaseSchema>;
export type UpdateProductBaseSchemaInput = z.infer<typeof updateProductBaseSchema>;
export type QueryProductBasesAdminInput = z.infer<typeof queryProductBasesAdminSchema>;
export type BulkMappingSchemaInput = z.infer<typeof bulkMappingSchema>;
