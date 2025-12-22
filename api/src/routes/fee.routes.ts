/**
 * Fee Routes Module
 *
 * Handles fee transaction management endpoints for admin.
 * - List fee transactions with filtering
 * - Get fee details
 * - Mark fee as paid
 * - Cancel fee
 * - Export fees to CSV
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 10.4, 10.5, 13.1-13.5**
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { FeeService, FeeError } from '../services/fee.service';
import {
  FeeQuerySchema,
  MarkFeePaidSchema,
  CancelFeeSchema,
  FeeExportQuerySchema,
  type FeeQuery,
  type MarkFeePaidInput,
  type CancelFeeInput,
  type FeeExportQuery,
} from '../schemas/fee.schema';

// ============================================
// ADMIN FEE ROUTES
// ============================================

/**
 * Create admin fee routes
 * @param prisma - Prisma client instance
 * @returns Hono app with admin fee routes
 */
export function createAdminFeeRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const feeService = new FeeService(prisma);

  /**
   * @route GET /api/admin/fees
   * @description List fee transactions with filtering and pagination
   * @access Admin only
   * @query status - Filter by fee status (PENDING, PAID, CANCELLED)
   * @query type - Filter by fee type (WIN_FEE, VERIFICATION_FEE)
   * @query userId - Filter by contractor user ID
   * @query projectId - Filter by project ID
   * @query code - Search by fee code
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 20)
   * @query sortBy - Sort field (default: createdAt)
   * @query sortOrder - Sort order (default: desc)
   * Requirements: 10.4, 13.1, 13.2
   */
  app.get(
    '/',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(FeeQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<FeeQuery>(c);
        const result = await feeService.list(query);
        return successResponse(c, result);
      } catch (error) {
        console.error('List fees error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy danh sách phí', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/fees/export
   * @description Export fee transactions to CSV
   * @access Admin only
   * @query status - Filter by fee status
   * @query type - Filter by fee type
   * @query userId - Filter by contractor user ID
   * @query fromDate - Filter from date (ISO string)
   * @query toDate - Filter to date (ISO string)
   * Requirements: 13.5
   */
  app.get(
    '/export',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(FeeExportQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<FeeExportQuery>(c);
        const fees = await feeService.getForExport(query);

        // Generate CSV content
        const csvHeaders = [
          'Mã phí',
          'Loại phí',
          'Số tiền',
          'Tiền tệ',
          'Trạng thái',
          'Nhà thầu',
          'Email',
          'Điện thoại',
          'Mã công trình',
          'Tên công trình',
          'Mã bid',
          'Giá bid',
          'Ngày tạo',
          'Ngày thanh toán',
          'Người xác nhận',
          'Ngày hủy',
          'Lý do hủy',
        ];

        const csvRows = fees.map((fee) => [
          fee.code,
          fee.type === 'WIN_FEE' ? 'Phí thắng thầu' : 'Phí xác minh',
          fee.amount.toString(),
          fee.currency,
          fee.status === 'PENDING' ? 'Chờ thanh toán' : fee.status === 'PAID' ? 'Đã thanh toán' : 'Đã hủy',
          fee.user?.name || '',
          fee.user?.email || '',
          fee.user?.phone || '',
          fee.project?.code || '',
          fee.project?.title || '',
          fee.bid?.code || '',
          fee.bid?.price?.toString() || '',
          fee.createdAt.toISOString(),
          fee.paidAt?.toISOString() || '',
          fee.paidBy || '',
          fee.cancelledAt?.toISOString() || '',
          fee.cancelReason || '',
        ]);

        // Build CSV string with BOM for Excel UTF-8 support
        const BOM = '\uFEFF';
        const csvContent = BOM + [
          csvHeaders.join(','),
          ...csvRows.map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          ),
        ].join('\n');

        // Return CSV file
        const filename = `fees-export-${new Date().toISOString().split('T')[0]}.csv`;
        
        return new Response(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } catch (error) {
        console.error('Export fees error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể xuất danh sách phí', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/fees/:id
   * @description Get fee transaction details by ID
   * @access Admin only
   * Requirements: 13.3
   */
  app.get('/:id', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const id = c.req.param('id');
      const fee = await feeService.getById(id);

      if (!fee) {
        return errorResponse(c, 'NOT_FOUND', 'Không tìm thấy phí giao dịch', 404);
      }

      return successResponse(c, fee);
    } catch (error) {
      console.error('Get fee error:', error);

      if (error instanceof FeeError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }

      return errorResponse(c, 'INTERNAL_ERROR', 'Không thể lấy thông tin phí', 500);
    }
  });

  /**
   * @route PUT /api/admin/fees/:id/paid
   * @description Mark fee as paid
   * @access Admin only
   * @body MarkFeePaidInput (optional note)
   * Requirements: 10.5, 13.4
   */
  app.put(
    '/:id/paid',
    authenticate(),
    requireRole('ADMIN'),
    validate(MarkFeePaidSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const user = c.get('user');
        const data = getValidatedBody<MarkFeePaidInput>(c);

        if (!user) {
          return errorResponse(c, 'UNAUTHORIZED', 'Không có quyền truy cập', 401);
        }

        const fee = await feeService.markPaid(id, user.id, data);
        return successResponse(c, fee);
      } catch (error) {
        console.error('Mark fee paid error:', error);

        if (error instanceof FeeError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể đánh dấu đã thanh toán', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/fees/:id/cancel
   * @description Cancel fee transaction
   * @access Admin only
   * @body CancelFeeInput (reason required)
   */
  app.put(
    '/:id/cancel',
    authenticate(),
    requireRole('ADMIN'),
    validate(CancelFeeSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const user = c.get('user');
        const data = getValidatedBody<CancelFeeInput>(c);

        if (!user) {
          return errorResponse(c, 'UNAUTHORIZED', 'Không có quyền truy cập', 401);
        }

        const fee = await feeService.cancel(id, user.id, data);
        return successResponse(c, fee);
      } catch (error) {
        console.error('Cancel fee error:', error);

        if (error instanceof FeeError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }

        return errorResponse(c, 'INTERNAL_ERROR', 'Không thể hủy phí giao dịch', 500);
      }
    }
  );

  return app;
}

export default { createAdminFeeRoutes };
