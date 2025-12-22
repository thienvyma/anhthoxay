import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding bidding marketplace data...');

  // ============================================
  // 1. REGIONS (Khu vực TP.HCM)
  // ============================================
  console.log('Creating regions...');

  // Check if regions already exist
  const existingRegions = await prisma.region.count();
  if (existingRegions > 0) {
    console.log('⚠️ Regions already exist, skipping...');
  } else {
    // Create TP.HCM as parent
    const hcm = await prisma.region.create({
      data: {
        name: 'TP. Hồ Chí Minh',
        slug: 'ho-chi-minh',
        level: 1,
        isActive: true,
        order: 1,
      },
    });

    // Create districts (Quận/Huyện)
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

    await prisma.region.createMany({
      data: districts.map((d) => ({
        name: d.name,
        slug: d.slug,
        parentId: hcm.id,
        level: 2,
        isActive: true,
        order: d.order,
      })),
    });

    console.log(`✅ Created ${districts.length + 1} regions (TP.HCM + ${districts.length} quận/huyện)`);
  }

  // ============================================
  // 2. BIDDING SETTINGS (Singleton)
  // ============================================
  console.log('Creating bidding settings...');

  const existingSettings = await prisma.biddingSettings.findUnique({
    where: { id: 'default' },
  });

  if (existingSettings) {
    console.log('⚠️ Bidding settings already exist, skipping...');
  } else {
    await prisma.biddingSettings.create({
      data: {
        id: 'default',
        // Bidding config
        maxBidsPerProject: 20,
        defaultBidDuration: 7,
        minBidDuration: 3,
        maxBidDuration: 30,
        // Escrow config
        escrowPercentage: 10,
        escrowMinAmount: 1000000, // 1 triệu VNĐ
        escrowMaxAmount: null, // Không giới hạn
        // Fees config
        verificationFee: 500000, // 500k VNĐ
        winFeePercentage: 5, // 5%
        // Auto-approval
        autoApproveHomeowner: true,
        autoApproveProject: false,
      },
    });

    console.log('✅ Created default bidding settings');
  }

  // ============================================
  // 3. SERVICE FEES
  // ============================================
  console.log('Creating service fees...');

  const existingFees = await prisma.serviceFee.count();
  if (existingFees > 0) {
    console.log('⚠️ Service fees already exist, skipping...');
  } else {
    const serviceFees = [
      {
        name: 'Phí xác minh nhà thầu',
        code: 'VERIFICATION_FEE',
        type: 'FIXED',
        value: 500000,
        description: 'Phí một lần khi xác minh tài khoản nhà thầu',
        isActive: true,
      },
      {
        name: 'Phí thắng thầu',
        code: 'WIN_FEE',
        type: 'PERCENTAGE',
        value: 5,
        description: 'Phí tính trên giá trị hợp đồng khi thắng thầu (5%)',
        isActive: true,
      },
      {
        name: 'Phí nổi bật',
        code: 'FEATURED_FEE',
        type: 'FIXED',
        value: 200000,
        description: 'Phí hiển thị nổi bật trên trang chủ (theo tháng)',
        isActive: true,
      },
      {
        name: 'Phí đăng dự án khẩn',
        code: 'URGENT_PROJECT_FEE',
        type: 'FIXED',
        value: 100000,
        description: 'Phí đăng dự án với tag "Khẩn cấp" để thu hút nhà thầu nhanh hơn',
        isActive: true,
      },
      {
        name: 'Phí gia hạn đấu giá',
        code: 'EXTEND_BID_FEE',
        type: 'FIXED',
        value: 50000,
        description: 'Phí gia hạn thời gian đấu giá thêm 7 ngày',
        isActive: true,
      },
    ];

    await prisma.serviceFee.createMany({
      data: serviceFees,
    });

    console.log(`✅ Created ${serviceFees.length} service fees`);
  }

  console.log('🎉 Bidding marketplace seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
