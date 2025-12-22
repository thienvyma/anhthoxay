/**
 * Review Report Routes
 *
 * API endpoints for review report management including creating reports,
 * listing reports for admin, and resolving reports.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 19.1-19.4**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import {
  CreateReportSchema,
  ResolveReportSchema,
  ReportQuerySchema,
  type CreateReportInput,
  type ResolveReportInput,
  type ReportQuery,
} from '../schemas/report.schema';
import { ReportService, ReportError } from '../services/report.service';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';

// ============================================
// PUBLIC REPORT ROUTES (Authenticated users)
// ============================================

/**
 * Creates report routes for authenticated users
 * @param prisma - Prisma client instance
 * Requirements: 19.1, 19.2
 */
export function createPublicReportRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate } = createAuthMiddleware(prisma);
  const reportService = new ReportService(prisma);

  /**
   * @route POST /:id/report
   * @description Create a report for a review
   * @access Authenticated users
   * Requirements: 19.1, 19.2 - Report button with reason selection
   */
  app.post(
    '/:id/report',
    authenticate(),
    validate(CreateReportSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const reviewId = c.req.param('id');
        const data = getValidatedBody<CreateReportInput>(c);
        const report = await reportService.createReport(reviewId, user.sub, data);
        return successResponse(c, report, 201);
      } catch (error) {
        if (error instanceof ReportError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}

// ============================================
// ADMIN REPORT ROUTES
// ============================================

/**
 * Creates admin report routes
 * @param prisma - Prisma client instance
 * Requirements: 19.3, 19.4
 */
export function createAdminReportRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const reportService = new ReportService(prisma);

  /**
   * @route GET /
   * @description List all reports with filters
   * @access Admin only
   * Requirements: 19.3 - Create moderation ticket for admin
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(ReportQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<ReportQuery>(c);
        const result = await reportService.listReports(query);
        return paginatedResponse(c, result.data, result.meta);
      } catch (error) {
        if (error instanceof ReportError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /stats
   * @description Get report statistics
   * @access Admin only
   */
  app.get(
    '/stats',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const stats = await reportService.getStats();
        return successResponse(c, stats);
      } catch (error) {
        if (error instanceof ReportError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /:id
   * @description Get report detail
   * @access Admin only
   */
  app.get(
    '/:id',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const reportId = c.req.param('id');
        const report = await reportService.getById(reportId);
        
        if (!report) {
          return errorResponse(c, 'REPORT_NOT_FOUND', 'Báo cáo không tồn tại', 404);
        }
        
        return successResponse(c, report);
      } catch (error) {
        if (error instanceof ReportError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route PUT /:id/resolve
   * @description Resolve a report
   * @access Admin only
   * Requirements: 19.4 - Admin can hide, delete, or dismiss
   */
  app.put(
    '/:id/resolve',
    authenticate(),
    requireRole('ADMIN'),
    validate(ResolveReportSchema),
    async (c) => {
      try {
        const user = getUser(c);
        const reportId = c.req.param('id');
        const data = getValidatedBody<ResolveReportInput>(c);
        const report = await reportService.resolveReport(reportId, user.sub, data);
        return successResponse(c, report);
      } catch (error) {
        if (error instanceof ReportError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
