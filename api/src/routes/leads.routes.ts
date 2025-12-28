/**
 * Leads Routes Module
 * 
 * Handles CRUD operations for customer leads.
 * Includes search, filtering, pagination, stats, and CSV export.
 * 
 * **Feature: api-refactoring**
 * **Requirements: 1.1, 1.2, 1.3, 3.5, 5.1, 6.1, 6.2**
 */

import { Hono } from 'hono';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';
import { googleSheetsService } from '../services/google-sheets.service';
import { rateLimiter } from '../middleware/rate-limiter';

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
 * Schema for lead list query parameters
 */
export const leadsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']).optional(),
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

  // ============================================
  // PUBLIC ROUTES
  // ============================================

  /**
   * @route POST /leads
   * @description Create a new customer lead (public endpoint)
   * @access Public (with rate limiting)
   */
  app.post('/', rateLimiter({ maxAttempts: 5, windowMs: 60 * 1000 }), validate(createLeadSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createLeadSchema>>(c);

      const lead = await prisma.customerLead.create({
        data: {
          name: body.name,
          phone: body.phone,
          email: body.email || null,
          content: body.content,
          source: body.source,
          quoteData: body.quoteData,
        },
      });

      // Async sync to Google Sheets (don't block response)
      googleSheetsService.isSyncEnabled().then(async (enabled) => {
        if (enabled) {
          const syncResult = await googleSheetsService.syncLeadToSheet(lead);
          if (!syncResult.success) {
            console.error('Google Sheets sync failed:', syncResult.error);
          }
        }
      }).catch(err => console.error('Google Sheets sync check failed:', err));

      return successResponse(c, lead, 201);
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
   */
  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), validateQuery(leadsQuerySchema), async (c) => {
    try {
      const { search, status, page, limit } = getValidatedQuery<z.infer<typeof leadsQuerySchema>>(c);
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.CustomerLeadWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        const searchLower = search.toLowerCase();
        where.OR = [
          { name: { contains: searchLower } },
          { phone: { contains: searchLower } },
          { email: { contains: searchLower } },
        ];
      }

      // Get total count and data
      const [total, leads] = await Promise.all([
        prisma.customerLead.count({ where }),
        prisma.customerLead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return paginatedResponse(c, leads, { total, page, limit });
    } catch (error) {
      console.error('Get leads error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get leads', 500);
    }
  });

  /**
   * @route GET /leads/stats
   * @description Get dashboard statistics for leads
   * @access Admin, Manager
   */
  app.get('/stats', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      // Get all leads for stats
      const leads = await prisma.customerLead.findMany({
        select: { status: true, source: true, createdAt: true },
      });

      // Daily leads for last 30 days
      const dailyLeadsMap = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyLeadsMap.set(dateStr, 0);
      }

      leads.forEach(lead => {
        const dateStr = lead.createdAt.toISOString().split('T')[0];
        if (dailyLeadsMap.has(dateStr)) {
          dailyLeadsMap.set(dateStr, (dailyLeadsMap.get(dateStr) || 0) + 1);
        }
      });

      const dailyLeads = Array.from(dailyLeadsMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Status distribution
      const byStatus: Record<string, number> = {};
      leads.forEach(lead => {
        byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      });

      // Source distribution
      const bySource: Record<string, number> = {};
      leads.forEach(lead => {
        bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      });

      // Conversion rate: CONVERTED / (total - CANCELLED)
      const totalNonCancelled = leads.filter(l => l.status !== 'CANCELLED').length;
      const converted = byStatus['CONVERTED'] || 0;
      const conversionRate = totalNonCancelled > 0
        ? Math.round((converted / totalNonCancelled) * 100 * 100) / 100
        : 0;

      return successResponse(c, {
        dailyLeads,
        byStatus,
        bySource,
        conversionRate,
        totalLeads: leads.length,
        newLeads: byStatus['NEW'] || 0,
      });
    } catch (error) {
      console.error('Leads stats error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get stats', 500);
    }
  });

  /**
   * @route GET /leads/export
   * @description Export leads to CSV
   * @access Admin, Manager
   */
  app.get('/export', 
    authenticate(), 
    requireRole('ADMIN', 'MANAGER'),
    validateQuery(z.object({
      search: z.string().optional(),
      status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']).optional(),
    })),
    async (c) => {
    try {
      // Apply same filters as list
      const query = getValidatedQuery<{ search?: string; status?: string }>(c);
      const search = query.search?.toLowerCase();
      const status = query.status;

      const where: Prisma.CustomerLeadWhereInput = {};
      if (status) where.status = status;
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

      // Generate CSV
      const headers = ['name', 'phone', 'email', 'content', 'status', 'source', 'createdAt'];
      const csvRows = [headers.join(',')];

      leads.forEach(lead => {
        const row = [
          `"${(lead.name || '').replace(/"/g, '""')}"`,
          `"${(lead.phone || '').replace(/"/g, '""')}"`,
          `"${(lead.email || '').replace(/"/g, '""')}"`,
          `"${(lead.content || '').replace(/"/g, '""')}"`,
          `"${lead.status}"`,
          `"${lead.source}"`,
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
   * @description Get a single lead by ID
   * @access Admin, Manager
   */
  app.get('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      const lead = await prisma.customerLead.findUnique({ where: { id } });

      if (!lead) {
        return errorResponse(c, 'NOT_FOUND', 'Lead not found', 404);
      }

      return successResponse(c, lead);
    } catch (error) {
      console.error('Get lead error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get lead', 500);
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
