# Implementation Plan

## Phase 1: Admin API Client Enhancement

- [x] 1. Update Admin API Client Core





  - [x] 1.1 Update `apiFetch` function to handle paginated response format


    - Detect `{ success: true, data: [], meta: {...} }` format
    - Flatten meta into response: `{ data, total, page, limit, totalPages }`
    - Keep existing unwrap for non-paginated responses
    - _Requirements: 4.1, 4.2, 5.1_

  - [x] 1.2 Write property test for paginated response flattening

    - **Property 2: Paginated Response Flattening**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 1.3 Add `materialCategoriesApi` to `admin/src/app/api.ts`


    - Add `list()`, `get()`, `create()`, `update()`, `delete()` methods
    - _Requirements: 13.1_

  - [x] 1.4 Fix `blogCommentsApi` in `admin/src/app/api.ts`

    - Add `list(params?)` method for `/blog/comments`
    - Change `update()` to `updateStatus()` with endpoint `/blog/comments/:id/status`
    - _Requirements: 6.4, 6.5_
  - [x] 1.5 Add `formulasApi.delete()` to `admin/src/app/api.ts`


    - Add DELETE method for `/formulas/:id`
    - _Requirements: 17.1_
  - [x] 1.6 Add media API methods for MediaPage


    - Add `getUsage()` for `/media/usage`
    - Add `sync()` for `/media/sync`
    - Add `updateMetadata()` for `/media/:id` PUT
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 2. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Admin PricingConfigPage Migration

- [x] 3. Migrate PricingConfigPage/index.tsx






  - [x] 3.1 Replace direct fetch() calls with API clients

    - Import `serviceCategoriesApi`, `unitPricesApi`, `materialsApi`, `materialCategoriesApi`, `formulasApi`
    - Replace 5 fetch() calls in `fetchAllData()` with API client methods
    - Remove `credentials: 'include'`
    - _Requirements: 12.1, 11.1_
  - [x] 3.2 Write property test for JWT authorization header


    - **Property 3: JWT Authorization Header**
    - **Validates: Requirements 11.1**

- [x] 4. Migrate PricingConfigPage/ServiceCategoriesTab.tsx





  - [x] 4.1 Replace direct fetch() calls with `serviceCategoriesApi`


    - Replace `handleSave()` fetch with `serviceCategoriesApi.create/update`
    - Replace `handleDelete()` fetch with `serviceCategoriesApi.delete`
    - _Requirements: 12.2, 7.1, 7.2_

- [x] 5. Migrate PricingConfigPage/UnitPricesTab.tsx






  - [x] 5.1 Replace direct fetch() calls with `unitPricesApi`

    - Replace `handleSave()` fetch with `unitPricesApi.create/update`
    - Replace `handleDelete()` fetch with `unitPricesApi.delete`
    - _Requirements: 12.3, 7.3_

- [x] 6. Migrate PricingConfigPage/MaterialsTab.tsx





  - [x] 6.1 Replace direct fetch() calls with `materialsApi` and `materialCategoriesApi`


    - Replace material CRUD fetch calls with `materialsApi` methods
    - Replace material category CRUD fetch calls with `materialCategoriesApi` methods
    - _Requirements: 12.4, 13.2, 13.3, 7.4_

- [x] 7. Migrate PricingConfigPage/FormulasTab.tsx






  - [x] 7.1 Replace direct fetch() calls with `formulasApi`

    - Replace `handleSave()` fetch with `formulasApi.create/update`
    - Replace `handleDelete()` fetch with `formulasApi.delete`
    - _Requirements: 12.5, 17.2, 7.5_

- [x] 8. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Admin SettingsPage Migration

- [x] 9. Migrate SettingsPage/CompanyTab.tsx








  - [x] 9.1 Replace direct fetch() calls with API clients


    - Replace `handleSave()` fetch with `settingsApi.update`
    - Replace `handleBackgroundUpload()` fetch with `mediaApi.upload`
    - Replace `handleRemoveBackground()` fetch with `settingsApi.update`
    - _Requirements: 12.6, 10.1, 10.2_

- [x] 10. Migrate SettingsPage/LayoutTab.tsx






  - [x] 10.1 Replace direct fetch() calls with API clients

    - Replace mobile menu config fetch with `settingsApi.get`
    - Replace `handleSaveHeader()` fetch with `pagesApi.update`
    - Replace `handleSaveFooter()` fetch with `pagesApi.update`
    - Replace `handleSaveMobileMenu()` fetch with `settingsApi.update`
    - _Requirements: 12.7, 12.8, 8.1, 8.2_

- [x] 11. Migrate SettingsPage/PromoTab.tsx






  - [x] 11.1 Replace direct fetch() calls with API clients

    - Replace `handleSave()` fetch with `settingsApi.update`
    - Replace `handleImageUpload()` fetch with `mediaApi.upload`
    - _Requirements: 10.1, 10.2_

- [x] 12. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Admin MediaPage Migration

- [x] 13. Migrate MediaPage.tsx





  - [x] 13.1 Replace direct fetch() calls with API clients


    - Replace `loadMediaUsage()` fetch with `mediaApi.getUsage()`
    - Replace `handleSyncMedia()` fetch with `mediaApi.sync()`
    - Replace `handleSaveEdit()` fetch with `mediaApi.updateMetadata()`
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [x] 14. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Landing API Client Fix

- [x] 15. Fix Landing API Client





  - [x] 15.1 Fix `blogAPI.addComment` field name in `landing/src/app/api.ts`


    - Change parameter type from `{ author: string }` to `{ name: string }`
    - _Requirements: 1.1_
  - [x] 15.2 Write property test for blog comment field name


    - **Property 4: Blog Comment Field Name**
    - **Validates: Requirements 1.1**

- [x] 16. Fix BlogDetailPage.tsx





  - [x] 16.1 Update comment submission to use `name` field


    - Change `author: commentForm.name` to `name: commentForm.name`
    - _Requirements: 1.1_

## Phase 6: Landing Response Handling

- [x] 17. Fix Landing App Response Handling





  - [x] 17.1 Fix `landing/src/app/app.tsx` settings fetch


    - Add response unwrapping: `const data = json.data || json`
    - _Requirements: 3.5_
  - [x] 17.2 Fix `landing/src/app/pages/DynamicPage.tsx` response handling


    - Add response unwrapping after `res.json()`
    - _Requirements: 3.3_
  - [x] 17.3 Fix `landing/src/app/pages/QuotePage.tsx` response handling


    - Add response unwrapping after `res.json()`
    - _Requirements: 3.4_
  - [x] 17.4 Fix `landing/src/app/components/MobileMenu.tsx` settings fetch


    - Add response unwrapping after `res.json()`
    - _Requirements: 3.6_
  - [x] 17.5 Fix `landing/src/app/components/PromoPopup.tsx` settings fetch


    - Add response unwrapping after `res.json()`
    - _Requirements: 3.7_
  - [x] 17.6 Fix `landing/src/app/components/NewsletterSignup.tsx` error handling


    - Extract error message from `response.error.message` when submission fails
    - Display specific error message instead of generic error
    - _Requirements: 15.2_
  - [x] 17.7 Fix `landing/src/app/components/SaveQuoteModal.tsx` error handling


    - Extract error message from `response.error.message` when submission fails
    - Display specific error message instead of generic error
    - _Requirements: 15.3_
  - [x] 17.8 Fix `landing/src/app/sections/QuoteFormSection.tsx` error handling


    - Extract error message from `response.error.message` when lead submission fails
    - Display specific error message instead of generic "Có lỗi xảy ra"
    - _Requirements: 3.2, 15.1_
  - [x] 17.9 Fix `landing/src/app/sections/QuoteCalculatorSection.tsx` response handling


    - Add response unwrapping for service-categories, materials, unit-prices, QUOTE_FORM section
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [x] 18. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Admin BlogManagerPage Migration

- [x] 19. Migrate BlogManagerPage/PostsTab.tsx






  - [x] 19.1 Replace direct fetch() in MarkdownEditor onImageUpload with mediaApi.upload()

    - Import `mediaApi` from `../../api`
    - Replace fetch with `mediaApi.upload(file)` and return `result.url`
    - _Requirements: 18.1, 18.2_

- [x] 20. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Final Verification

- [x] 21. Run lint and typecheck






  - [x] 21.1 Run `pnpm nx run-many --target=lint --all`

    - Fix any lint errors

  - [x] 21.2 Run `pnpm nx run-many --target=typecheck --all`

    - Fix any type errors

- [x] 22. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
