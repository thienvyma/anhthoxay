# ADR-001: Current Architecture Analysis

## Status
Accepted

## Context
ANH THỢ XÂY is a platform connecting homeowners with contractors. The system needs to be evaluated for scalability readiness.

## Current Architecture

### Stack Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                        CURRENT STACK                             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Apps                                                   │
│  ├── Landing (React + Vite) - Port 4200                         │
│  ├── Admin (React + Vite) - Port 4201                           │
│  └── Portal (React + Vite) - Port 4203                          │
├─────────────────────────────────────────────────────────────────┤
│  Backend API                                                     │
│  └── Hono (Node.js) - Port 4202                                 │
│      ├── JWT Authentication                                      │
│      ├── Rate Limiting (In-Memory)                              │
│      ├── Zod Validation                                         │
│      └── Prisma ORM                                             │
├─────────────────────────────────────────────────────────────────┤
│  Database                                                        │
│  └── SQLite (Single File)                                       │
├─────────────────────────────────────────────────────────────────┤
│  Shared Packages                                                 │
│  ├── @app/shared (Config, Tokens, Utils)                        │
│  └── @app/ui (UI Components)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Service Boundaries (Future Microservices)

1. **Auth Service**
   - User registration/login
   - JWT token management
   - Session management
   - Password management

2. **Project Service**
   - Project CRUD
   - Project status workflow
   - Milestone management

3. **Bid Service**
   - Bid CRUD
   - Bid approval workflow
   - Match management

4. **Payment Service**
   - Escrow management
   - Fee transactions
   - Dispute resolution

5. **Communication Service**
   - Chat/messaging
   - Notifications
   - Email delivery

6. **Content Service**
   - Blog management
   - Pages/sections
   - Media assets

## Limitations

### Database (SQLite)
- Single-file, single-writer limitation
- No concurrent write support
- Not suitable for production scale
- **Recommendation**: Migrate to PostgreSQL

### Rate Limiting (In-Memory)
- Lost on server restart
- Not shared across instances
- **Recommendation**: Migrate to Redis

### Session Storage (Database)
- Database load for session lookups
- **Recommendation**: Consider Redis for sessions

### File Storage (Local)
- Not distributed
- Lost on server migration
- **Recommendation**: Migrate to S3/CloudFront

## Decision
Document current limitations and create migration roadmap for production readiness.

## Consequences
- Clear understanding of scaling requirements
- Prioritized migration path
- Risk mitigation for production deployment
