import { prisma } from '../../utils/prisma';
import type { InteriorFurnitureCategory, InteriorFurnitureItem } from '@prisma/client';
import type {
  CreateFurnitureCategoryInput,
  UpdateFurnitureCategoryInput,
  CreateFurnitureItemInput,
  UpdateFurnitureItemInput,
} from '../../schemas/interior.schema';
import type { PaginatedResult, ListOptions } from './types';

// ============================================
// FURNITURE CATEGORY TYPES
// ============================================

export interface FurnitureDimensions {
  width?: number;
  height?: number;
  depth?: number;
  unit?: 'cm' | 'mm' | 'm';
}

export interface InteriorFurnitureCategoryData {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
  parent?: InteriorFurnitureCategoryData | null;
  children?: InteriorFurnitureCategoryData[];
  roomTypes: string[];
  order: number;
  isActive: boolean;
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InteriorFurnitureItemData {
  id: string;
  categoryId: string;
  category?: InteriorFurnitureCategoryData;
  name: string;
  sku: string | null;
  brand: string | null;
  origin: string | null;
  material: string | null;
  color: string | null;
  dimensions: FurnitureDimensions | null;
  weight: number | null;
  price: number;
  costPrice: number | null;
  thumbnail: string | null;
  images: string[];
  description: string | null;
  features: string[];
  warrantyMonths: number | null;
  inStock: boolean;
  stockQty: number | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Type for category with relations from Prisma query
type CategoryWithRelations = InteriorFurnitureCategory & {
  parent?: InteriorFurnitureCategory | null;
  children?: InteriorFurnitureCategory[];
  _count?: { items: number };
};

// Type for item with category relation from Prisma query
type ItemWithCategory = InteriorFurnitureItem & {
  category?: InteriorFurnitureCategory | null;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Parse JSON array safely
 */
function parseJsonArray(json: string | null): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/**
 * Parse dimensions JSON
 */
function parseDimensions(json: string | null): FurnitureDimensions | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}


/**
 * Transform category from DB
 */
function transformCategory(category: CategoryWithRelations, includeChildren = false): InteriorFurnitureCategoryData {
  const result: InteriorFurnitureCategoryData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    description: category.description,
    parentId: category.parentId,
    roomTypes: parseJsonArray(category.roomTypes),
    order: category.order,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };

  if (category.parent) {
    result.parent = transformCategory(category.parent as CategoryWithRelations);
  }

  if (includeChildren && category.children) {
    result.children = category.children.map((c) => transformCategory(c as CategoryWithRelations, true));
  }

  if (category._count?.items !== undefined) {
    result.itemCount = category._count.items;
  }

  return result;
}

/**
 * Transform item from DB
 */
function transformItem(item: ItemWithCategory): InteriorFurnitureItemData {
  return {
    id: item.id,
    categoryId: item.categoryId,
    category: item.category ? transformCategory(item.category as CategoryWithRelations) : undefined,
    name: item.name,
    sku: item.sku,
    brand: item.brand,
    origin: item.origin,
    material: item.material,
    color: item.color,
    dimensions: parseDimensions(item.dimensions),
    weight: item.weight,
    price: item.price,
    costPrice: item.costPrice,
    thumbnail: item.thumbnail,
    images: parseJsonArray(item.images),
    description: item.description,
    features: parseJsonArray(item.features),
    warrantyMonths: item.warrantyMonths,
    inStock: item.inStock,
    stockQty: item.stockQty,
    order: item.order,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// ============================================
// CATEGORY CRUD OPERATIONS
// ============================================

/**
 * List categories with optional hierarchy
 */
export async function listCategories(
  options: ListOptions & { isActive?: boolean; parentId?: string | null; includeChildren?: boolean } = {}
): Promise<PaginatedResult<InteriorFurnitureCategoryData>> {
  const { page = 1, limit = 50, isActive, parentId, includeChildren = false } = options;
  const skip = (page - 1) * limit;

  const where: { isActive?: boolean; parentId?: string | null } = {};
  if (isActive !== undefined) where.isActive = isActive;
  if (parentId !== undefined) where.parentId = parentId;

  const [items, total] = await Promise.all([
    prisma.interiorFurnitureCategory.findMany({
      where,
      include: {
        parent: true,
        children: includeChildren,
        _count: { select: { items: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.interiorFurnitureCategory.count({ where }),
  ]);

  return {
    items: items.map((c) => transformCategory(c as CategoryWithRelations, includeChildren)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get category tree (hierarchical structure)
 */
export async function getCategoryTree(
  options: { isActive?: boolean } = {}
): Promise<InteriorFurnitureCategoryData[]> {
  const { isActive } = options;

  const where: { parentId: null; isActive?: boolean } = { parentId: null };
  if (isActive !== undefined) where.isActive = isActive;

  const rootCategories = await prisma.interiorFurnitureCategory.findMany({
    where,
    include: {
      children: {
        include: {
          children: true,
          _count: { select: { items: true } },
        },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      },
      _count: { select: { items: true } },
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  return rootCategories.map((c) => transformCategory(c, true));
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<InteriorFurnitureCategoryData | null> {
  const category = await prisma.interiorFurnitureCategory.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      },
      _count: { select: { items: true } },
    },
  });

  if (!category) return null;

  return transformCategory(category, true);
}

/**
 * Create a new category
 */
export async function createCategory(
  data: CreateFurnitureCategoryInput
): Promise<InteriorFurnitureCategoryData> {
  // Validate parent exists if provided
  if (data.parentId) {
    const parent = await prisma.interiorFurnitureCategory.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) {
      throw new Error('Danh mục cha không tồn tại');
    }
    // Check for circular reference (parent cannot be a child of this category)
    // This is only relevant for updates, but we check here for consistency
  }

  // Generate slug
  const slug = generateSlug(data.name);

  // Check for duplicate slug
  const existingSlug = await prisma.interiorFurnitureCategory.findFirst({
    where: { slug },
  });
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  // Get max order
  const maxOrder = await prisma.interiorFurnitureCategory.aggregate({
    _max: { order: true },
    where: { parentId: data.parentId ?? null },
  });

  const category = await prisma.interiorFurnitureCategory.create({
    data: {
      name: data.name,
      slug: finalSlug,
      icon: data.icon ?? null,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
      roomTypes: data.roomTypes ? JSON.stringify(data.roomTypes) : null,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      isActive: data.isActive ?? true,
    },
    include: {
      parent: true,
      _count: { select: { items: true } },
    },
  });

  return transformCategory(category);
}


/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: UpdateFurnitureCategoryInput
): Promise<InteriorFurnitureCategoryData> {
  // Validate parent if changing
  if (data.parentId !== undefined) {
    if (data.parentId === id) {
      throw new Error('Danh mục không thể là cha của chính nó');
    }
    if (data.parentId) {
      const parent = await prisma.interiorFurnitureCategory.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new Error('Danh mục cha không tồn tại');
      }
      // Check for circular reference
      const isCircular = await checkCircularReference(id, data.parentId);
      if (isCircular) {
        throw new Error('Không thể tạo tham chiếu vòng trong cây danh mục');
      }
    }
  }

  // Generate new slug if name changes
  let slug: string | undefined;
  if (data.name) {
    slug = generateSlug(data.name);
    const existingSlug = await prisma.interiorFurnitureCategory.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  const category = await prisma.interiorFurnitureCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(slug && { slug }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
      ...(data.roomTypes !== undefined && {
        roomTypes: data.roomTypes ? JSON.stringify(data.roomTypes) : null,
      }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      parent: true,
      _count: { select: { items: true } },
    },
  });

  return transformCategory(category);
}

/**
 * Check for circular reference in category hierarchy
 */
async function checkCircularReference(categoryId: string, newParentId: string): Promise<boolean> {
  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === categoryId) {
      return true; // Circular reference detected
    }
    if (visited.has(currentId)) {
      return false; // Already visited, no circular reference through this path
    }
    visited.add(currentId);

    const parent = await prisma.interiorFurnitureCategory.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = parent?.parentId ?? null;
  }

  return false;
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  // Check for children
  const children = await prisma.interiorFurnitureCategory.count({
    where: { parentId: id },
  });

  if (children > 0) {
    return {
      success: false,
      error: `Không thể xóa danh mục có ${children} danh mục con`,
    };
  }

  // Check for items
  const items = await prisma.interiorFurnitureItem.count({
    where: { categoryId: id },
  });

  if (items > 0) {
    return {
      success: false,
      error: `Không thể xóa danh mục có ${items} sản phẩm`,
    };
  }

  await prisma.interiorFurnitureCategory.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Reorder categories
 */
export async function reorderCategories(
  items: Array<{ id: string; order: number }>
): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.interiorFurnitureCategory.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );
}

/**
 * Check if category name exists
 */
export async function isCategoryNameExists(
  name: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.interiorFurnitureCategory.findFirst({
    where: {
      name,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
}

// ============================================
// ITEM CRUD OPERATIONS
// ============================================

/**
 * List furniture items with filters
 */
export async function listItems(
  options: ListOptions & {
    categoryId?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    isActive?: boolean;
    search?: string;
  } = {}
): Promise<PaginatedResult<InteriorFurnitureItemData>> {
  const {
    page = 1,
    limit = 20,
    categoryId,
    brand,
    minPrice,
    maxPrice,
    inStock,
    isActive,
    search,
  } = options;
  const skip = (page - 1) * limit;

  // Build where clause with proper typing
  type WhereClause = {
    categoryId?: string;
    brand?: string;
    price?: { gte?: number; lte?: number };
    inStock?: boolean;
    isActive?: boolean;
    OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; sku?: { contains: string; mode: 'insensitive' }; brand?: { contains: string; mode: 'insensitive' } }>;
  };
  const where: WhereClause = {};
  if (categoryId) where.categoryId = categoryId;
  if (brand) where.brand = brand;
  if (minPrice !== undefined) where.price = { ...where.price, gte: minPrice };
  if (maxPrice !== undefined) where.price = { ...where.price, lte: maxPrice };
  if (inStock !== undefined) where.inStock = inStock;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.interiorFurnitureItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.interiorFurnitureItem.count({ where }),
  ]);

  return {
    items: items.map(transformItem),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}


/**
 * Get item by ID
 */
export async function getItemById(id: string): Promise<InteriorFurnitureItemData | null> {
  const item = await prisma.interiorFurnitureItem.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!item) return null;

  return transformItem(item);
}

/**
 * Get item by SKU
 */
export async function getItemBySku(sku: string): Promise<InteriorFurnitureItemData | null> {
  const item = await prisma.interiorFurnitureItem.findUnique({
    where: { sku },
    include: {
      category: true,
    },
  });

  if (!item) return null;

  return transformItem(item);
}

/**
 * Create a new furniture item
 */
export async function createItem(
  data: CreateFurnitureItemInput
): Promise<InteriorFurnitureItemData> {
  // Validate category exists
  const category = await prisma.interiorFurnitureCategory.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    throw new Error('Danh mục không tồn tại');
  }

  // Check for duplicate SKU if provided
  if (data.sku) {
    const existingSku = await prisma.interiorFurnitureItem.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      throw new Error('Mã SKU đã tồn tại');
    }
  }

  // Get max order
  const maxOrder = await prisma.interiorFurnitureItem.aggregate({
    _max: { order: true },
    where: { categoryId: data.categoryId },
  });

  const item = await prisma.interiorFurnitureItem.create({
    data: {
      categoryId: data.categoryId,
      name: data.name,
      sku: data.sku ?? null,
      brand: data.brand ?? null,
      origin: data.origin ?? null,
      material: data.material ?? null,
      color: data.color ?? null,
      dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null,
      weight: data.weight ?? null,
      price: data.price,
      costPrice: data.costPrice ?? null,
      thumbnail: data.thumbnail ?? null,
      images: data.images ? JSON.stringify(data.images) : null,
      description: data.description ?? null,
      features: data.features ? JSON.stringify(data.features) : null,
      warrantyMonths: data.warrantyMonths ?? null,
      inStock: data.inStock ?? true,
      stockQty: data.stockQty ?? null,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      isActive: data.isActive ?? true,
    },
    include: {
      category: true,
    },
  });

  return transformItem(item);
}

/**
 * Update a furniture item
 */
export async function updateItem(
  id: string,
  data: UpdateFurnitureItemInput
): Promise<InteriorFurnitureItemData> {
  const item = await prisma.interiorFurnitureItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.origin !== undefined && { origin: data.origin }),
      ...(data.material !== undefined && { material: data.material }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.dimensions !== undefined && {
        dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null,
      }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      ...(data.images !== undefined && {
        images: data.images ? JSON.stringify(data.images) : null,
      }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.features !== undefined && {
        features: data.features ? JSON.stringify(data.features) : null,
      }),
      ...(data.warrantyMonths !== undefined && { warrantyMonths: data.warrantyMonths }),
      ...(data.inStock !== undefined && { inStock: data.inStock }),
      ...(data.stockQty !== undefined && { stockQty: data.stockQty }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      category: true,
    },
  });

  return transformItem(item);
}

/**
 * Delete a furniture item
 */
export async function deleteItem(id: string): Promise<{ success: boolean }> {
  await prisma.interiorFurnitureItem.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Check if SKU exists
 */
export async function isSkuExists(sku: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.interiorFurnitureItem.findFirst({
    where: {
      sku,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
}

/**
 * Get all unique brands
 */
export async function getBrands(): Promise<string[]> {
  const items = await prisma.interiorFurnitureItem.findMany({
    where: {
      brand: { not: null },
      isActive: true,
    },
    select: { brand: true },
    distinct: ['brand'],
    orderBy: { brand: 'asc' },
  });

  return items.map((i) => i.brand).filter((brand): brand is string => brand !== null);
}

/**
 * Bulk import items
 */
export async function bulkImportItems(
  items: Array<CreateFurnitureItemInput & { categoryCode?: string }>
): Promise<{ imported: number; errors: Array<{ index: number; error: string }> }> {
  const errors: Array<{ index: number; error: string }> = [];
  let imported = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      await createItem(item);
      imported++;
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { imported, errors };
}

