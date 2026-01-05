/**
 * Furniture Service Types & Interfaces
 *
 * Shared types for furniture quotation system
 *
 * **Feature: furniture-quotation**
 */

import {
  FurnitureCategory,
  FurnitureProduct,
  FurnitureFee,
} from '@prisma/client';

// ============================================
// PRODUCT TYPES
// ============================================

/**
 * Product with category relation
 */
export interface FurnitureProductWithCategory extends FurnitureProduct {
  category: FurnitureCategory;
}

/**
 * Category with product count
 */
export interface FurnitureCategoryWithCount extends FurnitureCategory {
  _count: { products: number };
}

/**
 * Product with category relation (legacy - no mappings)
 * _Requirements: 1.2_
 */
export interface FurnitureProductWithCategory extends FurnitureProduct {
  category: FurnitureCategory;
}

/**
 * Product mapping type (now references productBaseId)
 */
export interface ProductMapping {
  id: string;
  productBaseId: string;
  projectName: string;
  buildingCode: string;
  apartmentType: string;
  createdAt: Date;
}

/**
 * Product variant for grouped display
 * _Requirements: 2.3_
 */
export interface ProductVariant {
  id: string;
  material: string;
  calculatedPrice: number;
  allowFitIn: boolean;
  imageUrl?: string | null;
  description?: string | null;
  categoryId: string;
  categoryName: string;
  order: number;
}

/**
 * Products grouped by name with material variants
 * _Requirements: 2.3_
 */
export interface ProductGroup {
  name: string;
  variants: ProductVariant[];
}

// ============================================
// QUOTATION TYPES
// ============================================

/**
 * Quotation item for calculation
 *
 * **Feature: furniture-product-mapping**
 * **Validates: Requirements 4.4, 4.5, 8.3**
 */
export interface QuotationItem {
  productId: string;
  name: string;
  material?: string;
  price: number;
  quantity: number;
  fitInSelected?: boolean;
  fitInFee?: number;
}

/**
 * Fee breakdown in quotation
 */
export interface FeeBreakdown {
  name: string;
  type: string;
  value: number;
  amount: number;
}

/**
 * Quotation calculation result
 *
 * **Feature: furniture-product-mapping**
 * **Validates: Requirements 4.5, 8.4**
 */
export interface QuotationCalculation {
  basePrice: number;
  fitInFeesTotal: number;
  feesBreakdown: FeeBreakdown[];
  totalPrice: number;
}

// ============================================
// INPUT TYPES - DEVELOPER/PROJECT/BUILDING
// ============================================

export interface CreateDeveloperInput {
  name: string;
  imageUrl?: string;
}

export interface UpdateDeveloperInput {
  name?: string;
  imageUrl?: string;
}

export interface CreateProjectInput {
  name: string;
  code: string;
  developerId: string;
  imageUrl?: string;
}

export interface UpdateProjectInput {
  name?: string;
  code?: string;
  imageUrl?: string;
}

export interface CreateBuildingInput {
  name: string;
  code: string;
  projectId: string;
  maxFloor: number;
  maxAxis: number;
  imageUrl?: string;
}

export interface UpdateBuildingInput {
  name?: string;
  code?: string;
  imageUrl?: string;
  maxFloor?: number;
  maxAxis?: number;
}

// ============================================
// INPUT TYPES - LAYOUT/APARTMENT TYPE
// ============================================

export interface CreateLayoutInput {
  buildingCode: string;
  axis: number;
  apartmentType: string;
}

export interface UpdateLayoutInput {
  apartmentType?: string;
}

export interface CreateApartmentTypeInput {
  buildingCode: string;
  apartmentType: string;
  imageUrl?: string;
  description?: string;
}

export interface UpdateApartmentTypeInput {
  apartmentType?: string;
  imageUrl?: string;
  description?: string;
}

// ============================================
// INPUT TYPES - CATEGORY
// ============================================

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

// ============================================
// INPUT TYPES - PRODUCT
// ============================================

/**
 * Input for product-apartment mapping
 * _Requirements: 1.1, 9.2_
 */
export interface ProductMappingInput {
  projectName: string;
  buildingCode: string;
  apartmentType: string;
}

/**
 * Query parameters for filtering products
 * _Requirements: 1.4, 10.1_
 */
export interface GetProductsQuery {
  categoryId?: string;
  projectName?: string;
  buildingCode?: string;
  apartmentType?: string;
}

export interface CreateProductInput {
  name: string;
  material: string;
  categoryId: string;
  pricePerUnit: number;
  pricingType: 'M2' | 'LINEAR';
  length: number;
  width?: number | null;
  calculatedPrice?: number;
  allowFitIn: boolean;
  mappings: ProductMappingInput[];
  price?: number; // DEPRECATED
  imageUrl?: string | null;
  description?: string | null;
  dimensions?: string | null; // DEPRECATED
  order: number;
  isActive: boolean;
}

export interface UpdateProductInput {
  name?: string;
  material?: string;
  categoryId?: string;
  pricePerUnit?: number;
  pricingType?: 'M2' | 'LINEAR';
  length?: number;
  width?: number;
  calculatedPrice?: number;
  allowFitIn?: boolean;
  price?: number; // DEPRECATED
  imageUrl?: string;
  description?: string;
  dimensions?: string; // DEPRECATED
  order?: number;
  isActive?: boolean;
}

// ============================================
// INPUT TYPES - FEE
// ============================================

export interface CreateFeeInput {
  name: string;
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  applicability?: 'CUSTOM' | 'BOTH';
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateFeeInput {
  name?: string;
  code?: string;
  type?: 'FIXED' | 'PERCENTAGE';
  value?: number;
  applicability?: 'CUSTOM' | 'BOTH';
  description?: string;
  isActive?: boolean;
  order?: number;
}

// ============================================
// INPUT TYPES - QUOTATION
// ============================================

export interface CreateQuotationInput {
  leadId: string;
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  apartmentType: string;
  layoutImageUrl?: string;
  items: QuotationItem[];
  fees: FurnitureFee[];
}

// ============================================
// CSV IMPORT/EXPORT TYPES
// ============================================

export interface DuAnRow {
  ChuDauTu: string;
  TenDuAn: string;
  MaDuAn: string;
  TenToaNha: string;
  MaToaNha: string;
  SoTangMax: string;
  SoTrucMax: string;
}

export interface LayoutRow {
  LayoutAxis: string;
  MaToaNha: string;
  SoTruc: string;
  ApartmentType: string;
}

export interface ApartmentTypeRow {
  MaToaNha: string;
  ApartmentType: string;
  'Ảnh': string;
  'Mô tả': string;
}

export interface ImportResult {
  developers: number;
  projects: number;
  buildings: number;
  layouts: number;
  apartmentTypes: number;
}

export interface ExportResult {
  duAn: string;
  layouts: string;
  apartmentTypes: string;
}

// ============================================
// PRODUCT BASE TYPES (NEW - furniture-product-restructure)
// ============================================

/**
 * Input for creating a variant
 * _Requirements: 4.2, 4.3_
 */
export interface CreateVariantInput {
  materialId: string;
  pricePerUnit: number;
  pricingType: 'LINEAR' | 'M2';
  length: number;
  width?: number | null;
  imageUrl?: string | null;
  order?: number;
  isActive?: boolean;
}

/**
 * Input for updating a variant
 * _Requirements: 4.4_
 */
export interface UpdateVariantInput {
  materialId?: string;
  pricePerUnit?: number;
  pricingType?: 'LINEAR' | 'M2';
  length?: number;
  width?: number | null;
  imageUrl?: string | null;
  order?: number;
  isActive?: boolean;
}

/**
 * Input for creating a product base with variants
 * _Requirements: 3.2, 9.3_
 */
export interface CreateProductBaseInput {
  name: string;
  categoryId: string;
  description?: string | null;
  imageUrl?: string | null;
  allowFitIn?: boolean;
  order?: number;
  isActive?: boolean;
  variants: CreateVariantInput[];
  mappings?: ProductMappingInput[];
}

/**
 * Input for updating a product base
 * _Requirements: 3.3, 9.4_
 */
export interface UpdateProductBaseInput {
  name?: string;
  categoryId?: string;
  description?: string | null;
  imageUrl?: string | null;
  allowFitIn?: boolean;
  order?: number;
  isActive?: boolean;
}

/**
 * Variant with material info for display
 * _Requirements: 4.1_
 */
export interface ProductVariantWithMaterial {
  id: string;
  productBaseId: string;
  materialId: string;
  material: {
    id: string;
    name: string;
  };
  pricePerUnit: number;
  pricingType: string;
  length: number;
  width: number | null;
  calculatedPrice: number;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product base with all details for admin
 * _Requirements: 3.1, 9.2_
 */
export interface ProductBaseWithDetails {
  id: string;
  name: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  description: string | null;
  imageUrl: string | null;
  allowFitIn: boolean;
  order: number;
  isActive: boolean;
  variants: ProductVariantWithMaterial[];
  mappings: ProductMapping[];
  variantCount: number;
  priceRange: { min: number; max: number } | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product base group for landing page
 * _Requirements: 6.1, 6.2, 9.1_
 */
export interface ProductBaseGroup {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  imageUrl: string | null;
  allowFitIn: boolean;
  variants: ProductVariantForLanding[];
  priceRange: { min: number; max: number } | null;
  variantCount: number;
}

/**
 * Variant info for landing page (minimal)
 * _Requirements: 6.4, 7.2_
 */
export interface ProductVariantForLanding {
  id: string;
  materialId: string;
  materialName: string;
  calculatedPrice: number;
  imageUrl: string | null;
}

/**
 * Query parameters for admin product list
 * _Requirements: 9.2_
 */
export interface GetProductBasesAdminQuery {
  categoryId?: string;
  materialId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'order' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result for admin product list
 * _Requirements: 9.2_
 */
export interface PaginatedProductBases {
  products: ProductBaseWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Input for bulk creating mappings for multiple products
 * _Requirements: 5.5_
 */
export interface BulkMappingInput {
  productBaseIds: string[];
  mapping: ProductMappingInput;
}

/**
 * Result of bulk mapping operation
 * _Requirements: 5.5_
 */
export interface BulkMappingResult {
  success: boolean;
  created: number;
  skipped: number;
  errors: Array<{
    productBaseId: string;
    error: string;
  }>;
}
