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

export interface FurnitureFee {
  id: string;
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
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
    // Handle validation errors with details
    if (error.error === 'Validation failed' && error.details) {
      const fieldErrors = error.details.fieldErrors || {};
      const formErrors = error.details.formErrors || [];
      const errorMessages: string[] = [];
      
      // Collect field errors
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (Array.isArray(messages) && messages.length > 0) {
          errorMessages.push(`${field}: ${messages.join(', ')}`);
        }
      }
      
      // Collect form errors
      if (Array.isArray(formErrors) && formErrors.length > 0) {
        errorMessages.push(...formErrors);
      }
      
      const errorMessage = errorMessages.length > 0 
        ? errorMessages.join('; ') 
        : 'Dữ liệu không hợp lệ';
      throw new Error(errorMessage);
    }
    
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

  getFees: () => {
    return apiFetch<FurnitureFee[]>('/api/furniture/fees');
  },

  // Quotation
  createQuotation: (data: CreateQuotationInput) => {
    return apiFetch<FurnitureQuotation>('/api/furniture/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Download PDF for a quotation
  // Requirements: 8.2 - PDF export for furniture quotations
  downloadQuotationPdf: async (quotationId: string): Promise<void> => {
    const url = `${API_URL}/api/furniture/quotations/${quotationId}/pdf`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Không thể tải PDF');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'bao-gia.pdf';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) {
        filename = match[1];
      }
    }
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },
};

