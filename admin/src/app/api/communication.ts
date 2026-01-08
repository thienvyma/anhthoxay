// Communication APIs - NỘI THẤT NHANH Admin Dashboard
// Notification Templates, Chat Management
import { apiFetch } from './client';
import type {
  Conversation,
  ChatMessage,
  ReadReceipt,
} from '../types';

// ========== NOTIFICATION TEMPLATES (ADMIN) ==========
/**
 * Notification Templates API for Admin
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 17.1, 17.2, 17.3, 17.4**
 */
export interface NotificationTemplate {
  id: string;
  type: string;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
  variables: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RenderedTemplate {
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
}

interface CreateNotificationTemplateInput {
  type: string;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
  variables?: string[];
}

interface UpdateNotificationTemplateInput {
  emailSubject?: string;
  emailBody?: string;
  smsBody?: string;
  inAppTitle?: string;
  inAppBody?: string;
  variables?: string[];
}

interface RenderTemplateInput {
  type: string;
  variables: Record<string, string | number | boolean>;
}

export const notificationTemplatesApi = {
  /**
   * List all notification templates (Admin only)
   * Requirements: 17.1
   */
  list: (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return apiFetch<NotificationTemplate[]>(`/api/admin/notification-templates${query}`);
  },

  /**
   * Get available template types (Admin only)
   * Requirements: 17.1
   */
  getTypes: () =>
    apiFetch<string[]>('/api/admin/notification-templates/types'),

  /**
   * Get template by type (Admin only)
   * Requirements: 17.1
   */
  get: (type: string) =>
    apiFetch<NotificationTemplate>(`/api/admin/notification-templates/${type}`),

  /**
   * Create new template (Admin only)
   * Requirements: 17.1, 17.2
   */
  create: (data: CreateNotificationTemplateInput) =>
    apiFetch<NotificationTemplate>('/api/admin/notification-templates', {
      method: 'POST',
      body: data,
    }),

  /**
   * Update template (Admin only)
   * Requirements: 17.2, 17.4
   */
  update: (type: string, data: UpdateNotificationTemplateInput) =>
    apiFetch<NotificationTemplate>(`/api/admin/notification-templates/${type}`, {
      method: 'PUT',
      body: data,
    }),

  /**
   * Delete template (Admin only)
   */
  delete: (type: string) =>
    apiFetch<{ success: boolean; message: string }>(`/api/admin/notification-templates/${type}`, {
      method: 'DELETE',
    }),

  /**
   * Render template with variables (preview) (Admin only)
   * Requirements: 17.3
   */
  render: (data: RenderTemplateInput) =>
    apiFetch<RenderedTemplate>('/api/admin/notification-templates/render', {
      method: 'POST',
      body: data,
    }),

  /**
   * Seed default templates (Admin only)
   * Requirements: 17.1
   */
  seed: () =>
    apiFetch<{ success: boolean; created: number }>('/api/admin/notification-templates/seed', {
      method: 'POST',
    }),
};

// ========== CHAT MANAGEMENT (ADMIN) ==========
/**
 * Chat API for Admin
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 14.1-14.4, 18.1-18.4**
 */
interface ConversationsListParams {
  projectId?: string;
  userId?: string;
  isClosed?: boolean;
  page?: number;
  limit?: number;
}

interface PaginatedConversationsResponse {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface MessagesListParams {
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
}

interface PaginatedMessagesResponse {
  data: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const chatApi = {
  /**
   * List all conversations with filters (Admin only)
   * Requirements: 14.1
   */
  list: (params?: ConversationsListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedConversationsResponse>(`/api/admin/chat/conversations${query ? '?' + query : ''}`);
  },

  /**
   * Get conversation by ID (Admin only)
   * Requirements: 14.2
   */
  get: (id: string) =>
    apiFetch<Conversation>(`/api/admin/chat/conversations/${id}`),

  /**
   * Get messages in a conversation (Admin only)
   * Requirements: 14.2
   */
  getMessages: (conversationId: string, params?: MessagesListParams) => {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch<PaginatedMessagesResponse>(`/api/chat/conversations/${conversationId}/messages${query ? '?' + query : ''}`);
  },

  /**
   * Send system message (Admin only)
   * Requirements: 14.3
   */
  sendSystemMessage: (conversationId: string, content: string) =>
    apiFetch<ChatMessage>(`/api/admin/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { content },
    }),

  /**
   * Close conversation (Admin only)
   * Requirements: 14.4
   */
  close: (conversationId: string, reason?: string) =>
    apiFetch<Conversation>(`/api/admin/chat/conversations/${conversationId}/close`, {
      method: 'PUT',
      body: { reason },
    }),

  /**
   * Get read receipts for a message
   * Requirements: 18.2, 18.4
   */
  getReadReceipts: (messageId: string) =>
    apiFetch<ReadReceipt[]>(`/api/chat/messages/${messageId}/read-receipts`),

  /**
   * Search messages in a conversation
   * Requirements: 19.1, 19.2
   */
  searchMessages: (conversationId: string, params: { q: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return apiFetch<PaginatedMessagesResponse>(`/api/chat/conversations/${conversationId}/search?${query}`);
  },
};
