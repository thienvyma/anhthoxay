import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for ANH THỢ XÂY...');

  // Clear existing data (for fresh seed)
  console.log('🗑️ Clearing existing data...');
  await prisma.section.deleteMany();
  await prisma.blogComment.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blogCategory.deleteMany();
  await prisma.customerLead.deleteMany();
  await prisma.pendingChange.deleteMany();
  await prisma.serviceCategoryMaterialCategory.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.formula.deleteMany();
  await prisma.unitPrice.deleteMany();
  await prisma.material.deleteMany();
  await prisma.materialCategory.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.page.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // 1. USERS
  // ============================================
  console.log('Creating users...');
  
  // Password requirements: min 8 chars (spec requirement 7.3)
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@anhthoxay.vn',
      passwordHash: adminPassword,
      name: 'Admin ATH',
      role: 'ADMIN',
    },
  });

  const adminThienVy = await prisma.user.create({
    data: {
      email: 'thienvyma@gmail.com',
      passwordHash: adminPassword,
      name: 'Thiên Vy',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'quanly@anhthoxay.vn',
      passwordHash: managerPassword,
      name: 'Quản lý',
      role: 'MANAGER',
    },
  });

  console.log(`✅ Created users: ${admin.email}, ${adminThienVy.email}, ${manager.email}`);

  // ============================================
  // 2. FORMULAS (Công thức tính giá)
  // ============================================
  console.log('Creating formulas...');

  const formulaSon = await prisma.formula.create({
    data: {
      name: 'Công thức sơn cơ bản',
      expression: 'DIEN_TICH * DON_GIA_SON',
      description: 'Tính giá sơn = Diện tích × Đơn giá sơn/m²',
    },
  });

  const formulaOpLat = await prisma.formula.create({
    data: {
      name: 'Công thức ốp lát',
      expression: 'DIEN_TICH * DON_GIA_OP_LAT',
      description: 'Tính giá ốp lát = Diện tích × Đơn giá ốp lát/m²',
    },
  });

  const formulaThaoDo = await prisma.formula.create({
    data: {
      name: 'Công thức tháo dỡ',
      expression: 'DIEN_TICH * DON_GIA_THAO_DO',
      description: 'Tính giá tháo dỡ = Diện tích × Đơn giá tháo dỡ/m²',
    },
  });

  const formulaDien = await prisma.formula.create({
    data: {
      name: 'Công thức điện',
      expression: 'SO_DIEM * DON_GIA_DIEM_DIEN',
      description: 'Tính giá điện = Số điểm × Đơn giá/điểm',
    },
  });

  const formulaNuoc = await prisma.formula.create({
    data: {
      name: 'Công thức nước',
      expression: 'SO_DIEM * DON_GIA_DIEM_NUOC',
      description: 'Tính giá nước = Số điểm × Đơn giá/điểm',
    },
  });

  console.log('✅ Created formulas');

  // ============================================
  // 3. UNIT PRICES (Đơn giá thi công)
  // ============================================
  console.log('Creating unit prices...');

  const unitPrices = [
    // Nhân công
    { category: 'Nhân công', name: 'Công sơn tường', price: 35000, tag: 'DON_GIA_SON', unit: 'm²' },
    { category: 'Nhân công', name: 'Công sơn trần', price: 40000, tag: 'DON_GIA_SON_TRAN', unit: 'm²' },
    { category: 'Nhân công', name: 'Công ốp lát gạch nền', price: 120000, tag: 'DON_GIA_OP_LAT', unit: 'm²' },
    { category: 'Nhân công', name: 'Công ốp gạch tường', price: 150000, tag: 'DON_GIA_OP_TUONG', unit: 'm²' },
    { category: 'Nhân công', name: 'Công tháo dỡ', price: 50000, tag: 'DON_GIA_THAO_DO', unit: 'm²' },
    { category: 'Nhân công', name: 'Công thợ điện', price: 400000, tag: 'CONG_THO_DIEN', unit: 'công' },
    { category: 'Nhân công', name: 'Công thợ nước', price: 400000, tag: 'CONG_THO_NUOC', unit: 'công' },
    { category: 'Nhân công', name: 'Công thợ mộc', price: 450000, tag: 'CONG_THO_MOC', unit: 'công' },
    { category: 'Nhân công', name: 'Đơn giá điểm điện', price: 150000, tag: 'DON_GIA_DIEM_DIEN', unit: 'điểm' },
    { category: 'Nhân công', name: 'Đơn giá điểm nước', price: 200000, tag: 'DON_GIA_DIEM_NUOC', unit: 'điểm' },
    // Vật liệu
    { category: 'Vật liệu', name: 'Xi măng', price: 95000, tag: 'XI_MANG', unit: 'bao 50kg' },
    { category: 'Vật liệu', name: 'Cát xây dựng', price: 350000, tag: 'CAT', unit: 'm³' },
    { category: 'Vật liệu', name: 'Gạch xây', price: 1800, tag: 'GACH_XAY', unit: 'viên' },
    { category: 'Vật liệu', name: 'Thép xây dựng', price: 18000, tag: 'THEP', unit: 'kg' },
    { category: 'Vật liệu', name: 'Keo dán gạch', price: 120000, tag: 'KEO_DAN_GACH', unit: 'bao 25kg' },
    // Phụ phí
    { category: 'Phụ phí', name: 'Phí vận chuyển', price: 500000, tag: 'PHI_VAN_CHUYEN', unit: 'chuyến' },
    { category: 'Phụ phí', name: 'Phí dọn dẹp', price: 300000, tag: 'PHI_DON_DEP', unit: 'lần' },
    { category: 'Phụ phí', name: 'Phí quản lý công trình', price: 1000000, tag: 'PHI_QUAN_LY', unit: 'tháng' },
  ];

  for (const up of unitPrices) {
    await prisma.unitPrice.create({ data: up });
  }

  console.log(`✅ Created ${unitPrices.length} unit prices`);


  // ============================================
  // 4. SERVICE CATEGORIES (Hạng mục thi công)
  // ============================================
  console.log('Creating service categories...');

  const scSonTuong = await prisma.serviceCategory.create({
    data: { name: 'Sơn tường', slug: 'son-tuong', description: 'Dịch vụ sơn tường trong nhà và ngoài trời, sơn mới hoặc sơn lại', icon: 'ri-paint-brush-line', coefficient: 1.0, formulaId: formulaSon.id, order: 1 },
  });
  const scOpLat = await prisma.serviceCategory.create({
    data: { name: 'Ốp lát gạch', slug: 'op-lat-gach', description: 'Dịch vụ ốp lát gạch nền, tường nhà tắm, phòng bếp', icon: 'ri-layout-grid-line', coefficient: 1.2, formulaId: formulaOpLat.id, order: 2 },
  });
  // Tháo dỡ - không có material categories (không cần vật dụng)
  await prisma.serviceCategory.create({
    data: { name: 'Tháo dỡ', slug: 'thao-do', description: 'Dịch vụ tháo dỡ, đập phá công trình cũ, dọn dẹp mặt bằng', icon: 'ri-hammer-line', coefficient: 1.0, formulaId: formulaThaoDo.id, order: 3 },
  });
  const scCaiTao = await prisma.serviceCategory.create({
    data: { name: 'Cải tạo căn hộ', slug: 'cai-tao-can-ho', description: 'Dịch vụ cải tạo toàn diện căn hộ chung cư, nhà phố', icon: 'ri-building-2-line', coefficient: 1.5, order: 4 },
  });
  const scDien = await prisma.serviceCategory.create({
    data: { name: 'Điện dân dụng', slug: 'dien-dan-dung', description: 'Dịch vụ sửa chữa, lắp đặt hệ thống điện dân dụng', icon: 'ri-flashlight-line', coefficient: 1.0, formulaId: formulaDien.id, order: 5 },
  });
  const scNuoc = await prisma.serviceCategory.create({
    data: { name: 'Nước sinh hoạt', slug: 'nuoc-sinh-hoat', description: 'Dịch vụ sửa chữa, lắp đặt hệ thống cấp thoát nước', icon: 'ri-drop-line', coefficient: 1.0, formulaId: formulaNuoc.id, order: 6 },
  });
  // Trần thạch cao - chưa có material categories
  await prisma.serviceCategory.create({
    data: { name: 'Trần thạch cao', slug: 'tran-thach-cao', description: 'Dịch vụ làm trần thạch cao, trần giật cấp', icon: 'ri-layout-top-line', coefficient: 1.3, order: 7 },
  });
  const scChongTham = await prisma.serviceCategory.create({
    data: { name: 'Chống thấm', slug: 'chong-tham', description: 'Dịch vụ chống thấm sân thượng, nhà vệ sinh, tường', icon: 'ri-shield-check-line', coefficient: 1.2, order: 8 },
  });

  console.log('✅ Created service categories');

  // ============================================
  // 5. MATERIAL CATEGORIES (Danh mục vật dụng)
  // ============================================
  console.log('Creating material categories...');

  const catSon = await prisma.materialCategory.create({
    data: { name: 'Sơn', slug: 'son', icon: 'ri-paint-brush-line', order: 1, description: 'Các loại sơn tường, sơn gỗ' },
  });
  const catGach = await prisma.materialCategory.create({
    data: { name: 'Gạch', slug: 'gach', icon: 'ri-layout-grid-line', order: 2, description: 'Gạch lát nền, ốp tường' },
  });
  const catThietBiVeSinh = await prisma.materialCategory.create({
    data: { name: 'Thiết bị vệ sinh', slug: 'thiet-bi-ve-sinh', icon: 'ri-drop-line', order: 3, description: 'Bồn cầu, lavabo, vòi sen' },
  });
  const catDien = await prisma.materialCategory.create({
    data: { name: 'Điện', slug: 'dien', icon: 'ri-flashlight-line', order: 4, description: 'Thiết bị điện, đèn, ổ cắm' },
  });
  const catChongTham = await prisma.materialCategory.create({
    data: { name: 'Chống thấm', slug: 'chong-tham', icon: 'ri-shield-check-line', order: 5, description: 'Vật liệu chống thấm' },
  });
  const catNuoc = await prisma.materialCategory.create({
    data: { name: 'Nước', slug: 'nuoc', icon: 'ri-water-flash-line', order: 6, description: 'Thiết bị cấp thoát nước' },
  });

  console.log('✅ Created material categories');

  // ============================================
  // 5.5. SERVICE CATEGORY - MATERIAL CATEGORY RELATIONS
  // ============================================
  console.log('Creating service category - material category relations...');

  await prisma.serviceCategoryMaterialCategory.createMany({
    data: [
      // Sơn tường -> Sơn
      { serviceCategoryId: scSonTuong.id, materialCategoryId: catSon.id },
      // Ốp lát gạch -> Gạch
      { serviceCategoryId: scOpLat.id, materialCategoryId: catGach.id },
      // Cải tạo căn hộ -> Sơn, Gạch, Thiết bị vệ sinh, Điện
      { serviceCategoryId: scCaiTao.id, materialCategoryId: catSon.id },
      { serviceCategoryId: scCaiTao.id, materialCategoryId: catGach.id },
      { serviceCategoryId: scCaiTao.id, materialCategoryId: catThietBiVeSinh.id },
      { serviceCategoryId: scCaiTao.id, materialCategoryId: catDien.id },
      // Điện dân dụng -> Điện
      { serviceCategoryId: scDien.id, materialCategoryId: catDien.id },
      // Nước sinh hoạt -> Thiết bị vệ sinh, Nước
      { serviceCategoryId: scNuoc.id, materialCategoryId: catThietBiVeSinh.id },
      { serviceCategoryId: scNuoc.id, materialCategoryId: catNuoc.id },
      // Chống thấm -> Chống thấm
      { serviceCategoryId: scChongTham.id, materialCategoryId: catChongTham.id },
    ],
  });

  console.log('✅ Created service category - material category relations');

  // ============================================
  // 6. MATERIALS (Vật dụng cơ bản) - With real images
  // ============================================
  console.log('Creating materials...');

  await prisma.material.createMany({
    data: [
      // Sơn
      { name: 'Sơn Dulux Weathershield', categoryId: catSon.id, price: 850000, unit: 'thùng 5L', order: 1, imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop', description: 'Sơn ngoại thất cao cấp' },
      { name: 'Sơn Jotun Essence', categoryId: catSon.id, price: 650000, unit: 'thùng 5L', order: 2, imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop', description: 'Sơn nội thất cao cấp' },
      { name: 'Sơn Nippon Odour-less', categoryId: catSon.id, price: 550000, unit: 'thùng 5L', order: 3, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', description: 'Sơn không mùi' },
      // Gạch
      { name: 'Gạch Viglacera 60x60', categoryId: catGach.id, price: 180000, unit: 'm²', order: 1, imageUrl: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&h=300&fit=crop', description: 'Gạch lát nền cao cấp' },
      { name: 'Gạch men ốp tường', categoryId: catGach.id, price: 150000, unit: 'm²', order: 2, imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop', description: 'Gạch ốp tường' },
      { name: 'Gạch granite 80x80', categoryId: catGach.id, price: 350000, unit: 'm²', order: 3, imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', description: 'Gạch granite cao cấp' },
      // Thiết bị vệ sinh
      { name: 'Bồn cầu TOTO', categoryId: catThietBiVeSinh.id, price: 4500000, unit: 'bộ', order: 1, imageUrl: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&h=300&fit=crop', description: 'Bồn cầu 1 khối cao cấp' },
      { name: 'Lavabo TOTO', categoryId: catThietBiVeSinh.id, price: 2500000, unit: 'bộ', order: 2, imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop', description: 'Chậu rửa mặt cao cấp' },
      { name: 'Vòi sen Grohe', categoryId: catThietBiVeSinh.id, price: 3500000, unit: 'bộ', order: 3, imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=300&fit=crop', description: 'Vòi sen cao cấp' },
      // Điện
      { name: 'Đèn LED âm trần', categoryId: catDien.id, price: 150000, unit: 'cái', order: 1, imageUrl: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&h=300&fit=crop', description: 'Đèn LED 12W' },
      { name: 'Ổ cắm Panasonic', categoryId: catDien.id, price: 85000, unit: 'cái', order: 2, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', description: 'Ổ cắm điện an toàn, chống giật' },
      // Chống thấm
      { name: 'Sika Raintite', categoryId: catChongTham.id, price: 450000, unit: 'thùng 5kg', order: 1, imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop', description: 'Chống thấm sân thượng, nhà vệ sinh' },
      { name: 'Kova CT-11A', categoryId: catChongTham.id, price: 320000, unit: 'thùng 5kg', order: 2, imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop', description: 'Chống thấm tường, trần nhà' },
      // Nước
      { name: 'Ống nước PPR', categoryId: catNuoc.id, price: 45000, unit: 'm', order: 1, imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop', description: 'Ống nước chịu nhiệt' },
      { name: 'Van khóa Inox', categoryId: catNuoc.id, price: 120000, unit: 'cái', order: 2, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', description: 'Van khóa nước inox 304' },
    ],
  });

  console.log('✅ Created materials with images');


  // ============================================
  // 6. BLOG CATEGORIES
  // ============================================
  console.log('Creating blog categories...');

  const blogCats = await prisma.blogCategory.createManyAndReturn({
    data: [
      { name: 'Kiến thức xây dựng', slug: 'kien-thuc-xay-dung', color: '#3B82F6', description: 'Chia sẻ kiến thức về xây dựng, cải tạo nhà' },
      { name: 'Mẹo cải tạo nhà', slug: 'meo-cai-tao-nha', color: '#10B981', description: 'Các mẹo hay khi cải tạo nhà' },
      { name: 'Xu hướng thiết kế', slug: 'xu-huong-thiet-ke', color: '#F59E0B', description: 'Xu hướng thiết kế nội thất mới nhất' },
      { name: 'Dự án hoàn thành', slug: 'du-an-hoan-thanh', color: '#8B5CF6', description: 'Các dự án đã hoàn thành' },
    ],
  });

  console.log('✅ Created blog categories');

  // ============================================
  // 7. BLOG POSTS
  // ============================================
  console.log('Creating blog posts...');

  const catKienThuc = blogCats.find(c => c.slug === 'kien-thuc-xay-dung');
  const catMeo = blogCats.find(c => c.slug === 'meo-cai-tao-nha');
  const catXuHuong = blogCats.find(c => c.slug === 'xu-huong-thiet-ke');
  const catDuAn = blogCats.find(c => c.slug === 'du-an-hoan-thanh');
  
  if (!catKienThuc || !catMeo || !catXuHuong || !catDuAn) {
    throw new Error('Blog categories not found');
  }

  await prisma.blogPost.createMany({
    data: [
      {
        title: '5 Bước Chuẩn Bị Trước Khi Cải Tạo Nhà',
        slug: '5-buoc-chuan-bi-truoc-khi-cai-tao-nha',
        excerpt: 'Hướng dẫn chi tiết các bước chuẩn bị cần thiết trước khi bắt đầu cải tạo nhà để đảm bảo công trình suôn sẻ.',
        content: `# 5 Bước Chuẩn Bị Trước Khi Cải Tạo Nhà

## 1. Xác định nhu cầu và ngân sách
Trước tiên, bạn cần xác định rõ những gì cần cải tạo và ngân sách dự kiến. Hãy liệt kê tất cả các hạng mục cần làm và ưu tiên theo mức độ quan trọng.

## 2. Tìm hiểu và chọn nhà thầu uy tín
Việc chọn nhà thầu uy tín là yếu tố quan trọng quyết định chất lượng công trình. Hãy tham khảo các dự án đã hoàn thành và đánh giá từ khách hàng trước.

## 3. Lên kế hoạch chi tiết
Lập kế hoạch chi tiết về tiến độ, vật liệu, và các mốc thanh toán. Điều này giúp bạn kiểm soát tốt hơn quá trình thi công.

## 4. Chuẩn bị giấy tờ cần thiết
Nếu cải tạo lớn, bạn có thể cần xin phép xây dựng. Hãy tìm hiểu các quy định tại địa phương.

## 5. Sắp xếp nơi ở tạm (nếu cần)
Với những công trình cải tạo lớn, bạn có thể cần chuyển đi tạm thời. Hãy lên kế hoạch trước để không bị động.`,
        categoryId: catKienThuc.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Cách Chọn Sơn Phù Hợp Cho Từng Không Gian',
        slug: 'cach-chon-son-phu-hop-cho-tung-khong-gian',
        excerpt: 'Hướng dẫn chọn loại sơn và màu sắc phù hợp cho phòng khách, phòng ngủ, nhà bếp và nhà tắm.',
        content: `# Cách Chọn Sơn Phù Hợp Cho Từng Không Gian

## Phòng khách
Phòng khách nên chọn sơn có độ bền cao, dễ lau chùi. Màu sắc nên chọn tông trung tính như trắng, be, xám nhạt để tạo cảm giác rộng rãi.

## Phòng ngủ
Phòng ngủ nên chọn sơn có tính năng kháng khuẩn, không mùi. Màu sắc nên chọn tông nhẹ nhàng như xanh pastel, hồng nhạt để tạo cảm giác thư giãn.

## Nhà bếp
Nhà bếp cần sơn chống ẩm, dễ lau chùi. Nên chọn sơn bóng hoặc bán bóng để dễ vệ sinh.

## Nhà tắm
Nhà tắm cần sơn chống thấm, chống nấm mốc. Sơn chuyên dụng cho nhà tắm là lựa chọn tốt nhất.`,
        categoryId: catMeo.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Xu Hướng Thiết Kế Nội Thất 2024',
        slug: 'xu-huong-thiet-ke-noi-that-2024',
        excerpt: 'Khám phá những xu hướng thiết kế nội thất hot nhất năm 2024 cho ngôi nhà của bạn.',
        content: `# Xu Hướng Thiết Kế Nội Thất 2024

## 1. Phong cách tối giản (Minimalism)
Phong cách tối giản tiếp tục là xu hướng chủ đạo với đường nét đơn giản, màu sắc trung tính và không gian thoáng đãng.

## 2. Vật liệu tự nhiên
Gỗ, đá, mây tre đan được ưa chuộng để tạo không gian gần gũi với thiên nhiên.

## 3. Màu xanh lá và màu đất
Các tông màu xanh lá, nâu đất, be được sử dụng nhiều để tạo cảm giác bình yên.

## 4. Nội thất đa năng
Với không gian sống ngày càng nhỏ, nội thất đa năng, tiết kiệm diện tích được ưa chuộng.

## 5. Công nghệ thông minh
Tích hợp công nghệ smart home vào thiết kế nội thất là xu hướng không thể bỏ qua.`,
        categoryId: catXuHuong.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        isFeatured: false,
        publishedAt: new Date(),
      },
      {
        title: 'Dự Án Cải Tạo Căn Hộ 70m2 Tại Quận 7',
        slug: 'du-an-cai-tao-can-ho-70m2-tai-quan-7',
        excerpt: 'Chia sẻ quá trình cải tạo căn hộ 70m2 từ cũ kỹ thành không gian sống hiện đại, tiện nghi.',
        content: `# Dự Án Cải Tạo Căn Hộ 70m2 Tại Quận 7

## Thông tin dự án
- **Diện tích:** 70m²
- **Địa điểm:** Quận 7, TP.HCM
- **Thời gian thi công:** 45 ngày
- **Chi phí:** 180 triệu đồng

## Hạng mục cải tạo
1. Tháo dỡ toàn bộ nội thất cũ
2. Sơn lại toàn bộ tường
3. Ốp lát gạch phòng khách và phòng ngủ
4. Cải tạo nhà tắm
5. Làm mới hệ thống điện

## Kết quả
Căn hộ được cải tạo hoàn toàn mới với phong cách hiện đại, tối giản. Khách hàng rất hài lòng với kết quả.`,
        categoryId: catDuAn.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Kinh Nghiệm Chống Thấm Sân Thượng Hiệu Quả',
        slug: 'kinh-nghiem-chong-tham-san-thuong-hieu-qua',
        excerpt: 'Chia sẻ kinh nghiệm chống thấm sân thượng đúng cách, bền vững theo thời gian.',
        content: `# Kinh Nghiệm Chống Thấm Sân Thượng Hiệu Quả

## Nguyên nhân thấm sân thượng
- Bề mặt bê tông bị nứt
- Lớp chống thấm cũ bị xuống cấp
- Thi công không đúng kỹ thuật

## Quy trình chống thấm chuẩn
1. Vệ sinh bề mặt sạch sẽ
2. Xử lý các vết nứt
3. Thi công lớp lót
4. Thi công lớp chống thấm chính
5. Thi công lớp bảo vệ

## Lưu ý quan trọng
- Chọn vật liệu chống thấm chất lượng
- Thi công trong thời tiết khô ráo
- Đảm bảo độ dốc thoát nước`,
        categoryId: catKienThuc.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        isFeatured: false,
        publishedAt: new Date(),
      },
    ],
  });

  console.log('✅ Created blog posts');


  // ============================================
  // 8. PAGES
  // ============================================
  console.log('Creating pages...');

  const homePage = await prisma.page.create({
    data: {
      slug: 'home',
      title: 'Anh Thợ Xây - Dịch vụ cải tạo nhà chuyên nghiệp',
      headerConfig: JSON.stringify({
        logo: { text: 'Anh Thợ Xây', icon: 'ri-building-2-fill' },
        links: [
          { label: 'Trang chủ', href: '/', icon: 'ri-home-4-line' },
          { label: 'Báo giá', href: '/bao-gia', icon: 'ri-calculator-line' },
          { label: 'Giới thiệu', href: '/about', icon: 'ri-information-line' },
          { label: 'Blog', href: '/blog', icon: 'ri-article-line' },
          { label: 'Liên hệ', href: '/contact', icon: 'ri-map-pin-line' },
        ],
        ctaButton: { text: 'Báo giá ngay', href: '/bao-gia', icon: 'ri-phone-line' },
      }),
      footerConfig: JSON.stringify({
        brand: { text: 'Anh Thợ Xây', icon: 'ri-building-2-fill', description: 'Dịch vụ cải tạo nhà chuyên nghiệp' },
        quickLinks: [
          { label: 'Giới thiệu', href: '/about' },
          { label: 'Báo giá', href: '/bao-gia' },
          { label: 'Blog', href: '/blog' },
          { label: 'Liên hệ', href: '/contact' },
        ],
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com/anhthoxay', icon: 'ri-facebook-fill' },
          { platform: 'youtube', url: 'https://youtube.com/@anhthoxay', icon: 'ri-youtube-fill' },
          { platform: 'tiktok', url: 'https://tiktok.com/@anhthoxay', icon: 'ri-tiktok-fill' },
        ],
        copyright: { text: '© 2024 Anh Thợ Xây. All rights reserved.' },
      }),
    },
  });

  const aboutPage = await prisma.page.create({
    data: { slug: 'about', title: 'Giới thiệu - Anh Thợ Xây' },
  });

  const contactPage = await prisma.page.create({
    data: { slug: 'contact', title: 'Liên hệ - Anh Thợ Xây' },
  });

  const galleryPage = await prisma.page.create({
    data: { slug: 'gallery', title: 'Dự án - Anh Thợ Xây' },
  });

  const blogPage = await prisma.page.create({
    data: { slug: 'blog', title: 'Blog - Kiến thức xây dựng' },
  });

  await prisma.page.createMany({
    data: [
      { slug: 'bao-gia', title: 'Báo giá & Dự toán' },
      { slug: 'chinh-sach', title: 'Chính sách bảo hành' },
    ],
  });

  console.log('✅ Created pages');

  // ============================================
  // 9. SECTIONS for Home Page
  // ============================================
  console.log('Creating sections for Home page...');

  await prisma.section.createMany({
    data: [
      {
        pageId: homePage.id,
        kind: 'HERO',
        order: 1,
        data: JSON.stringify({
          title: 'Anh Thợ Xây',
          subtitle: 'Dịch vụ cải tạo nhà & căn hộ chuyên nghiệp tại TP.HCM. Uy tín - Chất lượng - Giá hợp lý',
          ctaText: 'Nhận báo giá ngay',
          ctaLink: '/bao-gia',
          secondaryCtaText: 'Xem dự án',
          secondaryCtaLink: '/gallery',
          overlayOpacity: 0.6,
          backgroundImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920',
        }),
      },
      {
        pageId: homePage.id,
        kind: 'FEATURES',
        order: 2,
        data: JSON.stringify({
          title: 'Dịch vụ của chúng tôi',
          subtitle: 'Giải pháp toàn diện cho ngôi nhà của bạn',
          features: [
            { icon: 'ri-paint-brush-line', title: 'Sơn tường', description: 'Sơn mới, sơn lại tường trong nhà và ngoài trời với các loại sơn cao cấp' },
            { icon: 'ri-layout-grid-line', title: 'Ốp lát gạch', description: 'Ốp lát gạch nền, tường với đa dạng mẫu mã, chất liệu' },
            { icon: 'ri-hammer-line', title: 'Tháo dỡ', description: 'Tháo dỡ, đập phá công trình cũ, dọn dẹp mặt bằng nhanh chóng' },
            { icon: 'ri-building-2-line', title: 'Cải tạo căn hộ', description: 'Cải tạo toàn diện căn hộ chung cư, nhà phố theo yêu cầu' },
            { icon: 'ri-flashlight-line', title: 'Điện dân dụng', description: 'Sửa chữa, lắp đặt hệ thống điện an toàn, đạt chuẩn' },
            { icon: 'ri-drop-line', title: 'Nước sinh hoạt', description: 'Sửa chữa, lắp đặt hệ thống cấp thoát nước chuyên nghiệp' },
          ],
          layout: 'grid',
        }),
      },
      {
        pageId: homePage.id,
        kind: 'STATS',
        order: 3,
        data: JSON.stringify({
          title: 'Thành tựu của chúng tôi',
          subtitle: 'Con số nói lên tất cả',
          stats: [
            { icon: 'ri-calendar-line', value: 10, label: 'Năm kinh nghiệm', suffix: '+' },
            { icon: 'ri-home-line', value: 500, label: 'Dự án hoàn thành', suffix: '+' },
            { icon: 'ri-user-smile-line', value: 98, label: 'Khách hàng hài lòng', suffix: '%' },
            { icon: 'ri-team-line', value: 30, label: 'Thợ lành nghề', suffix: '+' },
          ],
        }),
      },
      {
        pageId: homePage.id,
        kind: 'TESTIMONIALS',
        order: 4,
        data: JSON.stringify({
          title: 'Khách hàng nói gì về chúng tôi',
          testimonials: [
            { name: 'Anh Minh', role: 'Chủ căn hộ Q7', content: 'Đội ngũ làm việc rất chuyên nghiệp, đúng tiến độ. Tôi rất hài lòng với kết quả cải tạo căn hộ.', rating: 5 },
            { name: 'Chị Hương', role: 'Chủ nhà Q1', content: 'Giá cả hợp lý, thợ tay nghề cao. Sẽ giới thiệu cho bạn bè.', rating: 5 },
            { name: 'Anh Tuấn', role: 'Chủ căn hộ Bình Thạnh', content: 'Tư vấn nhiệt tình, báo giá rõ ràng, không phát sinh chi phí. Rất đáng tin cậy!', rating: 5 },
          ],
        }),
      },
      {
        pageId: homePage.id,
        kind: 'CTA',
        order: 5,
        data: JSON.stringify({
          title: 'Bạn cần báo giá?',
          description: 'Nhận dự toán chi phí miễn phí chỉ trong 2 phút. Không cam kết, không ràng buộc.',
          buttonText: 'Dự toán ngay',
          buttonLink: '/bao-gia',
        }),
      },
      {
        pageId: homePage.id,
        kind: 'FAB_ACTIONS',
        order: 99,
        data: JSON.stringify({
          mainIcon: 'ri-customer-service-2-line',
          mainColor: '#E87A00',
          actions: [
            { icon: 'ri-phone-line', label: 'Gọi ngay', href: 'tel:0909123456', color: '#10B981' },
            { icon: 'ri-message-3-line', label: 'Zalo', href: 'https://zalo.me/0909123456', color: '#0068FF' },
            { icon: 'ri-facebook-fill', label: 'Facebook', href: 'https://facebook.com/anhthoxay', color: '#1877F2' },
          ],
        }),
      },
    ],
  });

  console.log('✅ Created Home page sections');


  // ============================================
  // 10. SECTIONS for About Page
  // ============================================
  console.log('Creating sections for About page...');

  await prisma.section.createMany({
    data: [
      {
        pageId: aboutPage.id,
        kind: 'HERO_SIMPLE',
        order: 1,
        data: JSON.stringify({
          title: 'Về Anh Thợ Xây',
          subtitle: 'Đối tác tin cậy cho mọi công trình cải tạo nhà của bạn',
        }),
      },
      {
        pageId: aboutPage.id,
        kind: 'RICH_TEXT',
        order: 2,
        data: JSON.stringify({
          content: `## Câu chuyện của chúng tôi

**Anh Thợ Xây** được thành lập từ năm 2014 với sứ mệnh mang đến dịch vụ cải tạo nhà chất lượng cao, giá cả hợp lý cho mọi gia đình tại TP.HCM.

Xuất phát từ một đội thợ nhỏ với niềm đam mê xây dựng, chúng tôi đã không ngừng phát triển và hoàn thiện để trở thành đơn vị cải tạo nhà uy tín hàng đầu.

### Tầm nhìn
Trở thành đơn vị cải tạo nhà được yêu thích nhất tại Việt Nam, nơi mọi gia đình đều có thể biến ngôi nhà mơ ước thành hiện thực.

### Sứ mệnh
Mang đến dịch vụ cải tạo nhà chuyên nghiệp, minh bạch về giá cả, đảm bảo chất lượng và tiến độ cho mọi khách hàng.`,
        }),
      },
      {
        pageId: aboutPage.id,
        kind: 'CORE_VALUES',
        order: 3,
        data: JSON.stringify({
          title: 'Giá trị cốt lõi',
          values: [
            { icon: 'ri-shield-check-line', title: 'Uy tín', description: 'Cam kết thực hiện đúng những gì đã hứa với khách hàng' },
            { icon: 'ri-award-line', title: 'Chất lượng', description: 'Sử dụng vật liệu tốt, thi công đúng kỹ thuật' },
            { icon: 'ri-money-dollar-circle-line', title: 'Giá hợp lý', description: 'Báo giá minh bạch, không phát sinh chi phí' },
            { icon: 'ri-time-line', title: 'Đúng tiến độ', description: 'Cam kết hoàn thành đúng thời gian đã thỏa thuận' },
          ],
        }),
      },
      {
        pageId: aboutPage.id,
        kind: 'STATS',
        order: 4,
        data: JSON.stringify({
          title: 'Thành tựu',
          stats: [
            { icon: 'ri-calendar-line', value: 10, label: 'Năm kinh nghiệm', suffix: '+' },
            { icon: 'ri-home-line', value: 500, label: 'Dự án hoàn thành', suffix: '+' },
            { icon: 'ri-user-smile-line', value: 98, label: 'Khách hàng hài lòng', suffix: '%' },
            { icon: 'ri-team-line', value: 30, label: 'Thợ lành nghề', suffix: '+' },
          ],
        }),
      },
    ],
  });

  console.log('✅ Created About page sections');

  // ============================================
  // 11. SECTIONS for Contact Page
  // ============================================
  console.log('Creating sections for Contact page...');

  await prisma.section.createMany({
    data: [
      {
        pageId: contactPage.id,
        kind: 'HERO_SIMPLE',
        order: 1,
        data: JSON.stringify({
          title: 'Liên hệ với chúng tôi',
          subtitle: 'Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn',
        }),
      },
      {
        pageId: contactPage.id,
        kind: 'CONTACT_INFO',
        order: 2,
        data: JSON.stringify({
          title: 'Thông tin liên hệ',
          items: [
            { icon: 'ri-map-pin-line', label: 'Địa chỉ', value: '123 Đường ABC, Quận 1, TP.HCM' },
            { icon: 'ri-phone-line', label: 'Điện thoại', value: '0909 123 456', href: 'tel:0909123456' },
            { icon: 'ri-mail-line', label: 'Email', value: 'contact@anhthoxay.vn', href: 'mailto:contact@anhthoxay.vn' },
            { icon: 'ri-time-line', label: 'Giờ làm việc', value: 'T2 - T7: 8:00 - 18:00' },
          ],
          mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4241674197956!2d106.69765841533417!3d10.778789792319695!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4670702e31%3A0xa5777fb3a5bb9972!2zQuG6v24gTmjDoCBSb25n!5e0!3m2!1svi!2s!4v1234567890',
        }),
      },
      {
        pageId: contactPage.id,
        kind: 'QUICK_CONTACT',
        order: 3,
        data: JSON.stringify({
          title: 'Gửi yêu cầu tư vấn',
          subtitle: 'Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại trong vòng 24h',
          fields: ['name', 'phone', 'email', 'message'],
          submitText: 'Gửi yêu cầu',
        }),
      },
    ],
  });

  console.log('✅ Created Contact page sections');

  // ============================================
  // 12. SECTIONS for Gallery Page
  // ============================================
  console.log('Creating sections for Gallery page...');

  await prisma.section.createMany({
    data: [
      {
        pageId: galleryPage.id,
        kind: 'HERO_SIMPLE',
        order: 1,
        data: JSON.stringify({
          title: 'Dự án đã hoàn thành',
          subtitle: 'Khám phá các công trình cải tạo nhà tiêu biểu của chúng tôi',
        }),
      },
      {
        pageId: galleryPage.id,
        kind: 'GALLERY',
        order: 2,
        data: JSON.stringify({
          title: 'Hình ảnh dự án',
          images: [
            { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', caption: 'Cải tạo căn hộ Q7 - Phòng khách', category: 'Căn hộ' },
            { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', caption: 'Cải tạo căn hộ Q7 - Phòng ngủ', category: 'Căn hộ' },
            { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', caption: 'Sơn tường nhà phố Q1', category: 'Sơn tường' },
            { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', caption: 'Ốp lát gạch nhà tắm', category: 'Ốp lát' },
            { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', caption: 'Cải tạo nhà bếp', category: 'Nhà bếp' },
            { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', caption: 'Cải tạo nhà phố Bình Thạnh', category: 'Nhà phố' },
          ],
          layout: 'masonry',
        }),
      },
    ],
  });

  console.log('✅ Created Gallery page sections');

  // ============================================
  // 12.5. SECTIONS for Blog Page
  // ============================================
  console.log('Creating sections for Blog page...');

  await prisma.section.createMany({
    data: [
      {
        pageId: blogPage.id,
        kind: 'HERO_SIMPLE',
        order: 1,
        data: JSON.stringify({
          title: 'Blog & Kiến thức',
          subtitle: 'Chia sẻ kinh nghiệm, mẹo hay về cải tạo nhà và xu hướng thiết kế',
        }),
      },
      {
        pageId: blogPage.id,
        kind: 'BLOG_LIST',
        order: 2,
        data: JSON.stringify({
          title: 'Bài viết mới nhất',
          showCategories: true,
          postsPerPage: 9,
          layout: 'grid',
        }),
      },
    ],
  });

  console.log('✅ Created Blog page sections');


  // ============================================
  // 13. SETTINGS
  // ============================================
  console.log('Creating settings...');

  await prisma.settings.createMany({
    data: [
      {
        key: 'company',
        value: JSON.stringify({
          name: 'Anh Thợ Xây',
          description: 'Dịch vụ cải tạo nhà & căn hộ chuyên nghiệp tại TP.HCM',
          address: '123 Đường ABC, Quận 1, TP.HCM',
          phone: '0909 123 456',
          email: 'contact@anhthoxay.vn',
          taxCode: '0123456789',
          workingHours: 'T2 - T7: 8:00 - 18:00',
        }),
      },
      {
        key: 'floating_cta',
        value: JSON.stringify({
          enabled: true,
          phone: { enabled: true, number: '0909123456' },
          zalo: { enabled: true, url: 'https://zalo.me/0909123456' },
          messenger: { enabled: false, url: '' },
          fanpage: { enabled: true, url: 'https://facebook.com/anhthoxay' },
        }),
      },
      {
        key: 'social',
        value: JSON.stringify({
          facebook: 'https://facebook.com/anhthoxay',
          youtube: 'https://youtube.com/@anhthoxay',
          tiktok: 'https://tiktok.com/@anhthoxay',
          zalo: 'https://zalo.me/0909123456',
        }),
      },
      {
        key: 'seo',
        value: JSON.stringify({
          title: 'Anh Thợ Xây - Dịch vụ cải tạo nhà chuyên nghiệp tại TP.HCM',
          description: 'Dịch vụ cải tạo nhà, căn hộ chuyên nghiệp. Sơn tường, ốp lát gạch, điện nước, chống thấm. Uy tín - Chất lượng - Giá hợp lý.',
          keywords: 'cải tạo nhà, sửa nhà, sơn tường, ốp lát gạch, điện nước, chống thấm, TP.HCM',
        }),
      },
      {
        key: 'quote_settings',
        value: JSON.stringify({
          minArea: 1,
          maxArea: 10000,
          vatRate: 0.1,
          discountThreshold: 50000000,
          discountRate: 0.05,
          warrantyMonths: 12,
        }),
      },
    ],
  });

  console.log('✅ Created settings');

  // ============================================
  // 14. SAMPLE CUSTOMER LEADS
  // ============================================
  console.log('Creating sample customer leads...');

  await prisma.customerLead.createMany({
    data: [
      {
        name: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'nguyenvanan@gmail.com',
        content: 'Cần sơn lại căn hộ 70m2 tại Quận 7, 2 phòng ngủ, 1 phòng khách',
        source: 'QUOTE_FORM',
        status: 'NEW',
        quoteData: JSON.stringify({
          items: [{ categoryName: 'Sơn tường', area: 70, subtotal: 2450000 }],
          grandTotal: 2450000,
        }),
      },
      {
        name: 'Trần Thị Bình',
        phone: '0912345678',
        email: 'tranthib@gmail.com',
        content: 'Muốn ốp lát gạch phòng khách 30m2 và nhà tắm 8m2',
        source: 'QUOTE_FORM',
        status: 'CONTACTED',
        notes: 'Đã gọi điện tư vấn, khách hẹn khảo sát thứ 7',
      },
      {
        name: 'Lê Văn Cường',
        phone: '0923456789',
        content: 'Cần cải tạo toàn bộ căn hộ 85m2 tại Bình Thạnh',
        source: 'CONTACT_FORM',
        status: 'NEW',
      },
      {
        name: 'Phạm Thị Dung',
        phone: '0934567890',
        email: 'phamthid@gmail.com',
        content: 'Sửa chữa hệ thống điện nước căn hộ',
        source: 'CONTACT_FORM',
        status: 'CONVERTED',
        notes: 'Đã ký hợp đồng, thi công tuần sau',
      },
      {
        name: 'Hoàng Văn Em',
        phone: '0945678901',
        content: 'Chống thấm sân thượng 40m2',
        source: 'QUOTE_FORM',
        status: 'CANCELLED',
        notes: 'Khách hủy do chưa có ngân sách',
      },
    ],
  });

  console.log('✅ Created sample leads');

  // ============================================
  // 15. MEDIA ASSETS (Sample images)
  // ============================================
  console.log('Creating media assets...');

  await prisma.mediaAsset.createMany({
    data: [
      {
        url: '/uploads/project-1.jpg',
        alt: 'Cải tạo căn hộ Q7',
        caption: 'Dự án cải tạo căn hộ 70m2 tại Quận 7',
        tags: 'căn hộ,cải tạo,Q7',
        displayOrder: 1,
      },
      {
        url: '/uploads/project-2.jpg',
        alt: 'Sơn tường nhà phố',
        caption: 'Sơn tường nhà phố 3 tầng tại Quận 1',
        tags: 'sơn tường,nhà phố,Q1',
        displayOrder: 2,
      },
      {
        url: '/uploads/project-3.jpg',
        alt: 'Ốp lát gạch',
        caption: 'Ốp lát gạch phòng khách và nhà tắm',
        tags: 'ốp lát,gạch,phòng khách',
        displayOrder: 3,
      },
    ],
  });

  console.log('✅ Created media assets');

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   Admin: admin@anhthoxay.vn / admin123');
  console.log('   Manager: quanly@anhthoxay.vn / manager123');
  console.log('');
  console.log('📊 Data summary:');
  console.log('   - 2 Users (Admin + Manager)');
  console.log('   - 5 Formulas');
  console.log('   - 18 Unit Prices');
  console.log('   - 8 Service Categories');
  console.log('   - 14 Materials');
  console.log('   - 4 Blog Categories');
  console.log('   - 5 Blog Posts');
  console.log('   - 7 Pages with Sections');
  console.log('   - 5 Settings');
  console.log('   - 5 Sample Leads');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
