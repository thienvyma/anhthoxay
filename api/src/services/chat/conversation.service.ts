/**
 * Chat Conversation Service
 *
 * Business logic for conversation management including creation,
 * retrieval, listing, and closing conversations.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 4.1-4.4, 5.1-5.2, 14.1, 14.4**
 */

import { PrismaClient } from '@prisma/client';
import type {
  ConversationQuery,
  AdminConversationQuery,
} from '../../schemas/chat.schema';
import {
  ChatError,
  type ConversationWithRelations,
  type ConversationListResult,
  type ParticipantInfo,
  type MessageInfo,
  type ReadReceipt,
  type Attachment,
} from './types';

// ============================================
// CONVERSATION SERVICE CLASS
// ============================================

export class ConversationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new conversation for a matched project
   * Requirements: 4.1, 4.2, 5.1 - Validate project is MATCHED with escrow HELD
   *
   * @param projectId - The project ID
   * @param userId - The user creating the conversation
   * @returns Created conversation
   */
  async createConversation(
    projectId: string,
    userId: string
  ): Promise<ConversationWithRelations> {
    // Validate project exists and is MATCHED
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        escrow: true,
        owner: { select: { id: true } },
        selectedBid: {
          include: {
            contractor: { select: { id: true } },
          },
        },
      },
    });

    if (!project) {
      throw new ChatError('PROJECT_NOT_FOUND', 'Công trình không tồn tại', 404);
    }

    if (project.status !== 'MATCHED' && project.status !== 'IN_PROGRESS') {
      throw new ChatError(
        'PROJECT_NOT_MATCHED',
        'Công trình chưa được match',
        400
      );
    }

    // Validate escrow is HELD
    if (!project.escrow || project.escrow.status !== 'HELD') {
      throw new ChatError('ESCROW_NOT_HELD', 'Escrow chưa được xác nhận', 400);
    }

    // Validate user is either homeowner or contractor
    const homeownerId = project.ownerId;
    const contractorId = project.selectedBid?.contractorId;

    if (userId !== homeownerId && userId !== contractorId) {
      throw new ChatError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền tạo cuộc hội thoại cho công trình này',
        403
      );
    }

    // Check if conversation already exists for this project
    const existingConversation = await this.prisma.conversation.findFirst({
      where: { projectId },
      include: this.getConversationInclude(),
    });

    if (existingConversation) {
      return this.transformConversation(existingConversation);
    }

    // Create conversation with both participants
    const conversation = await this.prisma.conversation.create({
      data: {
        projectId,
        participants: {
          create: [
            { userId: homeownerId },
            ...(contractorId && contractorId !== homeownerId
              ? [{ userId: contractorId }]
              : []),
          ],
        },
      },
      include: this.getConversationInclude(),
    });

    return this.transformConversation(conversation);
  }

  /**
   * Get conversation by ID
   * Requirements: 4.3 - Validate user is participant
   *
   * @param id - The conversation ID
   * @param userId - The requesting user ID
   * @returns Conversation or null
   */
  async getConversation(
    id: string,
    userId: string
  ): Promise<ConversationWithRelations | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: this.getConversationInclude(),
    });

    if (!conversation) {
      return null;
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId && p.isActive
    );

    if (!isParticipant) {
      throw new ChatError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền truy cập cuộc hội thoại này',
        403
      );
    }

    return this.transformConversation(conversation, userId);
  }

  /**
   * Get conversation by ID for admin
   * Requirements: 4.4 - Admin can access all conversations
   *
   * @param id - The conversation ID
   * @returns Conversation or null
   */
  async getConversationAdmin(
    id: string
  ): Promise<ConversationWithRelations | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: this.getConversationInclude(),
    });

    if (!conversation) {
      return null;
    }

    return this.transformConversation(conversation);
  }

  /**
   * List conversations for a user
   * Requirements: 5.2 - Return only conversations user participates in
   *
   * @param userId - The user ID
   * @param query - Query parameters
   * @returns Paginated list of conversations
   */
  async listConversations(
    userId: string,
    query: ConversationQuery
  ): Promise<ConversationListResult> {
    const { projectId, page, limit } = query;
    const skip = (page - 1) * limit;

    // Find conversations where user is active participant
    const where = {
      participants: {
        some: {
          userId,
          isActive: true,
        },
      },
      ...(projectId && { projectId }),
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: this.getConversationInclude(),
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations.map((c) => this.transformConversation(c, userId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List all conversations for admin
   * Requirements: 14.1 - Return all conversations with filters
   *
   * @param query - Query parameters
   * @returns Paginated list of conversations
   */
  async listConversationsAdmin(
    query: AdminConversationQuery
  ): Promise<ConversationListResult> {
    const { projectId, userId, isClosed, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(projectId && { projectId }),
      ...(userId && {
        participants: { some: { userId } },
      }),
      ...(isClosed !== undefined && { isClosed }),
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: this.getConversationInclude(),
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations.map((c) => this.transformConversation(c)),
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
   * Requirements: 14.4 - Prevent further messages
   *
   * @param conversationId - The conversation ID
   * @param adminId - The admin closing the conversation
   * @returns Updated conversation
   */
  async closeConversation(
    conversationId: string,
    adminId: string
  ): Promise<ConversationWithRelations> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new ChatError(
        'CONVERSATION_NOT_FOUND',
        'Cuộc hội thoại không tồn tại',
        404
      );
    }

    if (conversation.isClosed) {
      throw new ChatError('CONVERSATION_CLOSED', 'Cuộc hội thoại đã đóng', 400);
    }

    // Close conversation
    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isClosed: true,
        closedAt: new Date(),
        closedBy: adminId,
      },
      include: this.getConversationInclude(),
    });

    return this.transformConversation(updated);
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get standard include for conversation queries
   */
  getConversationInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        where: { isDeleted: false },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
      },
    };
  }

  /**
   * Parse readBy JSON string to array
   */
  parseReadBy(json: string | null): ReadReceipt[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Parse attachments JSON string to array
   */
  parseAttachments(json: string | null): Attachment[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Transform conversation from Prisma to response format
   */
  transformConversation(
    conversation: {
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
      participants: Array<{
        id: string;
        conversationId: string;
        userId: string;
        lastReadAt: Date | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        user?: {
          id: string;
          name: string;
          email: string;
          avatar: string | null;
          role: string;
        };
      }>;
      messages?: Array<{
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        type: string;
        attachments: string | null;
        isRead: boolean;
        readAt: Date | null;
        readBy: string | null;
        isDeleted: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        sender?: {
          id: string;
          name: string;
          avatar: string | null;
        };
      }>;
    },
    userId?: string
  ): ConversationWithRelations {
    const lastMessage = conversation.messages?.[0];

    // Calculate unread count for user
    let unreadCount = 0;
    if (userId) {
      const participant = conversation.participants.find(
        (p) => p.userId === userId
      );
      if (participant?.lastReadAt && lastMessage) {
        if (
          lastMessage.senderId !== userId &&
          lastMessage.createdAt > participant.lastReadAt
        ) {
          unreadCount = 1;
        }
      }
    }

    return {
      id: conversation.id,
      projectId: conversation.projectId,
      isClosed: conversation.isClosed,
      closedAt: conversation.closedAt,
      closedBy: conversation.closedBy,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      project: conversation.project,
      participants: conversation.participants.map((p) =>
        this.transformParticipant(p)
      ),
      lastMessage: lastMessage ? this.transformMessage(lastMessage) : null,
      unreadCount,
    };
  }

  /**
   * Transform participant from Prisma to response format
   */
  transformParticipant(participant: {
    id: string;
    conversationId: string;
    userId: string;
    lastReadAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      role: string;
    };
  }): ParticipantInfo {
    return {
      id: participant.id,
      conversationId: participant.conversationId,
      userId: participant.userId,
      lastReadAt: participant.lastReadAt,
      isActive: participant.isActive,
      createdAt: participant.createdAt,
      user: participant.user,
    };
  }

  /**
   * Transform message from Prisma to response format
   */
  transformMessage(message: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: string;
    attachments: string | null;
    isRead: boolean;
    readAt: Date | null;
    readBy: string | null;
    isDeleted: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    sender?: {
      id: string;
      name: string;
      avatar: string | null;
    };
  }): MessageInfo {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      attachments: this.parseAttachments(message.attachments),
      isRead: message.isRead,
      readAt: message.readAt,
      readBy: this.parseReadBy(message.readBy),
      isDeleted: message.isDeleted,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      sender: message.sender,
    };
  }
}
