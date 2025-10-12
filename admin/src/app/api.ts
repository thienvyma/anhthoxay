// API Client for Admin Dashboard
const API_BASE = 'http://localhost:4202';

interface FetchOptions extends RequestInit {
  body?: unknown;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Important for cookies
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    
    // Format validation errors if present
    let errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
    if (error.details && Array.isArray(error.details)) {
      const validationErrors = error.details
        .map((detail: any) => `${detail.field}: ${detail.message}`)
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

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ ok: boolean; user: { id: string; email: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: { email, password } }
    ),

  logout: () =>
    apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () =>
    apiFetch<{ id: string; email: string; role: string }>('/auth/me'),
};

// Pages API
export const pagesApi = {
  list: () =>
    apiFetch<any[]>('/pages'),

  get: (slug: string) =>
    apiFetch<any>(`/pages/${slug}`),

  create: (data: { slug: string; title: string }) =>
    apiFetch<any>('/pages', { method: 'POST', body: data }),

  update: (slug: string, data: { title?: string; headerConfig?: string; footerConfig?: string }) =>
    apiFetch<any>(`/pages/${slug}`, { method: 'PUT', body: data }),

  delete: (slug: string) =>
    apiFetch<any>(`/pages/${slug}`, { method: 'DELETE' }),
};

// Sections API
export const sectionsApi = {
  create: (pageSlug: string, data: { kind: string; data: unknown; order?: number }) =>
    apiFetch<any>(`/pages/${pageSlug}/sections`, { method: 'POST', body: data }),

  update: (id: string, data: { data?: unknown; order?: number }) =>
    apiFetch<any>(`/sections/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/sections/${id}`, { method: 'DELETE' }),

  reorder: async (sections: Array<{ id: string; order: number }>) => {
    // Update each section's order
    await Promise.all(
      sections.map((section) =>
        apiFetch<any>(`/sections/${section.id}`, {
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
    apiFetch<any[]>('/media'),

  upload: async (formDataOrFile: FormData | File) => {
    const formData = formDataOrFile instanceof FormData ? formDataOrFile : (() => {
      const fd = new FormData();
      fd.append('file', formDataOrFile);
      return fd;
    })();

    const response = await fetch(`${API_BASE}/media`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || errorData.details || 'Upload failed');
    }

    return response.json();
  },

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/media/${id}`, { method: 'DELETE' }),
};

// Reservations API
export const reservationsApi = {
  list: () =>
    apiFetch<any[]>('/reservations'),

  get: (id: string) =>
    apiFetch<any>(`/reservations/${id}`),

  update: (id: string, data: { status?: string }) =>
    apiFetch<any>(`/reservations/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/reservations/${id}`, { method: 'DELETE' }),
};

// Menu API
export const menuCategoriesApi = {
  list: () =>
    apiFetch<any[]>('/menu-categories'),

  create: (data: any) =>
    apiFetch<any>('/menu-categories', { method: 'POST', body: data }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/menu-categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/menu-categories/${id}`, { method: 'DELETE' }),
};

export const menuApi = {
  list: () =>
    apiFetch<any[]>('/menu'),

  create: (data: any) =>
    apiFetch<any>('/menu', { method: 'POST', body: data }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/menu/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/menu/${id}`, { method: 'DELETE' }),
};

// Special Offers API
export const offersApi = {
  list: () =>
    apiFetch<any[]>('/special-offers'),

  create: (data: any) =>
    apiFetch<any>('/special-offers', { method: 'POST', body: data }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/special-offers/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/special-offers/${id}`, { method: 'DELETE' }),
};

// Blog Categories API
export const blogCategoriesApi = {
  list: () =>
    apiFetch<any[]>('/blog/categories'),

  get: (slug: string) =>
    apiFetch<any>(`/blog/categories/${slug}`),

  create: (data: { name: string; slug: string; description?: string; color?: string }) =>
    apiFetch<any>('/blog/categories', { method: 'POST', body: data }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/blog/categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/categories/${id}`, { method: 'DELETE' }),
};

// Blog Posts API
export const blogPostsApi = {
  list: (params?: { status?: string; categoryId?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`/blog/posts${query ? '?' + query : ''}`);
  },

  get: (slug: string) =>
    apiFetch<any>(`/blog/posts/${slug}`),

  create: (data: {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    categoryId: string;
    tags?: string;
    status?: string;
  }) =>
    apiFetch<any>('/blog/posts', { method: 'POST', body: data }),

  update: (id: string, data: any) =>
    apiFetch<any>(`/blog/posts/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/posts/${id}`, { method: 'DELETE' }),
};

// Blog Comments API
export const blogCommentsApi = {
  create: (postId: string, data: { name: string; email: string; content: string }) =>
    apiFetch<any>(`/blog/posts/${postId}/comments`, { method: 'POST', body: data }),

  update: (id: string, data: { status: string }) =>
    apiFetch<any>(`/blog/comments/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/comments/${id}`, { method: 'DELETE' }),
};

