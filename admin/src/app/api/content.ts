// Content APIs - NỘI THẤT NHANH Admin Dashboard
// Pages, Sections, Blog, Media, Leads
import { API_BASE, apiFetch } from './client';
import { getIdToken } from '../auth/firebase';
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

/**
 * Media folder types for organizing files
 */
export type MediaFolder = 'blog' | 'portfolio' | 'projects' | 'documents' | 'avatars' | 'products' | 'gallery' | 'temp';

export const mediaApi = {
  list: () => apiFetch<MediaAsset[]>('/media'),

  /**
   * Upload a file to gallery (creates MediaAsset record)
   * Use this for MediaPage uploads only
   * @param formDataOrFile - File or FormData to upload
   * @param folder - Optional folder to organize files (default: gallery)
   */
  upload: async (formDataOrFile: FormData | File, folder?: MediaFolder) => {
    const formData =
      formDataOrFile instanceof FormData
        ? formDataOrFile
        : (() => {
            const fd = new FormData();
            fd.append('file', formDataOrFile);
            return fd;
          })();

    // Add folder if specified
    if (folder && !formData.has('folder')) {
      formData.append('folder', folder);
    }

    const headers: HeadersInit = {};
    const accessToken = await getIdToken();
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
   * @param formDataOrFile - File or FormData to upload
   * @param folder - Optional folder to organize files
   */
  uploadFile: async (formDataOrFile: FormData | File, folder?: MediaFolder) => {
    const formData =
      formDataOrFile instanceof FormData
        ? formDataOrFile
        : (() => {
            const fd = new FormData();
            fd.append('file', formDataOrFile);
            return fd;
          })();

    // Add folder if specified
    if (folder && !formData.has('folder')) {
      formData.append('folder', folder);
    }

    const headers: HeadersInit = {};
    const accessToken = await getIdToken();
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

  // Get folder stats (Admin only)
  getFolders: () =>
    apiFetch<{
      folders: MediaFolder[];
      stats: Array<{ name: string; count: number }>;
      total: number;
    }>('/media/folders'),
};

// ========== BLOG CATEGORIES API ==========
interface BlogCategoryInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export const blogCategoriesApi = {
  // Public endpoint - get all categories
  list: () =>
    apiFetch<BlogCategory[]>('/blog/categories'),

  get: (slug: string) =>
    apiFetch<BlogCategory>(`/blog/categories/${slug}`),

  // Admin endpoints - require auth
  create: (data: BlogCategoryInput) =>
    apiFetch<BlogCategory>('/api/admin/blog/categories', { method: 'POST', body: data }),

  update: (id: string, data: Partial<BlogCategoryInput>) =>
    apiFetch<BlogCategory>(`/api/admin/blog/categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/blog/categories/${id}`, { method: 'DELETE' }),
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

interface PaginatedBlogPostsResponse {
  data: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const blogPostsApi = {
  // Admin endpoint - list all posts (including drafts)
  list: async (params?: { status?: string; categoryId?: string; search?: string }): Promise<BlogPost[]> => {
    const query = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString() : '';
    const result = await apiFetch<PaginatedBlogPostsResponse | BlogPost[]>(`/api/admin/blog/posts${query ? '?' + query : ''}`);
    // Handle both paginated and array responses
    if (Array.isArray(result)) {
      return result;
    }
    if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  },

  // Admin endpoint - get post by ID (not slug)
  get: (idOrSlug: string) =>
    apiFetch<BlogPost>(`/api/admin/blog/posts/${idOrSlug}`),

  // Admin endpoint - create post
  create: (data: BlogPostInput) =>
    apiFetch<BlogPost>('/api/admin/blog/posts', { method: 'POST', body: data }),

  // Admin endpoint - update post
  update: (id: string, data: Partial<BlogPostInput>) =>
    apiFetch<BlogPost>(`/api/admin/blog/posts/${id}`, { method: 'PUT', body: data }),

  // Admin endpoint - delete post
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/blog/posts/${id}`, { method: 'DELETE' }),
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

interface PaginatedBlogCommentsResponse {
  data: BlogComment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const blogCommentsApi = {
  // Admin endpoint - list all comments with optional filtering
  list: async (params?: BlogCommentsListParams): Promise<BlogComment[]> => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    const result = await apiFetch<PaginatedBlogCommentsResponse | BlogComment[]>(`/api/admin/blog/comments${query ? '?' + query : ''}`);
    // Handle both paginated and array responses
    if (Array.isArray(result)) {
      return result;
    }
    if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  },

  // Public endpoint - create a comment on a post
  create: (postId: string, data: { name: string; email: string; content: string }) =>
    apiFetch<BlogComment>(`/blog/posts/${postId}/comments`, { method: 'POST', body: data }),

  // Admin endpoint - update comment status (approve/reject)
  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiFetch<BlogComment>(`/api/admin/blog/comments/${id}/status`, { method: 'PUT', body: { status } }),

  // Admin endpoint - delete a comment
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/blog/comments/${id}`, { method: 'DELETE' }),
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
  // List with search, filter, pagination (Admin endpoint)
  list: (params?: LeadsListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedLeadsResponse>(`/api/admin/leads${query ? '?' + query : ''}`);
  },

  // Get single lead by ID (Admin endpoint)
  get: (id: string) =>
    apiFetch<CustomerLead>(`/api/admin/leads/${id}`),

  // Get dashboard stats (Admin endpoint)
  getStats: () =>
    apiFetch<LeadsStatsResponse>('/api/admin/leads/stats'),

  // Get related leads (same phone, different source) (Admin endpoint)
  getRelated: (id: string) =>
    apiFetch<RelatedLeadsResponse>(`/api/admin/leads/${id}/related`),

  // Merge leads (Admin only)
  merge: (primaryId: string, secondaryLeadIds: string[]) =>
    apiFetch<MergeLeadsResponse>(`/api/admin/leads/${primaryId}/merge`, {
      method: 'POST',
      body: { secondaryLeadIds },
    }),

  // Export CSV - returns blob for download (Admin endpoint)
  export: async (params?: { search?: string; status?: string }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    
    const url = `${API_BASE}/api/admin/leads/export${query ? '?' + query : ''}`;
    const headers: HeadersInit = {};
    const accessToken = await getIdToken();
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

  // Update lead (Admin endpoint)
  update: (id: string, data: { status?: string; notes?: string }) =>
    apiFetch<CustomerLead>(`/api/admin/leads/${id}`, { method: 'PUT', body: data }),

  // Delete lead (Admin endpoint)
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/leads/${id}`, { method: 'DELETE' }),
};


// ========== NOTIFICATION TEMPLATES API ==========
export interface NotificationTemplate {
  id: string;
  type: string;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
  variables: string[];
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RenderedTemplate {
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
}

export const notificationTemplatesApi = {
  list: () =>
    apiFetch<NotificationTemplate[]>('/api/admin/notification-templates'),

  get: (type: string) =>
    apiFetch<NotificationTemplate>(`/api/admin/notification-templates/${type}`),

  update: (type: string, data: Partial<NotificationTemplate>) =>
    apiFetch<NotificationTemplate>(`/api/admin/notification-templates/${type}`, { method: 'PUT', body: data }),

  render: (data: { type: string; variables: Record<string, string> }) =>
    apiFetch<RenderedTemplate>('/api/admin/notification-templates/render', { method: 'POST', body: data }),

  getTypes: () =>
    apiFetch<Array<{ type: string; label: string; description: string }>>('/api/admin/notification-templates/types'),

  seed: () =>
    apiFetch<{ message: string; count: number }>('/api/admin/notification-templates/seed', { method: 'POST' }),
};
