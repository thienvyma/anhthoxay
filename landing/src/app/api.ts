/**
 * Shared API client for Landing page - ANH THỢ XÂY
 * Only includes endpoints needed for ATH project
 */

import { API_URL } from '@app/shared';

const API_BASE = API_URL;

// Type definitions
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  categoryId: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

interface BlogComment {
  id: string;
  postId: string;
  name: string;
  email: string;
  content: string;
  status: string;
  createdAt: string;
}

interface PageData {
  id: string;
  slug: string;
  title: string;
  sections: Array<{
    id: string;
    kind: string;
    order: number;
    data: Record<string, unknown>;
  }>;
}

interface CompanySettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  backgroundImage?: string;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Blog API
 * Backend: GET /blog/posts, /blog/posts/:slug, /blog/categories, POST /blog/posts/:id/comments
 */
export const blogAPI = {
  getPosts: (params?: { status?: string; category?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    return apiFetch<BlogPost[]>(`/blog/posts${queryString ? `?${queryString}` : ''}`);
  },

  getPost: (slug: string) => {
    return apiFetch<BlogPost>(`/blog/posts/${slug}`);
  },

  getCategories: () => {
    return apiFetch<BlogCategory[]>('/blog/categories');
  },

  addComment: (postId: string, data: { author: string; email: string; content: string }) => {
    return apiFetch<BlogComment>(`/blog/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Pages API
 * Backend: GET /pages/:slug
 */
export const pagesAPI = {
  getPage: (slug: string) => {
    return apiFetch<PageData>(`/pages/${slug}`);
  },
};

/**
 * Settings API
 * Backend: GET /settings/company
 */
export const settingsAPI = {
  getCompanySettings: () => {
    return apiFetch<CompanySettings>(`/settings/company`);
  },
};
