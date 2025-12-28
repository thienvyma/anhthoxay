# Implementation Plan

- [x] 1. LeadsPage Refactoring - Extract hooks and components



  - [x] 1.1 Create `useBulkSelection` hook

    - Extract bulk selection logic (selectedIds, toggleSelectAll, toggleSelectOne, clearSelection)
    - Create `admin/src/app/pages/LeadsPage/hooks/useBulkSelection.ts`
    - _Requirements: 1.2_

  - [x] 1.2 Write property test for useBulkSelection hook

    - **Property 2: Component Extraction Completeness**
    - **Validates: Requirements 1.2**

  - [x] 1.3 Create `useFurnitureQuotations` hook

    - Extract furniture quotation state and fetch logic
    - Create `admin/src/app/pages/LeadsPage/hooks/useFurnitureQuotations.ts`
    - _Requirements: 1.3_

  - [x] 1.4 Create `LeadFilters` component

    - Extract search input, status filter, source filter UI
    - Create `admin/src/app/pages/LeadsPage/components/LeadFilters.tsx`
    - _Requirements: 1.4_

  - [x] 1.5 Create `LeadStats` component

    - Extract stats cards rendering
    - Create `admin/src/app/pages/LeadsPage/components/LeadStats.tsx`
    - _Requirements: 1.5_
  - [x] 1.6 Create `BulkDeleteModal` component


    - Extract bulk delete confirmation modal
    - Create `admin/src/app/pages/LeadsPage/components/BulkDeleteModal.tsx`
    - _Requirements: 1.6_

  - [x] 1.7 Create `LeadPagination` component

    - Extract pagination controls
    - Create `admin/src/app/pages/LeadsPage/components/LeadPagination.tsx`
    - _Requirements: 1.7_

  - [x] 1.8 Refactor LeadsPage/index.tsx to use extracted components

    - Import and use all new hooks and components
    - Ensure file is under 400 lines
    - _Requirements: 1.1_

  - [x] 1.9 Write property test for LeadsPage file size

    - **Property 1: File Size Constraints**
    - **Validates: Requirements 1.1**


- [x] 2. Checkpoint - Ensure LeadsPage tests pass

  - Ensure all tests pass, ask the user if questions arise.



- [x] 3. RichTextPreview Refactoring - Extract block renderers and layouts

  - [x] 3.1 Create block type components

    - Create `admin/src/app/components/SectionEditor/previews/richtext/blocks/` directory
    - Create HeadingBlock.tsx, ParagraphBlock.tsx, ListBlock.tsx, QuoteBlock.tsx, ImageBlock.tsx, DividerBlock.tsx, CalloutBlock.tsx
    - _Requirements: 2.6_

  - [x] 3.2 Create `BlockRenderer` component

    - Create dispatcher component that routes to appropriate block component
    - Create `admin/src/app/components/SectionEditor/previews/richtext/BlockRenderer.tsx`
    - _Requirements: 2.2_

  - [x] 3.3 Create layout preview components

    - Create `admin/src/app/components/SectionEditor/previews/richtext/layouts/` directory
    - Create SplitLayoutPreview.tsx, FullWidthPreview.tsx, CenteredPreview.tsx, DefaultLayoutPreview.tsx
    - _Requirements: 2.5_

  - [x] 3.4 Refactor RichTextPreview.tsx to use extracted components


    - Import and use BlockRenderer and layout components
    - Ensure file is under 150 lines
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.5 Write property test for RichTextPreview file size

    - **Property 1: File Size Constraints**
    - **Validates: Requirements 2.1**


- [x] 4. Checkpoint - Ensure RichTextPreview tests pass

  - Ensure all tests pass, ask the user if questions arise.



- [x] 5. ContactInfoForm Refactoring

  - [x] 5.1 Create `SocialLinksEditor` component

    - Extract social links editing UI
    - Create `admin/src/app/components/SectionEditor/forms/contactinfo/SocialLinksEditor.tsx`
    - _Requirements: 3.2_

  - [x] 5.2 Create `ContactItemsEditor` component
    - Extract contact items editing UI
    - Create `admin/src/app/components/SectionEditor/forms/contactinfo/ContactItemsEditor.tsx`
    - _Requirements: 3.3_

  - [x] 5.3 Refactor ContactInfoForm.tsx to use extracted components
    - Import and use SocialLinksEditor and ContactItemsEditor
    - Ensure file is under 200 lines
    - _Requirements: 3.1, 3.4_

  - [x] 5.4 Write property test for ContactInfoForm file size
    - **Property 1: File Size Constraints**
    - **Validates: Requirements 3.1**

- [x] 6. RichTextForm Refactoring



  - [x] 6.1 Create `LayoutSelector` component

    - Extract layout options selection UI
    - Create `admin/src/app/components/SectionEditor/forms/richtext/LayoutSelector.tsx`
    - _Requirements: 4.2_

  - [x] 6.2 Create `TextAlignmentSelector` component
    - Extract text alignment configuration UI
    - Create `admin/src/app/components/SectionEditor/forms/richtext/TextAlignmentSelector.tsx`
    - _Requirements: 4.3_

  - [x] 6.3 Create `BackgroundImageConfig` component
    - Extract background image configuration UI
    - Create `admin/src/app/components/SectionEditor/forms/richtext/BackgroundImageConfig.tsx`
    - _Requirements: 4.4_
  - [x] 6.4 Create `BlockEditorSection` component

    - Extract block editor rendering
    - Create `admin/src/app/components/SectionEditor/forms/richtext/BlockEditorSection.tsx`
    - _Requirements: 4.5_

  - [x] 6.5 Refactor RichTextForm.tsx to use extracted components
    - Import and use all new components
    - Ensure file is under 200 lines
    - _Requirements: 4.1_

  - [x] 6.6 Write property test for RichTextForm file size
    - **Property 1: File Size Constraints**
    - **Validates: Requirements 4.1**

- [x] 7. Checkpoint - Ensure Form refactoring tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Portal Hardcoded Colors Cleanup


  - [x] 8.1 Audit Portal pages for hardcoded colors

    - Identify all files with hardcoded hex values
    - Document which tokens should replace each color
    - _Requirements: 5.1, 5.2_

  - [x] 8.2 Replace hardcoded colors in Portal pages
    - Import tokens from `@app/shared`
    - Replace hex values with token references or CSS variables
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 8.3 Write property test for Portal token usage
    - **Property 3: Token Usage in Refactored Files**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 9. Admin SectionEditor Hardcoded Colors Cleanup



  - [x] 9.1 Audit SectionEditor forms for hardcoded colors

    - Identify hardcoded colors in form components
    - Document exceptions for preview-specific colors
    - _Requirements: 6.1, 6.3_

  - [x] 9.2 Replace hardcoded colors in SectionEditor forms
    - Import tokens from `@app/shared`
    - Add comments for intentional preview-specific colors
    - _Requirements: 6.1, 6.2_

  - [x] 9.3 Audit SectionEditor previews for hardcoded colors
    - Identify hardcoded colors in preview components
    - Document exceptions for demo content colors
    - _Requirements: 6.2, 6.3_

  - [x] 9.4 Replace hardcoded colors in SectionEditor previews
    - Import tokens from `@app/shared` where appropriate
    - Add comments for intentional demo content colors
    - _Requirements: 6.2, 6.4_

- [x] 10. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Final Verification



  - [x] 11.1 Run full test suite


    - Execute `pnpm nx run-many --target=test --all`
    - Verify zero test failures
    - _Requirements: 7.1, 7.2_
  - [x] 11.2 Run lint check

    - Execute `pnpm nx run-many --target=lint --all`
    - Verify zero errors and zero warnings
    - _Requirements: 7.3_

  - [x] 11.3 Run typecheck
    - Execute `pnpm nx run-many --target=typecheck --all`
    - Verify zero errors
    - _Requirements: 7.4_
