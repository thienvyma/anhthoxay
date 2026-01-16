/**
 * Scheduled Notification Firestore Routes
 *
 * Handles scheduled notification management using Firestore.
 *
 * @route /api/firestore/admin/scheduled-notifications
 * @requirements 6.5
 */

import { Hono } from 'hono';
import {
  firebaseAuth,
  requireRole,
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
  scheduledNotificationFirestoreService,
  ScheduledNotificationFirestoreError,
} from '../../services/firestore/scheduled-notification.firestore';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// ============================================
// SCHEMAS
// ============================================

const ScheduledNotificationQuerySchema = z.object({
  status: z.enum(['PENDING', 'SENT', 'CANCELLED']).optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  type: z.string().optional(),
  scheduledBefore: z.string().datetime().optional(),
  scheduledAfter: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['scheduledFor', 'createdAt']).default('scheduledFor'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
type ScheduledNotificationQuery = z.infer<typeof ScheduledNotificationQuerySchema>;

const CreateScheduledNotificationSchema = z.object({
  type: z.string().min(1),
  userId: z.string().min(1),
  projectId: z.string().optional(),
  escrowId: z.string().optional(),
  scheduledFor: z.string().datetime(),
});
type CreateScheduledNotificationInput = z.infer<typeof CreateScheduledNotificationSchema>;

// ============================================
// ADMIN SCHEDULED NOTIFICATION ROUTES
// ============================================

const scheduledNotificationFirestoreRoutes = new Hono();

/**
 * @route GET /api/firestore/admin/scheduled-notifications
 * @description List scheduled notifications
 * @access Admin only
 * @requirements 6.5
 */
scheduledNotificationFirestoreRoutes.get(
  '/',
  firebaseAuth(),
  requireRole('ADMIN'),
  validateQuery(ScheduledNotificationQuerySchema),
  async (c) => {
    try {
      const query = getValidatedQuery<ScheduledNotificationQuery>(c);

      const result = await scheduledNotificationFirestoreService.list({
        status: query.status,
        userId: query.userId,
        projectId: query.projectId,
        type: query.type,
        scheduledBefore: query.scheduledBefore ? new Date(query.scheduledBefore) : undefined,
        scheduledAfter: query.scheduledAfter ? new Date(query.scheduledAfter) : undefined,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return paginatedResponse(c, result.data, result.meta);
    } catch (error) {
      logger.error('List scheduled notifications error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list scheduled notifications', 500);
    }
  }
);

/**
 * @route GET /api/firestore/admin/scheduled-notifications/:id
 * @description Get scheduled notification by ID
 * @access Admin only
 */
scheduledNotificationFirestoreRoutes.get(
  '/:id',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const id = c.req.param('id');

      const scheduled = await scheduledNotificationFirestoreService.getById(id);

      if (!scheduled) {
        return errorResponse(c, 'NOT_FOUND', 'Scheduled notification không tồn tại', 404);
      }

      return successResponse(c, scheduled);
    } catch (error) {
      logger.error('Get scheduled notification error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get scheduled notification', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/scheduled-notifications
 * @description Create a scheduled notification
 * @access Admin only
 */
scheduledNotificationFirestoreRoutes.post(
  '/',
  firebaseAuth(),
  requireRole('ADMIN'),
  validate(CreateScheduledNotificationSchema),
  async (c) => {
    try {
      const data = getValidatedBody<CreateScheduledNotificationInput>(c);

      const scheduled = await scheduledNotificationFirestoreService.create({
        type: data.type,
        userId: data.userId,
        projectId: data.projectId,
        escrowId: data.escrowId,
        scheduledFor: new Date(data.scheduledFor),
      });

      return successResponse(c, scheduled, 201);
    } catch (error) {
      if (error instanceof ScheduledNotificationFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 404
        );
      }
      logger.error('Create scheduled notification error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create scheduled notification', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/scheduled-notifications/:id/cancel
 * @description Cancel a scheduled notification
 * @access Admin only
 */
scheduledNotificationFirestoreRoutes.post(
  '/:id/cancel',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const id = c.req.param('id');

      const scheduled = await scheduledNotificationFirestoreService.cancel(id);

      return successResponse(c, scheduled);
    } catch (error) {
      if (error instanceof ScheduledNotificationFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 404
        );
      }
      logger.error('Cancel scheduled notification error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel scheduled notification', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/scheduled-notifications/process
 * @description Process due notifications (manual trigger)
 * @access Admin only
 */
scheduledNotificationFirestoreRoutes.post(
  '/process',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const result = await scheduledNotificationFirestoreService.processDueNotifications();

      return successResponse(c, {
        ...result,
        message: `Đã xử lý ${result.processed} thông báo, ${result.failed} thất bại`,
      });
    } catch (error) {
      logger.error('Process scheduled notifications error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to process scheduled notifications', 500);
    }
  }
);

/**
 * @route GET /api/firestore/admin/scheduled-notifications/due
 * @description Get due notifications (not yet processed)
 * @access Admin only
 */
scheduledNotificationFirestoreRoutes.get(
  '/due',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const dueNotifications = await scheduledNotificationFirestoreService.getDueNotifications();

      return successResponse(c, {
        count: dueNotifications.length,
        notifications: dueNotifications,
      });
    } catch (error) {
      logger.error('Get due notifications error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get due notifications', 500);
    }
  }
);

/**
 * @route DELETE /api/firestore/admin/scheduled-notifications/project/:projectId
 * @description Cancel all pending reminders for a project
 * @access Admin only
 */
scheduledNotificationFirestoreRoutes.delete(
  '/project/:projectId',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const projectId = c.req.param('projectId');

      const count = await scheduledNotificationFirestoreService.cancelProjectReminders(projectId);

      return successResponse(c, {
        count,
        message: `Đã hủy ${count} thông báo đã lên lịch cho dự án`,
      });
    } catch (error) {
      logger.error('Cancel project reminders error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel project reminders', 500);
    }
  }
);

/**
 * @route DELETE /api/firestore/admin/scheduled-notifications/escrow/:escrowId
 * @description Cancel all pending reminders for an escrow
 * @access Admin only
 */
scheduledNotificationFirestoreRoutes.delete(
  '/escrow/:escrowId',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const escrowId = c.req.param('escrowId');

      const count = await scheduledNotificationFirestoreService.cancelEscrowReminders(escrowId);

      return successResponse(c, {
        count,
        message: `Đã hủy ${count} thông báo đã lên lịch cho escrow`,
      });
    } catch (error) {
      logger.error('Cancel escrow reminders error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel escrow reminders', 500);
    }
  }
);

export { scheduledNotificationFirestoreRoutes };
