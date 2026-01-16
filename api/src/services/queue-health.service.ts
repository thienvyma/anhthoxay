/**
 * Queue Health Monitoring Service
 *
 * Provides health monitoring for in-memory queues.
 * Simplified version without BullMQ dependency.
 */

import { logger } from '../utils/logger';
import { getQueueStats } from '../queues';

// ============================================
// CONSTANTS
// ============================================

export const DEPTH_WARNING_THRESHOLD = 1000;
export const DEPTH_CRITICAL_THRESHOLD = 5000;

// ============================================
// TYPES
// ============================================

export interface QueueHealth {
  name: string;
  depth: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  processingRate: number;
  avgProcessingTime: number;
  isHealthy: boolean;
  healthStatus: 'healthy' | 'warning' | 'critical';
}

export interface QueueStatusSummary {
  queues: QueueHealth[];
  totalDepth: number;
  totalFailed: number;
  overallHealth: 'healthy' | 'warning' | 'critical';
  timestamp: string;
}

export interface DeadLetterJob {
  id: string;
  queueName: string;
  data: unknown;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
}

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

export class QueueHealthService {
  private registeredQueues: Set<string> = new Set();
  private deadLetterJobs: DeadLetterJob[] = [];
  private alertCallbacks: ((queueName: string, depth: number, status: 'warning' | 'critical') => void)[] = [];

  /**
   * Register a queue for health monitoring (no-op for in-memory)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  registerQueue(name: string, _queue: unknown): void {
    this.registeredQueues.add(name);
    logger.info('Queue registered for health monitoring', { queueName: name });
  }

  /**
   * Unregister a queue from health monitoring
   */
  unregisterQueue(name: string): void {
    this.registeredQueues.delete(name);
    logger.info('Queue unregistered from health monitoring', { queueName: name });
  }

  /**
   * Register an alert callback
   */
  onAlert(callback: (queueName: string, depth: number, status: 'warning' | 'critical') => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Record job processing time (no-op for in-memory)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recordProcessingTime(_queueName: string, _durationMs: number): void {
    // No-op for in-memory queues
  }

  /**
   * Record job completion (no-op for in-memory)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recordJobCompletion(_queueName: string): void {
    // No-op for in-memory queues
  }

  /**
   * Get health status for a specific queue
   */
  async getQueueHealth(queueName: string): Promise<QueueHealth | null> {
    if (!this.registeredQueues.has(queueName)) return null;

    const stats = getQueueStats();
    const depth = stats[queueName as keyof typeof stats] || 0;

    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    let isHealthy = true;

    if (depth >= DEPTH_CRITICAL_THRESHOLD) {
      healthStatus = 'critical';
      isHealthy = false;
    } else if (depth >= DEPTH_WARNING_THRESHOLD) {
      healthStatus = 'warning';
      isHealthy = false;
    }

    return {
      name: queueName,
      depth,
      waiting: depth,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      processingRate: 0,
      avgProcessingTime: 0,
      isHealthy,
      healthStatus,
    };
  }

  /**
   * Get health status for all registered queues
   */
  async getAllQueuesHealth(): Promise<QueueHealth[]> {
    const results: QueueHealth[] = [];

    for (const name of this.registeredQueues) {
      const health = await this.getQueueHealth(name);
      if (health) {
        results.push(health);
      }
    }

    return results;
  }

  /**
   * Get queue status summary
   */
  async getQueueStatusSummary(): Promise<QueueStatusSummary> {
    const queues = await this.getAllQueuesHealth();

    const totalDepth = queues.reduce((sum, q) => sum + q.depth, 0);
    const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0);

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

  /**
   * Check if queue can accept new jobs
   */
  async canAcceptJob(queueName: string): Promise<boolean> {
    const health = await this.getQueueHealth(queueName);
    if (!health) return true;
    return health.depth < DEPTH_CRITICAL_THRESHOLD;
  }

  /**
   * Check if queue can accept job, throwing error if not
   */
  async assertCanAcceptJob(queueName: string): Promise<void> {
    const health = await this.getQueueHealth(queueName);
    if (health && health.depth >= DEPTH_CRITICAL_THRESHOLD) {
      throw new QueueFullError(queueName, health.depth);
    }
  }

  /**
   * Add job to dead letter queue
   */
  addToDeadLetterQueue(queueName: string, job: { id?: string; data: unknown; attemptsMade: number }, failedReason: string): void {
    const deadLetterJob: DeadLetterJob = {
      id: job.id || `unknown-${Date.now()}`,
      queueName,
      data: job.data,
      failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: Date.now(),
    };

    this.deadLetterJobs.push(deadLetterJob);

    if (this.deadLetterJobs.length > 1000) {
      this.deadLetterJobs.shift();
    }

    logger.error('Job moved to dead letter queue', {
      jobId: deadLetterJob.id,
      queueName,
      failedReason,
      attemptsMade: job.attemptsMade,
    });
  }

  /**
   * Get dead letter jobs
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

  /**
   * Get registered queue names
   */
  getRegisteredQueues(): string[] {
    return Array.from(this.registeredQueues);
  }

  /**
   * Check if queue is registered
   */
  isQueueRegistered(queueName: string): boolean {
    return this.registeredQueues.has(queueName);
  }

  /**
   * Reset all tracking data (for testing)
   */
  reset(): void {
    this.deadLetterJobs = [];
    this.alertCallbacks = [];
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const queueHealthService = new QueueHealthService();

export default QueueHealthService;
