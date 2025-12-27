# Implementation Plan

- [x] 1. Remove sync and usage endpoints from API





  - [x] 1.1 Remove `/media/sync` endpoint from media.routes.ts


    - Delete the POST /media/sync route handler
    - _Requirements: 2.1_
  - [x] 1.2 Remove `/media/usage` endpoint from media.routes.ts


    - Delete the GET /media/usage route handler
    - _Requirements: 2.2_
  - [x] 1.3 Remove syncMedia() and getMediaUsage() from media.service.ts


    - Delete the syncMedia method
    - Delete the getMediaUsage method
    - Delete related helper functions if only used by these methods
    - _Requirements: 2.1, 2.2_
  - [x] 1.4 Write property test for file upload isolation


    - **Property 3: File upload does not create MediaAsset**
    - **Validates: Requirements 3.1, 4.1, 5.1**





- [ ] 2. Update Media API client in admin
  - [x] 2.1 Remove sync() and getUsage() from mediaApi in content.ts




    - Delete mediaApi.sync method
    - Delete mediaApi.getUsage method


    - Delete MediaUsageResponse and MediaSyncResponse types


    - _Requirements: 2.1, 2.2_

- [ ] 3. Update Media Page UI
  - [ ] 3.1 Remove sync button and usage tracking from MediaPage
    - Remove any sync button if exists
    - Remove usage tracking display if exists
    - _Requirements: 2.1, 2.2_
  - [ ] 3.2 Update info banner to clarify gallery-only purpose
    - Update banner text to clearly state this is for Landing Gallery only
    - _Requirements: 6.1_
  - [ ] 3.3 Simplify statistics display
    - Remove any cross-source statistics
    - Show only gallery-related counts (total, featured)
    - _Requirements: 6.2_
  - [ ]* 3.4 Write property test for gallery list isolation
    - **Property 4: Gallery list returns only MediaAsset records**
    - **Validates: Requirements 1.1, 2.3**

- [x] 4. Verify other modules use correct upload endpoint


  - [x] 4.1 Verify FurnitureCatalogTab uses uploadFile endpoint


    - Check ImageUpload and MultiImageUpload components use mediaApi.uploadFile
    - _Requirements: 3.1_
  - [x] 4.2 Verify MaterialsTab uses uploadFile endpoint


    - Check image upload uses mediaApi.uploadFile (not mediaApi.upload)
    - If using mediaApi.upload, change to mediaApi.uploadFile
    - _Requirements: 4.1_
  - [x] 4.3 Verify BlogPostsPage uses uploadFile endpoint


    - Check featured image upload uses mediaApi.uploadFile
    - _Requirements: 5.1_
  - [ ]* 4.4 Write property test for gallery upload
    - **Property 1: Gallery upload creates MediaAsset**
    - **Validates: Requirements 1.2**

- [x] 5. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Final cleanup and documentation


  - [x] 6.1 Update DAILY_CHANGELOG.md with changes


    - Document all modified files
    - _Requirements: All_
  - [ ]* 6.2 Write property test for gallery delete
    - **Property 2: Gallery delete removes both file and record**
    - **Validates: Requirements 1.3**

- [ ] 7. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
