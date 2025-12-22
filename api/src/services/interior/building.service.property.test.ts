import * as fc from 'fast-check';
import {
  generateUnitCode,
  parseUnitCode,
  validateFloorRange,
  validateAxisLabels,
} from './building.service';

/**
 * Property tests for Interior Building Service
 */
describe('Interior Building Service - Property Tests', () => {
  /**
   * **Feature: interior-quote-module, Property 5: Floor range validation**
   * **Validates: Requirements 3.3**
   * 
   * For any building configuration, startFloor SHALL be less than or equal to endFloor,
   * and both SHALL be within 1 to totalFloors range.
   */
  describe('Property 5: Floor range validation', () => {
    it('should accept valid floor ranges', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalFloors
          fc.integer({ min: 1, max: 100 }), // startFloor
          fc.integer({ min: 1, max: 100 }), // endFloor
          (totalFloors, startFloor, endFloor) => {
            // Only test valid combinations
            if (startFloor <= endFloor && endFloor <= totalFloors) {
              const result = validateFloorRange(startFloor, endFloor, totalFloors);
              expect(result.valid).toBe(true);
              expect(result.error).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject when startFloor > endFloor', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalFloors
          fc.integer({ min: 2, max: 100 }), // startFloor (at least 2 to ensure > endFloor possible)
          (totalFloors, startFloor) => {
            const endFloor = startFloor - 1; // Always less than startFloor
            const result = validateFloorRange(startFloor, endFloor, totalFloors);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('nhỏ hơn hoặc bằng');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject when endFloor > totalFloors', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // totalFloors
          (totalFloors) => {
            const startFloor = 1; // Fixed startFloor to avoid startFloor > endFloor error
            const endFloor = totalFloors + 1; // Always exceeds totalFloors
            const result = validateFloorRange(startFloor, endFloor, totalFloors);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('vượt quá');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle null endFloor (defaults to totalFloors)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalFloors
          fc.integer({ min: 1, max: 100 }), // startFloor
          (totalFloors, startFloor) => {
            if (startFloor <= totalFloors) {
              const result = validateFloorRange(startFloor, null, totalFloors);
              expect(result.valid).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: interior-quote-module, Property 6: Axis labels uniqueness**
   * **Validates: Requirements 3.2**
   * 
   * For any building, axis labels SHALL be unique within that building.
   */
  describe('Property 6: Axis labels uniqueness', () => {
    it('should accept unique axis labels', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.string({ minLength: 1, maxLength: 5 }), { minLength: 1, maxLength: 20 }),
          (labels) => {
            const result = validateAxisLabels(labels);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject duplicate axis labels', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 5 }),
          fc.array(fc.string({ minLength: 1, maxLength: 5 }), { minLength: 0, maxLength: 10 }),
          (duplicate, others) => {
            // Create array with at least one duplicate
            const labels = [duplicate, ...others, duplicate];
            const result = validateAxisLabels(labels);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('trùng');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: interior-quote-module, Property 7: Unit code format generation**
   * **Validates: Requirements 3.4, 12.2**
   * 
   * For any building with unitCodeFormat, floor, and axis, the generated unit code
   * SHALL match the format pattern with correct substitutions.
   */
  describe('Property 7: Unit code format generation', () => {
    it('should generate unit codes matching the format', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('S1', 'A', 'T2', 'BLOCK-A'),
          fc.integer({ min: 1, max: 100 }),
          fc.constantFrom('A', 'B', 'C', 'D', '01', '02'),
          (buildingCode, floor, axis) => {
            const format = '{building}.{floor}.{axis}';
            const code = generateUnitCode(format, buildingCode, floor, axis);
            
            // Verify the code contains all components
            expect(code).toContain(buildingCode);
            expect(code).toContain(floor.toString());
            expect(code).toContain(axis);
            
            // Verify the format
            expect(code).toBe(`${buildingCode}.${floor}.${axis}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support different format patterns', () => {
      const testCases = [
        {
          format: '{building}.{floor}.{axis}',
          building: 'S1',
          floor: 15,
          axis: 'A',
          expected: 'S1.15.A',
        },
        {
          format: '{building}-{floor}{axis}',
          building: 'T2',
          floor: 10,
          axis: 'B',
          expected: 'T2-10B',
        },
        {
          format: '{building}/{floor}/{axis}',
          building: 'BLOCK-A',
          floor: 5,
          axis: '01',
          expected: 'BLOCK-A/5/01',
        },
      ];

      for (const { format, building, floor, axis, expected } of testCases) {
        expect(generateUnitCode(format, building, floor, axis)).toBe(expected);
      }
    });

    it('should be reversible (generate then parse)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('S1', 'A', 'T2'),
          fc.integer({ min: 1, max: 100 }),
          fc.constantFrom('A', 'B', 'C', 'D'),
          (buildingCode, floor, axis) => {
            const format = '{building}.{floor}.{axis}';
            const code = generateUnitCode(format, buildingCode, floor, axis);
            const parsed = parseUnitCode(code, format);
            
            expect(parsed).not.toBeNull();
            expect(parsed?.buildingCode).toBe(buildingCode);
            expect(parsed?.floor).toBe(floor);
            expect(parsed?.axis).toBe(axis);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Unit tests for edge cases
 */
describe('Interior Building Service - Unit Tests', () => {
  describe('validateFloorRange', () => {
    it('should handle edge case: startFloor equals endFloor', () => {
      const result = validateFloorRange(5, 5, 10);
      expect(result.valid).toBe(true);
    });

    it('should handle edge case: startFloor equals totalFloors', () => {
      const result = validateFloorRange(10, 10, 10);
      expect(result.valid).toBe(true);
    });

    it('should handle negative floors (basement)', () => {
      const result = validateFloorRange(-2, 10, 12);
      // This depends on business logic - assuming we allow negative floors
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAxisLabels', () => {
    it('should handle single axis', () => {
      const result = validateAxisLabels(['A']);
      expect(result.valid).toBe(true);
    });

    it('should handle empty array', () => {
      const result = validateAxisLabels([]);
      expect(result.valid).toBe(true);
    });

    it('should detect multiple duplicates', () => {
      const result = validateAxisLabels(['A', 'B', 'A', 'C', 'B']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('A');
      expect(result.error).toContain('B');
    });
  });

  describe('parseUnitCode', () => {
    it('should return null for invalid format', () => {
      const result = parseUnitCode('INVALID', '{building}.{floor}.{axis}');
      expect(result).toBeNull();
    });

    it('should parse standard Vietnamese apartment codes', () => {
      const testCases = [
        { code: 'S1.15.A', format: '{building}.{floor}.{axis}', expected: { buildingCode: 'S1', floor: 15, axis: 'A' } },
        { code: 'S2.01.B', format: '{building}.{floor}.{axis}', expected: { buildingCode: 'S2', floor: 1, axis: 'B' } },
        { code: 'T1-5C', format: '{building}-{floor}{axis}', expected: { buildingCode: 'T1', floor: 5, axis: 'C' } },
      ];

      for (const { code, format, expected } of testCases) {
        const result = parseUnitCode(code, format);
        expect(result).toEqual(expected);
      }
    });
  });
});
