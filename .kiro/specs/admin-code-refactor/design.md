# Design Document: Admin Code Refactor

## Overview

This design document outlines the refactoring strategy for large files in the Admin app to improve maintainability, readability, and consistency with established project structure. The goal is to break down files exceeding 500 lines into smaller, focused components organized in a folder-based structure.

### Current State Analysis

| File | Current Lines | Target Lines | Components to Extract |
|------|--------------|--------------|----------------------|
| LeadsPage.tsx | 1176 | <400 | QuoteDataDisplay, NotesEditor, StatusHistory, FurnitureQuotationHistory, LeadDetailModal |
| UsersPage.tsx | 791 | <300 | UserTable, CreateUserModal, EditUserModal, SessionsModal |
| SectionEditor/forms.tsx | 1857 | <200 each | Individual form components per section type |
| SectionEditor/previews.tsx | 1052 | <150 each | Individual preview components per section type |
| SettingsPage/LayoutTab.tsx | 1023 | <400 | HeaderEditor, FooterEditor, NavigationEditor |
| FurniturePage/CatalogTab.tsx | 920 | <500 | CategoryList, ProductGrid, CategoryForm, ProductForm |
| FurniturePage/ComboTab.tsx | 779 | <500 | ComboTable, ComboForm |

### Additional Large Files (Not in Scope)

These files are also large but not included in this refactoring scope:

| File | Lines | Notes |
|------|-------|-------|
| landing/FurnitureQuote/index.tsx | 1365 | Covered in Requirement 7 |
| admin/components/VisualBlockEditor.tsx | 887 | Complex editor, separate refactor |
| admin/components/Layout.tsx | 726 | Core layout, needs careful refactor |
| admin/pages/MediaPage/index.tsx | 684 | Media management |
| admin/pages/PricingConfigPage/MaterialsTab.tsx | 690 | Pricing config |
| admin/pages/BlogManagerPage/PostsTab.tsx | 605 | Blog management |

### FurniturePage Existing Structure

Note: FurniturePage already has a `components/` folder with:
- ApartmentTypeCards.tsx
- BuildingInfoCard.tsx
- EntityColumn.tsx
- ManagementModals.tsx (489 lines - could be split further)
- MetricsGrid.tsx
- index.ts

## Architecture

### Folder-Based Component Structure

Each refactored page will follow this pattern:

```
PageName/
├── index.tsx           # Main component, orchestrates sub-components
├── types.ts            # Shared type definitions
└── components/
    ├── ComponentA.tsx  # Extracted sub-component
    ├── ComponentB.tsx  # Extracted sub-component
    └── ...
```

### SectionEditor Special Structure

The SectionEditor has ~25 section types that need to be extracted:

**Section Types:**
- HERO, HERO_SIMPLE
- CTA, CALL_TO_ACTION
- RICH_TEXT
- BANNER
- CONTACT_INFO
- TESTIMONIALS
- STATS
- FEATURES, CORE_VALUES
- FEATURED_BLOG_POSTS
- MISSION_VISION
- SOCIAL_MEDIA, FOOTER_SOCIAL
- QUICK_CONTACT
- FAB_ACTIONS
- QUOTE_FORM
- ABOUT
- FAQ
- BLOG_LIST
- QUOTE_CALCULATOR
- SERVICES
- MARKETPLACE
- FEATURED_SLIDESHOW
- MEDIA_GALLERY
- VIDEO_SHOWCASE
- FURNITURE_QUOTE

```
SectionEditor/
├── index.tsx           # Main editor component
├── types.ts            # Type definitions
├── defaults.ts         # Default data
├── utils.ts            # Utility functions
├── forms/
│   ├── index.tsx       # Exports renderFormFields (switch statement only)
│   ├── shared/         # Shared form components
│   │   ├── InfoBanner.tsx
│   │   ├── ImageSection.tsx
│   │   ├── ArraySection.tsx
│   │   ├── CTASection.tsx
│   │   ├── ButtonSection.tsx
│   │   ├── RangeInput.tsx
│   │   ├── RadioGroup.tsx
│   │   └── index.ts
│   ├── HeroForm.tsx
│   ├── HeroSimpleForm.tsx
│   ├── CTAForm.tsx
│   ├── RichTextForm.tsx
│   ├── BannerForm.tsx
│   ├── ContactInfoForm.tsx
│   ├── TestimonialsForm.tsx
│   ├── StatsForm.tsx
│   ├── FeaturesForm.tsx
│   ├── FeaturedBlogPostsForm.tsx
│   ├── MissionVisionForm.tsx
│   ├── SocialMediaForm.tsx
│   ├── FooterSocialForm.tsx
│   ├── QuickContactForm.tsx
│   ├── FABActionsForm.tsx
│   ├── QuoteFormForm.tsx
│   ├── AboutForm.tsx
│   ├── FAQForm.tsx
│   ├── BlogListForm.tsx
│   ├── QuoteCalculatorForm.tsx
│   ├── ServicesForm.tsx
│   ├── MarketplaceForm.tsx
│   ├── FeaturedSlideshowForm.tsx
│   ├── MediaGalleryForm.tsx
│   ├── VideoShowcaseForm.tsx
│   └── FurnitureQuoteForm.tsx
└── previews/
    ├── index.tsx       # Exports renderPreview (switch statement only)
    ├── HeroPreview.tsx
    ├── HeroSimplePreview.tsx
    ├── CTAPreview.tsx
    └── ... (one file per section type)
```

## Components and Interfaces

### LeadsPage Components

```typescript
// LeadsPage/types.ts
export interface LeadDetailModalProps {
  lead: CustomerLead | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  furnitureQuotations: FurnitureQuotation[];
  loadingQuotations: boolean;
}

export interface QuoteDataDisplayProps {
  quoteData: string | null;
}

export interface NotesEditorProps {
  initialNotes: string | null;
  onSave: (notes: string) => Promise<void>;
}

export interface StatusHistoryProps {
  history: string | null;
}

export interface FurnitureQuotationHistoryProps {
  quotations: FurnitureQuotation[];
  loading: boolean;
}
```

### UsersPage Components

```typescript
// UsersPage/types.ts
export interface UserTableProps {
  users: UserAccount[];
  loading: boolean;
  onEdit: (user: UserAccount) => void;
  onDelete: (user: UserAccount) => void;
  onBan: (user: UserAccount) => void;
  onViewSessions: (user: UserAccount) => void;
}

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => Promise<void>;
  saving: boolean;
}

export interface EditUserModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  onClose: () => void;
  onSubmit: (data: UpdateUserData) => Promise<void>;
  saving: boolean;
}

export interface SessionsModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  sessions: UserSession[];
  onClose: () => void;
  onRevokeSession: (sessionId: string) => void;
}
```

### SectionEditor Form Components

```typescript
// SectionEditor/forms/shared/types.ts
export type DataRecord = Record<string, unknown>;
export type UpdateFieldFn = (path: string, value: unknown) => void;
export type AddArrayItemFn = (path: string, item: unknown) => void;
export type RemoveArrayItemFn = (path: string, index: number) => void;
export type OnImagePickFn = (field: string) => void;

export interface FormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
  onImagePick: OnImagePickFn;
}
```

### SettingsPage Components

```typescript
// SettingsPage/components/types.ts
export interface HeaderEditorProps {
  config: HeaderConfig;
  onChange: (config: HeaderConfig) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export interface FooterEditorProps {
  config: FooterConfig;
  onChange: (config: FooterConfig) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export interface NavigationEditorProps {
  items: HeaderNavItem[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | boolean) => void;
  onReorder: (items: HeaderNavItem[]) => void;
}
```

### FurniturePage Components

```typescript
// FurniturePage/components/types.ts
export interface CategoryListProps {
  categories: FurnitureCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit: (category: FurnitureCategory) => void;
  onDelete: (id: string) => void;
  getProductCount: (id: string) => number;
  totalProducts: number;
}

export interface ProductGridProps {
  products: FurnitureProduct[];
  categories: FurnitureCategory[];
  onEdit: (product: FurnitureProduct) => void;
  onDelete: (id: string) => void;
}

export interface CategoryFormProps {
  isOpen: boolean;
  category: FurnitureCategory | null;
  onClose: () => void;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  loading: boolean;
}

export interface ProductFormProps {
  isOpen: boolean;
  product: FurnitureProduct | null;
  categories: FurnitureCategory[];
  selectedCategoryId: string;
  onClose: () => void;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
  loading: boolean;
}
```

### Landing FurnitureQuote Components

Note: FurnitureQuote already has separate files for major components:
- FurnitureSelector.tsx (849 lines)
- LayoutSelector.tsx (503 lines)
- QuotationResult.tsx (692 lines)
- StepSelector.tsx (514 lines)
- LeadForm.tsx

The main index.tsx (1365 lines) contains:
- StepIndicator (inline, ~80 lines) - should be extracted
- SelectionCard (inline, ~100 lines) - should be extracted
- NavigationButtons (inline, ~60 lines) - should be extracted
- Main wizard logic and state management

```typescript
// FurnitureQuote/components/StepIndicator.tsx
export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  onStepClick?: (step: number) => void;
}

// FurnitureQuote/components/SelectionCard.tsx
export interface SelectionCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
  imageUrl?: string;
}

// FurnitureQuote/components/NavigationButtons.tsx
export interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}
```

## Data Models

No new data models are required. This refactoring focuses on code organization without changing data structures.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File size constraints after refactoring
*For any* refactored main file (index.tsx), the line count SHALL be under the specified limit (400 for LeadsPage, 300 for UsersPage, 400 for LayoutTab, 500 for Tab files, 600 for FurnitureQuote).
**Validates: Requirements 1.8, 2.7, 5.4, 6.6, 7.5**

### Property 2: Form file size constraints
*For any* extracted form file in SectionEditor/forms/, the line count SHALL be under 200 lines.
**Validates: Requirements 3.5**

### Property 3: Preview file size constraints
*For any* extracted preview file in SectionEditor/previews/, the line count SHALL be under 150 lines.
**Validates: Requirements 4.4**

### Property 4: Lint compliance
*For any* refactored file, running lint SHALL produce 0 errors and 0 warnings.
**Validates: Requirements 8.2**

### Property 5: TypeScript compliance
*For any* refactored file, running typecheck SHALL produce 0 errors.
**Validates: Requirements 8.3**

### Property 6: Token usage for styling
*For any* refactored file containing style definitions, all color values SHALL reference `tokens` from `@app/shared` instead of hardcoded values.
**Validates: Requirements 8.4**

### Property 7: Icon consistency
*For any* refactored file containing icon references, all icons SHALL use Remix Icon format (`ri-*`).
**Validates: Requirements 8.5**

### Property 8: Naming convention compliance
*For any* refactored component file, the component name SHALL use PascalCase and match the filename.
**Validates: Requirements 8.6**

## Error Handling

- Extracted components should maintain the same error handling patterns as the original code
- Toast notifications for user-facing errors should remain in the parent component
- API error handling should be preserved during extraction

## Testing Strategy

### Dual Testing Approach

This refactoring project uses both manual verification and automated checks:

#### Manual Verification
- Visual inspection of UI to ensure no regressions
- Functional testing of all features in refactored pages
- Code review for proper component extraction

#### Automated Checks (Property-Based)
- **Lint checks**: `pnpm nx run-many --target=lint --all`
- **Type checks**: `pnpm nx run-many --target=typecheck --all`
- **Line count verification**: Script to count lines in refactored files

### Property-Based Testing Library

For automated property verification, we will use simple shell scripts and Node.js utilities to:
1. Count lines in files
2. Grep for hardcoded colors
3. Verify icon patterns
4. Check naming conventions

### Test Execution

After each refactoring task:
1. Run lint: `pnpm nx run admin:lint`
2. Run typecheck: `pnpm nx run admin:typecheck`
3. Manually verify UI functionality
4. Verify file line counts

### Verification Script Example

```bash
# Count lines in refactored files
wc -l admin/src/app/pages/LeadsPage/index.tsx
wc -l admin/src/app/pages/UsersPage/index.tsx

# Check for hardcoded colors (should return empty)
grep -r "#[0-9A-Fa-f]\{6\}" admin/src/app/pages/LeadsPage/ --include="*.tsx"

# Verify Remix Icon usage
grep -r "className=\"ri-" admin/src/app/pages/LeadsPage/ --include="*.tsx"
```
