# Design Document: Lead Duplicate Management

## Overview

Tính năng Lead Duplicate Management giúp hệ thống tự động phát hiện và xử lý leads trùng lặp dựa trên số điện thoại đã chuẩn hóa, đồng thời phân biệt theo nguồn (source) để giữ lại các nhu cầu khác nhau của cùng một khách hàng.

**Key Concepts:**
- **Duplicate**: Cùng phone + cùng source → có thể merge
- **Related**: Cùng phone + khác source → giữ riêng, đánh dấu liên quan
- **Auto-merge**: Trong 1 giờ + cùng phone + cùng source + status NEW → tự động gộp
- **Manual merge**: Admin có thể merge các duplicates ngoài time window

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ POST /leads     │  │ GET /leads      │  │ POST /leads/    │  │
│  │ (Create/Merge)  │  │ (List+Filter)   │  │ :id/merge       │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
┌───────────▼────────────────────▼────────────────────▼───────────┐
│                      Service Layer                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    LeadsService                              ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       ││
│  │  │ normalizePhone│  │ findDuplicate│  │ mergeLeads   │       ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘       ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       ││
│  │  │ createLead   │  │ getRelated   │  │ updateStats  │       ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────────┐
│                      Data Layer (Prisma)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    CustomerLead                              ││
│  │  + normalizedPhone: String (indexed)                        ││
│  │  + submissionCount: Int                                     ││
│  │  + isPotentialDuplicate: Boolean                            ││
│  │  + hasRelatedLeads: Boolean                                 ││
│  │  + relatedLeadCount: Int                                    ││
│  │  + mergedIntoId: String? (soft-delete reference)            ││
│  │  + mergedAt: DateTime?                                      ││
│  │  + potentialDuplicateIds: String? (JSON)                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Phone Normalization Utility

```typescript
// api/src/utils/phone-normalizer.ts

/**
 * Normalize phone number to standard format: 0xxxxxxxxx
 * - Remove spaces, dashes, parentheses
 * - Convert +84 or 84 prefix to 0
 */
export function normalizePhone(phone: string): string;

/**
 * Check if two phone numbers are equivalent after normalization
 */
export function phonesMatch(phone1: string, phone2: string): boolean;
```

### 2. LeadsService Extensions

```typescript
// api/src/services/leads.service.ts

interface CreateLeadResult {
  lead: CustomerLead;
  wasMerged: boolean;
  mergedIntoId?: string;
}

interface RelatedLeadsResult {
  bySource: Record<string, CustomerLead[]>;
  totalCount: number;
}

interface MergeLeadsInput {
  primaryLeadId: string;
  secondaryLeadIds: string[];
}

interface MergeLeadsResult {
  primaryLead: CustomerLead;
  mergedCount: number;
}

class LeadsService {
  // Enhanced create with auto-merge logic
  async createLead(input: CreateLeadInput): Promise<CreateLeadResult>;
  
  // Get related leads (same phone, any source)
  async getRelatedLeads(leadId: string): Promise<RelatedLeadsResult>;
  
  // Manual merge (Admin only)
  async mergeLeads(input: MergeLeadsInput, adminId: string): Promise<MergeLeadsResult>;
  
  // Enhanced stats excluding merged leads
  async getStats(): Promise<LeadsStatsResult>;
}
```

### 3. Enhanced Query Parameters

```typescript
// api/src/schemas/leads.schema.ts

const leadsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CANCELLED']).optional(),
  source: z.enum(['QUOTE_FORM', 'CONTACT_FORM', 'FURNITURE_QUOTE']).optional(),
  
  // New duplicate filters
  duplicateStatus: z.enum(['all', 'duplicates_only', 'no_duplicates']).default('all'),
  hasRelated: z.boolean().optional(),
  
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### 4. New API Endpoints

```typescript
// GET /leads/:id/related - Get related leads
// POST /leads/:id/merge - Merge leads (Admin only)
```

## Data Models

### CustomerLead Schema Changes

```prisma
model CustomerLead {
  id            String  @id @default(cuid())
  name          String
  phone         String
  normalizedPhone String  // NEW: Chuẩn hóa để so sánh
  email         String?
  content       String
  source        String  @default("CONTACT_FORM")
  status        String  @default("NEW")
  quoteData     String?
  notes         String?
  statusHistory String?

  // NEW: Duplicate management fields
  submissionCount       Int       @default(1)      // Số lần submit (sau merge)
  isPotentialDuplicate  Boolean   @default(false)  // Đánh dấu potential duplicate
  hasRelatedLeads       Boolean   @default(false)  // Có leads cùng phone khác source
  relatedLeadCount      Int       @default(0)      // Số leads liên quan
  potentialDuplicateIds String?                    // JSON: ["id1", "id2"]
  
  // NEW: Soft-delete for merged leads
  mergedIntoId          String?                    // Reference to primary lead
  mergedAt              DateTime?                  // When merged

  // Existing relation
  furnitureQuotations FurnitureQuotation[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([source])
  @@index([createdAt])
  @@index([normalizedPhone])                       // NEW: Index for duplicate lookup
  @@index([normalizedPhone, source])               // NEW: Composite index
  @@index([isPotentialDuplicate])                  // NEW: Filter index
  @@index([hasRelatedLeads])                       // NEW: Filter index
  @@index([mergedIntoId])                          // NEW: Merged leads lookup
}
```

### Auto-Merge Logic Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Create Lead Request                           │
│                 (name, phone, source, content)                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              1. Normalize Phone Number                           │
│         "+84 901 234 567" → "0901234567"                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│     2. Find existing lead with same normalizedPhone + source     │
│              AND status = 'NEW'                                  │
│              AND createdAt > (now - 1 hour)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│     Found? → AUTO-MERGE │     │   Not Found? → Check Duplicates │
│  - Append content       │     │                                 │
│  - Increment count      │     └─────────────────┬───────────────┘
│  - Update quoteData     │                       │
│  - Return existing lead │                       ▼
└─────────────────────────┘     ┌─────────────────────────────────┐
                                │  3. Find leads with same phone   │
                                │     (any source, any time)       │
                                └─────────────────┬───────────────┘
                                                  │
                                ┌─────────────────┴───────────────┐
                                │                                 │
                                ▼                                 ▼
                  ┌─────────────────────────┐   ┌─────────────────────────┐
                  │  Same source exists?    │   │  Different source only? │
                  │  → Mark as potential    │   │  → Mark as related      │
                  │    duplicate            │   │  → Create new lead      │
                  │  → Create new lead      │   └─────────────────────────┘
                  └─────────────────────────┘
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Phone Normalization Consistency

*For any* phone number string with special characters (spaces, dashes, parentheses) or international prefixes (+84, 84), normalizing it SHALL produce a consistent 10-digit string starting with "0".

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Normalization Round-Trip

*For any* valid Vietnamese phone number, normalizing it twice SHALL produce the same result as normalizing once (idempotent).

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 3: Auto-Merge Within Time Window

*For any* two lead submissions with same normalized phone AND same source AND within 1 hour AND existing lead has status NEW, the system SHALL have exactly one lead record with submissionCount >= 2.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 4: No Auto-Merge for Non-NEW Status

*For any* existing lead with status not equal to NEW, a new submission with same phone AND same source SHALL create a new lead record (not merge).

**Validates: Requirements 2.5**

### Property 5: Different Source Creates Separate Lead

*For any* two lead submissions with same normalized phone but DIFFERENT source, the system SHALL have two separate lead records.

**Validates: Requirements 3.1**

### Property 6: Related Leads Marking

*For any* set of leads with same normalized phone but different sources, ALL leads in the set SHALL have hasRelatedLeads=true AND relatedLeadCount equal to (total count - 1).

**Validates: Requirements 3.2, 3.3**

### Property 7: Potential Duplicate Detection

*For any* new lead created (not auto-merged) with same normalized phone AND same source as existing leads (outside time window), the new lead SHALL have isPotentialDuplicate=true.

**Validates: Requirements 4.1, 4.3**

### Property 8: Manual Merge Same Source Only

*For any* merge operation, attempting to merge leads with different sources SHALL fail with validation error.

**Validates: Requirements 6.1**

### Property 9: Manual Merge Content Aggregation

*For any* successful merge operation, the primary lead's content SHALL contain all content from secondary leads with timestamps, AND submissionCount SHALL equal sum of all merged leads' counts.

**Validates: Requirements 6.3, 6.4**

### Property 10: Soft-Delete After Merge

*For any* successful merge operation, all secondary leads SHALL have mergedIntoId set to primary lead's ID AND mergedAt set to merge timestamp.

**Validates: Requirements 6.5**

### Property 11: Stats Exclude Merged Leads

*For any* stats calculation, leads with mergedIntoId != null SHALL NOT be counted in totalLeads or conversion rate calculations.

**Validates: Requirements 7.1, 7.2**

### Property 12: Filter Correctness

*For any* list query with duplicateStatus='duplicates_only', ALL returned leads SHALL have isPotentialDuplicate=true. For hasRelated=true, ALL returned leads SHALL have hasRelatedLeads=true.

**Validates: Requirements 8.1, 8.2**

## Error Handling

### Validation Errors

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `INVALID_PHONE` | Số điện thoại không hợp lệ | 400 |
| `MERGE_DIFFERENT_SOURCE` | Không thể merge leads từ nguồn khác nhau | 400 |
| `MERGE_LEAD_NOT_FOUND` | Lead không tồn tại | 404 |
| `MERGE_ALREADY_MERGED` | Lead đã được merge trước đó | 400 |
| `MERGE_SELF` | Không thể merge lead với chính nó | 400 |

### Business Logic Errors

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `LEAD_MERGED` | Lead này đã được merge vào lead khác | 301 (redirect) |

## Testing Strategy

### Dual Testing Approach

**Unit Tests:**
- Phone normalization edge cases
- Merge validation logic
- Stats calculation

**Property-Based Tests:**
- Phone normalization consistency (Property 1, 2)
- Auto-merge behavior (Property 3, 4)
- Source differentiation (Property 5, 6)
- Duplicate detection (Property 7)
- Manual merge (Property 8, 9, 10)
- Stats accuracy (Property 11)
- Filter correctness (Property 12)

### Testing Framework

- **Library**: fast-check (property-based testing for TypeScript)
- **Minimum iterations**: 100 per property
- **Test file**: `api/src/services/__tests__/leads.service.pbt.test.ts`

### Test Generators

```typescript
// Phone number generator
const phoneArb = fc.oneof(
  fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 10, maxLength: 10 }),
  fc.tuple(fc.constant('+84'), fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 9, maxLength: 9 })).map(([prefix, num]) => prefix + num),
  // With spaces and dashes
  fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '-'), { minLength: 10, maxLength: 15 })
);

// Lead source generator
const sourceArb = fc.constantFrom('QUOTE_FORM', 'CONTACT_FORM', 'FURNITURE_QUOTE');

// Lead input generator
const leadInputArb = fc.record({
  name: fc.string({ minLength: 2, maxLength: 100 }),
  phone: phoneArb,
  source: sourceArb,
  content: fc.string({ minLength: 10, maxLength: 2000 }),
});
```
