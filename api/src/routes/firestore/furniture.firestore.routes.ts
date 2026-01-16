/**
 * Furniture Firestore Routes
 * 
 * Routes for furniture system using Firestore backend.
 * 
 * Public routes: /api/furniture/*
 * Admin routes: /api/admin/furniture/*
 * 
 * @module routes/firestore/furniture.firestore.routes
 * @requirements 8.1, 8.2, 8.3, 8.4
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { firebaseAuth, requireRole, optionalFirebaseAuth } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

// Import Firestore services
import {
  getFurnitureDeveloperFirestoreService,
  getFurnitureProjectFirestoreService,
  getFurnitureBuildingFirestoreService,
  getFurnitureLayoutFirestoreService,
  getFurnitureApartmentTypeFirestoreService,
  FurnitureDeveloperFirestoreError,
} from '../../services/firestore/furniture-developer.firestore';

import {
  getFurnitureCategoryFirestoreService,
  getFurnitureMaterialFirestoreService,
  getFurnitureFeeFirestoreService,
  getFurnitureProductBaseFirestoreService,
  getFurnitureProductVariantFirestoreService,
  getFurnitureProductMappingFirestoreService,
  FurnitureProductFirestoreError,
} from '../../services/firestore/furniture-product.firestore';

import {
  getFurnitureQuotationFirestoreService,
  FurnitureQuotationFirestoreError,
} from '../../services/firestore/furniture-quotation.firestore';

import { getSettingsFirestoreService } from '../../services/firestore/settings.firestore';


// ============================================
// VALIDATION SCHEMAS
// ============================================

// Developer schemas
const CreateDeveloperSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  imageUrl: z.string().url().optional(),
});

const UpdateDeveloperSchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

// Project schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  developerId: z.string().min(1, 'Developer ID is required'),
  imageUrl: z.string().url().optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

// Building schemas
const CreateBuildingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  maxFloor: z.number().int().positive('Max floor must be positive'),
  maxAxis: z.number().int().min(0, 'Max axis must be non-negative'),
  imageUrl: z.string().url().optional(),
});

const UpdateBuildingSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  imageUrl: z.string().url().nullable().optional(),
  maxFloor: z.number().int().positive().optional(),
  maxAxis: z.number().int().min(0).optional(),
});

// Layout schemas
const CreateLayoutSchema = z.object({
  buildingCode: z.string().min(1, 'Building code is required'),
  axis: z.number().int().min(0, 'Axis must be non-negative'),
  apartmentType: z.string().min(1, 'Apartment type is required'),
});

const UpdateLayoutSchema = z.object({
  apartmentType: z.string().min(1).optional(),
});

// Apartment type schemas
const CreateApartmentTypeSchema = z.object({
  buildingCode: z.string().min(1, 'Building code is required'),
  apartmentType: z.string().min(1, 'Apartment type is required'),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
});

const UpdateApartmentTypeSchema = z.object({
  apartmentType: z.string().min(1).optional(),
  imageUrl: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
});


// Category schemas
const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Material schemas
const CreateMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const UpdateMaterialSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Fee schemas
const CreateFeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  value: z.number().min(0, 'Value must be non-negative'),
  applicability: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

const UpdateFeeSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  value: z.number().min(0).optional(),
  applicability: z.string().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});


// Product base schemas
const VariantInputSchema = z.object({
  materialId: z.string().min(1, 'Material ID is required'),
  pricePerUnit: z.number().min(0, 'Price must be non-negative'),
  pricingType: z.enum(['LINEAR', 'M2']),
  length: z.number().min(0, 'Length must be non-negative'),
  width: z.number().min(0).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const MappingInputSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  buildingCode: z.string().min(1, 'Building code is required'),
  apartmentType: z.string().min(1, 'Apartment type is required'),
});

const CreateProductBaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  allowFitIn: z.boolean().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  variants: z.array(VariantInputSchema).min(1, 'At least one variant is required'),
  mappings: z.array(MappingInputSchema).optional(),
});

const UpdateProductBaseSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  allowFitIn: z.boolean().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Quotation schemas
const QuotationItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  material: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().int().positive(),
  fitInSelected: z.boolean().optional(),
  fitInFee: z.number().min(0).optional(),
});

const CreateQuotationSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  developerName: z.string().min(1),
  projectName: z.string().min(1),
  buildingName: z.string().min(1),
  buildingCode: z.string().min(1),
  floor: z.number().int().positive(),
  axis: z.number().int().min(0),
  apartmentType: z.string().min(1),
  layoutImageUrl: z.string().url().optional(),
  items: z.array(QuotationItemSchema).min(1, 'At least one item is required'),
  fees: z.array(z.object({
    name: z.string(),
    code: z.string(),
    type: z.enum(['FIXED', 'PERCENTAGE']),
    value: z.number(),
    applicability: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    order: z.number().optional(),
  })),
});


// Query schemas
const ProductsQuerySchema = z.object({
  categoryId: z.string().optional(),
  projectName: z.string().optional(),
  buildingCode: z.string().optional(),
  apartmentType: z.string().optional(),
});

const ProductsAdminQuerySchema = z.object({
  categoryId: z.string().optional(),
  materialId: z.string().optional(),
  isActive: z.string().transform(v => v === 'true').optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  sortBy: z.enum(['name', 'order', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const QuotationsQuerySchema = z.object({
  leadId: z.string().optional(),
  projectName: z.string().optional(),
  buildingCode: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// PDF Settings schema
const UpdatePdfSettingsSchema = z.object({
  companyName: z.string().optional(),
  companyTagline: z.string().optional(),
  companyLogo: z.string().url().nullable().optional(),
  documentTitle: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  mutedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  companyNameSize: z.number().int().positive().optional(),
  documentTitleSize: z.number().int().positive().optional(),
  sectionTitleSize: z.number().int().positive().optional(),
  bodyTextSize: z.number().int().positive().optional(),
  footerTextSize: z.number().int().positive().optional(),
  apartmentInfoTitle: z.string().optional(),
  productsTitle: z.string().optional(),
  priceDetailsTitle: z.string().optional(),
  contactInfoTitle: z.string().optional(),
  totalLabel: z.string().optional(),
  footerNote: z.string().optional(),
  footerCopyright: z.string().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactAddress: z.string().nullable().optional(),
  contactWebsite: z.string().url().nullable().optional(),
  additionalNotes: z.string().nullable().optional(),
});


// ============================================
// TYPE ALIASES
// ============================================

type CreateDeveloperInput = z.infer<typeof CreateDeveloperSchema>;
type UpdateDeveloperInput = z.infer<typeof UpdateDeveloperSchema>;
type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
type CreateBuildingInput = z.infer<typeof CreateBuildingSchema>;
type UpdateBuildingInput = z.infer<typeof UpdateBuildingSchema>;
type CreateLayoutInput = z.infer<typeof CreateLayoutSchema>;
type UpdateLayoutInput = z.infer<typeof UpdateLayoutSchema>;
type CreateApartmentTypeInput = z.infer<typeof CreateApartmentTypeSchema>;
type UpdateApartmentTypeInput = z.infer<typeof UpdateApartmentTypeSchema>;
type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;
type CreateFeeInput = z.infer<typeof CreateFeeSchema>;
type UpdateFeeInput = z.infer<typeof UpdateFeeSchema>;
type VariantInput = z.infer<typeof VariantInputSchema>;
type MappingInput = z.infer<typeof MappingInputSchema>;
type CreateProductBaseInput = z.infer<typeof CreateProductBaseSchema>;
type UpdateProductBaseInput = z.infer<typeof UpdateProductBaseSchema>;
type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;
type ProductsQuery = z.infer<typeof ProductsQuerySchema>;
type ProductsAdminQuery = z.infer<typeof ProductsAdminQuerySchema>;
type QuotationsQuery = z.infer<typeof QuotationsQuerySchema>;
type UpdatePdfSettingsInput = z.infer<typeof UpdatePdfSettingsSchema>;

// ============================================
// ERROR HANDLER
// ============================================

function handleFurnitureError(c: Parameters<typeof errorResponse>[0], error: unknown) {
  logger.error('Furniture route error', { error });

  if (error instanceof FurnitureDeveloperFirestoreError ||
      error instanceof FurnitureProductFirestoreError ||
      error instanceof FurnitureQuotationFirestoreError) {
    return errorResponse(c, error.code, error.message, error.statusCode);
  }

  if (error instanceof Error) {
    return errorResponse(c, 'INTERNAL_ERROR', error.message, 500);
  }

  return errorResponse(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * Create public furniture routes
 * @route /api/furniture/*
 */
export function createFurnitureFirestorePublicRoutes() {
  const app = new Hono();

  // ========== DEVELOPERS ==========
  app.get('/developers', async (c) => {
    try {
      const service = getFurnitureDeveloperFirestoreService();
      const developers = await service.getDevelopers();
      return successResponse(c, developers);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.get('/developers/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureDeveloperFirestoreService();
      const developer = await service.getById(id);
      if (!developer) {
        return errorResponse(c, 'NOT_FOUND', 'Developer not found', 404);
      }
      return successResponse(c, developer);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== PROJECTS ==========
  app.get('/projects', async (c) => {
    try {
      const developerId = c.req.query('developerId');
      const service = getFurnitureProjectFirestoreService();
      const projects = await service.getProjects(developerId);
      return successResponse(c, projects);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.get('/projects/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureProjectFirestoreService();
      const project = await service.getById(id);
      if (!project) {
        return errorResponse(c, 'NOT_FOUND', 'Project not found', 404);
      }
      return successResponse(c, project);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });


  // ========== BUILDINGS ==========
  app.get('/buildings', async (c) => {
    try {
      const projectId = c.req.query('projectId');
      const service = getFurnitureBuildingFirestoreService();
      const buildings = await service.getBuildings(projectId);
      return successResponse(c, buildings);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.get('/buildings/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureBuildingFirestoreService();
      const building = await service.getById(id);
      if (!building) {
        return errorResponse(c, 'NOT_FOUND', 'Building not found', 404);
      }
      return successResponse(c, building);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.get('/buildings/code/:code', async (c) => {
    try {
      const { code } = c.req.param();
      const service = getFurnitureBuildingFirestoreService();
      const building = await service.getBuildingByCode(code);
      if (!building) {
        return errorResponse(c, 'NOT_FOUND', 'Building not found', 404);
      }
      return successResponse(c, building);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== LAYOUTS ==========
  app.get('/layouts', async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) {
        return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      }
      const service = getFurnitureLayoutFirestoreService();
      const layouts = await service.getLayoutsByBuilding(buildingCode);
      return successResponse(c, layouts);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== APARTMENT TYPES ==========
  app.get('/apartment-types', async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      const type = c.req.query('type');
      const service = getFurnitureApartmentTypeFirestoreService();
      
      if (buildingCode) {
        const types = await service.getApartmentTypes(buildingCode, type);
        return successResponse(c, types);
      }
      
      const allTypes = await service.getAllApartmentTypes();
      return successResponse(c, allTypes);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });


  // ========== CATEGORIES ==========
  app.get('/categories', async (c) => {
    try {
      const service = getFurnitureCategoryFirestoreService();
      const categories = await service.getCategories(true); // Active only for public
      return successResponse(c, categories);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== FEES ==========
  app.get('/fees', async (c) => {
    try {
      const service = getFurnitureFeeFirestoreService();
      const fees = await service.getFees(true); // Active only for public
      return successResponse(c, fees);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== PRODUCTS ==========
  app.get('/products', optionalFirebaseAuth(), validateQuery(ProductsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<ProductsQuery>(c);
      const service = getFurnitureProductBaseFirestoreService();
      const products = await service.getProductBasesGrouped(query);
      return successResponse(c, products);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.get('/products/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureProductBaseFirestoreService();
      const product = await service.getProductBaseWithDetails(id);
      if (!product) {
        return errorResponse(c, 'NOT_FOUND', 'Product not found', 404);
      }
      return successResponse(c, product);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== QUOTATIONS (Public create) ==========
  app.post('/quotations', validate(CreateQuotationSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateQuotationInput>(c);
      const service = getFurnitureQuotationFirestoreService();
      const feeService = getFurnitureFeeFirestoreService();
      
      // Convert fees to FirestoreFurnitureFee format
      const fees = await Promise.all(
        data.fees.map(async (fee) => {
          const existingFee = await feeService.getFeeByCode(fee.code);
          return existingFee || {
            id: fee.code,
            name: fee.name,
            code: fee.code,
            type: fee.type,
            value: fee.value,
            applicability: fee.applicability || 'BOTH',
            description: fee.description,
            isActive: fee.isActive ?? true,
            order: fee.order ?? 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        })
      );

      const quotation = await service.createQuotation({
        ...data,
        fees,
      });
      return successResponse(c, quotation, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  return app;
}


// ============================================
// ADMIN ROUTES
// ============================================

/**
 * Create admin furniture routes
 * @route /api/admin/furniture/*
 */
export function createFurnitureFirestoreAdminRoutes() {
  const app = new Hono();

  // ========== DEVELOPERS ADMIN ==========
  app.get('/developers', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const service = getFurnitureDeveloperFirestoreService();
      const developers = await service.getDevelopers();
      return successResponse(c, developers);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/developers', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateDeveloperSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateDeveloperInput>(c);
      const service = getFurnitureDeveloperFirestoreService();
      const developer = await service.createDeveloper(data);
      return successResponse(c, developer, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/developers/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateDeveloperSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateDeveloperInput>(c);
      const service = getFurnitureDeveloperFirestoreService();
      const developer = await service.updateDeveloper(id, data);
      return successResponse(c, developer);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/developers/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureDeveloperFirestoreService();
      await service.deleteDeveloper(id);
      return successResponse(c, { message: 'Developer deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });


  // ========== PROJECTS ADMIN ==========
  app.get('/projects', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const developerId = c.req.query('developerId');
      const service = getFurnitureProjectFirestoreService();
      const projects = await service.getProjects(developerId);
      return successResponse(c, projects);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/projects', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateProjectSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateProjectInput>(c);
      const service = getFurnitureProjectFirestoreService();
      const project = await service.createProject(data);
      return successResponse(c, project, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/projects/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateProjectSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateProjectInput>(c);
      const service = getFurnitureProjectFirestoreService();
      const project = await service.updateProject(id, data);
      return successResponse(c, project);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/projects/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureProjectFirestoreService();
      await service.deleteProject(id);
      return successResponse(c, { message: 'Project deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== BUILDINGS ADMIN ==========
  app.get('/buildings', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const projectId = c.req.query('projectId');
      const service = getFurnitureBuildingFirestoreService();
      const buildings = await service.getBuildings(projectId);
      return successResponse(c, buildings);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/buildings', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateBuildingSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateBuildingInput>(c);
      const service = getFurnitureBuildingFirestoreService();
      const building = await service.createBuilding(data);
      return successResponse(c, building, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/buildings/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateBuildingSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateBuildingInput>(c);
      const service = getFurnitureBuildingFirestoreService();
      const building = await service.updateBuilding(id, data);
      return successResponse(c, building);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/buildings/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureBuildingFirestoreService();
      await service.deleteBuilding(id);
      return successResponse(c, { message: 'Building deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });


  // ========== LAYOUTS ADMIN ==========
  app.post('/layouts', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateLayoutSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateLayoutInput>(c);
      const service = getFurnitureLayoutFirestoreService();
      const layout = await service.createLayout(data);
      return successResponse(c, layout, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/layouts/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateLayoutSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateLayoutInput>(c);
      const service = getFurnitureLayoutFirestoreService();
      const layout = await service.updateLayout(id, data);
      return successResponse(c, layout);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/layouts/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureLayoutFirestoreService();
      await service.deleteLayout(id);
      return successResponse(c, { message: 'Layout deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== APARTMENT TYPES ADMIN ==========
  app.post('/apartment-types', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateApartmentTypeSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateApartmentTypeInput>(c);
      const service = getFurnitureApartmentTypeFirestoreService();
      const apartmentType = await service.createApartmentType(data);
      return successResponse(c, apartmentType, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/apartment-types/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateApartmentTypeSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateApartmentTypeInput>(c);
      const service = getFurnitureApartmentTypeFirestoreService();
      const apartmentType = await service.updateApartmentType(id, data);
      return successResponse(c, apartmentType);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/apartment-types/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureApartmentTypeFirestoreService();
      await service.deleteApartmentType(id);
      return successResponse(c, { message: 'Apartment type deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });


  // ========== CATEGORIES ADMIN ==========
  app.get('/categories', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const service = getFurnitureCategoryFirestoreService();
      const categories = await service.getCategories(false); // Include inactive
      return successResponse(c, categories);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/categories', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateCategorySchema), async (c) => {
    try {
      const data = getValidatedBody<CreateCategoryInput>(c);
      const service = getFurnitureCategoryFirestoreService();
      const category = await service.createCategory(data);
      return successResponse(c, category, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/categories/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateCategorySchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateCategoryInput>(c);
      const service = getFurnitureCategoryFirestoreService();
      const category = await service.updateCategory(id, data);
      return successResponse(c, category);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/categories/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureCategoryFirestoreService();
      await service.deleteCategory(id);
      return successResponse(c, { message: 'Category deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== MATERIALS ADMIN ==========
  app.get('/materials', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const service = getFurnitureMaterialFirestoreService();
      const materials = await service.getMaterials(false); // Include inactive
      return successResponse(c, materials);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/materials', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateMaterialSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateMaterialInput>(c);
      const service = getFurnitureMaterialFirestoreService();
      const material = await service.createMaterial(data);
      return successResponse(c, material, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/materials/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateMaterialSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateMaterialInput>(c);
      const service = getFurnitureMaterialFirestoreService();
      const material = await service.updateMaterial(id, data);
      return successResponse(c, material);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/materials/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureMaterialFirestoreService();
      await service.deleteMaterial(id);
      return successResponse(c, { message: 'Material deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });


  // ========== FEES ADMIN ==========
  app.get('/fees', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const service = getFurnitureFeeFirestoreService();
      const fees = await service.getFees(false); // Include inactive
      return successResponse(c, fees);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/fees', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateFeeSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateFeeInput>(c);
      const service = getFurnitureFeeFirestoreService();
      const fee = await service.createFee(data);
      return successResponse(c, fee, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/fees/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateFeeSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateFeeInput>(c);
      const service = getFurnitureFeeFirestoreService();
      const fee = await service.updateFee(id, data);
      return successResponse(c, fee);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/fees/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureFeeFirestoreService();
      await service.deleteFee(id);
      return successResponse(c, { message: 'Fee deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== PRODUCTS ADMIN ==========
  // Note: Also aliased as /product-bases for frontend compatibility
  app.get('/products', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validateQuery(ProductsAdminQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<ProductsAdminQuery>(c);
      const service = getFurnitureProductBaseFirestoreService();
      const result = await service.getProductBasesForAdmin(query);
      return paginatedResponse(c, result.products, {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // Alias for /products (frontend compatibility)
  app.get('/product-bases', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validateQuery(ProductsAdminQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<ProductsAdminQuery>(c);
      const service = getFurnitureProductBaseFirestoreService();
      const result = await service.getProductBasesForAdmin(query);
      return paginatedResponse(c, result.products, {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.get('/products/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureProductBaseFirestoreService();
      const product = await service.getProductBaseWithDetails(id);
      if (!product) {
        return errorResponse(c, 'NOT_FOUND', 'Product not found', 404);
      }
      return successResponse(c, product);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // Alias for /products/:id (frontend compatibility)
  app.get('/product-bases/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureProductBaseFirestoreService();
      const product = await service.getProductBaseWithDetails(id);
      if (!product) {
        return errorResponse(c, 'NOT_FOUND', 'Product not found', 404);
      }
      return successResponse(c, product);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/products', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateProductBaseSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateProductBaseInput>(c);
      const service = getFurnitureProductBaseFirestoreService();
      const product = await service.createProductBase(data);
      return successResponse(c, product, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // Alias for /products POST (frontend compatibility)
  app.post('/product-bases', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(CreateProductBaseSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateProductBaseInput>(c);
      const service = getFurnitureProductBaseFirestoreService();
      const product = await service.createProductBase(data);
      return successResponse(c, product, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/products/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateProductBaseSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateProductBaseInput>(c);
      const service = getFurnitureProductBaseFirestoreService();
      const product = await service.updateProductBase(id, data);
      return successResponse(c, product);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // Alias for /products/:id PUT (frontend compatibility)
  app.put('/product-bases/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdateProductBaseSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = getValidatedBody<UpdateProductBaseInput>(c);
      const service = getFurnitureProductBaseFirestoreService();
      const product = await service.updateProductBase(id, data);
      return successResponse(c, product);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/products/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureProductBaseFirestoreService();
      await service.deleteProductBase(id);
      return successResponse(c, { message: 'Product deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // Alias for /products/:id DELETE (frontend compatibility)
  app.delete('/product-bases/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureProductBaseFirestoreService();
      await service.deleteProductBase(id);
      return successResponse(c, { message: 'Product deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== PRODUCT-BASES VARIANTS (Alias routes) ==========
  app.get('/product-bases/:productId/variants', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const { productId } = c.req.param();
      const service = getFurnitureProductVariantFirestoreService();
      const variants = await service.getVariants(productId);
      return successResponse(c, variants);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/product-bases/:productId/variants', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(VariantInputSchema), async (c) => {
    try {
      const { productId } = c.req.param();
      const data = getValidatedBody<VariantInput>(c);
      const service = getFurnitureProductVariantFirestoreService();
      const variant = await service.createVariant(productId, data);
      return successResponse(c, variant, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/product-bases/:productId/variants/:variantId', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(VariantInputSchema.partial()), async (c) => {
    try {
      const { productId, variantId } = c.req.param();
      const data = getValidatedBody<Partial<VariantInput>>(c);
      const service = getFurnitureProductVariantFirestoreService();
      const variant = await service.updateVariant(productId, variantId, data);
      return successResponse(c, variant);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/product-bases/:productId/variants/:variantId', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { productId, variantId } = c.req.param();
      const service = getFurnitureProductVariantFirestoreService();
      await service.deleteVariant(productId, variantId);
      return successResponse(c, { message: 'Variant deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== PRODUCT-BASES MAPPINGS (Alias routes) ==========
  app.get('/product-bases/:productId/mappings', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const { productId } = c.req.param();
      const service = getFurnitureProductMappingFirestoreService();
      const mappings = await service.getMappings(productId);
      return successResponse(c, mappings);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/product-bases/:productId/mappings', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(MappingInputSchema), async (c) => {
    try {
      const { productId } = c.req.param();
      const data = getValidatedBody<MappingInput>(c);
      const service = getFurnitureProductMappingFirestoreService();
      const mapping = await service.addMapping(productId, data);
      return successResponse(c, mapping, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/product-bases/:productId/mappings/:mappingId', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { mappingId } = c.req.param();
      const service = getFurnitureProductMappingFirestoreService();
      await service.removeMapping(mappingId);
      return successResponse(c, { message: 'Mapping deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // Bulk mapping for product-bases
  app.post('/product-bases/bulk-mapping', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const body = await c.req.json();
      const { productBaseIds, mapping } = body as {
        productBaseIds: string[];
        mapping: { projectName: string; buildingCode: string; apartmentType: string };
      };

      const service = getFurnitureProductMappingFirestoreService();
      const result = await service.bulkCreateMappings(productBaseIds, mapping);
      return successResponse(c, result);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== PRODUCT VARIANTS ADMIN ==========
  app.get('/products/:productId/variants', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const { productId } = c.req.param();
      const service = getFurnitureProductVariantFirestoreService();
      const variants = await service.getVariants(productId);
      return successResponse(c, variants);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/products/:productId/variants', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(VariantInputSchema), async (c) => {
    try {
      const { productId } = c.req.param();
      const data = getValidatedBody<VariantInput>(c);
      const service = getFurnitureProductVariantFirestoreService();
      const variant = await service.createVariant(productId, data);
      return successResponse(c, variant, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/products/:productId/variants/:variantId', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(VariantInputSchema.partial()), async (c) => {
    try {
      const { productId, variantId } = c.req.param();
      const data = getValidatedBody<Partial<VariantInput>>(c);
      const service = getFurnitureProductVariantFirestoreService();
      const variant = await service.updateVariant(productId, variantId, data);
      return successResponse(c, variant);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/products/:productId/variants/:variantId', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { productId, variantId } = c.req.param();
      const service = getFurnitureProductVariantFirestoreService();
      await service.deleteVariant(productId, variantId);
      return successResponse(c, { message: 'Variant deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== PRODUCT MAPPINGS ADMIN ==========
  app.get('/products/:productId/mappings', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const { productId } = c.req.param();
      const service = getFurnitureProductMappingFirestoreService();
      const mappings = await service.getMappings(productId);
      return successResponse(c, mappings);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/products/:productId/mappings', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(MappingInputSchema), async (c) => {
    try {
      const { productId } = c.req.param();
      const data = getValidatedBody<MappingInput>(c);
      const service = getFurnitureProductMappingFirestoreService();
      const mapping = await service.addMapping(productId, data);
      return successResponse(c, mapping, 201);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/mappings/:mappingId', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { mappingId } = c.req.param();
      const service = getFurnitureProductMappingFirestoreService();
      await service.removeMapping(mappingId);
      return successResponse(c, { message: 'Mapping deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // Bulk create mappings
  app.post('/mappings/bulk', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const body = await c.req.json();
      const { productBaseIds, mapping } = body as {
        productBaseIds: string[];
        mapping: { projectName: string; buildingCode: string; apartmentType: string };
      };

      const service = getFurnitureProductMappingFirestoreService();
      const result = await service.bulkCreateMappings(productBaseIds, mapping);
      return successResponse(c, result);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });


  // ========== QUOTATIONS ADMIN ==========
  app.get('/quotations', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validateQuery(QuotationsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<QuotationsQuery>(c);
      const service = getFurnitureQuotationFirestoreService();
      const result = await service.getQuotations(query);
      return paginatedResponse(c, result.quotations, {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.get('/quotations/stats', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const service = getFurnitureQuotationFirestoreService();
      const stats = await service.getQuotationStats();
      return successResponse(c, stats);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.get('/quotations/:id', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureQuotationFirestoreService();
      const quotation = await service.getQuotationById(id);
      return successResponse(c, quotation);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.delete('/quotations/:id', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const { id } = c.req.param();
      const service = getFurnitureQuotationFirestoreService();
      await service.deleteQuotation(id);
      return successResponse(c, { message: 'Quotation deleted' });
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  // ========== PDF SETTINGS ==========
  app.get('/pdf-settings', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const service = getSettingsFirestoreService();
      let settings = await service.getFurniturePdfSettings();
      
      if (!settings) {
        // Create default settings if not exists
        settings = await service.resetFurniturePdfSettings();
      }
      
      return successResponse(c, settings);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.put('/pdf-settings', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), validate(UpdatePdfSettingsSchema), async (c) => {
    try {
      const data = getValidatedBody<UpdatePdfSettingsInput>(c);
      const service = getSettingsFirestoreService();
      const settings = await service.setFurniturePdfSettings(data);
      return successResponse(c, settings);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  app.post('/pdf-settings/reset', firebaseAuth(), requireRole('ADMIN'), async (c) => {
    try {
      const service = getSettingsFirestoreService();
      const settings = await service.resetFurniturePdfSettings();
      return successResponse(c, settings);
    } catch (error) {
      return handleFurnitureError(c, error);
    }
  });

  return app;
}

// Export both route creators
export default {
  createFurnitureFirestorePublicRoutes,
  createFurnitureFirestoreAdminRoutes,
};
