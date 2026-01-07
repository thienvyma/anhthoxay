import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Storage keys for quote forms
 * 
 * **Feature: production-scalability**
 * **Validates: Requirements 10.1, 10.2**
 */
export const StorageKeys = {
  quoteCalculator: 'ath:quote-calculator',
  furnitureQuote: 'ath:furniture-quote',
} as const;

/**
 * Default TTL in hours (24 hours)
 */
const DEFAULT_TTL_HOURS = 24;

/**
 * Interface for stored data with timestamp
 */
interface StoredData<T> {
  data: T;
  timestamp: number;
}

/**
 * Options for useLocalStoragePersistence hook
 */
export interface PersistenceOptions {
  /** Storage key for localStorage */
  key: string;
  /** Time-to-live in hours (default: 24) */
  ttlHours?: number;
  /** Callback when data is restored from storage */
  onRestore?: () => void;
}

/**
 * useLocalStoragePersistence - Persists state to localStorage with TTL
 * 
 * Automatically saves state changes to localStorage and restores them
 * on page load. Supports TTL-based expiration.
 * 
 * **Feature: production-scalability**
 * **Validates: Requirements 10.1, 10.2, 10.4**
 * 
 * @param initialValue - Initial value if no stored data exists
 * @param options - Configuration options
 * @returns Tuple of [value, setValue, clearValue, wasRestored]
 * 
 * @example
 * const [formState, setFormState, clearFormState, wasRestored] = useLocalStoragePersistence(
 *   { category: null, area: 0 },
 *   { 
 *     key: StorageKeys.quoteCalculator,
 *     ttlHours: 24,
 *     onRestore: () => toast.info('Đã khôi phục tiến trình trước đó')
 *   }
 * );
 */
export function useLocalStoragePersistence<T>(
  initialValue: T,
  options: PersistenceOptions
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const { key, ttlHours = DEFAULT_TTL_HOURS, onRestore } = options;
  
  // Track if data was restored from storage
  const wasRestoredRef = useRef(false);
  const onRestoreCalledRef = useRef(false);
  
  // Initialize state from localStorage or use initial value
  const [value, setValueInternal] = useState<T>(() => {
    // Skip localStorage in SSR
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return initialValue;
      }
      
      const parsed: StoredData<T> = JSON.parse(stored);
      const ageHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
      
      // Check if data has expired (Requirement 10.4)
      if (ageHours > ttlHours) {
        localStorage.removeItem(key);
        return initialValue;
      }
      
      // Mark as restored
      wasRestoredRef.current = true;
      
      return parsed.data;
    } catch {
      // If parsing fails, return initial value
      return initialValue;
    }
  });

  // Call onRestore callback after mount if data was restored (Requirement 10.6)
  useEffect(() => {
    if (wasRestoredRef.current && onRestore && !onRestoreCalledRef.current) {
      onRestoreCalledRef.current = true;
      // Delay to ensure component is fully mounted
      const timeoutId = setTimeout(onRestore, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [onRestore]);

  // Persist value to localStorage (Requirement 10.1)
  const persistValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValueInternal((prev) => {
      const resolvedValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev) 
        : newValue;
      
      // Skip localStorage in SSR
      if (typeof window !== 'undefined') {
        try {
          const stored: StoredData<T> = {
            data: resolvedValue,
            timestamp: Date.now(),
          };
          localStorage.setItem(key, JSON.stringify(stored));
        } catch (error) {
          // Handle quota exceeded or other storage errors silently
          console.warn('Failed to persist to localStorage:', error);
        }
      }
      
      return resolvedValue;
    });
  }, [key]);

  // Clear value from localStorage (Requirement 10.3, 10.5)
  const clearValue = useCallback(() => {
    setValueInternal(initialValue);
    wasRestoredRef.current = false;
    
    // Skip localStorage in SSR
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }, [key, initialValue]);

  return [value, persistValue, clearValue, wasRestoredRef.current];
}

/**
 * Check if stored data exists and is not expired
 * Utility function for checking storage state without loading data
 * 
 * @param key - Storage key to check
 * @param ttlHours - TTL in hours (default: 24)
 * @returns true if valid data exists
 */
export function hasStoredData(key: string, ttlHours = DEFAULT_TTL_HOURS): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return false;
    }
    
    const parsed = JSON.parse(stored);
    const ageHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
    
    return ageHours <= ttlHours;
  } catch {
    return false;
  }
}

/**
 * Get the age of stored data in hours
 * 
 * @param key - Storage key to check
 * @returns Age in hours, or null if no data exists
 */
export function getStoredDataAge(key: string): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }
    
    const parsed = JSON.parse(stored);
    return (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
  } catch {
    return null;
  }
}

export default useLocalStoragePersistence;
