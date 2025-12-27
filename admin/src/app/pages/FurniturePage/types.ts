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
 * Furniture Product
 * Individual furniture product in the catalog
 */
export interface FurnitureProduct {
  id: string;
  name: string;
  categoryId: string;
  category?: FurnitureCategory;
  price: number;
  imageUrl: string | null;
  description: string | null;
  dimensions: string | null; // JSON: { width, height, depth }
  order: number;
  isActive: boolean;
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
export type TabType = 'management' | 'catalog' | 'settings' | 'pdf';

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
  products: FurnitureProduct[];
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
 * Input for creating a product
 */
export interface CreateProductInput {
  name: string;
  categoryId: string;
  price: number;
  imageUrl?: string;
  description?: string;
  dimensions?: string;
  order?: number;
  isActive?: boolean;
}

/**
 * Input for updating a product
 */
export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  price?: number;
  imageUrl?: string | null;
  description?: string | null;
  dimensions?: string | null;
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
