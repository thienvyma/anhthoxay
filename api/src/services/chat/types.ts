/**
 * Chat Service Types
 *
 * Shared types for chat/conversation management.
 *
 * **Feature: bidding-phase4-communication**
 */

import type { Attachment } from '../../schemas/chat.schema';

// Re-export Attachment type from schema
export type { Attachment };

// ============================================
// TYPES
// ============================================

export interface ConversationWithRelations {
  id: string;
  projectId: string | null;
  isClosed: boolean;
  closedAt: Date | null;
  closedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    code: string;
    title: string;
    status: string;
  } | null;
  participants: ParticipantInfo[];
  lastMessage?: MessageInfo | null;
  unreadCount?: number;
}

export interface ParticipantInfo {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };
}

export interface MessageInfo {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  attachments: Attachment[];
  isRead: boolean;
  readAt: Date | null;
  readBy: ReadReceipt[];
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  sender?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

export interface ConversationListResult {
  data: ConversationWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MessageListResult {
  data: MessageInfo[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// CHAT ERROR CLASS
// ============================================

export class ChatError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ChatError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      CONVERSATION_NOT_FOUND: 404,
      MESSAGE_NOT_FOUND: 404,
      PROJECT_NOT_FOUND: 404,
      PARTICIPANT_NOT_FOUND: 404,
      NOT_PARTICIPANT: 403,
      CONVERSATION_CLOSED: 400,
      PROJECT_NOT_MATCHED: 400,
      ESCROW_NOT_HELD: 400,
      INVALID_MESSAGE_TYPE: 400,
      ATTACHMENT_TOO_LARGE: 400,
      INVALID_ATTACHMENT_TYPE: 400,
      PARTICIPANT_EXISTS: 409,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
