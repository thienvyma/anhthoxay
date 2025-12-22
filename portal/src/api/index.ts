/**
 * Portal API Client Barrel Export
 *
 * Re-exports all API modules for backward compatibility
 *
 * **Feature: code-refactoring**
 * **Requirements: 2.4**
 */

// ============================================
// CLIENT UTILITIES
// ============================================

export {
  tokenStorage,
  setAuthFailureCallback,
  fetchWithAuth,
  fetchWithAuthFormData,
  buildQueryString,
  ApiError,
} from './client';

// ============================================
// TYPES
// ============================================

export type {
  PaginationMeta,
  PaginatedResult,
  ProjectStatus,
  ServiceCategory,
  Region,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQuery,
  MarketplaceQuery,
  BidStatus,
  Attachment,
  Bid,
  CreateBidInput,
  UpdateBidInput,
  BidQuery,
  VerificationStatus,
  Certificate,
  ContractorProfile,
  Contractor,
  ContractorQuery,
  UpdateContractorProfileInput,
  NotificationType,
  Notification,
  NotificationQuery,
  NotificationPreferences,
  MessageType,
  Message,
  Conversation,
  ConversationQuery,
  MessageQuery,
  SendMessageInput,
  MatchDetails,
  Escrow,
  FeeTransaction,
  Milestone,
  ContractorRanking,
  RankingQuery,
  SavedProject,
  ActivityType,
  Activity,
  Review,
  CreateReviewInput,
  BiddingSettings,
} from './types';

// ============================================
// AUTH API
// ============================================

export { authApi } from './auth';

// ============================================
// PROJECTS API
// ============================================

export { projectsApi } from './projects';

// ============================================
// BIDS API
// ============================================

export { bidsApi, contractorProfileApi, savedProjectsApi } from './bids';

// ============================================
// MARKETPLACE API
// ============================================

export {
  marketplaceApi,
  notificationsApi,
  chatApi,
  mediaApi,
  activityApi,
  reviewApi,
  settingsApi,
} from './marketplace';

// ============================================
// BACKWARD COMPATIBLE DEFAULT EXPORT
// ============================================

import { authApi } from './auth';
import { projectsApi } from './projects';
import { bidsApi, contractorProfileApi, savedProjectsApi } from './bids';
import {
  marketplaceApi,
  notificationsApi,
  chatApi,
  mediaApi,
  activityApi,
  reviewApi,
  settingsApi,
} from './marketplace';

export default {
  auth: authApi,
  projects: projectsApi,
  bids: bidsApi,
  marketplace: marketplaceApi,
  contractorProfile: contractorProfileApi,
  notifications: notificationsApi,
  chat: chatApi,
  media: mediaApi,
  savedProjects: savedProjectsApi,
  activity: activityApi,
  review: reviewApi,
  settings: settingsApi,
};
