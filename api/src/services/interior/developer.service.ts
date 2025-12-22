import { prisma } from '../../utils/prisma';
import type { CreateDeveloperInput, UpdateDeveloperInput } from '../../schemas/interior.schema';
import type { InteriorDeveloperWithCount, PaginatedResult, ListOptions } from './types';

/**
 * Generate URL-safe slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens
    .replace(/^-|-$/g, ''); // Trim hyphens
}

/**
 * Ensure slug is unique by appending number if needed
 */
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.interiorDeveloper.findFirst({
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
 * List all developers with development count
 */
export async function listDevelopers(
  options: ListOptions & { isActive?: boolean } = {}
): Promise<PaginatedResult<InteriorDeveloperWithCount>> {
  const { page = 1, limit = 20, isActive } = options;
  const skip = (page - 1) * limit;

  const where = isActive !== undefined ? { isActive } : {};

  const [items, total] = await Promise.all([
    prisma.interiorDeveloper.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
      include: {
        _count: {
          select: { developments: true },
        },
      },
    }),
    prisma.interiorDeveloper.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      developmentCount: item._count.developments,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get developer by ID
 */
export async function getDeveloperById(id: string): Promise<InteriorDeveloperWithCount | null> {
  const developer = await prisma.interiorDeveloper.findUnique({
    where: { id },
    include: {
      _count: {
        select: { developments: true },
      },
    },
  });

  if (!developer) return null;

  return {
    ...developer,
    developmentCount: developer._count.developments,
  };
}

/**
 * Get developer by slug
 */
export async function getDeveloperBySlug(slug: string): Promise<InteriorDeveloperWithCount | null> {
  const developer = await prisma.interiorDeveloper.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { developments: true },
      },
    },
  });

  if (!developer) return null;

  return {
    ...developer,
    developmentCount: developer._count.developments,
  };
}

/**
 * Create a new developer
 */
export async function createDeveloper(
  data: CreateDeveloperInput
): Promise<InteriorDeveloperWithCount> {
  const baseSlug = generateSlug(data.name);
  const slug = await ensureUniqueSlug(baseSlug);

  // Get max order for new developer
  const maxOrder = await prisma.interiorDeveloper.aggregate({
    _max: { order: true },
  });

  const developer = await prisma.interiorDeveloper.create({
    data: {
      name: data.name,
      slug,
      logo: data.logo ?? null,
      description: data.description ?? null,
      website: data.website ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      isActive: data.isActive ?? true,
    },
    include: {
      _count: {
        select: { developments: true },
      },
    },
  });

  return {
    ...developer,
    developmentCount: developer._count.developments,
  };
}

/**
 * Update a developer
 */
export async function updateDeveloper(
  id: string,
  data: UpdateDeveloperInput
): Promise<InteriorDeveloperWithCount> {
  // If name is being updated, regenerate slug
  let slug: string | undefined;
  if (data.name) {
    const baseSlug = generateSlug(data.name);
    slug = await ensureUniqueSlug(baseSlug, id);
  }

  const developer = await prisma.interiorDeveloper.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(slug && { slug }),
      ...(data.logo !== undefined && { logo: data.logo }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      _count: {
        select: { developments: true },
      },
    },
  });

  return {
    ...developer,
    developmentCount: developer._count.developments,
  };
}

/**
 * Delete a developer (only if no developments)
 */
export async function deleteDeveloper(id: string): Promise<{ success: boolean; error?: string }> {
  // Check for existing developments
  const developmentCount = await prisma.interiorDevelopment.count({
    where: { developerId: id },
  });

  if (developmentCount > 0) {
    return {
      success: false,
      error: `Không thể xóa chủ đầu tư này vì có ${developmentCount} dự án liên quan`,
    };
  }

  await prisma.interiorDeveloper.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Reorder developers
 */
export async function reorderDevelopers(
  items: Array<{ id: string; order: number }>
): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.interiorDeveloper.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );
}

/**
 * Check if developer name exists
 */
export async function isDeveloperNameExists(
  name: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.interiorDeveloper.findFirst({
    where: {
      name,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
}
