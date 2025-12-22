/**
 * Complete Seed Data for ANH THỢ XÂY
 * 
 * Includes all modules:
 * - Auth & Users (Admin, Manager, Homeowner, Contractor)
 * - CMS (Pages, Sections for Landing)
 * - Blog (Categories, Posts)
 * - Pricing (Formulas, Unit Prices, Service Categories, Materials)
 * - Bidding (Regions, Settings, Service Fees)
 * - Interior (Developers, Developments, Buildings, Layouts, Packages)
 * 
 * Run: pnpm db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️ Clearing existing data...');
  
  // Delete in correct order to avoid foreign key constraints
  // Phase 5-6: Reviews, Rankings, Badges
  await prisma.reviewHelpfulness.deleteMany();
  await prisma.reviewReport.deleteMany();
  await prisma.review.deleteMany();
  await prisma.contractorBadge.deleteMany();
  await prisma.contractorRanking.deleteMany();
  
  // Phase 4: Chat, Notifications
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.scheduledNotification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  
  // Phase 3: Matching, Escrow, Fees
  await prisma.projectMilestone.deleteMany();
  await prisma.feeTransaction.deleteMany();
  await prisma.escrow.deleteMany();
  await prisma.savedProject.deleteMany();
  
  // Phase 2: Bids, Projects
  await prisma.bid.deleteMany();
  await prisma.project.deleteMany();
  
  // Phase 1: Contractors, Regions
  await prisma.contractorProfile.deleteMany();
  await prisma.serviceFee.deleteMany();
  await prisma.biddingSettings.deleteMany();
  await prisma.region.deleteMany();
  
  // Interior module
  await prisma.interiorQuote.deleteMany();
  await prisma.interiorFurnitureItem.deleteMany();
  await prisma.interiorFurnitureCategory.deleteMany();
  await prisma.interiorPackage.deleteMany();
  await prisma.interiorBuildingUnit.deleteMany();
  await prisma.interiorUnitLayout.deleteMany();
  await prisma.interiorBuilding.deleteMany();
  await prisma.interiorDevelopment.deleteMany();
  await prisma.interiorDeveloper.deleteMany();
  await prisma.interiorRoomType.deleteMany();
  await prisma.interiorSurcharge.deleteMany();
  await prisma.interiorQuoteSettings.deleteMany();
  
  // Core content
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
  
  // Auth
  await prisma.auditLog.deleteMany();
  await prisma.tokenBlacklist.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Database cleared');
}

async function seedUsers() {
  console.log('\n👥 Creating users...');
  
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@anhthoxay.vn',
      passwordHash: adminPassword,
      name: 'Admin ATH',
      phone: '0909000001',
      role: 'ADMIN',
    },
  });

  const adminThienVy = await prisma.user.create({
    data: {
      email: 'thienvyma@gmail.com',
      passwordHash: adminPassword,
      name: 'Thiên Vy',
      phone: '0909000002',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'quanly@anhthoxay.vn',
      passwordHash: managerPassword,
      name: 'Quản lý ATH',
      phone: '0909000003',
      role: 'MANAGER',
    },
  });

  // Homeowner users
  const homeowner1 = await prisma.user.create({
    data: {
      email: 'chunha1@gmail.com',
      passwordHash: userPassword,
      name: 'Nguyễn Văn Minh',
      phone: '0909100001',
      role: 'HOMEOWNER',
    },
  });

  const homeowner2 = await prisma.user.create({
    data: {
      email: 'chunha2@gmail.com',
      passwordHash: userPassword,
      name: 'Trần Thị Hương',
      phone: '0909100002',
      role: 'HOMEOWNER',
    },
  });

  // Contractor users
  const contractor1 = await prisma.user.create({
    data: {
      email: 'nhathau1@gmail.com',
      passwordHash: userPassword,
      name: 'Công ty TNHH Xây Dựng Hoàng Long',
      phone: '0909200001',
      role: 'CONTRACTOR',
      companyName: 'Công ty TNHH Xây Dựng Hoàng Long',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      rating: 4.8,
      totalProjects: 25,
    },
  });

  const contractor2 = await prisma.user.create({
    data: {
      email: 'nhathau2@gmail.com',
      passwordHash: userPassword,
      name: 'Đội Thợ Anh Tuấn',
      phone: '0909200002',
      role: 'CONTRACTOR',
      companyName: 'Đội Thợ Anh Tuấn',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      rating: 4.5,
      totalProjects: 15,
    },
  });

  const contractor3 = await prisma.user.create({
    data: {
      email: 'nhathau3@gmail.com',
      passwordHash: userPassword,
      name: 'Nhà Thầu Mới',
      phone: '0909200003',
      role: 'CONTRACTOR',
      verificationStatus: 'PENDING',
    },
  });

  // Create contractor profiles
  await prisma.contractorProfile.createMany({
    data: [
      {
        userId: contractor1.id,
        description: 'Chuyên cải tạo căn hộ chung cư, nhà phố với hơn 10 năm kinh nghiệm',
        experience: 10,
        specialties: JSON.stringify(['Sơn tường', 'Ốp lát', 'Điện nước']),
        portfolioImages: JSON.stringify([
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
        ]),
      },
      {
        userId: contractor2.id,
        description: 'Đội thợ lành nghề, chuyên sơn tường và chống thấm',
        experience: 5,
        specialties: JSON.stringify(['Sơn tường', 'Chống thấm']),
      },
      {
        userId: contractor3.id,
        description: 'Nhà thầu mới, đang chờ xác minh',
        experience: 2,
      },
    ],
  });

  console.log(`✅ Created ${8} users (2 admin, 1 manager, 2 homeowner, 3 contractor)`);
  
  return { admin, adminThienVy, manager, homeowner1, homeowner2, contractor1, contractor2, contractor3 };
}

async function seedRegions() {
  console.log('\n🗺️ Creating regions...');
  
  const hcm = await prisma.region.create({
    data: {
      name: 'TP. Hồ Chí Minh',
      slug: 'ho-chi-minh',
      level: 1,
      isActive: true,
      order: 1,
    },
  });

  const districts = [
    { name: 'Quận 1', slug: 'quan-1', order: 1 },
    { name: 'Quận 3', slug: 'quan-3', order: 2 },
    { name: 'Quận 7', slug: 'quan-7', order: 3 },
    { name: 'Quận Bình Thạnh', slug: 'binh-thanh', order: 4 },
    { name: 'Quận Gò Vấp', slug: 'go-vap', order: 5 },
    { name: 'Quận Tân Bình', slug: 'tan-binh', order: 6 },
    { name: 'Quận Phú Nhuận', slug: 'phu-nhuan', order: 7 },
    { name: 'TP. Thủ Đức', slug: 'thu-duc', order: 8 },
  ];

  const createdDistricts = await Promise.all(
    districts.map(d => prisma.region.create({
      data: {
        name: d.name,
        slug: d.slug,
        parentId: hcm.id,
        level: 2,
        isActive: true,
        order: d.order,
      },
    }))
  );

  console.log(`✅ Created ${districts.length + 1} regions`);
  return { hcm, districts: createdDistricts };
}

async function seedBiddingSettings() {
  console.log('\n⚙️ Creating bidding settings...');
  
  await prisma.biddingSettings.create({
    data: {
      id: 'default',
      maxBidsPerProject: 20,
      defaultBidDuration: 7,
      minBidDuration: 3,
      maxBidDuration: 30,
      escrowPercentage: 10,
      escrowMinAmount: 1000000,
      verificationFee: 500000,
      winFeePercentage: 5,
      autoApproveHomeowner: true,
      autoApproveProject: false,
    },
  });

  const serviceFees = [
    { name: 'Phí xác minh nhà thầu', code: 'VERIFICATION_FEE', type: 'FIXED', value: 500000, description: 'Phí một lần khi xác minh tài khoản nhà thầu' },
    { name: 'Phí thắng thầu', code: 'WIN_FEE', type: 'PERCENTAGE', value: 5, description: 'Phí tính trên giá trị hợp đồng khi thắng thầu (5%)' },
    { name: 'Phí nổi bật', code: 'FEATURED_FEE', type: 'FIXED', value: 200000, description: 'Phí hiển thị nổi bật trên trang chủ (theo tháng)' },
  ];

  await prisma.serviceFee.createMany({ data: serviceFees });

  console.log('✅ Created bidding settings and service fees');
}

async function seedFormulasAndPricing() {
  console.log('\n📊 Creating formulas and pricing...');

  // Formulas
  const formulaSon = await prisma.formula.create({
    data: { name: 'Công thức sơn cơ bản', expression: 'DIEN_TICH * DON_GIA_SON', description: 'Tính giá sơn = Diện tích × Đơn giá sơn/m²' },
  });
  const formulaOpLat = await prisma.formula.create({
    data: { name: 'Công thức ốp lát', expression: 'DIEN_TICH * DON_GIA_OP_LAT', description: 'Tính giá ốp lát = Diện tích × Đơn giá ốp lát/m²' },
  });
  const formulaThaoDo = await prisma.formula.create({
    data: { name: 'Công thức tháo dỡ', expression: 'DIEN_TICH * DON_GIA_THAO_DO', description: 'Tính giá tháo dỡ = Diện tích × Đơn giá tháo dỡ/m²' },
  });
  const formulaDien = await prisma.formula.create({
    data: { name: 'Công thức điện', expression: 'SO_DIEM * DON_GIA_DIEM_DIEN', description: 'Tính giá điện = Số điểm × Đơn giá/điểm' },
  });
  const formulaNuoc = await prisma.formula.create({
    data: { name: 'Công thức nước', expression: 'SO_DIEM * DON_GIA_DIEM_NUOC', description: 'Tính giá nước = Số điểm × Đơn giá/điểm' },
  });

  // Unit Prices
  const unitPrices = [
    { category: 'Nhân công', name: 'Công sơn tường', price: 35000, tag: 'DON_GIA_SON', unit: 'm²' },
    { category: 'Nhân công', name: 'Công ốp lát gạch nền', price: 120000, tag: 'DON_GIA_OP_LAT', unit: 'm²' },
    { category: 'Nhân công', name: 'Công tháo dỡ', price: 50000, tag: 'DON_GIA_THAO_DO', unit: 'm²' },
    { category: 'Nhân công', name: 'Đơn giá điểm điện', price: 150000, tag: 'DON_GIA_DIEM_DIEN', unit: 'điểm' },
    { category: 'Nhân công', name: 'Đơn giá điểm nước', price: 200000, tag: 'DON_GIA_DIEM_NUOC', unit: 'điểm' },
    { category: 'Vật liệu', name: 'Xi măng', price: 95000, tag: 'XI_MANG', unit: 'bao 50kg' },
    { category: 'Vật liệu', name: 'Cát xây dựng', price: 350000, tag: 'CAT', unit: 'm³' },
    { category: 'Phụ phí', name: 'Phí vận chuyển', price: 500000, tag: 'PHI_VAN_CHUYEN', unit: 'chuyến' },
  ];
  await prisma.unitPrice.createMany({ data: unitPrices });

  // Material Categories
  const catSon = await prisma.materialCategory.create({ data: { name: 'Sơn', slug: 'son', icon: 'ri-paint-brush-line', order: 1 } });
  const catGach = await prisma.materialCategory.create({ data: { name: 'Gạch', slug: 'gach', icon: 'ri-layout-grid-line', order: 2 } });
  const catThietBiVeSinh = await prisma.materialCategory.create({ data: { name: 'Thiết bị vệ sinh', slug: 'thiet-bi-ve-sinh', icon: 'ri-drop-line', order: 3 } });
  const catDien = await prisma.materialCategory.create({ data: { name: 'Điện', slug: 'dien', icon: 'ri-flashlight-line', order: 4 } });
  const catChongTham = await prisma.materialCategory.create({ data: { name: 'Chống thấm', slug: 'chong-tham', icon: 'ri-shield-check-line', order: 5 } });

  // Service Categories
  const scSonTuong = await prisma.serviceCategory.create({
    data: { name: 'Sơn tường', slug: 'son-tuong', description: 'Dịch vụ sơn tường trong nhà và ngoài trời', icon: 'ri-paint-brush-line', coefficient: 1.0, formulaId: formulaSon.id, order: 1 },
  });
  const scOpLat = await prisma.serviceCategory.create({
    data: { name: 'Ốp lát gạch', slug: 'op-lat-gach', description: 'Dịch vụ ốp lát gạch nền, tường', icon: 'ri-layout-grid-line', coefficient: 1.2, formulaId: formulaOpLat.id, order: 2 },
  });
  await prisma.serviceCategory.create({
    data: { name: 'Tháo dỡ', slug: 'thao-do', description: 'Dịch vụ tháo dỡ, đập phá công trình cũ', icon: 'ri-hammer-line', coefficient: 1.0, formulaId: formulaThaoDo.id, order: 3 },
  });
  const scCaiTao = await prisma.serviceCategory.create({
    data: { name: 'Cải tạo căn hộ', slug: 'cai-tao-can-ho', description: 'Dịch vụ cải tạo toàn diện căn hộ', icon: 'ri-building-2-line', coefficient: 1.5, order: 4 },
  });
  const scDien = await prisma.serviceCategory.create({
    data: { name: 'Điện dân dụng', slug: 'dien-dan-dung', description: 'Dịch vụ sửa chữa, lắp đặt hệ thống điện', icon: 'ri-flashlight-line', coefficient: 1.0, formulaId: formulaDien.id, order: 5 },
  });
  const scNuoc = await prisma.serviceCategory.create({
    data: { name: 'Nước sinh hoạt', slug: 'nuoc-sinh-hoat', description: 'Dịch vụ sửa chữa, lắp đặt hệ thống nước', icon: 'ri-drop-line', coefficient: 1.0, formulaId: formulaNuoc.id, order: 6 },
  });
  const scChongTham = await prisma.serviceCategory.create({
    data: { name: 'Chống thấm', slug: 'chong-tham', description: 'Dịch vụ chống thấm sân thượng, nhà vệ sinh', icon: 'ri-shield-check-line', coefficient: 1.2, order: 7 },
  });

  // Service Category - Material Category Relations
  await prisma.serviceCategoryMaterialCategory.createMany({
    data: [
      { serviceCategoryId: scSonTuong.id, materialCategoryId: catSon.id },
      { serviceCategoryId: scOpLat.id, materialCategoryId: catGach.id },
      { serviceCategoryId: scCaiTao.id, materialCategoryId: catSon.id },
      { serviceCategoryId: scCaiTao.id, materialCategoryId: catGach.id },
      { serviceCategoryId: scCaiTao.id, materialCategoryId: catThietBiVeSinh.id },
      { serviceCategoryId: scCaiTao.id, materialCategoryId: catDien.id },
      { serviceCategoryId: scDien.id, materialCategoryId: catDien.id },
      { serviceCategoryId: scNuoc.id, materialCategoryId: catThietBiVeSinh.id },
      { serviceCategoryId: scChongTham.id, materialCategoryId: catChongTham.id },
    ],
  });

  // Materials
  await prisma.material.createMany({
    data: [
      { name: 'Sơn Dulux Weathershield', categoryId: catSon.id, price: 850000, unit: 'thùng 5L', order: 1, imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400' },
      { name: 'Sơn Jotun Essence', categoryId: catSon.id, price: 650000, unit: 'thùng 5L', order: 2, imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400' },
      { name: 'Gạch Viglacera 60x60', categoryId: catGach.id, price: 180000, unit: 'm²', order: 1, imageUrl: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400' },
      { name: 'Gạch men ốp tường', categoryId: catGach.id, price: 150000, unit: 'm²', order: 2, imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400' },
      { name: 'Bồn cầu TOTO', categoryId: catThietBiVeSinh.id, price: 4500000, unit: 'bộ', order: 1, imageUrl: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400' },
      { name: 'Lavabo TOTO', categoryId: catThietBiVeSinh.id, price: 2500000, unit: 'bộ', order: 2, imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400' },
      { name: 'Đèn LED âm trần', categoryId: catDien.id, price: 150000, unit: 'cái', order: 1, imageUrl: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400' },
      { name: 'Sika Raintite', categoryId: catChongTham.id, price: 450000, unit: 'thùng 5kg', order: 1, imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' },
    ],
  });

  console.log('✅ Created formulas, unit prices, categories, and materials');
  return { scSonTuong, scOpLat, scCaiTao };
}

async function seedBlog(adminId: string) {
  console.log('\n📝 Creating blog content...');

  const blogCats = await prisma.blogCategory.createManyAndReturn({
    data: [
      { name: 'Kiến thức xây dựng', slug: 'kien-thuc-xay-dung', color: '#3B82F6', description: 'Chia sẻ kiến thức về xây dựng, cải tạo nhà' },
      { name: 'Mẹo cải tạo nhà', slug: 'meo-cai-tao-nha', color: '#10B981', description: 'Các mẹo hay khi cải tạo nhà' },
      { name: 'Xu hướng thiết kế', slug: 'xu-huong-thiet-ke', color: '#F59E0B', description: 'Xu hướng thiết kế nội thất mới nhất' },
      { name: 'Dự án hoàn thành', slug: 'du-an-hoan-thanh', color: '#8B5CF6', description: 'Các dự án đã hoàn thành' },
    ],
  });

  const catKienThuc = blogCats.find(c => c.slug === 'kien-thuc-xay-dung')!;
  const catMeo = blogCats.find(c => c.slug === 'meo-cai-tao-nha')!;
  const catDuAn = blogCats.find(c => c.slug === 'du-an-hoan-thanh')!;

  await prisma.blogPost.createMany({
    data: [
      {
        title: '5 Bước Chuẩn Bị Trước Khi Cải Tạo Nhà',
        slug: '5-buoc-chuan-bi-truoc-khi-cai-tao-nha',
        excerpt: 'Hướng dẫn chi tiết các bước chuẩn bị cần thiết trước khi bắt đầu cải tạo nhà.',
        content: '# 5 Bước Chuẩn Bị Trước Khi Cải Tạo Nhà\n\n## 1. Xác định nhu cầu và ngân sách\n\n## 2. Tìm hiểu và chọn nhà thầu uy tín\n\n## 3. Lên kế hoạch chi tiết\n\n## 4. Chuẩn bị giấy tờ cần thiết\n\n## 5. Sắp xếp nơi ở tạm (nếu cần)',
        categoryId: catKienThuc.id,
        authorId: adminId,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Cách Chọn Sơn Phù Hợp Cho Từng Không Gian',
        slug: 'cach-chon-son-phu-hop-cho-tung-khong-gian',
        excerpt: 'Hướng dẫn chọn loại sơn và màu sắc phù hợp cho phòng khách, phòng ngủ, nhà bếp.',
        content: '# Cách Chọn Sơn Phù Hợp Cho Từng Không Gian\n\n## Phòng khách\n\n## Phòng ngủ\n\n## Nhà bếp\n\n## Nhà tắm',
        categoryId: catMeo.id,
        authorId: adminId,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Dự Án Cải Tạo Căn Hộ 70m2 Tại Quận 7',
        slug: 'du-an-cai-tao-can-ho-70m2-tai-quan-7',
        excerpt: 'Chia sẻ quá trình cải tạo căn hộ 70m2 từ cũ kỹ thành không gian sống hiện đại.',
        content: '# Dự Án Cải Tạo Căn Hộ 70m2 Tại Quận 7\n\n## Thông tin dự án\n- Diện tích: 70m²\n- Địa điểm: Quận 7, TP.HCM\n- Thời gian thi công: 45 ngày\n- Chi phí: 180 triệu đồng',
        categoryId: catDuAn.id,
        authorId: adminId,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date(),
      },
    ],
  });

  console.log('✅ Created blog categories and posts');
}
