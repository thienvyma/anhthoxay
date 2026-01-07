/**
 * Furniture Developers API
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.1, 1.10, 1.11, 1.14**
 */

import { apiFetch } from '../client';
import type {
  FurnitureDeveloper,
  CreateDeveloperInput,
  UpdateDeveloperInput,
} from './types';

export const furnitureDevelopersApi = {
  list: () => apiFetch<FurnitureDeveloper[]>('/api/admin/furniture/developers'),

  create: (data: CreateDeveloperInput) =>
    apiFetch<FurnitureDeveloper>('/api/admin/furniture/developers', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateDeveloperInput) =>
    apiFetch<FurnitureDeveloper>(`/api/admin/furniture/developers/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/developers/${id}`, {
      method: 'DELETE',
    }),
};
