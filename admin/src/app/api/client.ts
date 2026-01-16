/**
 * API Client utilities - NỘI THẤT NHANH Admin Dashboard
 * Uses Firebase Auth for authentication
 *
 * **Feature: firebase-phase3-firestore**
 * **Requirements: 4.5**
 */
import { API_URL } from '@app/shared';
import { getIdToken } from '../auth/firebase';

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

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header with Firebase ID token
  if (!options.skipAuth) {
    try {
      const idToken = await getIdToken();
      if (idToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.warn('Failed to get Firebase ID token:', error);
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

  const response = await fetch(url, config);

  // Handle 401 - Firebase token might be expired
  if (response.status === 401 && !options.skipAuth) {
    // Try to get a fresh token
    try {
      const freshToken = await getIdToken(true); // Force refresh
      if (freshToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${freshToken}`;
        const retryResponse = await fetch(url, { ...config, headers });
        
        if (retryResponse.ok) {
          const json = await retryResponse.json();
          return unwrapResponse<T>(json);
        }
      }
    } catch (error) {
      console.warn('Failed to refresh Firebase token:', error);
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
  return unwrapResponse<T>(json);
}

/**
 * Unwrap standardized API response format
 */
function unwrapResponse<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    const response = json as { success: boolean; data: unknown; meta?: { total?: number; page?: number; limit?: number; totalPages?: number } };
    
    // Handle paginated response: { success: true, data: [], meta: { total, page, limit, totalPages } }
    if (response.meta && typeof response.meta === 'object') {
      return {
        data: response.data,
        total: response.meta.total ?? 0,
        page: response.meta.page ?? 1,
        limit: response.meta.limit ?? 10,
        totalPages: response.meta.totalPages ?? 1,
      } as T;
    }
    // Non-paginated response: just return data
    return response.data as T;
  }
  
  // Fallback for non-standard responses
  return json as T;
}
