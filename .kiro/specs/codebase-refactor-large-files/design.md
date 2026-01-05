# Design Document: Refactor Large Files

## Overview

Spec này thiết kế cách refactor các file lớn (>500 lines) trong codebase thành các modules nhỏ hơn, dễ maintain và test. Áp dụng các patterns: Extract Component, Extract Hook, Extract Service, và Re-export Pattern.

## Architecture

### Refactoring Strategy

1. **Extract Types First** - Tách types/interfaces ra file riêng để tránh circular dependencies
2. **Extract Constants** - Tách constants, configs ra file riêng
3. **Extract Utils** - Tách helper functions không phụ thuộc state
4. **Extract Sub-components/Services** - Tách logic theo responsibility
5. **Create Index** - Re-export từ index.ts để giữ backward compatibility

### File Size Guidelines

| Type | Max Lines | Reason |
|------|-----------|--------|
| Components | 300 | Dễ đọc, dễ review |
| Services | 400 | Business logic phức tạp hơn |
| Routes | 300 | Mỗi route file nên focus 1 domain |
| Utils/Helpers | 200 | Pure functions, dễ test |
| Types | 150 | Chỉ chứa interfaces/types |

## Components and Interfaces

### 1. VisualBlockEditor Structure

```
admin/src/app/components/VisualBlockEditor/
├── index.tsx              # Main component, re-exports
├── types.ts               # Block, BlockType, VisualBlockEditorProps
├── constants.ts           # BLOCK_TEMPLATES, getDefaultBlockData
├── utils.ts               # parseValue, markdownToBlocks, generateId
├── VisualBlockEditor.tsx  # Main editor component (~200 lines)
├── BlockItem.tsx          # Single block item with controls
├── BlockEditor.tsx        # Block editing form
├── BlockPickerModal.tsx   # Modal to add new block
├── BlocksPreview.tsx      # Preview mode renderer
├── RichTextInput.tsx      # Rich text input with toolbar
├── AlignmentSelector.tsx  # Alignment buttons
└── blocks/
    ├── index.ts           # Re-exports all blocks
    ├── HeadingBlock.tsx   # Heading editor
    ├── ParagraphBlock.tsx # Paragraph editor
    ├── ListBlock.tsx      # List editor
    ├── QuoteBlock.tsx     # Quote editor
    ├── ImageBlock.tsx     # Image editor
    ├── CalloutBlock.tsx   # Callout editor
    ├── DividerBlock.tsx   # Divider editor
    └── ColumnsBlock.tsx   # Columns editor
```

**Key Interfaces:**
```typescript
// types.ts
export type BlockType = 'heading' | 'paragraph' | 'list' | 'quote' | 'image' | 'divider' | 'callout' | 'columns';

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

export interface VisualBlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export interface BlockEditorProps {
  block: Block;
  onUpdate: (data: Record<string, unknown>) => void;
}
```

### 2. ApiKeyDetailPanel Structure

```
admin/src/app/pages/ApiKeysPage/components/ApiKeyDetailPanel/
├── index.tsx              # Main component, re-exports
├── types.ts               # Props, internal types
├── utils.ts               # parseAllowedEndpoints, formatDate, getResultBadge
├── constants.ts           # ENDPOINT_GROUP_DETAILS
├── ApiKeyDetailPanel.tsx  # Main panel component (~200 lines)
├── InfoSection.tsx        # Basic info (name, description, scope)
├── ExpirationWarning.tsx  # Expiration warning banner
├── UsageStats.tsx         # Usage count, last used
├── UsageLogs.tsx          # Recent usage logs table
└── EndpointGroups.tsx     # Allowed endpoints list
```

### 3. FurnitureQuote Structure

```
landing/src/app/sections/FurnitureQuote/
├── index.tsx              # Main orchestrator (~300 lines)
├── types.ts               # Existing types
├── constants.ts           # ITEMS_PER_PAGE, step configs
├── hooks/
│   ├── index.ts           # Re-exports
│   ├── useFurnitureData.ts    # Fetch developers, projects, buildings, etc.
│   ├── useSelections.ts       # Selection state management
│   ├── useQuotation.ts        # Quotation calculation & submission
│   └── usePagination.ts       # Pagination state for each step
├── steps/
│   ├── index.ts           # Re-exports
│   ├── DeveloperStep.tsx  # Step 1: Chọn chủ đầu tư
│   ├── ProjectStep.tsx    # Step 2: Chọn dự án
│   ├── BuildingStep.tsx   # Step 3: Chọn tòa nhà
│   ├── UnitStep.tsx       # Step 4: Chọn căn hộ (floor/axis)
│   ├── LayoutStep.tsx     # Step 5: Chọn layout
│   ├── LeadInfoStep.tsx   # Step 6: Nhập thông tin
│   ├── ProductStep.tsx    # Step 7: Chọn sản phẩm
│   └── ConfirmStep.tsx    # Step 8: Xác nhận
├── components/            # Existing components
└── LeadForm.tsx           # Existing
```

**Key Hooks:**
```typescript
// hooks/useFurnitureData.ts
export function useFurnitureData(selections: Selections) {
  const [developers, setDevelopers] = useState<FurnitureDeveloper[]>([]);
  const [projects, setProjects] = useState<FurnitureProject[]>([]);
  // ... fetch logic
  return { developers, projects, buildings, apartmentTypes, categories, productGroups, fees, loading, error };
}

// hooks/useSelections.ts
export function useSelections() {
  const [selections, setSelections] = useState<Selections>({...});
  const handleDeveloperSelect = useCallback(...);
  const handleProjectSelect = useCallback(...);
  // ... handlers
  return { selections, handlers };
}

// hooks/useQuotation.ts
export function useQuotation(selections: Selections, fees: FurnitureFee[]) {
  const [quotationResult, setQuotationResult] = useState<QuotationResultData | null>(null);
  const calculateQuotation = useCallback(...);
  return { quotationResult, calculateQuotation, submitting };
}
```

### 4. RichTextSection Structure

```
landing/src/app/sections/RichTextSection/
├── index.tsx              # Main component (~150 lines)
├── types.ts               # Block, RichTextSectionProps
├── utils.ts               # parseContent
├── styles.ts              # getStyles function
├── BlockRenderer.tsx      # Renders single block
└── blocks/
    ├── index.ts           # Re-exports
    ├── HeadingBlock.tsx
    ├── ParagraphBlock.tsx
    ├── ListBlock.tsx
    ├── QuoteBlock.tsx
    ├── ImageBlock.tsx
    ├── CalloutBlock.tsx
    ├── DividerBlock.tsx
    └── ColumnsBlock.tsx
```

### 5. External API Routes Structure

```
api/src/routes/external-api/
├── index.ts               # Main router (~80 lines)
├── schemas.ts             # All shared schemas
├── leads.routes.ts        # GET/POST /leads, GET /leads/stats
├── blog.routes.ts         # GET /blog/posts, /blog/posts/:slug, /blog/categories
├── projects.routes.ts     # GET /projects, /projects/:id
├── contractors.routes.ts  # GET /contractors
├── reports.routes.ts      # GET /reports/dashboard
├── pricing.routes.ts      # CRUD /pricing/service-categories, /unit-prices, /formulas
├── furniture.routes.ts    # CRUD /furniture/categories, /materials, /developers, etc.
├── media.routes.ts        # GET /media, POST /media/upload
└── settings.routes.ts     # GET/PUT /settings
```

**Main Router Pattern:**
```typescript
// index.ts
export function createExternalApiRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { apiKeyAuth } = createApiKeyAuthMiddleware(prisma);

  // Mount sub-routes
  app.route('/leads', createLeadsRoutes(prisma, apiKeyAuth));
  app.route('/blog', createBlogRoutes(prisma, apiKeyAuth));
  app.route('/projects', createProjectsRoutes(prisma, apiKeyAuth));
  app.route('/contractors', createContractorsRoutes(prisma, apiKeyAuth));
  app.route('/reports', createReportsRoutes(prisma, apiKeyAuth));
  app.route('/pricing', createPricingRoutes(prisma, apiKeyAuth));
  app.route('/furniture', createFurnitureRoutes(prisma, apiKeyAuth));
  app.route('/media', createMediaRoutes(prisma, apiKeyAuth));
  app.route('/settings', createSettingsRoutes(prisma, apiKeyAuth));

  return app;
}
```

### 6. Layout Structure

```
admin/src/app/components/Layout/
├── index.tsx              # Main layout (~150 lines)
├── types.ts               # LayoutProps, MenuItem types
├── constants.ts           # menuItems, comingSoonItems
├── Sidebar.tsx            # Desktop sidebar
├── MobileSidebar.tsx      # Mobile slide-out menu
├── Header.tsx             # Top header bar
├── MenuItem.tsx           # Single menu item
├── DropdownMenu.tsx       # Dropdown menu group
├── UserInfo.tsx           # User info section
└── hooks/
    └── useNavigation.ts   # Navigation state & handlers
```

### 7. Project Service Structure

```
api/src/services/project/
├── index.ts               # Re-exports ProjectService
├── types.ts               # ProjectWithRelations, PublicProject, etc.
├── constants.ts           # PROJECT_STATUS_TRANSITIONS
├── project.service.ts     # Main service class (~200 lines)
├── crud.service.ts        # create, update, delete, getById
├── query.service.ts       # getByOwner, getPublicList, getAdminList
├── status.service.ts      # submit, approve, reject, transitionStatus
└── helpers.ts             # getProjectInclude, parseJsonArray, transformProject
```

### 8. Furniture Routes Structure

```
api/src/routes/furniture/
├── index.ts               # Main router (~80 lines)
├── category.routes.ts     # /categories CRUD
├── product.routes.ts      # /products, /products/grouped
├── quotation.routes.ts    # /quotations CRUD
├── developer.routes.ts    # /developers CRUD
├── project.routes.ts      # /projects, /buildings, /layouts
├── fee.routes.ts          # /fees CRUD
└── admin.routes.ts        # /admin/* endpoints
```

## Data Models

Không thay đổi data models. Chỉ tách code organization.

## Error Handling

Giữ nguyên error handling patterns hiện tại. Mỗi sub-route/service sẽ handle errors riêng.

## Testing Strategy

### Unit Tests
- Test từng block component riêng lẻ
- Test từng hook riêng lẻ
- Test từng route file riêng lẻ
- Test từng service method riêng lẻ

### Integration Tests
- Test main component với mocked sub-components
- Test main router với mocked sub-routes

### Regression Tests
- Run existing tests sau mỗi refactor
- Manual test UI/API để verify no regression

## Backward Compatibility

### Import Path Strategy
```typescript
// OLD (vẫn hoạt động)
import { VisualBlockEditor } from '../components/VisualBlockEditor';

// Vì index.tsx re-export:
export { VisualBlockEditor } from './VisualBlockEditor';
```

### API Routes Strategy
```typescript
// main.ts - không thay đổi
app.route('/api/external', createExternalApiRoutes(prisma));

// external-api/index.ts - internal refactor
export function createExternalApiRoutes(prisma: PrismaClient) {
  // Mount sub-routes internally
}
```

## Risk Mitigation

1. **Circular Dependencies**: Tách types ra file riêng trước
2. **Import Errors**: Dùng re-exports từ index.ts
3. **Missing Exports**: Check tất cả public APIs được export
4. **State Issues**: Giữ nguyên state structure, chỉ tách UI
5. **Performance**: Không thêm unnecessary re-renders
