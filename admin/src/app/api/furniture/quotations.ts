/**
 * Furniture Quotations, Fees, PDF Settings & Data Import/Export API
 * Uses Firebase Auth for authentication
 *
 * **Feature: firebase-phase3-firestore**
 * **Requirements: 4.5**
 */

import { API_BASE, apiFetch } from '../client';
import { getIdToken } from '../../auth/firebase';
import type {
  FurnitureFee,
  FurnitureQuotation,
  FurniturePdfSettings,
  CreateFeeInput,
  UpdateFeeInput,
  UpdatePdfSettingsInput,
  ImportResult,
  ExportResult,
  SyncResult,
} from './types';

/**
 * Furniture Fees API
 */
export const furnitureFeesApi = {
  list: () => apiFetch<FurnitureFee[]>('/api/admin/furniture/fees'),

  create: (data: CreateFeeInput) =>
    apiFetch<FurnitureFee>('/api/admin/furniture/fees', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateFeeInput) =>
    apiFetch<FurnitureFee>(`/api/admin/furniture/fees/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/furniture/fees/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Furniture Quotations API
 */
export const furnitureQuotationsApi = {
  list: (leadId: string) =>
    apiFetch<FurnitureQuotation[]>(`/api/admin/furniture/quotations?leadId=${leadId}`),

  exportPdf: async (quotationId: string): Promise<string> => {
    const headers: HeadersInit = {};
    const accessToken = await getIdToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `${API_BASE}/api/admin/furniture/quotations/${quotationId}/pdf`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};

/**
 * Furniture PDF Settings API
 */
export const furniturePdfSettingsApi = {
  get: () => apiFetch<FurniturePdfSettings>('/api/admin/furniture/pdf-settings'),

  update: (data: UpdatePdfSettingsInput) =>
    apiFetch<FurniturePdfSettings>('/api/admin/furniture/pdf-settings', {
      method: 'PUT',
      body: data,
    }),

  reset: () =>
    apiFetch<FurniturePdfSettings>('/api/admin/furniture/pdf-settings/reset', {
      method: 'POST',
    }),
};

/**
 * Furniture Data Import/Export API
 */
export const furnitureDataApi = {
  import: async (files: {
    duAn: File;
    layouts: File;
    apartmentTypes: File;
  }): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('duAn', files.duAn);
    formData.append('layouts', files.layouts);
    formData.append('apartmentTypes', files.apartmentTypes);

    const headers: HeadersInit = {};
    const accessToken = await getIdToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE}/api/admin/furniture/import`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Import failed' }));
      throw new Error(errorData.error?.message || errorData.error || 'Import failed');
    }

    const json = await response.json();
    return (json.data || json) as ImportResult;
  },

  export: () => apiFetch<ExportResult>('/api/admin/furniture/export'),

  syncPull: (spreadsheetId: string) =>
    apiFetch<SyncResult>('/api/admin/furniture/sync/pull', {
      method: 'POST',
      body: { spreadsheetId },
    }),

  syncPush: (spreadsheetId: string) =>
    apiFetch<SyncResult>('/api/admin/furniture/sync/push', {
      method: 'POST',
      body: { spreadsheetId },
    }),
};
