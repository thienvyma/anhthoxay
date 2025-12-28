# ADR-003: Caching Strategy

## Status
Proposed

## Context
Identify data suitable for caching to improve performance and reduce database load.

## Cacheable Data

### High Priority (Frequently Accessed, Rarely Changed)

| Data | TTL | Invalidation Trigger |
|------|-----|---------------------|
| Settings (public) | 1 hour | Admin update |
| BiddingSettings | 1 hour | Admin update |
| Regions (tree) | 1 hour | Admin CRUD |
| ServiceCategories | 1 hour | Admin CRUD |
| ServiceFees | 1 hour | Admin CRUD |

### Medium Priority (User-Specific)

| Data | TTL | Invalidation Trigger |
|------|-----|---------------------|
| User profile | 15 min | Profile update |
| Contractor profile | 15 min | Profile update |
| User sessions | 15 min | Logout/refresh |
| Notification count | 1 min | New notification |

### Low Priority (Dynamic Data)

| Data | TTL | Notes |
|------|-----|-------|
| Project list | 5 min | Paginated, filtered |
| Bid list | 5 min | Status changes frequently |
| Rankings | 1 hour | Calculated daily |

## Cache Keys Pattern

```
ath:{entity}:{id}
ath:settings:public
ath:settings:bidding
ath:regions:tree
ath:user:{userId}:profile
ath:user:{userId}:sessions
ath:contractor:{userId}:profile
ath:rankings:featured
```

## Implementation Plan

### Phase 1: Read-Through Cache
1. Add Redis client
2. Implement cache wrapper for settings
3. Add cache invalidation on updates

### Phase 2: Session Caching
1. Cache session lookups
2. Reduce database queries per request

### Phase 3: Full Caching Layer
1. Cache user profiles
2. Cache contractor rankings
3. Cache notification counts

## Decision
Implement Redis caching starting with high-priority static data.

## Consequences
- Reduced database load
- Faster response times
- Need to manage cache invalidation
- Additional infrastructure (Redis)
