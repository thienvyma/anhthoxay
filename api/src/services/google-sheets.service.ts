/**
 * Google Sheets Integration Service
 * Handles OAuth2 flow and lead synchronization to Google Sheets
 * 
 * **Feature: security-hardening**
 * **Validates: Requirements 1.1, 1.2**
 */

import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

const prisma = new PrismaClient();

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4202/integrations/google/callback';

// Scopes required for Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

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
          console.debug('Token revoke skipped:', revokeError);
        }
      }

      // Delete integration (ignore if not exists)
      await prisma.integration.delete({
        where: { type: 'google_sheets' },
      }).catch((deleteError) => {
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
   */
  async syncLeadToSheet(lead: LeadData): Promise<{ success: boolean; error?: string }> {
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

        return { success: true };
      } catch (error) {
        lastError = error as Error;
        console.error(`Google Sheets sync attempt ${attempt + 1} failed:`, error);

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
   * Write data to a specific sheet
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
      // Clear existing data first
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: sheetName,
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
   * Writes to 3 tabs: DuAn, Layout, ApartmentType
   * 
   * @param spreadsheetId - The Google Spreadsheet ID
   * @param furnitureService - FurnitureService instance for export
   * @returns Push result with counts
   */
  async syncFurniturePush(
    spreadsheetId: string,
    furnitureService: { exportToCSV: () => Promise<{ duAn: string; layouts: string; apartmentTypes: string }> }
  ): Promise<{
    success: boolean;
    counts?: { duAn: number; layouts: number; apartmentTypes: number };
    error?: string;
  }> {
    try {
      // Export data from furniture service
      const csvData = await furnitureService.exportToCSV();

      // Convert CSV strings to sheet data
      const duAnSheetData = this.csvToSheetData(csvData.duAn);
      const layoutSheetData = this.csvToSheetData(csvData.layouts);
      const apartmentTypeSheetData = this.csvToSheetData(csvData.apartmentTypes);

      // Write to 3 tabs
      const duAnRows = await this.writeSheet(spreadsheetId, 'DuAn', duAnSheetData);
      const layoutRows = await this.writeSheet(spreadsheetId, 'Layout', layoutSheetData);
      const apartmentTypeRows = await this.writeSheet(spreadsheetId, 'ApartmentType', apartmentTypeSheetData);

      // Update last sync time
      await prisma.integration.update({
        where: { type: 'google_sheets' },
        data: { lastSyncAt: new Date(), errorCount: 0, lastError: null },
      });

      return {
        success: true,
        counts: {
          duAn: duAnRows,
          layouts: layoutRows,
          apartmentTypes: apartmentTypeRows,
        },
      };
    } catch (error) {
      console.error('Furniture sync push error:', error);

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
}

// Singleton instance
export const googleSheetsService = new GoogleSheetsService();
