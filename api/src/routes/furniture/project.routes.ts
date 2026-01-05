/**
 * Furniture Project Routes
 * @route /projects - Project CRUD operations
 * @route /buildings - Building CRUD operations
 * @route /layouts - Layout CRUD operations
 * @route /apartment-types - ApartmentType CRUD operations
 */
import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { FurnitureService } from '../../services/furniture.service';
import type { CreateLayoutInput, CreateApartmentTypeInput } from '../../services/furniture.service';
import {
  createProjectSchema, updateProjectSchema,
  createBuildingSchema, updateBuildingSchema,
  createLayoutSchema, updateLayoutSchema,
  createApartmentTypeSchema, updateApartmentTypeSchema,
} from '../../schemas/furniture.schema';
import { handleServiceError, type AuthenticateMiddleware, type RequireRoleMiddleware } from './types';

export function createProjectPublicRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  // Projects
  app.get('/projects', async (c) => {
    try { return successResponse(c, await furnitureService.getProjects(c.req.query('developerId'))); }
    catch (error) { return handleServiceError(c, error); }
  });

  // Buildings
  app.get('/buildings', async (c) => {
    try { return successResponse(c, await furnitureService.getBuildings(c.req.query('projectId'))); }
    catch (error) { return handleServiceError(c, error); }
  });

  // Layouts
  app.get('/layouts', async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      return successResponse(c, await furnitureService.getLayouts(buildingCode));
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/layouts/by-axis', async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      const axisStr = c.req.query('axis');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      if (!axisStr) return errorResponse(c, 'VALIDATION_ERROR', 'axis is required', 400);
      const axis = parseInt(axisStr, 10);
      if (isNaN(axis) || axis < 0) return errorResponse(c, 'VALIDATION_ERROR', 'axis must be non-negative', 400);
      const layout = await furnitureService.getLayoutByAxis(buildingCode, axis);
      if (!layout) return errorResponse(c, 'NOT_FOUND', 'Layout not found', 404);
      return successResponse(c, layout);
    } catch (error) { return handleServiceError(c, error); }
  });

  // Apartment Types
  app.get('/apartment-types', async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      return successResponse(c, await furnitureService.getApartmentTypes(buildingCode, c.req.query('type')));
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}

export function createProjectAdminRoutes(
  prisma: PrismaClient,
  authenticate: AuthenticateMiddleware,
  requireRole: RequireRoleMiddleware
) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  // ========== PROJECTS ==========
  app.get('/projects', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getProjects(c.req.query('developerId'))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.post('/projects', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createProjectSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createProject(getValidatedBody<z.infer<typeof createProjectSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.put('/projects/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateProjectSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateProject(c.req.param('id'), getValidatedBody<z.infer<typeof updateProjectSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/projects/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteProject(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  // ========== BUILDINGS ==========
  app.get('/buildings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getBuildings(c.req.query('projectId'))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.post('/buildings', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createBuildingSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createBuilding(getValidatedBody<z.infer<typeof createBuildingSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.put('/buildings/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateBuildingSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateBuilding(c.req.param('id'), getValidatedBody<z.infer<typeof updateBuildingSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/buildings/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteBuilding(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  // ========== LAYOUTS ==========
  app.get('/layouts', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      return successResponse(c, await furnitureService.getLayouts(buildingCode));
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/layouts/by-axis', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      const axisStr = c.req.query('axis');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      if (!axisStr) return errorResponse(c, 'VALIDATION_ERROR', 'axis is required', 400);
      const axis = parseInt(axisStr, 10);
      if (isNaN(axis) || axis < 0) return errorResponse(c, 'VALIDATION_ERROR', 'axis must be non-negative', 400);
      const layout = await furnitureService.getLayoutByAxis(buildingCode, axis);
      if (!layout) return errorResponse(c, 'NOT_FOUND', 'Layout not found', 404);
      return successResponse(c, layout);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.post('/layouts', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createLayoutSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createLayout(getValidatedBody<z.infer<typeof createLayoutSchema>>(c) as CreateLayoutInput), 201); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.put('/layouts/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateLayoutSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateLayout(c.req.param('id'), getValidatedBody<z.infer<typeof updateLayoutSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/layouts/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteLayout(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  // ========== APARTMENT TYPES ==========
  app.get('/apartment-types', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      return successResponse(c, await furnitureService.getApartmentTypes(buildingCode, c.req.query('type')));
    } catch (error) { return handleServiceError(c, error); }
  });

  app.post('/apartment-types', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createApartmentTypeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createApartmentType(getValidatedBody<z.infer<typeof createApartmentTypeSchema>>(c) as CreateApartmentTypeInput), 201); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.put('/apartment-types/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateApartmentTypeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateApartmentType(c.req.param('id'), getValidatedBody<z.infer<typeof updateApartmentTypeSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/apartment-types/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteApartmentType(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
