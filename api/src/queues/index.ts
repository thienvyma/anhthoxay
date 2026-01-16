/**
 * Queue System Configuration
 *
 * Provides queue infrastructure for asynchronous task processing.
 * Uses in-memory queue with synchronous fallback.
 * For production distributed queues, consider Firebase Cloud Tasks.
 */

import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface EmailJob {
  type: 'quotation' | 'notification' | 'welcome' | 'general';
  to: string;
  subject: string;
  templateId?: string;
  htmlContent?: string;
  data: Record<string, unknown>;
  correlationId: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface SyncJob {
  type: 'google-sheets' | 'lead-sync';
  spreadsheetId?: string;
  data: unknown[];
  correlationId: string;
  operation: 'append' | 'update' | 'batch';
}

export interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  channels: ('in-app' | 'email' | 'sms')[];
  correlationId: string;
}

// ============================================
// IN-MEMORY QUEUE (Simple implementation)
// ============================================

interface QueuedJob<T> {
  id: string;
  data: T;
  addedAt: number;
  attempts: number;
}

const emailJobs: QueuedJob<EmailJob>[] = [];
const syncJobs: QueuedJob<SyncJob>[] = [];
const notificationJobs: QueuedJob<NotificationJob>[] = [];

let jobCounter = 0;

function generateJobId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++jobCounter}`;
}

// ============================================
// QUEUE INITIALIZATION
// ============================================

/**
 * Initialize queues (no-op for in-memory)
 */
export function initializeQueues(): boolean {
  logger.info('In-memory queue system initialized');
  return true;
}

/**
 * Check if queue system is available
 */
export function isQueueSystemAvailable(): boolean {
  return true; // In-memory queue is always available
}

// ============================================
// QUEUE HELPERS
// ============================================

/**
 * Add email job to queue with fallback
 */
export async function addEmailJob(
  job: EmailJob,
  fallbackFn?: (job: EmailJob) => Promise<void>
): Promise<string | null> {
  const jobId = generateJobId('email');
  
  // For in-memory queue, execute fallback immediately
  if (fallbackFn) {
    try {
      await fallbackFn(job);
      logger.info('Email job processed synchronously', {
        jobId,
        type: job.type,
        to: job.to,
        correlationId: job.correlationId,
      });
    } catch (error) {
      logger.error('Failed to process email job', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: job.correlationId,
      });
    }
  } else {
    // Store in memory for later processing
    emailJobs.push({
      id: jobId,
      data: job,
      addedAt: Date.now(),
      attempts: 0,
    });
    logger.info('Email job queued (in-memory)', {
      jobId,
      type: job.type,
      to: job.to,
      correlationId: job.correlationId,
    });
  }
  
  return jobId;
}

/**
 * Add sync job to queue with fallback
 */
export async function addSyncJob(
  job: SyncJob,
  fallbackFn?: (job: SyncJob) => Promise<void>
): Promise<string | null> {
  const jobId = generateJobId('sync');
  
  if (fallbackFn) {
    try {
      await fallbackFn(job);
      logger.info('Sync job processed synchronously', {
        jobId,
        type: job.type,
        correlationId: job.correlationId,
      });
    } catch (error) {
      logger.error('Failed to process sync job', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: job.correlationId,
      });
    }
  } else {
    syncJobs.push({
      id: jobId,
      data: job,
      addedAt: Date.now(),
      attempts: 0,
    });
    logger.info('Sync job queued (in-memory)', {
      jobId,
      type: job.type,
      correlationId: job.correlationId,
    });
  }
  
  return jobId;
}

/**
 * Add notification job to queue with fallback
 */
export async function addNotificationJob(
  job: NotificationJob,
  fallbackFn?: (job: NotificationJob) => Promise<void>
): Promise<string | null> {
  const jobId = generateJobId('notification');
  
  if (fallbackFn) {
    try {
      await fallbackFn(job);
      logger.info('Notification job processed synchronously', {
        jobId,
        type: job.type,
        userId: job.userId,
        correlationId: job.correlationId,
      });
    } catch (error) {
      logger.error('Failed to process notification job', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: job.correlationId,
      });
    }
  } else {
    notificationJobs.push({
      id: jobId,
      data: job,
      addedAt: Date.now(),
      attempts: 0,
    });
    logger.info('Notification job queued (in-memory)', {
      jobId,
      type: job.type,
      userId: job.userId,
      correlationId: job.correlationId,
    });
  }
  
  return jobId;
}

// ============================================
// QUEUE GETTERS (for compatibility)
// ============================================

export function getEmailQueue(): null {
  return null;
}

export function getSyncQueue(): null {
  return null;
}

export function getNotificationQueue(): null {
  return null;
}

// ============================================
// CLEANUP
// ============================================

/**
 * Close all queue connections gracefully
 */
export async function closeQueues(): Promise<void> {
  emailJobs.length = 0;
  syncJobs.length = 0;
  notificationJobs.length = 0;
  logger.info('Queue system closed');
}

/**
 * Get pending job counts (for monitoring)
 */
export function getQueueStats(): { email: number; sync: number; notification: number } {
  return {
    email: emailJobs.length,
    sync: syncJobs.length,
    notification: notificationJobs.length,
  };
}
