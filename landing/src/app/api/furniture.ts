/**
 * Furniture Quotation API Client for Landing Page
 * Feature: furniture-quotation, furniture-product-restructure
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

// ============================================
// NEW PRODUCT BASE TYPES (furniture-product-restructure)
// ============================================

/**
 * Variant info for landing page (minimal)
 * Uses new FurnitureProductVariant schema
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
 * Product base group for landing page (NEW schema)
 * Uses new FurnitureProductBase schema
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

// ============================================
// LEGACY PRODUCT TYPES (for backward compatibility)
// ============================================

/**
 * Product variant for grouped display (LEGACY)
 * @deprecated Use ProductVariantForLanding instead
 * _Requirements: 2.3, 3.5_
 */
export interface ProductVariant {
  id: string;
  material: string;
  calculatedPrice: number;
  allowFitIn: boolean;
  imageUrl: string | null;
  description: string | null;
  categoryId: string;
  categoryName: string;
  order: number;
}

/**
 * Products grouped by name with material variants (LEGACY)
 * @deprecated Use ProductBaseGroup instead
 * _Requirements: 2.3_
 */
export interface ProductGroup {
  name: string;
  variants: ProductVariant[];
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

/**
 * Legacy FurnitureProduct interface (for backward compatibility)
 * @deprecated Use ProductGroup and ProductVariant instead
 */
export interface FurnitureProduct {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  material?: string;              // NEW: Material variant
  calculatedPrice?: number;       // NEW: Pre-calculated price
  allowFitIn?: boolean;           // NEW: Allow Fit-in option
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
  code?: string;                  // NEW: Unique code (e.g., "FIT_IN")
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Quotation item for calculation
 * 
 * **Feature: furniture-product-mapping**
 * **Validates: Requirements 4.4, 4.5, 8.3**
 */
export interface QuotationItem {
  productId: string;
  name: string;
  material?: string;              // NEW: Material variant
  price: number;                  // Base price (calculatedPrice)
  quantity: number;
  fitInSelected?: boolean;        // NEW: Whether Fit-in is selected
  fitInFee?: number;              // NEW: Fit-in fee amount (if selected)
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

/**
 * Response from send quotation email API
 * 
 * **Feature: furniture-quotation-email**
 * **Validates: Requirements 8.3, 8.4**
 */
export interface SendEmailResponse {
  success: boolean;
  sentAt?: string;
  recipientEmail?: string;
  messageId?: string;
  error?: {
    code: string;
    message: string;
    retryAfter?: number;
  };
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

  /**
   * Get products grouped by ProductBase with nested variants (NEW schema)
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 6.1, 9.1**
   * 
   * @param query - Optional query parameters for filtering by apartment mapping
   * @returns Products grouped by ProductBase with nested variants
   */
  getProductsGrouped: (query?: GetProductsQuery) => {
    const params = new URLSearchParams();
    if (query?.categoryId) params.append('categoryId', query.categoryId);
    if (query?.projectName) params.append('projectName', query.projectName);
    if (query?.buildingCode) params.append('buildingCode', query.buildingCode);
    if (query?.apartmentType) params.append('apartmentType', query.apartmentType);
    const queryString = params.toString();
    const url = `/api/furniture/products/grouped${queryString ? `?${queryString}` : ''}`;
    return apiFetch<{ products: ProductBaseGroup[] }>(url);
  },

  /**
   * Get products grouped by name with material variants (LEGACY schema)
   * 
   * @deprecated Use getProductsGrouped() instead which uses new ProductBase schema
   * 
   * **Feature: furniture-product-mapping**
   * **Validates: Requirements 7.1, 10.1, 2.3**
   * 
   * @param query - Optional query parameters for filtering by apartment mapping
   * @returns Products grouped by name with material variants (legacy format)
   */
  getProducts: (query?: GetProductsQuery) => {
    const params = new URLSearchParams();
    if (query?.categoryId) params.append('categoryId', query.categoryId);
    if (query?.projectName) params.append('projectName', query.projectName);
    if (query?.buildingCode) params.append('buildingCode', query.buildingCode);
    if (query?.apartmentType) params.append('apartmentType', query.apartmentType);
    const queryString = params.toString();
    const url = `/api/furniture/products${queryString ? `?${queryString}` : ''}`;
    return apiFetch<{ products: ProductGroup[] }>(url);
  },

  /**
   * Get flat list of products (for backward compatibility)
   * @deprecated Use getProducts() instead which returns grouped products
   */
  getProductsFlat: (categoryId?: string) => {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return apiFetch<FurnitureProduct[]>(`/api/furniture/products/flat${query}`);
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

  /**
   * Send quotation PDF via email
   * 
   * **Feature: furniture-quotation-email**
   * **Validates: Requirements 3.1, 8.1**
   * 
   * @param quotationId - The quotation ID to send email for
   * @returns SendEmailResponse with success status and recipient email
   */
  sendQuotationEmail: async (quotationId: string): Promise<SendEmailResponse> => {
    const url = `${API_URL}/api/furniture/quotations/${quotationId}/send-email`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

    // Handle rate limit error
    if (response.status === 429) {
      return {
        success: false,
        error: {
          code: 'EMAIL_RATE_LIMITED',
          message: json.error?.message || 'Bạn đã gửi quá nhiều email. Vui lòng thử lại sau.',
          retryAfter: json.error?.retryAfter,
        },
      };
    }

    // Handle other errors
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: json.error?.code || 'EMAIL_SEND_FAILED',
          message: json.error?.message || 'Không thể gửi email. Vui lòng thử lại.',
        },
      };
    }

    // Unwrap standardized response format
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as SendEmailResponse;
    }

    return json as SendEmailResponse;
  },
};

