import { prisma } from '../../utils/prisma';
import type { CreateBuildingInput, UpdateBuildingInput } from '../../schemas/interior.schema';
import type { InteriorBuildingWithRelations, SpecialFloor, PaginatedResult, ListOptions } from './types';

/**
 * Parse JSON fields
 */
function parseAxisLabels(axisLabels: string): string[] {
  try {
    return JSON.parse(axisLabels);
  } catch {
    return [];
  }
}

function parseSpecialFloors(specialFloors: string | null): SpecialFloor[] {
  if (!specialFloors) return [];
  try {
    return JSON.parse(specialFloors);
  } catch {
    return [];
  }
}

/**
 * Transform building from DB to response type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma query result with dynamic includes
function transformBuilding(building: any, unitCount: number): InteriorBuildingWithRelations {
  return {
    id: building.id,
    developmentId: building.developmentId,
    development: building.development
      ? {
          id: building.development.id,
          name: building.development.name,
          code: building.development.code,
          developer: building.development.developer
            ? {
                id: building.development.developer.id,
                name: building.development.developer.name,
              }
            : undefined,
        }
      : undefined,
    name: building.name,
    code: building.code,
    totalFloors: building.totalFloors,
    startFloor: building.startFloor,
    endFloor: building.endFloor,
    axisLabels: parseAxisLabels(building.axisLabels),
    unitsPerFloor: building.unitsPerFloor,
    unitCodeFormat: building.unitCodeFormat,
    specialFloors: parseSpecialFloors(building.specialFloors),
    thumbnail: building.thumbnail,
    floorPlanImage: building.floorPlanImage,
    order: building.order,
    isActive: building.isActive,
    unitCount,
    createdAt: building.createdAt,
    updatedAt: building.updatedAt,
  };
}

/**
 * Generate unit code from format
 */
export function generateUnitCode(
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
 * Parse unit code to extract components
 */
export function parseUnitCode(
  code: string,
  format: string
): { buildingCode: string; floor: number; axis: string } | null {
  // Convert format to regex pattern
  // {building}.{floor}.{axis} -> ^(.+)\.(\d+)\.(.+)$
  const pattern = format
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace('\\{building\\}', '(.+)')
    .replace('\\{floor\\}', '(\\d+)')
    .replace('\\{axis\\}', '(.+)');

  const regex = new RegExp(`^${pattern}$`);
  const match = code.match(regex);

  if (!match) return null;

  return {
    buildingCode: match[1],
    floor: parseInt(match[2], 10),
    axis: match[3],
  };
}

/**
 * Validate floor range
 */
export function validateFloorRange(
  startFloor: number,
  endFloor: number | null | undefined,
  totalFloors: number
): { valid: boolean; error?: string } {
  const effectiveEndFloor = endFloor ?? totalFloors;

  if (startFloor > effectiveEndFloor) {
    return {
      valid: false,
      error: 'Tầng bắt đầu phải nhỏ hơn hoặc bằng tầng kết thúc',
    };
  }

  if (effectiveEndFloor > totalFloors) {
    return {
      valid: false,
      error: `Tầng kết thúc không được vượt quá tổng số tầng (${totalFloors})`,
    };
  }

  return { valid: true };
}

/**
 * Validate axis labels uniqueness
 */
export function validateAxisLabels(labels: string[]): { valid: boolean; error?: string } {
  const uniqueLabels = new Set(labels);
  if (uniqueLabels.size !== labels.length) {
    const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
    return {
      valid: false,
      error: `Các trục bị trùng: ${[...new Set(duplicates)].join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * List buildings with optional filters
 */
export async function listBuildings(
  options: ListOptions & { developmentId?: string; isActive?: boolean } = {}
): Promise<PaginatedResult<InteriorBuildingWithRelations>> {
  const { page = 1, limit = 20, developmentId, isActive } = options;
  const skip = (page - 1) * limit;

  const where: { developmentId?: string; isActive?: boolean } = {};
  if (developmentId) where.developmentId = developmentId;
  if (isActive !== undefined) where.isActive = isActive;

  const [items, total] = await Promise.all([
    prisma.interiorBuilding.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
      include: {
        development: {
          select: {
            id: true,
            name: true,
            code: true,
            developer: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { units: true },
        },
      },
    }),
    prisma.interiorBuilding.count({ where }),
  ]);

  return {
    items: items.map((item) => transformBuilding(item, item._count.units)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get building by ID
 */
export async function getBuildingById(id: string): Promise<InteriorBuildingWithRelations | null> {
  const building = await prisma.interiorBuilding.findUnique({
    where: { id },
    include: {
      development: {
        select: {
          id: true,
          name: true,
          code: true,
          developer: {
            select: { id: true, name: true },
          },
        },
      },
      _count: {
        select: { units: true },
      },
    },
  });

  if (!building) return null;

  return transformBuilding(building, building._count.units);
}

/**
 * Create a new building
 */
export async function createBuilding(
  data: CreateBuildingInput
): Promise<InteriorBuildingWithRelations> {
  // Validate axis labels
  const axisValidation = validateAxisLabels(data.axisLabels);
  if (!axisValidation.valid) {
    throw new Error(axisValidation.error);
  }

  // Validate floor range
  const floorValidation = validateFloorRange(
    data.startFloor ?? 1,
    data.endFloor,
    data.totalFloors
  );
  if (!floorValidation.valid) {
    throw new Error(floorValidation.error);
  }

  // Get max order
  const maxOrder = await prisma.interiorBuilding.aggregate({
    _max: { order: true },
    where: { developmentId: data.developmentId },
  });

  const building = await prisma.interiorBuilding.create({
    data: {
      developmentId: data.developmentId,
      name: data.name,
      code: data.code,
      totalFloors: data.totalFloors,
      startFloor: data.startFloor ?? 1,
      endFloor: data.endFloor ?? null,
      axisLabels: JSON.stringify(data.axisLabels),
      unitsPerFloor: data.unitsPerFloor,
      unitCodeFormat: data.unitCodeFormat ?? '{building}.{floor}.{axis}',
      specialFloors: data.specialFloors ? JSON.stringify(data.specialFloors) : null,
      thumbnail: data.thumbnail ?? null,
      floorPlanImage: data.floorPlanImage ?? null,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      isActive: data.isActive ?? true,
    },
    include: {
      development: {
        select: {
          id: true,
          name: true,
          code: true,
          developer: {
            select: { id: true, name: true },
          },
        },
      },
      _count: {
        select: { units: true },
      },
    },
  });

  return transformBuilding(building, building._count.units);
}

/**
 * Update a building
 */
export async function updateBuilding(
  id: string,
  data: UpdateBuildingInput
): Promise<InteriorBuildingWithRelations> {
  // Get current building for validation
  const current = await prisma.interiorBuilding.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error('Tòa nhà không tồn tại');
  }

  // Validate axis labels if provided
  if (data.axisLabels) {
    const axisValidation = validateAxisLabels(data.axisLabels);
    if (!axisValidation.valid) {
      throw new Error(axisValidation.error);
    }
  }

  // Validate floor range if any floor-related field is provided
  if (data.startFloor !== undefined || data.endFloor !== undefined || data.totalFloors !== undefined) {
    const startFloor = data.startFloor ?? current.startFloor;
    const endFloor = data.endFloor !== undefined ? data.endFloor : current.endFloor;
    const totalFloors = data.totalFloors ?? current.totalFloors;

    const floorValidation = validateFloorRange(startFloor, endFloor, totalFloors);
    if (!floorValidation.valid) {
      throw new Error(floorValidation.error);
    }
  }

  const building = await prisma.interiorBuilding.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.totalFloors !== undefined && { totalFloors: data.totalFloors }),
      ...(data.startFloor !== undefined && { startFloor: data.startFloor }),
      ...(data.endFloor !== undefined && { endFloor: data.endFloor }),
      ...(data.axisLabels !== undefined && { axisLabels: JSON.stringify(data.axisLabels) }),
      ...(data.unitsPerFloor !== undefined && { unitsPerFloor: data.unitsPerFloor }),
      ...(data.unitCodeFormat !== undefined && { unitCodeFormat: data.unitCodeFormat }),
      ...(data.specialFloors !== undefined && {
        specialFloors: data.specialFloors ? JSON.stringify(data.specialFloors) : null,
      }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      ...(data.floorPlanImage !== undefined && { floorPlanImage: data.floorPlanImage }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      development: {
        select: {
          id: true,
          name: true,
          code: true,
          developer: {
            select: { id: true, name: true },
          },
        },
      },
      _count: {
        select: { units: true },
      },
    },
  });

  return transformBuilding(building, building._count.units);
}

/**
 * Delete a building (only if no units)
 */
export async function deleteBuilding(id: string): Promise<{ success: boolean; error?: string }> {
  // Check for existing units
  const unitCount = await prisma.interiorBuildingUnit.count({
    where: { buildingId: id },
  });

  if (unitCount > 0) {
    return {
      success: false,
      error: `Không thể xóa tòa nhà này vì có ${unitCount} căn hộ liên quan`,
    };
  }

  await prisma.interiorBuilding.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Check if building code exists within development
 */
export async function isBuildingCodeExists(
  developmentId: string,
  code: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.interiorBuilding.findFirst({
    where: {
      developmentId,
      code,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
}
