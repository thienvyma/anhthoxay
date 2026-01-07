/**
 * Queue System Configuration with BullMQ
 *
 * Provides queue infrastructure for asynchronous task processing
 * including email, sync, and notification jobs.
 *
 * **Feature: production-scalability**
 * **Validates: Requirements 1.1, 1.2, 1.6**
 */

import { Queue, QueueOptions, JobsOptions } from 'bullmq';
import { isRedisConnected } from '../config/redis';
import { logger } from '../utils/logger';
import { queueHealthService } from '../services/queue-health.service';

// ============================================
// REDIS CONNECTION FOR BULLMQ
// ============================================

/**
 * Get Redis connection options for BullMQ
 * BullMQ requires its own connection configuration
 */
function getRedisConnectionOptions(): { host: string; port: number; password?: string; maxRetriesPerRequest: null } | null {
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
      maxRetriesPerRequest: null, // Required for BullMQ
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
    content: string; // Base64 encoded
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
// QUEUE CONFIGURATION
// ============================================

/**
 * Default job options with retry and backoff configuration
 * Requirements: 1.2 - Retry up to 3 times with exponential backoff
 */
export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // Start with 1 second
  },
  removeOnComplete: {
    count: 100, // Keep last 100 completed jobs
    age: 3600, // Remove completed jobs older than 1 hour
  },
  removeOnFail: {
    count: 1000, // Keep last 1000 failed jobs for debugging
    age: 86400, // Remove failed jobs older than 24 hours
  },
};

/**
 * Get queue options with Redis connection
 */
function getQueueOptions(): QueueOptions | null {
  const connection = getRedisConnectionOptions();
  
  if (!connection) {
    logger.warn('Redis not available, queue system disabled');
    return null;
  }

  return {
    connection,
    defaultJobOptions,
  };
}

// ============================================
// QUEUE INSTANCES
// ============================================

let emailQueue: Queue<EmailJob> | null = null;
let syncQueue: Queue<SyncJob> | null = null;
let notificationQueue: Queue<NotificationJob> | null = null;

/**
 * Initialize all queues
 * Should be called during application startup
 */
export function initializeQueues(): boolean {
  const options = getQueueOptions();
  
  if (!options) {
    logger.warn('Queue system not initialized - Redis unavailable');
    return false;
  }

  try {
    emailQueue = new Queue<EmailJob>('email', options);
    syncQueue = new Queue<SyncJob>('sync', options);
    notificationQueue = new Queue<NotificationJob>('notification', options);

    // Register queues with health service for monitoring
    // **Feature: production-scalability**
    // **Requirements: 13.1, 13.3**
    queueHealthService.registerQueue('email', emailQueue);
    queueHealthService.registerQueue('sync', syncQueue);
    queueHealthService.registerQueue('notification', notificationQueue);

    logger.info('Queue system initialized successfully', {
      queues: ['email', 'sync', 'notification'],
    });

    return true;
  } catch (error) {
    logger.error('Failed to initialize queue system', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Get email queue instance
 */
export function getEmailQueue(): Queue<EmailJob> | null {
  return emailQueue;
}

/**
 * Get sync queue instance
 */
export function getSyncQueue(): Queue<SyncJob> | null {
  return syncQueue;
}

/**
 * Get notification queue instance
 */
export function getNotificationQueue(): Queue<NotificationJob> | null {
  return notificationQueue;
}

// ============================================
// QUEUE HELPERS
// ============================================

/**
 * Check if queue system is available
 * Requirements: 1.6 - Check Redis availability
 */
export function isQueueSystemAvailable(): boolean {
  return isRedisConnected() && emailQueue !== null;
}

/**
 * Add email job to queue with fallback
 * Requirements: 1.1 - Queue email job and return immediately
 * Requirements: 1.6 - Fall back to synchronous processing if Redis unavailable
 *
 * @param job - Email job data
 * @param fallbackFn - Optional synchronous fallback function
 * @returns Job ID if queued, null if fallback was used
 */
export async function addEmailJob(
  job: EmailJob,
  fallbackFn?: (job: EmailJob) => Promise<void>
): Promise<string | null> {
  if (!emailQueue || !isRedisConnected()) {
    logger.warn('Email queue unavailable, using fallback', {
      correlationId: job.correlationId,
    });

    if (fallbackFn) {
      await fallbackFn(job);
    }
    return null;
  }

  try {
    const queuedJob = await emailQueue.add(job.type, job, {
      jobId: `email-${job.correlationId}-${Date.now()}`,
    });

    logger.info('Email job queued', {
      jobId: queuedJob.id,
      type: job.type,
      to: job.to,
      correlationId: job.correlationId,
    });

    return queuedJob.id ?? null;
  } catch (error) {
    logger.error('Failed to queue email job', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: job.correlationId,
    });

    if (fallbackFn) {
      await fallbackFn(job);
    }
    return null;
  }
}

/**
 * Add sync job to queue with fallback
 * Requirements: 1.3 - Process sync through queue
 * Requirements: 1.6 - Fall back to synchronous processing if Redis unavailable
 *
 * @param job - Sync job data
 * @param fallbackFn - Optional synchronous fallback function
 * @returns Job ID if queued, null if fallback was used
 */
export async function addSyncJob(
  job: SyncJob,
  fallbackFn?: (job: SyncJob) => Promise<void>
): Promise<string | null> {
  if (!syncQueue || !isRedisConnected()) {
    logger.warn('Sync queue unavailable, using fallback', {
      correlationId: job.correlationId,
    });

    if (fallbackFn) {
      await fallbackFn(job);
    }
    return null;
  }

  try {
    const queuedJob = await syncQueue.add(job.type, job, {
      jobId: `sync-${job.correlationId}-${Date.now()}`,
    });

    logger.info('Sync job queued', {
      jobId: queuedJob.id,
      type: job.type,
      correlationId: job.correlationId,
    });

    return queuedJob.id ?? null;
  } catch (error) {
    logger.error('Failed to queue sync job', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: job.correlationId,
    });

    if (fallbackFn) {
      await fallbackFn(job);
    }
    return null;
  }
}

/**
 * Add notification job to queue with fallback
 * Requirements: 1.4 - Queue notification delivery job
 * Requirements: 1.6 - Fall back to synchronous processing if Redis unavailable
 *
 * @param job - Notification job data
 * @param fallbackFn - Optional synchronous fallback function
 * @returns Job ID if queued, null if fallback was used
 */
export async function addNotificationJob(
  job: NotificationJob,
  fallbackFn?: (job: NotificationJob) => Promise<void>
): Promise<string | null> {
  if (!notificationQueue || !isRedisConnected()) {
    logger.warn('Notification queue unavailable, using fallback', {
      correlationId: job.correlationId,
    });

    if (fallbackFn) {
      await fallbackFn(job);
    }
    return null;
  }

  try {
    const queuedJob = await notificationQueue.add(job.type, job, {
      jobId: `notification-${job.correlationId}-${Date.now()}`,
    });

    logger.info('Notification job queued', {
      jobId: queuedJob.id,
      type: job.type,
      userId: job.userId,
      correlationId: job.correlationId,
    });

    return queuedJob.id ?? null;
  } catch (error) {
    logger.error('Failed to queue notification job', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: job.correlationId,
    });

    if (fallbackFn) {
      await fallbackFn(job);
    }
    return null;
  }
}

// ============================================
// CLEANUP
// ============================================

/**
 * Close all queue connections gracefully
 */
export async function closeQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (emailQueue) {
    closePromises.push(emailQueue.close());
  }
  if (syncQueue) {
    closePromises.push(syncQueue.close());
  }
  if (notificationQueue) {
    closePromises.push(notificationQueue.close());
  }

  await Promise.all(closePromises);
  
  emailQueue = null;
  syncQueue = null;
  notificationQueue = null;

  logger.info('Queue system closed gracefully');
}
