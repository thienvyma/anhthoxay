/**
 * Furniture Quotation Routes
 * @route /quotations - Quotation CRUD operations
 */
import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { FurnitureService } from '../../services/furniture.service';
import { createQuotationSchema } from '../../schemas/furniture.schema';
import { rateLimiter } from '../../middleware/rate-limiter';
import { handleServiceError, type AuthenticateMiddleware, type RequireRoleMiddleware } from './types';

export function createQuotationPublicRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.post('/', rateLimiter({ maxAttempts: 10, windowMs: 60 * 1000 }), validate(createQuotationSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createQuotationSchema>>(c);
      console.log('[Furniture API] POST /quotations - body:', JSON.stringify(body, null, 2));
      
      let leadId = body.leadId;
      if (!leadId && body.leadData) {
        console.log('[Furniture API] Creating new lead from leadData');
        const newLead = await prisma.customerLead.create({
          data: {
            name: body.leadData.name,
            phone: body.leadData.phone,
            email: body.leadData.email || null,
            content: body.leadData.content || 'Bao gia noi that',
            source: 'FURNITURE_QUOTE',
            status: 'NEW',
          },
        });
        leadId = newLead.id;
        console.log('[Furniture API] Created new lead with id:', leadId);
      }
      if (!leadId) return errorResponse(c, 'VALIDATION_ERROR', 'Phai co leadId hoac leadData', 400);
      
      // Get all active fees for quotation calculation
      const fees = await furnitureService.getActiveFees();
      
      const quotation = await furnitureService.createQuotation({
        leadId,
        developerName: body.developerName,
        projectName: body.projectName,
        buildingName: body.buildingName,
        buildingCode: body.buildingCode,
        floor: body.floor,
        axis: body.axis,
        apartmentType: body.apartmentType,
        layoutImageUrl: body.layoutImageUrl,
        items: body.items,
        fees,
      });
      return successResponse(c, quotation, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  // Public PDF endpoint - allows downloading PDF for a quotation by ID
  // Requirements: 8.2 - PDF export for furniture quotations
  app.get('/:id/pdf', async (c) => {
    try {
      const quotation = await furnitureService.getQuotationById(c.req.param('id'));
      const { generateQuotationPDF } = await import('../../services/pdf.service');
      const pdfBuffer = await generateQuotationPDF(quotation, prisma);
      const filename = 'bao-gia-' + quotation.unitNumber.replace(/\s+/g, '-') + '-' + new Date(quotation.createdAt).toISOString().split('T')[0] + '.pdf';
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 
          'Content-Type': 'application/pdf', 
          'Content-Disposition': 'attachment; filename="' + filename + '"', 
          'Content-Length': pdfBuffer.length.toString() 
        },
      });
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}

export function createQuotationAdminRoutes(
  prisma: PrismaClient,
  authenticate: AuthenticateMiddleware,
  requireRole: RequireRoleMiddleware
) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const leadId = c.req.query('leadId');
      if (!leadId) return errorResponse(c, 'VALIDATION_ERROR', 'leadId is required', 400);
      return successResponse(c, await furnitureService.getQuotationsByLead(leadId));
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/:id/pdf', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const quotation = await furnitureService.getQuotationById(c.req.param('id'));
      const { generateQuotationPDF } = await import('../../services/pdf.service');
      const pdfBuffer = await generateQuotationPDF(quotation, prisma);
      const filename = 'bao-gia-' + quotation.unitNumber.replace(/\s+/g, '-') + '-' + new Date(quotation.createdAt).toISOString().split('T')[0] + '.pdf';
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + filename + '"', 'Content-Length': pdfBuffer.length.toString() },
      });
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
