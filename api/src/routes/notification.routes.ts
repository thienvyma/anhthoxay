/**
 * Notification Routes
 *
 * API endpoints for notification management.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 13.1-13.4**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import {
  NotificationQuerySchema,
  type NotificationQuery,
} from '../schemas/notification.schema';
import {
  UpdateNotificationPreferenceSchema,
  type UpdateNotificationPreferenceInput,
} from '../schemas/notification-preference.schema';
import { NotificationService, NotificationError } from '../services/notification.service';
import { NotificationChannelService, NotificationChannelError } from '../services/notification-channel.service';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';

// ============================================
// USER NOTIFICATION ROUTES
// ============================================

/**
 * Creates notification routes for authenticated users
 * @param prisma - Prisma client instance
 */
export function createNotificationRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate } = createAuthMiddleware(prisma);
  const notificationService = new NotificationService(prisma);
  const notificationChannelService = new NotificationChannelService(prisma);

  /**
   * @route GET /
   * @description List notifications with pagination
   * @access Authenticated
   * Requirements: 13.1
   */
  app.get(
    '/',
    authenticate(),
    validateQuery(NotificationQuerySchema),
    async (c) => {
      try {
        const user = getUser(c);
        const query = getValidatedQuery<NotificationQuery>(c);
        const result = await notificationService.list(user.sub, query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof NotificationError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /:id/read
   * @description Mark a notification as read
   * @access Authenticated
   * Requirements: 13.2
   */
  app.put('/:id/read', authenticate(), async (c) => {
    try {
      const user = getUser(c);
      const id = c.req.param('id');
      const notification = await notificationService.markRead(id, user.sub);

      if (!notification) {
        return errorResponse(c, 'NOTIFICATION_NOT_FOUND', 'Thông báo không tồn tại', 404);
      }

      return successResponse(c, notification);
    } catch (error) {
      if (error instanceof NotificationError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route PUT /read-all
   * @description Mark all notifications as read
   * @access Authenticated
   * Requirements: 13.2
   */
  app.put('/read-all', authenticate(), async (c) => {
    try {
      const user = getUser(c);
      const count = await notificationService.markAllRead(user.sub);
      return successResponse(c, { success: true, count });
    } catch (error) {
      if (error instanceof NotificationError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /preferences
   * @description Get notification preferences
   * @access Authenticated
   * Requirements: 13.4
   */
  app.get('/preferences', authenticate(), async (c) => {
    try {
      const user = getUser(c);
      const preferences = await notificationChannelService.getPreferences(user.sub);
      return successResponse(c, preferences);
    } catch (error) {
      if (error instanceof NotificationChannelError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route PUT /preferences
   * @description Update notification preferences
   * @access Authenticated
   * Requirements: 13.3
   */
  app.put(
    '/preferences',
    authenticate(),
    validate(UpdateNotificationPreferenceSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const data = getValidatedBody<UpdateNotificationPreferenceInput>(c);
        const preferences = await notificationChannelService.updatePreferences(user.sub, data);
        return successResponse(c, preferences);
      } catch (error) {
        if (error instanceof NotificationChannelError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
