// Shared types for Furniture Quotation System
// Feature: furniture-quotation
// Requirements: 1.1

// ========== ENTITY TYPES ==========

/**
 * Furniture Developer (Chủ đầu tư)
 * Represents a real estate developer company
 */
export interface FurnitureDeveloper {
  id: string;
  name: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Furniture Project (Dự án)
 * Represents a real estate project by a developer
 */
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

/**
 * Furniture Building (Tòa nhà)
 * Represents a building within a project
 */
export interface FurnitureBuilding {
  id: string;
  name: string; // TenToaNha (display name)
  code: string; // MaToaNha (for lookup)
  imageUrl?: string | null;
  projectId: string;
  project?: FurnitureProject;
  maxFloor: number; // SoTangMax
  maxAxis: number; // SoTrucMax
  createdAt: string;
  updatedAt: string;
}

/**
 * Furniture Layout
 * Maps building code + axis to apartment type
 */
export interface FurnitureLayout {
  id: string;
  layoutAxis: string; // {MaToaNha}_{SoTruc}
  buildingCode: string; // MaToaNha
  axis: number; // SoTruc
  apartmentType: string; // 1pn, 2pn, 3pn, etc.
  createdAt: string;
  updatedAt: string;
}

/**
 * Furniture Apartment Type
 * Contains image and description for each apartment type per building
 */
export interface FurnitureApartmentType {
  id: string;
  buildingCode: string; // MaToaNha
  apartmentType: string; // 1pn, 2pn, etc.
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Furniture Category
 * Product category for furniture catalog
 */
export interface FurnitureCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  _count?: { products: number };
  createdAt: string;
  updatedAt: string;
}

/**
 * Furniture Material (Chất liệu)
 * Material type for furniture products
 */
export interface FurnitureMaterial {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pricing type for furniture products
 */
export type PricingType = 'M2' | 'LINEAR';

/**
 * Product-Apartment Mapping
 * Links a product to a specific apartment (Project + Building + ApartmentType)
 */
export interface FurnitureProductMapping {
  id: string;
  productId: string;
  projectName: string;
  buildingCode: string;
  apartmentType: string;
  createdAt: string;
}

/**
 * Furniture Product
 * Individual furniture product in the catalog
 */
export interface FurnitureProduct {
  id: string;
  name: string;
  material: string;              // NEW: Chất liệu (VD: "Gỗ sồi", "MDF")
  categoryId: string;
  category?: FurnitureCategory;
  pricePerUnit: number;          // NEW: Giá trên 1 mét (VNĐ)
  pricingType: PricingType;      // NEW: Cách tính giá (M2 = mét vuông, LINEAR = mét dài)
  length: number;                // NEW: Chiều dài (m)
  width?: number | null;         // NEW: Chiều rộng (m) - chỉ cho M2
  calculatedPrice: number;       // NEW: Giá đã tính = pricePerUnit × dimensions
  allowFitIn: boolean;           // NEW: Cho phép chọn Fit-in
  price: number;                 // DEPRECATED: Keep for backward compatibility
  imageUrl: string | null;
  description: string | null;
  dimensions: string | null;     // DEPRECATED: JSON: { width, height, depth }
  order: number;
  isActive: boolean;
  mappings?: FurnitureProductMapping[]; // NEW: Product-apartment mappings
  createdAt: string;
  updatedAt: string;
}

/**
 * Fee Type enum
 */
export type FeeType = 'FIXED' | 'PERCENTAGE';

/**
 * Furniture Fee
 * Additional fees applied to quotations
 */
export interface FurnitureFee {
  id: string;
  name: string;
  code?: string; // Unique code for system fees (e.g., "FIT_IN", "VAT")
  type: FeeType;
  value: number;
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Quotation Fee
 * Fee breakdown in a quotation
 */
export interface FurnitureQuotationFee {
  name: string;
  type: FeeType;
  value: number;
  amount: number;
}

/**
 * Furniture Quotation
 * Complete quotation record linked to a lead
 */
export interface FurnitureQuotation {
  id: string;
  leadId: string;
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  unitNumber: string; // Calculated: {buildingCode}.{floor}{axis}
  apartmentType: string;
  layoutImageUrl: string | null;
  items: string; // JSON string of FurnitureQuotationItem[]
  basePrice: number;
  fees: string; // JSON string of FurnitureQuotationFee[]
  totalPrice: number;
  createdAt: string;
}

// ========== TAB TYPE ==========

/**
 * Tab types for FurniturePage navigation
 */
export type TabType = 'management' | 'catalog' | 'mapping' | 'settings' | 'pdf';

// ========== TAB PROPS ==========

/**
 * Base props for all tabs
 */
export interface TabProps {
  onRefresh: () => void;
}

/**
 * Props for ManagementTab
 */
export interface ManagementTabProps extends TabProps {
  developers: FurnitureDeveloper[];
  projects: FurnitureProject[];
  buildings: FurnitureBuilding[];
  layouts: FurnitureLayout[];
  apartmentTypes: FurnitureApartmentType[];
}

/**
 * Props for CatalogTab
 */
export interface CatalogTabProps extends TabProps {
  categories: FurnitureCategory[];
  productBases: ProductBaseWithDetails[];
  materials: FurnitureMaterial[];
}

/**
 * Props for SettingsTab
 */
export interface SettingsTabProps extends TabProps {
  fees: FurnitureFee[];
}

// ========== INPUT TYPES ==========

/**
 * Input for creating a developer
 */
export interface CreateDeveloperInput {
  name: string;
  imageUrl?: string;
}

/**
 * Input for updating a developer
 */
export interface UpdateDeveloperInput {
  name?: string;
  imageUrl?: string;
}

/**
 * Input for creating a project
 */
export interface CreateProjectInput {
  name: string;
  code: string;
  developerId: string;
  imageUrl?: string;
}

/**
 * Input for updating a project
 */
export interface UpdateProjectInput {
  name?: string;
  code?: string;
  imageUrl?: string;
}

/**
 * Input for creating a building
 */
export interface CreateBuildingInput {
  name: string;
  code: string;
  projectId: string;
  maxFloor: number;
  maxAxis: number;
  imageUrl?: string;
}

/**
 * Input for updating a building
 */
export interface UpdateBuildingInput {
  name?: string;
  code?: string;
  maxFloor?: number;
  maxAxis?: number;
  imageUrl?: string;
}

/**
 * Input for creating a layout
 */
export interface CreateLayoutInput {
  buildingCode: string;
  axis: number;
  apartmentType: string;
}

/**
 * Input for updating a layout
 */
export interface UpdateLayoutInput {
  apartmentType?: string;
}

/**
 * Input for creating an apartment type
 */
export interface CreateApartmentTypeInput {
  buildingCode: string;
  apartmentType: string;
  imageUrl?: string;
  description?: string;
}

/**
 * Input for updating an apartment type
 */
export interface UpdateApartmentTypeInput {
  apartmentType?: string;
  imageUrl?: string | null;
  description?: string | null;
}

/**
 * Input for creating a category
 */
export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

/**
 * Input for updating a category
 */
export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  order?: number;
  isActive?: boolean;
}

/**
 * Input for product-apartment mapping
 */
export interface ProductMappingInput {
  projectName: string;
  buildingCode: string;
  apartmentType: string;
}

/**
 * Input for creating a product
 */
export interface CreateProductInput {
  name: string;
  material: string;              // NEW: Chất liệu
  categoryId: string;
  pricePerUnit: number;          // NEW: Giá trên 1 mét
  pricingType: PricingType;      // NEW: M2 | LINEAR
  length: number;                // NEW: Chiều dài
  width?: number | null;         // NEW: Chiều rộng (required for M2)
  calculatedPrice?: number;      // NEW: Auto-calculated
  allowFitIn: boolean;           // NEW: Cho phép Fit-in
  mappings: ProductMappingInput[]; // NEW: At least one mapping required
  price?: number;                // DEPRECATED
  imageUrl?: string;
  description?: string;
  dimensions?: string;           // DEPRECATED
  order?: number;
  isActive?: boolean;
}

/**
 * Input for updating a product
 */
export interface UpdateProductInput {
  name?: string;
  material?: string;             // NEW
  categoryId?: string;
  pricePerUnit?: number;         // NEW
  pricingType?: PricingType;     // NEW
  length?: number;               // NEW
  width?: number | null;         // NEW
  calculatedPrice?: number;      // NEW
  allowFitIn?: boolean;          // NEW
  price?: number;                // DEPRECATED
  imageUrl?: string | null;
  description?: string | null;
  dimensions?: string | null;    // DEPRECATED
  order?: number;
  isActive?: boolean;
}

/**
 * Input for creating a fee
 */
export interface CreateFeeInput {
  name: string;
  type: FeeType;
  value: number;
  description?: string;
  order?: number;
  isActive?: boolean;
}

/**
 * Input for updating a fee
 */
export interface UpdateFeeInput {
  name?: string;
  type?: FeeType;
  value?: number;
  description?: string | null;
  order?: number;
  isActive?: boolean;
}

// ========== IMPORT/EXPORT TYPES ==========

/**
 * Result of CSV import operation
 */
export interface ImportResult {
  developers: number;
  projects: number;
  buildings: number;
  layouts: number;
  apartmentTypes: number;
}

/**
 * Result of CSV export operation
 */
export interface ExportResult {
  duAn: string;
  layouts: string;
  apartmentTypes: string;
}

/**
 * Result of Google Sheets sync operation
 */
export interface SyncResult {
  success: boolean;
  counts: ImportResult;
  error?: string;
}

// ========== METRICS GRID TYPES ==========

/**
 * Cell data for the metrics grid
 */
export interface MetricsGridCell {
  floor: number;
  axis: number;
  apartmentType: string | null;
  layoutId: string | null;
}

/**
 * Row data for the metrics grid
 */
export interface MetricsGridRow {
  floor: number;
  cells: MetricsGridCell[];
}

// ========== RE-EXPORTS ==========

// Re-export API_URL from shared for convenience
export { API_URL } from '@app/shared';

// ========== PRODUCT BASE TYPES (NEW - furniture-product-restructure) ==========

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

/**
 * Product mapping type (now references productBaseId)
 */
export interface ProductBaseMapping {
  id: string;
  productBaseId: string;
  projectName: string;
  buildingCode: string;
  apartmentType: string;
  createdAt: string;
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
  mappings: ProductBaseMapping[];
  variantCount: number;
  priceRange: { min: number; max: number } | null;
  createdAt: string;
  updatedAt: string;
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


// ========== PDF SETTINGS TYPES ==========

/**
 * PDF Settings for furniture quotations
 */
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
  // Font sizes
  companyNameSize: number;
  documentTitleSize: number;
  sectionTitleSize: number;
  bodyTextSize: number;
  footerTextSize: number;
  // Section titles
  apartmentInfoTitle: string;
  selectionTypeTitle: string;
  productsTitle: string;
  priceDetailsTitle: string;
  contactInfoTitle: string;
  totalLabel: string;
  // Footer
  footerNote: string;
  footerCopyright: string;
  contactPhone: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  contactWebsite: string | null;
  additionalNotes: string | null;
  validityDays: number;
  // Show/hide
  showLayoutImage: boolean;
  showItemsTable: boolean;
  showFeeDetails: boolean;
  showContactInfo: boolean;
  showValidityDate: boolean;
  showQuotationCode: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for updating PDF settings
 */
export interface UpdatePdfSettingsInput {
  companyName?: string;
  companyTagline?: string;
  companyLogo?: string | null;
  documentTitle?: string;
  primaryColor?: string;
  textColor?: string;
  mutedColor?: string;
  borderColor?: string;
  // Font sizes
  companyNameSize?: number;
  documentTitleSize?: number;
  sectionTitleSize?: number;
  bodyTextSize?: number;
  footerTextSize?: number;
  // Section titles
  apartmentInfoTitle?: string;
  selectionTypeTitle?: string;
  productsTitle?: string;
  priceDetailsTitle?: string;
  contactInfoTitle?: string;
  totalLabel?: string;
  // Footer
  footerNote?: string;
  footerCopyright?: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactAddress?: string | null;
  contactWebsite?: string | null;
  additionalNotes?: string | null;
  validityDays?: number;
  // Show/hide
  showLayoutImage?: boolean;
  showItemsTable?: boolean;
  showFeeDetails?: boolean;
  showContactInfo?: boolean;
  showValidityDate?: boolean;
  showQuotationCode?: boolean;
}

/**
 * Props for PdfSettingsTab
 */
export interface PdfSettingsTabProps extends TabProps {
  pdfSettings: FurniturePdfSettings | null;
}
