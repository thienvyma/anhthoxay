/**
 * Property-Based Tests for useLocalStoragePersistence hook
 * 
 * **Feature: production-scalability**
 * **Validates: Requirements 10.1, 10.2, 10.4**
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useLocalStoragePersistence, StorageKeys, hasStoredData, getStoredDataAge } from './useLocalStoragePersistence';

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

let localStorageMock: ReturnType<typeof createLocalStorageMock>;
let originalLocalStorage: Storage;

beforeAll(() => {
  originalLocalStorage = window.localStorage;
});

afterAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
  });
});

describe('useLocalStoragePersistence', () => {
  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorageMock);
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.unstubAllGlobals();
  });

  /**
   * **Feature: production-scalability, Property 20: LocalStorage persistence round-trip**
   * **Validates: Requirements 10.1, 10.2**
   * 
   * Property: For any serializable value, saving to localStorage and then
   * restoring should return the same value (round-trip consistency).
   */
  it('should persist and restore values correctly (property test)', () => {
    fc.assert(
      fc.property(
        // Generate various serializable values
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.array(fc.string()),
          fc.record({ name: fc.string(), value: fc.integer() }),
          fc.constant(null)
        ),
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `test:${s}`), // unique key
        (value, key) => {
          // Clear any existing data
          localStorageMock.removeItem(key);

          // First render - set initial value
          const { result, unmount } = renderHook(() =>
            useLocalStoragePersistence(value, { key })
          );

          // Value should be the initial value
          expect(result.current[0]).toEqual(value);

          // Persist a new value
          const newValue = value;
          act(() => {
            result.current[1](newValue);
          });

          // Value should be updated
          expect(result.current[0]).toEqual(newValue);

          // Verify localStorage was called
          expect(localStorageMock.setItem).toHaveBeenCalled();

          unmount();

          // Second render - should restore from localStorage
          const { result: result2 } = renderHook(() =>
            useLocalStoragePersistence('different-initial' as unknown, { key })
          );

          // Should restore the persisted value, not the new initial
          expect(result2.current[0]).toEqual(newValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Complex objects should be serialized and deserialized correctly
   */
  it('should handle complex objects round-trip (property test)', () => {
    fc.assert(
      fc.property(
        fc.record({
          category: fc.string(),
          area: fc.integer({ min: 0, max: 10000 }),
          materials: fc.array(
            fc.record({
              id: fc.string(),
              name: fc.string(),
              price: fc.integer({ min: 0 }),
              quantity: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 0, maxLength: 10 }
          ),
        }),
        (formState) => {
          const key = 'test:complex-object';
          localStorageMock.removeItem(key);

          // First render - persist the complex object
          const { result, unmount } = renderHook(() =>
            useLocalStoragePersistence(formState, { key })
          );

          act(() => {
            result.current[1](formState);
          });

          unmount();

          // Second render - restore
          const { result: result2 } = renderHook(() =>
            useLocalStoragePersistence({} as typeof formState, { key })
          );

          // Should restore the exact same structure
          expect(result2.current[0]).toEqual(formState);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Updating value should always persist the latest value
   */
  it('should always persist the latest value after multiple updates (property test)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 2, maxLength: 10 }),
        (values) => {
          const key = 'test:multiple-updates';
          localStorageMock.removeItem(key);

          const { result, unmount } = renderHook(() =>
            useLocalStoragePersistence(0, { key })
          );

          // Update with each value
          for (const value of values) {
            act(() => {
              result.current[1](value);
            });
          }

          // Current value should be the last one
          expect(result.current[0]).toBe(values[values.length - 1]);

          unmount();

          // Restore should get the last value
          const { result: result2 } = renderHook(() =>
            useLocalStoragePersistence(0, { key })
          );

          expect(result2.current[0]).toBe(values[values.length - 1]);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Clear should remove data and reset to initial value
   */
  it('should clear data and reset to initial value (property test)', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (initialValue, persistedValue) => {
          const key = 'test:clear';
          localStorageMock.removeItem(key);

          const { result, unmount } = renderHook(() =>
            useLocalStoragePersistence(initialValue, { key })
          );

          // Persist a value
          act(() => {
            result.current[1](persistedValue);
          });

          expect(result.current[0]).toBe(persistedValue);

          // Clear
          act(() => {
            result.current[2]();
          });

          // Should be back to initial value
          expect(result.current[0]).toBe(initialValue);

          unmount();

          // New render should get initial value (not persisted)
          const { result: result2 } = renderHook(() =>
            useLocalStoragePersistence(initialValue, { key })
          );

          expect(result2.current[0]).toBe(initialValue);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('useLocalStoragePersistence - Expiry', () => {
  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorageMock);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /**
   * **Feature: production-scalability, Property 21: LocalStorage expiry**
   * **Validates: Requirements 10.4**
   * 
   * Property: Data older than TTL should be discarded and initial value returned.
   */
  it('should discard expired data and return initial value (property test)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.integer({ min: 1, max: 48 }), // TTL in hours
        (initialValue, persistedValue, ttlHours) => {
          const key = 'test:expiry';
          localStorageMock.removeItem(key);

          // Set the current time
          const now = Date.now();
          vi.setSystemTime(now);

          // First render - persist a value
          const { unmount } = renderHook(() =>
            useLocalStoragePersistence(initialValue, { key, ttlHours })
          );

          // Manually set localStorage with current timestamp
          const storedData = {
            data: persistedValue,
            timestamp: now,
          };
          localStorageMock.setItem(key, JSON.stringify(storedData));

          unmount();

          // Advance time past TTL
          const expiredTime = now + (ttlHours + 1) * 60 * 60 * 1000;
          vi.setSystemTime(expiredTime);

          // Second render - should get initial value because data expired
          const { result: result2 } = renderHook(() =>
            useLocalStoragePersistence(initialValue, { key, ttlHours })
          );

          // Should return initial value, not the expired persisted value
          expect(result2.current[0]).toBe(initialValue);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Data within TTL should be restored correctly
   */
  it('should restore data within TTL (property test)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.integer({ min: 2, max: 48 }), // TTL in hours
        fc.integer({ min: 1, max: 100 }), // percentage of TTL to advance (1-100%)
        (initialValue, persistedValue, ttlHours, percentAdvance) => {
          const key = 'test:within-ttl';
          localStorageMock.removeItem(key);

          const now = Date.now();
          vi.setSystemTime(now);

          // Manually set localStorage with current timestamp
          const storedData = {
            data: persistedValue,
            timestamp: now,
          };
          localStorageMock.setItem(key, JSON.stringify(storedData));

          // Advance time but stay within TTL (use percentage to stay under 100%)
          const advanceMs = (ttlHours * 60 * 60 * 1000 * percentAdvance) / 101; // Always less than TTL
          vi.setSystemTime(now + advanceMs);

          // Render - should restore the persisted value
          const { result } = renderHook(() =>
            useLocalStoragePersistence(initialValue, { key, ttlHours })
          );

          // Should return persisted value since it's within TTL
          expect(result.current[0]).toBe(persistedValue);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Utility functions', () => {
  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorageMock);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('hasStoredData should return true for valid non-expired data', () => {
    const key = 'test:has-data';
    const now = Date.now();
    vi.setSystemTime(now);

    const storedData = {
      data: 'test-value',
      timestamp: now,
    };
    localStorageMock.setItem(key, JSON.stringify(storedData));

    expect(hasStoredData(key, 24)).toBe(true);
  });

  it('hasStoredData should return false for expired data', () => {
    const key = 'test:expired-data';
    const now = Date.now();
    const oldTimestamp = now - 25 * 60 * 60 * 1000; // 25 hours ago

    const storedData = {
      data: 'test-value',
      timestamp: oldTimestamp,
    };
    localStorageMock.setItem(key, JSON.stringify(storedData));

    vi.setSystemTime(now);
    expect(hasStoredData(key, 24)).toBe(false);
  });

  it('hasStoredData should return false for non-existent key', () => {
    expect(hasStoredData('non-existent-key', 24)).toBe(false);
  });

  it('getStoredDataAge should return correct age in hours', () => {
    const key = 'test:age';
    const now = Date.now();
    const hoursAgo = 5;
    const timestamp = now - hoursAgo * 60 * 60 * 1000;

    const storedData = {
      data: 'test-value',
      timestamp,
    };
    localStorageMock.setItem(key, JSON.stringify(storedData));

    vi.setSystemTime(now);
    const age = getStoredDataAge(key);
    expect(age).toBeCloseTo(hoursAgo, 1);
  });

  it('getStoredDataAge should return null for non-existent key', () => {
    expect(getStoredDataAge('non-existent-key')).toBeNull();
  });
});

describe('StorageKeys', () => {
  it('should have correct storage keys defined', () => {
    expect(StorageKeys.quoteCalculator).toBe('ath:quote-calculator');
    expect(StorageKeys.furnitureQuote).toBe('ath:furniture-quote');
  });
});
