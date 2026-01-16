/**
 * Distributed Lock Utility (In-Memory Fallback)
 *
 * Provides locking for critical operations to prevent
 * race conditions. Uses in-memory locks (Redis removed).
 *
 * NOTE: In-memory locks only work within a single instance.
 * For multi-instance deployments, consider using Firebase or another solution.
 *
 * **Feature: production-scalability**
 * **Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */

/**
 * Lock timeout error thrown when lock acquisition fails
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

/**
 * In-memory lock storage
 */
interface LockEntry {
  expiresAt: number;
  holder: string;
}

const locks = new Map<string, LockEntry>();

/**
 * Generate unique lock holder ID
 */
function generateHolderId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clean up expired locks
 */
function cleanupExpiredLocks(): void {
  const now = Date.now();
  for (const [key, entry] of locks.entries()) {
    if (now > entry.expiresAt) {
      locks.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredLocks, 60 * 1000);

/**
 * Simple lock object for release
 */
interface Lock {
  resource: string;
  holder: string;
  release: () => Promise<void>;
}

/**
 * Execute a function with a lock
 *
 * Acquires a lock before executing the function and releases it after.
 *
 * @param resource - Lock key (use LockKeys constants)
 * @param ttlMs - Lock TTL in milliseconds (default: 30000)
 * @param fn - Function to execute while holding the lock
 * @returns Result of the function
 * @throws LockTimeoutError if lock cannot be acquired within retry limit
 */
export async function withLock<T>(
  resource: string,
  ttlMs: number = DEFAULT_LOCK_TTL,
  fn: () => Promise<T>
): Promise<T> {
  let acquiredLock: Lock | null = null;

  try {
    // Attempt to acquire lock with retries
    for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
      acquiredLock = await tryAcquireLock(resource, ttlMs);
      
      if (acquiredLock) {
        break;
      }
      
      // Wait before retry
      if (attempt < RETRY_COUNT - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    if (!acquiredLock) {
      console.warn('[DISTRIBUTED_LOCK] Failed to acquire lock:', resource);
      throw new LockTimeoutError(resource);
    }

    // Execute the function
    return await fn();
  } finally {
    // Release lock if acquired
    if (acquiredLock) {
      try {
        await acquiredLock.release();
      } catch (releaseError) {
        console.warn('[DISTRIBUTED_LOCK] Failed to release lock:', resource, (releaseError as Error).message);
      }
    }
  }
}

/**
 * Try to acquire a lock without blocking
 *
 * Returns immediately if lock cannot be acquired.
 *
 * @param resource - Lock key
 * @param ttlMs - Lock TTL in milliseconds
 * @returns Lock object if acquired, null if not
 */
export async function tryAcquireLock(
  resource: string,
  ttlMs: number = DEFAULT_LOCK_TTL
): Promise<Lock | null> {
  const now = Date.now();
  const existing = locks.get(resource);
  
  // Check if lock exists and is still valid
  if (existing && now < existing.expiresAt) {
    return null;
  }
  
  // Acquire lock
  const holder = generateHolderId();
  locks.set(resource, {
    expiresAt: now + ttlMs,
    holder,
  });
  
  return {
    resource,
    holder,
    release: async () => {
      const current = locks.get(resource);
      if (current && current.holder === holder) {
        locks.delete(resource);
      }
    },
  };
}

/**
 * Check if distributed locking is available
 * Always returns true for in-memory implementation
 */
export function isDistributedLockAvailable(): boolean {
  return true;
}

/**
 * Get lock configuration for testing
 */
export function getLockConfig() {
  return {
    defaultTtl: DEFAULT_LOCK_TTL,
    retryCount: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
    retryJitter: 0,
  };
}
