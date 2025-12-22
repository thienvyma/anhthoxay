import { prisma } from '../../utils/prisma';
import type { InteriorDevelopment } from '@prisma/client';
import { generateSlug } from './developer.service';
import type { CreateDevelopmentInput, UpdateDevelopmentInput } from '../../schemas/interior.schema';
import type { InteriorDevelopmentWithRelations, PaginatedResult, ListOptions } from './types';

// Type for development with partial developer relation from Prisma query (select only needed fields)
type DeveloperSelect = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

type DevelopmentWithDeveloperSelect = InteriorDevelopment & {
  developer: DeveloperSelect | null;
  _count: { buildings: number };
};

/**
 * Ensure slug is unique for development
 */
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.interiorDevelopment.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Parse JSON images field
 */
function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    return JSON.parse(images);
  } catch {
    return [];
  }
}

/**
 * Transform development from DB to response type
 */
function transformDevelopment(
  dev: DevelopmentWithDeveloperSelect
): InteriorDevelopmentWithRelations {
  return {
    id: dev.id,
    developerId: dev.developerId,
    developer: dev.developer
      ? {
          id: dev.developer.id,
          name: dev.developer.name,
          slug: dev.developer.slug,
          logo: dev.developer.logo,
        }
      : undefined,
    name: dev.name,
    code: dev.code,
    slug: dev.slug,
    address: dev.address,
    district: dev.district,
    city: dev.city,
    description: dev.description,
    thumbnail: dev.thumbnail,
    images: parseImages(dev.images),
    totalBuildings: dev.totalBuildings,
    totalUnits: dev.totalUnits,
    startYear: dev.startYear,
    completionYear: dev.completionYear,
    order: dev.order,
    isActive: dev.isActive,
    buildingCount: dev._count.buildings,
    createdAt: dev.createdAt,
    updatedAt: dev.updatedAt,
  };
}

/**
 * List developments with optional filters
 */
export async function listDevelopments(
  options: ListOptions & { developerId?: string; isActive?: boolean } = {}
): Promise<PaginatedResult<InteriorDevelopmentWithRelations>> {
  const { page = 1, limit = 20, developerId, isActive } = options;
  const skip = (page - 1) * limit;

  const where: { developerId?: string; isActive?: boolean } = {};
  if (developerId) where.developerId = developerId;
  if (isActive !== undefined) where.isActive = isActive;

  const [items, total] = await Promise.all([
    prisma.interiorDevelopment.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
      include: {
        developer: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        _count: {
          select: { buildings: true },
        },
      },
    }),
    prisma.interiorDevelopment.count({ where }),
  ]);

  return {
    items: items.map((item) => transformDevelopment(item)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get development by ID
 */
export async function getDevelopmentById(
  id: string
): Promise<InteriorDevelopmentWithRelations | null> {
  const dev = await prisma.interiorDevelopment.findUnique({
    where: { id },
    include: {
      developer: {
        select: { id: true, name: true, slug: true, logo: true },
      },
      _count: {
        select: { buildings: true },
      },
    },
  });

  if (!dev) return null;

  return transformDevelopment(dev);
}

/**
 * Get development by slug
 */
export async function getDevelopmentBySlug(
  slug: string
): Promise<InteriorDevelopmentWithRelations | null> {
  const dev = await prisma.interiorDevelopment.findUnique({
    where: { slug },
    include: {
      developer: {
        select: { id: true, name: true, slug: true, logo: true },
      },
      _count: {
        select: { buildings: true },
      },
    },
  });

  if (!dev) return null;

  return transformDevelopment(dev);
}

/**
 * Create a new development
 */
export async function createDevelopment(
  data: CreateDevelopmentInput
): Promise<InteriorDevelopmentWithRelations> {
  const baseSlug = generateSlug(data.name);
  const slug = await ensureUniqueSlug(baseSlug);

  // Get max order for new development
  const maxOrder = await prisma.interiorDevelopment.aggregate({
    _max: { order: true },
    where: { developerId: data.developerId },
  });

  const dev = await prisma.interiorDevelopment.create({
    data: {
      developerId: data.developerId,
      name: data.name,
      code: data.code,
      slug,
      address: data.address ?? null,
      district: data.district ?? null,
      city: data.city ?? null,
      description: data.description ?? null,
      thumbnail: data.thumbnail ?? null,
      images: data.images ? JSON.stringify(data.images) : null,
      totalBuildings: data.totalBuildings ?? null,
      totalUnits: data.totalUnits ?? null,
      startYear: data.startYear ?? null,
      completionYear: data.completionYear ?? null,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      isActive: data.isActive ?? true,
    },
    include: {
      developer: {
        select: { id: true, name: true, slug: true, logo: true },
      },
      _count: {
        select: { buildings: true },
      },
    },
  });

  return transformDevelopment(dev);
}

/**
 * Update a development
 */
export async function updateDevelopment(
  id: string,
  data: UpdateDevelopmentInput
): Promise<InteriorDevelopmentWithRelations> {
  // If name is being updated, regenerate slug
  let slug: string | undefined;
  if (data.name) {
    const baseSlug = generateSlug(data.name);
    slug = await ensureUniqueSlug(baseSlug, id);
  }

  const dev = await prisma.interiorDevelopment.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(slug && { slug }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.district !== undefined && { district: data.district }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      ...(data.images !== undefined && { images: data.images ? JSON.stringify(data.images) : null }),
      ...(data.totalBuildings !== undefined && { totalBuildings: data.totalBuildings }),
      ...(data.totalUnits !== undefined && { totalUnits: data.totalUnits }),
      ...(data.startYear !== undefined && { startYear: data.startYear }),
      ...(data.completionYear !== undefined && { completionYear: data.completionYear }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      developer: {
        select: { id: true, name: true, slug: true, logo: true },
      },
      _count: {
        select: { buildings: true },
      },
    },
  });

  return transformDevelopment(dev);
}

/**
 * Delete a development (only if no buildings)
 */
export async function deleteDevelopment(id: string): Promise<{ success: boolean; error?: string }> {
  // Check for existing buildings
  const buildingCount = await prisma.interiorBuilding.count({
    where: { developmentId: id },
  });

  if (buildingCount > 0) {
    return {
      success: false,
      error: `Không thể xóa dự án này vì có ${buildingCount} tòa nhà liên quan`,
    };
  }

  await prisma.interiorDevelopment.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Check if development code exists
 */
export async function isDevelopmentCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.interiorDevelopment.findFirst({
    where: {
      code,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
}
