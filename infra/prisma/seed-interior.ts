/**
 * Seed data for Interior Quote Module
 *
 * Run: npx ts-node infra/prisma/seed-interior.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏠 Seeding Interior Quote Module...');

  // ============================================
  // 1. ROOM TYPES
  // ============================================
  console.log('📦 Creating room types...');
  const roomTypes = await Promise.all([
    prisma.interiorRoomType.upsert({
      where: { code: 'LIVING_ROOM' },
      update: {},
      create: {
        code: 'LIVING_ROOM',
        name: 'Phòng khách',
        nameEn: 'Living Room',
        icon: 'ri-sofa-line',
        order: 1,
      },
    }),
    prisma.interiorRoomType.upsert({
      where: { code: 'BEDROOM' },
      update: {},
      create: {
        code: 'BEDROOM',
        name: 'Phòng ngủ',
        nameEn: 'Bedroom',
        icon: 'ri-hotel-bed-line',
        order: 2,
      },
    }),
    prisma.interiorRoomType.upsert({
      where: { code: 'KITCHEN' },
      update: {},
      create: {
        code: 'KITCHEN',
        name: 'Phòng bếp',
        nameEn: 'Kitchen',
        icon: 'ri-restaurant-line',
        order: 3,
      },
    }),
    prisma.interiorRoomType.upsert({
      where: { code: 'BATHROOM' },
      update: {},
      create: {
        code: 'BATHROOM',
        name: 'Phòng tắm',
        nameEn: 'Bathroom',
        icon: 'ri-drop-line',
        order: 4,
      },
    }),
    prisma.interiorRoomType.upsert({
      where: { code: 'BALCONY' },
      update: {},
      create: {
        code: 'BALCONY',
        name: 'Ban công',
        nameEn: 'Balcony',
        icon: 'ri-plant-line',
        order: 5,
      },
    }),
  ]);
  console.log(`  ✓ Created ${roomTypes.length} room types`);

  // ============================================
  // 2. QUOTE SETTINGS (Singleton)
  // ============================================
  console.log('⚙️ Creating quote settings...');
  await prisma.interiorQuoteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
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
  console.log('  ✓ Created quote settings');

  // ============================================
  // 3. DEVELOPERS
  // ============================================
  console.log('🏢 Creating developers...');
  const vingroup = await prisma.interiorDeveloper.upsert({
    where: { slug: 'vingroup' },
    update: {},
    create: {
      name: 'Vingroup',
      slug: 'vingroup',
      description: 'Tập đoàn Vingroup - Chủ đầu tư hàng đầu Việt Nam',
      website: 'https://vingroup.net',
      phone: '1900 232 389',
      email: 'contact@vingroup.net',
      order: 1,
    },
  });

  const novaland = await prisma.interiorDeveloper.upsert({
    where: { slug: 'novaland' },
    update: {},
    create: {
      name: 'Novaland',
      slug: 'novaland',
      description: 'Tập đoàn Novaland - Nhà phát triển bất động sản uy tín',
      website: 'https://novaland.com.vn',
      phone: '1900 63 6666',
      email: 'contact@novaland.com.vn',
      order: 2,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const capitaland = await prisma.interiorDeveloper.upsert({
    where: { slug: 'capitaland' },
    update: {},
    create: {
      name: 'CapitaLand',
      slug: 'capitaland',
      description: 'CapitaLand Development - Tập đoàn bất động sản Singapore',
      website: 'https://capitaland.com',
      order: 3,
    },
  });
  console.log('  ✓ Created 3 developers');

  // ============================================
  // 4. DEVELOPMENTS
  // ============================================
  console.log('🏗️ Creating developments...');
  const vinhomesGrandPark = await prisma.interiorDevelopment.upsert({
    where: { code: 'VGP' },
    update: {},
    create: {
      developerId: vingroup.id,
      name: 'Vinhomes Grand Park',
      code: 'VGP',
      slug: 'vinhomes-grand-park',
      address: 'Phường Long Thạnh Mỹ, Quận 9',
      district: 'Quận 9',
      city: 'TP. Hồ Chí Minh',
      description: 'Đại đô thị đẳng cấp Singapore và hơn thế nữa',
      totalBuildings: 50,
      totalUnits: 30000,
      startYear: 2019,
      completionYear: 2024,
      order: 1,
    },
  });

  const vinhomesCentralPark = await prisma.interiorDevelopment.upsert({
    where: { code: 'VCP' },
    update: {},
    create: {
      developerId: vingroup.id,
      name: 'Vinhomes Central Park',
      code: 'VCP',
      slug: 'vinhomes-central-park',
      address: 'Phường 22, Quận Bình Thạnh',
      district: 'Bình Thạnh',
      city: 'TP. Hồ Chí Minh',
      description: 'Khu đô thị đẳng cấp bên sông Sài Gòn',
      totalBuildings: 18,
      totalUnits: 10000,
      startYear: 2015,
      completionYear: 2018,
      order: 2,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sunriseCity = await prisma.interiorDevelopment.upsert({
    where: { code: 'SRC' },
    update: {},
    create: {
      developerId: novaland.id,
      name: 'Sunrise City',
      code: 'SRC',
      slug: 'sunrise-city',
      address: 'Đường Nguyễn Hữu Thọ, Quận 7',
      district: 'Quận 7',
      city: 'TP. Hồ Chí Minh',
      description: 'Khu phức hợp cao cấp tại Nam Sài Gòn',
      totalBuildings: 6,
      totalUnits: 2000,
      startYear: 2012,
      completionYear: 2016,
      order: 3,
    },
  });
  console.log('  ✓ Created 3 developments');

  // ============================================
  // 5. BUILDINGS
  // ============================================
  console.log('🏬 Creating buildings...');
  const buildingS1 = await prisma.interiorBuilding.upsert({
    where: { developmentId_code: { developmentId: vinhomesGrandPark.id, code: 'S1' } },
    update: {},
    create: {
      developmentId: vinhomesGrandPark.id,
      name: 'Tòa S1',
      code: 'S1',
      totalFloors: 35,
      startFloor: 3,
      endFloor: 35,
      axisLabels: JSON.stringify(['01', '02', '03', '04', '05', '06', '07', '08']),
      unitsPerFloor: 8,
      unitCodeFormat: 'S1.{floor}.{axis}',
      order: 1,
    },
  });

  const buildingS2 = await prisma.interiorBuilding.upsert({
    where: { developmentId_code: { developmentId: vinhomesGrandPark.id, code: 'S2' } },
    update: {},
    create: {
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

  const buildingLandmark81 = await prisma.interiorBuilding.upsert({
    where: { developmentId_code: { developmentId: vinhomesCentralPark.id, code: 'L81' } },
    update: {},
    create: {
      developmentId: vinhomesCentralPark.id,
      name: 'Landmark 81',
      code: 'L81',
      totalFloors: 81,
      startFloor: 45,
      endFloor: 81,
      axisLabels: JSON.stringify(['A', 'B', 'C', 'D']),
      unitsPerFloor: 4,
      unitCodeFormat: 'L81.{floor}{axis}',
      order: 1,
    },
  });
  console.log('  ✓ Created 3 buildings');

  // ============================================
  // 6. LAYOUTS
  // ============================================
  console.log('📐 Creating layouts...');

  const layout2PN_A = await prisma.interiorUnitLayout.upsert({
    where: { code: 'VGP-2PN-A' },
    update: {},
    create: {
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
    },
  });

  const layout3PN_B = await prisma.interiorUnitLayout.upsert({
    where: { code: 'VGP-3PN-B' },
    update: {},
    create: {
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
    },
  });

  const layoutStudio = await prisma.interiorUnitLayout.upsert({
    where: { code: 'VGP-STUDIO' },
    update: {},
    create: {
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

  // Layouts cho Landmark 81 (VCP)
  const layoutL81_3PN = await prisma.interiorUnitLayout.upsert({
    where: { code: 'L81-3PN-A' },
    update: {},
    create: {
      name: 'Layout 3PN Landmark 81 - Type A',
      code: 'L81-3PN-A',
      unitType: '3PN',
      bedrooms: 3,
      bathrooms: 2,
      grossArea: 120.0,
      netArea: 105.0,
      carpetArea: 95.0,
      balconyArea: 10.0,
      rooms: JSON.stringify([
        { name: 'Phòng khách', area: 35.0, type: 'LIVING_ROOM' },
        { name: 'Phòng ngủ chính', area: 20.0, type: 'BEDROOM' },
        { name: 'Phòng ngủ 2', area: 15.0, type: 'BEDROOM' },
        { name: 'Phòng ngủ 3', area: 12.0, type: 'BEDROOM' },
        { name: 'Phòng bếp', area: 15.0, type: 'KITCHEN' },
        { name: 'Phòng tắm 1', area: 6.0, type: 'BATHROOM' },
        { name: 'Phòng tắm 2', area: 5.0, type: 'BATHROOM' },
        { name: 'Ban công', area: 10.0, type: 'BALCONY' },
      ]),
      highlights: JSON.stringify(['View sông Sài Gòn', 'Tầng cao', 'Nội thất cao cấp']),
      description: 'Căn hộ 3 phòng ngủ cao cấp tại Landmark 81',
    },
  });

  const layoutL81_4PN = await prisma.interiorUnitLayout.upsert({
    where: { code: 'L81-4PN-B' },
    update: {},
    create: {
      name: 'Layout 4PN Landmark 81 - Type B',
      code: 'L81-4PN-B',
      unitType: '4PN',
      bedrooms: 4,
      bathrooms: 3,
      grossArea: 180.0,
      netArea: 160.0,
      carpetArea: 145.0,
      balconyArea: 15.0,
      rooms: JSON.stringify([
        { name: 'Phòng khách', area: 45.0, type: 'LIVING_ROOM' },
        { name: 'Phòng ngủ chính', area: 25.0, type: 'BEDROOM' },
        { name: 'Phòng ngủ 2', area: 18.0, type: 'BEDROOM' },
        { name: 'Phòng ngủ 3', area: 15.0, type: 'BEDROOM' },
        { name: 'Phòng ngủ 4', area: 12.0, type: 'BEDROOM' },
        { name: 'Phòng bếp', area: 20.0, type: 'KITCHEN' },
        { name: 'Phòng tắm 1', area: 8.0, type: 'BATHROOM' },
        { name: 'Phòng tắm 2', area: 6.0, type: 'BATHROOM' },
        { name: 'Phòng tắm 3', area: 5.0, type: 'BATHROOM' },
        { name: 'Ban công', area: 15.0, type: 'BALCONY' },
      ]),
      highlights: JSON.stringify(['Penthouse view 360°', 'Tầng cao nhất', 'Thiết kế sang trọng']),
      description: 'Căn hộ 4 phòng ngủ penthouse tại Landmark 81',
    },
  });

  console.log('  ✓ Created 5 layouts');

  // ============================================
  // 7. BUILDING UNITS
  // ============================================
  console.log('🏠 Creating building units...');
  
  // S1 building units
  const axesS1 = ['01', '02', '03', '04', '05', '06', '07', '08'];
  for (const axis of axesS1) {
    const unitType = ['01', '02', '07', '08'].includes(axis) ? '2PN' : '3PN';
    const layout = unitType === '2PN' ? layout2PN_A : layout3PN_B;
    const position = ['01', '08'].includes(axis) ? 'CORNER' : ['02', '07'].includes(axis) ? 'EDGE' : 'MIDDLE';

    await prisma.interiorBuildingUnit.upsert({
      where: { buildingId_axis: { buildingId: buildingS1.id, axis } },
      update: {},
      create: {
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
  console.log(`  ✓ Created ${axesS1.length} building units for S1`);

  // S2 building units (same structure as S1)
  const axesS2 = ['01', '02', '03', '04', '05', '06', '07', '08'];
  for (const axis of axesS2) {
    const unitType = ['01', '02', '07', '08'].includes(axis) ? '2PN' : '3PN';
    const layout = unitType === '2PN' ? layout2PN_A : layout3PN_B;
    const position = ['01', '08'].includes(axis) ? 'CORNER' : ['02', '07'].includes(axis) ? 'EDGE' : 'MIDDLE';

    await prisma.interiorBuildingUnit.upsert({
      where: { buildingId_axis: { buildingId: buildingS2.id, axis } },
      update: {},
      create: {
        buildingId: buildingS2.id,
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
  console.log(`  ✓ Created ${axesS2.length} building units for S2`);

  // Landmark 81 building units (axes A, B, C, D, floors 45-81)
  const axesL81 = ['A', 'B', 'C', 'D'];
  for (const axis of axesL81) {
    const unitType = ['A', 'D'].includes(axis) ? '4PN' : '3PN';
    const layout = unitType === '4PN' ? layoutL81_4PN : layoutL81_3PN;
    const position = ['A', 'D'].includes(axis) ? 'CORNER' : 'MIDDLE';

    await prisma.interiorBuildingUnit.upsert({
      where: { buildingId_axis: { buildingId: buildingLandmark81.id, axis } },
      update: {},
      create: {
        buildingId: buildingLandmark81.id,
        axis,
        unitType,
        bedrooms: layout.bedrooms,
        bathrooms: layout.bathrooms,
        position,
        direction: axis === 'A' ? 'ĐÔNG' : axis === 'B' ? 'NAM' : axis === 'C' ? 'TÂY' : 'BẮC',
        view: 'SÔNG',
        floorStart: 45,
        floorEnd: 81,
        layoutId: layout.id,
      },
    });
  }
  console.log(`  ✓ Created ${axesL81.length} building units for Landmark 81`);

  // ============================================
  // 8. PACKAGES
  // ============================================
  console.log('📦 Creating packages...');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packageBasic2PN = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layout2PN_A.id, code: 'BASIC-2PN' } },
    update: {},
    create: {
      layoutId: layout2PN_A.id,
      name: 'Gói Cơ Bản',
      code: 'BASIC-2PN',
      tier: 1,
      description: 'Gói nội thất cơ bản với đầy đủ tiện nghi thiết yếu',
      shortDescription: 'Đầy đủ tiện nghi cơ bản',
      basePrice: 150000000,
      pricePerSqm: 2534000,
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
            { name: 'Đèn trần', brand: 'Philips', material: 'Kim loại', qty: 1, price: 1500000 },
          ],
        },
        {
          room: 'Phòng ngủ chính',
          items: [
            { name: 'Giường ngủ 1m8', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 6000000 },
            { name: 'Tủ quần áo 2 cánh', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 5000000 },
            { name: 'Bàn trang điểm', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 2000000 },
            { name: 'Đèn ngủ', brand: 'Philips', material: 'Kim loại', qty: 2, price: 500000 },
          ],
        },
        {
          room: 'Phòng bếp',
          items: [
            { name: 'Tủ bếp trên', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 8000000 },
            { name: 'Tủ bếp dưới', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 10000000 },
            { name: 'Bếp từ', brand: 'Bosch', material: 'Kính', qty: 1, price: 8000000 },
            { name: 'Máy hút mùi', brand: 'Bosch', material: 'Inox', qty: 1, price: 5000000 },
          ],
        },
      ]),
      order: 1,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packageStandard2PN = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layout2PN_A.id, code: 'STANDARD-2PN' } },
    update: {},
    create: {
      layoutId: layout2PN_A.id,
      name: 'Gói Tiêu Chuẩn',
      code: 'STANDARD-2PN',
      tier: 2,
      description: 'Gói nội thất tiêu chuẩn với chất lượng tốt hơn',
      shortDescription: 'Chất lượng tốt, thiết kế đẹp',
      basePrice: 250000000,
      pricePerSqm: 4223000,
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
            { name: 'Kệ TV treo tường', brand: 'IKEA', material: 'Gỗ sồi', qty: 1, price: 8000000 },
            { name: 'Đèn trần LED', brand: 'Philips Hue', material: 'Kim loại', qty: 1, price: 4000000 },
          ],
        },
        {
          room: 'Phòng ngủ chính',
          items: [
            { name: 'Giường ngủ 1m8 cao cấp', brand: 'IKEA', material: 'Gỗ sồi', qty: 1, price: 15000000 },
            { name: 'Tủ quần áo 4 cánh', brand: 'IKEA', material: 'Gỗ sồi', qty: 1, price: 12000000 },
            { name: 'Bàn trang điểm', brand: 'IKEA', material: 'Gỗ sồi', qty: 1, price: 5000000 },
            { name: 'Đèn ngủ thông minh', brand: 'Philips Hue', material: 'Kim loại', qty: 2, price: 1500000 },
          ],
        },
        {
          room: 'Phòng bếp',
          items: [
            { name: 'Tủ bếp trên cao cấp', brand: 'Häfele', material: 'Gỗ Acrylic', qty: 1, price: 15000000 },
            { name: 'Tủ bếp dưới cao cấp', brand: 'Häfele', material: 'Gỗ Acrylic', qty: 1, price: 20000000 },
            { name: 'Bếp từ Bosch', brand: 'Bosch', material: 'Kính', qty: 1, price: 15000000 },
            { name: 'Máy hút mùi âm tủ', brand: 'Bosch', material: 'Inox', qty: 1, price: 12000000 },
          ],
        },
      ]),
      order: 2,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packagePremium2PN = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layout2PN_A.id, code: 'PREMIUM-2PN' } },
    update: {},
    create: {
      layoutId: layout2PN_A.id,
      name: 'Gói Cao Cấp',
      code: 'PREMIUM-2PN',
      tier: 3,
      description: 'Gói nội thất cao cấp với vật liệu và thiết kế sang trọng',
      shortDescription: 'Sang trọng, đẳng cấp',
      basePrice: 400000000,
      pricePerSqm: 6757000,
      totalItems: 80,
      totalItemsPrice: 350000000,
      warrantyMonths: 36,
      installationDays: 60,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa Ý nhập khẩu', brand: 'Natuzzi', material: 'Da Ý', qty: 1, price: 80000000 },
            { name: 'Bàn trà đá marble', brand: 'Natuzzi', material: 'Đá marble', qty: 1, price: 15000000 },
            { name: 'Kệ TV gỗ óc chó', brand: 'Custom', material: 'Gỗ óc chó', qty: 1, price: 20000000 },
            { name: 'Đèn chùm pha lê', brand: 'Swarovski', material: 'Pha lê', qty: 1, price: 25000000 },
          ],
        },
      ]),
      order: 3,
    },
  });

  // Packages cho Layout 3PN (VGP-3PN-B)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packageBasic3PN = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layout3PN_B.id, code: 'BASIC-3PN' } },
    update: {},
    create: {
      layoutId: layout3PN_B.id,
      name: 'Gói Cơ Bản 3PN',
      code: 'BASIC-3PN',
      tier: 1,
      description: 'Gói nội thất cơ bản cho căn hộ 3 phòng ngủ',
      shortDescription: 'Đầy đủ tiện nghi cơ bản',
      basePrice: 200000000,
      pricePerSqm: 2614000,
      totalItems: 55,
      totalItemsPrice: 160000000,
      warrantyMonths: 12,
      installationDays: 35,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa góc L', brand: 'Nội thất Hòa Phát', material: 'Vải', qty: 1, price: 10000000 },
            { name: 'Bàn trà', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 3000000 },
            { name: 'Kệ TV', brand: 'Nội thất Hòa Phát', material: 'Gỗ MDF', qty: 1, price: 5000000 },
          ],
        },
      ]),
      order: 1,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packageStandard3PN = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layout3PN_B.id, code: 'STANDARD-3PN' } },
    update: {},
    create: {
      layoutId: layout3PN_B.id,
      name: 'Gói Tiêu Chuẩn 3PN',
      code: 'STANDARD-3PN',
      tier: 2,
      description: 'Gói nội thất tiêu chuẩn cho căn hộ 3 phòng ngủ',
      shortDescription: 'Chất lượng tốt, thiết kế đẹp',
      basePrice: 350000000,
      pricePerSqm: 4575000,
      totalItems: 70,
      totalItemsPrice: 280000000,
      warrantyMonths: 24,
      installationDays: 50,
      isFeatured: true,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa góc L cao cấp', brand: 'IKEA', material: 'Da thật', qty: 1, price: 30000000 },
            { name: 'Bàn trà kính', brand: 'IKEA', material: 'Kính cường lực', qty: 1, price: 6000000 },
            { name: 'Kệ TV treo tường', brand: 'IKEA', material: 'Gỗ sồi', qty: 1, price: 10000000 },
          ],
        },
      ]),
      order: 2,
    },
  });

  // Packages cho Landmark 81 - Layout 3PN (L81-3PN-A)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packageL81Standard3PN = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layoutL81_3PN.id, code: 'L81-STANDARD-3PN' } },
    update: {},
    create: {
      layoutId: layoutL81_3PN.id,
      name: 'Gói Tiêu Chuẩn L81 3PN',
      code: 'L81-STANDARD-3PN',
      tier: 2,
      description: 'Gói nội thất tiêu chuẩn cho căn hộ 3PN tại Landmark 81',
      shortDescription: 'Thiết kế hiện đại, view sông',
      basePrice: 500000000,
      pricePerSqm: 4762000,
      totalItems: 75,
      totalItemsPrice: 400000000,
      warrantyMonths: 24,
      installationDays: 55,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa cao cấp', brand: 'BoConcept', material: 'Da Ý', qty: 1, price: 50000000 },
            { name: 'Bàn trà đá', brand: 'BoConcept', material: 'Đá cẩm thạch', qty: 1, price: 15000000 },
            { name: 'Kệ TV', brand: 'BoConcept', material: 'Gỗ óc chó', qty: 1, price: 20000000 },
          ],
        },
      ]),
      order: 1,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packageL81Premium3PN = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layoutL81_3PN.id, code: 'L81-PREMIUM-3PN' } },
    update: {},
    create: {
      layoutId: layoutL81_3PN.id,
      name: 'Gói Cao Cấp L81 3PN',
      code: 'L81-PREMIUM-3PN',
      tier: 3,
      description: 'Gói nội thất cao cấp cho căn hộ 3PN tại Landmark 81',
      shortDescription: 'Sang trọng, đẳng cấp quốc tế',
      basePrice: 800000000,
      pricePerSqm: 7619000,
      totalItems: 90,
      totalItemsPrice: 650000000,
      warrantyMonths: 36,
      installationDays: 70,
      isFeatured: true,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa Ý nhập khẩu', brand: 'Poltrona Frau', material: 'Da Ý cao cấp', qty: 1, price: 120000000 },
            { name: 'Bàn trà đá marble', brand: 'Poltrona Frau', material: 'Đá marble Ý', qty: 1, price: 30000000 },
            { name: 'Kệ TV gỗ óc chó', brand: 'Custom', material: 'Gỗ óc chó Mỹ', qty: 1, price: 35000000 },
          ],
        },
      ]),
      order: 2,
    },
  });

  // Packages cho Landmark 81 - Layout 4PN (L81-4PN-B)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packageL81Standard4PN = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layoutL81_4PN.id, code: 'L81-STANDARD-4PN' } },
    update: {},
    create: {
      layoutId: layoutL81_4PN.id,
      name: 'Gói Tiêu Chuẩn L81 4PN',
      code: 'L81-STANDARD-4PN',
      tier: 2,
      description: 'Gói nội thất tiêu chuẩn cho căn hộ 4PN Penthouse tại Landmark 81',
      shortDescription: 'Penthouse view 360°',
      basePrice: 900000000,
      pricePerSqm: 5625000,
      totalItems: 100,
      totalItemsPrice: 750000000,
      warrantyMonths: 24,
      installationDays: 75,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa cao cấp', brand: 'Roche Bobois', material: 'Da Ý', qty: 1, price: 80000000 },
            { name: 'Bàn trà đá', brand: 'Roche Bobois', material: 'Đá cẩm thạch', qty: 1, price: 25000000 },
            { name: 'Kệ TV', brand: 'Roche Bobois', material: 'Gỗ óc chó', qty: 1, price: 30000000 },
          ],
        },
      ]),
      order: 1,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packageL81Premium4PN = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layoutL81_4PN.id, code: 'L81-PREMIUM-4PN' } },
    update: {},
    create: {
      layoutId: layoutL81_4PN.id,
      name: 'Gói Cao Cấp L81 4PN',
      code: 'L81-PREMIUM-4PN',
      tier: 3,
      description: 'Gói nội thất cao cấp cho căn hộ 4PN Penthouse tại Landmark 81',
      shortDescription: 'Đẳng cấp thượng lưu',
      basePrice: 1500000000,
      pricePerSqm: 9375000,
      totalItems: 120,
      totalItemsPrice: 1200000000,
      warrantyMonths: 36,
      installationDays: 90,
      isFeatured: true,
      items: JSON.stringify([
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa Ý nhập khẩu', brand: 'Minotti', material: 'Da Ý cao cấp', qty: 1, price: 200000000 },
            { name: 'Bàn trà đá marble', brand: 'Minotti', material: 'Đá marble Ý', qty: 1, price: 50000000 },
            { name: 'Kệ TV gỗ óc chó', brand: 'Custom', material: 'Gỗ óc chó Mỹ', qty: 1, price: 60000000 },
            { name: 'Đèn chùm pha lê', brand: 'Swarovski', material: 'Pha lê Áo', qty: 1, price: 80000000 },
          ],
        },
      ]),
      order: 2,
    },
  });

  // Package cho Studio
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const packageStudio = await prisma.interiorPackage.upsert({
    where: { layoutId_code: { layoutId: layoutStudio.id, code: 'BASIC-STUDIO' } },
    update: {},
    create: {
      layoutId: layoutStudio.id,
      name: 'Gói Cơ Bản Studio',
      code: 'BASIC-STUDIO',
      tier: 1,
      description: 'Gói nội thất cơ bản cho căn hộ Studio',
      shortDescription: 'Nhỏ gọn, tiện nghi',
      basePrice: 80000000,
      pricePerSqm: 2909000,
      totalItems: 25,
      totalItemsPrice: 60000000,
      warrantyMonths: 12,
      installationDays: 20,
      items: JSON.stringify([
        {
          room: 'Phòng chính',
          items: [
            { name: 'Sofa bed', brand: 'IKEA', material: 'Vải', qty: 1, price: 8000000 },
            { name: 'Bàn làm việc', brand: 'IKEA', material: 'Gỗ MDF', qty: 1, price: 3000000 },
            { name: 'Kệ TV nhỏ', brand: 'IKEA', material: 'Gỗ MDF', qty: 1, price: 2500000 },
          ],
        },
      ]),
      order: 1,
    },
  });

  console.log('  ✓ Created 10 packages');

  // ============================================
  // 9. SURCHARGES
  // ============================================
  console.log('💰 Creating surcharges...');
  await Promise.all([
    prisma.interiorSurcharge.upsert({
      where: { code: 'HIGH_FLOOR' },
      update: {},
      create: {
        name: 'Phụ phí tầng cao',
        code: 'HIGH_FLOOR',
        type: 'PER_FLOOR',
        value: 500000,
        conditions: JSON.stringify({ minFloor: 20 }),
        description: 'Phụ phí vận chuyển cho các tầng từ 20 trở lên',
        isAutoApply: true,
        order: 1,
      },
    }),
    prisma.interiorSurcharge.upsert({
      where: { code: 'CORNER_UNIT' },
      update: {},
      create: {
        name: 'Phụ phí căn góc',
        code: 'CORNER_UNIT',
        type: 'PERCENTAGE',
        value: 3,
        conditions: JSON.stringify({ positions: ['CORNER'] }),
        description: 'Phụ phí thiết kế cho căn góc có nhiều cửa sổ',
        isAutoApply: true,
        order: 2,
      },
    }),
    prisma.interiorSurcharge.upsert({
      where: { code: 'LARGE_AREA' },
      update: {},
      create: {
        name: 'Phụ phí diện tích lớn',
        code: 'LARGE_AREA',
        type: 'FIXED',
        value: 5000000,
        conditions: JSON.stringify({ minArea: 100 }),
        description: 'Phụ phí cho căn hộ có diện tích từ 100m² trở lên',
        isAutoApply: true,
        order: 3,
      },
    }),
    prisma.interiorSurcharge.upsert({
      where: { code: 'EXPRESS_INSTALL' },
      update: {},
      create: {
        name: 'Thi công nhanh',
        code: 'EXPRESS_INSTALL',
        type: 'PERCENTAGE',
        value: 10,
        description: 'Phụ phí thi công nhanh (giảm 30% thời gian)',
        isAutoApply: false,
        isOptional: true,
        order: 4,
      },
    }),
  ]);
  console.log('  ✓ Created 4 surcharges');

  // ============================================
  // 10. FURNITURE CATEGORIES
  // ============================================
  console.log('🪑 Creating furniture categories...');
  const catLivingRoom = await prisma.interiorFurnitureCategory.upsert({
    where: { slug: 'phong-khach' },
    update: {},
    create: {
      name: 'Nội thất phòng khách',
      slug: 'phong-khach',
      icon: 'ri-sofa-line',
      roomTypes: JSON.stringify(['LIVING_ROOM']),
      order: 1,
    },
  });

  const catBedroom = await prisma.interiorFurnitureCategory.upsert({
    where: { slug: 'phong-ngu' },
    update: {},
    create: {
      name: 'Nội thất phòng ngủ',
      slug: 'phong-ngu',
      icon: 'ri-hotel-bed-line',
      roomTypes: JSON.stringify(['BEDROOM']),
      order: 2,
    },
  });

  const catKitchen = await prisma.interiorFurnitureCategory.upsert({
    where: { slug: 'phong-bep' },
    update: {},
    create: {
      name: 'Nội thất phòng bếp',
      slug: 'phong-bep',
      icon: 'ri-restaurant-line',
      roomTypes: JSON.stringify(['KITCHEN']),
      order: 3,
    },
  });
  console.log('  ✓ Created 3 furniture categories');

  // ============================================
  // 11. FURNITURE ITEMS
  // ============================================
  console.log('🛋️ Creating furniture items...');
  await Promise.all([
    prisma.interiorFurnitureItem.upsert({
      where: { sku: 'SOFA-001' },
      update: {},
      create: {
        categoryId: catLivingRoom.id,
        name: 'Sofa góc L vải',
        sku: 'SOFA-001',
        brand: 'Nội thất Hòa Phát',
        material: 'Vải bố',
        color: 'Xám',
        dimensions: JSON.stringify({ width: 280, height: 85, depth: 180, unit: 'cm' }),
        price: 8000000,
        costPrice: 5000000,
        warrantyMonths: 12,
        order: 1,
      },
    }),
    prisma.interiorFurnitureItem.upsert({
      where: { sku: 'SOFA-002' },
      update: {},
      create: {
        categoryId: catLivingRoom.id,
        name: 'Sofa góc L da thật',
        sku: 'SOFA-002',
        brand: 'IKEA',
        material: 'Da thật',
        color: 'Nâu',
        dimensions: JSON.stringify({ width: 300, height: 90, depth: 200, unit: 'cm' }),
        price: 25000000,
        costPrice: 18000000,
        warrantyMonths: 24,
        order: 2,
      },
    }),
    prisma.interiorFurnitureItem.upsert({
      where: { sku: 'BED-001' },
      update: {},
      create: {
        categoryId: catBedroom.id,
        name: 'Giường ngủ 1m8 gỗ MDF',
        sku: 'BED-001',
        brand: 'Nội thất Hòa Phát',
        material: 'Gỗ MDF',
        color: 'Trắng',
        dimensions: JSON.stringify({ width: 180, height: 40, depth: 200, unit: 'cm' }),
        price: 6000000,
        costPrice: 4000000,
        warrantyMonths: 12,
        order: 1,
      },
    }),
    prisma.interiorFurnitureItem.upsert({
      where: { sku: 'KITCHEN-001' },
      update: {},
      create: {
        categoryId: catKitchen.id,
        name: 'Tủ bếp trên gỗ MDF',
        sku: 'KITCHEN-001',
        brand: 'Nội thất Hòa Phát',
        material: 'Gỗ MDF',
        color: 'Trắng',
        dimensions: JSON.stringify({ width: 240, height: 70, depth: 35, unit: 'cm' }),
        price: 8000000,
        costPrice: 5500000,
        warrantyMonths: 12,
        order: 1,
      },
    }),
  ]);
  console.log('  ✓ Created 4 furniture items');

  console.log('\n✅ Interior Quote Module seeding completed!');
  console.log('Summary:');
  console.log('  - Room Types: 5');
  console.log('  - Quote Settings: 1');
  console.log('  - Developers: 3');
  console.log('  - Developments: 3');
  console.log('  - Buildings: 3');
  console.log('  - Layouts: 5');
  console.log('  - Building Units: 20 (S1: 8, S2: 8, L81: 4)');
  console.log('  - Packages: 10');
  console.log('  - Surcharges: 4');
  console.log('  - Furniture Categories: 3');
  console.log('  - Furniture Items: 4');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
