/**
 * Chart Configuration Tests
 * Tests responsive chart configuration utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getChartConfig,
  reduceDataPoints,
  getChartColors,
  getChartTheme,
  formatAxisLabel,
  getChartContainerStyle,
} from './chartConfig';

describe('Chart Configuration Utilities', () => {
  describe('getChartConfig', () => {
    describe('mobile breakpoint', () => {
      it('should return mobile config for line chart', () => {
        const config = getChartConfig('line', 'mobile');
        expect(config.legendPosition).toBe('bottom');
        expect(config.maxDataPoints).toBe(7); // line chart override
        expect(config.showGrid).toBe(true); // line chart override
        expect(config.fontSize).toBe(11);
      });

      it('should return mobile config for bar chart', () => {
        const config = getChartConfig('bar', 'mobile');
        expect(config.horizontalBars).toBe(true);
        expect(config.maxDataPoints).toBe(5);
      });

      it('should return mobile config for pie chart', () => {
        const config = getChartConfig('pie', 'mobile');
        expect(config.legendPosition).toBe('bottom');
        expect(config.aspectRatio).toBe(1.2);
      });
    });

    describe('tablet breakpoint', () => {
      it('should return tablet config for bar chart', () => {
        const config = getChartConfig('bar', 'tablet');
        expect(config.horizontalBars).toBe(false);
        expect(config.maxDataPoints).toBe(10);
      });

      it('should return tablet config for pie chart', () => {
        const config = getChartConfig('pie', 'tablet');
        expect(config.legendPosition).toBe('bottom');
      });
    });

    describe('desktop breakpoint', () => {
      it('should return desktop config for line chart', () => {
        const config = getChartConfig('line', 'desktop');
        expect(config.legendPosition).toBe('right');
        expect(config.maxDataPoints).toBe(20);
        expect(config.showGrid).toBe(true);
        expect(config.aspectRatio).toBe(2);
      });

      it('should return desktop config for pie chart', () => {
        const config = getChartConfig('pie', 'desktop');
        expect(config.legendPosition).toBe('right');
      });
    });

    it('should always return complete config object', () => {
      const chartTypes = ['line', 'bar', 'pie', 'doughnut', 'area'] as const;
      const breakpoints = ['mobile', 'tablet', 'desktop'] as const;

      chartTypes.forEach((type) => {
        breakpoints.forEach((breakpoint) => {
          const config = getChartConfig(type, breakpoint);

          expect(config.legendPosition).toBeDefined();
          expect(config.showLegend).toBeDefined();
          expect(config.maxDataPoints).toBeDefined();
          expect(config.horizontalBars).toBeDefined();
          expect(config.fontSize).toBeDefined();
          expect(config.padding).toBeDefined();
          expect(config.aspectRatio).toBeDefined();
          expect(config.showGrid).toBeDefined();
          expect(config.tooltip).toBeDefined();
          expect(config.tooltip.enabled).toBeDefined();
          expect(config.tooltip.position).toBeDefined();
        });
      });
    });
  });

  describe('reduceDataPoints', () => {
    it('should return original array if length <= maxPoints', () => {
      const data = [1, 2, 3, 4, 5];
      expect(reduceDataPoints(data, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(reduceDataPoints(data, 10)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should reduce data points when length > maxPoints', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const reduced = reduceDataPoints(data, 5);
      expect(reduced.length).toBeLessThanOrEqual(5);
    });

    it('should sample evenly from the data', () => {
      const data = [1, 2, 3, 4, 5, 6];
      const reduced = reduceDataPoints(data, 3);
      expect(reduced).toContain(1); // First element should be included
    });

    it('should handle empty array', () => {
      expect(reduceDataPoints([], 5)).toEqual([]);
    });

    it('should handle objects', () => {
      const data = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
        { x: 4, y: 40 },
      ];
      const reduced = reduceDataPoints(data, 2);
      expect(reduced.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getChartColors', () => {
    it('should return array of colors', () => {
      const colors = getChartColors();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return valid color strings', () => {
      const colors = getChartColors();
      colors.forEach((color) => {
        expect(typeof color).toBe('string');
        // Should be hex color or valid CSS color
        expect(color.length).toBeGreaterThan(0);
      });
    });

    it('should return at least 5 colors for variety', () => {
      const colors = getChartColors();
      expect(colors.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getChartTheme', () => {
    it('should return theme object with all required properties', () => {
      const theme = getChartTheme();

      expect(theme.backgroundColor).toBeDefined();
      expect(theme.textColor).toBeDefined();
      expect(theme.gridColor).toBeDefined();
      expect(theme.tooltipBackground).toBeDefined();
      expect(theme.tooltipBorder).toBeDefined();
      expect(theme.tooltipText).toBeDefined();
    });

    it('should return string values for all colors', () => {
      const theme = getChartTheme();

      Object.values(theme).forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('formatAxisLabel', () => {
    describe('mobile breakpoint', () => {
      it('should abbreviate month names', () => {
        expect(formatAxisLabel('January', 'mobile')).toBe('Jan');
        expect(formatAxisLabel('February', 'mobile')).toBe('Feb');
        expect(formatAxisLabel('December', 'mobile')).toBe('Dec');
      });

      it('should abbreviate large numbers', () => {
        expect(formatAxisLabel(1000000, 'mobile')).toBe('1.0M');
        expect(formatAxisLabel(1500000, 'mobile')).toBe('1.5M');
        expect(formatAxisLabel(1000, 'mobile')).toBe('1.0K');
        expect(formatAxisLabel(2500, 'mobile')).toBe('2.5K');
      });

      it('should not abbreviate small numbers', () => {
        expect(formatAxisLabel(100, 'mobile')).toBe('100');
        expect(formatAxisLabel(999, 'mobile')).toBe('999');
      });

      it('should return unknown strings as-is', () => {
        expect(formatAxisLabel('Custom Label', 'mobile')).toBe('Custom Label');
      });
    });

    describe('non-mobile breakpoints', () => {
      it('should not abbreviate on tablet', () => {
        expect(formatAxisLabel('January', 'tablet')).toBe('January');
        expect(formatAxisLabel(1000000, 'tablet')).toBe('1000000');
      });

      it('should not abbreviate on desktop', () => {
        expect(formatAxisLabel('January', 'desktop')).toBe('January');
        expect(formatAxisLabel(1000000, 'desktop')).toBe('1000000');
      });
    });
  });

  describe('getChartContainerStyle', () => {
    it('should return style object with width 100%', () => {
      const style = getChartContainerStyle('mobile');
      expect(style.width).toBe('100%');
    });

    it('should include padding based on breakpoint', () => {
      const mobileStyle = getChartContainerStyle('mobile');
      const desktopStyle = getChartContainerStyle('desktop');

      expect(mobileStyle.padding).toBeDefined();
      expect(desktopStyle.padding).toBeDefined();
    });

    it('should include background and border styles', () => {
      const style = getChartContainerStyle('desktop');

      expect(style.backgroundColor).toBeDefined();
      expect(style.borderRadius).toBeDefined();
      expect(style.border).toBeDefined();
    });
  });
});
