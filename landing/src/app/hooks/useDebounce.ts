import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce - Debounces a value with configurable delay
 * 
 * Returns the debounced value that only updates after the specified
 * delay has passed since the last value change.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // This only runs 500ms after user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Debounces a callback function with pending state
 * 
 * Returns a debounced version of the callback and a boolean indicating
 * whether a debounced call is pending.
 * 
 * @param callback - The callback function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Tuple of [debouncedCallback, isPending]
 * 
 * @example
 * const [handleSearch, isPending] = useDebouncedCallback(
 *   (query: string) => fetchResults(query),
 *   500
 * );
 * 
 * return (
 *   <>
 *     <input onChange={(e) => handleSearch(e.target.value)} />
 *     {isPending && <Spinner />}
 *   </>
 * );
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay = 300
): [(...args: Parameters<T>) => void, boolean] {
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      setIsPending(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        setIsPending(false);
        timeoutRef.current = null;
      }, delay);
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, isPending];
}

export default useDebounce;
