/**
 * Furniture API Types
 *
 * Type definitions for furniture quotation system
 *
 * **Feature: furniture-quotation, furniture-product-restructure**
 */

// ========== ENTITY TYPES ==========

export interface FurnitureDeveloper {
  id: string;
  name: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureProject {
  id: string;
  name: string;
  code: string;
  imageUrl?: string | null;
  developerId: string;
  developer?: FurnitureDeveloper;
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureBuilding {
  id: string;
  name: string;
  code: string;
  imageUrl?: string | null;
  projectId: string;
  project?: FurnitureProject;
  maxFloor: number;
  maxAxis: number;
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureLayout {
  id: string;
  layoutAxis: string;
  buildingCode: string;
  axis: number;
  apartmentType: string;
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureApartmentType {
  id: string;
  buildingCode: string;
  apartmentType: string;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureMaterial {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PricingType = 'M2' | 'LINEAR';

export interface FurnitureProductMapping {
  id: string;
  productId: string;
  projectName: string;
  buildingCode: string;
  apartmentType: string;
  createdAt: string;
}

export interface FurnitureProduct {
  id: string;
  name: string;
  material: string;
  categoryId: string;
  category?: FurnitureCategory;
  pricePerUnit: number;
  pricingType: PricingType;
  length: number;
  width?: number | null;
  calculatedPrice: number;
  allowFitIn: boolean;
  price: number; // DEPRECATED
  imageUrl: string | null;
  description: string | null;
  dimensions: string | null; // DEPRECATED
  order: number;
  isActive: boolean;
  mappings?: FurnitureProductMapping[];
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureFee {
  id: string;
  name: string;
  code?: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ========== QUOTATION TYPES ==========

export interface FurnitureQuotationItem {
  productId: string;
  name: string;
  material?: string;
  price: number;
  quantity: number;
  fitInSelected?: boolean;
  fitInFee?: number;
}

export interface FurnitureQuotationFee {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  amount: number;
}

export interface FurnitureQuotation {
  id: string;
  leadId: string;
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  unitNumber: string;
  apartmentType: string;
  layoutImageUrl: string | null;
  items: string;
  basePrice: number;
  fees: string;
  totalPrice: number;
  createdAt: string;
}

// ========== PRODUCT BASE TYPES (NEW) ==========

export interface ProductVariantWithMaterial {
  id: string;
  productBaseId: string;
  materialId: string;
  material: {
    id: string;
    name: string;
  };
  pricePerUnit: number;
  pricingType: 'LINEAR' | 'M2';
  length: number;
  width: number | null;
  calculatedPrice: number;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBaseMapping {
  id: string;
  productBaseId: string;
  projectName: string;
  buildingCode: string;
  apartmentType: string;
  createdAt: string;
}

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
  mappings: ProductBaseMapping[];
  variantCount: number;
  priceRange: { min: number; max: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProductBases {
  products: ProductBaseWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========== PDF SETTINGS ==========

export interface FurniturePdfSettings {
  id: string;
  companyName: string;
  companyTagline: string;
  companyLogo: string | null;
  documentTitle: string;
  primaryColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  companyNameSize: number;
  documentTitleSize: number;
  sectionTitleSize: number;
  bodyTextSize: number;
  footerTextSize: number;
  apartmentInfoTitle: string;
  selectionTypeTitle: string;
  productsTitle: string;
  priceDetailsTitle: string;
  contactInfoTitle: string;
  totalLabel: string;
  footerNote: string;
  footerCopyright: string;
  contactPhone: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  contactWebsite: string | null;
  additionalNotes: string | null;
  validityDays: number;
  showLayoutImage: boolean;
  showItemsTable: boolean;
  showFeeDetails: boolean;
  showContactInfo: boolean;
  showValidityDate: boolean;
  showQuotationCode: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========== INPUT TYPES ==========

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
  maxFloor?: number;
  maxAxis?: number;
  imageUrl?: string;
}

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
  imageUrl?: string | null;
  description?: string | null;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface CreateMaterialInput {
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateMaterialInput {
  name?: string;
  description?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface ProductMappingInput {
  projectName: string;
  buildingCode: string;
  apartmentType: string;
}

export interface CreateProductInput {
  name: string;
  material: string;
  categoryId: string;
  pricePerUnit: number;
  pricingType: PricingType;
  length: number;
  width?: number | null;
  calculatedPrice?: number;
  allowFitIn: boolean;
  mappings: ProductMappingInput[];
  price?: number;
  imageUrl?: string;
  description?: string;
  dimensions?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  material?: string;
  categoryId?: string;
  pricePerUnit?: number;
  pricingType?: PricingType;
  length?: number;
  width?: number | null;
  calculatedPrice?: number;
  allowFitIn?: boolean;
  price?: number;
  imageUrl?: string | null;
  description?: string | null;
  dimensions?: string | null;
  order?: number;
  isActive?: boolean;
}

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

export interface UpdateProductBaseInput {
  name?: string;
  categoryId?: string;
  description?: string | null;
  imageUrl?: string | null;
  allowFitIn?: boolean;
  order?: number;
  isActive?: boolean;
}

export interface GetProductBasesAdminQuery {
  categoryId?: string;
  materialId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'order' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateFeeInput {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateFeeInput {
  name?: string;
  type?: 'FIXED' | 'PERCENTAGE';
  value?: number;
  description?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface UpdatePdfSettingsInput {
  companyName?: string;
  companyTagline?: string;
  companyLogo?: string | null;
  documentTitle?: string;
  primaryColor?: string;
  textColor?: string;
  mutedColor?: string;
  borderColor?: string;
  companyNameSize?: number;
  documentTitleSize?: number;
  sectionTitleSize?: number;
  bodyTextSize?: number;
  footerTextSize?: number;
  apartmentInfoTitle?: string;
  selectionTypeTitle?: string;
  productsTitle?: string;
  priceDetailsTitle?: string;
  contactInfoTitle?: string;
  totalLabel?: string;
  footerNote?: string;
  footerCopyright?: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactAddress?: string | null;
  contactWebsite?: string | null;
  additionalNotes?: string | null;
  validityDays?: number;
  showLayoutImage?: boolean;
  showItemsTable?: boolean;
  showFeeDetails?: boolean;
  showContactInfo?: boolean;
  showValidityDate?: boolean;
  showQuotationCode?: boolean;
}

// ========== IMPORT/EXPORT TYPES ==========

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

export interface SyncResult {
  success: boolean;
  counts: ImportResult;
  error?: string;
}
