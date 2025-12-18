# Implementation Plan

## Security Hardening - Critical Fixes

- [x] 1. Create Encryption Service





  - [x] 1.1 Create encryption utility module


    - Create `api/src/utils/encryption.ts` with AES-256-GCM implementation
    - Implement `encrypt(plaintext: string): string` function
    - Implement `decrypt(encrypted: string): string` function
    - Implement `isEncrypted(value: string): boolean` helper
    - Add environment variable validation for ENCRYPTION_KEY
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Write property tests for encryption service


    - **Property 1: Encryption round-trip consistency**
    - **Property 2: Unique IV per encryption**
    - **Property 3: Decryption failure handling**
    - **Validates: Requirements 1.2, 1.4, 1.5, 1.6**
  - [x] 1.3 Update Google Sheets service to use encryption


    - Modify `handleCallback()` to encrypt refresh token before storing
    - Modify token retrieval methods to decrypt before use
    - Add migration logic for existing plaintext tokens
    - _Requirements: 1.1, 1.2_

- [x] 2. Checkpoint - Encryption tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Fix Session Lookup DoS Vulnerability





  - [x] 3.1 Update Prisma schema for token selector pattern


    - Add `tokenSelector` field (String, unique, indexed)
    - Add `tokenVerifier` field (String)
    - Make `token` field nullable for migration
    - Run `pnpm db:generate` and `pnpm db:push`
    - _Requirements: 2.1_
  - [x] 3.2 Update AuthService token generation


    - Create `generateTokenPair()` returning `{ selector, verifier, fullToken }`
    - Update `createSession()` to store selector and hashed verifier
    - Update `generateRefreshToken()` to use new format
    - _Requirements: 2.1, 2.5_
  - [x] 3.3 Update AuthService session lookup


    - Modify `getSessionByToken()` to parse selector from token
    - Query by tokenSelector (O(1) indexed lookup)
    - Verify tokenVerifier with single bcrypt compare
    - _Requirements: 2.2, 2.3, 2.4_


  - [x] 3.4 Update token rotation logic
    - Modify `refreshToken()` to generate new selector/verifier pair
    - Store previous selector for reuse detection
    - _Requirements: 2.5_
  - [x] 3.5 Write property tests for session token selector

    - **Property 4: Session creation stores selector and verifier**
    - **Property 5: Valid token lookup returns correct session**
    - **Property 6: Token rotation generates new credentials**
    - **Validates: Requirements 2.1, 2.2, 2.5**

- [x] 4. Checkpoint - Session lookup tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add CSP and HSTS Security Headers





  - [x] 5.1 Enhance security headers middleware


    - Add Content-Security-Policy header with `default-src 'none'`
    - Add Strict-Transport-Security header (production only)
    - Add Permissions-Policy header
    - Add environment check for HSTS (skip in development)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 5.2 Write property tests for security headers


    - **Property 7: CSP header presence**
    - **Property 8: HSTS header in production**
    - **Property 9: Permissions-Policy header presence**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**

- [x] 6. Checkpoint - Security headers tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add Blog Comments Route





  - [x] 7.1 Create comment validation schemas


    - Create `CreateCommentSchema` with name, email, content validation
    - Create `UpdateCommentStatusSchema` with status enum
    - Create `CommentFilterSchema` for listing with status filter
    - _Requirements: 4.1, 4.2_

  - [x] 7.2 Add public comment endpoints

    - Add `POST /blog/posts/:postId/comments` for submitting comments
    - Add `GET /blog/posts/:postId/comments` for fetching approved comments
    - Apply rate limiting to POST endpoint
    - _Requirements: 4.1, 4.3, 4.6, 4.8_

  - [x] 7.3 Add admin comment management endpoints

    - Add `GET /blog/comments` for listing all comments (Admin/Manager)
    - Add `PUT /blog/comments/:id/status` for approve/reject (Admin/Manager)
    - Add `DELETE /blog/comments/:id` for deletion (Admin/Manager)
    - _Requirements: 4.4, 4.5, 4.7_
  - [x] 7.4 Write property tests for blog comments


    - **Property 10: Valid comment creation**
    - **Property 11: Invalid comment rejection**
    - **Property 12: Public comments filtering**
    - **Property 13: Admin comments access**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.6, 4.7**

- [x] 8. Checkpoint - Blog comments tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update Documentation






  - [x] 9.1 Update steering files

    - Add new routes to `security-checklist.md` Protected Routes Registry
    - Update `api-patterns.md` with encryption service usage
    - Document ENCRYPTION_KEY environment variable requirement
    - _Requirements: All_

- [x] 10. Final Checkpoint - All tests passing





  - Ensure all tests pass, ask the user if questions arise.
