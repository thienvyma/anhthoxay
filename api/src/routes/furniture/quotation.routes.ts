/**
 * Furniture Quotation Routes
 * @route /quotations - Quotation CRUD operations
 * 
 * **Feature: furniture-quotation-email**
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.5**
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
import { 
  generateQuotationFilename, 
  generateQuotationEmailHtml, 
  generateQuotationEmailSubject,
  getEmailSettings
} from '../../utils/quotation-email';

export function createQuotationPublicRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  // Rate limit for quotation creation: 20 requests per 5 minutes per IP
  // This is more generous to allow users to create multiple quotations
  app.post('/', rateLimiter({ 
    maxAttempts: 20, 
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyGenerator: (c) => `quotation-create:${c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown'}`
  }), validate(createQuotationSchema), async (c) => {
    try {
      const body = getValidatedBody<z.infer<typeof createQuotationSchema>>(c);
      
      let leadId = body.leadId;
      if (!leadId && body.leadData) {
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
  // **Property 5: Email Filename Format**
  // **Validates: Requirements 7.4**
  app.get('/:id/pdf', async (c) => {
    try {
      const quotation = await furnitureService.getQuotationById(c.req.param('id'));
      const { generateQuotationPDF } = await import('../../services/pdf.service');
      const pdfBuffer = await generateQuotationPDF(quotation, prisma);
      const filename = generateQuotationFilename(quotation.unitNumber, new Date(quotation.createdAt));
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 
          'Content-Type': 'application/pdf', 
          'Content-Disposition': 'attachment; filename="' + filename + '"', 
          'Content-Length': pdfBuffer.length.toString() 
        },
      });
    } catch (error) { return handleServiceError(c, error); }
  });

  /**
   * POST /api/furniture/quotations/:id/send-email
   * Send quotation PDF via email to the lead's email address
   * 
   * Rate limited: 5 requests per quotation per 30 minutes
   * - First send is automatic after quotation creation
   * - User can resend up to 4 more times within 30 minutes
   * - After 30 minutes, counter resets
   * 
   * **Feature: furniture-quotation-email**
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.5**
   */
  app.post('/:id/send-email', rateLimiter({ 
    maxAttempts: 5, 
    windowMs: 30 * 60 * 1000, // 30 minutes (more reasonable for user experience)
    keyGenerator: (c) => `quotation-email:${c.req.param('id')}` // Rate limit per quotation ID
  }), async (c) => {
    try {
      const quotationId = c.req.param('id');
      
      // 1. Validate quotation exists
      // _Requirements: 8.2_
      const quotation = await furnitureService.getQuotationById(quotationId);
      
      // 2. Get lead and validate email exists
      // _Requirements: 8.2_
      const lead = await prisma.customerLead.findUnique({
        where: { id: quotation.leadId },
      });
      
      if (!lead) {
        return errorResponse(c, 'QUOTATION_NOT_FOUND', 'Lead associated with quotation not found', 404);
      }
      
      if (!lead.email) {
        return errorResponse(c, 'LEAD_EMAIL_MISSING', 'Lead does not have an email address', 400);
      }
      
      // 3. Check if Gmail is configured
      // _Requirements: 6.2_
      const { gmailEmailService } = await import('../../services/gmail-email.service');
      const isConfigured = await gmailEmailService.isConfigured();
      
      if (!isConfigured) {
        return errorResponse(c, 'GMAIL_NOT_CONFIGURED', 'Vui lòng cấu hình Google integration trong Admin Settings', 503);
      }
      
      // 4. Generate PDF
      // _Requirements: 7.1, 7.2, 7.3, 7.5_
      const { generateQuotationPDF } = await import('../../services/pdf.service');
      const pdfBuffer = await generateQuotationPDF(quotation, prisma);
      
      // 5. Generate filename
      // **Property 5: Email Filename Format**
      // _Requirements: 7.4_
      const pdfFilename = generateQuotationFilename(quotation.unitNumber);
      
      // 6. Get email settings from database
      const emailSettings = await getEmailSettings(prisma);
      
      // 7. Create email content using settings
      // _Requirements: 3.5_
      const emailSubject = generateQuotationEmailSubject(quotation.unitNumber, emailSettings);
      const emailHtmlContent = generateQuotationEmailHtml({
        leadName: lead.name,
        projectName: quotation.projectName,
        buildingName: quotation.buildingName,
        unitNumber: quotation.unitNumber,
        apartmentType: quotation.apartmentType,
      }, emailSettings);
      
      // 8. Send email
      // _Requirements: 6.1, 6.3, 8.1_
      const result = await gmailEmailService.sendQuotationEmail({
        to: lead.email,
        subject: emailSubject,
        htmlContent: emailHtmlContent,
        pdfBuffer,
        pdfFilename,
      });
      
      if (!result.success) {
        // _Requirements: 8.4_
        return errorResponse(c, 'EMAIL_SEND_FAILED', result.error || 'Failed to send email', 500);
      }
      
      // 9. Return success response
      // _Requirements: 8.3_
      return successResponse(c, {
        success: true,
        sentAt: new Date().toISOString(),
        recipientEmail: lead.email,
        messageId: result.messageId,
      });
      
    } catch (error) { 
      return handleServiceError(c, error); 
    }
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
      const filename = generateQuotationFilename(quotation.unitNumber, new Date(quotation.createdAt));
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + filename + '"', 'Content-Length': pdfBuffer.length.toString() },
      });
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
