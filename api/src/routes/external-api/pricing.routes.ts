/**
 * External API - Pricing Routes
 *
 * API key authenticated routes for pricing configuration
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../../utils/response';
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
 * Create pricing routes for external API
 */
export function createPricingRoutes(prisma: PrismaClient, apiKeyAuth: ApiKeyAuthFn) {
  const app = new Hono();

  // ============================================
  // SERVICE CATEGORIES
  // ============================================

  /**
   * @route GET /pricing/service-categories
   * @description Get all service categories
   * @access API Key (pricing permission required)
   */
  app.get('/service-categories', apiKeyAuth(), async (c) => {
    try {
      const categories = await prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          formula: true,
          materialCategories: { include: { materialCategory: true } },
        },
      });

      const result = categories.map((cat) => ({
        ...cat,
        materialCategoryIds: cat.materialCategories.map((mc) => mc.materialCategoryId),
        allowMaterials: cat.materialCategories.length > 0,
      }));

      return successResponse(c, result);
    } catch (error) {
      console.error('External API - Get service categories error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get service categories', 500);
    }
  });

  /**
   * @route POST /pricing/service-categories
   * @description Create a new service category
   * @access API Key (pricing permission, READ_WRITE or FULL_ACCESS)
   */
  app.post('/service-categories', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const { materialCategoryIds, ...categoryData } = body;

      const slug = generateSlug(categoryData.name);

      const category = await prisma.serviceCategory.create({
        data: { ...categoryData, slug },
        include: { formula: true },
      });

      if (materialCategoryIds && materialCategoryIds.length > 0) {
        await prisma.serviceCategoryMaterialCategory.createMany({
          data: materialCategoryIds.map((mcId: string) => ({
            serviceCategoryId: category.id,
            materialCategoryId: mcId,
          })),
        });
      }

      return successResponse(c, category, 201);
    } catch (error) {
      console.error('External API - Create service category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create service category', 500);
    }
  });

  /**
   * @route PUT /pricing/service-categories/:id
   * @description Update a service category
   * @access API Key (pricing permission, READ_WRITE or FULL_ACCESS)
   */
  app.put('/service-categories/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const { materialCategoryIds, ...categoryData } = body;

      const updateData: Record<string, unknown> = { ...categoryData };
      if (categoryData.name) {
        updateData.slug = generateSlug(categoryData.name);
      }

      const category = await prisma.serviceCategory.update({
        where: { id },
        data: updateData,
        include: { formula: true },
      });

      if (materialCategoryIds !== undefined) {
        await prisma.serviceCategoryMaterialCategory.deleteMany({ where: { serviceCategoryId: id } });
        if (materialCategoryIds.length > 0) {
          await prisma.serviceCategoryMaterialCategory.createMany({
            data: materialCategoryIds.map((mcId: string) => ({
              serviceCategoryId: id,
              materialCategoryId: mcId,
            })),
          });
        }
      }

      return successResponse(c, category);
    } catch (error) {
      console.error('External API - Update service category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update service category', 500);
    }
  });

  /**
   * @route DELETE /pricing/service-categories/:id
   * @description Delete a service category
   * @access API Key (pricing permission, FULL_ACCESS)
   */
  app.delete('/service-categories/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.serviceCategoryMaterialCategory.deleteMany({ where: { serviceCategoryId: id } });
      await prisma.serviceCategory.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Delete service category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete service category', 500);
    }
  });

  // ============================================
  // UNIT PRICES
  // ============================================

  /**
   * @route GET /pricing/unit-prices
   * @description Get all unit prices
   * @access API Key (pricing permission required)
   */
  app.get('/unit-prices', apiKeyAuth(), async (c) => {
    try {
      const prices = await prisma.unitPrice.findMany({
        where: { isActive: true },
        orderBy: { category: 'asc' },
      });
      return successResponse(c, prices);
    } catch (error) {
      console.error('External API - Get unit prices error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get unit prices', 500);
    }
  });

  /**
   * @route POST /pricing/unit-prices
   * @description Create a new unit price
   * @access API Key (pricing permission, READ_WRITE or FULL_ACCESS)
   */
  app.post('/unit-prices', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const price = await prisma.unitPrice.create({ data: body });
      return successResponse(c, price, 201);
    } catch (error) {
      console.error('External API - Create unit price error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create unit price', 500);
    }
  });

  /**
   * @route PUT /pricing/unit-prices/:id
   * @description Update a unit price
   * @access API Key (pricing permission, READ_WRITE or FULL_ACCESS)
   */
  app.put('/unit-prices/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const price = await prisma.unitPrice.update({ where: { id }, data: body });
      return successResponse(c, price);
    } catch (error) {
      console.error('External API - Update unit price error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update unit price', 500);
    }
  });

  /**
   * @route DELETE /pricing/unit-prices/:id
   * @description Delete a unit price
   * @access API Key (pricing permission, FULL_ACCESS)
   */
  app.delete('/unit-prices/:id', apiKeyAuth(), async (c) => {
    try {
      const id = c.req.param('id');
      await prisma.unitPrice.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('External API - Delete unit price error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete unit price', 500);
    }
  });

  // ============================================
  // FORMULAS
  // ============================================

  /**
   * @route GET /pricing/formulas
   * @description Get all formulas
   * @access API Key (pricing permission required)
   */
  app.get('/formulas', apiKeyAuth(), async (c) => {
    try {
      const formulas = await prisma.formula.findMany({ where: { isActive: true } });
      return successResponse(c, formulas);
    } catch (error) {
      console.error('External API - Get formulas error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get formulas', 500);
    }
  });

  /**
   * @route POST /pricing/formulas
   * @description Create a new formula
   * @access API Key (pricing permission, READ_WRITE or FULL_ACCESS)
   */
  app.post('/formulas', apiKeyAuth(), async (c) => {
    try {
      const body = await c.req.json();
      const formula = await prisma.formula.create({ data: body });
      return successResponse(c, formula, 201);
    } catch (error) {
      console.error('External API - Create formula error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create formula', 500);
    }
  });

  // ============================================
  // CALCULATE QUOTE
  // ============================================

  /**
   * @route POST /pricing/calculate-quote
   * @description Calculate quote based on category, area, and materials
   * @access API Key (pricing permission required)
   */
  app.post('/calculate-quote', apiKeyAuth(), async (c) => {
    try {
      const { categoryId, area, materialIds } = await c.req.json();

      const category = await prisma.serviceCategory.findUnique({
        where: { id: categoryId },
        include: { formula: true, materialCategories: true },
      });

      if (!category) {
        return errorResponse(c, 'NOT_FOUND', 'Category not found', 404);
      }

      const unitPrices = await prisma.unitPrice.findMany({ where: { isActive: true } });
      const priceMap: Record<string, number> = {};
      unitPrices.forEach((p) => {
        priceMap[p.tag] = p.price;
      });
      priceMap['DIEN_TICH'] = area;

      let basePrice = 0;
      if (category.formula) {
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
              case '+':
                result += value;
                break;
              case '-':
                result -= value;
                break;
              case '*':
                result *= value;
                break;
              case '/':
                result = value !== 0 ? result / value : result;
                break;
            }
          }
        }
        basePrice = result;
      }

      const priceWithCoefficient = basePrice * category.coefficient;

      let materialsTotal = 0;
      const selectedMaterials: Array<{ id: string; name: string; price: number }> = [];
      if (materialIds && materialIds.length > 0) {
        const materials = await prisma.material.findMany({ where: { id: { in: materialIds } } });
        materials.forEach((m) => {
          materialsTotal += m.price;
          selectedMaterials.push({ id: m.id, name: m.name, price: m.price });
        });
      }

      return successResponse(c, {
        category: { id: category.id, name: category.name, coefficient: category.coefficient },
        area,
        basePrice,
        priceWithCoefficient,
        materials: selectedMaterials,
        materialsTotal,
        total: priceWithCoefficient + materialsTotal,
      });
    } catch (error) {
      console.error('External API - Calculate quote error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to calculate quote', 500);
    }
  });

  return app;
}
