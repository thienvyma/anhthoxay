/**
 * Furniture Product Routes
 * @route /products - Legacy product routes
 * @route /product-bases - New ProductBase CRUD operations
 * @route /products/:id/variants - Variant CRUD operations
 * @route /products/:id/mappings - Mapping CRUD operations
 */
import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { FurnitureService } from '../../services/furniture.service';
import {
  createProductSchema, updateProductSchema,
  createProductBaseSchema, updateProductBaseSchema,
  createVariantSchema, updateVariantSchema,
  addProductMappingSchema, bulkMappingSchema,
} from '../../schemas/furniture.schema';
import { handleServiceError, type AuthenticateMiddleware, type RequireRoleMiddleware } from './types';

export function createProductPublicRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  /**
   * GET /api/furniture/products/grouped
   * Returns products grouped by ProductBase with nested variants (NEW schema)
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.1, 6.1**
   */
  app.get('/grouped', async (c) => {
    try {
      const query = {
        categoryId: c.req.query('categoryId'),
        projectName: c.req.query('projectName'),
        buildingCode: c.req.query('buildingCode'),
        apartmentType: c.req.query('apartmentType'),
      };
      const groupedProducts = await furnitureService.getProductBasesGrouped(query);
      return successResponse(c, { products: groupedProducts });
    }
    catch (error) { return handleServiceError(c, error); }
  });

  /**
   * GET /api/furniture/products
   * Returns products grouped by name with material variants (LEGACY schema)
   * @deprecated Use GET /api/furniture/products/grouped instead
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 10.4**
   */
  app.get('/', async (c) => {
    try {
      const query = {
        categoryId: c.req.query('categoryId'),
        projectName: c.req.query('projectName'),
        buildingCode: c.req.query('buildingCode'),
        apartmentType: c.req.query('apartmentType'),
      };
      const groupedProducts = await furnitureService.getProductsGrouped(query);
      
      // Add deprecation warning header
      c.header('X-Deprecation-Warning', 'Use /api/furniture/products/grouped instead');
      c.header('Deprecation', 'true');
      
      return successResponse(c, { products: groupedProducts });
    }
    catch (error) { return handleServiceError(c, error); }
  });

  /**
   * GET /api/furniture/products/flat
   * Returns flat list of products (for backward compatibility)
   * @deprecated Legacy endpoint - use /products/grouped for new schema
   * 
   * _Requirements: 1.4, 10.1_
   */
  app.get('/flat', async (c) => {
    try {
      const query = {
        categoryId: c.req.query('categoryId'),
        projectName: c.req.query('projectName'),
        buildingCode: c.req.query('buildingCode'),
        apartmentType: c.req.query('apartmentType'),
      };
      
      c.header('X-Deprecation-Warning', 'Use /api/furniture/products/grouped instead');
      c.header('Deprecation', 'true');
      
      return successResponse(c, await furnitureService.getProducts(query));
    }
    catch (error) { return handleServiceError(c, error); }
  });

  return app;
}

export function createProductAdminRoutes(
  prisma: PrismaClient,
  authenticate: AuthenticateMiddleware,
  requireRole: RequireRoleMiddleware
) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  // ========== LEGACY PRODUCTS ==========
  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const query = {
        categoryId: c.req.query('categoryId'),
        projectName: c.req.query('projectName'),
        buildingCode: c.req.query('buildingCode'),
        apartmentType: c.req.query('apartmentType'),
      };
      return successResponse(c, await furnitureService.getProducts(query));
    }
    catch (error) { return handleServiceError(c, error); }
  });

  app.post('/', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createProductSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createProduct(getValidatedBody<z.infer<typeof createProductSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.put('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateProductSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateProduct(c.req.param('id'), getValidatedBody<z.infer<typeof updateProductSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteProduct(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  // ========== PRODUCT MAPPINGS (for FurnitureProductBase) ==========
  // _Requirements: 5.2, 5.4, 5.5_

  app.post('/:productBaseId/mappings', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(addProductMappingSchema), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const body = getValidatedBody<z.infer<typeof addProductMappingSchema>>(c);
      const mapping = await furnitureService.addProductMapping(productBaseId, body);
      return successResponse(c, mapping, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.post('/bulk-mapping', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(bulkMappingSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof bulkMappingSchema>>(c);
      const result = await furnitureService.bulkCreateMappings(body.productBaseIds, body.mapping);
      return successResponse(c, result);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/:productBaseId/mappings/:mappingId', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const mappingId = c.req.param('mappingId');
      await furnitureService.removeProductMapping(mappingId);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/:productBaseId/mappings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const mappings = await furnitureService.getProductMappings(productBaseId);
      return successResponse(c, { mappings });
    } catch (error) { return handleServiceError(c, error); }
  });

  // ========== PRODUCT VARIANTS ==========
  // _Requirements: 9.5, 4.2, 4.4, 4.5_

  app.post('/:productBaseId/variants', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createVariantSchema), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const body = getValidatedBody<z.infer<typeof createVariantSchema>>(c);
      const variant = await furnitureService.createVariant(productBaseId, body);
      return successResponse(c, variant, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.put('/:productBaseId/variants/:variantId', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateVariantSchema), async (c) => {
    try {
      const variantId = c.req.param('variantId');
      const body = getValidatedBody<z.infer<typeof updateVariantSchema>>(c);
      const variant = await furnitureService.updateVariant(variantId, body);
      return successResponse(c, variant);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/:productBaseId/variants/:variantId', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const variantId = c.req.param('variantId');
      await furnitureService.deleteVariant(variantId);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}

export function createProductBaseAdminRoutes(
  prisma: PrismaClient,
  authenticate: AuthenticateMiddleware,
  requireRole: RequireRoleMiddleware
) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  // ========== PRODUCT BASE CRUD ==========
  // _Requirements: 9.2, 9.3, 9.4, 9.6, 3.1, 3.2, 3.3, 3.4_

  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const pageStr = c.req.query('page');
      const limitStr = c.req.query('limit');
      const query = {
        categoryId: c.req.query('categoryId') || undefined,
        materialId: c.req.query('materialId') || undefined,
        isActive: c.req.query('isActive') ? c.req.query('isActive') === 'true' : undefined,
        page: pageStr ? parseInt(pageStr, 10) : undefined,
        limit: limitStr ? parseInt(limitStr, 10) : undefined,
        sortBy: c.req.query('sortBy') as 'name' | 'order' | 'createdAt' | 'updatedAt' | undefined,
        sortOrder: c.req.query('sortOrder') as 'asc' | 'desc' | undefined,
      };
      
      const result = await furnitureService.getProductBasesForAdmin(query);
      return successResponse(c, result);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      const productBase = await furnitureService.getProductBaseById(id);
      if (!productBase) {
        return errorResponse(c, 'NOT_FOUND', 'Product base not found', 404);
      }
      return successResponse(c, productBase);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.post('/', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createProductBaseSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createProductBaseSchema>>(c);
      const productBase = await furnitureService.createProductBase(body);
      return successResponse(c, productBase, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.put('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateProductBaseSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<z.infer<typeof updateProductBaseSchema>>(c);
      const productBase = await furnitureService.updateProductBase(id, body);
      return successResponse(c, productBase);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      await furnitureService.deleteProductBase(id);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  // ========== VARIANT CRUD ==========
  // _Requirements: 9.5, 4.2, 4.4, 4.5_

  app.post('/:productBaseId/variants', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createVariantSchema), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const body = getValidatedBody<z.infer<typeof createVariantSchema>>(c);
      const variant = await furnitureService.createVariant(productBaseId, body);
      return successResponse(c, variant, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.put('/:productBaseId/variants/:variantId', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateVariantSchema), async (c) => {
    try {
      const variantId = c.req.param('variantId');
      const body = getValidatedBody<z.infer<typeof updateVariantSchema>>(c);
      const variant = await furnitureService.updateVariant(variantId, body);
      return successResponse(c, variant);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/:productBaseId/variants/:variantId', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const variantId = c.req.param('variantId');
      await furnitureService.deleteVariant(variantId);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  // ========== PRODUCT BASE MAPPINGS ==========
  // _Requirements: 5.2, 5.4, 5.5_

  app.post('/:productBaseId/mappings', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(addProductMappingSchema), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const body = getValidatedBody<z.infer<typeof addProductMappingSchema>>(c);
      const mapping = await furnitureService.addProductMapping(productBaseId, body);
      return successResponse(c, mapping, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.delete('/:productBaseId/mappings/:mappingId', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const mappingId = c.req.param('mappingId');
      await furnitureService.removeProductMapping(mappingId);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/:productBaseId/mappings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const mappings = await furnitureService.getProductMappings(productBaseId);
      return successResponse(c, { mappings });
    } catch (error) { return handleServiceError(c, error); }
  });

  app.post('/bulk-mapping', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(bulkMappingSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof bulkMappingSchema>>(c);
      const result = await furnitureService.bulkCreateMappings(body.productBaseIds, body.mapping);
      return successResponse(c, result);
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
