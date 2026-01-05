# Design Document: Admin Light Mode Cleanup

## Overview

Hoàn thành việc chuyển đổi Admin Dashboard sang Light Mode bằng cách fix tất cả hardcoded colors còn sót. Sử dụng cách tiếp cận có hệ thống: scan → categorize → replace → verify.

### Design Goals
1. **Complete**: Fix 100% hardcoded colors (trừ intentional cases)
2. **Systematic**: Sử dụng rules nhất quán để thay thế
3. **Safe**: Không break existing functionality
4. **Verifiable**: Có thể verify bằng grep sau khi fix

## Architecture

### Color Replacement Rules

| Pattern | Replacement | Notes |
|---------|-------------|-------|
| `rgba(255,255,255,0.02)` | `tokens.color.surfaceAlt` | Very subtle bg |
| `rgba(255,255,255,0.03)` | `tokens.color.surfaceAlt` | Subtle bg |
| `rgba(255,255,255,0.04)` | `tokens.color.surfaceAlt` | Subtle bg |
| `rgba(255,255,255,0.05)` | `tokens.color.surfaceHover` | Hover bg |
| `rgba(255,255,255,0.06)` | `tokens.color.surfaceHover` | Hover bg |
| `rgba(255,255,255,0.08)` | `tokens.color.border` | Border |
| `rgba(255,255,255,0.1)` | `tokens.color.border` | Border |
| `rgba(0,0,0,0.5)` | `tokens.color.overlay` | Modal overlay |
| `rgba(0,0,0,0.6)` | `tokens.color.overlay` | Modal overlay |
| `rgba(0,0,0,0.7)` | `tokens.color.overlay` | Modal overlay |
| `#EF4444` / `#ef4444` | `tokens.color.error` | Error color |
| `#10B981` / `#10b981` | `tokens.color.success` | Success color |
| `#22C55E` / `#22c55e` | `tokens.color.success` | Success color |
| `#3B82F6` / `#3b82f6` | `tokens.color.info` | Info color |
| `#F59E0B` / `#f59e0b` | `tokens.color.warning` | Warning color |
| `#fff` / `#ffffff` / `#FFFFFF` | `tokens.color.surface` | White bg |
| `#111` / `#111827` | `tokens.color.text` | Dark text |
| `#374151` | `tokens.color.text` | Dark text |
| `#9ca3af` | `tokens.color.muted` | Muted text |
| `rgba(239, 68, 68, 0.05)` | `tokens.color.errorBg` | Error bg |
| `rgba(239, 68, 68, 0.1)` | `tokens.color.errorBg` | Error bg |

### Files to Exclude (Intentional Colors)

1. **Color Pickers**: `type="color"` inputs - user selects colors
2. **Preview Components**: 
   - `AboutPreview.tsx`
   - `BannerPreview.tsx`
   - `BlogListPreview.tsx`
   - `ContactInfoPreview.tsx`
   - `FABActionsPreview.tsx`
   - `FAQPreview.tsx`
   - `FeaturedBlogPostsPreview.tsx`
   - `HeroPreview.tsx`
   - `ServicesPreview.tsx`
   - `TestimonialsPreview.tsx`
3. **VisualBlockEditor**: Block type colors (info, success, warning, error buttons)
4. **MarkdownEditor**: HTML output for preview
5. **SectionsPage**: categoryColors for section type identification

## Components and Interfaces

### Files Requiring Updates

**Shared Components (admin/src/app/components/):**
- `IconPicker.tsx` - rgba(255,255,255,...) backgrounds
- `OptimizedImage.tsx` - rgba backgrounds, shimmer effect
- `OptimizedImageUpload.tsx` - rgba backgrounds
- `ProductCard.tsx` - rgba backgrounds
- `SectionsList.tsx` - rgba hover
- `SectionTypePicker.tsx` - rgba backgrounds
- `ImageDropzone.tsx` - rgba backgrounds
- `PageSelectorBar.tsx` - rgba hover

**Page Components:**
- `BlogManagerPage/PostsList.tsx` - rgba backgrounds
- `BlogManagerPage/CategoriesSidebar.tsx` - rgba backgrounds
- `BiddingSettingsPage/index.tsx` - rgba backgrounds
- `BiddingSettingsPage/GeneralSettingsTab.tsx` - rgba borders
- `NotificationTemplatesPage/TemplateEditModal.tsx` - nhiều rgba

**Modal Overlays (standardize to tokens.color.overlay):**
- All modal components using rgba(0,0,0,0.7)

## Data Models

N/A - This is a styling refactor, no data model changes.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No rgba(255,255,255,...) in non-excluded files
*For any* file in admin/src/app/ (excluding preview components and color pickers), there SHALL be no rgba(255,255,255,...) patterns.
**Validates: Requirements 2.1, 2.2, 4.1-4.7**

### Property 2: No hardcoded status colors in non-excluded files
*For any* file in admin/src/app/ (excluding preview components), hardcoded status colors (#EF4444, #10B981, #22C55E, #3B82F6, #F59E0B) SHALL be replaced with tokens.
**Validates: Requirements 2.4, 2.5, 2.6, 2.7**

### Property 3: Consistent modal overlays
*For any* modal overlay in admin app, the background SHALL use tokens.color.overlay.
**Validates: Requirements 2.3, 5.4**

## Error Handling

- If a file cannot be parsed, skip and report
- If replacement creates syntax error, rollback and report
- Always run typecheck after batch replacements

## Testing Strategy

### Verification Approach

1. **Pre-fix scan**: Count all hardcoded colors
2. **Post-fix scan**: Verify count reduced to expected (only intentional)
3. **Visual verification**: Check admin app in browser
4. **Typecheck**: Ensure no TypeScript errors

### Property-Based Testing

Use grep-based verification:

```bash
# Should return 0 results (excluding intentional)
grep -r "rgba(255,255,255" admin/src/app/ --include="*.tsx" | grep -v "Preview.tsx" | grep -v "type=\"color\""

# Should return 0 results for hardcoded status colors
grep -rE "#(EF4444|ef4444|10B981|10b981|22C55E|22c55e)" admin/src/app/ --include="*.tsx" | grep -v "Preview.tsx"
```

### Unit Tests

Visual regression testing via manual review in browser.

