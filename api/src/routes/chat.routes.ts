/**
 * Chat Routes
 *
 * API endpoints for chat/conversation management.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 5.1-5.4, 6.1-6.4, 14.1-14.4**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import {
  CreateConversationSchema,
  SendMessageSchema,
  MessageQuerySchema,
  ConversationQuerySchema,
  AdminConversationQuerySchema,
  AdminSendSystemMessageSchema,
  CloseConversationSchema,
  SearchMessagesSchema,
  type CreateConversationInput,
  type SendMessageInput,
  type MessageQuery,
  type ConversationQuery,
  type AdminConversationQuery,
  type AdminSendSystemMessageInput,
  type CloseConversationInput,
  type SearchMessagesQuery,
} from '../schemas/chat.schema';
import { ChatService, ChatError } from '../services/chat';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';

// ============================================
// USER CHAT ROUTES
// ============================================

/**
 * Creates chat routes for authenticated users
 * @param prisma - Prisma client instance
 */
export function createChatRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate } = createAuthMiddleware(prisma);
  const chatService = new ChatService(prisma);

  /**
   * @route POST /conversations
   * @description Create a new conversation for a matched project
   * @access Authenticated (HOMEOWNER, CONTRACTOR)
   * Requirements: 5.1
   */
  app.post(
    '/conversations',
    authenticate(),
    validate(CreateConversationSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const data = getValidatedBody<CreateConversationInput>(c);
        const conversation = await chatService.createConversation(data.projectId, user.sub);
        return successResponse(c, conversation, 201);
      } catch (error) {
        if (error instanceof ChatError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /conversations
   * @description List user's conversations
   * @access Authenticated
   * Requirements: 5.2
   */
  app.get(
    '/conversations',
    authenticate(),
    validateQuery(ConversationQuerySchema),
    async (c) => {
      try {
        const user = getUser(c);
        const query = getValidatedQuery<ConversationQuery>(c);
        const result = await chatService.listConversations(user.sub, query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ChatError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /conversations/:id
   * @description Get conversation with messages
   * @access Authenticated (participant only)
   * Requirements: 5.3
   */
  app.get('/conversations/:id', authenticate(), async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const conversation = await chatService.getConversation(id, user.sub);
      
      if (!conversation) {
        return errorResponse(c, 'CONVERSATION_NOT_FOUND', 'Cuộc hội thoại không tồn tại', 404);
      }
      
      return successResponse(c, conversation);
    } catch (error) {
      if (error instanceof ChatError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route POST /conversations/:id/messages
   * @description Send a message in a conversation
   * @access Authenticated (participant only)
   * Requirements: 6.1, 6.2
   */
  app.post(
    '/conversations/:id/messages',
    authenticate(),
    validate(SendMessageSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const conversationId = c.req.param('id');
        const data = getValidatedBody<SendMessageInput>(c);
        const message = await chatService.sendMessage(conversationId, user.sub, data);
        return successResponse(c, message, 201);
      } catch (error) {
        if (error instanceof ChatError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /conversations/:id/messages
   * @description Get messages in a conversation with pagination
   * @access Authenticated (participant only)
   * Requirements: 5.3
   */
  app.get(
    '/conversations/:id/messages',
    authenticate(),
    validateQuery(MessageQuerySchema),
    async (c) => {
      try {
        const user = getUser(c);
        const conversationId = c.req.param('id');
        const query = getValidatedQuery<MessageQuery>(c);
        const result = await chatService.getMessages(conversationId, user.sub, query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ChatError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /conversations/:id/read
   * @description Mark messages as read
   * @access Authenticated (participant only)
   * Requirements: 5.4
   */
  app.put('/conversations/:id/read', authenticate(), async (c) => {
    try {
      const user = getUser(c);
      const conversationId = c.req.param('id');
      await chatService.markAsRead(conversationId, user.sub);
      return successResponse(c, { success: true });
    } catch (error) {
      if (error instanceof ChatError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /conversations/:id/search
   * @description Search messages in a conversation
   * @access Authenticated (participant only)
   * Requirements: 19.1
   */
  app.get(
    '/conversations/:id/search',
    authenticate(),
    validateQuery(SearchMessagesSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const conversationId = c.req.param('id');
        const query = getValidatedQuery<SearchMessagesQuery>(c);
        const result = await chatService.searchMessages(conversationId, user.sub, query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ChatError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route DELETE /messages/:id
   * @description Soft delete a message
   * @access Authenticated (sender only)
   * Requirements: 6.4
   */
  app.delete('/messages/:id', authenticate(), async (c) => {
    try {
      const user = getUser(c);
      const messageId = c.req.param('id');
      const message = await chatService.deleteMessage(messageId, user.sub);
      return successResponse(c, message);
    } catch (error) {
      if (error instanceof ChatError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /messages/:id/read-receipts
   * @description Get read receipts for a message
   * @access Authenticated (participant only)
   * Requirements: 18.2, 18.4
   */
  app.get('/messages/:id/read-receipts', authenticate(), async (c) => {
    try {
      const user = getUser(c);
      const messageId = c.req.param('id');
      const receipts = await chatService.getReadReceipts(messageId, user.sub);
      return successResponse(c, receipts);
    } catch (error) {
      if (error instanceof ChatError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route PUT /messages/:id/read
   * @description Mark a specific message as read
   * @access Authenticated (participant only)
   * Requirements: 18.1
   */
  app.put('/messages/:id/read', authenticate(), async (c) => {
    try {
      const user = getUser(c);
      const messageId = c.req.param('id');
      const message = await chatService.markMessageAsRead(messageId, user.sub);
      return successResponse(c, message);
    } catch (error) {
      if (error instanceof ChatError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  return app;
}

// ============================================
// ADMIN CHAT ROUTES
// ============================================

/**
 * Creates admin chat routes
 * @param prisma - Prisma client instance
 */
export function createAdminChatRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const chatService = new ChatService(prisma);

  /**
   * @route GET /conversations
   * @description List all conversations (admin)
   * @access Admin only
   * Requirements: 14.1
   */
  app.get(
    '/conversations',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(AdminConversationQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<AdminConversationQuery>(c);
        const result = await chatService.listConversationsAdmin(query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ChatError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /conversations/:id
   * @description Get conversation details (admin)
   * @access Admin only
   * Requirements: 14.2
   */
  app.get(
    '/conversations/:id',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const id = c.req.param('id');
        const conversation = await chatService.getConversationAdmin(id);
        
        if (!conversation) {
          return errorResponse(c, 'CONVERSATION_NOT_FOUND', 'Cuộc hội thoại không tồn tại', 404);
        }
        
        return successResponse(c, conversation);
      } catch (error) {
        if (error instanceof ChatError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route POST /conversations/:id/messages
   * @description Send system message (admin)
   * @access Admin only
   * Requirements: 14.3
   */
  app.post(
    '/conversations/:id/messages',
    authenticate(),
    requireRole('ADMIN'),
    validate(AdminSendSystemMessageSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const conversationId = c.req.param('id');
        const data = getValidatedBody<AdminSendSystemMessageInput>(c);
        const message = await chatService.sendSystemMessage(conversationId, user.sub, data.content);
        return successResponse(c, message, 201);
      } catch (error) {
        if (error instanceof ChatError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /conversations/:id/close
   * @description Close a conversation (admin)
   * @access Admin only
   * Requirements: 14.4
   */
  app.put(
    '/conversations/:id/close',
    authenticate(),
    requireRole('ADMIN'),
    validate(CloseConversationSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const conversationId = c.req.param('id');
        const data = getValidatedBody<CloseConversationInput>(c);
        const conversation = await chatService.closeConversation(
          conversationId,
          user.sub,
          data.reason
        );
        return successResponse(c, conversation);
      } catch (error) {
        if (error instanceof ChatError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
