/**
 * NỘI THẤT NHANH - Comprehensive Database Seed Script
 *
 * Seeds comprehensive data for:
 * - Blog Categories & Posts
 * - Media Assets (Gallery)
 * - Service Categories & Pricing
 * - Material Categories & Materials
 * - Formulas for price calculation
 *
 * Preserves existing admin accounts and data.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // ============================================
  // BLOG CATEGORIES
  // ============================================

  console.log('📝 Seeding blog categories...');

  const blogCategories = [
    {
      name: 'Thi Công Nhà Ở',
      slug: 'thi-cong-nha-o',
      description: 'Hướng dẫn và kinh nghiệm thi công nhà ở, từ thiết kế đến hoàn thiện',
      color: '#3b82f6',
    },
    {
      name: 'Nội Thất & Trang Trí',
      slug: 'noi-that-trang-tri',
      description: 'Ý tưởng thiết kế nội thất, xu hướng trang trí nhà cửa hiện đại',
      color: '#ef4444',
    },
    {
      name: 'Mẹo Vặt Xây Dựng',
      slug: 'meo-vat-xay-dung',
      description: 'Những mẹo vặt, kinh nghiệm thực tế trong xây dựng và sửa chữa',
      color: '#10b981',
    },
    {
      name: 'Vật Liệu Xây Dựng',
      slug: 'vat-lieu-xay-dung',
      description: 'Thông tin về các loại vật liệu xây dựng chất lượng và cách sử dụng',
      color: '#f59e0b',
    },
    {
      name: 'Thiết Kế Kiến Trúc',
      slug: 'thiet-ke-kien-truc',
      description: 'Ý tưởng thiết kế kiến trúc, phong cách nhà cửa Việt Nam',
      color: '#8b5cf6',
    },
    {
      name: 'Tư Vấn & Hỏi Đáp',
      slug: 'tu-van-hoi-dap',
      description: 'Tư vấn chuyên môn, giải đáp thắc mắc về xây dựng và nội thất',
      color: '#06b6d4',
    },
  ];

  for (const category of blogCategories) {
    await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log(`✅ Created ${blogCategories.length} blog categories`);

  // ============================================
  // GET ADMIN USER FOR BLOG POSTS
  // ============================================

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    throw new Error('No admin user found. Please create an admin user first.');
  }

  // ============================================
  // BLOG POSTS
  // ============================================

  console.log('📝 Seeding blog posts...');

  const blogPosts = [
    {
      title: 'Hướng Dẫn Thi Công Nhà Phố 2 Tầng Đầy Đủ',
      slug: 'huong-dan-thi-cong-nha-pho-2-tang-day-du',
      excerpt: 'Hướng dẫn chi tiết quy trình thi công nhà phố 2 tầng từ A đến Z, bao gồm các bước quan trọng và lưu ý cần thiết.',
      content: `# Hướng Dẫn Thi Công Nhà Phố 2 Tầng Đầy Đủ

## 1. Chuẩn Bị Dự Án

Trước khi bắt đầu thi công, cần chuẩn bị kỹ các yếu tố sau:

### a. Hồ Sơ Thi Công
- Giấy phép xây dựng hợp lệ
- Bản vẽ kỹ thuật được phê duyệt
- Hợp đồng với nhà thầu uy tín

### b. Chuẩn Bị Vật Liệu
- Đá, gạch, xi măng chất lượng cao
- Cốt thép đúng quy cách
- Vật liệu hoàn thiện: sơn, gạch lát nền, trần thạch cao

## 2. Các Giai Đoạn Thi Công

### Giai Đoạn 1: Nền Móng
- Khảo sát địa chất
- Đào đất, gia cố nền
- Đổ bê tông lót
- Thi công đà kiềng, dầm móng

### Giai Đoạn 2: Cấu Trúc
- Nắp đà kiềng
- Xây tường, cột
- Đá sàn, mái
- Kết cấu mái nhà

### Giai Đoạn 3: Hoàn Thiện
- Sơn nước, lát gạch
- Lắp đặt điện nước
- Lắp cửa đi, cửa sổ
- Trang trí nội ngoại thất

## 3. Lưu Ý Quan Trọng

- Giám sát chặt chẽ chất lượng công trình
- Tuân thủ đúng tiêu chuẩn kỹ thuật
- Bảo đảm an toàn lao động
- Kiểm tra định kỳ trong quá trình thi công

## 4. Chi Phí Thi Công

Chi phí thi công nhà phố 2 tầng thường dao động từ 2.5 - 4 triệu/m² tùy thuộc vào:
- Vị trí địa lý
- Quy mô công trình
- Chất lượng vật liệu
- Độ phức tạp thiết kế

*Lưu ý: Luôn lựa chọn nhà thầu có uy tín và kinh nghiệm để đảm bảo chất lượng công trình.*`,
      categoryId: (await prisma.blogCategory.findFirst({ where: { slug: 'thi-cong-nha-o' } }))!.id,
      tags: 'nhà phố, thi công, hướng dẫn, 2 tầng',
      status: 'PUBLISHED',
      isFeatured: true,
    },
    {
      title: 'Xu Hướng Thiết Kế Nội Thất Hiện Đại 2024',
      slug: 'xu-huong-thiet-ke-noi-that-hien-dai-2024',
      excerpt: 'Khám phá những xu hướng thiết kế nội thất hiện đại đang thịnh hành trong năm 2024, từ phong cách tối giản đến công nghệ thông minh.',
      content: `# Xu Hướng Thiết Kế Nội Thất Hiện Đại 2024

## 1. Phong Cách Tối Giản (Minimalist)

Phong cách tối giản tiếp tục thống trị xu hướng thiết kế nội thất 2024:

### Đặc Điểm:
- Gam màu trung tính: trắng, xám, đen
- Đường nét thẳng, đơn giản
- Không gian thoáng đãng
- Chất liệu tự nhiên: gỗ, đá, vải linen

### Ứng Dụng:
- Phòng khách: sofa góc đơn sắc, bàn trà gỗ tự nhiên
- Phòng ngủ: giường gỗ đơn giản, tủ quần áo âm tường
- Phòng bếp: tủ bếp màu trắng, mặt đá hoa cương

## 2. Công Nghệ Thông Minh (Smart Home)

Tích hợp công nghệ vào thiết kế nội thất:

### Các Tính Năng:
- Đèn LED thông minh điều khiển qua app
- Máy lạnh, máy giặt kết nối internet
- Camera an ninh tích hợp
- Hệ thống âm thanh đa phòng

### Lợi Ích:
- Tiết kiệm năng lượng
- Tăng cường an ninh
- Thuận tiện trong sinh hoạt
- Tăng giá trị bất động sản

## 3. Nội Thất Xanh (Green Living)

Xu hướng sống xanh, thân thiện môi trường:

### Vật Liệu:
- Gỗ tái chế
- Sơn thân thiện môi trường
- Vải dệt từ nguyên liệu tự nhiên
- Thảm trải sàn từ sợi tre

### Thiết Kế:
- Vườn trên mái
- Tường xanh
- Nội thất từ vật liệu tái chế
- Hệ thống lọc không khí tự nhiên

## 4. Không Gian Đa Chức Năng

Tối ưu hóa không gian sống:

### Ý Tưởng:
- Phòng khách kiêm phòng ăn
- Phòng ngủ có khu vực làm việc
- Ban công làm vườn nhỏ
- Góc học tập tích hợp

### Giải Pháp:
- Nội thất modul
- Tủ đa năng
- Giường có khoang chứa đồ
- Bàn gấp gọn

## 5. Màu Sắc 2024

### Màu Chủ Đạo:
- **Sage Green**: Xanh bạc hà dịu nhẹ
- **Warm White**: Trắng ấm áp
- **Deep Blue**: Xanh navy sâu
- **Earth Tones**: Các tông màu đất

### Cách Kết Hợp:
- Tránh dùng quá nhiều màu cùng lúc
- Kết hợp màu tương phản nhẹ nhàng
- Sử dụng màu nhấn mạnh điểm nhấn

*Lưu ý: Khi áp dụng xu hướng, cần cân nhắc đến sở thích cá nhân và điều kiện thực tế của ngôi nhà.*`,
      categoryId: (await prisma.blogCategory.findFirst({ where: { slug: 'noi-that-trang-tri' } }))!.id,
      tags: 'nội thất, xu hướng, hiện đại, 2024, thiết kế',
      status: 'PUBLISHED',
      isFeatured: true,
    },
    {
      title: 'Cách Chọn Sơn Chất Lượng Cho Nhà Ở',
      slug: 'cach-chon-son-chat-luong-cho-nha-o',
      excerpt: 'Hướng dẫn chi tiết cách chọn sơn chất lượng, phân biệt sơn thật và sơn giả, các loại sơn phổ biến và ứng dụng.',
      content: `# Cách Chọn Sơn Chất Lượng Cho Nhà Ở

## 1. Các Loại Sơn Phổ Biến

### a. Sơn Nước (Water-based Paint)
**Ưu điểm:**
- Không mùi, thân thiện môi trường
- Khô nhanh, dễ thi công
- Dễ vệ sinh, chịu nước tốt
- Giá thành hợp lý

**Nhược điểm:**
- Độ bền thấp hơn sơn dầu
- Dễ bong tróc nếu không thi công đúng cách

**Ứng dụng:** Sơn tường nội ngoại thất, trần nhà

### b. Sơn Dầu (Oil-based Paint)
**Ưu điểm:**
- Độ bền cao, chịu mài mòn tốt
- Chống nước, chống ẩm mốc
- Màu sắc bền đẹp theo thời gian

**Nhược điểm:**
- Mùi khó chịu, độc hại
- Khô chậm, thời gian thi công lâu
- Giá thành cao

**Ứng dụng:** Cửa gỗ, sàn gỗ, đồ nội thất

### c. Sơn Epoxy
**Ưu điểm:**
- Độ bền cực cao
- Chống hóa chất, chịu lực tốt
- Bề mặt nhẵn bóng, dễ vệ sinh

**Nhược điểm:**
- Giá thành rất cao
- Khó thi công, cần kỹ thuật cao
- Không thân thiện môi trường

**Ứng dụng:** Sàn nhà xưởng, gara, khu vực ẩm ướt

## 2. Cách Phân Biệt Sơn Thật - Sơn Giả

### Sơn Thật:
- Có nhãn mác, tem chống hàng giả
- Bao bì chuyên nghiệp, thông tin rõ ràng
- Màu sắc đồng nhất, không tách nước
- Độ phủ tốt, không bị vón cục

### Sơn Giả:
- Bao bì kém chất lượng
- Mùi hóa chất nồng
- Màu sắc không đồng nhất
- Độ phủ kém, dễ bong tróc

## 3. Tiêu Chí Chọn Sơn

### a. Theo Không Gian
- **Phòng khách**: Sơn bóng, màu sáng
- **Phòng ngủ**: Sơn bán bóng, màu dịu nhẹ
- **Phòng bếp**: Sơn dễ vệ sinh, chống ẩm mốc
- **Phòng tắm**: Sơn chịu nước cao

### b. Theo Mục Đích
- Sơn trang trí: tập trung tính thẩm mỹ
- Sơn bảo vệ: ưu tiên độ bền, chống thấm

### c. Theo Ngân Sách
- Sơn giá rẻ: dưới 200.000đ/gallon
- Sơn trung cấp: 200.000đ - 500.000đ/gallon
- Sơn cao cấp: trên 500.000đ/gallon

## 4. Thương Hiệu Sơn Uy Tín

### Sơn Nội Địa:
- Sơn Dulux Việt Nam
- Sơn Nippon Paint
- Sơn Jotun Việt Nam
- Sơn Mykolor

### Sơn Nhập Khẩu:
- Sơn ICI Dulux
- Sơn Caparol
- Sơn Farrow & Ball

## 5. Lưu Ý Khi Mua Sơn

- Mua tại đại lý ủy quyền chính hãng
- Kiểm tra hạn sử dụng
- Yêu cầu hóa đơn, phiếu bảo hành
- Tham khảo ý kiến chuyên gia

*Khuyến cáo: Nên nhờ thợ sơn có kinh nghiệm tư vấn và thi công để đạt kết quả tốt nhất.*`,
      categoryId: (await prisma.blogCategory.findFirst({ where: { slug: 'vat-lieu-xay-dung' } }))!.id,
      tags: 'sơn, chất lượng, chọn sơn, vật liệu',
      status: 'PUBLISHED',
      isFeatured: false,
    },
    {
      title: 'Mẹo Sơn Nhà Đẹp Và Lâu Bền',
      slug: 'meo-son-nha-dep-va-lau-ben',
      excerpt: 'Những mẹo vặt sơn nhà hiệu quả giúp công trình bền đẹp, tiết kiệm chi phí và đạt chất lượng cao.',
      content: `# Mẹo Sơn Nhà Đẹp Và Lâu Bền

## 1. Chuẩn Bị Bề Mặt Sơn

### a. Làm Sạch Bề Mặt
- Rửa sạch bụi bẩn, dầu mỡ
- Dùng dung dịch tẩy rửa chuyên dụng
- Lau khô hoàn toàn trước khi sơn

### b. Chà Nhám Bề Mặt
- Dùng giấy nhám số 80-120 cho bề mặt cũ
- Chà nhám đều tay, không bỏ sót
- Lau sạch bụi nhám sau khi chà

### c. Xử Lý Vết Nứt
- Phát hiện và vá các vết nứt nhỏ
- Dùng bột trét chuyên dụng
- Chà nhám phẳng sau khi trét

## 2. Thời Điểm Sơn Lý Tưởng

### Theo Thời Tiết:
- Tránh ngày nắng gắt, nhiệt độ >35°C
- Tránh ngày mưa, độ ẩm >80%
- Thời gian vàng: 8h-11h và 14h-17h

### Theo Mùa:
- **Mùa khô**: Dễ thi công, màu sắc chuẩn
- **Mùa mưa**: Tránh, dễ bị ẩm mốc
- **Mùa nóng**: Sơn sớm hoặc chiều tối

## 3. Kỹ Thuật Sơn Chuyên Nghiệp

### a. Sơn Lót
- Pha sơn theo tỷ lệ 1:1 với nước
- Sơn mỏng, đều, 2 lớp
- Chờ khô hoàn toàn giữa các lớp

### b. Sơn Mặt
- Khuấy đều sơn trước khi dùng
- Sơn theo thứ tự: trên xuống dưới, trái sang phải
- Tránh sơn đè lớp, tạo vệt

### c. Sơn Chi Tiết
- Dùng cọ nhỏ cho góc cạnh
- Dùng ruột gà cho đường thẳng
- Sơn cửa sổ, cửa ra vào cẩn thận

## 4. Bảo Quản Sơn Sau Thi Công

### a. Bảo Dưỡng Định Kỳ
- Lau sạch bụi bẩn hàng tuần
- Kiểm tra và vá lại vết trầy xước
- Sơn lại khu vực hư hỏng kịp thời

### b. Tránh Hư Hỏng
- Không dùng hóa chất tẩy rửa mạnh
- Tránh va đập mạnh vào tường
- Giữ độ ẩm phòng hợp lý

## 5. Sai Lầm Thường Gặp

### a. Sơn Không Lót
- Màu sắc không chuẩn
- Sơn bong tróc nhanh
- Tăng chi phí sửa chữa

### b. Sơn Quá Dày
- Tạo vệt, chảy sơn
- Khô chậm, dễ bong
- Tốn sơn không hiệu quả

### c. Sơn Trong Thời Tiết Xấu
- Sơn không đều, tạo bọt
- Màu sắc không chuẩn
- Dễ ẩm mốc, phai màu

## 6. Chi Phí Sơn Nhà

### Theo Diện Tích:
- **Sơn tường**: 150.000 - 300.000đ/m²
- **Sơn trần**: 120.000 - 250.000đ/m²
- **Sơn cửa**: 200.000 - 400.000đ/m²

### Theo Loại Sơn:
- Sơn nội địa: tiết kiệm, độ bền 2-3 năm
- Sơn nhập khẩu: chất lượng cao, bền 5-7 năm

*Tip: Luôn chọn đơn vị thi công uy tín và sử dụng vật liệu chất lượng để công trình bền đẹp theo thời gian.*`,
      categoryId: (await prisma.blogCategory.findFirst({ where: { slug: 'meo-vat-xay-dung' } }))!.id,
      tags: 'sơn nhà, mẹo vặt, bền đẹp, kỹ thuật',
      status: 'PUBLISHED',
      isFeatured: false,
    },
    {
      title: 'Thiết Kế Nhà Ốc Việt Nam Hiện Đại',
      slug: 'thiet-ke-nha-oc-viet-nam-hien-dai',
      excerpt: 'Khám phá phong cách thiết kế nhà ở Việt Nam hiện đại, kết hợp bản sắc dân tộc với xu hướng kiến trúc đương đại.',
      content: `# Thiết Kế Nhà Ốc Việt Nam Hiện Đại

## 1. Đặc Điểm Kiến Trúc Việt Nam

### a. Khí Hậu & Địa Hình
- Khí hậu nhiệt đới ẩm gió mùa
- Địa hình đa dạng: đồng bằng, trung du, miền núi
- Ảnh hưởng của văn hóa nông nghiệp

### b. Bản Sắc Truyền Thống
- Mái nhà cong, đề cao thẩm mỹ
- Sân vườn, ao cá tạo không gian xanh
- Vật liệu tự nhiên: gỗ, tre, đá

### c. Sự Tiếp Biến Hiện Đại
- Kết hợp công nghệ tiên tiến
- Tối ưu công năng sử dụng
- Thân thiện với môi trường

## 2. Phong Cách Thiết Kế Phổ Biến

### a. Nhà Phố Hiện Đại
**Đặc điểm:**
- Mặt tiền 4-5m, sâu 15-20m
- 3-4 tầng, tối ưu công năng
- Mái bằng hoặc mái dốc nhẹ

**Thiết kế:**
- Phòng khách, bếp, ăn kết hợp
- 3-4 phòng ngủ + phòng thờ
- Sân thượng, ban công rộng

### b. Nhà Biệt Thự
**Đặc điểm:**
- Diện tích 200-500m²
- 1-2 tầng + tum
- Tích hợp vườn, hồ bơi

**Thiết kế:**
- Phong cách mở, kết nối trong ngoài
- Không gian sống xanh
- Tư tiện riêng tư cao

### c. Nhà Nguyên Căn
**Đặc điểm:**
- Tối ưu không gian nhỏ
- Thiết kế thông minh
- Tích hợp nhiều công năng

## 3. Nguyên Tắc Thiết Kế Hiện Đại

### a. Tối Ưu Ánh Sáng
- Sử dụng cửa kính lớn
- Thiết kế đón sáng tự nhiên
- Hệ thống chiếu sáng thông minh

### b. Thân Thiện Môi Trường
- Vật liệu xanh, tái chế
- Hệ thống năng lượng mặt trời
- Vườn trên mái, tường xanh

### c. Công Năng Thực Tiễn
- Không gian đa dụng
- Lưu thông thuận tiện
- Dễ dàng bảo trì, sửa chữa

## 4. Xu Hướng 2024

### a. Nhà Thông Minh
- Tự động hóa toàn bộ
- Giám sát từ xa
- Tiết kiệm năng lượng

### b. Bền Vững Sinh Thái
- Chứng chỉ xanh LEED
- Vật liệu thân thiện
- Hệ thống thu gom nước mưa

### c. Cá Nhân Hóa
- Thiết kế theo phong cách sống
- Phù hợp với sở thích cá nhân
- Linh hoạt thay đổi theo thời gian

## 5. Lưu Ý Khi Thiết Kế

### a. Vị Trí Đất
- Hướng nhà theo phong thủy
- Tận dụng lợi thế tự nhiên
- Tránh hướng xấu, gió độc

### b. Ngân Sách
- Dự trù kinh phí đầy đủ
- Ưu tiên hạng mục quan trọng
- Lựa chọn vật liệu phù hợp

### c. Pháp Lý
- Xin giấy phép xây dựng
- Tuân thủ quy hoạch khu vực
- Đảm bảo an toàn công trình

*Lời khuyên: Luôn tham khảo ý kiến kiến trúc sư chuyên nghiệp để có thiết kế phù hợp nhất với nhu cầu và điều kiện thực tế.*`,
      categoryId: (await prisma.blogCategory.findFirst({ where: { slug: 'thiet-ke-kien-truc' } }))!.id,
      tags: 'thiết kế, nhà ở, Việt Nam, hiện đại',
      status: 'PUBLISHED',
      isFeatured: true,
    },
    {
      title: 'Tư Vấn Chọn Nhà Thầu Xây Dựng Uy Tín',
      slug: 'tu-van-chon-nha-thau-xay-dung-uy-tin',
      excerpt: 'Hướng dẫn chi tiết cách chọn nhà thầu xây dựng uy tín, kiểm tra năng lực và tránh rủi ro trong thi công.',
      content: `# Tư Vấn Chọn Nhà Thầu Xây Dựng Uy Tín

## 1. Tiêu Chí Đánh Giá Nhà Thầu

### a. Giấy Phép Kinh Doanh
- Giấy phép xây dựng hợp lệ
- Giấy phép kinh doanh xây dựng
- Chứng chỉ hành nghề xây dựng

### b. Kinh Nghiệm & Uy Tính
- Số năm kinh nghiệm trong ngành
- Số lượng công trình đã thi công
- Khách hàng đã thực hiện

### c. Năng Lực Tài Chính
- Vốn điều lệ công ty
- Báo cáo tài chính minh bạch
- Khả năng huy động nguồn lực

### d. Đội Ngũ Nhân Sự
- Kiến trúc sư, kỹ sư chuyên nghiệp
- Thợ thi công có tay nghề
- Quản lý dự án giàu kinh nghiệm

## 2. Cách Kiểm Tra Thông Tin

### a. Tài Liệu Pháp Lý
- Đăng ký kinh doanh tại Sở KHĐT
- Giấy phép xây dựng tại Sở Xây dựng
- Bảo hiểm công trình (nếu có)

### b. Công Trình Tham Chiếu
- Thăm quan công trình đã hoàn thành
- Phản hồi từ chủ đầu tư cũ
- Chất lượng công trình thực tế

### c. Đánh Giá Online
- Tìm kiếm review trên Google, Facebook
- Tham khảo diễn đàn xây dựng
- Liên hệ hội xây dựng địa phương

## 3. Quy Trình Chọn Nhà Thầu

### Bước 1: Thu Thập Thông Tin
- Tìm kiếm 3-5 nhà thầu uy tín
- Thu thập hồ sơ năng lực
- Tham khảo giá cả thị trường

### Bước 2: Đánh Giá Ban Đầu
- Kiểm tra giấy phép, kinh nghiệm
- Thăm công trình mẫu
- Phỏng vấn đại diện công ty

### Bước 3: Đề Xuất & Báo Giá
- Cung cấp bản vẽ, yêu cầu kỹ thuật
- Nhận báo giá chi tiết
- Phân tích cấu thành giá cả

### Bước 4: Thương Lượng Hợp Đồng
- Thảo luận điều khoản hợp đồng
- Xác định phạm vi công việc
- Quy định quyền và nghĩa vụ

## 4. Lưu Ý Trong Hợp Đồng

### a. Phạm Vi Công Việc
- Danh mục công việc chi tiết
- Tiêu chuẩn chất lượng
- Thời hạn hoàn thành

### b. Giá Cả & Thanh Toán
- Tổng giá trị hợp đồng
- Lịch thanh toán theo giai đoạn
- Điều chỉnh giá (nếu có)

### c. Bảo Hành & Bảo Trì
- Thời hạn bảo hành
- Phạm vi bảo hành
- Điều kiện bảo hành

### d. Xử Lý Vi Phạm
- Phạt vi phạm hợp đồng
- Chấm dứt hợp đồng
- Giải quyết tranh chấp

## 5. Theo Dõi Quá Trình Thi Công

### a. Giám Sát Chuyên Nghiệp
- Thuê giám sát viên độc lập
- Kiểm tra định kỳ chất lượng
- Giải quyết vấn đề kịp thời

### b. Báo Cáo Tiến Độ
- Báo cáo tuần/tháng
- Ảnh/video tiến độ
- Báo cáo tài chính

### c. Nghiệm Thu Giai Đoạn
- Nghiệm thu từng hạng mục
- Kiểm tra chất lượng
- Thanh toán theo giai đoạn

## 6. Tránh Những Lỗi Thường Gặp

### a. Chọn Giá Rẻ Bừa
- Thường dẫn đến chất lượng kém
- Phát sinh chi phí sửa chữa
- Rủi ro về tiến độ

### b. Không Ký Hợp Đồng
- Khó đòi quyền lợi khi tranh chấp
- Không có cơ sở pháp lý
- Dễ bị lừa đảo

### c. Thanh Toán Trước 100%
- Rủi ro nhà thầu bỏ dở công trình
- Khó đòi lại tiền khi vi phạm
- Nên thanh toán theo giai đoạn

## 7. Dịch Vụ Tư Vấn Chuyên Nghiệp

Liên hệ với chúng tôi để được tư vấn miễn phí:

- **Tư vấn chọn nhà thầu**: Đánh giá năng lực, uy tín
- **Soạn thảo hợp đồng**: Bảo vệ quyền lợi khách hàng
- **Giám sát thi công**: Đảm bảo chất lượng công trình
- **Nghiệm thu công trình**: Kiểm tra đầy đủ các tiêu chuẩn

*Chúng tôi cam kết mang đến dịch vụ tư vấn chuyên nghiệp, giúp khách hàng có công trình mơ ước với chi phí hợp lý.*`,
      categoryId: (await prisma.blogCategory.findFirst({ where: { slug: 'tu-van-hoi-dap' } }))!.id,
      tags: 'nhà thầu, tư vấn, uy tín, chọn nhà thầu',
      status: 'PUBLISHED',
      isFeatured: false,
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: post,
      create: {
        ...post,
        authorId: adminUser.id,
        publishedAt: post.status === 'PUBLISHED' ? new Date() : null,
      },
    });
  }

  console.log(`✅ Created ${blogPosts.length} blog posts`);

  // ============================================
  // MEDIA ASSETS (GALLERY)
  // ============================================

  console.log('🖼️ Seeding media assets...');

  const mediaAssets = [
    {
      url: '/uploads/gallery/construction-1.jpg',
      alt: 'Công trình nhà phố 2 tầng đang thi công',
      caption: 'Quy trình thi công nhà phố 2 tầng chuyên nghiệp',
      tags: 'nhà phố, thi công, chuyên nghiệp',
      isFeatured: true,
      displayOrder: 1,
    },
    {
      url: '/uploads/gallery/interior-1.jpg',
      alt: 'Nội thất phòng khách hiện đại',
      caption: 'Thiết kế nội thất phòng khách theo phong cách hiện đại',
      tags: 'nội thất, phòng khách, hiện đại',
      isFeatured: true,
      displayOrder: 2,
    },
    {
      url: '/uploads/gallery/materials-1.jpg',
      alt: 'Vật liệu xây dựng chất lượng cao',
      caption: 'Bộ sưu tập vật liệu xây dựng nhập khẩu chất lượng',
      tags: 'vật liệu, chất lượng, nhập khẩu',
      isFeatured: false,
      displayOrder: 3,
    },
    {
      url: '/uploads/gallery/construction-2.jpg',
      alt: 'Thi công sàn bê tông chuyên nghiệp',
      caption: 'Đội ngũ thi công sàn bê tông với công nghệ tiên tiến',
      tags: 'bê tông, sàn, chuyên nghiệp',
      isFeatured: false,
      displayOrder: 4,
    },
    {
      url: '/uploads/gallery/interior-2.jpg',
      alt: 'Phòng ngủ chủ với thiết kế tinh tế',
      caption: 'Không gian phòng ngủ ấm cúng, lãng mạn',
      tags: 'phòng ngủ, tinh tế, ấm cúng',
      isFeatured: true,
      displayOrder: 5,
    },
    {
      url: '/uploads/gallery/kitchen-1.jpg',
      alt: 'Bếp hiện đại với thiết bị cao cấp',
      caption: 'Thiết kế bếp mở thông minh, tiện nghi',
      tags: 'bếp, hiện đại, tiện nghi',
      isFeatured: false,
      displayOrder: 6,
    },
    {
      url: '/uploads/gallery/bathroom-1.jpg',
      alt: 'Phòng tắm sang trọng',
      caption: 'Không gian phòng tắm thư giãn với spa tại nhà',
      tags: 'phòng tắm, sang trọng, thư giãn',
      isFeatured: false,
      displayOrder: 7,
    },
    {
      url: '/uploads/gallery/exterior-1.jpg',
      alt: 'Mặt tiền nhà phố đẹp mắt',
      caption: 'Thiết kế mặt tiền nhà phố kết hợp truyền thống và hiện đại',
      tags: 'mặt tiền, nhà phố, đẹp mắt',
      isFeatured: true,
      displayOrder: 8,
    },
    {
      url: '/uploads/gallery/garden-1.jpg',
      alt: 'Sân vườn xanh mát',
      caption: 'Không gian sân vườn tạo điểm nhấn cho ngôi nhà',
      tags: 'sân vườn, xanh mát, điểm nhấn',
      isFeatured: false,
      displayOrder: 9,
    },
    {
      url: '/uploads/gallery/staircase-1.jpg',
      alt: 'Cầu thang gỗ quý phái',
      caption: 'Thiết kế cầu thang gỗ với đường nét tinh tế',
      tags: 'cầu thang, gỗ quý, tinh tế',
      isFeatured: false,
      displayOrder: 10,
    },
  ];

  for (const media of mediaAssets) {
    const existing = await prisma.mediaAsset.findFirst({
      where: { url: media.url },
    });
    if (!existing) {
      await prisma.mediaAsset.create({
        data: media,
      });
    }
  }

  console.log(`✅ Created ${mediaAssets.length} media assets`);

  // ============================================
  // MATERIAL CATEGORIES
  // ============================================

  console.log('🏗️ Seeding material categories...');

  const materialCategories = [
    {
      name: 'Vật Liệu Cơ Bản',
      slug: 'vat-lieu-co-ban',
      description: 'Xi măng, gạch, đá, cát và các vật liệu xây dựng cơ bản',
      icon: 'ri-building-line',
      order: 1,
    },
    {
      name: 'Vật Liệu Hoàn Thiện',
      slug: 'vat-lieu-hoan-thien',
      description: 'Sơn, gạch lát nền, trần thạch cao, cửa đi cửa sổ',
      icon: 'ri-paint-brush-line',
      order: 2,
    },
    {
      name: 'Đồ Nội Thất',
      slug: 'do-noi-that',
      description: 'Bàn ghế, tủ kệ, giường tủ, đồ trang trí',
      icon: 'ri-armchair-line',
      order: 3,
    },
    {
      name: 'Đồ Bếp',
      slug: 'do-bep',
      description: 'Tủ bếp, thiết bị nhà bếp, phụ kiện bếp',
      icon: 'ri-restaurant-line',
      order: 4,
    },
    {
      name: 'Đồ Phòng Tắm',
      slug: 'do-phong-tam',
      description: 'Bồn tắm, lavabo, thiết bị vệ sinh',
      icon: 'ri-drop-line',
      order: 5,
    },
    {
      name: 'Điện - Nước',
      slug: 'dien-nuoc',
      description: 'Dây điện, công tắc, ống nước, thiết bị điện nước',
      icon: 'ri-flashlight-line',
      order: 6,
    },
  ];

  for (const category of materialCategories) {
    await prisma.materialCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log(`✅ Created ${materialCategories.length} material categories`);

  // ============================================
  // MATERIALS
  // ============================================

  console.log('🔧 Seeding materials...');

  const materials = [
    // Vật Liệu Cơ Bản
    {
      name: 'Xi Măng PCB40',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-co-ban' } }))!.id,
      price: 95000,
      unit: 'bao',
      description: 'Xi măng Portland bền vững PCB40, chất lượng cao',
    },
    {
      name: 'Gạch Tuynel 8x8x18cm',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-co-ban' } }))!.id,
      price: 1800,
      unit: 'viên',
      description: 'Gạch tuynel chất lượng cao, kích thước 8x8x18cm',
    },
    {
      name: 'Cốt Thép Ø12',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-co-ban' } }))!.id,
      price: 16500,
      unit: 'kg',
      description: 'Cốt thép Ø12, thép Việt Nhật, đạt tiêu chuẩn',
    },
    {
      name: 'Đá 1x2cm',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-co-ban' } }))!.id,
      price: 280000,
      unit: 'm³',
      description: 'Đá dăm loại 1, kích thước 1x2cm',
    },

    // Vật Liệu Hoàn Thiện
    {
      name: 'Sơn Nội Thất Dulux',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-hoan-thien' } }))!.id,
      price: 320000,
      unit: 'gallon',
      description: 'Sơn nước nội thất Dulux, chất lượng cao',
    },
    {
      name: 'Gạch Lát Nền 60x60cm',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-hoan-thien' } }))!.id,
      price: 180000,
      unit: 'm²',
      description: 'Gạch lát nền men sáng 60x60cm, nhập khẩu',
    },
    {
      name: 'Trần Thạch Cao',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-hoan-thien' } }))!.id,
      price: 95000,
      unit: 'm²',
      description: 'Trần thạch cao 9mm, hoàn thiện bề mặt',
    },

    // Đồ Nội Thất
    {
      name: 'Sofa Bộ 3 Ghế',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'do-noi-that' } }))!.id,
      price: 8500000,
      unit: 'bộ',
      description: 'Sofa da thật 3 ghế, thiết kế hiện đại',
    },
    {
      name: 'Tủ Quần Áo 3 Cánh',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'do-noi-that' } }))!.id,
      price: 4200000,
      unit: 'cái',
      description: 'Tủ quần áo gỗ công nghiệp, 3 cánh',
    },
    {
      name: 'Giường Ngủ 1m6x2m',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'do-noi-that' } }))!.id,
      price: 5800000,
      unit: 'cái',
      description: 'Giường ngủ gỗ sồi tự nhiên, kích thước 1m6x2m',
    },

    // Đồ Bếp
    {
      name: 'Tủ Bếp Bộ 5 Cánh',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'do-bep' } }))!.id,
      price: 12500000,
      unit: 'bộ',
      description: 'Tủ bếp gỗ MFC, thiết kế hiện đại',
    },
    {
      name: 'Máy Lọc Nước Kangaroo',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'do-bep' } }))!.id,
      price: 4500000,
      unit: 'cái',
      description: 'Máy lọc nước RO 8 lõi, công nghệ tiên tiến',
    },

    // Đồ Phòng Tắm
    {
      name: 'Bồn Tắm 1m7x0.75m',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'do-phong-tam' } }))!.id,
      price: 3200000,
      unit: 'cái',
      description: 'Bồn tắm acrylic, kích thước 1m7x0.75m',
    },
    {
      name: 'Lavabo Đá Nhân Tạo',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'do-phong-tam' } }))!.id,
      price: 1800000,
      unit: 'cái',
      description: 'Lavabo đá nhân tạo, thiết kế hiện đại',
    },

    // Điện - Nước
    {
      name: 'Dây Điện 2x2.5mm²',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'dien-nuoc' } }))!.id,
      price: 8500,
      unit: 'm',
      description: 'Dây điện đồng bọc nhựa, tiết diện 2x2.5mm²',
    },
    {
      name: 'Ống Nước PPR Ø20mm',
      categoryId: (await prisma.materialCategory.findFirst({ where: { slug: 'dien-nuoc' } }))!.id,
      price: 25000,
      unit: 'm',
      description: 'Ống nước PPR, đường kính Ø20mm, chịu nhiệt',
    },
  ];

  for (const material of materials) {
    const existing = await prisma.material.findFirst({
      where: {
        name: material.name,
        categoryId: material.categoryId,
      },
    });
    if (!existing) {
      await prisma.material.create({
        data: material,
      });
    }
  }

  console.log(`✅ Created ${materials.length} materials`);

  // ============================================
  // FORMULAS
  // ============================================

  console.log('🧮 Seeding formulas...');

  const formulas = [
    {
      name: 'Công Thức Thi Công Nhà Phố',
      expression: 'AREA * UNIT_PRICE * COEFFICIENT + MATERIAL_COST',
      description: 'Công thức tính giá thi công nhà phố dựa trên diện tích, đơn giá và hệ số điều chỉnh',
      isActive: true,
    },
    {
      name: 'Công Thức Nội Thất Cơ Bản',
      expression: '(AREA * MATERIAL_UNIT_PRICE) + LABOR_COST + DESIGN_FEE',
      description: 'Công thức tính giá nội thất cơ bản theo diện tích và vật liệu',
      isActive: true,
    },
    {
      name: 'Công Thức Sửa Chữa Nhỏ',
      expression: 'LABOR_COST + MATERIAL_COST + MARGIN',
      description: 'Công thức tính giá sửa chữa nhỏ lẻ',
      isActive: true,
    },
  ];

  for (const formula of formulas) {
    const existing = await prisma.formula.findFirst({
      where: { name: formula.name },
    });
    if (!existing) {
      await prisma.formula.create({
        data: formula,
      });
    }
  }

  console.log(`✅ Created ${formulas.length} formulas`);

  // ============================================
  // SERVICE CATEGORIES
  // ============================================

  console.log('🏢 Seeding service categories...');

  const serviceCategories = [
    {
      name: 'Thi Công Nhà Phố',
      slug: 'thi-cong-nha-pho',
      description: 'Dịch vụ thi công nhà phố từ 2-4 tầng, đầy đủ hạng mục',
      icon: 'ri-building-4-line',
      coefficient: 1.0,
      formulaId: (await prisma.formula.findFirst({ where: { name: 'Công Thức Thi Công Nhà Phố' } }))!.id,
      order: 1,
      materialCategoryIds: [
        (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-co-ban' } }))!.id,
        (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-hoan-thien' } }))!.id,
      ],
    },
    {
      name: 'Nội Thất Phòng Khách',
      slug: 'noi-that-phong-khach',
      description: 'Thiết kế và thi công nội thất phòng khách hiện đại',
      icon: 'ri-armchair-line',
      coefficient: 1.2,
      formulaId: (await prisma.formula.findFirst({ where: { name: 'Công Thức Nội Thất Cơ Bản' } }))!.id,
      order: 2,
      materialCategoryIds: [
        (await prisma.materialCategory.findFirst({ where: { slug: 'do-noi-that' } }))!.id,
      ],
    },
    {
      name: 'Nội Thất Phòng Ngủ',
      slug: 'noi-that-phong-ngu',
      description: 'Thi công nội thất phòng ngủ ấm cúng, tiện nghi',
      icon: 'ri-hotel-bed-line',
      coefficient: 1.1,
      formulaId: (await prisma.formula.findFirst({ where: { name: 'Công Thức Nội Thất Cơ Bản' } }))!.id,
      order: 3,
      materialCategoryIds: [
        (await prisma.materialCategory.findFirst({ where: { slug: 'do-noi-that' } }))!.id,
      ],
    },
    {
      name: 'Thi Công Phòng Bếp',
      slug: 'thi-cong-phong-bep',
      description: 'Thi công phòng bếp hiện đại với tủ bếp cao cấp',
      icon: 'ri-restaurant-line',
      coefficient: 1.3,
      formulaId: (await prisma.formula.findFirst({ where: { name: 'Công Thức Nội Thất Cơ Bản' } }))!.id,
      order: 4,
      materialCategoryIds: [
        (await prisma.materialCategory.findFirst({ where: { slug: 'do-bep' } }))!.id,
        (await prisma.materialCategory.findFirst({ where: { slug: 'dien-nuoc' } }))!.id,
      ],
    },
    {
      name: 'Thi Công Phòng Tắm',
      slug: 'thi-cong-phong-tam',
      description: 'Thi công phòng tắm sang trọng, tiện nghi',
      icon: 'ri-drop-line',
      coefficient: 1.4,
      formulaId: (await prisma.formula.findFirst({ where: { name: 'Công Thức Nội Thất Cơ Bản' } }))!.id,
      order: 5,
      materialCategoryIds: [
        (await prisma.materialCategory.findFirst({ where: { slug: 'do-phong-tam' } }))!.id,
        (await prisma.materialCategory.findFirst({ where: { slug: 'dien-nuoc' } }))!.id,
      ],
    },
    {
      name: 'Sửa Chữa Nhà Cửa',
      slug: 'sua-chua-nha-cua',
      description: 'Dịch vụ sửa chữa nhà cửa, khắc phục hư hỏng',
      icon: 'ri-tools-line',
      coefficient: 1.0,
      formulaId: (await prisma.formula.findFirst({ where: { name: 'Công Thức Sửa Chữa Nhỏ' } }))!.id,
      order: 6,
      materialCategoryIds: [
        (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-hoan-thien' } }))!.id,
        (await prisma.materialCategory.findFirst({ where: { slug: 'dien-nuoc' } }))!.id,
      ],
    },
    {
      name: 'Lắp Đặt Điện Nước',
      slug: 'lap-dat-dien-nuoc',
      description: 'Lắp đặt hệ thống điện nước chuyên nghiệp',
      icon: 'ri-flashlight-line',
      coefficient: 1.0,
      formulaId: (await prisma.formula.findFirst({ where: { name: 'Công Thức Sửa Chữa Nhỏ' } }))!.id,
      order: 7,
      materialCategoryIds: [
        (await prisma.materialCategory.findFirst({ where: { slug: 'dien-nuoc' } }))!.id,
      ],
    },
    {
      name: 'Sơn Nhà',
      slug: 'son-nha',
      description: 'Dịch vụ sơn nhà chuyên nghiệp, chất lượng cao',
      icon: 'ri-paint-brush-line',
      coefficient: 0.8,
      formulaId: (await prisma.formula.findFirst({ where: { name: 'Công Thức Sửa Chữa Nhỏ' } }))!.id,
      order: 8,
      materialCategoryIds: [
        (await prisma.materialCategory.findFirst({ where: { slug: 'vat-lieu-hoan-thien' } }))!.id,
      ],
    },
  ];

  for (const service of serviceCategories) {
    const { materialCategoryIds, ...serviceData } = service;
    const createdService = await prisma.serviceCategory.upsert({
      where: { slug: service.slug },
      update: serviceData,
      create: serviceData,
    });

    // Create junction table entries
    for (const materialCategoryId of materialCategoryIds) {
      await prisma.serviceCategoryMaterialCategory.upsert({
        where: {
          serviceCategoryId_materialCategoryId: {
            serviceCategoryId: createdService.id,
            materialCategoryId,
          },
        },
        update: {},
        create: {
          serviceCategoryId: createdService.id,
          materialCategoryId,
        },
      });
    }
  }

  console.log(`✅ Created ${serviceCategories.length} service categories`);

  // ============================================
  // UNIT PRICES
  // ============================================

  console.log('💰 Seeding unit prices...');

  const unitPrices = [
    // Thi công cơ bản
    {
      category: 'THI_CONG',
      name: 'Đơn Giá Thi Công Nền Móng',
      price: 450000,
      tag: 'NEN_MONG',
      unit: 'm²',
      description: 'Đơn giá thi công nền móng nhà phố',
    },
    {
      category: 'THI_CONG',
      name: 'Đơn Giá Thi Công Cấu Trúc',
      price: 850000,
      tag: 'CAU_TRUC',
      unit: 'm²',
      description: 'Đơn giá thi công kết cấu nhà phố',
    },
    {
      category: 'THI_CONG',
      name: 'Đơn Giá Thi Công Hoàn Thiện',
      price: 650000,
      tag: 'HOAN_THIEN',
      unit: 'm²',
      description: 'Đơn giá thi công hoàn thiện nhà phố',
    },

    // Nội thất
    {
      category: 'NOI_THAT',
      name: 'Đơn Giá Nội Thất Phòng Khách',
      price: 1200000,
      tag: 'NOI_THAT_PK',
      unit: 'm²',
      description: 'Đơn giá thi công nội thất phòng khách',
    },
    {
      category: 'NOI_THAT',
      name: 'Đơn Giá Nội Thất Phòng Ngủ',
      price: 1000000,
      tag: 'NOI_THAT_PN',
      unit: 'm²',
      description: 'Đơn giá thi công nội thất phòng ngủ',
    },
    {
      category: 'NOI_THAT',
      name: 'Đơn Giá Nội Thất Phòng Bếp',
      price: 1500000,
      tag: 'NOI_THAT_PB',
      unit: 'm²',
      description: 'Đơn giá thi công nội thất phòng bếp',
    },

    // Sơn
    {
      category: 'SON',
      name: 'Đơn Giá Sơn Nội Thất',
      price: 180000,
      tag: 'SON_NOI_THAT',
      unit: 'm²',
      description: 'Đơn giá sơn nội thất cao cấp',
    },
    {
      category: 'SON',
      name: 'Đơn Giá Sơn Ngoại Thất',
      price: 220000,
      tag: 'SON_NGOAI_THAT',
      unit: 'm²',
      description: 'Đơn giá sơn ngoại thất chống thấm',
    },

    // Điện nước
    {
      category: 'DIEN_NUOC',
      name: 'Đơn Giá Lắp Đặt Điện',
      price: 120000,
      tag: 'LAP_DAT_DIEN',
      unit: 'm²',
      description: 'Đơn giá lắp đặt hệ thống điện',
    },
    {
      category: 'DIEN_NUOC',
      name: 'Đơn Giá Lắp Đặt Nước',
      price: 150000,
      tag: 'LAP_DAT_NUOC',
      unit: 'm²',
      description: 'Đơn giá lắp đặt hệ thống nước',
    },

    // Sửa chữa
    {
      category: 'SUA_CHUA',
      name: 'Đơn Giá Sửa Chữa Nhỏ',
      price: 300000,
      tag: 'SUA_CHUA_NHO',
      unit: 'công',
      description: 'Đơn giá sửa chữa nhỏ lẻ theo công việc',
    },
  ];

  for (const unitPrice of unitPrices) {
    await prisma.unitPrice.upsert({
      where: { tag: unitPrice.tag },
      update: unitPrice,
      create: unitPrice,
    });
  }

  console.log(`✅ Created ${unitPrices.length} unit prices`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • ${blogCategories.length} blog categories`);
  console.log(`   • ${blogPosts.length} blog posts`);
  console.log(`   • ${mediaAssets.length} media assets`);
  console.log(`   • ${materialCategories.length} material categories`);
  console.log(`   • ${materials.length} materials`);
  console.log(`   • ${formulas.length} pricing formulas`);
  console.log(`   • ${serviceCategories.length} service categories`);
  console.log(`   • ${unitPrices.length} unit prices`);
  console.log('');
  console.log('✨ Admin accounts preserved and enhanced with comprehensive content!');

  // ============================================
  // LANDING PAGES & SECTIONS
  // ============================================

  console.log('🏠 Seeding landing pages and sections...');

  // Create home page
  const homePage = await prisma.page.upsert({
    where: { slug: 'home' },
    update: {
      title: 'Trang Chủ - Nội Thất Nhanh',
      isActive: true,
    },
    create: {
      slug: 'home',
      title: 'Trang Chủ - Nội Thất Nhanh',
      isActive: true,
    },
  });

  // Hero section
  await prisma.section.upsert({
    where: { id: 'home-hero' },
    update: {
      order: 1,
      data: JSON.stringify({
        title: 'Nội Thất Cao Cấp\nCho Ngôi Nhà Mơ Ước',
        subtitle: 'Thiết kế và thi công nội thất chuyên nghiệp với chất lượng đảm bảo, giá cả cạnh tranh',
        imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80',
        ctaText: 'Báo Giá Ngay',
        ctaLink: '#quote-form',
        overlayOpacity: 0.5,
      }),
    },
    create: {
      id: 'home-hero',
      kind: 'HERO',
      order: 1,
      pageId: homePage.id,
      data: JSON.stringify({
        title: 'Nội Thất Cao Cấp\nCho Ngôi Nhà Mơ Ước',
        subtitle: 'Thiết kế và thi công nội thất chuyên nghiệp với chất lượng đảm bảo, giá cả cạnh tranh',
        imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80',
        ctaText: 'Báo Giá Ngay',
        ctaLink: '#quote-form',
        overlayOpacity: 0.5,
      }),
    },
  });

  // Features section
  await prisma.section.upsert({
    where: { id: 'home-features' },
    update: {
      order: 2,
      data: JSON.stringify({
        title: 'Tại Sao Chọn Chúng Tôi?',
        subtitle: 'Cam kết chất lượng và dịch vụ chuyên nghiệp',
        features: [
          {
            icon: 'ri-palette-line',
            title: 'Thiết Kế Tùy Chỉnh',
            description: 'Thiết kế nội thất theo phong cách riêng của từng khách hàng',
          },
          {
            icon: 'ri-tools-line',
            title: 'Thi Công Chuyên Nghiệp',
            description: 'Đội ngũ thợ tay nghề cao, kinh nghiệm dày dặn',
          },
          {
            icon: 'ri-shield-check-line',
            title: 'Bảo Hành Dài Hạn',
            description: 'Bảo hành lên đến 24 tháng cho tất cả sản phẩm',
          },
          {
            icon: 'ri-time-line',
            title: 'Hoàn Thành Đúng Hẹn',
            description: 'Cam kết thời gian thi công, không chậm trễ',
          },
          {
            icon: 'ri-money-dollar-circle-line',
            title: 'Giá Cả Cạnh Tranh',
            description: 'Tư vấn và báo giá chi tiết, minh bạch',
          },
          {
            icon: 'ri-customer-service-line',
            title: 'Hỗ Trợ 24/7',
            description: 'Tư vấn và giải đáp thắc mắc mọi lúc',
          },
        ],
        layout: 'grid',
      }),
    },
    create: {
      id: 'home-features',
      kind: 'FEATURES',
      order: 2,
      pageId: homePage.id,
      data: JSON.stringify({
        title: 'Tại Sao Chọn Chúng Tôi?',
        subtitle: 'Cam kết chất lượng và dịch vụ chuyên nghiệp',
        features: [
          {
            icon: 'ri-palette-line',
            title: 'Thiết Kế Tùy Chỉnh',
            description: 'Thiết kế nội thất theo phong cách riêng của từng khách hàng',
          },
          {
            icon: 'ri-tools-line',
            title: 'Thi Công Chuyên Nghiệp',
            description: 'Đội ngũ thợ tay nghề cao, kinh nghiệm dày dặn',
          },
          {
            icon: 'ri-shield-check-line',
            title: 'Bảo Hành Dài Hạn',
            description: 'Bảo hành lên đến 24 tháng cho tất cả sản phẩm',
          },
          {
            icon: 'ri-time-line',
            title: 'Hoàn Thành Đúng Hẹn',
            description: 'Cam kết thời gian thi công, không chậm trễ',
          },
          {
            icon: 'ri-money-dollar-circle-line',
            title: 'Giá Cả Cạnh Tranh',
            description: 'Tư vấn và báo giá chi tiết, minh bạch',
          },
          {
            icon: 'ri-customer-service-line',
            title: 'Hỗ Trợ 24/7',
            description: 'Tư vấn và giải đáp thắc mắc mọi lúc',
          },
        ],
        layout: 'grid',
      }),
    },
  });

  // Stats section
  await prisma.section.upsert({
    where: { id: 'home-stats' },
    update: {
      order: 3,
      data: JSON.stringify({
        title: 'Nội Thất Nhanh Trong Số',
        subtitle: 'Thành tựu và kinh nghiệm của chúng tôi',
        stats: [
          {
            icon: 'ri-home-heart-line',
            value: 500,
            label: 'Công Trình Hoàn Thành',
            suffix: '+',
            color: '#3b82f6',
          },
          {
            icon: 'ri-user-star-line',
            value: 98,
            label: 'Khách Hàng Hài Lòng',
            suffix: '%',
            color: '#10b981',
          },
          {
            icon: 'ri-calendar-check-line',
            value: 12,
            label: 'Năm Kinh Nghiệm',
            suffix: '+',
            color: '#f59e0b',
          },
          {
            icon: 'ri-award-line',
            value: 50,
            label: 'Giải Thưởng Chất Lượng',
            suffix: '+',
            color: '#ef4444',
          },
        ],
      }),
    },
    create: {
      id: 'home-stats',
      kind: 'STATS',
      order: 3,
      pageId: homePage.id,
      data: JSON.stringify({
        title: 'Nội Thất Nhanh Trong Số',
        subtitle: 'Thành tựu và kinh nghiệm của chúng tôi',
        stats: [
          {
            icon: 'ri-home-heart-line',
            value: 500,
            label: 'Công Trình Hoàn Thành',
            suffix: '+',
            color: '#3b82f6',
          },
          {
            icon: 'ri-user-star-line',
            value: 98,
            label: 'Khách Hàng Hài Lòng',
            suffix: '%',
            color: '#10b981',
          },
          {
            icon: 'ri-calendar-check-line',
            value: 12,
            label: 'Năm Kinh Nghiệm',
            suffix: '+',
            color: '#f59e0b',
          },
          {
            icon: 'ri-award-line',
            value: 50,
            label: 'Giải Thưởng Chất Lượng',
            suffix: '+',
            color: '#ef4444',
          },
        ],
      }),
    },
  });

  // Featured Blog Posts section
  await prisma.section.upsert({
    where: { id: 'home-featured-blog' },
    update: {
      order: 4,
      data: JSON.stringify({
        title: 'Bài Viết Nổi Bật',
        subtitle: 'Cập nhật xu hướng nội thất và mẹo hay từ chuyên gia',
        maxPosts: 3,
      }),
    },
    create: {
      id: 'home-featured-blog',
      kind: 'FEATURED_BLOG_POSTS',
      order: 4,
      pageId: homePage.id,
      data: JSON.stringify({
        title: 'Bài Viết Nổi Bật',
        subtitle: 'Cập nhật xu hướng nội thất và mẹo hay từ chuyên gia',
        maxPosts: 3,
      }),
    },
  });

  // Testimonials section
  await prisma.section.upsert({
    where: { id: 'home-testimonials' },
    update: {
      order: 5,
      data: JSON.stringify({
        title: 'Khách Hàng Nói Gì Về Chúng Tôi',
        subtitle: 'Ý kiến từ những khách hàng đã tin tưởng sử dụng dịch vụ',
        testimonials: [
          {
            name: 'Nguyễn Thị Lan',
            role: 'Gia Chủ',
            avatar: '/uploads/testimonials/lan.jpg',
            rating: 5,
            content: 'Rất hài lòng với dịch vụ của Nội Thất Nhanh. Thi công đúng hẹn, chất lượng tốt, giá cả hợp lý. Phòng khách nhà tôi giờ đẹp như mơ!',
            date: '2024-12-15',
          },
          {
            name: 'Trần Văn Minh',
            role: 'Doanh Nhân',
            avatar: '/uploads/testimonials/minh.jpg',
            rating: 5,
            content: 'Đã làm việc với nhiều nhà thầu nhưng Nội Thất Nhanh là chuyên nghiệp nhất. Tư vấn tận tình, thiết kế sáng tạo, thi công cẩn thận.',
            date: '2024-12-10',
          },
          {
            name: 'Phạm Thị Hoa',
            role: 'Nội Trợ Gia Đình',
            avatar: '/uploads/testimonials/hoa.jpg',
            rating: 5,
            content: 'Gia đình tôi đã sử dụng dịch vụ 2 lần và đều rất ưng ý. Đặc biệt là dịch vụ bảo hành hậu mãi rất tốt.',
            date: '2024-12-05',
          },
        ],
        layout: 'carousel',
      }),
    },
    create: {
      id: 'home-testimonials',
      kind: 'TESTIMONIALS',
      order: 5,
      pageId: homePage.id,
      data: JSON.stringify({
        title: 'Khách Hàng Nói Gì Về Chúng Tôi',
        subtitle: 'Ý kiến từ những khách hàng đã tin tưởng sử dụng dịch vụ',
        testimonials: [
          {
            name: 'Nguyễn Thị Lan',
            role: 'Gia Chủ',
            avatar: '/uploads/testimonials/lan.jpg',
            rating: 5,
            content: 'Rất hài lòng với dịch vụ của Nội Thất Nhanh. Thi công đúng hẹn, chất lượng tốt, giá cả hợp lý. Phòng khách nhà tôi giờ đẹp như mơ!',
            date: '2024-12-15',
          },
          {
            name: 'Trần Văn Minh',
            role: 'Doanh Nhân',
            avatar: '/uploads/testimonials/minh.jpg',
            rating: 5,
            content: 'Đã làm việc với nhiều nhà thầu nhưng Nội Thất Nhanh là chuyên nghiệp nhất. Tư vấn tận tình, thiết kế sáng tạo, thi công cẩn thận.',
            date: '2024-12-10',
          },
          {
            name: 'Phạm Thị Hoa',
            role: 'Nội Trợ Gia Đình',
            avatar: '/uploads/testimonials/hoa.jpg',
            rating: 5,
            content: 'Gia đình tôi đã sử dụng dịch vụ 2 lần và đều rất ưng ý. Đặc biệt là dịch vụ bảo hành hậu mãi rất tốt.',
            date: '2024-12-05',
          },
        ],
        layout: 'carousel',
      }),
    },
  });

  // Gallery section
  await prisma.section.upsert({
    where: { id: 'home-gallery' },
    update: {
      order: 6,
      data: JSON.stringify({
        title: 'Công Trình Tiền Bối',
        subtitle: 'Bộ sưu tập những công trình nội thất đẹp mắt đã hoàn thành',
        maxImages: 8,
      }),
    },
    create: {
      id: 'home-gallery',
      kind: 'MEDIA_GALLERY',
      order: 6,
      pageId: homePage.id,
      data: JSON.stringify({
        title: 'Công Trình Tiền Bối',
        subtitle: 'Bộ sưu tập những công trình nội thất đẹp mắt đã hoàn thành',
        maxImages: 8,
      }),
    },
  });

  // Quote Form section
  await prisma.section.upsert({
    where: { id: 'home-quote-form' },
    update: {
      order: 7,
      data: JSON.stringify({
        title: 'Nhận Báo Giá Miễn Phí',
        subtitle: 'Hãy để chúng tôi tư vấn và đưa ra giải pháp phù hợp nhất cho ngôi nhà của bạn',
        formFields: [
          { _id: 'name', name: 'name', label: 'Họ và tên', type: 'text', required: true },
          { _id: 'phone', name: 'phone', label: 'Số điện thoại', type: 'phone', required: true },
          { _id: 'email', name: 'email', label: 'Email', type: 'email', required: false },
          { _id: 'roomType', name: 'roomType', label: 'Loại phòng', type: 'select', required: true, options: 'Phòng khách,Phòng ngủ,Phòng bếp,Phòng tắm,Toàn bộ nhà' },
          { _id: 'area', name: 'area', label: 'Diện tích (m²)', type: 'text', required: true },
          { _id: 'budget', name: 'budget', label: 'Ngân sách dự kiến', type: 'select', required: false, options: 'Dưới 50tr,50-100tr,100-200tr,200-500tr,Trên 500tr' },
          { _id: 'message', name: 'message', label: 'Yêu cầu đặc biệt', type: 'textarea', required: false },
        ],
        buttonText: 'Gửi Yêu Cầu Báo Giá',
        successMessage: 'Cảm ơn bạn đã gửi yêu cầu! Chúng tôi sẽ liên hệ tư vấn trong vòng 24h.',
      }),
    },
    create: {
      id: 'home-quote-form',
      kind: 'FURNITURE_QUOTE',
      order: 7,
      pageId: homePage.id,
      data: JSON.stringify({
        title: 'Nhận Báo Giá Miễn Phí',
        subtitle: 'Hãy để chúng tôi tư vấn và đưa ra giải pháp phù hợp nhất cho ngôi nhà của bạn',
        formFields: [
          { _id: 'name', name: 'name', label: 'Họ và tên', type: 'text', required: true },
          { _id: 'phone', name: 'phone', label: 'Số điện thoại', type: 'phone', required: true },
          { _id: 'email', name: 'email', label: 'Email', type: 'email', required: false },
          { _id: 'roomType', name: 'roomType', label: 'Loại phòng', type: 'select', required: true, options: 'Phòng khách,Phòng ngủ,Phòng bếp,Phòng tắm,Toàn bộ nhà' },
          { _id: 'area', name: 'area', label: 'Diện tích (m²)', type: 'text', required: true },
          { _id: 'budget', name: 'budget', label: 'Ngân sách dự kiến', type: 'select', required: false, options: 'Dưới 50tr,50-100tr,100-200tr,200-500tr,Trên 500tr' },
          { _id: 'message', name: 'message', label: 'Yêu cầu đặc biệt', type: 'textarea', required: false },
        ],
        buttonText: 'Gửi Yêu Cầu Báo Giá',
        successMessage: 'Cảm ơn bạn đã gửi yêu cầu! Chúng tôi sẽ liên hệ tư vấn trong vòng 24h.',
      }),
    },
  });

  // Contact Info section
  await prisma.section.upsert({
    where: { id: 'home-contact' },
    update: {
      order: 8,
      data: JSON.stringify({
        phone: '0123 456 789',
        email: 'info@noithatnhanh.vn',
        address: '123 Đường ABC, Quận XYZ, TP.HCM',
        workingHours: 'Thứ 2 - Chủ Nhật: 8:00 - 18:00',
        mapUrl: 'https://maps.google.com/?q=123+ABC+Street+Ho+Chi+Minh+City',
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/noithatnhanh' },
          { platform: 'instagram', url: 'https://instagram.com/noithatnhanh' },
          { platform: 'youtube', url: 'https://youtube.com/noithatnhanh' },
        ],
      }),
    },
    create: {
      id: 'home-contact',
      kind: 'CONTACT_INFO',
      order: 8,
      pageId: homePage.id,
      data: JSON.stringify({
        phone: '0123 456 789',
        email: 'info@noithatnhanh.vn',
        address: '123 Đường ABC, Quận XYZ, TP.HCM',
        workingHours: 'Thứ 2 - Chủ Nhật: 8:00 - 18:00',
        mapUrl: 'https://maps.google.com/?q=123+ABC+Street+Ho+Chi+Minh+City',
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/noithatnhanh' },
          { platform: 'instagram', url: 'https://instagram.com/noithatnhanh' },
          { platform: 'youtube', url: 'https://youtube.com/noithatnhanh' },
        ],
      }),
    },
  });

  console.log(`✅ Created home page with ${9} sections`);

  // ============================================
  // FURNITURE SYSTEM DATA
  // ============================================

  console.log('🪑 Seeding furniture system data...');

  // Furniture Developers
  const developers = [
    {
      name: 'Vingroup',
      imageUrl: '/uploads/developers/vingroup.jpg',
    },
    {
      name: 'Novaland',
      imageUrl: '/uploads/developers/novaland.jpg',
    },
    {
      name: 'Masterise Homes',
      imageUrl: '/uploads/developers/masterise.jpg',
    },
  ];

  for (const developer of developers) {
    const existing = await prisma.furnitureDeveloper.findFirst({
      where: { name: developer.name },
    });
    if (!existing) {
      await prisma.furnitureDeveloper.create({
        data: developer,
      });
    }
  }

  console.log(`✅ Created ${developers.length} furniture developers`);

  // Furniture Projects
  const projects = [
    {
      developerId: (await prisma.furnitureDeveloper.findFirst({ where: { name: 'Vingroup' } }))!.id,
      name: 'Vinpearl Luxury Nha Trang',
      code: 'VINPEARL-NT',
    },
    {
      developerId: (await prisma.furnitureDeveloper.findFirst({ where: { name: 'Novaland' } }))!.id,
      name: 'NovaWorld Phan Thiet',
      code: 'NOVAWORLD-PT',
    },
    {
      developerId: (await prisma.furnitureDeveloper.findFirst({ where: { name: 'Masterise Homes' } }))!.id,
      name: 'Masteri Centre Point',
      code: 'MASTERI-CP',
    },
  ];

  for (const project of projects) {
    const existing = await prisma.furnitureProject.findFirst({
      where: { code: project.code },
    });
    if (!existing) {
      await prisma.furnitureProject.create({
        data: project,
      });
    }
  }

  console.log(`✅ Created ${projects.length} furniture projects`);

  // Furniture Buildings
  const buildings = [
    {
      projectId: (await prisma.furnitureProject.findFirst({ where: { code: 'MASTERI-CP' } }))!.id,
      name: 'Tòa A',
      code: 'A',
      maxFloor: 25,
      maxAxis: 10,
    },
    {
      projectId: (await prisma.furnitureProject.findFirst({ where: { code: 'VINPEARL-NT' } }))!.id,
      name: 'Tòa Sapphire',
      code: 'SAP',
      maxFloor: 30,
      maxAxis: 8,
    },
  ];

  for (const building of buildings) {
    const existing = await prisma.furnitureBuilding.findFirst({
      where: {
        projectId: building.projectId,
        code: building.code,
      },
    });
    if (!existing) {
      await prisma.furnitureBuilding.create({
        data: building,
      });
    }
  }

  console.log(`✅ Created ${buildings.length} furniture buildings`);

  // Furniture Layouts - Tạo đầy đủ cho tất cả axis của mỗi building
  const apartmentTypes = ['1pn', '2pn', '3pn', '1pn1pk', '2pn1pk', '3pn1pk', '2pn2pk', '3pn2pk', 'penthouse', 'duplex'];
  
  // Building A: maxAxis = 10
  const layoutsA: { buildingCode: string; apartmentType: string; axis: number }[] = [];
  for (let axis = 1; axis <= 10; axis++) {
    layoutsA.push({
      buildingCode: 'A',
      apartmentType: apartmentTypes[(axis - 1) % apartmentTypes.length],
      axis: axis,
    });
  }
  
  // Building SAP: maxAxis = 8
  const layoutsSAP: { buildingCode: string; apartmentType: string; axis: number }[] = [];
  for (let axis = 1; axis <= 8; axis++) {
    layoutsSAP.push({
      buildingCode: 'SAP',
      apartmentType: apartmentTypes[(axis - 1) % apartmentTypes.length],
      axis: axis,
    });
  }
  
  const layouts = [...layoutsA, ...layoutsSAP];

  for (const layout of layouts) {
    const existing = await prisma.furnitureLayout.findFirst({
      where: {
        buildingCode: layout.buildingCode,
        axis: layout.axis,
      },
    });
    if (!existing) {
      await prisma.furnitureLayout.create({
        data: {
          layoutAxis: `${layout.buildingCode}_${layout.axis}`,
          buildingCode: layout.buildingCode,
          axis: layout.axis,
          apartmentType: layout.apartmentType,
        },
      });
    }
  }

  console.log(`✅ Created ${layouts.length} furniture layouts`);

  // Furniture Categories (schema: name, description, icon, order, isActive - NO slug)
  const furnitureCategories = [
    {
      name: 'Nội Thất Phòng Khách',
      description: 'Sofa, bàn trà, kệ tivi, tủ giày và các món đồ nội thất phòng khách',
      icon: 'ri-armchair-line',
      order: 1,
      isActive: true,
    },
    {
      name: 'Nội Thất Phòng Ngủ',
      description: 'Giường, tủ quần áo, bàn trang điểm và nội thất phòng ngủ',
      icon: 'ri-hotel-bed-line',
      order: 2,
      isActive: true,
    },
    {
      name: 'Nội Thất Phòng Bếp',
      description: 'Tủ bếp, bàn ăn, ghế ăn và đồ dùng nhà bếp',
      icon: 'ri-restaurant-line',
      order: 3,
      isActive: true,
    },
    {
      name: 'Đồ Trang Trí',
      description: 'Tranh treo tường, đèn trang trí, thảm trải sàn',
      icon: 'ri-palette-line',
      order: 4,
      isActive: true,
    },
  ];

  for (const category of furnitureCategories) {
    const existing = await prisma.furnitureCategory.findFirst({
      where: { name: category.name },
    });
    if (!existing) {
      await prisma.furnitureCategory.create({
        data: category,
      });
    }
  }

  console.log(`✅ Created ${furnitureCategories.length} furniture categories`);

  // ============================================
  // FURNITURE MATERIALS (Chất liệu)
  // ============================================

  console.log('🎨 Seeding furniture materials...');

  const furnitureMaterials = [
    {
      name: 'Da thật',
      description: 'Da bò thật nhập khẩu, cao cấp, bền đẹp',
      order: 1,
      isActive: true,
    },
    {
      name: 'Vải bố',
      description: 'Vải bố cao cấp, dễ vệ sinh, thoáng mát',
      order: 2,
      isActive: true,
    },
    {
      name: 'Gỗ sồi',
      description: 'Gỗ sồi tự nhiên nhập khẩu, vân đẹp, bền chắc',
      order: 3,
      isActive: true,
    },
    {
      name: 'Gỗ óc chó',
      description: 'Gỗ óc chó cao cấp, màu nâu đậm sang trọng',
      order: 4,
      isActive: true,
    },
    {
      name: 'Gỗ công nghiệp',
      description: 'Gỗ công nghiệp MDF/MFC, giá tốt, đa dạng màu sắc',
      order: 5,
      isActive: true,
    },
    {
      name: 'Gỗ công nghiệp MDF',
      description: 'Gỗ MDF chống ẩm, phủ melamine',
      order: 6,
      isActive: true,
    },
    {
      name: 'Gỗ MFC',
      description: 'Gỗ MFC công nghiệp, giá rẻ, bền',
      order: 7,
      isActive: true,
    },
    {
      name: 'Gỗ Acrylic',
      description: 'Gỗ phủ Acrylic bóng gương, sang trọng',
      order: 8,
      isActive: true,
    },
    {
      name: 'Gỗ thông',
      description: 'Gỗ thông tự nhiên, vân đẹp, giá hợp lý',
      order: 9,
      isActive: true,
    },
    {
      name: 'Kính cường lực',
      description: 'Kính cường lực an toàn, trong suốt',
      order: 10,
      isActive: true,
    },
    {
      name: 'Kim loại + Acrylic',
      description: 'Kết hợp kim loại và Acrylic, hiện đại',
      order: 11,
      isActive: true,
    },
  ];

  for (const material of furnitureMaterials) {
    await prisma.furnitureMaterial.upsert({
      where: { name: material.name },
      update: material,
      create: material,
    });
  }

  console.log(`✅ Created ${furnitureMaterials.length} furniture materials`);

  // ============================================
  // FURNITURE PRODUCTS - NEW SCHEMA (furniture-product-restructure)
  // Using FurnitureProductBase + FurnitureProductVariant
  // **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8**
  // ============================================

  console.log('🛋️ Seeding furniture products (new schema)...');

  const livingRoomCategoryId = (await prisma.furnitureCategory.findFirst({ where: { name: 'Nội Thất Phòng Khách' } }))!.id;
  const bedroomCategoryId = (await prisma.furnitureCategory.findFirst({ where: { name: 'Nội Thất Phòng Ngủ' } }))!.id;
  const kitchenCategoryId = (await prisma.furnitureCategory.findFirst({ where: { name: 'Nội Thất Phòng Bếp' } }))?.id;
  const decorCategoryId = (await prisma.furnitureCategory.findFirst({ where: { name: 'Đồ Trang Trí' } }))?.id;

  // Get material IDs
  const materialDaThat = await prisma.furnitureMaterial.findFirst({ where: { name: 'Da thật' } });
  const materialVaiBo = await prisma.furnitureMaterial.findFirst({ where: { name: 'Vải bố' } });
  const materialGoSoi = await prisma.furnitureMaterial.findFirst({ where: { name: 'Gỗ sồi' } });
  const materialGoOcCho = await prisma.furnitureMaterial.findFirst({ where: { name: 'Gỗ óc chó' } });
  const materialGoCongNghiep = await prisma.furnitureMaterial.findFirst({ where: { name: 'Gỗ công nghiệp' } });
  const materialGoMDF = await prisma.furnitureMaterial.findFirst({ where: { name: 'Gỗ công nghiệp MDF' } });
  const materialGoMFC = await prisma.furnitureMaterial.findFirst({ where: { name: 'Gỗ MFC' } });
  const materialGoAcrylic = await prisma.furnitureMaterial.findFirst({ where: { name: 'Gỗ Acrylic' } });
  const materialGoThong = await prisma.furnitureMaterial.findFirst({ where: { name: 'Gỗ thông' } });
  const materialKinhCuongLuc = await prisma.furnitureMaterial.findFirst({ where: { name: 'Kính cường lực' } });
  const materialKimLoaiAcrylic = await prisma.furnitureMaterial.findFirst({ where: { name: 'Kim loại + Acrylic' } });

  // Define product bases with their variants
  const furnitureProductBases = [
    // Phòng khách - Sofa góc 7 chỗ
    {
      name: 'Sofa góc 7 chỗ',
      categoryId: livingRoomCategoryId,
      description: 'Sofa góc cao cấp, thiết kế hiện đại, phù hợp phòng khách rộng',
      imageUrl: '/uploads/products/sofa-goc.jpg',
      allowFitIn: true,
      order: 1,
      isActive: true,
      variants: [
        {
          materialId: materialDaThat!.id,
          pricePerUnit: 15000000,
          pricingType: 'LINEAR',
          length: 3.2,
          width: null,
          calculatedPrice: 15000000 * 3.2, // 48,000,000
          imageUrl: '/uploads/products/sofa-goc-da.jpg',
          order: 1,
          isActive: true,
        },
        {
          materialId: materialVaiBo!.id,
          pricePerUnit: 8000000,
          pricingType: 'LINEAR',
          length: 3.2,
          width: null,
          calculatedPrice: 8000000 * 3.2, // 25,600,000
          imageUrl: '/uploads/products/sofa-goc-vai.jpg',
          order: 2,
          isActive: true,
        },
      ],
    },
    // Phòng khách - Bàn trà
    {
      name: 'Bàn trà',
      categoryId: livingRoomCategoryId,
      description: 'Bàn trà phòng khách, thiết kế tinh tế',
      imageUrl: '/uploads/products/ban-tra.jpg',
      allowFitIn: false,
      order: 2,
      isActive: true,
      variants: [
        {
          materialId: materialKinhCuongLuc!.id,
          pricePerUnit: 7000000,
          pricingType: 'M2',
          length: 1.2,
          width: 0.7,
          calculatedPrice: 7000000 * 1.2 * 0.7, // 5,880,000
          imageUrl: '/uploads/products/ban-tra-kinh.jpg',
          order: 1,
          isActive: true,
        },
        {
          materialId: materialGoSoi!.id,
          pricePerUnit: 10000000,
          pricingType: 'M2',
          length: 1.2,
          width: 0.7,
          calculatedPrice: 10000000 * 1.2 * 0.7, // 8,400,000
          imageUrl: '/uploads/products/ban-tra-go.jpg',
          order: 2,
          isActive: true,
        },
      ],
    },
    // Phòng khách - Kệ tivi
    {
      name: 'Kệ tivi',
      categoryId: livingRoomCategoryId,
      description: 'Kệ tivi phòng khách, thiết kế hiện đại',
      imageUrl: '/uploads/products/ke-tivi.jpg',
      allowFitIn: true,
      order: 3,
      isActive: true,
      variants: [
        {
          materialId: materialGoMDF!.id,
          pricePerUnit: 6000000,
          pricingType: 'LINEAR',
          length: 2.0,
          width: null,
          calculatedPrice: 6000000 * 2.0, // 12,000,000
          imageUrl: '/uploads/products/ke-tivi-mdf.jpg',
          order: 1,
          isActive: true,
        },
        {
          materialId: materialGoOcCho!.id,
          pricePerUnit: 12000000,
          pricingType: 'LINEAR',
          length: 2.0,
          width: null,
          calculatedPrice: 12000000 * 2.0, // 24,000,000
          imageUrl: '/uploads/products/ke-tivi-oc-cho.jpg',
          order: 2,
          isActive: true,
        },
      ],
    },
    // Phòng ngủ - Giường ngủ
    {
      name: 'Giường ngủ 1m8x2m',
      categoryId: bedroomCategoryId,
      description: 'Giường ngủ cao cấp, kích thước 1m8x2m',
      imageUrl: '/uploads/products/giuong-ngu.jpg',
      allowFitIn: true,
      order: 1,
      isActive: true,
      variants: [
        {
          materialId: materialGoSoi!.id,
          pricePerUnit: 8000000,
          pricingType: 'M2',
          length: 2.0,
          width: 1.8,
          calculatedPrice: 8000000 * 2.0 * 1.8, // 28,800,000
          imageUrl: '/uploads/products/giuong-ngu-soi.jpg',
          order: 1,
          isActive: true,
        },
        {
          materialId: materialGoCongNghiep!.id,
          pricePerUnit: 4000000,
          pricingType: 'M2',
          length: 2.0,
          width: 1.8,
          calculatedPrice: 4000000 * 2.0 * 1.8, // 14,400,000
          imageUrl: '/uploads/products/giuong-ngu-cn.jpg',
          order: 2,
          isActive: true,
        },
      ],
    },
    // Phòng ngủ - Tủ quần áo
    {
      name: 'Tủ quần áo 3 cánh',
      categoryId: bedroomCategoryId,
      description: 'Tủ quần áo 3 cánh mở, thiết kế rộng rãi',
      imageUrl: '/uploads/products/tu-quan-ao.jpg',
      allowFitIn: true,
      order: 2,
      isActive: true,
      variants: [
        {
          materialId: materialGoCongNghiep!.id,
          pricePerUnit: 5000000,
          pricingType: 'LINEAR',
          length: 1.8,
          width: null,
          calculatedPrice: 5000000 * 1.8, // 9,000,000
          imageUrl: '/uploads/products/tu-quan-ao-cn.jpg',
          order: 1,
          isActive: true,
        },
        {
          materialId: materialGoSoi!.id,
          pricePerUnit: 10000000,
          pricingType: 'LINEAR',
          length: 1.8,
          width: null,
          calculatedPrice: 10000000 * 1.8, // 18,000,000
          imageUrl: '/uploads/products/tu-quan-ao-soi.jpg',
          order: 2,
          isActive: true,
        },
      ],
    },
    // Phòng bếp - Tủ bếp
    {
      name: 'Tủ bếp bộ',
      categoryId: kitchenCategoryId!,
      description: 'Tủ bếp bộ hoàn chỉnh với đá nhân tạo',
      imageUrl: '/uploads/products/tu-bep.jpg',
      allowFitIn: true,
      order: 1,
      isActive: true,
      variants: [
        {
          materialId: materialGoMFC!.id,
          pricePerUnit: 8000000,
          pricingType: 'LINEAR',
          length: 4.0,
          width: null,
          calculatedPrice: 8000000 * 4.0, // 32,000,000
          imageUrl: '/uploads/products/tu-bep-mfc.jpg',
          order: 1,
          isActive: true,
        },
        {
          materialId: materialGoAcrylic!.id,
          pricePerUnit: 15000000,
          pricingType: 'LINEAR',
          length: 4.0,
          width: null,
          calculatedPrice: 15000000 * 4.0, // 60,000,000
          imageUrl: '/uploads/products/tu-bep-acrylic.jpg',
          order: 2,
          isActive: true,
        },
      ],
    },
    // Phòng bếp - Bàn ăn
    {
      name: 'Bàn ăn 6 ghế',
      categoryId: kitchenCategoryId!,
      description: 'Bàn ăn 6 ghế với ghế bọc da',
      imageUrl: '/uploads/products/ban-an.jpg',
      allowFitIn: false,
      order: 2,
      isActive: true,
      variants: [
        {
          materialId: materialGoThong!.id,
          pricePerUnit: 12000000,
          pricingType: 'M2',
          length: 1.8,
          width: 0.9,
          calculatedPrice: 12000000 * 1.8 * 0.9, // 19,440,000
          imageUrl: '/uploads/products/ban-an-thong.jpg',
          order: 1,
          isActive: true,
        },
      ],
    },
    // Trang trí - Đèn LED
    {
      name: 'Đèn trang trí LED',
      categoryId: decorCategoryId!,
      description: 'Đèn trang trí LED RGB, điều khiển qua app',
      imageUrl: '/uploads/products/den-led.jpg',
      allowFitIn: false,
      order: 1,
      isActive: true,
      variants: [
        {
          materialId: materialKimLoaiAcrylic?.id,
          pricePerUnit: 3500000,
          pricingType: 'LINEAR',
          length: 1.0,
          width: null,
          calculatedPrice: 3500000, // 3,500,000
          imageUrl: '/uploads/products/den-led.jpg',
          order: 1,
          isActive: true,
        },
      ],
    },
  ];

  // Clear existing data for clean seed (new schema)
  await prisma.furnitureProductMapping.deleteMany({});
  await prisma.furnitureProductVariant.deleteMany({});
  await prisma.furnitureProductBase.deleteMany({});
  // Also clear legacy products
  await prisma.furnitureProduct.deleteMany({});

  // Create product bases with variants
  const createdProductBases: { id: string; name: string; categoryId: string }[] = [];
  let totalVariants = 0;

  for (const productBase of furnitureProductBases) {
    const { variants, ...baseData } = productBase;
    
    const createdBase = await prisma.furnitureProductBase.create({
      data: {
        ...baseData,
        variants: {
          create: variants,
        },
      },
    });
    
    createdProductBases.push({ 
      id: createdBase.id, 
      name: createdBase.name, 
      categoryId: createdBase.categoryId 
    });
    totalVariants += variants.length;
  }

  console.log(`✅ Created ${furnitureProductBases.length} furniture product bases`);
  console.log(`✅ Created ${totalVariants} furniture product variants`);

  // Legacy products for backward compatibility (keeping old structure)
  const furnitureProducts = [
    // Phòng khách - Sofa với nhiều chất liệu (legacy format)
    {
      categoryId: livingRoomCategoryId,
      name: 'Sofa góc 7 chỗ (Legacy)',
      material: 'Da thật',
      description: 'Sofa góc cao cấp da thật nhập khẩu, thiết kế hiện đại',
      imageUrl: '/uploads/products/sofa-goc.jpg',
      pricePerUnit: 15000000,
      pricingType: 'LINEAR',
      length: 3.2,
      width: null,
      calculatedPrice: 15000000 * 3.2,
      price: 48000000,
      allowFitIn: true,
      dimensions: JSON.stringify({ width: 320, height: 85, depth: 180 }),
      isActive: false, // Inactive - for backward compatibility only
      order: 100,
    },
  ];

  // Create legacy products (minimal, for backward compatibility)
  for (const product of furnitureProducts) {
    await prisma.furnitureProduct.create({
      data: product,
    });
  }

  console.log(`✅ Created ${furnitureProducts.length} legacy furniture products (backward compatibility)`);

  // ============================================
  // FURNITURE PRODUCT MAPPINGS (NEW SCHEMA)
  // Now references FurnitureProductBase instead of FurnitureProduct
  // **Validates: Requirements 1.5, 5.1, 5.2, 5.3**
  // ============================================

  console.log('🔗 Seeding furniture product mappings (new schema)...');

  // Map product bases to apartments
  const productBaseMappings = [
    // Sofa góc - available in larger apartments
    { productName: 'Sofa góc 7 chỗ', mappings: [
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '2pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '3pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '2pn1pk' },
    ]},
    // Bàn trà - available in all apartment types
    { productName: 'Bàn trà', mappings: [
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '1pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '2pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '3pn' },
    ]},
    // Kệ tivi
    { productName: 'Kệ tivi', mappings: [
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '1pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '2pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '3pn' },
    ]},
    // Giường ngủ
    { productName: 'Giường ngủ 1m8x2m', mappings: [
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '1pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '2pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '3pn' },
    ]},
    // Tủ quần áo
    { productName: 'Tủ quần áo 3 cánh', mappings: [
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '1pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '2pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '3pn' },
    ]},
    // Tủ bếp
    { productName: 'Tủ bếp bộ', mappings: [
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '1pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '2pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '3pn' },
    ]},
    // Bàn ăn
    { productName: 'Bàn ăn 6 ghế', mappings: [
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '2pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '3pn' },
    ]},
    // Đèn trang trí
    { productName: 'Đèn trang trí LED', mappings: [
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '1pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '2pn' },
      { projectName: 'Masteri Centre Point', buildingCode: 'A', apartmentType: '3pn' },
    ]},
  ];

  let mappingCount = 0;
  for (const pm of productBaseMappings) {
    const productBase = createdProductBases.find(p => p.name === pm.productName);
    if (!productBase) {
      console.warn(`⚠️ Product base not found: ${pm.productName}`);
      continue;
    }
    
    for (const mapping of pm.mappings) {
      await prisma.furnitureProductMapping.create({
        data: {
          productBaseId: productBase.id,
          projectName: mapping.projectName,
          buildingCode: mapping.buildingCode,
          apartmentType: mapping.apartmentType.toLowerCase(),
        },
      });
      mappingCount++;
    }
  }

  console.log(`✅ Created ${mappingCount} furniture product mappings (new schema)`);

  // ============================================
  // FURNITURE APARTMENT TYPES
  // ============================================

  console.log('🏠 Seeding furniture apartment types...');

  const furnitureApartmentTypes = [
    // Building A (Masteri Centre Point)
    {
      buildingCode: 'A',
      apartmentType: '1pn',
      imageUrl: '/uploads/apartment-types/1pn-layout.jpg',
      description: 'Căn hộ 1 phòng ngủ, diện tích 45-55m², phù hợp cho người độc thân hoặc cặp đôi',
    },
    {
      buildingCode: 'A',
      apartmentType: '2pn',
      imageUrl: '/uploads/apartment-types/2pn-layout.jpg',
      description: 'Căn hộ 2 phòng ngủ, diện tích 65-75m², phù hợp cho gia đình nhỏ',
    },
    {
      buildingCode: 'A',
      apartmentType: '3pn',
      imageUrl: '/uploads/apartment-types/3pn-layout.jpg',
      description: 'Căn hộ 3 phòng ngủ, diện tích 85-100m², phù hợp cho gia đình đông thành viên',
    },
    {
      buildingCode: 'A',
      apartmentType: '1pn1pk',
      imageUrl: '/uploads/apartment-types/1pn1pk-layout.jpg',
      description: 'Căn hộ 1 phòng ngủ + 1 phòng khách riêng, diện tích 50-60m²',
    },
    {
      buildingCode: 'A',
      apartmentType: '2pn1pk',
      imageUrl: '/uploads/apartment-types/2pn1pk-layout.jpg',
      description: 'Căn hộ 2 phòng ngủ + 1 phòng khách riêng, diện tích 70-85m²',
    },
    // Building SAP (Vinpearl Sapphire)
    {
      buildingCode: 'SAP',
      apartmentType: '1pn',
      imageUrl: '/uploads/apartment-types/sap-1pn-layout.jpg',
      description: 'Căn hộ 1 phòng ngủ view biển, diện tích 50-60m²',
    },
    {
      buildingCode: 'SAP',
      apartmentType: '2pn',
      imageUrl: '/uploads/apartment-types/sap-2pn-layout.jpg',
      description: 'Căn hộ 2 phòng ngủ view biển, diện tích 70-85m²',
    },
    {
      buildingCode: 'SAP',
      apartmentType: '3pn1pk1h',
      imageUrl: '/uploads/apartment-types/sap-3pn1pk1h-layout.jpg',
      description: 'Căn hộ 3 phòng ngủ + 1 phòng khách + 1 phòng làm việc, diện tích 100-120m²',
    },
    {
      buildingCode: 'SAP',
      apartmentType: 'penthouse',
      imageUrl: '/uploads/apartment-types/sap-penthouse-layout.jpg',
      description: 'Căn hộ Penthouse cao cấp, diện tích 150-200m², view toàn cảnh',
    },
  ];

  for (const apartmentType of furnitureApartmentTypes) {
    const existing = await prisma.furnitureApartmentType.findFirst({
      where: {
        buildingCode: apartmentType.buildingCode,
        apartmentType: apartmentType.apartmentType,
      },
    });
    if (!existing) {
      await prisma.furnitureApartmentType.create({
        data: apartmentType,
      });
    }
  }

  console.log(`✅ Created ${furnitureApartmentTypes.length} furniture apartment types`);

  // ============================================
  // FURNITURE FEES
  // ============================================

  console.log('💰 Seeding furniture fees...');

  const furnitureFees = [
    {
      name: 'Phí thi công',
      code: 'CONSTRUCTION_FEE',
      type: 'PERCENTAGE',
      value: 15,
      applicability: 'BOTH',
      description: 'Phí thi công lắp đặt nội thất (15% giá trị sản phẩm)',
      isActive: true,
      order: 1,
    },
    {
      name: 'Phí vận chuyển',
      code: 'SHIPPING_FEE',
      type: 'FIXED',
      value: 2000000,
      applicability: 'BOTH',
      description: 'Phí vận chuyển nội thất đến công trình (cố định 2 triệu)',
      isActive: true,
      order: 2,
    },
    {
      name: 'Phí thiết kế',
      code: 'DESIGN_FEE',
      type: 'FIXED',
      value: 5000000,
      applicability: 'CUSTOM',
      description: 'Phí thiết kế nội thất theo yêu cầu riêng (chỉ áp dụng cho đơn hàng tùy chỉnh)',
      isActive: true,
      order: 3,
    },
    {
      name: 'VAT',
      code: 'VAT',
      type: 'PERCENTAGE',
      value: 10,
      applicability: 'BOTH',
      description: 'Thuế giá trị gia tăng 10%',
      isActive: true,
      order: 4,
    },
    {
      name: 'Phí tư vấn',
      code: 'CONSULTATION_FEE',
      type: 'FIXED',
      value: 1000000,
      applicability: 'CUSTOM',
      description: 'Phí tư vấn thiết kế nội thất tại nhà',
      isActive: true,
      order: 5,
    },
    // FIT_IN fee for furniture product mapping feature
    // **Feature: furniture-product-mapping**
    // **Validates: Requirements 4.2**
    {
      name: 'Phí Fit-in',
      code: 'FIT_IN',
      type: 'FIXED',
      value: 500000,
      applicability: 'ALL',
      description: 'Phí làm sản phẩm vừa khít với không gian căn hộ (áp dụng cho từng sản phẩm)',
      isActive: true,
      order: 6,
    },
  ];

  for (const fee of furnitureFees) {
    // Use upsert to handle both new and existing fees
    await prisma.furnitureFee.upsert({
      where: { code: fee.code },
      update: {
        name: fee.name,
        type: fee.type,
        value: fee.value,
        applicability: fee.applicability,
        description: fee.description,
        isActive: fee.isActive,
        order: fee.order,
      },
      create: fee,
    });
  }

  console.log(`✅ Created ${furnitureFees.length} furniture fees`);

  console.log('🎉 Complete seeding finished successfully!');
  console.log('');
  console.log('📊 Final Summary:');
  console.log(`   • ${blogCategories.length} blog categories`);
  console.log(`   • ${blogPosts.length} blog posts`);
  console.log(`   • ${mediaAssets.length} media assets`);
  console.log(`   • ${materialCategories.length} material categories`);
  console.log(`   • ${materials.length} materials`);
  console.log(`   • ${formulas.length} pricing formulas`);
  console.log(`   • ${serviceCategories.length} service categories`);
  console.log(`   • ${unitPrices.length} unit prices`);
  console.log(`   • 1 home page with 9 sections`);
  console.log(`   • ${developers.length} furniture developers`);
  console.log(`   • ${projects.length} furniture projects`);
  console.log(`   • ${buildings.length} furniture buildings`);
  console.log(`   • ${layouts.length} furniture layouts`);
  console.log(`   • ${furnitureApartmentTypes.length} furniture apartment types`);
  console.log(`   • ${furnitureCategories.length} furniture categories`);
  console.log(`   • ${furnitureMaterials.length} furniture materials`);
  console.log(`   • ${furnitureProductBases.length} furniture product bases (NEW SCHEMA)`);
  console.log(`   • ${totalVariants} furniture product variants (NEW SCHEMA)`);
  console.log(`   • ${mappingCount} furniture product mappings (NEW SCHEMA)`);
  console.log(`   • ${furnitureFees.length} furniture fees`);
  console.log('');
  console.log('✨ All systems ready for testing!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
