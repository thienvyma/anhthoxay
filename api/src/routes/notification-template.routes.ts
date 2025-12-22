/**
 * Notification Template Routes
 *
 * API endpoints for notification template management (Admin only).
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 17.1, 17.2, 17.3, 17.4**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import {
  CreateNotificationTemplateSchema,
  UpdateNotificationTemplateSchema,
  NotificationTemplateQuerySchema,
  RenderTemplateInputSchema,
  notificationTemplateTypeEnum,
  type CreateNotificationTemplateInput,
  type UpdateNotificationTemplateInput,
  type NotificationTemplateQuery,
  type RenderTemplateInput,
  type NotificationTemplateType,
} from '../schemas/notification-template.schema';
import { NotificationTemplateService, NotificationTemplateError } from '../services/notification-template.service';
import { successResponse, errorResponse } from '../utils/response';

// ============================================
// ADMIN NOTIFICATION TEMPLATE ROUTES
// ============================================

/**
 * Creates notification template routes for admin
 * @param prisma - Prisma client instance
 */
export function createNotificationTemplateRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const templateService = new NotificationTemplateService(prisma);

  /**
   * @route GET /
   * @description List all notification templates
   * @access Admin only
   * Requirements: 17.1
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(NotificationTemplateQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<NotificationTemplateQuery>(c);
        const templates = await templateService.listTemplates(query);
        return successResponse(c, templates);
      } catch (error) {
        if (error instanceof NotificationTemplateError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /types
   * @description Get all available template types
   * @access Admin only
   * Requirements: 17.1
   */
  app.get(
    '/types',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      const types = notificationTemplateTypeEnum.options;
      return successResponse(c, types);
    }
  );

  /**
   * @route GET /:type
   * @description Get a specific template by type
   * @access Admin only
   * Requirements: 17.1
   */
  app.get(
    '/:type',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const type = c.req.param('type') as NotificationTemplateType;
        
        // Validate type
        const parseResult = notificationTemplateTypeEnum.safeParse(type);
        if (!parseResult.success) {
          return errorResponse(c, 'INVALID_TYPE', `Invalid template type: ${type}`, 400);
        }

        const template = await templateService.getOrCreateTemplate(type);
        return successResponse(c, template);
      } catch (error) {
        if (error instanceof NotificationTemplateError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route POST /
   * @description Create a new notification template
   * @access Admin only
   * Requirements: 17.1, 17.2
   */
  app.post(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validate(CreateNotificationTemplateSchema),
    async (c) => {
      try {
        const data = getValidatedBody<CreateNotificationTemplateInput>(c);
        const template = await templateService.createTemplate(data);
        return successResponse(c, template, 201);
      } catch (error) {
        if (error instanceof NotificationTemplateError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /:type
   * @description Update an existing notification template
   * @access Admin only
   * Requirements: 17.2, 17.4
   */
  app.put(
    '/:type',
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateNotificationTemplateSchema),
    async (c) => {
      try {
        const type = c.req.param('type') as NotificationTemplateType;
        
        // Validate type
        const parseResult = notificationTemplateTypeEnum.safeParse(type);
        if (!parseResult.success) {
          return errorResponse(c, 'INVALID_TYPE', `Invalid template type: ${type}`, 400);
        }

        const data = getValidatedBody<UpdateNotificationTemplateInput>(c);
        const template = await templateService.updateTemplate(type, data);
        return successResponse(c, template);
      } catch (error) {
        if (error instanceof NotificationTemplateError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route DELETE /:type
   * @description Delete a notification template
   * @access Admin only
   */
  app.delete(
    '/:type',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const type = c.req.param('type') as NotificationTemplateType;
        
        // Validate type
        const parseResult = notificationTemplateTypeEnum.safeParse(type);
        if (!parseResult.success) {
          return errorResponse(c, 'INVALID_TYPE', `Invalid template type: ${type}`, 400);
        }

        await templateService.deleteTemplate(type);
        return successResponse(c, { success: true, message: 'Template deleted' });
      } catch (error) {
        if (error instanceof NotificationTemplateError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route POST /render
   * @description Render a template with variables (preview)
   * @access Admin only
   * Requirements: 17.3
   */
  app.post(
    '/render',
    authenticate(),
    requireRole('ADMIN'),
    validate(RenderTemplateInputSchema),
    async (c) => {
      try {
        const data = getValidatedBody<RenderTemplateInput>(c);
        const rendered = await templateService.renderTemplate(data.type, data.variables);
        return successResponse(c, rendered);
      } catch (error) {
        if (error instanceof NotificationTemplateError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route POST /seed
   * @description Seed default templates
   * @access Admin only
   * Requirements: 17.1
   */
  app.post(
    '/seed',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const count = await templateService.seedDefaultTemplates();
        return successResponse(c, { success: true, created: count });
      } catch (error) {
        if (error instanceof NotificationTemplateError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
