/**
 * Property Tests for Layout Service
 *
 * **Property 9: Room areas sum validation**
 * For any layout with room breakdown, the sum of all room areas
 * SHALL be less than or equal to netArea.
 *
 * **Property 11: Clone operation creates distinct entity**
 * For any clone operation, the cloned entity SHALL have a different
 * ID and code but identical data for other fields.
 *
 * **Validates: Requirements 5.3, 5.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as layoutService from './layout.service';
import { prisma } from '../../utils/prisma';
import type { LayoutRoom } from './types';
import type { InteriorUnitLayout } from '@prisma/client';

// Helper type for partial mock data
type PartialLayout = Partial<InteriorUnitLayout>;

// Mock prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    interiorUnitLayout: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    interiorBuildingUnit: {
      count: vi.fn(),
    },
    interiorPackage: {
      count: vi.fn(),
    },
  },
}));

describe('Layout Service - Property 9: Room areas sum validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateRoomAreasSum', () => {
    it('should return valid when total room area equals netArea', () => {
      const rooms: LayoutRoom[] = [
        { name: 'Phòng khách', area: 25, type: 'LIVING' },
        { name: 'Phòng ngủ 1', area: 15, type: 'BEDROOM_MASTER' },
        { name: 'Phòng ngủ 2', area: 12, type: 'BEDROOM' },
        { name: 'Bếp', area: 8, type: 'KITCHEN' },
      ];
      const netArea = 60; // Total = 25 + 15 + 12 + 8 = 60

      const result = layoutService.validateRoomAreasSum(rooms, netArea);

      expect(result.valid).toBe(true);
      expect(result.totalRoomArea).toBe(60);
    });

    it('should return valid when total room area is less than netArea', () => {
      const rooms: LayoutRoom[] = [
        { name: 'Phòng khách', area: 20, type: 'LIVING' },
        { name: 'Phòng ngủ', area: 15, type: 'BEDROOM_MASTER' },
      ];
      const netArea = 60; // Total = 35, less than 60

      const result = layoutService.validateRoomAreasSum(rooms, netArea);

      expect(result.valid).toBe(true);
      expect(result.totalRoomArea).toBe(35);
    });

    it('should return invalid when total room area exceeds netArea', () => {
      const rooms: LayoutRoom[] = [
        { name: 'Phòng khách', area: 30, type: 'LIVING' },
        { name: 'Phòng ngủ 1', area: 20, type: 'BEDROOM_MASTER' },
        { name: 'Phòng ngủ 2', area: 15, type: 'BEDROOM' },
      ];
      const netArea = 60; // Total = 65, exceeds 60

      const result = layoutService.validateRoomAreasSum(rooms, netArea);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('65');
      expect(result.error).toContain('60');
      expect(result.totalRoomArea).toBe(65);
    });

    it('should handle empty rooms array', () => {
      const rooms: LayoutRoom[] = [];
      const netArea = 60;

      const result = layoutService.validateRoomAreasSum(rooms, netArea);

      expect(result.valid).toBe(true);
      expect(result.totalRoomArea).toBe(0);
    });

    it('should handle decimal areas correctly', () => {
      const rooms: LayoutRoom[] = [
        { name: 'Phòng khách', area: 25.5, type: 'LIVING' },
        { name: 'Phòng ngủ', area: 14.5, type: 'BEDROOM_MASTER' },
      ];
      const netArea = 40; // Total = 40

      const result = layoutService.validateRoomAreasSum(rooms, netArea);

      expect(result.valid).toBe(true);
      expect(result.totalRoomArea).toBe(40);
    });
  });

  describe('createLayout', () => {
    it('should reject creation when room areas exceed netArea', async () => {
      await expect(
        layoutService.createLayout({
          name: 'Layout 2PN',
          code: 'L2PN-01',
          unitType: '2PN',
          bedrooms: 2,
          grossArea: 70,
          netArea: 60,
          rooms: [
            { name: 'Phòng khách', area: 40, type: 'LIVING' },
            { name: 'Phòng ngủ', area: 30, type: 'BEDROOM_MASTER' }, // Total = 70 > 60
          ],
        })
      ).rejects.toThrow(/vượt quá/);
    });

    it('should accept creation when room areas are within netArea', async () => {
      const mockLayout = {
        id: 'layout-1',
        name: 'Layout 2PN',
        code: 'L2PN-01',
        unitType: '2PN',
        bedrooms: 2,
        bathrooms: 2,
        grossArea: 70,
        netArea: 60,
        carpetArea: null,
        balconyArea: null,
        terraceArea: null,
        rooms: JSON.stringify([
          { name: 'Phòng khách', area: 25, type: 'LIVING' },
          { name: 'Phòng ngủ', area: 20, type: 'BEDROOM_MASTER' },
        ]),
        layoutImage: null,
        layout3DImage: null,
        dimensionImage: null,
        description: null,
        highlights: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { packages: 0 },
      };

      vi.mocked(prisma.interiorUnitLayout.create).mockResolvedValue(mockLayout);

      const result = await layoutService.createLayout({
        name: 'Layout 2PN',
        code: 'L2PN-01',
        unitType: '2PN',
        bedrooms: 2,
        grossArea: 70,
        netArea: 60,
        rooms: [
          { name: 'Phòng khách', area: 25, type: 'LIVING' },
          { name: 'Phòng ngủ', area: 20, type: 'BEDROOM_MASTER' },
        ],
      });

      expect(result.netArea).toBe(60);
    });
  });

  describe('updateLayout', () => {
    it('should reject update when new room areas exceed netArea', async () => {
      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue({
        id: 'layout-1',
        rooms: JSON.stringify([{ name: 'Old', area: 30, type: 'LIVING' }]),
        netArea: 60,
      } as PartialLayout as InteriorUnitLayout);

      await expect(
        layoutService.updateLayout('layout-1', {
          rooms: [
            { name: 'Phòng khách', area: 40, type: 'LIVING' },
            { name: 'Phòng ngủ', area: 30, type: 'BEDROOM_MASTER' }, // Total = 70 > 60
          ],
        })
      ).rejects.toThrow(/vượt quá/);
    });

    it('should reject update when new netArea is less than existing room areas', async () => {
      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue({
        id: 'layout-1',
        rooms: JSON.stringify([
          { name: 'Phòng khách', area: 30, type: 'LIVING' },
          { name: 'Phòng ngủ', area: 25, type: 'BEDROOM_MASTER' },
        ]), // Total = 55
        netArea: 60,
      } as PartialLayout as InteriorUnitLayout);

      await expect(
        layoutService.updateLayout('layout-1', {
          netArea: 50, // Less than room total of 55
        })
      ).rejects.toThrow(/vượt quá/);
    });
  });
});

describe('Layout Service - Property 11: Clone operation creates distinct entity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cloneLayout', () => {
    it('should create a new layout with different ID and code', async () => {
      const originalLayout = {
        id: 'original-id',
        name: 'Original Layout',
        code: 'ORIGINAL',
        unitType: '2PN',
        bedrooms: 2,
        bathrooms: 2,
        grossArea: 70,
        netArea: 60,
        carpetArea: 55,
        balconyArea: 5,
        terraceArea: null,
        rooms: JSON.stringify([
          { name: 'Phòng khách', area: 25, type: 'LIVING' },
          { name: 'Phòng ngủ', area: 20, type: 'BEDROOM_MASTER' },
        ]),
        layoutImage: 'https://example.com/layout.jpg',
        layout3DImage: 'https://example.com/layout3d.jpg',
        dimensionImage: null,
        description: 'Original description',
        highlights: JSON.stringify(['2 mặt thoáng', 'View hồ bơi']),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const clonedLayout = {
        ...originalLayout,
        id: 'cloned-id',
        name: 'Cloned Layout',
        code: 'CLONED',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { packages: 0 },
      };

      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue(originalLayout);
      vi.mocked(prisma.interiorUnitLayout.create).mockResolvedValue(clonedLayout);

      const result = await layoutService.cloneLayout('original-id', 'CLONED', 'Cloned Layout');

      // Verify different ID and code
      expect(result.id).not.toBe('original-id');
      expect(result.code).toBe('CLONED');
      expect(result.name).toBe('Cloned Layout');

      // Verify identical data for other fields
      expect(result.unitType).toBe(originalLayout.unitType);
      expect(result.bedrooms).toBe(originalLayout.bedrooms);
      expect(result.bathrooms).toBe(originalLayout.bathrooms);
      expect(result.grossArea).toBe(originalLayout.grossArea);
      expect(result.netArea).toBe(originalLayout.netArea);
      expect(result.carpetArea).toBe(originalLayout.carpetArea);
      expect(result.balconyArea).toBe(originalLayout.balconyArea);
      expect(result.layoutImage).toBe(originalLayout.layoutImage);
      expect(result.layout3DImage).toBe(originalLayout.layout3DImage);
      expect(result.description).toBe(originalLayout.description);
    });

    it('should throw error when original layout does not exist', async () => {
      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue(null);

      await expect(
        layoutService.cloneLayout('non-existent', 'NEW', 'New Layout')
      ).rejects.toThrow(/không tồn tại/);
    });

    it('should create clone with isActive=true', async () => {
      const originalLayout = {
        id: 'original-id',
        name: 'Original Layout',
        code: 'ORIGINAL',
        unitType: '2PN',
        bedrooms: 2,
        bathrooms: 2,
        grossArea: 70,
        netArea: 60,
        carpetArea: null,
        balconyArea: null,
        terraceArea: null,
        rooms: JSON.stringify([]),
        layoutImage: null,
        layout3DImage: null,
        dimensionImage: null,
        description: null,
        highlights: null,
        isActive: false, // Original is inactive
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const clonedLayout = {
        ...originalLayout,
        id: 'cloned-id',
        name: 'Cloned Layout',
        code: 'CLONED',
        isActive: true, // Clone should be active
        _count: { packages: 0 },
      };

      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue(originalLayout);
      vi.mocked(prisma.interiorUnitLayout.create).mockResolvedValue(clonedLayout);

      const result = await layoutService.cloneLayout('original-id', 'CLONED', 'Cloned Layout');

      expect(result.isActive).toBe(true);
      expect(prisma.interiorUnitLayout.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });
  });

  describe('deleteLayout', () => {
    it('should prevent deletion if layout has building units', async () => {
      vi.mocked(prisma.interiorBuildingUnit.count).mockResolvedValue(5);

      const result = await layoutService.deleteLayout('layout-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('5');
      expect(result.error).toContain('căn hộ');
    });

    it('should prevent deletion if layout has packages', async () => {
      vi.mocked(prisma.interiorBuildingUnit.count).mockResolvedValue(0);
      vi.mocked(prisma.interiorPackage.count).mockResolvedValue(3);

      const result = await layoutService.deleteLayout('layout-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('3');
      expect(result.error).toContain('gói nội thất');
    });

    it('should allow deletion if layout has no dependencies', async () => {
      vi.mocked(prisma.interiorBuildingUnit.count).mockResolvedValue(0);
      vi.mocked(prisma.interiorPackage.count).mockResolvedValue(0);
      vi.mocked(prisma.interiorUnitLayout.delete).mockResolvedValue({} as PartialLayout as InteriorUnitLayout);

      const result = await layoutService.deleteLayout('layout-1');

      expect(result.success).toBe(true);
    });
  });

  describe('isLayoutCodeExists', () => {
    it('should return true if code exists', async () => {
      vi.mocked(prisma.interiorUnitLayout.findFirst).mockResolvedValue({
        id: 'existing',
      } as PartialLayout as InteriorUnitLayout);

      const result = await layoutService.isLayoutCodeExists('EXISTING');

      expect(result).toBe(true);
    });

    it('should return false if code does not exist', async () => {
      vi.mocked(prisma.interiorUnitLayout.findFirst).mockResolvedValue(null);

      const result = await layoutService.isLayoutCodeExists('NEW');

      expect(result).toBe(false);
    });

    it('should exclude specific ID when checking', async () => {
      vi.mocked(prisma.interiorUnitLayout.findFirst).mockResolvedValue(null);

      await layoutService.isLayoutCodeExists('CODE', 'exclude-id');

      expect(prisma.interiorUnitLayout.findFirst).toHaveBeenCalledWith({
        where: {
          code: 'CODE',
          NOT: { id: 'exclude-id' },
        },
      });
    });
  });
});
