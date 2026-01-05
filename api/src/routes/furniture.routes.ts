/**
 * Furniture Routes Module
 * @route /api/furniture - Public furniture routes
 * @route /api/admin/furniture - Admin furniture management routes
 */
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, getValidatedBody } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { FurnitureService, FurnitureServiceError } from '../services/furniture.service';
import type { CreateLayoutInput, CreateApartmentTypeInput } from '../services/furniture.service';
import {
  createDeveloperSchema, updateDeveloperSchema, createProjectSchema, updateProjectSchema,
  createBuildingSchema, updateBuildingSchema, createLayoutSchema, updateLayoutSchema,
  createApartmentTypeSchema, updateApartmentTypeSchema, createCategorySchema, updateCategorySchema,
  createProductSchema, updateProductSchema, addProductMappingSchema,
  createFeeSchema, updateFeeSchema, createQuotationSchema, syncSchema,
  createProductBaseSchema, updateProductBaseSchema, createVariantSchema, updateVariantSchema,
  bulkMappingSchema,
} from '../schemas/furniture.schema';
// Note: Combo schemas removed as part of furniture-combo removal
import { googleSheetsService } from '../services/google-sheets.service';
import { rateLimiter } from '../middleware/rate-limiter';

function handleServiceError(c: Parameters<typeof errorResponse>[0], error: unknown) {
  if (error instanceof FurnitureServiceError) {
    return errorResponse(c, error.code, error.message, error.statusCode);
  }
  console.error('Furniture route error:', error);
  return errorResponse(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

export function createFurniturePublicRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.get('/developers', async (c) => {
    try { return successResponse(c, await furnitureService.getDevelopers()); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/projects', async (c) => {
    try { return successResponse(c, await furnitureService.getProjects(c.req.query('developerId'))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/buildings', async (c) => {
    try { return successResponse(c, await furnitureService.getBuildings(c.req.query('projectId'))); }
    catch (error) { return handleServiceError(c, error); }
  });

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

  app.get('/apartment-types', async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      return successResponse(c, await furnitureService.getApartmentTypes(buildingCode, c.req.query('type')));
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/categories', async (c) => {
    try { return successResponse(c, await furnitureService.getCategories()); }
    catch (error) { return handleServiceError(c, error); }
  });

  /**
   * GET /api/furniture/products/grouped
   * Returns products grouped by ProductBase with nested variants (NEW schema)
   * 
   * Query params:
   * - categoryId: Filter by category ID
   * - projectName: Filter by project name (via mappings)
   * - buildingCode: Filter by building code (via mappings)
   * - apartmentType: Filter by apartment type (via mappings)
   * 
   * Response: { products: ProductBaseGroup[] }
   * Each ProductBaseGroup has: id, name, categoryId, categoryName, description, imageUrl, allowFitIn, variants[], priceRange, variantCount
   * Each variant has: id, materialId, materialName, calculatedPrice, imageUrl
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.1, 6.1**
   */
  app.get('/products/grouped', async (c) => {
    try {
      const query = {
        categoryId: c.req.query('categoryId'),
        projectName: c.req.query('projectName'),
        buildingCode: c.req.query('buildingCode'),
        apartmentType: c.req.query('apartmentType'),
      };
      // Return products grouped by ProductBase with nested variants (NEW schema)
      const groupedProducts = await furnitureService.getProductBasesGrouped(query);
      return successResponse(c, { products: groupedProducts });
    }
    catch (error) { return handleServiceError(c, error); }
  });

  /**
   * GET /api/furniture/products
   * Returns products grouped by name with material variants (LEGACY schema)
   * 
   * @deprecated Use GET /api/furniture/products/grouped instead for new ProductBase schema
   * 
   * Query params:
   * - projectName: Filter by project name
   * - buildingCode: Filter by building code
   * - apartmentType: Filter by apartment type
   * - categoryId: Filter by category ID
   * 
   * Response: { products: ProductGroup[] }
   * Each ProductGroup has: name, variants[]
   * Each variant has: id, material, calculatedPrice, allowFitIn, imageUrl, description
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 10.4**
   */
  app.get('/products', async (c) => {
    try {
      // Accept optional query params for filtering by apartment mapping
      const query = {
        categoryId: c.req.query('categoryId'),
        projectName: c.req.query('projectName'),
        buildingCode: c.req.query('buildingCode'),
        apartmentType: c.req.query('apartmentType'),
      };
      // Return grouped products with material variants (LEGACY)
      const groupedProducts = await furnitureService.getProductsGrouped(query);
      
      // Add deprecation warning header
      // _Requirements: 10.4_
      c.header('X-Deprecation-Warning', 'Use /api/furniture/products/grouped instead');
      c.header('Deprecation', 'true');
      
      return successResponse(c, { products: groupedProducts });
    }
    catch (error) { return handleServiceError(c, error); }
  });

  /**
   * GET /api/furniture/products/flat
   * Returns flat list of products (for backward compatibility)
   * 
   * @deprecated Legacy endpoint - use /products/grouped for new schema
   * 
   * Query params:
   * - projectName: Filter by project name
   * - buildingCode: Filter by building code
   * - apartmentType: Filter by apartment type
   * - categoryId: Filter by category ID
   * 
   * _Requirements: 1.4, 10.1_
   */
  app.get('/products/flat', async (c) => {
    try {
      const query = {
        categoryId: c.req.query('categoryId'),
        projectName: c.req.query('projectName'),
        buildingCode: c.req.query('buildingCode'),
        apartmentType: c.req.query('apartmentType'),
      };
      
      // Add deprecation warning header
      c.header('X-Deprecation-Warning', 'Use /api/furniture/products/grouped instead');
      c.header('Deprecation', 'true');
      
      return successResponse(c, await furnitureService.getProducts(query));
    }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/fees', async (c) => {
    try {
      // Public route: only return active fees
      return successResponse(c, await furnitureService.getActiveFees());
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/quotations', rateLimiter({ maxAttempts: 10, windowMs: 60 * 1000 }), validate(createQuotationSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createQuotationSchema>>(c);
      console.log('[Furniture API] POST /quotations - body:', JSON.stringify(body, null, 2));
      
      let leadId = body.leadId;
      if (!leadId && body.leadData) {
        console.log('[Furniture API] Creating new lead from leadData');
        const newLead = await prisma.customerLead.create({
          data: {
            name: body.leadData.name,
            phone: body.leadData.phone,
            email: body.leadData.email || null,
            content: body.leadData.content || 'Bao gia noi that',
            source: 'FURNITURE_QUOTE',
            status: 'NEW',
          },
        });
        leadId = newLead.id;
        console.log('[Furniture API] Created new lead with id:', leadId);
      }
      if (!leadId) return errorResponse(c, 'VALIDATION_ERROR', 'Phai co leadId hoac leadData', 400);
      
      // Get all active fees for quotation calculation
      const fees = await furnitureService.getActiveFees();
      
      const quotation = await furnitureService.createQuotation({
        leadId,
        developerName: body.developerName,
        projectName: body.projectName,
        buildingName: body.buildingName,
        buildingCode: body.buildingCode,
        floor: body.floor,
        axis: body.axis,
        apartmentType: body.apartmentType,
        layoutImageUrl: body.layoutImageUrl,
        items: body.items,
        fees,
      });
      return successResponse(c, quotation, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  // Public PDF endpoint - allows downloading PDF for a quotation by ID
  // Requirements: 8.2 - PDF export for furniture quotations
  app.get('/quotations/:id/pdf', async (c) => {
    try {
      const quotation = await furnitureService.getQuotationById(c.req.param('id'));
      const { generateQuotationPDF } = await import('../services/pdf.service');
      const pdfBuffer = await generateQuotationPDF(quotation, prisma);
      const filename = 'bao-gia-' + quotation.unitNumber.replace(/\s+/g, '-') + '-' + new Date(quotation.createdAt).toISOString().split('T')[0] + '.pdf';
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 
          'Content-Type': 'application/pdf', 
          'Content-Disposition': 'attachment; filename="' + filename + '"', 
          'Content-Length': pdfBuffer.length.toString() 
        },
      });
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
export function createFurnitureAdminRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const furnitureService = new FurnitureService(prisma);

  app.get('/developers', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getDevelopers()); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.post('/developers', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createDeveloperSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createDeveloper(getValidatedBody<z.infer<typeof createDeveloperSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/developers/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateDeveloperSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateDeveloper(c.req.param('id'), getValidatedBody<z.infer<typeof updateDeveloperSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/developers/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteDeveloper(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

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
  app.get('/categories', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getCategories()); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.post('/categories', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createCategorySchema), async (c) => {
    try { return successResponse(c, await furnitureService.createCategory(getValidatedBody<z.infer<typeof createCategorySchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/categories/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateCategorySchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateCategory(c.req.param('id'), getValidatedBody<z.infer<typeof updateCategorySchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/categories/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteCategory(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  // ========== MATERIALS (Chất liệu) ==========
  app.get('/materials', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const materials = await prisma.furnitureMaterial.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      });
      return successResponse(c, materials);
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/materials', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
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
  app.put('/materials/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
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
  app.delete('/materials/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
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

  app.get('/products', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      // Accept optional query params for filtering by apartment mapping
      // _Requirements: 1.4, 10.1_
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
  app.post('/products', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createProductSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createProduct(getValidatedBody<z.infer<typeof createProductSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/products/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateProductSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateProduct(c.req.param('id'), getValidatedBody<z.infer<typeof updateProductSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/products/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteProduct(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  // ========== PRODUCT MAPPINGS (for FurnitureProductBase) ==========
  // _Requirements: 5.2, 5.4, 5.5_

  /**
   * POST /api/admin/furniture/products/:productBaseId/mappings
   * Add a new mapping to a product base
   * 
   * Body: ProductMappingInput (projectName, buildingCode, apartmentType)
   * Response: ProductMapping
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 5.2**
   */
  app.post('/products/:productBaseId/mappings', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(addProductMappingSchema), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const body = getValidatedBody<z.infer<typeof addProductMappingSchema>>(c);
      const mapping = await furnitureService.addProductMapping(productBaseId, body);
      return successResponse(c, mapping, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * POST /api/admin/furniture/products/bulk-mapping
   * Create mappings for multiple product bases in a single operation
   * 
   * Body: { productBaseIds: string[], mapping: ProductMappingInput }
   * Response: { success: boolean, created: number, skipped: number, errors: [] }
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 5.5**
   */
  app.post('/products/bulk-mapping', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(bulkMappingSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof bulkMappingSchema>>(c);
      const result = await furnitureService.bulkCreateMappings(body.productBaseIds, body.mapping);
      return successResponse(c, result);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * DELETE /api/admin/furniture/products/:productBaseId/mappings/:mappingId
   * Remove a mapping from a product base
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 5.4**
   */
  app.delete('/products/:productBaseId/mappings/:mappingId', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const mappingId = c.req.param('mappingId');
      await furnitureService.removeProductMapping(mappingId);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * GET /api/admin/furniture/products/:productBaseId/mappings
   * Get all mappings for a product base
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 5.1**
   */
  app.get('/products/:productBaseId/mappings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const mappings = await furnitureService.getProductMappings(productBaseId);
      return successResponse(c, { mappings });
    } catch (error) { return handleServiceError(c, error); }
  });

  // ========== PRODUCT VARIANTS (NEW - furniture-product-restructure) ==========
  // _Requirements: 9.5, 4.2, 4.4, 4.5_

  /**
   * POST /api/admin/furniture/products/:productBaseId/variants
   * Create a new variant for a product base
   * 
   * Body: CreateVariantInput (materialId, pricePerUnit, pricingType, length, width?, ...)
   * Response: ProductVariantWithMaterial
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.5, 4.2**
   */
  app.post('/products/:productBaseId/variants', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createVariantSchema), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const body = getValidatedBody<z.infer<typeof createVariantSchema>>(c);
      const variant = await furnitureService.createVariant(productBaseId, body);
      return successResponse(c, variant, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * PUT /api/admin/furniture/products/:productBaseId/variants/:variantId
   * Update a variant
   * 
   * Body: UpdateVariantInput (materialId?, pricePerUnit?, pricingType?, ...)
   * Response: ProductVariantWithMaterial
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.5, 4.4**
   */
  app.put('/products/:productBaseId/variants/:variantId', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateVariantSchema), async (c) => {
    try {
      const variantId = c.req.param('variantId');
      const body = getValidatedBody<z.infer<typeof updateVariantSchema>>(c);
      const variant = await furnitureService.updateVariant(variantId, body);
      return successResponse(c, variant);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * DELETE /api/admin/furniture/products/:productBaseId/variants/:variantId
   * Delete a variant
   * Returns error if it's the last variant of the product base
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.5, 4.5**
   */
  app.delete('/products/:productBaseId/variants/:variantId', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const variantId = c.req.param('variantId');
      await furnitureService.deleteVariant(variantId);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  // ========== PRODUCT BASE CRUD (NEW - furniture-product-restructure) ==========
  // _Requirements: 9.2, 9.3, 9.4, 9.6, 3.1, 3.2, 3.3, 3.4_

  /**
   * GET /api/admin/furniture/product-bases
   * Get all product bases with pagination, filtering, and sorting
   * 
   * Query params:
   * - categoryId: Filter by category ID
   * - materialId: Filter by material ID (products with variants using this material)
   * - isActive: Filter by active status (true/false)
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   * - sortBy: Sort field (name, order, createdAt, updatedAt)
   * - sortOrder: Sort direction (asc, desc)
   * 
   * Response: { products: ProductBaseWithDetails[], total, page, limit, totalPages }
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.2, 3.1**
   */
  app.get('/product-bases', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
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

  /**
   * GET /api/admin/furniture/product-bases/:id
   * Get a single product base by ID with all details
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.2**
   */
  app.get('/product-bases/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      const productBase = await furnitureService.getProductBaseById(id);
      if (!productBase) {
        return errorResponse(c, 'NOT_FOUND', 'Product base not found', 404);
      }
      return successResponse(c, productBase);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * POST /api/admin/furniture/product-bases
   * Create a new product base with variants
   * 
   * Body: CreateProductBaseInput (name, categoryId, variants[], mappings[]?, ...)
   * Response: ProductBaseWithDetails
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.3, 3.2**
   */
  app.post('/product-bases', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createProductBaseSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createProductBaseSchema>>(c);
      const productBase = await furnitureService.createProductBase(body);
      return successResponse(c, productBase, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * PUT /api/admin/furniture/product-bases/:id
   * Update a product base (partial updates)
   * Does not update variants - use variant-specific endpoints
   * 
   * Body: UpdateProductBaseInput (name?, categoryId?, description?, ...)
   * Response: ProductBaseWithDetails
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.4, 3.3**
   */
  app.put('/product-bases/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateProductBaseSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<z.infer<typeof updateProductBaseSchema>>(c);
      const productBase = await furnitureService.updateProductBase(id, body);
      return successResponse(c, productBase);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * DELETE /api/admin/furniture/product-bases/:id
   * Delete a product base
   * Cascade deletes variants (handled by Prisma)
   * Returns error if referenced by quotations
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.6, 3.4**
   */
  app.delete('/product-bases/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      await furnitureService.deleteProductBase(id);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  // ========== VARIANT CRUD (NEW - furniture-product-restructure) ==========
  // _Requirements: 9.5, 4.2, 4.4, 4.5_

  /**
   * POST /api/admin/furniture/product-bases/:productBaseId/variants
   * Create a new variant for a product base
   * 
   * Body: CreateVariantInput (materialId, pricePerUnit, pricingType, length, width?, ...)
   * Response: ProductVariantWithMaterial
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.5, 4.2**
   */
  app.post('/product-bases/:productBaseId/variants', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createVariantSchema), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const body = getValidatedBody<z.infer<typeof createVariantSchema>>(c);
      const variant = await furnitureService.createVariant(productBaseId, body);
      return successResponse(c, variant, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * PUT /api/admin/furniture/product-bases/:productBaseId/variants/:variantId
   * Update a variant
   * 
   * Body: UpdateVariantInput (materialId?, pricePerUnit?, pricingType?, ...)
   * Response: ProductVariantWithMaterial
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.5, 4.4**
   */
  app.put('/product-bases/:productBaseId/variants/:variantId', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateVariantSchema), async (c) => {
    try {
      const variantId = c.req.param('variantId');
      const body = getValidatedBody<z.infer<typeof updateVariantSchema>>(c);
      const variant = await furnitureService.updateVariant(variantId, body);
      return successResponse(c, variant);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * DELETE /api/admin/furniture/product-bases/:productBaseId/variants/:variantId
   * Delete a variant
   * Returns error if it's the last variant of the product base
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.5, 4.5**
   */
  app.delete('/product-bases/:productBaseId/variants/:variantId', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const variantId = c.req.param('variantId');
      await furnitureService.deleteVariant(variantId);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  // ========== PRODUCT BASE MAPPINGS (NEW - furniture-product-restructure) ==========
  // _Requirements: 5.2, 5.4, 5.5_

  /**
   * POST /api/admin/furniture/product-bases/:productBaseId/mappings
   * Add a mapping to a product base
   * 
   * Body: ProductMappingInput (projectName, buildingCode, apartmentType)
   * Response: ProductMapping
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 5.2**
   */
  app.post('/product-bases/:productBaseId/mappings', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(addProductMappingSchema), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const body = getValidatedBody<z.infer<typeof addProductMappingSchema>>(c);
      const mapping = await furnitureService.addProductMapping(productBaseId, body);
      return successResponse(c, mapping, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * DELETE /api/admin/furniture/product-bases/:productBaseId/mappings/:mappingId
   * Remove a mapping from a product base
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 5.4**
   */
  app.delete('/product-bases/:productBaseId/mappings/:mappingId', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const mappingId = c.req.param('mappingId');
      await furnitureService.removeProductMapping(mappingId);
      return successResponse(c, { ok: true });
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * GET /api/admin/furniture/product-bases/:productBaseId/mappings
   * Get all mappings for a product base
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 5.1**
   */
  app.get('/product-bases/:productBaseId/mappings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const productBaseId = c.req.param('productBaseId');
      const mappings = await furnitureService.getProductMappings(productBaseId);
      return successResponse(c, { mappings });
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * POST /api/admin/furniture/product-bases/bulk-mapping
   * Create mappings for multiple product bases in a single operation
   * 
   * Body: { productBaseIds: string[], mapping: ProductMappingInput }
   * Response: { success: boolean, created: number, skipped: number, errors: [] }
   * 
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 5.5**
   */
  app.post('/product-bases/bulk-mapping', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(bulkMappingSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof bulkMappingSchema>>(c);
      const result = await furnitureService.bulkCreateMappings(body.productBaseIds, body.mapping);
      return successResponse(c, result);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/fees', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      return successResponse(c, await furnitureService.getFees());
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/fees', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createFeeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createFee(getValidatedBody<z.infer<typeof createFeeSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/fees/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateFeeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateFee(c.req.param('id'), getValidatedBody<z.infer<typeof updateFeeSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/fees/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteFee(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });


  app.get('/quotations', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const leadId = c.req.query('leadId');
      if (!leadId) return errorResponse(c, 'VALIDATION_ERROR', 'leadId is required', 400);
      return successResponse(c, await furnitureService.getQuotationsByLead(leadId));
    } catch (error) { return handleServiceError(c, error); }
  });
  app.get('/quotations/:id/pdf', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const quotation = await furnitureService.getQuotationById(c.req.param('id'));
      const { generateQuotationPDF } = await import('../services/pdf.service');
      const pdfBuffer = await generateQuotationPDF(quotation, prisma);
      const filename = 'bao-gia-' + quotation.unitNumber.replace(/\s+/g, '-') + '-' + new Date(quotation.createdAt).toISOString().split('T')[0] + '.pdf';
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + filename + '"', 'Content-Length': pdfBuffer.length.toString() },
      });
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/import', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const formData = await c.req.formData();
      const duAnFile = formData.get('duAn');
      const layoutsFile = formData.get('layouts');
      const apartmentTypesFile = formData.get('apartmentTypes');
      if (!duAnFile || !(duAnFile instanceof File)) return errorResponse(c, 'VALIDATION_ERROR', 'duAn file is required', 400);
      if (!layoutsFile || !(layoutsFile instanceof File)) return errorResponse(c, 'VALIDATION_ERROR', 'layouts file is required', 400);
      if (!apartmentTypesFile || !(apartmentTypesFile instanceof File)) return errorResponse(c, 'VALIDATION_ERROR', 'apartmentTypes file is required', 400);
      const result = await furnitureService.importFromCSV({
        duAn: await duAnFile.text(),
        layouts: await layoutsFile.text(),
        apartmentTypes: await apartmentTypesFile.text(),
      });
      return successResponse(c, { success: true, counts: result });
    } catch (error) { return handleServiceError(c, error); }
  });
  app.get('/export', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.exportToCSV()); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.post('/sync/pull', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(syncSchema), async (c) => {
    try {
      const { spreadsheetId } = getValidatedBody<{ spreadsheetId: string }>(c);
      const status = await googleSheetsService.getStatus();
      if (!status.connected) return errorResponse(c, 'SYNC_ERROR', 'Google Sheets chua duoc ket noi', 400);
      const result = await googleSheetsService.syncFurniturePull(spreadsheetId, furnitureService);
      if (!result.success) return errorResponse(c, 'SYNC_ERROR', result.error || 'Dong bo that bai', 500);
      return successResponse(c, { success: true, counts: result.counts, message: 'Dong bo thanh cong' });
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/sync/push', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(syncSchema), async (c) => {
    try {
      const { spreadsheetId } = getValidatedBody<{ spreadsheetId: string }>(c);
      const status = await googleSheetsService.getStatus();
      if (!status.connected) return errorResponse(c, 'SYNC_ERROR', 'Google Sheets chua duoc ket noi', 400);
      const result = await googleSheetsService.syncFurniturePush(spreadsheetId, furnitureService);
      if (!result.success) return errorResponse(c, 'SYNC_ERROR', result.error || 'Dong bo that bai', 500);
      return successResponse(c, { success: true, counts: result.counts, message: 'Dong bo thanh cong' });
    } catch (error) { return handleServiceError(c, error); }
  });

  // ========== PDF SETTINGS ==========
  
  // Get PDF settings
  app.get('/pdf-settings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      let settings = await prisma.furniturePdfSettings.findUnique({ where: { id: 'default' } });
      if (!settings) {
        // Create default settings if not exists
        settings = await prisma.furniturePdfSettings.create({ data: { id: 'default' } });
      }
      return successResponse(c, settings);
    } catch (error) { return handleServiceError(c, error); }
  });

  // Update PDF settings
  app.put('/pdf-settings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const body = await c.req.json();
      // Remove id and timestamps from update data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = body;
      
      const settings = await prisma.furniturePdfSettings.upsert({
        where: { id: 'default' },
        update: updateData,
        create: { id: 'default', ...updateData },
      });
      return successResponse(c, settings);
    } catch (error) { return handleServiceError(c, error); }
  });

  // Reset PDF settings to defaults
  app.post('/pdf-settings/reset', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      await prisma.furniturePdfSettings.delete({ where: { id: 'default' } }).catch(() => { /* ignore if not exists */ });
      const settings = await prisma.furniturePdfSettings.create({ data: { id: 'default' } });
      return successResponse(c, settings);
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}

export default { createFurniturePublicRoutes, createFurnitureAdminRoutes };