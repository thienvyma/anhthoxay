// Bidding APIs - NỘI THẤT NHANH Admin Dashboard
// Projects, Bids, Matches, Escrows, Fees, Disputes
import { API_BASE, apiFetch } from './client';
import { tokenStorage } from '../store';
import type {
  Project,
  ProjectListItem,
  ProjectStatus,
  Bid,
  BidListItem,
  BidStatus,
  Escrow,
  EscrowListItem,
  EscrowStatus,
  FeeTransaction,
  FeeListItem,
  FeeStatus,
  FeeType,
  MatchDetails,
  MatchListItem,
  Dispute,
  DisputeListItem,
  DisputeStatus,
  DisputeResolutionType,
} from '../types';

// ========== PROJECTS (ADMIN) ==========
/**
 * Projects API for Admin
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 4.1-4.5, 10.1-10.6**
 */
interface ProjectsListParams {
  status?: ProjectStatus;
  regionId?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'bidDeadline' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedProjectsResponse {
  data: ProjectListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const projectsApi = {
  /**
   * List all projects with filters (Admin only)
   * Requirements: 4.1, 10.1, 10.2, 10.3
   */
  list: (params?: ProjectsListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedProjectsResponse>(`/api/admin/projects${query ? '?' + query : ''}`);
  },

  /**
   * Get project detail by ID (Admin only)
   * Requirements: 4.2, 10.4
   */
  get: (id: string) =>
    apiFetch<Project>(`/api/admin/projects/${id}`),

  /**
   * Approve project (Admin only)
   * Requirements: 4.3, 4.5, 10.5, 10.6
   */
  approve: (id: string, note?: string) =>
    apiFetch<Project>(`/api/admin/projects/${id}/approve`, {
      method: 'PUT',
      body: { note },
    }),

  /**
   * Reject project (Admin only)
   * Requirements: 4.4, 10.5, 10.6
   */
  reject: (id: string, note: string) =>
    apiFetch<Project>(`/api/admin/projects/${id}/reject`, {
      method: 'PUT',
      body: { note },
    }),
};

// ========== BIDS (ADMIN) ==========
/**
 * Bids API for Admin
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 8.1-8.5, 11.1-11.6**
 */
interface BidsListParams {
  status?: BidStatus;
  projectId?: string;
  contractorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'price' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedBidsResponse {
  data: BidListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const bidsApi = {
  /**
   * List all bids with filters (Admin only)
   * Requirements: 8.1, 11.1, 11.2, 11.3
   */
  list: (params?: BidsListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedBidsResponse>(`/api/admin/bids${query ? '?' + query : ''}`);
  },

  /**
   * Get bid detail by ID (Admin only)
   * Requirements: 8.2, 11.4
   */
  get: (id: string) =>
    apiFetch<Bid>(`/api/admin/bids/${id}`),

  /**
   * Approve bid (Admin only)
   * Requirements: 8.3, 8.5, 11.5, 11.6
   */
  approve: (id: string, note?: string) =>
    apiFetch<Bid>(`/api/admin/bids/${id}/approve`, {
      method: 'PUT',
      body: { note },
    }),

  /**
   * Reject bid (Admin only)
   * Requirements: 8.4, 11.5, 11.6
   */
  reject: (id: string, note: string) =>
    apiFetch<Bid>(`/api/admin/bids/${id}/reject`, {
      method: 'PUT',
      body: { note },
    }),
};

// ========== ESCROWS (ADMIN) ==========
/**
 * Escrows API for Admin
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 5.1-5.7**
 */
interface EscrowsListParams {
  status?: EscrowStatus;
  projectId?: string;
  homeownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedEscrowsResponse {
  data: EscrowListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const escrowsApi = {
  /**
   * List escrows with filters (Admin only)
   * Requirements: 5.1
   */
  list: (params?: EscrowsListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedEscrowsResponse>(`/api/admin/escrows${query ? '?' + query : ''}`);
  },

  /**
   * Get escrow detail by ID (Admin only)
   * Requirements: 5.2
   */
  get: (id: string) =>
    apiFetch<Escrow>(`/api/admin/escrows/${id}`),

  /**
   * Confirm escrow deposit (PENDING → HELD)
   * Requirements: 5.3
   */
  confirm: (id: string, note?: string) =>
    apiFetch<Escrow>(`/api/admin/escrows/${id}/confirm`, {
      method: 'PUT',
      body: { note },
    }),

  /**
   * Release escrow (full release)
   * Requirements: 5.4
   */
  release: (id: string, note?: string) =>
    apiFetch<Escrow>(`/api/admin/escrows/${id}/release`, {
      method: 'PUT',
      body: { note },
    }),

  /**
   * Partial release escrow
   * Requirements: 5.5
   */
  partialRelease: (id: string, amount: number, note?: string) =>
    apiFetch<Escrow>(`/api/admin/escrows/${id}/partial`, {
      method: 'PUT',
      body: { amount, note },
    }),

  /**
   * Refund escrow to homeowner
   * Requirements: 5.6
   */
  refund: (id: string, reason: string) =>
    apiFetch<Escrow>(`/api/admin/escrows/${id}/refund`, {
      method: 'PUT',
      body: { reason },
    }),

  /**
   * Mark escrow as disputed
   * Requirements: 5.7
   */
  dispute: (id: string, reason: string) =>
    apiFetch<Escrow>(`/api/admin/escrows/${id}/dispute`, {
      method: 'PUT',
      body: { reason },
    }),
};

// ========== FEE TRANSACTIONS (ADMIN) ==========
/**
 * Fee Transactions API for Admin
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 10.4, 10.5, 13.1-13.5**
 */
interface FeesListParams {
  status?: FeeStatus;
  type?: FeeType;
  userId?: string;
  projectId?: string;
  code?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'amount' | 'code' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedFeesResponse {
  data: FeeListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const feesApi = {
  /**
   * List fee transactions with filters (Admin only)
   * Requirements: 10.4, 13.1, 13.2
   */
  list: (params?: FeesListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedFeesResponse>(`/api/admin/fees${query ? '?' + query : ''}`);
  },

  /**
   * Get fee transaction detail by ID (Admin only)
   * Requirements: 13.3
   */
  get: (id: string) =>
    apiFetch<FeeTransaction>(`/api/admin/fees/${id}`),

  /**
   * Mark fee as paid (PENDING → PAID)
   * Requirements: 10.5, 13.4
   */
  markPaid: (id: string, note?: string) =>
    apiFetch<FeeTransaction>(`/api/admin/fees/${id}/paid`, {
      method: 'PUT',
      body: { note },
    }),

  /**
   * Cancel fee transaction (PENDING → CANCELLED)
   */
  cancel: (id: string, reason: string) =>
    apiFetch<FeeTransaction>(`/api/admin/fees/${id}/cancel`, {
      method: 'PUT',
      body: { reason },
    }),

  /**
   * Export fee transactions to CSV
   * Requirements: 13.5
   */
  exportCsv: async (params?: { status?: FeeStatus; type?: FeeType; userId?: string; fromDate?: string; toDate?: string }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    
    const url = `${API_BASE}/api/admin/fees/export${query ? '?' + query : ''}`;
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
    a.download = `fees-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// ========== MATCHES (ADMIN) ==========
/**
 * Matches API for Admin
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 10.1-10.3, 12.1-12.5**
 */
interface MatchesListParams {
  status?: EscrowStatus;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'matchedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedMatchesResponse {
  data: MatchListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const matchesApi = {
  /**
   * List matched projects with filters (Admin only)
   * Requirements: 10.1, 12.1, 12.2
   */
  list: (params?: MatchesListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedMatchesResponse>(`/api/admin/matches${query ? '?' + query : ''}`);
  },

  /**
   * Get match details by project ID (Admin only)
   * Requirements: 10.2, 12.3
   */
  get: (projectId: string) =>
    apiFetch<MatchDetails>(`/api/admin/matches/${projectId}`),

  /**
   * Approve a pending match (Admin only)
   * NEW: Final step - creates escrow, fee, notifies both parties
   */
  approve: (projectId: string, note?: string) =>
    apiFetch<MatchDetails>(`/api/admin/matches/${projectId}/approve`, {
      method: 'PUT',
      body: { note },
    }),

  /**
   * Reject a pending match (Admin only)
   * NEW: Reverts project to BIDDING_CLOSED, bid to REJECTED
   */
  reject: (projectId: string, note: string) =>
    apiFetch<{ project: { id: string; code: string; status: string }; bid: { id: string; code: string; status: string } }>(`/api/admin/matches/${projectId}/reject`, {
      method: 'PUT',
      body: { note },
    }),

  /**
   * Cancel match (Admin only)
   * Requirements: 10.3, 12.4, 12.5
   */
  cancel: (projectId: string, reason: string) =>
    apiFetch<{ project: Project; escrow: Escrow | null; fee: FeeTransaction | null }>(`/api/admin/matches/${projectId}/cancel`, {
      method: 'PUT',
      body: { reason },
    }),
};

// ========== DISPUTES (ADMIN) ==========
/**
 * Disputes API for Admin
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 16.3-16.6**
 */
interface DisputesListParams {
  status?: DisputeStatus;
  projectId?: string;
  raisedBy?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedDisputesResponse {
  data: DisputeListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ResolveDisputeInput {
  resolution: DisputeResolutionType;
  note: string;
}

export const disputesApi = {
  /**
   * List disputes with filters (Admin only)
   * Requirements: 16.3
   */
  list: (params?: DisputesListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedDisputesResponse>(`/api/admin/disputes${query ? '?' + query : ''}`);
  },

  /**
   * Get dispute detail by escrow ID (Admin only)
   * Requirements: 16.3
   */
  get: (escrowId: string) =>
    apiFetch<Dispute>(`/api/admin/disputes/${escrowId}`),

  /**
   * Resolve dispute (Admin only)
   * Requirements: 16.4, 16.5, 16.6
   */
  resolve: (escrowId: string, data: ResolveDisputeInput) =>
    apiFetch<Dispute>(`/api/admin/disputes/${escrowId}/resolve`, {
      method: 'PUT',
      body: data,
    }),
};
