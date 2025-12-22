# 🏗️ ANH THỢ XÂY - Business Logic

## 📐 Công thức tính báo giá

### Flow tính toán
```
1. Khách chọn HẠNG MỤC (ví dụ: Sơn tường)
2. Khách nhập DIỆN TÍCH (m²)
3. Khách chọn VẬT DỤNG (nếu hạng mục cho phép)
4. Hệ thống tính:

TỔNG = (Kết quả công thức × Hệ số hạng mục) + Tổng giá vật dụng
```

### Ví dụ cụ thể
```
Hạng mục: Sơn tường (hệ số 1.2)
Diện tích: 50 m²
Đơn giá sơn: 80,000 VNĐ/m²
Vật dụng: Sơn Dulux (500,000 VNĐ)

Công thức cơ bản: 50 × 80,000 = 4,000,000
Áp hệ số: 4,000,000 × 1.2 = 4,800,000
Cộng vật dụng: 4,800,000 + 500,000 = 5,300,000 VNĐ
```

## 👥 Phân quyền

### Role Hierarchy (theo thứ tự quyền)
```
ADMIN > MANAGER > CONTRACTOR > HOMEOWNER > WORKER > USER
```

### ADMIN
- ✅ Toàn quyền
- ✅ Quản lý công thức & hạng mục
- ✅ Quản lý users
- ✅ Duyệt thay đổi từ Quản lý
- ✅ Cài đặt hệ thống
- ✅ Duyệt/từ chối nhà thầu (Contractor verification)
- ✅ Quản lý khu vực (Regions)
- ✅ Cấu hình đấu giá (Bidding settings)
- ✅ Quản lý phí dịch vụ (Service fees)

### MANAGER (Quản lý)
- ✅ Xem & quản lý khách hàng
- ✅ Quản lý blog
- ✅ Quản lý media
- ⚠️ Đề xuất sửa đơn giá (cần duyệt)
- ⚠️ Đề xuất sửa vật dụng (cần duyệt)
- ❌ KHÔNG thấy công thức & hạng mục
- ❌ KHÔNG quản lý users
- ❌ KHÔNG duyệt nhà thầu

### CONTRACTOR (Nhà thầu)
- ✅ Đăng ký tài khoản qua `/api/auth/signup` (accountType: "contractor")
- ✅ Tạo/cập nhật hồ sơ năng lực (ContractorProfile)
- ✅ Submit hồ sơ xác minh
- ✅ Xem thông tin cá nhân
- ⚠️ Cần xác minh (verificationStatus = VERIFIED) để tham gia đấu giá
- ❌ KHÔNG truy cập admin panel
- ❌ KHÔNG quản lý blog/media

**Verification Status:**
- `PENDING` - Chờ xét duyệt (mặc định khi đăng ký)
- `VERIFIED` - Đã xác minh (có thể tham gia đấu giá)
- `REJECTED` - Bị từ chối (kèm lý do, có thể submit lại)

### HOMEOWNER (Chủ nhà)
- ✅ Đăng ký tài khoản qua `/api/auth/signup` (accountType: "homeowner")
- ✅ Tự động được duyệt (auto-approve)
- ✅ Xem thông tin cá nhân
- ✅ Đăng dự án (Phase 2+)
- ✅ Xem và chọn nhà thầu (Phase 2+)
- ❌ KHÔNG truy cập admin panel

### WORKER (Thợ - Tương lai)
- ✅ Xem công việc được giao
- ✅ Cập nhật tiến độ
- ✅ Xem thông tin khách hàng liên quan
- ❌ KHÔNG quản lý blog/media
- ❌ KHÔNG xem báo cáo tài chính

### USER (Khách hàng - Tương lai)
- ✅ Xem thông tin cá nhân
- ✅ Xem lịch sử báo giá
- ✅ Theo dõi tiến độ công trình
- ❌ KHÔNG truy cập admin panel

## 📊 Data Models

### Hạng mục (ServiceCategory)
```ts
{
  id: string;
  name: string;           // "Sơn tường", "Ốp lát"
  coefficient: number;    // Hệ số: 1.0, 1.2, 1.5
  allowMaterials: boolean; // Cho phép chọn vật dụng?
  formulaId?: string;     // Công thức áp dụng
  order: number;          // Thứ tự hiển thị
  isActive: boolean;
}
```

### Đơn giá (UnitPrice)
```ts
{
  id: string;
  category: string;       // Thể loại: "Nhân công", "Vật liệu"
  name: string;           // "Công sơn", "Xi măng"
  price: number;          // Giá tiền
  tag: string;            // TAG dùng trong công thức: "CONG_SON"
  unit: string;           // Đơn vị: "m²", "kg", "công"
}
```

### Vật dụng (Material)
```ts
{
  id: string;
  name: string;           // "Sơn Dulux"
  category: string;       // "Sơn", "Gạch", "Thiết bị"
  imageUrl?: string;
  price: number;
  description?: string;
}
```

### Công thức (Formula)
```ts
{
  id: string;
  name: string;           // "Công thức sơn cơ bản"
  expression: string;     // "DIEN_TICH * CONG_SON"
  description?: string;
}
```

### Khách hàng (CustomerLead)
```ts
{
  id: string;
  name: string;
  phone: string;
  email?: string;         // Optional
  content: string;        // Nội dung nhu cầu
  status: string;         // "NEW", "CONTACTED", "CONVERTED", "CANCELLED"
  source: string;         // "QUOTE_FORM", "CONTACT_FORM"
  quoteData?: string;     // JSON: kết quả dự toán nếu có
  createdAt: DateTime;
}
```

### Hồ sơ Nhà thầu (ContractorProfile)
```ts
{
  id: string;
  userId: string;         // Relation 1-1 với User
  description?: string;   // Giới thiệu bản thân/công ty
  experience?: number;    // Số năm kinh nghiệm
  specialties?: string[]; // ["Sơn", "Ốp lát", "Điện"]
  serviceAreas?: string[]; // Region IDs
  portfolioImages?: string[]; // URLs ảnh portfolio (max 10)
  certificates?: Array<{name, imageUrl, issuedDate}>; // Chứng chỉ (max 5)
  idCardFront?: string;   // URL ảnh CMND/CCCD mặt trước
  idCardBack?: string;    // URL ảnh CMND/CCCD mặt sau
  businessLicenseImage?: string; // URL ảnh giấy phép kinh doanh
  submittedAt?: DateTime; // Thời điểm submit xác minh
}
```

### Khu vực (Region)
```ts
{
  id: string;
  name: string;           // "Quận 1", "Bình Thạnh"
  slug: string;           // URL-friendly: "quan-1", "binh-thanh"
  parentId?: string;      // Self-referencing cho hierarchy
  level: number;          // 1: Tỉnh/TP, 2: Quận/Huyện, 3: Phường/Xã
  isActive: boolean;
  order: number;          // Thứ tự hiển thị
}
```

### Cấu hình Đấu giá (BiddingSettings) - Singleton
```ts
{
  id: string;             // "default"
  maxBidsPerProject: number;    // Số bid tối đa/công trình (default: 20)
  defaultBidDuration: number;   // Số ngày mặc định (default: 7)
  minBidDuration: number;       // Tối thiểu (default: 3)
  maxBidDuration: number;       // Tối đa (default: 30)
  escrowPercentage: number;     // % đặt cọc (default: 10)
  escrowMinAmount: number;      // Tối thiểu (default: 1,000,000 VNĐ)
  escrowMaxAmount?: number;     // Tối đa (optional)
  verificationFee: number;      // Phí xác minh nhà thầu (default: 500,000 VNĐ)
  winFeePercentage: number;     // % phí thắng thầu (default: 5)
  autoApproveHomeowner: boolean; // Tự động duyệt chủ nhà (default: true)
  autoApproveProject: boolean;   // Tự động duyệt công trình (default: false)
}
```

### Phí dịch vụ (ServiceFee)
```ts
{
  id: string;
  name: string;           // "Phí xác minh", "Phí thắng thầu"
  code: string;           // Unique: "VERIFICATION_FEE", "WIN_FEE"
  type: string;           // "FIXED" | "PERCENTAGE"
  value: number;          // 500000 hoặc 5 (%)
  description?: string;
  isActive: boolean;
}
```

### Công trình (Project)
```ts
{
  id: string;
  code: string;           // AUTO: PRJ-2024-001
  ownerId: string;        // Relation với User (HOMEOWNER)
  title: string;
  description: string;
  categoryId: string;     // Relation với ServiceCategory
  regionId: string;       // Relation với Region
  address: string;        // Ẩn cho public, chỉ hiện khi match
  area?: number;          // Diện tích (m²)
  budgetMin?: number;     // Ngân sách tối thiểu
  budgetMax?: number;     // Ngân sách tối đa
  timeline?: string;      // Timeline mong muốn
  images?: string[];      // URLs ảnh (max 10)
  requirements?: string;  // Yêu cầu đặc biệt
  status: string;         // DRAFT, PENDING_APPROVAL, REJECTED, OPEN, BIDDING_CLOSED, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED
  bidDeadline?: DateTime; // Hạn nhận bid
  maxBids: number;        // Số bid tối đa (default: 20)
  reviewedBy?: string;    // Admin đã duyệt
  reviewedAt?: DateTime;
  reviewNote?: string;    // Ghi chú duyệt/từ chối
  publishedAt?: DateTime; // Thời điểm publish (OPEN)
  selectedBidId?: string; // Bid được chọn (Phase 3)
  matchedAt?: DateTime;   // Thời điểm match (Phase 3)
}
```

### Bid (Đề xuất thầu)
```ts
{
  id: string;
  code: string;           // AUTO: BID-2024-001
  projectId: string;      // Relation với Project
  contractorId: string;   // Relation với User (CONTRACTOR)
  price: number;          // Giá đề xuất
  timeline: string;       // Timeline đề xuất
  proposal: string;       // Mô tả đề xuất chi tiết
  attachments?: Array<{   // Tài liệu đính kèm (max 5)
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  status: string;         // PENDING, APPROVED, REJECTED, SELECTED, NOT_SELECTED, WITHDRAWN
  reviewedBy?: string;    // Admin đã duyệt
  reviewedAt?: DateTime;
  reviewNote?: string;    // Ghi chú duyệt/từ chối
}
```

**Lưu ý Bid:**
- Mỗi contractor chỉ được 1 bid/project (unique constraint)
- Contractor phải có `verificationStatus = VERIFIED` để tạo bid
- Homeowner xem bid được ẩn thông tin contractor (hiện "Nhà thầu A, B, C...")

### Escrow (Tiền đặt cọc)
```ts
{
  id: string;
  code: string;           // AUTO: ESC-YYYY-NNN
  projectId: string;      // Relation với Project (unique)
  bidId: string;          // Relation với Bid
  homeownerId: string;    // Người đặt cọc (chủ nhà)
  amount: number;         // Số tiền đặt cọc (calculated)
  releasedAmount: number; // Số tiền đã giải phóng (default: 0)
  currency: string;       // "VND" (default)
  status: string;         // PENDING, HELD, PARTIAL_RELEASED, RELEASED, REFUNDED, DISPUTED, CANCELLED
  transactions?: string;  // JSON: [{type, amount, date, note, adminId}]
  disputeReason?: string;
  disputedBy?: string;
  disputeResolvedAt?: DateTime;
  disputeResolution?: string;
  confirmedBy?: string;
  confirmedAt?: DateTime;
  releasedBy?: string;
  releasedAt?: DateTime;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Công thức tính Escrow:**
```
amount = max(bidPrice * escrowPercentage / 100, escrowMinAmount)
if (escrowMaxAmount) amount = min(amount, escrowMaxAmount)
```

### FeeTransaction (Phí giao dịch)
```ts
{
  id: string;
  code: string;           // AUTO: FEE-YYYY-NNN
  userId: string;         // Contractor phải trả
  projectId: string;      // Relation với Project
  bidId: string;          // Relation với Bid
  type: string;           // "WIN_FEE" | "VERIFICATION_FEE"
  amount: number;         // Số tiền phí
  currency: string;       // "VND" (default)
  status: string;         // PENDING, PAID, CANCELLED
  paidAt?: DateTime;
  paidBy?: string;        // Admin đánh dấu đã thanh toán
  cancelledAt?: DateTime;
  cancelledBy?: string;
  cancelReason?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Công thức tính Win Fee:**
```
winFee = bidPrice * winFeePercentage / 100
```

### ProjectMilestone (Mốc tiến độ)
```ts
{
  id: string;
  escrowId: string;       // Relation với Escrow
  projectId: string;      // Relation với Project
  name: string;           // "50% Completion", "100% Completion"
  percentage: number;     // 50, 100
  releasePercentage: number; // % escrow được giải phóng tại milestone này
  status: string;         // PENDING, REQUESTED, CONFIRMED, DISPUTED
  requestedAt?: DateTime; // Contractor yêu cầu xác nhận
  requestedBy?: string;
  confirmedAt?: DateTime; // Homeowner xác nhận
  confirmedBy?: string;
  disputedAt?: DateTime;
  disputeReason?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Notification (Thông báo)
```ts
{
  id: string;
  userId: string;         // Người nhận thông báo
  type: string;           // BID_SELECTED, BID_NOT_SELECTED, ESCROW_HELD, ESCROW_RELEASED, etc.
  title: string;
  content: string;
  data?: string;          // JSON: { projectId, bidId, etc. }
  isRead: boolean;        // default: false
  readAt?: DateTime;
  createdAt: DateTime;
}
```

**Notification Types:**
- `BID_SELECTED` - Contractor được chọn
- `BID_NOT_SELECTED` - Contractor không được chọn
- `ESCROW_HELD` - Escrow đã được xác nhận
- `ESCROW_RELEASED` - Escrow đã được giải phóng
- `ESCROW_PARTIAL_RELEASED` - Escrow giải phóng một phần
- `ESCROW_REFUNDED` - Escrow đã hoàn tiền
- `ESCROW_DISPUTED` - Escrow bị tranh chấp
- `MILESTONE_REQUESTED` - Contractor yêu cầu xác nhận milestone
- `MILESTONE_CONFIRMED` - Homeowner xác nhận milestone
- `MILESTONE_DISPUTED` - Milestone bị tranh chấp
- `DISPUTE_RESOLVED` - Tranh chấp đã được giải quyết
- `NEW_MESSAGE` - Tin nhắn mới trong chat
- `BID_DEADLINE_REMINDER` - Nhắc nhở hạn nhận bid
- `NO_BIDS_REMINDER` - Nhắc nhở công trình chưa có bid
- `ESCROW_PENDING` - Nhắc nhở escrow chờ xác nhận
- `REVIEW_REMINDER` - Nhắc nhở đánh giá sau hoàn thành

### Conversation (Cuộc hội thoại - Phase 4)
```ts
{
  id: string;
  projectId?: string;     // Liên kết với Project (optional)
  isClosed: boolean;      // Đã đóng cuộc hội thoại
  closedAt?: DateTime;
  closedBy?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### ConversationParticipant (Người tham gia - Phase 4)
```ts
{
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt?: DateTime;  // Thời điểm đọc tin nhắn cuối
  isActive: boolean;      // Còn tham gia
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Message (Tin nhắn - Phase 4)
```ts
{
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;           // TEXT, IMAGE, FILE, SYSTEM
  attachments?: string;   // JSON: [{name, url, type, size}]
  isRead: boolean;
  readAt?: DateTime;
  readBy?: string;        // JSON: [{userId, readAt}]
  isDeleted: boolean;
  deletedAt?: DateTime;
  createdAt: DateTime;
}
```

### NotificationPreference (Cài đặt thông báo - Phase 4)
```ts
{
  id: string;
  userId: string;         // Unique per user
  
  // Email notifications
  emailEnabled: boolean;
  emailBidReceived: boolean;
  emailBidApproved: boolean;
  emailProjectMatched: boolean;
  emailNewMessage: boolean;
  emailEscrowReleased: boolean;
  
  // SMS notifications
  smsEnabled: boolean;
  smsBidReceived: boolean;
  smsBidApproved: boolean;
  smsProjectMatched: boolean;
  smsNewMessage: boolean;
  smsEscrowReleased: boolean;
}
```

### NotificationTemplate (Mẫu thông báo - Phase 4)
```ts
{
  id: string;
  type: string;           // Unique: BID_RECEIVED, PROJECT_MATCHED, etc.
  emailSubject: string;
  emailBody: string;      // HTML với biến {{projectCode}}
  smsBody: string;        // Plain text, max 160 chars
  inAppTitle: string;
  inAppBody: string;
  variables: string;      // JSON: ["projectCode", "contractorName"]
  version: number;
}
```

### ScheduledNotification (Thông báo lên lịch - Phase 4)
```ts
{
  id: string;
  type: string;           // BID_DEADLINE_REMINDER, NO_BIDS_REMINDER, ESCROW_PENDING
  userId: string;
  projectId?: string;
  escrowId?: string;
  scheduledFor: DateTime;
  status: string;         // PENDING, SENT, CANCELLED
  sentAt?: DateTime;
  cancelledAt?: DateTime;
}
```

### Review (Đánh giá - Phase 5)
```ts
{
  id: string;
  projectId: string;      // Relation với Project
  reviewerId: string;     // Homeowner viết đánh giá
  contractorId: string;   // Contractor được đánh giá
  
  // Rating (1-5)
  rating: number;
  comment?: string;
  images?: string;        // JSON: ["url1", "url2"] max 5
  
  // Multi-criteria ratings (1-5) - Optional
  qualityRating?: number;       // Chất lượng công việc
  timelinessRating?: number;    // Đúng tiến độ
  communicationRating?: number; // Giao tiếp
  valueRating?: number;         // Giá cả hợp lý
  
  // Response from contractor
  response?: string;
  respondedAt?: DateTime;
  
  // Visibility
  isPublic: boolean;      // default: true
  isDeleted: boolean;     // default: false
  deletedAt?: DateTime;
  deletedBy?: string;
  
  // Helpfulness
  helpfulCount: number;   // default: 0
  
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Lưu ý Review:**
- Mỗi homeowner chỉ được 1 review/project (unique constraint)
- Chỉ có thể review sau khi project COMPLETED
- Có thể cập nhật trong 7 ngày đầu
- Contractor có thể phản hồi 1 lần

### ReviewHelpfulness (Vote hữu ích - Phase 5)
```ts
{
  id: string;
  reviewId: string;
  userId: string;
  createdAt: DateTime;
}
```

### ReviewReport (Báo cáo đánh giá - Phase 5)
```ts
{
  id: string;
  reviewId: string;
  reporterId: string;
  reason: string;         // spam, offensive, fake, irrelevant
  description?: string;
  status: string;         // PENDING, RESOLVED, DISMISSED
  resolvedBy?: string;
  resolvedAt?: DateTime;
  resolution?: string;    // hide, delete, dismiss
  createdAt: DateTime;
}
```

### ContractorRanking (Xếp hạng nhà thầu - Phase 5)
```ts
{
  id: string;
  contractorId: string;   // Unique per contractor
  
  // Score components (0-100 each)
  ratingScore: number;        // 40% weight
  projectsScore: number;      // 30% weight
  responseScore: number;      // 15% weight
  verificationScore: number;  // 15% weight
  totalScore: number;
  
  // Rank
  rank: number;
  previousRank?: number;
  
  // Featured
  isFeatured: boolean;
  featuredAt?: DateTime;
  featuredBy?: string;    // Admin who manually featured
  
  // Stats cache
  totalProjects: number;
  completedProjects: number;
  totalReviews: number;
  averageRating: number;
  averageResponseTime: number;  // Hours
  
  calculatedAt: DateTime;
}
```

**Công thức tính Ranking Score:**
```
totalScore = (ratingScore * 0.4) + (projectsScore * 0.3) + (responseScore * 0.15) + (verificationScore * 0.15)

ratingScore = (averageRating / 5) * 100
projectsScore = min(completedProjects / 10, 1) * 100
responseScore = max(0, 100 - (averageResponseTime / 24) * 10)
verificationScore = isVerified ? 100 : 0
```

### ContractorBadge (Huy hiệu nhà thầu - Phase 5)
```ts
{
  id: string;
  contractorId: string;
  badgeType: string;      // ACTIVE_CONTRACTOR, HIGH_QUALITY, FAST_RESPONDER
  awardedAt: DateTime;
}
```

**Badge Types:**
- `ACTIVE_CONTRACTOR` - Hoạt động tích cực (≥5 bids trong 30 ngày)
- `HIGH_QUALITY` - Chất lượng cao (rating ≥4.5, ≥5 reviews)
- `FAST_RESPONDER` - Phản hồi nhanh (avg response time ≤24h)

### SavedProject (Công trình đã lưu - Phase 6)
```ts
{
  id: string;
  contractorId: string;   // Contractor lưu
  projectId: string;      // Project được lưu
  savedAt: DateTime;
}
```

**Lưu ý SavedProject:**
- Mỗi contractor chỉ lưu 1 lần/project (unique constraint)
- Cascade delete khi contractor hoặc project bị xóa

## 🔄 Status Flow

### CustomerLead Status
```
NEW → CONTACTED → CONVERTED
         ↓
      CANCELLED
```

### Pending Changes (cho Quản lý)
```
PENDING → APPROVED (by Admin)
    ↓
  REJECTED (by Admin)
```

### Contractor Verification Status
```
PENDING → VERIFIED (by Admin)
    ↓
  REJECTED (by Admin) → có thể submit lại → PENDING
```

**Lưu ý:**
- Contractor mới đăng ký: `verificationStatus = PENDING`
- Chỉ contractor có `verificationStatus = VERIFIED` mới được tham gia đấu giá
- Khi bị từ chối, contractor có thể cập nhật hồ sơ và submit lại

### Project Status Flow
```
DRAFT → PENDING_APPROVAL → OPEN → BIDDING_CLOSED → MATCHED → IN_PROGRESS → COMPLETED
  ↓           ↓              ↓          ↓
CANCELLED  REJECTED      CANCELLED  CANCELLED
              ↓
         (resubmit) → PENDING_APPROVAL
```

**Transitions:**
- `DRAFT` → `PENDING_APPROVAL`: Homeowner submit dự án
- `DRAFT` → `CANCELLED`: Homeowner hủy dự án
- `PENDING_APPROVAL` → `OPEN`: Admin duyệt (set publishedAt)
- `PENDING_APPROVAL` → `REJECTED`: Admin từ chối (kèm note)
- `REJECTED` → `PENDING_APPROVAL`: Homeowner sửa và submit lại
- `REJECTED` → `CANCELLED`: Homeowner hủy dự án
- `OPEN` → `BIDDING_CLOSED`: Hết hạn nhận bid hoặc đủ maxBids
- `OPEN` → `CANCELLED`: Homeowner hủy dự án
- `BIDDING_CLOSED` → `MATCHED`: Homeowner chọn nhà thầu (Phase 3)
- `BIDDING_CLOSED` → `OPEN`: Admin mở lại nhận bid
- `BIDDING_CLOSED` → `CANCELLED`: Homeowner hủy dự án
- `COMPLETED`, `CANCELLED`: Terminal states, không chuyển tiếp

### Bid Status Flow
```
PENDING → APPROVED → SELECTED
    ↓         ↓          
REJECTED  NOT_SELECTED
    ↓         ↓
WITHDRAWN WITHDRAWN
```

**Transitions:**
- `PENDING` → `APPROVED`: Admin duyệt bid
- `PENDING` → `REJECTED`: Admin từ chối bid (kèm note)
- `PENDING` → `WITHDRAWN`: Contractor rút bid
- `APPROVED` → `SELECTED`: Homeowner chọn bid này (Phase 3)
- `APPROVED` → `NOT_SELECTED`: Homeowner chọn bid khác (Phase 3)
- `APPROVED` → `WITHDRAWN`: Contractor rút bid

**Lưu ý Bid:**
- Chỉ bid `APPROVED` mới hiển thị cho homeowner
- Homeowner xem bid được ẩn thông tin contractor
- Contractor chỉ update/withdraw được khi status là `PENDING` hoặc `APPROVED`

### Escrow Status Flow
```
PENDING → HELD → PARTIAL_RELEASED → RELEASED
    ↓       ↓           ↓
CANCELLED  REFUNDED   REFUNDED
            ↓           ↓
         DISPUTED    DISPUTED
```

**Transitions:**
- `PENDING` → `HELD`: Admin xác nhận đã nhận tiền đặt cọc
- `PENDING` → `CANCELLED`: Match bị hủy trước khi đặt cọc
- `HELD` → `PARTIAL_RELEASED`: Admin giải phóng một phần (milestone 50%)
- `HELD` → `RELEASED`: Admin giải phóng toàn bộ (project completed)
- `HELD` → `REFUNDED`: Admin hoàn tiền (project cancelled)
- `HELD` → `DISPUTED`: Homeowner hoặc Contractor tạo tranh chấp
- `PARTIAL_RELEASED` → `RELEASED`: Admin giải phóng phần còn lại
- `PARTIAL_RELEASED` → `REFUNDED`: Admin hoàn tiền phần còn lại
- `PARTIAL_RELEASED` → `DISPUTED`: Tranh chấp phần còn lại
- `RELEASED`, `REFUNDED`, `CANCELLED`: Terminal states

**Lưu ý Escrow:**
- Mỗi project chỉ có 1 escrow (unique constraint)
- Escrow được tạo tự động khi homeowner chọn bid
- Mọi thay đổi status đều được ghi vào `transactions` array
- Chỉ Admin mới có quyền thay đổi status escrow

### FeeTransaction Status Flow
```
PENDING → PAID
    ↓
CANCELLED
```

**Transitions:**
- `PENDING` → `PAID`: Admin đánh dấu đã thanh toán
- `PENDING` → `CANCELLED`: Match bị hủy hoặc admin hủy phí

### ProjectMilestone Status Flow
```
PENDING → REQUESTED → CONFIRMED
              ↓
          DISPUTED
```

**Transitions:**
- `PENDING` → `REQUESTED`: Contractor yêu cầu xác nhận hoàn thành
- `REQUESTED` → `CONFIRMED`: Homeowner xác nhận milestone
- `REQUESTED` → `DISPUTED`: Homeowner tranh chấp milestone

### Conversation Status (Phase 4)
```
OPEN → CLOSED
```

**Transitions:**
- `OPEN` → `CLOSED`: Admin đóng cuộc hội thoại (set isClosed = true)

### ScheduledNotification Status Flow (Phase 4)
```
PENDING → SENT
    ↓
CANCELLED
```

**Transitions:**
- `PENDING` → `SENT`: Notification được gửi khi đến scheduledFor
- `PENDING` → `CANCELLED`: Admin hoặc hệ thống hủy notification

### ReviewReport Status Flow (Phase 5)
```
PENDING → RESOLVED
    ↓
DISMISSED
```

**Transitions:**
- `PENDING` → `RESOLVED`: Admin xử lý báo cáo (hide hoặc delete review)
- `PENDING` → `DISMISSED`: Admin bác bỏ báo cáo (review không vi phạm)

## 🔄 Match Flow (Phase 3)

### Match Process
```
1. Homeowner xem danh sách bids đã duyệt (APPROVED)
   - Thông tin contractor bị ẩn (hiện "Nhà thầu A, B, C...")
   
2. Homeowner chọn 1 bid
   - Validate: Project status = BIDDING_CLOSED
   - Validate: Bid status = APPROVED
   - Validate: User là owner của project
   
3. Hệ thống thực hiện (atomic transaction):
   - Bid được chọn → status = SELECTED
   - Các bid APPROVED khác → status = NOT_SELECTED
   - Project → status = MATCHED, set matchedAt, selectedBidId
   - Tạo Escrow (status = PENDING)
   - Tạo FeeTransaction (type = WIN_FEE, status = PENDING)
   - Gửi notifications cho tất cả contractors
   
4. Contact Reveal:
   - Homeowner xem được: contractor name, phone, email
   - Contractor xem được: homeowner name, phone, email, full address
   
5. Admin xác nhận escrow:
   - Escrow → status = HELD
   - Gửi notification cho cả 2 bên
   
6. Project tiến hành:
   - Homeowner click "Bắt đầu" → Project status = IN_PROGRESS
   - Contractor báo milestone 50% → Milestone status = REQUESTED
   - Homeowner xác nhận → Milestone status = CONFIRMED
   - Admin giải phóng 50% escrow → Escrow status = PARTIAL_RELEASED
   
7. Hoàn thành:
   - Contractor báo milestone 100% → Milestone status = REQUESTED
   - Homeowner xác nhận → Milestone status = CONFIRMED
   - Admin giải phóng escrow còn lại → Escrow status = RELEASED
   - Project → status = COMPLETED
```

### Dispute Resolution
```
1. Homeowner hoặc Contractor tạo tranh chấp
   - Escrow → status = DISPUTED
   - Ghi lại disputeReason, disputedBy
   
2. Admin xem xét tranh chấp
   - Xem thông tin project, bid, escrow
   - Xem lý do tranh chấp từ cả 2 bên
   
3. Admin giải quyết:
   - Option A: Hoàn tiền cho homeowner → Escrow status = REFUNDED
   - Option B: Giải phóng cho contractor → Escrow status = RELEASED
   - Ghi lại disputeResolution, disputeResolvedAt
   - Gửi notification cho cả 2 bên
```

### Cancel Match
```
1. Homeowner hoặc Admin hủy match
   - Validate: Project status = MATCHED (chưa IN_PROGRESS)
   
2. Hệ thống thực hiện:
   - Project → status = CANCELLED
   - Escrow → status = REFUNDED (nếu đã HELD) hoặc CANCELLED (nếu PENDING)
   - FeeTransaction → status = CANCELLED
   - Gửi notifications
```

## 📱 Landing Pages

1. **Trang chủ** (`/`)
   - Hero section
   - Giới thiệu dịch vụ
   - CTA đến trang báo giá

2. **Báo giá & Dự toán** (`/bao-gia`)
   - Form chọn hạng mục
   - Input diện tích
   - Chọn vật dụng
   - Kết quả dự toán
   - Form đăng ký tư vấn

3. **Blog** (`/blog`)
   - Danh sách bài viết
   - Filter theo category

4. **Blog Detail** (`/blog/:slug`)
   - Nội dung bài viết
   - Related posts

5. **Policy** (`/chinh-sach`)
   - Chính sách bảo hành
   - Điều khoản dịch vụ

6. **Unsubscribe** (`/unsubscribe`)
   - Quản lý cài đặt thông báo email
   - Hủy đăng ký nhanh

## 📱 Portal Pages (Phase 6)

### Auth Pages
- **Login** (`/login`) - Đăng nhập
- **Register** (`/register`) - Đăng ký (homeowner/contractor)

### Homeowner Pages
- **Dashboard** (`/homeowner/dashboard`) - Tổng quan
- **Projects** (`/homeowner/projects`) - Danh sách công trình
- **Create Project** (`/homeowner/projects/create`) - Tạo công trình mới
- **Project Detail** (`/homeowner/projects/:id`) - Chi tiết công trình
- **Profile** (`/homeowner/profile`) - Thông tin cá nhân

### Contractor Pages
- **Dashboard** (`/contractor/dashboard`) - Tổng quan
- **Marketplace** (`/contractor/marketplace`) - Tìm công trình
- **My Bids** (`/contractor/bids`) - Danh sách bids
- **Bid Detail** (`/contractor/bids/:id`) - Chi tiết bid
- **Create Bid** (`/contractor/bids/create`) - Tạo bid mới
- **Saved Projects** (`/contractor/saved`) - Công trình đã lưu
- **Profile** (`/contractor/profile`) - Hồ sơ năng lực

### Public Pages
- **Marketplace** (`/marketplace`) - Danh sách công trình công khai
- **Contractor Directory** (`/contractors`) - Danh sách nhà thầu

## 📱 Admin Pages

### Dashboard & Users
- **Dashboard** (`/`) - Tổng quan hệ thống
- **Users** (`/users`) - Quản lý users

### Bidding Management
- **Contractors** (`/contractors`) - Quản lý nhà thầu, xét duyệt
- **Regions** (`/regions`) - Quản lý khu vực
- **Projects** (`/projects`) - Quản lý công trình
- **Bids** (`/bids`) - Quản lý bids
- **Matches** (`/matches`) - Quản lý matches
- **Fees** (`/fees`) - Quản lý phí giao dịch
- **Disputes** (`/disputes`) - Quản lý tranh chấp

### Communication
- **Chat** (`/chat`) - Quản lý cuộc hội thoại
- **Notification Templates** (`/notification-templates`) - Quản lý mẫu thông báo

### Settings
- **Settings** (`/settings`) - Cài đặt hệ thống
  - Bidding Tab - Cấu hình đấu giá
  - Service Fees Tab - Quản lý phí dịch vụ

### Content Management
- **Blog Manager** (`/blog`) - Quản lý blog
- **Pricing Config** (`/pricing`) - Cấu hình giá
- **Leads** (`/leads`) - Quản lý khách hàng
