/**
 * Quote Service - Interior Quote Module
 *
 * Handles quote calculation, saving, and management.
 *
 * **Property 15: Quote calculation formula**
 * **Property 16: Quote code uniqueness**
 * **Property 17: Quote validity expiration**
 * **Property 20: CustomerLead creation from quote**
 *
 * **Validates: Requirements 15.1-15.8, 17.1-17.6, 18.6, 20.4**
 */

import { prisma } from '../../utils/prisma';
import type { InteriorQuote, InteriorPackage, InteriorBuildingUnit } from '@prisma/client';
import type { CalculateQuoteInput, SaveQuoteInput, UpdateQuoteStatusInput } from '../../schemas/interior.schema';
import type {
  QuoteCalculationResult,
  InteriorQuoteWithRelations,
  AppliedSurcharge,
  PaginatedResult,
  ListOptions,
  QuoteStatus,
  UnitType,
  UnitPosition,
  UnitDirection,
  LayoutRoom,
  PackageRoomItems,
} from './types';
import { getQuoteSettings } from './quote-settings.service';
import { getApplicableSurcharges, calculateSurchargeAmount } from './surcharge.service';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse JSON fields safely
 */
function parseJSON<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Generate unique quote code: INT-YYYY-NNN
 */
async function generateQuoteCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INT-${year}-`;

  // Get the latest quote code for this year
  const latestQuote = await prisma.interiorQuote.findFirst({
    where: {
      code: { startsWith: prefix },
    },
    orderBy: { code: 'desc' },
    select: { code: true },
  });

  let nextNumber = 1;
  if (latestQuote) {
    const lastNumber = parseInt(latestQuote.code.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Generate unit code from building format
 */
function generateUnitCode(
  format: string,
  buildingCode: string,
  floor: number,
  axis: string
): string {
  return format
    .replace('{building}', buildingCode)
    .replace('{floor}', floor.toString())
    .replace('{axis}', axis);
}

/**
 * Calculate labor cost with min/max clamping
 */
function calculateLaborCost(
  netArea: number,
  laborCostPerSqm: number,
  laborCostMin: number | null,
  laborCostMax: number | null
): number {
  let laborCost = netArea * laborCostPerSqm;

  if (laborCostMin !== null && laborCost < laborCostMin) {
    laborCost = laborCostMin;
  }

  if (laborCostMax !== null && laborCost > laborCostMax) {
    laborCost = laborCostMax;
  }

  return laborCost;
}

/**
 * Calculate fee (management or contingency)
 */
function calculateFee(
  type: 'FIXED' | 'PERCENTAGE',
  value: number,
  baseAmount: number
): number {
  if (type === 'PERCENTAGE') {
    return (baseAmount * value) / 100;
  }
  return value;
}

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

type QuoteWithPackage = InteriorQuote & {
  package?: InteriorPackage | null;
};

function transformQuote(quote: QuoteWithPackage): InteriorQuoteWithRelations {
  return {
    id: quote.id,
    code: quote.code,
    customerName: quote.customerName,
    customerPhone: quote.customerPhone,
    customerEmail: quote.customerEmail,
    developmentName: quote.developmentName,
    buildingName: quote.buildingName,
    unitCode: quote.unitCode,
    floor: quote.floor,
    axis: quote.axis,
    unitType: quote.unitType as UnitType,
    layoutName: quote.layoutName,
    grossArea: quote.grossArea,
    netArea: quote.netArea,
    packageId: quote.packageId,
    package: quote.package ? {
      id: quote.package.id,
      layoutId: quote.package.layoutId,
      name: quote.package.name,
      code: quote.package.code,
      tier: quote.package.tier,
      description: quote.package.description,
      shortDescription: quote.package.shortDescription,
      basePrice: quote.package.basePrice,
      pricePerSqm: quote.package.pricePerSqm,
      thumbnail: quote.package.thumbnail,
      images: parseJSON<string[]>(quote.package.images, []),
      video360Url: quote.package.video360Url,
      items: parseJSON<PackageRoomItems[]>(quote.package.items, []),
      totalItems: quote.package.totalItems ?? 0,
      totalItemsPrice: quote.package.totalItemsPrice ?? 0,
      warrantyMonths: quote.package.warrantyMonths,
      installationDays: quote.package.installationDays,
      order: quote.package.order,
      isActive: quote.package.isActive,
      isFeatured: quote.package.isFeatured,
      createdAt: quote.package.createdAt,
      updatedAt: quote.package.updatedAt,
    } : undefined,
    packageName: quote.packageName,
    packageTier: quote.packageTier,
    packagePrice: quote.packagePrice,
    laborCost: quote.laborCost,
    surcharges: parseJSON<AppliedSurcharge[]>(quote.surcharges, []),
    surchargesTotal: quote.surchargesTotal,
    managementFee: quote.managementFee,
    contingency: quote.contingency,
    subtotal: quote.subtotal,
    vatAmount: quote.vatAmount,
    discount: quote.discount,
    grandTotal: quote.grandTotal,
    pricePerSqm: quote.pricePerSqm,
    status: quote.status as QuoteStatus,
    validUntil: quote.validUntil,
    notes: quote.notes,
    internalNotes: quote.internalNotes,
    sentAt: quote.sentAt,
    viewedAt: quote.viewedAt,
    acceptedAt: quote.acceptedAt,
    rejectedAt: quote.rejectedAt,
    rejectionReason: quote.rejectionReason,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };
}

// ============================================
// QUOTE CALCULATION
// ============================================

type BuildingUnitWithRelations = InteriorBuildingUnit & {
  building: {
    id: string;
    name: string;
    code: string;
    unitCodeFormat: string;
    developmentId: string;
    development: {
      id: string;
      name: string;
      code: string;
    };
  };
  layout: {
    id: string;
    name: string;
    code: string;
    unitType: string;
    bedrooms: number;
    bathrooms: number;
    grossArea: number;
    netArea: number;
    rooms: string;
  };
};

type PackageWithLayout = InteriorPackage & {
  layout: {
    id: string;
    name: string;
    code: string;
    unitType: string;
  };
};

/**
 * Calculate quote without saving
 *
 * **Property 15: Quote calculation formula**
 * - laborCost = netArea × laborCostPerSqm (clamped by min/max if set)
 * - managementFee = subtotal × managementFeeValue/100 (if PERCENTAGE) or managementFeeValue (if FIXED)
 * - contingency = subtotal × contingencyValue/100 (if PERCENTAGE) or contingencyValue (if FIXED)
 * - subtotal = packagePrice + laborCost + surchargesTotal + managementFee + contingency
 * - vatAmount = subtotal × vatPercent/100 (if vatEnabled)
 * - grandTotal = subtotal + vatAmount - discount
 * - pricePerSqm = grandTotal / netArea
 */
export async function calculateQuote(
  input: CalculateQuoteInput
): Promise<QuoteCalculationResult> {
  const { buildingUnitId, floor, packageId, discount = 0 } = input;

  // 1. Get building unit with relations
  const buildingUnit = await prisma.interiorBuildingUnit.findUnique({
    where: { id: buildingUnitId },
    include: {
      building: {
        include: {
          development: true,
        },
      },
      layout: true,
    },
  }) as BuildingUnitWithRelations | null;

  if (!buildingUnit) {
    throw new Error('Căn hộ không tồn tại');
  }

  if (!buildingUnit.isActive) {
    throw new Error('Căn hộ không còn hoạt động');
  }

  // Validate floor is within unit range
  if (floor < buildingUnit.floorStart) {
    throw new Error(`Tầng ${floor} không nằm trong phạm vi căn hộ (từ tầng ${buildingUnit.floorStart})`);
  }
  if (buildingUnit.floorEnd !== null && floor > buildingUnit.floorEnd) {
    throw new Error(`Tầng ${floor} không nằm trong phạm vi căn hộ (đến tầng ${buildingUnit.floorEnd})`);
  }

  // 2. Get package with layout
  const pkg = await prisma.interiorPackage.findUnique({
    where: { id: packageId },
    include: {
      layout: true,
    },
  }) as PackageWithLayout | null;

  if (!pkg) {
    throw new Error('Gói nội thất không tồn tại');
  }

  if (!pkg.isActive) {
    throw new Error('Gói nội thất không còn hoạt động');
  }

  // Validate package layout matches unit layout
  if (pkg.layoutId !== buildingUnit.layoutId) {
    throw new Error('Gói nội thất không phù hợp với layout căn hộ');
  }

  // 3. Get quote settings
  const settings = await getQuoteSettings();

  // 4. Get applicable surcharges
  const applicableSurcharges = await getApplicableSurcharges({
    floor,
    area: buildingUnit.layout.netArea,
    unitType: buildingUnit.unitType as UnitType,
    position: buildingUnit.position as UnitPosition,
    buildingId: buildingUnit.buildingId,
    developmentId: buildingUnit.building.developmentId,
  });

  // 5. Calculate price breakdown
  const packagePrice = pkg.basePrice;
  const netArea = buildingUnit.layout.netArea;

  // Labor cost with min/max clamping
  const laborCost = calculateLaborCost(
    netArea,
    settings.laborCostPerSqm,
    settings.laborCostMin,
    settings.laborCostMax
  );

  // Calculate surcharges
  const surcharges: AppliedSurcharge[] = applicableSurcharges.map((s) => ({
    name: s.name,
    amount: calculateSurchargeAmount(s, {
      floor,
      area: netArea,
      baseAmount: packagePrice,
    }),
  }));
  const surchargesTotal = surcharges.reduce((sum, s) => sum + s.amount, 0);

  // Base for fee calculation (before fees)
  const baseForFees = packagePrice + laborCost + surchargesTotal;

  // Management fee
  const managementFee = calculateFee(
    settings.managementFeeType,
    settings.managementFeeValue,
    baseForFees
  );

  // Contingency
  const contingency = calculateFee(
    settings.contingencyType,
    settings.contingencyValue,
    baseForFees
  );

  // Subtotal
  const subtotal = packagePrice + laborCost + surchargesTotal + managementFee + contingency;

  // VAT
  const vatAmount = settings.vatEnabled ? (subtotal * settings.vatPercent) / 100 : 0;

  // Discount validation
  const maxDiscount = settings.maxDiscountPercent ?? 100;
  if (discount > maxDiscount) {
    throw new Error(`Giảm giá không được vượt quá ${maxDiscount}%`);
  }
  const discountAmount = (subtotal * discount) / 100;

  // Grand total
  const grandTotal = subtotal + vatAmount - discountAmount;

  // Price per sqm
  const pricePerSqm = grandTotal / netArea;

  // Validity date
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + settings.quoteValidityDays);

  // Generate unit code
  const unitCode = generateUnitCode(
    buildingUnit.building.unitCodeFormat,
    buildingUnit.building.code,
    floor,
    buildingUnit.axis
  );

  return {
    unitInfo: {
      developmentName: buildingUnit.building.development.name,
      buildingName: buildingUnit.building.name,
      unitCode,
      floor,
      axis: buildingUnit.axis,
      unitType: buildingUnit.unitType as UnitType,
      position: buildingUnit.position as UnitPosition,
      direction: buildingUnit.direction as UnitDirection | null,
    },
    layoutInfo: {
      name: buildingUnit.layout.name,
      grossArea: buildingUnit.layout.grossArea,
      netArea: buildingUnit.layout.netArea,
      rooms: parseJSON<LayoutRoom[]>(buildingUnit.layout.rooms, []),
    },
    packageInfo: {
      id: pkg.id,
      name: pkg.name,
      tier: pkg.tier,
      basePrice: pkg.basePrice,
      items: parseJSON<PackageRoomItems[]>(pkg.items, []),
    },
    priceBreakdown: {
      packagePrice,
      laborCost,
      surcharges,
      surchargesTotal,
      managementFee,
      contingency,
      subtotal,
      vatAmount,
      discount: discountAmount,
      grandTotal,
      pricePerSqm,
    },
    validUntil,
  };
}


// ============================================
// QUOTE SAVE & MANAGEMENT
// ============================================

/**
 * Save quote and create CustomerLead
 *
 * **Property 16: Quote code uniqueness**
 * **Property 20: CustomerLead creation from quote**
 */
export async function saveQuote(
  input: SaveQuoteInput
): Promise<InteriorQuoteWithRelations> {
  // Calculate quote first
  const calculation = await calculateQuote({
    buildingUnitId: input.buildingUnitId,
    floor: input.floor,
    packageId: input.packageId,
    discount: input.discount,
  });

  // Generate unique quote code
  const code = await generateQuoteCode();

  // Get package for additional info
  const pkg = await prisma.interiorPackage.findUnique({
    where: { id: input.packageId },
  });

  if (!pkg) {
    throw new Error('Gói nội thất không tồn tại');
  }

  // Create quote and CustomerLead in transaction
  const quote = await prisma.$transaction(async (tx) => {
    // Create quote
    const newQuote = await tx.interiorQuote.create({
      data: {
        code,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail ?? null,
        developmentName: calculation.unitInfo.developmentName,
        buildingName: calculation.unitInfo.buildingName,
        unitCode: calculation.unitInfo.unitCode,
        floor: calculation.unitInfo.floor,
        axis: calculation.unitInfo.axis,
        unitType: calculation.unitInfo.unitType,
        layoutName: calculation.layoutInfo.name,
        grossArea: calculation.layoutInfo.grossArea,
        netArea: calculation.layoutInfo.netArea,
        packageId: input.packageId,
        packageName: calculation.packageInfo.name,
        packageTier: calculation.packageInfo.tier,
        packagePrice: calculation.priceBreakdown.packagePrice,
        laborCost: calculation.priceBreakdown.laborCost,
        surcharges: JSON.stringify(calculation.priceBreakdown.surcharges),
        surchargesTotal: calculation.priceBreakdown.surchargesTotal,
        managementFee: calculation.priceBreakdown.managementFee,
        contingency: calculation.priceBreakdown.contingency,
        subtotal: calculation.priceBreakdown.subtotal,
        vatAmount: calculation.priceBreakdown.vatAmount,
        discount: calculation.priceBreakdown.discount,
        grandTotal: calculation.priceBreakdown.grandTotal,
        pricePerSqm: calculation.priceBreakdown.pricePerSqm,
        status: 'DRAFT',
        validUntil: calculation.validUntil,
        notes: input.notes ?? null,
      },
      include: {
        package: true,
      },
    });

    // Create CustomerLead with source="INTERIOR_QUOTE"
    await tx.customerLead.create({
      data: {
        name: input.customerName,
        phone: input.customerPhone,
        email: input.customerEmail ?? null,
        content: `Báo giá nội thất: ${calculation.unitInfo.unitCode} - ${calculation.packageInfo.name}`,
        status: 'NEW',
        source: 'INTERIOR_QUOTE',
        quoteData: JSON.stringify({
          quoteCode: code,
          unitCode: calculation.unitInfo.unitCode,
          developmentName: calculation.unitInfo.developmentName,
          buildingName: calculation.unitInfo.buildingName,
          packageName: calculation.packageInfo.name,
          grandTotal: calculation.priceBreakdown.grandTotal,
        }),
      },
    });

    return newQuote;
  });

  return transformQuote(quote);
}

/**
 * Get quote by ID
 */
export async function getQuoteById(id: string): Promise<InteriorQuoteWithRelations | null> {
  const quote = await prisma.interiorQuote.findUnique({
    where: { id },
    include: {
      package: true,
    },
  });

  if (!quote) return null;

  return transformQuote(quote);
}

/**
 * Get quote by code (public view)
 */
export async function getQuoteByCode(code: string): Promise<InteriorQuoteWithRelations | null> {
  const quote = await prisma.interiorQuote.findUnique({
    where: { code },
    include: {
      package: true,
    },
  });

  if (!quote) return null;

  // Update viewedAt if first view
  if (!quote.viewedAt && quote.status === 'SENT') {
    await prisma.interiorQuote.update({
      where: { id: quote.id },
      data: {
        viewedAt: new Date(),
        status: 'VIEWED',
      },
    });
  }

  return transformQuote(quote);
}

/**
 * List quotes with filters
 */
export async function listQuotes(
  options: ListOptions & {
    status?: QuoteStatus;
    developmentName?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  } = {}
): Promise<PaginatedResult<InteriorQuoteWithRelations>> {
  const {
    page = 1,
    limit = 20,
    status,
    developmentName,
    minPrice,
    maxPrice,
    startDate,
    endDate,
    search,
  } = options;
  const skip = (page - 1) * limit;

  // Build where clause
  interface WhereClause {
    status?: string;
    developmentName?: { contains: string; mode: 'insensitive' };
    grandTotal?: { gte?: number; lte?: number };
    createdAt?: { gte?: Date; lte?: Date };
    OR?: Array<{
      customerName?: { contains: string; mode: 'insensitive' };
      customerPhone?: { contains: string };
      code?: { contains: string };
      unitCode?: { contains: string };
    }>;
  }

  const where: WhereClause = {};

  if (status) where.status = status;
  if (developmentName) {
    where.developmentName = { contains: developmentName, mode: 'insensitive' };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.grandTotal = {};
    if (minPrice !== undefined) where.grandTotal.gte = minPrice;
    if (maxPrice !== undefined) where.grandTotal.lte = maxPrice;
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search } },
      { code: { contains: search } },
      { unitCode: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.interiorQuote.findMany({
      where,
      include: {
        package: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.interiorQuote.count({ where }),
  ]);

  return {
    items: items.map(transformQuote),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
  id: string,
  input: UpdateQuoteStatusInput
): Promise<InteriorQuoteWithRelations> {
  const quote = await prisma.interiorQuote.findUnique({
    where: { id },
  });

  if (!quote) {
    throw new Error('Báo giá không tồn tại');
  }

  // Build update data based on status
  interface UpdateData {
    status: string;
    internalNotes?: string | null;
    sentAt?: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string | null;
  }

  const updateData: UpdateData = {
    status: input.status,
  };

  if (input.internalNotes !== undefined) {
    updateData.internalNotes = input.internalNotes;
  }

  // Set timestamp based on status
  switch (input.status) {
    case 'SENT':
      updateData.sentAt = new Date();
      break;
    case 'ACCEPTED':
      updateData.acceptedAt = new Date();
      break;
    case 'REJECTED':
      updateData.rejectedAt = new Date();
      if (input.rejectionReason) {
        updateData.rejectionReason = input.rejectionReason;
      }
      break;
  }

  const updated = await prisma.interiorQuote.update({
    where: { id },
    data: updateData,
    include: {
      package: true,
    },
  });

  return transformQuote(updated);
}

/**
 * Check and update expired quotes
 *
 * **Property 17: Quote validity expiration**
 */
export async function updateExpiredQuotes(): Promise<number> {
  const result = await prisma.interiorQuote.updateMany({
    where: {
      status: { in: ['DRAFT', 'SENT', 'VIEWED'] },
      validUntil: { lt: new Date() },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return result.count;
}

/**
 * Export quotes to CSV format
 */
export async function exportQuotesToCSV(
  options: {
    status?: QuoteStatus;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<string> {
  const { status, startDate, endDate } = options;

  interface WhereClause {
    status?: string;
    createdAt?: { gte?: Date; lte?: Date };
  }

  const where: WhereClause = {};
  if (status) where.status = status;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const quotes = await prisma.interiorQuote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // CSV header
  const headers = [
    'Mã báo giá',
    'Khách hàng',
    'Số điện thoại',
    'Email',
    'Dự án',
    'Tòa nhà',
    'Mã căn hộ',
    'Tầng',
    'Loại căn',
    'Gói nội thất',
    'Giá gói',
    'Nhân công',
    'Phụ phí',
    'Phí quản lý',
    'Dự phòng',
    'Tạm tính',
    'VAT',
    'Giảm giá',
    'Tổng cộng',
    'Giá/m²',
    'Trạng thái',
    'Ngày tạo',
    'Hiệu lực đến',
  ].join(',');

  // CSV rows
  const rows = quotes.map((q) => [
    q.code,
    `"${q.customerName}"`,
    q.customerPhone,
    q.customerEmail ?? '',
    `"${q.developmentName}"`,
    `"${q.buildingName}"`,
    q.unitCode,
    q.floor,
    q.unitType,
    `"${q.packageName}"`,
    q.packagePrice,
    q.laborCost,
    q.surchargesTotal,
    q.managementFee,
    q.contingency,
    q.subtotal,
    q.vatAmount,
    q.discount,
    q.grandTotal,
    q.pricePerSqm ?? '',
    q.status,
    q.createdAt.toISOString(),
    q.validUntil?.toISOString() ?? '',
  ].join(','));

  return [headers, ...rows].join('\n');
}

/**
 * Delete quote (admin only)
 */
export async function deleteQuote(id: string): Promise<{ success: boolean }> {
  await prisma.interiorQuote.delete({
    where: { id },
  });

  return { success: true };
}
