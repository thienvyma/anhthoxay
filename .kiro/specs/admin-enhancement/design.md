# Design Document - Admin Enhancement

## Overview

Tài liệu này mô tả thiết kế kỹ thuật cho việc cải thiện hệ thống Admin Dashboard và Quote Calculator của dự án Anh Thợ Xây. Bao gồm 5 module chính:

1. **Fix Auth** - Cập nhật tất cả admin pages sử dụng JWT thay vì credentials
2. **Quote Calculator Enhancement** - Thêm tính năng lưu báo giá kèm đăng ký tư vấn
3. **Leads Management Enhancement** - Search, notes, export CSV, pagination, quoteData display
4. **Dashboard Charts** - Biểu đồ thống kê leads
5. **Google Sheets Integration** - Đồng bộ leads tự động qua OAuth2

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LANDING (Port 4200)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ QuoteCalculatorSection                                       ││
│  │  - Step 4: Result + "Lưu & Đăng ký tư vấn" button           ││
│  │  - SaveQuoteModal: Form nhập thông tin khách hàng           ││
│  │  - POST /leads với quoteData                                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API (Port 4202)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Leads Routes (Enhanced)                                      ││
│  │  - GET /leads?search=&status=&page=&limit=                  ││
│  │  - PUT /leads/:id (notes, status history)                   ││
│  │  - GET /leads/export (CSV)                                  ││
│  │  - GET /leads/stats (charts data)                           ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Google Sheets Routes (New)                                   ││
│  │  - GET /integrations/google/auth-url                        ││
│  │  - POST /integrations/google/callback                       ││
│  │  - POST /integrations/google/disconnect                     ││
│  │  - GET /integrations/google/status                          ││
│  │  - POST /integrations/google/test                           ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Google Sheets Service                                        ││
│  │  - syncLeadToSheet(lead)                                    ││
│  │  - Retry logic với exponential backoff                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN (Port 4201)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ DashboardPage (Enhanced)                                     ││
│  │  - LeadsLineChart: Leads theo ngày (30 ngày)                ││
│  │  - LeadsPieChart: Phân bố theo status                       ││
│  │  - LeadsBarChart: Phân bố theo source                       ││
│  │  - ConversionRate: NEW → CONVERTED %                        ││
│  │  - Quick Actions với navigation                             ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ LeadsPage (Enhanced)                                         ││
│  │  - SearchInput: Filter by name/phone/email                  ││
│  │  - Pagination: 20 items/page                                ││
│  │  - QuoteDataDisplay: Formatted table                        ││
│  │  - NotesEditor: Add/edit notes                              ││
│  │  - ExportButton: Download CSV                               ││
│  │  - StatusHistory: Timeline of changes                       ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ SettingsPage/GoogleSheetsTab (New)                          ││
│  │  - ConnectButton: Initiate OAuth2                           ││
│  │  - SpreadsheetIdInput: Configure target sheet               ││
│  │  - SyncStatus: Last sync, error count                       ││
│  │  - DisconnectButton: Revoke access                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Landing - QuoteCalculatorSection Enhancement

```typescript
// New state for save quote modal
interface SaveQuoteModalState {
  isOpen: boolean;
  name: string;
  phone: string;
  email: string;
  submitting: boolean;
}

// SaveQuoteModal component props
interface SaveQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteResult: QuoteResult;
  onSuccess: () => void;
}
```

### 2. Admin - LeadsPage Enhancement

```typescript
// Enhanced LeadsPage state
interface LeadsPageState {
  leads: CustomerLead[];
  loading: boolean;
  searchQuery: string;
  filterStatus: string;
  currentPage: number;
  totalPages: number;
  selectedLead: CustomerLead | null;
}

// QuoteDataDisplay component
interface QuoteDataDisplayProps {
  quoteData: string; // JSON string
}

// NotesEditor component
interface NotesEditorProps {
  leadId: string;
  initialNotes: string | null;
  onSave: (notes: string) => Promise<void>;
}
```

### 3. Admin - DashboardPage Enhancement

```typescript
// Chart data interfaces
interface LeadsChartData {
  dailyLeads: Array<{ date: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  sourceDistribution: Array<{ source: string; count: number }>;
  conversionRate: number;
}

// API response for stats
interface LeadsStatsResponse {
  dailyLeads: Array<{ date: string; count: number }>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  conversionRate: number;
  totalLeads: number;
  newLeads: number;
}
```

### 4. Admin - SettingsPage/GoogleSheetsTab

```typescript
// Google Sheets integration settings
interface GoogleSheetsSettings {
  connected: boolean;
  spreadsheetId: string | null;
  sheetName: string;
  lastSyncAt: string | null;
  syncEnabled: boolean;
  errorCount: number;
  lastError: string | null;
}

// OAuth callback response
interface GoogleOAuthCallbackResponse {
  success: boolean;
  message: string;
}
```

### 5. API - New Routes

```typescript
// GET /leads with pagination and search
interface LeadsQueryParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface PaginatedLeadsResponse {
  data: CustomerLead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GET /leads/stats
interface LeadsStatsResponse {
  dailyLeads: Array<{ date: string; count: number }>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  conversionRate: number;
}

// GET /leads/export
// Returns CSV file download
```

## Data Models

### Prisma Schema Updates

```prisma
// Add to CustomerLead model
model CustomerLead {
  // ... existing fields
  notes         String?
  statusHistory String?  // JSON array of status changes
}

// New model for Google Sheets integration
model Integration {
  id           String   @id @default(cuid())
  type         String   @unique // "google_sheets"
  config       String   // JSON: { spreadsheetId, sheetName, syncEnabled }
  credentials  String?  // Encrypted refresh token
  lastSyncAt   DateTime?
  errorCount   Int      @default(0)
  lastError    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Status History Format

```typescript
interface StatusHistoryEntry {
  from: string;
  to: string;
  changedAt: string; // ISO date
  changedBy?: string; // User ID if available
}

// Stored as JSON string in statusHistory field
type StatusHistory = StatusHistoryEntry[];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: JWT Token Inclusion
*For any* API request made from Admin Dashboard, the request SHALL include a valid JWT token in the Authorization header (format: "Bearer {token}")
**Validates: Requirements 1.1**

### Property 2: Token Refresh on 401
*For any* API response with status 401, the Admin Dashboard SHALL attempt to refresh the token exactly once before failing
**Validates: Requirements 1.2**

### Property 3: Token Cleanup on Logout
*For any* logout action, all stored tokens (accessToken, refreshToken, sessionId) SHALL be removed from localStorage
**Validates: Requirements 1.4**

### Property 4: Lead Creation with QuoteData
*For any* valid form submission from SaveQuoteModal, a new Lead SHALL be created with quoteData containing the exact calculation result
**Validates: Requirements 2.3**

### Property 5: Search Filter Correctness
*For any* search query, the filtered leads list SHALL only contain leads where name, phone, or email contains the search string (case-insensitive)
**Validates: Requirements 3.1**

### Property 6: QuoteData Parsing
*For any* lead with valid quoteData JSON, the QuoteDataDisplay component SHALL render all fields (categoryName, area, baseCost, materialsCost, grandTotal) in a formatted table
**Validates: Requirements 3.2**

### Property 7: Notes Persistence
*For any* notes update, the saved notes SHALL be retrievable on subsequent lead fetch
**Validates: Requirements 3.3**

### Property 8: CSV Export Completeness
*For any* export action, the generated CSV SHALL contain all leads matching the current filter with columns: name, phone, email, content, status, source, createdAt
**Validates: Requirements 3.4**

### Property 9: Status History Recording
*For any* status change, a new entry SHALL be appended to statusHistory with from, to, and changedAt fields
**Validates: Requirements 3.6**

### Property 10: Daily Leads Aggregation
*For any* set of leads, the dailyLeads chart data SHALL correctly count leads per day for the last 30 days
**Validates: Requirements 4.1**

### Property 11: Status Distribution Sum
*For any* set of leads, the sum of all status counts in the pie chart SHALL equal the total number of leads
**Validates: Requirements 4.2**

### Property 12: Source Distribution Sum
*For any* set of leads, the sum of all source counts in the bar chart SHALL equal the total number of leads
**Validates: Requirements 4.3**

### Property 13: Conversion Rate Calculation
*For any* set of leads, conversionRate SHALL equal (CONVERTED count / total non-CANCELLED leads) * 100
**Validates: Requirements 4.4**

### Property 14: Google Sheets Sync on Lead Creation
*For any* new lead created when Google Sheets is connected and enabled, the lead data SHALL be appended to the configured spreadsheet
**Validates: Requirements 5.5**

### Property 15: Google Sheets Retry Logic
*For any* failed Google Sheets sync, the system SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s delays)
**Validates: Requirements 5.6**

## Error Handling

### API Error Responses

```typescript
// Standard error format
interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  GOOGLE_AUTH_FAILED: 400,
  GOOGLE_SYNC_FAILED: 500,
  EXPORT_FAILED: 500,
};
```

### Google Sheets Error Handling

```typescript
// Retry configuration
const GOOGLE_SHEETS_RETRY = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds
};

// Error logging
interface SyncError {
  leadId: string;
  error: string;
  timestamp: string;
  retryCount: number;
}
```

## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests:

1. **Unit Tests**: Verify specific examples and edge cases
2. **Property-Based Tests**: Verify universal properties using `fast-check` library

### Property-Based Testing Configuration

- Library: `fast-check` (already installed in project)
- Minimum iterations: 100 per property
- Test file location: `api/src/services/*.property.test.ts`

### Test Categories

#### 1. API Tests
- JWT token inclusion in requests
- Token refresh mechanism
- Leads CRUD with pagination
- CSV export format
- Google Sheets OAuth flow

#### 2. Component Tests
- QuoteDataDisplay rendering
- NotesEditor save/load
- Chart data transformation
- Search filter behavior

#### 3. Integration Tests
- End-to-end lead creation with quoteData
- Google Sheets sync flow
- Status history tracking

### Property Test Annotations

Each property-based test MUST include:
```typescript
/**
 * **Feature: admin-enhancement, Property {number}: {property_text}**
 * **Validates: Requirements {X.Y}**
 */
```

