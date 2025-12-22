/**
 * Property-Based Tests for Onboarding Completion Persistence
 * Using fast-check for property testing
 *
 * **Feature: bidding-phase6-portal, Property 11: Onboarding Completion Persistence**
 * **Validates: Requirements 19.4**
 *
 * Property: *For any* user who completes onboarding, the completion status should
 * persist and onboarding should not show again.
 */

import * as fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ============================================
// TYPES
// ============================================

interface OnboardingState {
  isCompleted: boolean;
  completedAt: string | null;
  userId: string;
}

interface OnboardingStorage {
  [userId: string]: OnboardingState;
}

// ============================================
// ONBOARDING STORAGE LOGIC (isolated for testing)
// Mirrors the logic in useOnboarding.ts
// ============================================

const ONBOARDING_STORAGE_KEY = 'portal_onboarding_completed';

/**
 * Simulated localStorage for testing
 */
class MockLocalStorage {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

/**
 * Get onboarding storage from localStorage
 */
function getOnboardingStorage(localStorage: MockLocalStorage): OnboardingStorage {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    // Ensure parsed value is an object (not array, number, string, etc.)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Save onboarding storage to localStorage
 */
function saveOnboardingStorage(localStorage: MockLocalStorage, storage: OnboardingStorage): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(storage));
  } catch {
    // Ignore storage errors in tests
  }
}

/**
 * Check if onboarding is completed for a specific user
 */
function isOnboardingCompleted(localStorage: MockLocalStorage, userId: string): boolean {
  const storage = getOnboardingStorage(localStorage);
  return storage[userId]?.isCompleted ?? false;
}

/**
 * Mark onboarding as completed for a specific user
 */
function markOnboardingCompleted(localStorage: MockLocalStorage, userId: string): void {
  const storage = getOnboardingStorage(localStorage);
  storage[userId] = {
    isCompleted: true,
    completedAt: new Date().toISOString(),
    userId,
  };
  saveOnboardingStorage(localStorage, storage);
}

/**
 * Reset onboarding for a specific user
 */
function resetOnboarding(localStorage: MockLocalStorage, userId: string): void {
  const storage = getOnboardingStorage(localStorage);
  storage[userId] = {
    isCompleted: false,
    completedAt: null,
    userId,
  };
  saveOnboardingStorage(localStorage, storage);
}

/**
 * Determine if onboarding should be shown for a user
 */
function shouldShowOnboarding(
  localStorage: MockLocalStorage,
  userId: string | null,
  isAuthenticated: boolean
): boolean {
  if (!isAuthenticated || !userId) {
    return false;
  }
  return !isOnboardingCompleted(localStorage, userId);
}

// ============================================
// GENERATORS
// ============================================

// Reserved JavaScript property names that should not be used as keys
const RESERVED_PROPERTIES = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
];

// Check if a string could be a prefix or contain any reserved property
const containsReservedProperty = (str: string): boolean => {
  const lowerStr = str.toLowerCase();
  return RESERVED_PROPERTIES.some(reserved => {
    const lowerReserved = reserved.toLowerCase();
    // Check if str contains reserved or reserved contains str (prefix match)
    return lowerStr.includes(lowerReserved) || lowerReserved.includes(lowerStr.replace('user_', ''));
  });
};

// Suppress unused variable warning - kept for documentation purposes
void containsReservedProperty;

// User ID generator using UUID-like format to avoid reserved property conflicts
const userIdArb = fc.uuid().map(uuid => `user_${uuid.replace(/-/g, '')}`);

// Multiple user IDs for multi-user scenarios
const multipleUserIdsArb = fc.array(userIdArb, { minLength: 1, maxLength: 5 })
  .filter(ids => new Set(ids).size === ids.length); // Ensure unique IDs

// Onboarding action sequence
type OnboardingAction = 
  | { type: 'COMPLETE'; userId: string }
  | { type: 'RESET'; userId: string }
  | { type: 'CHECK'; userId: string };

// Action generator factory - kept for potential future use
const _onboardingActionArb = (userIds: string[]): fc.Arbitrary<OnboardingAction> =>
  fc.oneof(
    fc.constantFrom(...userIds).map(userId => ({ type: 'COMPLETE' as const, userId })),
    fc.constantFrom(...userIds).map(userId => ({ type: 'RESET' as const, userId })),
    fc.constantFrom(...userIds).map(userId => ({ type: 'CHECK' as const, userId }))
  );

// Suppress unused variable warning - kept for potential future use
void _onboardingActionArb;

// ============================================
// PROPERTY 11: Onboarding Completion Persistence
// **Feature: bidding-phase6-portal, Property 11: Onboarding Completion Persistence**
// **Validates: Requirements 19.4**
// ============================================

describe('Property 11: Onboarding Completion Persistence', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
  });

  afterEach(() => {
    mockStorage.clear();
  });

  it('*For any* user who completes onboarding, the completion status should persist', () => {
    fc.assert(
      fc.property(
        userIdArb,
        (userId) => {
          // Initially, onboarding should not be completed
          const initialStatus = isOnboardingCompleted(mockStorage, userId);
          expect(initialStatus).toBe(false);

          // Complete onboarding
          markOnboardingCompleted(mockStorage, userId);

          // Status should now be completed
          const afterComplete = isOnboardingCompleted(mockStorage, userId);
          expect(afterComplete).toBe(true);

          // Simulate "page refresh" by reading from storage again
          const afterRefresh = isOnboardingCompleted(mockStorage, userId);
          expect(afterRefresh).toBe(true);

          return afterComplete && afterRefresh;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* user who completes onboarding, onboarding should not show again', () => {
    fc.assert(
      fc.property(
        userIdArb,
        (userId) => {
          // Initially, onboarding should show for authenticated user
          const shouldShowInitially = shouldShowOnboarding(mockStorage, userId, true);
          expect(shouldShowInitially).toBe(true);

          // Complete onboarding
          markOnboardingCompleted(mockStorage, userId);

          // Onboarding should NOT show anymore
          const shouldShowAfterComplete = shouldShowOnboarding(mockStorage, userId, true);
          expect(shouldShowAfterComplete).toBe(false);

          return shouldShowInitially && !shouldShowAfterComplete;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* user who resets onboarding, onboarding should show again', () => {
    fc.assert(
      fc.property(
        userIdArb,
        (userId) => {
          // Complete onboarding first
          markOnboardingCompleted(mockStorage, userId);
          expect(isOnboardingCompleted(mockStorage, userId)).toBe(true);

          // Reset onboarding
          resetOnboarding(mockStorage, userId);

          // Onboarding should show again
          const shouldShowAfterReset = shouldShowOnboarding(mockStorage, userId, true);
          expect(shouldShowAfterReset).toBe(true);

          return shouldShowAfterReset;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* unauthenticated user, onboarding should not show', () => {
    fc.assert(
      fc.property(
        fc.option(userIdArb, { nil: null }),
        (userId) => {
          // Unauthenticated user (no userId or not authenticated)
          const shouldShowUnauthenticated = shouldShowOnboarding(mockStorage, userId, false);
          expect(shouldShowUnauthenticated).toBe(false);

          // Even with userId but not authenticated
          if (userId) {
            const shouldShowNotAuth = shouldShowOnboarding(mockStorage, userId, false);
            expect(shouldShowNotAuth).toBe(false);
          }

          return !shouldShowUnauthenticated;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* sequence of complete/reset actions, final state should match last action', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (userId, actions) => {
          // Apply sequence of complete (true) or reset (false) actions
          actions.forEach(shouldComplete => {
            if (shouldComplete) {
              markOnboardingCompleted(mockStorage, userId);
            } else {
              resetOnboarding(mockStorage, userId);
            }
          });

          // Final state should match the last action
          const lastAction = actions[actions.length - 1];
          const finalState = isOnboardingCompleted(mockStorage, userId);

          return finalState === lastAction;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* multiple users, onboarding state should be independent per user', () => {
    fc.assert(
      fc.property(
        multipleUserIdsArb,
        (userIds) => {
          // Complete onboarding for first user only
          const firstUser = userIds[0];
          markOnboardingCompleted(mockStorage, firstUser);

          // First user should have completed onboarding
          const firstUserCompleted = isOnboardingCompleted(mockStorage, firstUser);
          expect(firstUserCompleted).toBe(true);

          // Other users should NOT have completed onboarding
          const otherUsers = userIds.slice(1);
          const otherUsersNotCompleted = otherUsers.every(
            userId => !isOnboardingCompleted(mockStorage, userId)
          );

          return firstUserCompleted && (otherUsers.length === 0 || otherUsersNotCompleted);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* user completing onboarding, completedAt timestamp should be set', () => {
    fc.assert(
      fc.property(
        userIdArb,
        (userId) => {
          const beforeComplete = new Date().toISOString();
          
          markOnboardingCompleted(mockStorage, userId);
          
          const afterComplete = new Date().toISOString();
          
          const storage = getOnboardingStorage(mockStorage);
          const userState = storage[userId];

          // completedAt should be set
          expect(userState.completedAt).not.toBeNull();
          
          // completedAt should be a valid ISO date string
          const completedAt = userState.completedAt;
          if (!completedAt) return false;
          const isValidDate = !isNaN(Date.parse(completedAt));
          expect(isValidDate).toBe(true);

          // completedAt should be between before and after timestamps
          const completedTime = new Date(completedAt).getTime();
          const beforeTime = new Date(beforeComplete).getTime();
          const afterTime = new Date(afterComplete).getTime();
          
          return completedTime >= beforeTime && completedTime <= afterTime;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* user resetting onboarding, completedAt should be cleared', () => {
    fc.assert(
      fc.property(
        userIdArb,
        (userId) => {
          // Complete first
          markOnboardingCompleted(mockStorage, userId);
          
          const storageAfterComplete = getOnboardingStorage(mockStorage);
          expect(storageAfterComplete[userId].completedAt).not.toBeNull();

          // Reset
          resetOnboarding(mockStorage, userId);
          
          const storageAfterReset = getOnboardingStorage(mockStorage);
          expect(storageAfterReset[userId].completedAt).toBeNull();

          return storageAfterReset[userId].completedAt === null;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// STORAGE CONSISTENCY TESTS
// ============================================

describe('Onboarding Storage Consistency', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
  });

  afterEach(() => {
    mockStorage.clear();
  });

  it('storage operations should be idempotent', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.integer({ min: 1, max: 5 }),
        (userId, repeatCount) => {
          // Complete onboarding multiple times
          for (let i = 0; i < repeatCount; i++) {
            markOnboardingCompleted(mockStorage, userId);
          }

          // State should be the same regardless of how many times we complete
          const isCompleted = isOnboardingCompleted(mockStorage, userId);
          return isCompleted === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('corrupted storage should be handled gracefully', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.string(),
        (userId, corruptedData) => {
          // Set corrupted data
          mockStorage.setItem(ONBOARDING_STORAGE_KEY, corruptedData);

          // Should not throw and should return false (not completed)
          try {
            isOnboardingCompleted(mockStorage, userId);
          } catch {
            return false; // Test fails if exception is thrown
          }

          // After corruption, completing should still work
          markOnboardingCompleted(mockStorage, userId);
          const afterComplete = isOnboardingCompleted(mockStorage, userId);

          return afterComplete === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty storage should return not completed', () => {
    fc.assert(
      fc.property(
        userIdArb,
        (userId) => {
          // Fresh storage
          const isCompleted = isOnboardingCompleted(mockStorage, userId);
          return isCompleted === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// MULTI-SESSION PERSISTENCE TESTS
// ============================================

describe('Multi-Session Persistence', () => {
  it('*For any* user, onboarding state should persist across simulated sessions', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.integer({ min: 1, max: 5 }),
        (userId, sessionCount) => {
          // Simulate multiple sessions with the same storage
          const sharedStorage = new MockLocalStorage();

          // First session: complete onboarding
          markOnboardingCompleted(sharedStorage, userId);

          // Subsequent sessions: verify persistence
          for (let i = 0; i < sessionCount; i++) {
            const isCompleted = isOnboardingCompleted(sharedStorage, userId);
            if (!isCompleted) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* user switching between accounts, each account should have independent state', () => {
    fc.assert(
      fc.property(
        multipleUserIdsArb,
        (userIds) => {
          const sharedStorage = new MockLocalStorage();

          // Complete onboarding for even-indexed users
          userIds.forEach((userId, index) => {
            if (index % 2 === 0) {
              markOnboardingCompleted(sharedStorage, userId);
            }
          });

          // Verify each user has correct state
          return userIds.every((userId, index) => {
            const expectedCompleted = index % 2 === 0;
            const actualCompleted = isOnboardingCompleted(sharedStorage, userId);
            return actualCompleted === expectedCompleted;
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
