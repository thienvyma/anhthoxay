// API Client for Admin Dashboard - ANH THỢ XÂY
import { API_URL } from '@app/shared';
import { tokenStorage, store } from './store';
import type { 
  Page, 
  Section, 
  MediaAsset, 
  BlogCategory, 
  BlogPost,
  CustomerLead,
  ServiceCategory,
  UnitPrice,
  Material,
  Formula,
} from './types';

const API_BASE = API_URL;

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
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
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      tokenStorage.clearTokens();
      store.setUser(null);
      return false;
    }

    const data = await response.json();
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    return true;
  } catch {
    tokenStorage.clearTokens();
    store.setUser(null);
    return false;
  }
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
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
    
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, {
      status: response.status,
      statusText: response.statusText,
      error: error,
      url: url,
    });
    throw new Error(errorMessage);
  }

  return response.json();
}

// Auth API - Using JWT
interface LoginResponse {
  user: { id: string; email: string; role: string; name: string };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiFetch<LoginResponse>(
      '/api/auth/login',
      { method: 'POST', body: { email, password }, skipAuth: true }
    );
    // Store tokens
    tokenStorage.setAccessToken(response.accessToken);
    tokenStorage.setRefreshToken(response.refreshToken);
    tokenStorage.setSessionId(response.sessionId);
    return { ok: true, user: response.user };
  },

  logout: async () => {
    try {
      await apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } finally {
      tokenStorage.clearTokens();
    }
    return { ok: true };
  },

  me: () =>
    apiFetch<{ id: string; email: string; role: string; name: string; createdAt: string }>('/api/auth/me'),
};

// Pages API
export const pagesApi = {
  list: () =>
    apiFetch<Page[]>('/pages'),

  get: (slug: string) =>
    apiFetch<Page>(`/pages/${slug}`),

  create: (data: { slug: string; title: string }) =>
    apiFetch<Page>('/pages', { method: 'POST', body: data }),

  update: (slug: string, data: { title?: string; headerConfig?: string; footerConfig?: string }) =>
    apiFetch<Page>(`/pages/${slug}`, { method: 'PUT', body: data }),

  delete: (slug: string) =>
    apiFetch<{ ok: boolean }>(`/pages/${slug}`, { method: 'DELETE' }),
};

// Sections API
export const sectionsApi = {
  create: (pageSlug: string, data: { kind: string; data: unknown; order?: number }) =>
    apiFetch<Section>(`/pages/${pageSlug}/sections`, { method: 'POST', body: data }),

  update: (id: string, data: { data?: unknown; order?: number; syncAll?: boolean }) =>
    apiFetch<Section>(`/sections/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/sections/${id}`, { method: 'DELETE' }),

  reorder: async (sections: Array<{ id: string; order: number }>) => {
    // Update each section's order
    await Promise.all(
      sections.map((section) =>
        apiFetch<Section>(`/sections/${section.id}`, {
          method: 'PUT',
          body: { order: section.order },
        })
      )
    );
    return { ok: true };
  },
};

// Media API
export const mediaApi = {
  list: () =>
    apiFetch<MediaAsset[]>('/media'),

  upload: async (formDataOrFile: FormData | File) => {
    const formData = formDataOrFile instanceof FormData ? formDataOrFile : (() => {
      const fd = new FormData();
      fd.append('file', formDataOrFile);
      return fd;
    })();

    const headers: HeadersInit = {};
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE}/media`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || errorData.details || 'Upload failed');
    }

    return response.json() as Promise<MediaAsset>;
  },

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/media/${id}`, { method: 'DELETE' }),
};

// ========== ATH: CUSTOMER LEADS ==========

// Leads API types
interface LeadsListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface PaginatedLeadsResponse {
  data: CustomerLead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LeadsStatsResponse {
  dailyLeads: Array<{ date: string; count: number }>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  conversionRate: number;
  totalLeads: number;
  newLeads: number;
}

export const leadsApi = {
  // List with search, filter, pagination
  list: (params?: LeadsListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedLeadsResponse>(`/leads${query ? '?' + query : ''}`);
  },

  // Get dashboard stats
  getStats: () =>
    apiFetch<LeadsStatsResponse>('/leads/stats'),

  // Export CSV - returns blob for download
  export: async (params?: { search?: string; status?: string }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    
    const url = `${API_BASE}/leads/export${query ? '?' + query : ''}`;
    const headers: HeadersInit = {};
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    // Trigger download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },

  update: (id: string, data: { status?: string; notes?: string }) =>
    apiFetch<CustomerLead>(`/leads/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/leads/${id}`, { method: 'DELETE' }),
};

// ========== ATH: SERVICE CATEGORIES ==========
interface ServiceCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  coefficient?: number;
  allowMaterials?: boolean;
  formulaId?: string | null;
  order?: number;
  isActive?: boolean;
}

export const serviceCategoriesApi = {
  list: () =>
    apiFetch<ServiceCategory[]>('/service-categories'),

  get: (id: string) =>
    apiFetch<ServiceCategory>(`/service-categories/${id}`),

  create: (data: ServiceCategoryInput) =>
    apiFetch<ServiceCategory>('/service-categories', { method: 'POST', body: data }),

  update: (id: string, data: Partial<ServiceCategoryInput>) =>
    apiFetch<ServiceCategory>(`/service-categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/service-categories/${id}`, { method: 'DELETE' }),
};

// ========== ATH: UNIT PRICES ==========
interface UnitPriceInput {
  category: string;
  name: string;
  price: number;
  tag: string;
  unit: string;
  description?: string;
  isActive?: boolean;
}

export const unitPricesApi = {
  list: () =>
    apiFetch<UnitPrice[]>('/unit-prices'),

  create: (data: UnitPriceInput) =>
    apiFetch<UnitPrice>('/unit-prices', { method: 'POST', body: data }),

  update: (id: string, data: Partial<UnitPriceInput>) =>
    apiFetch<UnitPrice>(`/unit-prices/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/unit-prices/${id}`, { method: 'DELETE' }),
};

// ========== ATH: MATERIALS ==========
interface MaterialInput {
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
}

export const materialsApi = {
  list: () =>
    apiFetch<Material[]>('/materials'),

  create: (data: MaterialInput) =>
    apiFetch<Material>('/materials', { method: 'POST', body: data }),

  update: (id: string, data: Partial<MaterialInput>) =>
    apiFetch<Material>(`/materials/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/materials/${id}`, { method: 'DELETE' }),
};

// ========== ATH: FORMULAS ==========
interface FormulaInput {
  name: string;
  expression: string;
  description?: string;
  isActive?: boolean;
}

export const formulasApi = {
  list: () =>
    apiFetch<Formula[]>('/formulas'),

  create: (data: FormulaInput) =>
    apiFetch<Formula>('/formulas', { method: 'POST', body: data }),

  update: (id: string, data: Partial<FormulaInput>) =>
    apiFetch<Formula>(`/formulas/${id}`, { method: 'PUT', body: data }),
};

// ========== SETTINGS ==========
export const settingsApi = {
  get: (key: string) =>
    apiFetch<Record<string, unknown>>(`/settings/${key}`),

  update: (key: string, data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/settings/${key}`, { method: 'PUT', body: data }),
};

// Blog Categories API
interface BlogCategoryInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export const blogCategoriesApi = {
  list: () =>
    apiFetch<BlogCategory[]>('/blog/categories'),

  get: (slug: string) =>
    apiFetch<BlogCategory>(`/blog/categories/${slug}`),

  create: (data: BlogCategoryInput) =>
    apiFetch<BlogCategory>('/blog/categories', { method: 'POST', body: data }),

  update: (id: string, data: Partial<BlogCategoryInput>) =>
    apiFetch<BlogCategory>(`/blog/categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/categories/${id}`, { method: 'DELETE' }),
};

// Blog Posts API
interface BlogPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  categoryId: string;
  tags?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured?: boolean;
}

export const blogPostsApi = {
  list: (params?: { status?: string; categoryId?: string; search?: string }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString() : '';
    return apiFetch<BlogPost[]>(`/blog/posts${query ? '?' + query : ''}`);
  },

  get: (slug: string) =>
    apiFetch<BlogPost>(`/blog/posts/${slug}`),

  create: (data: BlogPostInput) =>
    apiFetch<BlogPost>('/blog/posts', { method: 'POST', body: data }),

  update: (id: string, data: Partial<BlogPostInput>) =>
    apiFetch<BlogPost>(`/blog/posts/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/posts/${id}`, { method: 'DELETE' }),
};

// Blog Comments API
interface BlogComment {
  id: string;
  postId: string;
  name: string;
  email: string;
  content: string;
  status: string;
  createdAt: string;
}

export const blogCommentsApi = {
  create: (postId: string, data: { name: string; email: string; content: string }) =>
    apiFetch<BlogComment>(`/blog/posts/${postId}/comments`, { method: 'POST', body: data }),

  update: (id: string, data: { status: string }) =>
    apiFetch<BlogComment>(`/blog/comments/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/comments/${id}`, { method: 'DELETE' }),
};

// ========== ACCOUNT / AUTH MANAGEMENT ==========
export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface ChangePasswordResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const accountApi = {
  // Change password - revokes all other sessions
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiFetch<ChangePasswordResponse>('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
    // Update tokens after password change
    tokenStorage.setAccessToken(response.accessToken);
    tokenStorage.setRefreshToken(response.refreshToken);
    return response;
  },

  // Get all sessions for current user
  getSessions: () =>
    apiFetch<{ sessions: SessionInfo[] }>('/api/auth/sessions'),

  // Revoke a specific session
  revokeSession: (sessionId: string) =>
    apiFetch<{ message: string }>(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' }),

  // Revoke all other sessions (keep current)
  revokeAllOtherSessions: () =>
    apiFetch<{ message: string; count: number }>('/api/auth/sessions', { method: 'DELETE' }),
};

// ========== GOOGLE SHEETS INTEGRATION ==========
export interface GoogleSheetsStatus {
  connected: boolean;
  spreadsheetId: string | null;
  sheetName: string;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  errorCount: number;
  lastError: string | null;
}

export const googleSheetsApi = {
  // Get OAuth URL for connecting
  getAuthUrl: () =>
    apiFetch<{ authUrl: string }>('/integrations/google/auth-url'),

  // Disconnect Google Sheets
  disconnect: () =>
    apiFetch<{ success: boolean; message: string }>('/integrations/google/disconnect', { method: 'POST' }),

  // Get connection status
  getStatus: () =>
    apiFetch<GoogleSheetsStatus>('/integrations/google/status'),

  // Test spreadsheet connection
  testConnection: () =>
    apiFetch<{ success: boolean; message: string }>('/integrations/google/test', { method: 'POST' }),

  // Update settings
  updateSettings: (data: { spreadsheetId?: string; sheetName?: string; syncEnabled?: boolean }) =>
    apiFetch<{ success: boolean; message: string }>('/integrations/google/settings', { method: 'PUT', body: data }),
};
