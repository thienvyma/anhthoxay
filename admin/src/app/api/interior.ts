// Interior APIs - ANH THỢ XÂY Admin Dashboard
// Developers, Developments, Buildings, Units, Layouts, Packages, Surcharges, Settings, RoomTypes, Quotes
import { apiFetch } from './client';
import type {
  InteriorDeveloper,
  CreateDeveloperInput,
  UpdateDeveloperInput,
  InteriorDevelopment,
  CreateDevelopmentInput,
  UpdateDevelopmentInput,
  InteriorBuilding,
  CreateBuildingInput,
  UpdateBuildingInput,
  InteriorBuildingUnit,
  CreateBuildingUnitInput,
  UpdateBuildingUnitInput,
  InteriorUnitLayout,
  CreateLayoutInput,
  UpdateLayoutInput,
  InteriorPackage,
  CreatePackageInput,
  UpdatePackageInput,
  InteriorSurcharge,
  CreateSurchargeInput,
  UpdateSurchargeInput,
  InteriorQuoteSettings,
  UpdateQuoteSettingsInput,
  InteriorRoomType,
  CreateRoomTypeInput,
  UpdateRoomTypeInput,
  InteriorFurnitureCategory,
  CreateFurnitureCategoryInput,
  UpdateFurnitureCategoryInput,
  InteriorFurnitureItem,
  CreateFurnitureItemInput,
  UpdateFurnitureItemInput,
  InteriorQuote,
  QuoteListItem,
  QuoteStatus,
  PaginatedResponse,
} from '../types';

// ========== DEVELOPERS ==========

interface DevelopersListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const interiorDevelopersApi = {
  list: (params?: DevelopersListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<InteriorDeveloper>>(
      `/api/admin/interior/developers${query ? '?' + query : ''}`
    );
  },

  get: (id: string) => apiFetch<InteriorDeveloper>(`/api/admin/interior/developers/${id}`),

  create: (data: CreateDeveloperInput) =>
    apiFetch<InteriorDeveloper>('/api/admin/interior/developers', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateDeveloperInput) =>
    apiFetch<InteriorDeveloper>(`/api/admin/interior/developers/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/developers/${id}`, {
      method: 'DELETE',
    }),

  reorder: (ids: string[]) =>
    apiFetch<{ success: boolean }>('/api/admin/interior/developers/reorder', {
      method: 'PUT',
      body: { ids },
    }),
};


// ========== DEVELOPMENTS ==========

interface DevelopmentsListParams {
  developerId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const interiorDevelopmentsApi = {
  list: (params?: DevelopmentsListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<InteriorDevelopment>>(
      `/api/admin/interior/developments${query ? '?' + query : ''}`
    );
  },

  get: (id: string) => apiFetch<InteriorDevelopment>(`/api/admin/interior/developments/${id}`),

  create: (data: CreateDevelopmentInput) =>
    apiFetch<InteriorDevelopment>('/api/admin/interior/developments', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateDevelopmentInput) =>
    apiFetch<InteriorDevelopment>(`/api/admin/interior/developments/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/developments/${id}`, {
      method: 'DELETE',
    }),
};

// ========== BUILDINGS ==========

interface BuildingsListParams {
  developmentId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const interiorBuildingsApi = {
  list: (params?: BuildingsListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<InteriorBuilding>>(
      `/api/admin/interior/buildings${query ? '?' + query : ''}`
    );
  },

  get: (id: string) => apiFetch<InteriorBuilding>(`/api/admin/interior/buildings/${id}`),

  create: (data: CreateBuildingInput) =>
    apiFetch<InteriorBuilding>('/api/admin/interior/buildings', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateBuildingInput) =>
    apiFetch<InteriorBuilding>(`/api/admin/interior/buildings/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/buildings/${id}`, {
      method: 'DELETE',
    }),
};

// ========== BUILDING UNITS ==========

interface BuildingUnitsListParams {
  buildingId?: string;
  layoutId?: string;
  unitType?: string;
  page?: number;
  limit?: number;
}

export const interiorBuildingUnitsApi = {
  list: (params?: BuildingUnitsListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<InteriorBuildingUnit>>(
      `/api/admin/interior/units${query ? '?' + query : ''}`
    );
  },

  getByBuilding: async (buildingId: string): Promise<InteriorBuildingUnit[]> => {
    const response = await apiFetch<PaginatedResponse<InteriorBuildingUnit>>(
      `/api/admin/interior/buildings/${buildingId}/units`
    );
    return response.data || [];
  },

  get: (id: string) => apiFetch<InteriorBuildingUnit>(`/api/admin/interior/units/${id}`),

  create: (data: CreateBuildingUnitInput) =>
    apiFetch<InteriorBuildingUnit>(`/api/admin/interior/buildings/${data.buildingId}/units`, {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateBuildingUnitInput) =>
    apiFetch<InteriorBuildingUnit>(`/api/admin/interior/units/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/units/${id}`, {
      method: 'DELETE',
    }),

  bulkImport: (buildingId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ imported: number; errors: string[] }>(
      `/api/admin/interior/buildings/${buildingId}/units/import`,
      {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set content-type for FormData
      }
    );
  },
};

// ========== LAYOUTS ==========

interface LayoutsListParams {
  unitType?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const interiorLayoutsApi = {
  list: (params?: LayoutsListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<InteriorUnitLayout>>(
      `/api/admin/interior/layouts${query ? '?' + query : ''}`
    );
  },

  get: (id: string) => apiFetch<InteriorUnitLayout>(`/api/admin/interior/layouts/${id}`),

  create: (data: CreateLayoutInput) =>
    apiFetch<InteriorUnitLayout>('/api/admin/interior/layouts', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateLayoutInput) =>
    apiFetch<InteriorUnitLayout>(`/api/admin/interior/layouts/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/layouts/${id}`, {
      method: 'DELETE',
    }),

  clone: (id: string, newCode: string) =>
    apiFetch<InteriorUnitLayout>(`/api/admin/interior/layouts/${id}/clone`, {
      method: 'POST',
      body: { code: newCode },
    }),
};

// ========== PACKAGES ==========

interface PackagesListParams {
  layoutId?: string;
  tier?: number;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

export const interiorPackagesApi = {
  list: (params?: PackagesListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<InteriorPackage>>(
      `/api/admin/interior/packages${query ? '?' + query : ''}`
    );
  },

  get: (id: string) => apiFetch<InteriorPackage>(`/api/admin/interior/packages/${id}`),

  create: (data: CreatePackageInput) =>
    apiFetch<InteriorPackage>('/api/admin/interior/packages', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdatePackageInput) =>
    apiFetch<InteriorPackage>(`/api/admin/interior/packages/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/packages/${id}`, {
      method: 'DELETE',
    }),

  clone: (id: string, targetLayoutId: string, newCode: string) =>
    apiFetch<InteriorPackage>(`/api/admin/interior/packages/${id}/clone`, {
      method: 'POST',
      body: { layoutId: targetLayoutId, code: newCode },
    }),
};


// ========== SURCHARGES ==========

interface SurchargesListParams {
  type?: string;
  isAutoApply?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const interiorSurchargesApi = {
  list: (params?: SurchargesListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<InteriorSurcharge>>(
      `/api/admin/interior/surcharges${query ? '?' + query : ''}`
    );
  },

  get: (id: string) => apiFetch<InteriorSurcharge>(`/api/admin/interior/surcharges/${id}`),

  create: (data: CreateSurchargeInput) =>
    apiFetch<InteriorSurcharge>('/api/admin/interior/surcharges', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateSurchargeInput) =>
    apiFetch<InteriorSurcharge>(`/api/admin/interior/surcharges/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/surcharges/${id}`, {
      method: 'DELETE',
    }),

  test: (conditions: Record<string, unknown>) =>
    apiFetch<{ matchingUnits: string[] }>('/api/admin/interior/surcharges/test', {
      method: 'POST',
      body: conditions,
    }),
};

// ========== QUOTE SETTINGS ==========

export const interiorSettingsApi = {
  get: () => apiFetch<InteriorQuoteSettings>('/api/admin/interior/settings'),

  update: (data: UpdateQuoteSettingsInput) =>
    apiFetch<InteriorQuoteSettings>('/api/admin/interior/settings', {
      method: 'PUT',
      body: data,
    }),
};

// ========== ROOM TYPES ==========

interface RoomTypesListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const interiorRoomTypesApi = {
  list: (params?: RoomTypesListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<InteriorRoomType>>(
      `/api/admin/interior/room-types${query ? '?' + query : ''}`
    );
  },

  get: (id: string) => apiFetch<InteriorRoomType>(`/api/admin/interior/room-types/${id}`),

  create: (data: CreateRoomTypeInput) =>
    apiFetch<InteriorRoomType>('/api/admin/interior/room-types', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateRoomTypeInput) =>
    apiFetch<InteriorRoomType>(`/api/admin/interior/room-types/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/room-types/${id}`, {
      method: 'DELETE',
    }),

  reorder: (ids: string[]) =>
    apiFetch<{ success: boolean }>('/api/admin/interior/room-types/reorder', {
      method: 'PUT',
      body: { ids },
    }),
};

// ========== FURNITURE CATEGORIES ==========

export const interiorFurnitureCategoriesApi = {
  list: () =>
    apiFetch<PaginatedResponse<InteriorFurnitureCategory>>('/api/admin/interior/furniture/categories'),

  get: (id: string) =>
    apiFetch<InteriorFurnitureCategory>(`/api/admin/interior/furniture/categories/${id}`),

  create: (data: CreateFurnitureCategoryInput) =>
    apiFetch<InteriorFurnitureCategory>('/api/admin/interior/furniture/categories', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateFurnitureCategoryInput) =>
    apiFetch<InteriorFurnitureCategory>(`/api/admin/interior/furniture/categories/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/furniture/categories/${id}`, {
      method: 'DELETE',
    }),
};

// ========== FURNITURE ITEMS ==========

interface FurnitureItemsListParams {
  categoryId?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const interiorFurnitureItemsApi = {
  list: (params?: FurnitureItemsListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<InteriorFurnitureItem>>(
      `/api/admin/interior/furniture/items${query ? '?' + query : ''}`
    );
  },

  get: (id: string) =>
    apiFetch<InteriorFurnitureItem>(`/api/admin/interior/furniture/items/${id}`),

  create: (data: CreateFurnitureItemInput) =>
    apiFetch<InteriorFurnitureItem>('/api/admin/interior/furniture/items', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateFurnitureItemInput) =>
    apiFetch<InteriorFurnitureItem>(`/api/admin/interior/furniture/items/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/interior/furniture/items/${id}`, {
      method: 'DELETE',
    }),

  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ imported: number; errors: string[] }>(
      '/api/admin/interior/furniture/items/import',
      {
        method: 'POST',
        body: formData,
        headers: {},
      }
    );
  },
};

// ========== QUOTES ==========

interface QuotesListParams {
  status?: QuoteStatus;
  developmentName?: string;
  minPrice?: number;
  maxPrice?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const interiorQuotesApi = {
  list: (params?: QuotesListParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<PaginatedResponse<QuoteListItem>>(
      `/api/admin/interior/quotes${query ? '?' + query : ''}`
    );
  },

  get: (id: string) => apiFetch<InteriorQuote>(`/api/admin/interior/quotes/${id}`),

  updateStatus: (id: string, status: QuoteStatus, note?: string) =>
    apiFetch<InteriorQuote>(`/api/admin/interior/quotes/${id}/status`, {
      method: 'PUT',
      body: { status, note },
    }),

  export: (params?: Omit<QuotesListParams, 'page' | 'limit'>) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    // Return URL for download
    return `/api/admin/interior/quotes/export${query ? '?' + query : ''}`;
  },
};
