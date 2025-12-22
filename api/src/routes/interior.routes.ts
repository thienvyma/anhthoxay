/**
 * Interior Routes Module
 *
 * Handles interior quote module management (public listing and admin CRUD).
 *
 * **Feature: interior-quote-module**
 * **Requirements: 18.1, 18.2**
 *
 * @route /api/interior - Public interior routes
 * @route /api/admin/interior - Admin interior management routes
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';
import {
  developerService,
  developmentService,
  buildingService,
  buildingUnitService,
  layoutService,
  packageService,
  surchargeService,
  quoteSettingsService,
  roomTypeService,
  furnitureService,
  quoteService,
} from '../services/interior';
import {
  CreateDeveloperSchema,
  UpdateDeveloperSchema,
  ReorderDevelopersSchema,
  CreateDevelopmentSchema,
  UpdateDevelopmentSchema,
  ListDevelopmentsQuerySchema,
  CreateBuildingSchema,
  UpdateBuildingSchema,
  ListBuildingsQuerySchema,
  CreateBuildingUnitSchema,
  UpdateBuildingUnitSchema,
  CreateLayoutSchema,
  UpdateLayoutSchema,
  CloneLayoutSchema,
  ListLayoutsQuerySchema,
  CreatePackageSchema,
  UpdatePackageSchema,
  ClonePackageSchema,
  ListPackagesQuerySchema,
  CreateSurchargeSchema,
  UpdateSurchargeSchema,
  TestSurchargeSchema,
  UpdateQuoteSettingsSchema,
  CreateRoomTypeSchema,
  UpdateRoomTypeSchema,
  ReorderRoomTypesSchema,
  CreateFurnitureCategorySchema,
  UpdateFurnitureCategorySchema,
  CreateFurnitureItemSchema,
  UpdateFurnitureItemSchema,
  ListFurnitureItemsQuerySchema,
  CalculateQuoteSchema,
  SaveQuoteSchema,
  ListQuotesQuerySchema,
  UpdateQuoteStatusSchema,
} from '../schemas/interior.schema';
import type {
  CreateDeveloperInput,
  UpdateDeveloperInput,
  CreateDevelopmentInput,
  UpdateDevelopmentInput,
  CreateBuildingInput,
  UpdateBuildingInput,
  CreateBuildingUnitInput,
  UpdateBuildingUnitInput,
  CreateLayoutInput,
  UpdateLayoutInput,
  CreatePackageInput,
  UpdatePackageInput,
  CreateSurchargeInput,
  UpdateSurchargeInput,
  UpdateQuoteSettingsInput,
  CreateRoomTypeInput,
  UpdateRoomTypeInput,
  CreateFurnitureCategoryInput,
  UpdateFurnitureCategoryInput,
  CreateFurnitureItemInput,
  UpdateFurnitureItemInput,
  CalculateQuoteInput,
  SaveQuoteInput,
  UpdateQuoteStatusInput,
} from '../schemas/interior.schema';
import type { ListOptions, UnitType, UnitPosition } from '../services/interior/types';

// ============================================
// PUBLIC INTERIOR ROUTES FACTORY
// ============================================

/**
 * Create public interior routes with dependency injection
 * @param _prisma - Prisma client instance (unused, services use shared instance)
 * @returns Hono app with public interior routes
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Keeping for API consistency with other route factories
export function createInteriorRoutes(_prisma: PrismaClient) {
  const app = new Hono();

  // ============================================
  // PUBLIC DEVELOPER ROUTES
  // ============================================

  /**
   * @route GET /api/interior/developers
   * @description Get all active developers
   * @access Public
   */
  app.get('/developers', async (c) => {
    try {
      const result = await developerService.listDevelopers({ isActive: true });
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get developers error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get developers', 500);
    }
  });

  /**
   * @route GET /api/interior/developers/:id
   * @description Get developer by ID
   * @access Public
   */
  app.get('/developers/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const developer = await developerService.getDeveloperById(id);

      if (!developer || !developer.isActive) {
        return errorResponse(c, 'NOT_FOUND', 'Chủ đầu tư không tồn tại', 404);
      }

      return successResponse(c, developer);
    } catch (error) {
      console.error('Get developer error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get developer', 500);
    }
  });

  // ============================================
  // PUBLIC DEVELOPMENT ROUTES
  // ============================================

  /**
   * @route GET /api/interior/developments
   * @description Get all active developments
   * @access Public
   */
  app.get('/developments', validateQuery(ListDevelopmentsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{ developerId?: string; page?: number; limit?: number }>(c);
      const result = await developmentService.listDevelopments({
        ...query,
        isActive: true,
      });
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get developments error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get developments', 500);
    }
  });

  /**
   * @route GET /api/interior/developments/:id
   * @description Get development by ID
   * @access Public
   */
  app.get('/developments/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const development = await developmentService.getDevelopmentById(id);

      if (!development || !development.isActive) {
        return errorResponse(c, 'NOT_FOUND', 'Dự án không tồn tại', 404);
      }

      return successResponse(c, development);
    } catch (error) {
      console.error('Get development error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get development', 500);
    }
  });

  // ============================================
  // PUBLIC BUILDING ROUTES
  // ============================================

  /**
   * @route GET /api/interior/buildings
   * @description Get all active buildings
   * @access Public
   */
  app.get('/buildings', validateQuery(ListBuildingsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{ developmentId?: string; page?: number; limit?: number }>(c);
      const result = await buildingService.listBuildings({
        ...query,
        isActive: true,
      });
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get buildings error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get buildings', 500);
    }
  });

  /**
   * @route GET /api/interior/buildings/:id
   * @description Get building by ID with units
   * @access Public
   */
  app.get('/buildings/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const building = await buildingService.getBuildingById(id);

      if (!building || !building.isActive) {
        return errorResponse(c, 'NOT_FOUND', 'Tòa nhà không tồn tại', 404);
      }

      return successResponse(c, building);
    } catch (error) {
      console.error('Get building error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get building', 500);
    }
  });

  /**
   * @route GET /api/interior/buildings/:id/units
   * @description Get building units matrix
   * @access Public
   */
  app.get('/buildings/:id/units', async (c) => {
    try {
      const id = c.req.param('id');
      const units = await buildingUnitService.listBuildingUnits({ buildingId: id });
      return successResponse(c, units);
    } catch (error) {
      console.error('Get building units error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get building units', 500);
    }
  });

  /**
   * @route GET /api/interior/buildings/:id/units/lookup
   * @description Lookup unit by code (e.g., S1.17.07 -> floor 17, axis 07)
   * @access Public
   */
  app.get('/buildings/:id/units/lookup', async (c) => {
    try {
      const buildingId = c.req.param('id');
      const code = c.req.query('code');

      if (!code) {
        return errorResponse(c, 'VALIDATION_ERROR', 'Mã căn hộ không được để trống', 400);
      }

      // Get building to parse unit code format
      const building = await buildingService.getBuildingById(buildingId);
      if (!building || !building.isActive) {
        return errorResponse(c, 'NOT_FOUND', 'Tòa nhà không tồn tại', 404);
      }

      // Parse unit code based on format (e.g., S1.{floor}.{axis} -> S1.17.07)
      // Extract floor and axis from code
      const parts = code.split('.');
      if (parts.length < 3) {
        return errorResponse(c, 'VALIDATION_ERROR', 'Mã căn hộ không đúng định dạng', 400);
      }

      const floor = parseInt(parts[1], 10);
      const axis = parts[2];

      if (isNaN(floor)) {
        return errorResponse(c, 'VALIDATION_ERROR', 'Số tầng không hợp lệ', 400);
      }

      // Validate floor range
      if (floor < building.startFloor || floor > (building.endFloor ?? building.totalFloors)) {
        return errorResponse(c, 'NOT_FOUND', `Tầng ${floor} không tồn tại trong tòa nhà này`, 404);
      }

      // Find unit by axis and floor
      const unitData = await buildingUnitService.resolveUnitFromCode(buildingId, floor, axis);

      if (!unitData) {
        return errorResponse(c, 'NOT_FOUND', 'Không tìm thấy căn hộ với mã này', 404);
      }

      // Return unit and layout in format expected by frontend
      return successResponse(c, {
        unit: {
          id: unitData.id,
          code: code,
          axis: unitData.axis,
          floor: floor,
          unitType: unitData.unitType,
          bedrooms: unitData.bedrooms,
          bathrooms: unitData.bathrooms,
          position: unitData.position,
          direction: unitData.direction,
          view: unitData.view,
          buildingId: unitData.buildingId,
        },
        layout: unitData.layout,
      });
    } catch (error) {
      console.error('Lookup unit error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to lookup unit', 500);
    }
  });

  // ============================================
  // PUBLIC LAYOUT ROUTES
  // ============================================

  /**
   * @route GET /api/interior/layouts/:id
   * @description Get layout details
   * @access Public
   */
  app.get('/layouts/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const layout = await layoutService.getLayoutById(id);

      if (!layout || !layout.isActive) {
        return errorResponse(c, 'NOT_FOUND', 'Layout không tồn tại', 404);
      }

      return successResponse(c, layout);
    } catch (error) {
      console.error('Get layout error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get layout', 500);
    }
  });

  // ============================================
  // PUBLIC PACKAGE ROUTES
  // ============================================

  /**
   * @route GET /api/interior/packages
   * @description Get all active packages
   * @access Public
   */
  app.get('/packages', validateQuery(ListPackagesQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{ layoutId?: string; tier?: number; page?: number; limit?: number }>(c);
      const result = await packageService.listPackages({
        ...query,
        isActive: true,
      });
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get packages error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get packages', 500);
    }
  });

  /**
   * @route GET /api/interior/packages/:id
   * @description Get package details with items
   * @access Public
   */
  app.get('/packages/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const pkg = await packageService.getPackageById(id);

      if (!pkg || !pkg.isActive) {
        return errorResponse(c, 'NOT_FOUND', 'Gói nội thất không tồn tại', 404);
      }

      return successResponse(c, pkg);
    } catch (error) {
      console.error('Get package error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get package', 500);
    }
  });

  // ============================================
  // PUBLIC QUOTE ROUTES
  // ============================================

  /**
   * @route POST /api/interior/quotes/calculate
   * @description Calculate quote without saving
   * @access Public
   */
  app.post('/quotes/calculate', validate(CalculateQuoteSchema), async (c) => {
    try {
      const data = getValidatedBody<CalculateQuoteInput>(c);
      const result = await quoteService.calculateQuote(data);
      return successResponse(c, result);
    } catch (error) {
      console.error('Calculate quote error:', error);
      if (error instanceof Error) {
        return errorResponse(c, 'CALCULATION_ERROR', error.message, 400);
      }
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to calculate quote', 500);
    }
  });

  /**
   * @route POST /api/interior/quotes
   * @description Save quote and create CustomerLead
   * @access Public
   */
  app.post('/quotes', validate(SaveQuoteSchema), async (c) => {
    try {
      const data = getValidatedBody<SaveQuoteInput>(c);
      const quote = await quoteService.saveQuote(data);
      return successResponse(c, quote, 201);
    } catch (error) {
      console.error('Save quote error:', error);
      if (error instanceof Error) {
        return errorResponse(c, 'SAVE_ERROR', error.message, 400);
      }
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to save quote', 500);
    }
  });

  /**
   * @route GET /api/interior/quotes/:code
   * @description Get quote by code (public view)
   * @access Public
   */
  app.get('/quotes/:code', async (c) => {
    try {
      const code = c.req.param('code');
      const quote = await quoteService.getQuoteByCode(code);

      if (!quote) {
        return errorResponse(c, 'NOT_FOUND', 'Báo giá không tồn tại', 404);
      }

      return successResponse(c, quote);
    } catch (error) {
      console.error('Get quote error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get quote', 500);
    }
  });

  // ============================================
  // PUBLIC FURNITURE ROUTES
  // ============================================

  /**
   * @route GET /api/interior/furniture/categories
   * @description Get all active furniture categories
   * @access Public
   */
  app.get('/furniture/categories', async (c) => {
    try {
      const result = await furnitureService.listCategories({ isActive: true });
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get furniture categories error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture categories', 500);
    }
  });

  /**
   * @route GET /api/interior/furniture/items
   * @description Get all active furniture items with optional category filter
   * @access Public
   */
  app.get('/furniture/items', validateQuery(ListFurnitureItemsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{ categoryId?: string; page?: number; limit?: number }>(c);
      const result = await furnitureService.listItems({
        ...query,
        isActive: true,
      });
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get furniture items error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture items', 500);
    }
  });

  /**
   * @route GET /api/interior/furniture/items/:id
   * @description Get furniture item by ID
   * @access Public
   */
  app.get('/furniture/items/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const item = await furnitureService.getItemById(id);

      if (!item || !item.isActive) {
        return errorResponse(c, 'NOT_FOUND', 'Sản phẩm không tồn tại', 404);
      }

      return successResponse(c, item);
    } catch (error) {
      console.error('Get furniture item error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture item', 500);
    }
  });

  return app;
}


// ============================================
// ADMIN INTERIOR ROUTES FACTORY
// ============================================

/**
 * Create admin interior routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with admin interior routes
 */
export function createAdminInteriorRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // Apply auth middleware to all admin routes
  app.use('*', authenticate(), requireRole('ADMIN'));

  // ============================================
  // ADMIN DEVELOPER ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/developers
   * @description Get all developers (including inactive)
   * @access ADMIN only
   */
  app.get('/developers', async (c) => {
    try {
      const result = await developerService.listDevelopers();
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get developers error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get developers', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/developers
   * @description Create a new developer
   * @access ADMIN only
   */
  app.post('/developers', validate(CreateDeveloperSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateDeveloperInput>(c);
      
      // Check for duplicate name
      const exists = await developerService.isDeveloperNameExists(data.name);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_NAME', 'Tên chủ đầu tư đã tồn tại', 400);
      }

      const developer = await developerService.createDeveloper(data);
      return successResponse(c, developer, 201);
    } catch (error) {
      console.error('Create developer error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create developer', 500);
    }
  });


  /**
   * @route PUT /api/admin/interior/developers/:id
   * @description Update a developer
   * @access ADMIN only
   */
  app.put('/developers/:id', validate(UpdateDeveloperSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateDeveloperInput>(c);

      // Check for duplicate name if updating name
      if (data.name) {
        const exists = await developerService.isDeveloperNameExists(data.name, id);
        if (exists) {
          return errorResponse(c, 'DUPLICATE_NAME', 'Tên chủ đầu tư đã tồn tại', 400);
        }
      }

      const developer = await developerService.updateDeveloper(id, data);
      return successResponse(c, developer);
    } catch (error) {
      console.error('Update developer error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update developer', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/developers/:id
   * @description Delete a developer
   * @access ADMIN only
   */
  app.delete('/developers/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await developerService.deleteDeveloper(id);

      if (!result.success) {
        return errorResponse(c, 'HAS_DEPENDENCIES', result.error || 'Không thể xóa', 400);
      }

      return successResponse(c, { message: 'Đã xóa chủ đầu tư thành công' });
    } catch (error) {
      console.error('Delete developer error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete developer', 500);
    }
  });

  /**
   * @route PUT /api/admin/interior/developers/reorder
   * @description Reorder developers
   * @access ADMIN only
   */
  app.put('/developers/reorder', validate(ReorderDevelopersSchema), async (c) => {
    try {
      const { items } = getValidatedBody<{ items: Array<{ id: string; order: number }> }>(c);
      await developerService.reorderDevelopers(items);
      return successResponse(c, { message: 'Đã cập nhật thứ tự thành công' });
    } catch (error) {
      console.error('Reorder developers error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reorder developers', 500);
    }
  });


  // ============================================
  // ADMIN DEVELOPMENT ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/developments
   * @description Get all developments (including inactive)
   * @access ADMIN only
   */
  app.get('/developments', validateQuery(ListDevelopmentsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{ developerId?: string; isActive?: boolean; page?: number; limit?: number }>(c);
      const result = await developmentService.listDevelopments(query);
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get developments error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get developments', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/developments
   * @description Create a new development
   * @access ADMIN only
   */
  app.post('/developments', validate(CreateDevelopmentSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateDevelopmentInput>(c);

      // Check for duplicate code
      const exists = await developmentService.isDevelopmentCodeExists(data.code);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_CODE', 'Mã dự án đã tồn tại', 400);
      }

      const development = await developmentService.createDevelopment(data);
      return successResponse(c, development, 201);
    } catch (error) {
      console.error('Create development error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create development', 500);
    }
  });

  /**
   * @route PUT /api/admin/interior/developments/:id
   * @description Update a development
   * @access ADMIN only
   */
  app.put('/developments/:id', validate(UpdateDevelopmentSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateDevelopmentInput>(c);

      // Check for duplicate code if updating code
      if (data.code) {
        const exists = await developmentService.isDevelopmentCodeExists(data.code, id);
        if (exists) {
          return errorResponse(c, 'DUPLICATE_CODE', 'Mã dự án đã tồn tại', 400);
        }
      }

      const development = await developmentService.updateDevelopment(id, data);
      return successResponse(c, development);
    } catch (error) {
      console.error('Update development error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update development', 500);
    }
  });


  /**
   * @route DELETE /api/admin/interior/developments/:id
   * @description Delete a development
   * @access ADMIN only
   */
  app.delete('/developments/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await developmentService.deleteDevelopment(id);

      if (!result.success) {
        return errorResponse(c, 'HAS_DEPENDENCIES', result.error || 'Kh�ng th? x�a', 400);
      }

      return successResponse(c, { message: 'Đã xóa dự án thành công' });
    } catch (error) {
      console.error('Delete development error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete development', 500);
    }
  });

  // ============================================
  // ADMIN BUILDING ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/buildings
   * @description Get all buildings (including inactive)
   * @access ADMIN only
   */
  app.get('/buildings', validateQuery(ListBuildingsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{ developmentId?: string; isActive?: boolean; page?: number; limit?: number }>(c);
      const result = await buildingService.listBuildings(query);
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get buildings error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get buildings', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/buildings
   * @description Create a new building
   * @access ADMIN only
   */
  app.post('/buildings', validate(CreateBuildingSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateBuildingInput>(c);

      // Check for duplicate code within development
      const exists = await buildingService.isBuildingCodeExists(data.developmentId, data.code);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_CODE', 'Mã tòa nhà đã tồn tại trong dự án này', 400);
      }

      const building = await buildingService.createBuilding(data);
      return successResponse(c, building, 201);
    } catch (error) {
      console.error('Create building error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create building', 500);
    }
  });


  /**
   * @route PUT /api/admin/interior/buildings/:id
   * @description Update a building
   * @access ADMIN only
   */
  app.put('/buildings/:id', validate(UpdateBuildingSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateBuildingInput>(c);

      const building = await buildingService.updateBuilding(id, data);
      return successResponse(c, building);
    } catch (error) {
      console.error('Update building error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update building', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/buildings/:id
   * @description Delete a building
   * @access ADMIN only
   */
  app.delete('/buildings/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await buildingService.deleteBuilding(id);

      if (!result.success) {
        return errorResponse(c, 'HAS_DEPENDENCIES', result.error || 'Kh�ng th? x�a', 400);
      }

      return successResponse(c, { message: 'Đã xóa tòa nhà thành công' });
    } catch (error) {
      console.error('Delete building error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete building', 500);
    }
  });

  // ============================================
  // ADMIN BUILDING UNIT ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/buildings/:id/units
   * @description Get building units
   * @access ADMIN only
   */
  app.get('/buildings/:id/units', async (c) => {
    try {
      const id = c.req.param('id');
      const units = await buildingUnitService.listBuildingUnits({ buildingId: id });
      return successResponse(c, units);
    } catch (error) {
      console.error('Get building units error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get building units', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/buildings/:id/units
   * @description Create a building unit
   * @access ADMIN only
   */
  app.post('/buildings/:id/units', validate(CreateBuildingUnitSchema), async (c) => {
    try {
      const buildingId = c.req.param('id');
      const data = getValidatedBody<CreateBuildingUnitInput>(c);

      const unit = await buildingUnitService.createBuildingUnit({ ...data, buildingId });
      return successResponse(c, unit, 201);
    } catch (error) {
      console.error('Create building unit error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create building unit', 500);
    }
  });


  /**
   * @route PUT /api/admin/interior/units/:id
   * @description Update a building unit
   * @access ADMIN only
   */
  app.put('/units/:id', validate(UpdateBuildingUnitSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateBuildingUnitInput>(c);

      const unit = await buildingUnitService.updateBuildingUnit(id, data);
      return successResponse(c, unit);
    } catch (error) {
      console.error('Update building unit error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update building unit', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/units/:id
   * @description Delete a building unit
   * @access ADMIN only
   */
  app.delete('/units/:id', async (c) => {
    try {
      const id = c.req.param('id');
      await buildingUnitService.deleteBuildingUnit(id);
      return successResponse(c, { message: 'Đã xóa căn hộ thành công' });
    } catch (error) {
      console.error('Delete building unit error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete building unit', 500);
    }
  });

  // ============================================
  // ADMIN LAYOUT ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/layouts
   * @description Get all layouts (including inactive)
   * @access ADMIN only
   */
  app.get('/layouts', validateQuery(ListLayoutsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{ unitType?: string; isActive?: boolean; page?: number; limit?: number }>(c);
      const result = await layoutService.listLayouts(query as ListOptions & { unitType?: UnitType; isActive?: boolean });
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get layouts error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get layouts', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/layouts
   * @description Create a new layout
   * @access ADMIN only
   */
  app.post('/layouts', validate(CreateLayoutSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateLayoutInput>(c);

      // Check for duplicate code
      const exists = await layoutService.isLayoutCodeExists(data.code);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_CODE', 'Mã layout đã tồn tại', 400);
      }

      const layout = await layoutService.createLayout(data);
      return successResponse(c, layout, 201);
    } catch (error) {
      console.error('Create layout error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create layout', 500);
    }
  });


  /**
   * @route PUT /api/admin/interior/layouts/:id
   * @description Update a layout
   * @access ADMIN only
   */
  app.put('/layouts/:id', validate(UpdateLayoutSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateLayoutInput>(c);

      // Check for duplicate code if updating code
      if (data.code) {
        const exists = await layoutService.isLayoutCodeExists(data.code, id);
        if (exists) {
          return errorResponse(c, 'DUPLICATE_CODE', 'Mã layout đã tồn tại', 400);
        }
      }

      const layout = await layoutService.updateLayout(id, data);
      return successResponse(c, layout);
    } catch (error) {
      console.error('Update layout error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update layout', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/layouts/:id
   * @description Delete a layout
   * @access ADMIN only
   */
  app.delete('/layouts/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await layoutService.deleteLayout(id);

      if (!result.success) {
        return errorResponse(c, 'HAS_DEPENDENCIES', result.error || 'Kh�ng th? x�a', 400);
      }

      return successResponse(c, { message: 'Đã xóa layout thành công' });
    } catch (error) {
      console.error('Delete layout error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete layout', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/layouts/:id/clone
   * @description Clone a layout
   * @access ADMIN only
   */
  app.post('/layouts/:id/clone', validate(CloneLayoutSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const { newCode, newName } = getValidatedBody<{ newCode: string; newName: string }>(c);

      // Check for duplicate code
      const exists = await layoutService.isLayoutCodeExists(newCode);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_CODE', 'Mã layout mới đã tồn tại', 400);
      }

      const layout = await layoutService.cloneLayout(id, newCode, newName);
      return successResponse(c, layout, 201);
    } catch (error) {
      console.error('Clone layout error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to clone layout', 500);
    }
  });


  // ============================================
  // ADMIN PACKAGE ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/packages
   * @description Get all packages (including inactive)
   * @access ADMIN only
   */
  app.get('/packages', validateQuery(ListPackagesQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{ layoutId?: string; tier?: number; isActive?: boolean; page?: number; limit?: number }>(c);
      const result = await packageService.listPackages(query);
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get packages error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get packages', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/packages
   * @description Create a new package
   * @access ADMIN only
   */
  app.post('/packages', validate(CreatePackageSchema), async (c) => {
    try {
      const data = getValidatedBody<CreatePackageInput>(c);

      // Check for duplicate code within layout
      const exists = await packageService.isPackageCodeExists(data.layoutId, data.code);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_CODE', 'Mã gói đã tồn tại trong layout này', 400);
      }

      const pkg = await packageService.createPackage(data);
      return successResponse(c, pkg, 201);
    } catch (error) {
      console.error('Create package error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create package', 500);
    }
  });

  /**
   * @route PUT /api/admin/interior/packages/:id
   * @description Update a package
   * @access ADMIN only
   */
  app.put('/packages/:id', validate(UpdatePackageSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdatePackageInput>(c);

      const pkg = await packageService.updatePackage(id, data);
      return successResponse(c, pkg);
    } catch (error) {
      console.error('Update package error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update package', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/packages/:id
   * @description Delete a package
   * @access ADMIN only
   */
  app.delete('/packages/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await packageService.deletePackage(id);

      if (!result.success) {
        return errorResponse(c, 'HAS_DEPENDENCIES', result.error || 'Kh�ng th? x�a', 400);
      }

      return successResponse(c, { message: 'Đã xóa gói nội thất thành công' });
    } catch (error) {
      console.error('Delete package error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete package', 500);
    }
  });


  /**
   * @route POST /api/admin/interior/packages/:id/clone
   * @description Clone a package to another layout
   * @access ADMIN only
   */
  app.post('/packages/:id/clone', validate(ClonePackageSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const { targetLayoutId, newCode, newName, priceAdjustment } = getValidatedBody<{
        targetLayoutId: string;
        newCode: string;
        newName: string;
        priceAdjustment?: number;
      }>(c);

      // Check for duplicate code within target layout
      const exists = await packageService.isPackageCodeExists(targetLayoutId, newCode);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_CODE', 'Mã gói mới đã tồn tại trong layout đích', 400);
      }

      const pkg = await packageService.clonePackage(id, targetLayoutId, newCode, newName, priceAdjustment);
      return successResponse(c, pkg, 201);
    } catch (error) {
      console.error('Clone package error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to clone package', 500);
    }
  });

  // ============================================
  // ADMIN SURCHARGE ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/surcharges
   * @description Get all surcharges
   * @access ADMIN only
   */
  app.get('/surcharges', async (c) => {
    try {
      const result = await surchargeService.listSurcharges();
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get surcharges error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get surcharges', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/surcharges
   * @description Create a new surcharge
   * @access ADMIN only
   */
  app.post('/surcharges', validate(CreateSurchargeSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateSurchargeInput>(c);

      // Check for duplicate code
      const exists = await surchargeService.isSurchargeCodeExists(data.code);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_CODE', 'Mã phụ phí đã tồn tại', 400);
      }

      const surcharge = await surchargeService.createSurcharge(data);
      return successResponse(c, surcharge, 201);
    } catch (error) {
      console.error('Create surcharge error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create surcharge', 500);
    }
  });


  /**
   * @route PUT /api/admin/interior/surcharges/:id
   * @description Update a surcharge
   * @access ADMIN only
   */
  app.put('/surcharges/:id', validate(UpdateSurchargeSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateSurchargeInput>(c);

      // Check for duplicate code if updating code
      if (data.code) {
        const exists = await surchargeService.isSurchargeCodeExists(data.code, id);
        if (exists) {
          return errorResponse(c, 'DUPLICATE_CODE', 'Mã phụ phí đã tồn tại', 400);
        }
      }

      const surcharge = await surchargeService.updateSurcharge(id, data);
      return successResponse(c, surcharge);
    } catch (error) {
      console.error('Update surcharge error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update surcharge', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/surcharges/:id
   * @description Delete a surcharge
   * @access ADMIN only
   */
  app.delete('/surcharges/:id', async (c) => {
    try {
      const id = c.req.param('id');
      await surchargeService.deleteSurcharge(id);
      return successResponse(c, { message: 'Đã xóa phụ phí thành công' });
    } catch (error) {
      console.error('Delete surcharge error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete surcharge', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/surcharges/test
   * @description Test surcharge conditions
   * @access ADMIN only
   */
  app.post('/surcharges/test', validate(TestSurchargeSchema), async (c) => {
    try {
      const { surchargeId, testData } = getValidatedBody<{
        surchargeId: string;
        testData: {
          floor?: number;
          area?: number;
          unitType?: string;
          position?: string;
          buildingId?: string;
          developmentId?: string;
        };
      }>(c);

      const result = await surchargeService.testSurchargeConditions(surchargeId, testData as {
        floor?: number;
        area?: number;
        unitType?: UnitType;
        position?: UnitPosition;
        buildingId?: string;
        developmentId?: string;
      });
      return successResponse(c, result);
    } catch (error) {
      console.error('Test surcharge error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to test surcharge', 500);
    }
  });


  // ============================================
  // ADMIN QUOTE SETTINGS ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/settings
   * @description Get quote settings
   * @access ADMIN only
   */
  app.get('/settings', async (c) => {
    try {
      const settings = await quoteSettingsService.getQuoteSettings();
      return successResponse(c, settings);
    } catch (error) {
      console.error('Get quote settings error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get quote settings', 500);
    }
  });

  /**
   * @route PUT /api/admin/interior/settings
   * @description Update quote settings
   * @access ADMIN only
   */
  app.put('/settings', validate(UpdateQuoteSettingsSchema), async (c) => {
    try {
      const data = getValidatedBody<UpdateQuoteSettingsInput>(c);
      const settings = await quoteSettingsService.updateQuoteSettings(data);
      return successResponse(c, settings);
    } catch (error) {
      console.error('Update quote settings error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update quote settings', 500);
    }
  });

  // ============================================
  // ADMIN FURNITURE CATEGORY ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/furniture/categories
   * @description Get all furniture categories
   * @access ADMIN only
   */
  app.get('/furniture/categories', async (c) => {
    try {
      const result = await furnitureService.listCategories({ includeChildren: true });
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get furniture categories error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture categories', 500);
    }
  });

  /**
   * @route GET /api/admin/interior/furniture/categories/tree
   * @description Get furniture categories as tree
   * @access ADMIN only
   */
  app.get('/furniture/categories/tree', async (c) => {
    try {
      const result = await furnitureService.getCategoryTree();
      return successResponse(c, result);
    } catch (error) {
      console.error('Get furniture category tree error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture category tree', 500);
    }
  });

  /**
   * @route GET /api/admin/interior/furniture/categories/:id
   * @description Get furniture category by ID
   * @access ADMIN only
   */
  app.get('/furniture/categories/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const category = await furnitureService.getCategoryById(id);

      if (!category) {
        return errorResponse(c, 'NOT_FOUND', 'Danh mục không tồn tại', 404);
      }

      return successResponse(c, category);
    } catch (error) {
      console.error('Get furniture category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture category', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/furniture/categories
   * @description Create a new furniture category
   * @access ADMIN only
   */
  app.post('/furniture/categories', validate(CreateFurnitureCategorySchema), async (c) => {
    try {
      const data = getValidatedBody<CreateFurnitureCategoryInput>(c);

      // Check for duplicate name
      const exists = await furnitureService.isCategoryNameExists(data.name);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_NAME', 'Tên danh mục đã tồn tại', 400);
      }

      const category = await furnitureService.createCategory(data);
      return successResponse(c, category, 201);
    } catch (error) {
      console.error('Create furniture category error:', error);
      if (error instanceof Error && error.message.includes('không tồn tại')) {
        return errorResponse(c, 'NOT_FOUND', error.message, 400);
      }
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create furniture category', 500);
    }
  });

  /**
   * @route PUT /api/admin/interior/furniture/categories/:id
   * @description Update a furniture category
   * @access ADMIN only
   */
  app.put('/furniture/categories/:id', validate(UpdateFurnitureCategorySchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateFurnitureCategoryInput>(c);

      // Check for duplicate name if updating name
      if (data.name) {
        const exists = await furnitureService.isCategoryNameExists(data.name, id);
        if (exists) {
          return errorResponse(c, 'DUPLICATE_NAME', 'Tên danh mục đã tồn tại', 400);
        }
      }

      const category = await furnitureService.updateCategory(id, data);
      return successResponse(c, category);
    } catch (error) {
      console.error('Update furniture category error:', error);
      if (error instanceof Error) {
        if (error.message.includes('không tồn tại') || error.message.includes('tham chiếu vòng') || error.message.includes('không thể là cha')) {
          return errorResponse(c, 'VALIDATION_ERROR', error.message, 400);
        }
      }
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update furniture category', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/furniture/categories/:id
   * @description Delete a furniture category
   * @access ADMIN only
   */
  app.delete('/furniture/categories/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await furnitureService.deleteCategory(id);

      if (!result.success) {
        return errorResponse(c, 'HAS_DEPENDENCIES', result.error || 'Không thể xóa', 400);
      }

      return successResponse(c, { message: 'Đã xóa danh mục thành công' });
    } catch (error) {
      console.error('Delete furniture category error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete furniture category', 500);
    }
  });

  // ============================================
  // ADMIN FURNITURE ITEM ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/furniture/items
   * @description Get all furniture items with filters
   * @access ADMIN only
   */
  app.get('/furniture/items', validateQuery(ListFurnitureItemsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{
        categoryId?: string;
        brand?: string;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
        isActive?: boolean;
        search?: string;
        page?: number;
        limit?: number;
      }>(c);
      const result = await furnitureService.listItems(query);
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get furniture items error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture items', 500);
    }
  });

  /**
   * @route GET /api/admin/interior/furniture/brands
   * @description Get all unique brands
   * @access ADMIN only
   */
  app.get('/furniture/brands', async (c) => {
    try {
      const brands = await furnitureService.getBrands();
      return successResponse(c, brands);
    } catch (error) {
      console.error('Get furniture brands error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture brands', 500);
    }
  });

  /**
   * @route GET /api/admin/interior/furniture/items/:id
   * @description Get furniture item by ID
   * @access ADMIN only
   */
  app.get('/furniture/items/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const item = await furnitureService.getItemById(id);

      if (!item) {
        return errorResponse(c, 'NOT_FOUND', 'Sản phẩm không tồn tại', 404);
      }

      return successResponse(c, item);
    } catch (error) {
      console.error('Get furniture item error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get furniture item', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/furniture/items
   * @description Create a new furniture item
   * @access ADMIN only
   */
  app.post('/furniture/items', validate(CreateFurnitureItemSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateFurnitureItemInput>(c);

      // Check for duplicate SKU if provided
      if (data.sku) {
        const exists = await furnitureService.isSkuExists(data.sku);
        if (exists) {
          return errorResponse(c, 'DUPLICATE_SKU', 'Mã SKU đã tồn tại', 400);
        }
      }

      const item = await furnitureService.createItem(data);
      return successResponse(c, item, 201);
    } catch (error) {
      console.error('Create furniture item error:', error);
      if (error instanceof Error && error.message.includes('không tồn tại')) {
        return errorResponse(c, 'NOT_FOUND', error.message, 400);
      }
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create furniture item', 500);
    }
  });

  /**
   * @route PUT /api/admin/interior/furniture/items/:id
   * @description Update a furniture item
   * @access ADMIN only
   */
  app.put('/furniture/items/:id', validate(UpdateFurnitureItemSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateFurnitureItemInput>(c);

      const item = await furnitureService.updateItem(id, data);
      return successResponse(c, item);
    } catch (error) {
      console.error('Update furniture item error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update furniture item', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/furniture/items/:id
   * @description Delete a furniture item
   * @access ADMIN only
   */
  app.delete('/furniture/items/:id', async (c) => {
    try {
      const id = c.req.param('id');
      await furnitureService.deleteItem(id);
      return successResponse(c, { message: 'Đã xóa sản phẩm thành công' });
    } catch (error) {
      console.error('Delete furniture item error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete furniture item', 500);
    }
  });

  // ============================================
  // ADMIN ROOM TYPE ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/room-types
   * @description Get all room types
   * @access ADMIN only
   */
  app.get('/room-types', async (c) => {
    try {
      const result = await roomTypeService.listRoomTypes();
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get room types error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get room types', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/room-types
   * @description Create a new room type
   * @access ADMIN only
   */
  app.post('/room-types', validate(CreateRoomTypeSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateRoomTypeInput>(c);

      // Check for duplicate code
      const exists = await roomTypeService.isRoomTypeCodeExists(data.code);
      if (exists) {
        return errorResponse(c, 'DUPLICATE_CODE', 'Mã loại phòng đã tồn tại', 400);
      }

      const roomType = await roomTypeService.createRoomType(data);
      return successResponse(c, roomType, 201);
    } catch (error) {
      console.error('Create room type error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create room type', 500);
    }
  });


  /**
   * @route PUT /api/admin/interior/room-types/:id
   * @description Update a room type
   * @access ADMIN only
   */
  app.put('/room-types/:id', validate(UpdateRoomTypeSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateRoomTypeInput>(c);

      // Check for duplicate code if updating code
      if (data.code) {
        const exists = await roomTypeService.isRoomTypeCodeExists(data.code, id);
        if (exists) {
          return errorResponse(c, 'DUPLICATE_CODE', 'Mã loại phòng đã tồn tại', 400);
        }
      }

      const roomType = await roomTypeService.updateRoomType(id, data);
      return successResponse(c, roomType);
    } catch (error) {
      console.error('Update room type error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update room type', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/room-types/:id
   * @description Delete a room type
   * @access ADMIN only
   */
  app.delete('/room-types/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await roomTypeService.deleteRoomType(id);

      if (!result.success) {
        return errorResponse(c, 'HAS_DEPENDENCIES', result.error || 'Kh�ng th? x�a', 400);
      }

      return successResponse(c, { message: 'Đã xóa loại phòng thành công' });
    } catch (error) {
      console.error('Delete room type error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete room type', 500);
    }
  });

  /**
   * @route PUT /api/admin/interior/room-types/reorder
   * @description Reorder room types
   * @access ADMIN only
   */
  app.put('/room-types/reorder', validate(ReorderRoomTypesSchema), async (c) => {
    try {
      const { items } = getValidatedBody<{ items: Array<{ id: string; order: number }> }>(c);
      await roomTypeService.reorderRoomTypes(items);
      return successResponse(c, { message: 'Đã cập nhật thứ tự thành công' });
    } catch (error) {
      console.error('Reorder room types error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reorder room types', 500);
    }
  });

  // ============================================
  // ADMIN QUOTE ROUTES
  // ============================================

  /**
   * @route GET /api/admin/interior/quotes
   * @description Get all quotes with filters
   * @access ADMIN only
   */
  app.get('/quotes', validateQuery(ListQuotesQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<{
        status?: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
        developmentName?: string;
        minPrice?: number;
        maxPrice?: number;
        startDate?: string;
        endDate?: string;
        search?: string;
        page?: number;
        limit?: number;
      }>(c);

      const result = await quoteService.listQuotes({
        ...query,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });
      return paginatedResponse(c, result.items, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get quotes error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get quotes', 500);
    }
  });

  /**
   * @route GET /api/admin/interior/quotes/export
   * @description Export quotes to CSV
   * @access ADMIN only
   */
  app.get('/quotes/export', async (c) => {
    try {
      const status = c.req.query('status');
      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');

      const csv = await quoteService.exportQuotesToCSV({
        status: status as 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      c.header('Content-Type', 'text/csv; charset=utf-8');
      c.header('Content-Disposition', 'attachment; filename="quotes.csv"');
      return c.body(csv);
    } catch (error) {
      console.error('Export quotes error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to export quotes', 500);
    }
  });

  /**
   * @route GET /api/admin/interior/quotes/:id
   * @description Get quote by ID
   * @access ADMIN only
   */
  app.get('/quotes/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const quote = await quoteService.getQuoteById(id);

      if (!quote) {
        return errorResponse(c, 'NOT_FOUND', 'Báo giá không tồn tại', 404);
      }

      return successResponse(c, quote);
    } catch (error) {
      console.error('Get quote error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get quote', 500);
    }
  });

  /**
   * @route PUT /api/admin/interior/quotes/:id/status
   * @description Update quote status
   * @access ADMIN only
   */
  app.put('/quotes/:id/status', validate(UpdateQuoteStatusSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateQuoteStatusInput>(c);

      const quote = await quoteService.updateQuoteStatus(id, data);
      return successResponse(c, quote);
    } catch (error) {
      console.error('Update quote status error:', error);
      if (error instanceof Error) {
        return errorResponse(c, 'UPDATE_ERROR', error.message, 400);
      }
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update quote status', 500);
    }
  });

  /**
   * @route DELETE /api/admin/interior/quotes/:id
   * @description Delete a quote
   * @access ADMIN only
   */
  app.delete('/quotes/:id', async (c) => {
    try {
      const id = c.req.param('id');
      await quoteService.deleteQuote(id);
      return successResponse(c, { message: 'Đã xóa báo giá thành công' });
    } catch (error) {
      console.error('Delete quote error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete quote', 500);
    }
  });

  /**
   * @route POST /api/admin/interior/quotes/update-expired
   * @description Update expired quotes status
   * @access ADMIN only
   */
  app.post('/quotes/update-expired', async (c) => {
    try {
      const count = await quoteService.updateExpiredQuotes();
      return successResponse(c, { message: `Đã cập nhật ${count} báo giá hết hạn` });
    } catch (error) {
      console.error('Update expired quotes error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update expired quotes', 500);
    }
  });

  return app;
}

export default { createInteriorRoutes, createAdminInteriorRoutes };
