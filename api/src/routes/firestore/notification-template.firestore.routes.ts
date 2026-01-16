/**
 * Notification Template Firestore Routes
 *
 * Handles notification template management using Firestore.
 *
 * @route /api/firestore/admin/notification-templates
 * @requirements 6.4
 */

import { Hono } from 'hono';
import {
  firebaseAuth,
  requireRole,
} from '../../middleware/firebase-auth.middleware';
import {
  validate,
  getValidatedBody,
} from '../../middleware/validation';
import {
  successResponse,
  errorResponse,
} from '../../utils/response';
import {
  notificationTemplateFirestoreService,
  NotificationTemplateFirestoreError,
  type NotificationTemplateType,
} from '../../services/firestore/notification-template.firestore';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// ============================================
// SCHEMAS
// ============================================

const NotificationTemplateTypeEnum = z.enum([
  'BID_RECEIVED',
  'BID_APPROVED',
  'BID_REJECTED',
  'BID_SELECTED',
  'BID_NOT_SELECTED',
  'PROJECT_MATCHED',
  'PROJECT_APPROVED',
  'PROJECT_REJECTED',
  'ESCROW_PENDING',
  'ESCROW_HELD',
  'ESCROW_RELEASED',
  'ESCROW_PARTIAL_RELEASED',
  'ESCROW_REFUNDED',
  'ESCROW_DISPUTED',
  'NEW_MESSAGE',
  'MILESTONE_REQUESTED',
  'MILESTONE_CONFIRMED',
  'MILESTONE_DISPUTED',
  'DISPUTE_RESOLVED',
  'BID_DEADLINE_REMINDER',
  'NO_BIDS_REMINDER',
  'ESCROW_PENDING_REMINDER',
  'REVIEW_REMINDER',
]);

const CreateTemplateSchema = z.object({
  type: NotificationTemplateTypeEnum,
  emailSubject: z.string().min(1).max(200),
  emailBody: z.string().min(1).max(10000),
  smsBody: z.string().min(1).max(500),
  inAppTitle: z.string().min(1).max(200),
  inAppBody: z.string().min(1).max(1000),
  variables: z.array(z.string()).default([]),
});
type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;

const UpdateTemplateSchema = z.object({
  emailSubject: z.string().min(1).max(200).optional(),
  emailBody: z.string().min(1).max(10000).optional(),
  smsBody: z.string().min(1).max(500).optional(),
  inAppTitle: z.string().min(1).max(200).optional(),
  inAppBody: z.string().min(1).max(1000).optional(),
  variables: z.array(z.string()).optional(),
});
type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;

const PreviewTemplateSchema = z.object({
  variables: z.record(z.string(), z.union([z.string(), z.number()])),
});
type PreviewTemplateInput = z.infer<typeof PreviewTemplateSchema>;

// ============================================
// ADMIN NOTIFICATION TEMPLATE ROUTES
// ============================================

const notificationTemplateFirestoreRoutes = new Hono();

/**
 * @route GET /api/firestore/admin/notification-templates
 * @description List all notification templates
 * @access Admin only
 * @requirements 6.4
 */
notificationTemplateFirestoreRoutes.get(
  '/',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const templates = await notificationTemplateFirestoreService.getAll();

      return successResponse(c, templates);
    } catch (error) {
      logger.error('List notification templates error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list notification templates', 500);
    }
  }
);

/**
 * @route GET /api/firestore/admin/notification-templates/types
 * @description List all available template types
 * @access Admin only
 */
notificationTemplateFirestoreRoutes.get(
  '/types',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const types = notificationTemplateFirestoreService.getDefaultTemplateTypes();

      return successResponse(c, types);
    } catch (error) {
      logger.error('List template types error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list template types', 500);
    }
  }
);

/**
 * @route GET /api/firestore/admin/notification-templates/:type
 * @description Get notification template by type
 * @access Admin only
 */
notificationTemplateFirestoreRoutes.get(
  '/:type',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const type = c.req.param('type') as NotificationTemplateType;

      const template = await notificationTemplateFirestoreService.getByType(type);

      if (!template) {
        // Return default template if exists
        const defaultTemplate = notificationTemplateFirestoreService.getDefaultTemplate(type);
        if (defaultTemplate) {
          return successResponse(c, { ...defaultTemplate, isDefault: true });
        }
        return errorResponse(c, 'NOT_FOUND', 'Template không tồn tại', 404);
      }

      return successResponse(c, template);
    } catch (error) {
      logger.error('Get notification template error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get notification template', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/notification-templates
 * @description Create a new notification template
 * @access Admin only
 */
notificationTemplateFirestoreRoutes.post(
  '/',
  firebaseAuth(),
  requireRole('ADMIN'),
  validate(CreateTemplateSchema),
  async (c) => {
    try {
      const data = getValidatedBody<CreateTemplateInput>(c);

      const template = await notificationTemplateFirestoreService.create(data);

      return successResponse(c, template, 201);
    } catch (error) {
      if (error instanceof NotificationTemplateFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 404 | 409
        );
      }
      logger.error('Create notification template error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create notification template', 500);
    }
  }
);

/**
 * @route PUT /api/firestore/admin/notification-templates/:type
 * @description Update a notification template
 * @access Admin only
 */
notificationTemplateFirestoreRoutes.put(
  '/:type',
  firebaseAuth(),
  requireRole('ADMIN'),
  validate(UpdateTemplateSchema),
  async (c) => {
    try {
      const type = c.req.param('type') as NotificationTemplateType;
      const data = getValidatedBody<UpdateTemplateInput>(c);

      const template = await notificationTemplateFirestoreService.update(type, data);

      return successResponse(c, template);
    } catch (error) {
      if (error instanceof NotificationTemplateFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 404 | 409
        );
      }
      logger.error('Update notification template error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update notification template', 500);
    }
  }
);

/**
 * @route DELETE /api/firestore/admin/notification-templates/:type
 * @description Delete a notification template
 * @access Admin only
 */
notificationTemplateFirestoreRoutes.delete(
  '/:type',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const type = c.req.param('type') as NotificationTemplateType;

      await notificationTemplateFirestoreService.delete(type);

      return successResponse(c, { ok: true });
    } catch (error) {
      if (error instanceof NotificationTemplateFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 404 | 409
        );
      }
      logger.error('Delete notification template error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete notification template', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/notification-templates/:type/preview
 * @description Preview a notification template with variables
 * @access Admin only
 */
notificationTemplateFirestoreRoutes.post(
  '/:type/preview',
  firebaseAuth(),
  requireRole('ADMIN'),
  validate(PreviewTemplateSchema),
  async (c) => {
    try {
      const type = c.req.param('type') as NotificationTemplateType;
      const data = getValidatedBody<PreviewTemplateInput>(c);

      const rendered = await notificationTemplateFirestoreService.preview(
        type,
        data.variables
      );

      return successResponse(c, rendered);
    } catch (error) {
      if (error instanceof NotificationTemplateFirestoreError) {
        return errorResponse(
          c,
          error.code,
          error.message,
          error.statusCode as 400 | 404 | 409
        );
      }
      logger.error('Preview notification template error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to preview notification template', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/notification-templates/seed
 * @description Seed default notification templates
 * @access Admin only
 */
notificationTemplateFirestoreRoutes.post(
  '/seed',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const result = await notificationTemplateFirestoreService.seedDefaults();

      return successResponse(c, {
        ...result,
        message: `Đã tạo ${result.created} templates, bỏ qua ${result.skipped} templates đã tồn tại`,
      });
    } catch (error) {
      logger.error('Seed notification templates error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to seed notification templates', 500);
    }
  }
);

/**
 * @route POST /api/firestore/admin/notification-templates/reset
 * @description Reset all templates to defaults
 * @access Admin only
 */
notificationTemplateFirestoreRoutes.post(
  '/reset',
  firebaseAuth(),
  requireRole('ADMIN'),
  async (c) => {
    try {
      const result = await notificationTemplateFirestoreService.resetToDefaults();

      return successResponse(c, {
        ...result,
        message: `Đã cập nhật ${result.updated} templates, tạo mới ${result.created} templates`,
      });
    } catch (error) {
      logger.error('Reset notification templates error:', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reset notification templates', 500);
    }
  }
);

export { notificationTemplateFirestoreRoutes };
