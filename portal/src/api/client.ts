/**
 * Portal API Client Utilities
 *
 * Base client with JWT authentication and auto-refresh
 *
 * **Feature: code-refactoring**
 * **Requirements: 2.2, 2.3**
 */

import { API_URL } from '@app/shared';

// ============================================
// TOKEN STORAGE
// ============================================

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('portal_access_token'),
  getRefreshToken: () => localStorage.getItem('portal_refresh_token'),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('portal_access_token', accessToken);
    localStorage.setItem('portal_refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('portal_access_token');
    localStorage.removeItem('portal_refresh_token');
  },
};

// ============================================
// TOKEN REFRESH HANDLING
// ============================================

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let onAuthFailure: (() => void) | null = null;

export function setAuthFailureCallback(callback: () => void) {
  onAuthFailure = callback;
}

async function attemptTokenRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const result = data.data ?? data;

    if (result.accessToken && result.refreshToken) {
      tokenStorage.setTokens(result.accessToken, result.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function handleTokenRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = attemptTokenRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

// ============================================
// API ERROR CLASS
// ============================================

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================
// BASE FETCH WITH AUTH
// ============================================

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOnUnauthorized = true
): Promise<T> {
  const accessToken = tokenStorage.getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'Request timed out. Please try again.', 408);
    }
    throw new ApiError('NETWORK_ERROR', 'Network error. Please check your connection.', 0);
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle 401 Unauthorized - attempt token refresh
  if (response.status === 401 && retryOnUnauthorized) {
    const refreshed = await handleTokenRefresh();

    if (refreshed) {
      return fetchWithAuth<T>(endpoint, options, false);
    } else {
      tokenStorage.clearTokens();
      if (onAuthFailure) {
        onAuthFailure();
      }
      throw new ApiError('UNAUTHORIZED', 'Session expired. Please login again.', 401);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(
      error.error?.code || 'REQUEST_FAILED',
      error.error?.message || error.message || 'Request failed',
      response.status,
      error.error?.details
    );
  }

  const data = await response.json();
  
  // Handle different response formats:
  // 1. successResponse: { success: true, data: T }
  // 2. paginatedResponse: { success: true, data: T[], meta: {...} }
  // 
  // For successResponse, we want to return data.data
  // For paginatedResponse, we want to return { data: [...], meta: {...} }
  
  if (data.success === true) {
    // Check if this is a paginated response (has meta at top level)
    if (data.meta !== undefined) {
      // paginatedResponse format - return data and meta together
      return { data: data.data, meta: data.meta } as T;
    }
    // successResponse format - return just the data
    return data.data as T;
  }
  
  // Fallback for non-standard responses
  return data.data ?? data;
}

// ============================================
// MULTIPART FORM DATA HELPER
// ============================================

export async function fetchWithAuthFormData<T>(
  endpoint: string,
  formData: FormData,
  retryOnUnauthorized = true
): Promise<T> {
  const accessToken = tokenStorage.getAccessToken();

  const headers: HeadersInit = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshed = await handleTokenRefresh();
    if (refreshed) {
      return fetchWithAuthFormData<T>(endpoint, formData, false);
    } else {
      tokenStorage.clearTokens();
      if (onAuthFailure) {
        onAuthFailure();
      }
      throw new ApiError('UNAUTHORIZED', 'Session expired. Please login again.', 401);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(
      error.error?.code || 'REQUEST_FAILED',
      error.error?.message || error.message || 'Request failed',
      response.status
    );
  }

  const data = await response.json();
  
  // Handle different response formats (same logic as fetchWithAuth)
  if (data.success === true) {
    if (data.meta !== undefined) {
      return { data: data.data, meta: data.meta } as T;
    }
    return data.data as T;
  }
  
  return data.data ?? data;
}

// ============================================
// QUERY STRING BUILDER
// ============================================

export function buildQueryString<T extends object>(params: T): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
