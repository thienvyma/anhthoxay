/**
 * Property Tests for Development Service
 *
 * **Property 2: Inactive entities filtered from public API**
 * For any entity with isActive=false, the public API SHALL NOT
 * include it in responses.
 *
 * **Validates: Requirements 2.5**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as developmentService from './development.service';
import { prisma } from '../../utils/prisma';
import type { InteriorDevelopment } from '@prisma/client';

// Mock prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    interiorDeveloper: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    interiorDevelopment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    interiorBuilding: {
      count: vi.fn(),
    },
  },
}));

describe('Development Service - Property 2: Inactive entities filtered', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listDevelopments with isActive filter', () => {
    it('should only return active developments when isActive=true', async () => {
      const mockDevelopments = [
        {
          id: 'dev-1',
          developerId: 'developer-1',
          name: 'Active Development',
          code: 'AD001',
          slug: 'active-development',
          address: null,
          district: null,
          city: null,
          description: null,
          thumbnail: null,
          images: null,
          totalBuildings: null,
          totalUnits: null,
          startYear: null,
          completionYear: null,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          developer: {
            id: 'developer-1',
            name: 'Test Developer',
            slug: 'test-developer',
            logo: null,
          },
          _count: { buildings: 2 },
        },
      ];

      vi.mocked(prisma.interiorDevelopment.findMany).mockResolvedValue(mockDevelopments);
      vi.mocked(prisma.interiorDevelopment.count).mockResolvedValue(1);

      const result = await developmentService.listDevelopments({ isActive: true });

      expect(prisma.interiorDevelopment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].isActive).toBe(true);
    });

    it('should return all developments (including inactive) when isActive is not specified', async () => {
      const mockDevelopments = [
        {
          id: 'dev-1',
          developerId: 'developer-1',
          name: 'Active Development',
          code: 'AD001',
          slug: 'active-development',
          address: null,
          district: null,
          city: null,
          description: null,
          thumbnail: null,
          images: null,
          totalBuildings: null,
          totalUnits: null,
          startYear: null,
          completionYear: null,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          developer: {
            id: 'developer-1',
            name: 'Test Developer',
            slug: 'test-developer',
            logo: null,
          },
          _count: { buildings: 2 },
        },
        {
          id: 'dev-2',
          developerId: 'developer-1',
          name: 'Inactive Development',
          code: 'ID001',
          slug: 'inactive-development',
          address: null,
          district: null,
          city: null,
          description: null,
          thumbnail: null,
          images: null,
          totalBuildings: null,
          totalUnits: null,
          startYear: null,
          completionYear: null,
          order: 2,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          developer: {
            id: 'developer-1',
            name: 'Test Developer',
            slug: 'test-developer',
            logo: null,
          },
          _count: { buildings: 0 },
        },
      ];

      vi.mocked(prisma.interiorDevelopment.findMany).mockResolvedValue(mockDevelopments);
      vi.mocked(prisma.interiorDevelopment.count).mockResolvedValue(2);

      const result = await developmentService.listDevelopments({});

      expect(prisma.interiorDevelopment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
      expect(result.items).toHaveLength(2);
    });

    it('should filter by developerId when provided', async () => {
      const developerId = 'developer-1';
      const mockDevelopments = [
        {
          id: 'dev-1',
          developerId,
          name: 'Development 1',
          code: 'D001',
          slug: 'development-1',
          address: null,
          district: null,
          city: null,
          description: null,
          thumbnail: null,
          images: null,
          totalBuildings: null,
          totalUnits: null,
          startYear: null,
          completionYear: null,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          developer: {
            id: developerId,
            name: 'Test Developer',
            slug: 'test-developer',
            logo: null,
          },
          _count: { buildings: 1 },
        },
      ];

      vi.mocked(prisma.interiorDevelopment.findMany).mockResolvedValue(mockDevelopments);
      vi.mocked(prisma.interiorDevelopment.count).mockResolvedValue(1);

      const result = await developmentService.listDevelopments({
        developerId,
        isActive: true,
      });

      expect(prisma.interiorDevelopment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId,
            isActive: true,
          }),
        })
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].developerId).toBe(developerId);
    });
  });

  describe('getDevelopmentById', () => {
    it('should return development regardless of isActive status', async () => {
      const mockDevelopment = {
        id: 'dev-1',
        developerId: 'developer-1',
        name: 'Inactive Development',
        code: 'ID001',
        slug: 'inactive-development',
        address: null,
        district: null,
        city: null,
        description: null,
        thumbnail: null,
        images: null,
        totalBuildings: null,
        totalUnits: null,
        startYear: null,
        completionYear: null,
        order: 1,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        developer: {
          id: 'developer-1',
          name: 'Test Developer',
          slug: 'test-developer',
          logo: null,
        },
        _count: { buildings: 0 },
      };

      vi.mocked(prisma.interiorDevelopment.findUnique).mockResolvedValue(mockDevelopment);

      const result = await developmentService.getDevelopmentById('dev-1');

      expect(result).not.toBeNull();
      expect(result?.isActive).toBe(false);
    });

    it('should return null for non-existent development', async () => {
      vi.mocked(prisma.interiorDevelopment.findUnique).mockResolvedValue(null);

      const result = await developmentService.getDevelopmentById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createDevelopment', () => {
    it('should create development with isActive=true by default', async () => {
      const mockDevelopment = {
        id: 'dev-new',
        developerId: 'developer-1',
        name: 'New Development',
        code: 'ND001',
        slug: 'new-development',
        address: null,
        district: null,
        city: null,
        description: null,
        thumbnail: null,
        images: null,
        totalBuildings: null,
        totalUnits: null,
        startYear: null,
        completionYear: null,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        developer: {
          id: 'developer-1',
          name: 'Test Developer',
          slug: 'test-developer',
          logo: null,
        },
        _count: { buildings: 0 },
      };

      vi.mocked(prisma.interiorDevelopment.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.interiorDevelopment.aggregate).mockResolvedValue({
        _max: { order: 0 },
        _min: {},
        _avg: {},
        _sum: {},
        _count: 0,
      });
      vi.mocked(prisma.interiorDevelopment.create).mockResolvedValue(mockDevelopment);

      const result = await developmentService.createDevelopment({
        developerId: 'developer-1',
        name: 'New Development',
        code: 'ND001',
      });

      expect(prisma.interiorDevelopment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: true,
          }),
        })
      );
      expect(result.isActive).toBe(true);
    });

    it('should create development with isActive=false when specified', async () => {
      const mockDevelopment = {
        id: 'dev-new',
        developerId: 'developer-1',
        name: 'Draft Development',
        code: 'DD001',
        slug: 'draft-development',
        address: null,
        district: null,
        city: null,
        description: null,
        thumbnail: null,
        images: null,
        totalBuildings: null,
        totalUnits: null,
        startYear: null,
        completionYear: null,
        order: 1,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        developer: {
          id: 'developer-1',
          name: 'Test Developer',
          slug: 'test-developer',
          logo: null,
        },
        _count: { buildings: 0 },
      };

      vi.mocked(prisma.interiorDevelopment.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.interiorDevelopment.aggregate).mockResolvedValue({
        _max: { order: 0 },
        _min: {},
        _avg: {},
        _sum: {},
        _count: 0,
      });
      vi.mocked(prisma.interiorDevelopment.create).mockResolvedValue(mockDevelopment);

      const result = await developmentService.createDevelopment({
        developerId: 'developer-1',
        name: 'Draft Development',
        code: 'DD001',
        isActive: false,
      });

      expect(prisma.interiorDevelopment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
          }),
        })
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('updateDevelopment', () => {
    it('should be able to toggle isActive status', async () => {
      const mockDevelopment = {
        id: 'dev-1',
        developerId: 'developer-1',
        name: 'Development',
        code: 'D001',
        slug: 'development',
        address: null,
        district: null,
        city: null,
        description: null,
        thumbnail: null,
        images: null,
        totalBuildings: null,
        totalUnits: null,
        startYear: null,
        completionYear: null,
        order: 1,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        developer: {
          id: 'developer-1',
          name: 'Test Developer',
          slug: 'test-developer',
          logo: null,
        },
        _count: { buildings: 0 },
      };

      vi.mocked(prisma.interiorDevelopment.update).mockResolvedValue(mockDevelopment);

      const result = await developmentService.updateDevelopment('dev-1', {
        isActive: false,
      });

      expect(prisma.interiorDevelopment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
          }),
        })
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteDevelopment', () => {
    it('should prevent deletion if development has buildings', async () => {
      vi.mocked(prisma.interiorBuilding.count).mockResolvedValue(3);

      const result = await developmentService.deleteDevelopment('dev-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('3');
      expect(result.error).toContain('tòa nhà');
    });

    it('should allow deletion if development has no buildings', async () => {
      vi.mocked(prisma.interiorBuilding.count).mockResolvedValue(0);
      vi.mocked(prisma.interiorDevelopment.delete).mockResolvedValue({} as Partial<InteriorDevelopment> as InteriorDevelopment);

      const result = await developmentService.deleteDevelopment('dev-1');

      expect(result.success).toBe(true);
      expect(prisma.interiorDevelopment.delete).toHaveBeenCalledWith({
        where: { id: 'dev-1' },
      });
    });
  });

  describe('isDevelopmentCodeExists', () => {
    it('should return true if code exists', async () => {
      vi.mocked(prisma.interiorDevelopment.findFirst).mockResolvedValue({
        id: 'existing',
      } as Partial<InteriorDevelopment> as InteriorDevelopment);

      const result = await developmentService.isDevelopmentCodeExists('EXISTING_CODE');

      expect(result).toBe(true);
    });

    it('should return false if code does not exist', async () => {
      vi.mocked(prisma.interiorDevelopment.findFirst).mockResolvedValue(null);

      const result = await developmentService.isDevelopmentCodeExists('NEW_CODE');

      expect(result).toBe(false);
    });

    it('should exclude specific ID when checking', async () => {
      vi.mocked(prisma.interiorDevelopment.findFirst).mockResolvedValue(null);

      await developmentService.isDevelopmentCodeExists('CODE', 'exclude-id');

      expect(prisma.interiorDevelopment.findFirst).toHaveBeenCalledWith({
        where: {
          code: 'CODE',
          NOT: { id: 'exclude-id' },
        },
      });
    });
  });
});
