# Design Document: Portal Standardization

## Overview

Chuẩn hóa codebase Portal app để đảm bảo tính nhất quán với các phần khác của dự án. Tập trung vào:
1. Thay thế hardcoded colors bằng CSS variables
2. Tạo barrel exports cho `pages/` và `contexts/`
3. Thống nhất export patterns

## Architecture

Portal app sử dụng kiến trúc React với:
- **CSS Variables**: Định nghĩa trong `styles/variables.css` cho theming
- **Component Structure**: Tổ chức theo feature (auth, homeowner, contractor, public)
- **API Layer**: Modular API client với token refresh

## Components and Interfaces

### CSS Variables Mapping

Hardcoded colors cần thay thế:

| Hardcoded | CSS Variable | Usage |
|-----------|--------------|-------|
| `#e4e7ec` | `var(--text-primary)` | Primary text color |
| `#a1a1aa` | `var(--text-secondary)` | Secondary text color |
| `#71717a` | `var(--text-muted)` | Muted text color |
| `#52525b` | `var(--text-muted)` | Very muted text |
| `#27272a` | `var(--border)` | Border color |
| `#3f3f46` | `var(--border-hover)` | Border hover color |
| `#1a1a1f` | `var(--bg-tertiary)` | Tertiary background |
| `#f5d393` | `var(--primary)` | Primary accent color |
| `#3b82f6` | `var(--info)` | Info/blue color |
| `#22c55e` | `var(--success)` | Success/green color |
| `#ef4444` | `var(--error)` | Error/red color |
| `#f59e0b` | `var(--warning)` | Warning/orange color |
| `#8b5cf6` | `#8b5cf6` | Purple (add to variables) |

### Barrel Export Structure

```
portal/src/
├── pages/
│   └── index.ts          # Re-export all pages
├── contexts/
│   └── index.ts          # Re-export all contexts
```

### Files to Refactor

1. **LoginPage.tsx** - Auth page with inline styles
2. **DashboardPage.tsx** (homeowner) - Dashboard with hardcoded colors
3. **DashboardPage.tsx** (contractor) - Dashboard with hardcoded colors
4. **ProjectsPage.tsx** - Projects list with inline styles
5. **MarketplacePage.tsx** - Marketplace with inline styles

## Data Models

Không có thay đổi data models - chỉ refactor CSS/styling.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No hardcoded colors in TSX files

*For any* TSX file in the portal codebase, scanning for hex color patterns (#[0-9a-fA-F]{6}) in inline styles should return zero matches (excluding CSS variable definitions).

**Validates: Requirements 1.1, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 2: Consistent named exports with complete barrel files

*For any* barrel export file (index.ts), all public modules in that directory should be re-exported using named exports.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: CSS variable usage consistency

*For any* color value used in inline styles, it should reference a CSS variable using `var(--variable-name)` syntax.

**Validates: Requirements 1.2, 3.3**

## Error Handling

Không áp dụng - đây là refactoring task, không có runtime errors.

## Testing Strategy

### Unit Testing

- Không cần unit tests cho refactoring này
- Visual regression testing có thể được thực hiện manually

### Property-Based Testing

Sử dụng **grep/regex scanning** để verify:

1. **Property 1**: Scan TSX files for hardcoded hex colors
   - Pattern: `/#[0-9a-fA-F]{6}/` trong inline styles
   - Expected: 0 matches

2. **Property 2**: Verify barrel exports completeness
   - Compare exports in index.ts với files trong directory
   - Expected: All public modules exported

3. **Property 3**: Verify CSS variable usage
   - Pattern: `color:.*#[0-9a-fA-F]{6}` trong inline styles
   - Expected: 0 matches (all should use var())

### Manual Verification

- Visual check: Theme toggle (dark/light) works correctly
- Visual check: All colors render correctly
- Visual check: No broken styles

