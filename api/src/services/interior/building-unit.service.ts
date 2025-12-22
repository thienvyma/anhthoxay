import { prisma } from '../../utils/prisma';
import type { CreateBuildingUnitInput, UpdateBuildingUnitInput } from '../../schemas/interior.schema';
import type {
  InteriorBuildingUnitWithRelations,
  UnitType,
  UnitPosition,
  UnitDirection,
  UnitView,
  PaginatedResult,
  ListOptions,
} from './types';

/**
 * Transform building unit from DB to response type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma query result with dynamic includes
function transformBuildingUnit(unit: any): InteriorBuildingUnitWithRelations {
  return {
    id: unit.id,
    buildingId: unit.buildingId,
    building: unit.building
      ? {
          id: unit.building.id,
          name: unit.building.name,
          code: unit.building.code,
          unitCodeFormat: unit.building.unitCodeFormat,
          development: unit.building.development
            ? {
                id: unit.building.development.id,
                name: unit.building.development.name,
                code: unit.building.development.code,
              }
            : undefined,
        }
      : undefined,
    axis: unit.axis,
    unitType: unit.unitType as UnitType,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    position: unit.position as UnitPosition,
    direction: unit.direction as UnitDirection | null,
    view: unit.view as UnitView | null,
    floorStart: unit.floorStart,
    floorEnd: unit.floorEnd,
    layoutId: unit.layoutId,
    layout: unit.layout
      ? {
          id: unit.layout.id,
          name: unit.layout.name,
          code: unit.layout.code,
          unitType: unit.layout.unitType as UnitType,
          bedrooms: unit.layout.bedrooms,
          bathrooms: unit.layout.bathrooms,
          grossArea: unit.layout.grossArea,
          netArea: unit.layout.netArea,
        }
      : undefined,
    notes: unit.notes,
    isActive: unit.isActive,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };
}

/**
 * List building units
 */
export async function listBuildingUnits(
  options: ListOptions & { buildingId?: string; unitType?: UnitType; isActive?: boolean } = {}
): Promise<PaginatedResult<InteriorBuildingUnitWithRelations>> {
  const { page = 1, limit = 50, buildingId, unitType, isActive } = options;
  const skip = (page - 1) * limit;

  const where: { buildingId?: string; unitType?: string; isActive?: boolean } = {};
  if (buildingId) where.buildingId = buildingId;
  if (unitType) where.unitType = unitType;
  if (isActive !== undefined) where.isActive = isActive;

  const [items, total] = await Promise.all([
    prisma.interiorBuildingUnit.findMany({
      where,
      orderBy: [{ axis: 'asc' }, { floorStart: 'asc' }],
      skip,
      take: limit,
      include: {
        building: {
          select: {
            id: true,
            name: true,
            code: true,
            unitCodeFormat: true,
            development: {
              select: { id: true, name: true, code: true },
            },
          },
        },
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
    prisma.interiorBuildingUnit.count({ where }),
  ]);

  return {
    items: items.map(transformBuildingUnit),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get building unit by ID
 */
export async function getBuildingUnitById(
  id: string
): Promise<InteriorBuildingUnitWithRelations | null> {
  const unit = await prisma.interiorBuildingUnit.findUnique({
    where: { id },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          code: true,
          unitCodeFormat: true,
          development: {
            select: { id: true, name: true, code: true },
          },
        },
      },
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

  if (!unit) return null;

  return transformBuildingUnit(unit);
}

/**
 * Get building unit by building ID and axis
 */
export async function getBuildingUnitByAxis(
  buildingId: string,
  axis: string
): Promise<InteriorBuildingUnitWithRelations | null> {
  const unit = await prisma.interiorBuildingUnit.findUnique({
    where: {
      buildingId_axis: { buildingId, axis },
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          code: true,
          unitCodeFormat: true,
          development: {
            select: { id: true, name: true, code: true },
          },
        },
      },
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

  if (!unit) return null;

  return transformBuildingUnit(unit);
}

/**
 * Validate layout-unit type matching
 */
async function validateLayoutUnitTypeMatch(
  layoutId: string,
  unitType: string
): Promise<{ valid: boolean; error?: string }> {
  const layout = await prisma.interiorUnitLayout.findUnique({
    where: { id: layoutId },
    select: { unitType: true },
  });

  if (!layout) {
    return { valid: false, error: 'Layout không tồn tại' };
  }

  if (layout.unitType !== unitType) {
    return {
      valid: false,
      error: `Loại căn hộ không khớp với layout. Layout: ${layout.unitType}, Unit: ${unitType}`,
    };
  }

  return { valid: true };
}

/**
 * Create a new building unit
 */
export async function createBuildingUnit(
  data: CreateBuildingUnitInput
): Promise<InteriorBuildingUnitWithRelations> {
  // Validate layout-unit type match
  const typeValidation = await validateLayoutUnitTypeMatch(data.layoutId, data.unitType);
  if (!typeValidation.valid) {
    throw new Error(typeValidation.error);
  }

  const unit = await prisma.interiorBuildingUnit.create({
    data: {
      buildingId: data.buildingId,
      axis: data.axis,
      unitType: data.unitType,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms ?? 1,
      position: data.position ?? 'MIDDLE',
      direction: data.direction ?? null,
      view: data.view ?? null,
      floorStart: data.floorStart ?? 1,
      floorEnd: data.floorEnd ?? null,
      layoutId: data.layoutId,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true,
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          code: true,
          unitCodeFormat: true,
          development: {
            select: { id: true, name: true, code: true },
          },
        },
      },
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

  return transformBuildingUnit(unit);
}

/**
 * Update a building unit
 */
export async function updateBuildingUnit(
  id: string,
  data: UpdateBuildingUnitInput
): Promise<InteriorBuildingUnitWithRelations> {
  // If both layoutId and unitType are being updated, validate match
  if (data.layoutId && data.unitType) {
    const typeValidation = await validateLayoutUnitTypeMatch(data.layoutId, data.unitType);
    if (!typeValidation.valid) {
      throw new Error(typeValidation.error);
    }
  } else if (data.layoutId) {
    // If only layoutId is being updated, get current unitType
    const current = await prisma.interiorBuildingUnit.findUnique({
      where: { id },
      select: { unitType: true },
    });
    if (current) {
      const typeValidation = await validateLayoutUnitTypeMatch(data.layoutId, current.unitType);
      if (!typeValidation.valid) {
        throw new Error(typeValidation.error);
      }
    }
  } else if (data.unitType) {
    // If only unitType is being updated, get current layoutId
    const current = await prisma.interiorBuildingUnit.findUnique({
      where: { id },
      select: { layoutId: true },
    });
    if (current) {
      const typeValidation = await validateLayoutUnitTypeMatch(current.layoutId, data.unitType);
      if (!typeValidation.valid) {
        throw new Error(typeValidation.error);
      }
    }
  }

  const unit = await prisma.interiorBuildingUnit.update({
    where: { id },
    data: {
      ...(data.axis !== undefined && { axis: data.axis }),
      ...(data.unitType !== undefined && { unitType: data.unitType }),
      ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
      ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.direction !== undefined && { direction: data.direction }),
      ...(data.view !== undefined && { view: data.view }),
      ...(data.floorStart !== undefined && { floorStart: data.floorStart }),
      ...(data.floorEnd !== undefined && { floorEnd: data.floorEnd }),
      ...(data.layoutId !== undefined && { layoutId: data.layoutId }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          code: true,
          unitCodeFormat: true,
          development: {
            select: { id: true, name: true, code: true },
          },
        },
      },
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

  return transformBuildingUnit(unit);
}

/**
 * Delete a building unit
 */
export async function deleteBuildingUnit(id: string): Promise<{ success: boolean }> {
  await prisma.interiorBuildingUnit.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Get matrix view of building units (axes x floors)
 */
export async function getBuildingUnitsMatrix(buildingId: string): Promise<{
  building: InteriorBuildingUnitWithRelations['building'];
  axes: string[];
  floors: number[];
  units: Map<string, InteriorBuildingUnitWithRelations>;
}> {
  const building = await prisma.interiorBuilding.findUnique({
    where: { id: buildingId },
    select: {
      id: true,
      name: true,
      code: true,
      unitCodeFormat: true,
      totalFloors: true,
      startFloor: true,
      endFloor: true,
      axisLabels: true,
      development: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  if (!building) {
    throw new Error('Tòa nhà không tồn tại');
  }

  const units = await prisma.interiorBuildingUnit.findMany({
    where: { buildingId },
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

  const axes = JSON.parse(building.axisLabels) as string[];
  const endFloor = building.endFloor ?? building.totalFloors;
  const floors: number[] = [];
  for (let f = building.startFloor; f <= endFloor; f++) {
    floors.push(f);
  }

  const unitMap = new Map<string, InteriorBuildingUnitWithRelations>();
  for (const unit of units) {
    unitMap.set(unit.axis, transformBuildingUnit({
      ...unit,
      building: {
        id: building.id,
        name: building.name,
        code: building.code,
        unitCodeFormat: building.unitCodeFormat,
        development: building.development,
      },
    }));
  }

  return {
    building: {
      id: building.id,
      name: building.name,
      code: building.code,
      unitCodeFormat: building.unitCodeFormat,
      development: building.development
        ? {
            id: building.development.id,
            name: building.development.name,
            code: building.development.code,
          }
        : undefined,
    },
    axes,
    floors,
    units: unitMap,
  };
}

/**
 * Resolve unit from unit code
 */
export async function resolveUnitFromCode(
  buildingId: string,
  floor: number,
  axis: string
): Promise<InteriorBuildingUnitWithRelations | null> {
  // Find unit by axis that covers the given floor
  const unit = await prisma.interiorBuildingUnit.findFirst({
    where: {
      buildingId,
      axis,
      floorStart: { lte: floor },
      OR: [
        { floorEnd: null },
        { floorEnd: { gte: floor } },
      ],
      isActive: true,
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          code: true,
          unitCodeFormat: true,
          development: {
            select: { id: true, name: true, code: true },
          },
        },
      },
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

  if (!unit) return null;

  return transformBuildingUnit(unit);
}
