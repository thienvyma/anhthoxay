# Implementation Plan - Bidding Phase 6: Portal UI

- [x] 1. Set up Portal App








  - [x] 1.1 Create portal directory with Vite + React


    - Initialize Vite project with React and TypeScript template
    - Configure port 4203 in vite.config.ts
    - _Requirements: 1.1, 1.5_
  - [x] 1.2 Configure shared packages

    - Add @app/shared and @app/ui to package.json
    - Configure tsconfig paths for shared imports
    - _Requirements: 1.2_
  - [x] 1.3 Set up React Router

    - Install react-router-dom
    - Create basic route structure
    - _Requirements: 1.3_
  - [x] 1.4 Configure Tailwind CSS

    - Install and configure Tailwind
    - Set up shared design tokens
    - _Requirements: 1.1_
  - [x] 1.5 Add portal to nx workspace

    - Create project.json for portal
    - Add dev, build, serve targets
    - _Requirements: 1.1_

- [x] 2. Implement Authentication





  - [x] 2.1 Create AuthContext and provider


    - Implement user state management
    - Implement login, register, logout methods
    - Store JWT tokens in localStorage
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Create ProtectedRoute component


    - Redirect unauthenticated users to login
    - Check role for role-specific routes
    - _Requirements: 2.1_
  - [x] 2.3 Write property test for protected route redirect (Property 1)










    - **Property 1: Protected Route Redirect**
    - **Validates: Requirements 2.1**
  - [x] 2.4 Implement token refresh logic


    - Auto-refresh on token expiry
    - Redirect to login on refresh failure
    - _Requirements: 2.5_
  - [x] 2.5 Write property test for token refresh (Property 3)






    - **Property 3: Token Refresh on Expiry**
    - **Validates: Requirements 2.5**
  - [x] 2.6 Create Login page


    - Email and password form
    - Error handling and validation
    - _Requirements: 2.1, 2.2_
  - [x] 2.7 Create Register page


    - Account type selection (homeowner/contractor)
    - Form fields based on account type
    - Handle auto-approve for homeowner
    - Show pending message for contractor
    - _Requirements: 2.3, 2.4_

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Portal Layout





  - [x] 4.1 Create Header component


    - Logo, navigation links
    - User menu dropdown
    - Notification bell with badge
    - Chat icon with badge
    - _Requirements: 3.1, 3.3, 3.4_
  - [x] 4.2 Create Sidebar component


    - Role-specific menu items
    - Active state highlighting
    - Collapsible on mobile
    - _Requirements: 3.2, 3.5_


  - [x] 4.3 Write property test for role-based menu items (Property 2)








    - **Property 2: Role-based Menu Items**
    - **Validates: Requirements 3.2**
  - [x] 4.4 Create Layout wrapper component


    - Combine Header and Sidebar
    - Main content area
    - Responsive breakpoints
    - _Requirements: 3.1, 3.2, 15.1, 15.2_
  - [x] 4.5 Create mobile navigation


    - Hamburger menu toggle
    - Slide-out sidebar
    - _Requirements: 3.5, 15.2_

- [x] 5. Implement API Client





  - [x] 5.1 Create api.ts with base configuration


    - Axios instance with base URL
    - Auth interceptor for JWT
    - Error handling interceptor
    - _Requirements: 1.4_
  - [x] 5.2 Add auth API methods

    - login, register, logout, refreshToken
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 5.3 Add project API methods


    - getProjects, getProject, createProject, updateProject, submitProject
    - _Requirements: 5.1, 6.1, 7.1-7.6_
  - [x] 5.4 Add bid API methods


    - getBids, getBid, createBid, updateBid, withdrawBid, selectBid
    - _Requirements: 10.1-10.5, 11.1-11.5_
  - [x] 5.5 Add marketplace API methods


    - getMarketplaceProjects, getContractors, getContractorProfile
    - _Requirements: 9.1, 13.1, 14.1_
  - [x] 5.6 Add notification and chat API methods


    - getNotifications, markAsRead, getConversations, sendMessage
    - _Requirements: 16.1-16.5, 17.1-17.5_

- [x] 6. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Homeowner Pages






  - [x] 7.1 Create Homeowner Dashboard

    - Welcome message with name
    - Project summary cards
    - Recent activity feed
    - Quick action button
    - Pending actions section
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 7.2 Create Projects List page

    - Status tabs (draft, active, completed)
    - Filter by status and date
    - Project cards with key info
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 7.3 Write property test for project ownership filter (Property 4)







    - **Property 4: Project Ownership Filter**

    - **Validates: Requirements 5.1**


  - [x] 7.4 Write property test for project status filter (Property 5)













    - **Property 5: Project Status Filter**
    - **Validates: Requirements 5.2**

  - [x] 7.5 Create Project Detail page

    - Project info and images
    - Bid list with anonymized contractor info
    - Select bid functionality
    - Contact info after match
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 7.6 Create Project Creation wizard


    - Step 1: Basic info
    - Step 2: Location
    - Step 3: Details
    - Step 4: Images
    - Step 5: Review and submit
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 8. Implement Contractor Pages













  - [x] 8.1 Create Contractor Dashboard

    - Verification status banner
    - Bid summary cards
    - Monthly statistics chart
    - Recommended projects
    - Recent reviews
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 8.2 Create Contractor Marketplace page




    - Project list with OPEN status
    - Filters (region, category, budget)
    - Project cards without owner info
    - Verification prompt for unverified
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 8.3 Write property test for marketplace OPEN filter (Property 6)



    - **Property 6: Marketplace OPEN Status Filter**
    - **Validates: Requirements 9.1, 13.1**

  - [x] 8.4 Write property test for project privacy (Property 7)



    - **Property 7: Project Privacy - No Owner Info**
    - **Validates: Requirements 9.3, 13.2**

  - [x] 8.5 Write property test for verification gate (Property 8)


    - **Property 8: Verification Gate for Bidding**
    - **Validates: Requirements 9.4**
  - [x] 8.6 Create My Bids page


    - Status tabs (pending, won, lost)
    - Bid cards with project info
    - Edit/withdraw for pending bids
    - Contact info for selected bids
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 8.7 Create Bid Creation page


    - Project summary at top
    - Price and timeline inputs
    - Proposal textarea (min 100 chars)
    - File attachments (max 5)
    - Win fee calculation preview
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 8.8 Create Profile Management page




    - Current profile display
    - Edit form for description, experience, specialties
    - Portfolio image upload (max 10)
    - Certificate upload (max 5)
    - Verification submission
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 9. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Public Pages





  - [x] 10.1 Create Public Marketplace page


    - Project list with OPEN status
    - Limited project info (no address, no owner)
    - Login redirect on bid click
    - Region and category filters
    - Statistics display
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  - [x] 10.2 Write property test for public filter support (Property 9)



    - **Property 9: Public Filter Support**
    - **Validates: Requirements 13.4**
  - [x] 10.3 Create Contractor Directory page


    - Verified contractors only
    - Profile, rating, reviews display
    - Region and specialty filters
    - Sort by rating and projects
    - Login redirect on contact
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  - [x] 10.4 Write property test for verified contractors only (Property 10)



    - **Property 10: Contractor Directory Verified Only**
    - **Validates: Requirements 14.1**

- [x] 11. Implement Shared Components





  - [x] 11.1 Create ProjectCard component


    - Display project summary
    - Status badge
    - Bid count and deadline
    - _Requirements: 5.1, 9.1, 13.1_
  - [x] 11.2 Create BidCard component


    - Display bid summary
    - Anonymized contractor info
    - Status badge
    - _Requirements: 6.2, 10.1_
  - [x] 11.3 Create NotificationBell component


    - Badge with unread count
    - Dropdown with recent notifications
    - Click to navigate
    - View all link
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  - [x] 11.4 Create ChatWidget component


    - Badge with unread count
    - Conversation list sidebar
    - Chat interface
    - Typing indicator
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 12. Implement Error Handling and Loading States





  - [x] 12.1 Create SkeletonLoader components


    - Card skeleton
    - List skeleton
    - Form skeleton
    - _Requirements: 18.1_
  - [x] 12.2 Create ErrorMessage component


    - User-friendly error display
    - Retry button
    - _Requirements: 18.2_
  - [x] 12.3 Create OfflineIndicator component


    - Network status detection
    - Offline banner
    - _Requirements: 18.3_
  - [x] 12.4 Create Toast notification system


    - Success, error, info variants
    - Auto-dismiss
    - _Requirements: 18.4_
  - [x] 12.5 Create form validation helpers


    - Inline error messages
    - Field-level validation
    - _Requirements: 18.5_

- [x] 13. Implement Responsive Design










  - [x] 13.1 Add responsive breakpoints


    - Mobile: < 640px
    - Tablet: 640px - 1024px
    - Desktop: > 1024px
    - _Requirements: 15.1, 15.5_
  - [x] 13.2 Optimize forms for touch


    - Larger touch targets
    - Mobile-friendly inputs
    - _Requirements: 15.3_
  - [x] 13.3 Implement lazy loading for images




    - Intersection observer
    - Placeholder images
    - _Requirements: 15.4_

- [x] 14. Implement User Onboarding







  - [x] 14.1 Create onboarding state management


    - Track completion status in localStorage and user profile
    - _Requirements: 19.4_
  - [x] 14.2 Create HomeownerOnboarding component


    - Tour highlighting: Create Project, View Bids, Select Contractor
    - Use react-joyride or similar library
    - _Requirements: 19.1, 19.3_
  - [x] 14.3 Create ContractorOnboarding component




    - Verification checklist with progress indicator
    - _Requirements: 19.2_
  - [x] 14.4 Write property test for onboarding completion persistence (Property 11)



    - **Property 11: Onboarding Completion Persistence**
    - **Validates: Requirements 19.4**
  - [x] 14.5 Add "Restart Tour" option in help menu


    - _Requirements: 19.5_

- [x] 15. Implement Bid Comparison





  - [x] 15.1 Create BidComparison component


    - Side-by-side layout for up to 3 bids
    - _Requirements: 20.1, 20.2_
  - [x] 15.2 Implement comparison selection UI


    - Checkbox on each bid card
    - "Compare Selected" button
    - _Requirements: 20.1_
  - [x] 15.3 Write property test for bid comparison limit (Property 12)



    - **Property 12: Bid Comparison Limit**
    - **Validates: Requirements 20.1**
  - [x] 15.4 Add difference highlighting


    - Green for lowest price, blue for fastest timeline
    - _Requirements: 20.3_
  - [x] 15.5 Add "Select This Bid" action from comparison view


    - _Requirements: 20.4_

- [x] 16. Implement Saved Projects









  - [x] 16.1 Create SavedProject model and API


    - POST /contractor/saved-projects/:projectId
    - DELETE /contractor/saved-projects/:projectId
    - GET /contractor/saved-projects
    - _Requirements: 21.1, 21.2, 21.3_
  - [x] 16.2 Add bookmark button to project cards


    - Toggle saved state
    - _Requirements: 21.1_
  - [x] 16.3 Create Saved Projects page


    - List with deadline countdown
    - Mark expired projects
    - _Requirements: 21.3, 21.5_
  - [x] 16.4 Write property test for saved project expiration (Property 14)



    - **Property 14: Saved Project Expiration**
    - **Validates: Requirements 21.5**
  - [x] 16.5 Implement deadline reminder notification


    - Send 24h before deadline
    - _Requirements: 21.4_

- [x] 17. Implement Draft Auto-save









  - [x] 17.1 Create draft storage service


    - Save to localStorage with timestamp
    - _Requirements: 22.1, 22.2_
  - [x] 17.2 Add auto-save to CreateProjectPage


    - Save every 30 seconds
    - _Requirements: 22.1_
  - [x] 17.3 Add auto-save to CreateBidPage


    - Save every 30 seconds
    - _Requirements: 22.2_

  - [x] 17.4 Write property test for draft restoration (Property 13)


    - **Property 13: Draft Auto-save Restoration**
    - **Validates: Requirements 22.3**
  - [x] 17.5 Add draft recovery prompt


    - Show modal when returning to form with existing draft
    - Options: Continue, Start Fresh
    - _Requirements: 22.3, 22.4_
  - [x] 17.6 Clean up draft on successful submission


    - _Requirements: 22.5_

- [x] 18. Implement Activity History





  - [x] 18.1 Create activity history API endpoint


    - GET /user/activity with type and date filters
    - _Requirements: 23.1, 23.3_
  - [x] 18.2 Create ActivityHistory component


    - Timeline view with icons per activity type
    - _Requirements: 23.2_
  - [x] 18.3 Add Activity tab to profile page


    - _Requirements: 23.1_
  - [x] 18.4 Add links to detail pages


    - _Requirements: 23.4_

- [x] 19. Implement Help Center





  - [x] 19.1 Create FAQ data structure


    - Categories: Homeowner, Contractor, Payment, General
    - _Requirements: 24.2_
  - [x] 19.2 Create HelpCenter component


    - Slide-out panel from right
    - _Requirements: 24.1_
  - [x] 19.3 Implement FAQ search


    - Search across questions and answers
    - _Requirements: 24.3_
  - [x] 19.4 Add contact support form


    - Show when no results found
    - _Requirements: 24.4_

- [x] 20. Implement Dark Mode





  - [x] 20.1 Create theme context and provider


    - Track theme preference (light/dark/auto)
    - _Requirements: 25.1, 25.3_
  - [x] 20.2 Create dark theme CSS variables


    - Define color palette for dark mode
    - _Requirements: 25.1_
  - [x] 20.3 Add theme toggle to header


    - Icon button with dropdown (Light/Dark/Auto)
    - _Requirements: 25.1_
  - [x] 20.4 Write property test for dark mode persistence (Property 15)



    - **Property 15: Dark Mode Persistence**
    - **Validates: Requirements 25.2**

  - [x] 20.5 Add smooth transition animation

    - _Requirements: 25.4_

- [x] 21. Implement Accessibility






  - [x] 21.1 Add keyboard navigation support

    - Focus management, tab order
    - _Requirements: 26.1_
  - [x] 21.2 Audit and fix color contrast


    - Meet WCAG 2.1 AA standards
    - _Requirements: 26.2_
  - [x] 21.3 Add ARIA labels and roles


    - Buttons, forms, navigation
    - _Requirements: 26.3_
  - [x] 21.4 Add alt text to all images


    - _Requirements: 26.4_
  - [x] 21.5 Associate form labels with inputs


    - _Requirements: 26.5_

- [x] 22. Implement Print Support





  - [x] 22.1 Create print stylesheet


    - Hide navigation, sidebar
    - Format for A4 paper
    - _Requirements: 27.3, 27.4_
  - [x] 22.2 Add print button to ProjectDetailPage


    - _Requirements: 27.1_
  - [x] 22.3 Add print button to BidDetailPage


    - _Requirements: 27.2_
  - [x] 22.4 Create print-friendly layouts


    - Proper margins and page breaks
    - _Requirements: 27.3_

- [x] 23. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
