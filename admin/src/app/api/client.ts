// API Client utilities - NỘI THẤT NHANH Admin Dashboard
import { API_URL } from '@app/shared';
import { tokenStorage } from '../store';

export const API_BASE = API_URL;

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  /** If true, don't log errors to console (useful for expected 404s) */
  silent?: boolean;
}

interface ValidationDetail {
  field: string;
  message: string;
}

// Token refresh logic
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const json = await response.json();
    // Unwrap standardized response format
    const data = json.data || json;
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    // Also save the new sessionId from token rotation
    if (data.sessionId) {
      tokenStorage.setSessionId(data.sessionId);
    }
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if we have a token
  if (!options.skipAuth) {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }
    const sessionId = tokenStorage.getSessionId();
    if (sessionId) {
      (headers as Record<string, string>)['x-session-id'] = sessionId;
    }
  }

  const config: RequestInit = {
    headers,
    method: options.method,
    cache: options.cache,
    mode: options.mode,
    redirect: options.redirect,
    referrer: options.referrer,
    referrerPolicy: options.referrerPolicy,
    signal: options.signal,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  let response = await fetch(url, config);

  // Handle 401 - try to refresh token
  if (response.status === 401 && !options.skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      // Retry with new token
      const newToken = tokenStorage.getAccessToken();
      if (newToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      }
      response = await fetch(url, { ...config, headers });
    } else {
      // Refresh failed - clear tokens to force re-login
      tokenStorage.clearTokens();
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    
    // Format validation errors if present
    let errorMessage = error.error?.message || error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
    if (error.details && Array.isArray(error.details)) {
      const validationErrors = (error.details as ValidationDetail[])
        .map((detail) => `${detail.field}: ${detail.message}`)
        .join('\n');
      errorMessage = `${errorMessage}\n\nValidation Errors:\n${validationErrors}`;
    }
    
    // Only log errors if not silent (useful for expected 404s)
    if (!options.silent) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, {
        status: response.status,
        statusText: response.statusText,
        error: error,
        url: url,
      });
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();
  
  // Unwrap standardized response format: { success: true, data: T }
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    // Handle paginated response: { success: true, data: [], meta: { total, page, limit, totalPages } }
    if ('meta' in json && json.meta && typeof json.meta === 'object') {
      const meta = json.meta as { total?: number; page?: number; limit?: number; totalPages?: number };
      return {
        data: json.data,
        total: meta.total ?? 0,
        page: meta.page ?? 1,
        limit: meta.limit ?? 10,
        totalPages: meta.totalPages ?? 1,
      } as T;
    }
    // Non-paginated response: just return data
    return json.data as T;
  }
  
  // Fallback for non-standard responses
  return json as T;
}
