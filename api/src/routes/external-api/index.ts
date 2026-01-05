/**
 * External API Routes Module
 *
 * Provides API key authenticated access to external integrations (AI agents, etc.)
 * These routes allow both JWT auth and API key auth for flexibility.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 16.1**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createApiKeyAuthMiddleware, getApiKey } from '../../middleware/api-key-auth.middleware';
import { successResponse, errorResponse } from '../../utils/response';

// Import sub-routes
import { createLeadsRoutes } from './leads.routes';
import { createBlogRoutes } from './blog.routes';
import { createProjectsRoutes } from './projects.routes';
import { createContractorsRoutes } from './contractors.routes';
import { createReportsRoutes } from './reports.routes';
import { createPricingRoutes } from './pricing.routes';
import { createFurnitureRoutes } from './furniture.routes';

/**
 * Create external API routes with API key authentication
 * @param prisma - Prisma client instance
 * @returns Hono app with external API routes
 */
export function createExternalApiRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { apiKeyAuth } = createApiKeyAuthMiddleware(prisma);

  // Mount sub-routes
  app.route('/leads', createLeadsRoutes(prisma, apiKeyAuth));
  app.route('/blog', createBlogRoutes(prisma, apiKeyAuth));
  app.route('/projects', createProjectsRoutes(prisma, apiKeyAuth));
  app.route('/contractors', createContractorsRoutes(prisma, apiKeyAuth));
  app.route('/reports', createReportsRoutes(prisma, apiKeyAuth));
  app.route('/pricing', createPricingRoutes(prisma, apiKeyAuth));
  app.route('/furniture', createFurnitureRoutes(prisma, apiKeyAuth));

  // ============================================
  // HEALTH CHECK
  // ============================================

  /**
   * @route GET /api/external/health
   * @description Health check endpoint for API key testing
   * @access API Key (any permission)
   */
  app.get('/health', apiKeyAuth(), async (c) => {
    const apiKey = getApiKey(c);
    return successResponse(c, {
      ok: true,
      message: 'API key authentication successful',
      keyName: apiKey?.name,
      scope: apiKey?.scope,
    });
  });

  // ============================================
  // API DISCOVERY (cho AI Agents)
  // ============================================

  /**
   * @route GET /api/external/discover
   * @description Discover available endpoints for this API key
   * @access API Key (any permission)
   */
  app.get('/discover', apiKeyAuth(), async (c) => {
    const apiKey = getApiKey(c);
    if (!apiKey) {
      return errorResponse(c, 'API_KEY_REQUIRED', 'API key is required', 401);
    }

    // Parse allowed endpoints
    let allowedEndpoints: string[] = [];
    try {
      allowedEndpoints = JSON.parse(apiKey.allowedEndpoints || '[]');
    } catch {
      allowedEndpoints = [];
    }

    // Define all available endpoints
    const allEndpoints = {
      leads: {
        description: 'Quản lý khách hàng tiềm năng',
        endpoints: [
          { method: 'GET', path: '/leads', description: 'Danh sách leads' },
          { method: 'POST', path: '/leads', description: 'Tạo lead mới' },
          { method: 'GET', path: '/leads/stats', description: 'Thống kê leads' },
        ],
      },
      blog: {
        description: 'Quản lý blog',
        endpoints: [
          { method: 'GET', path: '/blog/posts', description: 'Danh sách bài viết' },
          { method: 'GET', path: '/blog/posts/:slug', description: 'Chi tiết bài viết' },
          { method: 'GET', path: '/blog/categories', description: 'Danh mục blog' },
        ],
      },
      projects: {
        description: 'Quản lý công trình',
        endpoints: [
          { method: 'GET', path: '/projects', description: 'Danh sách công trình' },
          { method: 'GET', path: '/projects/:id', description: 'Chi tiết công trình' },
        ],
      },
      contractors: {
        description: 'Quản lý nhà thầu',
        endpoints: [
          { method: 'GET', path: '/contractors', description: 'Danh sách nhà thầu' },
        ],
      },
      reports: {
        description: 'Báo cáo và thống kê',
        endpoints: [
          { method: 'GET', path: '/reports/dashboard', description: 'Thống kê tổng quan' },
        ],
      },
      pricing: {
        description: 'Cấu hình giá',
        endpoints: [
          { method: 'GET', path: '/pricing/service-categories', description: 'Danh mục dịch vụ' },
          { method: 'POST', path: '/pricing/service-categories', description: 'Tạo danh mục' },
          { method: 'PUT', path: '/pricing/service-categories/:id', description: 'Cập nhật danh mục' },
          { method: 'DELETE', path: '/pricing/service-categories/:id', description: 'Xóa danh mục' },
          { method: 'GET', path: '/pricing/unit-prices', description: 'Đơn giá' },
          { method: 'POST', path: '/pricing/unit-prices', description: 'Tạo đơn giá' },
          { method: 'PUT', path: '/pricing/unit-prices/:id', description: 'Cập nhật đơn giá' },
          { method: 'DELETE', path: '/pricing/unit-prices/:id', description: 'Xóa đơn giá' },
          { method: 'GET', path: '/pricing/formulas', description: 'Công thức' },
          { method: 'POST', path: '/pricing/formulas', description: 'Tạo công thức' },
          { method: 'POST', path: '/pricing/calculate-quote', description: 'Tính báo giá' },
        ],
      },
      furniture: {
        description: 'Quản lý nội thất',
        endpoints: [
          { method: 'GET', path: '/furniture/categories', description: 'Danh mục nội thất' },
          { method: 'GET', path: '/furniture/materials', description: 'Vật liệu' },
          { method: 'GET', path: '/furniture/developers', description: 'Chủ đầu tư' },
          { method: 'GET', path: '/furniture/projects', description: 'Dự án' },
          { method: 'GET', path: '/furniture/buildings', description: 'Tòa nhà' },
          { method: 'GET', path: '/furniture/layouts', description: 'Layout' },
          { method: 'GET', path: '/furniture/apartment-types', description: 'Loại căn hộ' },
          { method: 'GET', path: '/furniture/quotations', description: 'Báo giá nội thất' },
        ],
      },
    };

    // Filter based on allowed endpoints
    const availableEndpoints: Record<string, unknown> = {};
    for (const [group, data] of Object.entries(allEndpoints)) {
      if (allowedEndpoints.includes(group)) {
        availableEndpoints[group] = data;
      }
    }

    return successResponse(c, {
      apiKey: {
        name: apiKey.name,
        scope: apiKey.scope,
        allowedEndpoints,
      },
      availableEndpoints,
    });
  });

  return app;
}

// Re-export schemas for external use
export * from './schemas';
