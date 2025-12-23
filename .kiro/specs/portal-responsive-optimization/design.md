# Design Document: Portal Responsive Optimization

## Overview

Tối ưu hóa responsive cho Portal app bằng cách copy và điều chỉnh các responsive components đã được phát triển cho Admin app. Mục tiêu là đảm bảo trải nghiệm người dùng tốt trên mobile, tablet và desktop cho cả Homeowner và Contractor.

**Approach**: Copy responsive components từ `admin/src/components/responsive/` sang `portal/src/components/responsive/` với các điều chỉnh phù hợp cho Portal context.

## Architecture

```
portal/src/
├── components/
│   └── responsive/           # NEW - Copy từ Admin
│       ├── index.ts          # Centralized exports
│       ├── ResponsiveTable.tsx
│       ├── ResponsiveModal.tsx
│       ├── ResponsiveFilters.tsx
│       ├── ResponsiveTabs.tsx
│       ├── ResponsivePageHeader.tsx
│       └── ResponsiveActionBar.tsx
├── hooks/
│   └── useResponsive.ts      # EXISTING - Đã có, cần enhance
├── utils/
│   └── responsive.ts         # NEW - Copy utility functions
└── styles/
    └── responsive.css        # EXISTING - Cần update
```

## Components and Interfaces

### 1. ResponsiveTable

Copy từ Admin với interface:

```typescript
interface TableColumn<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  hideOnMobile?: boolean;
  priority?: number;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: (row: T) => React.ReactNode;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  getRowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
}
```

### 2. ResponsiveModal

Copy từ Admin với interface:

```typescript
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fullScreenMobile?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}
```

### 3. ResponsiveFilters

Copy từ Admin với interface:

```typescript
interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'search' | 'date' | 'custom';
  options?: Array<{ value: string; label: string }>;
  value: string;
  placeholder?: string;
  render?: (value: string, onChange: (value: string) => void) => React.ReactNode;
}

interface ResponsiveFiltersProps {
  filters: FilterOption[];
  onFilterChange: (filterId: string, value: string) => void;
  onClearAll?: () => void;
  showActiveCount?: boolean;
  collapsibleMobile?: boolean;
}
```

### 4. ResponsiveTabs

Copy từ Admin với interface:

```typescript
interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: number | string;
  disabled?: boolean;
}

interface ResponsiveTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}
```

### 5. Utility Functions

Copy từ `admin/src/utils/responsive.ts`:

```typescript
// Responsive value resolution
function getResponsiveValue<T>(
  value: ResponsiveValue<T>,
  breakpoint: Breakpoint,
  defaultValue: T
): T;

// Grid columns calculation
function getGridColumns(width: number, config: GridColumnConfig): number;

// Spacing based on breakpoint
function getSpacing(breakpoint: Breakpoint, size: SpacingSize): number;

// Font size based on breakpoint
function getFontSize(breakpoint: Breakpoint, size: FontSize): number;

// Touch target enforcement
function ensureTouchTarget(
  breakpoint: Breakpoint,
  config: TouchTargetConfig
): { minWidth: number; minHeight: number };
```

## Data Models

Không có data models mới - sử dụng existing models từ Portal.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Table renders cards on mobile
*For any* data array and column configuration, when breakpoint is mobile, ResponsiveTable SHALL render card layout instead of table rows.
**Validates: Requirements 1.1, 1.2, 2.1**

### Property 2: Touch targets meet minimum size
*For any* interactive element on mobile breakpoint, the element SHALL have minimum dimensions of 44x44 pixels.
**Validates: Requirements 1.4**

### Property 3: Modal full-screen on mobile
*For any* modal with fullScreenMobile=true, when breakpoint is mobile, the modal SHALL render with 100% width and height.
**Validates: Requirements 3.1**

### Property 4: Modal buttons stack vertically on mobile
*For any* modal with footer buttons, when breakpoint is mobile, buttons SHALL render in column direction.
**Validates: Requirements 3.3**

### Property 5: Filters collapse on mobile
*For any* filter configuration with collapsibleMobile=true, when breakpoint is mobile, filters SHALL render as collapsible panel.
**Validates: Requirements 4.1, 4.2**

### Property 6: Filter badge shows active count
*For any* filter configuration with active filters, the badge count SHALL equal the number of non-empty filter values.
**Validates: Requirements 4.3**

### Property 7: Tabs enable horizontal scroll on mobile
*For any* tabs configuration, when breakpoint is mobile and tabs exceed container width, horizontal scrolling SHALL be enabled.
**Validates: Requirements 5.1**

### Property 8: Responsive utility returns correct values
*For any* breakpoint and responsive value configuration, getResponsiveValue SHALL return the value for current breakpoint with fallback to larger breakpoints.
**Validates: Requirements 6.2**

## Error Handling

- Components gracefully handle empty data arrays
- Loading states show skeleton placeholders
- Missing optional props use sensible defaults
- Invalid breakpoint values fallback to desktop

## Testing Strategy

### Property-Based Testing

Sử dụng **fast-check** library cho property-based testing.

**Test Configuration:**
- Minimum 100 iterations per property
- Tag format: `**Feature: portal-responsive-optimization, Property {number}: {property_text}**`

### Unit Tests

- Test component rendering at each breakpoint
- Test event handlers (click, escape, overlay click)
- Test prop variations

### Integration Tests (Optional)

- Test responsive behavior with actual viewport changes
- Test navigation flows on mobile
