/**
 * Property Tests for Surcharge Service
 *
 * **Property 13: Surcharge condition AND logic**
 * For any surcharge with multiple conditions, the surcharge SHALL only
 * apply when ALL conditions are satisfied.
 *
 * **Validates: Requirements 8.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as surchargeService from './surcharge.service';
import { prisma } from '../../utils/prisma';
import type { SurchargeConditions, UnitType, UnitPosition } from './types';

// Mock prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    interiorSurcharge: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

describe('Surcharge Service - Property 13: Surcharge condition AND logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('evaluateSurchargeConditions', () => {
    it('should return true when no conditions are set', () => {
      const conditions: SurchargeConditions | null = null;
      const context = {
        floor: 15,
        area: 70,
        unitType: '2PN' as UnitType,
        position: 'CORNER' as UnitPosition,
      };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should return true when empty conditions object', () => {
      const conditions: SurchargeConditions = {};
      const context = {
        floor: 15,
        area: 70,
      };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should return true when single floor condition is met', () => {
      const conditions: SurchargeConditions = {
        minFloor: 10,
        maxFloor: 30,
      };
      const context = { floor: 15 };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should return false when floor is below minFloor', () => {
      const conditions: SurchargeConditions = {
        minFloor: 10,
        maxFloor: 30,
      };
      const context = { floor: 5 };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should return false when floor is above maxFloor', () => {
      const conditions: SurchargeConditions = {
        minFloor: 10,
        maxFloor: 30,
      };
      const context = { floor: 35 };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should return true when area condition is met', () => {
      const conditions: SurchargeConditions = {
        minArea: 50,
        maxArea: 100,
      };
      const context = { area: 70 };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should return false when area is below minArea', () => {
      const conditions: SurchargeConditions = {
        minArea: 50,
        maxArea: 100,
      };
      const context = { area: 40 };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should return true when unitType is in allowed list', () => {
      const conditions: SurchargeConditions = {
        unitTypes: ['2PN', '3PN'],
      };
      const context = { unitType: '2PN' as UnitType };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should return false when unitType is not in allowed list', () => {
      const conditions: SurchargeConditions = {
        unitTypes: ['2PN', '3PN'],
      };
      const context = { unitType: 'STUDIO' as UnitType };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should return true when position is in allowed list', () => {
      const conditions: SurchargeConditions = {
        positions: ['CORNER'],
      };
      const context = { position: 'CORNER' as UnitPosition };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should return false when position is not in allowed list', () => {
      const conditions: SurchargeConditions = {
        positions: ['CORNER'],
      };
      const context = { position: 'MIDDLE' as UnitPosition };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should return true when buildingId is in allowed list', () => {
      const conditions: SurchargeConditions = {
        buildings: ['building-1', 'building-2'],
      };
      const context = { buildingId: 'building-1' };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should return false when buildingId is not in allowed list', () => {
      const conditions: SurchargeConditions = {
        buildings: ['building-1', 'building-2'],
      };
      const context = { buildingId: 'building-3' };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    // AND logic tests - multiple conditions
    it('should return true when ALL conditions are met (AND logic)', () => {
      const conditions: SurchargeConditions = {
        minFloor: 20,
        maxFloor: 40,
        minArea: 60,
        maxArea: 100,
        unitTypes: ['2PN', '3PN'],
        positions: ['CORNER', 'EDGE'],
      };
      const context = {
        floor: 25,
        area: 70,
        unitType: '2PN' as UnitType,
        position: 'CORNER' as UnitPosition,
      };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(true);
    });

    it('should return false when floor condition fails (AND logic)', () => {
      const conditions: SurchargeConditions = {
        minFloor: 20,
        maxFloor: 40,
        unitTypes: ['2PN', '3PN'],
        positions: ['CORNER'],
      };
      const context = {
        floor: 15, // Fails - below minFloor
        unitType: '2PN' as UnitType,
        position: 'CORNER' as UnitPosition,
      };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should return false when unitType condition fails (AND logic)', () => {
      const conditions: SurchargeConditions = {
        minFloor: 20,
        maxFloor: 40,
        unitTypes: ['2PN', '3PN'],
        positions: ['CORNER'],
      };
      const context = {
        floor: 25, // Passes
        unitType: 'STUDIO' as UnitType, // Fails
        position: 'CORNER' as UnitPosition, // Passes
      };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should return false when position condition fails (AND logic)', () => {
      const conditions: SurchargeConditions = {
        minFloor: 20,
        maxFloor: 40,
        unitTypes: ['2PN', '3PN'],
        positions: ['CORNER'],
      };
      const context = {
        floor: 25, // Passes
        unitType: '2PN' as UnitType, // Passes
        position: 'MIDDLE' as UnitPosition, // Fails
      };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should return false when area condition fails (AND logic)', () => {
      const conditions: SurchargeConditions = {
        minFloor: 20,
        maxFloor: 40,
        minArea: 60,
        maxArea: 100,
        unitTypes: ['2PN'],
      };
      const context = {
        floor: 25, // Passes
        area: 50, // Fails - below minArea
        unitType: '2PN' as UnitType, // Passes
      };

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });

    it('should return false when context is missing required field', () => {
      const conditions: SurchargeConditions = {
        minFloor: 20,
      };
      const context = {}; // Missing floor

      const result = surchargeService.evaluateSurchargeConditions(conditions, context);

      expect(result).toBe(false);
    });
  });

  describe('calculateSurchargeAmount', () => {
    it('should calculate FIXED surcharge correctly', () => {
      const surcharge = {
        id: 's1',
        name: 'Phí cố định',
        code: 'FIXED_FEE',
        type: 'FIXED' as const,
        value: 5000000,
        conditions: null,
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const amount = surchargeService.calculateSurchargeAmount(surcharge, {});

      expect(amount).toBe(5000000);
    });

    it('should calculate PERCENTAGE surcharge correctly', () => {
      const surcharge = {
        id: 's1',
        name: 'Phí phần trăm',
        code: 'PERCENT_FEE',
        type: 'PERCENTAGE' as const,
        value: 5, // 5%
        conditions: null,
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const amount = surchargeService.calculateSurchargeAmount(surcharge, {
        baseAmount: 100000000,
      });

      expect(amount).toBe(5000000); // 5% of 100M
    });

    it('should calculate PER_FLOOR surcharge correctly', () => {
      const surcharge = {
        id: 's1',
        name: 'Phí theo tầng',
        code: 'FLOOR_FEE',
        type: 'PER_FLOOR' as const,
        value: 500000, // 500k per floor
        conditions: null,
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const amount = surchargeService.calculateSurchargeAmount(surcharge, {
        floor: 25,
      });

      expect(amount).toBe(12500000); // 500k * 25 floors
    });

    it('should calculate PER_SQM surcharge correctly', () => {
      const surcharge = {
        id: 's1',
        name: 'Phí theo m²',
        code: 'SQM_FEE',
        type: 'PER_SQM' as const,
        value: 100000, // 100k per sqm
        conditions: null,
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const amount = surchargeService.calculateSurchargeAmount(surcharge, {
        area: 70,
      });

      expect(amount).toBe(7000000); // 100k * 70 sqm
    });

    it('should calculate CONDITIONAL surcharge as fixed amount', () => {
      const surcharge = {
        id: 's1',
        name: 'Phí điều kiện',
        code: 'COND_FEE',
        type: 'CONDITIONAL' as const,
        value: 3000000,
        conditions: { minFloor: 20 },
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const amount = surchargeService.calculateSurchargeAmount(surcharge, {});

      expect(amount).toBe(3000000);
    });

    it('should return 0 for PERCENTAGE when baseAmount is missing', () => {
      const surcharge = {
        id: 's1',
        name: 'Phí phần trăm',
        code: 'PERCENT_FEE',
        type: 'PERCENTAGE' as const,
        value: 5,
        conditions: null,
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const amount = surchargeService.calculateSurchargeAmount(surcharge, {});

      expect(amount).toBe(0);
    });

    it('should return 0 for PER_FLOOR when floor is missing', () => {
      const surcharge = {
        id: 's1',
        name: 'Phí theo tầng',
        code: 'FLOOR_FEE',
        type: 'PER_FLOOR' as const,
        value: 500000,
        conditions: null,
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const amount = surchargeService.calculateSurchargeAmount(surcharge, {});

      expect(amount).toBe(0);
    });
  });

  describe('getApplicableSurcharges', () => {
    it('should return only surcharges that match all conditions', async () => {
      const mockSurcharges = [
        {
          id: 's1',
          name: 'Phí tầng cao',
          code: 'HIGH_FLOOR',
          type: 'FIXED',
          value: 5000000,
          conditions: JSON.stringify({ minFloor: 20 }),
          description: null,
          isAutoApply: true,
          isOptional: false,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 's2',
          name: 'Phí căn góc',
          code: 'CORNER_FEE',
          type: 'FIXED',
          value: 3000000,
          conditions: JSON.stringify({ positions: ['CORNER'] }),
          description: null,
          isAutoApply: true,
          isOptional: false,
          order: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.interiorSurcharge.findMany).mockResolvedValue(mockSurcharges);

      const result = await surchargeService.getApplicableSurcharges({
        floor: 25, // Matches s1
        position: 'MIDDLE' as UnitPosition, // Does not match s2
      });

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('HIGH_FLOOR');
    });

    it('should return all matching surcharges', async () => {
      const mockSurcharges = [
        {
          id: 's1',
          name: 'Phí tầng cao',
          code: 'HIGH_FLOOR',
          type: 'FIXED',
          value: 5000000,
          conditions: JSON.stringify({ minFloor: 20 }),
          description: null,
          isAutoApply: true,
          isOptional: false,
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 's2',
          name: 'Phí căn góc',
          code: 'CORNER_FEE',
          type: 'FIXED',
          value: 3000000,
          conditions: JSON.stringify({ positions: ['CORNER'] }),
          description: null,
          isAutoApply: true,
          isOptional: false,
          order: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.interiorSurcharge.findMany).mockResolvedValue(mockSurcharges);

      const result = await surchargeService.getApplicableSurcharges({
        floor: 25, // Matches s1
        position: 'CORNER' as UnitPosition, // Matches s2
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('testSurchargeConditions', () => {
    it('should return match result with calculated amount', async () => {
      const mockSurcharge = {
        id: 's1',
        name: 'Phí tầng cao',
        code: 'HIGH_FLOOR',
        type: 'PER_FLOOR',
        value: 500000,
        conditions: JSON.stringify({ minFloor: 20 }),
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.interiorSurcharge.findUnique).mockResolvedValue(mockSurcharge);

      const result = await surchargeService.testSurchargeConditions('s1', {
        floor: 25,
      });

      expect(result.matches).toBe(true);
      expect(result.amount).toBe(12500000); // 500k * 25
    });

    it('should return no match when conditions fail', async () => {
      const mockSurcharge = {
        id: 's1',
        name: 'Phí tầng cao',
        code: 'HIGH_FLOOR',
        type: 'FIXED',
        value: 5000000,
        conditions: JSON.stringify({ minFloor: 20 }),
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.interiorSurcharge.findUnique).mockResolvedValue(mockSurcharge);

      const result = await surchargeService.testSurchargeConditions('s1', {
        floor: 10, // Below minFloor
      });

      expect(result.matches).toBe(false);
      expect(result.amount).toBe(0);
    });

    it('should throw error when surcharge does not exist', async () => {
      vi.mocked(prisma.interiorSurcharge.findUnique).mockResolvedValue(null);

      await expect(
        surchargeService.testSurchargeConditions('non-existent', { floor: 25 })
      ).rejects.toThrow(/không tồn tại/);
    });
  });
});
