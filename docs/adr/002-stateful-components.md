# ADR-002: Stateful Components Analysis

## Status
Accepted

## Context
Identify stateful components that prevent horizontal scaling.

## Stateful Components

### 1. Rate Limiter (In-Memory)
**Location**: `api/src/middleware/rate-limiter.ts`
**Issue**: Uses in-memory Map for tracking attempts
**Impact**: Rate limits not shared across instances
**Solution**: Migrate to Redis-based rate limiting

### 2. WebSocket Connections (In-Memory)
**Location**: `api/src/websocket/chat.handler.ts`
**Issue**: Connection state stored in memory
**Impact**: Users can only connect to one server
**Solution**: Use Redis Pub/Sub for message broadcasting

### 3. Offline Message Queue (In-Memory)
**Location**: `api/src/websocket/chat.handler.ts`
**Issue**: Queued messages stored in memory
**Impact**: Lost on server restart
**Solution**: Persist to Redis or database

### 4. Session Storage (Database)
**Location**: Prisma Session model
**Issue**: Every request queries database for session
**Impact**: Database load, latency
**Solution**: Cache sessions in Redis

## Stateless Components (Good)

- JWT token validation (stateless)
- API route handlers (stateless)
- Prisma client (connection pooling)
- File uploads (direct to storage)

## Recommendations

### Phase 1: Quick Wins
1. ✅ PrismaClient singleton (DONE)
2. ✅ Graceful shutdown handler (DONE)

### Phase 2: Redis Integration
1. Rate limiting → Redis
2. Session caching → Redis
3. WebSocket state → Redis Pub/Sub

### Phase 3: Full Statelessness
1. Message queue for async operations
2. Distributed file storage (S3)
3. CDN for static assets

## Decision
Document stateful components and plan migration to stateless architecture.

## Consequences
- Clear roadmap for horizontal scaling
- Identified dependencies for Redis integration
- Risk assessment for production deployment
