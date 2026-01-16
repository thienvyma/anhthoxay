/**
 * Fee Firestore Routes
 * 
 * Handles fee transaction management using Firestore backend.
 * 
 * @route /api/admin/fees - Admin fee management routes
 * 
 * @module routes/firestore/fee.firestore.routes
 * @requirements 5.4
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole, getCurrentUser } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { 
  getFeeFirestoreService, 
  FeeFirestoreError,
  type FeeQueryParams,
  type CancelFeeInput,
} from '../../services/firestore/fee.firestore';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const FeeQuerySchema = z.object({
  status: z.string().optional(),
  type: z.enum(['WIN_FEE', 'VERIFICATION_FEE']).optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  code: z.string().optional(),
  fromDate: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
  toDate: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const MarkPaidSchema = z.object({
  note: z.string().max(500).optional(),
});

const CancelFeeSchema = z.object({
  reason: z.string().min(10).max(500),
});

// ============================================
// ADMIN FEE ROUTES
// ============================================

export function createAdminFeeFirestoreRoutes() {
  const app = new Hono();
  const feeService = getFeeFirestoreService();

  // Apply auth middleware to all routes
  app.use('*', firebaseAuth());
  app.use('*', requireRole('ADMIN'));

  /**
   * @route GET /api/admin/fees
   * @description List all fee transactions
   * @access ADMIN
   */
  app.get('/', validateQuery(FeeQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<z.infer<typeof FeeQuerySchema>>(c);
      const result = await feeService.list(query as FeeQueryParams);
      return successResponse(c, result);
    } catch (error) {
      console.error('Get admin fees error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get fees', 500);
    }
  });

  /**
   * @route GET /api/admin/fees/stats
   * @description Get fee statistics
   * @access ADMIN
   */
  app.get('/stats', async (c) => {
    try {
      const userId = c.req.query('userId');
      const projectId = c.req.query('projectId');
      
      const stats = await feeService.getStats({ userId, projectId });
      return successResponse(c, stats);
    } catch (error) {
      console.error('Get fee stats error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get fee stats', 500);
    }
  });

  /**
   * @route GET /api/admin/fees/export
   * @description Export fee transactions
   * @access ADMIN
   */
  app.get('/export', validateQuery(FeeQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<z.infer<typeof FeeQuerySchema>>(c);
      const fees = await feeService.getForExport(query as FeeQueryParams);
      
      // Generate CSV
      const headers = ['Code', 'Type', 'Amount', 'Currency', 'Status', 'User ID', 'Project ID', 'Created At', 'Paid At'];
      const rows = fees.map(fee => [
        fee.code,
        fee.type,
        fee.amount.toString(),
        fee.currency,
        fee.status,
        fee.userId,
        fee.projectId,
        fee.createdAt.toISOString(),
        fee.paidAt?.toISOString() || '',
      ]);
      
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="fees-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } catch (error) {
      console.error('Export fees error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to export fees', 500);
    }
  });

  /**
   * @route GET /api/admin/fees/:id
   * @description Get fee transaction detail
   * @access ADMIN
   */
  app.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const fee = await feeService.getById(id);

      if (!fee) {
        return errorResponse(c, 'FEE_NOT_FOUND', 'Fee transaction không tồn tại', 404);
      }

      return successResponse(c, fee);
    } catch (error) {
      console.error('Get admin fee error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get fee', 500);
    }
  });

  /**
   * @route PUT /api/admin/fees/:id/paid
   * @description Mark fee as paid
   * @access ADMIN
   */
  app.put('/:id/paid', validate(MarkPaidSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      // Note: data.note is validated but not used in current implementation
      // Can be extended later to store payment notes
      getValidatedBody<{ note?: string }>(c);
      
      const fee = await feeService.markPaid(id, user.uid);
      return successResponse(c, fee);
    } catch (error) {
      if (error instanceof FeeFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Mark fee paid error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to mark fee as paid', 500);
    }
  });

  /**
   * @route PUT /api/admin/fees/:id/cancel
   * @description Cancel fee transaction
   * @access ADMIN
   */
  app.put('/:id/cancel', validate(CancelFeeSchema), async (c) => {
    try {
      const user = getCurrentUser(c);
      const id = c.req.param('id');
      const data = getValidatedBody<CancelFeeInput>(c);
      
      const fee = await feeService.cancel(id, user.uid, data);
      return successResponse(c, fee);
    } catch (error) {
      if (error instanceof FeeFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Cancel fee error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to cancel fee', 500);
    }
  });

  return app;
}

export default {
  createAdminFeeFirestoreRoutes,
};
