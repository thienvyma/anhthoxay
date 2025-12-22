/**
 * Property Tests for Building Unit Service
 *
 * **Property 8: Layout-unit type matching**
 * For any building unit assignment, the assigned layout's unitType
 * SHALL match the building unit's unitType.
 *
 * **Validates: Requirements 4.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as buildingUnitService from './building-unit.service';
import { prisma } from '../../utils/prisma';
import type { InteriorUnitLayout, InteriorBuildingUnit } from '@prisma/client';

// Mock prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    interiorBuildingUnit: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    interiorBuilding: {
      findUnique: vi.fn(),
    },
    interiorUnitLayout: {
      findUnique: vi.fn(),
    },
  },
}));

// Helper type for partial mock data
type PartialLayout = Partial<InteriorUnitLayout>;
type PartialBuildingUnit = Partial<InteriorBuildingUnit>;

describe('Building Unit Service - Property 8: Layout-unit type matching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createBuildingUnit', () => {
    it('should reject creation when layout unitType does not match unit unitType', async () => {
      // Layout is for 2PN but unit is 3PN
      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue({
        id: 'layout-1',
        unitType: '2PN',
      } as PartialLayout as InteriorUnitLayout);

      await expect(
        buildingUnitService.createBuildingUnit({
          buildingId: 'building-1',
          axis: 'A',
          unitType: '3PN', // Mismatch!
          bedrooms: 3,
          layoutId: 'layout-1',
        })
      ).rejects.toThrow(/không khớp/);
    });

    it('should accept creation when layout unitType matches unit unitType', async () => {
      const mockUnit = {
        id: 'unit-1',
        buildingId: 'building-1',
        axis: 'A',
        unitType: '2PN',
        bedrooms: 2,
        bathrooms: 2,
        position: 'MIDDLE',
        direction: null,
        view: null,
        floorStart: 1,
        floorEnd: null,
        layoutId: 'layout-1',
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        building: {
          id: 'building-1',
          name: 'S1.01',
          code: 'S101',
          unitCodeFormat: '{building}.{floor}.{axis}',
          development: {
            id: 'dev-1',
            name: 'Vinhomes',
            code: 'VH',
          },
        },
        layout: {
          id: 'layout-1',
          name: 'Layout 2PN',
          code: 'L2PN',
          unitType: '2PN',
          bedrooms: 2,
          bathrooms: 2,
          grossArea: 70,
          netArea: 60,
        },
      };

      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue({
        id: 'layout-1',
        unitType: '2PN',
      } as PartialLayout as InteriorUnitLayout);
      vi.mocked(prisma.interiorBuildingUnit.create).mockResolvedValue(mockUnit);

      const result = await buildingUnitService.createBuildingUnit({
        buildingId: 'building-1',
        axis: 'A',
        unitType: '2PN',
        bedrooms: 2,
        layoutId: 'layout-1',
      });

      expect(result.unitType).toBe('2PN');
      expect(result.layout?.unitType).toBe('2PN');
    });

    it('should reject when layout does not exist', async () => {
      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue(null);

      await expect(
        buildingUnitService.createBuildingUnit({
          buildingId: 'building-1',
          axis: 'A',
          unitType: '2PN',
          bedrooms: 2,
          layoutId: 'non-existent-layout',
        })
      ).rejects.toThrow(/không tồn tại/);
    });
  });

  describe('updateBuildingUnit', () => {
    it('should reject update when new layout unitType does not match unit unitType', async () => {
      // Current unit is 2PN, trying to assign 3PN layout
      vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue({
        id: 'unit-1',
        unitType: '2PN',
        layoutId: 'layout-1',
      } as PartialBuildingUnit as InteriorBuildingUnit);

      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue({
        id: 'layout-2',
        unitType: '3PN', // Mismatch!
      } as PartialLayout as InteriorUnitLayout);

      await expect(
        buildingUnitService.updateBuildingUnit('unit-1', {
          layoutId: 'layout-2',
        })
      ).rejects.toThrow(/không khớp/);
    });

    it('should reject update when new unitType does not match current layout', async () => {
      // Current layout is 2PN, trying to change unit to 3PN
      vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue({
        id: 'unit-1',
        unitType: '2PN',
        layoutId: 'layout-1',
      } as PartialBuildingUnit as InteriorBuildingUnit);

      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue({
        id: 'layout-1',
        unitType: '2PN',
      } as PartialLayout as InteriorUnitLayout);

      await expect(
        buildingUnitService.updateBuildingUnit('unit-1', {
          unitType: '3PN', // Mismatch with current layout!
        })
      ).rejects.toThrow(/không khớp/);
    });

    it('should accept update when both layoutId and unitType are changed and match', async () => {
      const mockUpdatedUnit = {
        id: 'unit-1',
        buildingId: 'building-1',
        axis: 'A',
        unitType: '3PN',
        bedrooms: 3,
        bathrooms: 2,
        position: 'MIDDLE',
        direction: null,
        view: null,
        floorStart: 1,
        floorEnd: null,
        layoutId: 'layout-3pn',
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        building: {
          id: 'building-1',
          name: 'S1.01',
          code: 'S101',
          unitCodeFormat: '{building}.{floor}.{axis}',
          development: {
            id: 'dev-1',
            name: 'Vinhomes',
            code: 'VH',
          },
        },
        layout: {
          id: 'layout-3pn',
          name: 'Layout 3PN',
          code: 'L3PN',
          unitType: '3PN',
          bedrooms: 3,
          bathrooms: 2,
          grossArea: 90,
          netArea: 80,
        },
      };

      vi.mocked(prisma.interiorUnitLayout.findUnique).mockResolvedValue({
        id: 'layout-3pn',
        unitType: '3PN',
      } as PartialLayout as InteriorUnitLayout);
      vi.mocked(prisma.interiorBuildingUnit.update).mockResolvedValue(mockUpdatedUnit);

      const result = await buildingUnitService.updateBuildingUnit('unit-1', {
        unitType: '3PN',
        layoutId: 'layout-3pn',
        bedrooms: 3,
      });

      expect(result.unitType).toBe('3PN');
      expect(result.layout?.unitType).toBe('3PN');
    });
  });

  describe('listBuildingUnits', () => {
    it('should filter by buildingId', async () => {
      const mockUnits = [
        {
          id: 'unit-1',
          buildingId: 'building-1',
          axis: 'A',
          unitType: '2PN',
          bedrooms: 2,
          bathrooms: 2,
          position: 'MIDDLE',
          direction: null,
          view: null,
          floorStart: 1,
          floorEnd: 30,
          layoutId: 'layout-1',
          notes: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          building: {
            id: 'building-1',
            name: 'S1.01',
            code: 'S101',
            unitCodeFormat: '{building}.{floor}.{axis}',
            development: {
              id: 'dev-1',
              name: 'Vinhomes',
              code: 'VH',
            },
          },
          layout: {
            id: 'layout-1',
            name: 'Layout 2PN',
            code: 'L2PN',
            unitType: '2PN',
            bedrooms: 2,
            bathrooms: 2,
            grossArea: 70,
            netArea: 60,
          },
        },
      ];

      vi.mocked(prisma.interiorBuildingUnit.findMany).mockResolvedValue(mockUnits);
      vi.mocked(prisma.interiorBuildingUnit.count).mockResolvedValue(1);

      const result = await buildingUnitService.listBuildingUnits({
        buildingId: 'building-1',
      });

      expect(prisma.interiorBuildingUnit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            buildingId: 'building-1',
          }),
        })
      );
      expect(result.items).toHaveLength(1);
    });

    it('should filter by unitType', async () => {
      vi.mocked(prisma.interiorBuildingUnit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.interiorBuildingUnit.count).mockResolvedValue(0);

      await buildingUnitService.listBuildingUnits({
        unitType: '3PN',
      });

      expect(prisma.interiorBuildingUnit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            unitType: '3PN',
          }),
        })
      );
    });
  });

  describe('getBuildingUnitByAxis', () => {
    it('should find unit by building and axis', async () => {
      const mockUnit = {
        id: 'unit-1',
        buildingId: 'building-1',
        axis: 'A',
        unitType: '2PN',
        bedrooms: 2,
        bathrooms: 2,
        position: 'CORNER',
        direction: 'ĐÔNG',
        view: 'VIEW_POOL',
        floorStart: 1,
        floorEnd: 30,
        layoutId: 'layout-1',
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        building: {
          id: 'building-1',
          name: 'S1.01',
          code: 'S101',
          unitCodeFormat: '{building}.{floor}.{axis}',
          development: {
            id: 'dev-1',
            name: 'Vinhomes',
            code: 'VH',
          },
        },
        layout: {
          id: 'layout-1',
          name: 'Layout 2PN',
          code: 'L2PN',
          unitType: '2PN',
          bedrooms: 2,
          bathrooms: 2,
          grossArea: 70,
          netArea: 60,
        },
      };

      vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(mockUnit);

      const result = await buildingUnitService.getBuildingUnitByAxis('building-1', 'A');

      expect(prisma.interiorBuildingUnit.findUnique).toHaveBeenCalledWith({
        where: {
          buildingId_axis: { buildingId: 'building-1', axis: 'A' },
        },
        include: expect.any(Object),
      });
      expect(result?.axis).toBe('A');
      expect(result?.position).toBe('CORNER');
    });
  });

  describe('resolveUnitFromCode', () => {
    it('should find unit that covers the given floor', async () => {
      const mockUnit = {
        id: 'unit-1',
        buildingId: 'building-1',
        axis: 'A',
        unitType: '2PN',
        bedrooms: 2,
        bathrooms: 2,
        position: 'MIDDLE',
        direction: null,
        view: null,
        floorStart: 1,
        floorEnd: 30,
        layoutId: 'layout-1',
        notes: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        building: {
          id: 'building-1',
          name: 'S1.01',
          code: 'S101',
          unitCodeFormat: '{building}.{floor}.{axis}',
          development: {
            id: 'dev-1',
            name: 'Vinhomes',
            code: 'VH',
          },
        },
        layout: {
          id: 'layout-1',
          name: 'Layout 2PN',
          code: 'L2PN',
          unitType: '2PN',
          bedrooms: 2,
          bathrooms: 2,
          grossArea: 70,
          netArea: 60,
        },
      };

      vi.mocked(prisma.interiorBuildingUnit.findFirst).mockResolvedValue(mockUnit);

      const result = await buildingUnitService.resolveUnitFromCode('building-1', 15, 'A');

      expect(prisma.interiorBuildingUnit.findFirst).toHaveBeenCalledWith({
        where: {
          buildingId: 'building-1',
          axis: 'A',
          floorStart: { lte: 15 },
          OR: [
            { floorEnd: null },
            { floorEnd: { gte: 15 } },
          ],
          isActive: true,
        },
        include: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should return null when floor is outside unit range', async () => {
      vi.mocked(prisma.interiorBuildingUnit.findFirst).mockResolvedValue(null);

      const result = await buildingUnitService.resolveUnitFromCode('building-1', 50, 'A');

      expect(result).toBeNull();
    });
  });
});
