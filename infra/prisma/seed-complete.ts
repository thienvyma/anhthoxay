/**
 * Complete Seed Data for ANH THỢ XÂY
 * 
 * Comprehensive seed data including:
 * - Auth & Users (Admin, Manager, Homeowner, Contractor)
 * - CMS (Pages, Sections for Landing)
 * - Blog (Categories, Posts with images)
 * - Pricing (Formulas, Unit Prices, Service Categories, Materials)
 * - Bidding (Regions, Settings, Service Fees, Projects, Bids, Escrows)
 * - Interior (Developers, Developments, Buildings, Layouts, Packages)
 * - Reviews & Rankings
 * - Chat & Notifications
 * 
 * Run: pnpm db:seed-complete
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// SAMPLE IMAGES (High-quality Unsplash URLs)
// ============================================
const IMAGES = {
  // User avatars - Vietnamese-looking professionals
  avatars: [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
  ],
  
  // Construction/renovation projects - High quality
  projects: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', // Modern house exterior
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80', // Living room
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80', // Kitchen
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80', // Bedroom
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', // House front
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80', // Bathroom
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80', // Apartment
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80', // Modern interior
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80', // Construction site
    'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1200&q=80', // Renovation work
  ],
  
  // Interior design - Luxury apartments
  interior: [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80', // Modern living room
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80', // Minimalist bedroom
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80', // Luxury kitchen
    'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=1200&q=80', // Dining area
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80', // Bathroom design
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80', // Sofa set
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80', // Green sofa
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=80', // Living space
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80', // Bedroom interior
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80', // Kitchen interior
  ],
  
  // Paint and materials
  materials: {
    paint: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80', // Paint cans
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80', // Paint roller
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', // Color swatches
    ],
    tiles: [
      'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=600&q=80', // Floor tiles
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80', // Bathroom tiles
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&q=80', // Tile pattern
    ],
    bathroom: [
      'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=600&q=80', // Modern bathroom
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80', // Sink
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=80', // Shower
    ],
    electrical: [
      'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&q=80', // LED lights
      'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&q=80', // Light fixtures
    ],
  },
  
  // Blog featured images - Construction & Design
  blog: {
    construction: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80', // Construction workers
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80', // Building site
      'https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=1200&q=80', // House frame
    ],
    renovation: [
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1200&q=80', // Renovation
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80', // Before/after
      'https://images.unsplash.com/photo-1534237710431-e2fc698436d0?w=1200&q=80', // Tools
    ],
    design: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80', // Interior design
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80', // Kitchen design
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80', // Living room
    ],
    tips: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80', // Color selection
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80', // Paint tips
      'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=1200&q=80', // Tile selection
    ],
  },
  
  // Portfolio images for contractors
  portfolio: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
  ],
  
  // ID card samples (placeholder)
  idCards: [
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
  ],
  
  // Certificates
  certificates: [
    'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&q=80',
    'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&q=80',
  ],
  
  // Hero/Banner images
  hero: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80',
  ],
  
  // Developer logos (placeholder - using building images)
  developers: {
    vingroup: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80',
    novaland: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80',
    capitaland: 'https://images.unsplash.com/photo-1464938050520-ef2571e0d6d7?w=400&q=80',
  },
};

// ============================================
// CLEAR DATABASE
// ============================================
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


// ============================================
// SEED USERS
// ============================================
async function seedUsers() {
  console.log('\n👥 Creating users...');
  
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  // Admin users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@anhthoxay.vn',
      passwordHash: adminPassword,
      name: 'Admin ATH',
      phone: '0909000001',
      avatar: IMAGES.avatars[0],
      role: 'ADMIN',
    },
  });

  const adminThienVy = await prisma.user.create({
    data: {
      email: 'thienvyma@gmail.com',
      passwordHash: adminPassword,
      name: 'Thiên Vy',
      phone: '0909000002',
      avatar: IMAGES.avatars[2],
      role: 'ADMIN',
    },
  });

  // Manager
  const manager = await prisma.user.create({
    data: {
      email: 'quanly@anhthoxay.vn',
      passwordHash: managerPassword,
      name: 'Quản lý ATH',
      phone: '0909000003',
      avatar: IMAGES.avatars[1],
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
      avatar: IMAGES.avatars[3],
      role: 'HOMEOWNER',
    },
  });

  const homeowner2 = await prisma.user.create({
    data: {
      email: 'chunha2@gmail.com',
      passwordHash: userPassword,
      name: 'Trần Thị Hương',
      phone: '0909100002',
      avatar: IMAGES.avatars[4],
      role: 'HOMEOWNER',
    },
  });

  const homeowner3 = await prisma.user.create({
    data: {
      email: 'chunha3@gmail.com',
      passwordHash: userPassword,
      name: 'Lê Hoàng Nam',
      phone: '0909100003',
      avatar: IMAGES.avatars[0],
      role: 'HOMEOWNER',
    },
  });

  // Contractor users - VERIFIED
  const contractor1 = await prisma.user.create({
    data: {
      email: 'nhathau1@gmail.com',
      passwordHash: userPassword,
      name: 'Công ty TNHH Xây Dựng Hoàng Long',
      phone: '0909200001',
      avatar: IMAGES.avatars[1],
      role: 'CONTRACTOR',
      companyName: 'Công ty TNHH Xây Dựng Hoàng Long',
      businessLicense: 'GP-0123456789',
      taxCode: '0312345678',
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
      avatar: IMAGES.avatars[3],
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
      name: 'Công ty Cổ phần Nội Thất Việt',
      phone: '0909200003',
      avatar: IMAGES.avatars[4],
      role: 'CONTRACTOR',
      companyName: 'Công ty Cổ phần Nội Thất Việt',
      businessLicense: 'GP-0987654321',
      taxCode: '0398765432',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      rating: 4.9,
      totalProjects: 42,
    },
  });

  const contractor4 = await prisma.user.create({
    data: {
      email: 'nhathau4@gmail.com',
      passwordHash: userPassword,
      name: 'Thợ Sơn Minh Đức',
      phone: '0909200004',
      avatar: IMAGES.avatars[0],
      role: 'CONTRACTOR',
      companyName: 'Thợ Sơn Minh Đức',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      rating: 4.3,
      totalProjects: 8,
    },
  });

  // Contractor - PENDING verification
  const contractor5 = await prisma.user.create({
    data: {
      email: 'nhathau5@gmail.com',
      passwordHash: userPassword,
      name: 'Nhà Thầu Mới',
      phone: '0909200005',
      role: 'CONTRACTOR',
      verificationStatus: 'PENDING',
    },
  });

  // Contractor - REJECTED
  const contractor6 = await prisma.user.create({
    data: {
      email: 'nhathau6@gmail.com',
      passwordHash: userPassword,
      name: 'Nhà Thầu Bị Từ Chối',
      phone: '0909200006',
      role: 'CONTRACTOR',
      verificationStatus: 'REJECTED',
      verificationNote: 'Hồ sơ không đầy đủ, thiếu giấy phép kinh doanh',
    },
  });

  console.log(`✅ Created 12 users (2 admin, 1 manager, 3 homeowner, 6 contractor)`);
  
  return { 
    admin, adminThienVy, manager, 
    homeowner1, homeowner2, homeowner3, 
    contractor1, contractor2, contractor3, contractor4, contractor5, contractor6 
  };
}

// ============================================
// SEED CONTRACTOR PROFILES
// ============================================
async function seedContractorProfiles(users: Awaited<ReturnType<typeof seedUsers>>) {
  console.log('\n📋 Creating contractor profiles...');

  await prisma.contractorProfile.createMany({
    data: [
      {
        userId: users.contractor1.id,
        description: 'Chuyên cải tạo căn hộ chung cư, nhà phố với hơn 10 năm kinh nghiệm. Đội ngũ thợ lành nghề, cam kết chất lượng và tiến độ.',
        experience: 10,
        specialties: JSON.stringify(['Sơn tường', 'Ốp lát', 'Điện nước', 'Cải tạo căn hộ']),
        serviceAreas: JSON.stringify(['quan-1', 'quan-3', 'quan-7', 'binh-thanh']),
        portfolioImages: JSON.stringify(IMAGES.portfolio.slice(0, 5)),
        certificates: JSON.stringify([
          { name: 'Chứng chỉ An toàn lao động', imageUrl: IMAGES.certificates[0], issuedDate: '2022-01-15' },
          { name: 'Chứng nhận ISO 9001:2015', imageUrl: IMAGES.certificates[1], issuedDate: '2023-06-20' },
        ]),
        idCardFront: IMAGES.idCards[0],
        idCardBack: IMAGES.idCards[1],
        businessLicenseImage: IMAGES.certificates[0],
        submittedAt: new Date('2024-01-15'),
      },
      {
        userId: users.contractor2.id,
        description: 'Đội thợ lành nghề, chuyên sơn tường và chống thấm. Giá cả hợp lý, thi công nhanh chóng.',
        experience: 5,
        specialties: JSON.stringify(['Sơn tường', 'Chống thấm', 'Sửa chữa nhỏ']),
        serviceAreas: JSON.stringify(['go-vap', 'tan-binh', 'phu-nhuan', 'thu-duc']),
        portfolioImages: JSON.stringify(IMAGES.portfolio.slice(2, 6)),
        submittedAt: new Date('2024-02-20'),
      },
      {
        userId: users.contractor3.id,
        description: 'Công ty chuyên thiết kế và thi công nội thất trọn gói. Phong cách hiện đại, sang trọng.',
        experience: 8,
        specialties: JSON.stringify(['Nội thất', 'Cải tạo căn hộ', 'Thiết kế', 'Thi công trọn gói']),
        serviceAreas: JSON.stringify(['quan-1', 'quan-7', 'binh-thanh', 'thu-duc']),
        portfolioImages: JSON.stringify(IMAGES.portfolio.slice(4, 10)),
        certificates: JSON.stringify([
          { name: 'Chứng chỉ Kiến trúc sư', imageUrl: IMAGES.certificates[0], issuedDate: '2020-03-10' },
        ]),
        idCardFront: IMAGES.idCards[0],
        idCardBack: IMAGES.idCards[1],
        businessLicenseImage: IMAGES.certificates[1],
        submittedAt: new Date('2024-01-10'),
      },
      {
        userId: users.contractor4.id,
        description: 'Thợ sơn chuyên nghiệp, kinh nghiệm 15 năm. Sơn nhà, sơn căn hộ, sơn văn phòng.',
        experience: 15,
        specialties: JSON.stringify(['Sơn tường', 'Sơn epoxy', 'Sơn chống thấm']),
        serviceAreas: JSON.stringify(['quan-1', 'quan-3', 'binh-thanh']),
        portfolioImages: JSON.stringify(IMAGES.portfolio.slice(0, 3)),
        submittedAt: new Date('2024-03-05'),
      },
      {
        userId: users.contractor5.id,
        description: 'Nhà thầu mới, đang chờ xác minh hồ sơ.',
        experience: 2,
        specialties: JSON.stringify(['Sơn tường']),
      },
      {
        userId: users.contractor6.id,
        description: 'Hồ sơ đang được bổ sung.',
        experience: 1,
      },
    ],
  });

  console.log('✅ Created 6 contractor profiles');
}


// ============================================
// SEED REGIONS
// ============================================
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
    { name: 'Quận 4', slug: 'quan-4', order: 3 },
    { name: 'Quận 5', slug: 'quan-5', order: 4 },
    { name: 'Quận 6', slug: 'quan-6', order: 5 },
    { name: 'Quận 7', slug: 'quan-7', order: 6 },
    { name: 'Quận 8', slug: 'quan-8', order: 7 },
    { name: 'Quận 10', slug: 'quan-10', order: 8 },
    { name: 'Quận 11', slug: 'quan-11', order: 9 },
    { name: 'Quận 12', slug: 'quan-12', order: 10 },
    { name: 'Quận Bình Thạnh', slug: 'binh-thanh', order: 11 },
    { name: 'Quận Gò Vấp', slug: 'go-vap', order: 12 },
    { name: 'Quận Tân Bình', slug: 'tan-binh', order: 13 },
    { name: 'Quận Tân Phú', slug: 'tan-phu', order: 14 },
    { name: 'Quận Phú Nhuận', slug: 'phu-nhuan', order: 15 },
    { name: 'Quận Bình Tân', slug: 'binh-tan', order: 16 },
    { name: 'TP. Thủ Đức', slug: 'thu-duc', order: 17 },
    { name: 'Huyện Bình Chánh', slug: 'binh-chanh', order: 18 },
    { name: 'Huyện Hóc Môn', slug: 'hoc-mon', order: 19 },
    { name: 'Huyện Củ Chi', slug: 'cu-chi', order: 20 },
    { name: 'Huyện Nhà Bè', slug: 'nha-be', order: 21 },
    { name: 'Huyện Cần Giờ', slug: 'can-gio', order: 22 },
  ];

  const createdDistricts: Record<string, { id: string; name: string; slug: string }> = {};
  
  for (const d of districts) {
    const district = await prisma.region.create({
      data: {
        name: d.name,
        slug: d.slug,
        parentId: hcm.id,
        level: 2,
        isActive: true,
        order: d.order,
      },
    });
    createdDistricts[d.slug] = district;
  }

  console.log(`✅ Created ${districts.length + 1} regions`);
  return { hcm, districts: createdDistricts };
}

// ============================================
// SEED BIDDING SETTINGS & SERVICE FEES
// ============================================
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
    { name: 'Phí đăng dự án khẩn', code: 'URGENT_PROJECT_FEE', type: 'FIXED', value: 100000, description: 'Phí đăng dự án với tag "Khẩn cấp"' },
    { name: 'Phí gia hạn đấu giá', code: 'EXTEND_BID_FEE', type: 'FIXED', value: 50000, description: 'Phí gia hạn thời gian đấu giá thêm 7 ngày' },
  ];

  await prisma.serviceFee.createMany({ data: serviceFees });

  console.log('✅ Created bidding settings and 5 service fees');
}

// ============================================
// SEED FORMULAS & PRICING
// ============================================
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
    { category: 'Nhân công', name: 'Công chống thấm', price: 80000, tag: 'DON_GIA_CHONG_THAM', unit: 'm²' },
    { category: 'Vật liệu', name: 'Xi măng', price: 95000, tag: 'XI_MANG', unit: 'bao 50kg' },
    { category: 'Vật liệu', name: 'Cát xây dựng', price: 350000, tag: 'CAT', unit: 'm³' },
    { category: 'Vật liệu', name: 'Gạch xây', price: 1200, tag: 'GACH_XAY', unit: 'viên' },
    { category: 'Phụ phí', name: 'Phí vận chuyển', price: 500000, tag: 'PHI_VAN_CHUYEN', unit: 'chuyến' },
    { category: 'Phụ phí', name: 'Phí dọn dẹp', price: 300000, tag: 'PHI_DON_DEP', unit: 'lần' },
  ];
  await prisma.unitPrice.createMany({ data: unitPrices });

  // Material Categories
  const catSon = await prisma.materialCategory.create({ 
    data: { name: 'Sơn', slug: 'son', icon: 'ri-paint-brush-line', order: 1, description: 'Các loại sơn tường, sơn nước, sơn dầu' } 
  });
  const catGach = await prisma.materialCategory.create({ 
    data: { name: 'Gạch', slug: 'gach', icon: 'ri-layout-grid-line', order: 2, description: 'Gạch lát nền, gạch ốp tường' } 
  });
  const catThietBiVeSinh = await prisma.materialCategory.create({ 
    data: { name: 'Thiết bị vệ sinh', slug: 'thiet-bi-ve-sinh', icon: 'ri-drop-line', order: 3, description: 'Bồn cầu, lavabo, vòi sen' } 
  });
  const catDien = await prisma.materialCategory.create({ 
    data: { name: 'Điện', slug: 'dien', icon: 'ri-flashlight-line', order: 4, description: 'Đèn, ổ cắm, công tắc' } 
  });
  const catChongTham = await prisma.materialCategory.create({ 
    data: { name: 'Chống thấm', slug: 'chong-tham', icon: 'ri-shield-check-line', order: 5, description: 'Vật liệu chống thấm' } 
  });

  // Service Categories
  const scSonTuong = await prisma.serviceCategory.create({
    data: { name: 'Sơn tường', slug: 'son-tuong', description: 'Dịch vụ sơn tường trong nhà và ngoài trời', icon: 'ri-paint-brush-line', coefficient: 1.0, formulaId: formulaSon.id, order: 1 },
  });
  const scOpLat = await prisma.serviceCategory.create({
    data: { name: 'Ốp lát gạch', slug: 'op-lat-gach', description: 'Dịch vụ ốp lát gạch nền, tường', icon: 'ri-layout-grid-line', coefficient: 1.2, formulaId: formulaOpLat.id, order: 2 },
  });
  const scThaoDo = await prisma.serviceCategory.create({
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

  // Materials with images
  await prisma.material.createMany({
    data: [
      { name: 'Sơn Dulux Weathershield', categoryId: catSon.id, price: 850000, unit: 'thùng 5L', order: 1, imageUrl: IMAGES.materials.paint[0], description: 'Sơn ngoại thất cao cấp, chống thấm, chống nấm mốc' },
      { name: 'Sơn Dulux Easy Clean', categoryId: catSon.id, price: 750000, unit: 'thùng 5L', order: 2, imageUrl: IMAGES.materials.paint[0], description: 'Sơn nội thất dễ lau chùi' },
      { name: 'Sơn Jotun Essence', categoryId: catSon.id, price: 650000, unit: 'thùng 5L', order: 3, imageUrl: IMAGES.materials.paint[1], description: 'Sơn nội thất cao cấp' },
      { name: 'Sơn Nippon Odour-less', categoryId: catSon.id, price: 580000, unit: 'thùng 5L', order: 4, imageUrl: IMAGES.materials.paint[2], description: 'Sơn không mùi, an toàn cho sức khỏe' },
      { name: 'Gạch Viglacera 60x60', categoryId: catGach.id, price: 180000, unit: 'm²', order: 1, imageUrl: IMAGES.materials.tiles[0], description: 'Gạch lát nền cao cấp' },
      { name: 'Gạch Viglacera 80x80', categoryId: catGach.id, price: 250000, unit: 'm²', order: 2, imageUrl: IMAGES.materials.tiles[0], description: 'Gạch lát nền khổ lớn' },
      { name: 'Gạch men ốp tường 30x60', categoryId: catGach.id, price: 150000, unit: 'm²', order: 3, imageUrl: IMAGES.materials.tiles[1], description: 'Gạch ốp tường nhà tắm' },
      { name: 'Bồn cầu TOTO 1 khối', categoryId: catThietBiVeSinh.id, price: 4500000, unit: 'bộ', order: 1, imageUrl: IMAGES.materials.bathroom[0], description: 'Bồn cầu cao cấp Nhật Bản' },
      { name: 'Bồn cầu INAX 2 khối', categoryId: catThietBiVeSinh.id, price: 3200000, unit: 'bộ', order: 2, imageUrl: IMAGES.materials.bathroom[0], description: 'Bồn cầu tiết kiệm nước' },
      { name: 'Lavabo TOTO chân đứng', categoryId: catThietBiVeSinh.id, price: 2500000, unit: 'bộ', order: 3, imageUrl: IMAGES.materials.bathroom[1], description: 'Lavabo cao cấp' },
      { name: 'Vòi sen GROHE', categoryId: catThietBiVeSinh.id, price: 3800000, unit: 'bộ', order: 4, imageUrl: IMAGES.materials.bathroom[2], description: 'Vòi sen nhập khẩu Đức' },
      { name: 'Đèn LED âm trần 9W', categoryId: catDien.id, price: 150000, unit: 'cái', order: 1, imageUrl: IMAGES.materials.electrical[0], description: 'Đèn LED tiết kiệm điện' },
      { name: 'Đèn LED panel 600x600', categoryId: catDien.id, price: 450000, unit: 'cái', order: 2, imageUrl: IMAGES.materials.electrical[0], description: 'Đèn panel văn phòng' },
      { name: 'Ổ cắm đôi Panasonic', categoryId: catDien.id, price: 85000, unit: 'cái', order: 3, imageUrl: IMAGES.materials.electrical[1], description: 'Ổ cắm an toàn' },
      { name: 'Sika Raintite', categoryId: catChongTham.id, price: 450000, unit: 'thùng 5kg', order: 1, imageUrl: IMAGES.materials.paint[1], description: 'Chống thấm gốc xi măng' },
      { name: 'Kova CT-11A', categoryId: catChongTham.id, price: 380000, unit: 'thùng 5kg', order: 2, imageUrl: IMAGES.materials.paint[2], description: 'Chống thấm đàn hồi' },
    ],
  });

  console.log('✅ Created formulas, unit prices, categories, and materials');
  return { scSonTuong, scOpLat, scThaoDo, scCaiTao, scDien, scNuoc, scChongTham };
}


// ============================================
// SEED BLOG - DETAILED CONTENT
// ============================================
async function seedBlog(adminId: string) {
  console.log('\n📝 Creating blog content with detailed articles...');

  const blogCats = await prisma.blogCategory.createManyAndReturn({
    data: [
      { name: 'Kiến thức xây dựng', slug: 'kien-thuc-xay-dung', color: '#3B82F6', description: 'Chia sẻ kiến thức về xây dựng, cải tạo nhà' },
      { name: 'Mẹo cải tạo nhà', slug: 'meo-cai-tao-nha', color: '#10B981', description: 'Các mẹo hay khi cải tạo nhà' },
      { name: 'Xu hướng thiết kế', slug: 'xu-huong-thiet-ke', color: '#F59E0B', description: 'Xu hướng thiết kế nội thất mới nhất' },
      { name: 'Dự án hoàn thành', slug: 'du-an-hoan-thanh', color: '#8B5CF6', description: 'Các dự án đã hoàn thành' },
      { name: 'Tư vấn vật liệu', slug: 'tu-van-vat-lieu', color: '#EF4444', description: 'Tư vấn chọn vật liệu xây dựng' },
    ],
  });

  const catKienThuc = blogCats.find(c => c.slug === 'kien-thuc-xay-dung');
  const catMeo = blogCats.find(c => c.slug === 'meo-cai-tao-nha');
  const catXuHuong = blogCats.find(c => c.slug === 'xu-huong-thiet-ke');
  const catDuAn = blogCats.find(c => c.slug === 'du-an-hoan-thanh');
  const catVatLieu = blogCats.find(c => c.slug === 'tu-van-vat-lieu');

  if (!catKienThuc || !catMeo || !catXuHuong || !catDuAn || !catVatLieu) {
    throw new Error('Blog categories not created properly');
  }

  await prisma.blogPost.createMany({
    data: [
      {
        title: '5 Bước Chuẩn Bị Trước Khi Cải Tạo Nhà',
        slug: '5-buoc-chuan-bi-truoc-khi-cai-tao-nha',
        excerpt: 'Hướng dẫn chi tiết các bước chuẩn bị cần thiết trước khi bắt đầu cải tạo nhà để đảm bảo dự án suôn sẻ.',
        content: `# 5 Bước Chuẩn Bị Trước Khi Cải Tạo Nhà

## 1. Xác định nhu cầu và ngân sách
Trước khi bắt đầu, hãy liệt kê rõ ràng những gì bạn muốn thay đổi và ước tính ngân sách có thể chi.

## 2. Tìm hiểu và chọn nhà thầu uy tín
Tham khảo đánh giá, xem portfolio và so sánh báo giá từ nhiều nhà thầu.

## 3. Lên kế hoạch chi tiết
Lập timeline cụ thể cho từng hạng mục công việc.

## 4. Chuẩn bị giấy tờ cần thiết
Nếu cải tạo lớn, có thể cần xin phép xây dựng.

## 5. Sắp xếp nơi ở tạm (nếu cần)
Với những dự án lớn, bạn có thể cần di chuyển tạm thời.`,
        featuredImage: IMAGES.blog.construction[0],
        categoryId: catKienThuc.id,
        authorId: adminId,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date('2024-12-01'),
        tags: JSON.stringify(['cải tạo nhà', 'chuẩn bị', 'kinh nghiệm']),
      },
      {
        title: 'Cách Chọn Sơn Phù Hợp Cho Từng Không Gian',
        slug: 'cach-chon-son-phu-hop-cho-tung-khong-gian',
        excerpt: 'Hướng dẫn chọn loại sơn và màu sắc phù hợp cho phòng khách, phòng ngủ, nhà bếp và nhà tắm.',
        content: `# Cách Chọn Sơn Phù Hợp Cho Từng Không Gian

## Phòng khách
- Nên chọn màu sáng, trung tính
- Sơn có độ bóng nhẹ (satin) dễ lau chùi

## Phòng ngủ
- Màu pastel nhẹ nhàng giúp thư giãn
- Sơn mờ (matte) tạo cảm giác ấm cúng

## Nhà bếp
- Sơn chống ẩm, dễ lau chùi
- Màu sáng giúp không gian rộng rãi hơn

## Nhà tắm
- Bắt buộc dùng sơn chống thấm, chống nấm mốc
- Màu trắng hoặc xanh nhạt phổ biến`,
        featuredImage: IMAGES.blog.tips[0],
        categoryId: catMeo.id,
        authorId: adminId,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date('2024-12-05'),
        tags: JSON.stringify(['sơn tường', 'màu sắc', 'nội thất']),
      },
      {
        title: 'Xu Hướng Thiết Kế Nội Thất 2025',
        slug: 'xu-huong-thiet-ke-noi-that-2025',
        excerpt: 'Khám phá những xu hướng thiết kế nội thất hot nhất năm 2025: tối giản, bền vững và công nghệ.',
        content: `# Xu Hướng Thiết Kế Nội Thất 2025

## 1. Phong cách tối giản (Minimalism)
Ít đồ đạc, nhiều không gian trống, màu sắc trung tính.

## 2. Vật liệu bền vững
Gỗ tái chế, vật liệu thân thiện môi trường được ưa chuộng.

## 3. Công nghệ thông minh
Nhà thông minh với điều khiển bằng giọng nói, cảm biến tự động.

## 4. Màu xanh lá và nâu đất
Mang thiên nhiên vào nhà với cây xanh và màu sắc tự nhiên.

## 5. Không gian đa chức năng
Một phòng có thể sử dụng cho nhiều mục đích khác nhau.`,
        featuredImage: IMAGES.blog.design[0],
        categoryId: catXuHuong.id,
        authorId: adminId,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date('2024-12-10'),
        tags: JSON.stringify(['xu hướng', 'thiết kế', '2025']),
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

## Hạng mục thực hiện
1. Tháo dỡ toàn bộ nội thất cũ
2. Sơn lại toàn bộ tường
3. Thay gạch lát nền phòng khách và phòng ngủ
4. Cải tạo nhà tắm với thiết bị mới
5. Lắp đặt hệ thống điện mới

## Kết quả
Căn hộ được "lột xác" hoàn toàn với phong cách hiện đại, tối giản.`,
        featuredImage: IMAGES.blog.renovation[0],
        categoryId: catDuAn.id,
        authorId: adminId,
        status: 'PUBLISHED',
        isFeatured: true,
        publishedAt: new Date('2024-12-15'),
        tags: JSON.stringify(['dự án', 'căn hộ', 'quận 7']),
      },
      {
        title: 'So Sánh Các Loại Gạch Lát Nền Phổ Biến',
        slug: 'so-sanh-cac-loai-gach-lat-nen-pho-bien',
        excerpt: 'Phân tích ưu nhược điểm của gạch ceramic, gạch granite, gạch men và gạch bông để bạn dễ dàng lựa chọn.',
        content: `# So Sánh Các Loại Gạch Lát Nền Phổ Biến

## 1. Gạch Ceramic
- **Ưu điểm:** Giá rẻ, nhiều mẫu mã
- **Nhược điểm:** Độ bền trung bình, dễ trầy xước

## 2. Gạch Granite
- **Ưu điểm:** Cứng, bền, chống trầy tốt
- **Nhược điểm:** Giá cao hơn ceramic

## 3. Gạch Men (Porcelain)
- **Ưu điểm:** Chống thấm tốt, bề mặt bóng đẹp
- **Nhược điểm:** Trơn khi ướt

## 4. Gạch Bông
- **Ưu điểm:** Họa tiết độc đáo, phong cách vintage
- **Nhược điểm:** Cần bảo dưỡng định kỳ`,
        featuredImage: IMAGES.blog.tips[1],
        categoryId: catVatLieu.id,
        authorId: adminId,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-12-18'),
        tags: JSON.stringify(['gạch', 'vật liệu', 'so sánh']),
      },
      {
        title: 'Hướng Dẫn Chống Thấm Sân Thượng Hiệu Quả',
        slug: 'huong-dan-chong-tham-san-thuong-hieu-qua',
        excerpt: 'Các bước chống thấm sân thượng đúng kỹ thuật, đảm bảo hiệu quả lâu dài.',
        content: `# Hướng Dẫn Chống Thấm Sân Thượng Hiệu Quả

## Bước 1: Chuẩn bị bề mặt
- Làm sạch bụi bẩn, rêu mốc
- Xử lý các vết nứt, lỗ hổng

## Bước 2: Thi công lớp lót
- Quét lớp lót chống thấm đầu tiên
- Đợi khô hoàn toàn (4-6 tiếng)

## Bước 3: Thi công lớp chính
- Quét 2-3 lớp chống thấm
- Mỗi lớp cách nhau 4-6 tiếng

## Bước 4: Bảo dưỡng
- Không đi lại trong 24 tiếng
- Tránh nước trong 48 tiếng đầu`,
        featuredImage: IMAGES.blog.construction[1],
        categoryId: catKienThuc.id,
        authorId: adminId,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-12-20'),
        tags: JSON.stringify(['chống thấm', 'sân thượng', 'hướng dẫn']),
      },
    ],
  });

  // Add some blog comments
  const posts = await prisma.blogPost.findMany({ take: 3 });
  for (const post of posts) {
    await prisma.blogComment.createMany({
      data: [
        { postId: post.id, name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', content: 'Bài viết rất hữu ích, cảm ơn tác giả!', status: 'APPROVED' },
        { postId: post.id, name: 'Trần Thị B', email: 'tranthib@gmail.com', content: 'Mình đang cần thông tin này, cảm ơn nhiều!', status: 'APPROVED' },
      ],
    });
  }

  console.log('✅ Created 5 blog categories, 6 posts, and comments');
}


// ============================================
// SEED PROJECTS
// ============================================
async function seedProjects(
  users: Awaited<ReturnType<typeof seedUsers>>,
  regions: Awaited<ReturnType<typeof seedRegions>>,
  categories: Awaited<ReturnType<typeof seedFormulasAndPricing>>
) {
  console.log('\n🏗️ Creating projects...');

  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Project 1: OPEN - Sơn tường căn hộ
  const project1 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-001',
      ownerId: users.homeowner1.id,
      title: 'Sơn lại căn hộ 2 phòng ngủ tại Vinhomes Central Park',
      description: 'Cần sơn lại toàn bộ căn hộ 70m2, bao gồm phòng khách, 2 phòng ngủ và hành lang. Yêu cầu sơn chất lượng cao, màu trắng ngà.',
      categoryId: categories.scSonTuong.id,
      regionId: regions.districts['binh-thanh'].id,
      address: 'Tòa Landmark 81, Vinhomes Central Park, Phường 22, Quận Bình Thạnh',
      area: 70,
      budgetMin: 15000000,
      budgetMax: 25000000,
      timeline: '1 tuần',
      images: JSON.stringify([IMAGES.projects[0], IMAGES.projects[1]]),
      requirements: 'Sơn Dulux hoặc Jotun. Thi công ngoài giờ hành chính.',
      status: 'OPEN',
      bidDeadline: oneWeekLater,
      maxBids: 10,
      reviewedBy: users.admin.id,
      reviewedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  // Project 2: OPEN - Ốp lát nhà tắm
  const project2 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-002',
      ownerId: users.homeowner2.id,
      title: 'Ốp lát lại nhà tắm 8m2',
      description: 'Cần tháo dỡ gạch cũ và ốp lát lại toàn bộ nhà tắm. Diện tích sàn 8m2, tường khoảng 25m2.',
      categoryId: categories.scOpLat.id,
      regionId: regions.districts['quan-7'].id,
      address: '123 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7',
      area: 8,
      budgetMin: 20000000,
      budgetMax: 35000000,
      timeline: '5 ngày',
      images: JSON.stringify([IMAGES.projects[2], IMAGES.projects[3]]),
      requirements: 'Gạch Viglacera hoặc tương đương. Bao gồm cả vật liệu.',
      status: 'OPEN',
      bidDeadline: twoWeeksLater,
      maxBids: 15,
      reviewedBy: users.admin.id,
      reviewedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  // Project 3: OPEN - Cải tạo căn hộ
  const project3 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-003',
      ownerId: users.homeowner3.id,
      title: 'Cải tạo toàn diện căn hộ 90m2 tại Sunrise City',
      description: 'Cần cải tạo toàn bộ căn hộ bao gồm: sơn tường, thay gạch nền, cải tạo 2 nhà tắm, thay hệ thống điện.',
      categoryId: categories.scCaiTao.id,
      regionId: regions.districts['quan-7'].id,
      address: 'Tòa V3, Sunrise City, Đường Nguyễn Hữu Thọ, Quận 7',
      area: 90,
      budgetMin: 150000000,
      budgetMax: 200000000,
      timeline: '2 tháng',
      images: JSON.stringify([IMAGES.projects[4], IMAGES.projects[5], IMAGES.projects[6]]),
      requirements: 'Nhà thầu có kinh nghiệm cải tạo căn hộ. Cần có portfolio.',
      status: 'OPEN',
      bidDeadline: twoWeeksLater,
      maxBids: 20,
      reviewedBy: users.admin.id,
      reviewedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  // Project 4: PENDING_APPROVAL
  const project4 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-004',
      ownerId: users.homeowner1.id,
      title: 'Chống thấm sân thượng 50m2',
      description: 'Sân thượng bị thấm nước xuống phòng bên dưới. Cần xử lý chống thấm toàn bộ.',
      categoryId: categories.scChongTham.id,
      regionId: regions.districts['go-vap'].id,
      address: '456 Phan Văn Trị, Phường 5, Quận Gò Vấp',
      area: 50,
      budgetMin: 10000000,
      budgetMax: 20000000,
      timeline: '3 ngày',
      images: JSON.stringify([IMAGES.projects[7]]),
      status: 'PENDING_APPROVAL',
    },
  });

  // Project 5: DRAFT
  const project5 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-005',
      ownerId: users.homeowner2.id,
      title: 'Sửa chữa hệ thống điện căn hộ',
      description: 'Cần kiểm tra và sửa chữa hệ thống điện, thay một số ổ cắm và công tắc.',
      categoryId: categories.scDien.id,
      regionId: regions.districts['thu-duc'].id,
      address: 'Vinhomes Grand Park, TP. Thủ Đức',
      budgetMin: 5000000,
      budgetMax: 10000000,
      timeline: '2 ngày',
      status: 'DRAFT',
    },
  });

  // Project 6: BIDDING_CLOSED (ready for matching)
  const project6 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-006',
      ownerId: users.homeowner3.id,
      title: 'Sơn ngoại thất nhà phố 3 tầng',
      description: 'Cần sơn lại toàn bộ mặt ngoài nhà phố 3 tầng, diện tích khoảng 150m2.',
      categoryId: categories.scSonTuong.id,
      regionId: regions.districts['tan-binh'].id,
      address: '789 Cộng Hòa, Phường 13, Quận Tân Bình',
      area: 150,
      budgetMin: 30000000,
      budgetMax: 50000000,
      timeline: '1 tuần',
      images: JSON.stringify([IMAGES.projects[0], IMAGES.projects[1]]),
      status: 'BIDDING_CLOSED',
      bidDeadline: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Project 7: MATCHED
  const project7 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-007',
      ownerId: users.homeowner1.id,
      title: 'Ốp lát phòng khách 30m2',
      description: 'Thay gạch lát nền phòng khách, gạch 60x60.',
      categoryId: categories.scOpLat.id,
      regionId: regions.districts['phu-nhuan'].id,
      address: '321 Phan Xích Long, Phường 2, Quận Phú Nhuận',
      area: 30,
      budgetMin: 25000000,
      budgetMax: 40000000,
      timeline: '4 ngày',
      images: JSON.stringify([IMAGES.projects[2]]),
      status: 'MATCHED',
      bidDeadline: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      matchedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Project 8: IN_PROGRESS
  const project8 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-008',
      ownerId: users.homeowner2.id,
      title: 'Cải tạo nhà tắm master bedroom',
      description: 'Cải tạo toàn diện nhà tắm chính, thay thiết bị vệ sinh mới.',
      categoryId: categories.scCaiTao.id,
      regionId: regions.districts['quan-1'].id,
      address: 'Saigon Royal, Bến Vân Đồn, Quận 4',
      area: 12,
      budgetMin: 50000000,
      budgetMax: 80000000,
      timeline: '2 tuần',
      images: JSON.stringify([IMAGES.projects[3], IMAGES.projects[4]]),
      status: 'IN_PROGRESS',
      bidDeadline: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      matchedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    },
  });

  // Project 9: COMPLETED
  const project9 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-009',
      ownerId: users.homeowner3.id,
      title: 'Sơn căn hộ studio 35m2',
      description: 'Sơn lại toàn bộ căn hộ studio, màu trắng.',
      categoryId: categories.scSonTuong.id,
      regionId: regions.districts['binh-thanh'].id,
      address: 'The Manor, Nguyễn Hữu Cảnh, Quận Bình Thạnh',
      area: 35,
      budgetMin: 8000000,
      budgetMax: 12000000,
      timeline: '3 ngày',
      images: JSON.stringify([IMAGES.projects[5]]),
      status: 'COMPLETED',
      bidDeadline: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
      matchedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
    },
  });

  // Project 10: CANCELLED
  const project10 = await prisma.project.create({
    data: {
      code: 'PRJ-2024-010',
      ownerId: users.homeowner1.id,
      title: 'Tháo dỡ tường ngăn phòng',
      description: 'Tháo dỡ tường ngăn giữa 2 phòng để mở rộng không gian.',
      categoryId: categories.scThaoDo.id,
      regionId: regions.districts['quan-3'].id,
      address: '111 Võ Văn Tần, Phường 6, Quận 3',
      area: 15,
      budgetMin: 5000000,
      budgetMax: 10000000,
      timeline: '1 ngày',
      status: 'CANCELLED',
      reviewNote: 'Chủ nhà hủy do thay đổi kế hoạch',
    },
  });

  console.log('✅ Created 10 projects with various statuses');
  return { project1, project2, project3, project4, project5, project6, project7, project8, project9, project10 };
}


// ============================================
// SEED BIDS
// ============================================
async function seedBids(
  users: Awaited<ReturnType<typeof seedUsers>>,
  projects: Awaited<ReturnType<typeof seedProjects>>
) {
  console.log('\n💰 Creating bids...');

  const now = new Date();

  // Bids for Project 1 (OPEN)
  const bid1_1 = await prisma.bid.create({
    data: {
      code: 'BID-2024-001',
      projectId: projects.project1.id,
      contractorId: users.contractor1.id,
      price: 18000000,
      timeline: '5 ngày',
      proposal: 'Chúng tôi sẽ sử dụng sơn Dulux Weathershield cao cấp. Đội ngũ 3 thợ lành nghề, cam kết hoàn thành đúng tiến độ. Bảo hành 2 năm.',
      attachments: JSON.stringify([
        { name: 'Portfolio.pdf', url: 'https://example.com/portfolio.pdf', type: 'application/pdf', size: 2500000 },
      ]),
      status: 'APPROVED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(),
      responseTimeHours: 2.5,
    },
  });

  const bid1_2 = await prisma.bid.create({
    data: {
      code: 'BID-2024-002',
      projectId: projects.project1.id,
      contractorId: users.contractor2.id,
      price: 16500000,
      timeline: '6 ngày',
      proposal: 'Giá tốt nhất thị trường. Sử dụng sơn Jotun Essence. Đội ngũ 2 thợ kinh nghiệm 10 năm.',
      status: 'APPROVED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(),
      responseTimeHours: 5.0,
    },
  });

  const bid1_3 = await prisma.bid.create({
    data: {
      code: 'BID-2024-003',
      projectId: projects.project1.id,
      contractorId: users.contractor4.id,
      price: 20000000,
      timeline: '4 ngày',
      proposal: 'Thi công nhanh, chất lượng cao. Sơn Dulux 5 trong 1. Bảo hành 3 năm.',
      status: 'PENDING',
      responseTimeHours: 8.0,
    },
  });

  // Bids for Project 2 (OPEN)
  await prisma.bid.create({
    data: {
      code: 'BID-2024-004',
      projectId: projects.project2.id,
      contractorId: users.contractor1.id,
      price: 28000000,
      timeline: '4 ngày',
      proposal: 'Bao gồm gạch Viglacera 60x60 và công thi công. Tháo dỡ gạch cũ miễn phí.',
      status: 'APPROVED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(),
      responseTimeHours: 3.0,
    },
  });

  await prisma.bid.create({
    data: {
      code: 'BID-2024-005',
      projectId: projects.project2.id,
      contractorId: users.contractor3.id,
      price: 32000000,
      timeline: '5 ngày',
      proposal: 'Sử dụng gạch cao cấp nhập khẩu. Thiết kế layout tối ưu. Bảo hành 5 năm.',
      status: 'APPROVED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(),
      responseTimeHours: 4.5,
    },
  });

  // Bids for Project 3 (OPEN)
  await prisma.bid.create({
    data: {
      code: 'BID-2024-006',
      projectId: projects.project3.id,
      contractorId: users.contractor3.id,
      price: 175000000,
      timeline: '50 ngày',
      proposal: 'Gói cải tạo trọn gói bao gồm thiết kế, vật liệu và thi công. Đội ngũ 8 thợ chuyên nghiệp.',
      attachments: JSON.stringify([
        { name: 'Bao_gia_chi_tiet.xlsx', url: 'https://example.com/quote.xlsx', type: 'application/xlsx', size: 150000 },
        { name: 'Portfolio_cai_tao.pdf', url: 'https://example.com/portfolio.pdf', type: 'application/pdf', size: 5000000 },
      ]),
      status: 'APPROVED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(),
      responseTimeHours: 12.0,
    },
  });

  await prisma.bid.create({
    data: {
      code: 'BID-2024-007',
      projectId: projects.project3.id,
      contractorId: users.contractor1.id,
      price: 185000000,
      timeline: '55 ngày',
      proposal: 'Cải tạo toàn diện với vật liệu cao cấp. Cam kết chất lượng và tiến độ.',
      status: 'PENDING',
      responseTimeHours: 24.0,
    },
  });

  // Bids for Project 6 (BIDDING_CLOSED)
  const bid6_1 = await prisma.bid.create({
    data: {
      code: 'BID-2024-008',
      projectId: projects.project6.id,
      contractorId: users.contractor1.id,
      price: 42000000,
      timeline: '6 ngày',
      proposal: 'Sơn ngoại thất chuyên nghiệp với sơn Dulux Weathershield.',
      status: 'APPROVED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      responseTimeHours: 6.0,
    },
  });

  await prisma.bid.create({
    data: {
      code: 'BID-2024-009',
      projectId: projects.project6.id,
      contractorId: users.contractor4.id,
      price: 38000000,
      timeline: '7 ngày',
      proposal: 'Giá tốt, chất lượng đảm bảo.',
      status: 'APPROVED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      responseTimeHours: 10.0,
    },
  });

  // Bid for Project 7 (MATCHED) - Selected bid
  const bid7_selected = await prisma.bid.create({
    data: {
      code: 'BID-2024-010',
      projectId: projects.project7.id,
      contractorId: users.contractor1.id,
      price: 35000000,
      timeline: '4 ngày',
      proposal: 'Ốp lát chuyên nghiệp với gạch Viglacera 60x60.',
      status: 'SELECTED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      responseTimeHours: 4.0,
    },
  });

  // Update project7 with selectedBidId
  await prisma.project.update({
    where: { id: projects.project7.id },
    data: { selectedBidId: bid7_selected.id },
  });

  await prisma.bid.create({
    data: {
      code: 'BID-2024-011',
      projectId: projects.project7.id,
      contractorId: users.contractor2.id,
      price: 32000000,
      timeline: '5 ngày',
      proposal: 'Giá cạnh tranh.',
      status: 'NOT_SELECTED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      responseTimeHours: 8.0,
    },
  });

  // Bid for Project 8 (IN_PROGRESS) - Selected bid
  const bid8_selected = await prisma.bid.create({
    data: {
      code: 'BID-2024-012',
      projectId: projects.project8.id,
      contractorId: users.contractor3.id,
      price: 65000000,
      timeline: '12 ngày',
      proposal: 'Cải tạo nhà tắm cao cấp với thiết bị TOTO.',
      status: 'SELECTED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
      responseTimeHours: 6.0,
    },
  });

  await prisma.project.update({
    where: { id: projects.project8.id },
    data: { selectedBidId: bid8_selected.id },
  });

  // Bid for Project 9 (COMPLETED) - Selected bid
  const bid9_selected = await prisma.bid.create({
    data: {
      code: 'BID-2024-013',
      projectId: projects.project9.id,
      contractorId: users.contractor4.id,
      price: 10000000,
      timeline: '3 ngày',
      proposal: 'Sơn căn hộ studio nhanh gọn.',
      status: 'SELECTED',
      reviewedBy: users.admin.id,
      reviewedAt: new Date(now.getTime() - 48 * 24 * 60 * 60 * 1000),
      responseTimeHours: 2.0,
    },
  });

  await prisma.project.update({
    where: { id: projects.project9.id },
    data: { selectedBidId: bid9_selected.id },
  });

  console.log('✅ Created 13 bids');
  return { bid1_1, bid1_2, bid1_3, bid6_1, bid7_selected, bid8_selected, bid9_selected };
}

// ============================================
// SEED ESCROWS & FEES
// ============================================
async function seedEscrowsAndFees(
  users: Awaited<ReturnType<typeof seedUsers>>,
  projects: Awaited<ReturnType<typeof seedProjects>>,
  bids: Awaited<ReturnType<typeof seedBids>>
) {
  console.log('\n💳 Creating escrows and fee transactions...');

  const now = new Date();

  // Escrow for Project 7 (MATCHED) - HELD
  const escrow7 = await prisma.escrow.create({
    data: {
      code: 'ESC-2024-001',
      projectId: projects.project7.id,
      bidId: bids.bid7_selected.id,
      homeownerId: users.homeowner1.id,
      amount: 3500000, // 10% of 35M
      status: 'HELD',
      confirmedBy: users.admin.id,
      confirmedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      transactions: JSON.stringify([
        { type: 'DEPOSIT', amount: 3500000, date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), note: 'Đặt cọc ban đầu' },
        { type: 'CONFIRM', amount: 0, date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Admin xác nhận', adminId: users.admin.id },
      ]),
    },
  });

  // Milestones for Project 7
  await prisma.projectMilestone.createMany({
    data: [
      { escrowId: escrow7.id, projectId: projects.project7.id, name: '50% Completion', percentage: 50, releasePercentage: 50, status: 'PENDING' },
      { escrowId: escrow7.id, projectId: projects.project7.id, name: '100% Completion', percentage: 100, releasePercentage: 50, status: 'PENDING' },
    ],
  });

  // Fee for Project 7
  await prisma.feeTransaction.create({
    data: {
      code: 'FEE-2024-001',
      userId: users.contractor1.id,
      projectId: projects.project7.id,
      bidId: bids.bid7_selected.id,
      type: 'WIN_FEE',
      amount: 1750000, // 5% of 35M
      status: 'PENDING',
    },
  });

  // Escrow for Project 8 (IN_PROGRESS) - PARTIAL_RELEASED
  const escrow8 = await prisma.escrow.create({
    data: {
      code: 'ESC-2024-002',
      projectId: projects.project8.id,
      bidId: bids.bid8_selected.id,
      homeownerId: users.homeowner2.id,
      amount: 6500000, // 10% of 65M
      releasedAmount: 3250000, // 50% released
      status: 'PARTIAL_RELEASED',
      confirmedBy: users.admin.id,
      confirmedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      transactions: JSON.stringify([
        { type: 'DEPOSIT', amount: 6500000, date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), note: 'Đặt cọc ban đầu' },
        { type: 'CONFIRM', amount: 0, date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), note: 'Admin xác nhận', adminId: users.admin.id },
        { type: 'PARTIAL_RELEASE', amount: 3250000, date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), note: 'Giải phóng 50% - Milestone 1', adminId: users.admin.id },
      ]),
    },
  });

  // Milestones for Project 8
  await prisma.projectMilestone.createMany({
    data: [
      { escrowId: escrow8.id, projectId: projects.project8.id, name: '50% Completion', percentage: 50, releasePercentage: 50, status: 'CONFIRMED', confirmedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), confirmedBy: users.homeowner2.id },
      { escrowId: escrow8.id, projectId: projects.project8.id, name: '100% Completion', percentage: 100, releasePercentage: 50, status: 'PENDING' },
    ],
  });

  // Fee for Project 8
  await prisma.feeTransaction.create({
    data: {
      code: 'FEE-2024-002',
      userId: users.contractor3.id,
      projectId: projects.project8.id,
      bidId: bids.bid8_selected.id,
      type: 'WIN_FEE',
      amount: 3250000, // 5% of 65M
      status: 'PENDING',
    },
  });

  // Escrow for Project 9 (COMPLETED) - RELEASED
  const escrow9 = await prisma.escrow.create({
    data: {
      code: 'ESC-2024-003',
      projectId: projects.project9.id,
      bidId: bids.bid9_selected.id,
      homeownerId: users.homeowner3.id,
      amount: 1000000, // 10% of 10M
      releasedAmount: 1000000,
      status: 'RELEASED',
      confirmedBy: users.admin.id,
      confirmedAt: new Date(now.getTime() - 38 * 24 * 60 * 60 * 1000),
      releasedBy: users.admin.id,
      releasedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      transactions: JSON.stringify([
        { type: 'DEPOSIT', amount: 1000000, date: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(), note: 'Đặt cọc ban đầu' },
        { type: 'CONFIRM', amount: 0, date: new Date(now.getTime() - 38 * 24 * 60 * 60 * 1000).toISOString(), note: 'Admin xác nhận', adminId: users.admin.id },
        { type: 'RELEASE', amount: 1000000, date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), note: 'Giải phóng toàn bộ - Hoàn thành dự án', adminId: users.admin.id },
      ]),
    },
  });

  // Milestones for Project 9
  await prisma.projectMilestone.createMany({
    data: [
      { escrowId: escrow9.id, projectId: projects.project9.id, name: '50% Completion', percentage: 50, releasePercentage: 50, status: 'CONFIRMED', confirmedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), confirmedBy: users.homeowner3.id },
      { escrowId: escrow9.id, projectId: projects.project9.id, name: '100% Completion', percentage: 100, releasePercentage: 50, status: 'CONFIRMED', confirmedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), confirmedBy: users.homeowner3.id },
    ],
  });

  // Fee for Project 9 - PAID
  await prisma.feeTransaction.create({
    data: {
      code: 'FEE-2024-003',
      userId: users.contractor4.id,
      projectId: projects.project9.id,
      bidId: bids.bid9_selected.id,
      type: 'WIN_FEE',
      amount: 500000, // 5% of 10M
      status: 'PAID',
      paidAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      paidBy: users.admin.id,
    },
  });

  console.log('✅ Created 3 escrows, 6 milestones, and 3 fee transactions');
  return { escrow7, escrow8, escrow9 };
}


// ============================================
// SEED REVIEWS & RANKINGS
// ============================================
async function seedReviewsAndRankings(
  users: Awaited<ReturnType<typeof seedUsers>>,
  projects: Awaited<ReturnType<typeof seedProjects>>
) {
  console.log('\n⭐ Creating reviews and rankings...');

  const now = new Date();

  // Review for completed project 9
  const review1 = await prisma.review.create({
    data: {
      projectId: projects.project9.id,
      reviewerId: users.homeowner3.id,
      contractorId: users.contractor4.id,
      rating: 5,
      comment: 'Thợ sơn rất chuyên nghiệp, thi công nhanh và sạch sẽ. Màu sơn đẹp đúng như mong đợi. Rất hài lòng!',
      images: JSON.stringify([IMAGES.projects[5]]),
      qualityRating: 5,
      timelinessRating: 5,
      communicationRating: 5,
      valueRating: 4,
      isPublic: true,
      helpfulCount: 3,
      response: 'Cảm ơn anh/chị đã tin tưởng và đánh giá cao. Rất vui được phục vụ!',
      respondedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  // More reviews for contractor1 (from other completed projects - simulated)
  await prisma.review.create({
    data: {
      projectId: projects.project7.id,
      reviewerId: users.homeowner1.id,
      contractorId: users.contractor1.id,
      rating: 5,
      comment: 'Công ty Hoàng Long làm việc rất chuyên nghiệp. Đội ngũ thợ lành nghề, thi công đúng tiến độ.',
      qualityRating: 5,
      timelinessRating: 5,
      communicationRating: 4,
      valueRating: 4,
      isPublic: true,
      helpfulCount: 5,
    },
  });

  // Review helpfulness votes
  await prisma.reviewHelpfulness.createMany({
    data: [
      { reviewId: review1.id, userId: users.homeowner1.id },
      { reviewId: review1.id, userId: users.homeowner2.id },
      { reviewId: review1.id, userId: users.contractor1.id },
    ],
  });

  // Contractor Rankings
  await prisma.contractorRanking.createMany({
    data: [
      {
        contractorId: users.contractor1.id,
        ratingScore: 96,
        projectsScore: 100,
        responseScore: 90,
        verificationScore: 100,
        totalScore: 96.5,
        rank: 1,
        isFeatured: true,
        featuredAt: new Date(),
        featuredBy: users.admin.id,
        totalProjects: 25,
        completedProjects: 23,
        totalReviews: 20,
        averageRating: 4.8,
        averageResponseTime: 4.5,
      },
      {
        contractorId: users.contractor3.id,
        ratingScore: 98,
        projectsScore: 100,
        responseScore: 85,
        verificationScore: 100,
        totalScore: 95.75,
        rank: 2,
        isFeatured: true,
        featuredAt: new Date(),
        totalProjects: 42,
        completedProjects: 40,
        totalReviews: 35,
        averageRating: 4.9,
        averageResponseTime: 6.0,
      },
      {
        contractorId: users.contractor2.id,
        ratingScore: 90,
        projectsScore: 80,
        responseScore: 80,
        verificationScore: 100,
        totalScore: 87.0,
        rank: 3,
        totalProjects: 15,
        completedProjects: 14,
        totalReviews: 12,
        averageRating: 4.5,
        averageResponseTime: 8.0,
      },
      {
        contractorId: users.contractor4.id,
        ratingScore: 86,
        projectsScore: 50,
        responseScore: 95,
        verificationScore: 100,
        totalScore: 80.65,
        rank: 4,
        totalProjects: 8,
        completedProjects: 8,
        totalReviews: 6,
        averageRating: 4.3,
        averageResponseTime: 2.5,
      },
    ],
  });

  // Contractor Badges
  await prisma.contractorBadge.createMany({
    data: [
      { contractorId: users.contractor1.id, badgeType: 'ACTIVE_CONTRACTOR' },
      { contractorId: users.contractor1.id, badgeType: 'HIGH_QUALITY' },
      { contractorId: users.contractor3.id, badgeType: 'ACTIVE_CONTRACTOR' },
      { contractorId: users.contractor3.id, badgeType: 'HIGH_QUALITY' },
      { contractorId: users.contractor4.id, badgeType: 'FAST_RESPONDER' },
    ],
  });

  console.log('✅ Created 2 reviews, 4 rankings, and 5 badges');
}

// ============================================
// SEED CHAT & NOTIFICATIONS
// ============================================
async function seedChatAndNotifications(
  users: Awaited<ReturnType<typeof seedUsers>>,
  projects: Awaited<ReturnType<typeof seedProjects>>
) {
  console.log('\n💬 Creating chat conversations and notifications...');

  const now = new Date();

  // Conversation for Project 7 (MATCHED)
  const conv1 = await prisma.conversation.create({
    data: {
      projectId: projects.project7.id,
    },
  });

  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: conv1.id, userId: users.homeowner1.id },
      { conversationId: conv1.id, userId: users.contractor1.id },
    ],
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conv1.id, senderId: users.homeowner1.id, content: 'Chào anh, khi nào anh có thể bắt đầu thi công ạ?', type: 'TEXT', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { conversationId: conv1.id, senderId: users.contractor1.id, content: 'Chào anh/chị, em có thể bắt đầu từ thứ 2 tuần sau ạ. Anh/chị xem có tiện không?', type: 'TEXT', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000) },
      { conversationId: conv1.id, senderId: users.homeowner1.id, content: 'Được anh, thứ 2 tuần sau nhé. Anh đến lúc mấy giờ?', type: 'TEXT', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000) },
      { conversationId: conv1.id, senderId: users.contractor1.id, content: 'Dạ em sẽ đến lúc 8h sáng ạ. Em sẽ mang theo đầy đủ dụng cụ và vật liệu.', type: 'TEXT', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000) },
    ],
  });

  // Conversation for Project 8 (IN_PROGRESS)
  const conv2 = await prisma.conversation.create({
    data: {
      projectId: projects.project8.id,
    },
  });

  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: conv2.id, userId: users.homeowner2.id },
      { conversationId: conv2.id, userId: users.contractor3.id },
    ],
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conv2.id, senderId: users.contractor3.id, content: 'Chào chị, em đã hoàn thành 50% công việc. Chị có thể qua kiểm tra được không ạ?', type: 'TEXT', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { conversationId: conv2.id, senderId: users.homeowner2.id, content: 'Được em, chiều nay chị qua nhé.', type: 'TEXT', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) },
      { conversationId: conv2.id, senderId: users.homeowner2.id, content: 'Chị đã kiểm tra rồi, làm đẹp lắm em. Tiếp tục phát huy nhé!', type: 'TEXT', createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
      { conversationId: conv2.id, senderId: users.contractor3.id, content: 'Dạ cảm ơn chị. Em sẽ cố gắng hoàn thành sớm ạ.', type: 'TEXT', createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000) },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      // For homeowner1
      { userId: users.homeowner1.id, type: 'BID_RECEIVED', title: 'Có bid mới cho dự án của bạn', content: 'Công ty TNHH Xây Dựng Hoàng Long đã gửi báo giá cho dự án "Sơn lại căn hộ 2 phòng ngủ"', data: JSON.stringify({ projectId: projects.project1.id }), isRead: true, readAt: new Date() },
      { userId: users.homeowner1.id, type: 'BID_RECEIVED', title: 'Có bid mới cho dự án của bạn', content: 'Đội Thợ Anh Tuấn đã gửi báo giá cho dự án "Sơn lại căn hộ 2 phòng ngủ"', data: JSON.stringify({ projectId: projects.project1.id }), isRead: false },
      { userId: users.homeowner1.id, type: 'ESCROW_HELD', title: 'Đặt cọc đã được xác nhận', content: 'Tiền đặt cọc 3,500,000 VNĐ cho dự án "Ốp lát phòng khách 30m2" đã được xác nhận.', data: JSON.stringify({ projectId: projects.project7.id }), isRead: true, readAt: new Date() },
      
      // For contractor1
      { userId: users.contractor1.id, type: 'BID_APPROVED', title: 'Bid đã được duyệt', content: 'Báo giá của bạn cho dự án "Sơn lại căn hộ 2 phòng ngủ" đã được admin duyệt.', data: JSON.stringify({ projectId: projects.project1.id }), isRead: true, readAt: new Date() },
      { userId: users.contractor1.id, type: 'BID_SELECTED', title: 'Chúc mừng! Bạn đã được chọn', content: 'Bạn đã được chọn cho dự án "Ốp lát phòng khách 30m2". Hãy liên hệ với chủ nhà để bắt đầu.', data: JSON.stringify({ projectId: projects.project7.id }), isRead: true, readAt: new Date() },
      
      // For contractor2
      { userId: users.contractor2.id, type: 'BID_NOT_SELECTED', title: 'Thông báo kết quả đấu giá', content: 'Rất tiếc, báo giá của bạn cho dự án "Ốp lát phòng khách 30m2" không được chọn.', data: JSON.stringify({ projectId: projects.project7.id }), isRead: false },
      
      // For contractor3
      { userId: users.contractor3.id, type: 'BID_SELECTED', title: 'Chúc mừng! Bạn đã được chọn', content: 'Bạn đã được chọn cho dự án "Cải tạo nhà tắm master bedroom".', data: JSON.stringify({ projectId: projects.project8.id }), isRead: true, readAt: new Date() },
      { userId: users.contractor3.id, type: 'MILESTONE_CONFIRMED', title: 'Milestone đã được xác nhận', content: 'Chủ nhà đã xác nhận hoàn thành 50% dự án "Cải tạo nhà tắm master bedroom".', data: JSON.stringify({ projectId: projects.project8.id }), isRead: true, readAt: new Date() },
    ],
  });

  // Notification Preferences
  await prisma.notificationPreference.createMany({
    data: [
      { userId: users.homeowner1.id, emailEnabled: true, smsEnabled: true },
      { userId: users.homeowner2.id, emailEnabled: true, smsEnabled: false },
      { userId: users.contractor1.id, emailEnabled: true, smsEnabled: true },
      { userId: users.contractor3.id, emailEnabled: true, smsEnabled: true },
    ],
  });

  // Notification Templates
  await prisma.notificationTemplate.createMany({
    data: [
      {
        type: 'BID_RECEIVED',
        emailSubject: 'Có báo giá mới cho dự án {{projectCode}}',
        emailBody: '<h1>Xin chào {{homeownerName}}</h1><p>Nhà thầu {{contractorName}} đã gửi báo giá {{price}} VNĐ cho dự án {{projectTitle}}.</p>',
        smsBody: 'ATH: Co bao gia moi {{price}} VND cho du an {{projectCode}}',
        inAppTitle: 'Có báo giá mới',
        inAppBody: '{{contractorName}} đã gửi báo giá {{price}} VNĐ',
        variables: JSON.stringify(['projectCode', 'projectTitle', 'homeownerName', 'contractorName', 'price']),
      },
      {
        type: 'BID_SELECTED',
        emailSubject: 'Chúc mừng! Bạn đã được chọn cho dự án {{projectCode}}',
        emailBody: '<h1>Xin chào {{contractorName}}</h1><p>Chúc mừng! Bạn đã được chọn cho dự án {{projectTitle}}. Vui lòng liên hệ với chủ nhà để bắt đầu.</p>',
        smsBody: 'ATH: Chuc mung! Ban da duoc chon cho du an {{projectCode}}',
        inAppTitle: 'Bạn đã được chọn!',
        inAppBody: 'Chúc mừng! Bạn đã được chọn cho dự án {{projectTitle}}',
        variables: JSON.stringify(['projectCode', 'projectTitle', 'contractorName']),
      },
      {
        type: 'ESCROW_HELD',
        emailSubject: 'Đặt cọc đã được xác nhận - {{projectCode}}',
        emailBody: '<h1>Xin chào</h1><p>Tiền đặt cọc {{amount}} VNĐ cho dự án {{projectTitle}} đã được xác nhận.</p>',
        smsBody: 'ATH: Dat coc {{amount}} VND da duoc xac nhan',
        inAppTitle: 'Đặt cọc đã xác nhận',
        inAppBody: 'Tiền đặt cọc {{amount}} VNĐ đã được xác nhận',
        variables: JSON.stringify(['projectCode', 'projectTitle', 'amount']),
      },
    ],
  });

  console.log('✅ Created 2 conversations, 8 messages, 8 notifications, 4 preferences, and 3 templates');
}

// ============================================
// SEED CUSTOMER LEADS
// ============================================
async function seedCustomerLeads() {
  console.log('\n📞 Creating customer leads...');

  const now = new Date();

  await prisma.customerLead.createMany({
    data: [
      {
        name: 'Nguyễn Văn Hùng',
        phone: '0901234567',
        email: 'hungnv@gmail.com',
        content: 'Cần sơn lại căn hộ 80m2 tại Quận 2. Dự kiến thi công tháng sau.',
        source: 'QUOTE_FORM',
        status: 'NEW',
        quoteData: JSON.stringify({ category: 'Sơn tường', area: 80, estimatedPrice: 28000000 }),
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Trần Thị Mai',
        phone: '0912345678',
        email: 'maitran@gmail.com',
        content: 'Muốn cải tạo nhà tắm, thay thiết bị vệ sinh mới.',
        source: 'CONTACT_FORM',
        status: 'CONTACTED',
        notes: 'Đã gọi điện, hẹn gặp thứ 7 tuần này',
        statusHistory: JSON.stringify([
          { from: 'NEW', to: 'CONTACTED', changedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() },
        ]),
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Lê Hoàng Phúc',
        phone: '0923456789',
        content: 'Cần báo giá ốp lát gạch phòng khách 40m2.',
        source: 'QUOTE_FORM',
        status: 'CONVERTED',
        quoteData: JSON.stringify({ category: 'Ốp lát gạch', area: 40, estimatedPrice: 48000000 }),
        notes: 'Đã ký hợp đồng, bắt đầu thi công tuần sau',
        statusHistory: JSON.stringify([
          { from: 'NEW', to: 'CONTACTED', changedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { from: 'CONTACTED', to: 'CONVERTED', changedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        ]),
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Phạm Văn Đức',
        phone: '0934567890',
        email: 'ducpham@gmail.com',
        content: 'Hỏi về dịch vụ chống thấm sân thượng.',
        source: 'CONTACT_FORM',
        status: 'CANCELLED',
        notes: 'Khách hủy do đã tìm được nhà thầu khác',
        statusHistory: JSON.stringify([
          { from: 'NEW', to: 'CONTACTED', changedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
          { from: 'CONTACTED', to: 'CANCELLED', changedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        ]),
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Võ Thị Lan',
        phone: '0945678901',
        content: 'Cần tư vấn cải tạo căn hộ cũ 60m2.',
        source: 'QUOTE_FORM',
        status: 'NEW',
        quoteData: JSON.stringify({ category: 'Cải tạo căn hộ', area: 60, estimatedPrice: 120000000 }),
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Created 5 customer leads');
}


// ============================================
// SEED INTERIOR MODULE
// ============================================
async function seedInteriorModule() {
  console.log('\n🏠 Creating interior module data...');

  // Room Types
  const roomTypes = await Promise.all([
    prisma.interiorRoomType.create({ data: { code: 'LIVING_ROOM', name: 'Phòng khách', nameEn: 'Living Room', icon: 'ri-sofa-line', order: 1 } }),
    prisma.interiorRoomType.create({ data: { code: 'BEDROOM', name: 'Phòng ngủ', nameEn: 'Bedroom', icon: 'ri-hotel-bed-line', order: 2 } }),
    prisma.interiorRoomType.create({ data: { code: 'KITCHEN', name: 'Phòng bếp', nameEn: 'Kitchen', icon: 'ri-restaurant-line', order: 3 } }),
    prisma.interiorRoomType.create({ data: { code: 'BATHROOM', name: 'Phòng tắm', nameEn: 'Bathroom', icon: 'ri-drop-line', order: 4 } }),
    prisma.interiorRoomType.create({ data: { code: 'BALCONY', name: 'Ban công', nameEn: 'Balcony', icon: 'ri-plant-line', order: 5 } }),
  ]);

  // Quote Settings
  await prisma.interiorQuoteSettings.create({
    data: {
      id: 'default',
      laborCostPerSqm: 500000,
      laborCostMin: 30000000,
      laborCostMax: 150000000,
      managementFeeType: 'PERCENTAGE',
      managementFeeValue: 5,
      contingencyType: 'PERCENTAGE',
      contingencyValue: 3,
      vatEnabled: true,
      vatPercent: 10,
      maxDiscountPercent: 15,
      quoteValidityDays: 30,
      showItemBreakdown: true,
      showRoomBreakdown: true,
      showPricePerSqm: true,
      companyName: 'Anh Thợ Xây',
      companyPhone: '0909 123 456',
      companyEmail: 'contact@anhthoxay.vn',
      companyAddress: 'TP. Hồ Chí Minh',
    },
  });

  // Developers
  const vingroup = await prisma.interiorDeveloper.create({
    data: {
      name: 'Vingroup',
      slug: 'vingroup',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Vingroup_logo.svg/200px-Vingroup_logo.svg.png',
      description: 'Tập đoàn Vingroup - Chủ đầu tư hàng đầu Việt Nam',
      website: 'https://vingroup.net',
      phone: '1900 232 389',
      email: 'contact@vingroup.net',
      order: 1,
    },
  });

  const novaland = await prisma.interiorDeveloper.create({
    data: {
      name: 'Novaland',
      slug: 'novaland',
      logo: 'https://novaland.com.vn/Data/Sites/1/media/logo/logo-novaland.png',
      description: 'Tập đoàn Novaland - Nhà phát triển bất động sản uy tín',
      website: 'https://novaland.com.vn',
      phone: '1900 63 6666',
      email: 'contact@novaland.com.vn',
      order: 2,
    },
  });

  const capitaland = await prisma.interiorDeveloper.create({
    data: {
      name: 'CapitaLand',
      slug: 'capitaland',
      description: 'CapitaLand Development - Tập đoàn bất động sản Singapore',
      website: 'https://capitaland.com',
      order: 3,
    },
  });

  // Developments
  const vinhomesGrandPark = await prisma.interiorDevelopment.create({
    data: {
      developerId: vingroup.id,
      name: 'Vinhomes Grand Park',
      code: 'VGP',
      slug: 'vinhomes-grand-park',
      address: 'Phường Long Thạnh Mỹ, Quận 9',
      district: 'Quận 9',
      city: 'TP. Hồ Chí Minh',
      description: 'Đại đô thị đẳng cấp Singapore và hơn thế nữa',
      thumbnail: IMAGES.interior[0],
      images: JSON.stringify(IMAGES.interior.slice(0, 3)),
      totalBuildings: 50,
      totalUnits: 30000,
      startYear: 2019,
      completionYear: 2024,
      order: 1,
    },
  });

  const vinhomesCentralPark = await prisma.interiorDevelopment.create({
    data: {
      developerId: vingroup.id,
      name: 'Vinhomes Central Park',
      code: 'VCP',
      slug: 'vinhomes-central-park',
      address: 'Phường 22, Quận Bình Thạnh',
      district: 'Bình Thạnh',
      city: 'TP. Hồ Chí Minh',
      description: 'Khu đô thị đẳng cấp bên sông Sài Gòn',
      thumbnail: IMAGES.interior[1],
      images: JSON.stringify(IMAGES.interior.slice(1, 4)),
      totalBuildings: 18,
      totalUnits: 10000,
      startYear: 2015,
      completionYear: 2018,
      order: 2,
    },
  });

  const sunriseCity = await prisma.interiorDevelopment.create({
    data: {
      developerId: novaland.id,
      name: 'Sunrise City',
      code: 'SRC',
      slug: 'sunrise-city',
      address: 'Đường Nguyễn Hữu Thọ, Quận 7',
      district: 'Quận 7',
      city: 'TP. Hồ Chí Minh',
      description: 'Khu phức hợp cao cấp tại Nam Sài Gòn',
      thumbnail: IMAGES.interior[2],
      totalBuildings: 6,
      totalUnits: 2000,
      startYear: 2012,
      completionYear: 2016,
      order: 3,
    },
  });

  // Buildings
  const buildingS1 = await prisma.interiorBuilding.create({
    data: {
      developmentId: vinhomesGrandPark.id,
      name: 'Tòa S1',
      code: 'S1',
      totalFloors: 35,
      startFloor: 3,
      endFloor: 35,
      axisLabels: JSON.stringify(['01', '02', '03', '04', '05', '06', '07', '08']),
      unitsPerFloor: 8,
      unitCodeFormat: 'S1.{floor}.{axis}',
      thumbnail: IMAGES.interior[0],
      order: 1,
    },
  });

  await prisma.interiorBuilding.create({
    data: {
      developmentId: vinhomesGrandPark.id,
      name: 'Tòa S2',
      code: 'S2',
      totalFloors: 35,
      startFloor: 3,
      endFloor: 35,
      axisLabels: JSON.stringify(['01', '02', '03', '04', '05', '06', '07', '08']),
      unitsPerFloor: 8,
      unitCodeFormat: 'S2.{floor}.{axis}',
      order: 2,
    },
  });

  await prisma.interiorBuilding.create({
    data: {
      developmentId: vinhomesCentralPark.id,
      name: 'Landmark 81',
      code: 'L81',
      totalFloors: 81,
      startFloor: 45,
      endFloor: 81,
      axisLabels: JSON.stringify(['A', 'B', 'C', 'D']),
      unitsPerFloor: 4,
      unitCodeFormat: 'L81.{floor}{axis}',
      thumbnail: IMAGES.interior[1],
      order: 1,
    },
  });

  // Layouts
  const layout2PN_A = await prisma.interiorUnitLayout.create({
    data: {
      name: 'Layout 2PN - Type A',
      code: 'VGP-2PN-A',
      unitType: '2PN',
      bedrooms: 2,
      bathrooms: 2,
      grossArea: 69.5,
      netArea: 59.2,
      carpetArea: 52.0,
      balconyArea: 5.5,
      rooms: JSON.stringify([
        { name: 'Phòng khách', area: 18.5, type: 'LIVING_ROOM' },
        { name: 'Phòng ngủ chính', area: 14.0, type: 'BEDROOM' },
        { name: 'Phòng ngủ 2', area: 10.5, type: 'BEDROOM' },
        { name: 'Phòng bếp', area: 8.0, type: 'KITCHEN' },
        { name: 'Phòng tắm 1', area: 4.5, type: 'BATHROOM' },
        { name: 'Phòng tắm 2', area: 3.7, type: 'BATHROOM' },
        { name: 'Ban công', area: 5.5, type: 'BALCONY' },
      ]),
      highlights: JSON.stringify(['2 mặt thoáng', 'View hồ bơi', 'Phòng ngủ có cửa sổ']),
      description: 'Căn hộ 2 phòng ngủ thiết kế thông minh, tối ưu không gian sống',
      layoutImage: IMAGES.interior[3],
    },
  });

  const layout3PN_B = await prisma.interiorUnitLayout.create({
    data: {
      name: 'Layout 3PN - Type B',
      code: 'VGP-3PN-B',
      unitType: '3PN',
      bedrooms: 3,
      bathrooms: 2,
      grossArea: 89.0,
      netArea: 76.5,
      carpetArea: 68.0,
      balconyArea: 7.0,
      rooms: JSON.stringify([
        { name: 'Phòng khách', area: 22.0, type: 'LIVING_ROOM' },
        { name: 'Phòng ngủ chính', area: 16.0, type: 'BEDROOM' },
        { name: 'Phòng ngủ 2', area: 12.0, type: 'BEDROOM' },
        { name: 'Phòng ngủ 3', area: 10.0, type: 'BEDROOM' },
        { name: 'Phòng bếp', area: 10.0, type: 'KITCHEN' },
        { name: 'Phòng tắm 1', area: 5.0, type: 'BATHROOM' },
        { name: 'Phòng tắm 2', area: 4.5, type: 'BATHROOM' },
        { name: 'Ban công', area: 7.0, type: 'BALCONY' },
      ]),
      highlights: JSON.stringify(['3 phòng ngủ rộng rãi', 'View công viên', 'Phòng khách liền bếp']),
      description: 'Căn hộ 3 phòng ngủ lý tưởng cho gia đình',
      layoutImage: IMAGES.interior[4],
    },
  });

  const layoutStudio = await prisma.interiorUnitLayout.create({
    data: {
      name: 'Layout Studio',
      code: 'VGP-STUDIO',
      unitType: 'STUDIO',
      bedrooms: 0,
      bathrooms: 1,
      grossArea: 32.0,
      netArea: 27.5,
      carpetArea: 24.0,
      balconyArea: 3.0,
      rooms: JSON.stringify([
        { name: 'Phòng chính', area: 18.0, type: 'LIVING_ROOM' },
        { name: 'Phòng bếp', area: 5.0, type: 'KITCHEN' },
        { name: 'Phòng tắm', area: 4.5, type: 'BATHROOM' },
        { name: 'Ban công', area: 3.0, type: 'BALCONY' },
      ]),
      highlights: JSON.stringify(['Thiết kế mở', 'Phù hợp người độc thân', 'Giá tốt']),
      description: 'Căn hộ Studio nhỏ gọn, tiện nghi',
    },
  });

  // Building Units
  const axes = ['01', '02', '03', '04', '05', '06', '07', '08'];
  for (const axis of axes) {
    const unitType = ['01', '02', '07', '08'].includes(axis) ? '2PN' : '3PN';
    const layout = unitType === '2PN' ? layout2PN_A : layout3PN_B;
    const position = ['01', '08'].includes(axis) ? 'CORNER' : ['02', '07'].includes(axis) ? 'EDGE' : 'MIDDLE';

    await prisma.interiorBuildingUnit.create({
      data: {
        buildingId: buildingS1.id,
        axis,
        unitType,
        bedrooms: layout.bedrooms,
        bathrooms: layout.bathrooms,
        position,
        direction: ['01', '02'].includes(axis) ? 'ĐÔNG' : ['07', '08'].includes(axis) ? 'TÂY' : 'NAM',
        floorStart: 3,
        floorEnd: 35,
        layoutId: layout.id,
      },
    });
  }

  // Packages
  await prisma.interiorPackage.create({
    data: {
      layoutId: layout2PN_A.id,
      name: 'Gói Cơ Bản',
      code: 'BASIC-2PN',
      tier: 1,
      description: 'Gói nội thất cơ bản với đầy đủ tiện nghi thiết yếu',
      shortDescription: 'Đầy đủ tiện nghi cơ bản',
      basePrice: 150000000,
      pricePerSqm: 2534000,
      thumbnail: IMAGES.interior[0],
      images: JSON.stringify(IMAGES.interior.slice(0, 2)),
      totalItems: 45,
      totalItemsPrice: 120000000,
      warrantyMonths: 12,
      installationDays: 30,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa góc L', brand: 'Nội thất Hòa Phát', material: 'Vải', qty: 1, price: 8000000 },
            { name: 'Bàn trà', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 2500000 },
            { name: 'Kệ TV', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 4000000 },
          ],
        },
        {
          room: 'Phòng ngủ chính',
          items: [
            { name: 'Giường ngủ 1m8', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 6000000 },
            { name: 'Tủ quần áo 2 cánh', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 5000000 },
          ],
        },
      ]),
      order: 1,
    },
  });

  await prisma.interiorPackage.create({
    data: {
      layoutId: layout2PN_A.id,
      name: 'Gói Tiêu Chuẩn',
      code: 'STANDARD-2PN',
      tier: 2,
      description: 'Gói nội thất tiêu chuẩn với chất lượng tốt hơn',
      shortDescription: 'Chất lượng tốt, thiết kế đẹp',
      basePrice: 250000000,
      pricePerSqm: 4223000,
      thumbnail: IMAGES.interior[1],
      images: JSON.stringify(IMAGES.interior.slice(1, 3)),
      totalItems: 60,
      totalItemsPrice: 200000000,
      warrantyMonths: 24,
      installationDays: 45,
      isFeatured: true,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa góc L cao cấp', brand: 'IKEA', material: 'Da thật', qty: 1, price: 25000000 },
            { name: 'Bàn trà kính', brand: 'IKEA', material: 'Kính cường lực', qty: 1, price: 5000000 },
          ],
        },
      ]),
      order: 2,
    },
  });

  await prisma.interiorPackage.create({
    data: {
      layoutId: layout2PN_A.id,
      name: 'Gói Cao Cấp',
      code: 'PREMIUM-2PN',
      tier: 3,
      description: 'Gói nội thất cao cấp với vật liệu và thiết kế sang trọng',
      shortDescription: 'Sang trọng, đẳng cấp',
      basePrice: 400000000,
      pricePerSqm: 6757000,
      thumbnail: IMAGES.interior[2],
      images: JSON.stringify(IMAGES.interior.slice(2, 5)),
      totalItems: 80,
      totalItemsPrice: 350000000,
      warrantyMonths: 36,
      installationDays: 60,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa Ý nhập khẩu', brand: 'Natuzzi', material: 'Da Ý', qty: 1, price: 80000000 },
          ],
        },
      ]),
      order: 3,
    },
  });

  // Surcharges
  await prisma.interiorSurcharge.createMany({
    data: [
      { name: 'Phụ phí tầng cao', code: 'HIGH_FLOOR', type: 'PER_FLOOR', value: 500000, conditions: JSON.stringify({ minFloor: 20 }), description: 'Phụ phí vận chuyển cho các tầng từ 20 trở lên', isAutoApply: true, order: 1 },
      { name: 'Phụ phí căn góc', code: 'CORNER_UNIT', type: 'PERCENTAGE', value: 3, conditions: JSON.stringify({ positions: ['CORNER'] }), description: 'Phụ phí thiết kế cho căn góc', isAutoApply: true, order: 2 },
      { name: 'Phụ phí diện tích lớn', code: 'LARGE_AREA', type: 'FIXED', value: 5000000, conditions: JSON.stringify({ minArea: 100 }), description: 'Phụ phí cho căn hộ từ 100m² trở lên', isAutoApply: true, order: 3 },
      { name: 'Thi công nhanh', code: 'EXPRESS_INSTALL', type: 'PERCENTAGE', value: 10, description: 'Phụ phí thi công nhanh (giảm 30% thời gian)', isAutoApply: false, isOptional: true, order: 4 },
    ],
  });

  // Furniture Categories
  const catLivingRoom = await prisma.interiorFurnitureCategory.create({
    data: { name: 'Nội thất phòng khách', slug: 'phong-khach', icon: 'ri-sofa-line', roomTypes: JSON.stringify(['LIVING_ROOM']), order: 1 },
  });

  const catBedroom = await prisma.interiorFurnitureCategory.create({
    data: { name: 'Nội thất phòng ngủ', slug: 'phong-ngu', icon: 'ri-hotel-bed-line', roomTypes: JSON.stringify(['BEDROOM']), order: 2 },
  });

  const catKitchen = await prisma.interiorFurnitureCategory.create({
    data: { name: 'Nội thất phòng bếp', slug: 'phong-bep', icon: 'ri-restaurant-line', roomTypes: JSON.stringify(['KITCHEN']), order: 3 },
  });

  // Furniture Items
  await prisma.interiorFurnitureItem.createMany({
    data: [
      { categoryId: catLivingRoom.id, name: 'Sofa góc L vải', sku: 'SOFA-001', brand: 'Nội thất Hòa Phát', material: 'Vải bố', color: 'Xám', dimensions: JSON.stringify({ width: 280, height: 85, depth: 180, unit: 'cm' }), price: 8000000, costPrice: 5000000, warrantyMonths: 12, thumbnail: IMAGES.interior[0], order: 1 },
      { categoryId: catLivingRoom.id, name: 'Sofa góc L da thật', sku: 'SOFA-002', brand: 'IKEA', material: 'Da thật', color: 'Nâu', dimensions: JSON.stringify({ width: 300, height: 90, depth: 200, unit: 'cm' }), price: 25000000, costPrice: 18000000, warrantyMonths: 24, thumbnail: IMAGES.interior[1], order: 2 },
      { categoryId: catBedroom.id, name: 'Giường ngủ 1m8 gỗ MDF', sku: 'BED-001', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', color: 'Trắng', dimensions: JSON.stringify({ width: 180, height: 40, depth: 200, unit: 'cm' }), price: 6000000, costPrice: 4000000, warrantyMonths: 12, thumbnail: IMAGES.interior[2], order: 1 },
      { categoryId: catKitchen.id, name: 'Tủ bếp trên gỗ MDF', sku: 'KITCHEN-001', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', color: 'Trắng', dimensions: JSON.stringify({ width: 240, height: 70, depth: 35, unit: 'cm' }), price: 8000000, costPrice: 5500000, warrantyMonths: 12, thumbnail: IMAGES.interior[3], order: 1 },
    ],
  });

  console.log('✅ Created interior module: 5 room types, 3 developers, 3 developments, 3 buildings, 3 layouts, 8 units, 3 packages, 4 surcharges, 3 furniture categories, 4 furniture items');
  
  // Ignore unused variables
  void roomTypes;
  void capitaland;
  void sunriseCity;
  void layoutStudio;
}


// ============================================
// SEED SAVED PROJECTS
// ============================================
async function seedSavedProjects(
  users: Awaited<ReturnType<typeof seedUsers>>,
  projects: Awaited<ReturnType<typeof seedProjects>>
) {
  console.log('\n📌 Creating saved projects...');

  await prisma.savedProject.createMany({
    data: [
      { contractorId: users.contractor1.id, projectId: projects.project2.id },
      { contractorId: users.contractor1.id, projectId: projects.project3.id },
      { contractorId: users.contractor2.id, projectId: projects.project1.id },
      { contractorId: users.contractor3.id, projectId: projects.project1.id },
      { contractorId: users.contractor3.id, projectId: projects.project2.id },
      { contractorId: users.contractor4.id, projectId: projects.project3.id },
    ],
  });

  console.log('✅ Created 6 saved projects');
}

// ============================================
// SEED CMS PAGES
// ============================================
async function seedCMSPages() {
  console.log('\n📄 Creating CMS pages with detailed sections...');

  // Home page
  const homePage = await prisma.page.create({
    data: {
      slug: 'home',
      title: 'Trang chủ',
      isActive: true,
      headerConfig: JSON.stringify({ showLogo: true, showNav: true, transparent: true }),
      footerConfig: JSON.stringify({ showContact: true, showSocial: true }),
    },
  });

  await prisma.section.createMany({
    data: [
      {
        pageId: homePage.id,
        kind: 'HERO',
        order: 1,
        data: JSON.stringify({
          title: 'Anh Thợ Xây',
          subtitle: 'Nền tảng kết nối chủ nhà với nhà thầu uy tín hàng đầu Việt Nam',
          ctaText: 'Đăng dự án ngay',
          ctaLink: '/portal/homeowner/projects/create',
          imageUrl: IMAGES.hero[0],
          overlayOpacity: 0.5,
        }),
      },
      {
        pageId: homePage.id,
        kind: 'STATS',
        order: 2,
        data: JSON.stringify({
          title: 'Con số ấn tượng',
          stats: [
            { value: 500, label: 'Nhà thầu uy tín', icon: 'ri-user-star-line', color: '#F5D393' },
            { value: 2000, label: 'Dự án hoàn thành', icon: 'ri-building-2-line', color: '#EFB679' },
            { value: 98, label: 'Khách hàng hài lòng', icon: 'ri-heart-line', suffix: '%', color: '#34D399' },
            { value: 24, label: 'Hỗ trợ khách hàng', icon: 'ri-customer-service-2-line', suffix: '/7', color: '#3B82F6' },
          ],
        }),
      },
      {
        pageId: homePage.id,
        kind: 'FEATURES',
        order: 3,
        data: JSON.stringify({
          title: 'Tại sao chọn Anh Thợ Xây?',
          subtitle: 'Chúng tôi mang đến giải pháp toàn diện cho mọi nhu cầu cải tạo nhà của bạn',
          features: [
            { icon: 'ri-shield-check-line', title: 'Nhà thầu được xác minh', description: 'Tất cả nhà thầu đều được kiểm tra hồ sơ, giấy phép và đánh giá chất lượng trước khi tham gia nền tảng' },
            { icon: 'ri-money-dollar-circle-line', title: 'Báo giá minh bạch', description: 'Nhận nhiều báo giá chi tiết từ các nhà thầu, so sánh và chọn lựa phù hợp với ngân sách' },
            { icon: 'ri-secure-payment-line', title: 'Thanh toán an toàn', description: 'Hệ thống escrow giữ tiền đặt cọc, chỉ giải ngân khi công việc hoàn thành đúng cam kết' },
            { icon: 'ri-customer-service-2-line', title: 'Hỗ trợ tận tâm', description: 'Đội ngũ chăm sóc khách hàng 24/7, hỗ trợ giải quyết mọi vấn đề phát sinh' },
            { icon: 'ri-star-line', title: 'Đánh giá thực tế', description: 'Hệ thống đánh giá từ khách hàng thực, giúp bạn chọn nhà thầu phù hợp nhất' },
            { icon: 'ri-time-line', title: 'Tiết kiệm thời gian', description: 'Đăng dự án một lần, nhận báo giá từ nhiều nhà thầu trong vòng 24-48 giờ' },
          ],
        }),
      },
      {
        pageId: homePage.id,
        kind: 'FEATURES',
        order: 4,
        data: JSON.stringify({
          title: 'Dịch vụ của chúng tôi',
          subtitle: 'Đa dạng dịch vụ cải tạo, sửa chữa nhà ở',
          features: [
            { icon: 'ri-paint-brush-line', title: 'Sơn tường', description: 'Sơn nội thất, ngoại thất với các thương hiệu uy tín như Dulux, Jotun, Nippon' },
            { icon: 'ri-layout-grid-line', title: 'Ốp lát gạch', description: 'Ốp lát nền, tường với gạch ceramic, granite, porcelain chất lượng cao' },
            { icon: 'ri-building-2-line', title: 'Cải tạo căn hộ', description: 'Cải tạo toàn diện căn hộ chung cư, nhà phố theo phong cách hiện đại' },
            { icon: 'ri-shield-check-line', title: 'Chống thấm', description: 'Chống thấm sân thượng, nhà vệ sinh, tầng hầm với vật liệu Sika, Kova' },
            { icon: 'ri-flashlight-line', title: 'Điện dân dụng', description: 'Sửa chữa, lắp đặt hệ thống điện an toàn, tiết kiệm năng lượng' },
            { icon: 'ri-drop-line', title: 'Nước sinh hoạt', description: 'Sửa chữa, thay thế đường ống nước, thiết bị vệ sinh' },
          ],
        }),
      },
      {
        pageId: homePage.id,
        kind: 'TESTIMONIALS',
        order: 5,
        data: JSON.stringify({
          title: 'Khách hàng nói gì về chúng tôi?',
          items: [
            {
              name: 'Anh Nguyễn Văn Minh',
              role: 'Chủ căn hộ tại Vinhomes Central Park',
              avatarUrl: IMAGES.avatars[3],
              text: 'Tôi rất hài lòng với dịch vụ của Anh Thợ Xây. Nhà thầu được giới thiệu rất chuyên nghiệp, thi công đúng tiến độ và chất lượng vượt mong đợi.',
              rating: 5,
            },
            {
              name: 'Chị Trần Thị Hương',
              role: 'Chủ nhà tại Quận 7',
              avatarUrl: IMAGES.avatars[4],
              text: 'Lần đầu cải tạo nhà nên khá lo lắng, nhưng đội ngũ hỗ trợ của Anh Thợ Xây rất tận tâm, giúp tôi chọn được nhà thầu phù hợp với ngân sách.',
              rating: 5,
            },
            {
              name: 'Anh Lê Hoàng Nam',
              role: 'Chủ căn hộ tại Sunrise City',
              avatarUrl: IMAGES.avatars[0],
              text: 'Hệ thống escrow giúp tôi yên tâm hơn khi thanh toán. Công trình hoàn thành đẹp, đúng như thiết kế ban đầu.',
              rating: 5,
            },
          ],
          autoplay: true,
          layout: 'carousel',
        }),
      },
      {
        pageId: homePage.id,
        kind: 'FEATURED_BLOG_POSTS',
        order: 6,
        data: JSON.stringify({
          title: 'Kiến thức hữu ích',
          subtitle: 'Cập nhật những bài viết mới nhất về xây dựng, cải tạo nhà',
          limit: 3,
        }),
      },
      {
        pageId: homePage.id,
        kind: 'CTA',
        order: 7,
        data: JSON.stringify({
          title: 'Bắt đầu dự án của bạn ngay hôm nay',
          subtitle: 'Đăng dự án miễn phí và nhận báo giá từ các nhà thầu uy tín trong vòng 24 giờ',
          primaryButton: { text: 'Đăng dự án miễn phí', link: '/portal/homeowner/projects/create', icon: 'ri-add-line' },
          secondaryButton: { text: 'Tìm hiểu thêm', link: '/about', icon: 'ri-arrow-right-line' },
          backgroundImage: IMAGES.hero[1],
        }),
      },
    ],
  });

  // Bao gia page (Quote page)
  const baoGiaPage = await prisma.page.create({
    data: {
      slug: 'bao-gia',
      title: 'Báo giá & Dự toán',
      isActive: true,
    },
  });

  await prisma.section.createMany({
    data: [
      {
        pageId: baoGiaPage.id,
        kind: 'HERO_SIMPLE',
        order: 1,
        data: JSON.stringify({
          title: 'Báo giá & Dự toán',
          subtitle: 'Tính toán chi phí cải tạo nhà nhanh chóng và chính xác',
        }),
      },
      {
        pageId: baoGiaPage.id,
        kind: 'QUOTE_CALCULATOR',
        order: 2,
        data: JSON.stringify({
          title: 'Công cụ tính giá',
          description: 'Chọn hạng mục và nhập diện tích để nhận báo giá ước tính',
        }),
      },
      {
        pageId: baoGiaPage.id,
        kind: 'QUOTE_FORM',
        order: 3,
        data: JSON.stringify({
          title: 'Nhận tư vấn miễn phí',
          subtitle: 'Để lại thông tin, chúng tôi sẽ liên hệ tư vấn chi tiết',
          buttonText: 'Gửi yêu cầu tư vấn',
          showNameField: true,
          showPhoneField: true,
          showEmailField: true,
          showContentField: true,
          layout: 'card',
        }),
      },
    ],
  });

  // Noi that page (Interior page)
  const noiThatPage = await prisma.page.create({
    data: {
      slug: 'noi-that',
      title: 'Báo giá nội thất',
      isActive: true,
    },
  });

  await prisma.section.createMany({
    data: [
      {
        pageId: noiThatPage.id,
        kind: 'HERO_SIMPLE',
        order: 1,
        data: JSON.stringify({
          title: 'Báo giá nội thất căn hộ',
          subtitle: 'Tính toán chi phí nội thất trọn gói cho căn hộ của bạn',
        }),
      },
      {
        pageId: noiThatPage.id,
        kind: 'INTERIOR_WIZARD',
        order: 2,
        data: JSON.stringify({
          title: 'Công cụ báo giá nội thất',
          description: 'Chọn dự án, căn hộ và gói nội thất để nhận báo giá chi tiết',
        }),
      },
    ],
  });

  // About page
  const aboutPage = await prisma.page.create({
    data: {
      slug: 'about',
      title: 'Về chúng tôi',
      isActive: true,
    },
  });

  await prisma.section.createMany({
    data: [
      {
        pageId: aboutPage.id,
        kind: 'HERO_SIMPLE',
        order: 1,
        data: JSON.stringify({
          title: 'Về Anh Thợ Xây',
          subtitle: 'Nền tảng kết nối chủ nhà với nhà thầu uy tín hàng đầu Việt Nam',
        }),
      },
      {
        pageId: aboutPage.id,
        kind: 'MISSION_VISION',
        order: 2,
        data: JSON.stringify({
          title: 'Sứ mệnh & Tầm nhìn',
          subtitle: 'Chúng tôi cam kết mang đến giải pháp tốt nhất cho ngành xây dựng Việt Nam',
          mission: {
            title: 'Sứ mệnh',
            content: 'Kết nối chủ nhà với nhà thầu uy tín, mang đến trải nghiệm cải tạo nhà minh bạch, chất lượng và an toàn.',
            icon: 'ri-focus-3-line',
          },
          vision: {
            title: 'Tầm nhìn',
            content: 'Trở thành nền tảng số 1 Việt Nam trong lĩnh vực kết nối dịch vụ xây dựng, cải tạo nhà ở.',
            icon: 'ri-eye-line',
          },
        }),
      },
      {
        pageId: aboutPage.id,
        kind: 'CORE_VALUES',
        order: 3,
        data: JSON.stringify({
          title: 'Giá trị cốt lõi',
          subtitle: 'Những giá trị định hướng mọi hoạt động của chúng tôi',
          values: [
            { icon: 'ri-shield-check-line', title: 'Uy tín', description: 'Tất cả nhà thầu đều được xác minh kỹ lưỡng trước khi tham gia nền tảng' },
            { icon: 'ri-eye-line', title: 'Minh bạch', description: 'Giá cả rõ ràng, quy trình công khai, không phát sinh chi phí ẩn' },
            { icon: 'ri-medal-line', title: 'Chất lượng', description: 'Cam kết chất lượng thi công, bảo hành dài hạn' },
            { icon: 'ri-heart-line', title: 'Tận tâm', description: 'Đội ngũ hỗ trợ 24/7, luôn sẵn sàng giải đáp mọi thắc mắc' },
          ],
        }),
      },
      {
        pageId: aboutPage.id,
        kind: 'CONTACT_INFO',
        order: 4,
        data: JSON.stringify({
          title: 'Liên hệ với chúng tôi',
          email: 'contact@anhthoxay.vn',
          phone: '0909 123 456',
          address: 'Tầng 10, Tòa nhà Viettel, 285 Cách Mạng Tháng 8, Quận 10, TP. Hồ Chí Minh',
          hours: [
            { day: 'Thứ 2 - Thứ 6', time: '08:00 - 18:00' },
            { day: 'Thứ 7', time: '08:00 - 12:00' },
            { day: 'Chủ nhật', time: 'Nghỉ' },
          ],
          socialLinks: [
            { platform: 'facebook', url: 'https://facebook.com/anhthoxay' },
            { platform: 'youtube', url: 'https://youtube.com/anhthoxay' },
            { platform: 'tiktok', url: 'https://tiktok.com/@anhthoxay' },
          ],
        }),
      },
    ],
  });

  // Policy page
  const policyPage = await prisma.page.create({
    data: {
      slug: 'chinh-sach',
      title: 'Chính sách',
      isActive: true,
    },
  });

  await prisma.section.create({
    data: {
      pageId: policyPage.id,
      kind: 'RICH_TEXT',
      order: 1,
      data: JSON.stringify({
        content: `# Chính sách & Điều khoản sử dụng

## 1. Chính sách bảo mật

Anh Thợ Xây cam kết bảo vệ thông tin cá nhân của người dùng:

- **Thu thập thông tin:** Chúng tôi chỉ thu thập thông tin cần thiết để cung cấp dịch vụ
- **Sử dụng thông tin:** Thông tin được sử dụng để kết nối chủ nhà với nhà thầu phù hợp
- **Bảo mật:** Áp dụng các biện pháp bảo mật tiên tiến để bảo vệ dữ liệu
- **Chia sẻ:** Không chia sẻ thông tin với bên thứ ba khi chưa có sự đồng ý

## 2. Điều khoản sử dụng

Khi sử dụng dịch vụ của Anh Thợ Xây, bạn đồng ý:

- Cung cấp thông tin chính xác, trung thực
- Không sử dụng nền tảng cho mục đích bất hợp pháp
- Tôn trọng quyền lợi của các bên liên quan
- Tuân thủ quy trình thanh toán qua hệ thống escrow

## 3. Chính sách escrow

Hệ thống escrow bảo vệ quyền lợi của cả chủ nhà và nhà thầu:

- **Đặt cọc:** Chủ nhà đặt cọc 10% giá trị hợp đồng
- **Giữ tiền:** Tiền được giữ an toàn trong tài khoản escrow
- **Giải ngân:** Tiền được giải ngân theo tiến độ công việc
- **Tranh chấp:** Có quy trình giải quyết tranh chấp công bằng

## 4. Chính sách hoàn tiền

Trong trường hợp tranh chấp:

- Xem xét bằng chứng từ cả hai bên
- Quyết định dựa trên hợp đồng và thực tế thi công
- Hoàn tiền trong vòng 7 ngày làm việc sau khi có quyết định

## 5. Liên hệ

Mọi thắc mắc về chính sách, vui lòng liên hệ:
- Email: support@anhthoxay.vn
- Hotline: 0909 123 456`,
      }),
    },
  });

  console.log('✅ Created 5 CMS pages with detailed sections');
}

// ============================================
// SEED SETTINGS
// ============================================
async function seedSettings() {
  console.log('\n⚙️ Creating settings...');

  await prisma.settings.createMany({
    data: [
      { key: 'site_name', value: 'Anh Thợ Xây' },
      { key: 'site_description', value: 'Nền tảng kết nối chủ nhà với nhà thầu uy tín' },
      { key: 'contact_email', value: 'contact@anhthoxay.vn' },
      { key: 'contact_phone', value: '0909 123 456' },
      { key: 'contact_address', value: 'TP. Hồ Chí Minh, Việt Nam' },
      { key: 'social_facebook', value: 'https://facebook.com/anhthoxay' },
      { key: 'social_zalo', value: 'https://zalo.me/anhthoxay' },
      { key: 'maintenance_mode', value: 'false' },
    ],
  });

  console.log('✅ Created 8 settings');
}

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function main() {
  console.log('🌱 Starting complete seed...\n');
  console.log('=' .repeat(50));

  try {
    // Clear existing data
    await clearDatabase();

    // Seed in order
    const users = await seedUsers();
    await seedContractorProfiles(users);
    const regions = await seedRegions();
    await seedBiddingSettings();
    const categories = await seedFormulasAndPricing();
    await seedBlog(users.admin.id);
    const projects = await seedProjects(users, regions, categories);
    const bids = await seedBids(users, projects);
    await seedEscrowsAndFees(users, projects, bids);
    await seedReviewsAndRankings(users, projects);
    await seedChatAndNotifications(users, projects);
    await seedCustomerLeads();
    await seedInteriorModule();
    await seedSavedProjects(users, projects);
    await seedCMSPages();
    await seedSettings();

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Complete seed finished successfully!\n');
    
    console.log('📋 Summary:');
    console.log('   - Users: 12 (2 admin, 1 manager, 3 homeowner, 6 contractor)');
    console.log('   - Regions: 23 (TP.HCM + 22 quận/huyện)');
    console.log('   - Service Categories: 7');
    console.log('   - Materials: 16');
    console.log('   - Blog Posts: 6 (with detailed content)');
    console.log('   - Projects: 10 (various statuses)');
    console.log('   - Bids: 13');
    console.log('   - Escrows: 3');
    console.log('   - Reviews: 2');
    console.log('   - Conversations: 2');
    console.log('   - Interior: Full module data');
    console.log('   - CMS Pages: 5 (home, bao-gia, noi-that, about, chinh-sach)');
    
    console.log('\n🔑 Test Accounts:');
    console.log('   Admin:      admin@anhthoxay.vn / Admin@123');
    console.log('   Manager:    quanly@anhthoxay.vn / Manager@123');
    console.log('   Homeowner:  chunha1@gmail.com / User@123');
    console.log('   Contractor: nhathau1@gmail.com / User@123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
