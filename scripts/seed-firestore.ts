/* eslint-disable no-console */
/**
 * Firestore Seed Script
 *
 * Seeds initial data for Firestore database including:
 * - Admin user with ADMIN role custom claim
 * - Default settings documents
 * - Notification templates
 * - Sample data (regions, categories, etc.)
 *
 * Usage:
 *   npx ts-node scripts/seed-firestore.ts [--admin-email=email] [--admin-password=password]
 *
 * Prerequisites:
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var to service account JSON path
 *   - Or run from a machine with Application Default Credentials
 *
 * @requirements 11.1, 11.2, 11.3, 11.4
 */

import * as admin from 'firebase-admin';

// ============================================
// CONFIGURATION
// ============================================

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'noithatnhanh-f8f72';

// Parse command line arguments
function parseArgs(): { adminEmail: string; adminPassword: string } {
  const args = process.argv.slice(2);
  let adminEmail = 'admin@noithatnhanh.vn';
  let adminPassword = 'Admin@123456';

  for (const arg of args) {
    if (arg.startsWith('--admin-email=')) {
      adminEmail = arg.split('=')[1];
    } else if (arg.startsWith('--admin-password=')) {
      adminPassword = arg.split('=')[1];
    }
  }

  return { adminEmail, adminPassword };
}

// ============================================
// INITIALIZATION
// ============================================

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

async function initializeFirebase(): Promise<void> {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  db = admin.firestore();
  auth = admin.auth();
  console.log(`✅ Firebase initialized for project: ${PROJECT_ID}`);
}


// ============================================
// SEED ADMIN USER
// ============================================

async function seedAdminUser(email: string, password: string): Promise<void> {
  console.log('\n📌 Seeding admin user...');

  try {
    // Check if user already exists
    let user: admin.auth.UserRecord;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`   ℹ️  User already exists: ${user.uid}`);
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === 'auth/user-not-found') {
        // Create new user
        user = await auth.createUser({
          email,
          password,
          displayName: 'Admin',
          emailVerified: true,
        });
        console.log(`   ✅ Created Firebase Auth user: ${user.uid}`);
      } else {
        throw error;
      }
    }

    // Set custom claims
    const claims = {
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
    };
    await auth.setCustomUserClaims(user.uid, claims);
    console.log(`   ✅ Set custom claims:`, claims);

    // Create/update user document in Firestore
    const now = admin.firestore.Timestamp.now();
    const userDoc = {
      email,
      name: 'Admin',
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
      rating: 0,
      totalProjects: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').doc(user.uid).set(userDoc, { merge: true });
    console.log(`   ✅ Created/updated Firestore user document`);

  } catch (error) {
    console.error('   ❌ Error seeding admin user:', error);
    throw error;
  }
}


// ============================================
// SEED DEFAULT SETTINGS
// ============================================

async function seedDefaultSettings(): Promise<void> {
  console.log('\n📌 Seeding default settings...');

  const now = admin.firestore.Timestamp.now();

  // Bidding settings
  const biddingSettings = {
    value: {
      maxBidsPerProject: 10,
      defaultBidDuration: 7,
      minBidDuration: 3,
      maxBidDuration: 30,
      escrowPercentage: 10,
      escrowMinAmount: 1000000,
      escrowMaxAmount: 50000000,
      verificationFee: 500000,
      winFeePercentage: 5,
      autoApproveHomeowner: true,
      autoApproveProject: false,
    },
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('settings').doc('bidding').set(biddingSettings, { merge: true });
  console.log('   ✅ Seeded bidding settings');

  // Furniture PDF settings
  const furniturePdfSettings = {
    value: {
      companyName: 'NỘI THẤT NHANH',
      companyTagline: 'Đối tác tin cậy cho ngôi nhà của bạn',
      documentTitle: 'BÁO GIÁ NỘI THẤT',
      primaryColor: '#F5D393',
      textColor: '#333333',
      mutedColor: '#666666',
      borderColor: '#E0E0E0',
      companyNameSize: 24,
      documentTitleSize: 18,
      sectionTitleSize: 12,
      bodyTextSize: 10,
      footerTextSize: 8,
      apartmentInfoTitle: 'THÔNG TIN CĂN HỘ',
      productsTitle: 'SẢN PHẨM ĐÃ CHỌN',
      priceDetailsTitle: 'CHI TIẾT GIÁ',
      contactInfoTitle: 'THÔNG TIN LIÊN HỆ',
      totalLabel: 'TỔNG CỘNG',
      footerNote: 'Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm và điều kiện cụ thể.',
      footerCopyright: '© NỘI THẤT NHANH - Đối tác tin cậy cho ngôi nhà của bạn',
    },
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('settings').doc('furniturePdf').set(furniturePdfSettings, { merge: true });
  console.log('   ✅ Seeded furniture PDF settings');
}


// ============================================
// SEED NOTIFICATION TEMPLATES
// ============================================

interface NotificationTemplate {
  type: string;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    type: 'BID_RECEIVED',
    emailSubject: 'Bạn có báo giá mới cho công trình {{projectCode}}',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) của bạn vừa nhận được một báo giá mới.</p><p><strong>Giá đề xuất:</strong> {{bidPrice}} VNĐ</p>',
    smsBody: 'Công trình {{projectCode}} có báo giá mới: {{bidPrice}} VNĐ.',
    inAppTitle: 'Báo giá mới',
    inAppBody: 'Công trình {{projectCode}} vừa nhận được báo giá {{bidPrice}} VNĐ.',
    variables: ['homeownerName', 'projectTitle', 'projectCode', 'bidPrice', 'bidTimeline'],
  },
  {
    type: 'BID_APPROVED',
    emailSubject: 'Báo giá của bạn đã được duyệt - {{projectCode}}',
    emailBody: '<p>Xin chào {{contractorName}},</p><p>Báo giá <strong>{{bidCode}}</strong> của bạn cho công trình {{projectCode}} đã được duyệt.</p>',
    smsBody: 'Báo giá {{bidCode}} đã được duyệt cho công trình {{projectCode}}.',
    inAppTitle: 'Báo giá được duyệt',
    inAppBody: 'Báo giá {{bidCode}} cho công trình {{projectCode}} đã được duyệt.',
    variables: ['contractorName', 'bidCode', 'projectCode'],
  },
  {
    type: 'BID_REJECTED',
    emailSubject: 'Báo giá của bạn không được duyệt - {{projectCode}}',
    emailBody: '<p>Xin chào {{contractorName}},</p><p>Báo giá <strong>{{bidCode}}</strong> của bạn cho công trình {{projectCode}} không được duyệt.</p><p><strong>Lý do:</strong> {{rejectReason}}</p>',
    smsBody: 'Báo giá {{bidCode}} không được duyệt. Lý do: {{rejectReason}}',
    inAppTitle: 'Báo giá không được duyệt',
    inAppBody: 'Báo giá {{bidCode}} cho công trình {{projectCode}} không được duyệt.',
    variables: ['contractorName', 'bidCode', 'projectCode', 'rejectReason'],
  },
  {
    type: 'BID_SELECTED',
    emailSubject: 'Chúc mừng! Báo giá của bạn đã được chọn - {{projectCode}}',
    emailBody: '<p>Xin chào {{contractorName}},</p><p>Chúc mừng! Báo giá <strong>{{bidCode}}</strong> của bạn đã được chủ nhà chọn cho công trình {{projectCode}}.</p>',
    smsBody: 'Chúc mừng! Báo giá {{bidCode}} đã được chọn cho công trình {{projectCode}}.',
    inAppTitle: 'Báo giá được chọn',
    inAppBody: 'Chúc mừng! Báo giá {{bidCode}} đã được chọn cho công trình {{projectCode}}.',
    variables: ['contractorName', 'bidCode', 'projectCode'],
  },
  {
    type: 'PROJECT_MATCHED',
    emailSubject: 'Công trình {{projectCode}} đã được ghép nối thành công',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đã được ghép nối với nhà thầu.</p>',
    smsBody: 'Công trình {{projectCode}} đã được ghép nối. Vui lòng hoàn tất đặt cọc.',
    inAppTitle: 'Ghép nối thành công',
    inAppBody: 'Công trình {{projectCode}} đã được ghép nối với nhà thầu.',
    variables: ['homeownerName', 'projectTitle', 'projectCode'],
  },
  {
    type: 'PROJECT_APPROVED',
    emailSubject: 'Công trình {{projectCode}} đã được duyệt',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) của bạn đã được duyệt.</p>',
    smsBody: 'Công trình {{projectCode}} đã được duyệt và đang mở nhận báo giá.',
    inAppTitle: 'Công trình được duyệt',
    inAppBody: 'Công trình {{projectCode}} đã được duyệt và đang mở nhận báo giá.',
    variables: ['homeownerName', 'projectTitle', 'projectCode'],
  },
];


const MORE_TEMPLATES: NotificationTemplate[] = [
  {
    type: 'ESCROW_PENDING',
    emailSubject: 'Đặt cọc đang chờ xác nhận - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Đặt cọc cho công trình {{projectCode}} đang chờ xác nhận.</p><p><strong>Số tiền:</strong> {{amount}} VNĐ</p>',
    smsBody: 'Đặt cọc {{escrowCode}} ({{amount}} VNĐ) đang chờ xác nhận.',
    inAppTitle: 'Đặt cọc chờ xác nhận',
    inAppBody: 'Đặt cọc {{escrowCode}} cho công trình {{projectCode}} đang chờ xác nhận.',
    variables: ['projectCode', 'escrowCode', 'amount'],
  },
  {
    type: 'ESCROW_HELD',
    emailSubject: 'Đặt cọc đã được xác nhận - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Đặt cọc cho công trình {{projectCode}} đã được xác nhận.</p><p><strong>Số tiền:</strong> {{amount}} VNĐ</p>',
    smsBody: 'Đặt cọc {{escrowCode}} ({{amount}} VNĐ) đã được xác nhận.',
    inAppTitle: 'Đặt cọc xác nhận',
    inAppBody: 'Đặt cọc {{escrowCode}} cho công trình {{projectCode}} đã được xác nhận.',
    variables: ['projectCode', 'escrowCode', 'amount'],
  },
  {
    type: 'ESCROW_RELEASED',
    emailSubject: 'Đặt cọc đã được giải phóng - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Đặt cọc cho công trình {{projectCode}} đã được giải phóng hoàn toàn.</p>',
    smsBody: 'Đặt cọc {{escrowCode}} đã được giải phóng hoàn toàn.',
    inAppTitle: 'Đặt cọc giải phóng',
    inAppBody: 'Đặt cọc {{escrowCode}} cho công trình {{projectCode}} đã được giải phóng.',
    variables: ['projectCode', 'escrowCode'],
  },
  {
    type: 'NEW_MESSAGE',
    emailSubject: 'Bạn có tin nhắn mới - {{projectCode}}',
    emailBody: '<p>Xin chào {{recipientName}},</p><p>Bạn có tin nhắn mới từ {{senderName}} trong cuộc hội thoại cho công trình {{projectCode}}.</p>',
    smsBody: 'Bạn có tin nhắn mới từ {{senderName}} cho công trình {{projectCode}}.',
    inAppTitle: 'Tin nhắn mới',
    inAppBody: 'Bạn có tin nhắn mới từ {{senderName}} cho công trình {{projectCode}}.',
    variables: ['recipientName', 'senderName', 'projectCode'],
  },
  {
    type: 'MILESTONE_REQUESTED',
    emailSubject: 'Yêu cầu xác nhận milestone - {{projectCode}}',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Nhà thầu đã yêu cầu xác nhận hoàn thành milestone <strong>{{milestoneName}}</strong> cho công trình {{projectCode}}.</p>',
    smsBody: 'Nhà thầu yêu cầu xác nhận milestone {{milestoneName}} cho {{projectCode}}.',
    inAppTitle: 'Yêu cầu xác nhận milestone',
    inAppBody: 'Nhà thầu yêu cầu xác nhận milestone {{milestoneName}} cho {{projectCode}}.',
    variables: ['homeownerName', 'milestoneName', 'projectCode'],
  },
  {
    type: 'MILESTONE_CONFIRMED',
    emailSubject: 'Milestone đã được xác nhận - {{projectCode}}',
    emailBody: '<p>Xin chào,</p><p>Milestone <strong>{{milestoneName}}</strong> cho công trình {{projectCode}} đã được xác nhận hoàn thành.</p>',
    smsBody: 'Milestone {{milestoneName}} cho {{projectCode}} đã được xác nhận.',
    inAppTitle: 'Milestone xác nhận',
    inAppBody: 'Milestone {{milestoneName}} cho {{projectCode}} đã được xác nhận.',
    variables: ['milestoneName', 'projectCode'],
  },
  {
    type: 'REVIEW_REMINDER',
    emailSubject: 'Nhắc nhở: Đánh giá nhà thầu - {{projectCode}}',
    emailBody: '<p>Xin chào {{homeownerName}},</p><p>Công trình <strong>{{projectTitle}}</strong> ({{projectCode}}) đã hoàn thành. Hãy đánh giá nhà thầu.</p>',
    smsBody: 'Công trình {{projectCode}} đã hoàn thành. Hãy đánh giá nhà thầu.',
    inAppTitle: 'Đánh giá nhà thầu',
    inAppBody: 'Công trình {{projectCode}} đã hoàn thành. Hãy đánh giá nhà thầu.',
    variables: ['homeownerName', 'projectTitle', 'projectCode'],
  },
];


async function seedNotificationTemplates(): Promise<void> {
  console.log('\n📌 Seeding notification templates...');

  const now = admin.firestore.Timestamp.now();
  const allTemplates = [...DEFAULT_TEMPLATES, ...MORE_TEMPLATES];
  let created = 0;
  let skipped = 0;

  for (const template of allTemplates) {
    const docRef = db.collection('notificationTemplates').doc(template.type);
    const existing = await docRef.get();

    if (existing.exists) {
      skipped++;
      continue;
    }

    await docRef.set({
      type: template.type,
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      smsBody: template.smsBody,
      inAppTitle: template.inAppTitle,
      inAppBody: template.inAppBody,
      variables: template.variables,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  console.log(`   ✅ Seeded notification templates: ${created} created, ${skipped} skipped`);
}


// ============================================
// SEED REGIONS
// ============================================

interface RegionData {
  name: string;
  slug: string;
  level: number;
  order: number;
  children?: RegionData[];
}

const REGIONS: RegionData[] = [
  {
    name: 'Hồ Chí Minh',
    slug: 'ho-chi-minh',
    level: 1,
    order: 1,
    children: [
      { name: 'Quận 1', slug: 'quan-1', level: 2, order: 1 },
      { name: 'Quận 2', slug: 'quan-2', level: 2, order: 2 },
      { name: 'Quận 3', slug: 'quan-3', level: 2, order: 3 },
      { name: 'Quận 4', slug: 'quan-4', level: 2, order: 4 },
      { name: 'Quận 5', slug: 'quan-5', level: 2, order: 5 },
      { name: 'Quận 6', slug: 'quan-6', level: 2, order: 6 },
      { name: 'Quận 7', slug: 'quan-7', level: 2, order: 7 },
      { name: 'Quận 8', slug: 'quan-8', level: 2, order: 8 },
      { name: 'Quận 9', slug: 'quan-9', level: 2, order: 9 },
      { name: 'Quận 10', slug: 'quan-10', level: 2, order: 10 },
      { name: 'Quận 11', slug: 'quan-11', level: 2, order: 11 },
      { name: 'Quận 12', slug: 'quan-12', level: 2, order: 12 },
      { name: 'Quận Bình Thạnh', slug: 'quan-binh-thanh', level: 2, order: 13 },
      { name: 'Quận Gò Vấp', slug: 'quan-go-vap', level: 2, order: 14 },
      { name: 'Quận Phú Nhuận', slug: 'quan-phu-nhuan', level: 2, order: 15 },
      { name: 'Quận Tân Bình', slug: 'quan-tan-binh', level: 2, order: 16 },
      { name: 'Quận Tân Phú', slug: 'quan-tan-phu', level: 2, order: 17 },
      { name: 'Thành phố Thủ Đức', slug: 'tp-thu-duc', level: 2, order: 18 },
    ],
  },
  {
    name: 'Hà Nội',
    slug: 'ha-noi',
    level: 1,
    order: 2,
    children: [
      { name: 'Quận Ba Đình', slug: 'quan-ba-dinh', level: 2, order: 1 },
      { name: 'Quận Hoàn Kiếm', slug: 'quan-hoan-kiem', level: 2, order: 2 },
      { name: 'Quận Hai Bà Trưng', slug: 'quan-hai-ba-trung', level: 2, order: 3 },
      { name: 'Quận Đống Đa', slug: 'quan-dong-da', level: 2, order: 4 },
      { name: 'Quận Cầu Giấy', slug: 'quan-cau-giay', level: 2, order: 5 },
      { name: 'Quận Thanh Xuân', slug: 'quan-thanh-xuan', level: 2, order: 6 },
      { name: 'Quận Hoàng Mai', slug: 'quan-hoang-mai', level: 2, order: 7 },
      { name: 'Quận Long Biên', slug: 'quan-long-bien', level: 2, order: 8 },
      { name: 'Quận Nam Từ Liêm', slug: 'quan-nam-tu-liem', level: 2, order: 9 },
      { name: 'Quận Bắc Từ Liêm', slug: 'quan-bac-tu-liem', level: 2, order: 10 },
    ],
  },
  {
    name: 'Đà Nẵng',
    slug: 'da-nang',
    level: 1,
    order: 3,
    children: [
      { name: 'Quận Hải Châu', slug: 'quan-hai-chau', level: 2, order: 1 },
      { name: 'Quận Thanh Khê', slug: 'quan-thanh-khe', level: 2, order: 2 },
      { name: 'Quận Sơn Trà', slug: 'quan-son-tra', level: 2, order: 3 },
      { name: 'Quận Ngũ Hành Sơn', slug: 'quan-ngu-hanh-son', level: 2, order: 4 },
      { name: 'Quận Liên Chiểu', slug: 'quan-lien-chieu', level: 2, order: 5 },
      { name: 'Quận Cẩm Lệ', slug: 'quan-cam-le', level: 2, order: 6 },
    ],
  },
  {
    name: 'Bình Dương',
    slug: 'binh-duong',
    level: 1,
    order: 4,
    children: [
      { name: 'Thành phố Thủ Dầu Một', slug: 'tp-thu-dau-mot', level: 2, order: 1 },
      { name: 'Thành phố Dĩ An', slug: 'tp-di-an', level: 2, order: 2 },
      { name: 'Thành phố Thuận An', slug: 'tp-thuan-an', level: 2, order: 3 },
    ],
  },
  {
    name: 'Đồng Nai',
    slug: 'dong-nai',
    level: 1,
    order: 5,
    children: [
      { name: 'Thành phố Biên Hòa', slug: 'tp-bien-hoa', level: 2, order: 1 },
      { name: 'Thành phố Long Khánh', slug: 'tp-long-khanh', level: 2, order: 2 },
    ],
  },
];


async function seedRegions(): Promise<void> {
  console.log('\n📌 Seeding regions...');

  const now = admin.firestore.Timestamp.now();
  let created = 0;
  let skipped = 0;

  async function createRegion(
    region: RegionData,
    parentId?: string
  ): Promise<string> {
    // Check if region already exists by slug
    const existing = await db
      .collection('regions')
      .where('slug', '==', region.slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      skipped++;
      return existing.docs[0].id;
    }

    const docRef = db.collection('regions').doc();
    await docRef.set({
      name: region.name,
      slug: region.slug,
      level: region.level,
      order: region.order,
      parentId: parentId || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    created++;
    return docRef.id;
  }

  for (const province of REGIONS) {
    const provinceId = await createRegion(province);

    if (province.children) {
      for (const district of province.children) {
        await createRegion(district, provinceId);
      }
    }
  }

  console.log(`   ✅ Seeded regions: ${created} created, ${skipped} skipped`);
}


// ============================================
// SEED SERVICE CATEGORIES
// ============================================

interface ServiceCategoryData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  coefficient: number;
  order: number;
}

const SERVICE_CATEGORIES: ServiceCategoryData[] = [
  {
    name: 'Sơn nhà',
    slug: 'son-nha',
    description: 'Dịch vụ sơn tường, sơn trần, sơn nội thất và ngoại thất',
    icon: 'ri-paint-brush-line',
    coefficient: 1.0,
    order: 1,
  },
  {
    name: 'Điện nước',
    slug: 'dien-nuoc',
    description: 'Lắp đặt, sửa chữa hệ thống điện và nước',
    icon: 'ri-flashlight-line',
    coefficient: 1.2,
    order: 2,
  },
  {
    name: 'Xây dựng',
    slug: 'xay-dung',
    description: 'Xây mới, cải tạo, sửa chữa công trình',
    icon: 'ri-building-line',
    coefficient: 1.5,
    order: 3,
  },
  {
    name: 'Nội thất',
    slug: 'noi-that',
    description: 'Thiết kế và thi công nội thất',
    icon: 'ri-home-smile-line',
    coefficient: 1.3,
    order: 4,
  },
  {
    name: 'Cửa - Cổng',
    slug: 'cua-cong',
    description: 'Lắp đặt cửa, cổng, cửa sổ',
    icon: 'ri-door-line',
    coefficient: 1.1,
    order: 5,
  },
  {
    name: 'Chống thấm',
    slug: 'chong-tham',
    description: 'Xử lý chống thấm, chống dột',
    icon: 'ri-drop-line',
    coefficient: 1.4,
    order: 6,
  },
  {
    name: 'Điều hòa',
    slug: 'dieu-hoa',
    description: 'Lắp đặt, bảo trì điều hòa không khí',
    icon: 'ri-temp-cold-line',
    coefficient: 1.0,
    order: 7,
  },
  {
    name: 'Vệ sinh',
    slug: 've-sinh',
    description: 'Dịch vụ vệ sinh công nghiệp, vệ sinh nhà cửa',
    icon: 'ri-brush-line',
    coefficient: 0.8,
    order: 8,
  },
];

async function seedServiceCategories(): Promise<void> {
  console.log('\n📌 Seeding service categories...');

  const now = admin.firestore.Timestamp.now();
  let created = 0;
  let skipped = 0;

  for (const category of SERVICE_CATEGORIES) {
    // Check if category already exists by slug
    const existing = await db
      .collection('serviceCategories')
      .where('slug', '==', category.slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      skipped++;
      continue;
    }

    await db.collection('serviceCategories').add({
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      coefficient: category.coefficient,
      order: category.order,
      formulaId: null,
      materialCategoryIds: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  console.log(`   ✅ Seeded service categories: ${created} created, ${skipped} skipped`);
}


// ============================================
// SEED UNIT PRICES
// ============================================

interface UnitPriceData {
  category: string;
  name: string;
  price: number;
  tag: string;
  unit: string;
  description: string;
}

const UNIT_PRICES: UnitPriceData[] = [
  {
    category: 'Sơn nhà',
    name: 'Đơn giá sơn tường',
    price: 80000,
    tag: 'DON_GIA_SON',
    unit: 'm²',
    description: 'Đơn giá sơn tường cơ bản (bao gồm sơn lót và 2 lớp sơn phủ)',
  },
  {
    category: 'Sơn nhà',
    name: 'Đơn giá sơn trần',
    price: 90000,
    tag: 'DON_GIA_SON_TRAN',
    unit: 'm²',
    description: 'Đơn giá sơn trần nhà',
  },
  {
    category: 'Điện nước',
    name: 'Đơn giá lắp điện',
    price: 150000,
    tag: 'DON_GIA_DIEN',
    unit: 'điểm',
    description: 'Đơn giá lắp đặt 1 điểm điện (ổ cắm, công tắc)',
  },
  {
    category: 'Điện nước',
    name: 'Đơn giá lắp nước',
    price: 200000,
    tag: 'DON_GIA_NUOC',
    unit: 'điểm',
    description: 'Đơn giá lắp đặt 1 điểm nước',
  },
  {
    category: 'Xây dựng',
    name: 'Đơn giá xây tường',
    price: 350000,
    tag: 'DON_GIA_XAY',
    unit: 'm²',
    description: 'Đơn giá xây tường gạch 10cm',
  },
  {
    category: 'Xây dựng',
    name: 'Đơn giá đổ bê tông',
    price: 1500000,
    tag: 'DON_GIA_BE_TONG',
    unit: 'm³',
    description: 'Đơn giá đổ bê tông mác 250',
  },
  {
    category: 'Chống thấm',
    name: 'Đơn giá chống thấm',
    price: 120000,
    tag: 'DON_GIA_CHONG_THAM',
    unit: 'm²',
    description: 'Đơn giá chống thấm sàn mái, sân thượng',
  },
  {
    category: 'Nội thất',
    name: 'Đơn giá lắp tủ bếp',
    price: 2500000,
    tag: 'DON_GIA_TU_BEP',
    unit: 'mét dài',
    description: 'Đơn giá lắp đặt tủ bếp gỗ công nghiệp',
  },
];

async function seedUnitPrices(): Promise<void> {
  console.log('\n📌 Seeding unit prices...');

  const now = admin.firestore.Timestamp.now();
  let created = 0;
  let skipped = 0;

  for (const price of UNIT_PRICES) {
    // Check if price already exists by tag
    const existing = await db
      .collection('unitPrices')
      .where('tag', '==', price.tag)
      .limit(1)
      .get();

    if (!existing.empty) {
      skipped++;
      continue;
    }

    await db.collection('unitPrices').add({
      category: price.category,
      name: price.name,
      price: price.price,
      tag: price.tag,
      unit: price.unit,
      description: price.description,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  console.log(`   ✅ Seeded unit prices: ${created} created, ${skipped} skipped`);
}


// ============================================
// SEED BLOG CATEGORIES
// ============================================

interface BlogCategoryData {
  name: string;
  slug: string;
  description: string;
  color: string;
}

const BLOG_CATEGORIES: BlogCategoryData[] = [
  {
    name: 'Kiến thức xây dựng',
    slug: 'kien-thuc-xay-dung',
    description: 'Chia sẻ kiến thức về xây dựng, vật liệu, kỹ thuật thi công',
    color: '#3B82F6',
  },
  {
    name: 'Thiết kế nội thất',
    slug: 'thiet-ke-noi-that',
    description: 'Xu hướng thiết kế, ý tưởng trang trí nội thất',
    color: '#10B981',
  },
  {
    name: 'Mẹo vặt',
    slug: 'meo-vat',
    description: 'Mẹo hay trong xây dựng và sửa chữa nhà cửa',
    color: '#F59E0B',
  },
  {
    name: 'Tin tức',
    slug: 'tin-tuc',
    description: 'Tin tức ngành xây dựng và bất động sản',
    color: '#EF4444',
  },
  {
    name: 'Dự án tiêu biểu',
    slug: 'du-an-tieu-bieu',
    description: 'Giới thiệu các dự án đã hoàn thành',
    color: '#8B5CF6',
  },
];

async function seedBlogCategories(): Promise<void> {
  console.log('\n📌 Seeding blog categories...');

  const now = admin.firestore.Timestamp.now();
  let created = 0;
  let skipped = 0;

  for (const category of BLOG_CATEGORIES) {
    // Check if category already exists by slug
    const existing = await db
      .collection('blogCategories')
      .where('slug', '==', category.slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      skipped++;
      continue;
    }

    await db.collection('blogCategories').add({
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  console.log(`   ✅ Seeded blog categories: ${created} created, ${skipped} skipped`);
}


// ============================================
// SEED SERVICE FEES
// ============================================

interface ServiceFeeData {
  name: string;
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description: string;
}

const SERVICE_FEES: ServiceFeeData[] = [
  {
    name: 'Phí xác minh nhà thầu',
    code: 'VERIFICATION_FEE',
    type: 'FIXED',
    value: 500000,
    description: 'Phí xác minh hồ sơ năng lực nhà thầu',
  },
  {
    name: 'Phí thắng thầu',
    code: 'WIN_FEE',
    type: 'PERCENTAGE',
    value: 5,
    description: 'Phí dịch vụ khi nhà thầu thắng thầu (% giá trị hợp đồng)',
  },
  {
    name: 'Phí đặt cọc',
    code: 'ESCROW_FEE',
    type: 'PERCENTAGE',
    value: 10,
    description: 'Tỷ lệ đặt cọc tối thiểu (% giá trị hợp đồng)',
  },
];

async function seedServiceFees(): Promise<void> {
  console.log('\n📌 Seeding service fees...');

  const now = admin.firestore.Timestamp.now();
  let created = 0;
  let skipped = 0;

  for (const fee of SERVICE_FEES) {
    // Check if fee already exists by code
    const existing = await db
      .collection('serviceFees')
      .where('code', '==', fee.code)
      .limit(1)
      .get();

    if (!existing.empty) {
      skipped++;
      continue;
    }

    await db.collection('serviceFees').add({
      name: fee.name,
      code: fee.code,
      type: fee.type,
      value: fee.value,
      description: fee.description,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  console.log(`   ✅ Seeded service fees: ${created} created, ${skipped} skipped`);
}


// ============================================
// SEED FURNITURE DATA
// ============================================

async function seedFurnitureData(): Promise<void> {
  console.log('\n📌 Seeding furniture data...');

  const now = admin.firestore.Timestamp.now();
  let created = 0;
  let skipped = 0;

  // Seed furniture categories
  const furnitureCategories = [
    { name: 'Phòng khách', description: 'Nội thất phòng khách', icon: 'ri-sofa-line', order: 1 },
    { name: 'Phòng ngủ', description: 'Nội thất phòng ngủ', icon: 'ri-hotel-bed-line', order: 2 },
    { name: 'Phòng bếp', description: 'Nội thất phòng bếp', icon: 'ri-restaurant-line', order: 3 },
    { name: 'Phòng tắm', description: 'Nội thất phòng tắm', icon: 'ri-drop-line', order: 4 },
    { name: 'Phòng làm việc', description: 'Nội thất phòng làm việc', icon: 'ri-computer-line', order: 5 },
  ];

  for (const category of furnitureCategories) {
    const existing = await db
      .collection('furnitureCategories')
      .where('name', '==', category.name)
      .limit(1)
      .get();

    if (!existing.empty) {
      skipped++;
      continue;
    }

    await db.collection('furnitureCategories').add({
      ...category,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  // Seed furniture materials
  const furnitureMaterials = [
    { name: 'Gỗ MDF', description: 'Gỗ công nghiệp MDF', order: 1 },
    { name: 'Gỗ MFC', description: 'Gỗ công nghiệp MFC', order: 2 },
    { name: 'Gỗ Plywood', description: 'Gỗ dán Plywood', order: 3 },
    { name: 'Gỗ tự nhiên', description: 'Gỗ tự nhiên cao cấp', order: 4 },
    { name: 'Nhựa Acrylic', description: 'Nhựa Acrylic bóng', order: 5 },
  ];

  for (const material of furnitureMaterials) {
    const existing = await db
      .collection('furnitureMaterials')
      .where('name', '==', material.name)
      .limit(1)
      .get();

    if (!existing.empty) {
      skipped++;
      continue;
    }

    await db.collection('furnitureMaterials').add({
      ...material,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  // Seed furniture fees
  const furnitureFees = [
    { name: 'Phí vận chuyển', code: 'SHIPPING', type: 'FIXED', value: 500000, applicability: 'ALL', order: 1 },
    { name: 'Phí lắp đặt', code: 'INSTALLATION', type: 'PERCENTAGE', value: 5, applicability: 'ALL', order: 2 },
    { name: 'VAT', code: 'VAT', type: 'PERCENTAGE', value: 10, applicability: 'ALL', order: 3 },
  ];

  for (const fee of furnitureFees) {
    const existing = await db
      .collection('furnitureFees')
      .where('code', '==', fee.code)
      .limit(1)
      .get();

    if (!existing.empty) {
      skipped++;
      continue;
    }

    await db.collection('furnitureFees').add({
      ...fee,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  console.log(`   ✅ Seeded furniture data: ${created} created, ${skipped} skipped`);
}


// ============================================
// MAIN FUNCTION
// ============================================

async function main(): Promise<void> {
  console.log('🚀 Starting Firestore seed script...\n');
  console.log('=' .repeat(50));

  const { adminEmail, adminPassword } = parseArgs();

  try {
    await initializeFirebase();

    // Seed admin user (Requirements 11.1)
    await seedAdminUser(adminEmail, adminPassword);

    // Seed default settings (Requirements 11.2)
    await seedDefaultSettings();

    // Seed notification templates (Requirements 11.3)
    await seedNotificationTemplates();

    // Seed sample data (Requirements 11.4)
    await seedRegions();
    await seedServiceCategories();
    await seedUnitPrices();
    await seedBlogCategories();
    await seedServiceFees();
    await seedFurnitureData();

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Firestore seed completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Admin user: ${adminEmail}`);
    console.log('   - Default settings: bidding, furniturePdf');
    console.log('   - Notification templates: 13 templates');
    console.log('   - Regions: HCM, Hanoi, Da Nang, Binh Duong, Dong Nai');
    console.log('   - Service categories: 8 categories');
    console.log('   - Unit prices: 8 prices');
    console.log('   - Blog categories: 5 categories');
    console.log('   - Service fees: 3 fees');
    console.log('   - Furniture data: categories, materials, fees');
    console.log('\n⚠️  Note: User needs to sign out and sign in again for claims to take effect.');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
