import { prisma } from '../../utils/prisma';
import type { InteriorUnitLayout } from '@prisma/client';
import type { CreateLayoutInput, UpdateLayoutInput } from '../../schemas/interior.schema';
import type {
  InteriorUnitLayoutWithRelations,
  LayoutRoom,
  UnitType,
  PaginatedResult,
  ListOptions,
} from './types';

/**
 * Parse JSON fields
 */
function parseRooms(rooms: string): LayoutRoom[] {
  try {
    return JSON.parse(rooms);
  } catch {
    return [];
  }
}

function parseHighlights(highlights: string | null): string[] {
  if (!highlights) return [];
  try {
    return JSON.parse(highlights);
  } catch {
    return [];
  }
}

/**
 * Transform layout from DB to response type
 */
function transformLayout(layout: InteriorUnitLayout, packageCount: number): InteriorUnitLayoutWithRelations {
  return {
    id: layout.id,
    name: layout.name,
    code: layout.code,
    unitType: layout.unitType as UnitType,
    bedrooms: layout.bedrooms,
    bathrooms: layout.bathrooms,
    grossArea: layout.grossArea,
    netArea: layout.netArea,
    carpetArea: layout.carpetArea,
    balconyArea: layout.balconyArea,
    terraceArea: layout.terraceArea,
    rooms: parseRooms(layout.rooms),
    layoutImage: layout.layoutImage,
    layout3DImage: layout.layout3DImage,
    dimensionImage: layout.dimensionImage,
    description: layout.description,
    highlights: parseHighlights(layout.highlights),
    isActive: layout.isActive,
    packageCount,
    createdAt: layout.createdAt,
    updatedAt: layout.updatedAt,
  };
}

/**
 * Validate room areas sum
 */
export function validateRoomAreasSum(
  rooms: LayoutRoom[],
  netArea: number
): { valid: boolean; error?: string; totalRoomArea?: number } {
  const totalRoomArea = rooms.reduce((sum, room) => sum + room.area, 0);

  if (totalRoomArea > netArea) {
    return {
      valid: false,
      error: `Tổng diện tích các phòng (${totalRoomArea} m²) vượt quá diện tích thông thủy (${netArea} m²)`,
      totalRoomArea,
    };
  }

  return { valid: true, totalRoomArea };
}

/**
 * List layouts with optional filters
 */
export async function listLayouts(
  options: ListOptions & { unitType?: UnitType; isActive?: boolean } = {}
): Promise<PaginatedResult<InteriorUnitLayoutWithRelations>> {
  const { page = 1, limit = 20, unitType, isActive } = options;
  const skip = (page - 1) * limit;

  const where: { unitType?: string; isActive?: boolean } = {};
  if (unitType) where.unitType = unitType;
  if (isActive !== undefined) where.isActive = isActive;

  const [items, total] = await Promise.all([
    prisma.interiorUnitLayout.findMany({
      where,
      orderBy: [{ unitType: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
      include: {
        _count: {
          select: { packages: true },
        },
      },
    }),
    prisma.interiorUnitLayout.count({ where }),
  ]);

  return {
    items: items.map((item) => transformLayout(item, item._count.packages)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get layout by ID
 */
export async function getLayoutById(id: string): Promise<InteriorUnitLayoutWithRelations | null> {
  const layout = await prisma.interiorUnitLayout.findUnique({
    where: { id },
    include: {
      _count: {
        select: { packages: true },
      },
    },
  });

  if (!layout) return null;

  return transformLayout(layout, layout._count.packages);
}

/**
 * Get layout by code
 */
export async function getLayoutByCode(code: string): Promise<InteriorUnitLayoutWithRelations | null> {
  const layout = await prisma.interiorUnitLayout.findUnique({
    where: { code },
    include: {
      _count: {
        select: { packages: true },
      },
    },
  });

  if (!layout) return null;

  return transformLayout(layout, layout._count.packages);
}

/**
 * Create a new layout
 */
export async function createLayout(
  data: CreateLayoutInput
): Promise<InteriorUnitLayoutWithRelations> {
  // Validate room areas sum
  const roomValidation = validateRoomAreasSum(data.rooms, data.netArea);
  if (!roomValidation.valid) {
    throw new Error(roomValidation.error);
  }

  const layout = await prisma.interiorUnitLayout.create({
    data: {
      name: data.name,
      code: data.code,
      unitType: data.unitType,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms ?? 1,
      grossArea: data.grossArea,
      netArea: data.netArea,
      carpetArea: data.carpetArea ?? null,
      balconyArea: data.balconyArea ?? null,
      terraceArea: data.terraceArea ?? null,
      rooms: JSON.stringify(data.rooms),
      layoutImage: data.layoutImage ?? null,
      layout3DImage: data.layout3DImage ?? null,
      dimensionImage: data.dimensionImage ?? null,
      description: data.description ?? null,
      highlights: data.highlights ? JSON.stringify(data.highlights) : null,
      isActive: data.isActive ?? true,
    },
    include: {
      _count: {
        select: { packages: true },
      },
    },
  });

  return transformLayout(layout, layout._count.packages);
}

/**
 * Update a layout
 */
export async function updateLayout(
  id: string,
  data: UpdateLayoutInput
): Promise<InteriorUnitLayoutWithRelations> {
  // If rooms or netArea is being updated, validate
  if (data.rooms || data.netArea !== undefined) {
    const current = await prisma.interiorUnitLayout.findUnique({
      where: { id },
      select: { rooms: true, netArea: true },
    });

    if (current) {
      const rooms = data.rooms ?? parseRooms(current.rooms);
      const netArea = data.netArea ?? current.netArea;

      const roomValidation = validateRoomAreasSum(rooms, netArea);
      if (!roomValidation.valid) {
        throw new Error(roomValidation.error);
      }
    }
  }

  const layout = await prisma.interiorUnitLayout.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.unitType !== undefined && { unitType: data.unitType }),
      ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
      ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
      ...(data.grossArea !== undefined && { grossArea: data.grossArea }),
      ...(data.netArea !== undefined && { netArea: data.netArea }),
      ...(data.carpetArea !== undefined && { carpetArea: data.carpetArea }),
      ...(data.balconyArea !== undefined && { balconyArea: data.balconyArea }),
      ...(data.terraceArea !== undefined && { terraceArea: data.terraceArea }),
      ...(data.rooms !== undefined && { rooms: JSON.stringify(data.rooms) }),
      ...(data.layoutImage !== undefined && { layoutImage: data.layoutImage }),
      ...(data.layout3DImage !== undefined && { layout3DImage: data.layout3DImage }),
      ...(data.dimensionImage !== undefined && { dimensionImage: data.dimensionImage }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.highlights !== undefined && {
        highlights: data.highlights ? JSON.stringify(data.highlights) : null,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      _count: {
        select: { packages: true },
      },
    },
  });

  return transformLayout(layout, layout._count.packages);
}

/**
 * Delete a layout (only if no building units or packages)
 */
export async function deleteLayout(id: string): Promise<{ success: boolean; error?: string }> {
  // Check for existing building units
  const unitCount = await prisma.interiorBuildingUnit.count({
    where: { layoutId: id },
  });

  if (unitCount > 0) {
    return {
      success: false,
      error: `Không thể xóa layout này vì có ${unitCount} căn hộ đang sử dụng`,
    };
  }

  // Check for existing packages
  const packageCount = await prisma.interiorPackage.count({
    where: { layoutId: id },
  });

  if (packageCount > 0) {
    return {
      success: false,
      error: `Không thể xóa layout này vì có ${packageCount} gói nội thất liên quan`,
    };
  }

  await prisma.interiorUnitLayout.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Clone a layout
 */
export async function cloneLayout(
  id: string,
  newCode: string,
  newName: string
): Promise<InteriorUnitLayoutWithRelations> {
  const original = await prisma.interiorUnitLayout.findUnique({
    where: { id },
  });

  if (!original) {
    throw new Error('Layout không tồn tại');
  }

  const cloned = await prisma.interiorUnitLayout.create({
    data: {
      name: newName,
      code: newCode,
      unitType: original.unitType,
      bedrooms: original.bedrooms,
      bathrooms: original.bathrooms,
      grossArea: original.grossArea,
      netArea: original.netArea,
      carpetArea: original.carpetArea,
      balconyArea: original.balconyArea,
      terraceArea: original.terraceArea,
      rooms: original.rooms,
      layoutImage: original.layoutImage,
      layout3DImage: original.layout3DImage,
      dimensionImage: original.dimensionImage,
      description: original.description,
      highlights: original.highlights,
      isActive: true,
    },
    include: {
      _count: {
        select: { packages: true },
      },
    },
  });

  return transformLayout(cloned, cloned._count.packages);
}

/**
 * Check if layout code exists
 */
export async function isLayoutCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.interiorUnitLayout.findFirst({
    where: {
      code,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
}
