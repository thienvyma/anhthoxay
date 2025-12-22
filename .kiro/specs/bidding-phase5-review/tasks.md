# Implementation Plan - Bidding Phase 5: Review & Ranking

- [x] 1. Set up Prisma models for Review System





  - [x] 1.1 Add Review model to schema.prisma


    - Create Review model with projectId, reviewerId, contractorId
    - Add rating, comment, images, response, respondedAt fields
    - Add isPublic, isDeleted, deletedAt, deletedBy fields
    - Add unique constraint on project-reviewer pair
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 1.2 Add ContractorRanking model to schema.prisma


    - Create model with score components (rating, projects, response, verification)
    - Add rank, previousRank, isFeatured, featuredAt, featuredBy
    - Add stats cache fields (totalProjects, completedProjects, totalReviews, averageRating)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1_
  - [x] 1.3 Update User model with review relations


    - Add reviewsGiven and reviewsReceived relations
    - Add ranking relation
    - _Requirements: 1.1_
  - [x] 1.4 Run Prisma generate and push schema


    - Execute pnpm db:generate and pnpm db:push
    - _Requirements: 1.1-1.3_

- [x] 2. Implement Review Service





  - [x] 2.1 Create review.schema.ts with Zod validation schemas


    - Define CreateReviewSchema with rating 1-5, optional comment, images
    - Define UpdateReviewSchema, ReviewQuerySchema
    - _Requirements: 2.4, 2.5_
  - [x] 2.2 Create review.service.ts with CRUD operations


    - Implement create with project status and ownership validation
    - Implement update with 7-day limit
    - Implement delete (soft delete)
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.2, 9.3_
  - [x] 2.3 Write property test for review rating bounds (Property 1)






    - **Property 1: Review Rating Bounds**
    - **Validates: Requirements 1.2, 2.4**
  - [x] 2.4 Write property test for review uniqueness (Property 2)






    - **Property 2: Review Uniqueness**
    - **Validates: Requirements 1.4, 2.3**
  - [x] 2.5 Write property test for review precondition (Property 3)






    - **Property 3: Review Precondition**
    - **Validates: Requirements 2.1, 2.2**
  - [x] 2.6 Write property test for image limit validation (Property 9)






    - **Property 9: Image Limit Validation**
    - **Validates: Requirements 2.5**

  - [x] 2.7 Implement listing methods





    - Implement listByContractor, listByReviewer, listPublic
    - _Requirements: 9.4, 10.1, 11.1_
  - [x] 2.8 Write property test for public review filtering (Property 5)






    - **Property 5: Public Review Filtering**
    - **Validates: Requirements 4.3**
  - [x] 2.9 Write property test for contractor view all reviews (Property 10)






    - **Property 10: Contractor View All Reviews**

    - **Validates: Requirements 4.4**
  - [x] 2.10 Implement response functionality





    - Implement addResponse with uniqueness check
    - Send notification to reviewer
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.11 Write property test for response uniqueness (Property 4)






    - **Property 4: Response Uniqueness**
    - **Validates: Requirements 3.1, 3.3**

  - [x] 2.12 Implement admin methods




    - Implement hide, unhide, adminDelete
    - _Requirements: 4.1, 4.2, 12.1, 12.2, 12.3_

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Rating Calculation





  - [x] 4.1 Add rating recalculation to review.service.ts


    - Implement recalculateContractorRating method
    - Use weighted average based on recency
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x]* 4.2 Write property test for rating recalculation (Property 6)






    - **Property 6: Rating Recalculation**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [x] 4.3 Trigger recalculation on review operations


    - Call recalculate after create, update, delete
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. Implement Ranking Service





  - [x] 5.1 Create ranking.service.ts


    - Implement calculateScore with weighted formula
    - Implement recalculateAllScores for batch update
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 5.2 Write property test for ranking score calculation (Property 7)











    - **Property 7: Ranking Score Calculation**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  - [x] 5.3 Implement ranking queries


    - Implement getRanking with pagination and filters
    - Implement getContractorRank
    - _Requirements: 13.1, 13.2, 13.3_
  - [x] 5.4 Implement featured contractors


    - Implement updateFeaturedContractors
    - Implement getFeaturedContractors with limit
    - Implement setFeatured for admin override
    - _Requirements: 8.1, 8.2, 8.3, 8.4_



  - [x] 5.5 Write property test for featured contractor limit (Property 8)











    - **Property 8: Featured Contractor Limit**
    - **Validates: Requirements 8.2**
  - [x] 5.6 Implement statistics methods


    - Implement getContractorStats
    - Implement getMonthlyStats
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Review API Routes

  - [x] 7.1 Create review.routes.ts for homeowner endpoints
    - POST /homeowner/projects/:projectId/review - Create review
    - PUT /homeowner/reviews/:id - Update review
    - DELETE /homeowner/reviews/:id - Delete review
    - GET /homeowner/reviews - List my reviews
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 7.2 Add contractor review endpoints
    - GET /contractor/reviews - List reviews for my projects
    - GET /contractor/reviews/:id - Get review detail
    - POST /contractor/reviews/:id/response - Add response
    - GET /contractor/reviews/stats - Get statistics
    - GET /contractor/reviews/ranking - Get my ranking
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 7.3 Add public review endpoints
    - GET /reviews/contractors/:id - List public reviews
    - GET /reviews/contractors/:id/summary - Get review summary

    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [x] 7.4 Add admin review endpoints
    - GET /admin/reviews - List all reviews
    - GET /admin/reviews/:id - Get review detail
    - PUT /admin/reviews/:id/hide - Hide review
    - PUT /admin/reviews/:id/unhide - Unhide review
    - DELETE /admin/reviews/:id - Permanently delete
    - GET /admin/reviews/stats - Platform statistics
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - [x] 7.5 Register review routes in main.ts

    - Import and mount all review routes with appropriate auth
    - _Requirements: 9.1-12.4_

- [x] 8. Implement Ranking API Routes





  - [x] 8.1 Create ranking.routes.ts


    - GET /rankings - List contractor rankings
    - GET /rankings/featured - Get featured contractors
    - GET /rankings/contractors/:id - Get contractor rank
    - _Requirements: 13.1, 13.2, 13.3_
  - [x] 8.2 Add admin ranking endpoints

    - POST /admin/rankings/recalculate - Trigger recalculation
    - PUT /admin/rankings/contractors/:id/featured - Set featured status
    - _Requirements: 7.5, 8.4_
  - [x] 8.3 Register ranking routes in main.ts


    - Import and mount ranking routes
    - _Requirements: 13.1-13.4_

- [x] 9. Implement Statistics Update Triggers





  - [x] 9.1 Add project completion trigger


    - Increment contractor totalProjects on project completion
    - _Requirements: 6.1_
  - [x] 9.2 Create daily ranking update job


    - Implement scheduled job to recalculate all rankings
    - Update featured contractors
    - _Requirements: 7.5_

- [x] 10. Implement Multi-Criteria Rating





  - [x] 10.1 Update Review model for multi-criteria


    - Add qualityRating, timelinessRating, communicationRating, valueRating fields
    - _Requirements: 17.1_

  - [x] 10.2 Update review schema and service

    - Add validation for each criteria (1-5)
    - Calculate weighted average for overall rating
    - _Requirements: 17.1, 17.2_

  - [x] 10.3 Write property test for multi-criteria calculation (Property 11)









    - **Property 11: Multi-Criteria Rating Calculation**
    - **Validates: Requirements 17.1, 17.2**
  - [x] 10.4 Update review UI for multi-criteria input


    - Display 4 star rating selectors
    - Show criteria labels in Vietnamese
    - _Requirements: 17.1_
  - [x] 10.5 Update contractor profile to show criteria breakdown


    - Display bar chart for each criteria
    - _Requirements: 17.3_

- [x] 11. Implement Review Helpfulness





  - [x] 11.1 Create ReviewHelpfulness model


    - Add reviewId, oderId, createdAt fields
    - Add unique constraint on review-user pair
    - _Requirements: 18.1, 18.2_
  - [x] 11.2 Implement helpfulness service methods


    - Add voteHelpful, getHelpfulCount methods
    - _Requirements: 18.1, 18.2_

  - [x] 11.3 Write property test for helpfulness vote uniqueness (Property 12)






    - **Property 12: Helpfulness Vote Uniqueness**
    - **Validates: Requirements 18.2**
  - [x] 11.4 Add helpfulness API endpoints


    - POST /reviews/:id/helpful - Vote helpful
    - _Requirements: 18.1_
  - [x] 11.5 Update review listing to sort by helpfulness


    - Add sortBy=helpful option
    - Highlight "Most Helpful" reviews
    - _Requirements: 18.3, 18.4_

- [x] 12. Implement Review Reporting





  - [x] 12.1 Create ReviewReport model


    - Add reviewId, reporterId, reason, status fields
    - _Requirements: 19.1, 19.2_
  - [x] 12.2 Implement report service methods


    - Add createReport, listReports, resolveReport methods
    - _Requirements: 19.2, 19.3, 19.4_
  - [x] 12.3 Add report API endpoints


    - POST /reviews/:id/report - Create report
    - GET /admin/review-reports - List reports
    - PUT /admin/review-reports/:id/resolve - Resolve report
    - _Requirements: 19.1, 19.3, 19.4_


  - [x] 12.4 Add report button to review UI





    - Show reason selection modal
    - _Requirements: 19.1, 19.2_

- [x] 13. Implement Review Reminder





  - [x] 13.1 Create review reminder scheduled job


    - Check completed projects without reviews
    - _Requirements: 20.1, 20.2_
  - [x] 13.2 Implement 3-day reminder


    - Send first reminder notification
    - _Requirements: 20.1_
  - [x] 13.3 Implement 7-day final reminder


    - Send final reminder with direct link
    - _Requirements: 20.2, 20.3_
  - [x] 13.4 Write property test for reminder suppression (Property 14)




    - **Property 14: Review Reminder Suppression**
    - **Validates: Requirements 20.4**

- [x] 14. Implement Contractor Badges
  - [x] 14.1 Create ContractorBadge model
    - Add contractorId, badgeType, awardedAt fields
    - _Requirements: 21.1, 21.2, 21.3_
  - [x] 14.2 Implement badge service
    - Add checkAndAwardBadges, getBadges methods
    - _Requirements: 21.1, 21.2, 21.3_

  - [x] 14.3 Write property test for badge award criteria (Property 13)






    - **Property 13: Badge Award Criteria**
    - **Validates: Requirements 21.1, 21.2, 21.3**
  - [x] 14.4 Create badge check scheduled job
    - Run daily to check badge criteria
    - _Requirements: 21.1, 21.2, 21.3_
  - [x] 14.5 Update contractor profile to display badges
    - Show badge icons with tooltips
    - _Requirements: 21.4_

- [x] 15. Implement Response Time Tracking





  - [x] 15.1 Add response time tracking to Bid model


    - Calculate time from project publish to bid creation
    - _Requirements: 22.1_
  - [x] 15.2 Update contractor statistics


    - Add averageResponseTime calculation
    - _Requirements: 22.2_
  - [x] 15.3 Update contractor profile display


    - Show "Thường phản hồi trong X giờ"
    - _Requirements: 22.3_
  - [x] 15.4 Add response time filter to contractor search


    - Filter by response time ranges
    - _Requirements: 22.4_


- [x] 16. Final Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
