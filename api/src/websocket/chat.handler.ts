/**
 * WebSocket Chat Handler
 *
 * Handles real-time chat functionality including connection management,
 * message broadcasting, typing indicators, and offline message queue.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 7.1, 7.2, 7.3, 7.4**
 */

import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';

// ============================================
// TYPES
// ============================================

export interface WebSocketClient {
  userId: string;
  conversationIds: Set<string>;
  send: (data: string) => void;
  close: () => void;
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'join' | 'leave' | 'error' | 'connected' | 'queued_messages';
  conversationId?: string;
  data?: unknown;
  error?: string;
}

export interface BroadcastMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: string;
  attachments: unknown[];
  createdAt: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface QueuedMessage {
  id: string;
  conversationId: string;
  message: BroadcastMessage;
  createdAt: Date;
}

// ============================================
// WEBSOCKET HANDLER CLASS
// ============================================

export class WebSocketChatHandler {
  private prisma: PrismaClient;
  private authService: AuthService;
  
  // Map of userId -> WebSocketClient
  private clients: Map<string, WebSocketClient> = new Map();
  
  // Map of conversationId -> Set of userIds
  private conversationUsers: Map<string, Set<string>> = new Map();
  
  // Offline message queue: userId -> QueuedMessage[]
  private offlineQueue: Map<string, QueuedMessage[]> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.authService = new AuthService(prisma);
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Handle new WebSocket connection with JWT authentication
   * Requirements: 7.2 - Authenticate using JWT token
   * 
   * @param ws - WebSocket-like client with send/close methods
   * @param token - JWT access token
   * @returns User ID if authenticated, null otherwise
   */
  async handleConnection(
    ws: { send: (data: string) => void; close: () => void },
    token: string
  ): Promise<string | null> {
    // Validate JWT token
    const payload = this.authService.verifyAccessToken(token);
    
    if (!payload) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'AUTH_INVALID_TOKEN',
        data: { message: 'Token không hợp lệ hoặc đã hết hạn' },
      }));
      ws.close();
      return null;
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.authService.isBlacklisted(token);
    if (isBlacklisted) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'AUTH_TOKEN_REVOKED',
        data: { message: 'Token đã bị thu hồi' },
      }));
      ws.close();
      return null;
    }

    const userId = payload.sub;

    // Get user's conversations
    const participations = await this.prisma.conversationParticipant.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: { conversationId: true },
    });

    const conversationIds = new Set(participations.map((p) => p.conversationId));

    // Create client entry
    const client: WebSocketClient = {
      userId,
      conversationIds,
      send: ws.send.bind(ws),
      close: ws.close.bind(ws),
    };

    // Store client
    this.clients.set(userId, client);

    // Add user to conversation rooms
    for (const conversationId of conversationIds) {
      if (!this.conversationUsers.has(conversationId)) {
        this.conversationUsers.set(conversationId, new Set());
      }
      const users = this.conversationUsers.get(conversationId);
      if (users) {
        users.add(userId);
      }
    }

    // Send connection success
    ws.send(JSON.stringify({
      type: 'connected',
      data: {
        userId,
        conversationIds: Array.from(conversationIds),
      },
    }));

    // Deliver queued messages
    await this.deliverQueuedMessages(userId);

    return userId;
  }

  /**
   * Handle WebSocket disconnection
   * Requirements: 7.3 - Update online status on disconnect
   * 
   * @param userId - The disconnecting user's ID
   */
  handleDisconnection(userId: string): void {
    const client = this.clients.get(userId);
    
    if (!client) {
      return;
    }

    // Remove user from conversation rooms
    for (const conversationId of client.conversationIds) {
      const users = this.conversationUsers.get(conversationId);
      if (users) {
        users.delete(userId);
        if (users.size === 0) {
          this.conversationUsers.delete(conversationId);
        }
      }
    }

    // Remove client
    this.clients.delete(userId);
  }

  // ============================================
  // MESSAGE BROADCASTING
  // ============================================

  /**
   * Broadcast a message to all participants in a conversation
   * Requirements: 7.1 - Broadcast to all online participants immediately
   * Requirements: 7.4 - Queue messages for offline users
   * 
   * @param conversationId - The conversation ID
   * @param message - The message to broadcast
   * @param excludeUserId - Optional user ID to exclude from broadcast
   */
  async broadcastToConversation(
    conversationId: string,
    message: BroadcastMessage,
    excludeUserId?: string
  ): Promise<void> {
    // Get all participants in the conversation
    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        isActive: true,
      },
      select: { userId: true },
    });

    const wsMessage: WebSocketMessage = {
      type: 'message',
      conversationId,
      data: message,
    };

    const messageStr = JSON.stringify(wsMessage);

    for (const participant of participants) {
      const { userId } = participant;
      
      // Skip excluded user (usually the sender)
      if (excludeUserId && userId === excludeUserId) {
        continue;
      }

      const client = this.clients.get(userId);
      
      if (client) {
        // User is online - send immediately
        try {
          client.send(messageStr);
        } catch (error) {
          console.error(`Failed to send message to user ${userId}:`, error);
          // Queue message if send fails
          this.queueMessage(userId, conversationId, message);
        }
      } else {
        // User is offline - queue message
        this.queueMessage(userId, conversationId, message);
      }
    }
  }

  /**
   * Broadcast typing indicator to conversation participants
   * Requirements: 7.1 - Real-time typing indicators
   * 
   * @param conversationId - The conversation ID
   * @param userId - The user who is typing
   * @param isTyping - Whether the user is typing
   */
  async broadcastTypingIndicator(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    // Get user name for display
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const indicator: TypingIndicator = {
      conversationId,
      userId,
      userName: user?.name || 'Người dùng',
      isTyping,
    };

    const wsMessage: WebSocketMessage = {
      type: 'typing',
      conversationId,
      data: indicator,
    };

    const messageStr = JSON.stringify(wsMessage);

    // Get online users in conversation
    const onlineUsers = this.conversationUsers.get(conversationId);
    
    if (!onlineUsers) {
      return;
    }

    for (const onlineUserId of onlineUsers) {
      // Don't send typing indicator to the user who is typing
      if (onlineUserId === userId) {
        continue;
      }

      const client = this.clients.get(onlineUserId);
      if (client) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error(`Failed to send typing indicator to user ${onlineUserId}:`, error);
        }
      }
    }
  }

  /**
   * Broadcast read receipt to conversation participants
   * 
   * @param conversationId - The conversation ID
   * @param userId - The user who read the messages
   */
  async broadcastReadReceipt(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const wsMessage: WebSocketMessage = {
      type: 'read',
      conversationId,
      data: {
        userId,
        readAt: new Date().toISOString(),
      },
    };

    const messageStr = JSON.stringify(wsMessage);

    // Get online users in conversation
    const onlineUsers = this.conversationUsers.get(conversationId);
    
    if (!onlineUsers) {
      return;
    }

    for (const onlineUserId of onlineUsers) {
      // Don't send read receipt to the user who read
      if (onlineUserId === userId) {
        continue;
      }

      const client = this.clients.get(onlineUserId);
      if (client) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error(`Failed to send read receipt to user ${onlineUserId}:`, error);
        }
      }
    }
  }

  // ============================================
  // OFFLINE MESSAGE QUEUE
  // ============================================

  /**
   * Queue a message for an offline user
   * Requirements: 7.4 - Queue messages for offline users
   * 
   * @param userId - The offline user's ID
   * @param conversationId - The conversation ID
   * @param message - The message to queue
   */
  private queueMessage(
    userId: string,
    conversationId: string,
    message: BroadcastMessage
  ): void {
    if (!this.offlineQueue.has(userId)) {
      this.offlineQueue.set(userId, []);
    }

    const queue = this.offlineQueue.get(userId);
    
    // Limit queue size to prevent memory issues
    const MAX_QUEUE_SIZE = 100;
    if (queue) {
      if (queue.length >= MAX_QUEUE_SIZE) {
        // Remove oldest message
        queue.shift();
      }

      queue.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        message,
        createdAt: new Date(),
      });
    } else {
      this.offlineQueue.set(userId, [{
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        message,
        createdAt: new Date(),
      }]);
    }
  }

  /**
   * Deliver queued messages to a user when they reconnect
   * Requirements: 7.4 - Deliver on reconnection
   * 
   * @param userId - The reconnecting user's ID
   */
  private async deliverQueuedMessages(userId: string): Promise<void> {
    const queue = this.offlineQueue.get(userId);
    
    if (!queue || queue.length === 0) {
      return;
    }

    const client = this.clients.get(userId);
    
    if (!client) {
      return;
    }

    // Group messages by conversation
    const messagesByConversation = new Map<string, QueuedMessage[]>();
    
    for (const queuedMessage of queue) {
      const existing = messagesByConversation.get(queuedMessage.conversationId);
      if (existing) {
        existing.push(queuedMessage);
      } else {
        messagesByConversation.set(queuedMessage.conversationId, [queuedMessage]);
      }
    }

    // Send queued messages notification
    const wsMessage: WebSocketMessage = {
      type: 'queued_messages',
      data: {
        count: queue.length,
        conversations: Array.from(messagesByConversation.entries()).map(
          ([conversationId, messages]) => ({
            conversationId,
            count: messages.length,
            messages: messages.map((m) => m.message),
          })
        ),
      },
    };

    try {
      client.send(JSON.stringify(wsMessage));
      // Clear queue after successful delivery
      this.offlineQueue.delete(userId);
    } catch (error) {
      console.error(`Failed to deliver queued messages to user ${userId}:`, error);
    }
  }

  // ============================================
  // ONLINE STATUS
  // ============================================

  /**
   * Get list of online users in a conversation
   * 
   * @param conversationId - The conversation ID
   * @returns Array of online user IDs
   */
  getOnlineUsers(conversationId: string): string[] {
    const users = this.conversationUsers.get(conversationId);
    return users ? Array.from(users) : [];
  }

  /**
   * Check if a user is online
   * 
   * @param userId - The user ID to check
   * @returns True if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.clients.has(userId);
  }

  /**
   * Get count of online users
   * 
   * @returns Number of connected users
   */
  getOnlineCount(): number {
    return this.clients.size;
  }

  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  /**
   * Add a user to a conversation room (when they join a new conversation)
   * 
   * @param userId - The user ID
   * @param conversationId - The conversation ID
   */
  joinConversation(userId: string, conversationId: string): void {
    const client = this.clients.get(userId);
    
    if (!client) {
      return;
    }

    // Add to client's conversation set
    client.conversationIds.add(conversationId);

    // Add to conversation room
    if (!this.conversationUsers.has(conversationId)) {
      this.conversationUsers.set(conversationId, new Set());
    }
    const users = this.conversationUsers.get(conversationId);
    if (users) {
      users.add(userId);
    }

    // Notify user
    client.send(JSON.stringify({
      type: 'join',
      conversationId,
      data: { message: 'Đã tham gia cuộc hội thoại' },
    }));
  }

  /**
   * Remove a user from a conversation room
   * 
   * @param userId - The user ID
   * @param conversationId - The conversation ID
   */
  leaveConversation(userId: string, conversationId: string): void {
    const client = this.clients.get(userId);
    
    if (!client) {
      return;
    }

    // Remove from client's conversation set
    client.conversationIds.delete(conversationId);

    // Remove from conversation room
    const users = this.conversationUsers.get(conversationId);
    if (users) {
      users.delete(userId);
      if (users.size === 0) {
        this.conversationUsers.delete(conversationId);
      }
    }

    // Notify user
    client.send(JSON.stringify({
      type: 'leave',
      conversationId,
      data: { message: 'Đã rời cuộc hội thoại' },
    }));
  }

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  /**
   * Handle incoming WebSocket message from client
   * 
   * @param userId - The sender's user ID
   * @param rawMessage - The raw message string
   */
  async handleMessage(userId: string, rawMessage: string): Promise<void> {
    const client = this.clients.get(userId);
    
    if (!client) {
      return;
    }

    try {
      const message = JSON.parse(rawMessage) as WebSocketMessage;

      switch (message.type) {
        case 'typing':
          if (message.conversationId && message.data) {
            const typingData = message.data as { isTyping: boolean };
            await this.broadcastTypingIndicator(
              message.conversationId,
              userId,
              typingData.isTyping
            );
          }
          break;

        case 'read':
          if (message.conversationId) {
            await this.broadcastReadReceipt(message.conversationId, userId);
          }
          break;

        case 'join':
          if (message.conversationId) {
            // Verify user is participant before joining
            const participant = await this.prisma.conversationParticipant.findUnique({
              where: {
                conversationId_userId: {
                  conversationId: message.conversationId,
                  userId,
                },
              },
            });
            
            if (participant?.isActive) {
              this.joinConversation(userId, message.conversationId);
            }
          }
          break;

        case 'leave':
          if (message.conversationId) {
            this.leaveConversation(userId, message.conversationId);
          }
          break;

        default:
          client.send(JSON.stringify({
            type: 'error',
            error: 'UNKNOWN_MESSAGE_TYPE',
            data: { message: 'Loại tin nhắn không được hỗ trợ' },
          }));
      }
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
      client.send(JSON.stringify({
        type: 'error',
        error: 'INVALID_MESSAGE',
        data: { message: 'Tin nhắn không hợp lệ' },
      }));
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let wsHandler: WebSocketChatHandler | null = null;

/**
 * Get or create the WebSocket handler singleton
 * 
 * @param prisma - Prisma client instance
 * @returns WebSocket handler instance
 */
export function getWebSocketHandler(prisma: PrismaClient): WebSocketChatHandler {
  if (!wsHandler) {
    wsHandler = new WebSocketChatHandler(prisma);
  }
  return wsHandler;
}

/**
 * Reset the WebSocket handler (for testing)
 */
export function resetWebSocketHandler(): void {
  wsHandler = null;
}
