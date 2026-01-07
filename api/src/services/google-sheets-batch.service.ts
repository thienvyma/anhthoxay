/**
 * Google Sheets Batch Service
 *
 * Provides batch operations for Google Sheets sync to optimize API quota usage.
 * Implements batch splitting, retry logic with exponential backoff, and progress logging.
 *
 * **Feature: production-scalability**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**
 */

import { google, sheets_v4 } from 'googleapis';
import { logger } from '../utils/logger';
import { withLock, LockKeys, isDistributedLockAvailable } from '../utils/distributed-lock';
import {
  createGoogleSheetsBreaker,
  getCircuitState,
  CIRCUIT_BREAKER_NAMES,
} from '../utils/circuit-breaker';
import type CircuitBreaker from 'opossum';

// ============================================
// CONSTANTS
// ============================================

/**
 * Maximum rows per batch
 * _Requirements: 14.1, 14.4_
 */
export const BATCH_SIZE = 100;

/**
 * Maximum retry attempts for batch operations
 * _Requirements: 14.3_
 */
export const MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff (ms)
 */
const BASE_DELAY = 1000;

/**
 * Lock timeout for batch operations (ms)
 */
const LOCK_TIMEOUT = 60000;

// ============================================
// TYPES
// ============================================

export interface BatchSyncResult {
  success: boolean;
  totalRows: number;
  batchesProcessed: number;
  failedBatches: number;
  errors?: string[];
}

export interface BatchAppendOptions {
  spreadsheetId: string;
  sheetName: string;
  range?: string;
  valueInputOption?: 'RAW' | 'USER_ENTERED';
}

// ============================================
// GOOGLE SHEETS BATCH SERVICE
// ============================================

export class GoogleSheetsBatchService {
  private sheets: sheets_v4.Sheets;
  private circuitBreaker: CircuitBreaker<[() => Promise<void>], void> | null = null;

  constructor(auth: ReturnType<typeof google.auth.OAuth2.prototype.setCredentials> | unknown) {
    this.sheets = google.sheets({ version: 'v4', auth: auth as sheets_v4.Options['auth'] });
  }

  /**
   * Get or create circuit breaker for Google Sheets operations
   */
  private getCircuitBreaker(): CircuitBreaker<[() => Promise<void>], void> {
    if (!this.circuitBreaker) {
      this.circuitBreaker = createGoogleSheetsBreaker(
        async (fn: () => Promise<void>) => {
          await fn();
        },
        CIRCUIT_BREAKER_NAMES.GOOGLE_SHEETS_BATCH
      ) as CircuitBreaker<[() => Promise<void>], void>;
    }
    return this.circuitBreaker;
  }

  /**
   * Split rows into batches of specified size
   * _Requirements: 14.1, 14.4_
   *
   * @param rows - Array of rows to split
   * @param batchSize - Maximum rows per batch (default: 100)
   * @returns Array of batches
   */
  splitIntoBatches<T>(rows: T[], batchSize: number = BATCH_SIZE): T[][] {
    if (rows.length === 0) {
      return [];
    }

    const batches: T[][] = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      batches.push(rows.slice(i, i + batchSize));
    }

    logger.debug('Split rows into batches', {
      totalRows: rows.length,
      batchSize,
      totalBatches: batches.length,
    });

    return batches;
  }

  /**
   * Append rows to Google Sheets using batch operations
   * _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
   *
   * @param options - Batch append options
   * @param rows - Array of rows to append
   * @returns Batch sync result
   */
  async batchAppend(
    options: BatchAppendOptions,
    rows: unknown[][]
  ): Promise<BatchSyncResult> {
    const { spreadsheetId, sheetName, range, valueInputOption = 'RAW' } = options;
    const totalRows = rows.length;

    if (totalRows === 0) {
      return {
        success: true,
        totalRows: 0,
        batchesProcessed: 0,
        failedBatches: 0,
      };
    }

    const batches = this.splitIntoBatches(rows, BATCH_SIZE);
    const fullRange = range ? `${sheetName}!${range}` : `${sheetName}!A:Z`;

    logger.info('Starting batch append operation', {
      spreadsheetId,
      sheetName,
      totalRows,
      totalBatches: batches.length,
      batchSize: BATCH_SIZE,
    });

    // Check if we should use distributed lock
    const useLock = isDistributedLockAvailable();

    if (useLock) {
      return this.executeBatchAppendWithLock(
        spreadsheetId,
        fullRange,
        batches,
        valueInputOption,
        totalRows
      );
    } else {
      logger.warn('Redis unavailable, executing batch append without lock', {
        spreadsheetId,
      });
      return this.executeBatchAppend(
        spreadsheetId,
        fullRange,
        batches,
        valueInputOption,
        totalRows
      );
    }
  }

  /**
   * Execute batch append with distributed lock
   */
  private async executeBatchAppendWithLock(
    spreadsheetId: string,
    range: string,
    batches: unknown[][][],
    valueInputOption: 'RAW' | 'USER_ENTERED',
    totalRows: number
  ): Promise<BatchSyncResult> {
    try {
      return await withLock(
        LockKeys.googleSheetsSync(spreadsheetId),
        LOCK_TIMEOUT,
        async () => {
          return this.executeBatchAppend(
            spreadsheetId,
            range,
            batches,
            valueInputOption,
            totalRows
          );
        }
      );
    } catch (error) {
      // If lock acquisition fails, try without lock
      if (error instanceof Error && error.message.includes('lock')) {
        logger.warn('Failed to acquire lock, executing without lock', {
          spreadsheetId,
          error: error.message,
        });
        return this.executeBatchAppend(
          spreadsheetId,
          range,
          batches,
          valueInputOption,
          totalRows
        );
      }
      throw error;
    }
  }

  /**
   * Execute batch append operation
   * _Requirements: 14.2, 14.5_
   */
  private async executeBatchAppend(
    spreadsheetId: string,
    range: string,
    batches: unknown[][][],
    valueInputOption: 'RAW' | 'USER_ENTERED',
    totalRows: number
  ): Promise<BatchSyncResult> {
    let batchesProcessed = 0;
    let failedBatches = 0;
    const errors: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;

      // Log batch progress
      // _Requirements: 14.5_
      logger.info('Processing batch', {
        batchNumber,
        totalBatches: batches.length,
        batchSize: batch.length,
        progress: `${batchNumber}/${batches.length}`,
      });

      const success = await this.appendBatchWithRetry(
        spreadsheetId,
        range,
        batch,
        valueInputOption,
        batchNumber,
        batches.length
      );

      if (success) {
        batchesProcessed++;
        logger.info('Batch completed successfully', {
          batchNumber,
          totalBatches: batches.length,
          batchesProcessed,
        });
      } else {
        failedBatches++;
        errors.push(`Batch ${batchNumber} failed after ${MAX_RETRIES} retries`);
        logger.error('Batch failed after all retries', {
          batchNumber,
          totalBatches: batches.length,
          failedBatches,
        });
      }
    }

    const result: BatchSyncResult = {
      success: failedBatches === 0,
      totalRows,
      batchesProcessed,
      failedBatches,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    logger.info('Batch append operation completed', {
      spreadsheetId,
      ...result,
    });

    return result;
  }

  /**
   * Append a single batch with retry logic
   * _Requirements: 14.3_
   *
   * @param spreadsheetId - Google Spreadsheet ID
   * @param range - Sheet range
   * @param rows - Rows to append
   * @param valueInputOption - How to interpret input values
   * @param batchNumber - Current batch number (for logging)
   * @param totalBatches - Total number of batches (for logging)
   * @returns true if successful, false otherwise
   */
  private async appendBatchWithRetry(
    spreadsheetId: string,
    range: string,
    rows: unknown[][],
    valueInputOption: 'RAW' | 'USER_ENTERED',
    batchNumber: number,
    totalBatches: number
  ): Promise<boolean> {
    let lastError: Error | null = null;
    const breaker = this.getCircuitBreaker();

    // Check circuit state
    const circuitState = getCircuitState(breaker);
    if (circuitState === 'OPEN') {
      logger.warn('Circuit breaker is OPEN, batch will likely fail', {
        batchNumber,
        totalBatches,
        circuitState,
      });
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await breaker.fire(async () => {
          await this.sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption,
            requestBody: { values: rows },
          });
        });

        logger.debug('Batch append successful', {
          batchNumber,
          totalBatches,
          attempt,
          rowCount: rows.length,
        });

        return true;
      } catch (error) {
        lastError = error as Error;

        logger.warn('Batch append attempt failed', {
          batchNumber,
          totalBatches,
          attempt,
          maxRetries: MAX_RETRIES,
          error: lastError.message,
        });

        // Don't retry if circuit is open
        if (getCircuitState(breaker) === 'OPEN') {
          logger.error('Circuit breaker opened, stopping retries', {
            batchNumber,
            totalBatches,
          });
          break;
        }

        // Exponential backoff before retry
        // _Requirements: 14.3_
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt - 1);
          logger.debug('Waiting before retry', {
            batchNumber,
            attempt,
            delayMs: delay,
          });
          await this.sleep(delay);
        }
      }
    }

    logger.error('Batch append failed after all retries', {
      batchNumber,
      totalBatches,
      maxRetries: MAX_RETRIES,
      error: lastError?.message,
    });

    return false;
  }

  /**
   * Use batchUpdate API for more efficient operations
   * _Requirements: 14.2_
   *
   * @param spreadsheetId - Google Spreadsheet ID
   * @param requests - Array of update requests
   * @returns true if successful, false otherwise
   */
  async batchUpdate(
    spreadsheetId: string,
    requests: sheets_v4.Schema$Request[]
  ): Promise<boolean> {
    if (requests.length === 0) {
      return true;
    }

    const breaker = this.getCircuitBreaker();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await breaker.fire(async () => {
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests },
          });
        });

        logger.info('Batch update successful', {
          spreadsheetId,
          requestCount: requests.length,
          attempt,
        });

        return true;
      } catch (error) {
        lastError = error as Error;

        logger.warn('Batch update attempt failed', {
          spreadsheetId,
          attempt,
          maxRetries: MAX_RETRIES,
          error: lastError.message,
        });

        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    logger.error('Batch update failed after all retries', {
      spreadsheetId,
      maxRetries: MAX_RETRIES,
      error: lastError?.message,
    });

    return false;
  }

  /**
   * Sleep utility for exponential backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a GoogleSheetsBatchService instance with OAuth2 client
 *
 * @param oauth2Client - Configured OAuth2 client
 * @returns GoogleSheetsBatchService instance
 */
export function createGoogleSheetsBatchService(
  oauth2Client: ReturnType<typeof google.auth.OAuth2.prototype.setCredentials> | unknown
): GoogleSheetsBatchService {
  return new GoogleSheetsBatchService(oauth2Client);
}
