# Implementation Plan

- [x] 1. Fix dark mode glass effect backgrounds






  - [x] 1.1 Fix BiddingSettingsPage GeneralSettingsTab glass background

    - Replace `rgba(12,12,16,0.7)` with `tokens.color.surfaceAlt`
    - Fix border string interpolation
    - _Requirements: 1.1, 1.3_

  - [x] 1.2 Fix BiddingSettingsPage ServiceFeesTab glass background

    - Replace `rgba(12,12,16,0.7)` with `tokens.color.surfaceAlt`
    - _Requirements: 1.2_

  - [x] 1.3 Fix ApiKeysPage modals dark backgrounds

    - Fix CreateApiKeyModal.tsx (3 occurrences)
    - Fix EditApiKeyModal.tsx (4 occurrences)
    - Fix KeyCreatedModal.tsx (1 occurrence)
    - Fix TestApiKeyModal.tsx (1 occurrence)
    - Replace all `rgba(12,12,16,*)` with `tokens.color.surfaceAlt`
    - _Requirements: 8.1_


  - [x] 1.4 Fix HeaderFooterEditor modal background


    - Replace `rgba(12,12,16,0.95)` with `tokens.color.surface`
    - _Requirements: 8.1_
  - [x] 1.5 Fix RegionModal input background

    - Replace `rgba(12,12,16,0.6)` with `tokens.color.inputBg`
    - _Requirements: 8.1_
  - [x] 1.6 Fix MarkdownEditor container background


    - Replace `rgba(12,12,16,0.6)` with `tokens.color.surfaceAlt`
    - _Requirements: 9.1, 9.2_


- [x] 2. Convert TemplatePicker from Tailwind to inline styles





  - [x] 2.1 Replace Tailwind dark classes with tokens

    - Replace `bg-gray-800` with `tokens.color.surface`
    - Replace `bg-gray-900` with `tokens.color.surfaceAlt`
    - Replace `bg-gray-700` with `tokens.color.surfaceHover`
    - Replace `border-gray-700` with `tokens.color.border`
    - Replace `text-white` with `tokens.color.text`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Fix button text colors for proper contrast





  - [x] 3.1 Update Button.tsx danger variant


    - Keep `#fff` for danger variant (red background needs white text)
    - Verify primary variant uses dark text on gold background
    - _Requirements: 3.1, 3.3_
  - [x] 3.2 Fix action buttons in FeesPage FeeTable


    - Verify cancel button text contrast
    - _Requirements: 3.2_
  - [x] 3.3 Fix action buttons in DashboardPage


    - Verify button text contrast
    - _Requirements: 3.2_
  - [x] 3.4 Fix action buttons in ChatPage components


    - Fix ConversationDetail.tsx
    - Fix CloseConversationModal.tsx
    - _Requirements: 3.2_



- [x] 4. Fix avatar placeholders and icon containers

  - [x] 4.1 Fix UserTable avatar placeholder


    - Replace `color: '#fff'` with `tokens.color.text`
    - _Requirements: 4.1_

  - [x] 4.2 Fix ContractorTable avatar placeholder

    - Replace `color: '#fff'` with `tokens.color.text`
    - _Requirements: 4.1_

- [x] 5. Fix hardcoded brand colors in admin UI components





  - [x] 5.1 Fix SectionsPage categoryColors


    - Replace `#f5d393` with `tokens.color.primary`
    - _Requirements: 6.1_

  - [x] 5.2 Fix SectionTypePicker color

    - Replace `#f5d393` with `tokens.color.primary`
    - _Requirements: 6.1_
  - [x] 5.3 Fix SectionsList FAB_ACTIONS color


    - Replace `#f5d393` with `tokens.color.primary`
    - _Requirements: 6.1_
  - [x] 5.4 Fix VisualBlockEditor decorative elements


    - Replace hardcoded gradients with token-based gradients
    - Keep color picker default values as they are user-configurable
    - _Requirements: 6.1, 6.2, 8.2, 8.3_

- [ ] 6. Checkpoint - Verify all changes



  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 7. Write property tests for codebase validation
  - [ ]* 7.1 Write property test for no hardcoded brand colors
    - **Property 1: No hardcoded brand colors in admin components**
    - Scan admin components (excluding previews) for `#F5D393`, `#EFB679`, `#C7A775`, `#B8860B`
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  - [ ]* 7.2 Write property test for no dark mode backgrounds
    - **Property 2: No dark mode background colors in admin UI**
    - Scan admin components (excluding previews) for `#131316`, `#1a1a1a`, `#27272A`, `rgba(12,12,16,*)`
    - **Validates: Requirements 1.1, 1.2, 8.1**

- [x] 8. Final Checkpoint - Run lint and typecheck





  - Ensure all tests pass, ask the user if questions arise.
  - Run `pnpm nx run-many --target=lint --all` - expect 0 errors, 0 warnings
  - Run `pnpm nx run-many --target=typecheck --all` - expect 0 errors
  - _Requirements: 10.1, 10.2_
