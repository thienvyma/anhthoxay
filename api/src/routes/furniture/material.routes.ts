/**
 * Furniture Material Routes
 * @route /materials - Material CRUD operations
 */
import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../../utils/response';
import { handleServiceError, type AuthenticateMiddleware, type RequireRoleMiddleware } from './types';

export function createMaterialAdminRoutes(
  prisma: PrismaClient,
  authenticate: AuthenticateMiddleware,
  requireRole: RequireRoleMiddleware
) {
  const app = new Hono();

  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const materials = await prisma.furnitureMaterial.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      });
      return successResponse(c, materials);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.post('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const body = await c.req.json();
      if (!body.name?.trim()) return errorResponse(c, 'VALIDATION_ERROR', 'Tên chất liệu không được trống', 400);
      const material = await prisma.furnitureMaterial.create({
        data: {
          name: body.name.trim(),
          description: body.description || null,
          order: body.order ?? 0,
          isActive: body.isActive ?? true,
        },
      });
      return successResponse(c, material, 201);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        return errorResponse(c, 'DUPLICATE_ERROR', 'Chất liệu đã tồn tại', 409);
      }
      return handleServiceError(c, error);
    }
  });

  app.put('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const material = await prisma.furnitureMaterial.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name.trim() }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.order !== undefined && { order: body.order }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
      });
      return successResponse(c, material);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return errorResponse(c, 'NOT_FOUND', 'Không tìm thấy chất liệu', 404);
      }
      if ((error as { code?: string }).code === 'P2002') {
        return errorResponse(c, 'DUPLICATE_ERROR', 'Chất liệu đã tồn tại', 409);
      }
      return handleServiceError(c, error);
    }
  });

  app.delete('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      
      // Check if material is referenced by active FurnitureProductVariant
      // _Requirements: 1.7_
      const activeVariantCount = await prisma.furnitureProductVariant.count({
        where: {
          materialId: id,
          isActive: true,
        },
      });
      
      if (activeVariantCount > 0) {
        return errorResponse(
          c, 
          'MATERIAL_IN_USE', 
          'Không thể xóa chất liệu đang được sử dụng bởi sản phẩm', 
          409
        );
      }
      
      await prisma.furnitureMaterial.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return errorResponse(c, 'NOT_FOUND', 'Không tìm thấy chất liệu', 404);
      }
      return handleServiceError(c, error);
    }
  });

  return app;
}
