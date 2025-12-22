/**
 * Portal Bids API
 *
 * Contractor bid management APIs
 *
 * **Feature: code-refactoring**
 * **Requirements: 2.2, 2.3**
 */

import { fetchWithAuth, buildQueryString } from './client';
import type {
  Bid,
  CreateBidInput,
  UpdateBidInput,
  BidQuery,
  PaginatedResult,
  MatchDetails,
  Milestone,
  ContractorProfile,
  UpdateContractorProfileInput,
  VerificationStatus,
  SavedProject,
} from './types';

// ============================================
// BIDS API (Contractor)
// Requirements: 10.1-10.5, 11.1-11.5
// ============================================

export const bidsApi = {
  /**
   * Get contractor's bids with pagination and filtering
   * Requirements: 10.1
   */
  getBids: (query?: BidQuery): Promise<PaginatedResult<Bid>> =>
    fetchWithAuth(`/api/contractor/bids${buildQueryString(query || {})}`),

  /**
   * Get a specific bid by ID (contractor view)
   * Requirements: 10.2
   */
  getBid: (id: string): Promise<Bid> =>
    fetchWithAuth(`/api/contractor/bids/${id}`),

  /**
   * Create a new bid for a project
   * Requirements: 11.1-11.4
   */
  createBid: (data: CreateBidInput): Promise<Bid> =>
    fetchWithAuth('/api/contractor/bids', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing bid (only PENDING status)
   * Requirements: 10.3
   */
  updateBid: (id: string, data: UpdateBidInput): Promise<Bid> =>
    fetchWithAuth(`/api/contractor/bids/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Withdraw a bid
   * Requirements: 10.3
   */
  withdrawBid: (id: string): Promise<{ message: string; bid: Bid }> =>
    fetchWithAuth(`/api/contractor/bids/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Get match details for a selected bid (contractor view)
   * Requirements: 10.4, 10.5
   */
  getMatchDetailsByBid: (bidId: string): Promise<MatchDetails> =>
    fetchWithAuth(`/api/contractor/bids/${bidId}/match`),

  /**
   * Request milestone completion (contractor)
   */
  requestMilestone: (bidId: string, milestoneId: string, note?: string): Promise<Milestone> =>
    fetchWithAuth(`/api/contractor/bids/${bidId}/milestone/${milestoneId}/request`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),
};

// ============================================
// CONTRACTOR PROFILE API
// ============================================

export const contractorProfileApi = {
  /**
   * Get current contractor's profile
   */
  getProfile: (): Promise<ContractorProfile | null> =>
    fetchWithAuth('/api/contractor/profile'),

  /**
   * Update contractor profile
   */
  updateProfile: (data: UpdateContractorProfileInput): Promise<ContractorProfile> =>
    fetchWithAuth('/api/contractor/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Submit profile for verification
   */
  submitVerification: (): Promise<{ message: string; status: VerificationStatus }> =>
    fetchWithAuth('/api/contractor/submit-verification', {
      method: 'POST',
    }),
};

// ============================================
// SAVED PROJECTS API (Contractor)
// Requirements: 21.1-21.5
// ============================================

export const savedProjectsApi = {
  /**
   * Get saved projects
   * Requirements: 21.3
   */
  getSavedProjects: (query?: { page?: number; limit?: number }): Promise<PaginatedResult<SavedProject>> =>
    fetchWithAuth(`/api/contractor/saved-projects${buildQueryString(query || {})}`),

  /**
   * Save a project
   * Requirements: 21.1
   */
  saveProject: (projectId: string): Promise<SavedProject> =>
    fetchWithAuth(`/api/contractor/saved-projects/${projectId}`, {
      method: 'POST',
    }),

  /**
   * Unsave a project
   * Requirements: 21.2
   */
  unsaveProject: (projectId: string): Promise<void> =>
    fetchWithAuth(`/api/contractor/saved-projects/${projectId}`, {
      method: 'DELETE',
    }),

  /**
   * Check if a project is saved
   */
  isSaved: (projectId: string): Promise<{ isSaved: boolean }> =>
    fetchWithAuth(`/api/contractor/saved-projects/${projectId}/check`),
};
