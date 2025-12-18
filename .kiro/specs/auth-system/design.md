# Auth System Design Document

## Overview

Hệ thống Authentication & Authorization cho ANH THỢ XÂY sử dụng JWT-based authentication với session management. Thiết kế hỗ trợ multiple apps (Admin, User App, Worker App) với role-based access control.

### Key Design Decisions

1. **JWT + Session Hybrid**: Access token (JWT) cho stateless auth, Session trong DB cho revocation
2. **Role Hierarchy**: ADMIN > MANAGER > WORKER > USER
3. **Token Strategy**: Short-lived access token (15 min) + Long-lived refresh token (7 days)
4. **Password Hashing**: bcrypt với cost factor 10

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Apps                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Admin     │  │  User App   │  │ Worker App  │              │
│  │   Panel     │  │  (Future)   │  │  (Future)   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Auth Middleware                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │  JWT     │  │  Role    │  │  Rate    │              │    │
│  │  │ Verify   │  │  Check   │  │ Limiter  │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Auth Routes                            │    │
│  │  POST /auth/login    POST /auth/register                │    │
│  │  POST /auth/refresh  POST /auth/logout                  │    │
│  │  GET  /auth/me       GET  /auth/sessions                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Database Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    User      │  │   Session    │  │  RateLimit   │          │
│  │   Table      │  │    Table     │  │   (Memory)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Auth Service (`api/src/services/auth.service.ts`)

```typescript
interface AuthService {
  // User management
  register(data: RegisterInput): Promise<User>;
  
  // Authentication
  login(email: string, password: string, userAgent?: string): Promise<AuthTokens>;
  logout(sessionId: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  
  // Password
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  
  // Token
  generateAccessToken(user: User): string;
  generateRefreshToken(): string;
  verifyAccessToken(token: string): JWTPayload | null;
  
  // Session
  createSession(userId: string, token: string, userAgent?: string): Promise<Session>;
  getSession(token: string): Promise<Session | null>;
  deleteSession(sessionId: string): Promise<void>;
  getUserSessions(userId: string): Promise<Session[]>;
  revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void>;
}
```

### 2. Auth Middleware (`api/src/middleware/auth.middleware.ts`)

```typescript
interface AuthMiddleware {
  // Verify JWT and attach user to context
  authenticate(): MiddlewareHandler;
  
  // Check if user has required role
  requireRole(...roles: Role[]): MiddlewareHandler;
  
  // Optional auth - doesn't fail if no token
  optionalAuth(): MiddlewareHandler;
}
```

### 3. Rate Limiter (`api/src/middleware/rate-limiter.ts`)

```typescript
interface RateLimiter {
  // Check and increment attempt count
  checkLimit(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult>;
  
  // Reset attempts for a key
  reset(key: string): Promise<void>;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}
```

### 4. Auth Routes (`api/src/routes/auth.routes.ts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | Admin | Create new user |
| POST | /auth/login | Public | Login and get tokens |
| POST | /auth/refresh | Public | Refresh access token |
| POST | /auth/logout | Auth | Logout current session |
| GET | /auth/me | Auth | Get current user info |
| GET | /auth/sessions | Auth | List user's sessions |
| DELETE | /auth/sessions/:id | Auth | Revoke specific session |
| DELETE | /auth/sessions | Auth | Revoke all other sessions |

## Data Models

### User (existing, extended)

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'WORKER';
  createdAt: Date;
  updatedAt: Date;
}
```

### Session (existing, extended)

```typescript
interface Session {
  id: string;
  userId: string;
  token: string;        // Refresh token (hashed)
  userAgent?: string;   // Browser/device info
  ipAddress?: string;   // Client IP
  expiresAt: Date;
  createdAt: Date;
}
```

### JWT Payload

```typescript
interface JWTPayload {
  sub: string;          // User ID
  email: string;
  role: string;
  iat: number;          // Issued at
  exp: number;          // Expiration
}
```

### Auth Tokens Response

```typescript
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;    // Access token TTL in seconds
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password never stored in plaintext
*For any* user registration with a valid password, the stored passwordHash SHALL NOT equal the original password and SHALL be a valid bcrypt hash.
**Validates: Requirements 1.3, 7.1**

### Property 2: Email uniqueness
*For any* two users in the system, their email addresses SHALL be unique (case-insensitive).
**Validates: Requirements 1.2**

### Property 3: Login round-trip
*For any* valid user credentials (email, password), logging in SHALL return valid tokens, and using those tokens SHALL successfully authenticate subsequent requests.
**Validates: Requirements 2.1, 2.3, 2.4**

### Property 4: Invalid credentials rejection
*For any* login attempt with invalid credentials (wrong email OR wrong password), the system SHALL return the same generic error message.
**Validates: Requirements 2.2**

### Property 5: Token expiration
*For any* generated access token, decoding it SHALL show expiration time approximately 15 minutes from creation.
**Validates: Requirements 2.5**

### Property 6: Refresh token validity
*For any* valid refresh token, using it SHALL return a new valid access token. Using an invalid or expired refresh token SHALL fail.
**Validates: Requirements 3.1, 3.2**

### Property 7: Logout invalidates session
*For any* successful logout, the session SHALL be deleted from database, and subsequent requests with that session's tokens SHALL fail.
**Validates: Requirements 4.1, 4.2**

### Property 8: Protected route enforcement
*For any* protected route, requests without valid token SHALL return 401, and requests with valid token SHALL succeed.
**Validates: Requirements 5.1, 5.2**

### Property 9: Role-based access
*For any* role-restricted endpoint, users with insufficient role SHALL receive 403, and users with sufficient role SHALL succeed.
**Validates: Requirements 5.4, 5.5, 6.1, 6.2, 6.3**

### Property 10: Password minimum length
*For any* password shorter than 8 characters, registration SHALL fail with validation error.
**Validates: Requirements 7.3**

### Property 11: Rate limiting
*For any* IP address with more than 5 failed login attempts within 15 minutes, subsequent attempts SHALL return 429.
**Validates: Requirements 9.1, 9.2**

### Property 12: Session management
*For any* user with multiple sessions, revoking all sessions SHALL invalidate all except current session.
**Validates: Requirements 10.2, 10.3**

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_INVALID_CREDENTIALS | 401 | Invalid email or password |
| AUTH_TOKEN_EXPIRED | 401 | Access token has expired |
| AUTH_TOKEN_INVALID | 401 | Token is malformed or invalid |
| AUTH_SESSION_EXPIRED | 401 | Session has expired |
| AUTH_FORBIDDEN | 403 | Insufficient permissions |
| AUTH_RATE_LIMITED | 429 | Too many attempts |
| AUTH_EMAIL_EXISTS | 400 | Email already registered |
| AUTH_WEAK_PASSWORD | 400 | Password doesn't meet requirements |

### Error Response Format

```typescript
interface AuthError {
  error: {
    code: string;
    message: string;
    retryAfter?: number;  // For rate limiting
  };
}
```

## Testing Strategy

### Unit Tests
- Password hashing and verification
- JWT generation and verification
- Role hierarchy checking
- Input validation

### Property-Based Tests (using fast-check)
- Property 1: Password hashing (bcrypt format verification)
- Property 2: Email uniqueness constraint
- Property 3: Login round-trip
- Property 4: Invalid credentials same error
- Property 5: Token expiration time
- Property 6: Refresh token flow
- Property 7: Logout session cleanup
- Property 8: Protected route 401
- Property 9: Role-based 403
- Property 10: Password length validation
- Property 11: Rate limiting threshold
- Property 12: Session revocation

### Integration Tests
- Full login flow
- Token refresh flow
- Admin panel authentication
- Multi-session management

## Security Considerations

1. **Password Storage**: bcrypt with cost factor 10+
2. **Token Storage**: Access token in memory, refresh token in httpOnly cookie
3. **CORS**: Strict origin checking
4. **Rate Limiting**: IP-based for login endpoint
5. **Session Cleanup**: Cron job to delete expired sessions
