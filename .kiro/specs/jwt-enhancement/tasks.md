# Implementation Plan

## Phase 1: Database Schema Updates

- [x] 1. Update Prisma schema for JWT enhancement
  - [x] 1.1 Add TokenBlacklist model
    - Create model with tokenHash, userId, reason, expiresAt fields
    - Add indexes for tokenHash and expiresAt
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 1.2 Add AuditLog model
    - Create model with eventType, userId, email, ipAddress, userAgent, metadata, severity
    - Add indexes for eventType, userId, createdAt
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 1.3 Enhance Session model
    - Add previousToken field for rotation detection
    - Add rotatedAt field for tracking
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 1.4 Run database migration
    - Execute `pnpm db:generate` and `pnpm db:push`
    - _Requirements: All_

## Phase 2: JWT Secret Validation

- [x] 2. Implement JWT Secret Validator
  - [x] 2.1 Create validateJWTSecret function
    - Check JWT_SECRET exists and has minimum 32 characters
    - Throw error in production if invalid
    - Use fallback in development with warning
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.2 Integrate validation into AuthService constructor
    - Call validateJWTSecret on service initialization
    - Store validated config for use
    - _Requirements: 1.1_
  - [x] 2.3 Write property test for JWT secret validation
    - **Property 1: JWT Secret Validation**
    - **Validates: Requirements 1.1, 1.2**

## Phase 3: Token Blacklist Service

- [x] 3. Implement Token Blacklist
  - [x] 3.1 Create blacklist service methods
    - addToBlacklist(token, userId, reason)
    - isBlacklisted(token) - check by token hash
    - cleanupExpired() - remove old entries
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 3.2 Integrate blacklist check into token validation
    - Check blacklist before accepting token
    - Return TOKEN_REVOKED error code if blacklisted
    - _Requirements: 3.3, 7.4_
  - [x] 3.3 Write property test for blacklist
    - **Property 4: Logout Blacklists Token**
    - **Validates: Requirements 3.1, 3.3**
  - [x] 3.4 Write property test for blacklist cleanup
    - **Property 6: Blacklist Cleanup Removes Expired Entries**
    - **Validates: Requirements 3.4**

## Phase 4: Refresh Token Rotation

- [x] 4. Implement Token Rotation
  - [x] 4.1 Update refreshToken method with rotation
    - Generate new refresh token on each refresh
    - Store previous token hash for reuse detection
    - Update rotatedAt timestamp
    - _Requirements: 2.1, 2.3_
  - [x] 4.2 Implement token reuse detection
    - Check if incoming token matches previousToken
    - If reused, revoke all sessions for user (security breach)
    - Log CRITICAL audit event
    - _Requirements: 2.2_
  - [x] 4.3 Write property test for token rotation
    - **Property 2: Refresh Token Rotation Invalidates Old Token**
    - **Validates: Requirements 2.1, 2.3**
  - [x] 4.4 Write property test for token reuse detection
    - **Property 3: Token Reuse Detection Triggers Security Response**
    - **Validates: Requirements 2.2**

## Phase 5: Audit Logging

- [x] 5. Implement Audit Log Service
  - [x] 5.1 Create logAudit method in AuthService
    - log(eventType, data) method
    - Support all event types: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 5.2 Integrate audit logging into auth flows
    - Log on login success/failure
    - Log on logout
    - Log on token refresh
    - Log on password change
    - Log on suspicious activity
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 5.3 Write property test for audit logging
    - **Property 7: Audit Log Creation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

## Phase 6: Password Change Security

- [x] 6. Implement Password Change with Session Revocation
  - [x] 6.1 Create changePassword endpoint
    - POST /api/auth/change-password
    - Validate current password
    - Hash and update new password
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.2 Revoke all sessions on password change
    - Delete all sessions for user
    - Blacklist all active tokens
    - Return new token pair for current session
    - _Requirements: 4.1, 4.2, 4.3, 3.2_
  - [x] 6.3 Write property test for password change
    - **Property 5: Password Change Revokes All Sessions**
    - **Validates: Requirements 3.2, 4.1, 4.2**

## Phase 7: Session Limits

- [x] 7. Implement Session Limit Enforcement
  - [x] 7.1 Add session limit check on login
    - Count active sessions for user
    - If >= 5, revoke oldest session
    - Log session limit event
    - _Requirements: 6.1, 6.3_
  - [x] 7.2 Update getUserSessions to order by createdAt
    - Return oldest first
    - _Requirements: 6.2_
  - [x] 7.3 Write property test for session limits
    - **Property 8: Session Limit Enforcement**
    - **Validates: Requirements 6.1, 6.3**

## Phase 8: Token Validation Enhancement

- [x] 8. Enhance Token Validation
  - [x] 8.1 Add issuer claim to JWT
    - Include 'iss' claim in token generation
    - Verify 'iss' claim in validation
    - _Requirements: 7.1_
  - [x] 8.2 Improve error responses
    - Return specific error codes: TOKEN_EXPIRED, TOKEN_INVALID, TOKEN_REVOKED
    - Include error code in response body
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 8.3 Write property test for token validation
    - **Property 9: Token Validation Rejects Invalid Tokens**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

## Phase 9: Security Headers

- [x] 9. Add Security Headers Middleware
  - [x] 9.1 Create security headers middleware
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - Cache-Control: no-store (for authenticated responses)
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 9.2 Apply middleware to all routes
    - Add to main.ts before other middleware
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 9.3 Write property test for security headers
    - **Property 10: Security Headers Present**
    - **Validates: Requirements 9.1, 9.2, 9.3**

## Phase 10: Checkpoint & Cleanup

- [x] 10. Final verification
  - [x] 10.1 Ensure all tests pass
    - Run `pnpm nx run-many --target=typecheck --all`
    - Ensure 0 errors
  - [x] 10.2 Update steering files
    - Update security-checklist.md with new endpoints
    - Document new audit log capabilities
    - _Requirements: All_

---

## Summary

### Implementation Order
1. Database schema (foundation)
2. JWT Secret validation (security baseline)
3. Token Blacklist (logout/revocation support)
4. Token Rotation (refresh security)
5. Audit Logging (monitoring)
6. Password Change (user security)
7. Session Limits (resource management)
8. Token Validation (error handling)
9. Security Headers (HTTP security)
10. Verification & Documentation

### Files to Create/Modify
- `infra/prisma/schema.prisma` - Add TokenBlacklist, AuditLog, enhance Session
- `api/src/services/auth.service.ts` - Add blacklist, rotation, audit methods
- `api/src/services/audit.service.ts` - New audit log service
- `api/src/routes/auth.routes.ts` - Add change-password endpoint
- `api/src/middleware/security-headers.ts` - New security headers middleware
- `api/src/main.ts` - Integrate security headers

### API Endpoints (New/Modified)
- `POST /api/auth/change-password` - Change password with session revocation
- `POST /api/auth/refresh` - Enhanced with rotation
- `POST /api/auth/logout` - Enhanced with blacklist

