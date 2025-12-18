# Design Document: Security Hardening

## Overview

This document details the technical design for implementing four critical security improvements in the ANH THỢ XÂY API:

1. **Encryption Service** - AES-256-GCM encryption for sensitive data at rest
2. **Session Token Selector** - O(1) session lookup to prevent DoS attacks
3. **Security Headers Enhancement** - CSP, HSTS, and Permissions-Policy headers
4. **Blog Comments API** - Complete CRUD endpoints with moderation workflow

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  security-headers.ts    │  blog.routes.ts                       │
│  (CSP, HSTS, PP)        │  (Comments CRUD)                      │
├─────────────────────────────────────────────────────────────────┤
│                      Service Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  encryption.service.ts  │  auth.service.ts   │  blog.service.ts │
│  (AES-256-GCM)          │  (Token Selector)  │  (Comments)      │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  Prisma Schema Updates:                                          │
│  - Session: tokenSelector, tokenVerifier                         │
│  - Integration: credentials (encrypted)                          │
│  - BlogComment: existing model                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Encryption Service

**File:** `api/src/services/encryption.service.ts`

```typescript
interface EncryptionService {
  encrypt(plaintext: string): string;  // Returns: iv:authTag:ciphertext (base64)
  decrypt(encrypted: string): string;  // Returns: original plaintext
  isEncrypted(value: string): boolean; // Check if value is encrypted format
}

// Environment variable: ENCRYPTION_KEY (32 bytes, base64 encoded)
```

**Algorithm:** AES-256-GCM
- Key: 256-bit from environment variable
- IV: 12 bytes, randomly generated per encryption
- Auth Tag: 16 bytes, appended to ciphertext
- Output Format: `{iv}:{authTag}:{ciphertext}` (all base64)

### 2. Session Token Selector Pattern

**Schema Changes:**

```prisma
model Session {
  id            String    @id @default(cuid())
  userId        String
  tokenSelector String    @unique  // NEW: Unhashed, indexed for O(1) lookup
  tokenVerifier String              // NEW: Hashed with bcrypt
  token         String    @unique  // DEPRECATED: Keep for migration
  previousToken String?
  // ... other fields
  
  @@index([tokenSelector])
}
```

**Token Format:**
- Selector: 16 bytes random hex (32 chars) - stored plaintext, indexed
- Verifier: 32 bytes random hex (64 chars) - stored as bcrypt hash
- Full Token: `{selector}.{verifier}` (96 chars total)

**Lookup Flow:**
1. Parse token → extract selector and verifier
2. Query: `SELECT * FROM Session WHERE tokenSelector = ?` (O(1))
3. If found: `bcrypt.compare(verifier, session.tokenVerifier)`
4. Return session or null

### 3. Security Headers Configuration

**File:** `api/src/middleware/security-headers.ts`

```typescript
interface SecurityHeadersConfig {
  enableHSTS: boolean;      // false in development
  hstsMaxAge: number;       // 31536000 (1 year)
  cspDirectives: CSPDirectives;
  permissionsPolicy: string[];
}

interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'connect-src': string[];
  'frame-ancestors': string[];
}
```

**Default CSP for API:**
```
default-src 'none';
frame-ancestors 'none';
```

**HSTS Header:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Permissions-Policy:**
```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 4. Blog Comments API

**File:** `api/src/routes/blog.routes.ts` (extend existing)

**Endpoints:**

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/blog/posts/:postId/comments` | Public | Submit new comment |
| GET | `/blog/posts/:postId/comments` | Public | Get approved comments |
| GET | `/blog/comments` | Admin/Manager | List all comments |
| PUT | `/blog/comments/:id/status` | Admin/Manager | Approve/Reject |
| DELETE | `/blog/comments/:id` | Admin/Manager | Delete comment |

**Comment Schema:**
```typescript
const CreateCommentSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  content: z.string().min(1).max(2000),
});

const UpdateCommentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
```

## Data Models

### Session Model (Updated)

```prisma
model Session {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenSelector String    @unique  // For O(1) lookup
  tokenVerifier String              // Bcrypt hashed
  token         String?   @unique  // Deprecated, nullable for migration
  previousToken String?
  userAgent     String?
  ipAddress     String?
  expiresAt     DateTime
  rotatedAt     DateTime?
  createdAt     DateTime  @default(now())

  @@index([tokenSelector])
  @@index([userId])
}
```

### Integration Model (No schema change, encrypted at application level)

```typescript
// Stored in credentials field:
// Before: "ya29.refresh_token_plaintext"
// After:  "aGVsbG8=:dGFn:Y2lwaGVy" (iv:tag:ciphertext)
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Encryption Service Properties

**Property 1: Encryption round-trip consistency**
*For any* valid plaintext string, encrypting then decrypting the string SHALL produce the original plaintext value.
**Validates: Requirements 1.2, 1.5**

**Property 2: Unique IV per encryption**
*For any* two encryption operations on the same plaintext, the resulting ciphertexts SHALL have different IV values.
**Validates: Requirements 1.4**

**Property 3: Decryption failure handling**
*For any* corrupted or invalid encrypted string, the decrypt function SHALL throw a descriptive error without crashing.
**Validates: Requirements 1.6**

### Session Token Selector Properties

**Property 4: Session creation stores selector and verifier**
*For any* newly created session, the session record SHALL contain a non-empty tokenSelector and tokenVerifier.
**Validates: Requirements 2.1**

**Property 5: Valid token lookup returns correct session**
*For any* valid refresh token, looking up the session SHALL return the session associated with that token.
**Validates: Requirements 2.2**

**Property 6: Token rotation generates new credentials**
*For any* session token rotation, the new tokenSelector and tokenVerifier SHALL differ from the previous values.
**Validates: Requirements 2.5**

### Security Headers Properties

**Property 7: CSP header presence**
*For any* API response, the response SHALL include a Content-Security-Policy header containing "default-src 'none'".
**Validates: Requirements 3.1, 3.3**

**Property 8: HSTS header in production**
*For any* API response in production mode, the response SHALL include Strict-Transport-Security header with max-age >= 31536000 and includeSubDomains.
**Validates: Requirements 3.2, 3.4**

**Property 9: Permissions-Policy header presence**
*For any* API response, the response SHALL include a Permissions-Policy header disabling geolocation, microphone, and camera.
**Validates: Requirements 3.6**

### Blog Comments Properties

**Property 10: Valid comment creation**
*For any* valid comment submission (name, email, content), the system SHALL create a comment with PENDING status and correct postId.
**Validates: Requirements 4.1, 4.3**

**Property 11: Invalid comment rejection**
*For any* comment submission with missing or invalid required fields, the system SHALL return a validation error.
**Validates: Requirements 4.2**

**Property 12: Public comments filtering**
*For any* public request to fetch blog post comments, the response SHALL only include comments with APPROVED status.
**Validates: Requirements 4.6**

**Property 13: Admin comments access**
*For any* authenticated admin/manager request to list comments, the response SHALL include comments of all statuses.
**Validates: Requirements 4.7**

## Error Handling

### Encryption Errors

| Error | Cause | Response |
|-------|-------|----------|
| `ENCRYPTION_KEY_MISSING` | Env var not set in production | Throw on startup |
| `ENCRYPTION_KEY_INVALID` | Key not 32 bytes | Throw on startup |
| `DECRYPTION_FAILED` | Invalid format or wrong key | Log error, return null |
| `DECRYPTION_CORRUPTED` | Tampered ciphertext | Log error, return null |

### Session Errors

| Error | Cause | Response |
|-------|-------|----------|
| `SESSION_NOT_FOUND` | Invalid selector | Return null |
| `SESSION_INVALID` | Wrong verifier | Return null |
| `SESSION_EXPIRED` | Past expiresAt | Return null |

### Comment Errors

| Error | Cause | Response |
|-------|-------|----------|
| `VALIDATION_ERROR` | Invalid input | 400 with field details |
| `POST_NOT_FOUND` | Invalid postId | 404 |
| `COMMENT_NOT_FOUND` | Invalid commentId | 404 |
| `RATE_LIMITED` | Too many submissions | 429 |

## Testing Strategy

### Property-Based Testing (fast-check)

The following properties will be tested using fast-check:

1. **Encryption round-trip** - Generate random strings, encrypt/decrypt, verify equality
2. **Unique IVs** - Encrypt same string multiple times, verify all IVs different
3. **Session token format** - Generate tokens, verify selector.verifier format
4. **CSP header format** - Verify header contains required directives
5. **Comment validation** - Generate valid/invalid inputs, verify correct responses

### Unit Tests

1. **Encryption Service**
   - Test with known test vectors
   - Test error cases (missing key, invalid format)
   - Test migration helper for existing plaintext tokens

2. **Session Token Selector**
   - Test token generation format
   - Test lookup with valid/invalid tokens
   - Test rotation generates new values

3. **Security Headers**
   - Test CSP directive building
   - Test HSTS in production vs development
   - Test Permissions-Policy format

4. **Blog Comments**
   - Test CRUD operations
   - Test status transitions
   - Test rate limiting
   - Test authorization (public vs admin)

### Integration Tests

1. **Google Sheets Integration**
   - Test OAuth flow with encrypted token storage
   - Test token retrieval and decryption

2. **Auth Flow**
   - Test login creates session with selector/verifier
   - Test refresh uses O(1) lookup
   - Test rotation updates credentials

3. **Blog Comments Flow**
   - Test submit → pending → approve → visible
   - Test submit → pending → reject → hidden
