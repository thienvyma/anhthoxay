# Requirements Document

## Introduction

Spec này tiếp nối `admin-light-mode` để hoàn thành việc chuyển đổi Admin Dashboard sang Light Mode. Sau khi review, phát hiện còn nhiều hardcoded colors chưa được fix trong các files:

**Vấn đề phát hiện:**
1. **rgba(0,0,0,0.7)** - Modal overlays: ~30+ occurrences (đây là overlay, có thể giữ nguyên hoặc dùng tokens.color.overlay)
2. **rgba(255,255,255,...)** - Glass effects, backgrounds: ~50+ occurrences (cần thay bằng tokens)
3. **Hardcoded hex colors** - #EF4444, #10B981, #22C55E, #3B82F6, etc.: ~100+ occurrences (cần thay bằng tokens)

**Files chưa được fix hoàn toàn:**
- `admin/src/app/components/` - IconPicker, MarkdownEditor, OptimizedImage, ProductCard, SectionsList, VisualBlockEditor, etc.
- `admin/src/app/pages/BlogManagerPage/` - PostsList, CategoriesSidebar
- `admin/src/app/pages/BiddingSettingsPage/` - GeneralSettingsTab
- `admin/src/app/pages/NotificationTemplatesPage/` - TemplateEditModal (nhiều rgba)
- Và nhiều files khác...

**Cách tiếp cận mới:**
Thay vì fix thủ công từng file (dễ bỏ sót), sẽ:
1. Tạo script tự động scan và report tất cả hardcoded colors
2. Tạo mapping rules để thay thế tự động
3. Review và fix những trường hợp đặc biệt

## Glossary

- **Hardcoded Color**: Màu sắc được viết trực tiếp trong code (hex, rgba) thay vì dùng tokens
- **adminTokens**: Design tokens cho admin app (light mode) từ `@app/shared`
- **Overlay**: Lớp phủ mờ cho modals - rgba(0,0,0,0.5-0.7) - có thể giữ nguyên
- **Glass Effect**: Hiệu ứng kính mờ với rgba - cần thay bằng solid colors

## Requirements

### Requirement 1

**User Story:** As a developer, I want a script to automatically find all hardcoded colors, so that I can identify exactly what needs to be fixed.

#### Acceptance Criteria

1. WHEN running the scan script THEN the system SHALL list all files containing hardcoded colors
2. WHEN scanning THEN the system SHALL categorize colors by type (rgba, hex, named colors)
3. WHEN scanning THEN the system SHALL show line numbers and context for each occurrence
4. WHEN scanning THEN the system SHALL exclude intentional colors (color pickers, preview components)

### Requirement 2

**User Story:** As a developer, I want consistent color replacement rules, so that all hardcoded colors are replaced with the correct tokens.

#### Acceptance Criteria

1. WHEN replacing rgba(255,255,255,0.02-0.05) THEN the system SHALL use tokens.color.surfaceAlt
2. WHEN replacing rgba(255,255,255,0.05-0.1) THEN the system SHALL use tokens.color.surfaceHover
3. WHEN replacing rgba(0,0,0,0.5-0.7) for overlays THEN the system SHALL use tokens.color.overlay
4. WHEN replacing #EF4444 or #ef4444 THEN the system SHALL use tokens.color.error
5. WHEN replacing #10B981 or #22C55E THEN the system SHALL use tokens.color.success
6. WHEN replacing #3B82F6 THEN the system SHALL use tokens.color.info
7. WHEN replacing #F59E0B THEN the system SHALL use tokens.color.warning
8. WHEN replacing #fff or #ffffff THEN the system SHALL use tokens.color.surface
9. WHEN replacing #111 or #1A1A1D THEN the system SHALL use tokens.color.text

### Requirement 3

**User Story:** As a developer, I want to exclude certain files from automatic replacement, so that intentional colors are preserved.

#### Acceptance Criteria

1. WHEN scanning THEN the system SHALL exclude color picker inputs (type="color")
2. WHEN scanning THEN the system SHALL exclude preview components (AboutPreview, BannerPreview, etc.)
3. WHEN scanning THEN the system SHALL exclude VisualBlockEditor color options
4. WHEN scanning THEN the system SHALL exclude MarkdownEditor HTML output

### Requirement 4

**User Story:** As a developer, I want all shared components to use tokens consistently, so that the light mode is complete.

#### Acceptance Criteria

1. WHEN viewing IconPicker THEN the system SHALL use tokens for all backgrounds and borders
2. WHEN viewing OptimizedImage THEN the system SHALL use tokens for loading states
3. WHEN viewing OptimizedImageUpload THEN the system SHALL use tokens for dropzone
4. WHEN viewing ProductCard THEN the system SHALL use tokens for backgrounds
5. WHEN viewing SectionsList THEN the system SHALL use tokens for hover states
6. WHEN viewing SectionTypePicker THEN the system SHALL use tokens for backgrounds
7. WHEN viewing ImageDropzone THEN the system SHALL use tokens for backgrounds

### Requirement 5

**User Story:** As a developer, I want all page components to use tokens consistently, so that the light mode is complete.

#### Acceptance Criteria

1. WHEN viewing BlogManagerPage components THEN the system SHALL use tokens for all backgrounds
2. WHEN viewing BiddingSettingsPage components THEN the system SHALL use tokens for all backgrounds
3. WHEN viewing NotificationTemplatesPage THEN the system SHALL use tokens for all backgrounds and borders
4. WHEN viewing all modal overlays THEN the system SHALL use tokens.color.overlay consistently

### Requirement 6

**User Story:** As a developer, I want adminTokens to include all necessary color values, so that no hardcoded colors are needed.

#### Acceptance Criteria

1. WHEN adminTokens is imported THEN the system SHALL provide surfaceAlt for subtle backgrounds
2. WHEN adminTokens is imported THEN the system SHALL provide surfaceHover for hover states
3. WHEN adminTokens is imported THEN the system SHALL provide overlay for modal backgrounds
4. WHEN adminTokens is imported THEN the system SHALL provide all status colors (success, error, warning, info)
5. WHEN adminTokens is imported THEN the system SHALL provide status background colors (successBg, errorBg, warningBg, infoBg)

