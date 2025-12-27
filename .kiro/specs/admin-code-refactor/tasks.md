# Implementation Plan

## Phase 1: Refactor LeadsPage

- [x] 1. Refactor LeadsPage structure and components


  - [x] 1.1 Create LeadsPage folder structure


    - Create `admin/src/app/pages/LeadsPage/` folder
    - Create `index.tsx` as main entry point
    - Create `types.ts` for shared type definitions
    - Create `components/` subfolder
    - _Requirements: 1.1, 1.7_
  - [x] 1.2 Extract QuoteDataDisplay component

    - Move QuoteDataDisplay to `LeadsPage/components/QuoteDataDisplay.tsx`
    - Export from components/index.ts
    - Update imports in index.tsx
    - _Requirements: 1.2_
  - [x] 1.3 Extract NotesEditor component

    - Move NotesEditor to `LeadsPage/components/NotesEditor.tsx`
    - Export from components/index.ts
    - Update imports in index.tsx
    - _Requirements: 1.3_
  - [x] 1.4 Extract StatusHistory component

    - Move StatusHistory to `LeadsPage/components/StatusHistory.tsx`
    - Export from components/index.ts
    - Update imports in index.tsx
    - _Requirements: 1.4_
  - [x] 1.5 Extract FurnitureQuotationHistory component

    - Move FurnitureQuotationHistory to `LeadsPage/components/FurnitureQuotationHistory.tsx`
    - Export from components/index.ts
    - Update imports in index.tsx
    - _Requirements: 1.5_
  - [x] 1.6 Extract LeadDetailModal component

    - Move modal content to `LeadsPage/components/LeadDetailModal.tsx`
    - Export from components/index.ts
    - Update imports in index.tsx
    - _Requirements: 1.6_
  - [x] 1.7 Verify LeadsPage refactoring

    - Ensure index.tsx is under 400 lines
    - Run lint and typecheck
    - Verify UI functionality
    - _Requirements: 1.8, 8.2, 8.3_
  - [x]* 1.8 Write property test for LeadsPage file size


    - **Property 1: File size constraints after refactoring**
    - **Validates: Requirements 1.8**

## Phase 2: Refactor UsersPage

- [x] 2. Refactor UsersPage structure and components





  - [x] 2.1 Create UsersPage folder structure


    - Create `admin/src/app/pages/UsersPage/` folder
    - Create `index.tsx` as main entry point
    - Create `types.ts` for shared type definitions
    - Create `components/` subfolder
    - _Requirements: 2.1, 2.6_
  - [x] 2.2 Extract UserTable component


    - Extract table rendering to `UsersPage/components/UserTable.tsx`
    - Include columns definition and actions renderer
    - _Requirements: 2.2_
  - [x] 2.3 Extract CreateUserModal component


    - Move create modal to `UsersPage/components/CreateUserModal.tsx`
    - _Requirements: 2.3_
  - [x] 2.4 Extract EditUserModal component


    - Move edit modal to `UsersPage/components/EditUserModal.tsx`
    - _Requirements: 2.4_
  - [x] 2.5 Extract SessionsModal component


    - Move sessions modal to `UsersPage/components/SessionsModal.tsx`
    - _Requirements: 2.5_
  - [x] 2.6 Verify UsersPage refactoring


    - Ensure index.tsx is under 300 lines
    - Run lint and typecheck
    - Verify UI functionality
    - _Requirements: 2.7, 8.2, 8.3_

  - [ ]* 2.7 Write property test for UsersPage file size
    - **Property 1: File size constraints after refactoring**
    - **Validates: Requirements 2.7**

- [x] 3. Checkpoint - Verify Pages Refactoring


  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Refactor SectionEditor Forms

- [x] 4. Refactor SectionEditor forms structure





  - [x] 4.1 Create forms folder structure


    - Create `admin/src/app/components/SectionEditor/forms/` folder
    - Create `shared/` subfolder for shared components
    - Create `index.tsx` with renderFormFields switch statement
    - _Requirements: 3.1, 3.3_
  - [x] 4.2 Extract shared form components

    - Extract InfoBanner to `forms/shared/InfoBanner.tsx`
    - Extract ImageSection to `forms/shared/ImageSection.tsx`
    - Extract ArraySection to `forms/shared/ArraySection.tsx`
    - Extract CTASection to `forms/shared/CTASection.tsx`
    - Extract ButtonSection to `forms/shared/ButtonSection.tsx`
    - Extract RangeInput to `forms/shared/RangeInput.tsx`
    - Extract RadioGroup to `forms/shared/RadioGroup.tsx`
    - Create `forms/shared/index.ts` for exports
    - _Requirements: 3.4_
  - [x] 4.3 Extract Hero and CTA forms


    - Extract HeroForm to `forms/HeroForm.tsx`
    - Extract HeroSimpleForm to `forms/HeroSimpleForm.tsx`
    - Extract CTAForm to `forms/CTAForm.tsx`
    - _Requirements: 3.2_
  - [x] 4.4 Extract content section forms


    - Extract RichTextForm to `forms/RichTextForm.tsx`
    - Extract BannerForm to `forms/BannerForm.tsx`
    - Extract AboutForm to `forms/AboutForm.tsx`
    - Extract FAQForm to `forms/FAQForm.tsx`
    - _Requirements: 3.2_
  - [x] 4.5 Extract contact and social forms


    - Extract ContactInfoForm to `forms/ContactInfoForm.tsx`
    - Extract QuickContactForm to `forms/QuickContactForm.tsx`
    - Extract SocialMediaForm to `forms/SocialMediaForm.tsx`
    - Extract FooterSocialForm to `forms/FooterSocialForm.tsx`
    - _Requirements: 3.2_
  - [x] 4.6 Extract feature and stats forms


    - Extract TestimonialsForm to `forms/TestimonialsForm.tsx`
    - Extract StatsForm to `forms/StatsForm.tsx`
    - Extract FeaturesForm to `forms/FeaturesForm.tsx`
    - Extract MissionVisionForm to `forms/MissionVisionForm.tsx`

    - _Requirements: 3.2_
  - [x] 4.7 Extract blog and media forms



    - Extract FeaturedBlogPostsForm to `forms/FeaturedBlogPostsForm.tsx`
    - Extract BlogListForm to `forms/BlogListForm.tsx`
    - Extract MediaGalleryForm to `forms/MediaGalleryForm.tsx`
    - Extract VideoShowcaseForm to `forms/VideoShowcaseForm.tsx`
    - Extract FeaturedSlideshowForm to `forms/FeaturedSlideshowForm.tsx`
    - _Requirements: 3.2_

  - [x] 4.8 Extract quote and action forms

    - Extract QuoteFormForm to `forms/QuoteFormForm.tsx`
    - Extract QuoteCalculatorForm to `forms/QuoteCalculatorForm.tsx`
    - Extract FABActionsForm to `forms/FABActionsForm.tsx`
    - Extract ServicesForm to `forms/ServicesForm.tsx`
    - Extract MarketplaceForm to `forms/MarketplaceForm.tsx`
    - Extract FurnitureQuoteForm to `forms/FurnitureQuoteForm.tsx`
    - _Requirements: 3.2_
  - [x] 4.9 Remove old forms.tsx and verify


    - Delete original `forms.tsx` file
    - Update imports in SectionEditor/index.tsx
    - Run lint and typecheck
    - Verify each form file is under 200 lines

    - _Requirements: 3.5, 3.6, 8.2, 8.3_
  - [ ]* 4.10 Write property test for form file sizes
    - **Property 2: Form file size constraints**
    - **Validates: Requirements 3.5**

## Phase 4: Refactor SectionEditor Previews

- [x] 5. Refactor SectionEditor previews structure
  - [x] 5.1 Create previews folder structure
    - Create `admin/src/app/components/SectionEditor/previews/` folder
    - Create `index.tsx` with renderPreview switch statement
    - _Requirements: 4.1, 4.3_
  - [x] 5.2 Extract Hero and CTA previews
    - Extract HeroPreview to `previews/HeroPreview.tsx`
    - Extract HeroSimplePreview to `previews/HeroSimplePreview.tsx`
    - Extract CTAPreview to `previews/CTAPreview.tsx`
    - _Requirements: 4.2_
  - [x] 5.3 Extract content section previews
    - Extract RichTextPreview to `previews/RichTextPreview.tsx`
    - Extract BannerPreview to `previews/BannerPreview.tsx`
    - Extract AboutPreview to `previews/AboutPreview.tsx`
    - Extract FAQPreview to `previews/FAQPreview.tsx`
    - _Requirements: 4.2_
  - [x] 5.4 Extract contact and social previews
    - Extract ContactInfoPreview to `previews/ContactInfoPreview.tsx`
    - Extract QuickContactPreview to `previews/QuickContactPreview.tsx`
    - Extract SocialMediaPreview to `previews/SocialMediaPreview.tsx`
    - Extract FooterSocialPreview to `previews/FooterSocialPreview.tsx`
    - _Requirements: 4.2_
  - [x] 5.5 Extract feature and stats previews
    - Extract TestimonialsPreview to `previews/TestimonialsPreview.tsx`
    - Extract StatsPreview to `previews/StatsPreview.tsx`
    - Extract FeaturesPreview to `previews/FeaturesPreview.tsx`
    - Extract MissionVisionPreview to `previews/MissionVisionPreview.tsx`
    - _Requirements: 4.2_
  - [x] 5.6 Extract remaining previews
    - Extract all remaining preview components
    - Each preview file should be under 150 lines
    - _Requirements: 4.2, 4.4_
  - [x] 5.7 Remove old previews.tsx and verify
    - Delete original `previews.tsx` file
    - Update imports in SectionEditor/index.tsx

    - Run lint and typecheck
    - _Requirements: 4.5, 8.2, 8.3_
  - [ ]* 5.8 Write property test for preview file sizes
    - **Property 3: Preview file size constraints**
    - **Validates: Requirements 4.4**

- [x] 6. Checkpoint - Verify SectionEditor Refactoring





  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Refactor SettingsPage LayoutTab

- [x] 7. Refactor SettingsPage LayoutTab components





  - [x] 7.1 Extract HeaderEditor component


    - Create `SettingsPage/components/HeaderEditor.tsx`
    - Move header configuration UI
    - Include logo, navigation, and CTA editing
    - _Requirements: 5.1_
  - [x] 7.2 Extract FooterEditor component


    - Create `SettingsPage/components/FooterEditor.tsx`
    - Move footer configuration UI
    - Include brand, quick links, newsletter, social, copyright
    - _Requirements: 5.2_
  - [x] 7.3 Extract NavigationEditor component


    - Create `SettingsPage/components/NavigationEditor.tsx`
    - Move navigation items editing with drag-drop
    - Reusable for header and mobile menu
    - _Requirements: 5.3_
  - [x] 7.4 Verify LayoutTab refactoring


    - Ensure LayoutTab.tsx is under 400 lines

    - Run lint and typecheck
    - Verify UI functionality
    - _Requirements: 5.4, 8.2, 8.3_
  - [ ]* 7.5 Write property test for LayoutTab file size
    - **Property 1: File size constraints after refactoring**
    - **Validates: Requirements 5.4**

## Phase 6: Refactor FurniturePage Tabs

- [x] 8. Refactor FurniturePage tab components









  - [x] 8.1 Extract CategoryList component

    - Create `FurniturePage/components/CategoryList.tsx`
    - Move category list rendering from CatalogTab
    - _Requirements: 6.1_

  - [x] 8.2 Extract ProductGrid component

    - Create `FurniturePage/components/ProductGrid.tsx`
    - Move product grid rendering from CatalogTab
    - _Requirements: 6.2_
  - [x] 8.3 Extract CategoryForm and ProductForm modals


    - Create `FurniturePage/components/CategoryForm.tsx`
    - Create `FurniturePage/components/ProductForm.tsx`
    - Move modal content from CatalogTab
    - _Requirements: 6.3_

  - [x] 8.4 Extract ComboTable component

    - Create `FurniturePage/components/ComboTable.tsx`
    - Move table rendering from ComboTab
    - _Requirements: 6.4_

  - [x] 8.5 Extract ComboForm modal

    - Create `FurniturePage/components/ComboForm.tsx`
    - Move modal content from ComboTab
    - _Requirements: 6.5_
  - [x] 8.6 Verify FurniturePage refactoring


    - Ensure CatalogTab.tsx is under 500 lines

    - Ensure ComboTab.tsx is under 500 lines
    - Run lint and typecheck
    - Verify UI functionality
    - _Requirements: 6.6, 8.2, 8.3_
  - [ ]* 8.7 Write property test for Tab file sizes
    - **Property 1: File size constraints after refactoring**
    - **Validates: Requirements 6.6**

## Phase 7: Refactor Landing FurnitureQuote



- [x] 9. Refactor FurnitureQuote section components




  - [x] 9.1 Create FurnitureQuote components folder

    - Create `landing/src/app/sections/FurnitureQuote/components/` folder
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.2 Extract StepIndicator component

    - Create `FurnitureQuote/components/StepIndicator.tsx`
    - Move StepIndicator from index.tsx
    - _Requirements: 7.3_
  - [x] 9.3 Extract SelectionCard component


    - Create `FurnitureQuote/components/SelectionCard.tsx`
    - Move SelectionCard from index.tsx
    - _Requirements: 7.1_

  - [x] 9.4 Extract NavigationButtons component

    - Create `FurnitureQuote/components/NavigationButtons.tsx`
    - Move navigation buttons from index.tsx
    - _Requirements: 7.2_

  - [x] 9.5 Create types.ts for FurnitureQuote

    - Create `FurnitureQuote/types.ts`
    - Move shared type definitions
    - _Requirements: 7.4_

  - [x] 9.6 Verify FurnitureQuote refactoring


    - Ensure index.tsx is under 600 lines
    - Run lint and typecheck
    - Verify UI functionality
    - _Requirements: 7.5, 8.2, 8.3_
  - [ ]* 9.7 Write property test for FurnitureQuote file size
    - **Property 1: File size constraints after refactoring**
    - **Validates: Requirements 7.5**

## Phase 8: Final Verification






- [x] 10. Final verification and quality checks







  - [x] 10.1 Run full lint check


    - Execute `pnpm nx run-many --target=lint --all`
    - Ensure 0 errors and 0 warnings
    - _Requirements: 8.2_


  - [x] 10.2 Run full typecheck


    - Execute `pnpm nx run-many --target=typecheck --all`
    - Ensure 0 errors
    - _Requirements: 8.3_


  - [x] 10.3 Verify token usage


    - Check all refactored files use `tokens` from `@app/shared`
    - No hardcoded color values
    - _Requirements: 8.4_


  - [x] 10.4 Verify icon consistency




    - Check all refactored files use Remix Icon (`ri-*`)
    - _Requirements: 8.5_

  - [x] 10.5 Verify naming conventions

    - All components use PascalCase
    - All functions use camelCase
    - Filenames match component names
    - _Requirements: 8.6_

  - [x]* 10.6 Write property tests for code quality

    - **Property 4: Lint compliance**
    - **Property 5: TypeScript compliance**
    - **Property 6: Token usage for styling**
    - **Property 7: Icon consistency**
    - **Property 8: Naming convention compliance**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6**



- [x] 11. Final Checkpoint




wd  
  - Ensure all tests pass, ask the user if questions arise.
