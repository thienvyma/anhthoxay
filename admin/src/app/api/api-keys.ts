/**
 * API Keys API Client - ANH THỢ XÂY Admin Dashboard
 *
 * Handles API key management operations including CRUD, status toggle, testing, and usage logs.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 9.1, 10.2, 11.1, 12.2, 13.3, 14.1, 15.3**
 */

import { apiFetch } from './client';

// ============================================
// TYPES
// ============================================

export type ApiKeyScope = 'READ_ONLY' | 'READ_WRITE' | 'FULL_ACCESS';
export type ApiKeyStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
export type EndpointGroup =
  | 'leads'
  | 'blog'
  | 'projects'
  | 'contractors'
  | 'reports'
  | 'pricing'
  | 'furniture'
  | 'media'
  | 'settings';

export interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  scope: ApiKeyScope;
  allowedEndpoints: string; // JSON array string
  status: ApiKeyStatus;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyUsageLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
}

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  scope: ApiKeyScope;
  allowedEndpoints: EndpointGroup[];
  expiresAt?: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  description?: string | null;
  scope?: ApiKeyScope;
  allowedEndpoints?: EndpointGroup[];
  expiresAt?: string | null;
}

export interface ListApiKeysParams {
  status?: ApiKeyStatus;
  search?: string;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  rawKey: string;
}

export interface TestApiKeyResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
  message: string;
  data?: unknown;
}

// ============================================
// API CLIENT
// ============================================

/**
 * API Keys API
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 9.1, 10.2, 11.1, 12.2, 13.3, 14.1, 15.3**
 */
export const apiKeysApi = {
  /**
   * List all API keys with optional filtering
   * @param params - Filter parameters (status, search)
   * @returns Array of API keys
   * Requirements: 9.1
   */
  list: (params?: ListApiKeysParams) => {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiFetch<ApiKey[]>(`/api/admin/api-keys${query ? '?' + query : ''}`);
  },

  /**
   * Create a new API key
   * @param data - API key creation data
   * @returns Created API key and raw key (shown only once)
   * Requirements: 10.2
   */
  create: (data: CreateApiKeyInput) =>
    apiFetch<CreateApiKeyResponse>('/api/admin/api-keys', {
      method: 'POST',
      body: data,
    }),

  /**
   * Get API key details by ID
   * @param id - API key ID
   * @returns API key details
   * Requirements: 14.1
   */
  get: (id: string) => apiFetch<ApiKey>(`/api/admin/api-keys/${id}`),

  /**
   * Update an existing API key
   * @param id - API key ID
   * @param data - Update data
   * @returns Updated API key
   * Requirements: 15.3
   */
  update: (id: string, data: UpdateApiKeyInput) =>
    apiFetch<ApiKey>(`/api/admin/api-keys/${id}`, {
      method: 'PUT',
      body: data,
    }),

  /**
   * Delete an API key permanently
   * @param id - API key ID
   * @returns Success response
   * Requirements: 12.2
   */
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/api-keys/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Toggle API key status between ACTIVE and INACTIVE
   * @param id - API key ID
   * @returns Updated API key
   * Requirements: 11.1
   */
  toggleStatus: (id: string) =>
    apiFetch<ApiKey>(`/api/admin/api-keys/${id}/toggle`, {
      method: 'PUT',
    }),

  /**
   * Test an API key by making an internal API call
   * @param id - API key ID
   * @param endpoint - Endpoint to test (default: /api/leads)
   * @returns Test result with success status and response time
   * Requirements: 13.3
   */
  testKey: (id: string, endpoint?: string) =>
    apiFetch<TestApiKeyResult>(`/api/admin/api-keys/${id}/test`, {
      method: 'POST',
      body: { endpoint: endpoint || '/api/leads' },
    }),

  /**
   * Get usage logs for an API key
   * @param id - API key ID
   * @param limit - Maximum number of logs to return (default: 10)
   * @returns Array of usage logs
   * Requirements: 14.1
   */
  getUsageLogs: (id: string, limit?: number) =>
    apiFetch<ApiKeyUsageLog[]>(
      `/api/admin/api-keys/${id}/logs${limit ? `?limit=${limit}` : ''}`
    ),
};

