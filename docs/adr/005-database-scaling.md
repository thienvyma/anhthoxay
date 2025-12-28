# ADR-005: Database Scaling Plan

## Status
Accepted

## Context
Plan database scaling strategy for production deployment.

## Current State
- Database: SQLite (single file)
- Limitations: Single writer, no concurrent writes
- Not suitable for production scale

## Read vs Write Analysis

### Detailed Query Pattern Analysis

Based on codebase analysis, the following patterns were identified:

#### Read-Heavy Operations (Read Replica Candidates)

| Service | Operation | Query Type | Frequency | Read Replica Suitable |
|---------|-----------|------------|-----------|----------------------|
| **Project Service** | List projects (marketplace) | `findMany` with pagination | Very High | ✅ Yes |
| **Project Service** | Get project details | `findUnique` with includes | High | ✅ Yes |
| **Ranking Service** | Get contractor rankings | `findMany` ordered by score | Very High | ✅ Yes |
| **Ranking Service** | Get featured contractors | `findMany` filtered | High | ✅ Yes |
| **Region Service** | Get regions tree | `findMany` hierarchical | High | ✅ Yes (cacheable) |
| **Pricing Service** | Get service categories | `findMany` | High | ✅ Yes (cacheable) |
| **Pricing Service** | Get unit prices | `findMany` | High | ✅ Yes (cacheable) |
| **Pricing Service** | Get materials | `findMany` | Medium | ✅ Yes (cacheable) |
| **Review Service** | Get contractor reviews | `findMany` with pagination | High | ✅ Yes |
| **Review Service** | Get review stats | `aggregate` | Medium | ✅ Yes |
| **Bid Service** | List bids for project | `findMany` | Medium | ✅ Yes |
| **Notification Service** | Get user notifications | `findMany` with pagination | High | ✅ Yes |
| **Users Service** | Get user list (admin) | `findMany` with pagination | Low | ✅ Yes |

#### Write-Heavy Operations (Primary Only)

| Service | Operation | Query Type | Frequency | Notes |
|---------|-----------|------------|-----------|-------|
| **Auth Service** | Session management | `create`, `update`, `delete` | Very High | Every auth request |
| **Auth Service** | Token blacklist | `create` | High | On logout/password change |
| **Notification Service** | Create notification | `create` | High | Multiple per action |
| **Notification Service** | Mark as read | `update` | High | User interactions |
| **Scheduled Notification** | Create/update scheduled | `create`, `update` | Medium | Background jobs |
| **Audit Log** | Create audit entry | `create` | Very High | Every auth event |
| **Message Service** | Send message | `create` | Medium | Chat feature |
| **Bid Service** | Create/update bid | `create`, `update` | Medium | Contractor actions |
| **Project Service** | Status transitions | `update` | Medium | Workflow changes |
| **Escrow Service** | Create/update escrow | `create`, `update` | Low | Match events |
| **Fee Service** | Create fee transaction | `create` | Low | Match events |
| **Milestone Service** | Create/update milestone | `create`, `update` | Low | Project progress |

#### Mixed Operations (Read-Write Ratio)

| Service | Operation | Read:Write | Notes |
|---------|-----------|------------|-------|
| **Project CRUD** | Full lifecycle | 85:15 | Mostly listing/viewing |
| **Bid CRUD** | Full lifecycle | 70:30 | Listing + status updates |
| **Review System** | Full lifecycle | 90:10 | Mostly public reads |
| **Notification** | Full lifecycle | 60:40 | Read + mark as read |
| **User Profile** | Full lifecycle | 80:20 | Mostly reads |
| **Contractor Profile** | Full lifecycle | 75:25 | Public reads + updates |

### Query Hotspots Identified

1. **Session Lookups** - Every authenticated request queries sessions
2. **Notification Count** - Frequent unread count queries
3. **Project Marketplace** - High traffic public listing
4. **Contractor Rankings** - Frequent public queries
5. **Settings/Regions** - Every quote calculation

### Estimated Traffic Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUERY DISTRIBUTION                            │
├─────────────────────────────────────────────────────────────────┤
│  Read Operations (85%)                                           │
│  ├── Public Marketplace (30%)                                   │
│  │   ├── Project listing                                        │
│  │   ├── Contractor directory                                   │
│  │   └── Rankings                                               │
│  ├── Authenticated Reads (35%)                                  │
│  │   ├── Session validation                                     │
│  │   ├── User profile                                           │
│  │   ├── Notifications                                          │
│  │   └── Project/Bid details                                    │
│  └── Admin Reads (20%)                                          │
│      ├── Dashboard stats                                        │
│      ├── User management                                        │
│      └── Content management                                     │
├─────────────────────────────────────────────────────────────────┤
│  Write Operations (15%)                                          │
│  ├── Auth Operations (40% of writes)                            │
│  │   ├── Session create/refresh                                 │
│  │   ├── Token blacklist                                        │
│  │   └── Audit logging                                          │
│  ├── User Actions (35% of writes)                               │
│  │   ├── Bid creation/updates                                   │
│  │   ├── Project creation/updates                               │
│  │   ├── Messages                                               │
│  │   └── Reviews                                                │
│  └── System Operations (25% of writes)                          │
│      ├── Notifications                                          │
│      ├── Scheduled jobs                                         │
│      └── Status transitions                                     │
└─────────────────────────────────────────────────────────────────┘
```

## PostgreSQL Migration Checklist

### Pre-Migration

- [ ] **Schema Compatibility Review**
  - [ ] Review SQLite-specific syntax in schema.prisma
  - [ ] Check for SQLite-specific column types
  - [ ] Verify JSON field handling (SQLite uses TEXT)
  - [ ] Review DateTime handling differences
  - [ ] Check autoincrement vs UUID strategies

- [ ] **Test Environment Setup**
  - [ ] Set up PostgreSQL test instance
  - [ ] Update Prisma provider to postgresql
  - [ ] Run `prisma generate` and verify
  - [ ] Run `prisma migrate dev` on empty database
  - [ ] Execute full test suite against PostgreSQL

- [ ] **Data Migration Planning**
  - [ ] Inventory all tables and row counts
  - [ ] Identify large tables needing batch migration
  - [ ] Plan for JSON field transformation
  - [ ] Create rollback strategy

### Migration Steps

1. **Export SQLite Data**
   ```bash
   # Export each table to JSON
   sqlite3 infra/prisma/dev.db ".mode json" ".output users.json" "SELECT * FROM User;"
   # Repeat for all tables
   ```

2. **Transform Data**
   - Convert SQLite datetime strings to PostgreSQL timestamps
   - Transform JSON stored as TEXT to JSONB
   - Handle NULL vs empty string differences

3. **Import to PostgreSQL**
   ```bash
   # Use Prisma seed or custom import script
   pnpm prisma db seed
   ```

4. **Update Configuration**
   ```env
   # .env
   DATABASE_URL="postgresql://user:password@host:5432/ath_db?schema=public"
   ```

5. **Run Migrations**
   ```bash
   pnpm prisma migrate deploy
   ```

6. **Verify Data Integrity**
   - Compare row counts
   - Verify foreign key relationships
   - Test critical queries

### Post-Migration

- [ ] **Performance Optimization**
  - [ ] Add PostgreSQL-specific indexes
  - [ ] Configure connection pooling (PgBouncer)
  - [ ] Set up query performance monitoring
  - [ ] Tune PostgreSQL configuration

- [ ] **Backup Strategy**
  - [ ] Configure automated backups
  - [ ] Test backup restoration
  - [ ] Set up point-in-time recovery

- [ ] **Monitoring Setup**
  - [ ] Query performance monitoring
  - [ ] Connection pool metrics
  - [ ] Slow query logging
  - [ ] Disk usage alerts

## Read Replica Strategy

### Phase 1: Single Primary (Immediate)
- PostgreSQL primary for all operations
- Connection pooling with PgBouncer (max 100 connections)
- Estimated capacity: 1000 concurrent users

### Phase 2: Read Replica (When needed)
**Trigger**: Primary CPU > 70% or read latency > 100ms

```
┌─────────────────────────────────────────────────────────────────┐
│                    READ REPLICA SETUP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐         ┌─────────────┐                        │
│  │   Primary   │ ──────► │   Replica   │                        │
│  │  (Writes)   │  async  │   (Reads)   │                        │
│  └─────────────┘  repl   └─────────────┘                        │
│        ▲                        ▲                                │
│        │                        │                                │
│        │                        │                                │
│  ┌─────────────────────────────────────────┐                    │
│  │              PgBouncer                   │                    │
│  │  (Connection Pooling + Read/Write Split) │                    │
│  └─────────────────────────────────────────┘                    │
│                      ▲                                           │
│                      │                                           │
│  ┌─────────────────────────────────────────┐                    │
│  │              API Server                  │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Routes to Replica:**
- `GET /api/projects` (marketplace)
- `GET /api/rankings`
- `GET /api/regions`
- `GET /api/reviews/contractors/:id`
- `GET /api/blog/posts`

**Routes to Primary:**
- All `POST`, `PUT`, `DELETE` operations
- `GET /api/auth/me` (session validation)
- `GET /api/notifications` (unread count accuracy)

### Phase 3: Multiple Replicas (Scale)
**Trigger**: Single replica at capacity

- Geographic distribution for latency
- Load balancing across replicas
- Estimated capacity: 10,000+ concurrent users

## Index Recommendations

### High Priority Indexes (Add Immediately)

```sql
-- Session lookups (every authenticated request)
CREATE INDEX idx_session_token_selector ON "Session"("tokenSelector");
CREATE INDEX idx_session_user_expires ON "Session"("userId", "expiresAt");

-- Project marketplace queries
CREATE INDEX idx_project_status_published ON "Project"("status", "publishedAt" DESC);
CREATE INDEX idx_project_region_status ON "Project"("regionId", "status");
CREATE INDEX idx_project_category_status ON "Project"("categoryId", "status");

-- Contractor rankings
CREATE INDEX idx_ranking_score ON "ContractorRanking"("totalScore" DESC);
CREATE INDEX idx_ranking_featured ON "ContractorRanking"("isFeatured", "totalScore" DESC);

-- Notifications
CREATE INDEX idx_notification_user_read ON "Notification"("userId", "isRead", "createdAt" DESC);

-- Reviews
CREATE INDEX idx_review_contractor ON "Review"("contractorId", "isDeleted", "createdAt" DESC);
```

### Medium Priority Indexes

```sql
-- Bid queries
CREATE INDEX idx_bid_project_status ON "Bid"("projectId", "status");
CREATE INDEX idx_bid_contractor ON "Bid"("contractorId", "status");

-- Audit logs
CREATE INDEX idx_audit_user_created ON "AuditLog"("userId", "createdAt" DESC);
CREATE INDEX idx_audit_event_created ON "AuditLog"("eventType", "createdAt" DESC);

-- Scheduled notifications
CREATE INDEX idx_scheduled_status_time ON "ScheduledNotification"("status", "scheduledFor");
```

## Decision
Migrate from SQLite to PostgreSQL as first step toward production readiness. Implement read replica when primary reaches 70% capacity.

## Consequences
- Better concurrent write support
- Foundation for read replicas
- Need PostgreSQL infrastructure
- Migration effort required
- Improved query performance with proper indexes
