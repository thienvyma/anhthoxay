/**
 * Pricing Firestore Routes
 * 
 * Handles CRUD operations for pricing-related entities using Firestore:
 * - Service Categories
 * - Unit Prices
 * - Material Categories
 * - Materials
 * - Formulas
 * - Quote Calculation
 * 
 * @module routes/firestore/pricing.firestore.routes
 * @requirements 3.4
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { firebaseAuth, requireRole } from '../../middleware/firebase-auth.middleware';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import {
  getServiceCategoryFirestoreService,
  getUnitPriceFirestoreService,
  getMaterialCategoryFirestoreService,
  getMaterialFirestoreService,
  getFormulaFirestoreService,
  getQuoteCalculationService,
  PricingFirestoreError,
} from '../../services/firestore/pricing.firestore';

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
// ERROR HANDLER
// ============================================

function handlePricingError(c: Parameters<typeof errorResponse>[0], error: unknown) {
  if (error instanceof PricingFirestoreError) {
    return errorResponse(c, error.code, error.message, error.statusCode);
  }
  logger.error('Pricing error', { error: error instanceof Error ? error.message : 'Unknown error' });
  return errorResponse(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

// ============================================
// PUBLIC PRICING ROUTES
// ============================================

/**
 * Create public pricing routes (no auth required)
 */
export function createPricingFirestoreRoutes() {
  const app = new Hono();

  // ============================================
  // SERVICE CATEGORIES ROUTES (Public)
  // ============================================

  /**
   * @route GET /service-categories
   * @description Get all active service categories with formulas
   * @access Public
   */
  app.get('/service-categories', async (c) => {
    try {
      const service = getServiceCategoryFirestoreService();
      const categories = await service.getAllActive();
      return successResponse(c, categories);
    } catch (error) {
      return handlePricingError(c, error);
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
      const service = getServiceCategoryFirestoreService();
      const category = await service.getByIdWithFormula(id);

      if (!category) {
        return errorResponse(c, 'NOT_FOUND', 'Service category not found', 404);
      }

      return successResponse(c, category);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  // ============================================
  // UNIT PRICES ROUTES (Public)
  // ============================================

  /**
   * @route GET /unit-prices
   * @description Get all active unit prices
   * @access Public
   */
  app.get('/unit-prices', async (c) => {
    try {
      const service = getUnitPriceFirestoreService();
      const prices = await service.getAllActive();
      return successResponse(c, prices);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  // ============================================
  // MATERIAL CATEGORIES ROUTES (Public)
  // ============================================

  /**
   * @route GET /material-categories
   * @description Get all active material categories with material count
   * @access Public
   */
  app.get('/material-categories', async (c) => {
    try {
      const service = getMaterialCategoryFirestoreService();
      const categories = await service.getAllActiveWithCount();
      return successResponse(c, categories);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route GET /material-categories/:id
   * @description Get a single material category by ID
   * @access Public
   */
  app.get('/material-categories/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const service = getMaterialCategoryFirestoreService();
      const category = await service.getCategoryById(id);

      if (!category) {
        return errorResponse(c, 'NOT_FOUND', 'Material category not found', 404);
      }

      return successResponse(c, category);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  // ============================================
  // MATERIALS ROUTES (Public)
  // ============================================

  /**
   * @route GET /materials
   * @description Get all active materials, optionally filtered by category
   * @access Public
   */
  app.get('/materials', async (c) => {
    try {
      const categoryId = c.req.query('categoryId');
      const service = getMaterialFirestoreService();
      const materials = await service.getAllActive(categoryId);
      return successResponse(c, materials);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  // ============================================
  // QUOTE CALCULATION ROUTE (Public)
  // ============================================

  /**
   * @route POST /calculate-quote
   * @description Calculate quote based on service category, area, and materials
   * @access Public
   */
  app.post('/calculate-quote', validate(calculateQuoteSchema), async (c) => {
    try {
      const input = getValidatedBody<z.infer<typeof calculateQuoteSchema>>(c);
      const service = getQuoteCalculationService();
      const result = await service.calculateQuote(input);
      return successResponse(c, result);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  return app;
}

// ============================================
// ADMIN PRICING ROUTES
// ============================================

/**
 * Create admin pricing routes (requires ADMIN role)
 */
export function createAdminPricingFirestoreRoutes() {
  const app = new Hono();

  // Apply Firebase Auth middleware to all admin routes
  app.use('/*', firebaseAuth());
  app.use('/*', requireRole('ADMIN'));

  // ============================================
  // SERVICE CATEGORIES ADMIN ROUTES
  // ============================================

  /**
   * @route POST /service-categories
   * @description Create a new service category
   * @access Admin only
   */
  app.post('/service-categories', validate(createServiceCategorySchema), async (c) => {
    try {
      const input = getValidatedBody<z.infer<typeof createServiceCategorySchema>>(c);
      const service = getServiceCategoryFirestoreService();
      const category = await service.createCategory(input);
      return successResponse(c, category, 201);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route PUT /service-categories/:id
   * @description Update a service category
   * @access Admin only
   */
  app.put('/service-categories/:id', validate(updateServiceCategorySchema), async (c) => {
    try {
      const id = c.req.param('id');
      const input = getValidatedBody<z.infer<typeof updateServiceCategorySchema>>(c);
      const service = getServiceCategoryFirestoreService();
      const category = await service.updateCategory(id, input);
      return successResponse(c, category);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route DELETE /service-categories/:id
   * @description Delete a service category
   * @access Admin only
   */
  app.delete('/service-categories/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const service = getServiceCategoryFirestoreService();
      await service.deleteCategory(id);
      return successResponse(c, { ok: true });
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  // ============================================
  // UNIT PRICES ADMIN ROUTES
  // ============================================

  /**
   * @route POST /unit-prices
   * @description Create a new unit price
   * @access Admin only
   */
  app.post('/unit-prices', validate(createUnitPriceSchema), async (c) => {
    try {
      const input = getValidatedBody<z.infer<typeof createUnitPriceSchema>>(c);
      const service = getUnitPriceFirestoreService();
      const price = await service.createUnitPrice(input);
      return successResponse(c, price, 201);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route PUT /unit-prices/:id
   * @description Update a unit price
   * @access Admin only
   */
  app.put('/unit-prices/:id', validate(updateUnitPriceSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const input = getValidatedBody<z.infer<typeof updateUnitPriceSchema>>(c);
      const service = getUnitPriceFirestoreService();
      const price = await service.updateUnitPrice(id, input);
      return successResponse(c, price);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route DELETE /unit-prices/:id
   * @description Delete a unit price
   * @access Admin only
   */
  app.delete('/unit-prices/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const service = getUnitPriceFirestoreService();
      await service.deleteUnitPrice(id);
      return successResponse(c, { ok: true });
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  // ============================================
  // MATERIAL CATEGORIES ADMIN ROUTES
  // ============================================

  /**
   * @route POST /material-categories
   * @description Create a new material category
   * @access Admin only
   */
  app.post('/material-categories', validate(createMaterialCategorySchema), async (c) => {
    try {
      const input = getValidatedBody<z.infer<typeof createMaterialCategorySchema>>(c);
      const service = getMaterialCategoryFirestoreService();
      const category = await service.createCategory(input);
      return successResponse(c, category, 201);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route PUT /material-categories/:id
   * @description Update a material category
   * @access Admin only
   */
  app.put('/material-categories/:id', validate(updateMaterialCategorySchema), async (c) => {
    try {
      const id = c.req.param('id');
      const input = getValidatedBody<z.infer<typeof updateMaterialCategorySchema>>(c);
      const service = getMaterialCategoryFirestoreService();
      const category = await service.updateCategory(id, input);
      return successResponse(c, category);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route DELETE /material-categories/:id
   * @description Delete a material category (only if no materials exist)
   * @access Admin only
   */
  app.delete('/material-categories/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const service = getMaterialCategoryFirestoreService();
      await service.deleteCategory(id);
      return successResponse(c, { ok: true });
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  // ============================================
  // MATERIALS ADMIN ROUTES
  // ============================================

  /**
   * @route POST /materials
   * @description Create a new material
   * @access Admin only
   */
  app.post('/materials', validate(createMaterialSchema), async (c) => {
    try {
      const input = getValidatedBody<z.infer<typeof createMaterialSchema>>(c);
      const service = getMaterialFirestoreService();
      const material = await service.createMaterial(input);
      return successResponse(c, material, 201);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route PUT /materials/:id
   * @description Update a material
   * @access Admin only
   */
  app.put('/materials/:id', validate(updateMaterialSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const input = getValidatedBody<z.infer<typeof updateMaterialSchema>>(c);
      const service = getMaterialFirestoreService();
      const material = await service.updateMaterial(id, input);
      return successResponse(c, material);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route DELETE /materials/:id
   * @description Delete a material
   * @access Admin only
   */
  app.delete('/materials/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const service = getMaterialFirestoreService();
      await service.deleteMaterial(id);
      return successResponse(c, { ok: true });
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  // ============================================
  // FORMULAS ADMIN ROUTES
  // ============================================

  /**
   * @route GET /formulas
   * @description Get all active formulas
   * @access Admin only
   */
  app.get('/formulas', async (c) => {
    try {
      const service = getFormulaFirestoreService();
      const formulas = await service.getAllActive();
      return successResponse(c, formulas);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route POST /formulas
   * @description Create a new formula
   * @access Admin only
   */
  app.post('/formulas', validate(createFormulaSchema), async (c) => {
    try {
      const input = getValidatedBody<z.infer<typeof createFormulaSchema>>(c);
      const service = getFormulaFirestoreService();
      const formula = await service.createFormula(input);
      return successResponse(c, formula, 201);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  /**
   * @route PUT /formulas/:id
   * @description Update a formula
   * @access Admin only
   */
  app.put('/formulas/:id', validate(updateFormulaSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const input = getValidatedBody<z.infer<typeof updateFormulaSchema>>(c);
      const service = getFormulaFirestoreService();
      const formula = await service.updateFormula(id, input);
      return successResponse(c, formula);
    } catch (error) {
      return handlePricingError(c, error);
    }
  });

  return app;
}
