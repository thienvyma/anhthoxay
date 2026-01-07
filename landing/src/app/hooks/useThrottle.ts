import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useThrottle - Throttles a value with configurable interval
 * 
 * Returns the throttled value that updates at most once per interval.
 * Unlike debounce, throttle ensures the value updates periodically
 * even during continuous changes.
 * 
 * @param value - The value to throttle
 * @param interval - Minimum interval between updates in milliseconds (default: 100ms)
 * @returns The throttled value
 * 
 * @example
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 100);
 * 
 * useEffect(() => {
 *   // This runs at most every 100ms during scroll
 *   updateScrollIndicator(throttledScrollY);
 * }, [throttledScrollY]);
 */
export function useThrottle<T>(value: T, interval = 100): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      // Enough time has passed, update immediately
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      // Schedule update for remaining time
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
        timeoutRef.current = null;
      }, interval - timeSinceLastUpdate);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, interval]);

  return throttledValue;
}

/**
 * useThrottledCallback - Throttles a callback function
 * 
 * Returns a throttled version of the callback that executes at most
 * once per interval. Useful for scroll, resize, and mousemove handlers.
 * 
 * @param callback - The callback function to throttle
 * @param interval - Minimum interval between calls in milliseconds (default: 100ms)
 * @returns The throttled callback function
 * 
 * @example
 * const handleScroll = useThrottledCallback(
 *   () => updateScrollPosition(window.scrollY),
 *   100
 * );
 * 
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  interval = 100
): (...args: Parameters<T>) => void {
  const lastCalledRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCalledRef.current;

      if (timeSinceLastCall >= interval) {
        // Enough time has passed, call immediately
        lastCalledRef.current = now;
        callbackRef.current(...args);
      } else {
        // Store args and schedule for later
        pendingArgsRef.current = args;

        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            lastCalledRef.current = Date.now();
            if (pendingArgsRef.current) {
              callbackRef.current(...pendingArgsRef.current);
              pendingArgsRef.current = null;
            }
            timeoutRef.current = null;
          }, interval - timeSinceLastCall);
        }
      }
    },
    [interval]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

export default useThrottle;
