/**
 * Notification Templates Firestore Routes
 *
 * Routes for managing notification templates using Firestore backend.
 * Includes CRUD operations and template rendering.
 *
 * @module routes/firestore/notification-templates.firestore.routes
 * @requirements 25.2
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { firebaseAuth, requireRole } from '../../middleware/firebase-auth.middleware';
import { successResponse, errorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

interface NotificationTemplate {
  id: string;
  type: string;
  name: string;
  emailSubject?: string;
  emailBody?: string;
  smsBody?: string;
  inAppTitle?: string;
  inAppBody?: string;
  variables: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RenderedTemplate {
  subject?: string;
  body?: string;
  sms?: string;
  title?: string;
  content?: string;
}

// ============================================
// ZOD SCHEMAS
// ============================================

const UpdateNotificationTemplateSchema = z.object({
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  smsBody: z.string().optional(),
  inAppTitle: z.string().optional(),
  inAppBody: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

const RenderTemplateSchema = z.object({
  template: z.string(),
  variables: z.record(z.string()).optional(),
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function renderTemplate(
  template: string,
  variables: Record<string, string> = {}
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return result;
}

function getTemplateTypes(): string[] {
  return [
    'welcome',
    'password_reset',
    'email_verification',
    'project_created',
    'bid_received',
    'bid_accepted',
    'bid_rejected',
    'payment_received',
    'project_completed',
    'review_received',
  ];
}

// ============================================
// NOTIFICATION TEMPLATES ROUTES
// ============================================

export function createNotificationTemplatesFirestoreRoutes() {
  const app = new Hono();

  // ============================================
  // GET / - List all notification templates
  // ============================================
  app.get('/', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      // TODO: Implement Firestore query for notification templates
      // For now, return mock data
      const mockTemplates: NotificationTemplate[] = [
        {
          id: 'welcome',
          type: 'welcome',
          name: 'Welcome Email',
          emailSubject: 'Welcome to Nội Thất Nhanh!',
          emailBody: 'Welcome {{name}}! Thank you for joining us.',
          smsBody: 'Welcome {{name}} to Noi That Nhanh!',
          inAppTitle: 'Welcome!',
          inAppBody: 'Welcome to our platform, {{name}}!',
          variables: { name: 'User Name' },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      return successResponse(c, mockTemplates);
    } catch (error) {
      logger.error('Get notification templates failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get notification templates', 500);
    }
  });

  // ============================================
  // GET /:type - Get notification template by type
  // ============================================
  app.get('/:type', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const type = c.req.param('type');

      // TODO: Implement Firestore query
      // For now, return mock data
      const mockTemplate: NotificationTemplate = {
        id: type,
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Template`,
        emailSubject: `{{subject}}`,
        emailBody: `{{body}}`,
        smsBody: `{{sms}}`,
        inAppTitle: `{{title}}`,
        inAppBody: `{{content}}`,
        variables: {
          subject: 'Email Subject',
          body: 'Email Body',
          sms: 'SMS Content',
          title: 'In-App Title',
          content: 'In-App Content',
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return successResponse(c, mockTemplate);
    } catch (error) {
      logger.error('Get notification template failed', { error, type: c.req.param('type') });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get notification template', 500);
    }
  });

  // ============================================
  // PUT /:type - Update notification template by type
  // ============================================
  app.put('/:type', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const type = c.req.param('type');
      const body = await c.req.json();
      const result = UpdateNotificationTemplateSchema.safeParse(body);

      if (!result.success) {
        return errorResponse(c, 'VALIDATION_ERROR', result.error.issues[0]?.message || 'Validation failed', 400);
      }

      const updateData = result.data;

      // TODO: Update in Firestore
      const updatedTemplate: NotificationTemplate = {
        id: type,
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Template`,
        emailSubject: updateData.emailSubject,
        emailBody: updateData.emailBody,
        smsBody: updateData.smsBody,
        inAppTitle: updateData.inAppTitle,
        inAppBody: updateData.inAppBody,
        variables: updateData.variables || {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logger.info('Notification template updated', { type, updatedBy: 'admin' });
      return successResponse(c, updatedTemplate);
    } catch (error) {
      logger.error('Update notification template failed', { error, type: c.req.param('type') });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update notification template', 500);
    }
  });

  // ============================================
  // POST /render - Render notification template
  // ============================================
  app.post('/render', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const body = await c.req.json();
      const result = RenderTemplateSchema.safeParse(body);

      if (!result.success) {
        return errorResponse(c, 'VALIDATION_ERROR', result.error.issues[0]?.message || 'Validation failed', 400);
      }

      const { template, variables = {} } = result.data;

      const rendered: RenderedTemplate = {
        subject: renderTemplate(template, variables),
        body: renderTemplate(template, variables),
        sms: renderTemplate(template, variables),
        title: renderTemplate(template, variables),
        content: renderTemplate(template, variables),
      };

      return successResponse(c, rendered);
    } catch (error) {
      logger.error('Render template failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to render template', 500);
    }
  });

  // ============================================
  // GET /types - Get available template types
  // ============================================
  app.get('/types', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const types = getTemplateTypes();
      return successResponse(c, { types });
    } catch (error) {
      logger.error('Get template types failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get template types', 500);
    }
  });

  // ============================================
  // POST /seed - Seed default notification templates
  // ============================================
  app.post('/seed', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      // TODO: Implement seeding default templates to Firestore
      const defaultTemplates = getTemplateTypes().map(type => ({
        id: type,
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Template`,
        emailSubject: `Default ${type} subject`,
        emailBody: `Default ${type} email body`,
        smsBody: `Default ${type} SMS`,
        inAppTitle: `Default ${type} title`,
        inAppBody: `Default ${type} content`,
        variables: {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      logger.info('Default notification templates seeded', { count: defaultTemplates.length });
      return successResponse(c, {
        message: 'Default templates seeded successfully',
        count: defaultTemplates.length,
        templates: defaultTemplates,
      });
    } catch (error) {
      logger.error('Seed templates failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to seed templates', 500);
    }
  });

  return app;
}

export const notificationTemplatesFirestoreRoutes = createNotificationTemplatesFirestoreRoutes();
