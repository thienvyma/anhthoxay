/**
 * Furniture Developer Routes
 * @route /developers - Developer CRUD operations
 */
import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse } from '../../utils/response';
import { FurnitureService } from '../../services/furniture.service';
import { createDeveloperSchema, updateDeveloperSchema } from '../../schemas/furniture.schema';
import { handleServiceError, type AuthenticateMiddleware, type RequireRoleMiddleware } from './types';

export function createDeveloperPublicRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.get('/', async (c) => {
    try { return successResponse(c, await furnitureService.getDevelopers()); }
    catch (error) { return handleServiceError(c, error); }
  });

  return app;
}

export function createDeveloperAdminRoutes(
  prisma: PrismaClient,
  authenticate: AuthenticateMiddleware,
  requireRole: RequireRoleMiddleware
) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getDevelopers()); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.post('/', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createDeveloperSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createDeveloper(getValidatedBody<z.infer<typeof createDeveloperSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.put('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateDeveloperSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateDeveloper(c.req.param('id'), getValidatedBody<z.infer<typeof updateDeveloperSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteDeveloper(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
