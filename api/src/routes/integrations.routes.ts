/**
 * Integrations Routes Module
 * 
 * Handles third-party integrations, currently supporting Google Sheets OAuth
 * for lead synchronization.
 * 
 * **Feature: api-refactoring**
 * **Requirements: 1.1, 1.2, 1.3, 3.5, 6.1, 6.2**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, getValidatedBody } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { googleSheetsService } from '../services/google-sheets.service';

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Schema for updating Google Sheets integration settings
 */
export const updateGoogleSheetsSettingsSchema = z.object({
  spreadsheetId: z.string().optional(),
  sheetName: z.string().optional(),
  syncEnabled: z.boolean().optional(),
});

export type UpdateGoogleSheetsSettingsInput = z.infer<typeof updateGoogleSheetsSettingsSchema>;

// ============================================
// INTEGRATIONS ROUTES FACTORY
// ============================================

/**
 * Create integrations routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with integrations routes
 */
export function createIntegrationsRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // GOOGLE SHEETS INTEGRATION ROUTES
  // ============================================

  /**
   * @route GET /integrations/google/auth-url
   * @description Generate OAuth URL for Google Sheets authorization
   * @access Admin only
   * @returns { authUrl: string }
   */
  app.get(
    '/google/auth-url',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const authUrl = googleSheetsService.getAuthUrl();
        return successResponse(c, { authUrl });
      } catch (error) {
        console.error('Get auth URL error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to generate auth URL', 500);
      }
    }
  );

  /**
   * @route GET /integrations/google/callback
   * @description Handle OAuth callback from Google
   * @access Public (OAuth redirect)
   * @query code - Authorization code from Google
   * @returns Redirect to admin settings page or error response
   */
  app.get('/google/callback', async (c) => {
    try {
      const code = c.req.query('code');
      
      if (!code) {
        return errorResponse(c, 'VALIDATION_ERROR', 'No authorization code provided', 400);
      }

      const result = await googleSheetsService.handleCallback(code);
      
      if (result.success) {
        // Redirect to admin settings page on success
        return c.redirect('/admin/settings?tab=integrations&status=success');
      }
      
      return errorResponse(c, 'OAUTH_ERROR', result.message, 400);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to process OAuth callback', 500);
    }
  });

  /**
   * @route POST /integrations/google/disconnect
   * @description Disconnect Google Sheets integration and revoke access
   * @access Admin only
   * @returns { success: boolean, message: string }
   */
  app.post(
    '/google/disconnect',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const result = await googleSheetsService.disconnect();
        return successResponse(c, result);
      } catch (error) {
        console.error('Disconnect error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to disconnect', 500);
      }
    }
  );

  /**
   * @route GET /integrations/google/status
   * @description Get current Google Sheets connection status
   * @access Admin only
   * @returns {
   *   connected: boolean,
   *   spreadsheetId: string | null,
   *   sheetName: string,
   *   syncEnabled: boolean,
   *   lastSyncAt: string | null,
   *   errorCount: number,
   *   lastError: string | null
   * }
   */
  app.get(
    '/google/status',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const status = await googleSheetsService.getStatus();
        return successResponse(c, status);
      } catch (error) {
        console.error('Get status error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get status', 500);
      }
    }
  );

  /**
   * @route POST /integrations/google/test
   * @description Test spreadsheet access with current credentials
   * @access Admin only
   * @returns { success: boolean, message: string }
   */
  app.post(
    '/google/test',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const result = await googleSheetsService.testConnection();
        return successResponse(c, result);
      } catch (error) {
        console.error('Test connection error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to test connection', 500);
      }
    }
  );

  /**
   * @route PUT /integrations/google/settings
   * @description Update Google Sheets integration settings
   * @access Admin only
   * @body { spreadsheetId?: string, sheetName?: string, syncEnabled?: boolean }
   * @returns { success: boolean, message: string }
   */
  app.put(
    '/google/settings',
    authenticate(),
    requireRole('ADMIN'),
    validate(updateGoogleSheetsSettingsSchema),
    async (c) => {
      try {
        const body = getValidatedBody<UpdateGoogleSheetsSettingsInput>(c);
        const result = await googleSheetsService.updateSettings(body);
        return successResponse(c, result);
      } catch (error) {
        console.error('Update settings error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update settings', 500);
      }
    }
  );

  return app;
}

export default { createIntegrationsRoutes };
