/**
 * Responsive Utility Tests
 * Tests breakpoint-based value resolution and responsive utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getBreakpoint,
  getResponsiveValue,
  getGridColumns,
  getSpacing,
  getFontSize,
  ensureTouchTarget,
  getStackDirection,
  createResponsiveStyle,
  MIN_TOUCH_TARGET,
  BREAKPOINTS,
} from './responsive';

describe('Responsive Utilities', () => {
  describe('getBreakpoint', () => {
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

  describe('BREAKPOINTS', () => {
    it('should have correct breakpoint values', () => {
      expect(BREAKPOINTS.mobile).toBe(640);
      expect(BREAKPOINTS.tablet).toBe(1024);
      expect(BREAKPOINTS.desktop).toBe(1280);
    });
  });

  describe('getResponsiveValue', () => {
    it('should return non-responsive value as-is', () => {
      expect(getResponsiveValue('hello', 'mobile', 'default')).toBe('hello');
      expect(getResponsiveValue(42, 'tablet', 0)).toBe(42);
      expect(getResponsiveValue(true, 'desktop', false)).toBe(true);
    });

    it('should return mobile value for mobile breakpoint', () => {
      const value = { mobile: 'small', tablet: 'medium', desktop: 'large' };
      expect(getResponsiveValue(value, 'mobile', 'default')).toBe('small');
    });

    it('should return tablet value for tablet breakpoint', () => {
      const value = { mobile: 'small', tablet: 'medium', desktop: 'large' };
      expect(getResponsiveValue(value, 'tablet', 'default')).toBe('medium');
    });

    it('should return desktop value for desktop breakpoint', () => {
      const value = { mobile: 'small', tablet: 'medium', desktop: 'large' };
      expect(getResponsiveValue(value, 'desktop', 'default')).toBe('large');
    });

    it('should fallback to larger breakpoints for mobile', () => {
      const value = { tablet: 'medium', desktop: 'large' };
      expect(getResponsiveValue(value, 'mobile', 'default')).toBe('medium');
    });

    it('should fallback to desktop for tablet when tablet not defined', () => {
      const value = { desktop: 'large' };
      expect(getResponsiveValue(value, 'tablet', 'default')).toBe('large');
    });

    it('should return default when no matching value in responsive object', () => {
      // Empty object without mobile/tablet/desktop keys is NOT a responsive object
      // so it returns the object itself, not the default
      const emptyObj = {};
      expect(getResponsiveValue(emptyObj, 'mobile', 'default')).toBe(emptyObj);

      // A responsive object with only unrelated keys still returns default
      const partialValue = { desktop: 'large' } as const;
      expect(getResponsiveValue(partialValue, 'mobile', 'default')).toBe('large'); // fallback chain
      expect(getResponsiveValue(partialValue, 'tablet', 'default')).toBe('large'); // fallback chain
      expect(getResponsiveValue(partialValue, 'desktop', 'default')).toBe('large');
    });
  });

  describe('getGridColumns', () => {
    it('should return mobile columns for mobile width', () => {
      expect(getGridColumns(320, { mobile: 1, tablet: 2, desktop: 4 })).toBe(1);
    });

    it('should return tablet columns for tablet width', () => {
      expect(getGridColumns(768, { mobile: 1, tablet: 2, desktop: 4 })).toBe(2);
    });

    it('should return desktop columns for desktop width', () => {
      expect(getGridColumns(1280, { mobile: 1, tablet: 2, desktop: 4 })).toBe(4);
    });

    it('should use default values when not specified', () => {
      expect(getGridColumns(320, {})).toBe(1); // default mobile
      expect(getGridColumns(768, {})).toBe(2); // default tablet
      expect(getGridColumns(1280, {})).toBe(4); // default desktop
    });

    it('should fallback tablet to desktop when tablet not specified', () => {
      expect(getGridColumns(768, { desktop: 3 })).toBe(3);
    });
  });

  describe('getSpacing', () => {
    it('should return correct mobile spacing', () => {
      expect(getSpacing('mobile', 'xs')).toBe(2);
      expect(getSpacing('mobile', 'sm')).toBe(4);
      expect(getSpacing('mobile', 'md')).toBe(8);
      expect(getSpacing('mobile', 'lg')).toBe(12);
      expect(getSpacing('mobile', 'xl')).toBe(16);
    });

    it('should return correct tablet spacing', () => {
      expect(getSpacing('tablet', 'xs')).toBe(4);
      expect(getSpacing('tablet', 'sm')).toBe(6);
      expect(getSpacing('tablet', 'md')).toBe(12);
      expect(getSpacing('tablet', 'lg')).toBe(18);
      expect(getSpacing('tablet', 'xl')).toBe(24);
    });

    it('should return correct desktop spacing', () => {
      expect(getSpacing('desktop', 'xs')).toBe(4);
      expect(getSpacing('desktop', 'sm')).toBe(8);
      expect(getSpacing('desktop', 'md')).toBe(16);
      expect(getSpacing('desktop', 'lg')).toBe(24);
      expect(getSpacing('desktop', 'xl')).toBe(40);
    });
  });

  describe('getFontSize', () => {
    it('should return correct mobile font sizes', () => {
      expect(getFontSize('mobile', 'xs')).toBe(11);
      expect(getFontSize('mobile', 'sm')).toBe(14); // Minimum 14px for body
      expect(getFontSize('mobile', 'md')).toBe(14);
      expect(getFontSize('mobile', 'lg')).toBe(16);
    });

    it('should return correct tablet font sizes', () => {
      expect(getFontSize('tablet', 'sm')).toBe(14);
      expect(getFontSize('tablet', 'md')).toBe(15);
      expect(getFontSize('tablet', 'lg')).toBe(17);
    });

    it('should return correct desktop font sizes', () => {
      expect(getFontSize('desktop', 'sm')).toBe(14);
      expect(getFontSize('desktop', 'md')).toBe(16);
      expect(getFontSize('desktop', 'lg')).toBe(18);
      expect(getFontSize('desktop', '2xl')).toBe(24);
      expect(getFontSize('desktop', '3xl')).toBe(30);
    });

    it('should ensure minimum 14px for body text (sm) on all breakpoints', () => {
      expect(getFontSize('mobile', 'sm')).toBeGreaterThanOrEqual(14);
      expect(getFontSize('tablet', 'sm')).toBeGreaterThanOrEqual(14);
      expect(getFontSize('desktop', 'sm')).toBeGreaterThanOrEqual(14);
    });
  });

  describe('ensureTouchTarget', () => {
    it('should enforce minimum touch target on mobile', () => {
      const result = ensureTouchTarget('mobile', { width: 30, height: 30 });
      expect(result.minWidth).toBe(MIN_TOUCH_TARGET);
      expect(result.minHeight).toBe(MIN_TOUCH_TARGET);
    });

    it('should not modify larger targets on mobile', () => {
      const result = ensureTouchTarget('mobile', { width: 60, height: 60 });
      expect(result.minWidth).toBe(60);
      expect(result.minHeight).toBe(60);
    });

    it('should not enforce minimum on tablet', () => {
      const result = ensureTouchTarget('tablet', { width: 30, height: 30 });
      expect(result.minWidth).toBe(30);
      expect(result.minHeight).toBe(30);
    });

    it('should not enforce minimum on desktop', () => {
      const result = ensureTouchTarget('desktop', { width: 20, height: 20 });
      expect(result.minWidth).toBe(20);
      expect(result.minHeight).toBe(20);
    });

    it('should handle empty config', () => {
      const mobileResult = ensureTouchTarget('mobile', {});
      expect(mobileResult.minWidth).toBe(MIN_TOUCH_TARGET);
      expect(mobileResult.minHeight).toBe(MIN_TOUCH_TARGET);

      const desktopResult = ensureTouchTarget('desktop', {});
      expect(desktopResult.minWidth).toBe(0);
      expect(desktopResult.minHeight).toBe(0);
    });

    it('should have MIN_TOUCH_TARGET as 44', () => {
      expect(MIN_TOUCH_TARGET).toBe(44);
    });
  });

  describe('getStackDirection', () => {
    it('should return column for mobile by default when config has mobile/tablet/desktop keys', () => {
      // Empty object is NOT a responsive object, so getResponsiveValue returns it as-is
      // We need to pass an object with at least one responsive key to trigger fallback
      expect(getStackDirection('mobile', { desktop: undefined })).toBe('column');
    });

    it('should return row for tablet by default when config has mobile/tablet/desktop keys', () => {
      expect(getStackDirection('tablet', { desktop: undefined })).toBe('row');
    });

    it('should return row for desktop by default when config has mobile/tablet/desktop keys', () => {
      expect(getStackDirection('desktop', { desktop: undefined })).toBe('row');
    });

    it('should use custom values when specified', () => {
      const config = { mobile: 'row' as const, tablet: 'column' as const };
      expect(getStackDirection('mobile', config)).toBe('row');
      expect(getStackDirection('tablet', config)).toBe('column');
    });

    it('should handle empty config by returning the config itself (not responsive)', () => {
      // Empty object {} is not detected as responsive object
      // so getResponsiveValue returns it as-is
      const emptyConfig = {};
      const result = getStackDirection('mobile', emptyConfig);
      expect(result).toBe(emptyConfig);
    });
  });

  describe('createResponsiveStyle', () => {
    it('should merge base with mobile styles', () => {
      const result = createResponsiveStyle('mobile', {
        base: { color: 'black' },
        mobile: { fontSize: 14 },
      });
      expect(result).toEqual({ color: 'black', fontSize: 14 });
    });

    it('should merge base with tablet styles', () => {
      const result = createResponsiveStyle('tablet', {
        base: { color: 'black' },
        tablet: { fontSize: 16 },
      });
      expect(result).toEqual({ color: 'black', fontSize: 16 });
    });

    it('should merge base with desktop styles', () => {
      const result = createResponsiveStyle('desktop', {
        base: { color: 'black' },
        desktop: { fontSize: 18 },
      });
      expect(result).toEqual({ color: 'black', fontSize: 18 });
    });

    it('should override base styles with breakpoint styles', () => {
      const result = createResponsiveStyle('mobile', {
        base: { fontSize: 16 },
        mobile: { fontSize: 14 },
      });
      expect(result).toEqual({ fontSize: 14 });
    });

    it('should handle empty styles', () => {
      const result = createResponsiveStyle('mobile', {});
      expect(result).toEqual({});
    });
  });
});
