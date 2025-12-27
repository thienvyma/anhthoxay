# Design Document: Media Gallery Isolation

## Overview

Refactor Media Page và API để chỉ quản lý ảnh cho Landing Gallery, loại bỏ các chức năng sync/usage tracking từ các nguồn khác. Điều này giúp Media Page trở nên đơn giản, rõ ràng và tập trung vào mục đích chính.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Dashboard                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Media Page  │  │  Furniture   │  │  Materials   │           │
│  │  (Gallery)   │  │   Catalog    │  │    Config    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│         │                 │                 │                    │
│         ▼                 ▼                 ▼                    │
│  ┌──────────────┐  ┌──────────────────────────────┐             │
│  │ POST /media  │  │   POST /media/upload-file    │             │
│  │ (MediaAsset) │  │   (File only, no record)     │             │
│  └──────┬───────┘  └──────────────┬───────────────┘             │
│         │                         │                              │
└─────────┼─────────────────────────┼──────────────────────────────┘
          │                         │
          ▼                         ▼
    ┌───────────┐            ┌───────────┐
    │MediaAsset │            │  .media/  │
    │  Table    │            │  folder   │
    └───────────┘            └───────────┘
```

## Components and Interfaces

### 1. Media Routes (api/src/routes/media.routes.ts)

**Changes:**
- Remove `/media/sync` endpoint
- Remove `/media/usage` endpoint  
- Simplify `GET /media` to only return MediaAsset records
- Keep `POST /media` for gallery uploads (creates MediaAsset)
- Keep `POST /media/upload-file` for other uploads (no MediaAsset)
- Keep `DELETE /media/:id` for gallery deletion
- Keep `GET /media/featured` and `GET /media/gallery` for public access

### 2. Media Service (api/src/services/media.service.ts)

**Changes:**
- Remove `syncMedia()` method
- Remove `getMediaUsage()` method
- Keep `getAllMedia()` - returns only MediaAsset records
- Keep `uploadMedia()` - creates MediaAsset for gallery
- Keep `deleteMedia()` - removes file and MediaAsset

### 3. Media Page (admin/src/app/pages/MediaPage/index.tsx)

**Changes:**
- Remove sync button and functionality
- Remove usage tracking display
- Update info banner to clarify gallery-only purpose
- Simplify statistics to show only gallery counts

### 4. Media API Client (admin/src/app/api/content.ts)

**Changes:**
- Remove `mediaApi.sync()` method
- Remove `mediaApi.getUsage()` method
- Keep other methods unchanged

## Data Models

### MediaAsset (unchanged)

```typescript
interface MediaAsset {
  id: string;
  url: string;           // /media/xxx.webp
  alt?: string;          // SEO alt text
  caption?: string;      // Image caption
  tags?: string;         // Comma-separated tags
  mimeType: string;      // image/webp
  width?: number;
  height?: number;
  size: number;          // bytes
  isFeatured: boolean;   // Show in slideshow
  isActive: boolean;     // Show in gallery
  displayOrder: number;  // Sort order
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Other Models (unchanged)

- `Material.imageUrl` - Direct URL, no MediaAsset relation
- `InteriorFurnitureItem.thumbnail` - Direct URL, no MediaAsset relation
- `InteriorFurnitureItem.images` - JSON array of URLs, no MediaAsset relation
- `BlogPost.featuredImage` - Direct URL, no MediaAsset relation

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Gallery upload creates MediaAsset
*For any* valid image file uploaded via `POST /media`, the system should create a MediaAsset record with the correct URL and metadata.
**Validates: Requirements 1.2**

### Property 2: Gallery delete removes both file and record
*For any* MediaAsset that exists, deleting it via `DELETE /media/:id` should remove both the physical file and the database record.
**Validates: Requirements 1.3**

### Property 3: File upload does not create MediaAsset
*For any* valid image file uploaded via `POST /media/upload-file`, the system should NOT create a MediaAsset record, only return the file URL.
**Validates: Requirements 3.1, 4.1, 5.1**

### Property 4: Gallery list returns only MediaAsset records
*For any* call to `GET /media`, the response should contain only records from MediaAsset table, regardless of images in other tables.
**Validates: Requirements 1.1, 2.3**

### Property 5: Gallery statistics count only MediaAsset
*For any* statistics displayed on Media Page, the counts should reflect only MediaAsset records, not images from other sources.
**Validates: Requirements 6.2**

### Property 6: Gallery search scopes to MediaAsset only
*For any* search query on Media Page, the results should come only from MediaAsset table based on alt, tags, and url fields.
**Validates: Requirements 6.3**

## Error Handling

| Error Case | Response |
|------------|----------|
| Upload invalid file type | 400 VALIDATION_ERROR: "Only image files are allowed" |
| Upload file too large | 400 VALIDATION_ERROR: "File size exceeds limit" |
| Delete non-existent MediaAsset | 404 NOT_FOUND: "Media asset not found" |
| Unauthorized access | 401 UNAUTHORIZED |
| Insufficient permissions | 403 FORBIDDEN |

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

- **Unit tests**: Verify specific examples and edge cases
- **Property-based tests**: Verify universal properties across all inputs

### Property-Based Testing

**Library**: fast-check (already used in the project)

**Configuration**: Each property test should run minimum 100 iterations.

**Test Annotations**: Each property-based test must be tagged with:
```typescript
// **Feature: media-gallery-isolation, Property {number}: {property_text}**
```

### Test Cases

1. **Gallery Upload Tests**
   - Upload valid image → MediaAsset created
   - Upload invalid file → Error returned
   - Upload via upload-file → No MediaAsset created

2. **Gallery Delete Tests**
   - Delete existing MediaAsset → File and record removed
   - Delete non-existent → 404 error

3. **Gallery List Tests**
   - List returns only MediaAsset records
   - List does not include images from other tables

4. **Search Tests**
   - Search by alt text → Correct results
   - Search by tags → Correct results
   - Search does not return non-gallery images
