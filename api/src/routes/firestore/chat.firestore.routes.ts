/**
 * Chat Firestore Routes
 *
 * Handles chat/conversation operations using Firestore.
 *
 * @route /api/firestore/chat
 * @requirements 6.1, 6.2
 */

import { Hono } from 'hono';
import {
  firebaseAuth,
  requireRole,
  getCurrentUid,
} from '../../middleware/firebase-auth.middleware';
import {
  validate,
  validateQuery,
  getValidatedBody,
  getValidatedQuery,
} from '../../middleware/validation';
import {
  successResponse,
  paginatedResponse,
  errorResponse,
} from '../../utils/response';
import {
  chatFirestoreService,
  ChatFirestoreError,
} from '../../services/firestore/chat.firestore';
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
} from '../../schemas/chat.schema';
import { logger } from '../../utils/logger';

// ============================================
// USER CHAT ROUTES
// ============================================

const chatFirestoreRoutes = new Hono();

/**
 * @route GET /api/firestore/chat/conversations
 * @description List user's conversations
 * @access Authenticated users
 */
chatFirestoreRoutes.get(
  '/conversations',
  firebaseAuth(),
  validateQuery(ConversationQuerySchema),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const query = getValidatedQuery<ConversationQuery>(c);

      const result = await chatFirestoreService.listConversations(userId, {
        projectId: query.projectId,
        page: query.page,
        limit: query.limit,
      });

      return paginatedResponse(c, result.data, result.meta);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('List conversations error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list conversations', 500);
    }
  }
);

/**
 * @route GET /api/firestore/chat/conversations/:id
 * @description Get conversation by ID
 * @access Authenticated users (must be participant)
 */
chatFirestoreRoutes.get(
  '/conversations/:id',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const conversationId = c.req.param('id');

      const conversation = await chatFirestoreService.getConversation(
        conversationId,
        userId
      );

      if (!conversation) {
        return errorResponse(c, 'NOT_FOUND', 'Cuộc hội thoại không tồn tại', 404);
      }

      return successResponse(c, conversation);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Get conversation error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get conversation', 500);
    }
  }
);

/**
 * @route POST /api/firestore/chat/conversations
 * @description Create a new conversation
 * @access Authenticated users
 */
chatFirestoreRoutes.post(
  '/conversations',
  firebaseAuth(),
  validate(CreateConversationSchema),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const data = getValidatedBody<CreateConversationInput>(c);

      // Note: In real implementation, we would validate that the project exists
      // and the user is either the homeowner or the matched contractor
      const conversation = await chatFirestoreService.createConversation({
        projectId: data.projectId,
        participantIds: [userId], // Will be expanded with contractor when matched
      });

      return successResponse(c, conversation, 201);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Create conversation error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create conversation', 500);
    }
  }
);

/**
 * @route GET /api/firestore/chat/conversations/:id/messages
 * @description Get messages in a conversation
 * @access Authenticated users (must be participant)
 */
chatFirestoreRoutes.get(
  '/conversations/:id/messages',
  firebaseAuth(),
  validateQuery(MessageQuerySchema),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const conversationId = c.req.param('id');
      const query = getValidatedQuery<MessageQuery>(c);

      const result = await chatFirestoreService.getMessages(conversationId, userId, {
        page: query.page,
        limit: query.limit,
        before: query.before,
        after: query.after,
      });

      return paginatedResponse(c, result.data, result.meta);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Get messages error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get messages', 500);
    }
  }
);

/**
 * @route POST /api/firestore/chat/conversations/:id/messages
 * @description Send a message in a conversation
 * @access Authenticated users (must be participant)
 * @requirements 6.2
 */
chatFirestoreRoutes.post(
  '/conversations/:id/messages',
  firebaseAuth(),
  validate(SendMessageSchema),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const conversationId = c.req.param('id');
      const data = getValidatedBody<SendMessageInput>(c);

      const message = await chatFirestoreService.sendMessage(
        conversationId,
        userId,
        {
          content: data.content,
          type: data.type,
          attachments: data.attachments,
        }
      );

      return successResponse(c, message, 201);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Send message error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to send message', 500);
    }
  }
);

/**
 * @route DELETE /api/firestore/chat/messages/:id
 * @description Delete a message (soft delete)
 * @access Authenticated users (must be sender)
 */
chatFirestoreRoutes.delete(
  '/messages/:id',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const messageId = c.req.param('id');

      const message = await chatFirestoreService.deleteMessage(messageId, userId);

      return successResponse(c, message);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Delete message error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete message', 500);
    }
  }
);

/**
 * @route GET /api/firestore/chat/conversations/:id/search
 * @description Search messages in a conversation
 * @access Authenticated users (must be participant)
 */
chatFirestoreRoutes.get(
  '/conversations/:id/search',
  firebaseAuth(),
  validateQuery(SearchMessagesSchema),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const conversationId = c.req.param('id');
      const query = getValidatedQuery<SearchMessagesQuery>(c);

      const result = await chatFirestoreService.searchMessages(
        conversationId,
        userId,
        {
          q: query.q,
          page: query.page,
          limit: query.limit,
        }
      );

      return paginatedResponse(c, result.data, result.meta);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Search messages error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to search messages', 500);
    }
  }
);

/**
 * @route POST /api/firestore/chat/conversations/:id/read
 * @description Mark conversation as read
 * @access Authenticated users (must be participant)
 */
chatFirestoreRoutes.post(
  '/conversations/:id/read',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const conversationId = c.req.param('id');

      await chatFirestoreService.markAsRead(conversationId, userId);

      return successResponse(c, { ok: true });
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Mark as read error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to mark as read', 500);
    }
  }
);

/**
 * @route POST /api/firestore/chat/messages/:id/read
 * @description Mark a specific message as read
 * @access Authenticated users (must be participant)
 */
chatFirestoreRoutes.post(
  '/messages/:id/read',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const messageId = c.req.param('id');

      const message = await chatFirestoreService.markMessageAsRead(messageId, userId);

      return successResponse(c, message);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Mark message as read error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to mark message as read', 500);
    }
  }
);

/**
 * @route GET /api/firestore/chat/messages/:id/receipts
 * @description Get read receipts for a message
 * @access Authenticated users (must be participant)
 */
chatFirestoreRoutes.get(
  '/messages/:id/receipts',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const messageId = c.req.param('id');

      const receipts = await chatFirestoreService.getReadReceipts(messageId, userId);

      return successResponse(c, receipts);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Get read receipts error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get read receipts', 500);
    }
  }
);

// ============================================
// ADMIN CHAT ROUTES
// ============================================

const adminChatFirestoreRoutes = new Hono();

/**
 * @route GET /api/firestore/admin/chat/conversations
 * @description List all conversations (admin)
 * @access Admin, Manager
 */
adminChatFirestoreRoutes.get(
  '/conversations',
  firebaseAuth(),
  requireRole('ADMIN', 'MANAGER'),
  validateQuery(AdminConversationQuerySchema),
  async (c) => {
    try {
      const query = getValidatedQuery<AdminConversationQuery>(c);

      const result = await chatFirestoreService.listConversationsAdmin({
        projectId: query.projectId,
        userId: query.userId,
        isClosed: query.isClosed,
        page: query.page,
        limit: query.limit,
      });

      return paginatedResponse(c, result.data, result.meta);
    } catch (error) {
      logger.error('Admin list conversations error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list conversations', 500);
    }
  }
);

/**
 * @route GET /api/firestore/admin/chat/conversations/:id
 * @description Get conversation by ID (admin)
 * @access Admin, Manager
 */
adminChatFirestoreRoutes.get(
  '/conversations/:id',
  firebaseAuth(),
  requireRole('ADMIN', 'MANAGER'),
  async (c) => {
    try {
      const conversationId = c.req.param('id');

      const conversation = await chatFirestoreService.getConversationAdmin(
        conversationId
      );

      if (!conversation) {
        return errorResponse(c, 'NOT_FOUND', 'Cuộc hội thoại không tồn tại', 404);
      }

      return successResponse(c, conversation);
    } catch (error) {
      logger.error('Admin get conversation error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get conversation', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/chat/conversations/:id/system-message
 * @description Send a system message (admin)
 * @access Admin, Manager
 */
adminChatFirestoreRoutes.post(
  '/conversations/:id/system-message',
  firebaseAuth(),
  requireRole('ADMIN', 'MANAGER'),
  validate(AdminSendSystemMessageSchema),
  async (c) => {
    try {
      const adminId = getCurrentUid(c);
      const conversationId = c.req.param('id');
      const data = getValidatedBody<AdminSendSystemMessageInput>(c);

      const message = await chatFirestoreService.sendSystemMessage(
        conversationId,
        adminId,
        data.content
      );

      return successResponse(c, message, 201);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Admin send system message error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to send system message', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/chat/conversations/:id/close
 * @description Close a conversation (admin)
 * @access Admin, Manager
 */
adminChatFirestoreRoutes.post(
  '/conversations/:id/close',
  firebaseAuth(),
  requireRole('ADMIN', 'MANAGER'),
  validate(CloseConversationSchema),
  async (c) => {
    try {
      const adminId = getCurrentUid(c);
      const conversationId = c.req.param('id');
      const data = getValidatedBody<CloseConversationInput>(c);

      const conversation = await chatFirestoreService.closeConversation(
        conversationId,
        adminId,
        data.reason
      );

      return successResponse(c, conversation);
    } catch (error) {
      if (error instanceof ChatFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 403 | 404
        );
      }
      logger.error('Admin close conversation error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to close conversation', 500);
    }
  }
);

export { chatFirestoreRoutes, adminChatFirestoreRoutes };
