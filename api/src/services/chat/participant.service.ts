/**
 * Chat Participant Service
 *
 * Business logic for participant management including adding,
 * removing participants, and managing read status.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 3.1, 3.3, 5.4, 2.5, 18.1, 18.2, 18.4**
 */

import { PrismaClient } from '@prisma/client';
import type { Attachment } from '../../schemas/chat.schema';
import {
  ChatError,
  type ParticipantInfo,
  type MessageInfo,
  type ReadReceipt,
} from './types';

// ============================================
// PARTICIPANT SERVICE CLASS
// ============================================

export class ParticipantService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Add a participant to a conversation
   * Requirements: 3.1 - Create participant record
   *
   * @param conversationId - The conversation ID
   * @param userId - The user to add
   * @returns Created participant
   */
  async addParticipant(
    conversationId: string,
    userId: string
  ): Promise<ParticipantInfo> {
    // Check if conversation exists
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

    // Check if user already participant
    const existing = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        const updated = await this.prisma.conversationParticipant.update({
          where: { id: existing.id },
          data: { isActive: true },
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
        });
        return this.transformParticipant(updated);
      }
      throw new ChatError(
        'PARTICIPANT_EXISTS',
        'Người dùng đã là thành viên của cuộc hội thoại',
        409
      );
    }

    const participant = await this.prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId,
      },
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
    });

    return this.transformParticipant(participant);
  }

  /**
   * Remove a participant from a conversation
   * Requirements: 3.3 - Set isActive to false
   *
   * @param conversationId - The conversation ID
   * @param userId - The user to remove
   */
  async removeParticipant(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ChatError(
        'PARTICIPANT_NOT_FOUND',
        'Người dùng không phải thành viên của cuộc hội thoại',
        404
      );
    }

    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { isActive: false },
    });
  }

  /**
   * Get participants of a conversation
   *
   * @param conversationId - The conversation ID
   * @returns List of participants
   */
  async getParticipants(conversationId: string): Promise<ParticipantInfo[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
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
    });

    return participants.map((p) => this.transformParticipant(p));
  }

  /**
   * Mark messages as read
   * Requirements: 5.4 - Mark messages as read automatically
   * Requirements: 2.5 - Update isRead flag and readAt timestamp
   *
   * @param conversationId - The conversation ID
   * @param userId - The user marking as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
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
        'Bạn không có quyền trong cuộc hội thoại này',
        403
      );
    }

    const now = new Date();

    // Update participant's lastReadAt
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { lastReadAt: now },
    });

    // Get unread messages not sent by this user
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
        isDeleted: false,
      },
    });

    // Update each message's readBy array
    for (const message of unreadMessages) {
      const readBy = this.parseReadBy(message.readBy);

      // Check if user already in readBy
      if (!readBy.some((r) => r.userId === userId)) {
        readBy.push({ userId, readAt: now.toISOString() });

        await this.prisma.message.update({
          where: { id: message.id },
          data: {
            isRead: true,
            readAt: now,
            readBy: JSON.stringify(readBy),
          },
        });
      }
    }
  }

  /**
   * Get read receipts for a message
   * Requirements: 18.2, 18.4 - Show read status per participant
   *
   * @param messageId - The message ID
   * @param userId - The requesting user ID
   * @returns Read receipts with user info
   */
  async getReadReceipts(
    messageId: string,
    userId: string
  ): Promise<
    Array<{
      userId: string;
      readAt: string;
      user?: { id: string; name: string; avatar: string | null };
    }>
  > {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      throw new ChatError('MESSAGE_NOT_FOUND', 'Tin nhắn không tồn tại', 404);
    }

    // Validate user is participant
    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === userId && p.isActive
    );

    if (!isParticipant) {
      throw new ChatError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền xem thông tin này',
        403
      );
    }

    // Parse readBy array
    const readBy = this.parseReadBy(message.readBy);

    // Get user info for each read receipt
    const userIds = readBy.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return readBy.map((receipt) => ({
      userId: receipt.userId,
      readAt: receipt.readAt,
      user: userMap.get(receipt.userId),
    }));
  }

  /**
   * Mark a specific message as read by a user
   * Requirements: 18.1 - Update read status in database per participant
   *
   * @param messageId - The message ID
   * @param userId - The user marking as read
   * @returns Updated message
   */
  async markMessageAsRead(
    messageId: string,
    userId: string
  ): Promise<MessageInfo> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!message) {
      throw new ChatError('MESSAGE_NOT_FOUND', 'Tin nhắn không tồn tại', 404);
    }

    // Validate user is participant
    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === userId && p.isActive
    );

    if (!isParticipant) {
      throw new ChatError(
        'NOT_PARTICIPANT',
        'Bạn không có quyền trong cuộc hội thoại này',
        403
      );
    }

    // Don't mark own messages as read
    if (message.senderId === userId) {
      return this.transformMessage(message);
    }

    const now = new Date();
    const readBy = this.parseReadBy(message.readBy);

    // Check if user already in readBy
    if (readBy.some((r) => r.userId === userId)) {
      return this.transformMessage(message);
    }

    // Add user to readBy
    readBy.push({ userId, readAt: now.toISOString() });

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: now,
        readBy: JSON.stringify(readBy),
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return this.transformMessage(updated);
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
   * Transform participant from Prisma to response format
   */
  private transformParticipant(participant: {
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
