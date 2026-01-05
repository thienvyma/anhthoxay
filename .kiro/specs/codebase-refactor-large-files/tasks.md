# Implementation Plan

> Refactor các file lớn (>500 lines) trong codebase thành modules nhỏ hơn, dễ maintain và test.
> Áp dụng patterns: Extract Component, Extract Hook, Extract Service, và Re-export Pattern.

- [x] 1. Refactor external-api.routes.ts (2076 → ~80 lines main)


  - [x] 1.1 Create folder `api/src/routes/external-api/` and `schemas.ts`

    - Create directory structure
    - Extract all shared schemas (LeadsQuerySchema, CreateLeadSchema, etc.)
    - _Requirements: 5.1, 5.2_
  - [x] 1.2 Create `leads.routes.ts`

    - Move GET /leads, POST /leads, GET /leads/stats endpoints
    - _Requirements: 5.3, 5.6_
  - [x] 1.3 Create `blog.routes.ts`

    - Move GET /blog/posts, GET /blog/posts/:slug, GET /blog/categories endpoints
    - _Requirements: 5.3, 5.6_
  - [x] 1.4 Create `projects.routes.ts`

    - Move GET /projects, GET /projects/:id endpoints
    - _Requirements: 5.3, 5.6_
  - [x] 1.5 Create `contractors.routes.ts`

    - Move GET /contractors endpoint
    - _Requirements: 5.3, 5.6_
  - [x] 1.6 Create `reports.routes.ts`

    - Move GET /reports/dashboard endpoint
    - _Requirements: 5.3, 5.6_
  - [x] 1.7 Create `pricing.routes.ts`

    - Move all /pricing/* endpoints
    - _Requirements: 5.3, 5.6_
  - [x] 1.8 Create `furniture.routes.ts`

    - Move all /furniture/* endpoints
    - _Requirements: 5.3, 5.6_
  - [x] 1.9 Create `index.ts` main router

    - Mount all sub-routes, export createExternalApiRoutes function
    - _Requirements: 5.3, 5.4, 5.5_
  - [x] 1.10 Update main.ts import and run lint + typecheck

    - Change import path, verify backward compatibility, ensure 0 errors
    - _Requirements: 5.4, Constraints_
    - NOTE: media.routes.ts và settings.routes.ts không có trong file gốc nên không cần tạo

- [x] 2. Checkpoint - Verify external-api refactor


  - Run lint + typecheck, ensure all tests pass

- [x] 3. Refactor VisualBlockEditor (1589 → ~200 lines main)
  - [x] 3.1 Create folder and extract types/constants/utils
    - Create `admin/src/app/components/VisualBlockEditor/`
    - Create types.ts, constants.ts, utils.ts
    - _Requirements: 1.1_
  - [x] 3.2 Create block components in `blocks/` folder
    - HeadingBlock, ParagraphBlock, ListBlock, QuoteBlock
    - ImageBlock, CalloutBlock, DividerBlock, ColumnsBlock
    - _Requirements: 1.2, 1.5_
  - [x] 3.3 Create supporting components
    - BlockEditor.tsx, BlockItem.tsx, BlockPickerModal.tsx
    - BlocksPreview.tsx, RichTextInput.tsx, AlignmentSelector.tsx
    - _Requirements: 1.2_
  - [x] 3.4 Refactor main component and create index.tsx
    - Keep only orchestration logic, re-export for backward compatibility
    - _Requirements: 1.3, 1.4_
  - [x] 3.5 Run lint + typecheck, fix errors
    - Ensure 0 errors, 0 warnings
    - _Requirements: Constraints_

- [x] 4. Checkpoint - Verify VisualBlockEditor refactor
  - Run lint + typecheck, manual test in Admin app

- [x] 5. Refactor FurnitureQuote (1820 → ~300 lines main)



  - [x] 5.1 Create constants.ts and hooks folder
    - Extract ITEMS_PER_PAGE, step configs


    - Create hooks/ folder structure

    - _Requirements: 3.1_
  - [x] 5.2 Create custom hooks
    - useFurnitureData.ts, useSelections.ts, useQuotation.ts, usePagination.ts
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 5.3 Create step components in `steps/` folder

    - DeveloperStep, ProjectStep, BuildingStep, UnitStep
    - LayoutStep, LeadInfoStep, ProductStep, ConfirmStep
    - _Requirements: 3.4, 3.6_
  - [x] 5.4 Refactor main index.tsx


    - Import and use hooks and step components
    - Keep only orchestration logic
    - _Requirements: 3.5_

  - [x] 5.5 Run lint + typecheck, fix errors

    - Ensure 0 errors, 0 warnings



    - _Requirements: Constraints_

- [x] 6. Checkpoint - Verify FurnitureQuote refactor





  - Run lint + typecheck, manual test in Landing app

- [x] 7. Refactor RichTextSection (1024 → ~150 lines main)








  - [x] 7.1 Create folder and extract types/utils/styles

    - Create `landing/src/app/sections/RichTextSection/`
    - Create types.ts, utils.ts, styles.ts
    - _Requirements: 4.1_

  - [x] 7.2 Create block components in `blocks/` folder

    - HeadingBlock, ParagraphBlock, ListBlock, QuoteBlock
    - ImageBlock, CalloutBlock, DividerBlock, ColumnsBlock
    - _Requirements: 4.2, 4.4_

  - [x] 7.3 Create BlockRenderer.tsx and refactor main component




    - Create index.tsx with re-exports
    - _Requirements: 4.2, 4.3_
  - [x] 7.4 Run lint + typecheck, fix errors



    - Ensure 0 errors, 0 warnings
    - _Requirements: Constraints_

- [x] 8. Checkpoint - Verify RichTextSection refactor
  - Run lint + typecheck, manual test in Landing app


- [x] 9. Refactor ApiKeyDetailPanel (1138 → ~200 lines main)




  - [x] 9.1 Create folder and extract types/constants/utils


    - Create `admin/src/app/pages/ApiKeysPage/components/ApiKeyDetailPanel/`
    - Create types.ts, constants.ts, utils.ts
    - _Requirements: 2.1, 2.2_
  - [x] 9.2 Create section components


    - InfoSection.tsx, ExpirationWarning.tsx, UsageStats.tsx
    - UsageLogs.tsx, EndpointGroups.tsx
    - _Requirements: 2.1, 2.4_
  - [x] 9.3 Refactor main component and create index.tsx


    - Keep only layout and state logic, re-export for backward compatibility
    - _Requirements: 2.3_
  - [x] 9.4 Run lint + typecheck, fix errors


    - Ensure 0 errors, 0 warnings
    - _Requirements: Constraints_

- [x] 10. Checkpoint - Verify ApiKeyDetailPanel refactor



  - Run lint + typecheck, manual test in Admin app

- [x] 11. Refactor Layout.tsx (901 → ~150 lines main)




  - [x] 11.1 Create folder and extract types/constants


    - Create `admin/src/app/components/Layout/`
    - Create types.ts, constants.ts
    - _Requirements: 6.1, 6.2_
  - [x] 11.2 Create navigation hook and components


    - hooks/useNavigation.ts
    - MenuItem.tsx, DropdownMenu.tsx
    - _Requirements: 6.2, 6.5_
  - [x] 11.3 Create layout components


    - Sidebar.tsx, MobileSidebar.tsx, Header.tsx, UserInfo.tsx
    - _Requirements: 6.1, 6.5_
  - [x] 11.4 Refactor main component and create index.tsx


    - Keep only main layout structure, re-export for backward compatibility
    - _Requirements: 6.4_
  - [x] 11.5 Run lint + typecheck, fix errors


    - Ensure 0 errors, 0 warnings
    - _Requirements: Constraints_

- [x] 12. Checkpoint - Verify Layout refactor





  - Run lint + typecheck, manual test in Admin app

- [x] 13. Refactor project.service.ts (978 → ~200 lines main)








  - [x] 13.1 Create folder and extract types/constants/helpers



    - Create `api/src/services/project/`
    - Create types.ts, constants.ts, helpers.ts
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 13.2 Create service modules

    - crud.service.ts, query.service.ts, status.service.ts
    - _Requirements: 7.1, 7.4_

  - [x] 13.3 Create index.ts with re-exports

    - Re-export ProjectService class for backward compatibility
    - _Requirements: 7.5_

  - [x] 13.4 Run lint + typecheck, fix errors

    - Ensure 0 errors, 0 warnings
    - _Requirements: Constraints_

- [x] 14. Checkpoint - Verify project.service refactor


  - Run lint + typecheck, ensure all tests pass

- [x] 15. Refactor furniture.routes.ts (935 → ~80 lines main)






  - [x] 15.1 Create folder `api/src/routes/furniture/`

    - Create directory structure
    - _Requirements: 8.1_

  - [x] 15.2 Create route modules

    - category.routes.ts, product.routes.ts, quotation.routes.ts
    - developer.routes.ts, project.routes.ts, fee.routes.ts, admin.routes.ts

    - _Requirements: 8.1, 8.4_
  - [x] 15.3 Create index.ts main router

    - Mount all sub-routes, export createFurnitureRoutes function
    - _Requirements: 8.2, 8.3_

  - [x] 15.4 Update main.ts import and run lint + typecheck

    - Change import path, verify backward compatibility, ensure 0 errors
    - _Requirements: 8.2, Constraints_

- [x] 16. Final Verification





  - [x] 16.1 Run full lint + typecheck

    - `pnpm nx run-many --target=lint --all`
    - `pnpm nx run-many --target=typecheck --all`
    - _Requirements: Constraints_

  - [x] 16.2 Run all tests

    - `pnpm nx run-many --target=test --all`
    - _Requirements: Constraints_

  - [x] 16.3 Manual testing

    - Test Admin app: VisualBlockEditor, ApiKeyDetailPanel, Layout
    - Test Landing app: FurnitureQuote, RichTextSection
    - Test API: external API, furniture API
    - _Requirements: Constraints_

  - [x] 16.4 Update DAILY_CHANGELOG.md

    - Document all changes
    - _Requirements: Constraints_
