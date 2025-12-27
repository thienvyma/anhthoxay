/**
 * Furniture Routes Module
 * @route /api/furniture - Public furniture routes
 * @route /api/admin/furniture - Admin furniture management routes
 */
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, getValidatedBody } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { FurnitureService, FurnitureServiceError } from '../services/furniture.service';
import type { CreateLayoutInput, CreateApartmentTypeInput } from '../services/furniture.service';
import {
  createDeveloperSchema, updateDeveloperSchema, createProjectSchema, updateProjectSchema,
  createBuildingSchema, updateBuildingSchema, createLayoutSchema, updateLayoutSchema,
  createApartmentTypeSchema, updateApartmentTypeSchema, createCategorySchema, updateCategorySchema,
  createProductSchema, updateProductSchema, createComboSchema, updateComboSchema,
  createFeeSchema, updateFeeSchema, createQuotationSchema, syncSchema,
} from '../schemas/furniture.schema';
import { googleSheetsService } from '../services/google-sheets.service';

function handleServiceError(c: Parameters<typeof errorResponse>[0], error: unknown) {
  if (error instanceof FurnitureServiceError) {
    return errorResponse(c, error.code, error.message, error.statusCode);
  }
  console.error('Furniture route error:', error);
  return errorResponse(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

export function createFurniturePublicRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  app.get('/developers', async (c) => {
    try { return successResponse(c, await furnitureService.getDevelopers()); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/projects', async (c) => {
    try { return successResponse(c, await furnitureService.getProjects(c.req.query('developerId'))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/buildings', async (c) => {
    try { return successResponse(c, await furnitureService.getBuildings(c.req.query('projectId'))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/layouts', async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      return successResponse(c, await furnitureService.getLayouts(buildingCode));
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/layouts/by-axis', async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      const axisStr = c.req.query('axis');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      if (!axisStr) return errorResponse(c, 'VALIDATION_ERROR', 'axis is required', 400);
      const axis = parseInt(axisStr, 10);
      if (isNaN(axis) || axis < 0) return errorResponse(c, 'VALIDATION_ERROR', 'axis must be non-negative', 400);
      const layout = await furnitureService.getLayoutByAxis(buildingCode, axis);
      if (!layout) return errorResponse(c, 'NOT_FOUND', 'Layout not found', 404);
      return successResponse(c, layout);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/apartment-types', async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      return successResponse(c, await furnitureService.getApartmentTypes(buildingCode, c.req.query('type')));
    } catch (error) { return handleServiceError(c, error); }
  });

  app.get('/categories', async (c) => {
    try { return successResponse(c, await furnitureService.getCategories()); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/products', async (c) => {
    try { return successResponse(c, await furnitureService.getProducts(c.req.query('categoryId'))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/combos', async (c) => {
    try { return successResponse(c, await furnitureService.getCombos(c.req.query('apartmentType'))); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/fees', async (c) => {
    try {
      const applicability = c.req.query('applicability') as 'COMBO' | 'CUSTOM' | 'BOTH' | undefined;
      if (applicability && !['COMBO', 'CUSTOM', 'BOTH'].includes(applicability)) {
        return errorResponse(c, 'VALIDATION_ERROR', 'applicability must be COMBO, CUSTOM, or BOTH', 400);
      }
      return successResponse(c, await furnitureService.getFees(applicability));
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/quotations', validate(createQuotationSchema), async (c) => {
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
      const fees = await furnitureService.getFees(body.selectionType === 'COMBO' ? 'COMBO' : 'CUSTOM');
      const bothFees = await furnitureService.getFees('BOTH');
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
        selectionType: body.selectionType,
        comboId: body.comboId,
        comboName: body.comboName,
        items: body.items,
        fees: [...fees, ...bothFees],
      });
      return successResponse(c, quotation, 201);
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
export function createFurnitureAdminRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  const furnitureService = new FurnitureService(prisma);

  app.get('/developers', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getDevelopers()); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.post('/developers', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createDeveloperSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createDeveloper(getValidatedBody<z.infer<typeof createDeveloperSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/developers/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateDeveloperSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateDeveloper(c.req.param('id'), getValidatedBody<z.infer<typeof updateDeveloperSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/developers/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteDeveloper(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/projects', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getProjects(c.req.query('developerId'))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.post('/projects', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createProjectSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createProject(getValidatedBody<z.infer<typeof createProjectSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/projects/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateProjectSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateProject(c.req.param('id'), getValidatedBody<z.infer<typeof updateProjectSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/projects/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteProject(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/buildings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getBuildings(c.req.query('projectId'))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.post('/buildings', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createBuildingSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createBuilding(getValidatedBody<z.infer<typeof createBuildingSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/buildings/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateBuildingSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateBuilding(c.req.param('id'), getValidatedBody<z.infer<typeof updateBuildingSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/buildings/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteBuilding(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.get('/layouts', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      return successResponse(c, await furnitureService.getLayouts(buildingCode));
    } catch (error) { return handleServiceError(c, error); }
  });
  app.get('/layouts/by-axis', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      const axisStr = c.req.query('axis');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      if (!axisStr) return errorResponse(c, 'VALIDATION_ERROR', 'axis is required', 400);
      const axis = parseInt(axisStr, 10);
      if (isNaN(axis) || axis < 0) return errorResponse(c, 'VALIDATION_ERROR', 'axis must be non-negative', 400);
      const layout = await furnitureService.getLayoutByAxis(buildingCode, axis);
      if (!layout) return errorResponse(c, 'NOT_FOUND', 'Layout not found', 404);
      return successResponse(c, layout);
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/layouts', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createLayoutSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createLayout(getValidatedBody<z.infer<typeof createLayoutSchema>>(c) as CreateLayoutInput), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/layouts/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateLayoutSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateLayout(c.req.param('id'), getValidatedBody<z.infer<typeof updateLayoutSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/layouts/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteLayout(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/apartment-types', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const buildingCode = c.req.query('buildingCode');
      if (!buildingCode) return errorResponse(c, 'VALIDATION_ERROR', 'buildingCode is required', 400);
      return successResponse(c, await furnitureService.getApartmentTypes(buildingCode, c.req.query('type')));
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/apartment-types', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createApartmentTypeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createApartmentType(getValidatedBody<z.infer<typeof createApartmentTypeSchema>>(c) as CreateApartmentTypeInput), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/apartment-types/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateApartmentTypeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateApartmentType(c.req.param('id'), getValidatedBody<z.infer<typeof updateApartmentTypeSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/apartment-types/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteApartmentType(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.get('/categories', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getCategories()); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.post('/categories', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createCategorySchema), async (c) => {
    try { return successResponse(c, await furnitureService.createCategory(getValidatedBody<z.infer<typeof createCategorySchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/categories/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateCategorySchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateCategory(c.req.param('id'), getValidatedBody<z.infer<typeof updateCategorySchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/categories/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteCategory(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/products', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getProducts(c.req.query('categoryId'))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.post('/products', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createProductSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createProduct(getValidatedBody<z.infer<typeof createProductSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/products/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateProductSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateProduct(c.req.param('id'), getValidatedBody<z.infer<typeof updateProductSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/products/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteProduct(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/combos', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.getCombos(c.req.query('apartmentType'))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.post('/combos', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createComboSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createCombo(getValidatedBody<z.infer<typeof createComboSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/combos/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateComboSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateCombo(c.req.param('id'), getValidatedBody<z.infer<typeof updateComboSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/combos/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteCombo(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.post('/combos/:id/duplicate', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.duplicateCombo(c.req.param('id')), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.get('/fees', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const applicability = c.req.query('applicability') as 'COMBO' | 'CUSTOM' | 'BOTH' | undefined;
      if (applicability && !['COMBO', 'CUSTOM', 'BOTH'].includes(applicability)) {
        return errorResponse(c, 'VALIDATION_ERROR', 'applicability must be COMBO, CUSTOM, or BOTH', 400);
      }
      return successResponse(c, await furnitureService.getFees(applicability));
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/fees', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(createFeeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.createFee(getValidatedBody<z.infer<typeof createFeeSchema>>(c)), 201); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.put('/fees/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(updateFeeSchema), async (c) => {
    try { return successResponse(c, await furnitureService.updateFee(c.req.param('id'), getValidatedBody<z.infer<typeof updateFeeSchema>>(c))); }
    catch (error) { return handleServiceError(c, error); }
  });
  app.delete('/fees/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { await furnitureService.deleteFee(c.req.param('id')); return successResponse(c, { ok: true }); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.get('/quotations', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const leadId = c.req.query('leadId');
      if (!leadId) return errorResponse(c, 'VALIDATION_ERROR', 'leadId is required', 400);
      return successResponse(c, await furnitureService.getQuotationsByLead(leadId));
    } catch (error) { return handleServiceError(c, error); }
  });
  app.get('/quotations/:id/pdf', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const quotation = await furnitureService.getQuotationById(c.req.param('id'));
      const { generateQuotationPDF } = await import('../services/pdf.service');
      const pdfBuffer = await generateQuotationPDF(quotation);
      const filename = 'bao-gia-' + quotation.unitNumber.replace(/\s+/g, '-') + '-' + new Date(quotation.createdAt).toISOString().split('T')[0] + '.pdf';
      return new Response(new Uint8Array(pdfBuffer), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + filename + '"', 'Content-Length': pdfBuffer.length.toString() },
      });
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/import', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const formData = await c.req.formData();
      const duAnFile = formData.get('duAn');
      const layoutsFile = formData.get('layouts');
      const apartmentTypesFile = formData.get('apartmentTypes');
      if (!duAnFile || !(duAnFile instanceof File)) return errorResponse(c, 'VALIDATION_ERROR', 'duAn file is required', 400);
      if (!layoutsFile || !(layoutsFile instanceof File)) return errorResponse(c, 'VALIDATION_ERROR', 'layouts file is required', 400);
      if (!apartmentTypesFile || !(apartmentTypesFile instanceof File)) return errorResponse(c, 'VALIDATION_ERROR', 'apartmentTypes file is required', 400);
      const result = await furnitureService.importFromCSV({
        duAn: await duAnFile.text(),
        layouts: await layoutsFile.text(),
        apartmentTypes: await apartmentTypesFile.text(),
      });
      return successResponse(c, { success: true, counts: result });
    } catch (error) { return handleServiceError(c, error); }
  });
  app.get('/export', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try { return successResponse(c, await furnitureService.exportToCSV()); }
    catch (error) { return handleServiceError(c, error); }
  });

  app.post('/sync/pull', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(syncSchema), async (c) => {
    try {
      const { spreadsheetId } = getValidatedBody<{ spreadsheetId: string }>(c);
      const status = await googleSheetsService.getStatus();
      if (!status.connected) return errorResponse(c, 'SYNC_ERROR', 'Google Sheets chua duoc ket noi', 400);
      const result = await googleSheetsService.syncFurniturePull(spreadsheetId, furnitureService);
      if (!result.success) return errorResponse(c, 'SYNC_ERROR', result.error || 'Dong bo that bai', 500);
      return successResponse(c, { success: true, counts: result.counts, message: 'Dong bo thanh cong' });
    } catch (error) { return handleServiceError(c, error); }
  });
  app.post('/sync/push', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(syncSchema), async (c) => {
    try {
      const { spreadsheetId } = getValidatedBody<{ spreadsheetId: string }>(c);
      const status = await googleSheetsService.getStatus();
      if (!status.connected) return errorResponse(c, 'SYNC_ERROR', 'Google Sheets chua duoc ket noi', 400);
      const result = await googleSheetsService.syncFurniturePush(spreadsheetId, furnitureService);
      if (!result.success) return errorResponse(c, 'SYNC_ERROR', result.error || 'Dong bo that bai', 500);
      return successResponse(c, { success: true, counts: result.counts, message: 'Dong bo thanh cong' });
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}

export default { createFurniturePublicRoutes, createFurnitureAdminRoutes };