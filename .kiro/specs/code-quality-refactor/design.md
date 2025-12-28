# Design Document: Code Quality Refactor

## Overview

This design document outlines the refactoring strategy for improving code quality across the ANH THỢ XÂY codebase. The primary goals are:

1. Reduce file sizes to meet established line limits
2. Improve code modularity through component extraction
3. Replace hardcoded colors with design tokens
4. Ensure all property-based tests pass

## Architecture

The refactoring follows a modular architecture pattern where large components are broken down into:

1. **Container Components** - Handle state and business logic
2. **Presentational Components** - Handle UI rendering
3. **Custom Hooks** - Encapsulate reusable stateful logic
4. **Utility Functions** - Pure functions for data transformation

```
┌─────────────────────────────────────────────────────────────┐
│                    Container Component                       │
│  (LeadsPage, RichTextPreview, etc.)                         │
│  - Orchestrates child components                            │
│  - Manages top-level state                                  │
│  - < 400 lines for pages, < 150 lines for previews          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Custom    │  │Presentational│  │   Shared    │         │
│  │   Hooks     │  │ Components   │  │ Components  │         │
│  │             │  │              │  │             │         │
│  │ useBulk...  │  │ LeadFilters  │  │ InfoBanner  │         │
│  │ useFurni... │  │ LeadStats    │  │ ImageSection│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### LeadsPage Refactoring

#### New File Structure
```
admin/src/app/pages/LeadsPage/
├── index.tsx              # Main component (< 400 lines)
├── types.ts               # Type definitions (existing)
├── components/
│   ├── index.ts           # Re-exports
│   ├── LeadDetailModal.tsx    # (existing)
│   ├── LeadMobileCard.tsx     # (existing)
│   ├── LeadFilters.tsx        # NEW: Search & filter UI
│   ├── LeadStats.tsx          # NEW: Stats cards
│   ├── LeadPagination.tsx     # NEW: Pagination controls
│   └── BulkDeleteModal.tsx    # NEW: Bulk delete confirmation
└── hooks/
    ├── index.ts           # Re-exports
    ├── useBulkSelection.ts    # NEW: Bulk selection logic
    └── useFurnitureQuotations.ts  # NEW: Furniture quotation state
```

#### Interface Definitions

```typescript
// hooks/useBulkSelection.ts
interface UseBulkSelectionReturn {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  toggleSelectAll: () => void;
  toggleSelectOne: (id: string) => void;
  clearSelection: () => void;
  selectedCount: number;
}

// hooks/useFurnitureQuotations.ts
interface UseFurnitureQuotationsReturn {
  quotations: FurnitureQuotation[];
  loading: boolean;
  leadsWithQuotes: Set<string>;
  fetchQuotations: (leadId: string) => Promise<void>;
}

// components/LeadFilters.tsx
interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  filterSource: string;
  onSourceChange: (source: string) => void;
  sourceStats: SourceStats;
}

// components/LeadStats.tsx
interface LeadStatsProps {
  stats: Record<string, number>;
  isMobile: boolean;
}

// components/BulkDeleteModal.tsx
interface BulkDeleteModalProps {
  isOpen: boolean;
  selectedCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// components/LeadPagination.tsx
interface LeadPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isMobile: boolean;
}
```

### RichTextPreview Refactoring

#### New File Structure
```
admin/src/app/components/SectionEditor/previews/
├── RichTextPreview.tsx    # Main component (< 150 lines)
├── types.ts               # Shared types
├── richtext/
│   ├── index.ts           # Re-exports
│   ├── BlockRenderer.tsx      # Block type dispatcher
│   ├── blocks/
│   │   ├── HeadingBlock.tsx
│   │   ├── ParagraphBlock.tsx
│   │   ├── ListBlock.tsx
│   │   ├── QuoteBlock.tsx
│   │   ├── ImageBlock.tsx
│   │   ├── DividerBlock.tsx
│   │   └── CalloutBlock.tsx
│   └── layouts/
│       ├── SplitLayoutPreview.tsx
│       ├── FullWidthPreview.tsx
│       ├── CenteredPreview.tsx
│       └── DefaultLayoutPreview.tsx
```

#### Interface Definitions

```typescript
// types.ts
interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface BlockProps {
  block: Block;
  textAlign: string;
  isDark?: boolean;
}

interface LayoutPreviewProps {
  content: string;
  blocks: Block[];
  isBlocksFormat: boolean;
  backgroundImage: string;
  backgroundOverlay: number;
  textAlign: string;
  maxWidth: string;
  showDecorations: boolean;
  imageRatio?: number;
}
```

### Form Refactoring (ContactInfoForm, RichTextForm)

#### ContactInfoForm New Structure
```
admin/src/app/components/SectionEditor/forms/
├── ContactInfoForm.tsx    # Main form (< 200 lines)
├── contactinfo/
│   ├── SocialLinksEditor.tsx
│   └── ContactItemsEditor.tsx
```

#### RichTextForm New Structure
```
admin/src/app/components/SectionEditor/forms/
├── RichTextForm.tsx       # Main form (< 200 lines)
├── richtext/
│   ├── LayoutSelector.tsx
│   ├── TextAlignmentSelector.tsx
│   ├── BackgroundImageConfig.tsx
│   └── BlockEditorSection.tsx
```

## Data Models

No database changes required. This refactoring only affects frontend component structure.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Size Constraints
*For any* refactored file, the line count SHALL be less than its specified limit (400 for pages, 200 for forms, 150 for previews)
**Validates: Requirements 1.1, 2.1, 3.1, 4.1**

### Property 2: Component Extraction Completeness
*For any* extracted component, it SHALL exist as a separate file and be properly imported by its parent component
**Validates: Requirements 1.2-1.7, 2.2-2.6, 3.2-3.4, 4.2-4.5**

### Property 3: Token Usage in Refactored Files
*For any* refactored Portal page, the file SHALL import tokens from `@app/shared` or use CSS variables, and SHALL NOT contain hardcoded hex color values
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 4: Test Suite Compliance
*For any* test execution after refactoring, all property-based tests SHALL pass with zero failures
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

## Error Handling

- If a component extraction breaks existing functionality, the refactoring should be reverted
- TypeScript compilation errors must be resolved before proceeding
- Lint errors must be fixed as part of the refactoring

## Testing Strategy

### Dual Testing Approach

This refactoring uses both unit tests and property-based tests:

1. **Property-Based Tests** (existing): Verify file size constraints and code quality metrics
2. **Unit Tests** (existing): Verify component rendering and behavior

### Property-Based Testing Library

The project uses **fast-check** with **Vitest** for property-based testing.

### Test Annotations

Each property-based test must be tagged with:
```typescript
/**
 * **Feature: code-quality-refactor, Property {number}: {property_text}**
 * **Validates: Requirements X.Y**
 */
```

### Test Execution

```bash
# Run all tests
pnpm nx run-many --target=test --all

# Run specific admin tests
pnpm nx run admin:test

# Run lint
pnpm nx run-many --target=lint --all

# Run typecheck
pnpm nx run-many --target=typecheck --all
```

### Minimum Iterations

Property-based tests should run a minimum of 100 iterations to ensure coverage.
