/**
 * Property-Based Tests for useDebounce and useDebouncedCallback hooks
 * 
 * **Feature: production-scalability, Property 19: Debounce timing**
 * **Validates: Requirements 9.1, 9.2, 9.4**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * **Feature: production-scalability, Property 19: Debounce timing**
   * **Validates: Requirements 9.1, 9.2, 9.4**
   * 
   * Property: For any value and delay, the debounced value should not update
   * until the specified delay has passed since the last value change.
   */
  it('should not update value until delay has passed (property test)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 50, max: 1000 }),
        (value, delay) => {
          const { result, rerender } = renderHook(
            ({ val, del }) => useDebounce(val, del),
            { initialProps: { val: '', del: delay } }
          );

          // Initial value should be empty
          expect(result.current).toBe('');

          // Update value
          rerender({ val: value, del: delay });

          // Value should not have changed yet (before delay)
          expect(result.current).toBe('');

          // Advance time by half the delay
          act(() => {
            vi.advanceTimersByTime(delay / 2);
          });

          // Value should still not have changed
          expect(result.current).toBe('');

          // Advance time to complete the delay
          act(() => {
            vi.advanceTimersByTime(delay / 2 + 1);
          });

          // Now value should be updated
          expect(result.current).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple rapid value changes should only result in one update
   * after the delay from the last change.
   */
  it('should only update once after multiple rapid changes (property test)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 100, max: 500 }),
        (values, delay) => {
          const { result, rerender } = renderHook(
            ({ val, del }) => useDebounce(val, del),
            { initialProps: { val: '', del: delay } }
          );

          // Rapidly change values
          for (const value of values) {
            rerender({ val: value, del: delay });
            // Advance time by less than delay between changes
            act(() => {
              vi.advanceTimersByTime(delay / 2);
            });
          }

          // Value should still be initial (empty) because delay hasn't completed
          expect(result.current).toBe('');

          // Complete the delay
          act(() => {
            vi.advanceTimersByTime(delay + 1);
          });

          // Should have the last value
          expect(result.current).toBe(values[values.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Debounced value should eventually equal the input value
   * after sufficient time has passed.
   */
  it('should eventually equal input value (property test)', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        fc.integer({ min: 50, max: 500 }),
        (value, delay) => {
          const { result, rerender } = renderHook(
            ({ val, del }) => useDebounce(val, del),
            { initialProps: { val: undefined as unknown, del: delay } }
          );

          rerender({ val: value, del: delay });

          // Advance time past the delay
          act(() => {
            vi.advanceTimersByTime(delay + 100);
          });

          // Debounced value should equal input
          expect(result.current).toEqual(value);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * **Feature: production-scalability, Property 19: Debounce timing**
   * **Validates: Requirements 9.1, 9.2, 9.4, 9.5**
   * 
   * Property: Callback should not be called until delay has passed,
   * and isPending should be true while waiting.
   */
  it('should show pending state and delay callback execution (property test)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 100, max: 500 }),
        (value, delay) => {
          const callback = vi.fn();
          const { result } = renderHook(() => useDebouncedCallback(callback, delay));

          const [debouncedFn, isPending] = result.current;

          // Initially not pending
          expect(isPending).toBe(false);

          // Call the debounced function
          act(() => {
            debouncedFn(value);
          });

          // Should be pending now
          expect(result.current[1]).toBe(true);

          // Callback should not have been called yet
          expect(callback).not.toHaveBeenCalled();

          // Advance time by half the delay
          act(() => {
            vi.advanceTimersByTime(delay / 2);
          });

          // Still pending, callback not called
          expect(result.current[1]).toBe(true);
          expect(callback).not.toHaveBeenCalled();

          // Complete the delay
          act(() => {
            vi.advanceTimersByTime(delay / 2 + 1);
          });

          // No longer pending, callback called with correct args
          expect(result.current[1]).toBe(false);
          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple rapid calls should only result in one callback execution
   * with the arguments from the last call.
   */
  it('should only call callback once with last args after rapid calls (property test)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 100, max: 500 }),
        (values, delay) => {
          const callback = vi.fn();
          const { result } = renderHook(() => useDebouncedCallback(callback, delay));

          const [debouncedFn] = result.current;

          // Rapidly call with different values
          for (const value of values) {
            act(() => {
              debouncedFn(value);
            });
            // Small time advance between calls
            act(() => {
              vi.advanceTimersByTime(delay / 4);
            });
          }

          // Callback should not have been called yet
          expect(callback).not.toHaveBeenCalled();

          // Complete the delay
          act(() => {
            vi.advanceTimersByTime(delay + 1);
          });

          // Callback should be called exactly once with the last value
          expect(callback).toHaveBeenCalledTimes(1);
          expect(callback).toHaveBeenCalledWith(values[values.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
