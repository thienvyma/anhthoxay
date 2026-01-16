/**
 * Chat Firestore Service
 *
 * Firestore implementation for chat/conversation management.
 * Stores conversations in `conversations/{conversationId}`
 * Stores messages as subcollection `conversations/{conversationId}/messages/{messageId}`
 *
 * @module services/firestore/chat.firestore
 * @requirements 6.1, 6.2
 */

import * as admin from 'firebase-admin';
import {
  BaseFirestoreService,
  SubcollectionFirestoreService,
  type QueryOptions,
  type PaginatedResult,
} from './base.firestore';
import { getFirestore } from '../firebase-admin.service';
import type {
  FirestoreConversation,
  FirestoreMessage,
  FirestoreConversationParticipant,
  MessageType,
  Attachment,
  ReadReceipt,
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

export interface ConversationWithDetails extends FirestoreConversation {
  participants?: ParticipantWithUser[];
  lastMessage?: FirestoreMessage | null;
  unreadCount?: number;
  project?: {
    id: string;
    code: string;
    title: string;
    status: string;
  } | null;
}

export interface ParticipantWithUser extends FirestoreConversationParticipant {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

export interface ConversationListResult {
  data: ConversationWithDetails[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MessageListResult {
  data: FirestoreMessage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateConversationInput {
  projectId?: string;
  participantIds: string[];
}

export interface SendMessageInput {
  content: string;
  type?: MessageType;
  attachments?: Attachment[];
}

export interface ConversationQuery {
  projectId?: string;
  page: number;
  limit: number;
}

export interface AdminConversationQuery extends ConversationQuery {
  userId?: string;
  isClosed?: boolean;
}

export interface MessageQuery {
  page: number;
  limit: number;
  before?: string;
  after?: string;
}

export interface SearchMessagesQuery {
  q: string;
  page: number;
  limit: number;
}

// ============================================
// CHAT ERROR CLASS
// ============================================

export class ChatFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ChatFirestoreError';

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
      PARTICIPANT_EXISTS: 409,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// CONVERSATION SERVICE
// ============================================

class ConversationFirestoreService extends BaseFirestoreService<FirestoreConversation> {
  constructor() {
    super('conversations');
  }

  /**
   * Get conversation by project ID
   */
  async getByProjectId(projectId: string): Promise<FirestoreConversation | null> {
    const results = await this.query({
      where: [{ field: 'projectId', operator: '==', value: projectId }],
      limit: 1,
    });
    return results[0] || null;
  }

  /**
   * Get conversations for a user (where user is participant)
   */
  async getByParticipant(
    userId: string,
    options: ConversationQuery
  ): Promise<PaginatedResult<FirestoreConversation>> {
    const { projectId, limit } = options;
    const where: QueryOptions<FirestoreConversation>['where'] = [
      { field: 'participantIds', operator: 'array-contains', value: userId },
    ];

    if (projectId) {
      where.push({ field: 'projectId', operator: '==', value: projectId });
    }

    return this.queryPaginated({
      where,
      orderBy: [{ field: 'updatedAt', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Close a conversation
   */
  async close(id: string, adminId: string): Promise<FirestoreConversation> {
    return this.update(id, {
      isClosed: true,
      closedAt: new Date(),
      closedBy: adminId,
    });
  }
}

// ============================================
// MESSAGE SERVICE
// ============================================

class MessageFirestoreService extends SubcollectionFirestoreService<FirestoreMessage> {
  constructor() {
    super('conversations', 'messages');
  }

  /**
   * Get messages with pagination
   */
  async getMessages(
    conversationId: string,
    options: MessageQuery
  ): Promise<PaginatedResult<FirestoreMessage>> {
    const { limit, before, after } = options;
    const where: QueryOptions<FirestoreMessage>['where'] = [
      { field: 'isDeleted', operator: '==', value: false },
    ];

    if (before) {
      where.push({ field: 'createdAt', operator: '<', value: new Date(before) });
    }
    if (after) {
      where.push({ field: 'createdAt', operator: '>', value: new Date(after) });
    }

    const results = await this.query(conversationId, {
      where,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: limit + 1,
    });

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return {
      data,
      hasMore,
    };
  }

  /**
   * Search messages by content
   */
  async searchMessages(
    conversationId: string,
    query: SearchMessagesQuery
  ): Promise<FirestoreMessage[]> {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia or Elasticsearch
    // This is a basic implementation that fetches all messages and filters
    const allMessages = await this.query(conversationId, {
      where: [{ field: 'isDeleted', operator: '==', value: false }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    const searchTerm = query.q.toLowerCase();
    const filtered = allMessages.filter((m) =>
      m.content.toLowerCase().includes(searchTerm)
    );

    const start = (query.page - 1) * query.limit;
    return filtered.slice(start, start + query.limit);
  }

  /**
   * Soft delete a message
   */
  async softDelete(conversationId: string, messageId: string): Promise<FirestoreMessage> {
    return this.update(conversationId, messageId, {
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<FirestoreMessage> {
    const message = await this.getById(conversationId, messageId);
    if (!message) {
      throw new ChatFirestoreError('MESSAGE_NOT_FOUND', 'Tin nhắn không tồn tại');
    }

    const readBy = message.readBy || [];
    const alreadyRead = readBy.some((r) => r.userId === userId);

    if (alreadyRead) {
      return message;
    }

    const newReadReceipt: ReadReceipt = {
      userId,
      readAt: new Date(),
    };

    return this.update(conversationId, messageId, {
      isRead: true,
      readAt: new Date(),
      readBy: [...readBy, newReadReceipt],
    });
  }
}

// ============================================
// PARTICIPANT SERVICE
// ============================================

class ParticipantFirestoreService extends SubcollectionFirestoreService<FirestoreConversationParticipant> {
  constructor() {
    super('conversations', 'participants');
  }

  /**
   * Get participant by user ID
   */
  async getByUserId(
    conversationId: string,
    userId: string
  ): Promise<FirestoreConversationParticipant | null> {
    const results = await this.query(conversationId, {
      where: [{ field: 'userId', operator: '==', value: userId }],
      limit: 1,
    });
    return results[0] || null;
  }

  /**
   * Update last read timestamp
   */
  async updateLastRead(
    conversationId: string,
    participantId: string
  ): Promise<FirestoreConversationParticipant> {
    return this.update(conversationId, participantId, {
      lastReadAt: new Date(),
    });
  }
}

// ============================================
// MAIN CHAT FIRESTORE SERVICE
// ============================================

export class ChatFirestoreService {
  private conversationService: ConversationFirestoreService;
  private messageService: MessageFirestoreService;
  private participantService: ParticipantFirestoreService;
  private db: admin.firestore.Firestore | null = null;

  constructor() {
    this.conversationService = new ConversationFirestoreService();
    this.messageService = new MessageFirestoreService();
    this.participantService = new ParticipantFirestoreService();
  }

  private async getDb(): Promise<admin.firestore.Firestore> {
    if (!this.db) {
      this.db = await getFirestore();
    }
    return this.db;
  }

  // ============================================
  // CONVERSATION OPERATIONS
  // ============================================

  /**
   * Create a new conversation
   * @requirements 6.1
   */
  async createConversation(
    input: CreateConversationInput
  ): Promise<ConversationWithDetails> {
    const { projectId, participantIds } = input;

    // Check if conversation already exists for this project
    if (projectId) {
      const existing = await this.conversationService.getByProjectId(projectId);
      if (existing) {
        return this.getConversationWithDetails(existing.id);
      }
    }

    // Create conversation
    const conversation = await this.conversationService.create({
      projectId,
      participantIds,
      isClosed: false,
    });

    // Create participant records
    for (const userId of participantIds) {
      await this.participantService.create(conversation.id, {
        conversationId: conversation.id,
        userId,
        isActive: true,
      });
    }

    logger.info('Created conversation', { conversationId: conversation.id, projectId });

    return this.getConversationWithDetails(conversation.id);
  }

  /**
   * Get conversation by ID with details
   */
  async getConversation(
    id: string,
    userId: string
  ): Promise<ConversationWithDetails | null> {
    const conversation = await this.conversationService.getById(id);
    if (!conversation) {
      return null;
    }

    // Check if user is participant
    if (!conversation.participantIds.includes(userId)) {
      throw new ChatFirestoreError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền truy cập cuộc hội thoại này'
      );
    }

    return this.getConversationWithDetails(id, userId);
  }

  /**
   * Get conversation for admin (no participant check)
   */
  async getConversationAdmin(id: string): Promise<ConversationWithDetails | null> {
    const conversation = await this.conversationService.getById(id);
    if (!conversation) {
      return null;
    }
    return this.getConversationWithDetails(id);
  }

  /**
   * List conversations for a user
   * @requirements 6.1
   */
  async listConversations(
    userId: string,
    query: ConversationQuery
  ): Promise<ConversationListResult> {
    const result = await this.conversationService.getByParticipant(userId, query);

    // Get details for each conversation
    const conversationsWithDetails = await Promise.all(
      result.data.map((c) => this.getConversationWithDetails(c.id, userId))
    );

    // Count total
    const total = await this.conversationService.count({
      where: [
        { field: 'participantIds', operator: 'array-contains', value: userId },
      ],
    });

    return {
      data: conversationsWithDetails,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * List all conversations for admin
   */
  async listConversationsAdmin(
    query: AdminConversationQuery
  ): Promise<ConversationListResult> {
    const { userId, isClosed, projectId, page, limit } = query;
    const where: QueryOptions<FirestoreConversation>['where'] = [];

    if (userId) {
      where.push({ field: 'participantIds', operator: 'array-contains', value: userId });
    }
    if (isClosed !== undefined) {
      where.push({ field: 'isClosed', operator: '==', value: isClosed });
    }
    if (projectId) {
      where.push({ field: 'projectId', operator: '==', value: projectId });
    }

    const result = await this.conversationService.queryPaginated({
      where: where.length > 0 ? where : undefined,
      orderBy: [{ field: 'updatedAt', direction: 'desc' }],
      limit,
    });

    const conversationsWithDetails = await Promise.all(
      result.data.map((c) => this.getConversationWithDetails(c.id))
    );

    const total = await this.conversationService.count({ where });

    return {
      data: conversationsWithDetails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Close a conversation
   */
  async closeConversation(
    conversationId: string,
    adminId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _reason?: string
  ): Promise<ConversationWithDetails> {
    const conversation = await this.conversationService.getById(conversationId);
    if (!conversation) {
      throw new ChatFirestoreError(
        'CONVERSATION_NOT_FOUND',
        'Cuộc hội thoại không tồn tại'
      );
    }

    if (conversation.isClosed) {
      throw new ChatFirestoreError('CONVERSATION_CLOSED', 'Cuộc hội thoại đã đóng');
    }

    await this.conversationService.close(conversationId, adminId);
    return this.getConversationWithDetails(conversationId);
  }

  // ============================================
  // MESSAGE OPERATIONS
  // ============================================

  /**
   * Send a message
   * @requirements 6.2
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    data: SendMessageInput
  ): Promise<FirestoreMessage> {
    const conversation = await this.conversationService.getById(conversationId);
    if (!conversation) {
      throw new ChatFirestoreError(
        'CONVERSATION_NOT_FOUND',
        'Cuộc hội thoại không tồn tại'
      );
    }

    if (conversation.isClosed) {
      throw new ChatFirestoreError('CONVERSATION_CLOSED', 'Cuộc hội thoại đã đóng');
    }

    // Check if sender is participant
    if (!conversation.participantIds.includes(senderId)) {
      throw new ChatFirestoreError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này'
      );
    }

    // Create message
    const message = await this.messageService.create(conversationId, {
      conversationId,
      senderId,
      content: data.content,
      type: data.type || 'TEXT',
      attachments: data.attachments,
      isRead: false,
      isDeleted: false,
    });

    // Update conversation updatedAt
    await this.conversationService.update(conversationId, {});

    logger.debug('Message sent', { conversationId, messageId: message.id });

    return message;
  }

  /**
   * Send a system message (admin only)
   */
  async sendSystemMessage(
    conversationId: string,
    adminId: string,
    content: string
  ): Promise<FirestoreMessage> {
    const conversation = await this.conversationService.getById(conversationId);
    if (!conversation) {
      throw new ChatFirestoreError(
        'CONVERSATION_NOT_FOUND',
        'Cuộc hội thoại không tồn tại'
      );
    }

    const message = await this.messageService.create(conversationId, {
      conversationId,
      senderId: adminId,
      content,
      type: 'SYSTEM',
      isRead: false,
      isDeleted: false,
    });

    await this.conversationService.update(conversationId, {});

    return message;
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    userId: string,
    query: MessageQuery
  ): Promise<MessageListResult> {
    const conversation = await this.conversationService.getById(conversationId);
    if (!conversation) {
      throw new ChatFirestoreError(
        'CONVERSATION_NOT_FOUND',
        'Cuộc hội thoại không tồn tại'
      );
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ChatFirestoreError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền xem tin nhắn trong cuộc hội thoại này'
      );
    }

    const result = await this.messageService.getMessages(conversationId, query);

    // Count total messages
    const allMessages = await this.messageService.query(conversationId, {
      where: [{ field: 'isDeleted', operator: '==', value: false }],
    });

    return {
      data: result.data,
      meta: {
        total: allMessages.length,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(allMessages.length / query.limit),
      },
    };
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<FirestoreMessage> {
    // Find the message across all conversations
    const db = await this.getDb();
    const messagesQuery = await db.collectionGroup('messages')
      .where('id', '==', messageId)
      .limit(1)
      .get();

    if (messagesQuery.empty) {
      throw new ChatFirestoreError('MESSAGE_NOT_FOUND', 'Tin nhắn không tồn tại');
    }

    const messageDoc = messagesQuery.docs[0];
    const messageData = messageDoc.data();

    if (messageData.senderId !== userId) {
      throw new ChatFirestoreError(
        'NOT_PARTICIPANT',
        'Bạn chỉ có thể xóa tin nhắn của mình'
      );
    }

    const conversationId = messageData.conversationId;
    return this.messageService.softDelete(conversationId, messageId);
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(
    conversationId: string,
    userId: string,
    query: SearchMessagesQuery
  ): Promise<MessageListResult> {
    const conversation = await this.conversationService.getById(conversationId);
    if (!conversation) {
      throw new ChatFirestoreError(
        'CONVERSATION_NOT_FOUND',
        'Cuộc hội thoại không tồn tại'
      );
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ChatFirestoreError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền tìm kiếm trong cuộc hội thoại này'
      );
    }

    const messages = await this.messageService.searchMessages(conversationId, query);

    return {
      data: messages,
      meta: {
        total: messages.length,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(messages.length / query.limit),
      },
    };
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const participant = await this.participantService.getByUserId(conversationId, userId);
    if (!participant) {
      throw new ChatFirestoreError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền truy cập cuộc hội thoại này'
      );
    }

    await this.participantService.updateLastRead(conversationId, participant.id);
  }

  /**
   * Mark a specific message as read
   */
  async markMessageAsRead(
    messageId: string,
    userId: string
  ): Promise<FirestoreMessage> {
    // Find the message
    const db = await this.getDb();
    const messagesQuery = await db.collectionGroup('messages')
      .where('id', '==', messageId)
      .limit(1)
      .get();

    if (messagesQuery.empty) {
      throw new ChatFirestoreError('MESSAGE_NOT_FOUND', 'Tin nhắn không tồn tại');
    }

    const messageDoc = messagesQuery.docs[0];
    const messageData = messageDoc.data();
    const conversationId = messageData.conversationId;

    // Check if user is participant
    const conversation = await this.conversationService.getById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new ChatFirestoreError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền truy cập tin nhắn này'
      );
    }

    return this.messageService.markAsRead(conversationId, messageId, userId);
  }

  /**
   * Get read receipts for a message
   */
  async getReadReceipts(
    messageId: string,
    userId: string
  ): Promise<ReadReceipt[]> {
    const db = await this.getDb();
    const messagesQuery = await db.collectionGroup('messages')
      .where('id', '==', messageId)
      .limit(1)
      .get();

    if (messagesQuery.empty) {
      throw new ChatFirestoreError('MESSAGE_NOT_FOUND', 'Tin nhắn không tồn tại');
    }

    const messageDoc = messagesQuery.docs[0];
    const messageData = messageDoc.data();
    const conversationId = messageData.conversationId;

    // Check if user is participant
    const conversation = await this.conversationService.getById(conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new ChatFirestoreError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền truy cập tin nhắn này'
      );
    }

    return messageData.readBy || [];
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get conversation with all details
   */
  private async getConversationWithDetails(
    conversationId: string,
    userId?: string
  ): Promise<ConversationWithDetails> {
    const conversation = await this.conversationService.getById(conversationId);
    if (!conversation) {
      throw new ChatFirestoreError(
        'CONVERSATION_NOT_FOUND',
        'Cuộc hội thoại không tồn tại'
      );
    }

    // Get participants
    const participants = await this.participantService.getAll(conversationId);

    // Get last message
    const messages = await this.messageService.query(conversationId, {
      where: [{ field: 'isDeleted', operator: '==', value: false }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 1,
    });
    const lastMessage = messages[0] || null;

    // Calculate unread count for user
    let unreadCount = 0;
    if (userId && lastMessage) {
      const userParticipant = participants.find((p) => p.userId === userId);
      if (
        userParticipant?.lastReadAt &&
        lastMessage.senderId !== userId &&
        lastMessage.createdAt > userParticipant.lastReadAt
      ) {
        unreadCount = 1;
      }
    }

    return {
      ...conversation,
      participants: participants as ParticipantWithUser[],
      lastMessage,
      unreadCount,
    };
  }

  /**
   * Set up real-time listener for conversation messages
   * @requirements 6.2 - Real-time listeners support
   */
  onMessagesSnapshot(
    conversationId: string,
    callback: (messages: FirestoreMessage[]) => void
  ): () => void {
    // This returns an unsubscribe function
    let unsubscribe: (() => void) | null = null;

    this.getDb().then((db) => {
      unsubscribe = db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
          const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as FirestoreMessage[];
          callback(messages);
        });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }

  /**
   * Set up real-time listener for user's conversations
   */
  onConversationsSnapshot(
    userId: string,
    callback: (conversations: FirestoreConversation[]) => void
  ): () => void {
    let unsubscribe: (() => void) | null = null;

    this.getDb().then((db) => {
      unsubscribe = db
        .collection('conversations')
        .where('participantIds', 'array-contains', userId)
        .orderBy('updatedAt', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
          const conversations = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as FirestoreConversation[];
          callback(conversations);
        });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}

// Export singleton instance
export const chatFirestoreService = new ChatFirestoreService();
