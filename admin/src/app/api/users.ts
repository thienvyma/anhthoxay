// Users APIs - NỘI THẤT NHANH Admin Dashboard
// Users, Contractors, Regions
import { apiFetch } from './client';
import type {
  UserAccount,
  UserSession,
  Contractor,
  ContractorProfile,
} from '../types';

// ========== USER MANAGEMENT (ADMIN ONLY) ==========
interface UsersListParams {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

interface PaginatedUsersResponse {
  data: UserAccount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'MANAGER' | 'CONTRACTOR' | 'HOMEOWNER' | 'WORKER' | 'USER';
}

interface UpdateUserInput {
  name?: string;
  role?: 'ADMIN' | 'MANAGER' | 'CONTRACTOR' | 'HOMEOWNER' | 'WORKER' | 'USER';
  password?: string;
}

export const usersApi = {
  // List users with pagination
  list: (params?: UsersListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedUsersResponse>(`/api/users${query ? '?' + query : ''}`);
  },

  // Get user by ID
  get: (id: string) =>
    apiFetch<UserAccount>(`/api/users/${id}`),

  // Create new user
  create: (data: CreateUserInput) =>
    apiFetch<UserAccount>('/api/users', { method: 'POST', body: data }),

  // Update user
  update: (id: string, data: UpdateUserInput) =>
    apiFetch<UserAccount>(`/api/users/${id}`, { method: 'PUT', body: data }),

  // Delete user
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/users/${id}`, { method: 'DELETE' }),

  // Ban user (revoke all sessions)
  ban: (id: string) =>
    apiFetch<{ ok: boolean; sessionsRevoked: number; message: string }>(`/api/users/${id}/ban`, { method: 'POST' }),

  // Get user sessions
  getSessions: (id: string) =>
    apiFetch<UserSession[]>(`/api/users/${id}/sessions`),

  // Revoke user session
  revokeSession: (userId: string, sessionId: string) =>
    apiFetch<{ ok: boolean }>(`/api/users/${userId}/sessions/${sessionId}`, { method: 'DELETE' }),
};

// ========== CONTRACTOR MANAGEMENT (ADMIN ONLY) ==========
interface ContractorsListParams {
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  search?: string;
  page?: number;
  limit?: number;
}

interface PaginatedContractorsResponse {
  data: Contractor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface VerifyContractorInput {
  status: 'VERIFIED' | 'REJECTED';
  note?: string;
}

export const contractorsApi = {
  // List contractors with pagination and filtering
  list: (params?: ContractorsListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedContractorsResponse>(`/api/admin/contractors${query ? '?' + query : ''}`);
  },

  // Get contractor detail by ID
  get: (id: string) =>
    apiFetch<ContractorProfile>(`/api/admin/contractors/${id}`),

  // Verify or reject contractor
  verify: (id: string, data: VerifyContractorInput) =>
    apiFetch<{ success: boolean; message: string }>(`/api/admin/contractors/${id}/verify`, { method: 'PUT', body: data }),
};

// ========== REGION MANAGEMENT (ADMIN) ==========
interface RegionsListParams {
  flat?: boolean;
  parentId?: string;
  level?: number;
  isActive?: boolean;
}

interface CreateRegionInput {
  name: string;
  slug: string;
  parentId?: string | null;
  level?: number;
  isActive?: boolean;
  order?: number;
}

interface UpdateRegionInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
  isActive?: boolean;
  order?: number;
}

interface Region {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface RegionTreeNode extends Region {
  children: RegionTreeNode[];
}

export const regionsApi = {
  // List regions (flat or tree structure)
  list: (params?: RegionsListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<Region[] | RegionTreeNode[]>(`/api/regions${query ? '?' + query : ''}`);
  },

  // Get region by ID
  get: (id: string) =>
    apiFetch<Region>(`/api/regions/${id}`),

  // Create new region (Admin only)
  create: (data: CreateRegionInput) =>
    apiFetch<Region>('/api/admin/regions', { method: 'POST', body: data }),

  // Update region (Admin only)
  update: (id: string, data: UpdateRegionInput) =>
    apiFetch<Region>(`/api/admin/regions/${id}`, { method: 'PUT', body: data }),

  // Delete region (Admin only)
  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/api/admin/regions/${id}`, { method: 'DELETE' }),
};
