# 🏗️ Bidding Marketplace - Phase 1: Foundation

## Tổng quan

Phase 1 thiết lập nền tảng cho hệ thống đấu giá xây dựng, bao gồm mở rộng user roles, hệ thống xác minh nhà thầu, quản lý khu vực, và cấu hình bidding.

---

## REQ-1: User Roles Extension

### REQ-1.1: Mở rộng Role System
- [ ] Thêm 2 roles mới vào hệ thống: `HOMEOWNER`, `CONTRACTOR`
- [ ] Role hierarchy: `ADMIN > MANAGER > CONTRACTOR > HOMEOWNER > WORKER > USER`
- [ ] Backward compatible với roles hiện có

### REQ-1.2: User Model Extension
- [ ] Thêm các fields cho Contractor:
  - `companyName` (optional) - Tên công ty
  - `businessLicense` (optional) - Số giấy phép kinh doanh
  - `taxCode` (optional) - Mã số thuế
  - `verificationStatus` - PENDING | VERIFIED | REJECTED
  - `verifiedAt` (optional) - Thời điểm xác minh
  - `rating` - Điểm đánh giá trung bình (default: 0)
  - `totalProjects` - Số dự án đã hoàn thành (default: 0)
- [ ] Thêm fields cho Homeowner:
  - `phone` (optional) - Số điện thoại
  - `avatar` (optional) - Ảnh đại diện

### REQ-1.3: ContractorProfile Model
- [ ] Tạo model `ContractorProfile` với các fields:
  - `description` - Giới thiệu bản thân/công ty
  - `experience` - Số năm kinh nghiệm
  - `specialties` - JSON array các chuyên môn ["Sơn", "Ốp lát", "Điện"]
  - `serviceAreas` - JSON array khu vực phục vụ ["Q1", "Q7"]
  - `portfolioImages` - JSON array URLs ảnh portfolio
  - `certificates` - JSON array chứng chỉ [{name, imageUrl, issuedDate}]
  - `idCardFront`, `idCardBack` - URLs ảnh CMND/CCCD
  - `businessLicenseImage` - URL ảnh giấy phép kinh doanh
- [ ] Relation 1-1 với User

### REQ-1.4: Registration Flow
- [ ] Homeowner đăng ký: Tự động duyệt, role = HOMEOWNER
- [ ] Contractor đăng ký: verificationStatus = PENDING, cần Admin duyệt
- [ ] API endpoint `/api/auth/register` hỗ trợ param `accountType`: "homeowner" | "contractor"

---

## REQ-2: Contractor Verification System

### REQ-2.1: Verification Workflow
- [ ] Contractor submit hồ sơ xác minh
- [ ] Admin review và approve/reject
- [ ] Gửi notification khi status thay đổi

### REQ-2.2: Verification API Endpoints
- [ ] `POST /api/contractor/profile` - Tạo/cập nhật hồ sơ năng lực
- [ ] `POST /api/contractor/submit-verification` - Submit hồ sơ để xét duyệt
- [ ] `GET /api/admin/contractors/pending` - Danh sách chờ duyệt (Admin)
- [ ] `PUT /api/admin/contractors/:id/verify` - Duyệt/từ chối (Admin)

### REQ-2.3: Verification Documents
- [ ] Upload CMND/CCCD (front + back)
- [ ] Upload giấy phép kinh doanh (optional)
- [ ] Upload portfolio images (tối đa 10 ảnh)
- [ ] Upload certificates (tối đa 5)

### REQ-2.4: Verification Status
- [ ] `PENDING` - Chờ xét duyệt
- [ ] `VERIFIED` - Đã xác minh
- [ ] `REJECTED` - Bị từ chối (kèm lý do)
- [ ] Contractor chỉ có thể bid khi status = VERIFIED

---

## REQ-3: Region Management

### REQ-3.1: Region Model
- [ ] Tạo model `Region` với các fields:
  - `name` - Tên khu vực ("Quận 1", "Bình Thạnh")
  - `slug` - URL-friendly slug
  - `parentId` - Cho phép phân cấp (Tỉnh > Quận > Phường)
  - `isActive` - Bật/tắt khu vực
  - `order` - Thứ tự hiển thị
- [ ] Self-referencing relation cho hierarchy

### REQ-3.2: Region API Endpoints
- [ ] `GET /api/regions` - Danh sách khu vực (public, tree structure)
- [ ] `GET /api/regions/:id` - Chi tiết khu vực
- [ ] `POST /api/admin/regions` - Tạo khu vực (Admin)
- [ ] `PUT /api/admin/regions/:id` - Cập nhật khu vực (Admin)
- [ ] `DELETE /api/admin/regions/:id` - Xóa khu vực (Admin)

### REQ-3.3: Region Hierarchy
- [ ] Hỗ trợ 3 cấp: Tỉnh/Thành phố > Quận/Huyện > Phường/Xã
- [ ] API trả về dạng tree hoặc flat với parentId
- [ ] Seed data cho TP.HCM (các quận chính)

### REQ-3.4: Admin UI - Region Management
- [ ] Trang quản lý khu vực trong Admin panel
- [ ] CRUD operations với tree view
- [ ] Drag & drop để sắp xếp thứ tự

---

## REQ-4: Bidding Settings

### REQ-4.1: BiddingSettings Model
- [ ] Tạo model `BiddingSettings` (singleton) với các fields:
  - `maxBidsPerProject` - Số bid tối đa/công trình (default: 20)
  - `defaultBidDuration` - Số ngày mặc định (default: 7)
  - `minBidDuration` - Tối thiểu (default: 3)
  - `maxBidDuration` - Tối đa (default: 30)
  - `escrowPercentage` - % đặt cọc (default: 10)
  - `escrowMinAmount` - Tối thiểu (default: 1,000,000 VNĐ)
  - `escrowMaxAmount` - Tối đa (optional)
  - `verificationFee` - Phí xác minh nhà thầu (default: 500,000 VNĐ)
  - `winFeePercentage` - % phí thắng thầu (default: 5)
  - `autoApproveHomeowner` - Tự động duyệt chủ nhà (default: true)
  - `autoApproveProject` - Tự động duyệt công trình (default: false)

### REQ-4.2: Settings API Endpoints
- [ ] `GET /api/settings/bidding` - Lấy cấu hình (public, chỉ trả về fields cần thiết)
- [ ] `GET /api/admin/settings/bidding` - Lấy full cấu hình (Admin)
- [ ] `PUT /api/admin/settings/bidding` - Cập nhật cấu hình (Admin)

### REQ-4.3: Admin UI - Bidding Settings
- [ ] Tab "Cấu hình đấu giá" trong Settings page
- [ ] Form với validation cho từng field
- [ ] Preview tính toán phí dựa trên settings

---

## REQ-5: ServiceFee Model

### REQ-5.1: ServiceFee Model
- [ ] Tạo model `ServiceFee` với các fields:
  - `name` - Tên phí ("Phí xác minh", "Phí thắng thầu")
  - `code` - Mã phí unique (VERIFICATION_FEE, WIN_FEE)
  - `type` - FIXED | PERCENTAGE
  - `value` - Giá trị (500000 hoặc 5%)
  - `description` - Mô tả
  - `isActive` - Bật/tắt

### REQ-5.2: ServiceFee API Endpoints
- [ ] `GET /api/service-fees` - Danh sách phí (public)
- [ ] `POST /api/admin/service-fees` - Tạo phí (Admin)
- [ ] `PUT /api/admin/service-fees/:id` - Cập nhật phí (Admin)
- [ ] `DELETE /api/admin/service-fees/:id` - Xóa phí (Admin)

---

## Non-functional Requirements

### NFR-1: Security
- [ ] Tất cả admin endpoints yêu cầu role ADMIN
- [ ] Contractor chỉ có thể xem/sửa profile của mình
- [ ] Homeowner chỉ có thể xem/sửa thông tin của mình
- [ ] Upload files qua Media API hiện có

### NFR-2: Performance
- [ ] Region API cache 5 phút
- [ ] Pagination cho danh sách contractors pending

### NFR-3: Backward Compatibility
- [ ] Không break existing auth flow
- [ ] Existing users giữ nguyên role
- [ ] Migration script để seed initial data

---

## Acceptance Criteria

1. ✅ User có thể đăng ký với accountType = homeowner hoặc contractor
2. ✅ Contractor có thể tạo và submit hồ sơ xác minh
3. ✅ Admin có thể duyệt/từ chối contractor
4. ✅ Admin có thể CRUD regions với hierarchy
5. ✅ Admin có thể cấu hình bidding settings
6. ✅ Admin có thể quản lý service fees
7. ✅ API responses tuân thủ format chuẩn hóa
8. ✅ Tất cả endpoints có auth middleware phù hợp
