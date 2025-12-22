/**
 * Portal Projects API
 *
 * Homeowner project management APIs
 *
 * **Feature: code-refactoring**
 * **Requirements: 2.2, 2.3**
 */

import { fetchWithAuth, buildQueryString } from './client';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQuery,
  PaginatedResult,
  Bid,
  MatchDetails,
  Milestone,
} from './types';

// ============================================
// PROJECTS API
// Requirements: 5.1, 6.1, 7.1-7.6
// ============================================

export const projectsApi = {
  // ============================================
  // HOMEOWNER PROJECT MANAGEMENT
  // ============================================

  /**
   * Get homeowner's projects with pagination and filtering
   * Requirements: 5.1
   */
  getProjects: (query?: ProjectQuery): Promise<PaginatedResult<Project>> =>
    fetchWithAuth(`/api/homeowner/projects${buildQueryString(query || {})}`),

  /**
   * Get a specific project by ID (homeowner view)
   * Requirements: 6.1
   */
  getProject: (id: string): Promise<Project> =>
    fetchWithAuth(`/api/homeowner/projects/${id}`),

  /**
   * Create a new project
   * Requirements: 7.1-7.4
   */
  createProject: (data: CreateProjectInput): Promise<Project> =>
    fetchWithAuth('/api/homeowner/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing project (only DRAFT or REJECTED status)
   * Requirements: 7.5
   */
  updateProject: (id: string, data: UpdateProjectInput): Promise<Project> =>
    fetchWithAuth(`/api/homeowner/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Submit project for approval
   * Requirements: 7.6
   */
  submitProject: (id: string, bidDeadline?: string): Promise<Project> =>
    fetchWithAuth(`/api/homeowner/projects/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ bidDeadline }),
    }),

  /**
   * Delete a project (only DRAFT status)
   */
  deleteProject: (id: string): Promise<void> =>
    fetchWithAuth(`/api/homeowner/projects/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Get bids for a project (homeowner view - anonymized contractor info)
   * Requirements: 6.2, 6.3
   */
  getProjectBids: (
    projectId: string,
    query?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PaginatedResult<Bid>> =>
    fetchWithAuth(`/api/homeowner/projects/${projectId}/bids${buildQueryString(query || {})}`),

  // ============================================
  // MATCH MANAGEMENT (Phase 3)
  // ============================================

  /**
   * Select a bid for the project
   * Requirements: 6.4
   */
  selectBid: (projectId: string, bidId: string): Promise<MatchDetails> =>
    fetchWithAuth(`/api/homeowner/projects/${projectId}/select-bid`, {
      method: 'POST',
      body: JSON.stringify({ bidId }),
    }),

  /**
   * Get match details for a project
   * Requirements: 6.5
   */
  getMatchDetails: (projectId: string): Promise<MatchDetails> =>
    fetchWithAuth(`/api/homeowner/projects/${projectId}/match`),

  /**
   * Start the matched project (transition to IN_PROGRESS)
   */
  startProject: (projectId: string): Promise<Project> =>
    fetchWithAuth(`/api/homeowner/projects/${projectId}/start`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  /**
   * Complete the project
   */
  completeProject: (projectId: string): Promise<Project> =>
    fetchWithAuth(`/api/homeowner/projects/${projectId}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  /**
   * Cancel the match
   */
  cancelMatch: (projectId: string, reason?: string): Promise<Project> =>
    fetchWithAuth(`/api/homeowner/projects/${projectId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // ============================================
  // MILESTONE MANAGEMENT
  // ============================================

  /**
   * Confirm milestone completion (homeowner)
   */
  confirmMilestone: (projectId: string, milestoneId: string, note?: string): Promise<Milestone> =>
    fetchWithAuth(`/api/homeowner/projects/${projectId}/milestone/${milestoneId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  /**
   * Dispute a milestone (homeowner)
   */
  disputeMilestone: (projectId: string, milestoneId: string, reason: string): Promise<Milestone> =>
    fetchWithAuth(`/api/homeowner/projects/${projectId}/milestone/${milestoneId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
