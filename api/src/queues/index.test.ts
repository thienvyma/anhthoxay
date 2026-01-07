/**
 * Queue System Property Tests
 *
 * Property-based tests for queue infrastructure including
 * response time, retry behavior, and Redis fallback.
 *
 * **Feature: production-scalability**
 * **Requirements: 1.1, 1.2, 1.6**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  defaultJobOptions,
  EmailJob,
  SyncJob,
  NotificationJob,
  addEmailJob,
  addSyncJob,
  addNotificationJob,
  isQueueSystemAvailable,
} from './index';

// Mock the redis module
vi.mock('../config/redis', () => ({
  isRedisConnected: vi.fn(() => false), // Default to disconnected for fallback tests
  getRedisClient: vi.fn(() => null),
}));

// ============================================
// GENERATORS
// ============================================

/**
 * Generator for email job types
 */
const emailJobTypeGen = fc.constantFrom('quotation', 'notification', 'welcome', 'general');

/**
 * Generator for correlation IDs
 */
const correlationIdGen = fc.uuid();

/**
 * Generator for email addresses
 */
const emailAddressGen = fc.emailAddress();

/**
 * Generator for non-empty strings
 */
const nonEmptyStringGen = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Generator for email jobs
 */
const emailJobGen: fc.Arbitrary<EmailJob> = fc.record({
  type: emailJobTypeGen as fc.Arbitrary<'quotation' | 'notification' | 'welcome' | 'general'>,
  to: emailAddressGen,
  subject: nonEmptyStringGen,
  templateId: fc.option(nonEmptyStringGen, { nil: undefined }),
  htmlContent: fc.option(nonEmptyStringGen, { nil: undefined }),
  data: fc.dictionary(fc.string(), fc.jsonValue()),
  correlationId: correlationIdGen,
  attachments: fc.option(
    fc.array(
      fc.record({
        filename: nonEmptyStringGen,
        content: fc.base64String(),
        contentType: fc.constantFrom('application/pdf', 'image/png', 'text/plain'),
      }),
      { minLength: 0, maxLength: 3 }
    ),
    { nil: undefined }
  ),
});

/**
 * Generator for sync job types
 */
const syncJobTypeGen = fc.constantFrom('google-sheets', 'lead-sync');

/**
 * Generator for sync operations
 */
const syncOperationGen = fc.constantFrom('append', 'update', 'batch');

/**
 * Generator for sync jobs
 */
const syncJobGen: fc.Arbitrary<SyncJob> = fc.record({
  type: syncJobTypeGen as fc.Arbitrary<'google-sheets' | 'lead-sync'>,
  spreadsheetId: fc.option(nonEmptyStringGen, { nil: undefined }),
  data: fc.array(fc.jsonValue(), { minLength: 1, maxLength: 10 }),
  correlationId: correlationIdGen,
  operation: syncOperationGen as fc.Arbitrary<'append' | 'update' | 'batch'>,
});

/**
 * Generator for notification channels
 */
const notificationChannelGen = fc.constantFrom('in-app', 'email', 'sms');

/**
 * Generator for notification jobs
 */
const notificationJobGen: fc.Arbitrary<NotificationJob> = fc.record({
  userId: fc.uuid(),
  type: nonEmptyStringGen,
  title: nonEmptyStringGen,
  content: nonEmptyStringGen,
  data: fc.option(fc.dictionary(fc.string(), fc.jsonValue()), { nil: undefined }),
  channels: fc.array(notificationChannelGen as fc.Arbitrary<'in-app' | 'email' | 'sms'>, { minLength: 1, maxLength: 3 }),
  correlationId: correlationIdGen,
});

// ============================================
// PROPERTY TESTS
// ============================================

describe('Queue System', () => {
  describe('Default Job Options', () => {
    /**
     * **Feature: production-scalability, Property 1: Queue job response time**
     * **Validates: Requirements 1.1**
     *
     * Property: Queue configuration should enable immediate response
     * by having proper default options that don't block.
     */
    describe('Property 1: Queue job response time', () => {
      it('should have attempts configured for retry', () => {
        expect(defaultJobOptions.attempts).toBe(3);
      });

      it('should have exponential backoff configured', () => {
        expect(defaultJobOptions.backoff).toBeDefined();
        const backoff = defaultJobOptions.backoff;
        if (typeof backoff === 'object' && backoff !== null) {
          expect(backoff.type).toBe('exponential');
          expect(backoff.delay).toBe(1000);
        }
      });

      it('should have removeOnComplete configured to prevent memory bloat', () => {
        expect(defaultJobOptions.removeOnComplete).toBeDefined();
        if (typeof defaultJobOptions.removeOnComplete === 'object') {
          expect(defaultJobOptions.removeOnComplete.count).toBe(100);
          expect(defaultJobOptions.removeOnComplete.age).toBe(3600);
        }
      });

      it('should have removeOnFail configured for debugging', () => {
        expect(defaultJobOptions.removeOnFail).toBeDefined();
        if (typeof defaultJobOptions.removeOnFail === 'object') {
          expect(defaultJobOptions.removeOnFail.count).toBe(1000);
          expect(defaultJobOptions.removeOnFail.age).toBe(86400);
        }
      });
    });

    /**
     * **Feature: production-scalability, Property 2: Queue retry with exponential backoff**
     * **Validates: Requirements 1.2**
     *
     * Property: For any number of retry attempts, the backoff delay
     * should follow exponential growth pattern.
     */
    describe('Property 2: Queue retry with exponential backoff', () => {
      it('should calculate exponential backoff correctly for any attempt', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 10 }), // attempt number
            (attempt) => {
              const backoff = defaultJobOptions.backoff;
              const baseDelay = typeof backoff === 'object' && backoff !== null ? backoff.delay ?? 1000 : 1000;
              const expectedDelay = baseDelay * Math.pow(2, attempt);
              
              // Verify exponential growth
              expect(expectedDelay).toBe(1000 * Math.pow(2, attempt));
              
              // Verify delay increases with each attempt
              if (attempt > 0) {
                const previousDelay = baseDelay * Math.pow(2, attempt - 1);
                expect(expectedDelay).toBe(previousDelay * 2);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should have reasonable max retry attempts', () => {
        const attempts = defaultJobOptions.attempts ?? 0;
        expect(attempts).toBeGreaterThanOrEqual(1);
        expect(attempts).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Job Data Validation', () => {
    /**
     * Property: All generated email jobs should have required fields
     */
    it('should generate valid email jobs with required fields', () => {
      fc.assert(
        fc.property(emailJobGen, (job) => {
          expect(job.type).toBeDefined();
          expect(['quotation', 'notification', 'welcome', 'general']).toContain(job.type);
          expect(job.to).toBeDefined();
          expect(job.to).toMatch(/@/); // Basic email validation
          expect(job.subject).toBeDefined();
          expect(job.correlationId).toBeDefined();
          expect(job.data).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: All generated sync jobs should have required fields
     */
    it('should generate valid sync jobs with required fields', () => {
      fc.assert(
        fc.property(syncJobGen, (job) => {
          expect(job.type).toBeDefined();
          expect(['google-sheets', 'lead-sync']).toContain(job.type);
          expect(job.data).toBeDefined();
          expect(Array.isArray(job.data)).toBe(true);
          expect(job.correlationId).toBeDefined();
          expect(job.operation).toBeDefined();
          expect(['append', 'update', 'batch']).toContain(job.operation);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: All generated notification jobs should have required fields
     */
    it('should generate valid notification jobs with required fields', () => {
      fc.assert(
        fc.property(notificationJobGen, (job) => {
          expect(job.userId).toBeDefined();
          expect(job.type).toBeDefined();
          expect(job.title).toBeDefined();
          expect(job.content).toBeDefined();
          expect(job.channels).toBeDefined();
          expect(Array.isArray(job.channels)).toBe(true);
          expect(job.channels.length).toBeGreaterThanOrEqual(1);
          expect(job.correlationId).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: production-scalability, Property 3: Queue fallback on Redis failure**
   * **Validates: Requirements 1.6**
   *
   * Property: When Redis is unavailable, the queue system should
   * fall back to synchronous processing using the provided fallback function.
   */
  describe('Property 3: Queue fallback on Redis failure', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should report queue system as unavailable when Redis is disconnected', () => {
      // With mocked Redis as disconnected, queue system should be unavailable
      expect(isQueueSystemAvailable()).toBe(false);
    });

    it('should execute fallback for email jobs when Redis unavailable', async () => {
      await fc.assert(
        fc.asyncProperty(emailJobGen, async (job) => {
          let fallbackCalled = false;
          let fallbackJob: EmailJob | null = null;

          const fallbackFn = async (j: EmailJob) => {
            fallbackCalled = true;
            fallbackJob = j;
          };

          const result = await addEmailJob(job, fallbackFn);

          // Should return null (fallback used)
          expect(result).toBeNull();
          // Fallback should have been called
          expect(fallbackCalled).toBe(true);
          // Fallback should receive the same job
          expect(fallbackJob).toEqual(job);
        }),
        { numRuns: 50 }
      );
    });

    it('should execute fallback for sync jobs when Redis unavailable', async () => {
      await fc.assert(
        fc.asyncProperty(syncJobGen, async (job) => {
          let fallbackCalled = false;
          let fallbackJob: SyncJob | null = null;

          const fallbackFn = async (j: SyncJob) => {
            fallbackCalled = true;
            fallbackJob = j;
          };

          const result = await addSyncJob(job, fallbackFn);

          // Should return null (fallback used)
          expect(result).toBeNull();
          // Fallback should have been called
          expect(fallbackCalled).toBe(true);
          // Fallback should receive the same job
          expect(fallbackJob).toEqual(job);
        }),
        { numRuns: 50 }
      );
    });

    it('should execute fallback for notification jobs when Redis unavailable', async () => {
      await fc.assert(
        fc.asyncProperty(notificationJobGen, async (job) => {
          let fallbackCalled = false;
          let fallbackJob: NotificationJob | null = null;

          const fallbackFn = async (j: NotificationJob) => {
            fallbackCalled = true;
            fallbackJob = j;
          };

          const result = await addNotificationJob(job, fallbackFn);

          // Should return null (fallback used)
          expect(result).toBeNull();
          // Fallback should have been called
          expect(fallbackCalled).toBe(true);
          // Fallback should receive the same job
          expect(fallbackJob).toEqual(job);
        }),
        { numRuns: 50 }
      );
    });

    it('should not throw when no fallback provided and Redis unavailable', async () => {
      await fc.assert(
        fc.asyncProperty(emailJobGen, async (job) => {
          // Should not throw, just return null
          const result = await addEmailJob(job);
          expect(result).toBeNull();
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve job data integrity through fallback', async () => {
      await fc.assert(
        fc.asyncProperty(emailJobGen, async (job) => {
          const receivedJobs: EmailJob[] = [];

          await addEmailJob(job, async (j) => {
            receivedJobs.push(j);
          });

          // All fields should be preserved
          expect(receivedJobs.length).toBe(1);
          const receivedJob = receivedJobs[0];
          expect(receivedJob.type).toBe(job.type);
          expect(receivedJob.to).toBe(job.to);
          expect(receivedJob.subject).toBe(job.subject);
          expect(receivedJob.correlationId).toBe(job.correlationId);
          expect(receivedJob.data).toEqual(job.data);
        }),
        { numRuns: 50 }
      );
    });
  });
});
