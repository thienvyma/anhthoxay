// Content APIs - ANH THỢ XÂY Admin Dashboard
// Pages, Sections, Blog, Media, Leads
import { API_BASE, apiFetch } from './client';
import { tokenStorage } from '../store';
import type {
  Page,
  Section,
  MediaAsset,
  BlogCategory,
  BlogPost,
  CustomerLead,
} from '../types';

// ========== PAGES API ==========
export const pagesApi = {
  list: () =>
    apiFetch<Page[]>('/pages'),

  get: (slug: string) =>
    apiFetch<Page>(`/pages/${slug}`),

  create: (data: { slug: string; title: string }) =>
    apiFetch<Page>('/pages', { method: 'POST', body: data }),

  update: (slug: string, data: { title?: string; isActive?: boolean; headerConfig?: string; footerConfig?: string }) =>
    apiFetch<Page>(`/pages/${slug}`, { method: 'PUT', body: data }),

  delete: (slug: string) =>
    apiFetch<{ ok: boolean }>(`/pages/${slug}`, { method: 'DELETE' }),
};

// ========== SECTIONS API ==========
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

// ========== MEDIA API ==========
interface UploadFileResponse {
  url: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  size: number;
}

export const mediaApi = {
  list: () => apiFetch<MediaAsset[]>('/media'),

  /**
   * Upload a file to gallery (creates MediaAsset record)
   * Use this for MediaPage uploads only
   */
  upload: async (formDataOrFile: FormData | File) => {
    const formData =
      formDataOrFile instanceof FormData
        ? formDataOrFile
        : (() => {
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

    const json = await response.json();
    return (json.data || json) as MediaAsset;
  },

  /**
   * Upload file only (NO MediaAsset record)
   * Use this for furniture, materials, blog images, etc.
   */
  uploadFile: async (formDataOrFile: FormData | File) => {
    const formData =
      formDataOrFile instanceof FormData
        ? formDataOrFile
        : (() => {
            const fd = new FormData();
            fd.append('file', formDataOrFile);
            return fd;
          })();

    const headers: HeadersInit = {};
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE}/media/upload-file`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || errorData.details || 'Upload failed');
    }

    const json = await response.json();
    return (json.data || json) as UploadFileResponse;
  },

  delete: (id: string) => apiFetch<{ ok: boolean }>(`/media/${id}`, { method: 'DELETE' }),

  // Update media metadata (alt, caption, tags, isFeatured)
  updateMetadata: (
    id: string,
    data: { alt?: string; caption?: string; tags?: string; isFeatured?: boolean; isActive?: boolean }
  ) => apiFetch<MediaAsset>(`/media/${id}`, { method: 'PUT', body: data }),

  // Get featured media for slideshow (public)
  getFeatured: () => apiFetch<MediaAsset[]>('/media/featured'),

  // Get gallery with pagination (public)
  getGallery: (page = 1, limit = 12) =>
    apiFetch<{
      items: MediaAsset[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/media/gallery?page=${page}&limit=${limit}`),
};

// ========== BLOG CATEGORIES API ==========
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

// ========== BLOG POSTS API ==========
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

// ========== BLOG COMMENTS API ==========
interface BlogComment {
  id: string;
  postId: string;
  name: string;
  email: string;
  content: string;
  status: string;
  createdAt: string;
  post?: {
    id: string;
    title: string;
    slug: string;
  };
}

interface BlogCommentsListParams {
  status?: string;
  postId?: string;
}

export const blogCommentsApi = {
  // List all comments with optional filtering (Admin/Manager only)
  list: (params?: BlogCommentsListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<BlogComment[]>(`/blog/comments${query ? '?' + query : ''}`);
  },

  // Create a comment on a post (public)
  create: (postId: string, data: { name: string; email: string; content: string }) =>
    apiFetch<BlogComment>(`/blog/posts/${postId}/comments`, { method: 'POST', body: data }),

  // Update comment status (approve/reject) - Admin/Manager only
  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiFetch<BlogComment>(`/blog/comments/${id}/status`, { method: 'PUT', body: { status } }),

  // Delete a comment - Admin/Manager only
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/comments/${id}`, { method: 'DELETE' }),
};

// ========== LEADS API ==========
interface LeadsListParams {
  search?: string;
  status?: string;
  source?: string;
  duplicateStatus?: 'all' | 'duplicates_only' | 'no_duplicates';
  hasRelated?: boolean;
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
  duplicateSubmissionsBlocked?: number;
}

interface RelatedLeadsResponse {
  bySource: Record<string, CustomerLead[]>;
  totalCount: number;
}

interface MergeLeadsResponse {
  primaryLead: CustomerLead;
  mergedCount: number;
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

  // Get single lead by ID
  get: (id: string) =>
    apiFetch<CustomerLead>(`/leads/${id}`),

  // Get dashboard stats
  getStats: () =>
    apiFetch<LeadsStatsResponse>('/leads/stats'),

  // Get related leads (same phone, different source)
  getRelated: (id: string) =>
    apiFetch<RelatedLeadsResponse>(`/leads/${id}/related`),

  // Merge leads (Admin only)
  merge: (primaryId: string, secondaryLeadIds: string[]) =>
    apiFetch<MergeLeadsResponse>(`/leads/${primaryId}/merge`, {
      method: 'POST',
      body: { secondaryLeadIds },
    }),

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
