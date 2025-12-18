# Design Document: JWT Enhancement

## Overview

Nâng cấp hệ thống JWT Authentication hiện tại để đạt tiêu chuẩn production-ready. Các cải tiến tập trung vào:
- Security hardening (strong secrets, token rotation, blacklist)
- Audit capabilities (login history, security events)
- Session management (limits, cleanup)
- Client-side improvements (auto-refresh, error handling)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    JWT ENHANCEMENT ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   Client     │────▶│  API Server  │────▶│   Database   │     │
│  │  (Admin/App) │◀────│   (Hono)     │◀────│   (SQLite)   │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│         │                    │                    │              │
│         │                    ▼                    │              │
│         │           ┌──────────────┐              │              │
│         │           │ Auth Service │              │              │
│         │           ├──────────────┤              │              │
│         │           │ • JWT Secret │              │              │
│         │           │   Validation │              │              │
│         │           │ • Token      │              │              │
│         │           │   Rotation   │              │              │
│         │           │ • Blacklist  │              │              │
│         │           │ • Audit Log  │              │              │
│         │           └──────────────┘              │              │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    DATA MODELS                           │    │
│  │  • Session (existing + rotatedAt)                        │    │
│  │  • TokenBlacklist (new)                                  │    │
│  │  • AuditLog (new)                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. JWT Secret Validator

```typescript
interface JWTSecretConfig {
  secret: string;
  minLength: number;  // 32 characters minimum
  issuer: string;     // 'anh-tho-xay-api'
}

function validateJWTSecret(): JWTSecretConfig {
  const secret = process.env.JWT_SECRET;
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (!secret && isDev) {
    console.warn('⚠️ Using development JWT secret - NOT FOR PRODUCTION');
    return { secret: 'dev-secret-32-chars-minimum-xxx', minLength: 32, issuer: 'ath-api-dev' };
  }
  
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  
  return { secret, minLength: 32, issuer: 'anh-tho-xay-api' };
}
```

### 2. Token Rotation Service

```typescript
interface TokenRotationResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  rotatedAt: Date;
}

interface RotationError {
  code: 'TOKEN_REUSED' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID';
  shouldRevokeAll: boolean;
}
```

### 3. Token Blacklist Service

```typescript
interface BlacklistEntry {
  tokenHash: string;      // SHA256 hash of token (not full token)
  userId: string;
  reason: 'logout' | 'password_change' | 'admin_revoke' | 'security';
  expiresAt: Date;        // Auto-cleanup after token would expire anyway
  createdAt: Date;
}

interface BlacklistService {
  add(token: string, userId: string, reason: string): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
  cleanup(): Promise<number>;  // Remove expired entries
}
```

### 4. Audit Log Service

```typescript
type AuditEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_CHANGE'
  | 'SESSION_REVOKED'
  | 'TOKEN_REUSE_DETECTED'
  | 'RATE_LIMIT_EXCEEDED';

interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;  // Additional context
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: Date;
}
```

### 5. Session Manager (Enhanced)

```typescript
interface SessionManagerConfig {
  maxSessionsPerUser: number;  // Default: 5
  sessionTimeout: number;      // 7 days in ms
}

interface SessionManager {
  create(userId: string, refreshToken: string, metadata: SessionMetadata): Promise<Session>;
  rotate(sessionId: string, newRefreshToken: string): Promise<Session>;
  enforceLimit(userId: string): Promise<Session[]>;  // Returns revoked sessions
  revokeAll(userId: string, exceptSessionId?: string): Promise<number>;
}
```

## Data Models

### TokenBlacklist (New Model)

```prisma
model TokenBlacklist {
  id        String   @id @default(cuid())
  tokenHash String   @unique  // SHA256 hash
  userId    String
  reason    String   // logout, password_change, admin_revoke, security
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([tokenHash])
  @@index([expiresAt])
}
```

### AuditLog (New Model)

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  eventType String
  userId    String?
  email     String?
  ipAddress String
  userAgent String
  metadata  String?  // JSON string
  severity  String   @default("INFO")
  createdAt DateTime @default(now())

  @@index([eventType])
  @@index([userId])
  @@index([createdAt])
}
```

### Session (Enhanced)

```prisma
model Session {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(...)
  token         String   @unique  // Hashed refresh token
  previousToken String?  // Previous token hash (for rotation detection)
  userAgent     String?
  ipAddress     String?
  expiresAt     DateTime
  rotatedAt     DateTime?  // Last rotation timestamp
  createdAt     DateTime @default(now())
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: JWT Secret Validation
*For any* JWT_SECRET value, if the length is less than 32 characters in production mode, the system should refuse to start with a clear error message.
**Validates: Requirements 1.1, 1.2**

### Property 2: Refresh Token Rotation Invalidates Old Token
*For any* valid refresh token, after calling the refresh endpoint, the old refresh token should be rejected on subsequent use.
**Validates: Requirements 2.1, 2.3**

### Property 3: Token Reuse Detection Triggers Security Response
*For any* refresh token that has already been rotated, attempting to use it should result in all sessions for that user being revoked.
**Validates: Requirements 2.2**

### Property 4: Logout Blacklists Token
*For any* authenticated user, after logout, the access token used should be blacklisted and rejected on subsequent requests.
**Validates: Requirements 3.1, 3.3**

### Property 5: Password Change Revokes All Sessions
*For any* user with multiple active sessions, changing password should revoke all sessions and blacklist all active tokens.
**Validates: Requirements 3.2, 4.1, 4.2**

### Property 6: Blacklist Cleanup Removes Expired Entries
*For any* blacklist entry with expiresAt in the past, running cleanup should remove it from the blacklist.
**Validates: Requirements 3.4**

### Property 7: Audit Log Creation
*For any* authentication event (login success, login failure, logout, token reuse), an audit log entry should be created with appropriate severity and metadata.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 8: Session Limit Enforcement
*For any* user with 5 active sessions, creating a new session should automatically revoke the oldest session.
**Validates: Requirements 6.1, 6.3**

### Property 9: Token Validation Rejects Invalid Tokens
*For any* token with invalid signature, expired timestamp, or blacklisted status, validation should return 401 with appropriate error code.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 10: Security Headers Present
*For any* API response, the response should include X-Content-Type-Options, X-Frame-Options, and Cache-Control headers.
**Validates: Requirements 9.1, 9.2, 9.3**

## Error Handling

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `TOKEN_INVALID` | 401 | Token signature is invalid |
| `TOKEN_REVOKED` | 401 | Token has been blacklisted |
| `TOKEN_REUSED` | 401 | Rotated refresh token was reused (security event) |
| `SESSION_EXPIRED` | 401 | Refresh token session has expired |
| `JWT_SECRET_INVALID` | 500 | Server configuration error |

## Testing Strategy

### Unit Testing
- JWT secret validation logic
- Token blacklist add/check/cleanup
- Session limit enforcement
- Audit log creation

### Property-Based Testing (using fast-check)
- Property 1: Secret validation with various lengths
- Property 2: Token rotation invalidation
- Property 3: Token reuse detection
- Property 4: Logout blacklisting
- Property 5: Password change session revocation
- Property 6: Blacklist cleanup
- Property 7: Audit log creation
- Property 8: Session limit enforcement
- Property 9: Token validation rejection
- Property 10: Security headers

### Integration Testing
- Full login → refresh → logout flow
- Password change with multiple sessions
- Session limit with concurrent logins

