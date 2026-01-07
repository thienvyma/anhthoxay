# Design Document: API Test Coverage

## Overview

Thiết kế test suite cho API app của ANH THỢ XÂY, tập trung vào các critical services và routes. Mục tiêu là tăng test coverage từ 7.3% lên ít nhất 30% cho các core business logic.

## Architecture

### Test Structure

```
api/src/
├── services/
│   ├── project.service.ts
│   ├── project.service.test.ts      # NEW
│   ├── bid.service.ts
│   ├── bid.service.test.ts          # NEW
│   ├── escrow.service.ts
│   ├── escrow.service.test.ts       # NEW
│   ├── notification.service.ts
│   ├── notification.service.test.ts # NEW
│   ├── review.service.ts
│   ├── review.service.test.ts       # NEW
│   └── ranking.service.ts
│       └── ranking.service.test.ts  # NEW
├── routes/
│   ├── project.routes.test.ts       # NEW
│   ├── bid.routes.test.ts           # NEW
│   └── escrow.routes.test.ts        # NEW
└── test-utils/
    ├── mock-prisma.ts               # Prisma mock utilities
    ├── fixtures.ts                  # Test data fixtures
    └── test-helpers.ts              # Common test helpers
```

### Testing Strategy

1. **Unit Tests**: Test individual service methods with mocked Prisma
2. **Property-Based Tests**: Test business rules with random inputs using fast-check
3. **Integration Tests**: Test routes with mocked services

## Components and Interfaces

### Test Utilities

```typescript
// api/src/test-utils/mock-prisma.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'vitest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export function createMockPrisma(): MockPrismaClient {
  return mockDeep<PrismaClient>();
}
```

```typescript
// api/src/test-utils/fixtures.ts
export const fixtures = {
  user: {
    homeowner: () => ({
      id: 'user-homeowner-1',
      email: 'homeowner@test.com',
      role: 'HOMEOWNER',
      // ...
    }),
    contractor: () => ({
      id: 'user-contractor-1',
      email: 'contractor@test.com',
      role: 'CONTRACTOR',
      // ...
    }),
    admin: () => ({
      id: 'user-admin-1',
      email: 'admin@test.com',
      role: 'ADMIN',
      // ...
    }),
  },
  project: {
    draft: () => ({ /* ... */ }),
    open: () => ({ /* ... */ }),
    matched: () => ({ /* ... */ }),
  },
  bid: {
    pending: () => ({ /* ... */ }),
    approved: () => ({ /* ... */ }),
  },
  escrow: {
    pending: () => ({ /* ... */ }),
    held: () => ({ /* ... */ }),
  },
};
```

### Service Test Pattern

```typescript
// Example: project.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from './project.service';
import { createMockPrisma, MockPrismaClient } from '../test-utils/mock-prisma';
import { fixtures } from '../test-utils/fixtures';

describe('ProjectService', () => {
  let service: ProjectService;
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new ProjectService(mockPrisma);
  });

  describe('create', () => {
    it('should generate code in PRJ-YYYY-NNN format', async () => {
      // Arrange
      const input = { title: 'Test Project', /* ... */ };
      mockPrisma.project.create.mockResolvedValue({ /* ... */ });

      // Act
      const result = await service.create(input, 'user-id');

      // Assert
      expect(result.code).toMatch(/^PRJ-\d{4}-\d{3}$/);
    });
  });
});
```

## Data Models

### Test Data Generators (for Property-Based Testing)

```typescript
// api/src/test-utils/generators.ts
import * as fc from 'fast-check';

export const generators = {
  projectStatus: () => fc.constantFrom(
    'DRAFT', 'PENDING_APPROVAL', 'OPEN', 'BIDDING_CLOSED', 
    'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  ),
  
  bidStatus: () => fc.constantFrom(
    'PENDING', 'APPROVED', 'REJECTED', 'SELECTED', 'NOT_SELECTED', 'WITHDRAWN'
  ),
  
  escrowStatus: () => fc.constantFrom(
    'PENDING', 'HELD', 'PARTIAL_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CANCELLED'
  ),
  
  validProjectTransition: () => fc.constantFrom(
    ['DRAFT', 'PENDING_APPROVAL'],
    ['PENDING_APPROVAL', 'OPEN'],
    ['PENDING_APPROVAL', 'REJECTED'],
    ['OPEN', 'BIDDING_CLOSED'],
    ['BIDDING_CLOSED', 'MATCHED'],
    ['MATCHED', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'COMPLETED'],
  ),
  
  invalidProjectTransition: () => fc.constantFrom(
    ['DRAFT', 'OPEN'],
    ['DRAFT', 'COMPLETED'],
    ['OPEN', 'DRAFT'],
    ['COMPLETED', 'DRAFT'],
    ['CANCELLED', 'OPEN'],
  ),
  
  bidPrice: () => fc.integer({ min: 1000000, max: 1000000000 }),
  
  escrowPercentage: () => fc.integer({ min: 5, max: 20 }),
  
  rating: () => fc.integer({ min: 1, max: 5 }),
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Project code format
*For any* created project, the generated code SHALL match the pattern PRJ-YYYY-NNN where YYYY is the current year and NNN is a sequential number.
**Validates: Requirements 1.1**

### Property 2: Valid project status transitions
*For any* valid status transition pair (from, to), the transition SHALL succeed without error.
**Validates: Requirements 1.2**

### Property 3: Invalid project status transitions rejected
*For any* invalid status transition pair (from, to), the transition SHALL be rejected with an error.
**Validates: Requirements 1.3**

### Property 4: Project filtering correctness
*For any* set of projects and filter criteria, the returned projects SHALL all match the filter criteria.
**Validates: Requirements 1.4**

### Property 5: Contractor verification for bidding
*For any* contractor with verificationStatus != VERIFIED, bid creation SHALL be rejected.
**Validates: Requirements 2.1**

### Property 6: Bid anonymization for homeowners
*For any* bid viewed by a homeowner, the contractor's personal information (name, phone, email) SHALL be hidden.
**Validates: Requirements 2.3**

### Property 7: Valid bid status transitions
*For any* valid bid status transition pair, the transition SHALL succeed.
**Validates: Requirements 2.4**

### Property 8: Bid withdrawal restrictions
*For any* bid with status not in [PENDING, APPROVED], withdrawal SHALL be rejected.
**Validates: Requirements 2.5**

### Property 9: Escrow amount calculation
*For any* bid price P and escrow percentage E, the escrow amount SHALL equal max(P × E / 100, minimumAmount).
**Validates: Requirements 3.1, 3.2**

### Property 10: Valid escrow status transitions
*For any* valid escrow status transition pair, the transition SHALL succeed.
**Validates: Requirements 3.3**

### Property 11: Escrow partial release tracking
*For any* partial release of amount A, the releasedAmount SHALL increase by A and remaining SHALL decrease by A.
**Validates: Requirements 3.4**

### Property 12: Notification unread count
*For any* user with N unread notifications, the unread count SHALL equal N.
**Validates: Requirements 4.2**

### Property 13: Notification preferences persistence
*For any* notification preference update, the stored preferences SHALL match the input.
**Validates: Requirements 4.4**

### Property 14: Review project completion check
*For any* project with status != COMPLETED, review creation SHALL be rejected.
**Validates: Requirements 5.2**

### Property 15: Ranking score calculation
*For any* contractor with rating R, projects P, response time T, and verification V, the score SHALL equal (R/5×40) + (min(P/10,1)×30) + (max(0,100-T/24×10)×15) + (V?15:0).
**Validates: Requirements 5.3**

### Property 16: Ranking ordering
*For any* set of rankings, they SHALL be ordered by totalScore descending.
**Validates: Requirements 5.4**

### Property 17: Protected routes require authentication
*For any* protected route called without auth token, the response SHALL be 401 Unauthorized.
**Validates: Requirements 6.1**

### Property 18: Role-restricted routes enforce authorization
*For any* role-restricted route called with unauthorized role, the response SHALL be 403 Forbidden.
**Validates: Requirements 6.2**

### Property 19: Validation errors return 400
*For any* route with validation, invalid input SHALL return 400 Bad Request with error details.
**Validates: Requirements 6.3**

## Error Handling

### Test Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should throw NotFoundError when project does not exist', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);
    
    await expect(service.getById('non-existent'))
      .rejects.toThrow('Project not found');
  });

  it('should throw ForbiddenError when user lacks permission', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(fixtures.project.draft());
    
    await expect(service.update('project-id', {}, 'other-user-id'))
      .rejects.toThrow('Forbidden');
  });
});
```

## Testing Strategy

### Unit Testing

- **Framework**: Vitest
- **Mocking**: vitest-mock-extended for Prisma
- **Coverage Target**: 80% for services, 70% for routes

### Property-Based Testing

- **Library**: fast-check
- **Iterations**: 100 per property
- **Focus**: Business rules, calculations, state transitions

### Test Organization

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    describe('success cases', () => {
      it('should ...', () => {});
    });
    
    describe('error cases', () => {
      it('should throw when ...', () => {});
    });
    
    describe('properties', () => {
      it('Property X: description', () => {
        fc.assert(fc.property(/* ... */));
      });
    });
  });
});
```

### Test Tagging Format

Each property-based test MUST be tagged with:
```typescript
/**
 * **Feature: api-test-coverage, Property 1: Project code format**
 * **Validates: Requirements 1.1**
 */
it('Property 1: Project code format', () => {
  // ...
});
```
