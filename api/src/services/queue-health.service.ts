/**
 * Queue Health Monitoring Service
 *
 * Provides health monitoring, depth alerting, and backpressure
 * management for BullMQ queues.
 *
 * **Feature: production-scalability**
 * **Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6**
 */

import { Queue, Job } from 'bullmq';
import { logger } from '../utils/logger';

// ============================================
// CONSTANTS
// ============================================

/**
 * Queue depth thresholds
 * Requirements: 13.1, 13.5
 */
export const DEPTH_WARNING_THRESHOLD = 1000;
export const DEPTH_CRITICAL_THRESHOLD = 5000;

/**
 * Processing time tracking window (keep last N entries)
 */
const PROCESSING_TIME_WINDOW = 100;

/**
 * Rate calculation window in milliseconds (1 minute)
 */
const RATE_CALCULATION_WINDOW_MS = 60000;

// ============================================
// TYPES
// ============================================

/**
 * Queue health status
 */
export interface QueueHealth {
  name: string;
  depth: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  processingRate: number; // jobs per minute
  avgProcessingTime: number; // milliseconds
  isHealthy: boolean;
  healthStatus: 'healthy' | 'warning' | 'critical';
}

/**
 * Queue status summary for API response
 */
export interface QueueStatusSummary {
  queues: QueueHealth[];
  totalDepth: number;
  totalFailed: number;
  overallHealth: 'healthy' | 'warning' | 'critical';
  timestamp: string;
}

/**
 * Dead letter job info
 */
export interface DeadLetterJob {
  id: string;
  queueName: string;
  data: unknown;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
}

/**
 * Error for queue full condition
 */
export class QueueFullError extends Error {
  code = 'QUEUE_FULL';
  status = 503;

  constructor(queueName: string, depth: number) {
    super(`Queue "${queueName}" is full (depth: ${depth}). Please try again later.`);
    this.name = 'QueueFullError';
  }
}

// ============================================
// QUEUE HEALTH SERVICE
// ============================================

/**
 * QueueHealthService provides health monitoring and backpressure
 * management for BullMQ queues.
 *
 * Features:
 * - Track queue depth and processing times
 * - Log warnings at 1000 jobs depth
 * - Reject new jobs at 5000 jobs depth
 * - Track dead letter queue for failed jobs
 * - Calculate processing rate
 *
 * @example
 * ```ts
 * // Register queues
 * queueHealthService.registerQueue('email', emailQueue);
 *
 * // Check if can accept job
 * if (await queueHealthService.canAcceptJob('email')) {
 *   await emailQueue.add('send', jobData);
 * }
 *
 * // Get health status
 * const health = await queueHealthService.getQueueHealth('email');
 * ```
 */
export class QueueHealthService {
  private queues: Map<string, Queue> = new Map();
  private processingTimes: Map<string, number[]> = new Map();
  private completedTimestamps: Map<string, number[]> = new Map();
  private deadLetterJobs: DeadLetterJob[] = [];
  private alertCallbacks: ((queueName: string, depth: number, status: 'warning' | 'critical') => void)[] = [];

  // ============================================
  // QUEUE REGISTRATION
  // ============================================

  /**
   * Register a queue for health monitoring
   *
   * @param name - Queue name
   * @param queue - BullMQ Queue instance
   */
  registerQueue(name: string, queue: Queue): void {
    this.queues.set(name, queue);
    this.processingTimes.set(name, []);
    this.completedTimestamps.set(name, []);

    logger.info('Queue registered for health monitoring', { queueName: name });
  }

  /**
   * Unregister a queue from health monitoring
   *
   * @param name - Queue name
   */
  unregisterQueue(name: string): void {
    this.queues.delete(name);
    this.processingTimes.delete(name);
    this.completedTimestamps.delete(name);

    logger.info('Queue unregistered from health monitoring', { queueName: name });
  }

  /**
   * Register an alert callback
   *
   * @param callback - Function to call when alert is triggered
   */
  onAlert(callback: (queueName: string, depth: number, status: 'warning' | 'critical') => void): void {
    this.alertCallbacks.push(callback);
  }

  // ============================================
  // PROCESSING TIME TRACKING
  // ============================================

  /**
   * Record job processing time
   *
   * @param queueName - Queue name
   * @param durationMs - Processing duration in milliseconds
   */
  recordProcessingTime(queueName: string, durationMs: number): void {
    const times = this.processingTimes.get(queueName) || [];
    times.push(durationMs);

    // Keep only last N entries
    if (times.length > PROCESSING_TIME_WINDOW) {
      times.shift();
    }

    this.processingTimes.set(queueName, times);
  }

  /**
   * Record job completion for rate calculation
   *
   * @param queueName - Queue name
   */
  recordJobCompletion(queueName: string): void {
    const timestamps = this.completedTimestamps.get(queueName) || [];
    timestamps.push(Date.now());

    // Remove timestamps older than rate window
    const cutoff = Date.now() - RATE_CALCULATION_WINDOW_MS;
    const filtered = timestamps.filter((t) => t > cutoff);

    this.completedTimestamps.set(queueName, filtered);
  }

  // ============================================
  // HEALTH MONITORING
  // ============================================

  /**
   * Get health status for a specific queue
   *
   * @param queueName - Queue name
   * @returns Queue health status or null if queue not found
   */
  async getQueueHealth(queueName: string): Promise<QueueHealth | null> {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      const depth = waiting + active + delayed;

      // Calculate average processing time
      const times = this.processingTimes.get(queueName) || [];
      const avgProcessingTime =
        times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      // Calculate processing rate (jobs per minute)
      const timestamps = this.completedTimestamps.get(queueName) || [];
      const processingRate = timestamps.length; // Count in last minute

      // Determine health status
      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      let isHealthy = true;

      if (depth >= DEPTH_CRITICAL_THRESHOLD) {
        healthStatus = 'critical';
        isHealthy = false;
        this.triggerAlert(queueName, depth, 'critical');
      } else if (depth >= DEPTH_WARNING_THRESHOLD) {
        healthStatus = 'warning';
        isHealthy = false;
        this.triggerAlert(queueName, depth, 'warning');
      }

      return {
        name: queueName,
        depth,
        waiting,
        active,
        completed,
        failed,
        delayed,
        processingRate,
        avgProcessingTime,
        isHealthy,
        healthStatus,
      };
    } catch (error) {
      logger.error('Failed to get queue health', {
        queueName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Get health status for all registered queues
   *
   * @returns Array of queue health statuses
   */
  async getAllQueuesHealth(): Promise<QueueHealth[]> {
    const results: QueueHealth[] = [];

    for (const name of this.queues.keys()) {
      const health = await this.getQueueHealth(name);
      if (health) {
        results.push(health);
      }
    }

    return results;
  }

  /**
   * Get queue status summary
   *
   * @returns Summary of all queues health
   */
  async getQueueStatusSummary(): Promise<QueueStatusSummary> {
    const queues = await this.getAllQueuesHealth();

    const totalDepth = queues.reduce((sum, q) => sum + q.depth, 0);
    const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0);

    // Determine overall health
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (queues.some((q) => q.healthStatus === 'critical')) {
      overallHealth = 'critical';
    } else if (queues.some((q) => q.healthStatus === 'warning')) {
      overallHealth = 'warning';
    }

    return {
      queues,
      totalDepth,
      totalFailed,
      overallHealth,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BACKPRESSURE MANAGEMENT
  // ============================================

  /**
   * Check if queue can accept new jobs
   * Requirements: 13.5 - Reject at 5000 depth
   *
   * @param queueName - Queue name
   * @returns true if queue can accept jobs, false otherwise
   * @throws QueueFullError if queue depth exceeds critical threshold
   */
  async canAcceptJob(queueName: string): Promise<boolean> {
    const health = await this.getQueueHealth(queueName);

    // If queue not registered, allow job (fail-open)
    if (!health) return true;

    if (health.depth >= DEPTH_CRITICAL_THRESHOLD) {
      logger.error('Queue full, rejecting job', {
        queueName,
        depth: health.depth,
        threshold: DEPTH_CRITICAL_THRESHOLD,
      });
      return false;
    }

    return true;
  }

  /**
   * Check if queue can accept job, throwing error if not
   *
   * @param queueName - Queue name
   * @throws QueueFullError if queue is full
   */
  async assertCanAcceptJob(queueName: string): Promise<void> {
    const health = await this.getQueueHealth(queueName);

    if (health && health.depth >= DEPTH_CRITICAL_THRESHOLD) {
      throw new QueueFullError(queueName, health.depth);
    }
  }

  // ============================================
  // DEAD LETTER QUEUE
  // ============================================

  /**
   * Add job to dead letter queue
   * Requirements: 13.6 - Move failed jobs after retry limit
   *
   * @param queueName - Original queue name
   * @param job - Failed job
   * @param failedReason - Reason for failure
   */
  addToDeadLetterQueue(queueName: string, job: Job, failedReason: string): void {
    const deadLetterJob: DeadLetterJob = {
      id: job.id || `unknown-${Date.now()}`,
      queueName,
      data: job.data,
      failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: Date.now(),
    };

    this.deadLetterJobs.push(deadLetterJob);

    // Keep only last 1000 dead letter jobs
    if (this.deadLetterJobs.length > 1000) {
      this.deadLetterJobs.shift();
    }

    logger.error('Job moved to dead letter queue', {
      jobId: deadLetterJob.id,
      queueName,
      failedReason,
      attemptsMade: job.attemptsMade,
    });

    // Trigger alert for dead letter
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(queueName, this.deadLetterJobs.length, 'critical');
      } catch {
        // Ignore callback errors
      }
    });
  }

  /**
   * Get dead letter jobs
   *
   * @param limit - Maximum number of jobs to return
   * @returns Array of dead letter jobs
   */
  getDeadLetterJobs(limit = 100): DeadLetterJob[] {
    return this.deadLetterJobs.slice(-limit);
  }

  /**
   * Get dead letter job count
   */
  getDeadLetterCount(): number {
    return this.deadLetterJobs.length;
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterJobs = [];
    logger.info('Dead letter queue cleared');
  }

  // ============================================
  // ALERTING
  // ============================================

  /**
   * Trigger alert for queue depth
   *
   * @param queueName - Queue name
   * @param depth - Current depth
   * @param status - Alert status
   */
  private triggerAlert(queueName: string, depth: number, status: 'warning' | 'critical'): void {
    if (status === 'critical') {
      logger.error('Queue depth critical', {
        queueName,
        depth,
        threshold: DEPTH_CRITICAL_THRESHOLD,
      });
    } else {
      logger.warn('Queue depth warning', {
        queueName,
        depth,
        threshold: DEPTH_WARNING_THRESHOLD,
      });
    }

    // Call registered alert callbacks
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(queueName, depth, status);
      } catch {
        // Ignore callback errors
      }
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get registered queue names
   */
  getRegisteredQueues(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Check if queue is registered
   *
   * @param queueName - Queue name
   */
  isQueueRegistered(queueName: string): boolean {
    return this.queues.has(queueName);
  }

  /**
   * Reset all tracking data (for testing)
   */
  reset(): void {
    this.processingTimes.clear();
    this.completedTimestamps.clear();
    this.deadLetterJobs = [];
    this.alertCallbacks = [];

    // Re-initialize tracking for registered queues
    for (const name of this.queues.keys()) {
      this.processingTimes.set(name, []);
      this.completedTimestamps.set(name, []);
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Singleton queue health service instance
 */
export const queueHealthService = new QueueHealthService();

export default QueueHealthService;
