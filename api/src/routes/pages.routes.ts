/**
 * Pages & Sections Routes Module
 *
 * Handles HTTP routing for pages and sections.
 * Business logic is delegated to PagesService.
 *
 * **Feature: api-refactoring**
 * **Requirements: 1.1, 1.2, 1.3, 3.5, 6.1, 6.2**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import {
  PagesService,
  PagesServiceError,
  CreatePageInput,
  UpdatePageInput,
  CreateSectionInput,
  UpdateSectionInput,
} from '../services/pages.service';

// ============================================
// PAGES ROUTES FACTORY
// ============================================

/**
 * Create pages routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with pages routes
 */
export function createPagesRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const pagesService = new PagesService(prisma);

  // ============================================
  // PAGE ROUTES
  // ============================================

  /**
   * @route GET /pages
   * @description Get all pages with section count
   * @access Public
   */
  app.get('/', async (c) => {
    try {
      const pages = await pagesService.getAllPages();
      return successResponse(c, pages);
    } catch (error) {
      console.error('Get pages error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get pages', 500);
    }
  });

  /**
   * @route GET /pages/:slug
   * @description Get a single page by slug with all sections
   * @access Public
   */
  app.get('/:slug', async (c) => {
    try {
      const slug = c.req.param('slug');
      const page = await pagesService.getPageBySlug(slug);

      if (!page) {
        return errorResponse(c, 'NOT_FOUND', 'Page not found', 404);
      }

      return successResponse(c, page);
    } catch (error) {
      console.error('Get page error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get page', 500);
    }
  });

  /**
   * @route POST /pages
   * @description Create a new page
   * @access Admin, Manager
   */
  app.post('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const body = await c.req.json<CreatePageInput>();
      const page = await pagesService.createPage(body);
      return successResponse(c, page, 201);
    } catch (error) {
      if (error instanceof PagesServiceError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Create page error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create page', 500);
    }
  });

  /**
   * @route PUT /pages/:slug
   * @description Update a page by slug
   * @access Admin, Manager
   */
  app.put('/:slug', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const slug = c.req.param('slug');
      const body = await c.req.json<UpdatePageInput>();
      const page = await pagesService.updatePage(slug, body);
      return successResponse(c, page);
    } catch (error) {
      if (error instanceof PagesServiceError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Update page error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update page', 500);
    }
  });

  /**
   * @route DELETE /pages/:slug
   * @description Delete a page and all its sections
   * @access Admin, Manager
   */
  app.delete('/:slug', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const slug = c.req.param('slug');
      await pagesService.deletePage(slug);
      return successResponse(c, { ok: true });
    } catch (error) {
      if (error instanceof PagesServiceError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Delete page error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete page', 500);
    }
  });

  // ============================================
  // SECTION ROUTES (nested under pages)
  // ============================================

  /**
   * @route POST /pages/:slug/sections
   * @description Create a new section for a page
   * @access Admin, Manager
   */
  app.post('/:slug/sections', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const slug = c.req.param('slug');
      const body = await c.req.json<CreateSectionInput>();
      const section = await pagesService.createSection(slug, body);
      return successResponse(c, section, 201);
    } catch (error) {
      if (error instanceof PagesServiceError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Create section error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create section', 500);
    }
  });

  return app;
}

// ============================================
// SECTIONS ROUTES FACTORY (standalone)
// ============================================

/**
 * Create sections routes for standalone section operations
 * @param prisma - Prisma client instance
 * @returns Hono app with sections routes
 */
export function createSectionsRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const pagesService = new PagesService(prisma);

  /**
   * @route GET /sections/by-kind/:kind
   * @description Get section by kind (for shared sections like QUOTE_FORM)
   * @access Public
   */
  app.get('/by-kind/:kind', async (c) => {
    try {
      const kind = c.req.param('kind');
      const section = await pagesService.getSectionByKind(kind);

      if (!section) {
        return errorResponse(c, 'NOT_FOUND', 'Section not found', 404);
      }

      return successResponse(c, section);
    } catch (error) {
      console.error('Get section by kind error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get section', 500);
    }
  });

  /**
   * @route PUT /sections/:id
   * @description Update a section by ID
   * @access Admin, Manager
   */
  app.put('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json<UpdateSectionInput>();
      const section = await pagesService.updateSection(id, body);
      return successResponse(c, section);
    } catch (error) {
      if (error instanceof PagesServiceError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Update section error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update section', 500);
    }
  });

  /**
   * @route DELETE /sections/:id
   * @description Delete a section by ID
   * @access Admin, Manager
   */
  app.delete('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      await pagesService.deleteSection(id);
      return successResponse(c, { ok: true });
    } catch (error) {
      if (error instanceof PagesServiceError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Delete section error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete section', 500);
    }
  });

  return app;
}

export default { createPagesRoutes, createSectionsRoutes };
