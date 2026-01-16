/**
 * Review Report Firestore Routes
 *
 * API endpoints for review report management using Firestore.
 * Includes creating reports and admin operations.
 *
 * @module routes/firestore/report.firestore.routes
 * @requirements 7.1
 */

import { Hono } from 'hono';
import {
  firebaseAuth,
  requireRole,
  getCurrentUid,
} from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import {
  CreateReportSchema,
  ResolveReportSchema,
  ReportQuerySchema,
  type CreateReportInput,
  type ResolveReportInput,
  type ReportQuery,
} from '../../schemas/report.schema';
import {
  getReviewReportFirestoreService,
  ReviewFirestoreError,
} from '../../services/firestore/review.firestore';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';

// ============================================
// PUBLIC REPORT ROUTES (Authenticated users)
// ============================================

/**
 * Creates report routes for authenticated users
 */
export function createPublicReportFirestoreRoutes() {
  const app = new Hono();
  const reportService = getReviewReportFirestoreService();

  /**
   * @route POST /:id/report
   * @description Create a report for a review
   * @access Authenticated users
   */
  app.post(
    '/:id/report',
    firebaseAuth(),
    validate(CreateReportSchema),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reviewId = c.req.param('id');
        const data = getValidatedBody<CreateReportInput>(c);

        const report = await reportService.createReport(reviewId, uid, data);
        return successResponse(c, report, 201);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
 */
export function createAdminReportFirestoreRoutes() {
  const app = new Hono();
  const reportService = getReviewReportFirestoreService();

  /**
   * @route GET /
   * @description List all reports with filters
   * @access Admin only
   */
  app.get(
    '/',
    firebaseAuth(),
    requireRole('ADMIN'),
    validateQuery(ReportQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<ReportQuery>(c);

        const result = await reportService.listReports({
          reviewId: query.reviewId,
          reporterId: query.reporterId,
          status: query.status,
          reason: query.reason,
          limit: query.limit,
        });

        return paginatedResponse(c, result.data, {
          total: result.data.length,
          page: query.page,
          limit: query.limit,
        });
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
    firebaseAuth(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const stats = await reportService.getStats();
        return successResponse(c, stats);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
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
    firebaseAuth(),
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
        if (error instanceof ReviewFirestoreError) {
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
   */
  app.put(
    '/:id/resolve',
    firebaseAuth(),
    requireRole('ADMIN'),
    validate(ResolveReportSchema),
    async (c) => {
      try {
        const uid = getCurrentUid(c);
        const reportId = c.req.param('id');
        const data = getValidatedBody<ResolveReportInput>(c);

        const report = await reportService.resolveReport(reportId, uid, {
          resolution: data.resolution,
        });
        return successResponse(c, report);
      } catch (error) {
        if (error instanceof ReviewFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  return app;
}
