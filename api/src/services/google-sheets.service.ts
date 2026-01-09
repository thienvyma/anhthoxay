/**
 * Google Sheets Integration Service
 * Handles OAuth2 flow and lead synchronization to Google Sheets
 * 
 * **Feature: security-hardening, high-traffic-resilience**
 * **Validates: Requirements 1.1, 1.2, 10.3**
 */

import { google } from 'googleapis';
import { prisma } from '../utils/prisma';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';
import { logger } from '../utils/logger';

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4202/integrations/google/callback';

// Scopes required for Google Sheets and Gmail
// _Requirements: 6.1 - Gmail send scope for quotation emails
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.send',
];

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds
};

interface IntegrationConfig {
  spreadsheetId: string;
  sheetName: string;
  syncEnabled: boolean;
}

interface LeadData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  content: string;
  status: string;
  source: string;
  quoteData: string | null;
  createdAt: Date;
}

export class GoogleSheetsService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Get decrypted refresh token from stored credentials
   * Handles migration from plaintext to encrypted tokens
   * 
   * @param credentials - The stored credentials (may be encrypted or plaintext)
   * @returns The decrypted refresh token
   */
  private getDecryptedToken(credentials: string): string {
    // Check if token is encrypted (migration support for existing plaintext tokens)
    if (isEncrypted(credentials)) {
      return decrypt(credentials);
    }
    // Return as-is for plaintext tokens (legacy support)
    // Note: These should be migrated to encrypted format
    console.warn('Found plaintext token in database. Consider running migration to encrypt existing tokens.');
    return credentials;
  }

  /**
   * Migrate existing plaintext token to encrypted format
   * Call this to upgrade legacy tokens
   */
  async migrateToEncryptedToken(): Promise<{ success: boolean; message: string }> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { type: 'google_sheets' },
      });

      if (!integration?.credentials) {
        return { success: false, message: 'No integration found' };
      }

      // Check if already encrypted
      if (isEncrypted(integration.credentials)) {
        return { success: true, message: 'Token already encrypted' };
      }

      // Encrypt the plaintext token
      const encryptedToken = encrypt(integration.credentials);

      // Update with encrypted token
      await prisma.integration.update({
        where: { type: 'google_sheets' },
        data: { credentials: encryptedToken },
      });

      return { success: true, message: 'Token migrated to encrypted format' };
    } catch (error) {
      console.error('Token migration error:', error);
      return { success: false, message: 'Failed to migrate token' };
    }
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Handle OAuth2 callback and store credentials
   * Encrypts the refresh token before storing in database
   */
  async handleCallback(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.refresh_token) {
        return { success: false, message: 'No refresh token received. Please try again.' };
      }

      // Encrypt refresh token before storing
      const encryptedToken = encrypt(tokens.refresh_token);

      // Store or update integration with encrypted credentials
      await prisma.integration.upsert({
        where: { type: 'google_sheets' },
        create: {
          type: 'google_sheets',
          config: JSON.stringify({ spreadsheetId: '', sheetName: 'Leads', syncEnabled: false }),
          credentials: encryptedToken,
        },
        update: {
          credentials: encryptedToken,
          errorCount: 0,
          lastError: null,
        },
      });

      return { success: true, message: 'Google Sheets connected successfully' };
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return { success: false, message: 'Failed to connect Google Sheets' };
    }
  }


  /**
   * Disconnect Google Sheets integration
   */
  async disconnect(): Promise<{ success: boolean; message: string }> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { type: 'google_sheets' },
      });

      if (integration?.credentials) {
        // Revoke token - decrypt before use
        try {
          const refreshToken = this.getDecryptedToken(integration.credentials);
          this.oauth2Client.setCredentials({ refresh_token: refreshToken });
          await this.oauth2Client.revokeCredentials();
        } catch (revokeError) {
          // Ignore revoke errors - token may already be invalid
          // eslint-disable-next-line no-console -- Debug logging for token revoke errors
          console.debug('Token revoke skipped:', revokeError);
        }
      }

      // Delete integration (ignore if not exists)
      await prisma.integration.delete({
        where: { type: 'google_sheets' },
      }).catch((deleteError) => {
        // eslint-disable-next-line no-console -- Debug logging for delete errors
        console.debug('Integration delete skipped:', deleteError);
      });

      return { success: true, message: 'Google Sheets disconnected' };
    } catch (error) {
      console.error('Google disconnect error:', error);
      return { success: false, message: 'Failed to disconnect' };
    }
  }

  /**
   * Get integration status
   */
  async getStatus(): Promise<{
    connected: boolean;
    spreadsheetId: string | null;
    sheetName: string;
    syncEnabled: boolean;
    lastSyncAt: string | null;
    errorCount: number;
    lastError: string | null;
  }> {
    const integration = await prisma.integration.findUnique({
      where: { type: 'google_sheets' },
    });

    if (!integration) {
      return {
        connected: false,
        spreadsheetId: null,
        sheetName: 'Leads',
        syncEnabled: false,
        lastSyncAt: null,
        errorCount: 0,
        lastError: null,
      };
    }

    const config: IntegrationConfig = JSON.parse(integration.config);
    return {
      connected: !!integration.credentials,
      spreadsheetId: config.spreadsheetId || null,
      sheetName: config.sheetName || 'Leads',
      syncEnabled: config.syncEnabled || false,
      lastSyncAt: integration.lastSyncAt?.toISOString() || null,
      errorCount: integration.errorCount,
      lastError: integration.lastError,
    };
  }

  /**
   * Update integration settings
   */
  async updateSettings(settings: { spreadsheetId?: string; sheetName?: string; syncEnabled?: boolean }): Promise<{ success: boolean; message: string }> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { type: 'google_sheets' },
      });

      if (!integration) {
        return { success: false, message: 'Google Sheets not connected' };
      }

      const currentConfig: IntegrationConfig = JSON.parse(integration.config);
      const newConfig: IntegrationConfig = {
        spreadsheetId: settings.spreadsheetId ?? currentConfig.spreadsheetId,
        sheetName: settings.sheetName ?? currentConfig.sheetName,
        syncEnabled: settings.syncEnabled ?? currentConfig.syncEnabled,
      };

      await prisma.integration.update({
        where: { type: 'google_sheets' },
        data: { config: JSON.stringify(newConfig) },
      });

      return { success: true, message: 'Settings updated' };
    } catch (error) {
      console.error('Update settings error:', error);
      return { success: false, message: 'Failed to update settings' };
    }
  }

  /**
   * Test spreadsheet access
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { type: 'google_sheets' },
      });

      if (!integration?.credentials) {
        return { success: false, message: 'Google Sheets not connected' };
      }

      const config: IntegrationConfig = JSON.parse(integration.config);
      if (!config.spreadsheetId) {
        return { success: false, message: 'Spreadsheet ID not configured' };
      }

      // Decrypt token before use
      const refreshToken = this.getDecryptedToken(integration.credentials);
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });

      // Try to get spreadsheet info
      await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId });

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      console.error('Test connection error:', error);
      return { success: false, message: 'Failed to access spreadsheet. Check ID and permissions.' };
    }
  }


  /**
   * Sync a lead to Google Sheets with retry logic
   * 
   * **Feature: high-traffic-resilience**
   * **Validates: Requirements 10.3**
   * 
   * @param lead - Lead data to sync
   * @param correlationId - Optional correlation ID for tracing
   */
  async syncLeadToSheet(lead: LeadData, correlationId?: string): Promise<{ success: boolean; error?: string }> {
    const integration = await prisma.integration.findUnique({
      where: { type: 'google_sheets' },
    });

    if (!integration?.credentials) {
      return { success: false, error: 'Google Sheets not connected' };
    }

    const config: IntegrationConfig = JSON.parse(integration.config);
    if (!config.syncEnabled || !config.spreadsheetId) {
      return { success: false, error: 'Sync not enabled or spreadsheet not configured' };
    }

    // Decrypt token before use
    const refreshToken = this.getDecryptedToken(integration.credentials);

    // Retry with exponential backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
      try {
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });

        // Prepare row data
        const rowData = [
          lead.id,
          lead.name,
          lead.phone,
          lead.email || '',
          lead.content,
          lead.status,
          lead.source,
          lead.quoteData || '',
          lead.createdAt.toISOString(),
        ];

        // Log with correlation ID for tracing
        logger.info('Syncing lead to Google Sheets', {
          leadId: lead.id,
          spreadsheetId: config.spreadsheetId,
          attempt: attempt + 1,
          correlationId,
        });

        // Append to sheet
        await sheets.spreadsheets.values.append({
          spreadsheetId: config.spreadsheetId,
          range: `${config.sheetName}!A:I`,
          valueInputOption: 'RAW',
          requestBody: { values: [rowData] },
        });

        // Update last sync time and reset error count
        await prisma.integration.update({
          where: { type: 'google_sheets' },
          data: { lastSyncAt: new Date(), errorCount: 0, lastError: null },
        });

        logger.info('Lead synced to Google Sheets successfully', {
          leadId: lead.id,
          correlationId,
        });

        return { success: true };
      } catch (error) {
        lastError = error as Error;
        logger.error('Google Sheets sync attempt failed', {
          leadId: lead.id,
          attempt: attempt + 1,
          error: lastError.message,
          correlationId,
        });

        // Wait before retry (exponential backoff)
        if (attempt < RETRY_CONFIG.maxRetries - 1) {
          const delay = Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
            RETRY_CONFIG.maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - update error count
    await prisma.integration.update({
      where: { type: 'google_sheets' },
      data: {
        errorCount: { increment: 1 },
        lastError: lastError?.message || 'Unknown error',
      },
    });

    logger.error('Google Sheets sync failed after all retries', {
      leadId: lead.id,
      error: lastError?.message,
      correlationId,
    });

    return { success: false, error: lastError?.message || 'Sync failed after retries' };
  }

  /**
   * Check if sync is enabled
   */
  async isSyncEnabled(): Promise<boolean> {
    const integration = await prisma.integration.findUnique({
      where: { type: 'google_sheets' },
    });

    if (!integration?.credentials) return false;

    const config: IntegrationConfig = JSON.parse(integration.config);
    return config.syncEnabled && !!config.spreadsheetId;
  }

  /**
   * Read data from a specific sheet
   * 
   * @param spreadsheetId - The Google Spreadsheet ID
   * @param sheetName - The name of the sheet to read
   * @param range - Optional range (e.g., 'A1:G100'), defaults to entire sheet
   * @returns Array of rows, where each row is an array of cell values
   */
  async readSheet(
    spreadsheetId: string,
    sheetName: string,
    range?: string
  ): Promise<(string | number | null)[][] | null> {
    const integration = await prisma.integration.findUnique({
      where: { type: 'google_sheets' },
    });

    if (!integration?.credentials) {
      throw new Error('Google Sheets not connected');
    }

    // Decrypt token before use
    const refreshToken = this.getDecryptedToken(integration.credentials);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });

    // Build the range string
    const fullRange = range ? `${sheetName}!${range}` : sheetName;

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: fullRange,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return null;
      }

      // Convert to typed array
      return rows.map((row) =>
        row.map((cell) => {
          if (cell === null || cell === undefined || cell === '') {
            return null;
          }
          // Try to parse as number
          const num = Number(cell);
          if (!isNaN(num) && cell !== '') {
            return num;
          }
          return String(cell);
        })
      );
    } catch (error) {
      console.error('Read sheet error:', error);
      throw new Error(`Failed to read sheet "${sheetName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write data to a specific sheet (overwrites existing data)
   * 
   * @param spreadsheetId - The Google Spreadsheet ID
   * @param sheetName - The name of the sheet to write to
   * @param data - Array of rows to write
   * @param startCell - Starting cell (e.g., 'A1'), defaults to 'A1'
   * @returns Number of rows written
   */
  async writeSheet(
    spreadsheetId: string,
    sheetName: string,
    data: (string | number | null)[][],
    startCell = 'A1'
  ): Promise<number> {
    const integration = await prisma.integration.findUnique({
      where: { type: 'google_sheets' },
    });

    if (!integration?.credentials) {
      throw new Error('Google Sheets not connected');
    }

    // Decrypt token before use
    const refreshToken = this.getDecryptedToken(integration.credentials);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });

    const range = `${sheetName}!${startCell}`;

    try {
      // Clear existing data first (use full range format)
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A:ZZ`,
      });

      // Write new data
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: data.map((row) =>
            row.map((cell) => (cell === null ? '' : cell))
          ),
        },
      });

      return response.data.updatedRows ?? 0;
    } catch (error) {
      console.error('Write sheet error:', error);
      throw new Error(`Failed to write to sheet "${sheetName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Copy a sheet to create a backup
   * 
   * @param spreadsheetId - The Google Spreadsheet ID
   * @param sourceSheetName - Name of the sheet to copy
   * @param backupSheetName - Name for the backup sheet (will be created)
   * @returns Success status
   */
  async copySheet(
    spreadsheetId: string,
    sourceSheetName: string,
    backupSheetName: string
  ): Promise<{ success: boolean; message: string }> {
    const integration = await prisma.integration.findUnique({
      where: { type: 'google_sheets' },
    });

    if (!integration?.credentials) {
      throw new Error('Google Sheets not connected');
    }

    const refreshToken = this.getDecryptedToken(integration.credentials);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });

    try {
      // Get spreadsheet info to find source sheet ID
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      const sourceSheet = spreadsheet.data.sheets?.find(
        (s) => s.properties?.title === sourceSheetName
      );

      if (!sourceSheet?.properties?.sheetId) {
        return { success: false, message: `Sheet "${sourceSheetName}" not found` };
      }

      // Delete existing backup sheet if exists
      const existingBackup = spreadsheet.data.sheets?.find(
        (s) => s.properties?.title === backupSheetName
      );
      if (existingBackup?.properties?.sheetId) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ deleteSheet: { sheetId: existingBackup.properties.sheetId } }],
          },
        });
      }

      // Copy the sheet
      const copyResponse = await sheets.spreadsheets.sheets.copyTo({
        spreadsheetId,
        sheetId: sourceSheet.properties.sheetId,
        requestBody: { destinationSpreadsheetId: spreadsheetId },
      });

      // Rename the copied sheet
      if (copyResponse.data.sheetId) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              updateSheetProperties: {
                properties: {
                  sheetId: copyResponse.data.sheetId,
                  title: backupSheetName,
                },
                fields: 'title',
              },
            }],
          },
        });
      }

      return { success: true, message: `Backup created: ${backupSheetName}` };
    } catch (error) {
      console.error('Copy sheet error:', error);
      return {
        success: false,
        message: `Failed to backup sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Merge data into a specific sheet (update existing rows, add new rows)
   * 
   * @param spreadsheetId - The Google Spreadsheet ID
   * @param sheetName - The name of the sheet to merge into
   * @param newData - Array of rows to merge
   * @param keyColumnIndex - Index of the column to use as unique key for merging (0-based)
   * @param compositeKeyIndices - Optional array of column indices for composite key
   * @returns Object with counts of added and updated rows
   */
  async mergeSheet(
    spreadsheetId: string,
    sheetName: string,
    newData: (string | number | null)[][],
    keyColumnIndex: number,
    compositeKeyIndices?: number[]
  ): Promise<{ added: number; updated: number }> {
    const result = await this.mergeSheetWithOptions(
      spreadsheetId,
      sheetName,
      newData,
      keyColumnIndex,
      compositeKeyIndices,
      { dryRun: false }
    );
    return { added: result.added, updated: result.updated };
  }

  /**
   * Merge data with options for dry-run and detailed logging
   * 
   * @param spreadsheetId - The Google Spreadsheet ID
   * @param sheetName - The name of the sheet to merge into
   * @param newData - Array of rows to merge
   * @param keyColumnIndex - Index of the column to use as unique key for merging (0-based)
   * @param compositeKeyIndices - Optional array of column indices for composite key
   * @param options - { dryRun: boolean } - if true, only preview changes without applying
   * @returns Object with counts and details of changes
   */
  async mergeSheetWithOptions(
    spreadsheetId: string,
    sheetName: string,
    newData: (string | number | null)[][],
    keyColumnIndex: number,
    compositeKeyIndices?: number[],
    options: { dryRun: boolean } = { dryRun: false }
  ): Promise<{
    added: number;
    updated: number;
    unchanged: number;
    details: {
      toAdd: string[];
      toUpdate: string[];
      existingOnly: string[];
    };
  }> {
    const integration = await prisma.integration.findUnique({
      where: { type: 'google_sheets' },
    });

    if (!integration?.credentials) {
      throw new Error('Google Sheets not connected');
    }

    if (newData.length === 0) {
      return { added: 0, updated: 0, unchanged: 0, details: { toAdd: [], toUpdate: [], existingOnly: [] } };
    }

    // Decrypt token before use
    const refreshToken = this.getDecryptedToken(integration.credentials);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });

    try {
      // Read existing data from sheet
      const existingData = await this.readSheet(spreadsheetId, sheetName);
      
      // Helper function to get key from row
      const getKey = (row: (string | number | null)[]): string => {
        if (compositeKeyIndices && compositeKeyIndices.length > 0) {
          return compositeKeyIndices.map(i => String(row[i] ?? '')).join('|');
        }
        return String(row[keyColumnIndex] ?? '');
      };

      // If no existing data, just write all new data
      if (!existingData || existingData.length === 0) {
        const keysToAdd = newData.slice(1).map(row => getKey(row));
        
        if (!options.dryRun) {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: newData.map((row) =>
                row.map((cell) => (cell === null ? '' : cell))
              ),
            },
          });
        }
        
        return {
          added: newData.length - 1,
          updated: 0,
          unchanged: 0,
          details: { toAdd: keysToAdd, toUpdate: [], existingOnly: [] },
        };
      }

      // Build map of existing rows by key (skip header row)
      const existingMap = new Map<string, { rowIndex: number; data: (string | number | null)[] }>();
      for (let i = 1; i < existingData.length; i++) {
        const key = getKey(existingData[i]);
        if (key) {
          existingMap.set(key, { rowIndex: i, data: existingData[i] });
        }
      }

      // Build set of new data keys
      const newDataKeys = new Set<string>();
      for (let i = 1; i < newData.length; i++) {
        newDataKeys.add(getKey(newData[i]));
      }

      // Separate new data into updates and additions (skip header row at index 0)
      const rowsToUpdate: { rowIndex: number; data: (string | number | null)[]; key: string }[] = [];
      const rowsToAdd: { data: (string | number | null)[]; key: string }[] = [];

      for (let i = 1; i < newData.length; i++) {
        const row = newData[i];
        const key = getKey(row);
        const existing = existingMap.get(key);
        
        if (existing) {
          // Update existing row (+1 for 1-based row index)
          rowsToUpdate.push({ rowIndex: existing.rowIndex + 1, data: row, key });
        } else {
          // Add new row
          rowsToAdd.push({ data: row, key });
        }
      }

      // Find keys that exist in sheet but not in new data
      const existingOnlyKeys: string[] = [];
      for (const key of existingMap.keys()) {
        if (!newDataKeys.has(key)) {
          existingOnlyKeys.push(key);
        }
      }

      // Log detailed changes
      logger.info(`Merge ${sheetName}: ${rowsToAdd.length} to add, ${rowsToUpdate.length} to update, ${existingOnlyKeys.length} existing only (not in DB)`, {
        sheetName,
        dryRun: options.dryRun,
        toAdd: rowsToAdd.map(r => r.key).slice(0, 10),
        toUpdate: rowsToUpdate.map(r => r.key).slice(0, 10),
        existingOnly: existingOnlyKeys.slice(0, 10),
      });

      if (!options.dryRun) {
        // Batch update existing rows
        if (rowsToUpdate.length > 0) {
          const updateRequests = rowsToUpdate.map(({ rowIndex, data }) => ({
            range: `${sheetName}!A${rowIndex}`,
            values: [data.map((cell) => (cell === null ? '' : cell))],
          }));

          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
              valueInputOption: 'RAW',
              data: updateRequests,
            },
          });
        }

        // Append new rows
        if (rowsToAdd.length > 0) {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:A`,
            valueInputOption: 'RAW',
            requestBody: {
              values: rowsToAdd.map(({ data }) =>
                data.map((cell) => (cell === null ? '' : cell))
              ),
            },
          });
        }
      }

      return {
        added: rowsToAdd.length,
        updated: rowsToUpdate.length,
        unchanged: existingOnlyKeys.length,
        details: {
          toAdd: rowsToAdd.map(r => r.key),
          toUpdate: rowsToUpdate.map(r => r.key),
          existingOnly: existingOnlyKeys,
        },
      };
    } catch (error) {
      console.error('Merge sheet error:', error);
      throw new Error(`Failed to merge to sheet "${sheetName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // FURNITURE SYNC METHODS
  // _Requirements: 9.1, 9.2, 9.3, 9.4_
  // ============================================

  /**
   * Sync furniture data from Google Sheets (Pull)
   * Reads 3 tabs: DuAn, Layout, ApartmentType
   * 
   * @param spreadsheetId - The Google Spreadsheet ID
   * @param furnitureService - FurnitureService instance for import
   * @returns Import result with counts
   */
  async syncFurniturePull(
    spreadsheetId: string,
    furnitureService: { importFromCSV: (files: { duAn: string; layouts: string; apartmentTypes: string }) => Promise<{ developers: number; projects: number; buildings: number; layouts: number; apartmentTypes: number }> }
  ): Promise<{
    success: boolean;
    counts?: { developers: number; projects: number; buildings: number; layouts: number; apartmentTypes: number };
    error?: string;
  }> {
    try {
      // Read data from 3 tabs
      const duAnData = await this.readSheet(spreadsheetId, 'DuAn');
      const layoutData = await this.readSheet(spreadsheetId, 'Layout');
      const apartmentTypeData = await this.readSheet(spreadsheetId, 'ApartmentType');

      // Convert sheet data to CSV strings
      const duAnCSV = this.sheetDataToCSV(duAnData);
      const layoutsCSV = this.sheetDataToCSV(layoutData);
      const apartmentTypesCSV = this.sheetDataToCSV(apartmentTypeData);

      // Import using furniture service
      const counts = await furnitureService.importFromCSV({
        duAn: duAnCSV,
        layouts: layoutsCSV,
        apartmentTypes: apartmentTypesCSV,
      });

      // Update last sync time
      await prisma.integration.update({
        where: { type: 'google_sheets' },
        data: { lastSyncAt: new Date(), errorCount: 0, lastError: null },
      });

      return { success: true, counts };
    } catch (error) {
      console.error('Furniture sync pull error:', error);
      
      // Update error count
      await prisma.integration.update({
        where: { type: 'google_sheets' },
        data: {
          errorCount: { increment: 1 },
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(() => {
        // Ignore update errors
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync from Google Sheets',
      };
    }
  }

  /**
   * Sync furniture data to Google Sheets (Push)
   * Merges data into 3 tabs: DuAn, Layout, ApartmentType
   * - Updates existing rows based on unique key
   * - Adds new rows that don't exist
   * - Supports dry-run mode to preview changes
   * - Supports backup before merge
   * 
   * @param spreadsheetId - The Google Spreadsheet ID
   * @param furnitureService - FurnitureService instance for export
   * @param options - { dryRun?: boolean, backup?: boolean }
   * @returns Push result with counts (added/updated per sheet)
   */
  async syncFurniturePush(
    spreadsheetId: string,
    furnitureService: { exportToCSV: () => Promise<{ duAn: string; layouts: string; apartmentTypes: string }> },
    options: { dryRun?: boolean; backup?: boolean } = {}
  ): Promise<{
    success: boolean;
    dryRun?: boolean;
    backupCreated?: boolean;
    counts?: {
      duAn: { added: number; updated: number; unchanged: number };
      layouts: { added: number; updated: number; unchanged: number };
      apartmentTypes: { added: number; updated: number; unchanged: number };
    };
    details?: {
      duAn: { toAdd: string[]; toUpdate: string[]; existingOnly: string[] };
      layouts: { toAdd: string[]; toUpdate: string[]; existingOnly: string[] };
      apartmentTypes: { toAdd: string[]; toUpdate: string[]; existingOnly: string[] };
    };
    error?: string;
  }> {
    const { dryRun = false, backup = false } = options;

    try {
      // Create backup if requested (and not dry-run)
      let backupCreated = false;
      if (backup && !dryRun) {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const backupResults = await Promise.all([
          this.copySheet(spreadsheetId, 'DuAn', `DuAn_backup_${timestamp}`),
          this.copySheet(spreadsheetId, 'Layout', `Layout_backup_${timestamp}`),
          this.copySheet(spreadsheetId, 'ApartmentType', `ApartmentType_backup_${timestamp}`),
        ]);
        backupCreated = backupResults.every(r => r.success);
        
        if (!backupCreated) {
          logger.warn('Some backups failed', { backupResults });
        } else {
          logger.info('Backups created successfully', { timestamp });
        }
      }

      // Export data from furniture service
      const csvData = await furnitureService.exportToCSV();

      // Convert CSV strings to sheet data
      const duAnSheetData = this.csvToSheetData(csvData.duAn);
      const layoutSheetData = this.csvToSheetData(csvData.layouts);
      const apartmentTypeSheetData = this.csvToSheetData(csvData.apartmentTypes);

      // Merge to 3 tabs using unique keys:
      // - DuAn: MaToaNha (column index 4)
      // - Layout: LayoutAxis (column index 0)
      // - ApartmentType: composite key MaToaNha + ApartmentType (columns 0 and 1)
      const duAnResult = await this.mergeSheetWithOptions(
        spreadsheetId, 'DuAn', duAnSheetData, 4, undefined, { dryRun }
      );
      const layoutResult = await this.mergeSheetWithOptions(
        spreadsheetId, 'Layout', layoutSheetData, 0, undefined, { dryRun }
      );
      const apartmentTypeResult = await this.mergeSheetWithOptions(
        spreadsheetId, 'ApartmentType', apartmentTypeSheetData, 0, [0, 1], { dryRun }
      );

      // Update last sync time (only if not dry-run)
      if (!dryRun) {
        await prisma.integration.update({
          where: { type: 'google_sheets' },
          data: { lastSyncAt: new Date(), errorCount: 0, lastError: null },
        });
      }

      return {
        success: true,
        dryRun,
        backupCreated,
        counts: {
          duAn: { added: duAnResult.added, updated: duAnResult.updated, unchanged: duAnResult.unchanged },
          layouts: { added: layoutResult.added, updated: layoutResult.updated, unchanged: layoutResult.unchanged },
          apartmentTypes: { added: apartmentTypeResult.added, updated: apartmentTypeResult.updated, unchanged: apartmentTypeResult.unchanged },
        },
        details: {
          duAn: duAnResult.details,
          layouts: layoutResult.details,
          apartmentTypes: apartmentTypeResult.details,
        },
      };
    } catch (error) {
      console.error('Furniture sync push error:', error);

      // Update error count (only if not dry-run)
      if (!dryRun) {
        await prisma.integration.update({
          where: { type: 'google_sheets' },
          data: {
            errorCount: { increment: 1 },
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
        }).catch(() => {
          // Ignore update errors
        });
      }

      return {
        success: false,
        dryRun,
        error: error instanceof Error ? error.message : 'Failed to sync to Google Sheets',
      };
    }
  }

  /**
   * Convert sheet data (2D array) to CSV string
   */
  private sheetDataToCSV(data: (string | number | null)[][] | null): string {
    if (!data || data.length === 0) {
      return '';
    }

    return data
      .map((row) =>
        row
          .map((cell) => {
            const value = cell === null ? '' : String(cell);
            // Quote values containing commas, quotes, or newlines
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      )
      .join('\n');
  }

  /**
   * Convert CSV string to sheet data (2D array)
   */
  private csvToSheetData(csv: string): (string | number | null)[][] {
    if (!csv || csv.trim().length === 0) {
      return [];
    }

    const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
    return lines.map((line) => this.parseCSVLineForSheet(line));
  }

  /**
   * Parse a single CSV line for sheet data
   */
  private parseCSVLineForSheet(line: string): (string | number | null)[] {
    const result: (string | number | null)[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else if (char === '"') {
          // End of quoted value
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          // Start of quoted value
          inQuotes = true;
        } else if (char === ',') {
          // End of field
          result.push(this.parseSheetValue(current));
          current = '';
        } else {
          current += char;
        }
      }
    }

    // Add last field
    result.push(this.parseSheetValue(current));

    return result;
  }

  /**
   * Parse a value for sheet data (convert to number if possible)
   */
  private parseSheetValue(value: string): string | number | null {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    // Try to parse as number
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') {
      return num;
    }
    return trimmed;
  }

  // ============================================
  // FURNITURE CATALOG SYNC METHODS
  // ============================================

  /**
   * Sync furniture catalog from Google Sheets (Pull)
   * Reads 5 tabs: Categories, Materials, ProductBases, Variants, Fees
   */
  async syncCatalogPull(
    spreadsheetId: string,
    furnitureService: {
      importCatalogFromCSV: (files: {
        categories?: string;
        materials?: string;
        productBases?: string;
        variants?: string;
        fees?: string;
      }) => Promise<{
        categories: { created: number; updated: number };
        materials: { created: number; updated: number };
        productBases: { created: number; updated: number };
        variants: { created: number; updated: number };
        fees: { created: number; updated: number };
      }>;
    }
  ): Promise<{
    success: boolean;
    counts?: {
      categories: { created: number; updated: number };
      materials: { created: number; updated: number };
      productBases: { created: number; updated: number };
      variants: { created: number; updated: number };
      fees: { created: number; updated: number };
    };
    error?: string;
  }> {
    try {
      // Read data from 5 tabs
      const categoriesData = await this.readSheet(spreadsheetId, 'Categories').catch(() => null);
      const materialsData = await this.readSheet(spreadsheetId, 'Materials').catch(() => null);
      const productBasesData = await this.readSheet(spreadsheetId, 'ProductBases').catch(() => null);
      const variantsData = await this.readSheet(spreadsheetId, 'Variants').catch(() => null);
      const feesData = await this.readSheet(spreadsheetId, 'Fees').catch(() => null);

      // Convert sheet data to CSV strings
      const counts = await furnitureService.importCatalogFromCSV({
        categories: categoriesData ? this.sheetDataToCSV(categoriesData) : undefined,
        materials: materialsData ? this.sheetDataToCSV(materialsData) : undefined,
        productBases: productBasesData ? this.sheetDataToCSV(productBasesData) : undefined,
        variants: variantsData ? this.sheetDataToCSV(variantsData) : undefined,
        fees: feesData ? this.sheetDataToCSV(feesData) : undefined,
      });

      // Update last sync time
      await prisma.integration.update({
        where: { type: 'google_sheets' },
        data: { lastSyncAt: new Date(), errorCount: 0, lastError: null },
      });

      return { success: true, counts };
    } catch (error) {
      console.error('Catalog sync pull error:', error);

      await prisma.integration.update({
        where: { type: 'google_sheets' },
        data: {
          errorCount: { increment: 1 },
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(() => { /* ignore update errors */ });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync catalog from Google Sheets',
      };
    }
  }

  /**
   * Sync furniture catalog to Google Sheets (Push)
   * Merges data into 5 tabs: Categories, Materials, ProductBases, Variants, Fees
   */
  async syncCatalogPush(
    spreadsheetId: string,
    furnitureService: {
      exportCatalogToCSV: () => Promise<{
        categories: string;
        materials: string;
        productBases: string;
        variants: string;
        fees: string;
      }>;
    },
    options: { dryRun?: boolean; backup?: boolean } = {}
  ): Promise<{
    success: boolean;
    dryRun?: boolean;
    backupCreated?: boolean;
    counts?: {
      categories: { added: number; updated: number; unchanged: number };
      materials: { added: number; updated: number; unchanged: number };
      productBases: { added: number; updated: number; unchanged: number };
      variants: { added: number; updated: number; unchanged: number };
      fees: { added: number; updated: number; unchanged: number };
    };
    error?: string;
  }> {
    const { dryRun = false, backup = false } = options;

    try {
      // Create backup if requested
      let backupCreated = false;
      if (backup && !dryRun) {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const backupResults = await Promise.all([
          this.copySheet(spreadsheetId, 'Categories', `Categories_backup_${timestamp}`).catch(() => ({ success: false, message: 'Sheet not found' })),
          this.copySheet(spreadsheetId, 'Materials', `Materials_backup_${timestamp}`).catch(() => ({ success: false, message: 'Sheet not found' })),
          this.copySheet(spreadsheetId, 'ProductBases', `ProductBases_backup_${timestamp}`).catch(() => ({ success: false, message: 'Sheet not found' })),
          this.copySheet(spreadsheetId, 'Variants', `Variants_backup_${timestamp}`).catch(() => ({ success: false, message: 'Sheet not found' })),
          this.copySheet(spreadsheetId, 'Fees', `Fees_backup_${timestamp}`).catch(() => ({ success: false, message: 'Sheet not found' })),
        ]);
        backupCreated = backupResults.some(r => r.success);
        logger.info('Catalog backups', { backupResults: backupResults.map(r => r.success) });
      }

      // Export data from furniture service
      const csvData = await furnitureService.exportCatalogToCSV();

      // Convert CSV strings to sheet data
      const categoriesSheetData = this.csvToSheetData(csvData.categories);
      const materialsSheetData = this.csvToSheetData(csvData.materials);
      const productBasesSheetData = this.csvToSheetData(csvData.productBases);
      const variantsSheetData = this.csvToSheetData(csvData.variants);
      const feesSheetData = this.csvToSheetData(csvData.fees);

      // Merge to 5 tabs using unique keys:
      // - Categories: name (column 1)
      // - Materials: name (column 1)
      // - ProductBases: id (column 0)
      // - Variants: id (column 0)
      // - Fees: code (column 2)
      const categoriesResult = await this.mergeSheetWithOptions(
        spreadsheetId, 'Categories', categoriesSheetData, 1, undefined, { dryRun }
      ).catch(() => ({ added: 0, updated: 0, unchanged: 0, details: { toAdd: [], toUpdate: [], existingOnly: [] } }));
      
      const materialsResult = await this.mergeSheetWithOptions(
        spreadsheetId, 'Materials', materialsSheetData, 1, undefined, { dryRun }
      ).catch(() => ({ added: 0, updated: 0, unchanged: 0, details: { toAdd: [], toUpdate: [], existingOnly: [] } }));
      
      const productBasesResult = await this.mergeSheetWithOptions(
        spreadsheetId, 'ProductBases', productBasesSheetData, 0, undefined, { dryRun }
      ).catch(() => ({ added: 0, updated: 0, unchanged: 0, details: { toAdd: [], toUpdate: [], existingOnly: [] } }));
      
      const variantsResult = await this.mergeSheetWithOptions(
        spreadsheetId, 'Variants', variantsSheetData, 0, undefined, { dryRun }
      ).catch(() => ({ added: 0, updated: 0, unchanged: 0, details: { toAdd: [], toUpdate: [], existingOnly: [] } }));
      
      const feesResult = await this.mergeSheetWithOptions(
        spreadsheetId, 'Fees', feesSheetData, 2, undefined, { dryRun }
      ).catch(() => ({ added: 0, updated: 0, unchanged: 0, details: { toAdd: [], toUpdate: [], existingOnly: [] } }));

      // Update last sync time
      if (!dryRun) {
        await prisma.integration.update({
          where: { type: 'google_sheets' },
          data: { lastSyncAt: new Date(), errorCount: 0, lastError: null },
        });
      }

      return {
        success: true,
        dryRun,
        backupCreated,
        counts: {
          categories: { added: categoriesResult.added, updated: categoriesResult.updated, unchanged: categoriesResult.unchanged },
          materials: { added: materialsResult.added, updated: materialsResult.updated, unchanged: materialsResult.unchanged },
          productBases: { added: productBasesResult.added, updated: productBasesResult.updated, unchanged: productBasesResult.unchanged },
          variants: { added: variantsResult.added, updated: variantsResult.updated, unchanged: variantsResult.unchanged },
          fees: { added: feesResult.added, updated: feesResult.updated, unchanged: feesResult.unchanged },
        },
      };
    } catch (error) {
      console.error('Catalog sync push error:', error);

      if (!dryRun) {
        await prisma.integration.update({
          where: { type: 'google_sheets' },
          data: {
            errorCount: { increment: 1 },
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
        }).catch(() => { /* ignore update errors */ });
      }

      return {
        success: false,
        dryRun,
        error: error instanceof Error ? error.message : 'Failed to sync catalog to Google Sheets',
      };
    }
  }
}

// Singleton instance
export const googleSheetsService = new GoogleSheetsService();
