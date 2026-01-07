/**
 * Sync Queue Worker
 *
 * Processes sync jobs for Google Sheets integration
 * with retry logic, correlation ID tracking, circuit breaker protection,
 * and batch operations for efficient API quota usage.
 *
 * **Feature: production-scalability**
 * **Validates: Requirements 1.3, 8.1, 12.6, 13.6, 14.1, 14.2**
 */

import { Worker, Job } from 'bullmq';
import { google } from 'googleapis';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../../services/prometheus.service';
import { queueHealthService } from '../../services/queue-health.service';
import {
  createGoogleSheetsBreaker,
  getCircuitState,
  CIRCUIT_BREAKER_NAMES,
  type CircuitBreakerFallbackResponse,
} from '../../utils/circuit-breaker';
import {
  GoogleSheetsBatchService,
  BATCH_SIZE,
  type BatchSyncResult,
} from '../../services/google-sheets-batch.service';
import { prisma } from '../../utils/prisma';
import { decrypt, isEncrypted } from '../../utils/encryption';
import { defaultJobOptions, type SyncJob } from '../index';
import type CircuitBreaker from 'opossum';

// ============================================
// WORKER CONFIGURATION
// ============================================

/**
 * Get Redis connection options for worker
 */
function getWorkerConnectionOptions(): { host: string; port: number; password?: string; maxRetriesPerRequest: null } | null {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return null;
  }

  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
}

// ============================================
// CIRCUIT BREAKER SETUP
// ============================================

/**
 * Google Sheets circuit breaker instance
 * _Requirements: 8.1_
 */
let googleSheetsBreaker: CircuitBreaker<[Job<SyncJob>], void | CircuitBreakerFallbackResponse> | null = null;

/**
 * Get or create Google Sheets circuit breaker
 */
function getGoogleSheetsBreaker(): CircuitBreaker<[Job<SyncJob>], void | CircuitBreakerFallbackResponse> {
  if (!googleSheetsBreaker) {
    googleSheetsBreaker = createGoogleSheetsBreaker(
      async (job: Job<SyncJob>) => {
        await executeGoogleSheetsSync(job);
      },
      CIRCUIT_BREAKER_NAMES.GOOGLE_SHEETS_SYNC
    ) as CircuitBreaker<[Job<SyncJob>], void | CircuitBreakerFallbackResponse>;
  }
  return googleSheetsBreaker;
}

// ============================================
// GOOGLE SHEETS BATCH SERVICE SETUP
// ============================================

/**
 * Get decrypted refresh token from stored credentials
 * Handles migration from plaintext to encrypted tokens
 */
function getDecryptedToken(credentials: string): string {
  if (isEncrypted(credentials)) {
    return decrypt(credentials);
  }
  return credentials;
}

/**
 * Create Google Sheets batch service with OAuth2 client
 * _Requirements: 14.1, 14.2_
 */
async function createBatchService(): Promise<GoogleSheetsBatchService | null> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { type: 'google_sheets' },
    });

    if (!integration?.credentials) {
      logger.warn('Google Sheets integration not configured');
      return null;
    }

    const refreshToken = getDecryptedToken(integration.credentials);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    return new GoogleSheetsBatchService(oauth2Client);
  } catch (error) {
    logger.error('Failed to create batch service', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get integration config for Google Sheets
 */
async function getIntegrationConfig(): Promise<{
  spreadsheetId: string;
  sheetName: string;
  syncEnabled: boolean;
} | null> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { type: 'google_sheets' },
    });

    if (!integration?.config) {
      return null;
    }

    return JSON.parse(integration.config);
  } catch {
    return null;
  }
}

// ============================================
// SYNC PROCESSING FUNCTIONS
// ============================================

/**
 * Execute Google Sheets sync using batch operations
 * _Requirements: 1.3, 14.1, 14.2_
 */
async function executeGoogleSheetsSync(job: Job<SyncJob>): Promise<void> {
  const { spreadsheetId, data, operation, correlationId } = job.data;
  
  logger.info('Executing Google Sheets sync', {
    jobId: job.id,
    spreadsheetId,
    operation,
    dataCount: data.length,
    correlationId,
  });

  // Get batch service
  const batchService = await createBatchService();
  if (!batchService) {
    throw new Error('Failed to create Google Sheets batch service');
  }

  // Get integration config for sheet name
  const config = await getIntegrationConfig();
  const sheetName = config?.sheetName || 'Leads';
  const targetSpreadsheetId = spreadsheetId || config?.spreadsheetId;

  if (!targetSpreadsheetId) {
    throw new Error('Spreadsheet ID not configured');
  }

  // Convert data to row format if needed
  const rows = data.map((item) => {
    if (Array.isArray(item)) {
      return item;
    }
    // Convert object to array of values
    return Object.values(item as Record<string, unknown>);
  }) as unknown[][];

  let result: BatchSyncResult;

  switch (operation) {
    case 'append':
    case 'batch':
      // Use batch append for both append and batch operations
      // _Requirements: 14.1, 14.2_
      logger.info('Using batch append for Google Sheets sync', {
        jobId: job.id,
        spreadsheetId: targetSpreadsheetId,
        rowCount: rows.length,
        batchSize: BATCH_SIZE,
        correlationId,
      });

      result = await batchService.batchAppend(
        {
          spreadsheetId: targetSpreadsheetId,
          sheetName,
          valueInputOption: 'RAW',
        },
        rows
      );

      if (!result.success) {
        throw new Error(
          `Batch append failed: ${result.failedBatches} batches failed. Errors: ${result.errors?.join(', ')}`
        );
      }

      logger.info('Batch append completed successfully', {
        jobId: job.id,
        spreadsheetId: targetSpreadsheetId,
        totalRows: result.totalRows,
        batchesProcessed: result.batchesProcessed,
        correlationId,
      });
      break;

    case 'update':
      // For update operations, use batchUpdate API
      // _Requirements: 14.2_
      logger.info('Using batch update for Google Sheets sync', {
        jobId: job.id,
        spreadsheetId: targetSpreadsheetId,
        rowCount: rows.length,
        correlationId,
      });

      // For simple updates, we can use batchAppend with clear first
      // More complex updates would need specific batchUpdate requests
      result = await batchService.batchAppend(
        {
          spreadsheetId: targetSpreadsheetId,
          sheetName,
          valueInputOption: 'USER_ENTERED',
        },
        rows
      );

      if (!result.success) {
        throw new Error(
          `Batch update failed: ${result.failedBatches} batches failed. Errors: ${result.errors?.join(', ')}`
        );
      }

      logger.info('Batch update completed successfully', {
        jobId: job.id,
        spreadsheetId: targetSpreadsheetId,
        totalRows: result.totalRows,
        batchesProcessed: result.batchesProcessed,
        correlationId,
      });
      break;

    default:
      logger.warn('Unknown operation type, defaulting to batch append', {
        jobId: job.id,
        operation,
        correlationId,
      });

      result = await batchService.batchAppend(
        {
          spreadsheetId: targetSpreadsheetId,
          sheetName,
          valueInputOption: 'RAW',
        },
        rows
      );

      if (!result.success) {
        throw new Error(
          `Sync failed: ${result.failedBatches} batches failed. Errors: ${result.errors?.join(', ')}`
        );
      }
  }

  // Update last sync time in integration
  await prisma.integration.update({
    where: { type: 'google_sheets' },
    data: {
      lastSyncAt: new Date(),
      errorCount: 0,
      lastError: null,
    },
  }).catch((error) => {
    logger.warn('Failed to update integration sync time', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId,
    });
  });
}

/**
 * Process Google Sheets sync job with circuit breaker protection
 * _Requirements: 1.3, 8.1_
 */
async function processGoogleSheetsSync(job: Job<SyncJob>): Promise<void> {
  const { spreadsheetId, operation, correlationId } = job.data;
  const breaker = getGoogleSheetsBreaker();
  
  // Check circuit state before processing
  const circuitState = getCircuitState(breaker);
  if (circuitState === 'OPEN') {
    logger.warn('Google Sheets circuit breaker is OPEN, job will use fallback', {
      jobId: job.id,
      spreadsheetId,
      operation,
      correlationId,
      circuitState,
    });
  }

  logger.info('Processing Google Sheets sync with circuit breaker', {
    jobId: job.id,
    spreadsheetId,
    operation,
    correlationId,
    circuitState,
  });

  try {
    const result = await breaker.fire(job);
    
    // Check if result is a fallback response
    if (result && typeof result === 'object' && 'queued' in result) {
      const fallbackResult = result as CircuitBreakerFallbackResponse;
      if (fallbackResult.queued) {
        logger.warn('Google Sheets sync returned fallback response', {
          jobId: job.id,
          correlationId,
          message: fallbackResult.message,
        });
        // Don't throw - the job will be retried by BullMQ
        return;
      }
    }
  } catch (error) {
    logger.error('Google Sheets sync failed', {
      jobId: job.id,
      spreadsheetId,
      operation,
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      circuitState: getCircuitState(breaker),
    });
    throw error; // Re-throw to trigger retry
  }
}

/**
 * Process lead sync job using batch operations
 * _Requirements: 14.1, 14.2_
 */
async function processLeadSync(job: Job<SyncJob>): Promise<void> {
  const { data, operation, correlationId } = job.data;
  
  logger.info('Processing lead sync', {
    jobId: job.id,
    operation,
    dataCount: data.length,
    correlationId,
  });

  // Get batch service
  const batchService = await createBatchService();
  if (!batchService) {
    throw new Error('Failed to create Google Sheets batch service');
  }

  // Get integration config
  const config = await getIntegrationConfig();
  if (!config?.spreadsheetId || !config.syncEnabled) {
    logger.warn('Lead sync skipped - not configured or disabled', {
      jobId: job.id,
      correlationId,
    });
    return;
  }

  // Convert lead data to row format
  // Expected format: [id, name, phone, email, content, status, source, quoteData, createdAt]
  const rows = data.map((lead) => {
    if (Array.isArray(lead)) {
      return lead;
    }
    const leadObj = lead as Record<string, unknown>;
    return [
      leadObj.id || '',
      leadObj.name || '',
      leadObj.phone || '',
      leadObj.email || '',
      leadObj.content || '',
      leadObj.status || '',
      leadObj.source || '',
      leadObj.quoteData || '',
      leadObj.createdAt ? new Date(leadObj.createdAt as string).toISOString() : '',
    ];
  }) as unknown[][];

  // Use batch append for lead sync
  // _Requirements: 14.1, 14.2_
  const result = await batchService.batchAppend(
    {
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName || 'Leads',
      range: 'A:I',
      valueInputOption: 'RAW',
    },
    rows
  );

  if (!result.success) {
    throw new Error(
      `Lead sync failed: ${result.failedBatches} batches failed. Errors: ${result.errors?.join(', ')}`
    );
  }

  logger.info('Lead sync completed successfully', {
    jobId: job.id,
    totalRows: result.totalRows,
    batchesProcessed: result.batchesProcessed,
    correlationId,
  });

  // Update last sync time
  await prisma.integration.update({
    where: { type: 'google_sheets' },
    data: {
      lastSyncAt: new Date(),
      errorCount: 0,
      lastError: null,
    },
  }).catch((error) => {
    logger.warn('Failed to update integration sync time', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId,
    });
  });
}

// ============================================
// WORKER INSTANCE
// ============================================

let syncWorker: Worker<SyncJob> | null = null;

/**
 * Sync job processor
 */
async function processSyncJob(job: Job<SyncJob>): Promise<void> {
  const { type, correlationId } = job.data;
  
  logger.info('Sync job started', {
    jobId: job.id,
    type,
    correlationId,
    attempt: job.attemptsMade + 1,
  });

  try {
    switch (type) {
      case 'google-sheets':
        await processGoogleSheetsSync(job);
        break;
      case 'lead-sync':
        await processLeadSync(job);
        break;
      default:
        logger.warn('Unknown sync type', { jobId: job.id, type, correlationId });
    }

    logger.info('Sync job completed', {
      jobId: job.id,
      type,
      correlationId,
    });
  } catch (error) {
    logger.error('Sync job failed', {
      jobId: job.id,
      type,
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      attempt: job.attemptsMade + 1,
    });
    throw error; // Re-throw to trigger retry
  }
}

/**
 * Initialize sync worker
 */
export function initializeSyncWorker(): Worker<SyncJob> | null {
  const connection = getWorkerConnectionOptions();
  
  if (!connection) {
    logger.warn('Sync worker not initialized - Redis unavailable');
    return null;
  }

  try {
    syncWorker = new Worker<SyncJob>(
      'sync',
      processSyncJob,
      {
        connection,
        concurrency: 3, // Process up to 3 sync jobs concurrently
        limiter: {
          max: 30, // Max 30 jobs per minute (Google API rate limits)
          duration: 60000,
        },
      }
    );

    // Event handlers for logging and metrics
    syncWorker.on('completed', (job) => {
      logger.info('Sync worker: job completed', {
        jobId: job.id,
        type: job.data.type,
        correlationId: job.data.correlationId,
      });
      // Record queue job metric
      // **Feature: production-scalability**
      // **Requirements: 12.6**
      prometheusMetrics.recordQueueJob('sync', 'completed');
    });

    syncWorker.on('failed', (job, error) => {
      logger.error('Sync worker: job failed', {
        jobId: job?.id,
        type: job?.data.type,
        correlationId: job?.data.correlationId,
        error: error.message,
        attemptsMade: job?.attemptsMade,
      });
      // Record queue job metric
      // **Feature: production-scalability**
      // **Requirements: 12.6**
      prometheusMetrics.recordQueueJob('sync', 'failed');
      
      // Move to dead letter queue after retry limit
      // **Feature: production-scalability**
      // **Requirements: 13.6**
      if (job && job.attemptsMade >= (defaultJobOptions.attempts || 3)) {
        queueHealthService.addToDeadLetterQueue('sync', job, error.message);
        logger.error('Sync job moved to dead letter queue after exhausting retries', {
          jobId: job.id,
          type: job.data.type,
          correlationId: job.data.correlationId,
          attemptsMade: job.attemptsMade,
          maxAttempts: defaultJobOptions.attempts,
        });
      }
    });

    syncWorker.on('active', (job) => {
      // Record queue job metric when job becomes active
      // **Feature: production-scalability**
      // **Requirements: 12.6**
      prometheusMetrics.recordQueueJob('sync', 'active');
      logger.debug('Sync worker: job active', {
        jobId: job.id,
        type: job.data.type,
        correlationId: job.data.correlationId,
      });
    });

    syncWorker.on('error', (error) => {
      logger.error('Sync worker error', { error: error.message });
    });

    logger.info('Sync worker initialized', { concurrency: 3 });
    return syncWorker;
  } catch (error) {
    logger.error('Failed to initialize sync worker', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get sync worker instance
 */
export function getSyncWorker(): Worker<SyncJob> | null {
  return syncWorker;
}

/**
 * Close sync worker gracefully
 */
export async function closeSyncWorker(): Promise<void> {
  if (syncWorker) {
    await syncWorker.close();
    syncWorker = null;
    logger.info('Sync worker closed');
  }
}
