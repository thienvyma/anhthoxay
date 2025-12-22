/**
 * Chat Message Service
 *
 * Business logic for message management including sending,
 * retrieving, deleting, and searching messages.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 6.1-6.4, 7.1, 12.4, 14.3, 19.1**
 */

import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification.service';
import { NotificationChannelService } from '../notification-channel.service';
import { getWebSocketHandler, type BroadcastMessage } from '../../websocket';
import type {
  SendMessageInput,
  MessageQuery,
  SearchMessagesQuery,
  Attachment,
} from '../../schemas/chat.schema';
import {
  ChatError,
  type MessageInfo,
  type MessageListResult,
  type ReadReceipt,
} from './types';

// ============================================
// MESSAGE SERVICE CLASS
// ============================================

export class MessageService {
  private prisma: PrismaClient;
  private notificationService: NotificationService;
  private notificationChannelService: NotificationChannelService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.notificationService = new NotificationService(prisma);
    this.notificationChannelService = new NotificationChannelService(prisma);
  }

  /**
   * Send a message in a conversation
   * Requirements: 6.1, 12.4 - Validate sender is participant, notify offline users
   *
   * @param conversationId - The conversation ID
   * @param senderId - The sender user ID
   * @param data - Message data
   * @returns Created message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    data: SendMessageInput
  ): Promise<MessageInfo> {
    // Validate conversation exists and is not closed
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        project: {
          select: { id: true, code: true },
        },
      },
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

    // Validate sender is active participant
    const senderParticipant = conversation.participants.find(
      (p) => p.userId === senderId && p.isActive
    );

    if (!senderParticipant) {
      throw new ChatError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này',
        403
      );
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: data.content,
        type: data.type || 'TEXT',
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Requirements: 7.1 - Broadcast message to online participants via WebSocket
    try {
      const wsHandler = getWebSocketHandler(this.prisma);
      const senderName = senderParticipant.user?.name || 'Người dùng';

      const broadcastMessage: BroadcastMessage = {
        id: message.id,
        conversationId,
        senderId,
        senderName,
        content: message.content,
        type: message.type,
        attachments: this.parseAttachments(message.attachments),
        createdAt: message.createdAt.toISOString(),
      };

      await wsHandler.broadcastToConversation(
        conversationId,
        broadcastMessage,
        senderId // Exclude sender from broadcast
      );
    } catch (error) {
      // Log error but don't fail the message send
      console.error('Failed to broadcast message via WebSocket:', error);
    }

    // Requirements: 12.4 - Notify other participants (offline users)
    try {
      const senderName = senderParticipant.user?.name || 'Người dùng';
      const projectCode = conversation.project?.code;
      const projectId = conversation.project?.id;

      // Get other active participants to notify
      const otherParticipants = conversation.participants.filter(
        (p) => p.userId !== senderId && p.isActive
      );

      for (const participant of otherParticipants) {
        // Create in-app notification
        await this.notificationService.createNewMessageNotification({
          conversationId,
          projectId,
          projectCode,
          recipientId: participant.userId,
          senderName,
        });

        // Send via configured channels (email only for messages to avoid spam)
        await this.notificationChannelService.send({
          userId: participant.userId,
          type: 'NEW_MESSAGE',
          title: 'Bạn có tin nhắn mới',
          content: `${senderName} đã gửi tin nhắn mới${projectCode ? ` trong cuộc hội thoại cho dự án ${projectCode}` : ''}.`,
          data: {
            conversationId,
            projectId,
            projectCode,
          },
          channels: ['EMAIL'],
        });
      }
    } catch (error) {
      // Log error but don't fail the message send
      console.error('Failed to send NEW_MESSAGE notifications:', error);
    }

    return this.transformMessage(message);
  }

  /**
   * Send a system message (admin only)
   * Requirements: 14.3 - Mark message as type SYSTEM
   *
   * @param conversationId - The conversation ID
   * @param adminId - The admin user ID
   * @param content - Message content
   * @returns Created message
   */
  async sendSystemMessage(
    conversationId: string,
    adminId: string,
    content: string
  ): Promise<MessageInfo> {
    // Validate conversation exists
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

    // Create system message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: adminId,
        content,
        type: 'SYSTEM',
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return this.transformMessage(message);
  }

  /**
   * Get messages in a conversation
   * Requirements: 5.3 - Return messages with pagination
   *
   * @param conversationId - The conversation ID
   * @param userId - The requesting user ID
   * @param query - Query parameters
   * @returns Paginated list of messages
   */
  async getMessages(
    conversationId: string,
    userId: string,
    query: MessageQuery
  ): Promise<MessageListResult> {
    // Validate user is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant || !participant.isActive) {
      throw new ChatError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền xem tin nhắn trong cuộc hội thoại này',
        403
      );
    }

    const { page, limit, before, after } = query;
    const skip = (page - 1) * limit;

    const where = {
      conversationId,
      isDeleted: false,
      ...(before && { createdAt: { lt: new Date(before) } }),
      ...(after && { createdAt: { gt: new Date(after) } }),
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data: messages.map((m) => this.transformMessage(m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete a message (soft delete)
   * Requirements: 6.4 - Soft-delete (mark as deleted, not remove)
   *
   * @param messageId - The message ID
   * @param userId - The user deleting the message
   * @returns Updated message
   */
  async deleteMessage(messageId: string, userId: string): Promise<MessageInfo> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { participants: true },
        },
      },
    });

    if (!message) {
      throw new ChatError('MESSAGE_NOT_FOUND', 'Tin nhắn không tồn tại', 404);
    }

    // Only sender can delete their own message
    if (message.senderId !== userId) {
      throw new ChatError(
        'NOT_PARTICIPANT',
        'Bạn chỉ có thể xóa tin nhắn của mình',
        403
      );
    }

    // Soft delete
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return this.transformMessage(updated);
  }

  /**
   * Search messages in a conversation
   * Requirements: 19.1 - Search message content
   *
   * @param conversationId - The conversation ID
   * @param userId - The requesting user ID
   * @param query - Search query
   * @returns Paginated list of matching messages
   */
  async searchMessages(
    conversationId: string,
    userId: string,
    query: SearchMessagesQuery
  ): Promise<MessageListResult> {
    // Validate user is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant || !participant.isActive) {
      throw new ChatError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền tìm kiếm trong cuộc hội thoại này',
        403
      );
    }

    const { q, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      conversationId,
      isDeleted: false,
      content: { contains: q },
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data: messages.map((m) => this.transformMessage(m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Parse readBy JSON string to array
   */
  private parseReadBy(json: string | null): ReadReceipt[] {
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
  private parseAttachments(json: string | null): Attachment[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Transform message from Prisma to response format
   */
  private transformMessage(message: {
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
