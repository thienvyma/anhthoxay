/**
 * Unsubscribe Routes
 *
 * API endpoints for email unsubscribe functionality.
 * These endpoints are PUBLIC (no auth required) as they are accessed via email links.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 21.1, 21.2, 21.3, 21.4**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { validate, getValidatedBody } from '../middleware/validation';
import {
  UnsubscribeTokenSchema,
  UnsubscribePreferencesSchema,
  type UnsubscribeTokenInput,
  type UnsubscribePreferencesInput,
} from '../schemas/unsubscribe.schema';
import { UnsubscribeService, UnsubscribeError } from '../services/unsubscribe.service';
import { successResponse, errorResponse } from '../utils/response';

// ============================================
// UNSUBSCRIBE ROUTES
// ============================================

/**
 * Creates unsubscribe routes (PUBLIC - no auth required)
 * @param prisma - Prisma client instance
 */
export function createUnsubscribeRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const unsubscribeService = new UnsubscribeService(prisma);

  /**
   * @route GET /
   * @description Get unsubscribe page data
   * @access Public (via email link)
   * Requirements: 21.2 - Show preference options
   */
  app.get('/', async (c) => {
    try {
      const token = c.req.query('token');

      if (!token) {
        return errorResponse(c, 'INVALID_TOKEN', 'Token không được cung cấp', 400);
      }

      const pageData = await unsubscribeService.getPageData(token);

      if (!pageData) {
        return errorResponse(
          c,
          'INVALID_TOKEN',
          'Token không hợp lệ hoặc đã hết hạn',
          400
        );
      }

      return successResponse(c, pageData);
    } catch (error) {
      if (error instanceof UnsubscribeError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route PUT /
   * @description Update notification preferences via unsubscribe
   * @access Public (via email link)
   * Requirements: 21.3 - Update preferences
   */
  app.put('/', validate(UnsubscribePreferencesSchema), async (c) => {
    try {
      const data = getValidatedBody<UnsubscribePreferencesInput>(c);
      const result = await unsubscribeService.updatePreferences(data);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof UnsubscribeError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route POST /quick
   * @description Quick unsubscribe from all non-critical emails
   * @access Public (via email link)
   * Requirements: 21.3, 21.4 - Update preferences immediately, still send critical
   */
  app.post('/quick', validate(UnsubscribeTokenSchema), async (c) => {
    try {
      const { token } = getValidatedBody<UnsubscribeTokenInput>(c);
      const result = await unsubscribeService.quickUnsubscribe(token);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof UnsubscribeError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  return app;
}
