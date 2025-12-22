import { prisma } from '../../utils/prisma';
import type { InteriorSurcharge } from '@prisma/client';
import type { CreateSurchargeInput, UpdateSurchargeInput } from '../../schemas/interior.schema';
import type {
  InteriorSurchargeWithConditions,
  SurchargeConditions,
  SurchargeType,
  UnitType,
  UnitPosition,
  PaginatedResult,
  ListOptions,
} from './types';

/**
 * Parse conditions JSON
 */
function parseConditions(conditions: string | null): SurchargeConditions | null {
  if (!conditions) return null;
  try {
    return JSON.parse(conditions);
  } catch {
    return null;
  }
}

/**
 * Transform surcharge from DB to response type
 */
function transformSurcharge(surcharge: InteriorSurcharge): InteriorSurchargeWithConditions {
  return {
    id: surcharge.id,
    name: surcharge.name,
    code: surcharge.code,
    type: surcharge.type as SurchargeType,
    value: surcharge.value,
    conditions: parseConditions(surcharge.conditions),
    description: surcharge.description,
    isAutoApply: surcharge.isAutoApply,
    isOptional: surcharge.isOptional,
    order: surcharge.order,
    isActive: surcharge.isActive,
    createdAt: surcharge.createdAt,
    updatedAt: surcharge.updatedAt,
  };
}

/**
 * Evaluate if surcharge conditions match given context
 */
export function evaluateSurchargeConditions(
  conditions: SurchargeConditions | null,
  context: {
    floor?: number;
    area?: number;
    unitType?: UnitType;
    position?: UnitPosition;
    buildingId?: string;
    developmentId?: string;
  }
): boolean {
  if (!conditions) return true; // No conditions = always apply

  // All conditions must match (AND logic)
  if (conditions.minFloor !== null && conditions.minFloor !== undefined) {
    if (context.floor === undefined || context.floor < conditions.minFloor) {
      return false;
    }
  }

  if (conditions.maxFloor !== null && conditions.maxFloor !== undefined) {
    if (context.floor === undefined || context.floor > conditions.maxFloor) {
      return false;
    }
  }

  if (conditions.minArea !== null && conditions.minArea !== undefined) {
    if (context.area === undefined || context.area < conditions.minArea) {
      return false;
    }
  }

  if (conditions.maxArea !== null && conditions.maxArea !== undefined) {
    if (context.area === undefined || context.area > conditions.maxArea) {
      return false;
    }
  }

  if (conditions.unitTypes && conditions.unitTypes.length > 0) {
    if (!context.unitType || !conditions.unitTypes.includes(context.unitType)) {
      return false;
    }
  }

  if (conditions.positions && conditions.positions.length > 0) {
    if (!context.position || !conditions.positions.includes(context.position)) {
      return false;
    }
  }

  if (conditions.buildings && conditions.buildings.length > 0) {
    if (!context.buildingId || !conditions.buildings.includes(context.buildingId)) {
      return false;
    }
  }

  if (conditions.developments && conditions.developments.length > 0) {
    if (!context.developmentId || !conditions.developments.includes(context.developmentId)) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate surcharge amount based on type
 */
export function calculateSurchargeAmount(
  surcharge: InteriorSurchargeWithConditions,
  context: {
    floor?: number;
    area?: number;
    baseAmount?: number;
  }
): number {
  switch (surcharge.type) {
    case 'FIXED':
      return surcharge.value;

    case 'PERCENTAGE':
      return context.baseAmount ? (context.baseAmount * surcharge.value) / 100 : 0;

    case 'PER_FLOOR':
      return context.floor ? surcharge.value * context.floor : 0;

    case 'PER_SQM':
      return context.area ? surcharge.value * context.area : 0;

    case 'CONDITIONAL':
      // For conditional, value is the fixed amount when conditions match
      return surcharge.value;

    default:
      return 0;
  }
}

/**
 * List surcharges
 */
export async function listSurcharges(
  options: ListOptions & { isActive?: boolean; isAutoApply?: boolean } = {}
): Promise<PaginatedResult<InteriorSurchargeWithConditions>> {
  const { page = 1, limit = 50, isActive, isAutoApply } = options;
  const skip = (page - 1) * limit;

  const where: { isActive?: boolean; isAutoApply?: boolean } = {};
  if (isActive !== undefined) where.isActive = isActive;
  if (isAutoApply !== undefined) where.isAutoApply = isAutoApply;

  const [items, total] = await Promise.all([
    prisma.interiorSurcharge.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.interiorSurcharge.count({ where }),
  ]);

  return {
    items: items.map(transformSurcharge),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get surcharge by ID
 */
export async function getSurchargeById(id: string): Promise<InteriorSurchargeWithConditions | null> {
  const surcharge = await prisma.interiorSurcharge.findUnique({
    where: { id },
  });

  if (!surcharge) return null;

  return transformSurcharge(surcharge);
}

/**
 * Create a new surcharge
 */
export async function createSurcharge(
  data: CreateSurchargeInput
): Promise<InteriorSurchargeWithConditions> {
  // Get max order
  const maxOrder = await prisma.interiorSurcharge.aggregate({
    _max: { order: true },
  });

  const surcharge = await prisma.interiorSurcharge.create({
    data: {
      name: data.name,
      code: data.code,
      type: data.type,
      value: data.value,
      conditions: data.conditions ? JSON.stringify(data.conditions) : null,
      description: data.description ?? null,
      isAutoApply: data.isAutoApply ?? true,
      isOptional: data.isOptional ?? false,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      isActive: data.isActive ?? true,
    },
  });

  return transformSurcharge(surcharge);
}

/**
 * Update a surcharge
 */
export async function updateSurcharge(
  id: string,
  data: UpdateSurchargeInput
): Promise<InteriorSurchargeWithConditions> {
  const surcharge = await prisma.interiorSurcharge.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.conditions !== undefined && {
        conditions: data.conditions ? JSON.stringify(data.conditions) : null,
      }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isAutoApply !== undefined && { isAutoApply: data.isAutoApply }),
      ...(data.isOptional !== undefined && { isOptional: data.isOptional }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return transformSurcharge(surcharge);
}

/**
 * Delete a surcharge
 */
export async function deleteSurcharge(id: string): Promise<{ success: boolean }> {
  await prisma.interiorSurcharge.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Get applicable surcharges for a given context
 */
export async function getApplicableSurcharges(context: {
  floor?: number;
  area?: number;
  unitType?: UnitType;
  position?: UnitPosition;
  buildingId?: string;
  developmentId?: string;
}): Promise<InteriorSurchargeWithConditions[]> {
  const surcharges = await prisma.interiorSurcharge.findMany({
    where: {
      isActive: true,
      isAutoApply: true,
    },
    orderBy: { order: 'asc' },
  });

  return surcharges
    .map(transformSurcharge)
    .filter((s) => evaluateSurchargeConditions(s.conditions, context));
}

/**
 * Test surcharge conditions
 */
export async function testSurchargeConditions(
  surchargeId: string,
  testData: {
    floor?: number;
    area?: number;
    unitType?: UnitType;
    position?: UnitPosition;
    buildingId?: string;
    developmentId?: string;
  }
): Promise<{
  matches: boolean;
  amount: number;
  surcharge: InteriorSurchargeWithConditions;
}> {
  const surcharge = await getSurchargeById(surchargeId);

  if (!surcharge) {
    throw new Error('Phụ phí không tồn tại');
  }

  const matches = evaluateSurchargeConditions(surcharge.conditions, testData);
  const amount = matches
    ? calculateSurchargeAmount(surcharge, {
        floor: testData.floor,
        area: testData.area,
        baseAmount: 100000000, // Default base for percentage calculation
      })
    : 0;

  return { matches, amount, surcharge };
}


/**
 * Check if surcharge code exists
 */
export async function isSurchargeCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.interiorSurcharge.findFirst({
    where: {
      code,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
}
