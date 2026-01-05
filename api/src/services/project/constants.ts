/**
 * Project Service Constants
 *
 * Constants for project management including status transitions.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 7.2, 7.3**
 */

import type { ProjectStatus } from '../../schemas/project.schema';

// ============================================
// STATUS TRANSITIONS
// ============================================

/**
 * Valid status transitions for projects
 * Requirements: 2.1-2.6
 */
export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['OPEN', 'REJECTED'],
  REJECTED: ['PENDING_APPROVAL', 'CANCELLED'],
  OPEN: ['BIDDING_CLOSED', 'CANCELLED'],
  BIDDING_CLOSED: ['MATCHED', 'OPEN', 'CANCELLED'],
  MATCHED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// ============================================
// ERROR CODE MAPPINGS
// ============================================

/**
 * Map error codes to HTTP status codes
 */
export const PROJECT_ERROR_STATUS_MAP: Record<string, number> = {
  PROJECT_NOT_FOUND: 404,
  OWNER_NOT_FOUND: 404,
  CATEGORY_NOT_FOUND: 400,
  REGION_NOT_FOUND: 400,
  REGION_NOT_ACTIVE: 400,
  PROJECT_ACCESS_DENIED: 403,
  NOT_HOMEOWNER: 403,
  PROJECT_INVALID_STATUS: 400,
  PROJECT_INVALID_TRANSITION: 400,
  PROJECT_DEADLINE_PAST: 400,
  PROJECT_DEADLINE_TOO_SHORT: 400,
  PROJECT_DEADLINE_TOO_LONG: 400,
};
