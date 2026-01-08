🌐 Dự án WebApp MVP: NỘI THẤT NHANH – BẢN CẬP NHẬT
0. Mục tiêu cốt lõi : Webapp cho doanh nghiệp thiết kế nội thất

1. Khách hàng:
    - Nhận dự toán nhanh
    - Hoặc đăng ký tư vấn trực tiếp
2. Chủ doanh nghiệp:
    - Toàn quyền kiểm soát đơn giá – vật dụng – hạng mục – hệ số
    - Không cần code
3. Sẵn sàng automation AI + Google Sheet + SEO trong tương lai

I. Cấu trúc tổng thể

1. Landing Page (Client-facing)
Các tab:
    1. Trang chủ
    2. Báo giá & Dự toán ⭐ (TÍNH NĂNG TRUNG TÂM)
    3. Blog
    4. Blog Detail
    5. Policy

II. Landing Page – Báo giá & Dự toán 

🔁 Flow 
Thứ tự hiển thị & thao tác:
1. Chọn HẠNG MỤC thi công
    - Lấy từ Admin (module Hạng mục)
    Ví dụ: Sơn tường, Ốp lát, Tháo dỡ , cải tạo căn hộ …
2. Nhập DIỆN TÍCH (m²)
    - Input: số m²
    - Dùng trực tiếp cho công thức tính
3. Chọn VẬT DỤNG (nếu có)
- Chỉ hiển thị nếu hạng mục được cấu hình cho phép
- Vật dụng:
    Phân theo thể loại
    Chọn nhiều món
    Có hình ảnh + giá
4. CTA: “DỰ TOÁN NGAY”
- Hệ thống:
    Áp dụng công thức
    Nhân hệ số của hạng mục
    Cộng giá vật dụng
- Trả ra con số dự toán cụ thể

📝 Form “ĐĂNG KÝ TƯ VẤN TRỰC TIẾP” 
Xuất hiện song song trong trang Báo giá & Dự toán cho khách không cần xem giá ngay.
Form gồm:
    Họ tên
    Số điện thoại
    Email (optional) ( không bắt buộc )
    Nội dung nhu cầu
    Nút CTA: “Đăng ký tư vấn”
👉 Dữ liệu này sẽ:
- Lưu vào hệ thống Admin
- Đồng bộ Google Sheet (qua cấu hình hệ thống)

III. Admin Panel – CẤU TRÚC CHUẨN HOÁ

1. Quản lý Blog (SEO)
    - Tạo / sửa / xóa blog
    - Chuẩn bị cho automation AI viết bài SEO sau này
2. Cấu hình ĐƠN GIÁ THI CÔNG ⭐⭐⭐ : Quản lý các biến số nền cho công thức.
    Mỗi đơn giá gồm:
        - Thể loại
        - Tên
        - Giá tiền
        - Tag (dùng làm biến trong công thức)
    Tính năng:
        - CRUD đầy đủ
        - UI chia rõ theo thể loại
⚠️ Lưu ý phân quyền (xem phần Nhân sự):
    - Quản lý không được sửa trực tiếp
    - Phải chờ Admin duyệt

3. Quản lý VẬT DỤNG CƠ BẢN
    Mỗi vật dụng:
        - Tên
        - Thể loại
        - Hình ảnh
        - Giá tiền
    Dùng cho:
        - Landing page (chọn vật dụng)
        - Cộng giá vào dự toán
⚠️ Thay đổi vật dụng → cần Admin duyệt nếu không phải Admin

4. Công thức tính báo giá & Quản lý Hạng mục ⭐⭐⭐ 
A. Quản lý HẠNG MỤC
    Mỗi hạng mục gồm:
        - Tên hạng mục
    Checkbox:
        - Cho phép liên kết vật dụng cơ bản hay không
    HỆ SỐ (NHẬP TRỰC TIẾP) ⭐ 
        - Ví dụ: 1.0 – 1.2 – 1.5
        - Nhập ngay trong hạng mục
        - Không viết hệ số trong công thức
        - Giảm sai sót – dễ kiểm soát

👉 Khi tính toán: Tổng = (Kết quả công thức cơ bản × hệ số hạng mục) + vật dụng 

B. Công thức tính toán
    Chỉ tập trung vào:
        - Diện tích (m²)
        - Đơn giá (theo TAG)
    Không xử lý hệ số trong công thức
    Admin có thể:
        - Tạo
        - Sửa
        - Xóa
        - Gán công thức cho hạng mục

5. Quản lý ĐĂNG KÝ KHÁCH HÀNG ⭐ 

Quản lý toàn bộ lead từ:
    - Form đăng ký tư vấn
    - Form dự toán (nếu có lưu)
Thông tin:
    - Tên
    - SĐT
    - Email ( không bắt buộc khi điền form  )
    - Nhu cầu
    - Ngày tạo
    - Trạng thái xử lý (mới / đang gọi / đã chốt / huỷ)

6. Quản lý NHÂN SỰ & PHÂN QUYỀN ⭐ NEW

Cho phép tạo user Admin Panel.

Role:
🔴 ADMIN
Toàn quyền
🟠 QUẢN LÝ
KHÔNG thấy:
    - Công thức tính báo giá & Quản lý Hạng mục
ĐƯỢC phép : 
        - Đề xuất sửa Đơn giá
        - Đề xuất sửa Vật dụng
MỌI thay đổi:
    - Phải chờ Admin duyệt mới có hiệu lực
7. CẤU HÌNH HỆ THỐNG ⭐⭐⭐ (MỞ ĐƯỜNG SCALE)
A. Kết nối Google (OAuth 2.0)
- Đăng nhập Google
- Đồng bộ dữ liệu lead → Google Sheet
- Dùng cho:
    Lưu trữ
    Chăm sóc khách hàng
    Automation sau này
B. Xuất API Blog (cho AI automation)
- API đọc / ghi blog
        - Có mô tả rõ:
        - Endpoint
        - Schema
        - Ví dụ payload
    - Phục vụ:
        - AI viết blog SEO tự động
        - Không cần code thủ công
⚠️ Viết hướng dẫn cực rõ, vì admin không biết code và đang vibe-code

C. Cấu hình CTA nổi (Floating CTA)
- Bật / tắt CTA
Nhập link: ( có option khi bật mới hiển thị logo vầ nút ở CTA trong landingpage đối với từng nút )
    - Messenger
    - Số điện thoại
    - Fanpage
    - Zalo (nếu có)
Landing page hiển thị nút liên hệ nhanh ở góc màn hình