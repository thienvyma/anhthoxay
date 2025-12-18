# Requirements Document

## Introduction

Nâng cấp hệ thống JWT Authentication hiện tại để đạt tiêu chuẩn production-ready và chuẩn bị cho việc mở rộng sang mobile app trong tương lai. Tập trung vào security hardening, token management, và audit capabilities.

## Glossary

- **JWT_System**: Hệ thống xác thực JWT của ANH THỢ XÂY API
- **Access_Token**: JWT token ngắn hạn (15 phút) dùng để xác thực requests
- **Refresh_Token**: Token dài hạn (7 ngày) dùng để lấy access token mới
- **Token_Blacklist**: Danh sách các tokens đã bị vô hiệu hóa trước thời hạn
- **Token_Rotation**: Cơ chế cấp refresh token mới mỗi lần refresh, vô hiệu hóa token cũ
- **Session**: Phiên đăng nhập của user, lưu trong database
- **Audit_Log**: Bản ghi các sự kiện authentication quan trọng
- **JWT_Secret**: Khóa bí mật dùng để ký và xác thực JWT tokens

## Requirements

### Requirement 1: Strong JWT Secret Management

**User Story:** As a system administrator, I want JWT secrets to be cryptographically strong and properly managed, so that tokens cannot be forged or compromised.

#### Acceptance Criteria

1. WHEN the JWT_System starts THEN the JWT_System SHALL validate that JWT_SECRET environment variable exists and has minimum 32 characters
2. WHEN JWT_SECRET is missing or too short THEN the JWT_System SHALL refuse to start and log a clear error message
3. WHEN in development mode without JWT_SECRET THEN the JWT_System SHALL use a development-only fallback and log a warning

### Requirement 2: Refresh Token Rotation

**User Story:** As a security engineer, I want refresh tokens to be rotated on each use, so that stolen tokens have limited usefulness.

#### Acceptance Criteria

1. WHEN a user calls refresh endpoint with valid refresh token THEN the JWT_System SHALL generate a new refresh token and invalidate the old one
2. WHEN a user attempts to use an already-rotated refresh token THEN the JWT_System SHALL reject the request and revoke all sessions for that user (potential token theft)
3. WHEN refresh token rotation occurs THEN the JWT_System SHALL update the session record with the new token hash

### Requirement 3: Token Blacklist

**User Story:** As a security engineer, I want to immediately invalidate tokens when users logout or change passwords, so that compromised tokens cannot be used.

#### Acceptance Criteria

1. WHEN a user logs out THEN the JWT_System SHALL add the current access token to the blacklist
2. WHEN a user changes password THEN the JWT_System SHALL add all active access tokens for that user to the blacklist
3. WHEN validating an access token THEN the JWT_System SHALL check if the token is blacklisted before accepting it
4. WHEN a blacklisted token expires naturally THEN the JWT_System SHALL remove it from the blacklist (cleanup)

### Requirement 4: Password Change Security

**User Story:** As a user, I want all my sessions to be terminated when I change my password, so that unauthorized access is immediately revoked.

#### Acceptance Criteria

1. WHEN a user changes password THEN the JWT_System SHALL revoke all existing sessions for that user
2. WHEN a user changes password THEN the JWT_System SHALL require re-authentication on all devices
3. WHEN password change is successful THEN the JWT_System SHALL return a new token pair for the current session only

### Requirement 5: Login Audit Logging

**User Story:** As a system administrator, I want to track all authentication events, so that I can detect and investigate security incidents.

#### Acceptance Criteria

1. WHEN a user successfully logs in THEN the JWT_System SHALL create an audit log entry with timestamp, user ID, IP address, and user agent
2. WHEN a login attempt fails THEN the JWT_System SHALL create an audit log entry with timestamp, attempted email, IP address, and failure reason
3. WHEN a user logs out THEN the JWT_System SHALL create an audit log entry with timestamp and user ID
4. WHEN a suspicious activity is detected (e.g., rotated token reuse) THEN the JWT_System SHALL create an audit log entry with severity level

### Requirement 6: Session Limits

**User Story:** As a system administrator, I want to limit the number of active sessions per user, so that account sharing is discouraged and resources are conserved.

#### Acceptance Criteria

1. WHEN a user logs in and already has 5 active sessions THEN the JWT_System SHALL automatically revoke the oldest session
2. WHEN listing sessions THEN the JWT_System SHALL return sessions ordered by creation date with the oldest first
3. WHEN session limit is reached THEN the JWT_System SHALL log the event for monitoring

### Requirement 7: Token Validation Enhancement

**User Story:** As a developer, I want comprehensive token validation, so that only valid and authorized requests are processed.

#### Acceptance Criteria

1. WHEN validating a token THEN the JWT_System SHALL verify signature, expiration, and issuer claims
2. WHEN a token has invalid signature THEN the JWT_System SHALL reject with 401 status
3. WHEN a token is expired THEN the JWT_System SHALL reject with 401 status and include token_expired error code
4. WHEN a token is blacklisted THEN the JWT_System SHALL reject with 401 status and include token_revoked error code

### Requirement 8: Secure Token Storage Guidance

**User Story:** As a frontend developer, I want clear guidance on secure token storage, so that tokens are protected from XSS and other attacks.

#### Acceptance Criteria

1. WHEN storing tokens in browser THEN the Client_App SHALL use localStorage with proper security headers
2. WHEN the application loads THEN the Client_App SHALL validate stored tokens before using them
3. WHEN tokens are cleared THEN the Client_App SHALL remove all token-related data from storage

### Requirement 9: API Response Security Headers

**User Story:** As a security engineer, I want proper security headers on all API responses, so that common web vulnerabilities are mitigated.

#### Acceptance Criteria

1. WHEN responding to any request THEN the JWT_System SHALL include X-Content-Type-Options: nosniff header
2. WHEN responding to any request THEN the JWT_System SHALL include X-Frame-Options: DENY header
3. WHEN responding to authenticated requests THEN the JWT_System SHALL include Cache-Control: no-store header

### Requirement 10: Graceful Token Expiry Handling

**User Story:** As a user, I want seamless token refresh without interrupting my workflow, so that I don't get unexpectedly logged out.

#### Acceptance Criteria

1. WHEN access token expires during a request THEN the Client_App SHALL automatically attempt refresh and retry the request
2. WHEN refresh fails THEN the Client_App SHALL redirect to login with a clear message
3. WHEN multiple requests fail simultaneously THEN the Client_App SHALL queue refresh attempts to avoid race conditions

