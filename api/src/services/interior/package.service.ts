import { prisma } from '../../utils/prisma';
import type { InteriorPackage } from '@prisma/client';
import type { CreatePackageInput, UpdatePackageInput } from '../../schemas/interior.schema';
import type {
  InteriorPackageWithRelations,
  PackageRoomItems,
  UnitType,
  PaginatedResult,
  ListOptions,
} from './types';

// Type for layout select from Prisma query (only needed fields)
type LayoutSelect = {
  id: string;
  name: string;
  code: string;
  unitType: string;
  bedrooms: number;
  bathrooms: number;
  grossArea: number;
  netArea: number;
};

// Type for package with partial layout relation from Prisma query
type PackageWithLayoutSelect = InteriorPackage & {
  layout: LayoutSelect | null;
};

/**
 * Parse JSON fields
 */
function parseItems(items: string): PackageRoomItems[] {
  try {
    return JSON.parse(items);
  } catch {
    return [];
  }
}

function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    return JSON.parse(images);
  } catch {
    return [];
  }
}

/**
 * Calculate total items and price from items array
 */
export function calculatePackageTotals(items: PackageRoomItems[]): {
  totalItems: number;
  totalItemsPrice: number;
} {
  let totalItems = 0;
  let totalItemsPrice = 0;

  for (const room of items) {
    for (const item of room.items) {
      totalItems += item.qty;
      totalItemsPrice += item.qty * item.price;
    }
  }

  return { totalItems, totalItemsPrice };
}

/**
 * Transform package from DB to response type
 */
function transformPackage(pkg: PackageWithLayoutSelect): InteriorPackageWithRelations {
  const items = parseItems(pkg.items);
  const { totalItems, totalItemsPrice } = calculatePackageTotals(items);

  return {
    id: pkg.id,
    layoutId: pkg.layoutId,
    layout: pkg.layout
      ? {
          id: pkg.layout.id,
          name: pkg.layout.name,
          code: pkg.layout.code,
          unitType: pkg.layout.unitType as UnitType,
          bedrooms: pkg.layout.bedrooms,
          bathrooms: pkg.layout.bathrooms,
          grossArea: pkg.layout.grossArea,
          netArea: pkg.layout.netArea,
        }
      : undefined,
    name: pkg.name,
    code: pkg.code,
    tier: pkg.tier,
    description: pkg.description,
    shortDescription: pkg.shortDescription,
    basePrice: pkg.basePrice,
    pricePerSqm: pkg.pricePerSqm,
    thumbnail: pkg.thumbnail,
    images: parseImages(pkg.images),
    video360Url: pkg.video360Url,
    items,
    totalItems: pkg.totalItems ?? totalItems,
    totalItemsPrice: pkg.totalItemsPrice ?? totalItemsPrice,
    warrantyMonths: pkg.warrantyMonths,
    installationDays: pkg.installationDays,
    order: pkg.order,
    isActive: pkg.isActive,
    isFeatured: pkg.isFeatured,
    createdAt: pkg.createdAt,
    updatedAt: pkg.updatedAt,
  };
}

/**
 * List packages with optional filters
 */
export async function listPackages(
  options: ListOptions & {
    layoutId?: string;
    tier?: number;
    isActive?: boolean;
    isFeatured?: boolean;
  } = {}
): Promise<PaginatedResult<InteriorPackageWithRelations>> {
  const { page = 1, limit = 20, layoutId, tier, isActive, isFeatured } = options;
  const skip = (page - 1) * limit;

  const where: { layoutId?: string; tier?: number; isActive?: boolean; isFeatured?: boolean } = {};
  if (layoutId) where.layoutId = layoutId;
  if (tier) where.tier = tier;
  if (isActive !== undefined) where.isActive = isActive;
  if (isFeatured !== undefined) where.isFeatured = isFeatured;

  const [items, total] = await Promise.all([
    prisma.interiorPackage.findMany({
      where,
      orderBy: [{ tier: 'asc' }, { order: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
      include: {
        layout: {
          select: {
            id: true,
            name: true,
            code: true,
            unitType: true,
            bedrooms: true,
            bathrooms: true,
            grossArea: true,
            netArea: true,
          },
        },
      },
    }),
    prisma.interiorPackage.count({ where }),
  ]);

  return {
    items: items.map(transformPackage),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get package by ID
 */
export async function getPackageById(id: string): Promise<InteriorPackageWithRelations | null> {
  const pkg = await prisma.interiorPackage.findUnique({
    where: { id },
    include: {
      layout: {
        select: {
          id: true,
          name: true,
          code: true,
          unitType: true,
          bedrooms: true,
          bathrooms: true,
          grossArea: true,
          netArea: true,
        },
      },
    },
  });

  if (!pkg) return null;

  return transformPackage(pkg);
}

/**
 * Create a new package
 */
export async function createPackage(
  data: CreatePackageInput
): Promise<InteriorPackageWithRelations> {
  const { totalItems, totalItemsPrice } = calculatePackageTotals(data.items);

  // Get max order
  const maxOrder = await prisma.interiorPackage.aggregate({
    _max: { order: true },
    where: { layoutId: data.layoutId },
  });

  const pkg = await prisma.interiorPackage.create({
    data: {
      layoutId: data.layoutId,
      name: data.name,
      code: data.code,
      tier: data.tier ?? 1,
      description: data.description ?? null,
      shortDescription: data.shortDescription ?? null,
      basePrice: data.basePrice,
      pricePerSqm: data.pricePerSqm ?? null,
      thumbnail: data.thumbnail ?? null,
      images: data.images ? JSON.stringify(data.images) : null,
      video360Url: data.video360Url ?? null,
      items: JSON.stringify(data.items),
      totalItems,
      totalItemsPrice,
      warrantyMonths: data.warrantyMonths ?? null,
      installationDays: data.installationDays ?? null,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
    },
    include: {
      layout: {
        select: {
          id: true,
          name: true,
          code: true,
          unitType: true,
          bedrooms: true,
          bathrooms: true,
          grossArea: true,
          netArea: true,
        },
      },
    },
  });

  return transformPackage(pkg);
}

/**
 * Update a package
 */
export async function updatePackage(
  id: string,
  data: UpdatePackageInput
): Promise<InteriorPackageWithRelations> {
  // Calculate totals if items are being updated
  let totals: { totalItems?: number; totalItemsPrice?: number } = {};
  if (data.items) {
    totals = calculatePackageTotals(data.items);
  }

  const pkg = await prisma.interiorPackage.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.tier !== undefined && { tier: data.tier }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
      ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
      ...(data.pricePerSqm !== undefined && { pricePerSqm: data.pricePerSqm }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      ...(data.images !== undefined && { images: data.images ? JSON.stringify(data.images) : null }),
      ...(data.video360Url !== undefined && { video360Url: data.video360Url }),
      ...(data.items !== undefined && {
        items: JSON.stringify(data.items),
        totalItems: totals.totalItems,
        totalItemsPrice: totals.totalItemsPrice,
      }),
      ...(data.warrantyMonths !== undefined && { warrantyMonths: data.warrantyMonths }),
      ...(data.installationDays !== undefined && { installationDays: data.installationDays }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
    },
    include: {
      layout: {
        select: {
          id: true,
          name: true,
          code: true,
          unitType: true,
          bedrooms: true,
          bathrooms: true,
          grossArea: true,
          netArea: true,
        },
      },
    },
  });

  return transformPackage(pkg);
}

/**
 * Delete a package
 */
export async function deletePackage(id: string): Promise<{ success: boolean; error?: string }> {
  // Check for existing quotes
  const quoteCount = await prisma.interiorQuote.count({
    where: { packageId: id },
  });

  if (quoteCount > 0) {
    return {
      success: false,
      error: `Không thể xóa gói nội thất này vì có ${quoteCount} báo giá liên quan`,
    };
  }

  await prisma.interiorPackage.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Clone a package to another layout
 */
export async function clonePackage(
  id: string,
  targetLayoutId: string,
  newCode: string,
  newName: string,
  priceAdjustment = 0
): Promise<InteriorPackageWithRelations> {
  const original = await prisma.interiorPackage.findUnique({
    where: { id },
  });

  if (!original) {
    throw new Error('Gói nội thất không tồn tại');
  }

  // Adjust prices if needed
  let items = parseItems(original.items);
  let basePrice = original.basePrice;

  if (priceAdjustment !== 0) {
    const multiplier = 1 + priceAdjustment / 100;
    basePrice = Math.round(basePrice * multiplier);

    items = items.map((room) => ({
      ...room,
      items: room.items.map((item) => ({
        ...item,
        price: Math.round(item.price * multiplier),
      })),
    }));
  }

  const { totalItems, totalItemsPrice } = calculatePackageTotals(items);

  const cloned = await prisma.interiorPackage.create({
    data: {
      layoutId: targetLayoutId,
      name: newName,
      code: newCode,
      tier: original.tier,
      description: original.description,
      shortDescription: original.shortDescription,
      basePrice,
      pricePerSqm: original.pricePerSqm
        ? Math.round(original.pricePerSqm * (1 + priceAdjustment / 100))
        : null,
      thumbnail: original.thumbnail,
      images: original.images,
      video360Url: original.video360Url,
      items: JSON.stringify(items),
      totalItems,
      totalItemsPrice,
      warrantyMonths: original.warrantyMonths,
      installationDays: original.installationDays,
      order: 0,
      isActive: true,
      isFeatured: false,
    },
    include: {
      layout: {
        select: {
          id: true,
          name: true,
          code: true,
          unitType: true,
          bedrooms: true,
          bathrooms: true,
          grossArea: true,
          netArea: true,
        },
      },
    },
  });

  return transformPackage(cloned);
}

/**
 * Check if package code exists within layout
 */
export async function isPackageCodeExists(
  layoutId: string,
  code: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.interiorPackage.findFirst({
    where: {
      layoutId,
      code,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
}
