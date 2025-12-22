import { prisma } from '../../utils/prisma';
import type { InteriorRoomType } from '@prisma/client';
import type { CreateRoomTypeInput, UpdateRoomTypeInput } from '../../schemas/interior.schema';
import type { PaginatedResult, ListOptions } from './types';

export interface InteriorRoomTypeData {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  icon: string | null;
  description: string | null;
  defaultCategories: string[];
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Parse default categories JSON
 */
function parseDefaultCategories(categories: string | null): string[] {
  if (!categories) return [];
  try {
    return JSON.parse(categories);
  } catch {
    return [];
  }
}

/**
 * Transform room type from DB
 */
function transformRoomType(roomType: InteriorRoomType): InteriorRoomTypeData {
  return {
    id: roomType.id,
    code: roomType.code,
    name: roomType.name,
    nameEn: roomType.nameEn,
    icon: roomType.icon,
    description: roomType.description,
    defaultCategories: parseDefaultCategories(roomType.defaultCategories),
    order: roomType.order,
    isActive: roomType.isActive,
    createdAt: roomType.createdAt,
    updatedAt: roomType.updatedAt,
  };
}

/**
 * List room types
 */
export async function listRoomTypes(
  options: ListOptions & { isActive?: boolean } = {}
): Promise<PaginatedResult<InteriorRoomTypeData>> {
  const { page = 1, limit = 50, isActive } = options;
  const skip = (page - 1) * limit;

  const where: { isActive?: boolean } = {};
  if (isActive !== undefined) where.isActive = isActive;

  const [items, total] = await Promise.all([
    prisma.interiorRoomType.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.interiorRoomType.count({ where }),
  ]);

  return {
    items: items.map(transformRoomType),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get room type by ID
 */
export async function getRoomTypeById(id: string): Promise<InteriorRoomTypeData | null> {
  const roomType = await prisma.interiorRoomType.findUnique({
    where: { id },
  });

  if (!roomType) return null;

  return transformRoomType(roomType);
}

/**
 * Get room type by code
 */
export async function getRoomTypeByCode(code: string): Promise<InteriorRoomTypeData | null> {
  const roomType = await prisma.interiorRoomType.findUnique({
    where: { code },
  });

  if (!roomType) return null;

  return transformRoomType(roomType);
}

/**
 * Create a new room type
 */
export async function createRoomType(data: CreateRoomTypeInput): Promise<InteriorRoomTypeData> {
  // Get max order
  const maxOrder = await prisma.interiorRoomType.aggregate({
    _max: { order: true },
  });

  const roomType = await prisma.interiorRoomType.create({
    data: {
      code: data.code,
      name: data.name,
      nameEn: data.nameEn ?? null,
      icon: data.icon ?? null,
      description: data.description ?? null,
      defaultCategories: data.defaultCategories ? JSON.stringify(data.defaultCategories) : null,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      isActive: data.isActive ?? true,
    },
  });

  return transformRoomType(roomType);
}

/**
 * Update a room type
 */
export async function updateRoomType(
  id: string,
  data: UpdateRoomTypeInput
): Promise<InteriorRoomTypeData> {
  const roomType = await prisma.interiorRoomType.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: data.code }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.defaultCategories !== undefined && {
        defaultCategories: data.defaultCategories ? JSON.stringify(data.defaultCategories) : null,
      }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return transformRoomType(roomType);
}

/**
 * Delete a room type
 */
export async function deleteRoomType(id: string): Promise<{ success: boolean; error?: string }> {
  // Note: Room types are stored as enum values in layouts, not as IDs
  // So we can safely delete without checking references
  await prisma.interiorRoomType.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Reorder room types
 */
export async function reorderRoomTypes(
  items: Array<{ id: string; order: number }>
): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.interiorRoomType.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );
}

/**
 * Check if room type code exists
 */
export async function isRoomTypeCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.interiorRoomType.findFirst({
    where: {
      code,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
}
