/**
 * Furniture Projects API
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.1, 1.10, 1.11, 1.14**
 */

import { apiFetch } from '../client';
import type {
  FurnitureProject,
  FurnitureBuilding,
  CreateProjectInput,
  UpdateProjectInput,
  CreateBuildingInput,
  UpdateBuildingInput,
} from './types';

export const furnitureProjectsApi = {
  list: (developerId?: string) => {
    const query = developerId ? `?developerId=${developerId}` : '';
    return apiFetch<FurnitureProject[]>(`/api/admin/furniture/projects${query}`);
  },

  create: (data: CreateProjectInput) =>
    apiFetch<FurnitureProject>('/api/admin/furniture/projects', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateProjectInput) =>
    apiFetch<FurnitureProject>(`/api/admin/furniture/projects/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/projects/${id}`, {
      method: 'DELETE',
    }),
};

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
    apiFetch<FurnitureBuilding>('/api/admin/furniture/buildings', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateBuildingInput) =>
    apiFetch<FurnitureBuilding>(`/api/admin/furniture/buildings/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/buildings/${id}`, {
      method: 'DELETE',
    }),
};
