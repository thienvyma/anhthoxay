/**
 * Furniture Products API
 *
 * **Feature: furniture-quotation, furniture-product-restructure**
 * **Requirements: 2.2-2.5, 3.1-3.5, 4.2-4.5, 5.1-5.5, 9.2-9.6**
 */

import { apiFetch } from '../client';
import type {
  FurnitureProduct,
  FurnitureProductMapping,
  ProductBaseWithDetails,
  ProductVariantWithMaterial,
  ProductBaseMapping,
  PaginatedProductBases,
  CreateProductInput,
  UpdateProductInput,
  CreateProductBaseInput,
  UpdateProductBaseInput,
  CreateVariantInput,
  UpdateVariantInput,
  ProductMappingInput,
  GetProductBasesAdminQuery,
} from './types';

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
    apiFetch<FurnitureProduct>('/api/admin/furniture/products', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateProductInput) =>
    apiFetch<FurnitureProduct>(`/api/admin/furniture/products/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/products/${id}`, {
      method: 'DELETE',
    }),

  getMappings: (productId: string) =>
    apiFetch<{ mappings: FurnitureProductMapping[] }>(
      `/api/admin/furniture/products/${productId}/mappings`
    ),

  addMapping: (productId: string, data: ProductMappingInput) =>
    apiFetch<FurnitureProductMapping>(`/api/admin/furniture/products/${productId}/mappings`, {
      method: 'POST',
      body: data,
    }),

  removeMapping: (productId: string, mappingId: string) =>
    apiFetch<{ ok: boolean }>(
      `/api/admin/furniture/products/${productId}/mappings/${mappingId}`,
      { method: 'DELETE' }
    ),
};

/**
 * Furniture Product Bases API (NEW)
 *
 * **Feature: furniture-product-restructure**
 * **Requirements: 3.1-3.5, 4.2-4.5, 5.1-5.5, 9.2-9.6**
 */
export const furnitureProductBasesApi = {
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
    return apiFetch<PaginatedProductBases>(
      `/api/admin/furniture/product-bases${queryStr ? `?${queryStr}` : ''}`
    );
  },

  get: (id: string) => apiFetch<ProductBaseWithDetails>(`/api/admin/furniture/product-bases/${id}`),

  create: (data: CreateProductBaseInput) =>
    apiFetch<ProductBaseWithDetails>('/api/admin/furniture/product-bases', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateProductBaseInput) =>
    apiFetch<ProductBaseWithDetails>(`/api/admin/furniture/product-bases/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/product-bases/${id}`, {
      method: 'DELETE',
    }),

  // Variants
  createVariant: (productBaseId: string, data: CreateVariantInput) =>
    apiFetch<ProductVariantWithMaterial>(
      `/api/admin/furniture/product-bases/${productBaseId}/variants`,
      { method: 'POST', body: data }
    ),

  updateVariant: (productBaseId: string, variantId: string, data: UpdateVariantInput) =>
    apiFetch<ProductVariantWithMaterial>(
      `/api/admin/furniture/product-bases/${productBaseId}/variants/${variantId}`,
      { method: 'PUT', body: data }
    ),

  deleteVariant: (productBaseId: string, variantId: string) =>
    apiFetch<{ ok: boolean }>(
      `/api/admin/furniture/product-bases/${productBaseId}/variants/${variantId}`,
      { method: 'DELETE' }
    ),

  // Mappings
  getMappings: (productBaseId: string) =>
    apiFetch<{ mappings: ProductBaseMapping[] }>(
      `/api/admin/furniture/product-bases/${productBaseId}/mappings`
    ),

  addMapping: (productBaseId: string, data: ProductMappingInput) =>
    apiFetch<ProductBaseMapping>(
      `/api/admin/furniture/product-bases/${productBaseId}/mappings`,
      { method: 'POST', body: data }
    ),

  removeMapping: (productBaseId: string, mappingId: string) =>
    apiFetch<{ ok: boolean }>(
      `/api/admin/furniture/product-bases/${productBaseId}/mappings/${mappingId}`,
      { method: 'DELETE' }
    ),

  bulkMapping: (productBaseIds: string[], mapping: ProductMappingInput) =>
    apiFetch<{
      success: boolean;
      created: number;
      skipped: number;
      errors: Array<{ productBaseId: string; error: string }>;
    }>('/api/admin/furniture/product-bases/bulk-mapping', {
      method: 'POST',
      body: { productBaseIds, mapping },
    }),
};
