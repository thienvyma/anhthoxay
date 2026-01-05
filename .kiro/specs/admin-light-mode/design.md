# Design Document: Admin Light Mode

## Overview

Chuyển đổi Admin Dashboard từ Dark Mode sang Light Mode hoàn toàn. Thiết kế này tập trung vào việc tạo giao diện sáng, clean, chuyên nghiệp với hệ thống tokens riêng cho admin app, đảm bảo không ảnh hưởng đến các apps khác trong monorepo (landing, portal).

### Design Goals
1. **Clean & Professional**: Giao diện sáng, dễ đọc, giảm mỏi mắt
2. **Consistent**: Sử dụng tokens thống nhất, loại bỏ hardcode colors
3. **Maintainable**: Tách admin tokens riêng, dễ bảo trì
4. **Accessible**: Đảm bảo contrast ratio theo WCAG AA

## Architecture

### Token Architecture

```
packages/shared/src/
├── index.ts              # Re-exports, giữ nguyên tokens cho landing/portal
├── tokens.ts             # Dark mode tokens (existing) - cho landing/portal
└── adminTokens.ts        # NEW: Light mode tokens cho admin app

admin/src/
├── styles/
│   ├── variables.css     # CSS variables - cập nhật cho light mode
│   ├── responsive.css    # Giữ nguyên
│   └── admin-theme.css   # NEW: Admin-specific theme overrides
└── styles.css            # Global styles - cập nhật cho light mode
```

### Import Strategy

```typescript
// Landing/Portal - giữ nguyên dark mode
import { tokens } from '@app/shared';

// Admin - sử dụng admin tokens
import { adminTokens } from '@app/shared';
// hoặc alias trong admin app
import { tokens } from '../theme'; // re-export adminTokens as tokens
```

## Components and Interfaces

### Admin Tokens Interface

```typescript
// packages/shared/src/adminTokens.ts
export const adminTokens = {
  color: {
    // Backgrounds - Light mode
    background: '#F8F9FA',      // Main page background
    surface: '#FFFFFF',         // Cards, modals, sidebar
    surfaceHover: '#F3F4F6',    // Hover states
    surfaceAlt: '#F9FAFB',      // Nested cards, subtle backgrounds
    
    // Brand - Adjusted for light mode
    primary: '#F5D393',         // Gold - for buttons, accents
    primaryDark: '#B8860B',     // Darker gold - for text on light bg
    secondary: '#C7A775',       // Secondary gold
    accent: '#EFB679',          // Accent orange
    
    // Text - Dark for light backgrounds
    text: '#1A1A1D',            // Primary text
    textMuted: '#6B7280',       // Secondary text
    muted: '#9CA3AF',           // Muted/placeholder text
    
    // Borders - Visible but subtle
    border: '#E5E7EB',          // Default border
    borderHover: '#D1D5DB',     // Hover border
    borderLight: '#F3F4F6',     // Very light border
    
    // Inputs
    inputBg: '#FFFFFF',         // Input background
    inputBorder: '#D1D5DB',     // Input border
    inputFocus: '#F5D393',      // Input focus border
    
    // Status - Same as dark mode
    success: '#10B981',         // Green
    warning: '#F59E0B',         // Amber
    error: '#EF4444',           // Red
    info: '#3B82F6',            // Blue
    
    // Status backgrounds (light tints)
    successBg: '#ECFDF5',
    warningBg: '#FFFBEB',
    errorBg: '#FEF2F2',
    infoBg: '#EFF6FF',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  // font, space, radius, shadow, motion, zIndex - giữ nguyên từ tokens
} as const;
```

### Component Updates Required

| Component | File | Changes |
|-----------|------|---------|
| Layout | `Layout.tsx` | Sidebar, header backgrounds |
| Card | `Card.tsx` | Surface color, border |
| Button | `Button.tsx` | Variant colors |
| Input | `Input.tsx` | Background, border, focus |
| Modal | `Modal.tsx` | Overlay, surface |
| Toast | `Toast.tsx` | Status backgrounds |
| Select | `Select.tsx` | Background, border |
| LoginPage | `LoginPage.tsx` | Full page light theme |

### Pages Updates Required

| Page | Files | Key Changes |
|------|-------|-------------|
| Dashboard | `DashboardPage.tsx` | Stats cards, charts |
| Leads | `index.tsx`, `components/*` | Table, modals, filters |
| Users | `index.tsx`, `components/*` | Table, modals |
| Media | `index.tsx` | Grid, cards, modals |
| Settings | `*Tab.tsx` | Forms, toggles, cards |
| Pricing | `*Tab.tsx` | Tables, modals |
| Blog | `index.tsx`, `components/*` | Editor, list |
| All others | Various | Apply adminTokens |

## Data Models

### Token Color Mapping (Dark → Light)

| Dark Mode | Light Mode | Usage |
|-----------|------------|-------|
| `#1A1A1D` | `#F8F9FA` | Background |
| `#232328` | `#FFFFFF` | Surface |
| `#2D2D33` | `#F3F4F6` | Surface hover |
| `#28282E` | `#F9FAFB` | Surface alt |
| `#F5F5F5` | `#1A1A1D` | Text |
| `#B0B0B8` | `#6B7280` | Text muted |
| `#8A8A94` | `#9CA3AF` | Muted |
| `#404048` | `#E5E7EB` | Border |
| `#5A5A64` | `#D1D5DB` | Border hover |
| `rgba(255,255,255,0.03)` | `#F9FAFB` | Glass effect |
| `rgba(255,255,255,0.05)` | `#F3F4F6` | Hover bg |
| `rgba(0,0,0,0.2)` | `#FFFFFF` | Input bg |
| `rgba(0,0,0,0.7)` | `rgba(0,0,0,0.5)` | Overlay |



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Admin tokens structure consistency
*For any* admin tokens object, it SHALL contain all required keys (color, font, space, radius, shadow, motion, zIndex) matching the structure of the original tokens object.
**Validates: Requirements 2.2, 12.4**

### Property 2: Admin tokens light mode colors
*For any* admin tokens color object, the background colors SHALL be light (luminance > 0.9) and text colors SHALL be dark (luminance < 0.3) to ensure proper light mode appearance.
**Validates: Requirements 2.1, 12.1**

### Property 3: Original tokens unchanged
*For any* import of the original tokens object, the color values SHALL remain unchanged (dark mode) to ensure landing/portal apps are not affected.
**Validates: Requirements 12.2**

### Property 4: Primary color contrast ratio
*For any* combination of primaryDark color and background color in admin tokens, the contrast ratio SHALL be at least 4.5:1 to meet WCAG AA accessibility standards.
**Validates: Requirements 14.2**

### Property 5: Status colors consistency
*For any* status color (success, warning, error, info) in admin tokens, the value SHALL match the corresponding value in the original tokens to maintain consistency across apps.
**Validates: Requirements 2.5**

## Error Handling

### Token Import Errors
- If adminTokens is not found, fall back to original tokens with console warning
- If token structure is invalid, throw descriptive error during build

### CSS Variable Errors
- If CSS variables fail to load, components should have inline fallback values
- Use TypeScript strict mode to catch missing token references at compile time

### Component Rendering Errors
- Components should gracefully handle missing token values
- Use ErrorBoundary to catch and display friendly error messages

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

1. **Unit Tests**: Verify specific component styling examples
2. **Property-Based Tests**: Verify token structure and color properties

### Property-Based Testing Library

Use **fast-check** for TypeScript property-based testing.

```typescript
import * as fc from 'fast-check';
```

### Test Structure

```
admin/src/
├── __tests__/
│   ├── adminTokens.test.ts        # Token structure tests
│   ├── adminTokens.property.test.ts # Property-based token tests
│   └── components/
│       ├── Layout.test.tsx        # Layout styling tests
│       ├── Card.test.tsx          # Card styling tests
│       └── ...
```

### Property-Based Test Examples

```typescript
// adminTokens.property.test.ts
import * as fc from 'fast-check';
import { adminTokens, tokens } from '@app/shared';

describe('Admin Tokens Properties', () => {
  // Property 1: Structure consistency
  test('admin tokens has same structure as original tokens', () => {
    const adminKeys = Object.keys(adminTokens);
    const originalKeys = Object.keys(tokens);
    expect(adminKeys).toEqual(originalKeys);
  });

  // Property 2: Light mode colors
  test('background colors are light', () => {
    const bgColors = [
      adminTokens.color.background,
      adminTokens.color.surface,
      adminTokens.color.surfaceHover,
    ];
    bgColors.forEach(color => {
      const luminance = getLuminance(color);
      expect(luminance).toBeGreaterThan(0.9);
    });
  });

  // Property 4: Contrast ratio
  test('primary text has sufficient contrast', () => {
    const contrast = getContrastRatio(
      adminTokens.color.primaryDark,
      adminTokens.color.background
    );
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});
```

### Unit Test Examples

```typescript
// Layout.test.tsx
import { render } from '@testing-library/react';
import { Layout } from '../components/Layout';

describe('Layout Light Mode', () => {
  test('sidebar has white background', () => {
    const { container } = render(<Layout>...</Layout>);
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveStyle({ background: '#FFFFFF' });
  });
});
```

### Test Coverage Requirements

- All 5 correctness properties must have corresponding property-based tests
- Key components (Layout, Card, Button, Input, Modal, Toast) must have unit tests
- Minimum 100 iterations for property-based tests

## Implementation Notes

### Migration Strategy

1. **Phase 1**: Create adminTokens in shared package
2. **Phase 2**: Update CSS variables in admin styles
3. **Phase 3**: Update shared components (Layout, Card, Button, etc.)
4. **Phase 4**: Update all pages to use adminTokens
5. **Phase 5**: Remove hardcoded colors, replace with tokens
6. **Phase 6**: Testing and validation

### Files to Create

- `packages/shared/src/adminTokens.ts` - Admin light mode tokens
- `admin/src/theme/index.ts` - Re-export adminTokens as tokens for admin app

### Files to Update

**CSS Files:**
- `admin/src/styles.css`
- `admin/src/styles/variables.css`

**Components (25+ files):**
- `admin/src/app/components/Layout.tsx`
- `admin/src/app/components/Card.tsx`
- `admin/src/app/components/Button.tsx`
- `admin/src/app/components/Input.tsx`
- `admin/src/app/components/Modal.tsx`
- `admin/src/app/components/Toast.tsx`
- `admin/src/app/components/Select.tsx`
- `admin/src/app/components/LoginPage.tsx`
- `admin/src/app/components/StatsCard.tsx`
- And more...

**Pages (70+ files):**
- All files in `admin/src/app/pages/*/`
- Replace hardcoded colors with tokens
- Update rgba values to use token equivalents

### Backward Compatibility

- Original `tokens` export remains unchanged
- Landing and Portal apps continue using dark mode
- No breaking changes to existing API
