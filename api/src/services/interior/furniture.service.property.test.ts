/**
 * Property Tests for Furniture Service
 *
 * **Property 12: Furniture category hierarchy**
 * For any furniture category with parentId, the parent category SHALL exist
 * and not create circular references.
 *
 * **Validates: Requirements 7.1**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as furnitureService from './furniture.service';
import { prisma } from '../../utils/prisma';
import type { InteriorFurnitureCategory, InteriorFurnitureItem } from '@prisma/client';

// Helper types for partial mocks
type PartialCategory = Partial<InteriorFurnitureCategory>;
type PartialItem = Partial<InteriorFurnitureItem>;

// Mock prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    interiorFurnitureCategory: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    interiorFurnitureItem: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

describe('Furniture Service - Property 12: Category hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateSlug', () => {
    it('should generate URL-safe slug from Vietnamese name', () => {
      const slug = furnitureService.generateSlug('Bàn Ghế Phòng Khách');
      expect(slug).toBe('ban-ghe-phong-khach');
    });

    it('should handle special characters', () => {
      const slug = furnitureService.generateSlug('Đồ Nội Thất & Trang Trí');
      expect(slug).toBe('do-noi-that-trang-tri');
    });

    it('should handle multiple spaces', () => {
      const slug = furnitureService.generateSlug('Sofa   Phòng   Khách');
      expect(slug).toBe('sofa-phong-khach');
    });
  });

  describe('createCategory', () => {
    it('should create root category without parent', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Phòng khách',
        slug: 'phong-khach',
        icon: null,
        description: null,
        parentId: null,
        roomTypes: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: null,
        _count: { items: 0 },
      };

      vi.mocked(prisma.interiorFurnitureCategory.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.interiorFurnitureCategory.aggregate).mockResolvedValue({
        _max: { order: 0 },
        _min: { order: null },
        _avg: { order: null },
        _sum: { order: null },
        _count: { order: 0 },
      });
      vi.mocked(prisma.interiorFurnitureCategory.create).mockResolvedValue(mockCategory);

      const result = await furnitureService.createCategory({
        name: 'Phòng khách',
      });

      expect(result.parentId).toBeNull();
      expect(result.name).toBe('Phòng khách');
    });

    it('should create child category with valid parent', async () => {
      const mockParent = {
        id: 'parent-1',
        name: 'Phòng khách',
        slug: 'phong-khach',
        icon: null,
        description: null,
        parentId: null,
        roomTypes: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockChild = {
        id: 'cat-2',
        name: 'Sofa',
        slug: 'sofa',
        icon: null,
        description: null,
        parentId: 'parent-1',
        roomTypes: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: mockParent,
        _count: { items: 0 },
      };

      vi.mocked(prisma.interiorFurnitureCategory.findUnique).mockResolvedValue(mockParent);
      vi.mocked(prisma.interiorFurnitureCategory.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.interiorFurnitureCategory.aggregate).mockResolvedValue({
        _max: { order: 0 },
        _min: { order: null },
        _avg: { order: null },
        _sum: { order: null },
        _count: { order: 0 },
      });
      vi.mocked(prisma.interiorFurnitureCategory.create).mockResolvedValue(mockChild);

      const result = await furnitureService.createCategory({
        name: 'Sofa',
        parentId: 'parent-1',
      });

      expect(result.parentId).toBe('parent-1');
      expect(result.parent?.id).toBe('parent-1');
    });

    it('should throw error when parent does not exist', async () => {
      vi.mocked(prisma.interiorFurnitureCategory.findUnique).mockResolvedValue(null);

      await expect(
        furnitureService.createCategory({
          name: 'Sofa',
          parentId: 'non-existent',
        })
      ).rejects.toThrow(/không tồn tại/);
    });
  });

  describe('updateCategory - circular reference prevention', () => {
    it('should throw error when setting category as its own parent', async () => {
      await expect(
        furnitureService.updateCategory('cat-1', {
          parentId: 'cat-1',
        })
      ).rejects.toThrow(/không thể là cha của chính nó/);
    });

    it('should throw error when creating circular reference', async () => {
      // Setup: cat-1 -> cat-2 -> cat-3
      // Try to set cat-1's parent to cat-3 (would create: cat-3 -> cat-1 -> cat-2 -> cat-3)
      
      const mockCat3: PartialCategory = {
        id: 'cat-3',
        parentId: 'cat-2',
      };
      const mockCat2: PartialCategory = {
        id: 'cat-2',
        parentId: 'cat-1',
      };
      const mockCat1: PartialCategory = {
        id: 'cat-1',
        parentId: null,
      };

      // First call: check if cat-3 exists (it does)
      vi.mocked(prisma.interiorFurnitureCategory.findUnique)
        .mockResolvedValueOnce(mockCat3 as InteriorFurnitureCategory) // Parent exists check
        .mockResolvedValueOnce(mockCat2 as InteriorFurnitureCategory) // Circular check: cat-3's parent
        .mockResolvedValueOnce(mockCat1 as InteriorFurnitureCategory); // Circular check: cat-2's parent

      await expect(
        furnitureService.updateCategory('cat-1', {
          parentId: 'cat-3',
        })
      ).rejects.toThrow(/tham chiếu vòng/);
    });

    it('should allow valid parent change', async () => {
      const mockNewParent = {
        id: 'new-parent',
        name: 'New Parent',
        slug: 'new-parent',
        parentId: null,
        icon: null,
        description: null,
        roomTypes: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdated = {
        id: 'cat-1',
        name: 'Category 1',
        slug: 'category-1',
        parentId: 'new-parent',
        icon: null,
        description: null,
        roomTypes: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: mockNewParent,
        _count: { items: 0 },
      };

      vi.mocked(prisma.interiorFurnitureCategory.findUnique)
        .mockResolvedValueOnce(mockNewParent as InteriorFurnitureCategory) // Parent exists check
        .mockResolvedValueOnce({ id: 'new-parent', parentId: null } as PartialCategory as InteriorFurnitureCategory); // Circular check

      vi.mocked(prisma.interiorFurnitureCategory.update).mockResolvedValue(mockUpdated);

      const result = await furnitureService.updateCategory('cat-1', {
        parentId: 'new-parent',
      });

      expect(result.parentId).toBe('new-parent');
    });
  });

  describe('deleteCategory', () => {
    it('should not delete category with children', async () => {
      vi.mocked(prisma.interiorFurnitureCategory.count).mockResolvedValue(3);

      const result = await furnitureService.deleteCategory('cat-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('3 danh mục con');
    });

    it('should not delete category with items', async () => {
      vi.mocked(prisma.interiorFurnitureCategory.count).mockResolvedValue(0);
      vi.mocked(prisma.interiorFurnitureItem.count).mockResolvedValue(5);

      const result = await furnitureService.deleteCategory('cat-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('5 sản phẩm');
    });

    it('should delete empty category', async () => {
      vi.mocked(prisma.interiorFurnitureCategory.count).mockResolvedValue(0);
      vi.mocked(prisma.interiorFurnitureItem.count).mockResolvedValue(0);
      vi.mocked(prisma.interiorFurnitureCategory.delete).mockResolvedValue({} as PartialCategory as InteriorFurnitureCategory);

      const result = await furnitureService.deleteCategory('cat-1');

      expect(result.success).toBe(true);
    });
  });

  describe('getCategoryTree', () => {
    it('should return hierarchical category structure', async () => {
      const mockTree = [
        {
          id: 'cat-1',
          name: 'Phòng khách',
          slug: 'phong-khach',
          parentId: null,
          icon: null,
          description: null,
          roomTypes: null,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          children: [
            {
              id: 'cat-1-1',
              name: 'Sofa',
              slug: 'sofa',
              parentId: 'cat-1',
              icon: null,
              description: null,
              roomTypes: null,
              order: 1,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              children: [],
              _count: { items: 5 },
            },
          ],
          _count: { items: 0 },
        },
      ];

      vi.mocked(prisma.interiorFurnitureCategory.findMany).mockResolvedValue(mockTree as InteriorFurnitureCategory[]);

      const result = await furnitureService.getCategoryTree();

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children?.[0].name).toBe('Sofa');
    });
  });
});

describe('Furniture Service - Item CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createItem', () => {
    it('should create item with valid category', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Sofa',
        slug: 'sofa',
        parentId: null,
        icon: null,
        description: null,
        roomTypes: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockItem = {
        id: 'item-1',
        categoryId: 'cat-1',
        name: 'Sofa 3 chỗ',
        sku: 'SOFA-001',
        brand: 'IKEA',
        origin: 'Sweden',
        material: 'Vải',
        color: 'Xám',
        dimensions: JSON.stringify({ width: 200, height: 80, depth: 90, unit: 'cm' }),
        weight: 50,
        price: 15000000,
        costPrice: 10000000,
        thumbnail: null,
        images: null,
        description: null,
        features: null,
        warrantyMonths: 24,
        inStock: true,
        stockQty: 10,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: mockCategory,
      };

      vi.mocked(prisma.interiorFurnitureCategory.findUnique).mockResolvedValue(mockCategory);
      vi.mocked(prisma.interiorFurnitureItem.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.interiorFurnitureItem.aggregate).mockResolvedValue({
        _max: { order: 0 },
        _min: { order: null },
        _avg: { order: null },
        _sum: { order: null },
        _count: { order: 0 },
      });
      vi.mocked(prisma.interiorFurnitureItem.create).mockResolvedValue(mockItem);

      const result = await furnitureService.createItem({
        categoryId: 'cat-1',
        name: 'Sofa 3 chỗ',
        sku: 'SOFA-001',
        brand: 'IKEA',
        price: 15000000,
      });

      expect(result.categoryId).toBe('cat-1');
      expect(result.name).toBe('Sofa 3 chỗ');
    });

    it('should throw error when category does not exist', async () => {
      vi.mocked(prisma.interiorFurnitureCategory.findUnique).mockResolvedValue(null);

      await expect(
        furnitureService.createItem({
          categoryId: 'non-existent',
          name: 'Test Item',
          price: 1000000,
        })
      ).rejects.toThrow(/không tồn tại/);
    });

    it('should throw error when SKU already exists', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Sofa',
        slug: 'sofa',
        parentId: null,
        icon: null,
        description: null,
        roomTypes: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingItem: PartialItem = {
        id: 'existing-item',
        sku: 'SOFA-001',
      };

      vi.mocked(prisma.interiorFurnitureCategory.findUnique).mockResolvedValue(mockCategory);
      vi.mocked(prisma.interiorFurnitureItem.findUnique).mockResolvedValue(existingItem as InteriorFurnitureItem);

      await expect(
        furnitureService.createItem({
          categoryId: 'cat-1',
          name: 'New Sofa',
          sku: 'SOFA-001',
          price: 15000000,
        })
      ).rejects.toThrow(/SKU đã tồn tại/);
    });
  });

  describe('listItems with filters', () => {
    it('should filter items by category', async () => {
      const mockItems = [
        {
          id: 'item-1',
          categoryId: 'cat-1',
          name: 'Sofa 1',
          sku: null,
          brand: null,
          origin: null,
          material: null,
          color: null,
          dimensions: null,
          weight: null,
          price: 10000000,
          costPrice: null,
          thumbnail: null,
          images: null,
          description: null,
          features: null,
          warrantyMonths: null,
          inStock: true,
          stockQty: null,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: { id: 'cat-1', name: 'Sofa' },
        },
      ];

      vi.mocked(prisma.interiorFurnitureItem.findMany).mockResolvedValue(mockItems as InteriorFurnitureItem[]);
      vi.mocked(prisma.interiorFurnitureItem.count).mockResolvedValue(1);

      const result = await furnitureService.listItems({ categoryId: 'cat-1' });

      expect(result.items).toHaveLength(1);
      expect(prisma.interiorFurnitureItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-1' }),
        })
      );
    });

    it('should filter items by price range', async () => {
      vi.mocked(prisma.interiorFurnitureItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.interiorFurnitureItem.count).mockResolvedValue(0);

      await furnitureService.listItems({ minPrice: 5000000, maxPrice: 20000000 });

      expect(prisma.interiorFurnitureItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 5000000, lte: 20000000 },
          }),
        })
      );
    });

    it('should search items by name, sku, or brand', async () => {
      vi.mocked(prisma.interiorFurnitureItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.interiorFurnitureItem.count).mockResolvedValue(0);

      await furnitureService.listItems({ search: 'IKEA' });

      expect(prisma.interiorFurnitureItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ sku: expect.any(Object) }),
              expect.objectContaining({ brand: expect.any(Object) }),
            ]),
          }),
        })
      );
    });
  });
});

