# Implementation Plan

## Phase 1: Database Schema & Core Utilities

- [x] 1. Update Prisma schema for CustomerLead





  - [x] 1.1 Add new fields to CustomerLead model


    - Add `normalizedPhone: String` field
    - Add `submissionCount: Int @default(1)` field
    - Add `isPotentialDuplicate: Boolean @default(false)` field
    - Add `hasRelatedLeads: Boolean @default(false)` field
    - Add `relatedLeadCount: Int @default(0)` field
    - Add `potentialDuplicateIds: String?` field (JSON)
    - Add `mergedIntoId: String?` field
    - Add `mergedAt: DateTime?` field
    - _Requirements: 1.4, 4.3, 6.5_
  - [x] 1.2 Add database indexes


    - Add index on `normalizedPhone`
    - Add composite index on `[normalizedPhone, source]`
    - Add index on `isPotentialDuplicate`
    - Add index on `hasRelatedLeads`
    - Add index on `mergedIntoId`
    - _Requirements: 4.2, 8.1, 8.2_
  - [x] 1.3 Run Prisma migration


    - Generate migration file
    - Apply migration to database
    - _Requirements: 1.4_

- [x] 2. Create phone normalization utility






  - [x] 2.1 Implement normalizePhone function

    - Remove spaces, dashes, parentheses
    - Convert +84 prefix to 0
    - Convert 84 prefix (without plus) to 0
    - Handle edge cases (empty, invalid)
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 2.2 Write property tests for phone normalization
    - **Property 1: Phone Normalization Consistency**
    - **Property 2: Normalization Round-Trip (Idempotent)**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

## Phase 2: Auto-Merge Logic

- [x] 3. Implement auto-merge in LeadsService







  - [ ] 3.1 Update createLead method with duplicate detection
    - Normalize phone before lookup

    - Find existing lead with same normalizedPhone + source + status NEW + within 1 hour
    - If found: update existing lead (append content, increment count)
    - If not found: check for potential duplicates and related leads
    - _Requirements: 2.1, 2.5, 3.1_

  - [ ] 3.2 Implement content merging logic
    - Append new content with timestamp separator
    - Update quoteData if new one provided

    - Increment submissionCount
    - _Requirements: 2.2, 2.3, 2.4_
  - [ ] 3.3 Implement related leads detection
    - Find leads with same normalizedPhone but different source
    - Update hasRelatedLeads and relatedLeadCount on all related leads
    - _Requirements: 3.2, 3.3_
  - [ ] 3.4 Implement potential duplicate marking
    - If same phone + same source exists (outside time window)
    - Mark new lead as isPotentialDuplicate
    - Store potentialDuplicateIds
    - _Requirements: 4.1, 4.3_
  - [ ]* 3.5 Write property tests for auto-merge
    - **Property 3: Auto-Merge Within Time Window**
    - **Property 4: No Auto-Merge for Non-NEW Status**
    - **Property 5: Different Source Creates Separate Lead**
    - **Property 6: Related Leads Marking**
    - **Property 7: Potential Duplicate Detection**
    - **Validates: Requirements 2.1-2.5, 3.1-3.3, 4.1, 4.3**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: API Enhancements

- [x] 5. Update leads routes with new filters





  - [x] 5.1 Update leadsQuerySchema with new parameters


    - Add `duplicateStatus` filter (all, duplicates_only, no_duplicates)
    - Add `hasRelated` filter (boolean)
    - Add `source` filter
    - _Requirements: 8.1, 8.2_

  - [x] 5.2 Update getLeads method to handle new filters

    - Filter by isPotentialDuplicate
    - Filter by hasRelatedLeads
    - Filter by source
    - Exclude merged leads (mergedIntoId != null) by default
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 5.3 Write property tests for filters
    - **Property 12: Filter Correctness**
    - **Validates: Requirements 8.1, 8.2**



- [x] 6. Implement related leads endpoint



  - [x] 6.1 Create GET /leads/:id/related endpoint


    - Get all leads with same normalizedPhone
    - Group by source
    - Return source, status, content preview, createdAt
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 6.2 Add related leads count to lead detail response


    - Include relatedLeadCount in GET /leads/:id response
    - _Requirements: 5.1_

## Phase 4: Manual Merge Feature

- [x] 7. Implement manual merge functionality





  - [x] 7.1 Create merge validation logic


    - Validate all leads exist
    - Validate all leads have same source
    - Validate primary lead is not already merged
    - Validate secondary leads are not already merged
    - _Requirements: 6.1, 6.2_
  - [x] 7.2 Implement mergeLeads method in LeadsService

    - Append content from secondary leads to primary with timestamps
    - Sum up submissionCount
    - Set mergedIntoId and mergedAt on secondary leads
    - Update potentialDuplicateIds
    - _Requirements: 6.3, 6.4, 6.5_
  - [x] 7.3 Create POST /leads/:id/merge endpoint


    - Accept primaryLeadId and secondaryLeadIds
    - Require ADMIN or MANAGER role
    - Return merged primary lead
    - _Requirements: 6.2, 6.3_
  - [x] 7.4 Handle merged lead access


    - When accessing a merged lead, return redirect info to primary lead
    - _Requirements: 6.6_
  - [ ]* 7.5 Write property tests for manual merge
    - **Property 8: Manual Merge Same Source Only**
    - **Property 9: Manual Merge Content Aggregation**
    - **Property 10: Soft-Delete After Merge**
    - **Validates: Requirements 6.1-6.5**



- [x] 8. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Statistics Update





- [x] 9. Update statistics to exclude merged leads


  - [x] 9.1 Update getStats method

    - Exclude leads with mergedIntoId != null from totalLeads
    - Exclude merged leads from conversion rate calculation
    - Add duplicateSubmissionsBlocked metric (sum of submissionCount - 1 for all leads)
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ]* 9.2 Write property tests for stats
    - **Property 11: Stats Exclude Merged Leads**
    - **Validates: Requirements 7.1, 7.2**

## Phase 6: Data Migration

- [x] 10. Create migration script for existing data





  - [x] 10.1 Write script to normalize existing phone numbers


    - Iterate through all CustomerLead records
    - Set normalizedPhone for each record
    - _Requirements: 1.4_
  - [x] 10.2 Write script to detect existing duplicates


    - Group leads by normalizedPhone + source
    - Mark potential duplicates
    - Update hasRelatedLeads and relatedLeadCount
    - _Requirements: 4.1, 3.2, 3.3_


- [x] 11. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
