# Requirements Document

## Introduction

This feature focuses on refactoring large files in the ANH THỢ XÂY codebase to improve maintainability, readability, and adherence to code quality standards. The refactoring targets files that exceed their specified line limits as identified by property-based tests, as well as addressing hardcoded colors that should use design tokens.

## Glossary

- **Design Tokens**: Centralized style values (colors, spacing, etc.) imported from `@app/shared`
- **Component Extraction**: Breaking a large component into smaller, focused sub-components
- **Line Limit**: Maximum number of lines a file should contain for maintainability
- **Hardcoded Color**: A color value written directly in code (e.g., `#F5D393`) instead of using tokens

## Requirements

### Requirement 1: LeadsPage Refactoring

**User Story:** As a developer, I want the LeadsPage component to be under 400 lines, so that the code is easier to maintain and understand.

#### Acceptance Criteria

1. WHEN the LeadsPage/index.tsx file is analyzed THEN the system SHALL report fewer than 400 lines of code
2. WHEN bulk selection logic is needed THEN the system SHALL import it from a separate `useBulkSelection` hook
3. WHEN furniture quotation state is needed THEN the system SHALL import it from a separate `useFurnitureQuotations` hook
4. WHEN filter/search UI is rendered THEN the system SHALL use a separate `LeadFilters` component
5. WHEN stats cards are rendered THEN the system SHALL use a separate `LeadStats` component
6. WHEN bulk delete confirmation modal is shown THEN the system SHALL use a separate `BulkDeleteModal` component
7. WHEN pagination UI is rendered THEN the system SHALL use a separate `LeadPagination` component

### Requirement 2: RichTextPreview Refactoring

**User Story:** As a developer, I want the RichTextPreview component to be under 150 lines, so that preview rendering logic is modular and testable.

#### Acceptance Criteria

1. WHEN the RichTextPreview.tsx file is analyzed THEN the system SHALL report fewer than 150 lines of code
2. WHEN a block needs to be rendered THEN the system SHALL delegate to a `BlockRenderer` component
3. WHEN light theme blocks are rendered THEN the system SHALL use a separate `LightBlockRenderer` component
4. WHEN dark theme blocks are rendered THEN the system SHALL use a separate `DarkBlockRenderer` component
5. WHEN layout-specific previews are needed THEN the system SHALL use separate layout components (SplitLayoutPreview, FullWidthPreview, CenteredPreview)
6. WHEN block type-specific rendering is needed THEN the system SHALL use individual block components (HeadingBlock, ParagraphBlock, ListBlock, QuoteBlock, ImageBlock, DividerBlock)

### Requirement 3: ContactInfoForm Refactoring

**User Story:** As a developer, I want the ContactInfoForm component to be under 200 lines, so that form logic is focused and maintainable.

#### Acceptance Criteria

1. WHEN the ContactInfoForm.tsx file is analyzed THEN the system SHALL report fewer than 200 lines of code
2. WHEN social links are edited THEN the system SHALL use a separate `SocialLinksEditor` component
3. WHEN contact items are edited THEN the system SHALL use a separate `ContactItemsEditor` component
4. WHEN shared form sections are needed THEN the system SHALL import from the shared components directory

### Requirement 4: RichTextForm Refactoring

**User Story:** As a developer, I want the RichTextForm component to be under 200 lines, so that the rich text editing interface is modular.

#### Acceptance Criteria

1. WHEN the RichTextForm.tsx file is analyzed THEN the system SHALL report fewer than 200 lines of code
2. WHEN layout options are selected THEN the system SHALL use a separate `LayoutSelector` component
3. WHEN text alignment is configured THEN the system SHALL use a separate `TextAlignmentSelector` component
4. WHEN background image is configured THEN the system SHALL use a separate `BackgroundImageConfig` component
5. WHEN the block editor is rendered THEN the system SHALL use a separate `BlockEditorSection` component

### Requirement 5: Portal Hardcoded Colors Cleanup

**User Story:** As a developer, I want Portal pages to use design tokens instead of hardcoded colors, so that the UI is consistent and themeable.

#### Acceptance Criteria

1. WHEN styling Portal components THEN the system SHALL import tokens from `@app/shared` or use CSS variables
2. WHEN a color value is needed THEN the system SHALL NOT use hardcoded hex values like `#F5D393`, `#131316`, etc.
3. WHEN the hardcoded colors test runs THEN the system SHALL report zero hardcoded color instances in refactored files
4. WHEN theme switching occurs THEN the system SHALL correctly apply the new theme colors

### Requirement 6: Admin SectionEditor Hardcoded Colors Cleanup

**User Story:** As a developer, I want SectionEditor forms and previews to use design tokens, so that the admin UI is consistent.

#### Acceptance Criteria

1. WHEN styling SectionEditor form components THEN the system SHALL import tokens from `@app/shared`
2. WHEN styling SectionEditor preview components THEN the system SHALL use tokens for themeable colors
3. WHEN preview-specific colors are needed (for demonstrating user content) THEN the system MAY use inline colors with a comment explaining the exception
4. WHEN the code quality test runs THEN the system SHALL report minimal hardcoded color warnings

### Requirement 7: Test Compliance

**User Story:** As a developer, I want all property-based tests to pass after refactoring, so that code quality standards are enforced.

#### Acceptance Criteria

1. WHEN `pnpm nx run admin:test` is executed THEN the system SHALL report zero test failures for file-size.property.test.ts
2. WHEN `pnpm nx run-many --target=test --all` is executed THEN the system SHALL report zero test failures
3. WHEN `pnpm nx run-many --target=lint --all` is executed THEN the system SHALL report zero errors and zero warnings
4. WHEN `pnpm nx run-many --target=typecheck --all` is executed THEN the system SHALL report zero errors
