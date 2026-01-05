/**
 * Furniture Category Routes
 * @route /categories - Category CRUD operations
 */
import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse } from '../../utils/response';
import { FurnitureService } from '../../services/furniture.service';
import { createCategorySchema, updateCategorySchema } from '../../schemas/furniture.schema';
import { handleServiceError, type AuthenticateMiddleware, type RequireRoleMiddleware } from './types';

export function createCategoryPublicRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.get('/', async (c) => {
    try { return successResponse(c, await furnitureService.getCategories()); }
    catch (error) { return handleServiceError(c, error); }
  });

  return app;
}

export function createCategoryAdminRoutes(
  prisma: PrismaClient,
  authenticate: AuthenticateMiddleware,
  requireRole: RequireRoleMiddleware
) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getCategories()); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.post('/', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createCategorySchema), async (c) => {
    try { return successResponse(c, await furnitureService.createCategory(getValidatedBody<z.infer<typeof createCategorySchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.put('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateCategorySchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateCategory(c.req.param('id'), getValidatedBody<z.infer<typeof updateCategorySchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteCategory(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
