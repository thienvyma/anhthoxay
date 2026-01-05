// Settings APIs - ANH THỢ XÂY Admin Dashboard
// Settings, Bidding Settings, Service Fees, Pricing, Google Sheets Integration
import { apiFetch } from './client';
import type {
  ServiceCategory,
  UnitPrice,
  Material,
  MaterialCategory,
  Formula,
} from '../types';

// ========== SETTINGS ==========
export const settingsApi = {
  /** 
   * Get setting by key. 
   * Returns { key, value } where value is null if setting doesn't exist.
   */
  get: (key: string) =>
    apiFetch<{ key: string; value: unknown }>(`/settings/${key}`),

  update: (key: string, data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/settings/${key}`, { method: 'PUT', body: data }),
};

// ========== BIDDING SETTINGS (ADMIN) ==========
interface BiddingSettings {
  id: string;
  maxBidsPerProject: number;
  defaultBidDuration: number;
  minBidDuration: number;
  maxBidDuration: number;
  escrowPercentage: number;
  escrowMinAmount: number;
  escrowMaxAmount: number | null;
  verificationFee: number;
  winFeePercentage: number;
  autoApproveHomeowner: boolean;
  autoApproveProject: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdateBiddingSettingsInput {
  maxBidsPerProject?: number;
  defaultBidDuration?: number;
  minBidDuration?: number;
  maxBidDuration?: number;
  escrowPercentage?: number;
  escrowMinAmount?: number;
  escrowMaxAmount?: number | null;
  verificationFee?: number;
  winFeePercentage?: number;
  autoApproveHomeowner?: boolean;
  autoApproveProject?: boolean;
}

export const biddingSettingsApi = {
  // Get full bidding settings (Admin only)
  get: () =>
    apiFetch<BiddingSettings>('/api/admin/settings/bidding'),

  // Get public bidding settings
  getPublic: () =>
    apiFetch<{
      maxBidsPerProject: number;
      defaultBidDuration: number;
      minBidDuration: number;
      maxBidDuration: number;
      escrowPercentage: number;
      escrowMinAmount: number;
    }>('/api/settings/bidding'),

  // Update bidding settings (Admin only)
  update: (data: UpdateBiddingSettingsInput) =>
    apiFetch<BiddingSettings>('/api/admin/settings/bidding', { method: 'PUT', body: data }),
};

// ========== SERVICE FEES (ADMIN) ==========
/**
 * Service Fee API
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-5.2**
 */
export interface ServiceFee {
  id: string;
  name: string;
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateServiceFeeInput {
  name: string;
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description?: string;
  isActive?: boolean;
}

interface UpdateServiceFeeInput {
  name?: string;
  code?: string;
  type?: 'FIXED' | 'PERCENTAGE';
  value?: number;
  description?: string | null;
  isActive?: boolean;
}

export const serviceFeesApi = {
  // List all service fees (Admin - includes inactive)
  list: () =>
    apiFetch<ServiceFee[]>('/api/admin/service-fees'),

  // List active service fees (Public)
  listPublic: () =>
    apiFetch<ServiceFee[]>('/api/service-fees'),

  // Get service fee by ID (Admin only)
  get: (id: string) =>
    apiFetch<ServiceFee>(`/api/admin/service-fees/${id}`),

  // Create new service fee (Admin only)
  create: (data: CreateServiceFeeInput) =>
    apiFetch<ServiceFee>('/api/admin/service-fees', { method: 'POST', body: data }),

  // Update service fee (Admin only)
  update: (id: string, data: UpdateServiceFeeInput) =>
    apiFetch<ServiceFee>(`/api/admin/service-fees/${id}`, { method: 'PUT', body: data }),

  // Delete service fee (Admin only)
  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/admin/service-fees/${id}`, { method: 'DELETE' }),
};

// ========== SERVICE CATEGORIES ==========
interface ServiceCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  coefficient?: number;
  allowMaterials?: boolean;
  formulaId?: string | null;
  order?: number;
  isActive?: boolean;
}

export const serviceCategoriesApi = {
  list: () =>
    apiFetch<ServiceCategory[]>('/service-categories'),

  get: (id: string) =>
    apiFetch<ServiceCategory>(`/service-categories/${id}`),

  create: (data: ServiceCategoryInput) =>
    apiFetch<ServiceCategory>('/service-categories', { method: 'POST', body: data }),

  update: (id: string, data: Partial<ServiceCategoryInput>) =>
    apiFetch<ServiceCategory>(`/service-categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/service-categories/${id}`, { method: 'DELETE' }),
};

// ========== UNIT PRICES ==========
interface UnitPriceInput {
  category: string;
  name: string;
  price: number;
  tag: string;
  unit: string;
  description?: string;
  isActive?: boolean;
}

export const unitPricesApi = {
  list: () =>
    apiFetch<UnitPrice[]>('/unit-prices'),

  create: (data: UnitPriceInput) =>
    apiFetch<UnitPrice>('/unit-prices', { method: 'POST', body: data }),

  update: (id: string, data: Partial<UnitPriceInput>) =>
    apiFetch<UnitPrice>(`/unit-prices/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/unit-prices/${id}`, { method: 'DELETE' }),
};

// ========== MATERIALS ==========
interface MaterialInput {
  name: string;
  categoryId: string;
  price: number;
  imageUrl?: string | null;
  unit?: string | null;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export const materialsApi = {
  list: () =>
    apiFetch<Material[]>('/materials'),

  create: (data: MaterialInput) =>
    apiFetch<Material>('/materials', { method: 'POST', body: data }),

  update: (id: string, data: Partial<MaterialInput>) =>
    apiFetch<Material>(`/materials/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/materials/${id}`, { method: 'DELETE' }),
};

// ========== MATERIAL CATEGORIES ==========
interface MaterialCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export const materialCategoriesApi = {
  list: () =>
    apiFetch<MaterialCategory[]>('/material-categories'),

  get: (id: string) =>
    apiFetch<MaterialCategory>(`/material-categories/${id}`),

  create: (data: MaterialCategoryInput) =>
    apiFetch<MaterialCategory>('/material-categories', { method: 'POST', body: data }),

  update: (id: string, data: Partial<MaterialCategoryInput>) =>
    apiFetch<MaterialCategory>(`/material-categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/material-categories/${id}`, { method: 'DELETE' }),
};

// ========== FORMULAS ==========
interface FormulaInput {
  name: string;
  expression: string;
  description?: string;
  isActive?: boolean;
}

export const formulasApi = {
  list: () =>
    apiFetch<Formula[]>('/formulas'),

  create: (data: FormulaInput) =>
    apiFetch<Formula>('/formulas', { method: 'POST', body: data }),

  update: (id: string, data: Partial<FormulaInput>) =>
    apiFetch<Formula>(`/formulas/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/formulas/${id}`, { method: 'DELETE' }),
};

// ========== GOOGLE SHEETS INTEGRATION ==========
export interface GoogleSheetsStatus {
  connected: boolean;
  spreadsheetId: string | null;
  sheetName: string;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  errorCount: number;
  lastError: string | null;
}

export const googleSheetsApi = {
  // Get OAuth URL for connecting
  getAuthUrl: () =>
    apiFetch<{ authUrl: string }>('/integrations/google/auth-url'),

  // Disconnect Google Sheets
  disconnect: () =>
    apiFetch<{ success: boolean; message: string }>('/integrations/google/disconnect', { method: 'POST' }),

  // Get connection status
  getStatus: () =>
    apiFetch<GoogleSheetsStatus>('/integrations/google/status'),

  // Test spreadsheet connection
  testConnection: () =>
    apiFetch<{ success: boolean; message: string }>('/integrations/google/test', { method: 'POST' }),

  // Update settings
  updateSettings: (data: { spreadsheetId?: string; sheetName?: string; syncEnabled?: boolean }) =>
    apiFetch<{ success: boolean; message: string }>('/integrations/google/settings', { method: 'PUT', body: data }),
};
