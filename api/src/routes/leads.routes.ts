/**
 * Leads Routes Module
 * 
 * Handles CRUD operations for customer leads.
 * Includes search, filtering, pagination, stats, and CSV export.
 * 
 * **Feature: lead-duplicate-management, high-traffic-resilience**
 * **Requirements: 1.1-1.4, 2.1-2.5, 3.1-3.3, 4.1, 4.3, 10.3**
 */

import { Hono } from 'hono';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';
import { googleSheetsService } from '../services/google-sheets.service';
import { rateLimiter } from '../middleware/rate-limiter';
import { turnstileMiddleware } from '../middleware/turnstile';
import { LeadsService, LeadsServiceError } from '../services/leads.service';
import { getCorrelationId } from '../middleware/correlation-id';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

/**
 * Status history entry for tracking lead status changes
 */
interface StatusHistoryEntry {
  from: string;
  to: string;
  changedAt: string;
  changedBy?: string;
}

// ============================================
// SCHEMAS
// ============================================

/**
 * Schema for creating a new lead (public endpoint)
 */
export const createLeadSchema = z.object({
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(100),
  phone: z.string().regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ').min(10),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  content: z.string().min(10, 'Nội dung tối thiểu 10 ký tự').max(2000),
  source: z.enum(['QUOTE_FORM', 'CONTACT_FORM', 'FURNITURE_QUOTE']).default('CONTACT_FORM'),
  quoteData: z.string().optional(),
});

/**
 * Schema for updating a lead (admin/manager only)
 */
export const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema for manual merge leads request
 * 
 * **Feature: lead-duplicate-management**
 * **Requirements: 6.2, 6.3**
 */
export const mergeLeadsSchema = z.object({
  secondaryLeadIds: z.array(z.string()).min(1, 'Phải có ít nhất một lead phụ để merge'),
});

/**
 * Schema for lead list query parameters
 * 
 * **Feature: lead-duplicate-management**
 * **Requirements: 8.1, 8.2**
 */
export const leadsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']).optional(),
  // Duplicate management filters (Requirements 8.1, 8.2)
  duplicateStatus: z.enum(['all', 'duplicates_only', 'no_duplicates']).default('all'),
  hasRelated: z.coerce.boolean().optional(),
  source: z.enum(['QUOTE_FORM', 'CONTACT_FORM', 'FURNITURE_QUOTE']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// LEADS ROUTES FACTORY
// ============================================

/**
 * Create leads routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with leads routes
 */
export function createLeadsRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const leadsService = new LeadsService(prisma);

  // ============================================
  // PUBLIC ROUTES
  // ============================================

  /**
   * @route POST /leads
   * @description Create a new customer lead with auto-merge and duplicate detection
   * @access Public (with rate limiting and CAPTCHA verification)
   * 
   * Auto-merge behavior:
   * - Same phone + same source + status NEW + within 1 hour → merge into existing
   * - Same phone + different source → create new, mark as related
   * - Same phone + same source (outside time window) → create new, mark as potential duplicate
   * 
   * **Feature: production-scalability, high-traffic-resilience**
   * **Validates: Requirements 3.1, 10.3**
   */
  app.post('/', rateLimiter({ maxAttempts: 5, windowMs: 60 * 1000 }), turnstileMiddleware(), validate(createLeadSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createLeadSchema>>(c);
      const correlationId = getCorrelationId(c);

      const result = await leadsService.createLead({
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        content: body.content,
        source: body.source,
        quoteData: body.quoteData,
      });

      // Async sync to Google Sheets with correlation ID (don't block response)
      // **Feature: high-traffic-resilience**
      // **Validates: Requirements 10.3**
      googleSheetsService.isSyncEnabled().then(async (enabled) => {
        if (enabled) {
          const syncResult = await googleSheetsService.syncLeadToSheet(result.lead, correlationId);
          if (!syncResult.success) {
            logger.error('Google Sheets sync failed', {
              leadId: result.lead.id,
              error: syncResult.error,
              correlationId,
            });
          }
        }
      }).catch(err => {
        logger.error('Google Sheets sync check failed', {
          error: err instanceof Error ? err.message : 'Unknown error',
          correlationId,
        });
      });

      // Return with merge info for debugging/logging
      return successResponse(c, {
        ...result.lead,
        _meta: {
          wasMerged: result.wasMerged,
          mergedIntoId: result.mergedIntoId,
        },
      }, 201);
    } catch (error) {
      console.error('Lead creation error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create lead', 500);
    }
  });

  // ============================================
  // PROTECTED ROUTES (Admin/Manager)
  // ============================================

  /**
   * @route GET /leads
   * @description Get all leads with search, filter, and pagination
   * @access Admin, Manager
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 8.1, 8.2, 8.3**
   * 
   * Query params:
   * - search: search by name, phone, email
   * - status: filter by lead status
   * - duplicateStatus: 'all' | 'duplicates_only' | 'no_duplicates'
   * - hasRelated: filter by hasRelatedLeads
   * - source: filter by lead source
   * - page, limit: pagination
   */
  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), validateQuery(leadsQuerySchema), async (c) => {
    try {
      const { search, status, duplicateStatus, hasRelated, source, page, limit } = getValidatedQuery<z.infer<typeof leadsQuerySchema>>(c);

      const result = await leadsService.getLeads({
        search,
        status,
        duplicateStatus,
        hasRelated,
        source,
        page,
        limit,
      });

      return paginatedResponse(c, result.leads, { total: result.total, page: result.page, limit: result.limit });
    } catch (error) {
      console.error('Get leads error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get leads', 500);
    }
  });

  /**
   * @route GET /leads/stats
   * @description Get dashboard statistics for leads (excludes merged leads)
   * @access Admin, Manager
   */
  app.get('/stats', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const stats = await leadsService.getStats();
      return successResponse(c, stats);
    } catch (error) {
      console.error('Leads stats error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get stats', 500);
    }
  });

  /**
   * @route GET /leads/export
   * @description Export leads to CSV (excludes merged leads)
   * @access Admin, Manager
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 8.3**
   */
  app.get('/export', 
    authenticate(), 
    requireRole('ADMIN', 'MANAGER'),
    validateQuery(z.object({
      search: z.string().optional(),
      status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']).optional(),
      duplicateStatus: z.enum(['all', 'duplicates_only', 'no_duplicates']).default('all'),
      hasRelated: z.coerce.boolean().optional(),
      source: z.enum(['QUOTE_FORM', 'CONTACT_FORM', 'FURNITURE_QUOTE']).optional(),
    })),
    async (c) => {
    try {
      // Apply same filters as list
      const query = getValidatedQuery<{ 
        search?: string; 
        status?: string;
        duplicateStatus?: 'all' | 'duplicates_only' | 'no_duplicates';
        hasRelated?: boolean;
        source?: string;
      }>(c);
      const search = query.search?.toLowerCase();
      const status = query.status;
      const duplicateStatus = query.duplicateStatus || 'all';
      const hasRelated = query.hasRelated;
      const source = query.source;

      const where: Prisma.CustomerLeadWhereInput = {
        // Exclude merged leads by default
        mergedIntoId: null,
      };
      
      if (status) where.status = status;
      if (source) where.source = source;
      
      // Duplicate status filter
      if (duplicateStatus === 'duplicates_only') {
        where.isPotentialDuplicate = true;
      } else if (duplicateStatus === 'no_duplicates') {
        where.isPotentialDuplicate = false;
      }
      
      // Has related filter
      if (hasRelated !== undefined) {
        where.hasRelatedLeads = hasRelated;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ];
      }

      const leads = await prisma.customerLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      // Generate CSV with duplicate management fields
      const headers = ['name', 'phone', 'email', 'content', 'status', 'source', 'submissionCount', 'isPotentialDuplicate', 'hasRelatedLeads', 'relatedLeadCount', 'createdAt'];
      const csvRows = [headers.join(',')];

      leads.forEach(lead => {
        const row = [
          `"${(lead.name || '').replace(/"/g, '""')}"`,
          `"${(lead.phone || '').replace(/"/g, '""')}"`,
          `"${(lead.email || '').replace(/"/g, '""')}"`,
          `"${(lead.content || '').replace(/"/g, '""')}"`,
          `"${lead.status}"`,
          `"${lead.source}"`,
          `"${lead.submissionCount}"`,
          `"${lead.isPotentialDuplicate}"`,
          `"${lead.hasRelatedLeads}"`,
          `"${lead.relatedLeadCount}"`,
          `"${lead.createdAt.toISOString()}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } catch (error) {
      console.error('Leads export error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to export leads', 500);
    }
  });

  /**
   * @route GET /leads/:id
   * @description Get a single lead by ID with related leads count and merge info
   * @access Admin, Manager
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 5.1, 6.6**
   * 
   * If the lead has been merged into another lead, returns redirect info
   * to the primary lead instead of the merged lead data.
   */
  app.get('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      const lead = await prisma.customerLead.findUnique({ where: { id } });

      if (!lead) {
        return errorResponse(c, 'NOT_FOUND', 'Lead not found', 404);
      }

      // Handle merged lead access (Requirements 6.6)
      // Return redirect info to primary lead
      if (lead.mergedIntoId) {
        return successResponse(c, {
          ...lead,
          _redirect: {
            isMerged: true,
            mergedIntoId: lead.mergedIntoId,
            mergedAt: lead.mergedAt,
            message: 'Lead này đã được merge vào lead khác',
          },
        });
      }

      // Include relatedLeadCount in response (Requirements 5.1)
      return successResponse(c, {
        ...lead,
        relatedLeadCount: lead.relatedLeadCount,
      });
    } catch (error) {
      console.error('Get lead error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get lead', 500);
    }
  });

  /**
   * @route GET /leads/:id/related
   * @description Get all related leads for a given lead (same phone, any source)
   * @access Admin, Manager
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 5.1, 5.2, 5.3**
   * 
   * Returns leads grouped by source with:
   * - source: lead source
   * - status: lead status
   * - contentPreview: first 100 chars of content
   * - createdAt: creation date
   */
  app.get('/:id/related', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      const result = await leadsService.getRelatedLeads(id);
      return successResponse(c, result);
    } catch (error) {
      if (error instanceof LeadsServiceError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Get related leads error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get related leads', 500);
    }
  });

  /**
   * @route PUT /leads/:id
   * @description Update a lead with status history tracking
   * @access Admin, Manager
   */
  app.put('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateLeadSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<z.infer<typeof updateLeadSchema>>(c);
      const user = getUser(c);

      // Get current lead to check status change
      const currentLead = await prisma.customerLead.findUnique({ where: { id } });
      if (!currentLead) {
        return errorResponse(c, 'NOT_FOUND', 'Lead not found', 404);
      }

      // Prepare update data
      const updateData: Prisma.CustomerLeadUpdateInput = {};
      if (body.notes !== undefined) updateData.notes = body.notes;

      // Handle status change with history tracking
      if (body.status && body.status !== currentLead.status) {
        updateData.status = body.status;

        // Parse existing history or create new array
        let history: StatusHistoryEntry[] = [];
        if (currentLead.statusHistory) {
          try {
            history = JSON.parse(currentLead.statusHistory) as StatusHistoryEntry[];
          } catch {
            history = [];
          }
        }

        // Add new entry
        const newEntry: StatusHistoryEntry = {
          from: currentLead.status,
          to: body.status,
          changedAt: new Date().toISOString(),
          changedBy: user.sub,
        };
        history.push(newEntry);

        updateData.statusHistory = JSON.stringify(history);
      }

      const lead = await prisma.customerLead.update({ where: { id }, data: updateData });
      return successResponse(c, lead);
    } catch (error) {
      console.error('Lead update error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update lead', 500);
    }
  });

  /**
   * @route POST /leads/:id/merge
   * @description Manually merge duplicate leads into a primary lead
   * @access Admin, Manager
   * 
   * **Feature: lead-duplicate-management**
   * **Requirements: 6.2, 6.3**
   * 
   * Request body:
   * - secondaryLeadIds: array of lead IDs to merge into the primary lead
   * 
   * Merge behavior:
   * - All leads must have the same source
   * - Content from secondary leads is appended with timestamps
   * - Submission counts are summed
   * - Secondary leads are soft-deleted (mergedIntoId set)
   */
  app.post('/:id/merge', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(mergeLeadsSchema), async (c) => {
    try {
      const primaryLeadId = c.req.param('id');
      const body = getValidatedBody<z.infer<typeof mergeLeadsSchema>>(c);

      const result = await leadsService.mergeLeads({
        primaryLeadId,
        secondaryLeadIds: body.secondaryLeadIds,
      });

      return successResponse(c, {
        primaryLead: result.primaryLead,
        mergedCount: result.mergedCount,
        message: `Đã merge ${result.mergedCount} lead thành công`,
      });
    } catch (error) {
      if (error instanceof LeadsServiceError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      console.error('Lead merge error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to merge leads', 500);
    }
  });

  /**
   * @route DELETE /leads/:id
   * @description Delete a lead
   * @access Admin, Manager
   */
  app.delete('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');

      const lead = await prisma.customerLead.findUnique({ where: { id } });
      if (!lead) {
        return errorResponse(c, 'NOT_FOUND', 'Lead not found', 404);
      }

      await prisma.customerLead.delete({ where: { id } });
      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('Delete lead error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete lead', 500);
    }
  });

  return app;
}

export default { createLeadsRoutes };
