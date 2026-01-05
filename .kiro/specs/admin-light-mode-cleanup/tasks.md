# Implementation Plan

- [x] 1. Scan và phân loại hardcoded colors




  - [ ] 1.1 Scan rgba(255,255,255,...) patterns
    - Chạy grep để tìm tất cả occurrences
    - Phân loại theo file và context

    - Xác định files cần exclude (preview, color picker)
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_
  - [x] 1.2 Scan rgba(0,0,0,...) patterns

    - Chạy grep để tìm tất cả modal overlays
    - Xác định pattern cần standardize
    - _Requirements: 1.1, 1.2_




  - [ ] 1.3 Scan hardcoded hex colors
    - Tìm #EF4444, #10B981, #22C55E, #3B82F6, #F59E0B

    - Tìm #fff, #ffffff, #111, #374151, #9ca3af
    - _Requirements: 1.1, 1.2_


- [-] 2. Fix shared components

  - [x] 2.1 Fix IconPicker.tsx

    - Replace rgba(255,255,255,0.05) → tokens.color.surfaceHover

    - Replace rgba(255,255,255,0.03) → tokens.color.surfaceAlt
    - _Requirements: 4.1_


  - [ ] 2.2 Fix OptimizedImage.tsx
    - Replace rgba(255,255,255,0.03) shimmer → tokens.color.surfaceAlt

    - Replace rgba(255,255,255,0.3) text → tokens.color.muted
    - _Requirements: 4.2_


  - [ ] 2.3 Fix OptimizedImageUpload.tsx
    - Replace rgba(255,255,255,0.02) → tokens.color.surfaceAlt
    - Replace rgba(255,255,255,0.9) → tokens.color.text

    - _Requirements: 4.3_

  - [ ] 2.4 Fix ProductCard.tsx
    - Replace rgba(255,255,255,0.05) → tokens.color.surfaceHover




    - _Requirements: 4.4_
  - [ ] 2.5 Fix SectionsList.tsx
    - Replace rgba(255,255,255,0.06) hover → tokens.color.surfaceHover

    - _Requirements: 4.5_
  - [x] 2.6 Fix SectionTypePicker.tsx

    - Replace rgba(255,255,255,0.02) → tokens.color.surfaceAlt

    - _Requirements: 4.6_
  - [x] 2.7 Fix ImageDropzone.tsx

    - Replace rgba(255,255,255,0.1) → tokens.color.border
    - Replace rgba(255,255,255,0.02) → tokens.color.surfaceAlt


    - Replace rgba(239, 68, 68, 0.05) → tokens.color.errorBg

    - _Requirements: 4.7_

  - [ ] 2.8 Fix PageSelectorBar.tsx
    - Replace rgba(255,255,255,0.08) hover → tokens.color.surfaceHover
    - _Requirements: 4.1_


- [x] 3. Fix BlogManagerPage components

  - [ ] 3.1 Fix PostsList.tsx
    - Replace rgba(255,255,255,0.02) → tokens.color.surfaceAlt
    - Replace rgba(255,255,255,0.04) hover → tokens.color.surfaceHover
    - _Requirements: 5.1_
  - [ ] 3.2 Fix CategoriesSidebar.tsx
    - Replace rgba(255,255,255,0.02) → tokens.color.surfaceAlt
    - _Requirements: 5.1_

- [ ] 4. Fix BiddingSettingsPage components
  - [ ] 4.1 Fix index.tsx
    - Replace rgba(255,255,255,0.02) → tokens.color.surfaceAlt
    - _Requirements: 5.2_
  - [ ] 4.2 Fix GeneralSettingsTab.tsx
    - Replace rgba(255,255,255,0.08) border → tokens.color.border
    - Replace glass effect với solid colors
    - _Requirements: 5.2_



- [ ] 5. Fix NotificationTemplatesPage
  - [ ] 5.1 Fix TemplateEditModal.tsx
    - Replace tất cả rgba(255,255,255,...) với tokens

    - Replace glass effect với solid colors
    - Update input backgrounds và borders
    - _Requirements: 5.3_



- [ ] 6. Standardize modal overlays
  - [x] 6.1 Update all modal overlays to use tokens.color.overlay

    - ResponsiveModal.tsx
    - ContractorsPage/VerifyModal.tsx
    - SettingsPage/ServiceFeesTab.tsx

    - ProjectsPage/ProjectDetailModal.tsx, ApprovalModal.tsx

    - RegionsPage/RegionModal.tsx, DeleteModal.tsx
    - PricingConfigPage/MaterialsTab.tsx, ServiceCategoriesTab.tsx, UnitPricesTab.tsx, FormulasTab.tsx
    - ContractorsPage/ProfileModal.tsx
    - MatchesPage/EscrowActionModal.tsx, MatchDetailModal.tsx
    - LeadsPage/BulkDeleteModal.tsx
    - FeesPage/FeeDetailModal.tsx
    - DisputesPage/DisputeDetailModal.tsx, ResolveDisputeModal.tsx
    - ChatPage/CloseConversationModal.tsx
    - BiddingSettingsPage/ServiceFeesTab.tsx
    - BidsPage/BidDetailModal.tsx, ApprovalModal.tsx
    - BlogManagerPage/CategoryModal.tsx
    - _Requirements: 5.4_

- [ ] 7. Fix remaining hardcoded hex colors
  - [ ] 7.1 Fix VisualBlockEditor.tsx (partial - keep intentional)
    - Replace #EF4444 delete button → tokens.color.error
    - Keep color picker defaults và block type colors
    - _Requirements: 2.4, 3.3_
  - [ ] 7.2 Fix MarkdownEditor.tsx (partial - keep HTML output)
    - Replace #f5d393 blockquote border → tokens.color.primary
    - Keep HTML output colors for preview
    - _Requirements: 3.4_

- [ ] 8. Checkpoint - Verify fixes
  - [ ] 8.1 Run typecheck
    - pnpm nx run admin:typecheck
    - _Requirements: All_
  - [ ] 8.2 Run grep verification
    - Verify rgba(255,255,255,...) reduced to intentional only
    - Verify hardcoded hex colors reduced to intentional only
    - _Requirements: All_

- [x] 9. Final visual verification

  - [ ] 9.1 Test admin app in browser
    - Check all pages render correctly
    - Check modals display correctly
    - Check hover states work
    - _Requirements: All_

