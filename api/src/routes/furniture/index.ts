/**
 * Furniture Routes Module
 * @route /api/furniture - Public furniture routes
 * @route /api/admin/furniture - Admin furniture management routes
 * 
 * This module aggregates all furniture-related routes from sub-modules:
 * - developer.routes.ts - Developer CRUD
 * - project.routes.ts - Project, Building, Layout, ApartmentType CRUD
 * - category.routes.ts - Category CRUD
 * - material.routes.ts - Material CRUD
 * - product.routes.ts - Product, ProductBase, Variant, Mapping CRUD
 * - fee.routes.ts - Fee CRUD
 * - quotation.routes.ts - Quotation CRUD
 * - admin.routes.ts - Import/Export, Sync, PDF Settings
 */
import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { createAuthMiddleware } from '../../middleware/auth.middleware';

// Import sub-route factories
import { createDeveloperPublicRoutes, createDeveloperAdminRoutes } from './developer.routes';
import { createProjectPublicRoutes, createProjectAdminRoutes } from './project.routes';
import { createCategoryPublicRoutes, createCategoryAdminRoutes } from './category.routes';
import { createMaterialAdminRoutes } from './material.routes';
import { createProductPublicRoutes, createProductAdminRoutes, createProductBaseAdminRoutes } from './product.routes';
import { createFeePublicRoutes, createFeeAdminRoutes } from './fee.routes';
import { createQuotationPublicRoutes, createQuotationAdminRoutes } from './quotation.routes';
import { createAdminUtilityRoutes } from './admin.routes';

/**
 * Create public furniture routes
 * @route /api/furniture/*
 */
export function createFurniturePublicRoutes(prisma: PrismaClient) {
  const app = new Hono();

  // Mount sub-routes
  app.route('/developers', createDeveloperPublicRoutes(prisma));
  app.route('/categories', createCategoryPublicRoutes(prisma));
  app.route('/fees', createFeePublicRoutes(prisma));
  app.route('/products', createProductPublicRoutes(prisma));
  app.route('/quotations', createQuotationPublicRoutes(prisma));
  
  // Project-related routes (projects, buildings, layouts, apartment-types)
  const projectRoutes = createProjectPublicRoutes(prisma);
  app.route('/', projectRoutes);

  return app;
}

/**
 * Create admin furniture routes
 * @route /api/admin/furniture/*
 */
export function createFurnitureAdminRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // Mount sub-routes with auth middleware
  app.route('/developers', createDeveloperAdminRoutes(prisma, authenticate, requireRole));
  app.route('/categories', createCategoryAdminRoutes(prisma, authenticate, requireRole));
  app.route('/materials', createMaterialAdminRoutes(prisma, authenticate, requireRole));
  app.route('/fees', createFeeAdminRoutes(prisma, authenticate, requireRole));
  app.route('/products', createProductAdminRoutes(prisma, authenticate, requireRole));
  app.route('/product-bases', createProductBaseAdminRoutes(prisma, authenticate, requireRole));
  app.route('/quotations', createQuotationAdminRoutes(prisma, authenticate, requireRole));
  
  // Project-related routes (projects, buildings, layouts, apartment-types)
  const projectRoutes = createProjectAdminRoutes(prisma, authenticate, requireRole);
  app.route('/', projectRoutes);
  
  // Admin utility routes (import, export, sync, pdf-settings)
  const adminUtilityRoutes = createAdminUtilityRoutes(prisma, authenticate, requireRole);
  app.route('/', adminUtilityRoutes);

  return app;
}

// Default export for backward compatibility
export default { createFurniturePublicRoutes, createFurnitureAdminRoutes };
