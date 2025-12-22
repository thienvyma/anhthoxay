/**
 * Scheduled Notification Routes
 *
 * API endpoints for scheduled notification management (Admin only).
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 20.1, 20.2, 20.3, 20.4**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validateQuery, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { ScheduledNotificationService, ScheduledNotificationError } from '../services/scheduled-notification';
import { ScheduledNotificationQuerySchema, type ScheduledNotificationQuery } from '../schemas/scheduled-notification.schema';

// ============================================
// ROUTE FACTORY
// ============================================

/**
 * Create admin scheduled notification routes
 * All routes require ADMIN role
 */
export function createAdminScheduledNotificationRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const scheduledNotificationService = new ScheduledNotificationService(prisma);

  // ============================================
  // LIST SCHEDULED NOTIFICATIONS
  // ============================================

  /**
   * GET / - List scheduled notifications
   * Requirements: 20.4 - Admin can view scheduled notifications
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(ScheduledNotificationQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<ScheduledNotificationQuery>(c);
        const result = await scheduledNotificationService.list(query);
        return successResponse(c, result);
      } catch (error) {
        if (error instanceof ScheduledNotificationError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  // ============================================
  // GET SCHEDULED NOTIFICATION BY ID
  // ============================================

  /**
   * GET /:id - Get scheduled notification by ID
   */
  app.get(
    '/:id',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const id = c.req.param('id');
        const notification = await scheduledNotificationService.getById(id);

        if (!notification) {
          return errorResponse(c, 'NOT_FOUND', 'Scheduled notification not found', 404);
        }

        return successResponse(c, notification);
      } catch (error) {
        if (error instanceof ScheduledNotificationError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  // ============================================
  // CANCEL SCHEDULED NOTIFICATION
  // ============================================

  /**
   * PUT /:id/cancel - Cancel a scheduled notification
   */
  app.put(
    '/:id/cancel',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const id = c.req.param('id');
        const notification = await scheduledNotificationService.cancel(id);

        if (!notification) {
          return errorResponse(c, 'NOT_FOUND', 'Scheduled notification not found or already processed', 404);
        }

        return successResponse(c, notification);
      } catch (error) {
        if (error instanceof ScheduledNotificationError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  // ============================================
  // PROCESS DUE NOTIFICATIONS (Manual trigger)
  // ============================================

  /**
   * POST /process - Manually trigger processing of due notifications
   * Requirements: 20.4 - Background job queue
   */
  app.post(
    '/process',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const result = await scheduledNotificationService.processDueNotifications();
        return successResponse(c, result);
      } catch (error) {
        if (error instanceof ScheduledNotificationError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  // ============================================
  // SCAN AND SCHEDULE (Manual trigger)
  // ============================================

  /**
   * POST /scan - Manually trigger scanning and scheduling
   * This will scan for projects/escrows that need reminders
   */
  app.post(
    '/scan',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const [bidDeadline, noBids, escrowPending] = await Promise.all([
          scheduledNotificationService.scanAndScheduleBidDeadlineReminders(),
          scheduledNotificationService.scanAndScheduleNoBidsReminders(),
          scheduledNotificationService.scanAndScheduleEscrowPendingReminders(),
        ]);

        return successResponse(c, {
          scheduled: {
            bidDeadlineReminders: bidDeadline,
            noBidsReminders: noBids,
            escrowPendingReminders: escrowPending,
          },
          total: bidDeadline + noBids + escrowPending,
        });
      } catch (error) {
        if (error instanceof ScheduledNotificationError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
