/**
 * Property Tests for Room Type Service
 *
 * **Property 4: Order field affects list ordering**
 * For any list of entities with order field, the returned list SHALL be
 * sorted by order ascending.
 *
 * **Validates: Requirements 1.6, 10.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as roomTypeService from './room-type.service';
import { prisma } from '../../utils/prisma';
import type { InteriorRoomType } from '@prisma/client';

// Helper type for partial mock data
type PartialRoomType = Partial<InteriorRoomType>;

// Mock prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    interiorRoomType: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    interiorUnitLayout: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

describe('Room Type Service - Property 4: Order field affects list ordering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listRoomTypes', () => {
    it('should return room types sorted by order ascending', async () => {
      const mockRoomTypes = [
        {
          id: 'rt-1',
          code: 'LIVING',
          name: 'Phòng khách',
          nameEn: 'Living Room',
          icon: 'ri-home-line',
          description: null,
          defaultCategories: null,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rt-2',
          code: 'BEDROOM',
          name: 'Phòng ngủ',
          nameEn: 'Bedroom',
          icon: 'ri-hotel-bed-line',
          description: null,
          defaultCategories: null,
          order: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rt-3',
          code: 'KITCHEN',
          name: 'Phòng bếp',
          nameEn: 'Kitchen',
          icon: 'ri-restaurant-line',
          description: null,
          defaultCategories: null,
          order: 3,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.interiorRoomType.findMany).mockResolvedValue(mockRoomTypes);
      vi.mocked(prisma.interiorRoomType.count).mockResolvedValue(3);

      const result = await roomTypeService.listRoomTypes();

      // Verify orderBy was called with order ascending
      expect(prisma.interiorRoomType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([
            expect.objectContaining({ order: 'asc' }),
          ]),
        })
      );

      // Verify result is in order
      expect(result.items[0].order).toBe(1);
      expect(result.items[1].order).toBe(2);
      expect(result.items[2].order).toBe(3);
    });

    it('should maintain order when items have same order value (secondary sort by name)', async () => {
      const mockRoomTypes = [
        {
          id: 'rt-1',
          code: 'BATHROOM',
          name: 'Phòng tắm',
          nameEn: 'Bathroom',
          icon: null,
          description: null,
          defaultCategories: null,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rt-2',
          code: 'BEDROOM',
          name: 'Phòng ngủ',
          nameEn: 'Bedroom',
          icon: null,
          description: null,
          defaultCategories: null,
          order: 1, // Same order
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.interiorRoomType.findMany).mockResolvedValue(mockRoomTypes);
      vi.mocked(prisma.interiorRoomType.count).mockResolvedValue(2);

      await roomTypeService.listRoomTypes();

      // Verify secondary sort by name
      expect(prisma.interiorRoomType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
        })
      );
    });

    it('should filter by isActive while maintaining order', async () => {
      const mockActiveRoomTypes = [
        {
          id: 'rt-1',
          code: 'LIVING',
          name: 'Phòng khách',
          nameEn: null,
          icon: null,
          description: null,
          defaultCategories: null,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.interiorRoomType.findMany).mockResolvedValue(mockActiveRoomTypes);
      vi.mocked(prisma.interiorRoomType.count).mockResolvedValue(1);

      const result = await roomTypeService.listRoomTypes({ isActive: true });

      expect(prisma.interiorRoomType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
        })
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isActive).toBe(true);
    });
  });

  describe('createRoomType', () => {
    it('should auto-assign order as max + 1 when not provided', async () => {
      vi.mocked(prisma.interiorRoomType.aggregate).mockResolvedValue({
        _max: { order: 5 },
        _min: { order: null },
        _avg: { order: null },
        _sum: { order: null },
        _count: { order: 0 },
      });

      const mockCreated = {
        id: 'rt-new',
        code: 'NEW_ROOM',
        name: 'Phòng mới',
        nameEn: null,
        icon: null,
        description: null,
        defaultCategories: null,
        order: 6, // max + 1
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.interiorRoomType.create).mockResolvedValue(mockCreated);

      const result = await roomTypeService.createRoomType({
        code: 'NEW_ROOM',
        name: 'Phòng mới',
      });

      expect(result.order).toBe(6);
      expect(prisma.interiorRoomType.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 6,
          }),
        })
      );
    });

    it('should use provided order value', async () => {
      vi.mocked(prisma.interiorRoomType.aggregate).mockResolvedValue({
        _max: { order: 5 },
        _min: { order: null },
        _avg: { order: null },
        _sum: { order: null },
        _count: { order: 0 },
      });

      const mockCreated = {
        id: 'rt-new',
        code: 'NEW_ROOM',
        name: 'Phòng mới',
        nameEn: null,
        icon: null,
        description: null,
        defaultCategories: null,
        order: 3, // Explicitly set
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.interiorRoomType.create).mockResolvedValue(mockCreated);

      const result = await roomTypeService.createRoomType({
        code: 'NEW_ROOM',
        name: 'Phòng mới',
        order: 3,
      });

      expect(result.order).toBe(3);
    });

    it('should start order at 1 when no existing room types', async () => {
      vi.mocked(prisma.interiorRoomType.aggregate).mockResolvedValue({
        _max: { order: null },
        _min: { order: null },
        _avg: { order: null },
        _sum: { order: null },
        _count: { order: 0 },
      });

      const mockCreated = {
        id: 'rt-first',
        code: 'FIRST_ROOM',
        name: 'Phòng đầu tiên',
        nameEn: null,
        icon: null,
        description: null,
        defaultCategories: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.interiorRoomType.create).mockResolvedValue(mockCreated);

      const result = await roomTypeService.createRoomType({
        code: 'FIRST_ROOM',
        name: 'Phòng đầu tiên',
      });

      expect(result.order).toBe(1);
    });
  });

  describe('reorderRoomTypes', () => {
    it('should update order for multiple room types', async () => {
      const reorderItems = [
        { id: 'rt-1', order: 3 },
        { id: 'rt-2', order: 1 },
        { id: 'rt-3', order: 2 },
      ];

      vi.mocked(prisma.interiorRoomType.update).mockImplementation(({ where, data }) => {
        return Promise.resolve({
          id: where.id,
          code: 'TEST',
          name: 'Test',
          nameEn: null,
          icon: null,
          description: null,
          defaultCategories: null,
          order: data.order as number,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as InteriorRoomType);
      });

      await roomTypeService.reorderRoomTypes(reorderItems);

      // Verify $transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify each update was called with correct order
      expect(prisma.interiorRoomType.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { order: 3 },
      });
      expect(prisma.interiorRoomType.update).toHaveBeenCalledWith({
        where: { id: 'rt-2' },
        data: { order: 1 },
      });
      expect(prisma.interiorRoomType.update).toHaveBeenCalledWith({
        where: { id: 'rt-3' },
        data: { order: 2 },
      });
    });

    it('should handle empty reorder list', async () => {
      await roomTypeService.reorderRoomTypes([]);

      expect(prisma.$transaction).toHaveBeenCalledWith([]);
    });
  });

  describe('updateRoomType', () => {
    it('should update order field', async () => {
      const mockUpdated = {
        id: 'rt-1',
        code: 'LIVING',
        name: 'Phòng khách',
        nameEn: null,
        icon: null,
        description: null,
        defaultCategories: null,
        order: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.interiorRoomType.update).mockResolvedValue(mockUpdated);

      const result = await roomTypeService.updateRoomType('rt-1', { order: 10 });

      expect(result.order).toBe(10);
      expect(prisma.interiorRoomType.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 10 }),
        })
      );
    });
  });
});

describe('Room Type Service - CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRoomTypeById', () => {
    it('should return room type by ID', async () => {
      const mockRoomType = {
        id: 'rt-1',
        code: 'LIVING',
        name: 'Phòng khách',
        nameEn: 'Living Room',
        icon: 'ri-home-line',
        description: 'Phòng khách chính',
        defaultCategories: JSON.stringify(['cat-1', 'cat-2']),
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.interiorRoomType.findUnique).mockResolvedValue(mockRoomType);

      const result = await roomTypeService.getRoomTypeById('rt-1');

      expect(result).not.toBeNull();
      expect(result?.code).toBe('LIVING');
      expect(result?.defaultCategories).toEqual(['cat-1', 'cat-2']);
    });

    it('should return null for non-existent ID', async () => {
      vi.mocked(prisma.interiorRoomType.findUnique).mockResolvedValue(null);

      const result = await roomTypeService.getRoomTypeById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getRoomTypeByCode', () => {
    it('should return room type by code', async () => {
      const mockRoomType = {
        id: 'rt-1',
        code: 'LIVING',
        name: 'Phòng khách',
        nameEn: null,
        icon: null,
        description: null,
        defaultCategories: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.interiorRoomType.findUnique).mockResolvedValue(mockRoomType);

      const result = await roomTypeService.getRoomTypeByCode('LIVING');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('rt-1');
    });
  });

  describe('isRoomTypeCodeExists', () => {
    it('should return true when code exists', async () => {
      vi.mocked(prisma.interiorRoomType.findFirst).mockResolvedValue({
        id: 'rt-1',
        code: 'LIVING',
      } as PartialRoomType as InteriorRoomType);

      const result = await roomTypeService.isRoomTypeCodeExists('LIVING');

      expect(result).toBe(true);
    });

    it('should return false when code does not exist', async () => {
      vi.mocked(prisma.interiorRoomType.findFirst).mockResolvedValue(null);

      const result = await roomTypeService.isRoomTypeCodeExists('NON_EXISTENT');

      expect(result).toBe(false);
    });

    it('should exclude specific ID when checking', async () => {
      vi.mocked(prisma.interiorRoomType.findFirst).mockResolvedValue(null);

      await roomTypeService.isRoomTypeCodeExists('LIVING', 'rt-1');

      expect(prisma.interiorRoomType.findFirst).toHaveBeenCalledWith({
        where: {
          code: 'LIVING',
          NOT: { id: 'rt-1' },
        },
      });
    });
  });

  describe('deleteRoomType', () => {
    it('should delete room type successfully', async () => {
      vi.mocked(prisma.interiorUnitLayout.findMany).mockResolvedValue([]);
      vi.mocked(prisma.interiorRoomType.delete).mockResolvedValue({} as PartialRoomType as InteriorRoomType);

      const result = await roomTypeService.deleteRoomType('rt-1');

      expect(result.success).toBe(true);
    });
  });
});

