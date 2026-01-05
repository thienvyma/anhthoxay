# Design Document: Admin Guide & API Keys Management

## Overview

Tính năng này thêm 2 phần mới vào Admin Panel:
1. **Guide Page** (`/guide`) - Trang hướng dẫn sử dụng với 7 tabs
2. **API Keys Management** (`/settings/api-keys`) - Quản lý API keys cho AI agent integration

### Mục tiêu
- Giúp Admin/Manager tự học cách sử dụng hệ thống
- Cho phép tích hợp AI agents (ChatGPT, Claude) một cách an toàn
- Cung cấp khả năng bật/tắt/xóa API keys linh hoạt

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Panel (React)                       │
├─────────────────────────────────────────────────────────────────┤
│  /guide                    │  /settings/api-keys                │
│  ┌───────────────────┐     │  ┌───────────────────────────────┐ │
│  │ GuidePage         │     │  │ ApiKeysPage                   │ │
│  │ ├─ TabNavigation  │     │  │ ├─ ApiKeysList                │ │
│  │ ├─ OverviewTab    │     │  │ ├─ CreateApiKeyModal          │ │
│  │ ├─ LeadsTab       │     │  │ ├─ ApiKeyDetailPanel          │ │
│  │ ├─ BlogTab        │     │  │ ├─ TestApiKeyModal            │ │
│  │ ├─ ProjectsTab    │     │  │ └─ EditApiKeyModal            │ │
│  │ ├─ ContractorsTab │     │  └───────────────────────────────┘ │
│  │ ├─ SettingsTab    │     │                                    │
│  │ └─ ApiKeysTab     │     │                                    │
│  └───────────────────┘     │                                    │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API (Hono)                               │
├─────────────────────────────────────────────────────────────────┤
│  /api/admin/api-keys/*     │  Middleware                        │
│  ├─ GET    /               │  ├─ authenticate()                 │
│  ├─ POST   /               │  ├─ requireRole('ADMIN')           │
│  ├─ GET    /:id            │  └─ apiKeyAuth() (for external)    │
│  ├─ PUT    /:id            │                                    │
│  ├─ DELETE /:id            │                                    │
│  ├─ PUT    /:id/toggle     │                                    │
│  └─ POST   /:id/test       │                                    │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Database (Prisma)                          │
├─────────────────────────────────────────────────────────────────┤
│  ApiKey                    │  ApiKeyUsageLog                    │
│  ├─ id                     │  ├─ id                             │
│  ├─ name                   │  ├─ apiKeyId                       │
│  ├─ keyPrefix              │  ├─ endpoint                       │
│  ├─ keyHash                │  ├─ method                         │
│  ├─ scope                  │  ├─ statusCode                     │
│  ├─ allowedEndpoints       │  ├─ responseTime                   │
│  ├─ status                 │  ├─ ipAddress                      │
│  ├─ expiresAt              │  └─ createdAt                      │
│  ├─ lastUsedAt             │                                    │
│  ├─ usageCount             │                                    │
│  └─ createdAt              │                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. GuidePage (`admin/src/app/pages/GuidePage/`)
```typescript
// GuidePage/index.tsx - Main page with tab navigation
interface GuidePageProps {}

// GuidePage/tabs/OverviewTab.tsx
// GuidePage/tabs/LeadsTab.tsx
// GuidePage/tabs/BlogTab.tsx
// GuidePage/tabs/ProjectsTab.tsx
// GuidePage/tabs/ContractorsTab.tsx
// GuidePage/tabs/SettingsTab.tsx
// GuidePage/tabs/ApiKeysGuideTab.tsx
```

#### 2. ApiKeysPage (`admin/src/app/pages/ApiKeysPage/`)
```typescript
// ApiKeysPage/index.tsx - Main page
interface ApiKeysPageProps {}

// ApiKeysPage/components/ApiKeysList.tsx
interface ApiKeysListProps {
  apiKeys: ApiKey[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onSelect: (id: string) => void;
}

// ApiKeysPage/components/CreateApiKeyModal.tsx
interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (apiKey: ApiKey, rawKey: string) => void;
}

// ApiKeysPage/components/ApiKeyDetailPanel.tsx
interface ApiKeyDetailPanelProps {
  apiKey: ApiKey | null;
  usageLogs: ApiKeyUsageLog[];
  onEdit: () => void;
  onDelete: () => void;
}

// ApiKeysPage/components/TestApiKeyModal.tsx
interface TestApiKeyModalProps {
  isOpen: boolean;
  apiKey: ApiKey | null;
  onClose: () => void;
}

// ApiKeysPage/components/EditApiKeyModal.tsx
interface EditApiKeyModalProps {
  isOpen: boolean;
  apiKey: ApiKey | null;
  onClose: () => void;
  onSaved: (apiKey: ApiKey) => void;
}

// ApiKeysPage/components/KeyCreatedModal.tsx - Shows raw key once
interface KeyCreatedModalProps {
  isOpen: boolean;
  rawKey: string;
  onClose: () => void;
}
```

### Backend Routes

#### API Keys Routes (`api/src/routes/api-keys.routes.ts`)
```typescript
// Admin routes (require ADMIN role)
GET    /api/admin/api-keys           // List all API keys
POST   /api/admin/api-keys           // Create new API key
GET    /api/admin/api-keys/:id       // Get API key details
PUT    /api/admin/api-keys/:id       // Update API key
DELETE /api/admin/api-keys/:id       // Delete API key
PUT    /api/admin/api-keys/:id/toggle // Toggle status
POST   /api/admin/api-keys/:id/test  // Test API key
GET    /api/admin/api-keys/:id/logs  // Get usage logs
```

### Backend Services

#### ApiKeyService (`api/src/services/api-key.service.ts`)
```typescript
interface ApiKeyService {
  // CRUD operations
  list(filters?: ApiKeyFilters): Promise<ApiKey[]>;
  create(data: CreateApiKeyInput): Promise<{ apiKey: ApiKey; rawKey: string }>;
  getById(id: string): Promise<ApiKey | null>;
  update(id: string, data: UpdateApiKeyInput): Promise<ApiKey>;
  delete(id: string): Promise<void>;
  
  // Status management
  toggleStatus(id: string): Promise<ApiKey>;
  
  // Authentication
  validateKey(rawKey: string): Promise<ApiKey | null>;
  checkPermission(apiKey: ApiKey, method: string, endpoint: string): boolean;
  
  // Usage tracking
  logUsage(apiKeyId: string, log: UsageLogInput): Promise<void>;
  getUsageLogs(apiKeyId: string, limit?: number): Promise<ApiKeyUsageLog[]>;
  
  // Testing
  testKey(id: string, endpoint: string): Promise<TestResult>;
}
```

### Middleware

#### API Key Authentication (`api/src/middleware/api-key-auth.ts`)
```typescript
// Middleware for external API access via API key
export function apiKeyAuth() {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header('X-API-Key');
    
    if (!apiKey) {
      return c.json({ error: { code: 'API_KEY_REQUIRED' } }, 401);
    }
    
    const validatedKey = await apiKeyService.validateKey(apiKey);
    
    if (!validatedKey) {
      return c.json({ error: { code: 'API_KEY_INVALID' } }, 401);
    }
    
    if (validatedKey.status === 'INACTIVE') {
      return c.json({ error: { code: 'API_KEY_INACTIVE' } }, 401);
    }
    
    if (validatedKey.status === 'EXPIRED') {
      return c.json({ error: { code: 'API_KEY_EXPIRED' } }, 401);
    }
    
    // Check permissions
    const method = c.req.method;
    const path = c.req.path;
    
    if (!apiKeyService.checkPermission(validatedKey, method, path)) {
      return c.json({ error: { code: 'PERMISSION_DENIED' } }, 403);
    }
    
    // Set API key in context
    c.set('apiKey', validatedKey);
    
    // Log usage
    await apiKeyService.logUsage(validatedKey.id, {
      endpoint: path,
      method,
      ipAddress: c.req.header('x-forwarded-for') || 'unknown'
    });
    
    await next();
  };
}
```

## Data Models

### Prisma Schema Additions

```prisma
// API Key Scope enum
enum ApiKeyScope {
  READ_ONLY    // GET only
  READ_WRITE   // GET, POST, PUT
  FULL_ACCESS  // GET, POST, PUT, DELETE
}

// API Key Status enum
enum ApiKeyStatus {
  ACTIVE
  INACTIVE
  EXPIRED
}

// API Key model
model ApiKey {
  id               String        @id @default(cuid())
  name             String        @unique
  description      String?
  keyPrefix        String        // First 8 chars for display
  keyHash          String        // bcrypt hash of full key
  scope            ApiKeyScope   @default(READ_ONLY)
  allowedEndpoints String        // JSON array: ["leads", "blog", "projects"]
  status           ApiKeyStatus  @default(ACTIVE)
  expiresAt        DateTime?     // null = never expires
  lastUsedAt       DateTime?
  usageCount       Int           @default(0)
  createdBy        String        // Admin user ID
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  // Relations
  creator          User          @relation(fields: [createdBy], references: [id])
  usageLogs        ApiKeyUsageLog[]
  
  @@index([keyPrefix])
  @@index([status])
}

// API Key Usage Log model
model ApiKeyUsageLog {
  id           String   @id @default(cuid())
  apiKeyId     String
  endpoint     String
  method       String
  statusCode   Int
  responseTime Int      // milliseconds
  ipAddress    String
  userAgent    String?
  createdAt    DateTime @default(now())
  
  // Relations
  apiKey       ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
  
  @@index([apiKeyId])
  @@index([createdAt])
}
```

### TypeScript Types

```typescript
// Endpoint groups
type EndpointGroup = 'leads' | 'blog' | 'projects' | 'contractors' | 'reports';

// Endpoint group to paths mapping
const ENDPOINT_GROUPS: Record<EndpointGroup, string[]> = {
  leads: ['/api/leads', '/api/leads/*'],
  blog: ['/api/blog/*', '/blog/*'],
  projects: ['/api/projects', '/api/projects/*'],
  contractors: ['/api/contractors', '/api/contractors/*'],
  reports: ['/api/admin/dashboard', '/api/leads/stats', '/api/leads/export']
};

// Create API Key input
interface CreateApiKeyInput {
  name: string;
  description?: string;
  scope: ApiKeyScope;
  allowedEndpoints: EndpointGroup[];
  expiresAt?: Date;
}

// Update API Key input
interface UpdateApiKeyInput {
  name?: string;
  description?: string;
  scope?: ApiKeyScope;
  allowedEndpoints?: EndpointGroup[];
  expiresAt?: Date;
}

// Test result
interface TestResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
  message: string;
  data?: unknown;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API Key Masking
*For any* API key displayed in the UI, only the first 8 characters (keyPrefix) should be visible, followed by masking characters.
**Validates: Requirements 9.2**

### Property 2: Status Filter Correctness
*For any* list of API keys and any status filter, the filtered result should contain only keys matching that status.
**Validates: Requirements 9.4**

### Property 3: Key Generation Uniqueness
*For any* newly generated API key, the key should be exactly 64 characters and unique across all existing keys.
**Validates: Requirements 10.2**

### Property 4: Toggle Status Round-Trip
*For any* API key, toggling status twice should return the key to its original status.
**Validates: Requirements 11.1, 11.2**

### Property 5: Inactive Key Rejection
*For any* API key with status INACTIVE, all API requests using that key should be rejected with 401.
**Validates: Requirements 11.3**

### Property 6: Deleted Key Rejection
*For any* deleted API key, all subsequent API requests using that key should be rejected with 401.
**Validates: Requirements 12.3**

### Property 7: Valid Key Authentication
*For any* API key with status ACTIVE and not expired, requests with correct X-API-Key header should be authenticated.
**Validates: Requirements 16.1**

### Property 8: Invalid Key Rejection
*For any* string that is not a valid API key, requests should be rejected with 401.
**Validates: Requirements 16.2**

### Property 9: Expired Key Rejection
*For any* API key with expiresAt in the past, requests should be rejected with 401.
**Validates: Requirements 16.4**

### Property 10: Usage Tracking
*For any* successful API request using a valid key, the lastUsedAt timestamp should be updated.
**Validates: Requirements 16.5**

### Property 11: Read-Only Scope Enforcement
*For any* API key with READ_ONLY scope, POST, PUT, and DELETE requests should be rejected with 403.
**Validates: Requirements 17.1**

### Property 12: Read-Write Scope Enforcement
*For any* API key with READ_WRITE scope, DELETE requests should be rejected with 403.
**Validates: Requirements 17.2**

### Property 13: Endpoint Group Enforcement
*For any* API request, if the endpoint is not in the key's allowedEndpoints, the request should be rejected with 403.
**Validates: Requirements 17.3**

### Property 14: Full Access Permission
*For any* API key with FULL_ACCESS scope and endpoint in allowedEndpoints, all HTTP methods should be allowed.
**Validates: Requirements 17.4**

### Property 15: Expiration Auto-Status
*For any* API key with expiresAt in the past, the status should be automatically set to EXPIRED.
**Validates: Requirements 18.3**

## Error Handling

### API Error Codes

| Code | HTTP Status | Message (Vietnamese) |
|------|-------------|---------------------|
| `API_KEY_REQUIRED` | 401 | Yêu cầu API key |
| `API_KEY_INVALID` | 401 | API key không hợp lệ |
| `API_KEY_INACTIVE` | 401 | API key đã bị tắt |
| `API_KEY_EXPIRED` | 401 | API key đã hết hạn |
| `PERMISSION_DENIED` | 403 | Không có quyền truy cập |
| `ENDPOINT_NOT_ALLOWED` | 403 | Endpoint không được phép |
| `SCOPE_INSUFFICIENT` | 403 | Quyền không đủ cho thao tác này |
| `API_KEY_NAME_EXISTS` | 400 | Tên API key đã tồn tại |
| `API_KEY_NOT_FOUND` | 404 | Không tìm thấy API key |

### Error Response Format

```typescript
interface ApiKeyErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  correlationId: string;
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:
- **Unit tests**: Verify specific examples, edge cases, and UI interactions
- **Property-based tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Library

We will use **fast-check** for property-based testing in TypeScript/JavaScript.

### Test File Structure

```
api/src/
├── services/
│   ├── api-key.service.ts
│   └── api-key.service.test.ts      # Unit tests
├── middleware/
│   ├── api-key-auth.ts
│   └── api-key-auth.test.ts         # Unit tests
└── api-key.property.test.ts         # Property-based tests

admin/src/app/pages/
├── ApiKeysPage/
│   ├── index.tsx
│   └── ApiKeysPage.test.tsx         # Component tests
└── GuidePage/
    ├── index.tsx
    └── GuidePage.test.tsx           # Component tests
```

### Property Test Annotations

Each property-based test must be annotated with:
```typescript
/**
 * **Feature: admin-guide-api-keys, Property {number}: {property_text}**
 * **Validates: Requirements {X.Y}**
 */
```

### Test Configuration

Property-based tests should run minimum 100 iterations:
```typescript
fc.assert(
  fc.property(/* ... */),
  { numRuns: 100 }
);
```
