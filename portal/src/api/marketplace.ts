/**
 * Portal Marketplace API
 *
 * Public marketplace APIs for projects, contractors, and settings
 *
 * **Feature: code-refactoring**
 * **Requirements: 2.2, 2.3**
 */

import { fetchWithAuth, fetchWithAuthFormData, buildQueryString } from './client';
import type {
  Project,
  MarketplaceQuery,
  PaginatedResult,
  ContractorRanking,
  RankingQuery,
  Region,
  ServiceCategory,
  Notification,
  NotificationQuery,
  NotificationPreferences,
  Conversation,
  ConversationQuery,
  Message,
  MessageQuery,
  SendMessageInput,
  Activity,
  ActivityType,
  Review,
  CreateReviewInput,
  BiddingSettings,
} from './types';

// ============================================
// MARKETPLACE API
// Requirements: 9.1, 13.1, 14.1
// ============================================

export const marketplaceApi = {
  /**
   * Get public marketplace projects (OPEN status only)
   * Requirements: 9.1, 13.1
   */
  getProjects: (query?: MarketplaceQuery): Promise<PaginatedResult<Project>> =>
    fetchWithAuth(`/api/projects${buildQueryString(query || {})}`),

  /**
   * Get a specific project from marketplace (limited info)
   * Requirements: 9.3, 13.2
   */
  getProject: (id: string): Promise<Project> =>
    fetchWithAuth(`/api/projects/${id}`),

  /**
   * Get contractor rankings/directory (verified only)
   * Requirements: 14.1
   */
  getContractors: (query?: RankingQuery): Promise<PaginatedResult<ContractorRanking>> =>
    fetchWithAuth(`/api/rankings${buildQueryString(query || {})}`),

  /**
   * Get featured contractors
   * Requirements: 14.2
   */
  getFeaturedContractors: (query?: { regionId?: string; limit?: number }): Promise<ContractorRanking[]> =>
    fetchWithAuth(`/api/rankings/featured${buildQueryString(query || {})}`),

  /**
   * Get a contractor's ranking and profile
   * Requirements: 14.2
   */
  getContractorProfile: (id: string): Promise<ContractorRanking> =>
    fetchWithAuth(`/api/rankings/contractors/${id}`),

  /**
   * Get regions for filtering
   */
  getRegions: (query?: { parentId?: string; level?: number }): Promise<Region[]> =>
    fetchWithAuth(`/api/regions${buildQueryString(query || {})}`),

  /**
   * Get service categories for filtering
   */
  getCategories: (): Promise<ServiceCategory[]> =>
    fetchWithAuth('/service-categories'),
};

// ============================================
// NOTIFICATIONS API
// Requirements: 16.1-16.5
// ============================================

export const notificationsApi = {
  /**
   * Get notifications with pagination
   * Requirements: 16.1, 16.2
   */
  getNotifications: (
    query?: NotificationQuery
  ): Promise<PaginatedResult<Notification> & { unreadCount: number }> =>
    fetchWithAuth(`/api/notifications${buildQueryString(query || {})}`),

  /**
   * Mark a notification as read
   * Requirements: 16.3
   */
  markAsRead: (id: string): Promise<Notification> =>
    fetchWithAuth(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),

  /**
   * Mark all notifications as read
   * Requirements: 16.3
   */
  markAllAsRead: (): Promise<{ success: boolean; count: number }> =>
    fetchWithAuth('/api/notifications/read-all', {
      method: 'PUT',
    }),

  /**
   * Get notification preferences
   * Requirements: 16.5
   */
  getPreferences: (): Promise<NotificationPreferences> =>
    fetchWithAuth('/api/notifications/preferences'),

  /**
   * Update notification preferences
   * Requirements: 16.5
   */
  updatePreferences: (data: Partial<NotificationPreferences>): Promise<NotificationPreferences> =>
    fetchWithAuth('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============================================
// CHAT API
// Requirements: 17.1-17.5
// ============================================

export const chatApi = {
  /**
   * Get user's conversations
   * Requirements: 17.2
   */
  getConversations: (query?: ConversationQuery): Promise<PaginatedResult<Conversation>> =>
    fetchWithAuth(`/api/chat/conversations${buildQueryString(query || {})}`),

  /**
   * Get a specific conversation with messages
   * Requirements: 17.3
   */
  getConversation: (id: string): Promise<Conversation> =>
    fetchWithAuth(`/api/chat/conversations/${id}`),

  /**
   * Create a new conversation for a matched project
   * Requirements: 17.1
   */
  createConversation: (projectId: string): Promise<Conversation> =>
    fetchWithAuth('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),

  /**
   * Get messages in a conversation with pagination
   * Requirements: 17.3
   */
  getMessages: (conversationId: string, query?: MessageQuery): Promise<PaginatedResult<Message>> =>
    fetchWithAuth(
      `/api/chat/conversations/${conversationId}/messages${buildQueryString(query || {})}`
    ),

  /**
   * Send a message in a conversation
   * Requirements: 17.3
   */
  sendMessage: (conversationId: string, data: SendMessageInput): Promise<Message> =>
    fetchWithAuth(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Mark messages as read in a conversation
   * Requirements: 17.4
   */
  markAsRead: (conversationId: string): Promise<{ success: boolean }> =>
    fetchWithAuth(`/api/chat/conversations/${conversationId}/read`, {
      method: 'PUT',
    }),

  /**
   * Search messages in a conversation
   */
  searchMessages: (
    conversationId: string,
    query: { q: string; page?: number; limit?: number }
  ): Promise<PaginatedResult<Message>> =>
    fetchWithAuth(
      `/api/chat/conversations/${conversationId}/search${buildQueryString(query)}`
    ),

  /**
   * Delete a message (soft delete, sender only)
   */
  deleteMessage: (messageId: string): Promise<Message> =>
    fetchWithAuth(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
    }),

  /**
   * Get read receipts for a message
   * Requirements: 17.5
   */
  getReadReceipts: (messageId: string): Promise<{ userId: string; readAt: string }[]> =>
    fetchWithAuth(`/api/chat/messages/${messageId}/read-receipts`),
};

// ============================================
// MEDIA API (for file uploads)
// ============================================

export const mediaApi = {
  /**
   * Upload a file (for authenticated users - contractors, homeowners)
   * API endpoint: POST /media/user-upload
   */
  upload: (file: File, _folder?: string): Promise<{ url: string; filename: string; id: string }> => {
    void _folder; // Intentionally unused - API doesn't support folder parameter yet
    const formData = new FormData();
    formData.append('file', file);
    return fetchWithAuthFormData('/media/user-upload', formData);
  },

  /**
   * Upload multiple files (uploads one by one)
   */
  uploadMultiple: async (
    files: File[],
    folder?: string
  ): Promise<{ urls: string[]; filenames: string[] }> => {
    const results = await Promise.all(files.map((file) => mediaApi.upload(file, folder)));
    return {
      urls: results.map((r) => r.url),
      filenames: results.map((r) => r.filename || r.url.split('/').pop() || ''),
    };
  },

  /**
   * Delete a file by ID
   * API endpoint: DELETE /media/:id
   */
  delete: (id: string): Promise<void> =>
    fetchWithAuth(`/media/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================
// ACTIVITY HISTORY API
// Requirements: 23.1-23.4
// ============================================

export const activityApi = {
  /**
   * Get activity history
   * Requirements: 23.1, 23.2
   */
  getActivities: (query?: {
    page?: number;
    limit?: number;
    type?: ActivityType;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResult<Activity>> =>
    fetchWithAuth(`/api/user/activity${buildQueryString(query || {})}`),
};

// ============================================
// REVIEW API
// ============================================

export const reviewApi = {
  /**
   * Get reviews for a user
   */
  getReviews: (
    userId: string,
    query?: { page?: number; limit?: number }
  ): Promise<PaginatedResult<Review>> =>
    fetchWithAuth(`/api/reviews/user/${userId}${buildQueryString(query || {})}`),

  /**
   * Create a review
   */
  createReview: (data: CreateReviewInput): Promise<Review> =>
    fetchWithAuth('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Respond to a review (reviewee only)
   */
  respondToReview: (reviewId: string, response: string): Promise<Review> =>
    fetchWithAuth(`/api/reviews/${reviewId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    }),

  /**
   * Report a review
   */
  reportReview: (reviewId: string, reason: string): Promise<void> =>
    fetchWithAuth(`/api/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ============================================
// BIDDING SETTINGS API (Public)
// ============================================

export const settingsApi = {
  /**
   * Get public bidding settings
   */
  getBiddingSettings: (): Promise<BiddingSettings> =>
    fetchWithAuth('/api/settings/bidding'),
};
