// Furniture APIs - ANH THỢ XÂY Admin Dashboard
// Furniture Quotation System: Developers, Projects, Buildings, Layouts, ApartmentTypes,
// Categories, Products, Combos, Fees, Data Import/Export, Quotations
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

export interface FurnitureProduct {
  id: string;
  name: string;
  categoryId: string;
  category?: FurnitureCategory;
  price: number;
  imageUrl: string | null;
  description: string | null;
  dimensions: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface FurnitureComboItem {
  id: string;
  comboId: string;
  productId: string;
  product?: FurnitureProduct;
  quantity: number;
}

export interface FurnitureCombo {
  id: string;
  name: string;
  apartmentTypes: string; // JSON array string
  price: number;
  imageUrl: string | null;
  description: string | null;
  isActive: boolean;
  items?: FurnitureComboItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureFee {
  id: string;
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  applicability: 'COMBO' | 'CUSTOM' | 'BOTH';
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureQuotationItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
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
  selectionType: 'COMBO' | 'CUSTOM';
  comboId: string | null;
  comboName: string | null;
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

interface CreateProductInput {
  name: string;
  categoryId: string;
  price: number;
  imageUrl?: string;
  description?: string;
  dimensions?: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  price?: number;
  imageUrl?: string | null;
  description?: string | null;
  dimensions?: string | null;
  order?: number;
  isActive?: boolean;
}

interface ComboItemInput {
  productId: string;
  quantity: number;
}

interface CreateComboInput {
  name: string;
  apartmentTypes: string[];
  price: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  items?: ComboItemInput[];
}

interface UpdateComboInput {
  name?: string;
  apartmentTypes?: string[];
  price?: number;
  imageUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
  items?: ComboItemInput[];
}

interface CreateFeeInput {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  applicability: 'COMBO' | 'CUSTOM' | 'BOTH';
  description?: string;
  order?: number;
  isActive?: boolean;
}

interface UpdateFeeInput {
  name?: string;
  type?: 'FIXED' | 'PERCENTAGE';
  value?: number;
  applicability?: 'COMBO' | 'CUSTOM' | 'BOTH';
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

// ========== PRODUCTS API ==========
/**
 * Furniture Products API
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
};

// ========== COMBOS API ==========
/**
 * Furniture Combos API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 */
export const furnitureCombosApi = {
  list: (apartmentType?: string) => {
    const query = apartmentType ? `?apartmentType=${encodeURIComponent(apartmentType)}` : '';
    return apiFetch<FurnitureCombo[]>(`/api/admin/furniture/combos${query}`);
  },

  create: (data: CreateComboInput) =>
    apiFetch<FurnitureCombo>('/api/admin/furniture/combos', { method: 'POST', body: data }),

  update: (id: string, data: UpdateComboInput) =>
    apiFetch<FurnitureCombo>(`/api/admin/furniture/combos/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/combos/${id}`, { method: 'DELETE' }),

  duplicate: (id: string) =>
    apiFetch<FurnitureCombo>(`/api/admin/furniture/combos/${id}/duplicate`, { method: 'POST' }),
};

// ========== FEES API ==========
/**
 * Furniture Fees API
 * 
 * **Feature: furniture-quotation**
 * **Requirements: 4.1, 4.2, 4.3, 4.4**
 */
export const furnitureFeesApi = {
  list: (applicability?: 'COMBO' | 'CUSTOM' | 'BOTH') => {
    const query = applicability ? `?applicability=${applicability}` : '';
    return apiFetch<FurnitureFee[]>(`/api/admin/furniture/fees${query}`);
  },

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
