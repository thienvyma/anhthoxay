/**
 * Property Tests for Package Service
 *
 * **Property 10: Package items calculation**
 * For any interior package with items, totalItems SHALL equal the count
 * of all items across all rooms, and totalItemsPrice SHALL equal the
 * sum of (qty × price) for all items.
 *
 * **Validates: Requirements 6.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as packageService from './package.service';
import { prisma } from '../../utils/prisma';
import type { PackageRoomItems } from './types';
import type { InteriorPackage } from '@prisma/client';

// Helper type for partial mock data
type PartialPackage = Partial<InteriorPackage>;

// Mock prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    interiorPackage: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    interiorQuote: {
      count: vi.fn(),
    },
  },
}));

describe('Package Service - Property 10: Package items calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculatePackageTotals', () => {
    it('should calculate correct totals for single room with single item', () => {
      const items: PackageRoomItems[] = [
        {
          room: 'Phòng khách',
          items: [{ name: 'Sofa', qty: 1, price: 5000000 }],
        },
      ];

      const result = packageService.calculatePackageTotals(items);

      expect(result.totalItems).toBe(1);
      expect(result.totalItemsPrice).toBe(5000000);
    });

    it('should calculate correct totals for single room with multiple items', () => {
      const items: PackageRoomItems[] = [
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa', qty: 1, price: 5000000 },
            { name: 'Bàn trà', qty: 1, price: 2000000 },
            { name: 'Ghế đơn', qty: 2, price: 1500000 },
          ],
        },
      ];

      const result = packageService.calculatePackageTotals(items);

      // Total items: 1 + 1 + 2 = 4
      expect(result.totalItems).toBe(4);
      // Total price: 5000000 + 2000000 + (2 * 1500000) = 10000000
      expect(result.totalItemsPrice).toBe(10000000);
    });

    it('should calculate correct totals for multiple rooms', () => {
      const items: PackageRoomItems[] = [
        {
          room: 'Phòng khách',
          items: [
            { name: 'Sofa', qty: 1, price: 5000000 },
            { name: 'Bàn trà', qty: 1, price: 2000000 },
          ],
        },
        {
          room: 'Phòng ngủ 1',
          items: [
            { name: 'Giường', qty: 1, price: 8000000 },
            { name: 'Tủ quần áo', qty: 1, price: 6000000 },
            { name: 'Bàn đầu giường', qty: 2, price: 1000000 },
          ],
        },
        {
          room: 'Bếp',
          items: [
            { name: 'Tủ bếp', qty: 1, price: 15000000 },
          ],
        },
      ];

      const result = packageService.calculatePackageTotals(items);

      // Total items: (1 + 1) + (1 + 1 + 2) + 1 = 7
      expect(result.totalItems).toBe(7);
      // Total price: (5000000 + 2000000) + (8000000 + 6000000 + 2000000) + 15000000 = 38000000
      expect(result.totalItemsPrice).toBe(38000000);
    });

    it('should handle empty items array', () => {
      const items: PackageRoomItems[] = [];

      const result = packageService.calculatePackageTotals(items);

      expect(result.totalItems).toBe(0);
      expect(result.totalItemsPrice).toBe(0);
    });

    it('should handle room with empty items', () => {
      const items: PackageRoomItems[] = [
        { room: 'Phòng khách', items: [] },
        { room: 'Phòng ngủ', items: [] },
      ];

      const result = packageService.calculatePackageTotals(items);

      expect(result.totalItems).toBe(0);
      expect(result.totalItemsPrice).toBe(0);
    });

    it('should handle items with quantity > 1', () => {
      const items: PackageRoomItems[] = [
        {
          room: 'Phòng khách',
          items: [
            { name: 'Ghế ăn', qty: 6, price: 500000 },
            { name: 'Đèn trang trí', qty: 4, price: 300000 },
          ],
        },
      ];

      const result = packageService.calculatePackageTotals(items);

      // Total items: 6 + 4 = 10
      expect(result.totalItems).toBe(10);
      // Total price: (6 * 500000) + (4 * 300000) = 3000000 + 1200000 = 4200000
      expect(result.totalItemsPrice).toBe(4200000);
    });

    it('should handle items with price = 0', () => {
      const items: PackageRoomItems[] = [
        {
          room: 'Phòng khách',
          items: [
            { name: 'Quà tặng', qty: 1, price: 0 },
            { name: 'Sofa', qty: 1, price: 5000000 },
          ],
        },
      ];

      const result = packageService.calculatePackageTotals(items);

      expect(result.totalItems).toBe(2);
      expect(result.totalItemsPrice).toBe(5000000);
    });
  });

  describe('createPackage', () => {
    it('should auto-calculate totalItems and totalItemsPrice on creation', async () => {
      const mockPackage = {
        id: 'pkg-1',
        layoutId: 'layout-1',
        name: 'Gói Basic',
        code: 'PKG-BASIC',
        tier: 1,
        description: null,
        shortDescription: null,
        basePrice: 100000000,
        pricePerSqm: null,
        thumbnail: null,
        images: null,
        video360Url: null,
        items: JSON.stringify([
          {
            room: 'Phòng khách',
            items: [
              { name: 'Sofa', qty: 1, price: 5000000 },
              { name: 'Bàn trà', qty: 1, price: 2000000 },
            ],
          },
        ]),
        totalItems: 2,
        totalItemsPrice: 7000000,
        warrantyMonths: null,
        installationDays: null,
        order: 1,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
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

      vi.mocked(prisma.interiorPackage.aggregate).mockResolvedValue({
        _max: { order: 0 },
        _min: {},
        _avg: {},
        _sum: {},
        _count: 0,
      });
      vi.mocked(prisma.interiorPackage.create).mockResolvedValue(mockPackage);

      const result = await packageService.createPackage({
        layoutId: 'layout-1',
        name: 'Gói Basic',
        code: 'PKG-BASIC',
        basePrice: 100000000,
        items: [
          {
            room: 'Phòng khách',
            items: [
              { name: 'Sofa', qty: 1, price: 5000000 },
              { name: 'Bàn trà', qty: 1, price: 2000000 },
            ],
          },
        ],
      });

      expect(prisma.interiorPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalItems: 2,
            totalItemsPrice: 7000000,
          }),
        })
      );
      expect(result.totalItems).toBe(2);
      expect(result.totalItemsPrice).toBe(7000000);
    });
  });

  describe('updatePackage', () => {
    it('should recalculate totals when items are updated', async () => {
      const mockUpdatedPackage = {
        id: 'pkg-1',
        layoutId: 'layout-1',
        name: 'Gói Basic',
        code: 'PKG-BASIC',
        tier: 1,
        description: null,
        shortDescription: null,
        basePrice: 100000000,
        pricePerSqm: null,
        thumbnail: null,
        images: null,
        video360Url: null,
        items: JSON.stringify([
          {
            room: 'Phòng khách',
            items: [
              { name: 'Sofa', qty: 1, price: 8000000 },
              { name: 'Bàn trà', qty: 1, price: 3000000 },
              { name: 'Ghế đơn', qty: 2, price: 2000000 },
            ],
          },
        ]),
        totalItems: 4,
        totalItemsPrice: 15000000,
        warrantyMonths: null,
        installationDays: null,
        order: 1,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
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

      vi.mocked(prisma.interiorPackage.update).mockResolvedValue(mockUpdatedPackage);

      const result = await packageService.updatePackage('pkg-1', {
        items: [
          {
            room: 'Phòng khách',
            items: [
              { name: 'Sofa', qty: 1, price: 8000000 },
              { name: 'Bàn trà', qty: 1, price: 3000000 },
              { name: 'Ghế đơn', qty: 2, price: 2000000 },
            ],
          },
        ],
      });

      expect(prisma.interiorPackage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalItems: 4,
            totalItemsPrice: 15000000,
          }),
        })
      );
      expect(result.totalItems).toBe(4);
      expect(result.totalItemsPrice).toBe(15000000);
    });
  });

  describe('clonePackage', () => {
    it('should clone package with price adjustment', async () => {
      const originalPackage = {
        id: 'pkg-original',
        layoutId: 'layout-1',
        name: 'Original Package',
        code: 'PKG-ORIG',
        tier: 2,
        description: 'Original description',
        shortDescription: 'Short desc',
        basePrice: 100000000,
        pricePerSqm: 1500000,
        thumbnail: 'https://example.com/thumb.jpg',
        images: JSON.stringify(['https://example.com/img1.jpg']),
        video360Url: null,
        items: JSON.stringify([
          {
            room: 'Phòng khách',
            items: [
              { name: 'Sofa', qty: 1, price: 10000000 },
            ],
          },
        ]),
        totalItems: 1,
        totalItemsPrice: 10000000,
        warrantyMonths: 24,
        installationDays: 30,
        order: 1,
        isActive: true,
        isFeatured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // With 10% price adjustment
      const clonedPackage = {
        ...originalPackage,
        id: 'pkg-cloned',
        layoutId: 'layout-2',
        name: 'Cloned Package',
        code: 'PKG-CLONE',
        basePrice: 110000000, // 100000000 * 1.1
        pricePerSqm: 1650000, // 1500000 * 1.1
        items: JSON.stringify([
          {
            room: 'Phòng khách',
            items: [
              { name: 'Sofa', qty: 1, price: 11000000 }, // 10000000 * 1.1
            ],
          },
        ]),
        totalItems: 1,
        totalItemsPrice: 11000000,
        order: 0,
        isActive: true,
        isFeatured: false,
        layout: {
          id: 'layout-2',
          name: 'Layout 2PN',
          code: 'L2PN',
          unitType: '2PN',
          bedrooms: 2,
          bathrooms: 2,
          grossArea: 70,
          netArea: 60,
        },
      };

      vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(originalPackage);
      vi.mocked(prisma.interiorPackage.create).mockResolvedValue(clonedPackage);

      const result = await packageService.clonePackage(
        'pkg-original',
        'layout-2',
        'PKG-CLONE',
        'Cloned Package',
        10 // 10% price increase
      );

      expect(result.id).not.toBe('pkg-original');
      expect(result.code).toBe('PKG-CLONE');
      expect(result.name).toBe('Cloned Package');
      expect(result.basePrice).toBe(110000000);
      expect(result.totalItemsPrice).toBe(11000000);
      expect(result.isFeatured).toBe(false); // Clone should not be featured
    });

    it('should throw error when original package does not exist', async () => {
      vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(null);

      await expect(
        packageService.clonePackage('non-existent', 'layout-2', 'NEW', 'New Package')
      ).rejects.toThrow(/không tồn tại/);
    });
  });

  describe('deletePackage', () => {
    it('should prevent deletion if package has quotes', async () => {
      vi.mocked(prisma.interiorQuote.count).mockResolvedValue(5);

      const result = await packageService.deletePackage('pkg-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('5');
      expect(result.error).toContain('báo giá');
    });

    it('should allow deletion if package has no quotes', async () => {
      vi.mocked(prisma.interiorQuote.count).mockResolvedValue(0);
      vi.mocked(prisma.interiorPackage.delete).mockResolvedValue({} as PartialPackage as InteriorPackage);

      const result = await packageService.deletePackage('pkg-1');

      expect(result.success).toBe(true);
    });
  });

  describe('isPackageCodeExists', () => {
    it('should check code uniqueness within layout', async () => {
      vi.mocked(prisma.interiorPackage.findFirst).mockResolvedValue(null);

      await packageService.isPackageCodeExists('layout-1', 'PKG-NEW');

      expect(prisma.interiorPackage.findFirst).toHaveBeenCalledWith({
        where: {
          layoutId: 'layout-1',
          code: 'PKG-NEW',
        },
      });
    });

    it('should exclude specific ID when checking', async () => {
      vi.mocked(prisma.interiorPackage.findFirst).mockResolvedValue(null);

      await packageService.isPackageCodeExists('layout-1', 'PKG-CODE', 'exclude-id');

      expect(prisma.interiorPackage.findFirst).toHaveBeenCalledWith({
        where: {
          layoutId: 'layout-1',
          code: 'PKG-CODE',
          NOT: { id: 'exclude-id' },
        },
      });
    });
  });
});
