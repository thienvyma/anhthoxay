# Requirements Document

## Introduction

Tách biệt Media Page trong Admin để chỉ quản lý ảnh cho Landing Gallery (slideshow và gallery section), không còn liên quan đến ảnh từ các nguồn khác như furniture catalog, materials, blog, interior, etc. Các phần khác sẽ quản lý ảnh riêng của mình thông qua endpoint `/media/upload-file` đã có sẵn.

## Glossary

- **Media_Page**: Trang quản lý media trong Admin Dashboard, hiển thị và quản lý ảnh cho Landing Gallery
- **MediaAsset**: Record trong database lưu thông tin ảnh gallery (url, alt, caption, isFeatured, etc.)
- **Landing_Gallery**: Section trên landing page hiển thị slideshow và gallery ảnh
- **Gallery_Upload**: Endpoint `/media` tạo MediaAsset record cho gallery
- **File_Upload**: Endpoint `/media/upload-file` chỉ upload file, không tạo MediaAsset record

## Requirements

### Requirement 1

**User Story:** As an admin, I want Media Page to only show gallery images, so that I can manage landing page gallery without confusion from other sources.

#### Acceptance Criteria

1. WHEN an admin views Media Page THEN the Media_Page SHALL display only images uploaded specifically for gallery purposes
2. WHEN an admin uploads an image via Media Page THEN the Media_Page SHALL create a MediaAsset record with gallery purpose
3. WHEN an admin deletes an image from Media Page THEN the Media_Page SHALL remove both the file and MediaAsset record

### Requirement 2

**User Story:** As an admin, I want to remove sync functionality that imports images from other sources, so that gallery remains clean and focused.

#### Acceptance Criteria

1. WHEN the sync endpoint is called THEN the Media_Page SHALL NOT scan or import images from materials, blog, interior, or other sources
2. WHEN the usage endpoint is called THEN the Media_Page SHALL NOT track usage across materials, blog, interior, or other sources
3. WHEN Media Page loads THEN the Media_Page SHALL only query MediaAsset records without scanning other tables

### Requirement 3

**User Story:** As an admin managing furniture catalog, I want images to be independent from gallery, so that deleting gallery images does not affect furniture.

#### Acceptance Criteria

1. WHEN an admin uploads furniture image THEN the Furniture_Catalog SHALL use upload-file endpoint without creating MediaAsset
2. WHEN an admin deletes a furniture item THEN the Furniture_Catalog SHALL only delete the furniture record, not affect MediaAsset
3. WHEN an admin views furniture catalog THEN the Furniture_Catalog SHALL display images directly from stored URLs

### Requirement 4

**User Story:** As an admin managing materials, I want images to be independent from gallery, so that deleting gallery images does not affect materials.

#### Acceptance Criteria

1. WHEN an admin uploads material image THEN the Materials_Config SHALL use upload-file endpoint without creating MediaAsset
2. WHEN an admin deletes a material THEN the Materials_Config SHALL only delete the material record, not affect MediaAsset
3. WHEN an admin views materials THEN the Materials_Config SHALL display images directly from stored URLs

### Requirement 5

**User Story:** As an admin managing blog posts, I want featured images to be independent from gallery, so that gallery management does not affect blog.

#### Acceptance Criteria

1. WHEN an admin uploads blog featured image THEN the Blog_Manager SHALL use upload-file endpoint without creating MediaAsset
2. WHEN an admin deletes a blog post THEN the Blog_Manager SHALL only delete the post record, not affect MediaAsset
3. WHEN an admin views blog posts THEN the Blog_Manager SHALL display featured images directly from stored URLs

### Requirement 6

**User Story:** As an admin, I want clear separation between gallery images and other images, so that I understand the purpose of Media Page.

#### Acceptance Criteria

1. WHEN Media Page displays info banner THEN the Media_Page SHALL clearly state that it manages only landing gallery images
2. WHEN Media Page shows statistics THEN the Media_Page SHALL show only gallery-related counts without usage tracking from other sources
3. WHEN an admin searches in Media Page THEN the Media_Page SHALL search only within gallery images
