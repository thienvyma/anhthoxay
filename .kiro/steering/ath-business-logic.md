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
ADMIN > MANAGER > WORKER > USER
```

### ADMIN
- ✅ Toàn quyền
- ✅ Quản lý công thức & hạng mục
- ✅ Quản lý users
- ✅ Duyệt thay đổi từ Quản lý
- ✅ Cài đặt hệ thống

### MANAGER (Quản lý)
- ✅ Xem & quản lý khách hàng
- ✅ Quản lý blog
- ✅ Quản lý media
- ⚠️ Đề xuất sửa đơn giá (cần duyệt)
- ⚠️ Đề xuất sửa vật dụng (cần duyệt)
- ❌ KHÔNG thấy công thức & hạng mục
- ❌ KHÔNG quản lý users

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
