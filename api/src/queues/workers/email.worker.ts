/**
 * Email Queue Worker
 *
 * Processes email jobs from the queue with retry logic
 * and correlation ID tracking.
 *
 * **Feature: production-scalability**
 * **Validates: Requirements 1.1, 1.4, 1.5, 12.6, 13.6**
 */

import { Worker, Job } from 'bullmq';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../../services/prometheus.service';
import { queueHealthService } from '../../services/queue-health.service';
import { defaultJobOptions, type EmailJob } from '../index';

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
// EMAIL PROCESSING FUNCTIONS
// ============================================

/**
 * Process quotation email
 * Requirements: 1.1 - Queue email job
 */
async function processQuotationEmail(job: Job<EmailJob>): Promise<void> {
  const { to, subject, htmlContent, data, correlationId } = job.data;
  
  logger.info('Processing quotation email', {
    jobId: job.id,
    to,
    subject,
    correlationId,
  });

  // TODO: Integrate with actual email service (Gmail API or SendGrid)
  // For now, log the email details
  logger.info('Quotation email would be sent', {
    jobId: job.id,
    to,
    subject,
    hasHtmlContent: !!htmlContent,
    dataKeys: Object.keys(data),
    correlationId,
  });
}

/**
 * Process notification email
 */
async function processNotificationEmail(job: Job<EmailJob>): Promise<void> {
  const { to, subject, templateId, data, correlationId } = job.data;
  
  logger.info('Processing notification email', {
    jobId: job.id,
    to,
    subject,
    templateId,
    correlationId,
  });

  // TODO: Integrate with notification channel service
  logger.info('Notification email would be sent', {
    jobId: job.id,
    to,
    subject,
    templateId,
    dataKeys: Object.keys(data),
    correlationId,
  });
}

/**
 * Process welcome email
 */
async function processWelcomeEmail(job: Job<EmailJob>): Promise<void> {
  const { to, data, correlationId } = job.data;
  
  logger.info('Processing welcome email', {
    jobId: job.id,
    to,
    correlationId,
  });

  // TODO: Integrate with email service
  logger.info('Welcome email would be sent', {
    jobId: job.id,
    to,
    userName: data.name,
    correlationId,
  });
}

/**
 * Process general email
 */
async function processGeneralEmail(job: Job<EmailJob>): Promise<void> {
  const { to, subject, htmlContent, correlationId } = job.data;
  
  logger.info('Processing general email', {
    jobId: job.id,
    to,
    subject,
    correlationId,
  });

  // TODO: Integrate with email service
  logger.info('General email would be sent', {
    jobId: job.id,
    to,
    subject,
    hasHtmlContent: !!htmlContent,
    correlationId,
  });
}

// ============================================
// WORKER INSTANCE
// ============================================

let emailWorker: Worker<EmailJob> | null = null;

/**
 * Email job processor
 * Requirements: 1.5 - Log job status with correlation ID
 */
async function processEmailJob(job: Job<EmailJob>): Promise<void> {
  const { type, correlationId } = job.data;
  
  logger.info('Email job started', {
    jobId: job.id,
    type,
    correlationId,
    attempt: job.attemptsMade + 1,
  });

  try {
    switch (type) {
      case 'quotation':
        await processQuotationEmail(job);
        break;
      case 'notification':
        await processNotificationEmail(job);
        break;
      case 'welcome':
        await processWelcomeEmail(job);
        break;
      case 'general':
        await processGeneralEmail(job);
        break;
      default:
        logger.warn('Unknown email type', { jobId: job.id, type, correlationId });
    }

    logger.info('Email job completed', {
      jobId: job.id,
      type,
      correlationId,
    });
  } catch (error) {
    logger.error('Email job failed', {
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
 * Initialize email worker
 * Requirements: 1.4 - Queue notification delivery job
 */
export function initializeEmailWorker(): Worker<EmailJob> | null {
  const connection = getWorkerConnectionOptions();
  
  if (!connection) {
    logger.warn('Email worker not initialized - Redis unavailable');
    return null;
  }

  try {
    emailWorker = new Worker<EmailJob>(
      'email',
      processEmailJob,
      {
        connection,
        concurrency: 5, // Process up to 5 emails concurrently
        limiter: {
          max: 100, // Max 100 jobs per minute
          duration: 60000,
        },
      }
    );

    // Event handlers for logging and metrics
    emailWorker.on('completed', (job) => {
      logger.info('Email worker: job completed', {
        jobId: job.id,
        type: job.data.type,
        correlationId: job.data.correlationId,
      });
      // Record queue job metric
      // **Feature: production-scalability**
      // **Requirements: 12.6**
      prometheusMetrics.recordQueueJob('email', 'completed');
    });

    emailWorker.on('failed', (job, error) => {
      logger.error('Email worker: job failed', {
        jobId: job?.id,
        type: job?.data.type,
        correlationId: job?.data.correlationId,
        error: error.message,
        attemptsMade: job?.attemptsMade,
      });
      // Record queue job metric
      // **Feature: production-scalability**
      // **Requirements: 12.6**
      prometheusMetrics.recordQueueJob('email', 'failed');
      
      // Move to dead letter queue after retry limit
      // **Feature: production-scalability**
      // **Requirements: 13.6**
      if (job && job.attemptsMade >= (defaultJobOptions.attempts || 3)) {
        queueHealthService.addToDeadLetterQueue('email', job, error.message);
        logger.error('Email job moved to dead letter queue after exhausting retries', {
          jobId: job.id,
          type: job.data.type,
          correlationId: job.data.correlationId,
          attemptsMade: job.attemptsMade,
          maxAttempts: defaultJobOptions.attempts,
        });
      }
    });

    emailWorker.on('active', (job) => {
      // Record queue job metric when job becomes active
      // **Feature: production-scalability**
      // **Requirements: 12.6**
      prometheusMetrics.recordQueueJob('email', 'active');
      logger.debug('Email worker: job active', {
        jobId: job.id,
        type: job.data.type,
        correlationId: job.data.correlationId,
      });
    });

    emailWorker.on('error', (error) => {
      logger.error('Email worker error', { error: error.message });
    });

    logger.info('Email worker initialized', { concurrency: 5 });
    return emailWorker;
  } catch (error) {
    logger.error('Failed to initialize email worker', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get email worker instance
 */
export function getEmailWorker(): Worker<EmailJob> | null {
  return emailWorker;
}

/**
 * Close email worker gracefully
 */
export async function closeEmailWorker(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    logger.info('Email worker closed');
  }
}
