/**
 * Property Tests for Interior Schema Validation
 *
 * **Property 19: Validation error specificity**
 * For any invalid API request, the error response SHALL include
 * field-specific error messages for each invalid field.
 *
 * **Validates: Requirements 18.4**
 */

import { describe, it, expect } from 'vitest';
import {
  CreateDeveloperSchema,
  CreateDevelopmentSchema,
  CreateBuildingSchema,
  CreateBuildingUnitSchema,
  CreateLayoutSchema,
  CreatePackageSchema,
  CreateSurchargeSchema,
  SaveQuoteSchema,
  LayoutRoomSchema,
  PackageItemSchema,
  SurchargeConditionsSchema,
} from './interior.schema';

describe('Interior Schema Validation - Property 19', () => {
  describe('CreateDeveloperSchema', () => {
    it('should return field-specific error for missing name', () => {
      const result = CreateDeveloperSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
        // Check that error message exists (may be in Vietnamese or English)
        expect(errors.name?.[0]).toBeDefined();
      }
    });

    it('should return field-specific error for invalid email', () => {
      const result = CreateDeveloperSchema.safeParse({
        name: 'Test Developer',
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.email).toBeDefined();
      }
    });

    it('should return field-specific error for invalid URL', () => {
      const result = CreateDeveloperSchema.safeParse({
        name: 'Test Developer',
        website: 'not-a-url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.website).toBeDefined();
      }
    });

    it('should accept valid developer data', () => {
      const result = CreateDeveloperSchema.safeParse({
        name: 'Vingroup',
        email: 'contact@vingroup.net',
        website: 'https://vingroup.net',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateDevelopmentSchema', () => {
    it('should return field-specific errors for missing required fields', () => {
      const result = CreateDevelopmentSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.developerId).toBeDefined();
        expect(errors.name).toBeDefined();
        expect(errors.code).toBeDefined();
      }
    });

    it('should return field-specific error for invalid year', () => {
      const result = CreateDevelopmentSchema.safeParse({
        developerId: 'dev-1',
        name: 'Test Development',
        code: 'TD001',
        startYear: 1800, // Invalid - too old
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.startYear).toBeDefined();
      }
    });

    it('should accept valid development data', () => {
      const result = CreateDevelopmentSchema.safeParse({
        developerId: 'dev-1',
        name: 'Vinhomes Grand Park',
        code: 'VGP',
        startYear: 2020,
        completionYear: 2025,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateBuildingSchema', () => {
    it('should return field-specific errors for missing required fields', () => {
      const result = CreateBuildingSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.developmentId).toBeDefined();
        expect(errors.name).toBeDefined();
        expect(errors.code).toBeDefined();
        expect(errors.totalFloors).toBeDefined();
        expect(errors.axisLabels).toBeDefined();
        expect(errors.unitsPerFloor).toBeDefined();
      }
    });

    it('should return field-specific error for invalid floor count', () => {
      const result = CreateBuildingSchema.safeParse({
        developmentId: 'dev-1',
        name: 'S1.01',
        code: 'S101',
        totalFloors: 0, // Invalid - must be >= 1
        axisLabels: ['A', 'B'],
        unitsPerFloor: 8,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.totalFloors).toBeDefined();
      }
    });

    it('should return field-specific error for empty axis labels', () => {
      const result = CreateBuildingSchema.safeParse({
        developmentId: 'dev-1',
        name: 'S1.01',
        code: 'S101',
        totalFloors: 30,
        axisLabels: [], // Invalid - must have at least 1
        unitsPerFloor: 8,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.axisLabels).toBeDefined();
      }
    });

    it('should accept valid building data', () => {
      const result = CreateBuildingSchema.safeParse({
        developmentId: 'dev-1',
        name: 'S1.01',
        code: 'S101',
        totalFloors: 30,
        axisLabels: ['A', 'B', 'C', 'D'],
        unitsPerFloor: 8,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateBuildingUnitSchema', () => {
    it('should return field-specific errors for missing required fields', () => {
      const result = CreateBuildingUnitSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.buildingId).toBeDefined();
        expect(errors.axis).toBeDefined();
        expect(errors.unitType).toBeDefined();
        expect(errors.bedrooms).toBeDefined();
        expect(errors.layoutId).toBeDefined();
      }
    });

    it('should return field-specific error for invalid unit type', () => {
      const result = CreateBuildingUnitSchema.safeParse({
        buildingId: 'bld-1',
        axis: 'A',
        unitType: 'INVALID_TYPE',
        bedrooms: 2,
        layoutId: 'layout-1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.unitType).toBeDefined();
      }
    });

    it('should accept valid building unit data', () => {
      const result = CreateBuildingUnitSchema.safeParse({
        buildingId: 'bld-1',
        axis: 'A',
        unitType: '2PN',
        bedrooms: 2,
        layoutId: 'layout-1',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateLayoutSchema', () => {
    it('should return field-specific errors for missing required fields', () => {
      const result = CreateLayoutSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
        expect(errors.code).toBeDefined();
        expect(errors.unitType).toBeDefined();
        expect(errors.bedrooms).toBeDefined();
        expect(errors.grossArea).toBeDefined();
        expect(errors.netArea).toBeDefined();
        expect(errors.rooms).toBeDefined();
      }
    });

    it('should return field-specific error for invalid area', () => {
      const result = CreateLayoutSchema.safeParse({
        name: 'Layout 2PN',
        code: 'L2PN-01',
        unitType: '2PN',
        bedrooms: 2,
        grossArea: 0, // Invalid - must be > 0
        netArea: 60,
        rooms: [{ name: 'Living', area: 20, type: 'LIVING' }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.grossArea).toBeDefined();
      }
    });

    it('should return field-specific error for empty rooms', () => {
      const result = CreateLayoutSchema.safeParse({
        name: 'Layout 2PN',
        code: 'L2PN-01',
        unitType: '2PN',
        bedrooms: 2,
        grossArea: 70,
        netArea: 60,
        rooms: [], // Invalid - must have at least 1
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.rooms).toBeDefined();
      }
    });

    it('should accept valid layout data', () => {
      const result = CreateLayoutSchema.safeParse({
        name: 'Layout 2PN',
        code: 'L2PN-01',
        unitType: '2PN',
        bedrooms: 2,
        grossArea: 70,
        netArea: 60,
        rooms: [
          { name: 'Phòng khách', area: 20, type: 'LIVING' },
          { name: 'Phòng ngủ 1', area: 15, type: 'BEDROOM_MASTER' },
          { name: 'Phòng ngủ 2', area: 12, type: 'BEDROOM' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('CreatePackageSchema', () => {
    it('should return field-specific errors for missing required fields', () => {
      const result = CreatePackageSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.layoutId).toBeDefined();
        expect(errors.name).toBeDefined();
        expect(errors.code).toBeDefined();
        expect(errors.basePrice).toBeDefined();
        expect(errors.items).toBeDefined();
      }
    });

    it('should return field-specific error for invalid tier', () => {
      const result = CreatePackageSchema.safeParse({
        layoutId: 'layout-1',
        name: 'Gói Basic',
        code: 'PKG-BASIC',
        basePrice: 100000000,
        tier: 5, // Invalid - must be 1-4
        items: [{ room: 'Living', items: [{ name: 'Sofa', qty: 1, price: 5000000 }] }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.tier).toBeDefined();
      }
    });

    it('should accept valid package data', () => {
      const result = CreatePackageSchema.safeParse({
        layoutId: 'layout-1',
        name: 'Gói Basic',
        code: 'PKG-BASIC',
        basePrice: 100000000,
        tier: 1,
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
      expect(result.success).toBe(true);
    });
  });

  describe('CreateSurchargeSchema', () => {
    it('should return field-specific errors for missing required fields', () => {
      const result = CreateSurchargeSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
        expect(errors.code).toBeDefined();
        expect(errors.type).toBeDefined();
        expect(errors.value).toBeDefined();
      }
    });

    it('should return field-specific error for invalid surcharge type', () => {
      const result = CreateSurchargeSchema.safeParse({
        name: 'Phụ phí tầng cao',
        code: 'HIGH_FLOOR',
        type: 'INVALID_TYPE',
        value: 1000000,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.type).toBeDefined();
      }
    });

    it('should accept valid surcharge data with conditions', () => {
      const result = CreateSurchargeSchema.safeParse({
        name: 'Phụ phí tầng cao',
        code: 'HIGH_FLOOR',
        type: 'PER_FLOOR',
        value: 500000,
        conditions: {
          minFloor: 20,
          maxFloor: 50,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('SaveQuoteSchema', () => {
    it('should return field-specific errors for missing customer info', () => {
      const result = SaveQuoteSchema.safeParse({
        buildingUnitId: 'unit-1',
        floor: 15,
        packageId: 'pkg-1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.customerName).toBeDefined();
        expect(errors.customerPhone).toBeDefined();
      }
    });

    it('should return field-specific error for invalid email', () => {
      const result = SaveQuoteSchema.safeParse({
        buildingUnitId: 'unit-1',
        floor: 15,
        packageId: 'pkg-1',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0901234567',
        customerEmail: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.customerEmail).toBeDefined();
      }
    });

    it('should accept valid quote save data', () => {
      const result = SaveQuoteSchema.safeParse({
        buildingUnitId: 'unit-1',
        floor: 15,
        packageId: 'pkg-1',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0901234567',
        customerEmail: 'nguyenvana@email.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('LayoutRoomSchema', () => {
    it('should return field-specific error for missing room name', () => {
      const result = LayoutRoomSchema.safeParse({
        area: 20,
        type: 'LIVING',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
      }
    });

    it('should return field-specific error for negative area', () => {
      const result = LayoutRoomSchema.safeParse({
        name: 'Phòng khách',
        area: -5, // Invalid
        type: 'LIVING',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.area).toBeDefined();
      }
    });

    it('should return field-specific error for invalid room type', () => {
      const result = LayoutRoomSchema.safeParse({
        name: 'Phòng khách',
        area: 20,
        type: 'INVALID_TYPE',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.type).toBeDefined();
      }
    });
  });

  describe('PackageItemSchema', () => {
    it('should return field-specific error for missing item name', () => {
      const result = PackageItemSchema.safeParse({
        qty: 1,
        price: 5000000,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
      }
    });

    it('should return field-specific error for invalid quantity', () => {
      const result = PackageItemSchema.safeParse({
        name: 'Sofa',
        qty: 0, // Invalid - must be >= 1
        price: 5000000,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.qty).toBeDefined();
      }
    });

    it('should return field-specific error for negative price', () => {
      const result = PackageItemSchema.safeParse({
        name: 'Sofa',
        qty: 1,
        price: -1000, // Invalid
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.price).toBeDefined();
      }
    });
  });

  describe('SurchargeConditionsSchema', () => {
    it('should accept empty conditions', () => {
      const result = SurchargeConditionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid floor range conditions', () => {
      const result = SurchargeConditionsSchema.safeParse({
        minFloor: 10,
        maxFloor: 30,
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid unit type conditions', () => {
      const result = SurchargeConditionsSchema.safeParse({
        unitTypes: ['2PN', '3PN'],
        positions: ['CORNER'],
      });
      expect(result.success).toBe(true);
    });

    it('should return error for invalid unit type in array', () => {
      const result = SurchargeConditionsSchema.safeParse({
        unitTypes: ['INVALID_TYPE'],
      });
      expect(result.success).toBe(false);
    });
  });
});
