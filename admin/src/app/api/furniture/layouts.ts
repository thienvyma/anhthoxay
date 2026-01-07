/**
 * Furniture Layouts & Apartment Types API
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.3, 1.4, 1.5, 1.10, 1.11, 1.14**
 */

import { apiFetch } from '../client';
import type {
  FurnitureLayout,
  FurnitureApartmentType,
  CreateLayoutInput,
  UpdateLayoutInput,
  CreateApartmentTypeInput,
  UpdateApartmentTypeInput,
} from './types';

/**
 * Furniture Layouts API
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.3, 1.10, 1.11, 1.14**
 */
export const furnitureLayoutsApi = {
  list: (buildingCode: string) =>
    apiFetch<FurnitureLayout[]>(
      `/api/admin/furniture/layouts?buildingCode=${encodeURIComponent(buildingCode)}`
    ),

  getByAxis: (buildingCode: string, axis: number) =>
    apiFetch<FurnitureLayout | null>(
      `/api/admin/furniture/layouts/by-axis?buildingCode=${encodeURIComponent(buildingCode)}&axis=${axis}`
    ),

  create: (data: CreateLayoutInput) =>
    apiFetch<FurnitureLayout>('/api/admin/furniture/layouts', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateLayoutInput) =>
    apiFetch<FurnitureLayout>(`/api/admin/furniture/layouts/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/layouts/${id}`, {
      method: 'DELETE',
    }),
};

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
    return apiFetch<FurnitureApartmentType[]>(
      `/api/admin/furniture/apartment-types?${params.toString()}`
    );
  },

  create: (data: CreateApartmentTypeInput) =>
    apiFetch<FurnitureApartmentType>('/api/admin/furniture/apartment-types', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateApartmentTypeInput) =>
    apiFetch<FurnitureApartmentType>(`/api/admin/furniture/apartment-types/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/apartment-types/${id}`, {
      method: 'DELETE',
    }),
};
