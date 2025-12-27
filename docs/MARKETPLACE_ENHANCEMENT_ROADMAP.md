# 🚀 MARKETPLACE ENHANCEMENT ROADMAP

## 📋 Tổng quan

Roadmap nâng cấp Portal Marketplace từ MVP lên sàn giao dịch chuyên nghiệp.
Mỗi phase là một spec độc lập, có thể implement riêng biệt.

---

## 📊 CURRENT STATE (Đã có)

### ✅ Core Features
- [x] Auth (Login/Register) cho Homeowner & Contractor
- [x] Project CRUD (Homeowner)
- [x] Bid CRUD (Contractor)
- [x] Marketplace listing với filters cơ bản
- [x] Contractor verification flow
- [x] Review system cơ bản
- [x] Saved projects
- [x] Activity history
- [x] Responsive design

### ⚠️ Gaps
- Không có real-time updates
- Search cơ bản (không có autocomplete)
- Không có recommendation
- Không có badges/gamification
- Không có chat system
- Không có notifications push

---

## 🎯 PHASE 1: MARKETPLACE UX QUICK WINS
**Effort: 3-5 ngày | Impact: Cao | Priority: P0**

### Spec Name: `marketplace-ux-enhancement`

### Features:
1. **Project Card Enhancement**
   - Progress bar cho bid count (5/20)
   - "Hot" badge (>10 bids)
   - "Ending Soon" badge (<3 ngày)
   - Animated countdown timer
   - Quick actions (Save, Share)

2. **Search Enhancement**
   - Autocomplete suggestions
   - Recent searches
   - Popular searches
   - Search by project code

3. **Filter UX**
   - Sticky filter bar on scroll
   - Active filter chips
   - Quick filter presets (Hot, New, Ending Soon)
   - Clear all button

4. **View Options**
   - Grid view (default)
   - List view (compact)
   - Toggle button

### API Changes:
- `GET /api/projects/suggestions?q=` - Autocomplete
- `GET /api/projects/popular-searches` - Popular searches
- Add `isHot`, `isEndingSoon` computed fields

### Files to Create/Modify:
```
portal/src/
├── components/
│   ├── ProjectCard/
│   │   ├── index.tsx (enhanced)
│   │   ├── BidProgressBar.tsx
│   │   ├── CountdownTimer.tsx
│   │   └── ProjectBadges.tsx
│   ├── SearchAutocomplete.tsx
│   ├── FilterChips.tsx
│   └── ViewToggle.tsx
├── pages/contractor/
│   └── MarketplacePage.tsx (update)
└── hooks/
    └── useSearchSuggestions.ts
```

---

## 🎯 PHASE 2: CONTRACTOR TRUST & DISCOVERY
**Effort: 5-7 ngày | Impact: Cao | Priority: P0**

### Spec Name: `contractor-trust-system`

### Features:
1. **Contractor Badges**
   - 🏆 Top Rated (rating >= 4.5, >= 10 reviews)
   - ⚡ Fast Responder (avg response < 24h)
   - ✅ Verified Pro (verified + >= 5 completed)
   - 🔥 Active (>= 5 bids in 30 days)
   - 🎖️ Expert (>= 20 completed projects)

2. **Contractor Profile Enhancement**
   - Badge showcase
   - Statistics dashboard
   - Response time indicator
   - Completion rate
   - Portfolio gallery với lightbox

3. **Contractor Leaderboard**
   - Top 10 by rating
   - Top 10 by completed projects
   - Rising stars (new but active)
   - Filter by category/region

4. **Contractor Comparison**
   - Compare up to 3 contractors
   - Side-by-side stats
   - Rating breakdown

### Database Changes:
```prisma
model ContractorBadge {
  id           String   @id @default(cuid())
  contractorId String
  badgeType    String   // TOP_RATED, FAST_RESPONDER, etc.
  awardedAt    DateTime @default(now())
  expiresAt    DateTime?
  
  contractor   User     @relation(fields: [contractorId], references: [id])
  
  @@unique([contractorId, badgeType])
}

// Add to ContractorRanking
model ContractorRanking {
  // existing fields...
  avgResponseTime  Float?   // hours
  completionRate   Float?   // percentage
  lastActiveAt     DateTime?
}
```

### API Endpoints:
- `GET /api/contractors/leaderboard`
- `GET /api/contractors/:id/badges`
- `GET /api/contractors/compare?ids=a,b,c`
- `POST /api/admin/badges/recalculate`

### Files:
```
portal/src/
├── components/
│   ├── ContractorBadges.tsx
│   ├── ContractorStats.tsx
│   ├── ContractorComparison.tsx
│   └── Leaderboard.tsx
├── pages/public/
│   ├── ContractorDirectoryPage.tsx (update)
│   └── ContractorProfilePage.tsx (new)
api/src/
├── services/badge.service.ts (update)
└── routes/contractor.routes.ts (update)
```

---

## 🎯 PHASE 3: REAL-TIME NOTIFICATIONS
**Effort: 5-7 ngày | Impact: Cao | Priority: P1**

### Spec Name: `realtime-notifications`

### Features:
1. **WebSocket Integration**
   - Real-time bid updates
   - New project alerts
   - Chat messages
   - Status changes

2. **Notification Center**
   - Bell icon với badge count
   - Dropdown notification list
   - Mark as read
   - Mark all as read
   - Notification preferences

3. **Push Notifications**
   - Browser push (Web Push API)
   - Email notifications (existing)
   - SMS notifications (existing)

4. **Real-time Updates**
   - Live bid counter on cards
   - Toast notifications
   - Sound alerts (optional)

### Tech Stack:
- Socket.io hoặc Hono WebSocket
- Web Push API
- Service Worker

### Database:
```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  keys      String   // JSON: {p256dh, auth}
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}
```

### API:
- `WS /ws` - WebSocket connection
- `POST /api/push/subscribe`
- `DELETE /api/push/unsubscribe`
- `GET /api/notifications/unread-count`

### Files:
```
portal/src/
├── components/
│   ├── NotificationCenter/
│   │   ├── index.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationList.tsx
│   │   └── NotificationItem.tsx
│   └── Toast.tsx
├── hooks/
│   ├── useWebSocket.ts
│   ├── useNotifications.ts
│   └── usePushNotifications.ts
├── contexts/
│   └── WebSocketContext.tsx
api/src/
├── websocket/
│   ├── index.ts
│   └── handlers.ts
└── services/
    └── push.service.ts
```

---

## 🎯 PHASE 4: SMART MATCHING & RECOMMENDATIONS
**Effort: 7-10 ngày | Impact: Cao | Priority: P1**

### Spec Name: `smart-matching-system`

### Features:
1. **Match Score Algorithm**
   - Location match (same region = +30%)
   - Category match (specialty = +25%)
   - Budget fit (within range = +20%)
   - Rating bonus (+15%)
   - Response time bonus (+10%)

2. **Recommendation Engine**
   - "Dự án phù hợp với bạn" section
   - Based on: specialty, location, bid history
   - Personalized sorting option

3. **Project Alerts**
   - Save search criteria
   - Email/Push when new match
   - Daily digest option

4. **Smart Filters**
   - "Best match" sort option
   - Match score display on cards
   - Filter by match score threshold

### Database:
```prisma
model SavedSearch {
  id          String   @id @default(cuid())
  userId      String
  name        String?
  criteria    String   // JSON: {regionId, categoryId, budgetMin, budgetMax}
  alertType   String   // INSTANT, DAILY, WEEKLY, NONE
  lastAlertAt DateTime?
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
}

model ProjectMatch {
  id           String   @id @default(cuid())
  projectId    String
  contractorId String
  matchScore   Float    // 0-100
  factors      String   // JSON: breakdown
  calculatedAt DateTime @default(now())
  
  @@unique([projectId, contractorId])
}
```

### API:
- `GET /api/projects/recommended`
- `GET /api/projects/:id/match-score`
- `POST /api/saved-searches`
- `GET /api/saved-searches`
- `DELETE /api/saved-searches/:id`

### Files:
```
portal/src/
├── components/
│   ├── MatchScore.tsx
│   ├── RecommendedProjects.tsx
│   └── SaveSearchModal.tsx
├── pages/contractor/
│   ├── MarketplacePage.tsx (update)
│   └── SavedSearchesPage.tsx (new)
api/src/
├── services/
│   ├── matching.service.ts
│   └── recommendation.service.ts
└── routes/
    └── recommendation.routes.ts
```

---

## 🎯 PHASE 5: ENHANCED REVIEWS & SOCIAL PROOF
**Effort: 5-7 ngày | Impact: Trung bình | Priority: P2**

### Spec Name: `enhanced-reviews`

### Features:
1. **Multi-criteria Reviews**
   - Quality rating (1-5)
   - Timeliness rating (1-5)
   - Communication rating (1-5)
   - Value rating (1-5)
   - Overall rating (calculated)

2. **Review Media**
   - Before/After photos
   - Photo gallery
   - Video testimonials (optional)

3. **Review Interactions**
   - Helpful votes
   - Report review
   - Contractor response
   - Review verification badge

4. **Review Analytics**
   - Rating breakdown chart
   - Trend over time
   - Comparison with average

### Database Updates:
```prisma
model Review {
  // existing fields...
  qualityRating       Int?
  timelinessRating    Int?
  communicationRating Int?
  valueRating         Int?
  
  beforeImages        String?  // JSON array
  afterImages         String?  // JSON array
  videoUrl            String?
  
  isVerified          Boolean  @default(false)
  verifiedAt          DateTime?
}
```

### Files:
```
portal/src/
├── components/
│   ├── ReviewForm/
│   │   ├── index.tsx
│   │   ├── RatingCriteria.tsx
│   │   └── MediaUpload.tsx
│   ├── ReviewCard.tsx (update)
│   ├── ReviewGallery.tsx
│   └── RatingBreakdown.tsx
├── pages/
│   └── contractor/ReviewsPage.tsx (update)
```

---

## 🎯 PHASE 6: LIVE CHAT SYSTEM
**Effort: 7-10 ngày | Impact: Cao | Priority: P2**

### Spec Name: `live-chat-system`

### Features:
1. **Chat Interface**
   - Real-time messaging
   - Message status (sent, delivered, read)
   - Typing indicator
   - File/Image sharing
   - Message reactions

2. **Chat Management**
   - Conversation list
   - Unread count
   - Search messages
   - Archive conversations

3. **Chat Rules**
   - Only after match
   - Admin can view all
   - Auto-close after project complete

4. **Chat Notifications**
   - Real-time via WebSocket
   - Push notifications
   - Email digest

### Tech:
- WebSocket (from Phase 3)
- Message queue for reliability

### Files:
```
portal/src/
├── components/
│   ├── Chat/
│   │   ├── index.tsx
│   │   ├── ChatList.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── TypingIndicator.tsx
├── pages/
│   └── ChatPage.tsx
├── hooks/
│   └── useChat.ts
api/src/
├── services/
│   └── chat.service.ts (update)
└── websocket/
    └── chat.handler.ts
```

---

## 🎯 PHASE 7: ADVANCED PROJECT MANAGEMENT
**Effort: 10-14 ngày | Impact: Trung bình | Priority: P3**

### Spec Name: `project-management-advanced`

### Features:
1. **Timeline/Gantt View**
   - Visual timeline
   - Milestone markers
   - Progress tracking

2. **Progress Updates**
   - Photo updates
   - Daily/Weekly reports
   - Completion percentage

3. **Document Management**
   - Contract uploads
   - Invoice management
   - Receipt tracking

4. **Payment Tracking**
   - Payment schedule
   - Payment history
   - Invoice generation

### Files:
```
portal/src/
├── components/
│   ├── ProjectTimeline.tsx
│   ├── ProgressUpdate.tsx
│   ├── DocumentManager.tsx
│   └── PaymentTracker.tsx
├── pages/homeowner/
│   └── ProjectDetailPage.tsx (update)
```

---

## 🎯 PHASE 8: PWA & MOBILE OPTIMIZATION
**Effort: 5-7 ngày | Impact: Trung bình | Priority: P3**

### Spec Name: `pwa-mobile-optimization`

### Features:
1. **PWA Support**
   - Service Worker
   - Offline mode
   - Install prompt
   - App manifest

2. **Mobile Features**
   - Camera integration
   - GPS location
   - Share API
   - Touch gestures

3. **Performance**
   - Image optimization
   - Lazy loading
   - Code splitting
   - Caching strategies

### Files:
```
portal/
├── public/
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── hooks/
│   │   ├── useCamera.ts
│   │   ├── useGeolocation.ts
│   │   └── useInstallPrompt.ts
│   └── utils/
│       └── serviceWorker.ts
```

---

## 📅 IMPLEMENTATION TIMELINE

```
Week 1-2:   Phase 1 (UX Quick Wins)
Week 2-3:   Phase 2 (Contractor Trust)
Week 3-4:   Phase 3 (Real-time Notifications)
Week 5-6:   Phase 4 (Smart Matching)
Week 7-8:   Phase 5 (Enhanced Reviews)
Week 9-10:  Phase 6 (Live Chat)
Week 11-12: Phase 7 (Project Management)
Week 13-14: Phase 8 (PWA)
```

---

## 🎯 RECOMMENDED START

**Bắt đầu với Phase 1** vì:
- Impact cao, effort thấp
- Cải thiện UX ngay lập tức
- Không cần thay đổi database lớn
- Có thể ship trong 3-5 ngày

Khi muốn implement phase nào, tạo spec với command:
```
"Tạo spec cho [phase-name] theo roadmap MARKETPLACE_ENHANCEMENT_ROADMAP.md"
```

---

## 📝 NOTES

- Mỗi phase độc lập, có thể implement riêng
- Phase 3 (WebSocket) là dependency cho Phase 6 (Chat)
- Phase 2 (Badges) enhance Phase 4 (Matching)
- Có thể skip phases không cần thiết
- Prioritize based on user feedback

---

*Last updated: 2024-12-24*
