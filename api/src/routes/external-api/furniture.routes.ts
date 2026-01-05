/**
 * External API - Furniture Routes
 *
 * API key authenticated routes for furniture management
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';
import type { ApiKeyAuthFn } from './types';

/**
 * Helper to generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Create furniture routes for external API
 */
export function createFurnitureRoutes(prisma: PrismaClient, apiKeyAuth: ApiKeyAuthFn) {
  const app = new Hono();

  // ============================================
  // CATEGORIES (Material Categories)
  // ============================================

  app.get('/categories', apiKeyAuth(), async (c) => {
    try {
      const categories = await prisma.materialCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: { _count: { select: { materials: true } } },
      });
      return successResponse(c, categories);
    } catch (error) {
      console.error('External API - Get furniture categories error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture categories', 500);
    }
  });

  app.get('/categories/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const category = await prisma.materialCategory.findUnique({
        where: { id },
        include: { materials: { where: { isActive: true }, orderBy: { order: 'asc' } } },
      });

      if (!category) {
        return errorResponse(c, 'NOT_FOUND', 'Material category not found', 404);
      }

      return successResponse(c, category);
    } catch (error) {
      console.error('External API - Get furniture category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture category', 500);
    }
  });

  app.post('/categories', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const slug = generateSlug(body.name);
      const category = await prisma.materialCategory.create({ data: { ...body, slug } });
      return successResponse(c, category, 201);
    } catch (error) {
      console.error('External API - Create furniture category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create furniture category', 500);
    }
  });

  app.put('/categories/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const updateData: Record<string, unknown> = { ...body };
      if (body.name) {
        updateData.slug = generateSlug(body.name);
      }
      const category = await prisma.materialCategory.update({ where: { id }, data: updateData });
      return successResponse(c, category);
    } catch (error) {
      console.error('External API - Update furniture category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update furniture category', 500);
    }
  });

  app.delete('/categories/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const count = await prisma.material.count({ where: { categoryId: id } });
      if (count > 0) {
        return errorResponse(c, 'CONFLICT', 'Không thể xóa danh mục đang có vật dụng', 409);
      }
      await prisma.materialCategory.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Delete furniture category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete furniture category', 500);
    }
  });

  app.put('/categories/reorder', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const { items } = body as { items: Array<{ id: string; order: number }> };
      if (!items || !Array.isArray(items)) {
        return errorResponse(c, 'VALIDATION_ERROR', 'items array is required', 400);
      }
      await prisma.$transaction(
        items.map((item) =>
          prisma.materialCategory.update({ where: { id: item.id }, data: { order: item.order } })
        )
      );
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Reorder furniture categories error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reorder categories', 500);
    }
  });

  // ============================================
  // MATERIALS
  // ============================================

  app.get('/materials', apiKeyAuth(), async (c) => {
    try {
      const categoryId = c.req.query('categoryId');
      const materials = await prisma.material.findMany({
        where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
        orderBy: [{ order: 'asc' }],
        include: { category: true },
      });
      return successResponse(c, materials);
    } catch (error) {
      console.error('External API - Get furniture materials error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture materials', 500);
    }
  });

  app.get('/materials/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const material = await prisma.material.findUnique({
        where: { id },
        include: { category: true },
      });
      if (!material) {
        return errorResponse(c, 'NOT_FOUND', 'Material not found', 404);
      }
      return successResponse(c, material);
    } catch (error) {
      console.error('External API - Get furniture material error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture material', 500);
    }
  });

  app.post('/materials', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const material = await prisma.material.create({ data: body, include: { category: true } });
      return successResponse(c, material, 201);
    } catch (error) {
      console.error('External API - Create furniture material error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create furniture material', 500);
    }
  });

  app.put('/materials/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const material = await prisma.material.update({ where: { id }, data: body, include: { category: true } });
      return successResponse(c, material);
    } catch (error) {
      console.error('External API - Update furniture material error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update furniture material', 500);
    }
  });

  app.delete('/materials/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.material.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Delete furniture material error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete furniture material', 500);
    }
  });

  app.put('/materials/reorder', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const { items } = body as { items: Array<{ id: string; order: number }> };
      if (!items || !Array.isArray(items)) {
        return errorResponse(c, 'VALIDATION_ERROR', 'items array is required', 400);
      }
      await prisma.$transaction(
        items.map((item) =>
          prisma.material.update({ where: { id: item.id }, data: { order: item.order } })
        )
      );
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Reorder furniture materials error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reorder materials', 500);
    }
  });

  // ============================================
  // DEVELOPERS
  // ============================================

  app.get('/developers', apiKeyAuth(), async (c) => {
    try {
      const developers = await prisma.furnitureDeveloper.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { projects: true } } },
      });
      return successResponse(c, developers);
    } catch (error) {
      console.error('External API - Get furniture developers error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture developers', 500);
    }
  });

  app.get('/developers/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const developer = await prisma.furnitureDeveloper.findUnique({
        where: { id },
        include: { projects: { orderBy: { name: 'asc' }, include: { _count: { select: { buildings: true } } } } },
      });
      if (!developer) {
        return errorResponse(c, 'NOT_FOUND', 'Furniture developer not found', 404);
      }
      return successResponse(c, developer);
    } catch (error) {
      console.error('External API - Get furniture developer error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture developer', 500);
    }
  });

  app.post('/developers', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const developer = await prisma.furnitureDeveloper.create({ data: body });
      return successResponse(c, developer, 201);
    } catch (error) {
      console.error('External API - Create furniture developer error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create furniture developer', 500);
    }
  });

  app.put('/developers/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const developer = await prisma.furnitureDeveloper.update({ where: { id }, data: body });
      return successResponse(c, developer);
    } catch (error) {
      console.error('External API - Update furniture developer error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update furniture developer', 500);
    }
  });

  app.delete('/developers/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.furnitureDeveloper.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Delete furniture developer error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete furniture developer', 500);
    }
  });

  // ============================================
  // PROJECTS
  // ============================================

  app.get('/projects', apiKeyAuth(), async (c) => {
    try {
      const developerId = c.req.query('developerId');
      const projects = await prisma.furnitureProject.findMany({
        where: developerId ? { developerId } : {},
        orderBy: { name: 'asc' },
        include: { developer: true, _count: { select: { buildings: true } } },
      });
      return successResponse(c, projects);
    } catch (error) {
      console.error('External API - Get furniture projects error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture projects', 500);
    }
  });

  app.get('/projects/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const project = await prisma.furnitureProject.findUnique({
        where: { id },
        include: { developer: true, buildings: { orderBy: { name: 'asc' } } },
      });
      if (!project) {
        return errorResponse(c, 'NOT_FOUND', 'Furniture project not found', 404);
      }
      return successResponse(c, project);
    } catch (error) {
      console.error('External API - Get furniture project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture project', 500);
    }
  });

  app.post('/projects', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const project = await prisma.furnitureProject.create({ data: body, include: { developer: true } });
      return successResponse(c, project, 201);
    } catch (error) {
      console.error('External API - Create furniture project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create furniture project', 500);
    }
  });

  app.put('/projects/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const project = await prisma.furnitureProject.update({ where: { id }, data: body, include: { developer: true } });
      return successResponse(c, project);
    } catch (error) {
      console.error('External API - Update furniture project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update furniture project', 500);
    }
  });

  app.delete('/projects/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.furnitureProject.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Delete furniture project error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete furniture project', 500);
    }
  });

  // ============================================
  // BUILDINGS
  // ============================================

  app.get('/buildings', apiKeyAuth(), async (c) => {
    try {
      const projectId = c.req.query('projectId');
      const buildings = await prisma.furnitureBuilding.findMany({
        where: projectId ? { projectId } : {},
        orderBy: { name: 'asc' },
        include: { project: { include: { developer: true } } },
      });
      return successResponse(c, buildings);
    } catch (error) {
      console.error('External API - Get furniture buildings error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture buildings', 500);
    }
  });

  app.get('/buildings/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const building = await prisma.furnitureBuilding.findUnique({
        where: { id },
        include: { project: { include: { developer: true } } },
      });
      if (!building) {
        return errorResponse(c, 'NOT_FOUND', 'Furniture building not found', 404);
      }
      return successResponse(c, building);
    } catch (error) {
      console.error('External API - Get furniture building error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture building', 500);
    }
  });

  app.post('/buildings', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const building = await prisma.furnitureBuilding.create({
        data: body,
        include: { project: { include: { developer: true } } },
      });
      return successResponse(c, building, 201);
    } catch (error) {
      console.error('External API - Create furniture building error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create furniture building', 500);
    }
  });

  app.put('/buildings/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const building = await prisma.furnitureBuilding.update({
        where: { id },
        data: body,
        include: { project: { include: { developer: true } } },
      });
      return successResponse(c, building);
    } catch (error) {
      console.error('External API - Update furniture building error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update furniture building', 500);
    }
  });

  app.delete('/buildings/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.furnitureBuilding.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Delete furniture building error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete furniture building', 500);
    }
  });

  // ============================================
  // LAYOUTS
  // ============================================

  app.get('/layouts', apiKeyAuth(), async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      const apartmentType = c.req.query('apartmentType');
      const layouts = await prisma.furnitureLayout.findMany({
        where: {
          ...(buildingCode ? { buildingCode } : {}),
          ...(apartmentType ? { apartmentType } : {}),
        },
        orderBy: [{ buildingCode: 'asc' }, { axis: 'asc' }],
      });
      return successResponse(c, layouts);
    } catch (error) {
      console.error('External API - Get furniture layouts error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture layouts', 500);
    }
  });

  app.get('/layouts/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const layout = await prisma.furnitureLayout.findUnique({ where: { id } });
      if (!layout) {
        return errorResponse(c, 'NOT_FOUND', 'Furniture layout not found', 404);
      }
      return successResponse(c, layout);
    } catch (error) {
      console.error('External API - Get furniture layout error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture layout', 500);
    }
  });

  app.post('/layouts', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      if (!body.layoutAxis && body.buildingCode && body.axis) {
        body.layoutAxis = `${body.buildingCode}_${body.axis}`;
      }
      const layout = await prisma.furnitureLayout.create({ data: body });
      return successResponse(c, layout, 201);
    } catch (error) {
      console.error('External API - Create furniture layout error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create furniture layout', 500);
    }
  });

  app.put('/layouts/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      if (body.buildingCode || body.axis) {
        const existing = await prisma.furnitureLayout.findUnique({ where: { id } });
        if (existing) {
          const buildingCode = body.buildingCode || existing.buildingCode;
          const axis = body.axis || existing.axis;
          body.layoutAxis = `${buildingCode}_${axis}`;
        }
      }
      const layout = await prisma.furnitureLayout.update({ where: { id }, data: body });
      return successResponse(c, layout);
    } catch (error) {
      console.error('External API - Update furniture layout error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update furniture layout', 500);
    }
  });

  app.delete('/layouts/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.furnitureLayout.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Delete furniture layout error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete furniture layout', 500);
    }
  });

  // ============================================
  // APARTMENT TYPES
  // ============================================

  app.get('/apartment-types', apiKeyAuth(), async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      const apartmentTypes = await prisma.furnitureApartmentType.findMany({
        where: buildingCode ? { buildingCode } : {},
        orderBy: [{ buildingCode: 'asc' }, { apartmentType: 'asc' }],
      });
      return successResponse(c, apartmentTypes);
    } catch (error) {
      console.error('External API - Get furniture apartment types error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture apartment types', 500);
    }
  });

  app.get('/apartment-types/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const apartmentType = await prisma.furnitureApartmentType.findUnique({ where: { id } });
      if (!apartmentType) {
        return errorResponse(c, 'NOT_FOUND', 'Furniture apartment type not found', 404);
      }
      return successResponse(c, apartmentType);
    } catch (error) {
      console.error('External API - Get furniture apartment type error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture apartment type', 500);
    }
  });

  app.post('/apartment-types', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const apartmentType = await prisma.furnitureApartmentType.create({ data: body });
      return successResponse(c, apartmentType, 201);
    } catch (error) {
      console.error('External API - Create furniture apartment type error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create furniture apartment type', 500);
    }
  });

  app.put('/apartment-types/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const apartmentType = await prisma.furnitureApartmentType.update({ where: { id }, data: body });
      return successResponse(c, apartmentType);
    } catch (error) {
      console.error('External API - Update furniture apartment type error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update furniture apartment type', 500);
    }
  });

  app.delete('/apartment-types/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.furnitureApartmentType.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Delete furniture apartment type error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete furniture apartment type', 500);
    }
  });

  // ============================================
  // QUOTATIONS
  // ============================================

  app.get('/quotations', apiKeyAuth(), async (c) => {
    try {
      const leadId = c.req.query('leadId');
      const page = parseInt(c.req.query('page') || '1', 10);
      const limit = parseInt(c.req.query('limit') || '20', 10);
      const skip = (page - 1) * limit;

      const where = leadId ? { leadId } : {};

      const [total, quotations] = await Promise.all([
        prisma.furnitureQuotation.count({ where }),
        prisma.furnitureQuotation.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: { lead: true },
        }),
      ]);

      return paginatedResponse(c, quotations, { total, page, limit });
    } catch (error) {
      console.error('External API - Get furniture quotations error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture quotations', 500);
    }
  });

  app.get('/quotations/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const quotation = await prisma.furnitureQuotation.findUnique({
        where: { id },
        include: { lead: true },
      });
      if (!quotation) {
        return errorResponse(c, 'NOT_FOUND', 'Furniture quotation not found', 404);
      }
      return successResponse(c, quotation);
    } catch (error) {
      console.error('External API - Get furniture quotation error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture quotation', 500);
    }
  });

  return app;
}
