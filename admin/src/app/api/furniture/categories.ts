/**
 * Furniture Categories & Materials API
 *
 * **Feature: furniture-quotation**
 * **Requirements: 2.1, 2.6, 2.7**
 */

import { apiFetch } from '../client';
import type {
  FurnitureCategory,
  FurnitureMaterial,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMaterialInput,
  UpdateMaterialInput,
} from './types';

/**
 * Furniture Categories API
 *
 * **Feature: furniture-quotation**
 * **Requirements: 2.1, 2.6, 2.7**
 */
export const furnitureCategoriesApi = {
  list: () => apiFetch<FurnitureCategory[]>('/api/admin/furniture/categories'),

  create: (data: CreateCategoryInput) =>
    apiFetch<FurnitureCategory>('/api/admin/furniture/categories', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateCategoryInput) =>
    apiFetch<FurnitureCategory>(`/api/admin/furniture/categories/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/categories/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Furniture Materials API (Chất liệu)
 */
export const furnitureMaterialsApi = {
  list: () => apiFetch<FurnitureMaterial[]>('/api/admin/furniture/materials'),

  create: (data: CreateMaterialInput) =>
    apiFetch<FurnitureMaterial>('/api/admin/furniture/materials', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateMaterialInput) =>
    apiFetch<FurnitureMaterial>(`/api/admin/furniture/materials/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/materials/${id}`, {
      method: 'DELETE',
    }),
};
