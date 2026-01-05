// Furniture APIs - ANH THỢ XÂY Admin Dashboard
// Furniture Quotation System: Developers, Projects, Buildings, Layouts, ApartmentTypes,
// Categories, Products, Fees, Data Import/Export, Quotations
import { API_BASE, apiFetch } from './client';
import { tokenStorage } from '../store';

// ========== TYPE DEFINITIONS ==========

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

/**
 * Pricing type for furniture products
 */
export type PricingType = 'M2' | 'LINEAR';

/**
 * Product-Apartment Mapping
 */
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
  material: string;              // NEW: Chất liệu
  categoryId: string;
  category?: FurnitureCategory;
  pricePerUnit: number;          // NEW: Giá trên 1 mét
  pricingType: PricingType;      // NEW: M2 | LINEAR
  length: number;                // NEW: Chiều dài
  width?: number | null;         // NEW: Chiều rộng (for M2)
  calculatedPrice: number;       // NEW: Giá đã tính
  allowFitIn: boolean;           // NEW: Cho phép Fit-in
  price: number;                 // DEPRECATED
  imageUrl: string | null;
  description: string | null;
  dimensions: string | null;     // DEPRECATED
  order: number;
  isActive: boolean;
  mappings?: FurnitureProductMapping[]; // NEW
  createdAt: string;
  updatedAt: string;
}


export interface FurnitureFee {
  id: string;
  name: string;
  code?: string; // Unique code for system fees (e.g., "FIT_IN", "VAT")
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Quotation item with material and Fit-in support
 * 
 * **Feature: furniture-product-mapping**
 * **Validates: Requirements 8.3**
 */
export interface FurnitureQuotationItem {
  productId: string;
  name: string;
  material?: string;              // NEW: Material variant
  price: number;                  // Base price (calculatedPrice)
  quantity: number;
  fitInSelected?: boolean;        // NEW: Whether Fit-in is selected
  fitInFee?: number;              // NEW: Fit-in fee amount (if selected)
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
  items: string; // JSON string of FurnitureQuotationItem[]
  basePrice: number;
  fees: string; // JSON string of FurnitureQuotationFee[]
  totalPrice: number;
  createdAt: string;
}

// ========== INPUT TYPES ==========

interface CreateDeveloperInput {
  name: string;
  imageUrl?: string;
}

interface UpdateDeveloperInput {
  name?: string;
  imageUrl?: string;
}

interface CreateProjectInput {
  name: string;
  code: string;
  developerId: string;
  imageUrl?: string;
}

interface UpdateProjectInput {
  name?: string;
  code?: string;
  imageUrl?: string;
}

interface CreateBuildingInput {
  name: string;
  code: string;
  projectId: string;
  maxFloor: number;
  maxAxis: number;
  imageUrl?: string;
}

interface UpdateBuildingInput {
  name?: string;
  code?: string;
  maxFloor?: number;
  maxAxis?: number;
  imageUrl?: string;
}

interface CreateLayoutInput {
  buildingCode: string;
  axis: number;
  apartmentType: string;
}

interface UpdateLayoutInput {
  apartmentType?: string;
}

interface CreateApartmentTypeInput {
  buildingCode: string;
  apartmentType: string;
  imageUrl?: string;
  description?: string;
}

interface UpdateApartmentTypeInput {
  apartmentType?: string;
  imageUrl?: string | null;
  description?: string | null;
}

interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  order?: number;
  isActive?: boolean;
}

/**
 * Input for product-apartment mapping
 */
interface ProductMappingInput {
  projectName: string;
  buildingCode: string;
  apartmentType: string;
}

interface CreateProductInput {
  name: string;
  material: string;              // NEW
  categoryId: string;
  pricePerUnit: number;          // NEW
  pricingType: PricingType;      // NEW
  length: number;                // NEW
  width?: number | null;         // NEW
  calculatedPrice?: number;      // NEW
  allowFitIn: boolean;           // NEW
  mappings: ProductMappingInput[]; // NEW
  price?: number;                // DEPRECATED
  imageUrl?: string;
  description?: string;
  dimensions?: string;           // DEPRECATED
  order?: number;
  isActive?: boolean;
}

interface UpdateProductInput {
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

interface CreateFeeInput {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description?: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateFeeInput {
  name?: string;
  type?: 'FIXED' | 'PERCENTAGE';
  value?: number;
  description?: string | null;
  order?: number;
  isActive?: boolean;
}


// ========== IMPORT/EXPORT TYPES ==========

interface ImportResult {
  developers: number;
  projects: number;
  buildings: number;
  layouts: number;
  apartmentTypes: number;
}

interface ExportResult {
  duAn: string;
  layouts: string;
  apartmentTypes: string;
}

interface SyncResult {
  success: boolean;
  counts: ImportResult;
  error?: string;
}

// ========== DEVELOPERS API ==========
/**
 * Furniture Developers API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 1.1, 1.10, 1.11, 1.14**
 */
export const furnitureDevelopersApi = {
  list: () =>
    apiFetch<FurnitureDeveloper[]>('/api/admin/furniture/developers'),

  create: (data: CreateDeveloperInput) =>
    apiFetch<FurnitureDeveloper>('/api/admin/furniture/developers', { method: 'POST', body: data }),

  update: (id: string, data: UpdateDeveloperInput) =>
    apiFetch<FurnitureDeveloper>(`/api/admin/furniture/developers/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/developers/${id}`, { method: 'DELETE' }),
};

// ========== PROJECTS API ==========
/**
 * Furniture Projects API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 1.1, 1.10, 1.11, 1.14**
 */
export const furnitureProjectsApi = {
  list: (developerId?: string) => {
    const query = developerId ? `?developerId=${developerId}` : '';
    return apiFetch<FurnitureProject[]>(`/api/admin/furniture/projects${query}`);
  },

  create: (data: CreateProjectInput) =>
    apiFetch<FurnitureProject>('/api/admin/furniture/projects', { method: 'POST', body: data }),

  update: (id: string, data: UpdateProjectInput) =>
    apiFetch<FurnitureProject>(`/api/admin/furniture/projects/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/projects/${id}`, { method: 'DELETE' }),
};

// ========== BUILDINGS API ==========
/**
 * Furniture Buildings API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 1.1, 1.10, 1.11, 1.13, 1.14**
 */
export const furnitureBuildingsApi = {
  list: (projectId?: string) => {
    const query = projectId ? `?projectId=${projectId}` : '';
    return apiFetch<FurnitureBuilding[]>(`/api/admin/furniture/buildings${query}`);
  },

  create: (data: CreateBuildingInput) =>
    apiFetch<FurnitureBuilding>('/api/admin/furniture/buildings', { method: 'POST', body: data }),

  update: (id: string, data: UpdateBuildingInput) =>
    apiFetch<FurnitureBuilding>(`/api/admin/furniture/buildings/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/buildings/${id}`, { method: 'DELETE' }),
};

// ========== LAYOUTS API ==========
/**
 * Furniture Layouts API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 1.3, 1.10, 1.11, 1.14**
 */
export const furnitureLayoutsApi = {
  list: (buildingCode: string) =>
    apiFetch<FurnitureLayout[]>(`/api/admin/furniture/layouts?buildingCode=${encodeURIComponent(buildingCode)}`),

  getByAxis: (buildingCode: string, axis: number) =>
    apiFetch<FurnitureLayout | null>(`/api/admin/furniture/layouts/by-axis?buildingCode=${encodeURIComponent(buildingCode)}&axis=${axis}`),

  create: (data: CreateLayoutInput) =>
    apiFetch<FurnitureLayout>('/api/admin/furniture/layouts', { method: 'POST', body: data }),

  update: (id: string, data: UpdateLayoutInput) =>
    apiFetch<FurnitureLayout>(`/api/admin/furniture/layouts/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/layouts/${id}`, { method: 'DELETE' }),
};

// ========== APARTMENT TYPES API ==========
/**
 * Furniture Apartment Types API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 1.4, 1.5, 1.10, 1.11, 1.14**
 */
export const furnitureApartmentTypesApi = {
  list: (buildingCode: string, type?: string) => {
    const params = new URLSearchParams({ buildingCode });
    if (type) params.append('type', type);
    return apiFetch<FurnitureApartmentType[]>(`/api/admin/furniture/apartment-types?${params.toString()}`);
  },

  create: (data: CreateApartmentTypeInput) =>
    apiFetch<FurnitureApartmentType>('/api/admin/furniture/apartment-types', { method: 'POST', body: data }),

  update: (id: string, data: UpdateApartmentTypeInput) =>
    apiFetch<FurnitureApartmentType>(`/api/admin/furniture/apartment-types/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/apartment-types/${id}`, { method: 'DELETE' }),
};


// ========== CATEGORIES API ==========
/**
 * Furniture Categories API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 2.1, 2.6, 2.7**
 */
export const furnitureCategoriesApi = {
  list: () =>
    apiFetch<FurnitureCategory[]>('/api/admin/furniture/categories'),

  create: (data: CreateCategoryInput) =>
    apiFetch<FurnitureCategory>('/api/admin/furniture/categories', { method: 'POST', body: data }),

  update: (id: string, data: UpdateCategoryInput) =>
    apiFetch<FurnitureCategory>(`/api/admin/furniture/categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/categories/${id}`, { method: 'DELETE' }),
};

// ========== MATERIALS API ==========
/**
 * Furniture Materials API (Chất liệu)
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

interface CreateMaterialInput {
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateMaterialInput {
  name?: string;
  description?: string | null;
  order?: number;
  isActive?: boolean;
}

export const furnitureMaterialsApi = {
  list: () =>
    apiFetch<FurnitureMaterial[]>('/api/admin/furniture/materials'),

  create: (data: CreateMaterialInput) =>
    apiFetch<FurnitureMaterial>('/api/admin/furniture/materials', { method: 'POST', body: data }),

  update: (id: string, data: UpdateMaterialInput) =>
    apiFetch<FurnitureMaterial>(`/api/admin/furniture/materials/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/materials/${id}`, { method: 'DELETE' }),
};

// ========== PRODUCTS API (LEGACY) ==========
/**
 * Furniture Products API (Legacy - READ-ONLY)
 * @deprecated Use furnitureProductBasesApi for new products
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 2.2, 2.3, 2.4, 2.5**
 */
export const furnitureProductsApi = {
  list: (categoryId?: string) => {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return apiFetch<FurnitureProduct[]>(`/api/admin/furniture/products${query}`);
  },

  create: (data: CreateProductInput) =>
    apiFetch<FurnitureProduct>('/api/admin/furniture/products', { method: 'POST', body: data }),

  update: (id: string, data: UpdateProductInput) =>
    apiFetch<FurnitureProduct>(`/api/admin/furniture/products/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/products/${id}`, { method: 'DELETE' }),

  // ========== PRODUCT MAPPINGS ==========
  // _Requirements: 10.3, 10.4, 10.5_

  /**
   * Get all mappings for a product
   * _Requirements: 10.5_
   */
  getMappings: (productId: string) =>
    apiFetch<{ mappings: FurnitureProductMapping[] }>(`/api/admin/furniture/products/${productId}/mappings`),

  /**
   * Add a mapping to a product
   * _Requirements: 10.3_
   */
  addMapping: (productId: string, data: ProductMappingInput) =>
    apiFetch<FurnitureProductMapping>(`/api/admin/furniture/products/${productId}/mappings`, { method: 'POST', body: data }),

  /**
   * Remove a mapping from a product
   * _Requirements: 10.4_
   */
  removeMapping: (productId: string, mappingId: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/products/${productId}/mappings/${mappingId}`, { method: 'DELETE' }),
};

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

// ========== PRODUCT BASES API (NEW - furniture-product-restructure) ==========
/**
 * Furniture Product Bases API
 * 
 * **Feature: furniture-product-restructure**
 * **Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.2, 9.3, 9.4, 9.6**
 */
export const furnitureProductBasesApi = {
  /**
   * List product bases with pagination, filtering, and sorting
   * _Requirements: 3.1, 9.2_
   */
  list: (query?: GetProductBasesAdminQuery) => {
    const params = new URLSearchParams();
    if (query?.categoryId) params.append('categoryId', query.categoryId);
    if (query?.materialId) params.append('materialId', query.materialId);
    if (query?.isActive !== undefined) params.append('isActive', String(query.isActive));
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    const queryStr = params.toString();
    return apiFetch<PaginatedProductBases>(`/api/admin/furniture/product-bases${queryStr ? `?${queryStr}` : ''}`);
  },

  /**
   * Get a single product base by ID
   * _Requirements: 9.2_
   */
  get: (id: string) =>
    apiFetch<ProductBaseWithDetails>(`/api/admin/furniture/product-bases/${id}`),

  /**
   * Create a new product base with variants
   * _Requirements: 3.2, 9.3_
   */
  create: (data: CreateProductBaseInput) =>
    apiFetch<ProductBaseWithDetails>('/api/admin/furniture/product-bases', { method: 'POST', body: data }),

  /**
   * Update a product base
   * _Requirements: 3.3, 9.4_
   */
  update: (id: string, data: UpdateProductBaseInput) =>
    apiFetch<ProductBaseWithDetails>(`/api/admin/furniture/product-bases/${id}`, { method: 'PUT', body: data }),

  /**
   * Delete a product base
   * _Requirements: 3.4, 9.6_
   */
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/product-bases/${id}`, { method: 'DELETE' }),

  // ========== VARIANTS ==========
  // _Requirements: 4.2, 4.4, 4.5, 9.5_

  /**
   * Create a new variant for a product base
   * _Requirements: 4.2, 9.5_
   */
  createVariant: (productBaseId: string, data: CreateVariantInput) =>
    apiFetch<ProductVariantWithMaterial>(`/api/admin/furniture/product-bases/${productBaseId}/variants`, { method: 'POST', body: data }),

  /**
   * Update a variant
   * _Requirements: 4.4, 9.5_
   */
  updateVariant: (productBaseId: string, variantId: string, data: UpdateVariantInput) =>
    apiFetch<ProductVariantWithMaterial>(`/api/admin/furniture/product-bases/${productBaseId}/variants/${variantId}`, { method: 'PUT', body: data }),

  /**
   * Delete a variant
   * _Requirements: 4.5, 9.5_
   */
  deleteVariant: (productBaseId: string, variantId: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/product-bases/${productBaseId}/variants/${variantId}`, { method: 'DELETE' }),

  // ========== MAPPINGS ==========
  // _Requirements: 5.1, 5.2, 5.4, 5.5_

  /**
   * Get all mappings for a product base
   * _Requirements: 5.1_
   */
  getMappings: (productBaseId: string) =>
    apiFetch<{ mappings: ProductBaseMapping[] }>(`/api/admin/furniture/product-bases/${productBaseId}/mappings`),

  /**
   * Add a mapping to a product base
   * _Requirements: 5.2_
   */
  addMapping: (productBaseId: string, data: ProductMappingInput) =>
    apiFetch<ProductBaseMapping>(`/api/admin/furniture/product-bases/${productBaseId}/mappings`, { method: 'POST', body: data }),

  /**
   * Remove a mapping from a product base
   * _Requirements: 5.4_
   */
  removeMapping: (productBaseId: string, mappingId: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/product-bases/${productBaseId}/mappings/${mappingId}`, { method: 'DELETE' }),

  /**
   * Bulk create mappings for multiple product bases
   * _Requirements: 5.5_
   */
  bulkMapping: (productBaseIds: string[], mapping: ProductMappingInput) =>
    apiFetch<{ success: boolean; created: number; skipped: number; errors: Array<{ productBaseId: string; error: string }> }>(
      '/api/admin/furniture/product-bases/bulk-mapping',
      { method: 'POST', body: { productBaseIds, mapping } }
    ),
};

// ========== FEES API ==========
/**
 * Furniture Fees API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 4.1, 4.2, 4.3, 4.4**
 */
export const furnitureFeesApi = {
  list: () =>
    apiFetch<FurnitureFee[]>('/api/admin/furniture/fees'),

  create: (data: CreateFeeInput) =>
    apiFetch<FurnitureFee>('/api/admin/furniture/fees', { method: 'POST', body: data }),

  update: (id: string, data: UpdateFeeInput) =>
    apiFetch<FurnitureFee>(`/api/admin/furniture/fees/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/fees/${id}`, { method: 'DELETE' }),
};

// ========== DATA IMPORT/EXPORT API ==========
/**
 * Furniture Data Import/Export API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 1.6, 1.8, 9.3, 9.4**
 */
export const furnitureDataApi = {
  /**
   * Import data from CSV files
   * Accepts 3 files: duAn, layouts, apartmentTypes
   */
  import: async (files: { duAn: File; layouts: File; apartmentTypes: File }): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('duAn', files.duAn);
    formData.append('layouts', files.layouts);
    formData.append('apartmentTypes', files.apartmentTypes);

    const headers: HeadersInit = {};
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const sessionId = tokenStorage.getSessionId();
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_BASE}/api/admin/furniture/import`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Import failed' }));
      throw new Error(errorData.error?.message || errorData.error || 'Import failed');
    }

    const json = await response.json();
    return (json.data || json) as ImportResult;
  },

  /**
   * Export data to CSV strings
   * Returns 3 CSV strings: duAn, layouts, apartmentTypes
   */
  export: () =>
    apiFetch<ExportResult>('/api/admin/furniture/export'),

  /**
   * Sync Pull: Read data from Google Sheets and import to database
   */
  syncPull: (spreadsheetId: string) =>
    apiFetch<SyncResult>('/api/admin/furniture/sync/pull', { method: 'POST', body: { spreadsheetId } }),

  /**
   * Sync Push: Export database data to Google Sheets
   */
  syncPush: (spreadsheetId: string) =>
    apiFetch<SyncResult>('/api/admin/furniture/sync/push', { method: 'POST', body: { spreadsheetId } }),
};

// ========== QUOTATIONS API ==========
/**
 * Furniture Quotations API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 8.1, 8.2, 8.3, 11.3**
 */
export const furnitureQuotationsApi = {
  /**
   * List quotations by lead ID
   */
  list: (leadId: string) =>
    apiFetch<FurnitureQuotation[]>(`/api/admin/furniture/quotations?leadId=${leadId}`),
  
  /**
   * Export quotation as PDF
   * Returns a blob URL for download
   * _Requirements: 8.2_
   */
  exportPdf: async (quotationId: string): Promise<string> => {
    const headers: HeadersInit = {};
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const sessionId = tokenStorage.getSessionId();
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }
    
    const response = await fetch(`${API_BASE}/api/admin/furniture/quotations/${quotationId}/pdf`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};

// ========== PDF SETTINGS API ==========

/**
 * PDF Settings type
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
 * Furniture PDF Settings API
 * 
 * **Feature: furniture-quotation**
 */
export const furniturePdfSettingsApi = {
  /**
   * Get PDF settings
   */
  get: () => apiFetch<FurniturePdfSettings>('/api/admin/furniture/pdf-settings'),

  /**
   * Update PDF settings
   */
  update: (data: UpdatePdfSettingsInput) =>
    apiFetch<FurniturePdfSettings>('/api/admin/furniture/pdf-settings', {
      method: 'PUT',
      body: data,
    }),

  /**
   * Reset PDF settings to defaults
   */
  reset: () =>
    apiFetch<FurniturePdfSettings>('/api/admin/furniture/pdf-settings/reset', {
      method: 'POST',
    }),
};
