# 📄 Setup Pages Guide

## Vấn đề đã giải quyết

### 1. ✅ Trang About bị trống
**Nguyên nhân:** Database chưa có pages và sections nào.

**Giải pháp:** Đã tạo endpoint `/dev/seed-pages` để khởi tạo các pages cơ bản.

### 2. ✅ Trang Blog chưa có trong Admin
**Nguyên nhân:** Database chưa có page `blog`.

**Giải pháp:** Endpoint seed đã tạo trang blog cùng với các trang khác.

---

## 🚀 Cách sử dụng

### Bước 1: Seed Initial Pages

Chạy lệnh sau để tạo các pages cơ bản:

```bash
curl http://localhost:4202/dev/seed-pages
```

Hoặc mở trình duyệt và truy cập:
```
http://localhost:4202/dev/seed-pages
```

**Pages được tạo:**
- ✅ Home (`/`)
- ✅ About Us (`/about`)
- ✅ Our Menu (`/menu`)
- ✅ Gallery (`/gallery`)
- ✅ Blog (`/blog`)
- ✅ Contact (`/contact`)

### Bước 1.1: Seed Sample Sections (Optional)

Để test nhanh, có thể seed sections mẫu:

```bash
# Seed sections cho About page (5 sections)
curl http://localhost:4202/dev/seed-about-sections

# Seed sections cho Blog page (2 sections)
curl http://localhost:4202/dev/seed-blog-sections
```

### Bước 2: Thêm Sections cho các Pages

1. Mở Admin Panel: `http://localhost:4201`
2. Login với tài khoản admin
3. Vào **Pages** menu
4. Chọn page muốn chỉnh sửa (ví dụ: About Us)
5. Click **Manage Sections**
6. Thêm sections:
   - **Hero Simple** - Banner đầu trang
   - **Rich Text** - Nội dung văn bản
   - **Gallery** - Hình ảnh
   - **Call to Action** - Nút hành động
   - v.v.

### Bước 3: Tạo Hero Section cho About Page

Ví dụ tạo Hero Simple cho trang About:

```json
{
  "title": "About Our Restaurant",
  "subtitle": "Discover our story and passion for authentic cuisine",
  "backgroundImage": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
}
```

---

## 📋 Cấu trúc Pages mới

Sau khi fix, các pages sẽ render theo thứ tự:

1. **Hero Section** (từ database - `HERO_SIMPLE`)
2. **Nội dung chính** (menu items, gallery, blog posts...)
3. **Các sections khác** (từ database)

### Ví dụ: About Page

```tsx
<section>
  {/* 1. Hero từ database */}
  <HeroSimple 
    title="About Us"
    subtitle="Our Story"
    backgroundImage="..."
  />

  {/* 2. Các sections khác từ database */}
  <RichText content="..." />
  <Gallery images="..." />
  <CallToAction ... />
</section>
```

---

## 🔧 API Endpoints

### Seed Pages
```
GET /dev/seed-pages
```
Tạo/cập nhật các pages cơ bản (chỉ hoạt động trong development mode).

### List Pages
```
GET /pages
```
Lấy danh sách tất cả pages.

### Get Page Details
```
GET /pages/:slug
```
Lấy thông tin chi tiết của một page, bao gồm sections.

### Create Page
```
POST /pages
Body: { slug: string, title: string }
```
Tạo page mới (yêu cầu quyền ADMIN/MANAGER).

### Update Page
```
PUT /pages/:slug
Body: { title?: string, headerConfig?: object, footerConfig?: object }
```
Cập nhật thông tin page.

### Delete Page
```
DELETE /pages/:slug
```
Xóa page và tất cả sections của nó.

---

## ⚠️ Lưu ý

1. **Development Only:** Endpoint `/dev/seed-pages` chỉ hoạt động khi `NODE_ENV !== 'production'`
2. **Idempotent:** Có thể chạy nhiều lần mà không tạo duplicate pages (sử dụng `upsert`)
3. **Empty Sections:** Pages mới tạo sẽ không có sections, cần thêm từ Admin Panel
4. **Hero Sections:** Mỗi page nên có một `HERO_SIMPLE` section để hiển thị banner đầu trang

---

## 🎨 Các loại Sections có sẵn

- `HERO` - Hero section với CTA buttons
- `HERO_SIMPLE` - Hero đơn giản (title + subtitle + background)
- `FEATURED_MENU` - Hiển thị menu items nổi bật
- `TESTIMONIALS` - Đánh giá của khách hàng
- `STATISTICS` - Thống kê số liệu
- `GALLERY` - Thư viện ảnh
- `CALL_TO_ACTION` - Nút kêu gọi hành động
- `SPECIAL_OFFERS` - Ưu đãi đặc biệt
- `CONTACT_INFO` - Thông tin liên hệ
- `RESERVATION_FORM` - Form đặt bàn
- `RICH_TEXT` - Nội dung HTML tùy chỉnh
- `BANNER` - Banner thông báo
- `FEATURED_BLOG_POSTS` - Bài viết blog nổi bật
- `FAB_ACTIONS` - Floating action buttons

---

## 📝 Next Steps

1. ✅ Đã seed pages vào database
2. ✅ Đã thêm sections cho trang About (5 sections)
3. ✅ Đã thêm sections cho trang Blog (2 sections)
4. ✅ Đã fix frontend để hỗ trợ STATISTICS, CALL_TO_ACTION, BLOG_LIST
5. ⏳ Tạo blog categories và posts từ Admin Panel
6. ⏳ Thêm sections cho các pages khác (Home, Menu, Gallery, Contact)

---

## 🐛 Troubleshooting

### Trang vẫn bị trống sau khi seed?
- Kiểm tra xem API có đang chạy không: `http://localhost:4202/pages`
- Kiểm tra console trong browser để xem có lỗi API không
- Thêm sections cho page từ Admin Panel

### Không thấy trang Blog trong Admin?
- Refresh lại Admin Panel
- Kiểm tra API response: `curl http://localhost:4202/pages`
- Chạy lại seed: `curl http://localhost:4202/dev/seed-pages`

### Hero section không hiển thị?
- Kiểm tra xem page có section `HERO_SIMPLE` không
- Kiểm tra data của section có đúng format không
- Xem console để kiểm tra lỗi render

