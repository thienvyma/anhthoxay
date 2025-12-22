/**
 * Activity Routes
 *
 * API endpoints for user activity history.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 23.1, 23.3**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validateQuery, getValidatedQuery } from '../middleware/validation';
import { ActivityQuerySchema, type ActivityQuery } from '../schemas/activity.schema';
import { ActivityService, ActivityError } from '../services/activity.service';
import { paginatedResponse, errorResponse } from '../utils/response';

/**
 * Creates activity routes for authenticated users
 * @param prisma - Prisma client instance
 */
export function createActivityRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate } = createAuthMiddleware(prisma);
  const activityService = new ActivityService(prisma);

  /**
   * @route GET /
   * @description Get user activity history with filtering
   * @access Authenticated
   * Requirements: 23.1, 23.3
   */
  app.get(
    '/',
    authenticate(),
    validateQuery(ActivityQuerySchema),
    async (c) => {
      try {
        const user = getUser(c);
        const query = getValidatedQuery<ActivityQuery>(c);
        const result = await activityService.getActivities(user.sub, query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ActivityError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
