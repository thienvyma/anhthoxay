/**
 * Furniture Admin Routes
 * @route /import - CSV import
 * @route /export - CSV export
 * @route /sync - Google Sheets sync
 * @route /pdf-settings - PDF settings management
 */
import { Hono } from 'hono';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate, getValidatedBody } from '../../middleware/validation';
import { successResponse, errorResponse } from '../../utils/response';
import { FurnitureService } from '../../services/furniture.service';
import { syncSchema } from '../../schemas/furniture.schema';
import { googleSheetsService } from '../../services/google-sheets.service';
import { handleServiceError, type AuthenticateMiddleware, type RequireRoleMiddleware } from './types';

export function createAdminUtilityRoutes(
  prisma: PrismaClient,
  authenticate: AuthenticateMiddleware,
  requireRole: RequireRoleMiddleware
) {
  const app = new Hono();
  const furnitureService = new FurnitureService(prisma);

  // ========== IMPORT/EXPORT ==========
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

  // ========== GOOGLE SHEETS SYNC ==========
  app.post('/sync/pull', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(syncSchema), async (c) => {
    try {
      const { spreadsheetId } = getValidatedBody<z.infer<typeof syncSchema>>(c);
      const status = await googleSheetsService.getStatus();
      if (!status.connected) return errorResponse(c, 'SYNC_ERROR', 'Google Sheets chua duoc ket noi', 400);
      const result = await googleSheetsService.syncFurniturePull(spreadsheetId, furnitureService);
      if (!result.success) return errorResponse(c, 'SYNC_ERROR', result.error || 'Dong bo that bai', 500);
      return successResponse(c, { success: true, counts: result.counts, message: 'Dong bo thanh cong' });
    } catch (error) { return handleServiceError(c, error); }
  });

  app.post('/sync/push', authenticate(), requireRole('ADMIN', 'MANAGER'), validate(syncSchema), async (c) => {
    try {
      const { spreadsheetId } = getValidatedBody<z.infer<typeof syncSchema>>(c);
      const status = await googleSheetsService.getStatus();
      if (!status.connected) return errorResponse(c, 'SYNC_ERROR', 'Google Sheets chua duoc ket noi', 400);
      const result = await googleSheetsService.syncFurniturePush(spreadsheetId, furnitureService);
      if (!result.success) return errorResponse(c, 'SYNC_ERROR', result.error || 'Dong bo that bai', 500);
      return successResponse(c, { success: true, counts: result.counts, message: 'Dong bo thanh cong' });
    } catch (error) { return handleServiceError(c, error); }
  });

  // ========== PDF SETTINGS ==========
  app.get('/pdf-settings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      let settings = await prisma.furniturePdfSettings.findUnique({ where: { id: 'default' } });
      if (!settings) {
        // Create default settings if not exists
        settings = await prisma.furniturePdfSettings.create({ data: { id: 'default' } });
      }
      return successResponse(c, settings);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.put('/pdf-settings', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const body = await c.req.json();
      // Remove id and timestamps from update data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = body;
      
      const settings = await prisma.furniturePdfSettings.upsert({
        where: { id: 'default' },
        update: updateData,
        create: { id: 'default', ...updateData },
      });
      return successResponse(c, settings);
    } catch (error) { return handleServiceError(c, error); }
  });

  app.post('/pdf-settings/reset', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      await prisma.furniturePdfSettings.delete({ where: { id: 'default' } }).catch(() => { /* ignore if not exists */ });
      const settings = await prisma.furniturePdfSettings.create({ data: { id: 'default' } });
      return successResponse(c, settings);
    } catch (error) { return handleServiceError(c, error); }
  });

  return app;
}
