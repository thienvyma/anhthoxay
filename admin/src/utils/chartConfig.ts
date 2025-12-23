/**
 * Responsive Chart Configuration Utilities
 * Configure charts based on screen size
 *
 * Requirements: 9.1, 9.2, 9.3
 */

import { Breakpoint } from './responsive';
import { tokens } from '@app/shared';

/**
 * Chart types supported
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area';

/**
 * Legend position
 */
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Chart configuration interface
 */
export interface ChartConfig {
  /** Legend position */
  legendPosition: LegendPosition;

  /** Show legend */
  showLegend: boolean;

  /** Maximum data points to display */
  maxDataPoints: number;

  /** Use horizontal bars (for bar charts) */
  horizontalBars: boolean;

  /** Font size for labels */
  fontSize: number;

  /** Padding around chart */
  padding: number;

  /** Aspect ratio (width/height) */
  aspectRatio: number;

  /** Show grid lines */
  showGrid: boolean;

  /** Tooltip configuration */
  tooltip: {
    enabled: boolean;
    position: 'nearest' | 'average';
  };
}

/**
 * Default chart configurations per breakpoint
 */
const CHART_CONFIGS: Record<Breakpoint, Partial<ChartConfig>> = {
  mobile: {
    legendPosition: 'bottom',
    showLegend: true,
    maxDataPoints: 6,
    horizontalBars: true,
    fontSize: 11,
    padding: 8,
    aspectRatio: 1,
    showGrid: false,
    tooltip: {
      enabled: true,
      position: 'nearest',
    },
  },
  tablet: {
    legendPosition: 'bottom',
    showLegend: true,
    maxDataPoints: 10,
    horizontalBars: false,
    fontSize: 12,
    padding: 12,
    aspectRatio: 1.5,
    showGrid: true,
    tooltip: {
      enabled: true,
      position: 'nearest',
    },
  },
  desktop: {
    legendPosition: 'right',
    showLegend: true,
    maxDataPoints: 20,
    horizontalBars: false,
    fontSize: 12,
    padding: 16,
    aspectRatio: 2,
    showGrid: true,
    tooltip: {
      enabled: true,
      position: 'average',
    },
  },
};

/**
 * Chart type specific overrides
 */
const CHART_TYPE_OVERRIDES: Record<ChartType, Partial<Record<Breakpoint, Partial<ChartConfig>>>> = {
  line: {
    mobile: {
      maxDataPoints: 7,
      showGrid: true,
    },
  },
  bar: {
    mobile: {
      horizontalBars: true,
      maxDataPoints: 5,
    },
    tablet: {
      horizontalBars: false,
    },
  },
  pie: {
    mobile: {
      legendPosition: 'bottom',
      aspectRatio: 1.2,
    },
    tablet: {
      legendPosition: 'bottom',
    },
    desktop: {
      legendPosition: 'right',
    },
  },
  doughnut: {
    mobile: {
      legendPosition: 'bottom',
      aspectRatio: 1.2,
    },
    tablet: {
      legendPosition: 'bottom',
    },
    desktop: {
      legendPosition: 'right',
    },
  },
  area: {
    mobile: {
      maxDataPoints: 7,
      showGrid: true,
    },
  },
};

/**
 * Get chart configuration based on type and breakpoint
 *
 * Property 8: Chart Configuration Adaptation
 *
 * @example
 * const config = getChartConfig('bar', 'mobile');
 * // Returns: { legendPosition: 'bottom', horizontalBars: true, ... }
 */
export function getChartConfig(
  type: ChartType,
  breakpoint: Breakpoint
): ChartConfig {
  // Start with base config for breakpoint
  const baseConfig = CHART_CONFIGS[breakpoint];

  // Apply chart type specific overrides
  const typeOverrides = CHART_TYPE_OVERRIDES[type]?.[breakpoint] ?? {};

  // Merge configs
  return {
    legendPosition: typeOverrides.legendPosition ?? baseConfig.legendPosition ?? 'bottom',
    showLegend: typeOverrides.showLegend ?? baseConfig.showLegend ?? true,
    maxDataPoints: typeOverrides.maxDataPoints ?? baseConfig.maxDataPoints ?? 10,
    horizontalBars: typeOverrides.horizontalBars ?? baseConfig.horizontalBars ?? false,
    fontSize: typeOverrides.fontSize ?? baseConfig.fontSize ?? 12,
    padding: typeOverrides.padding ?? baseConfig.padding ?? 16,
    aspectRatio: typeOverrides.aspectRatio ?? baseConfig.aspectRatio ?? 2,
    showGrid: typeOverrides.showGrid ?? baseConfig.showGrid ?? true,
    tooltip: typeOverrides.tooltip ?? baseConfig.tooltip ?? {
      enabled: true,
      position: 'nearest',
    },
  };
}

/**
 * Reduce data points for mobile display
 *
 * @example
 * const reducedData = reduceDataPoints(data, 6);
 */
export function reduceDataPoints<T>(data: T[], maxPoints: number): T[] {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0).slice(0, maxPoints);
}

/**
 * Get chart colors from tokens
 */
export function getChartColors(): string[] {
  return [
    tokens.color.primary,
    tokens.color.secondary,
    tokens.color.accent,
    tokens.color.info,
    tokens.color.success,
    tokens.color.warning,
    tokens.color.error,
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
  ];
}

/**
 * Get chart theme based on tokens
 */
export function getChartTheme() {
  return {
    backgroundColor: tokens.color.surface,
    textColor: tokens.color.text,
    gridColor: tokens.color.border,
    tooltipBackground: tokens.color.background,
    tooltipBorder: tokens.color.border,
    tooltipText: tokens.color.text,
  };
}

/**
 * Format axis labels for mobile (abbreviated)
 *
 * @example
 * formatAxisLabel('January', 'mobile') // 'Jan'
 * formatAxisLabel('1000000', 'mobile') // '1M'
 */
export function formatAxisLabel(
  value: string | number,
  breakpoint: Breakpoint
): string {
  if (breakpoint !== 'mobile') return String(value);

  // Abbreviate month names
  const monthAbbreviations: Record<string, string> = {
    January: 'Jan',
    February: 'Feb',
    March: 'Mar',
    April: 'Apr',
    May: 'May',
    June: 'Jun',
    July: 'Jul',
    August: 'Aug',
    September: 'Sep',
    October: 'Oct',
    November: 'Nov',
    December: 'Dec',
  };

  if (typeof value === 'string' && monthAbbreviations[value]) {
    return monthAbbreviations[value];
  }

  // Abbreviate large numbers
  if (typeof value === 'number') {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
  }

  return String(value);
}

/**
 * Get responsive chart container style
 */
export function getChartContainerStyle(breakpoint: Breakpoint): React.CSSProperties {
  const config = getChartConfig('line', breakpoint);

  return {
    width: '100%',
    padding: `${config.padding}px`,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    border: `1px solid ${tokens.color.border}`,
  };
}
