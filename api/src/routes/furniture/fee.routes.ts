/**
 * Furniture Fee Routes
 * @route /fees - Fee CRUD operations
 */
import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse } from '../../utils/response';
import { FurnitureService } from '../../services/furniture.service';
import { createFeeSchema, updateFeeSchema } from '../../schemas/furniture.schema';
import { handleServiceError, type AuthenticateMiddleware, type RequireRoleMiddleware } from './types';

export function createFeePublicRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.get('/', async (c) => {
    try {
      // Public route: only return active fees
      return successResponse(c, await furnitureService.getActiveFees());
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}

export function createFeeAdminRoutes(
  prisma: PrismaClient,
  authenticate: AuthenticateMiddleware,
  requireRole: RequireRoleMiddleware
) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      return successResponse(c, await furnitureService.getFees());
    } catch (error) { return handleServiceError(c, error); }
  });

  app.post('/', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createFeeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createFee(getValidatedBody<z.infer<typeof createFeeSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.put('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateFeeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateFee(c.req.param('id'), getValidatedBody<z.infer<typeof updateFeeSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteFee(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
