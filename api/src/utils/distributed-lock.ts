/**
 * Distributed Lock Utility using Redlock
 *
 * Provides distributed locking for critical operations to prevent
 * race conditions in multi-instance deployments.
 *
 * **Feature: production-scalability**
 * **Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */

import Redlock, { Lock, ResourceLockedError } from 'redlock';
import { getRedisClient } from '../config/redis';

/**
 * Lock timeout error thrown when lock acquisition fails
 *
 * **Feature: production-scalability**
 * **Requirements: 5.4**
 */
export class LockTimeoutError extends Error {
  code = 'LOCK_TIMEOUT';
  status = 503;

  constructor(resource: string) {
    super(`Failed to acquire lock for resource: ${resource}`);
    this.name = 'LockTimeoutError';
  }
}

/**
 * Lock keys for critical operations
 *
 * **Feature: production-scalability**
 * **Requirements: 5.1, 5.2, 5.3**
 */
export const LockKeys = {
  /** Token refresh lock - prevents concurrent refresh for same user */
  tokenRefresh: (userId: string) => `lock:token-refresh:${userId}`,
  /** Ranking recalculation lock - prevents concurrent recalculation */
  rankingRecalculation: 'lock:ranking-recalculation',
  /** Google Sheets sync lock - prevents concurrent sync to same spreadsheet */
  googleSheetsSync: (spreadsheetId: string) => `lock:google-sheets:${spreadsheetId}`,
  /** Escrow status change lock - prevents concurrent status changes */
  escrowStatusChange: (escrowId: string) => `lock:escrow:${escrowId}`,
  /** Bid selection lock - prevents concurrent bid selection for same project */
  bidSelection: (projectId: string) => `lock:bid-selection:${projectId}`,
};

/**
 * Default lock configuration
 */
const DEFAULT_LOCK_TTL = 30000; // 30 seconds
const RETRY_COUNT = 3;
const RETRY_DELAY = 200; // ms
const RETRY_JITTER = 200; // ms

let redlock: Redlock | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redlock instance
 * Called lazily on first lock attempt
 */
function getRedlock(): Redlock | null {
  if (redlock) return redlock;

  const redis = getRedisClient();
  if (!redis) {
    console.warn('[DISTRIBUTED_LOCK] Redis not available, distributed locking disabled');
    return null;
  }

  try {
    redlock = new Redlock([redis], {
      driftFactor: 0.01,
      retryCount: RETRY_COUNT,
      retryDelay: RETRY_DELAY,
      retryJitter: RETRY_JITTER,
      automaticExtensionThreshold: 500,
    });

    redlock.on('error', (error) => {
      // Log but don't crash - Redis might be temporarily unavailable
      console.error('[DISTRIBUTED_LOCK] Redlock error:', error.message);
    });

    isRedisAvailable = true;
    return redlock;
  } catch (error) {
    console.error('[DISTRIBUTED_LOCK] Failed to initialize Redlock:', (error as Error).message);
    return null;
  }
}

/**
 * Execute a function with a distributed lock
 *
 * Acquires a lock before executing the function and releases it after.
 * If Redis is unavailable, the function executes without locking (with warning).
 *
 * @param resource - Lock key (use LockKeys constants)
 * @param ttlMs - Lock TTL in milliseconds (default: 30000)
 * @param fn - Function to execute while holding the lock
 * @returns Result of the function
 * @throws LockTimeoutError if lock cannot be acquired within retry limit
 *
 * **Feature: production-scalability, Property 10: Lock acquisition for critical operations**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 *
 * @example
 * ```typescript
 * const result = await withLock(
 *   LockKeys.tokenRefresh(userId),
 *   5000,
 *   async () => {
 *     return await refreshToken(userId);
 *   }
 * );
 * ```
 */
export async function withLock<T>(
  resource: string,
  ttlMs: number = DEFAULT_LOCK_TTL,
  fn: () => Promise<T>
): Promise<T> {
  const lock = getRedlock();

  // If Redis unavailable, execute without lock (with warning)
  // **Feature: production-scalability, Requirements: 5.6**
  if (!lock) {
    console.warn('[DISTRIBUTED_LOCK] Redis unavailable, executing without lock:', resource);
    return fn();
  }

  let acquiredLock: Lock | null = null;

  try {
    // Attempt to acquire lock
    acquiredLock = await lock.acquire([resource], ttlMs);

    // Execute the function
    return await fn();
  } catch (error) {
    // Handle lock acquisition failure
    // **Feature: production-scalability, Property 11: Lock timeout error**
    // **Validates: Requirements 5.4**
    if (error instanceof ResourceLockedError) {
      console.warn('[DISTRIBUTED_LOCK] Failed to acquire lock:', resource);
      throw new LockTimeoutError(resource);
    }

    // Re-throw other errors
    throw error;
  } finally {
    // Release lock if acquired
    // **Feature: production-scalability, Property 12: Lock auto-release on TTL**
    // **Validates: Requirements 5.5**
    if (acquiredLock) {
      try {
        await acquiredLock.release();
      } catch (releaseError) {
        // Log but don't throw - lock will auto-expire via TTL
        console.warn('[DISTRIBUTED_LOCK] Failed to release lock:', resource, (releaseError as Error).message);
      }
    }
  }
}

/**
 * Try to acquire a lock without blocking
 *
 * Returns immediately if lock cannot be acquired.
 * Useful for non-critical operations that can be skipped if locked.
 *
 * @param resource - Lock key
 * @param ttlMs - Lock TTL in milliseconds
 * @returns Lock object if acquired, null if not
 */
export async function tryAcquireLock(
  resource: string,
  ttlMs: number = DEFAULT_LOCK_TTL
): Promise<Lock | null> {
  const lock = getRedlock();
  if (!lock) return null;

  try {
    return await lock.acquire([resource], ttlMs);
  } catch {
    return null;
  }
}

/**
 * Check if Redis is available for distributed locking
 */
export function isDistributedLockAvailable(): boolean {
  return isRedisAvailable && getRedlock() !== null;
}

/**
 * Get lock configuration for testing
 */
export function getLockConfig() {
  return {
    defaultTtl: DEFAULT_LOCK_TTL,
    retryCount: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
    retryJitter: RETRY_JITTER,
  };
}
