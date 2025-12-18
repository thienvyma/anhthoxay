# Implementation Plan

## Phase 1: Database & Core Setup

- [x] 1. Update Prisma schema for auth
  - [x] 1.1 Add USER and WORKER to Role enum in User model
    - Update role field to support: ADMIN, MANAGER, USER, WORKER
    - _Requirements: 1.4, 6.4_
  - [x] 1.2 Extend Session model with additional fields
    - Add userAgent field for device info
    - Add ipAddress field for client IP
    - _Requirements: 10.1_
  - [x] 1.3 Run database migration
    - Execute `pnpm db:generate` and `pnpm db:push`
    - _Requirements: 1.1_

## Phase 2: Auth Service Implementation

- [x] 2. Implement Auth Service
  - [x] 2.1 Create auth service file structure
    - Create `api/src/services/auth.service.ts`
    - Define interfaces and types
    - _Requirements: 1.1, 2.1_
  - [x] 2.2 Implement password hashing functions
    - hashPassword using bcrypt with cost 10
    - verifyPassword with constant-time comparison
    - _Requirements: 1.3, 7.1, 7.2_
  - [x] 2.3 Implement JWT token functions
    - generateAccessToken with 15 min expiry
    - verifyAccessToken for validation
    - _Requirements: 2.4, 2.5_
  - [x] 2.4 Implement session management functions
    - createSession, getSession, deleteSession
    - getUserSessions, revokeAllSessions
    - _Requirements: 2.3, 4.1, 10.1, 10.2, 10.3_

## Phase 3: Auth Middleware

- [x] 3. Implement Auth Middleware
  - [x] 3.1 Create middleware file
    - Create `api/src/middleware/auth.middleware.ts`
    - _Requirements: 5.1_
  - [x] 3.2 Implement authenticate middleware
    - Extract and verify JWT from Authorization header
    - Attach user to request context
    - Return 401 for invalid/missing token
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 3.3 Implement requireRole middleware
    - Check user role against required roles
    - Return 403 for insufficient permissions
    - _Requirements: 5.4, 5.5, 6.1, 6.2, 6.3_

## Phase 4: Rate Limiter

- [x] 4. Implement Rate Limiter
  - [x] 4.1 Create rate limiter module
    - Create `api/src/middleware/rate-limiter.ts`
    - Use in-memory store (Map) for simplicity
    - _Requirements: 9.1_
  - [x] 4.2 Implement checkLimit function
    - Track attempts by IP
    - Block after 5 failed attempts in 15 minutes
    - Return 429 with retry-after header
    - _Requirements: 9.1, 9.2, 9.3_

## Phase 5: Auth API Routes

- [x] 5. Implement Auth Routes
  - [x] 5.1 Create auth routes file
    - Create `api/src/routes/auth.routes.ts`
    - Define Zod schemas for validation
    - _Requirements: 1.1, 2.1_
  - [x] 5.2 Implement POST /api/auth/register
    - Validate input (email, password min 8 chars, name, role)
    - Check email uniqueness
    - Hash password and create user
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.3_
  - [x] 5.3 Implement POST /api/auth/login
    - Validate credentials
    - Apply rate limiting
    - Generate tokens and create session
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 5.4 Implement POST /api/auth/refresh
    - Validate refresh token
    - Check session exists and not expired
    - Generate new access token
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 5.5 Implement POST /api/auth/logout
    - Delete session from database
    - Return success confirmation
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 5.6 Implement GET /api/auth/me
    - Return current user info
    - _Requirements: 5.3_
  - [x] 5.7 Implement session management routes
    - GET /api/auth/sessions - list sessions
    - DELETE /api/auth/sessions/:id - revoke specific
    - DELETE /api/auth/sessions - revoke all others
    - _Requirements: 10.1, 10.2, 10.3_

## Phase 6: Integrate with Main API

- [x] 6. Integrate auth routes with main API
  - [x] 6.1 Mount auth routes in main.ts
    - Import and mount /api/auth routes
    - _Requirements: 2.1_
  - [x] 6.2 Add JWT middleware to main.ts
    - Verify Bearer token and attach user to context
    - _Requirements: 5.1_
  - [x] 6.3 Remove old cookie-based auth (Option B - JWT Only)
    - Deleted /auth/login, /auth/logout, /auth/me routes
    - Removed cookie imports (getCookie, setCookie, deleteCookie)
    - _Requirements: Consolidation decision_

## Phase 7: Admin Panel Integration (JWT)

- [x] 7. Convert Admin Panel to JWT auth
  - [x] 7.1 Add token storage to store.ts
    - tokenStorage with localStorage (accessToken, refreshToken, sessionId)
    - Clear tokens on logout
    - _Requirements: 8.2, 8.3_
  - [x] 7.2 Update API client (api.ts)
    - Add Authorization header with Bearer token
    - Implement auto-refresh on 401
    - Update authApi to use /api/auth/* endpoints
    - _Requirements: 5.1, 8.3_
  - [x] 7.3 Update App.tsx
    - Check token on startup
    - Clear tokens on invalid/expired
    - _Requirements: 8.1, 8.3, 8.4_
  - [x] 7.4 Login page already exists
    - `admin/src/app/components/LoginPage.tsx`
    - Works with new JWT auth
    - _Requirements: 8.1, 8.2_

## Phase 8: Seed & Verify

- [x] 8. Create initial admin user
  - [x] 8.1 Update seed script
    - Admin users in `infra/prisma/seed.ts`
    - Password: Admin@123 (bcrypt hashed)
    - _Requirements: 1.1, 1.4_
  - [x] 8.2 Run seed
    - Execute `pnpm db:seed`
    - _Requirements: 2.1_

## Phase 9: Property-Based Tests (Optional)

- [x] 9. Write property-based tests






  - [x] 9.1 Password hashing test



    - **Property 1: Password never stored in plaintext**
    - **Validates: Requirements 1.3, 7.1**
  - [x] 9.2 Email uniqueness test



    - **Property 2: Email uniqueness**
    - **Validates: Requirements 1.2**
  - [x] 9.3 Login round-trip test


    - **Property 3: Login round-trip**
    - **Validates: Requirements 2.1, 2.3, 2.4**

  - [x] 9.4 Invalid credentials test
    - **Property 4: Invalid credentials rejection**
    - **Validates: Requirements 2.2**
  - [x] 9.5 Token expiration test
    - **Property 5: Token expiration**
    - **Validates: Requirements 2.5**
  - [x] 9.6 Refresh token test


    - **Property 6: Refresh token validity**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 9.7 Logout test
    - **Property 7: Logout invalidates session**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 9.8 Protected routes test


    - **Property 8: Protected route enforcement**
    - **Validates: Requirements 5.1, 5.2**
  - [x] 9.9 Role-based access test


    - **Property 9: Role-based access**
    - **Validates: Requirements 5.4, 5.5, 6.1, 6.2, 6.3**

  - [x] 9.10 Password length test
    - **Property 10: Password minimum length**
    - **Validates: Requirements 7.3**
  - [x] 9.11 Rate limiting test
    - **Property 11: Rate limiting**
    - **Validates: Requirements 9.1, 9.2**
  - [x] 9.12 Session management test
    - **Property 12: Session management**
    - **Validates: Requirements 10.2, 10.3**

---

## Summary

### ✅ Completed (Core Implementation)
- Phase 1: Database schema (userAgent, ipAddress in Session, roles)
- Phase 2: Auth Service (password hashing, JWT, session management)
- Phase 3: Auth Middleware (authenticate, requireRole, optionalAuth)
- Phase 4: Rate Limiter (in-memory store, checkLimit, loginRateLimiter)
- Phase 5: Auth Routes (register, login, refresh, logout, me, sessions)
- Phase 6: API Integration (JWT routes mounted, cookie auth removed)
- Phase 7: Admin Panel (converted to JWT, auto-refresh)
- Phase 8: Seed & Verify (completed)

### ✅ Auth Consolidation (Option B - JWT Only)
- Removed cookie-based auth from API (`/auth/*` routes deleted)
- Updated Admin Panel to use JWT tokens stored in localStorage
- API client with automatic token refresh on 401
- Single auth mechanism for entire project (easier to maintain)

### ✅ Completed (Optional)
- Phase 9: Property-based tests (12 tests) - all passing

### 📝 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AUTH SYSTEM (JWT)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │  Admin   │    │ Landing  │    │  Future  │               │
│  │  Panel   │    │   Page   │    │User/Worker│              │
│  │ (4201)   │    │ (4200)   │    │   Apps   │               │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘               │
│       │               │               │                      │
│       │ JWT Auth      │ Public        │ JWT Auth             │
│       │               │ Only          │                      │
│       ▼               ▼               ▼                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   API (4202)                         │    │
│  │  /api/auth/*  - JWT Auth endpoints                   │    │
│  │  /pages/*     - Public (no auth)                     │    │
│  │  /blog/*      - Public read, Auth write              │    │
│  │  /leads       - Public POST, Auth GET/PUT/DELETE     │    │
│  │  /media/*     - Auth required (ADMIN, MANAGER)       │    │
│  │  /settings/*  - Public GET, Auth PUT (ADMIN)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 🔑 Login Credentials
- Admin: `admin@anhthoxay.vn` / `Admin@123`
- Admin: `thienvyma@gmail.com` / `Admin@123`
- Manager: `quanly@anhthoxay.vn` / `Manager@123`

### 📁 Files Created/Modified
- `api/src/services/auth.service.ts` - Auth business logic
- `api/src/middleware/auth.middleware.ts` - JWT middleware
- `api/src/middleware/rate-limiter.ts` - Rate limiting
- `api/src/routes/auth.routes.ts` - Auth API routes
- `api/src/main.ts` - JWT middleware, removed cookie auth
- `admin/src/app/store.ts` - Token storage
- `admin/src/app/api.ts` - JWT API client with auto-refresh
- `admin/src/app/app.tsx` - Token check on startup
- `infra/prisma/schema.prisma` - Session model updated
- `infra/prisma/seed.ts` - Admin users with bcrypt passwords

### 🚫 Not Needed (Landing Page)
- Landing page only uses public endpoints
- No auth required for: pages, blog (read), settings (read), leads (POST)
- Future: If user login needed on landing, can reuse same JWT system

### 🔮 Future Apps (User/Worker)
- Will use same `/api/auth/*` endpoints
- Same JWT token flow
- Role-based access already implemented (WORKER, USER roles ready)
