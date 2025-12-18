/**
 * Pricing Routes Module
 * 
 * Handles CRUD operations for pricing-related entities:
 * - Service Categories
 * - Unit Prices
 * - Material Categories
 * - Materials
 * - Formulas
 * - Quote Calculation
 * 
 * **Feature: api-refactoring**
 * **Requirements: 1.1, 1.2, 1.3, 3.5, 5.1, 6.1, 6.2**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, getValidatedBody } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';

// ============================================
// TYPES
// ============================================

/**
 * Selected material for quote calculation
 */
interface SelectedMaterial {
  id: string;
  name: string;
  price: number;
}

// ============================================
// SCHEMAS
// ============================================

/**
 * Schema for creating a service category
 */
export const createServiceCategorySchema = z.object({
  name: z.string().min(1, 'Tên hạng mục không được trống').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  coefficient: z.number().positive('Hệ số phải lớn hơn 0').default(1.0),
  formulaId: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  materialCategoryIds: z.array(z.string()).optional(),
});

/**
 * Schema for updating a service category
 */
export const updateServiceCategorySchema = createServiceCategorySchema.partial();

/**
 * Schema for creating a unit price
 */
export const createUnitPriceSchema = z.object({
  category: z.string().min(1, 'Thể loại không được trống').max(50),
  name: z.string().min(1, 'Tên đơn giá không được trống').max(100),
  price: z.number().nonnegative('Giá không được âm'),
  tag: z.string().regex(/^[A-Z0-9_]+$/, 'Tag chỉ chứa chữ in hoa, số và dấu gạch dưới').max(50),
  unit: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a unit price
 */
export const updateUnitPriceSchema = createUnitPriceSchema.partial();

/**
 * Schema for creating a material category
 */
export const createMaterialCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được trống').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a material category
 */
export const updateMaterialCategorySchema = createMaterialCategorySchema.partial();

/**
 * Schema for creating a material
 */
export const createMaterialSchema = z.object({
  name: z.string().min(1, 'Tên vật dụng không được trống').max(100),
  categoryId: z.string().min(1, 'Danh mục không được trống'),
  imageUrl: z.string().optional().nullable(),
  price: z.number().nonnegative('Giá không được âm'),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a material
 */
export const updateMaterialSchema = createMaterialSchema.partial();

/**
 * Schema for creating a formula
 */
export const createFormulaSchema = z.object({
  name: z.string().min(1, 'Tên công thức không được trống').max(100),
  expression: z.string().min(1, 'Biểu thức không được trống').max(500),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating a formula
 */
export const updateFormulaSchema = createFormulaSchema.partial();

/**
 * Schema for quote calculation
 */
export const calculateQuoteSchema = z.object({
  categoryId: z.string().min(1, 'Chọn hạng mục'),
  area: z.number().positive('Diện tích phải lớn hơn 0'),
  materialIds: z.array(z.string()).optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate slug from Vietnamese name
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

// ============================================
// PRICING ROUTES FACTORY
// ============================================

/**
 * Create pricing routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with pricing routes
 */
export function createPricingRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);


  // ============================================
  // SERVICE CATEGORIES ROUTES
  // ============================================

  /**
   * @route GET /service-categories
   * @description Get all active service categories with formulas and material categories
   * @access Public
   */
  app.get('/service-categories', async (c) => {
    try {
      const categories = await prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          formula: true,
          materialCategories: { include: { materialCategory: true } },
        },
      });

      // Transform to include materialCategoryIds array
      const result = categories.map(cat => ({
        ...cat,
        materialCategoryIds: cat.materialCategories.map(mc => mc.materialCategoryId),
        allowMaterials: cat.materialCategories.length > 0,
      }));

      return successResponse(c, result);
    } catch (error) {
      console.error('Get service categories error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get service categories', 500);
    }
  });

  /**
   * @route GET /service-categories/:id
   * @description Get a single service category by ID
   * @access Public
   */
  app.get('/service-categories/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const category = await prisma.serviceCategory.findUnique({
        where: { id },
        include: {
          formula: true,
          materialCategories: { include: { materialCategory: true } },
        },
      });

      if (!category) {
        return errorResponse(c, 'NOT_FOUND', 'Service category not found', 404);
      }

      return successResponse(c, {
        ...category,
        materialCategoryIds: category.materialCategories.map(mc => mc.materialCategoryId),
        allowMaterials: category.materialCategories.length > 0,
      });
    } catch (error) {
      console.error('Get service category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get service category', 500);
    }
  });

  /**
   * @route POST /service-categories
   * @description Create a new service category
   * @access Admin only
   */
  app.post('/service-categories', authenticate(), requireRole('ADMIN'), validate(createServiceCategorySchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createServiceCategorySchema>>(c);
      const { materialCategoryIds, ...categoryData } = body;
      const slug = generateSlug(body.name);

      const category = await prisma.serviceCategory.create({
        data: { ...categoryData, slug },
        include: { formula: true },
      });

      // Create material category relations
      if (materialCategoryIds && materialCategoryIds.length > 0) {
        await prisma.serviceCategoryMaterialCategory.createMany({
          data: materialCategoryIds.map(mcId => ({
            serviceCategoryId: category.id,
            materialCategoryId: mcId,
          })),
        });
      }

      return successResponse(c, {
        ...category,
        materialCategoryIds: materialCategoryIds || [],
        allowMaterials: (materialCategoryIds?.length || 0) > 0,
      }, 201);
    } catch (error) {
      console.error('Create service category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create service category', 500);
    }
  });

  /**
   * @route PUT /service-categories/:id
   * @description Update a service category
   * @access Admin only
   */
  app.put('/service-categories/:id', authenticate(), requireRole('ADMIN'), validate(updateServiceCategorySchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<z.infer<typeof updateServiceCategorySchema>>(c);
      const { materialCategoryIds, ...categoryData } = body;

      // Update slug if name changed
      const updateData: Record<string, unknown> = { ...categoryData };
      if (categoryData.name) {
        updateData.slug = generateSlug(categoryData.name);
      }

      const category = await prisma.serviceCategory.update({
        where: { id },
        data: updateData,
        include: { formula: true },
      });

      // Update material category relations if provided
      if (materialCategoryIds !== undefined) {
        // Delete existing relations
        await prisma.serviceCategoryMaterialCategory.deleteMany({ where: { serviceCategoryId: id } });
        // Create new relations
        if (materialCategoryIds.length > 0) {
          await prisma.serviceCategoryMaterialCategory.createMany({
            data: materialCategoryIds.map(mcId => ({
              serviceCategoryId: id,
              materialCategoryId: mcId,
            })),
          });
        }
      }

      return successResponse(c, {
        ...category,
        materialCategoryIds: materialCategoryIds || [],
        allowMaterials: (materialCategoryIds?.length || 0) > 0,
      });
    } catch (error) {
      console.error('Update service category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update service category', 500);
    }
  });

  /**
   * @route DELETE /service-categories/:id
   * @description Delete a service category
   * @access Admin only
   */
  app.delete('/service-categories/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');

      // Delete relations first
      await prisma.serviceCategoryMaterialCategory.deleteMany({ where: { serviceCategoryId: id } });
      await prisma.serviceCategory.delete({ where: { id } });

      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('Delete service category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete service category', 500);
    }
  });


  // ============================================
  // UNIT PRICES ROUTES
  // ============================================

  /**
   * @route GET /unit-prices
   * @description Get all active unit prices
   * @access Public
   */
  app.get('/unit-prices', async (c) => {
    try {
      const prices = await prisma.unitPrice.findMany({
        where: { isActive: true },
        orderBy: { category: 'asc' },
      });
      return successResponse(c, prices);
    } catch (error) {
      console.error('Get unit prices error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get unit prices', 500);
    }
  });

  /**
   * @route POST /unit-prices
   * @description Create a new unit price
   * @access Admin only
   */
  app.post('/unit-prices', authenticate(), requireRole('ADMIN'), validate(createUnitPriceSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createUnitPriceSchema>>(c);
      const price = await prisma.unitPrice.create({ data: body });
      return successResponse(c, price, 201);
    } catch (error) {
      console.error('Create unit price error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create unit price', 500);
    }
  });

  /**
   * @route PUT /unit-prices/:id
   * @description Update a unit price
   * @access Admin only
   */
  app.put('/unit-prices/:id', authenticate(), requireRole('ADMIN'), validate(updateUnitPriceSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<z.infer<typeof updateUnitPriceSchema>>(c);
      const price = await prisma.unitPrice.update({ where: { id }, data: body });
      return successResponse(c, price);
    } catch (error) {
      console.error('Update unit price error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update unit price', 500);
    }
  });

  /**
   * @route DELETE /unit-prices/:id
   * @description Delete a unit price
   * @access Admin only
   */
  app.delete('/unit-prices/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.unitPrice.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('Delete unit price error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete unit price', 500);
    }
  });

  // ============================================
  // MATERIAL CATEGORIES ROUTES
  // ============================================

  /**
   * @route GET /material-categories
   * @description Get all active material categories with material count
   * @access Public
   */
  app.get('/material-categories', async (c) => {
    try {
      const categories = await prisma.materialCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: { _count: { select: { materials: true } } },
      });
      return successResponse(c, categories);
    } catch (error) {
      console.error('Get material categories error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get material categories', 500);
    }
  });

  /**
   * @route GET /material-categories/:id
   * @description Get a single material category with its materials
   * @access Public
   */
  app.get('/material-categories/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const category = await prisma.materialCategory.findUnique({
        where: { id },
        include: { materials: true },
      });

      if (!category) {
        return errorResponse(c, 'NOT_FOUND', 'Material category not found', 404);
      }

      return successResponse(c, category);
    } catch (error) {
      console.error('Get material category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get material category', 500);
    }
  });

  /**
   * @route POST /material-categories
   * @description Create a new material category
   * @access Admin only
   */
  app.post('/material-categories', authenticate(), requireRole('ADMIN'), validate(createMaterialCategorySchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createMaterialCategorySchema>>(c);
      const slug = generateSlug(body.name);
      const category = await prisma.materialCategory.create({ data: { ...body, slug } });
      return successResponse(c, category, 201);
    } catch (error) {
      console.error('Create material category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create material category', 500);
    }
  });

  /**
   * @route PUT /material-categories/:id
   * @description Update a material category
   * @access Admin only
   */
  app.put('/material-categories/:id', authenticate(), requireRole('ADMIN'), validate(updateMaterialCategorySchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<z.infer<typeof updateMaterialCategorySchema>>(c);

      const updateData: Record<string, unknown> = { ...body };
      if (body.name) {
        updateData.slug = generateSlug(body.name);
      }

      const category = await prisma.materialCategory.update({ where: { id }, data: updateData });
      return successResponse(c, category);
    } catch (error) {
      console.error('Update material category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update material category', 500);
    }
  });

  /**
   * @route DELETE /material-categories/:id
   * @description Delete a material category (only if no materials exist)
   * @access Admin only
   */
  app.delete('/material-categories/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');

      // Check if category has materials
      const count = await prisma.material.count({ where: { categoryId: id } });
      if (count > 0) {
        return errorResponse(c, 'CONFLICT', 'Không thể xóa danh mục đang có vật dụng', 409);
      }

      await prisma.materialCategory.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('Delete material category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete material category', 500);
    }
  });


  // ============================================
  // MATERIALS ROUTES
  // ============================================

  /**
   * @route GET /materials
   * @description Get all active materials, optionally filtered by category
   * @access Public
   */
  app.get('/materials', async (c) => {
    try {
      const categoryId = c.req.query('categoryId');
      const materials = await prisma.material.findMany({
        where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
        orderBy: [{ order: 'asc' }],
        include: { category: true },
      });
      return successResponse(c, materials);
    } catch (error) {
      console.error('Get materials error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get materials', 500);
    }
  });

  /**
   * @route POST /materials
   * @description Create a new material
   * @access Admin only
   */
  app.post('/materials', authenticate(), requireRole('ADMIN'), validate(createMaterialSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createMaterialSchema>>(c);
      const material = await prisma.material.create({
        data: body,
        include: { category: true },
      });
      return successResponse(c, material, 201);
    } catch (error) {
      console.error('Create material error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create material', 500);
    }
  });

  /**
   * @route PUT /materials/:id
   * @description Update a material
   * @access Admin only
   */
  app.put('/materials/:id', authenticate(), requireRole('ADMIN'), validate(updateMaterialSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<z.infer<typeof updateMaterialSchema>>(c);
      const material = await prisma.material.update({
        where: { id },
        data: body,
        include: { category: true },
      });
      return successResponse(c, material);
    } catch (error) {
      console.error('Update material error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update material', 500);
    }
  });

  /**
   * @route DELETE /materials/:id
   * @description Delete a material
   * @access Admin only
   */
  app.delete('/materials/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.material.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('Delete material error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete material', 500);
    }
  });

  // ============================================
  // FORMULAS ROUTES
  // ============================================

  /**
   * @route GET /formulas
   * @description Get all active formulas
   * @access Admin only
   */
  app.get('/formulas', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const formulas = await prisma.formula.findMany({ where: { isActive: true } });
      return successResponse(c, formulas);
    } catch (error) {
      console.error('Get formulas error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get formulas', 500);
    }
  });

  /**
   * @route POST /formulas
   * @description Create a new formula
   * @access Admin only
   */
  app.post('/formulas', authenticate(), requireRole('ADMIN'), validate(createFormulaSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createFormulaSchema>>(c);
      const formula = await prisma.formula.create({ data: body });
      return successResponse(c, formula, 201);
    } catch (error) {
      console.error('Create formula error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create formula', 500);
    }
  });

  /**
   * @route PUT /formulas/:id
   * @description Update a formula
   * @access Admin only
   */
  app.put('/formulas/:id', authenticate(), requireRole('ADMIN'), validate(updateFormulaSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<z.infer<typeof updateFormulaSchema>>(c);
      const formula = await prisma.formula.update({ where: { id }, data: body });
      return successResponse(c, formula);
    } catch (error) {
      console.error('Update formula error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update formula', 500);
    }
  });


  // ============================================
  // QUOTE CALCULATION ROUTE
  // ============================================

  /**
   * @route POST /calculate-quote
   * @description Calculate quote based on service category, area, and materials
   * @access Public
   */
  app.post('/calculate-quote', validate(calculateQuoteSchema), async (c) => {
    try {
      const { categoryId, area, materialIds } = getValidatedBody<z.infer<typeof calculateQuoteSchema>>(c);

      // Get category with formula
      const category = await prisma.serviceCategory.findUnique({
        where: { id: categoryId },
        include: { formula: true, materialCategories: true },
      });

      if (!category) {
        return errorResponse(c, 'NOT_FOUND', 'Category not found', 404);
      }

      const allowMaterials = category.materialCategories.length > 0;

      // Get unit prices
      const unitPrices = await prisma.unitPrice.findMany({ where: { isActive: true } });
      const priceMap: Record<string, number> = {};
      unitPrices.forEach(p => { priceMap[p.tag] = p.price; });
      priceMap['DIEN_TICH'] = area;

      // Calculate base price from formula
      let basePrice = 0;
      if (category.formula) {
        // Simple expression evaluation (e.g., "DIEN_TICH * DON_GIA_SON")
        const expr = category.formula.expression;
        const tokens = expr.split(/\s*([+\-*/])\s*/);
        let result = 0;
        let operator = '+';
        for (const token of tokens) {
          if (['+', '-', '*', '/'].includes(token)) {
            operator = token;
          } else {
            const value = priceMap[token] || parseFloat(token) || 0;
            switch (operator) {
              case '+': result += value; break;
              case '-': result -= value; break;
              case '*': result *= value; break;
              case '/': result = value !== 0 ? result / value : result; break;
            }
          }
        }
        basePrice = result;
      }

      // Apply coefficient
      const priceWithCoefficient = basePrice * category.coefficient;

      // Add materials
      let materialsTotal = 0;
      const selectedMaterials: SelectedMaterial[] = [];
      if (materialIds && materialIds.length > 0 && allowMaterials) {
        const materials = await prisma.material.findMany({ where: { id: { in: materialIds } } });
        materials.forEach(m => {
          materialsTotal += m.price;
          selectedMaterials.push({ id: m.id, name: m.name, price: m.price });
        });
      }

      const total = priceWithCoefficient + materialsTotal;

      return successResponse(c, {
        category: { id: category.id, name: category.name, coefficient: category.coefficient },
        area,
        basePrice,
        priceWithCoefficient,
        materials: selectedMaterials,
        materialsTotal,
        total,
      });
    } catch (error) {
      console.error('Quote calculation error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Calculation failed', 500);
    }
  });

  return app;
}

export default { createPricingRoutes };
