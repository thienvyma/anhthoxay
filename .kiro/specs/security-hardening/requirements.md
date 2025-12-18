# Requirements Document

## Introduction

This document specifies the requirements for critical security hardening of the ANH THỢ XÂY API. The scope includes four high-priority security improvements identified during the codebase audit:

1. **Encrypt Google Refresh Token** - Protect OAuth credentials stored in database
2. **Fix Session Lookup DoS** - Prevent CPU exhaustion attacks on token refresh
3. **Add CSP & HSTS Headers** - Protect against XSS and MITM attacks
4. **Add Blog Comments Route** - Complete missing API endpoint

These fixes are essential before production deployment to prevent security vulnerabilities.

## Glossary

- **AES-256-GCM**: Advanced Encryption Standard with 256-bit key using Galois/Counter Mode, providing both encryption and authentication
- **CSP (Content-Security-Policy)**: HTTP header that controls which resources the browser is allowed to load
- **HSTS (HTTP Strict Transport Security)**: HTTP header that forces browsers to use HTTPS
- **Token Selector**: A non-secret identifier used to look up a session without comparing hashed tokens
- **DoS (Denial of Service)**: Attack that makes a service unavailable by overwhelming it with requests
- **IV (Initialization Vector)**: Random value used in encryption to ensure same plaintext produces different ciphertext
- **Auth Tag**: Authentication tag in GCM mode that verifies data integrity

## Requirements

### Requirement 1: Encrypt Google Refresh Token

**User Story:** As a system administrator, I want Google OAuth refresh tokens to be encrypted at rest, so that database leaks do not compromise Google Sheets integration.

#### Acceptance Criteria

1. WHEN the system stores a Google refresh token THEN the system SHALL encrypt the token using AES-256-GCM before saving to database
2. WHEN the system retrieves a Google refresh token THEN the system SHALL decrypt the token before using it with Google APIs
3. WHEN the encryption key environment variable is not set in production THEN the system SHALL throw an error and refuse to start
4. WHEN encrypting a token THEN the system SHALL generate a unique IV for each encryption operation
5. WHEN the system encrypts then decrypts a token THEN the system SHALL produce the original token value (round-trip property)
6. WHEN decryption fails due to invalid key or corrupted data THEN the system SHALL log the error and return a clear failure message

### Requirement 2: Fix Session Lookup DoS Vulnerability

**User Story:** As a security engineer, I want session token lookup to be O(1) instead of O(n), so that attackers cannot exhaust server CPU by spamming invalid refresh tokens.

#### Acceptance Criteria

1. WHEN a session is created THEN the system SHALL store both a token selector (unhashed, indexed) and token verifier (hashed with bcrypt)
2. WHEN looking up a session by refresh token THEN the system SHALL first query by selector in O(1) time, then verify the token hash
3. WHEN the token selector is not found THEN the system SHALL return session not found without performing bcrypt comparison
4. WHEN the token selector is found but verifier does not match THEN the system SHALL return session invalid
5. WHEN a session token is rotated THEN the system SHALL generate new selector and verifier values
6. WHEN multiple sessions exist THEN the system SHALL only perform one bcrypt comparison per lookup (not O(n))

### Requirement 3: Add CSP and HSTS Security Headers

**User Story:** As a security engineer, I want the API to send Content-Security-Policy and HSTS headers, so that browsers are protected against XSS and man-in-the-middle attacks.

#### Acceptance Criteria

1. WHEN any API response is sent THEN the system SHALL include a Content-Security-Policy header with restrictive defaults
2. WHEN any API response is sent in production THEN the system SHALL include Strict-Transport-Security header with max-age of at least 1 year
3. WHEN CSP header is set THEN the system SHALL use default-src 'none' as the base policy for API responses
4. WHEN HSTS header is set THEN the system SHALL include includeSubDomains directive
5. WHEN running in development mode THEN the system SHALL NOT include HSTS header to avoid localhost issues
6. WHEN the Permissions-Policy header is set THEN the system SHALL disable unnecessary browser features

### Requirement 4: Add Blog Comments Route

**User Story:** As a blog reader, I want to submit comments on blog posts, so that I can engage with the content and share my thoughts.

#### Acceptance Criteria

1. WHEN a user submits a comment with valid name, email, and content THEN the system SHALL create a new comment with PENDING status
2. WHEN a user submits a comment with missing required fields THEN the system SHALL return a validation error with field details
3. WHEN a comment is created THEN the system SHALL associate it with the correct blog post by postId
4. WHEN a moderator approves a comment THEN the system SHALL update the comment status to APPROVED
5. WHEN a moderator rejects a comment THEN the system SHALL update the comment status to REJECTED
6. WHEN fetching a blog post THEN the system SHALL only return comments with APPROVED status to public users
7. WHEN an admin or manager lists comments THEN the system SHALL return all comments regardless of status
8. WHEN a comment is submitted THEN the system SHALL apply rate limiting to prevent spam
