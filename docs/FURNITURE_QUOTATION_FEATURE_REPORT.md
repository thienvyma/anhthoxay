# 📋 BÁO CÁO CHI TIẾT TÍNH NĂNG BÁO GIÁ NỘI THẤT

## Mục lục
1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Cấu trúc dữ liệu](#2-cấu-trúc-dữ-liệu)
3. [Flow Landing Page](#3-flow-landing-page---8-bước)
4. [Admin Panel](#4-admin-panel---4-tabs)
5. [API Endpoints](#5-api-endpoints)
6. [Công thức tính giá](#6-công-thức-tính-giá)
7. [PDF Export](#7-pdf-export)
8. [Tích hợp với Leads](#8-tích-hợp-với-leads)
9. [Import/Export & Sync](#9-importexport--google-sheets-sync)
10. [File Structure](#10-file-structure)

---

## 1. Tổng quan hệ thống

### 1.1 Mục đích
Hệ thống Báo giá Nội thất cho phép khách hàng:
- Chọn căn hộ theo cấu trúc: Chủ đầu tư → Dự án → Tòa nhà → Tầng/Trục
- Xem layout căn hộ và chọn sản phẩm nội thất
- Nhận báo giá chi tiết với các khoản phí
- Tải PDF báo giá

### 1.2 Các thành phần chính
| Thành phần | Mô tả |
|------------|-------|
| **Landing Page** | Form báo giá 8 bước cho khách hàng |
| **Admin Panel** | Quản lý dữ liệu dự án, sản phẩm, phí, PDF settings |
| **API Backend** | REST API với Hono + Prisma |
| **PDF Service** | Xuất báo giá dạng PDF |


---

## 2. Cấu trúc dữ liệu

### 2.1 Hierarchy (Cấu trúc phân cấp dự án)

```
FurnitureDeveloper (Chủ đầu tư)
│   ├── id: string
│   ├── name: string
│   ├── imageUrl?: string
│   └── createdAt, updatedAt
│
└── FurnitureProject (Dự án)
    │   ├── id: string
    │   ├── name: string
    │   ├── code: string (unique per developer)
    │   ├── developerId: string (FK)
    │   ├── imageUrl?: string
    │   └── createdAt, updatedAt
    │
    └── FurnitureBuilding (Tòa nhà)
        │   ├── id: string
        │   ├── name: string (TenToaNha - display)
        │   ├── code: string (MaToaNha - lookup key)
        │   ├── projectId: string (FK)
        │   ├── maxFloor: number (số tầng tối đa)
        │   ├── maxAxis: number (số trục tối đa, 0-indexed)
        │   ├── imageUrl?: string
        │   └── createdAt, updatedAt
        │
        ├── FurnitureLayout (Mapping trục → loại căn hộ)
        │   ├── id: string
        │   ├── layoutAxis: string (format: {buildingCode}_{axis.padStart(2,'0')})
        │   ├── buildingCode: string
        │   ├── axis: number (0, 1, 2, ...)
        │   ├── apartmentType: string (1pn, 2pn, 3pn, ...)
        │   └── createdAt, updatedAt
        │
        └── FurnitureApartmentType (Thông tin loại căn hộ)
            ├── id: string
            ├── buildingCode: string
            ├── apartmentType: string (1pn, 2pn, ...)
            ├── imageUrl?: string (ảnh layout căn hộ)
            ├── description?: string
            └── createdAt, updatedAt
```

### 2.2 Catalog (Danh mục sản phẩm)

```
FurnitureCategory (Danh mục)
│   ├── id: string
│   ├── name: string (unique)
│   ├── description?: string
│   ├── icon?: string (Remix Icon class, VD: ri-sofa-line)
│   ├── order: number (thứ tự hiển thị)
│   ├── isActive: boolean
│   └── createdAt, updatedAt
│
└── FurnitureProduct (Sản phẩm)
    ├── id: string
    ├── name: string
    ├── categoryId: string (FK)
    ├── price: number (VNĐ)
    ├── imageUrl?: string
    ├── description?: string
    ├── dimensions?: string (kích thước)
    ├── order: number
    ├── isActive: boolean
    └── createdAt, updatedAt
```

### 2.3 Fees (Phí)

```
FurnitureFee
├── id: string
├── name: string
├── type: 'FIXED' | 'PERCENTAGE'
│   ├── FIXED: Phí cố định (VNĐ)
│   └── PERCENTAGE: Phí theo % giá cơ bản
├── value: number
├── description?: string
├── isActive: boolean
├── order: number
└── createdAt, updatedAt
```

### 2.4 Quotation (Báo giá)

```
FurnitureQuotation
├── id: string
├── leadId: string (FK → CustomerLead)
├── developerName: string
├── projectName: string
├── buildingName: string
├── buildingCode: string
├── floor: number
├── axis: number
├── unitNumber: string (format: {buildingCode}.{floor}{axis})
├── apartmentType: string
├── layoutImageUrl?: string
├── items: JSON string (QuotationItem[])
│   └── { productId, name, price, quantity }
├── basePrice: number (tổng giá sản phẩm)
├── fees: JSON string (FeeBreakdown[])
│   └── { name, type, value, amount }
├── totalPrice: number (basePrice + fees)
└── createdAt
```


---

## 3. Flow Landing Page - 8 Bước

### 3.1 Tổng quan Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FURNITURE QUOTATION FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 1          Step 2         Step 3         Step 4                       │
│  ┌──────┐       ┌──────┐       ┌──────┐       ┌──────┐                      │
│  │ Chủ  │  ──►  │ Dự   │  ──►  │ Tòa  │  ──►  │ Căn  │                      │
│  │ đầu  │       │ án   │       │ nhà  │       │ hộ   │                      │
│  │ tư   │       │      │       │      │       │      │                      │
│  └──────┘       └──────┘       └──────┘       └──────┘                      │
│                                                  │                           │
│                                                  ▼                           │
│  Step 8          Step 7         Step 6         Step 5                       │
│  ┌──────┐       ┌──────┐       ┌──────┐       ┌──────┐                      │
│  │ Kết  │  ◄──  │ Chọn │  ◄──  │ Thông│  ◄──  │ Xem  │                      │
│  │ quả  │       │ nội  │       │ tin  │       │ Layout│                     │
│  │      │       │ thất │       │ liên │       │      │                      │
│  └──────┘       └──────┘       │ hệ   │       └──────┘                      │
│     │                          └──────┘                                      │
│     ▼                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         TẢI PDF BÁO GIÁ                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Chi tiết từng bước

#### **Step 1: Chọn Chủ đầu tư (Developer)**
- **API**: `GET /api/furniture/developers`
- **UI**: Danh sách cards với tên và logo chủ đầu tư
- **Pagination**: 6 items/page
- **Action**: Click để chọn → tự động chuyển Step 2

#### **Step 2: Chọn Dự án (Project)**
- **API**: `GET /api/furniture/projects?developerId={id}`
- **UI**: Danh sách cards với tên và mã dự án
- **Hiển thị**: Tên chủ đầu tư đã chọn ở header
- **Pagination**: 6 items/page
- **Navigation**: Nút "Quay lại" về Step 1

#### **Step 3: Chọn Tòa nhà (Building)**
- **API**: `GET /api/furniture/buildings?projectId={id}`
- **UI**: Danh sách cards với:
  - Tên tòa nhà
  - Mã tòa nhà
  - Số tầng (maxFloor)
  - Số trục (maxAxis + 1)
- **Hiển thị**: Tên dự án đã chọn ở header
- **Pagination**: 6 items/page

#### **Step 4: Chọn Căn hộ (Floor + Axis)**
- **UI**: 2 dropdown selects
  - **Tầng**: 1 → maxFloor
  - **Trục**: 0 → maxAxis (hiển thị dạng "Trục 00", "Trục 01", ...)
- **Preview**: Hiển thị số căn hộ (Unit Number)
  - Format: `{buildingCode}.{floor.padStart(2,'0')}{axis.padStart(2,'0')}`
  - VD: `LBV A.1503` (Tòa LBV A, Tầng 15, Trục 03)
- **API khi Next**: `GET /api/furniture/layouts/by-axis?buildingCode={code}&axis={axis}`
- **Validation**: Kiểm tra layout tồn tại cho trục đã chọn

#### **Step 5: Xem Layout căn hộ (Apartment Type)**
- **API**: `GET /api/furniture/apartment-types?buildingCode={code}&type={apartmentType}`
- **UI**: Grid cards với:
  - Ảnh layout căn hộ (imageUrl)
  - Tên loại căn hộ (1PN, 2PN, 3PN, ...)
  - Mô tả (nếu có)
- **Hiển thị**: Loại căn hộ từ layout lookup
- **Action**: Click để chọn → chuyển Step 6

#### **Step 6: Nhập thông tin liên hệ (Lead Form)**
- **Fields**:
  | Field | Type | Required | Validation |
  |-------|------|----------|------------|
  | Họ tên | text | ✅ | Min 1 char |
  | Số điện thoại | phone | ✅ | Min 10 số, regex pattern |
  | Email | email | ❌ | Email format |
- **API**: `POST /api/leads`
  ```json
  {
    "name": "Nguyễn Văn A",
    "phone": "0912345678",
    "email": "email@example.com",
    "content": "Yêu cầu báo giá nội thất",
    "source": "FURNITURE_QUOTE"
  }
  ```
- **Response**: Trả về `leadId` để liên kết với quotation
- **Action**: Submit thành công → chuyển Step 7

#### **Step 7: Chọn sản phẩm nội thất (Products)**
- **API**: 
  - `GET /api/furniture/categories`
  - `GET /api/furniture/products`
  - `GET /api/furniture/fees`
- **UI**:
  - **Category Filter**: Tabs/buttons để lọc theo danh mục
  - **Product Grid**: Cards với:
    - Ảnh sản phẩm
    - Tên sản phẩm
    - Giá (format VNĐ)
    - Quantity controls (+/- buttons) khi đã chọn
  - **Summary Box**: Hiển thị:
    - Số sản phẩm đã chọn
    - Tổng giá tạm tính
- **Pagination**: 6 items/page
- **Validation**: Phải chọn ít nhất 1 sản phẩm
- **Action**: Click "Xem báo giá" → tính toán và tạo quotation

#### **Step 8: Kết quả báo giá (Quotation Result)**
- **API**: `POST /api/furniture/quotations`
  ```json
  {
    "leadId": "clxxx...",
    "developerName": "Novaland",
    "projectName": "The Grand Manhattan",
    "buildingName": "Tòa A",
    "buildingCode": "TGM-A",
    "floor": 15,
    "axis": 3,
    "apartmentType": "2pn",
    "layoutImageUrl": "/uploads/layout-2pn.jpg",
    "items": [
      { "productId": "xxx", "name": "Sofa", "price": 15000000, "quantity": 1 }
    ]
  }
  ```
- **UI**: PDF-style quotation card với:
  - Header: Logo, tên công ty, ngày, mã báo giá
  - Thông tin căn hộ: Chủ đầu tư, Dự án, Tòa, Căn hộ, Loại
  - Bảng sản phẩm: Tên, SL, Đơn giá, Thành tiền
  - Chi tiết giá: Giá cơ bản, các khoản phí, Tổng cộng
- **Actions**:
  - **Tải PDF**: `GET /api/furniture/quotations/{id}/pdf`
  - **Báo giá mới**: Reset về Step 1


---

## 4. Admin Panel - 4 Tabs

### 4.1 Tab 1: Quản lý (Management)

#### **Mục đích**: Quản lý cấu trúc dự án: Developer → Project → Building → Layout → ApartmentType

#### **UI Layout**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header: "Quản lý Dự án"                                                     │
│  Actions: [Import CSV] [Export CSV] [Sync Sheet] [Làm mới]                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  CHỦ ĐẦU TƯ     │  │  DỰ ÁN          │  │  TÒA NHÀ        │              │
│  │  [+ Thêm]       │  │  [+ Thêm]       │  │  [+ Thêm]       │              │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤              │
│  │ ○ Novaland (3)  │  │ ○ TGM (2)       │  │ ○ Tòa A         │              │
│  │ ● Vingroup (5)  │  │ ● Vinhomes (3)  │  │ ● Tòa B         │              │
│  │ ○ Sungroup (2)  │  │ ○ Landmark (1)  │  │ ○ Tòa C         │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  THÔNG TIN TÒA NHÀ: Tòa B                                                   │
│  Chủ đầu tư: Vingroup | Dự án: Vinhomes | Tầng: 30 | Trục: 12               │
├─────────────────────────────────────────────────────────────────────────────┤
│  LOẠI CĂN HỘ                                                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │  [IMG]  │  │  [IMG]  │  │  [IMG]  │  │ + Thêm  │                         │
│  │  1PN    │  │  2PN    │  │  3PN    │  │         │                         │
│  │ [✏️][🗑️]│  │ [✏️][🗑️]│  │ [✏️][🗑️]│  │         │                         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  METRICS GRID (Ma trận Tầng x Trục)                                         │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐  │
│  │     │ 00  │ 01  │ 02  │ 03  │ 04  │ 05  │ 06  │ 07  │ 08  │ 09  │ 10  │  │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤  │
│  │ 30  │ 1PN │ 2PN │ 2PN │ 3PN │ 3PN │ 2PN │ 2PN │ 1PN │ 1PN │ 2PN │ 3PN │  │
│  │ 29  │ 1PN │ 2PN │ 2PN │ 3PN │ 3PN │ 2PN │ 2PN │ 1PN │ 1PN │ 2PN │ 3PN │  │
│  │ ... │ ... │ ... │ ... │ ... │ ... │ ... │ ... │ ... │ ... │ ... │ ... │  │
│  │ 1   │ 1PN │ 2PN │ 2PN │ 3PN │ 3PN │ 2PN │ 2PN │ 1PN │ 1PN │ 2PN │ 3PN │  │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘  │
│  * Click vào ô để thêm/sửa layout                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### **CRUD Operations**:

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Developer | ✅ Modal form | ✅ List | ✅ Modal form | ✅ Confirm dialog |
| Project | ✅ Modal form | ✅ List (filtered by developer) | ✅ Modal form | ✅ Confirm dialog |
| Building | ✅ Modal form | ✅ List (filtered by project) | ✅ Modal form | ✅ Confirm dialog |
| Layout | ✅ Click empty cell | ✅ Metrics Grid | ✅ Click filled cell | ✅ In modal |
| ApartmentType | ✅ Modal form | ✅ Cards | ✅ Modal form | ✅ Confirm dialog |

#### **Import/Export/Sync**:
- **Import CSV**: Upload 3 files (DuAn.csv, LayoutIDs.csv, ApartmentType.csv)
- **Export CSV**: Download 3 CSV files
- **Sync Pull**: Đọc từ Google Sheets → Database
- **Sync Push**: Đẩy Database → Google Sheets

---

### 4.2 Tab 2: Catalog (Sản phẩm)

#### **Mục đích**: Quản lý danh mục và sản phẩm nội thất

#### **UI Layout**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header: "Catalog Sản phẩm"                              [Làm mới]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐   │
│  │  DANH MỤC               │  │  SẢN PHẨM                               │   │
│  │  [+ Thêm danh mục]      │  │  [+ Thêm sản phẩm]                      │   │
│  ├─────────────────────────┤  ├─────────────────────────────────────────┤   │
│  │ ○ Tất cả (45)           │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │
│  │ ● Phòng khách (12)      │  │  │  [IMG]  │  │  [IMG]  │  │  [IMG]  │  │   │
│  │ ○ Phòng ngủ (15)        │  │  │ Sofa    │  │ Bàn trà │  │ Kệ TV   │  │   │
│  │ ○ Bếp (8)               │  │  │ 15,000k │  │ 5,000k  │  │ 8,000k  │  │   │
│  │ ○ Phòng tắm (10)        │  │  │ [✏️][🗑️]│  │ [✏️][🗑️]│  │ [✏️][🗑️]│  │   │
│  │                         │  │  └─────────┘  └─────────┘  └─────────┘  │   │
│  │ [✏️] [🗑️] cho mỗi item  │  │                                         │   │
│  └─────────────────────────┘  └─────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### **Category Form Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | text | ✅ | Tên danh mục (unique) |
| description | textarea | ❌ | Mô tả |
| icon | text | ❌ | Remix Icon class (VD: ri-sofa-line) |
| order | number | ❌ | Thứ tự hiển thị |
| isActive | checkbox | ❌ | Trạng thái hoạt động |

#### **Product Form Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | text | ✅ | Tên sản phẩm |
| categoryId | select | ✅ | Danh mục |
| price | number | ✅ | Giá (VNĐ) |
| imageUrl | file upload | ❌ | Ảnh sản phẩm |
| description | textarea | ❌ | Mô tả |
| dimensions | text | ❌ | Kích thước |
| order | number | ❌ | Thứ tự hiển thị |
| isActive | checkbox | ❌ | Trạng thái hoạt động |

---

### 4.3 Tab 3: Phí (Settings)

#### **Mục đích**: Quản lý các khoản phí áp dụng cho báo giá

#### **UI Layout**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header: "Cài đặt Phí"                          [Làm mới] [+ Thêm Phí]      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ℹ️ Hướng dẫn cài đặt phí                                             │  │
│  │  • Cố định (VNĐ): Phí được cộng trực tiếp vào tổng giá               │  │
│  │  • Phần trăm (%): Phí được tính theo % của giá cơ bản                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Tên phí              │ Loại        │ Giá trị    │ Trạng thái │ Actions│  │
│  ├───────────────────────┼─────────────┼────────────┼────────────┼────────┤  │
│  │  Phí vận chuyển       │ Cố định     │ 500,000đ   │ ✅ Hoạt động│ [✏️][🗑️]│  │
│  │  Phí lắp đặt          │ Phần trăm   │ 5%         │ ✅ Hoạt động│ [✏️][🗑️]│  │
│  │  Phí bảo hành         │ Cố định     │ 200,000đ   │ ❌ Đã ẩn   │ [✏️][🗑️]│  │
│  └───────────────────────┴─────────────┴────────────┴────────────┴────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### **Fee Form Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | text | ✅ | Tên phí |
| type | select | ✅ | FIXED hoặc PERCENTAGE |
| value | number | ✅ | Giá trị (VNĐ hoặc %) |
| description | textarea | ❌ | Mô tả |
| order | number | ❌ | Thứ tự hiển thị |
| isActive | checkbox | ❌ | Trạng thái hoạt động |

---

### 4.4 Tab 4: PDF Settings

#### **Mục đích**: Tùy chỉnh giao diện PDF báo giá với live preview

#### **Sections**:

| Section | Fields |
|---------|--------|
| **Công ty** | companyName, companyTagline, companyLogo, documentTitle |
| **Màu sắc** | primaryColor, textColor, mutedColor, borderColor |
| **Font chữ** | companyNameSize, documentTitleSize, sectionTitleSize, bodyTextSize, footerTextSize |
| **Tiêu đề** | apartmentInfoTitle, selectionTypeTitle, productsTitle, priceDetailsTitle, contactInfoTitle, totalLabel |
| **Liên hệ** | contactPhone, contactEmail, contactAddress, contactWebsite |
| **Footer** | footerNote, footerCopyright, additionalNotes, validityDays |
| **Hiển thị** | showLayoutImage, showItemsTable, showFeeDetails, showContactInfo, showValidityDate, showQuotationCode |

#### **Live Preview**: Hiển thị PDF preview bên phải khi chỉnh sửa settings


---

## 5. API Endpoints

### 5.1 Public Routes (`/api/furniture/*`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/developers` | Danh sách chủ đầu tư | ❌ |
| GET | `/projects?developerId={id}` | Danh sách dự án | ❌ |
| GET | `/buildings?projectId={id}` | Danh sách tòa nhà | ❌ |
| GET | `/layouts?buildingCode={code}` | Danh sách layouts | ❌ |
| GET | `/layouts/by-axis?buildingCode={code}&axis={n}` | Layout theo trục | ❌ |
| GET | `/apartment-types?buildingCode={code}&type={type}` | Loại căn hộ | ❌ |
| GET | `/categories` | Danh sách danh mục | ❌ |
| GET | `/products?categoryId={id}` | Danh sách sản phẩm | ❌ |
| GET | `/fees` | Danh sách phí active | ❌ |
| POST | `/quotations` | Tạo báo giá | ❌ (Rate limited) |
| GET | `/quotations/{id}/pdf` | Tải PDF báo giá | ❌ |

### 5.2 Admin Routes (`/api/admin/furniture/*`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| **Developers** |
| GET | `/developers` | Danh sách | ADMIN, MANAGER |
| POST | `/developers` | Tạo mới | ADMIN, MANAGER |
| PUT | `/developers/{id}` | Cập nhật | ADMIN, MANAGER |
| DELETE | `/developers/{id}` | Xóa | ADMIN, MANAGER |
| **Projects** |
| GET | `/projects?developerId={id}` | Danh sách | ADMIN, MANAGER |
| POST | `/projects` | Tạo mới | ADMIN, MANAGER |
| PUT | `/projects/{id}` | Cập nhật | ADMIN, MANAGER |
| DELETE | `/projects/{id}` | Xóa | ADMIN, MANAGER |
| **Buildings** |
| GET | `/buildings?projectId={id}` | Danh sách | ADMIN, MANAGER |
| POST | `/buildings` | Tạo mới | ADMIN, MANAGER |
| PUT | `/buildings/{id}` | Cập nhật | ADMIN, MANAGER |
| DELETE | `/buildings/{id}` | Xóa | ADMIN, MANAGER |
| **Layouts** |
| GET | `/layouts?buildingCode={code}` | Danh sách | ADMIN, MANAGER |
| GET | `/layouts/by-axis?buildingCode={code}&axis={n}` | Theo trục | ADMIN, MANAGER |
| POST | `/layouts` | Tạo mới | ADMIN, MANAGER |
| PUT | `/layouts/{id}` | Cập nhật | ADMIN, MANAGER |
| DELETE | `/layouts/{id}` | Xóa | ADMIN, MANAGER |
| **Apartment Types** |
| GET | `/apartment-types?buildingCode={code}` | Danh sách | ADMIN, MANAGER |
| POST | `/apartment-types` | Tạo mới | ADMIN, MANAGER |
| PUT | `/apartment-types/{id}` | Cập nhật | ADMIN, MANAGER |
| DELETE | `/apartment-types/{id}` | Xóa | ADMIN, MANAGER |
| **Categories** |
| GET | `/categories` | Danh sách | ADMIN, MANAGER |
| POST | `/categories` | Tạo mới | ADMIN, MANAGER |
| PUT | `/categories/{id}` | Cập nhật | ADMIN, MANAGER |
| DELETE | `/categories/{id}` | Xóa (nếu không có products) | ADMIN, MANAGER |
| **Products** |
| GET | `/products?categoryId={id}` | Danh sách | ADMIN, MANAGER |
| POST | `/products` | Tạo mới | ADMIN, MANAGER |
| PUT | `/products/{id}` | Cập nhật | ADMIN, MANAGER |
| DELETE | `/products/{id}` | Xóa | ADMIN, MANAGER |
| **Fees** |
| GET | `/fees` | Danh sách | ADMIN, MANAGER |
| POST | `/fees` | Tạo mới | ADMIN, MANAGER |
| PUT | `/fees/{id}` | Cập nhật | ADMIN, MANAGER |
| DELETE | `/fees/{id}` | Xóa | ADMIN, MANAGER |
| **Quotations** |
| GET | `/quotations?leadId={id}` | Danh sách theo lead | ADMIN, MANAGER |
| GET | `/quotations/{id}/pdf` | Tải PDF | ADMIN, MANAGER |
| **Import/Export** |
| POST | `/import` | Import CSV (multipart) | ADMIN, MANAGER |
| GET | `/export` | Export CSV | ADMIN, MANAGER |
| **Sync** |
| POST | `/sync/pull` | Pull từ Google Sheets | ADMIN, MANAGER |
| POST | `/sync/push` | Push lên Google Sheets | ADMIN, MANAGER |
| **PDF Settings** |
| GET | `/pdf-settings` | Lấy settings | ADMIN, MANAGER |
| PUT | `/pdf-settings` | Cập nhật settings | ADMIN, MANAGER |
| POST | `/pdf-settings/reset` | Reset về mặc định | ADMIN |

---

## 6. Công thức tính giá

### 6.1 Tính giá cơ bản (Base Price)

```typescript
basePrice = Σ (product.price × quantity)
```

**Ví dụ**:
```
Sofa:     15,000,000 × 1 = 15,000,000
Bàn trà:   5,000,000 × 1 =  5,000,000
Kệ TV:     8,000,000 × 1 =  8,000,000
─────────────────────────────────────
Base Price:              28,000,000 VNĐ
```

### 6.2 Tính phí (Fees)

```typescript
for each fee in activeFees:
  if (fee.type === 'FIXED'):
    feeAmount = fee.value
  else if (fee.type === 'PERCENTAGE'):
    feeAmount = basePrice × fee.value / 100
```

**Ví dụ**:
```
Base Price:              28,000,000 VNĐ

Phí vận chuyển (FIXED):     500,000 VNĐ
Phí lắp đặt (5%):         1,400,000 VNĐ  (28,000,000 × 5%)
─────────────────────────────────────────
Total Fees:               1,900,000 VNĐ
```

### 6.3 Tổng cộng (Total Price)

```typescript
totalPrice = basePrice + Σ feeAmounts
```

**Ví dụ**:
```
Base Price:              28,000,000 VNĐ
Total Fees:               1,900,000 VNĐ
─────────────────────────────────────────
TỔNG CỘNG:               29,900,000 VNĐ
```

---

## 7. PDF Export

### 7.1 Cấu trúc PDF

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ANH THỢ XÂY                                    Ngày: 29/12/2024    │   │
│  │  BÁO GIÁ NỘI THẤT                               Mã: ABCD1234        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📍 THÔNG TIN CĂN HỘ                                                │   │
│  │  Chủ đầu tư: Vingroup          Dự án: Vinhomes Central Park         │   │
│  │  Tòa nhà: Landmark 81          Căn hộ: L81.1503                     │   │
│  │  Loại: 2PN                                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [LAYOUT IMAGE]                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📦 SẢN PHẨM ĐÃ CHỌN                                                │   │
│  │  ┌──────────────────┬────────┬────────────────┬────────────────┐   │   │
│  │  │ Sản phẩm         │ SL     │ Đơn giá        │ Thành tiền     │   │   │
│  │  ├──────────────────┼────────┼────────────────┼────────────────┤   │   │
│  │  │ Sofa             │ 1      │ 15,000,000     │ 15,000,000     │   │   │
│  │  │ Bàn trà          │ 1      │  5,000,000     │  5,000,000     │   │   │
│  │  │ Kệ TV            │ 1      │  8,000,000     │  8,000,000     │   │   │
│  │  └──────────────────┴────────┴────────────────┴────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 CHI TIẾT GIÁ                                                    │   │
│  │                                                                      │   │
│  │  Giá cơ bản:                                      28,000,000 VNĐ    │   │
│  │  Phí vận chuyển:                                     500,000 VNĐ    │   │
│  │  Phí lắp đặt (5%):                                 1,400,000 VNĐ    │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  TỔNG CỘNG:                                       29,900,000 VNĐ    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Báo giá có hiệu lực đến: 28/01/2025                                │   │
│  │  © ANH THỢ XÂY - Đối tác tin cậy cho ngôi nhà của bạn               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Customizable Elements (via PDF Settings)

| Element | Customizable |
|---------|--------------|
| Company name | ✅ Text, font size |
| Document title | ✅ Text, font size |
| Colors | ✅ Primary, text, muted, border |
| Section titles | ✅ All section headers |
| Footer | ✅ Note, copyright, validity days |
| Contact info | ✅ Phone, email, address, website |
| Show/Hide | ✅ Layout image, items table, fees, contact, validity, code |



---

## 8. Tích hợp với Leads

### 8.1 Mối quan hệ Quotation - Lead

```
CustomerLead (Khách hàng)
│   ├── id: string
│   ├── name: string
│   ├── phone: string
│   ├── email?: string
│   ├── content: string
│   ├── source: 'FURNITURE_QUOTE' | 'QUOTE_FORM' | 'CONTACT_FORM'
│   ├── status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED'
│   └── createdAt: DateTime
│
└── FurnitureQuotation[] (1:N relationship)
    ├── leadId: string (FK → CustomerLead)
    └── ... quotation data
```

### 8.2 Flow tạo Lead từ Furniture Quote

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LEAD CREATION FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 6: Lead Form                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/leads                                                      │   │
│  │  {                                                                    │   │
│  │    "name": "Nguyễn Văn A",                                           │   │
│  │    "phone": "0912345678",                                            │   │
│  │    "email": "email@example.com",                                     │   │
│  │    "content": "Yêu cầu báo giá nội thất",                            │   │
│  │    "source": "FURNITURE_QUOTE"                                       │   │
│  │  }                                                                    │   │
│  │  → Response: { id: "lead_xxx", ... }                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  Step 8: Create Quotation                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/furniture/quotations                                       │   │
│  │  {                                                                    │   │
│  │    "leadId": "lead_xxx",  ← Liên kết với lead đã tạo                 │   │
│  │    "developerName": "...",                                           │   │
│  │    "items": [...],                                                   │   │
│  │    ...                                                               │   │
│  │  }                                                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Alternative: Inline Lead Creation

API `/api/furniture/quotations` cũng hỗ trợ tạo lead inline:

```typescript
// Option 1: Sử dụng leadId đã có
{
  "leadId": "existing_lead_id",
  "developerName": "...",
  ...
}

// Option 2: Tạo lead mới inline (leadData)
{
  "leadData": {
    "name": "Nguyễn Văn A",
    "phone": "0912345678",
    "email": "email@example.com",
    "content": "Báo giá nội thất"
  },
  "developerName": "...",
  ...
}
// → API tự động tạo CustomerLead với source = 'FURNITURE_QUOTE'
```

### 8.4 Admin: Xem Quotations theo Lead

Trong trang Leads (`/leads`), admin có thể:

1. **Xem danh sách leads** với filter `source = 'FURNITURE_QUOTE'`
2. **Click vào lead** để xem chi tiết
3. **Xem danh sách quotations** của lead đó

```typescript
// Hook: useFurnitureQuotations
// File: admin/src/app/pages/LeadsPage/hooks/useFurnitureQuotations.ts

// Fetch quotations for a specific lead
const { quotations, loading } = useSelectedLeadQuotations(selectedLeadId);

// Check which leads have quotations (for badge display)
const { leadsWithQuotes, checkLeadsForQuotations } = useFurnitureQuotations();
```

### 8.5 API Endpoints cho Lead-Quotation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/furniture/quotations?leadId={id}` | Lấy quotations theo lead |
| GET | `/api/admin/furniture/quotations/{id}/pdf` | Tải PDF quotation |


---

## 9. Import/Export & Google Sheets Sync

### 9.1 CSV Import

#### **Endpoint**: `POST /api/admin/furniture/import`

#### **Input**: Multipart form với 3 files CSV

| File | Tên | Columns |
|------|-----|---------|
| 1 | `DuAn.csv` | ChuDauTu, TenDuAn, MaDuAn, TenToaNha, MaToaNha, SoTangMax, SoTrucMax |
| 2 | `LayoutIDs.csv` | LayoutAxis, MaToaNha, SoTruc, ApartmentType |
| 3 | `ApartmentType.csv` | MaToaNha, ApartmentType, Ảnh, Mô tả |

#### **CSV Format Examples**:

**DuAn.csv**:
```csv
ChuDauTu,TenDuAn,MaDuAn,TenToaNha,MaToaNha,SoTangMax,SoTrucMax
Vingroup,Vinhomes Central Park,VCP,Landmark 81,L81,81,12
Vingroup,Vinhomes Central Park,VCP,Park 1,P1,30,10
Novaland,The Grand Manhattan,TGM,Tower A,TGM-A,45,8
```

**LayoutIDs.csv**:
```csv
LayoutAxis,MaToaNha,SoTruc,ApartmentType
L81_00,L81,0,1pn
L81_01,L81,1,2pn
L81_02,L81,2,2pn
L81_03,L81,3,3pn
```

**ApartmentType.csv**:
```csv
MaToaNha,ApartmentType,Ảnh,Mô tả
L81,1pn,/uploads/layout-1pn.jpg,Căn hộ 1 phòng ngủ
L81,2pn,/uploads/layout-2pn.jpg,Căn hộ 2 phòng ngủ
L81,3pn,/uploads/layout-3pn.jpg,Căn hộ 3 phòng ngủ
```

#### **Import Logic**:

```
1. Parse CSV files
2. Transaction:
   a. Extract unique developers → Create/Update FurnitureDeveloper
   b. Extract unique projects → Create/Update FurnitureProject
   c. Create/Update FurnitureBuilding
   d. Validate SoTruc <= SoTrucMax
   e. Create/Update FurnitureLayout (normalize apartmentType to lowercase)
   f. Create/Update FurnitureApartmentType
3. Return counts: { developers, projects, buildings, layouts, apartmentTypes }
```

#### **Response**:
```json
{
  "success": true,
  "data": {
    "developers": 2,
    "projects": 3,
    "buildings": 5,
    "layouts": 45,
    "apartmentTypes": 12
  }
}
```

### 9.2 CSV Export

#### **Endpoint**: `GET /api/admin/furniture/export`

#### **Response**: ZIP file chứa 3 CSV files

```
furniture-export-2024-12-29.zip
├── DuAn.csv
├── LayoutIDs.csv
└── ApartmentType.csv
```

### 9.3 Google Sheets Sync

#### **Prerequisites**:
- Google account đã kết nối trong Settings → Integrations
- Spreadsheet ID được cấu hình

#### **Sync Pull (Google Sheets → Database)**

**Endpoint**: `POST /api/admin/furniture/sync/pull`

**Body**:
```json
{
  "spreadsheetId": "1ABC...xyz"
}
```

**Flow**:
```
1. Đọc 3 tabs từ Google Sheets:
   - Tab "DuAn" → DuAn data
   - Tab "Layout" → Layout data
   - Tab "ApartmentType" → ApartmentType data
2. Convert to CSV format
3. Call importFromCSV() với data đã đọc
4. Return counts
```

#### **Sync Push (Database → Google Sheets)**

**Endpoint**: `POST /api/admin/furniture/sync/push`

**Body**:
```json
{
  "spreadsheetId": "1ABC...xyz"
}
```

**Flow**:
```
1. Call exportToCSV() để lấy data
2. Ghi vào 3 tabs trong Google Sheets:
   - Tab "DuAn" ← DuAn CSV
   - Tab "Layout" ← Layout CSV
   - Tab "ApartmentType" ← ApartmentType CSV
3. Return success
```

### 9.4 Admin UI: Import/Export/Sync

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header: "Quản lý Dự án"                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  [📥 Import CSV]  [📤 Export CSV]  [🔄 Sync Sheet]  [🔃 Làm mới]       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Import CSV Modal:                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  📁 DuAn.csv:        [Choose File] ✅ selected                       │   │
│  │  📁 LayoutIDs.csv:   [Choose File] ✅ selected                       │   │
│  │  📁 ApartmentType.csv: [Choose File] ✅ selected                     │   │
│  │                                                                       │   │
│  │  [Hủy]                                              [Import]          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Sync Sheet Modal:                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Spreadsheet ID: [_________________________________]                  │   │
│  │                                                                       │   │
│  │  [Pull từ Sheet]                              [Push lên Sheet]        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## 10. File Structure

### 10.1 Landing Page Files

```
landing/src/app/
├── sections/
│   └── FurnitureQuote/
│       ├── index.tsx              # Main component, state management, 8-step flow
│       ├── types.ts               # TypeScript interfaces
│       ├── LeadForm.tsx           # Step 6: Contact form
│       ├── LayoutSelector.tsx     # Step 5: Apartment type selection
│       ├── StepSelector.tsx       # Steps 1-4, 7: Selection grids
│       ├── QuotationResult.tsx    # Step 8: Result display
│       ├── file-size.property.test.ts  # Property-based tests
│       └── components/
│           ├── index.ts           # Re-exports
│           ├── NavigationButtons.tsx  # Back/Next buttons
│           ├── Pagination.tsx     # Pagination controls
│           ├── SelectionCard.tsx  # Card component for selections
│           └── StepIndicator.tsx  # Step progress indicator
│
├── api/
│   └── furniture.ts               # API client functions
│
└── pages/
    └── bao-gia-noi-that/
        └── index.tsx              # Page wrapper
```

### 10.2 Admin Panel Files

```
admin/src/app/
├── pages/
│   └── FurniturePage/
│       ├── index.tsx              # Main page with 4 tabs
│       ├── types.ts               # TypeScript interfaces
│       ├── ManagementTab.tsx      # Tab 1: Project hierarchy management
│       ├── CatalogTab.tsx         # Tab 2: Categories & Products
│       ├── SettingsTab.tsx        # Tab 3: Fees management
│       ├── PdfSettingsTab.tsx     # Tab 4: PDF customization
│       └── components/
│           ├── index.ts           # Re-exports
│           ├── EntityColumn.tsx   # Column for Developer/Project/Building lists
│           ├── BuildingInfoCard.tsx   # Building details display
│           ├── ApartmentTypeCards.tsx # Apartment type cards grid
│           ├── MetricsGrid.tsx    # Floor x Axis matrix
│           ├── ManagementModals.tsx   # CRUD modals for entities
│           ├── CategoryList.tsx   # Category sidebar
│           ├── CategoryForm.tsx   # Category create/edit form
│           ├── ProductGrid.tsx    # Products grid display
│           ├── ProductForm.tsx    # Product create/edit form
│           └── PdfPreview.tsx     # Live PDF preview
│
├── api/
│   └── furniture.ts               # Admin API client functions
│
└── pages/
    └── LeadsPage/
        └── hooks/
            └── useFurnitureQuotations.ts  # Hook for quotation management
```

### 10.3 API Backend Files

```
api/src/
├── routes/
│   └── furniture.routes.ts        # Route handlers (public + admin)
│
├── services/
│   ├── furniture.service.ts       # Business logic
│   │   ├── CRUD: Developers, Projects, Buildings, Layouts, ApartmentTypes
│   │   ├── CRUD: Categories, Products, Fees
│   │   ├── Quotation: create, calculate, getById, getByLead
│   │   ├── Utility: calculateUnitNumber, calculateQuotation
│   │   ├── Import/Export: parseCSV, generateCSV, importFromCSV, exportToCSV
│   │   └── Metrics: generateMetricsGrid
│   │
│   ├── pdf.service.ts             # PDF generation
│   │   └── generateQuotationPDF()
│   │
│   └── google-sheets.service.ts   # Google Sheets integration
│       ├── syncFurniturePull()
│       └── syncFurniturePush()
│
├── schemas/
│   └── furniture.schema.ts        # Zod validation schemas
│       ├── Developer schemas
│       ├── Project schemas
│       ├── Building schemas
│       ├── Layout schemas
│       ├── ApartmentType schemas
│       ├── Category schemas
│       ├── Product schemas
│       ├── Fee schemas
│       ├── Quotation schemas
│       └── Sync schemas
│
└── utils/
    └── response.ts                # Response helpers
```

### 10.4 Database Schema (Prisma)

```
infra/prisma/schema.prisma

Models:
├── FurnitureDeveloper
├── FurnitureProject
├── FurnitureBuilding
├── FurnitureLayout
├── FurnitureApartmentType
├── FurnitureCategory
├── FurnitureProduct
├── FurnitureFee
├── FurnitureQuotation
└── FurniturePdfSettings
```

### 10.5 Shared Types

```
packages/shared/src/
└── types/
    └── furniture.ts               # Shared TypeScript types (if any)
```


---

## 11. Tổng kết

### 11.1 Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| **8-Step Flow** | Chọn căn hộ → Nhập thông tin → Chọn sản phẩm → Xem báo giá |
| **Project Hierarchy** | Developer → Project → Building → Layout → ApartmentType |
| **Product Catalog** | Categories + Products với giá, ảnh, mô tả |
| **Fee System** | Fixed + Percentage fees, áp dụng tự động |
| **PDF Export** | Customizable PDF với live preview |
| **Lead Integration** | Quotations liên kết với CustomerLead |
| **Import/Export** | CSV import/export cho project data |
| **Google Sheets Sync** | Pull/Push data với Google Sheets |

### 11.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend (Landing) | React + TypeScript + Framer Motion |
| Frontend (Admin) | React + TypeScript + Remix Icon |
| Backend | Hono + TypeScript |
| Database | PostgreSQL + Prisma |
| PDF | PDFKit |
| Validation | Zod |

### 11.3 Lưu ý quan trọng

1. **Combo feature đã bị loại bỏ** - Chỉ còn flow CUSTOM (chọn sản phẩm riêng lẻ)
2. **apartmentType được normalize** - Luôn lowercase khi lưu vào DB
3. **Unit Number format** - `{buildingCode}.{floor:02d}{axis:02d}` (VD: `L81.1503`)
4. **Fees áp dụng cho tất cả** - `applicability` mặc định là `BOTH`
5. **Rate limiting** - API tạo quotation có rate limit 10 requests/phút

