/**
 * Notification Queue Worker
 *
 * Processes notification jobs for multi-channel delivery
 * (in-app, email, SMS) with retry logic and correlation ID tracking.
 *
 * **Feature: production-scalability**
 * **Validates: Requirements 1.4, 12.6, 13.6**
 */

import { Worker, Job } from 'bullmq';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../../services/prometheus.service';
import { queueHealthService } from '../../services/queue-health.service';
import { defaultJobOptions, type NotificationJob } from '../index';

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
// NOTIFICATION PROCESSING FUNCTIONS
// ============================================

/**
 * Process in-app notification
 */
async function processInAppNotification(job: Job<NotificationJob>): Promise<void> {
  const { userId, type, title, data, correlationId } = job.data;
  
  logger.info('Processing in-app notification', {
    jobId: job.id,
    userId,
    type,
    correlationId,
  });

  // TODO: Integrate with NotificationService to create in-app notification
  logger.info('Would create in-app notification', {
    jobId: job.id,
    userId,
    type,
    title,
    hasData: !!data,
    correlationId,
  });
}

/**
 * Process email notification
 */
async function processEmailNotification(job: Job<NotificationJob>): Promise<void> {
  const { userId, type, title, data, correlationId } = job.data;
  
  logger.info('Processing email notification', {
    jobId: job.id,
    userId,
    type,
    correlationId,
  });

  // TODO: Integrate with NotificationChannelService for email delivery
  logger.info('Would send email notification', {
    jobId: job.id,
    userId,
    type,
    title,
    hasData: !!data,
    correlationId,
  });
}

/**
 * Process SMS notification
 */
async function processSMSNotification(job: Job<NotificationJob>): Promise<void> {
  const { userId, type, title, content, correlationId } = job.data;
  
  logger.info('Processing SMS notification', {
    jobId: job.id,
    userId,
    type,
    correlationId,
  });

  // TODO: Integrate with NotificationChannelService for SMS delivery
  logger.info('Would send SMS notification', {
    jobId: job.id,
    userId,
    type,
    title,
    contentLength: content.length,
    correlationId,
  });
}

// ============================================
// WORKER INSTANCE
// ============================================

let notificationWorker: Worker<NotificationJob> | null = null;

/**
 * Notification job processor
 * Requirements: 1.4 - Queue notification delivery job
 */
async function processNotificationJob(job: Job<NotificationJob>): Promise<void> {
  const { type, channels, correlationId } = job.data;
  
  logger.info('Notification job started', {
    jobId: job.id,
    type,
    channels,
    correlationId,
    attempt: job.attemptsMade + 1,
  });

  try {
    // Process each channel
    const results: { channel: string; success: boolean; error?: string }[] = [];

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'in-app':
            await processInAppNotification(job);
            results.push({ channel, success: true });
            break;
          case 'email':
            await processEmailNotification(job);
            results.push({ channel, success: true });
            break;
          case 'sms':
            await processSMSNotification(job);
            results.push({ channel, success: true });
            break;
          default:
            logger.warn('Unknown notification channel', { 
              jobId: job.id, 
              channel, 
              correlationId 
            });
            results.push({ channel, success: false, error: 'Unknown channel' });
        }
      } catch (channelError) {
        const errorMessage = channelError instanceof Error ? channelError.message : 'Unknown error';
        logger.error('Channel delivery failed', {
          jobId: job.id,
          channel,
          correlationId,
          error: errorMessage,
        });
        results.push({ channel, success: false, error: errorMessage });
      }
    }

    // Check if at least one channel succeeded
    const successCount = results.filter(r => r.success).length;
    
    if (successCount === 0) {
      throw new Error('All notification channels failed');
    }

    logger.info('Notification job completed', {
      jobId: job.id,
      type,
      correlationId,
      channelResults: results,
      successCount,
      totalChannels: channels.length,
    });
  } catch (error) {
    logger.error('Notification job failed', {
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
 * Initialize notification worker
 */
export function initializeNotificationWorker(): Worker<NotificationJob> | null {
  const connection = getWorkerConnectionOptions();
  
  if (!connection) {
    logger.warn('Notification worker not initialized - Redis unavailable');
    return null;
  }

  try {
    notificationWorker = new Worker<NotificationJob>(
      'notification',
      processNotificationJob,
      {
        connection,
        concurrency: 10, // Process up to 10 notifications concurrently
        limiter: {
          max: 200, // Max 200 jobs per minute
          duration: 60000,
        },
      }
    );

    // Event handlers for logging and metrics
    notificationWorker.on('completed', (job) => {
      logger.info('Notification worker: job completed', {
        jobId: job.id,
        type: job.data.type,
        userId: job.data.userId,
        correlationId: job.data.correlationId,
      });
      // Record queue job metric
      // **Feature: production-scalability**
      // **Requirements: 12.6**
      prometheusMetrics.recordQueueJob('notification', 'completed');
    });

    notificationWorker.on('failed', (job, error) => {
      logger.error('Notification worker: job failed', {
        jobId: job?.id,
        type: job?.data.type,
        userId: job?.data.userId,
        correlationId: job?.data.correlationId,
        error: error.message,
        attemptsMade: job?.attemptsMade,
      });
      // Record queue job metric
      // **Feature: production-scalability**
      // **Requirements: 12.6**
      prometheusMetrics.recordQueueJob('notification', 'failed');
      
      // Move to dead letter queue after retry limit
      // **Feature: production-scalability**
      // **Requirements: 13.6**
      if (job && job.attemptsMade >= (defaultJobOptions.attempts || 3)) {
        queueHealthService.addToDeadLetterQueue('notification', job, error.message);
        logger.error('Notification job moved to dead letter queue after exhausting retries', {
          jobId: job.id,
          type: job.data.type,
          userId: job.data.userId,
          correlationId: job.data.correlationId,
          attemptsMade: job.attemptsMade,
          maxAttempts: defaultJobOptions.attempts,
        });
      }
    });

    notificationWorker.on('active', (job) => {
      // Record queue job metric when job becomes active
      // **Feature: production-scalability**
      // **Requirements: 12.6**
      prometheusMetrics.recordQueueJob('notification', 'active');
      logger.debug('Notification worker: job active', {
        jobId: job.id,
        type: job.data.type,
        userId: job.data.userId,
        correlationId: job.data.correlationId,
      });
    });

    notificationWorker.on('error', (error) => {
      logger.error('Notification worker error', { error: error.message });
    });

    logger.info('Notification worker initialized', { concurrency: 10 });
    return notificationWorker;
  } catch (error) {
    logger.error('Failed to initialize notification worker', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get notification worker instance
 */
export function getNotificationWorker(): Worker<NotificationJob> | null {
  return notificationWorker;
}

/**
 * Close notification worker gracefully
 */
export async function closeNotificationWorker(): Promise<void> {
  if (notificationWorker) {
    await notificationWorker.close();
    notificationWorker = null;
    logger.info('Notification worker closed');
  }
}
