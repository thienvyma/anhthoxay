/**
 * useResponsive Hook Tests
 * Tests screen size detection and breakpoint utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive, getBreakpoint, BREAKPOINTS } from './useResponsive';

describe('useResponsive Hook', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    // Restore original dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    vi.clearAllMocks();
  });

  describe('getBreakpoint utility', () => {
    it('should return mobile for width <= 640', () => {
      expect(getBreakpoint(320)).toBe('mobile');
      expect(getBreakpoint(640)).toBe('mobile');
    });

    it('should return tablet for width > 640 and <= 1024', () => {
      expect(getBreakpoint(641)).toBe('tablet');
      expect(getBreakpoint(768)).toBe('tablet');
      expect(getBreakpoint(1024)).toBe('tablet');
    });

    it('should return desktop for width > 1024', () => {
      expect(getBreakpoint(1025)).toBe('desktop');
      expect(getBreakpoint(1280)).toBe('desktop');
      expect(getBreakpoint(1920)).toBe('desktop');
    });
  });

  describe('BREAKPOINTS constants', () => {
    it('should have correct breakpoint values', () => {
      expect(BREAKPOINTS.mobile).toBe(640);
      expect(BREAKPOINTS.tablet).toBe(1024);
      expect(BREAKPOINTS.desktop).toBe(1280);
    });
  });

  describe('hook initialization', () => {
    it('should return current window dimensions', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      Object.defineProperty(window, 'innerHeight', { value: 768 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);
    });

    it('should detect desktop breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe('desktop');
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMobile).toBe(false);
    });

    it('should detect tablet breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe('tablet');
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isMobile).toBe(false);
    });

    it('should detect mobile breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe('mobile');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });
  });

  describe('isAtLeast helper', () => {
    it('should return true when at or above breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280 });
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isAtLeast('mobile')).toBe(true);
      expect(result.current.isAtLeast('tablet')).toBe(true);
      expect(result.current.isAtLeast('desktop')).toBe(true);
    });

    it('should return false when below breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isAtLeast('mobile')).toBe(true);
      expect(result.current.isAtLeast('tablet')).toBe(false);
      expect(result.current.isAtLeast('desktop')).toBe(false);
    });

    it('should work correctly for tablet', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isAtLeast('mobile')).toBe(true);
      expect(result.current.isAtLeast('tablet')).toBe(true);
      expect(result.current.isAtLeast('desktop')).toBe(false);
    });
  });

  describe('isAtMost helper', () => {
    it('should return true when at or below breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isAtMost('mobile')).toBe(true);
      expect(result.current.isAtMost('tablet')).toBe(true);
      expect(result.current.isAtMost('desktop')).toBe(true);
    });

    it('should return false when above breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280 });
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isAtMost('mobile')).toBe(false);
      expect(result.current.isAtMost('tablet')).toBe(false);
      expect(result.current.isAtMost('desktop')).toBe(true);
    });

    it('should work correctly for tablet', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isAtMost('mobile')).toBe(false);
      expect(result.current.isAtMost('tablet')).toBe(true);
      expect(result.current.isAtMost('desktop')).toBe(true);
    });
  });

  describe('resize handling', () => {
    it('should update on window resize', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1280 });
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe('desktop');

      // Simulate resize to mobile
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', { value: 375 });
        window.dispatchEvent(new Event('resize'));
        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.breakpoint).toBe('mobile');
    });

    it('should cleanup resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useResponsive());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });
  });
});
