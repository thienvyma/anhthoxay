/**
 * Chat Service Module
 *
 * Barrel export for chat services. Provides backward compatible
 * ChatService class that composes all sub-services.
 *
 * **Feature: bidding-phase4-communication**
 */

import { PrismaClient } from '@prisma/client';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { ParticipantService } from './participant.service';

// Re-export all types
export * from './types';

// Re-export individual services
export { ConversationService } from './conversation.service';
export { MessageService } from './message.service';
export { ParticipantService } from './participant.service';

// ============================================
// BACKWARD COMPATIBLE CHAT SERVICE
// ============================================

/**
 * ChatService - Backward compatible class that composes all chat sub-services
 *
 * This class maintains the same interface as the original ChatService
 * while delegating to the new focused service modules.
 */
export class ChatService {
  private conversationService: ConversationService;
  private messageService: MessageService;
  private participantService: ParticipantService;

  constructor(prisma: PrismaClient) {
    this.conversationService = new ConversationService(prisma);
    this.messageService = new MessageService(prisma);
    this.participantService = new ParticipantService(prisma);
  }

  // ============================================
  // CONVERSATION METHODS
  // ============================================

  createConversation(projectId: string, userId: string) {
    return this.conversationService.createConversation(projectId, userId);
  }

  getConversation(id: string, userId: string) {
    return this.conversationService.getConversation(id, userId);
  }

  getConversationAdmin(id: string) {
    return this.conversationService.getConversationAdmin(id);
  }

  listConversations(
    userId: string,
    query: Parameters<ConversationService['listConversations']>[1]
  ) {
    return this.conversationService.listConversations(userId, query);
  }

  listConversationsAdmin(
    query: Parameters<ConversationService['listConversationsAdmin']>[0]
  ) {
    return this.conversationService.listConversationsAdmin(query);
  }

  closeConversation(conversationId: string, adminId: string, reason?: string) {
    return this.closeConversationWithReason(conversationId, adminId, reason);
  }

  /**
   * Close conversation with optional system message
   */
  async closeConversationWithReason(
    conversationId: string,
    adminId: string,
    reason?: string
  ) {
    const result =
      await this.conversationService.closeConversation(conversationId, adminId);

    // Send system message about closure
    if (reason) {
      await this.messageService.sendSystemMessage(
        conversationId,
        adminId,
        `Cuộc hội thoại đã được đóng. Lý do: ${reason}`
      );
    } else {
      await this.messageService.sendSystemMessage(
        conversationId,
        adminId,
        'Cuộc hội thoại đã được đóng bởi quản trị viên.'
      );
    }

    return result;
  }

  // ============================================
  // MESSAGE METHODS
  // ============================================

  sendMessage(
    conversationId: string,
    senderId: string,
    data: Parameters<MessageService['sendMessage']>[2]
  ) {
    return this.messageService.sendMessage(conversationId, senderId, data);
  }

  sendSystemMessage(
    conversationId: string,
    adminId: string,
    content: string
  ) {
    return this.messageService.sendSystemMessage(
      conversationId,
      adminId,
      content
    );
  }

  getMessages(
    conversationId: string,
    userId: string,
    query: Parameters<MessageService['getMessages']>[2]
  ) {
    return this.messageService.getMessages(conversationId, userId, query);
  }

  deleteMessage(messageId: string, userId: string) {
    return this.messageService.deleteMessage(messageId, userId);
  }

  searchMessages(
    conversationId: string,
    userId: string,
    query: Parameters<MessageService['searchMessages']>[2]
  ) {
    return this.messageService.searchMessages(conversationId, userId, query);
  }

  // ============================================
  // PARTICIPANT METHODS
  // ============================================

  addParticipant(conversationId: string, userId: string) {
    return this.participantService.addParticipant(conversationId, userId);
  }

  removeParticipant(conversationId: string, userId: string) {
    return this.participantService.removeParticipant(conversationId, userId);
  }

  getParticipants(conversationId: string) {
    return this.participantService.getParticipants(conversationId);
  }

  markAsRead(conversationId: string, userId: string) {
    return this.participantService.markAsRead(conversationId, userId);
  }

  getReadReceipts(messageId: string, userId: string) {
    return this.participantService.getReadReceipts(messageId, userId);
  }

  markMessageAsRead(messageId: string, userId: string) {
    return this.participantService.markMessageAsRead(messageId, userId);
  }
}
