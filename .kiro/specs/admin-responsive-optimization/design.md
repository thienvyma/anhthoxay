# Design Document: Admin Responsive Optimization

## Overview

Tài liệu này mô tả thiết kế kỹ thuật cho việc tối ưu responsive của Admin Dashboard. Thay vì fix từng trang riêng lẻ, chúng ta sẽ xây dựng một **Centralized Responsive System** bao gồm:

1. **CSS Variables & Utility Classes** - Breakpoints, spacing, typography dùng chung
2. **useResponsive Hook** - React hook để detect screen size
3. **Responsive Components** - Pre-built components với responsive behavior
4. **Global Stylesheet** - Media queries cho toàn app

### Design Goals

- **Consistency**: Tất cả các trang sử dụng cùng breakpoints và behavior
- **Maintainability**: Chỉ cần sửa 1 chỗ khi cần thay đổi
- **DRY**: Không lặp lại code responsive ở mỗi component
- **Performance**: CSS được cache và reuse
- **Developer Experience**: Dễ sử dụng, ít boilerplate

## Architecture

```
admin/src/
├── styles/
│   ├── responsive.css          # Global responsive utilities
│   └── variables.css           # CSS custom properties
├── hooks/
│   └── useResponsive.ts        # Screen size detection hook
├── components/
│   ├── responsive/
│   │   ├── ResponsiveGrid.tsx
│   │   ├── ResponsiveTable.tsx
│   │   ├── ResponsiveTabs.tsx
│   │   ├── ResponsiveModal.tsx
│   │   ├── ResponsiveStack.tsx
│   │   └── index.ts
│   └── ... (existing components)
└── app/
    └── ... (existing pages - will import responsive utilities)
```

## Components and Interfaces

### 1. CSS Variables (variables.css)

```css
:root {
  /* Breakpoints */
  --breakpoint-mobile: 640px;
  --breakpoint-tablet: 1024px;
  --breakpoint-desktop: 1280px;
  
  /* Responsive Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Responsive Font Sizes */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 28px;
  
  /* Touch Target */
  --touch-target-min: 44px;
}
```

### 2. useResponsive Hook Interface

```typescript
interface ResponsiveState {
  // Current breakpoint
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  
  // Screen dimensions
  width: number;
  height: number;
  
  // Convenience booleans
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Comparison helpers
  isAtLeast: (breakpoint: 'mobile' | 'tablet' | 'desktop') => boolean;
  isAtMost: (breakpoint: 'mobile' | 'tablet' | 'desktop') => boolean;
}

// Breakpoint thresholds
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
} as const;

function useResponsive(): ResponsiveState;
```

### 3. ResponsiveGrid Component Interface

```typescript
interface ResponsiveGridProps {
  children: React.ReactNode;
  
  // Column configuration per breakpoint
  cols?: {
    mobile?: number;   // default: 1
    tablet?: number;   // default: 2
    desktop?: number;  // default: 4
  };
  
  // Gap configuration
  gap?: number | {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  
  // Additional styling
  className?: string;
  style?: React.CSSProperties;
}
```

### 4. ResponsiveTable Component Interface

```typescript
interface ResponsiveTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    // Hide on mobile
    hideOnMobile?: boolean;
    // Priority for mobile card view (lower = more important)
    priority?: number;
  }>;
  
  // Actions column
  actions?: (row: T) => React.ReactNode;
  
  // Mobile card renderer (optional custom)
  renderMobileCard?: (row: T) => React.ReactNode;
  
  // Loading state
  loading?: boolean;
  
  // Empty state
  emptyMessage?: string;
}
```

### 5. ResponsiveTabs Component Interface

```typescript
interface ResponsiveTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: string;
    content: React.ReactNode;
  }>;
  
  activeTab: string;
  onTabChange: (tabId: string) => void;
  
  // Mobile behavior
  mobileMode?: 'scroll' | 'dropdown' | 'accordion';
  
  // Show icons only on mobile
  iconOnlyMobile?: boolean;
}
```

### 6. ResponsiveModal Component Interface

```typescript
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  title: string;
  children: React.ReactNode;
  
  // Footer actions
  footer?: React.ReactNode;
  
  // Size configuration
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  // Full screen on mobile (default: true)
  fullScreenMobile?: boolean;
}
```

### 7. ResponsiveStack Component Interface

```typescript
interface ResponsiveStackProps {
  children: React.ReactNode;
  
  // Direction per breakpoint
  direction?: {
    mobile?: 'row' | 'column';
    tablet?: 'row' | 'column';
    desktop?: 'row' | 'column';
  };
  
  // Gap
  gap?: number;
  
  // Alignment
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  
  // Wrap
  wrap?: boolean;
}
```

## Data Models

### Breakpoint Configuration

```typescript
type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface BreakpointConfig {
  mobile: number;  // 640
  tablet: number;  // 1024
  desktop: number; // 1280
}

// Utility type for per-breakpoint values
type ResponsiveValue<T> = T | {
  mobile?: T;
  tablet?: T;
  desktop?: T;
};
```

### Responsive Utilities

```typescript
// Get value for current breakpoint
function getResponsiveValue<T>(
  value: ResponsiveValue<T>,
  breakpoint: Breakpoint,
  defaultValue: T
): T;

// Calculate grid columns based on width
function getGridColumns(
  width: number,
  config: { mobile?: number; tablet?: number; desktop?: number }
): number;

// Get spacing value based on breakpoint
function getSpacing(
  breakpoint: Breakpoint,
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
): number;

// Get font size based on breakpoint
function getFontSize(
  breakpoint: Breakpoint,
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
): number;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Breakpoint Detection Consistency

*For any* screen width value, the useResponsive hook SHALL return the correct breakpoint according to the defined thresholds:
- width ≤ 640px → 'mobile'
- 641px ≤ width ≤ 1024px → 'tablet'
- width > 1024px → 'desktop'

**Validates: Requirements 2.1, 2.2, 2.3, 11.3**

### Property 2: Grid Column Calculation

*For any* screen width and column configuration, the getGridColumns function SHALL return:
- mobile columns when width ≤ 640px
- tablet columns when 641px ≤ width ≤ 1024px
- desktop columns when width > 1024px

**Validates: Requirements 2.1, 2.2, 2.3, 7.1, 7.2, 12.1**

### Property 3: Responsive Value Resolution

*For any* ResponsiveValue and breakpoint, the getResponsiveValue function SHALL return the value for that breakpoint, or fall back to the next larger breakpoint's value, or the default value.

**Validates: Requirements 11.3, 12.6**

### Property 4: Spacing Scale Consistency

*For any* breakpoint and spacing size, the getSpacing function SHALL return a value that is:
- Smaller on mobile than on desktop for the same size
- Consistent within the same breakpoint

**Validates: Requirements 8.3**

### Property 5: Font Size Scale Consistency

*For any* breakpoint and font size, the getFontSize function SHALL return:
- Minimum 14px for body text (sm size) on all breakpoints
- Proportionally scaled heading sizes

**Validates: Requirements 8.1, 8.2**

### Property 6: Touch Target Minimum Size

*For any* button or interactive element configuration, the calculated dimensions SHALL be at least 44x44 pixels on mobile.

**Validates: Requirements 8.4**

### Property 7: Stack Direction Resolution

*For any* ResponsiveStack configuration and breakpoint, the component SHALL apply the correct flex direction based on the direction prop for that breakpoint.

**Validates: Requirements 12.5**

### Property 8: Chart Configuration Adaptation

*For any* chart type and breakpoint, the chart configuration function SHALL return appropriate settings:
- Legend position: 'bottom' on mobile, 'right' on desktop
- Reduced data points on mobile
- Horizontal bars on mobile for bar charts

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 9: Breakpoint Comparison Helpers

*For any* breakpoint, the isAtLeast and isAtMost helper functions SHALL correctly compare breakpoints:
- isAtLeast('tablet') returns true for tablet and desktop
- isAtMost('tablet') returns true for mobile and tablet

**Validates: Requirements 11.3**

### Property 10: Custom Breakpoint Override

*For any* responsive component with custom breakpoint props, the component SHALL use the custom values instead of defaults.

**Validates: Requirements 12.6**

## Error Handling

### Invalid Breakpoint Values

- If an invalid breakpoint string is provided, fall back to 'desktop'
- Log a warning in development mode

### Missing Responsive Values

- If a ResponsiveValue object is missing a breakpoint, fall back to the next larger breakpoint
- If all breakpoints are missing, use the default value

### Window Resize Handling

- Debounce resize events to prevent excessive re-renders
- Use ResizeObserver for more accurate container-based responsiveness

### SSR Compatibility

- Default to 'desktop' breakpoint during server-side rendering
- Hydrate with actual values on client mount

## Testing Strategy

### Dual Testing Approach

We will use both unit tests and property-based tests:

1. **Unit Tests**: Verify specific examples and edge cases
2. **Property-Based Tests**: Verify universal properties across all inputs

### Property-Based Testing Library

We will use **fast-check** for property-based testing in TypeScript/JavaScript.

### Test Structure

```typescript
// Example property test structure
import fc from 'fast-check';

describe('useResponsive', () => {
  // Property test
  it('should return correct breakpoint for any width', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 3000 }), (width) => {
        const breakpoint = getBreakpoint(width);
        if (width <= 640) return breakpoint === 'mobile';
        if (width <= 1024) return breakpoint === 'tablet';
        return breakpoint === 'desktop';
      })
    );
  });
});
```

### Test Coverage

- All utility functions (getBreakpoint, getGridColumns, getSpacing, etc.)
- Hook behavior with mocked window dimensions
- Component rendering at different breakpoints (integration tests)

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with design document reference

