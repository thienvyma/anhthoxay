/**
 * Leads Firestore Routes
 * 
 * Routes for customer leads using Firestore backend.
 * Includes public submission endpoint and admin management endpoints.
 * 
 * @module routes/firestore/leads.firestore.routes
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole, getCurrentUid } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { 
  createLeadSchema, 
  updateLeadSchema, 
  leadsQuerySchema,
  mergeLeadsSchema,
  type CreateLeadInput,
  type UpdateLeadInput,
  type LeadsQueryInput,
  type MergeLeadsInput,
} from '../../schemas/leads.schema';
import { 
  getLeadsFirestoreService,
  LeadsFirestoreError,
} from '../../services/firestore/leads.firestore';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

// ============================================
// PUBLIC ROUTES (Rate limited)
// ============================================

/**
 * Create public leads routes (for form submissions)
 */
export function createLeadsFirestoreRoutes() {
  const app = new Hono();
  const leadsService = getLeadsFirestoreService();

  /**
   * @route POST /leads
   * @description Submit a new lead (public endpoint)
   * @access Public (rate limited)
   */
  app.post('/', validate(createLeadSchema), async (c) => {
    try {
      const data = getValidatedBody<CreateLeadInput>(c);
      const result = await leadsService.createLead(data);

      logger.info('Lead submitted', { 
        id: result.lead.id, 
        wasMerged: result.wasMerged,
        source: data.source,
      });

      return successResponse(c, {
        id: result.lead.id,
        wasMerged: result.wasMerged,
        message: result.wasMerged 
          ? 'Thông tin đã được cập nhật vào yêu cầu trước đó' 
          : 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất!',
      }, 201);
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  return app;
}

// ============================================
// ADMIN/MANAGER ROUTES
// ============================================

/**
 * Create admin leads routes (for management)
 */
export function createAdminLeadsFirestoreRoutes() {
  const app = new Hono();
  const leadsService = getLeadsFirestoreService();

  // All routes require authentication and ADMIN or MANAGER role
  app.use('/*', firebaseAuth(), requireRole('ADMIN', 'MANAGER'));

  /**
   * @route GET /admin/leads
   * @description Get all leads with filters and pagination
   * @access Admin, Manager
   */
  app.get('/', validateQuery(leadsQuerySchema), async (c) => {
    try {
      const query = getValidatedQuery<LeadsQueryInput>(c);
      const result = await leadsService.getLeads({
        ...query,
        page: query.page,
        limit: query.limit,
      });

      return paginatedResponse(c, result.data, {
        total: result.total || 0,
        page: query.page,
        limit: query.limit,
      });
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /admin/leads/stats
   * @description Get leads statistics for dashboard
   * @access Admin, Manager
   */
  app.get('/stats', async (c) => {
    try {
      const stats = await leadsService.getStats();
      return successResponse(c, stats);
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /admin/leads/export
   * @description Export leads to CSV
   * @access Admin, Manager
   */
  app.get('/export', async (c) => {
    try {
      const search = c.req.query('search');
      const status = c.req.query('status');

      const csv = await leadsService.exportToCsv({ search, status });

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /admin/leads/:id
   * @description Get a single lead by ID
   * @access Admin, Manager
   */
  app.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await leadsService.getLeadWithMergeInfo(id);

      return successResponse(c, result);
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /admin/leads/:id/related
   * @description Get related leads for a lead
   * @access Admin, Manager
   */
  app.get('/:id/related', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await leadsService.getRelatedLeads(id);

      return successResponse(c, result);
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /admin/leads/:id/duplicates
   * @description Find potential duplicates for a lead
   * @access Admin, Manager
   */
  app.get('/:id/duplicates', async (c) => {
    try {
      const id = c.req.param('id');
      const duplicates = await leadsService.findDuplicates(id);

      return successResponse(c, { duplicates });
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route PUT /admin/leads/:id
   * @description Update a lead (status, notes)
   * @access Admin, Manager
   */
  app.put('/:id', validate(updateLeadSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = getValidatedBody<UpdateLeadInput>(c);
      const uid = getCurrentUid(c);

      const lead = await leadsService.updateLead(id, data, uid);

      logger.info('Lead updated', { id, updatedBy: uid });

      return successResponse(c, lead);
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route POST /admin/leads/:id/merge
   * @description Manually merge leads
   * @access Admin, Manager
   */
  app.post('/:id/merge', validate(mergeLeadsSchema), async (c) => {
    try {
      const primaryLeadId = c.req.param('id');
      const { secondaryLeadIds } = getValidatedBody<MergeLeadsInput>(c);
      const uid = getCurrentUid(c);

      const result = await leadsService.mergeLeads({
        primaryLeadId,
        secondaryLeadIds,
      });

      logger.info('Leads merged', { 
        primaryId: primaryLeadId, 
        mergedCount: result.mergedCount,
        mergedBy: uid,
      });

      return successResponse(c, {
        lead: result.primaryLead,
        mergedCount: result.mergedCount,
        message: `Đã merge ${result.mergedCount} lead thành công`,
      });
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route DELETE /admin/leads/:id
   * @description Delete a lead
   * @access Admin, Manager
   */
  app.delete('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const uid = getCurrentUid(c);

      await leadsService.deleteLead(id);

      logger.info('Lead deleted', { id, deletedBy: uid });

      return successResponse(c, { message: 'Lead đã được xóa' });
    } catch (error) {
      if (error instanceof LeadsFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  return app;
}
