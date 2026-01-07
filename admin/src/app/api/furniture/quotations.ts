/**
 * Furniture Quotations, Fees, PDF Settings & Data Import/Export API
 *
 * **Feature: furniture-quotation**
 * **Requirements: 4.1-4.4, 8.1-8.3, 1.6, 1.8, 9.3, 9.4, 11.3**
 */

import { API_BASE, apiFetch } from '../client';
import { tokenStorage } from '../../store';
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
 *
 * **Feature: furniture-quotation**
 * **Requirements: 4.1, 4.2, 4.3, 4.4**
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
 *
 * **Feature: furniture-quotation**
 * **Requirements: 8.1, 8.2, 8.3, 11.3**
 */
export const furnitureQuotationsApi = {
  list: (leadId: string) =>
    apiFetch<FurnitureQuotation[]>(`/api/admin/furniture/quotations?leadId=${leadId}`),

  exportPdf: async (quotationId: string): Promise<string> => {
    const headers: HeadersInit = {};
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const sessionId = tokenStorage.getSessionId();
    if (sessionId) {
      headers['x-session-id'] = sessionId;
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
 *
 * **Feature: furniture-quotation**
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
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.6, 1.8, 9.3, 9.4**
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
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const sessionId = tokenStorage.getSessionId();
    if (sessionId) {
      headers['x-session-id'] = sessionId;
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
