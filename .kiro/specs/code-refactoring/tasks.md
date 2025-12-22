# Implementation Plan - Code Refactoring

## Overview

Kế hoạch refactoring các files quá dài, chia thành các giai đoạn:
1. **Phase A**: Refactor API Services (Critical >1000 lines)
2. **Phase B**: Refactor Frontend API & Types
3. **Phase C**: Refactor Large Components
4. **Phase D**: Refactor Test Files
5. **Phase E**: Refactor Warning Files (500-1000 lines)

---

## Phase A: API Services Refactoring

- [x] 1. Refactor chat.service.ts (1285 lines)





  - [x] 1.1 Create chat/conversation.service.ts


    - Extract createConversation, getConversation, listConversations, closeConversation
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Create chat/message.service.ts


    - Extract sendMessage, getMessages, deleteMessage, searchMessages
    - _Requirements: 1.1, 1.2_
  - [x] 1.3 Create chat/participant.service.ts


    - Extract addParticipant, removeParticipant, markAsRead
    - _Requirements: 1.1, 1.2_
  - [x] 1.4 Create chat/index.ts barrel export


    - Re-export all modules
    - Create backward compatible chatService export
    - _Requirements: 1.3_
  - [x] 1.5 Update imports in chat.routes.ts


    - _Requirements: 1.4_

- [x] 2. Refactor review.service.ts (1275 lines)





  - [x] 2.1 Create review/crud.service.ts


    - Extract create, get, update, delete, list operations
    - _Requirements: 1.1, 1.2_
  - [x] 2.2 Create review/stats.service.ts


    - Extract getStats, getSummary, getMonthlyStats
    - _Requirements: 1.1, 1.2_
  - [x] 2.3 Create review/response.service.ts


    - Extract addResponse, getResponses
    - _Requirements: 1.1, 1.2_
  - [x] 2.4 Create review/helpfulness.service.ts


    - Extract voteHelpful, removeVote, getVoteStatus
    - _Requirements: 1.1, 1.2_
  - [x] 2.5 Create review/index.ts barrel export


    - _Requirements: 1.3_
  - [x] 2.6 Update imports in review.routes.ts


    - _Requirements: 1.4_

- [x] 3. Refactor match.service.ts (1206 lines)







  - [x] 3.1 Create match/crud.service.ts


    - Extract create, get, list, cancel operations
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Create match/workflow.service.ts


    - Extract selectBid, startProject, completeProject
    - _Requirements: 1.1, 1.2_
  - [x] 3.3 Create match/escrow.service.ts


    - Extract escrow-related operations
    - _Requirements: 1.1, 1.2_
  - [x] 3.4 Create match/index.ts barrel export


    - _Requirements: 1.3_
  - [x] 3.5 Update imports in match.routes.ts




    - _Requirements: 1.4_

- [x] 4. Refactor scheduled-notification.service.ts (1151 lines)





  - [x] 4.1 Create scheduled-notification/scheduler.service.ts


    - Extract schedule, cancel, process operations
    - _Requirements: 1.1, 1.2_
  - [x] 4.2 Create scheduled-notification/reminder.service.ts


    - Extract reminder-specific logic
    - _Requirements: 1.1, 1.2_
  - [x] 4.3 Create scheduled-notification/scanner.service.ts


    - Extract scan and auto-schedule logic
    - _Requirements: 1.1, 1.2_
  - [x] 4.4 Create scheduled-notification/index.ts barrel export


    - _Requirements: 1.3_

  - [x] 4.5 Update imports in scheduled-notification.routes.ts

    - _Requirements: 1.4_

- [x] 5. Checkpoint - API Services




  - All old service files deleted, routes updated, tests pass ✅

---

## Phase B: Frontend API & Types Refactoring

- [x] 6. Refactor admin/src/app/api.ts (1515 lines)





  - [x] 6.1 Create admin/src/app/api/auth.ts


    - Extract login, logout, refreshToken, getMe, getSessions
    - _Requirements: 2.1, 2.3_
  - [x] 6.2 Create admin/src/app/api/bidding.ts


    - Extract projects, bids, matches, escrows, fees, disputes APIs
    - _Requirements: 2.1, 2.3_
  - [x] 6.3 Create admin/src/app/api/content.ts


    - Extract pages, blog, media APIs
    - _Requirements: 2.1, 2.3_
  - [x] 6.4 Create admin/src/app/api/users.ts


    - Extract users, contractors, regions APIs
    - _Requirements: 2.1, 2.3_
  - [x] 6.5 Create admin/src/app/api/settings.ts


    - Extract settings, bidding-settings, service-fees APIs
    - _Requirements: 2.1, 2.3_
  - [x] 6.6 Create admin/src/app/api/index.ts barrel export


    - Re-export all modules
    - Create backward compatible api export
    - _Requirements: 2.4_
  - [x] 6.7 Update admin/src/app/api.ts to re-export from api/index.ts


    - Maintain backward compatibility
    - _Requirements: 2.4_

- [x] 7. Refactor portal/src/api.ts (1188 lines)





  - [x] 7.1 Create portal/src/api/auth.ts


    - Extract login, logout, refreshToken, signup APIs
    - _Requirements: 2.2, 2.3_
  - [x] 7.2 Create portal/src/api/projects.ts


    - Extract homeowner project APIs
    - _Requirements: 2.2, 2.3_
  - [x] 7.3 Create portal/src/api/bids.ts


    - Extract contractor bid APIs
    - _Requirements: 2.2, 2.3_
  - [x] 7.4 Create portal/src/api/marketplace.ts


    - Extract public marketplace APIs
    - _Requirements: 2.2, 2.3_
  - [x] 7.5 Create portal/src/api/index.ts barrel export


    - _Requirements: 2.4_
  - [x] 7.6 Update portal/src/api.ts to re-export


    - _Requirements: 2.4_

- [x] 8. Refactor admin/src/app/types.ts (1134 lines)







  - [x] 8.1 Create admin/src/app/types/user.ts


    - Extract User, Session, AuditLog types
    - _Requirements: 3.1_

  - [x] 8.2 Create admin/src/app/types/bidding.ts



    - Extract Project, Bid, Match, Escrow, Fee, Dispute types
    - _Requirements: 3.1_

  - [x] 8.3 Create admin/src/app/types/content.ts

    - Extract Page, Section, BlogPost, Media types
    - _Requirements: 3.1_

  - [x] 8.4 Create admin/src/app/types/settings.ts

    - Extract Settings, BiddingSettings, ServiceFee types
    - _Requirements: 3.1_

  - [x] 8.5 Create admin/src/app/types/index.ts barrel export

    - _Requirements: 3.2_

  - [x] 8.6 Update admin/src/app/types.ts to re-export

    - _Requirements: 3.3_

- [x] 9. Checkpoint - Frontend



  - Ensure all tests pass, ask the user if questions arise.

---

## Phase C: Large Components Refactoring

- [x] 10. Refactor portal/src/pages/contractor/ProfilePage.tsx (1153 lines)





  - [x] 10.1 Create ProfilePage/ProfileForm.tsx


    - Extract form logic and validation
    - _Requirements: 4.1, 4.2_
  - [x] 10.2 Create ProfilePage/ProfileDocuments.tsx


    - Extract document upload section
    - _Requirements: 4.1, 4.2_
  - [x] 10.3 Create ProfilePage/ProfilePreview.tsx


    - Extract preview section
    - _Requirements: 4.1, 4.2_
  - [x] 10.4 Create ProfilePage/ProfileCertificates.tsx


    - Extract certificates section
    - _Requirements: 4.1, 4.2_
  - [x] 10.5 Update ProfilePage/index.tsx


    - Compose sub-components
    - _Requirements: 4.3, 4.4_

- [x] 11. Refactor portal/src/pages/homeowner/CreateProjectPage.tsx (969 lines)








  - [x] 11.1 Create CreateProjectPage/ProjectBasicInfo.tsx


    - Extract basic info form
    - _Requirements: 4.1, 4.2_
  - [x] 11.2 Create CreateProjectPage/ProjectDetails.tsx


    - Extract details form
    - _Requirements: 4.1, 4.2_
  - [x] 11.3 Create CreateProjectPage/ProjectImages.tsx


    - Extract image upload section
    - _Requirements: 4.1, 4.2_
  - [x] 11.4 Update CreateProjectPage/index.tsx


    - _Requirements: 4.3, 4.4_

- [ ] 12. Checkpoint - Components
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase D: Test Files Refactoring


- [x] 13. Refactor review.service.property.test.ts (3665 lines)




  - [x] 13.1 Create review/crud.property.test.ts


    - Extract CRUD operation tests
    - _Requirements: 5.1, 5.2_
  - [x] 13.2 Create review/stats.property.test.ts


    - Extract stats tests
    - _Requirements: 5.1, 5.2_
  - [x] 13.3 Create review/response.property.test.ts


    - Extract response tests
    - _Requirements: 5.1, 5.2_
  - [x] 13.4 Create review/test-utils.ts


    - Extract shared test utilities
    - _Requirements: 5.3_

- [x] 14. Refactor auth.service.property.test.ts (1196 lines)
  - [x] 14.1 Create auth/login.property.test.ts
    - Extract login tests
    - _Requirements: 5.1, 5.2_
  - [x] 14.2 Create auth/token.property.test.ts
    - Extract token tests
    - _Requirements: 5.1, 5.2_
  - [x] 14.3 Create auth/session.property.test.ts
    - Extract session tests
    - _Requirements: 5.1, 5.2_
  - [x] 14.4 Create auth/test-utils.ts
    - Extract shared test utilities
    - _Requirements: 5.3_

- [ ] 15. Refactor chat.service.property.test.ts (1181 lines)
  - [ ] 15.1 Create chat/conversation.property.test.ts
    - _Requirements: 5.1, 5.2_
  - [ ] 15.2 Create chat/message.property.test.ts
    - _Requirements: 5.1, 5.2_
  - [ ] 15.3 Create chat/test-utils.ts
    - _Requirements: 5.3_

- [ ] 16. Checkpoint - Test Files
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase E: Warning Files (500-1000 lines)

- [ ] 17. Refactor project.service.ts (901 lines)
  - [ ] 17.1 Create project/crud.service.ts
    - Extract create, get, update, delete, list operations
    - _Requirements: 1.1, 1.2_
  - [ ] 17.2 Create project/workflow.service.ts
    - Extract submit, approve, reject, publish operations
    - _Requirements: 1.1, 1.2_
  - [ ] 17.3 Create project/index.ts barrel export
    - _Requirements: 1.3_

- [ ] 18. Refactor escrow.service.ts (756 lines)
  - [ ] 18.1 Create escrow/crud.service.ts
    - Extract create, get, list operations
    - _Requirements: 1.1, 1.2_
  - [ ] 18.2 Create escrow/workflow.service.ts
    - Extract confirm, release, refund, dispute operations
    - _Requirements: 1.1, 1.2_
  - [ ] 18.3 Create escrow/index.ts barrel export
    - _Requirements: 1.3_

- [ ] 19. Refactor bid.service.ts (733 lines)
  - [ ] 19.1 Create bid/crud.service.ts
    - Extract create, get, update, delete, list operations
    - _Requirements: 1.1, 1.2_
  - [ ] 19.2 Create bid/workflow.service.ts
    - Extract approve, reject, withdraw operations
    - _Requirements: 1.1, 1.2_
  - [ ] 19.3 Create bid/index.ts barrel export
    - _Requirements: 1.3_

- [ ] 20. Refactor other large services
  - [ ] 20.1 Refactor dispute.service.ts (656 lines)
    - Split into dispute/crud.service.ts, dispute/resolution.service.ts
    - _Requirements: 1.1_
  - [ ] 20.2 Refactor auth.service.ts (654 lines)
    - Split into auth/login.service.ts, auth/token.service.ts, auth/session.service.ts
    - _Requirements: 1.1_
  - [ ] 20.3 Refactor notification-channel.service.ts (653 lines)
    - Split into notification-channel/email.service.ts, notification-channel/sms.service.ts
    - _Requirements: 1.1_

- [ ] 21. Checkpoint - Warning Files
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase F: Final Verification

- [ ] 22. Final Verification
  - [ ] 22.1 Run full lint check
    - Execute `pnpm nx run-many --target=lint --all`
    - Verify 0 errors, 0 warnings
    - _Requirements: 6.1_
  - [ ] 22.2 Run full typecheck
    - Execute `pnpm nx run-many --target=typecheck --all`
    - Verify 0 errors
    - _Requirements: 6.2_
  - [ ] 22.3 Run all tests
    - Execute `pnpm nx run-many --target=test --all`
    - Verify all pass
    - _Requirements: 6.3_

- [ ] 23. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

---

## Summary

| Phase | Tasks | Priority | Estimate |
|-------|-------|----------|----------|
| A. API Services | 1-5 | HIGH | 3-4h |
| B. Frontend API & Types | 6-9 | HIGH | 2-3h |
| C. Large Components | 10-12 | HIGH | 2h |
| D. Test Files | 13-16 | MEDIUM | 2h |
| E. Warning Files | 17-21 | MEDIUM | 3-4h |
| F. Final Verification | 22-23 | HIGH | 30m |

**Total Estimate: 13-16 hours (2 days)**

---

## Notes

### Refactoring Strategy
1. **Barrel Exports**: Luôn tạo index.ts để maintain backward compatibility
2. **Incremental**: Refactor từng file, verify tests pass trước khi tiếp tục
3. **No Logic Changes**: Chỉ tổ chức lại code, không thay đổi logic

### File Size Guidelines
- Services: Max 500 lines
- Components: Max 500 lines
- Test files: Max 800 lines
- Types: Max 300 lines per domain file

