/**
 * Notification Firestore Routes
 *
 * Handles notification operations using Firestore.
 *
 * @route /api/firestore/notifications
 * @requirements 6.3, 6.4, 6.5
 */

import { Hono } from 'hono';
import {
  firebaseAuth,
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
  notificationFirestoreService,
} from '../../services/firestore/notification.firestore';
import {
  NotificationQuerySchema,
  MarkNotificationReadSchema,
  type MarkNotificationReadInput,
} from '../../schemas/notification.schema';
import type { NotificationType } from '../../types/firestore.types';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// ============================================
// USER NOTIFICATION ROUTES
// ============================================

const notificationFirestoreRoutes = new Hono();

/**
 * @route GET /api/firestore/notifications
 * @description List user's notifications
 * @access Authenticated users
 * @requirements 6.3
 */
notificationFirestoreRoutes.get(
  '/',
  firebaseAuth(),
  validateQuery(NotificationQuerySchema),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const query = getValidatedQuery<z.infer<typeof NotificationQuerySchema>>(c);

      const result = await notificationFirestoreService.list(userId, {
        type: query.type as NotificationType | undefined,
        isRead: query.isRead,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return paginatedResponse(c, result.data, result.meta);
    } catch (error) {
      logger.error('List notifications error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list notifications', 500);
    }
  }
);

/**
 * @route GET /api/firestore/notifications/unread-count
 * @description Get unread notification count
 * @access Authenticated users
 */
notificationFirestoreRoutes.get(
  '/unread-count',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);

      const count = await notificationFirestoreService.getUnreadCount(userId);

      return successResponse(c, { count });
    } catch (error) {
      logger.error('Get unread count error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get unread count', 500);
    }
  }
);

/**
 * @route GET /api/firestore/notifications/:id
 * @description Get notification by ID
 * @access Authenticated users
 */
notificationFirestoreRoutes.get(
  '/:id',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const notificationId = c.req.param('id');

      const notification = await notificationFirestoreService.getById(
        userId,
        notificationId
      );

      if (!notification) {
        return errorResponse(c, 'NOT_FOUND', 'Thông báo không tồn tại', 404);
      }

      return successResponse(c, notification);
    } catch (error) {
      logger.error('Get notification error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get notification', 500);
    }
  }
);

/**
 * @route POST /api/firestore/notifications/:id/read
 * @description Mark notification as read
 * @access Authenticated users
 */
notificationFirestoreRoutes.post(
  '/:id/read',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const notificationId = c.req.param('id');

      const notification = await notificationFirestoreService.markRead(
        userId,
        notificationId
      );

      if (!notification) {
        return errorResponse(c, 'NOT_FOUND', 'Thông báo không tồn tại', 404);
      }

      return successResponse(c, notification);
    } catch (error) {
      logger.error('Mark notification read error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to mark notification as read', 500);
    }
  }
);

/**
 * @route POST /api/firestore/notifications/read-all
 * @description Mark all notifications as read
 * @access Authenticated users
 */
notificationFirestoreRoutes.post(
  '/read-all',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);

      const count = await notificationFirestoreService.markAllRead(userId);

      return successResponse(c, { count, message: `Đã đánh dấu ${count} thông báo là đã đọc` });
    } catch (error) {
      logger.error('Mark all notifications read error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to mark all notifications as read', 500);
    }
  }
);

/**
 * @route POST /api/firestore/notifications/read
 * @description Mark multiple notifications as read
 * @access Authenticated users
 */
notificationFirestoreRoutes.post(
  '/read',
  firebaseAuth(),
  validate(MarkNotificationReadSchema),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const data = getValidatedBody<MarkNotificationReadInput>(c);

      if (!data.notificationIds || data.notificationIds.length === 0) {
        // Mark all as read
        const count = await notificationFirestoreService.markAllRead(userId);
        return successResponse(c, { count });
      }

      // Mark specific notifications as read
      let count = 0;
      for (const id of data.notificationIds) {
        const result = await notificationFirestoreService.markRead(userId, id);
        if (result) count++;
      }

      return successResponse(c, { count });
    } catch (error) {
      logger.error('Mark notifications read error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to mark notifications as read', 500);
    }
  }
);

/**
 * @route GET /api/firestore/notifications/preferences
 * @description Get notification preferences
 * @access Authenticated users
 */
notificationFirestoreRoutes.get(
  '/preferences',
  firebaseAuth(),
  async (c) => {
    try {
      const userId = getCurrentUid(c);

      const preferences = await notificationFirestoreService.getPreferences(userId);

      return successResponse(c, preferences);
    } catch (error) {
      logger.error('Get notification preferences error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get notification preferences', 500);
    }
  }
);

// Preference update schema
const UpdatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  emailBidReceived: z.boolean().optional(),
  emailBidApproved: z.boolean().optional(),
  emailProjectMatched: z.boolean().optional(),
  emailNewMessage: z.boolean().optional(),
  emailEscrowReleased: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  smsBidReceived: z.boolean().optional(),
  smsBidApproved: z.boolean().optional(),
  smsProjectMatched: z.boolean().optional(),
  smsNewMessage: z.boolean().optional(),
  smsEscrowReleased: z.boolean().optional(),
});
type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

/**
 * @route PUT /api/firestore/notifications/preferences
 * @description Update notification preferences
 * @access Authenticated users
 */
notificationFirestoreRoutes.put(
  '/preferences',
  firebaseAuth(),
  validate(UpdatePreferencesSchema),
  async (c) => {
    try {
      const userId = getCurrentUid(c);
      const data = getValidatedBody<UpdatePreferencesInput>(c);

      const preferences = await notificationFirestoreService.updatePreferences(
        userId,
        data
      );

      return successResponse(c, preferences);
    } catch (error) {
      logger.error('Update notification preferences error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update notification preferences', 500);
    }
  }
);

export { notificationFirestoreRoutes };
