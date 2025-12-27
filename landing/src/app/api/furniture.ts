/**
 * Furniture Quotation API Client for Landing Page
 * Feature: furniture-quotation
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 7.2, 7.3
 */

import { API_URL } from '@app/shared';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FurnitureDeveloper {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureProject {
  id: string;
  name: string;
  code: string;
  developerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FurnitureBuilding {
  id: string;
  name: string;
  code: string;
  projectId: string;
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
  price: number;
  imageUrl: string | null;
  description: string | null;
  dimensions: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: FurnitureCategory;
}

export interface FurnitureComboItem {
  id: string;
  comboId: string;
  productId: string;
  quantity: number;
  product?: FurnitureProduct;
}

export interface FurnitureCombo {
  id: string;
  name: string;
  apartmentTypes: string; // JSON array
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

export interface QuotationItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface FeeBreakdown {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  amount: number;
}

export interface CreateQuotationInput {
  leadId?: string;
  leadData?: {
    name: string;
    phone: string;
    email?: string;
    content?: string;
  };
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  apartmentType: string;
  layoutImageUrl?: string;
  selectionType: 'COMBO' | 'CUSTOM';
  comboId?: string;
  comboName?: string;
  items: QuotationItem[];
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
  items: string; // JSON
  basePrice: number;
  fees: string; // JSON
  totalPrice: number;
  createdAt: string;
}

// ============================================
// API HELPER
// ============================================

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    const errorMessage =
      error.error?.message || error.error || `API Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  const json = await response.json();

  // Unwrap standardized response format: { success: true, data: T }
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}

// ============================================
// FURNITURE API
// ============================================

export const furnitureAPI = {
  // Hierarchy data
  getDevelopers: () => apiFetch<FurnitureDeveloper[]>('/api/furniture/developers'),

  getProjects: (developerId?: string) => {
    const query = developerId ? `?developerId=${developerId}` : '';
    return apiFetch<FurnitureProject[]>(`/api/furniture/projects${query}`);
  },

  getBuildings: (projectId?: string) => {
    const query = projectId ? `?projectId=${projectId}` : '';
    return apiFetch<FurnitureBuilding[]>(`/api/furniture/buildings${query}`);
  },

  getLayouts: (buildingCode: string) => {
    return apiFetch<FurnitureLayout[]>(`/api/furniture/layouts?buildingCode=${encodeURIComponent(buildingCode)}`);
  },

  getLayoutByAxis: (buildingCode: string, axis: number) => {
    return apiFetch<FurnitureLayout | null>(
      `/api/furniture/layouts/by-axis?buildingCode=${encodeURIComponent(buildingCode)}&axis=${axis}`
    );
  },

  getApartmentTypes: (buildingCode: string, type?: string) => {
    let query = `?buildingCode=${encodeURIComponent(buildingCode)}`;
    if (type) query += `&type=${encodeURIComponent(type)}`;
    return apiFetch<FurnitureApartmentType[]>(`/api/furniture/apartment-types${query}`);
  },

  // Furniture catalog
  getCategories: () => apiFetch<FurnitureCategory[]>('/api/furniture/categories'),

  getProducts: (categoryId?: string) => {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return apiFetch<FurnitureProduct[]>(`/api/furniture/products${query}`);
  },

  getCombos: (apartmentType?: string) => {
    const query = apartmentType ? `?apartmentType=${encodeURIComponent(apartmentType)}` : '';
    return apiFetch<FurnitureCombo[]>(`/api/furniture/combos${query}`);
  },

  getFees: (applicability?: 'COMBO' | 'CUSTOM' | 'BOTH') => {
    const query = applicability ? `?applicability=${applicability}` : '';
    return apiFetch<FurnitureFee[]>(`/api/furniture/fees${query}`);
  },

  // Quotation
  createQuotation: (data: CreateQuotationInput) => {
    return apiFetch<FurnitureQuotation>('/api/furniture/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

