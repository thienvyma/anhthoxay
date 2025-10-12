/**
 * Shared API client for Landing page
 * Only includes endpoints that actually exist in the backend
 */

const API_BASE = 'http://localhost:4202';

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
 * Blog API - WORKING ✅
 * Backend: GET /blog/posts, /blog/posts/:slug, /blog/categories, POST /blog/posts/:id/comments
 */
export const blogAPI = {
  getPosts: (params?: { status?: string; category?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    return apiFetch<any[]>(`/blog/posts${queryString ? `?${queryString}` : ''}`);
  },

  getPost: (slug: string) => {
    return apiFetch<any>(`/blog/posts/${slug}`);
  },

  getCategories: () => {
    return apiFetch<any[]>('/blog/categories');
  },

  addComment: (postId: string, data: { author: string; email: string; content: string }) => {
    return apiFetch<any>(`/blog/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Menu API - PARTIAL ⚠️
 * Backend: GET /menu (returns all menu items)
 * Note: No /menu/categories endpoint - category is just a string field
 */
export const menuAPI = {
  getItems: () => {
    return apiFetch<any[]>('/menu');
  },
};

/**
 * Gallery API - WORKING ✅
 * Backend: GET /gallery (returns media assets where isGalleryImage=true)
 */
export const galleryAPI = {
  getImages: () => {
    return apiFetch<any[]>('/gallery');
  },
};

/**
 * Special Offers API - WORKING ✅
 * Backend: GET /special-offers (public: only active offers)
 */
export const offersAPI = {
  getActive: () => {
    return apiFetch<any[]>('/special-offers');
  },
};

/**
 * Reservations API - WORKING ✅
 * Backend: POST /reservations
 */
export const reservationAPI = {
  create: (data: {
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    notes?: string;
  }) => {
    // Map frontend fields to backend fields
    return apiFetch<any>('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: data.date,
        time: data.time,
        partySize: data.guests, // Backend expects 'partySize'
        specialRequest: data.notes, // Backend expects 'specialRequest'
      }),
    });
  },
};

/**
 * Pages API - WORKING ✅
 * Backend: GET /pages/:slug
 */
export const pagesAPI = {
  getPage: (slug: string) => {
    return apiFetch<any>(`/pages/${slug}`);
  },
};

/**
 * Settings API - WORKING ✅
 * Backend: GET /settings/restaurant
 */
export const settingsAPI = {
  getRestaurantSettings: () => {
    return apiFetch<{
      name: string;
      description: string;
      address: string;
      phone: string;
      email: string;
      website: string;
      openingHours: string;
      backgroundImage?: string;
    }>(`/settings/restaurant`);
  },
};

