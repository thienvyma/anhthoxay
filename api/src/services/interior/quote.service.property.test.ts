/**
 * Property Tests for Quote Service
 *
 * **Property 15: Quote calculation formula**
 * For any quote calculation:
 * - laborCost = netArea × laborCostPerSqm (clamped by min/max if set)
 * - managementFee = subtotal × managementFeeValue/100 (if PERCENTAGE) or managementFeeValue (if FIXED)
 * - contingency = subtotal × contingencyValue/100 (if PERCENTAGE) or contingencyValue (if FIXED)
 * - subtotal = packagePrice + laborCost + surchargesTotal + managementFee + contingency
 * - vatAmount = subtotal × vatPercent/100 (if vatEnabled)
 * - grandTotal = subtotal + vatAmount - discount
 * - pricePerSqm = grandTotal / netArea
 *
 * **Validates: Requirements 15.2, 15.4**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import * as quoteService from './quote.service';
import * as quoteSettingsService from './quote-settings.service';
import * as surchargeService from './surcharge.service';
import { prisma } from '../../utils/prisma';
import type { InteriorBuildingUnit, InteriorPackage } from '@prisma/client';

// Mock prisma
vi.mock('../../utils/prisma', () => ({
  prisma: {
    interiorBuildingUnit: {
      findUnique: vi.fn(),
    },
    interiorPackage: {
      findUnique: vi.fn(),
    },
    interiorQuote: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    customerLead: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

// Mock quote settings service
vi.mock('./quote-settings.service', () => ({
  getQuoteSettings: vi.fn(),
}));

// Mock surcharge service
vi.mock('./surcharge.service', () => ({
  getApplicableSurcharges: vi.fn(),
  calculateSurchargeAmount: vi.fn(),
}));

describe('Quote Service - Property 15: Quote calculation formula', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: interior-quote-module, Property 15: Quote calculation formula**
   * **Validates: Requirements 15.2, 15.4**
   */
  it('should calculate quote components correctly for various inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          packagePrice: fc.float({ min: 10000000, max: 500000000, noNaN: true }),
          netArea: fc.float({ min: 30, max: 200, noNaN: true }),
          laborCostPerSqm: fc.float({ min: 300000, max: 800000, noNaN: true }),
          managementFeePercent: fc.float({ min: 0, max: 10, noNaN: true }),
          contingencyPercent: fc.float({ min: 0, max: 5, noNaN: true }),
          vatPercent: fc.float({ min: 0, max: 15, noNaN: true }),
          discount: fc.float({ min: 0, max: 10, noNaN: true }),
        }),
        async (input) => {
          // Setup mocks
          const mockBuildingUnit = {
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
              developmentId: 'dev-1',
              development: {
                id: 'dev-1',
                name: 'Vinhomes Grand Park',
                code: 'VGP',
              },
            },
            layout: {
              id: 'layout-1',
              name: 'Layout 2PN',
              code: 'L2PN',
              unitType: '2PN',
              bedrooms: 2,
              bathrooms: 2,
              grossArea: input.netArea * 1.15,
              netArea: input.netArea,
              rooms: JSON.stringify([
                { name: 'Phòng khách', area: input.netArea * 0.4, type: 'LIVING' },
                { name: 'Phòng ngủ', area: input.netArea * 0.3, type: 'BEDROOM_MASTER' },
              ]),
            },
          };

          const mockPackage = {
            id: 'pkg-1',
            layoutId: 'layout-1',
            name: 'Gói Basic',
            code: 'PKG-BASIC',
            tier: 1,
            description: null,
            shortDescription: null,
            basePrice: input.packagePrice,
            pricePerSqm: null,
            thumbnail: null,
            images: null,
            video360Url: null,
            items: JSON.stringify([]),
            totalItems: 0,
            totalItemsPrice: 0,
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
            },
          };

          const mockSettings = {
            id: 'default',
            laborCostPerSqm: input.laborCostPerSqm,
            laborCostMin: null,
            laborCostMax: null,
            managementFeeType: 'PERCENTAGE' as const,
            managementFeeValue: input.managementFeePercent,
            contingencyType: 'PERCENTAGE' as const,
            contingencyValue: input.contingencyPercent,
            vatEnabled: true,
            vatPercent: input.vatPercent,
            maxDiscountPercent: 15,
            quoteValidityDays: 30,
            customFormula: null,
            showItemBreakdown: true,
            showRoomBreakdown: true,
            showPricePerSqm: true,
            companyName: null,
            companyPhone: null,
            companyEmail: null,
            companyAddress: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(mockBuildingUnit as unknown as InteriorBuildingUnit);
          vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(mockPackage as unknown as InteriorPackage);
          vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
          vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

          // Calculate quote
          const result = await quoteService.calculateQuote({
            buildingUnitId: 'unit-1',
            floor: 15,
            packageId: 'pkg-1',
            discount: input.discount,
          });

          // Verify labor cost
          const expectedLaborCost = input.netArea * input.laborCostPerSqm;
          expect(result.priceBreakdown.laborCost).toBeCloseTo(expectedLaborCost, 0);

          // Verify base for fees
          const baseForFees = input.packagePrice + result.priceBreakdown.laborCost + result.priceBreakdown.surchargesTotal;

          // Verify management fee (percentage)
          const expectedManagementFee = (baseForFees * input.managementFeePercent) / 100;
          expect(result.priceBreakdown.managementFee).toBeCloseTo(expectedManagementFee, 0);

          // Verify contingency (percentage)
          const expectedContingency = (baseForFees * input.contingencyPercent) / 100;
          expect(result.priceBreakdown.contingency).toBeCloseTo(expectedContingency, 0);

          // Verify subtotal
          const expectedSubtotal = input.packagePrice +
            result.priceBreakdown.laborCost +
            result.priceBreakdown.surchargesTotal +
            result.priceBreakdown.managementFee +
            result.priceBreakdown.contingency;
          expect(result.priceBreakdown.subtotal).toBeCloseTo(expectedSubtotal, 0);

          // Verify VAT
          const expectedVat = (result.priceBreakdown.subtotal * input.vatPercent) / 100;
          expect(result.priceBreakdown.vatAmount).toBeCloseTo(expectedVat, 0);

          // Verify discount
          const expectedDiscount = (result.priceBreakdown.subtotal * input.discount) / 100;
          expect(result.priceBreakdown.discount).toBeCloseTo(expectedDiscount, 0);

          // Verify grand total
          const expectedGrandTotal = result.priceBreakdown.subtotal + result.priceBreakdown.vatAmount - result.priceBreakdown.discount;
          expect(result.priceBreakdown.grandTotal).toBeCloseTo(expectedGrandTotal, 0);

          // Verify price per sqm
          const expectedPricePerSqm = result.priceBreakdown.grandTotal / input.netArea;
          expect(result.priceBreakdown.pricePerSqm).toBeCloseTo(expectedPricePerSqm, 0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should clamp labor cost to min when below minimum', async () => {
    const mockBuildingUnit = {
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
        developmentId: 'dev-1',
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
        grossArea: 35,
        netArea: 30, // Small area
        rooms: JSON.stringify([]),
      },
    };

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
      items: JSON.stringify([]),
      totalItems: 0,
      totalItemsPrice: 0,
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
      },
    };

    const mockSettings = {
      id: 'default',
      laborCostPerSqm: 500000,
      laborCostMin: 20000000, // Min 20M
      laborCostMax: null,
      managementFeeType: 'PERCENTAGE' as const,
      managementFeeValue: 5,
      contingencyType: 'PERCENTAGE' as const,
      contingencyValue: 3,
      vatEnabled: true,
      vatPercent: 10,
      maxDiscountPercent: 15,
      quoteValidityDays: 30,
      customFormula: null,
      showItemBreakdown: true,
      showRoomBreakdown: true,
      showPricePerSqm: true,
      companyName: null,
      companyPhone: null,
      companyEmail: null,
      companyAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(mockBuildingUnit as unknown as InteriorBuildingUnit);
    vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(mockPackage as unknown as InteriorPackage);
    vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
    vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

    const result = await quoteService.calculateQuote({
      buildingUnitId: 'unit-1',
      floor: 15,
      packageId: 'pkg-1',
    });

    // 30 * 500000 = 15M < 20M min, so should be clamped to 20M
    expect(result.priceBreakdown.laborCost).toBe(20000000);
  });

  it('should clamp labor cost to max when above maximum', async () => {
    const mockBuildingUnit = {
      id: 'unit-1',
      buildingId: 'building-1',
      axis: 'A',
      unitType: '3PN',
      bedrooms: 3,
      bathrooms: 2,
      position: 'CORNER',
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
        developmentId: 'dev-1',
        development: {
          id: 'dev-1',
          name: 'Vinhomes',
          code: 'VH',
        },
      },
      layout: {
        id: 'layout-1',
        name: 'Layout 3PN',
        code: 'L3PN',
        unitType: '3PN',
        bedrooms: 3,
        bathrooms: 2,
        grossArea: 120,
        netArea: 100, // Large area
        rooms: JSON.stringify([]),
      },
    };

    const mockPackage = {
      id: 'pkg-1',
      layoutId: 'layout-1',
      name: 'Gói Premium',
      code: 'PKG-PREMIUM',
      tier: 3,
      description: null,
      shortDescription: null,
      basePrice: 200000000,
      pricePerSqm: null,
      thumbnail: null,
      images: null,
      video360Url: null,
      items: JSON.stringify([]),
      totalItems: 0,
      totalItemsPrice: 0,
      warrantyMonths: null,
      installationDays: null,
      order: 1,
      isActive: true,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      layout: {
        id: 'layout-1',
        name: 'Layout 3PN',
        code: 'L3PN',
        unitType: '3PN',
      },
    };

    const mockSettings = {
      id: 'default',
      laborCostPerSqm: 500000,
      laborCostMin: null,
      laborCostMax: 40000000, // Max 40M
      managementFeeType: 'PERCENTAGE' as const,
      managementFeeValue: 5,
      contingencyType: 'PERCENTAGE' as const,
      contingencyValue: 3,
      vatEnabled: true,
      vatPercent: 10,
      maxDiscountPercent: 15,
      quoteValidityDays: 30,
      customFormula: null,
      showItemBreakdown: true,
      showRoomBreakdown: true,
      showPricePerSqm: true,
      companyName: null,
      companyPhone: null,
      companyEmail: null,
      companyAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(mockBuildingUnit as unknown as InteriorBuildingUnit);
    vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(mockPackage as unknown as InteriorPackage);
    vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
    vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

    const result = await quoteService.calculateQuote({
      buildingUnitId: 'unit-1',
      floor: 15,
      packageId: 'pkg-1',
    });

    // 100 * 500000 = 50M > 40M max, so should be clamped to 40M
    expect(result.priceBreakdown.laborCost).toBe(40000000);
  });

  it('should handle VAT disabled', async () => {
    const mockBuildingUnit = {
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
        developmentId: 'dev-1',
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
        rooms: JSON.stringify([]),
      },
    };

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
      items: JSON.stringify([]),
      totalItems: 0,
      totalItemsPrice: 0,
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
      },
    };

    const mockSettings = {
      id: 'default',
      laborCostPerSqm: 500000,
      laborCostMin: null,
      laborCostMax: null,
      managementFeeType: 'PERCENTAGE' as const,
      managementFeeValue: 5,
      contingencyType: 'PERCENTAGE' as const,
      contingencyValue: 3,
      vatEnabled: false, // VAT disabled
      vatPercent: 10,
      maxDiscountPercent: 15,
      quoteValidityDays: 30,
      customFormula: null,
      showItemBreakdown: true,
      showRoomBreakdown: true,
      showPricePerSqm: true,
      companyName: null,
      companyPhone: null,
      companyEmail: null,
      companyAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(mockBuildingUnit as unknown as InteriorBuildingUnit);
    vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(mockPackage as unknown as InteriorPackage);
    vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
    vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

    const result = await quoteService.calculateQuote({
      buildingUnitId: 'unit-1',
      floor: 15,
      packageId: 'pkg-1',
    });

    expect(result.priceBreakdown.vatAmount).toBe(0);
  });

  it('should reject discount exceeding max allowed', async () => {
    const mockBuildingUnit = {
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
        developmentId: 'dev-1',
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
        rooms: JSON.stringify([]),
      },
    };

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
      items: JSON.stringify([]),
      totalItems: 0,
      totalItemsPrice: 0,
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
      },
    };

    const mockSettings = {
      id: 'default',
      laborCostPerSqm: 500000,
      laborCostMin: null,
      laborCostMax: null,
      managementFeeType: 'PERCENTAGE' as const,
      managementFeeValue: 5,
      contingencyType: 'PERCENTAGE' as const,
      contingencyValue: 3,
      vatEnabled: true,
      vatPercent: 10,
      maxDiscountPercent: 15, // Max 15%
      quoteValidityDays: 30,
      customFormula: null,
      showItemBreakdown: true,
      showRoomBreakdown: true,
      showPricePerSqm: true,
      companyName: null,
      companyPhone: null,
      companyEmail: null,
      companyAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(mockBuildingUnit as unknown as InteriorBuildingUnit);
    vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(mockPackage as unknown as InteriorPackage);
    vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
    vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

    await expect(
      quoteService.calculateQuote({
        buildingUnitId: 'unit-1',
        floor: 15,
        packageId: 'pkg-1',
        discount: 20, // Exceeds max 15%
      })
    ).rejects.toThrow(/15%/);
  });
});


describe('Quote Service - Property 14: Auto-apply surcharge inclusion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: interior-quote-module, Property 14: Auto-apply surcharge inclusion**
   * For any quote calculation, all active surcharges with isAutoApply=true
   * and matching conditions SHALL be included in the surcharges array.
   *
   * **Validates: Requirements 8.4**
   */
  it('should include all auto-apply surcharges that match conditions', async () => {
    const mockBuildingUnit = {
      id: 'unit-1',
      buildingId: 'building-1',
      axis: 'A',
      unitType: '2PN',
      bedrooms: 2,
      bathrooms: 2,
      position: 'CORNER',
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
        developmentId: 'dev-1',
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
        rooms: JSON.stringify([]),
      },
    };

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
      items: JSON.stringify([]),
      totalItems: 0,
      totalItemsPrice: 0,
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
      },
    };

    const mockSettings = {
      id: 'default',
      laborCostPerSqm: 500000,
      laborCostMin: null,
      laborCostMax: null,
      managementFeeType: 'PERCENTAGE' as const,
      managementFeeValue: 5,
      contingencyType: 'PERCENTAGE' as const,
      contingencyValue: 3,
      vatEnabled: true,
      vatPercent: 10,
      maxDiscountPercent: 15,
      quoteValidityDays: 30,
      customFormula: null,
      showItemBreakdown: true,
      showRoomBreakdown: true,
      showPricePerSqm: true,
      companyName: null,
      companyPhone: null,
      companyEmail: null,
      companyAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock surcharges - 2 auto-apply surcharges that should match
    const mockSurcharges = [
      {
        id: 'surcharge-1',
        name: 'Phụ phí tầng cao',
        code: 'HIGH_FLOOR',
        type: 'PER_FLOOR' as const,
        value: 500000, // 500k per floor
        conditions: { minFloor: 10 },
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'surcharge-2',
        name: 'Phụ phí căn góc',
        code: 'CORNER_UNIT',
        type: 'FIXED' as const,
        value: 5000000, // 5M fixed
        conditions: { positions: ['CORNER'] },
        description: null,
        isAutoApply: true,
        isOptional: false,
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(mockBuildingUnit as unknown as InteriorBuildingUnit);
    vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(mockPackage as unknown as InteriorPackage);
    vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
    vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue(mockSurcharges);
    vi.mocked(surchargeService.calculateSurchargeAmount)
      .mockReturnValueOnce(7500000) // 15 floors * 500k = 7.5M
      .mockReturnValueOnce(5000000); // 5M fixed

    const result = await quoteService.calculateQuote({
      buildingUnitId: 'unit-1',
      floor: 15, // High floor
      packageId: 'pkg-1',
    });

    // Should have 2 surcharges
    expect(result.priceBreakdown.surcharges).toHaveLength(2);
    expect(result.priceBreakdown.surcharges[0].name).toBe('Phụ phí tầng cao');
    expect(result.priceBreakdown.surcharges[0].amount).toBe(7500000);
    expect(result.priceBreakdown.surcharges[1].name).toBe('Phụ phí căn góc');
    expect(result.priceBreakdown.surcharges[1].amount).toBe(5000000);

    // Total surcharges should be sum
    expect(result.priceBreakdown.surchargesTotal).toBe(12500000);
  });

  it('should not include surcharges that do not match conditions', async () => {
    const mockBuildingUnit = {
      id: 'unit-1',
      buildingId: 'building-1',
      axis: 'A',
      unitType: '2PN',
      bedrooms: 2,
      bathrooms: 2,
      position: 'MIDDLE', // Not CORNER
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
        developmentId: 'dev-1',
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
        rooms: JSON.stringify([]),
      },
    };

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
      items: JSON.stringify([]),
      totalItems: 0,
      totalItemsPrice: 0,
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
      },
    };

    const mockSettings = {
      id: 'default',
      laborCostPerSqm: 500000,
      laborCostMin: null,
      laborCostMax: null,
      managementFeeType: 'PERCENTAGE' as const,
      managementFeeValue: 5,
      contingencyType: 'PERCENTAGE' as const,
      contingencyValue: 3,
      vatEnabled: true,
      vatPercent: 10,
      maxDiscountPercent: 15,
      quoteValidityDays: 30,
      customFormula: null,
      showItemBreakdown: true,
      showRoomBreakdown: true,
      showPricePerSqm: true,
      companyName: null,
      companyPhone: null,
      companyEmail: null,
      companyAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // No surcharges match (floor 5 < minFloor 10, position MIDDLE != CORNER)
    vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(mockBuildingUnit as unknown as InteriorBuildingUnit);
    vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(mockPackage as unknown as InteriorPackage);
    vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
    vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]); // No matching surcharges

    const result = await quoteService.calculateQuote({
      buildingUnitId: 'unit-1',
      floor: 5, // Low floor
      packageId: 'pkg-1',
    });

    // Should have no surcharges
    expect(result.priceBreakdown.surcharges).toHaveLength(0);
    expect(result.priceBreakdown.surchargesTotal).toBe(0);
  });

  it('should handle empty surcharges array', async () => {
    const mockBuildingUnit = {
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
        developmentId: 'dev-1',
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
        rooms: JSON.stringify([]),
      },
    };

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
      items: JSON.stringify([]),
      totalItems: 0,
      totalItemsPrice: 0,
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
      },
    };

    const mockSettings = {
      id: 'default',
      laborCostPerSqm: 500000,
      laborCostMin: null,
      laborCostMax: null,
      managementFeeType: 'PERCENTAGE' as const,
      managementFeeValue: 5,
      contingencyType: 'PERCENTAGE' as const,
      contingencyValue: 3,
      vatEnabled: true,
      vatPercent: 10,
      maxDiscountPercent: 15,
      quoteValidityDays: 30,
      customFormula: null,
      showItemBreakdown: true,
      showRoomBreakdown: true,
      showPricePerSqm: true,
      companyName: null,
      companyPhone: null,
      companyEmail: null,
      companyAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(mockBuildingUnit as unknown as InteriorBuildingUnit);
    vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(mockPackage as unknown as InteriorPackage);
    vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
    vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

    const result = await quoteService.calculateQuote({
      buildingUnitId: 'unit-1',
      floor: 15,
      packageId: 'pkg-1',
    });

    expect(result.priceBreakdown.surcharges).toEqual([]);
    expect(result.priceBreakdown.surchargesTotal).toBe(0);

    // Verify subtotal calculation without surcharges
    const expectedLaborCost = 60 * 500000; // 30M
    const baseForFees = 100000000 + expectedLaborCost + 0; // package + labor + surcharges
    const expectedManagementFee = (baseForFees * 5) / 100;
    const expectedContingency = (baseForFees * 3) / 100;
    const expectedSubtotal = 100000000 + expectedLaborCost + 0 + expectedManagementFee + expectedContingency;

    expect(result.priceBreakdown.subtotal).toBeCloseTo(expectedSubtotal, 0);
  });
});

describe('Quote Service - Property 16: Quote code uniqueness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: interior-quote-module, Property 16: Quote code uniqueness**
   * For any saved quote, the generated code SHALL be unique and follow format INT-YYYY-NNN.
   *
   * **Validates: Requirements 18.6**
   */
  it('should generate unique quote codes in INT-YYYY-NNN format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (existingCount) => {
          const year = new Date().getFullYear();
          const prefix = `INT-${year}-`;

          // Mock existing quote with highest number
          if (existingCount > 0) {
            vi.mocked(prisma.interiorQuote.findFirst).mockResolvedValue({
              code: `${prefix}${existingCount.toString().padStart(3, '0')}`,
            } as never);
          } else {
            vi.mocked(prisma.interiorQuote.findFirst).mockResolvedValue(null);
          }

          // Mock save quote dependencies
          const mockBuildingUnit = createMockBuildingUnit();
          const mockPackage = createMockPackage();
          const mockSettings = createMockSettings();

          vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(
            mockBuildingUnit as unknown as InteriorBuildingUnit
          );
          vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(
            mockPackage as unknown as InteriorPackage
          );
          vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
          vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

          // Mock transaction
          const expectedCode = `${prefix}${(existingCount + 1).toString().padStart(3, '0')}`;
          vi.mocked(prisma.interiorQuote.create).mockResolvedValue({
            id: 'quote-1',
            code: expectedCode,
            customerName: 'Test',
            customerPhone: '0901234567',
            customerEmail: null,
            developmentName: 'Vinhomes',
            buildingName: 'S1.01',
            unitCode: 'S101.15.A',
            floor: 15,
            axis: 'A',
            unitType: '2PN',
            layoutName: 'Layout 2PN',
            grossArea: 70,
            netArea: 60,
            packageId: 'pkg-1',
            packageName: 'Gói Basic',
            packageTier: 1,
            packagePrice: 100000000,
            laborCost: 30000000,
            surcharges: '[]',
            surchargesTotal: 0,
            managementFee: 6500000,
            contingency: 3900000,
            subtotal: 140400000,
            vatAmount: 14040000,
            discount: 0,
            grandTotal: 154440000,
            pricePerSqm: 2574000,
            status: 'DRAFT',
            validUntil: new Date(),
            notes: null,
            internalNotes: null,
            sentAt: null,
            viewedAt: null,
            acceptedAt: null,
            rejectedAt: null,
            rejectionReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            package: mockPackage,
          } as never);

          vi.mocked(prisma.customerLead.create).mockResolvedValue({} as never);

          const result = await quoteService.saveQuote({
            buildingUnitId: 'unit-1',
            floor: 15,
            packageId: 'pkg-1',
            customerName: 'Test',
            customerPhone: '0901234567',
          });

          // Verify code format
          expect(result.code).toMatch(/^INT-\d{4}-\d{3}$/);
          expect(result.code).toBe(expectedCode);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should start from 001 when no quotes exist for current year', async () => {
    vi.mocked(prisma.interiorQuote.findFirst).mockResolvedValue(null);

    const mockBuildingUnit = createMockBuildingUnit();
    const mockPackage = createMockPackage();
    const mockSettings = createMockSettings();

    vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(
      mockBuildingUnit as unknown as InteriorBuildingUnit
    );
    vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(
      mockPackage as unknown as InteriorPackage
    );
    vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
    vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

    const year = new Date().getFullYear();
    const expectedCode = `INT-${year}-001`;

    vi.mocked(prisma.interiorQuote.create).mockResolvedValue({
      id: 'quote-1',
      code: expectedCode,
      customerName: 'Test',
      customerPhone: '0901234567',
      customerEmail: null,
      developmentName: 'Vinhomes',
      buildingName: 'S1.01',
      unitCode: 'S101.15.A',
      floor: 15,
      axis: 'A',
      unitType: '2PN',
      layoutName: 'Layout 2PN',
      grossArea: 70,
      netArea: 60,
      packageId: 'pkg-1',
      packageName: 'Gói Basic',
      packageTier: 1,
      packagePrice: 100000000,
      laborCost: 30000000,
      surcharges: '[]',
      surchargesTotal: 0,
      managementFee: 6500000,
      contingency: 3900000,
      subtotal: 140400000,
      vatAmount: 14040000,
      discount: 0,
      grandTotal: 154440000,
      pricePerSqm: 2574000,
      status: 'DRAFT',
      validUntil: new Date(),
      notes: null,
      internalNotes: null,
      sentAt: null,
      viewedAt: null,
      acceptedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      package: mockPackage,
    } as never);

    vi.mocked(prisma.customerLead.create).mockResolvedValue({} as never);

    const result = await quoteService.saveQuote({
      buildingUnitId: 'unit-1',
      floor: 15,
      packageId: 'pkg-1',
      customerName: 'Test',
      customerPhone: '0901234567',
    });

    expect(result.code).toBe(expectedCode);
  });
});

describe('Quote Service - Property 17: Quote validity expiration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: interior-quote-module, Property 17: Quote validity expiration**
   * For any quote with status DRAFT/SENT/VIEWED and validUntil < now,
   * the updateExpiredQuotes function SHALL change status to EXPIRED.
   *
   * **Validates: Requirements 17.6**
   */
  it('should mark expired quotes as EXPIRED', async () => {
    const expiredCount = 5;
    vi.mocked(prisma.interiorQuote.updateMany).mockResolvedValue({ count: expiredCount });

    const result = await quoteService.updateExpiredQuotes();

    expect(result).toBe(expiredCount);
    expect(prisma.interiorQuote.updateMany).toHaveBeenCalledWith({
      where: {
        status: { in: ['DRAFT', 'SENT', 'VIEWED'] },
        validUntil: { lt: expect.any(Date) },
      },
      data: {
        status: 'EXPIRED',
      },
    });
  });

  it('should not affect quotes with status ACCEPTED/REJECTED/EXPIRED', async () => {
    vi.mocked(prisma.interiorQuote.updateMany).mockResolvedValue({ count: 0 });

    const result = await quoteService.updateExpiredQuotes();

    expect(result).toBe(0);
    // Verify the where clause only includes DRAFT, SENT, VIEWED
    expect(prisma.interiorQuote.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['DRAFT', 'SENT', 'VIEWED'] },
        }),
      })
    );
  });
});

describe('Quote Service - Property 20: CustomerLead creation from quote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: interior-quote-module, Property 20: CustomerLead creation from quote**
   * For any saved quote, a CustomerLead SHALL be created with source="INTERIOR_QUOTE".
   *
   * **Validates: Requirements 20.4**
   */
  it('should create CustomerLead with INTERIOR_QUOTE source when saving quote', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          customerName: fc.string({ minLength: 1, maxLength: 100 }),
          customerPhone: fc.stringMatching(/^0[0-9]{9}$/),
          customerEmail: fc.option(fc.emailAddress(), { nil: undefined }),
        }),
        async (customer) => {
          vi.mocked(prisma.interiorQuote.findFirst).mockResolvedValue(null);

          const mockBuildingUnit = createMockBuildingUnit();
          const mockPackage = createMockPackage();
          const mockSettings = createMockSettings();

          vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(
            mockBuildingUnit as unknown as InteriorBuildingUnit
          );
          vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(
            mockPackage as unknown as InteriorPackage
          );
          vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
          vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

          const year = new Date().getFullYear();
          vi.mocked(prisma.interiorQuote.create).mockResolvedValue({
            id: 'quote-1',
            code: `INT-${year}-001`,
            customerName: customer.customerName,
            customerPhone: customer.customerPhone,
            customerEmail: customer.customerEmail ?? null,
            developmentName: 'Vinhomes',
            buildingName: 'S1.01',
            unitCode: 'S101.15.A',
            floor: 15,
            axis: 'A',
            unitType: '2PN',
            layoutName: 'Layout 2PN',
            grossArea: 70,
            netArea: 60,
            packageId: 'pkg-1',
            packageName: 'Gói Basic',
            packageTier: 1,
            packagePrice: 100000000,
            laborCost: 30000000,
            surcharges: '[]',
            surchargesTotal: 0,
            managementFee: 6500000,
            contingency: 3900000,
            subtotal: 140400000,
            vatAmount: 14040000,
            discount: 0,
            grandTotal: 154440000,
            pricePerSqm: 2574000,
            status: 'DRAFT',
            validUntil: new Date(),
            notes: null,
            internalNotes: null,
            sentAt: null,
            viewedAt: null,
            acceptedAt: null,
            rejectedAt: null,
            rejectionReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            package: mockPackage,
          } as never);

          vi.mocked(prisma.customerLead.create).mockResolvedValue({} as never);

          await quoteService.saveQuote({
            buildingUnitId: 'unit-1',
            floor: 15,
            packageId: 'pkg-1',
            customerName: customer.customerName,
            customerPhone: customer.customerPhone,
            customerEmail: customer.customerEmail,
          });

          // Verify CustomerLead was created with correct data
          expect(prisma.customerLead.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              name: customer.customerName,
              phone: customer.customerPhone,
              email: customer.customerEmail ?? null,
              source: 'INTERIOR_QUOTE',
              status: 'NEW',
            }),
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should include quote details in CustomerLead quoteData', async () => {
    vi.mocked(prisma.interiorQuote.findFirst).mockResolvedValue(null);

    const mockBuildingUnit = createMockBuildingUnit();
    const mockPackage = createMockPackage();
    const mockSettings = createMockSettings();

    vi.mocked(prisma.interiorBuildingUnit.findUnique).mockResolvedValue(
      mockBuildingUnit as unknown as InteriorBuildingUnit
    );
    vi.mocked(prisma.interiorPackage.findUnique).mockResolvedValue(
      mockPackage as unknown as InteriorPackage
    );
    vi.mocked(quoteSettingsService.getQuoteSettings).mockResolvedValue(mockSettings);
    vi.mocked(surchargeService.getApplicableSurcharges).mockResolvedValue([]);

    const year = new Date().getFullYear();
    const quoteCode = `INT-${year}-001`;

    vi.mocked(prisma.interiorQuote.create).mockResolvedValue({
      id: 'quote-1',
      code: quoteCode,
      customerName: 'Nguyen Van A',
      customerPhone: '0901234567',
      customerEmail: null,
      developmentName: 'Vinhomes Grand Park',
      buildingName: 'S1.01',
      unitCode: 'S101.15.A',
      floor: 15,
      axis: 'A',
      unitType: '2PN',
      layoutName: 'Layout 2PN',
      grossArea: 70,
      netArea: 60,
      packageId: 'pkg-1',
      packageName: 'Gói Basic',
      packageTier: 1,
      packagePrice: 100000000,
      laborCost: 30000000,
      surcharges: '[]',
      surchargesTotal: 0,
      managementFee: 6500000,
      contingency: 3900000,
      subtotal: 140400000,
      vatAmount: 14040000,
      discount: 0,
      grandTotal: 154440000,
      pricePerSqm: 2574000,
      status: 'DRAFT',
      validUntil: new Date(),
      notes: null,
      internalNotes: null,
      sentAt: null,
      viewedAt: null,
      acceptedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      package: mockPackage,
    } as never);

    vi.mocked(prisma.customerLead.create).mockResolvedValue({} as never);

    await quoteService.saveQuote({
      buildingUnitId: 'unit-1',
      floor: 15,
      packageId: 'pkg-1',
      customerName: 'Nguyen Van A',
      customerPhone: '0901234567',
    });

    // Verify quoteData contains expected fields
    expect(prisma.customerLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quoteData: expect.stringContaining('quoteCode'),
      }),
    });

    const createCall = vi.mocked(prisma.customerLead.create).mock.calls[0][0];
    const quoteData = JSON.parse(createCall.data.quoteData as string);

    expect(quoteData).toMatchObject({
      quoteCode: quoteCode,
      unitCode: 'S101.15.A',
      developmentName: 'Vinhomes Grand Park',
      buildingName: 'S1.01',
      packageName: 'Gói Basic',
    });
    expect(quoteData.grandTotal).toBeGreaterThan(0);
  });
});

// Helper functions for creating mock data
function createMockBuildingUnit() {
  return {
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
      developmentId: 'dev-1',
      development: {
        id: 'dev-1',
        name: 'Vinhomes Grand Park',
        code: 'VGP',
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
      rooms: JSON.stringify([]),
    },
  };
}

function createMockPackage() {
  return {
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
    items: JSON.stringify([]),
    totalItems: 0,
    totalItemsPrice: 0,
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
    },
  };
}

function createMockSettings() {
  return {
    id: 'default',
    laborCostPerSqm: 500000,
    laborCostMin: null,
    laborCostMax: null,
    managementFeeType: 'PERCENTAGE' as const,
    managementFeeValue: 5,
    contingencyType: 'PERCENTAGE' as const,
    contingencyValue: 3,
    vatEnabled: true,
    vatPercent: 10,
    maxDiscountPercent: 15,
    quoteValidityDays: 30,
    customFormula: null,
    showItemBreakdown: true,
    showRoomBreakdown: true,
    showPricePerSqm: true,
    companyName: null,
    companyPhone: null,
    companyEmail: null,
    companyAddress: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
