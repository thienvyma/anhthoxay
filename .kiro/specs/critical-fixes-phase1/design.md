# Design Document - Critical Fixes Phase 1

## Overview

Tài liệu này mô tả thiết kế kỹ thuật để khắc phục các vấn đề quan trọng được xác định trong TECHNICAL_IMPROVEMENT_ANALYSIS.md. Các thay đổi tập trung vào:

1. **N+1 Query Optimization** - Refactor ranking.service.ts để sử dụng batch processing
2. **Structured Logging** - Replace console.error với createLogger() trong các services
3. **Production Startup Validation** - Thêm checks cho JWT_SECRET trong main.ts
4. **Error Handling Consistency** - Cải thiện error handling trong bid.service.ts và escrow.service.ts

## Architecture

### Current State

```
┌─────────────────────────────────────────────────────────────┐
│                    ranking.service.ts                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ recalculateAllScores()                              │    │
│  │   for (contractor of contractors) {                 │    │
│  │     await calculateScore(contractor.id)  ← N queries│    │
│  │     await getContractorStatsInternal()   ← N queries│    │
│  │   }                                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ getMonthlyStats()                                   │    │
│  │   for (i = 0; i < months; i++) {                    │    │
│  │     await prisma.project.count()  ← 6 queries       │    │
│  │     await prisma.review.findMany() ← 6 queries      │    │
│  │     await prisma.bid.count() × 2   ← 12 queries     │    │
│  │   }                                                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────────┐
│                    ranking.service.ts                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ recalculateAllScores()                              │    │
│  │   const chunks = chunkArray(contractors, 50)        │    │
│  │   for (chunk of chunks) {                           │    │
│  │     await Promise.all(chunk.map(c =>                │    │
│  │       calculateAndUpdateScore(c.id)                 │    │
│  │     ))                                              │    │
│  │   }                                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ getMonthlyStats()                                   │    │
│  │   const [projects, reviews, bids] = await Promise.all([│  │
│  │     aggregateProjectsByMonth(),                     │    │
│  │     aggregateReviewsByMonth(),                      │    │
│  │     aggregateBidsByMonth()                          │    │
│  │   ])                                                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. RankingService Refactoring

#### New Helper Function: chunkArray
```typescript
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

#### Modified: recalculateAllScores
- Use chunking with CHUNK_SIZE = 50
- Use Promise.all for parallel processing within chunks
- Use structured logger for error handling
- Continue processing on individual failures

#### Modified: getMonthlyStats
- Use single aggregated query per data type
- Group results by month in application code
- Reduce from 24+ queries to 3 queries

### 2. Structured Logger Integration

#### Logger Usage Pattern
```typescript
import { createLogger } from '../utils/logger';

// In service methods
const logger = createLogger();
logger.error('Failed to calculate score', { 
  contractorId, 
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined
});
```

#### Files to Update
- `api/src/services/ranking.service.ts`
- `api/src/services/bid.service.ts`
- `api/src/services/escrow.service.ts`

### 3. Production Startup Validation

#### New Function: validateProductionConfig
```typescript
// In main.ts
function validateProductionConfig(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    if (!process.env.JWT_SECRET) {
      console.error('❌ FATAL: JWT_SECRET is required in production');
      process.exit(1);
    }
    
    if (process.env.JWT_SECRET.length < 32) {
      console.error('❌ FATAL: JWT_SECRET must be at least 32 characters');
      process.exit(1);
    }
  }
}
```

#### Call Location
- Call `validateProductionConfig()` at the start of main.ts, before any other initialization

## Data Models

Không có thay đổi về data models. Các thay đổi chỉ ảnh hưởng đến business logic và query patterns.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Batch processing produces same results as sequential
*For any* set of contractors, recalculating scores with batch processing SHALL produce the same ranking results as sequential processing
**Validates: Requirements 1.1**

### Property 2: Monthly stats aggregation correctness
*For any* contractor with completed projects and reviews, the aggregated monthly stats SHALL match the sum of individual month calculations
**Validates: Requirements 1.3**

### Property 3: Error resilience in batch processing
*For any* batch of contractors where one calculation fails, all other contractors in the batch SHALL still have their scores calculated
**Validates: Requirements 1.4**

### Property 4: JWT validation rejects short secrets in production
*For any* JWT_SECRET string shorter than 32 characters in production mode, validateJWTSecret SHALL throw an error
**Validates: Requirements 3.2**

### Property 5: Bid creation succeeds despite notification failure
*For any* valid bid creation request, if notification sending fails, the bid SHALL still be created successfully
**Validates: Requirements 4.1**

### Property 6: Escrow creation succeeds despite scheduling failure
*For any* valid escrow creation, if scheduled notification fails, the escrow SHALL still be created successfully
**Validates: Requirements 4.2, 4.3**

## Error Handling

### Error Logging Pattern
All services SHALL use the following pattern for error handling:

```typescript
try {
  // Operation that might fail
} catch (error) {
  const logger = createLogger();
  logger.error('Operation failed', {
    operation: 'operationName',
    context: { relevantId, otherContext },
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  // Continue or rethrow based on criticality
}
```

### Error Categories

1. **Critical Errors** - Rethrow after logging (e.g., database connection failures)
2. **Non-Critical Errors** - Log and continue (e.g., notification failures)
3. **Validation Errors** - Return error response without logging (expected behavior)

## Testing Strategy

### Dual Testing Approach

#### Unit Tests
- Test individual functions in isolation
- Mock Prisma client for database operations
- Verify error handling paths

#### Property-Based Tests
- Use `fast-check` library for property-based testing
- Generate random contractor data
- Verify invariants hold across all inputs

### Property-Based Testing Library
**Library:** fast-check (npm package)
**Configuration:** Minimum 100 iterations per property test

### Test File Structure
```
api/src/services/__tests__/
├── ranking.service.test.ts
├── ranking.service.property.test.ts
├── bid.service.test.ts
├── escrow.service.test.ts
└── startup-validation.test.ts
```

### Test Annotations
Each property-based test MUST include a comment referencing the correctness property:
```typescript
// **Feature: critical-fixes-phase1, Property 1: Batch processing produces same results as sequential**
test.prop([fc.array(fc.string())])('batch processing correctness', (contractors) => {
  // Test implementation
});
```
