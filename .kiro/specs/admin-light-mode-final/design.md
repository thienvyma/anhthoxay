# Design Document

## Overview

Hoàn thiện việc chuyển đổi Admin App sang Light Mode bằng cách:
1. Fix các hardcoded dark mode colors trong BiddingSettingsPage tabs
2. Chuyển TemplatePicker từ Tailwind dark classes sang inline styles với tokens
3. Đảm bảo button text colors có contrast phù hợp
4. Fix avatar placeholders và icon containers
5. Thêm visual indicator cho preview components (giữ dark theme vì preview landing content)
6. Thay thế tất cả hardcoded brand colors bằng tokens
7. Đồng nhất status colors với tokens
8. Fix VisualBlockEditor và MarkdownEditor styling

## Architecture

### Token System
```
packages/shared/src/adminTokens.ts  →  admin/src/theme/index.ts  →  Components
                                       (re-export as tokens)
```

### File Categories

**Category 1: Admin UI Components (MUST use light mode tokens)**
- `admin/src/app/pages/**/*.tsx`
- `admin/src/app/components/**/*.tsx` (except preview components)

**Category 2: Preview Components (KEEP dark theme - preview landing content)**
- `admin/src/app/components/SectionEditor/previews/**/*.tsx`
- These preview how content will look on the dark-themed landing page

## Components and Interfaces

### Files to Modify

#### Priority 1: BiddingSettingsPage Tabs
```typescript
// admin/src/app/pages/BiddingSettingsPage/GeneralSettingsTab.tsx
// admin/src/app/pages/BiddingSettingsPage/ServiceFeesTab.tsx

// BEFORE (dark mode)
const glass = {
  background: 'rgba(12,12,16,0.7)',
  border: '1px solid tokens.color.border',
};

// AFTER (light mode)
const glass = {
  background: tokens.color.surfaceAlt,
  border: `1px solid ${tokens.color.border}`,
};
```

#### Priority 2: TemplatePicker
```typescript
// admin/src/app/components/TemplatePicker.tsx

// BEFORE (Tailwind dark classes)
<div className="bg-gray-800 rounded-xl border border-gray-700">

// AFTER (inline styles with tokens)
<div style={{
  background: tokens.color.surface,
  borderRadius: tokens.radius.lg,
  border: `1px solid ${tokens.color.border}`,
}}>
```

#### Priority 3: Button Text Colors
```typescript
// admin/src/app/components/Button.tsx
// Ensure danger variant uses appropriate contrast

// Files with hardcoded #fff in buttons:
// - MaterialsTab.tsx
// - FeeTable.tsx
// - DashboardPage.tsx
// - ConversationDetail.tsx
// - CloseConversationModal.tsx
```

#### Priority 4: Avatar Placeholders
```typescript
// admin/src/app/pages/UsersPage/components/UserTable.tsx
// admin/src/app/pages/ContractorsPage/ContractorTable.tsx

// BEFORE
color: '#fff',

// AFTER
color: tokens.color.text,
```

#### Priority 5: Preview Components Wrapper
```typescript
// Add a wrapper component to indicate preview context
// admin/src/app/components/SectionEditor/previews/PreviewWrapper.tsx

interface PreviewWrapperProps {
  children: React.ReactNode;
  label?: string;
}

export function PreviewWrapper({ children, label = 'Preview (Dark Theme)' }: PreviewWrapperProps) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: tokens.radius.md,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        padding: '4px 8px',
        background: tokens.color.surfaceAlt,
        borderBottomLeftRadius: tokens.radius.sm,
        fontSize: 10,
        color: tokens.color.muted,
        zIndex: 1,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
```

## Data Models

Không có thay đổi data models - chỉ thay đổi UI styling.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No hardcoded brand colors in admin components
*For any* admin component file (excluding preview components), the file SHALL NOT contain hardcoded brand colors (`#F5D393`, `#EFB679`, `#C7A775`, `#B8860B`) - all brand colors must use tokens.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 2: No dark mode background colors in admin UI
*For any* admin UI component (excluding preview components), the file SHALL NOT contain dark mode background colors (`#131316`, `#1a1a1a`, `#27272A`, `rgba(12,12,16,*)`) - all backgrounds must use tokens.
**Validates: Requirements 1.1, 1.2, 8.1**

### Property 3: Button text contrast
*For any* button with a light-colored background (primary, warning), the text color SHALL be dark (`#111` or similar) to ensure readability.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Form element border consistency
*For any* checkbox, radio button, or input container, borders SHALL use `tokens.color.border` or derived values.
**Validates: Requirements 1.3**

## Error Handling

- Nếu component không import tokens, sẽ gây TypeScript error
- Nếu hardcoded color còn sót, sẽ được phát hiện qua grep search trong tests

## Testing Strategy

### Unit Tests
- Verify specific components render with correct token values
- Snapshot tests for TemplatePicker after conversion

### Property-Based Tests
- Search codebase for hardcoded colors (Property 1, 2)
- Verify no Tailwind dark classes in admin components

### Manual Testing
- Visual inspection of all admin pages
- Check contrast ratios for buttons and text

### Test Framework
- Vitest for unit tests
- Custom grep-based tests for codebase scanning
