# Requirements Document

## Introduction

Hệ thống Authentication & Authorization cho dự án ANH THỢ XÂY (ATH). Cung cấp nền tảng bảo mật cho tất cả các ứng dụng trong hệ sinh thái: Admin Panel, User App (tương lai), Worker App (tương lai). Hệ thống sử dụng JWT tokens với session management để đảm bảo an toàn và khả năng mở rộng.

## Glossary

- **Auth_System**: Hệ thống xác thực và phân quyền người dùng
- **JWT**: JSON Web Token - token mã hóa chứa thông tin user
- **Session**: Phiên đăng nhập được lưu trong database
- **Role**: Vai trò người dùng (ADMIN, MANAGER, USER, WORKER)
- **Protected_Route**: API endpoint yêu cầu xác thực
- **Public_Route**: API endpoint không yêu cầu xác thực
- **Access_Token**: Token ngắn hạn dùng để xác thực API requests
- **Refresh_Token**: Token dài hạn dùng để lấy access token mới

## Requirements

### Requirement 1: User Registration

**User Story:** As an administrator, I want to create new user accounts, so that team members can access the system with appropriate permissions.

#### Acceptance Criteria

1. WHEN an administrator submits valid registration data (email, password, name, role) THEN the Auth_System SHALL create a new user account with hashed password
2. WHEN an administrator attempts to register with an existing email THEN the Auth_System SHALL reject the request and return an error message
3. WHEN a password is provided THEN the Auth_System SHALL hash the password using bcrypt with minimum 10 salt rounds before storage
4. WHEN a new user is created THEN the Auth_System SHALL assign the specified role (ADMIN, MANAGER, USER, WORKER)

### Requirement 2: User Login

**User Story:** As a user, I want to log in with my credentials, so that I can access protected features of the application.

#### Acceptance Criteria

1. WHEN a user submits valid email and password THEN the Auth_System SHALL verify credentials and return access token and refresh token
2. WHEN a user submits invalid credentials THEN the Auth_System SHALL reject the request with a generic error message without revealing which field is incorrect
3. WHEN login is successful THEN the Auth_System SHALL create a new session record in the database
4. WHEN generating tokens THEN the Auth_System SHALL include user id, email, and role in the JWT payload
5. WHEN generating access token THEN the Auth_System SHALL set expiration to 15 minutes
6. WHEN generating refresh token THEN the Auth_System SHALL set expiration to 7 days

### Requirement 3: Token Refresh

**User Story:** As a user, I want my session to remain active without re-entering credentials, so that I can have a seamless experience.

#### Acceptance Criteria

1. WHEN a valid refresh token is provided THEN the Auth_System SHALL issue a new access token
2. WHEN an expired or invalid refresh token is provided THEN the Auth_System SHALL reject the request and require re-authentication
3. WHEN a refresh token is used THEN the Auth_System SHALL verify the corresponding session exists and is not expired

### Requirement 4: User Logout

**User Story:** As a user, I want to log out of the system, so that my session is terminated and my account is secure.

#### Acceptance Criteria

1. WHEN a user requests logout THEN the Auth_System SHALL invalidate the current session
2. WHEN logout is successful THEN the Auth_System SHALL delete the session record from the database
3. WHEN a user logs out THEN the Auth_System SHALL return a success confirmation

### Requirement 5: Protected Route Middleware

**User Story:** As a system architect, I want API routes to be protected by authentication middleware, so that only authorized users can access sensitive endpoints.

#### Acceptance Criteria

1. WHEN a request is made to a protected route without a valid token THEN the Auth_System SHALL return 401 Unauthorized
2. WHEN a request is made with an expired token THEN the Auth_System SHALL return 401 Unauthorized with token_expired error code
3. WHEN a request is made with a valid token THEN the Auth_System SHALL attach user information to the request context
4. WHEN a protected route requires specific roles THEN the Auth_System SHALL verify the user has the required role
5. WHEN a user lacks required role THEN the Auth_System SHALL return 403 Forbidden

### Requirement 6: Role-Based Access Control

**User Story:** As an administrator, I want to restrict access based on user roles, so that users can only access features appropriate to their role.

#### Acceptance Criteria

1. WHEN an ADMIN user accesses any endpoint THEN the Auth_System SHALL grant full access
2. WHEN a MANAGER user accesses admin-only endpoints THEN the Auth_System SHALL deny access with 403 Forbidden
3. WHEN a USER role accesses worker-only endpoints THEN the Auth_System SHALL deny access with 403 Forbidden
4. WHEN checking permissions THEN the Auth_System SHALL use a role hierarchy: ADMIN > MANAGER > WORKER > USER

### Requirement 7: Password Security

**User Story:** As a security-conscious user, I want my password to be securely stored and validated, so that my account is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN storing a password THEN the Auth_System SHALL use bcrypt hashing with cost factor of 10 or higher
2. WHEN validating a password THEN the Auth_System SHALL compare using constant-time comparison to prevent timing attacks
3. WHEN a password is provided THEN the Auth_System SHALL enforce minimum length of 8 characters

### Requirement 8: Admin Panel Authentication Integration

**User Story:** As an admin panel user, I want to log in through a dedicated login page, so that I can access the admin dashboard securely.

#### Acceptance Criteria

1. WHEN accessing admin panel without authentication THEN the Auth_System SHALL redirect to login page
2. WHEN login is successful THEN the Auth_System SHALL store tokens securely and redirect to dashboard
3. WHEN tokens expire THEN the Auth_System SHALL attempt automatic refresh before requiring re-login
4. WHEN refresh fails THEN the Auth_System SHALL redirect to login page with session expired message

### Requirement 9: API Rate Limiting

**User Story:** As a system administrator, I want to limit login attempts, so that the system is protected from brute force attacks.

#### Acceptance Criteria

1. WHEN more than 5 failed login attempts occur from the same IP within 15 minutes THEN the Auth_System SHALL temporarily block further attempts
2. WHEN an IP is blocked THEN the Auth_System SHALL return 429 Too Many Requests with retry-after header
3. WHEN the block period expires THEN the Auth_System SHALL allow login attempts again

### Requirement 10: Session Management

**User Story:** As a user, I want to see and manage my active sessions, so that I can ensure my account security.

#### Acceptance Criteria

1. WHEN a user requests their sessions THEN the Auth_System SHALL return a list of active sessions with device/browser info
2. WHEN a user revokes a specific session THEN the Auth_System SHALL invalidate that session immediately
3. WHEN a user requests to revoke all sessions THEN the Auth_System SHALL invalidate all sessions except the current one
