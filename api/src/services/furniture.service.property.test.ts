/**
 * Property-Based Tests for Furniture Service
 *
 * **Feature: furniture-quotation**
 * Tests correctness properties defined in the design document.
 */

import * as fc from 'fast-check';
import { describe, it, expect, vi } from 'vitest';
import {
  FurnitureService,
  FurnitureServiceError,
  QuotationItem,
} from './furniture.service';
import { FurnitureFee } from '@prisma/client';
import {
  createLayoutSchema,
  createApartmentTypeSchema,
} from '../schemas/furniture.schema';

// ============================================
// Mock PrismaClient for isolated testing
// ============================================

const createMockPrisma = () => ({
  furnitureDeveloper: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  furnitureProject: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  furnitureBuilding: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  furnitureLayout: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  furnitureApartmentType: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  furnitureCategory: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  furnitureProduct: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  furnitureCombo: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  furnitureComboItem: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  furnitureFee: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  furnitureQuotation: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  customerLead: {
    findUnique: vi.fn(),
  },
});

// ============================================
// Generators
// ============================================

// Building code generator (alphanumeric with spaces)
const buildingCodeGen = fc.string({ minLength: 1, maxLength: 10 })
  .filter(s => /^[A-Z0-9 ]+$/i.test(s) && s.trim().length > 0);

// Floor number generator (1-99)
const floorGen = fc.integer({ min: 1, max: 99 });

// Axis number generator (0-99)
const axisGen = fc.integer({ min: 0, max: 99 });

// Max floor generator for grid (1-100)
const maxFloorGen = fc.integer({ min: 1, max: 100 });

// Max axis generator for grid (0-50)
const maxAxisGen = fc.integer({ min: 0, max: 50 });

// Price generator (positive number) - use Math.fround for 32-bit float compatibility
const priceGen = fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true });

// Quantity generator (positive integer)
const quantityGen = fc.integer({ min: 1, max: 100 });

// Fee type generator
const feeTypeGen = fc.constantFrom('FIXED', 'PERCENTAGE') as fc.Arbitrary<'FIXED' | 'PERCENTAGE'>;

// Fee applicability generator
const feeApplicabilityGen = fc.constantFrom('COMBO', 'CUSTOM', 'BOTH') as fc.Arbitrary<'COMBO' | 'CUSTOM' | 'BOTH'>;

// Selection type generator
const selectionTypeGen = fc.constantFrom('COMBO', 'CUSTOM') as fc.Arbitrary<'COMBO' | 'CUSTOM'>;

// Quotation item generator
const quotationItemGen: fc.Arbitrary<QuotationItem> = fc.record({
  productId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: priceGen,
  quantity: quantityGen,
});

// Fee generator
const feeGen: fc.Arbitrary<FurnitureFee> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: feeTypeGen,
  value: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
  applicability: feeApplicabilityGen,
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  isActive: fc.constant(true),
  order: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

// Apartment type generator (normalized)
const apartmentTypeGen = fc.constantFrom('1pn', '2pn', '3pn', '1pn+', 'penhouse', 'shophouse');

// Combo name generator
const comboNameGen = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);


// ============================================
// PROPERTY 1: Metrics Grid Dimensions
// **Feature: furniture-quotation, Property 1: Metrics Grid Dimensions**
// For any maxFloor and maxAxis, grid has maxFloor rows and (maxAxis + 1) columns
// **Validates: Requirements 1.2**
// ============================================

describe('Property 1: Metrics Grid Dimensions', () => {
  it('should generate grid with correct dimensions for any valid maxFloor and maxAxis', async () => {
    await fc.assert(
      fc.asyncProperty(
        maxFloorGen,
        maxAxisGen,
        buildingCodeGen,
        async (maxFloor, maxAxis, buildingCode) => {
          const mockPrisma = createMockPrisma();
          // Mock empty layouts - grid should still have correct dimensions
          mockPrisma.furnitureLayout.findMany.mockResolvedValue([]);

          const service = new FurnitureService(mockPrisma as never);
          const grid = await service.generateMetricsGrid(buildingCode, maxFloor, maxAxis);

          // Grid should have exactly maxFloor rows
          expect(grid.length).toBe(maxFloor);

          // Each row should have exactly (maxAxis + 1) columns
          for (const row of grid) {
            expect(row.length).toBe(maxAxis + 1);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should populate grid cells with apartment types from layouts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 10 }),
        buildingCodeGen,
        apartmentTypeGen,
        async (maxFloor, maxAxis, buildingCode, apartmentType) => {
          const mockPrisma = createMockPrisma();
          // Mock a layout for axis 0
          mockPrisma.furnitureLayout.findMany.mockResolvedValue([
            { id: '1', layoutAxis: `${buildingCode}_00`, buildingCode, axis: 0, apartmentType },
          ]);

          const service = new FurnitureService(mockPrisma as never);
          const grid = await service.generateMetricsGrid(buildingCode, maxFloor, maxAxis);

          // All cells in column 0 should have the apartment type
          for (const row of grid) {
            expect(row[0]).toBe(apartmentType);
          }

          // Other columns should be null (no layout defined)
          if (maxAxis > 0) {
            for (const row of grid) {
              for (let col = 1; col <= maxAxis; col++) {
                expect(row[col]).toBeNull();
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 2: Layout Lookup Consistency
// **Feature: furniture-quotation, Property 2: Layout Lookup Consistency**
// For any valid buildingCode and axis, lookup returns same apartmentType
// **Validates: Requirements 1.3, 6.6**
// ============================================

describe('Property 2: Layout Lookup Consistency', () => {
  it('should return consistent apartmentType for same buildingCode and axis', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildingCodeGen,
        axisGen,
        apartmentTypeGen,
        async (buildingCode, axis, apartmentType) => {
          const mockPrisma = createMockPrisma();
          const layoutData = {
            id: '1',
            layoutAxis: `${buildingCode}_${axis.toString().padStart(2, '0')}`,
            buildingCode,
            axis,
            apartmentType,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockPrisma.furnitureLayout.findUnique.mockResolvedValue(layoutData);

          const service = new FurnitureService(mockPrisma as never);

          // Multiple lookups should return the same result
          const result1 = await service.getLayoutByAxis(buildingCode, axis);
          const result2 = await service.getLayoutByAxis(buildingCode, axis);

          expect(result1?.apartmentType).toBe(apartmentType);
          expect(result2?.apartmentType).toBe(apartmentType);
          expect(result1?.apartmentType).toBe(result2?.apartmentType);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for non-existent layout', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildingCodeGen,
        axisGen,
        async (buildingCode, axis) => {
          const mockPrisma = createMockPrisma();
          mockPrisma.furnitureLayout.findUnique.mockResolvedValue(null);

          const service = new FurnitureService(mockPrisma as never);
          const result = await service.getLayoutByAxis(buildingCode, axis);

          expect(result).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 8: Unit Number Format
// **Feature: furniture-quotation, Property 8: Unit Number Format**
// For any buildingCode, floor, axis, result matches format {code}.{floor 2 digits}{axis 2 digits}
// **Validates: Requirements 6.5**
// ============================================

describe('Property 8: Unit Number Format', () => {
  it('should format unit number correctly for any valid inputs', () => {
    fc.assert(
      fc.property(
        buildingCodeGen,
        floorGen,
        axisGen,
        (buildingCode, floor, axis) => {
          const mockPrisma = createMockPrisma();
          const service = new FurnitureService(mockPrisma as never);

          const unitNumber = service.calculateUnitNumber(buildingCode, floor, axis);

          // Expected format: {buildingCode}.{floor padded to 2 digits}{axis padded to 2 digits}
          const expectedFloor = floor.toString().padStart(2, '0');
          const expectedAxis = axis.toString().padStart(2, '0');
          const expected = `${buildingCode}.${expectedFloor}${expectedAxis}`;

          expect(unitNumber).toBe(expected);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should pad single digit floor and axis with leading zeros', () => {
    fc.assert(
      fc.property(
        buildingCodeGen,
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 0, max: 9 }),
        (buildingCode, floor, axis) => {
          const mockPrisma = createMockPrisma();
          const service = new FurnitureService(mockPrisma as never);

          const unitNumber = service.calculateUnitNumber(buildingCode, floor, axis);

          // Should contain padded numbers
          const regex = new RegExp(`^${buildingCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.\\d{2}\\d{2}$`);
          expect(unitNumber).toMatch(regex);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce specific expected outputs', () => {
    const mockPrisma = createMockPrisma();
    const service = new FurnitureService(mockPrisma as never);

    // Test case from requirements: LBV A, floor 15, axis 3 => 'LBV A.1503'
    expect(service.calculateUnitNumber('LBV A', 15, 3)).toBe('LBV A.1503');
    expect(service.calculateUnitNumber('LBV A', 1, 0)).toBe('LBV A.0100');
    expect(service.calculateUnitNumber('MCP B', 22, 13)).toBe('MCP B.2213');
  });
});

// ============================================
// PROPERTY 7: Fee Calculation Correctness
// **Feature: furniture-quotation, Property 7: Fee Calculation Correctness**
// totalPrice = basePrice + sum(applicable fees)
// **Validates: Requirements 4.5, 7.6**
// ============================================

describe('Property 7: Fee Calculation Correctness', () => {
  it('should calculate totalPrice as basePrice plus sum of applicable fees', () => {
    fc.assert(
      fc.property(
        fc.array(quotationItemGen, { minLength: 1, maxLength: 10 }),
        fc.array(feeGen, { minLength: 0, maxLength: 5 }),
        selectionTypeGen,
        (items, fees, selectionType) => {
          const mockPrisma = createMockPrisma();
          const service = new FurnitureService(mockPrisma as never);

          const result = service.calculateQuotation(items, fees, selectionType);

          // Calculate expected base price
          const expectedBasePrice = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          // Calculate expected fees
          const applicableFees = fees.filter(
            (fee) => fee.applicability === 'BOTH' || fee.applicability === selectionType
          );
          const expectedFeeTotal = applicableFees.reduce((sum, fee) => {
            const amount =
              fee.type === 'FIXED'
                ? fee.value
                : (expectedBasePrice * fee.value) / 100;
            return sum + amount;
          }, 0);

          const expectedTotal = expectedBasePrice + expectedFeeTotal;

          // Allow small floating point tolerance
          expect(result.basePrice).toBeCloseTo(expectedBasePrice, 5);
          expect(result.totalPrice).toBeCloseTo(expectedTotal, 5);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only include fees matching selectionType or BOTH', () => {
    fc.assert(
      fc.property(
        fc.array(quotationItemGen, { minLength: 1, maxLength: 5 }),
        selectionTypeGen,
        (items, selectionType) => {
          const mockPrisma = createMockPrisma();
          const service = new FurnitureService(mockPrisma as never);

          // Create fees with different applicabilities
          const fees: FurnitureFee[] = [
            {
              id: '1',
              name: 'Combo Only Fee',
              type: 'FIXED',
              value: 100,
              applicability: 'COMBO',
              description: null,
              isActive: true,
              order: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: '2',
              name: 'Custom Only Fee',
              type: 'FIXED',
              value: 200,
              applicability: 'CUSTOM',
              description: null,
              isActive: true,
              order: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: '3',
              name: 'Both Fee',
              type: 'FIXED',
              value: 50,
              applicability: 'BOTH',
              description: null,
              isActive: true,
              order: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];

          const result = service.calculateQuotation(items, fees, selectionType);

          // Check that only applicable fees are included
          const feeNames = result.feesBreakdown.map((f) => f.name);

          if (selectionType === 'COMBO') {
            expect(feeNames).toContain('Combo Only Fee');
            expect(feeNames).not.toContain('Custom Only Fee');
            expect(feeNames).toContain('Both Fee');
          } else {
            expect(feeNames).not.toContain('Combo Only Fee');
            expect(feeNames).toContain('Custom Only Fee');
            expect(feeNames).toContain('Both Fee');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate PERCENTAGE fees based on basePrice', () => {
    fc.assert(
      fc.property(
        fc.array(quotationItemGen, { minLength: 1, maxLength: 5 }),
        fc.float({ min: Math.fround(1), max: Math.fround(50), noNaN: true }),
        (items, percentage) => {
          const mockPrisma = createMockPrisma();
          const service = new FurnitureService(mockPrisma as never);

          const fees: FurnitureFee[] = [
            {
              id: '1',
              name: 'Percentage Fee',
              type: 'PERCENTAGE',
              value: percentage,
              applicability: 'BOTH',
              description: null,
              isActive: true,
              order: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];

          const result = service.calculateQuotation(items, fees, 'COMBO');

          const expectedFeeAmount = (result.basePrice * percentage) / 100;

          expect(result.feesBreakdown[0].amount).toBeCloseTo(expectedFeeAmount, 5);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return zero fees when no fees are applicable', () => {
    fc.assert(
      fc.property(
        fc.array(quotationItemGen, { minLength: 1, maxLength: 5 }),
        (items) => {
          const mockPrisma = createMockPrisma();
          const service = new FurnitureService(mockPrisma as never);

          const result = service.calculateQuotation(items, [], 'COMBO');

          expect(result.feesBreakdown).toHaveLength(0);
          expect(result.totalPrice).toBeCloseTo(result.basePrice, 5);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 6: Combo Duplication
// **Feature: furniture-quotation, Property 6: Combo Duplication**
// Duplicated combo has name with "(Copy)" suffix and same properties
// **Validates: Requirements 3.4**
// ============================================

describe('Property 6: Combo Duplication', () => {
  it('should create duplicate with "(Copy)" suffix and same properties', async () => {
    await fc.assert(
      fc.asyncProperty(
        comboNameGen,
        fc.array(apartmentTypeGen, { minLength: 1, maxLength: 3 }),
        priceGen,
        fc.option(fc.webUrl(), { nil: null }),
        fc.option(fc.string({ maxLength: 500 }), { nil: null }),
        async (name, apartmentTypes, price, imageUrl, description) => {
          const mockPrisma = createMockPrisma();

          const originalCombo = {
            id: 'original-id',
            name,
            apartmentTypes: JSON.stringify(apartmentTypes),
            price,
            imageUrl,
            description,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [
              { id: 'item-1', comboId: 'original-id', productId: 'prod-1', quantity: 2 },
            ],
          };

          const duplicatedCombo = {
            id: 'new-id',
            name: `${name} (Copy)`,
            apartmentTypes: originalCombo.apartmentTypes,
            price: originalCombo.price,
            imageUrl: originalCombo.imageUrl,
            description: originalCombo.description,
            isActive: originalCombo.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [
              {
                id: 'new-item-1',
                comboId: 'new-id',
                productId: 'prod-1',
                quantity: 2,
                product: { id: 'prod-1', name: 'Product 1' },
              },
            ],
          };

          mockPrisma.furnitureCombo.findUnique.mockResolvedValue(originalCombo);
          mockPrisma.furnitureCombo.create.mockResolvedValue(duplicatedCombo);

          const service = new FurnitureService(mockPrisma as never);
          const result = await service.duplicateCombo('original-id');

          // Name should have "(Copy)" suffix
          expect(result.name).toBe(`${name} (Copy)`);

          // Other properties should be the same
          expect(result.apartmentTypes).toBe(originalCombo.apartmentTypes);
          expect(result.price).toBe(originalCombo.price);
          expect(result.imageUrl).toBe(originalCombo.imageUrl);
          expect(result.description).toBe(originalCombo.description);
          expect(result.isActive).toBe(originalCombo.isActive);

          // ID should be different
          expect(result.id).not.toBe(originalCombo.id);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw NOT_FOUND error when combo does not exist', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (comboId) => {
        const mockPrisma = createMockPrisma();
        mockPrisma.furnitureCombo.findUnique.mockResolvedValue(null);

        const service = new FurnitureService(mockPrisma as never);

        await expect(service.duplicateCombo(comboId)).rejects.toThrow(
          FurnitureServiceError
        );

        try {
          await service.duplicateCombo(comboId);
        } catch (error) {
          expect(error).toBeInstanceOf(FurnitureServiceError);
          expect((error as FurnitureServiceError).code).toBe('NOT_FOUND');
          expect((error as FurnitureServiceError).statusCode).toBe(404);
        }

        return true;
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================
// PROPERTY 4: ApartmentType Normalization
// **Feature: furniture-quotation, Property 4: ApartmentType Normalization**
// Any string with whitespace is trimmed and lowercased
// **Validates: Requirements 1.7**
// ============================================

describe('Property 4: ApartmentType Normalization', () => {
  it('should trim and lowercase apartmentType in createLayoutSchema', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('', ' ', '  ', '\t', '\n'),
        fc.constantFrom('', ' ', '  ', '\t', '\n'),
        (baseType, leadingWhitespace, trailingWhitespace) => {
          // Create input with whitespace
          const inputType = `${leadingWhitespace}${baseType}${trailingWhitespace}`;

          // Skip if the trimmed result would be empty
          if (baseType.trim().length === 0) return true;

          const input = {
            buildingCode: 'TEST',
            axis: 0,
            apartmentType: inputType,
          };

          const result = createLayoutSchema.safeParse(input);

          if (result.success) {
            // Should be trimmed and lowercased
            expect(result.data.apartmentType).toBe(baseType.trim().toLowerCase());
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should normalize uppercase to lowercase', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('1PN', '2PN', '3PN', 'PENHOUSE', 'SHOPHOUSE', '1PN+'),
        (upperType) => {
          const input = {
            buildingCode: 'TEST',
            axis: 0,
            apartmentType: upperType,
          };

          const result = createLayoutSchema.safeParse(input);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.apartmentType).toBe(upperType.toLowerCase());
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should normalize mixed case with whitespace', () => {
    const testCases = [
      { input: '  1Pn  ', expected: '1pn' },
      { input: '\t2PN\n', expected: '2pn' },
      { input: ' PenHouse ', expected: 'penhouse' },
      { input: '  ShopHouse  ', expected: 'shophouse' },
    ];

    for (const { input, expected } of testCases) {
      const result = createLayoutSchema.safeParse({
        buildingCode: 'TEST',
        axis: 0,
        apartmentType: input,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.apartmentType).toBe(expected);
      }
    }
  });

  it('should normalize apartmentType in createApartmentTypeSchema', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('1PN', '2PN', '3PN', 'PENHOUSE'),
        fc.constantFrom('', ' ', '  '),
        (baseType, whitespace) => {
          const input = {
            buildingCode: 'TEST',
            apartmentType: `${whitespace}${baseType}${whitespace}`,
          };

          const result = createApartmentTypeSchema.safeParse(input);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.apartmentType).toBe(baseType.toLowerCase());
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================
// PROPERTY 5: Category Deletion Constraint
// **Feature: furniture-quotation, Property 5: Category Deletion Constraint**
// Deleting category with products throws error
// **Validates: Requirements 2.7**
// ============================================

describe('Property 5: Category Deletion Constraint', () => {
  it('should throw error when deleting category with products', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 100 }),
        async (categoryId, productCount) => {
          const mockPrisma = createMockPrisma();
          mockPrisma.furnitureProduct.count.mockResolvedValue(productCount);

          const service = new FurnitureService(mockPrisma as never);

          await expect(service.deleteCategory(categoryId)).rejects.toThrow(
            FurnitureServiceError
          );

          try {
            await service.deleteCategory(categoryId);
          } catch (error) {
            expect(error).toBeInstanceOf(FurnitureServiceError);
            expect((error as FurnitureServiceError).code).toBe('CONFLICT');
            expect((error as FurnitureServiceError).statusCode).toBe(409);
            expect((error as FurnitureServiceError).message).toContain(
              'Không thể xóa danh mục đang có sản phẩm'
            );
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow deleting category with no products', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (categoryId) => {
        const mockPrisma = createMockPrisma();
        mockPrisma.furnitureProduct.count.mockResolvedValue(0);
        mockPrisma.furnitureCategory.delete.mockResolvedValue({ id: categoryId });

        const service = new FurnitureService(mockPrisma as never);

        // Should not throw
        await expect(service.deleteCategory(categoryId)).resolves.not.toThrow();

        return true;
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 3: CSV Import/Export Round Trip
// **Feature: furniture-quotation, Property 3: CSV Import/Export Round Trip**
// Export then import produces equivalent dataset
// **Validates: Requirements 1.6, 1.8**
// ============================================

describe('Property 3: CSV Import/Export Round Trip', () => {
  // Generator for valid names (non-empty, no leading/trailing whitespace, no newlines)
  // Note: parseCSV trims values, so we generate pre-trimmed values for round-trip testing
  const trimmedStringGen = fc.string({ minLength: 1, maxLength: 50 })
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.includes('\n') && !s.includes('\r'));

  it('should parse and generate CSV correctly for simple data', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: trimmedStringGen,
            value: fc.integer({ min: 0, max: 1000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (data) => {
          const mockPrisma = createMockPrisma();
          const service = new FurnitureService(mockPrisma as never);

          // Generate CSV
          const csv = service.generateCSV(data, ['name', 'value']);

          // Parse CSV back
          const parsed = service.parseCSV<{ name: string; value: string }>(csv);

          // Should have same number of rows
          expect(parsed.length).toBe(data.length);

          // Each row should match (value becomes string, parseCSV trims values)
          for (let i = 0; i < data.length; i++) {
            expect(parsed[i].name).toBe(data[i].name.trim());
            expect(parsed[i].value).toBe(String(data[i].value));
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle quoted values with commas correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            description: trimmedStringGen,
            price: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (data) => {
          const mockPrisma = createMockPrisma();
          const service = new FurnitureService(mockPrisma as never);

          // Generate CSV (should quote values with commas)
          const csv = service.generateCSV(data, ['description', 'price']);

          // Parse CSV back
          const parsed = service.parseCSV<{ description: string; price: string }>(csv);

          // Should have same number of rows
          expect(parsed.length).toBe(data.length);

          // Each row should match (parseCSV trims values)
          for (let i = 0; i < data.length; i++) {
            expect(parsed[i].description).toBe(data[i].description.trim());
            expect(parsed[i].price).toBe(String(data[i].price));
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty values correctly', () => {
    const mockPrisma = createMockPrisma();
    const service = new FurnitureService(mockPrisma as never);

    const data = [
      { name: 'Test', description: '', value: '100' },
      { name: 'Test2', description: 'Has desc', value: '' },
    ];

    const csv = service.generateCSV(data, ['name', 'description', 'value']);
    const parsed = service.parseCSV<{ name: string; description: string; value: string }>(csv);

    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('Test');
    expect(parsed[0].description).toBe('');
    expect(parsed[0].value).toBe('100');
    expect(parsed[1].name).toBe('Test2');
    expect(parsed[1].description).toBe('Has desc');
    expect(parsed[1].value).toBe('');
  });

  it('should handle values with quotes correctly', () => {
    const mockPrisma = createMockPrisma();
    const service = new FurnitureService(mockPrisma as never);

    const data = [
      { name: 'Test "quoted"', value: '100' },
      { name: 'Normal', value: '200' },
    ];

    const csv = service.generateCSV(data, ['name', 'value']);
    const parsed = service.parseCSV<{ name: string; value: string }>(csv);

    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('Test "quoted"');
    expect(parsed[0].value).toBe('100');
  });

  it('should parse DuAn.csv format correctly', () => {
    const mockPrisma = createMockPrisma();
    const service = new FurnitureService(mockPrisma as never);

    const csvContent = `ChuDauTu,TenDuAn,MaDuAn,TenToaNha,MaToaNha,SoTangMax,SoTrucMax
Masterise Homes,Lumiere Boulevard,LBV,Angelica,LBV A,22,13
Masterise Homes,Lumiere Boulevard,LBV,Banyan,LBV B,26,15`;

    interface DuAnRow {
      ChuDauTu: string;
      TenDuAn: string;
      MaDuAn: string;
      TenToaNha: string;
      MaToaNha: string;
      SoTangMax: string;
      SoTrucMax: string;
    }

    const parsed = service.parseCSV<DuAnRow>(csvContent);

    expect(parsed.length).toBe(2);
    expect(parsed[0].ChuDauTu).toBe('Masterise Homes');
    expect(parsed[0].TenDuAn).toBe('Lumiere Boulevard');
    expect(parsed[0].MaDuAn).toBe('LBV');
    expect(parsed[0].TenToaNha).toBe('Angelica');
    expect(parsed[0].MaToaNha).toBe('LBV A');
    expect(parsed[0].SoTangMax).toBe('22');
    expect(parsed[0].SoTrucMax).toBe('13');
  });

  it('should parse LayoutIDs.csv format correctly', () => {
    const mockPrisma = createMockPrisma();
    const service = new FurnitureService(mockPrisma as never);

    const csvContent = `LayoutAxis,MaToaNha,SoTruc,ApartmentType
LBV A_00,LBV A,0,1pn
LBV A_01,LBV A,1,2pn`;

    interface LayoutRow {
      LayoutAxis: string;
      MaToaNha: string;
      SoTruc: string;
      ApartmentType: string;
    }

    const parsed = service.parseCSV<LayoutRow>(csvContent);

    expect(parsed.length).toBe(2);
    expect(parsed[0].LayoutAxis).toBe('LBV A_00');
    expect(parsed[0].MaToaNha).toBe('LBV A');
    expect(parsed[0].SoTruc).toBe('0');
    expect(parsed[0].ApartmentType).toBe('1pn');
  });

  it('should parse ApartmentType.csv format with quoted values correctly', () => {
    const mockPrisma = createMockPrisma();
    const service = new FurnitureService(mockPrisma as never);

    const csvContent = `MaToaNha,ApartmentType,Ảnh,Mô tả
LBV A,1pn,https://example.com/img.jpg,Căn hộ 1PN 50m²
LBV A,1pn+,https://example.com/img2.jpg,"Căn hộ Studio 35m² - Thiết kế thông minh, phù hợp cho người độc thân"`;

    interface ApartmentTypeRow {
      MaToaNha: string;
      ApartmentType: string;
      'Ảnh': string;
      'Mô tả': string;
    }

    const parsed = service.parseCSV<ApartmentTypeRow>(csvContent);

    expect(parsed.length).toBe(2);
    expect(parsed[0].MaToaNha).toBe('LBV A');
    expect(parsed[0].ApartmentType).toBe('1pn');
    expect(parsed[0]['Ảnh']).toBe('https://example.com/img.jpg');
    expect(parsed[0]['Mô tả']).toBe('Căn hộ 1PN 50m²');
    
    // Second row has quoted value with comma
    expect(parsed[1]['Mô tả']).toBe('Căn hộ Studio 35m² - Thiết kế thông minh, phù hợp cho người độc thân');
  });

  it('should generate DuAn.csv format correctly', () => {
    const mockPrisma = createMockPrisma();
    const service = new FurnitureService(mockPrisma as never);

    const data = [
      {
        ChuDauTu: 'Masterise Homes',
        TenDuAn: 'Lumiere Boulevard',
        MaDuAn: 'LBV',
        TenToaNha: 'Angelica',
        MaToaNha: 'LBV A',
        SoTangMax: 22,
        SoTrucMax: 13,
      },
    ];

    const csv = service.generateCSV(data, [
      'ChuDauTu',
      'TenDuAn',
      'MaDuAn',
      'TenToaNha',
      'MaToaNha',
      'SoTangMax',
      'SoTrucMax',
    ]);

    expect(csv).toContain('ChuDauTu,TenDuAn,MaDuAn,TenToaNha,MaToaNha,SoTangMax,SoTrucMax');
    expect(csv).toContain('Masterise Homes,Lumiere Boulevard,LBV,Angelica,LBV A,22,13');
  });
});


// ============================================
// PROPERTY 9: Invalid Axis Error Handling
// **Feature: furniture-quotation, Property 9: Invalid Axis Error Handling**
// For any axis value that does not exist in LayoutIDs for the given MaToaNha,
// the lookup function SHALL return null or throw an error.
// **Validates: Requirements 6.7**
// ============================================

describe('Property 9: Invalid Axis Error Handling', () => {
  it('should return null for any axis not in LayoutIDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildingCodeGen,
        axisGen,
        async (buildingCode, axis) => {
          const mockPrisma = createMockPrisma();
          // Mock no layout found for this axis
          mockPrisma.furnitureLayout.findUnique.mockResolvedValue(null);

          const service = new FurnitureService(mockPrisma as never);
          const result = await service.getLayoutByAxis(buildingCode, axis);

          // Should return null when axis doesn't exist in LayoutIDs
          expect(result).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for axis outside valid range', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildingCodeGen,
        fc.integer({ min: 0, max: 50 }), // maxAxis
        fc.integer({ min: 51, max: 100 }), // axis outside range
        async (buildingCode, maxAxis, invalidAxis) => {
          const mockPrisma = createMockPrisma();
          // Mock no layout found for axis outside range
          mockPrisma.furnitureLayout.findUnique.mockResolvedValue(null);

          const service = new FurnitureService(mockPrisma as never);
          const result = await service.getLayoutByAxis(buildingCode, invalidAxis);

          // Should return null for axis outside valid range
          expect(result).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return layout only when axis exists in LayoutIDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildingCodeGen,
        fc.integer({ min: 0, max: 50 }), // maxAxis
        fc.integer({ min: 0, max: 50 }), // validAxis
        apartmentTypeGen,
        async (buildingCode, maxAxis, validAxis, apartmentType) => {
          const mockPrisma = createMockPrisma();

          // Create a set of valid axes (0 to maxAxis)
          const validAxes = new Set(Array.from({ length: maxAxis + 1 }, (_, i) => i));

          // Mock layout lookup - return layout only if axis is valid
          mockPrisma.furnitureLayout.findUnique.mockImplementation(async ({ where }) => {
            const axis = where?.buildingCode_axis?.axis;
            if (axis !== undefined && validAxes.has(axis)) {
              return {
                id: `layout-${axis}`,
                layoutAxis: `${buildingCode}_${axis.toString().padStart(2, '0')}`,
                buildingCode,
                axis,
                apartmentType,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }
            return null;
          });

          const service = new FurnitureService(mockPrisma as never);

          // Test with valid axis
          if (validAxis <= maxAxis) {
            const result = await service.getLayoutByAxis(buildingCode, validAxis);
            expect(result).not.toBeNull();
            expect(result?.axis).toBe(validAxis);
            expect(result?.apartmentType).toBe(apartmentType);
          }

          // Test with invalid axis (outside range)
          const invalidAxis = maxAxis + 10;
          const invalidResult = await service.getLayoutByAxis(buildingCode, invalidAxis);
          expect(invalidResult).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of axis 0', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildingCodeGen,
        apartmentTypeGen,
        async (buildingCode, apartmentType) => {
          const mockPrisma = createMockPrisma();

          // Mock layout for axis 0
          mockPrisma.furnitureLayout.findUnique.mockImplementation(async ({ where }) => {
            if (where?.buildingCode_axis?.axis === 0) {
              return {
                id: 'layout-0',
                layoutAxis: `${buildingCode}_00`,
                buildingCode,
                axis: 0,
                apartmentType,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }
            return null;
          });

          const service = new FurnitureService(mockPrisma as never);

          // Axis 0 should return layout
          const result = await service.getLayoutByAxis(buildingCode, 0);
          expect(result).not.toBeNull();
          expect(result?.axis).toBe(0);

          // Axis 1 should return null (not in mock)
          const result1 = await service.getLayoutByAxis(buildingCode, 1);
          expect(result1).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for negative axis values', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildingCodeGen,
        fc.integer({ min: -100, max: -1 }), // negative axis
        async (buildingCode, negativeAxis) => {
          const mockPrisma = createMockPrisma();
          mockPrisma.furnitureLayout.findUnique.mockResolvedValue(null);

          const service = new FurnitureService(mockPrisma as never);
          const result = await service.getLayoutByAxis(buildingCode, negativeAxis);

          // Should return null for negative axis
          expect(result).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 11: Quotation Data Completeness
// **Feature: furniture-quotation, Property 11: Quotation Data Completeness**
// For any created quotation, the stored record SHALL contain all required fields:
// developerName, projectName, buildingName, buildingCode, floor, axis, unitNumber,
// apartmentType, selectionType, items, basePrice, fees, and totalPrice.
// **Validates: Requirements 11.2**
// ============================================

describe('Property 11: Quotation Data Completeness', () => {
  // Generator for valid quotation input
  const quotationInputGen = fc.record({
    leadId: fc.uuid(),
    developerName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    projectName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    buildingName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    buildingCode: buildingCodeGen,
    floor: floorGen,
    axis: axisGen,
    apartmentType: apartmentTypeGen,
    layoutImageUrl: fc.option(fc.webUrl(), { nil: undefined }),
    selectionType: selectionTypeGen,
    comboId: fc.option(fc.uuid(), { nil: undefined }),
    comboName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    items: fc.array(quotationItemGen, { minLength: 1, maxLength: 10 }),
    fees: fc.array(feeGen, { minLength: 0, maxLength: 5 }),
  });

  it('should create quotation with all required fields populated', async () => {
    await fc.assert(
      fc.asyncProperty(
        quotationInputGen,
        async (input) => {
          const mockPrisma = createMockPrisma();

          // Mock lead exists
          mockPrisma.customerLead.findUnique.mockResolvedValue({
            id: input.leadId,
            name: 'Test Lead',
            phone: '0901234567',
          });

          // Calculate expected unit number
          const expectedUnitNumber = `${input.buildingCode}.${input.floor.toString().padStart(2, '0')}${input.axis.toString().padStart(2, '0')}`;

          // Calculate expected base price
          const expectedBasePrice = input.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          // Calculate expected fees
          const applicableFees = input.fees.filter(
            (fee) => fee.applicability === 'BOTH' || fee.applicability === input.selectionType
          );
          const expectedFeesBreakdown = applicableFees.map((fee) => ({
            name: fee.name,
            type: fee.type,
            value: fee.value,
            amount: fee.type === 'FIXED' ? fee.value : (expectedBasePrice * fee.value) / 100,
          }));
          const expectedTotalFees = expectedFeesBreakdown.reduce((sum, f) => sum + f.amount, 0);
          const expectedTotalPrice = expectedBasePrice + expectedTotalFees;

          // Mock quotation creation
          mockPrisma.furnitureQuotation.create.mockImplementation(async ({ data }) => ({
            id: 'quotation-id',
            ...data,
            createdAt: new Date(),
          }));

          const service = new FurnitureService(mockPrisma as never);
          const result = await service.createQuotation(input);

          // Verify all required fields are present and correct
          // **Validates: Requirements 11.2**
          expect(result.developerName).toBe(input.developerName);
          expect(result.projectName).toBe(input.projectName);
          expect(result.buildingName).toBe(input.buildingName);
          expect(result.buildingCode).toBe(input.buildingCode);
          expect(result.floor).toBe(input.floor);
          expect(result.axis).toBe(input.axis);
          expect(result.unitNumber).toBe(expectedUnitNumber);
          expect(result.apartmentType).toBe(input.apartmentType);
          expect(result.selectionType).toBe(input.selectionType);
          expect(result.items).toBeDefined();
          expect(result.basePrice).toBeCloseTo(expectedBasePrice, 5);
          expect(result.fees).toBeDefined();
          expect(result.totalPrice).toBeCloseTo(expectedTotalPrice, 5);

          // Verify items is a valid JSON string
          const parsedItems = JSON.parse(result.items);
          expect(Array.isArray(parsedItems)).toBe(true);
          expect(parsedItems.length).toBe(input.items.length);

          // Verify fees is a valid JSON string
          const parsedFees = JSON.parse(result.fees);
          expect(Array.isArray(parsedFees)).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw NOT_FOUND error when lead does not exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        quotationInputGen,
        async (input) => {
          const mockPrisma = createMockPrisma();

          // Mock lead not found
          mockPrisma.customerLead.findUnique.mockResolvedValue(null);

          const service = new FurnitureService(mockPrisma as never);

          await expect(service.createQuotation(input)).rejects.toThrow(FurnitureServiceError);

          try {
            await service.createQuotation(input);
          } catch (error) {
            expect(error).toBeInstanceOf(FurnitureServiceError);
            expect((error as FurnitureServiceError).code).toBe('NOT_FOUND');
            expect((error as FurnitureServiceError).statusCode).toBe(404);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should calculate unit number correctly for any valid floor and axis', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildingCodeGen,
        floorGen,
        axisGen,
        async (buildingCode, floor, axis) => {
          const mockPrisma = createMockPrisma();

          const input = {
            leadId: 'lead-id',
            developerName: 'Test Developer',
            projectName: 'Test Project',
            buildingName: 'Test Building',
            buildingCode,
            floor,
            axis,
            apartmentType: '1pn',
            selectionType: 'COMBO' as const,
            items: [{ productId: 'prod-1', name: 'Product 1', price: 1000, quantity: 1 }],
            fees: [],
          };

          // Mock lead exists
          mockPrisma.customerLead.findUnique.mockResolvedValue({
            id: input.leadId,
            name: 'Test Lead',
            phone: '0901234567',
          });

          // Mock quotation creation
          mockPrisma.furnitureQuotation.create.mockImplementation(async ({ data }) => ({
            id: 'quotation-id',
            ...data,
            createdAt: new Date(),
          }));

          const service = new FurnitureService(mockPrisma as never);
          const result = await service.createQuotation(input);

          // Verify unit number format: {buildingCode}.{floor 2 digits}{axis 2 digits}
          const expectedUnitNumber = `${buildingCode}.${floor.toString().padStart(2, '0')}${axis.toString().padStart(2, '0')}`;
          expect(result.unitNumber).toBe(expectedUnitNumber);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include optional fields when provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        quotationInputGen,
        fc.webUrl(),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (input, layoutImageUrl, comboId, comboName) => {
          const mockPrisma = createMockPrisma();

          const inputWithOptionals = {
            ...input,
            layoutImageUrl,
            comboId,
            comboName,
          };

          // Mock lead exists
          mockPrisma.customerLead.findUnique.mockResolvedValue({
            id: input.leadId,
            name: 'Test Lead',
            phone: '0901234567',
          });

          // Mock quotation creation
          mockPrisma.furnitureQuotation.create.mockImplementation(async ({ data }) => ({
            id: 'quotation-id',
            ...data,
            createdAt: new Date(),
          }));

          const service = new FurnitureService(mockPrisma as never);
          const result = await service.createQuotation(inputWithOptionals);

          // Verify optional fields are included
          expect(result.layoutImageUrl).toBe(layoutImageUrl);
          expect(result.comboId).toBe(comboId);
          expect(result.comboName).toBe(comboName);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty items array gracefully', async () => {
    const mockPrisma = createMockPrisma();

    const input = {
      leadId: 'lead-id',
      developerName: 'Test Developer',
      projectName: 'Test Project',
      buildingName: 'Test Building',
      buildingCode: 'TEST',
      floor: 1,
      axis: 0,
      apartmentType: '1pn',
      selectionType: 'CUSTOM' as const,
      items: [] as QuotationItem[],
      fees: [],
    };

    // Mock lead exists
    mockPrisma.customerLead.findUnique.mockResolvedValue({
      id: input.leadId,
      name: 'Test Lead',
      phone: '0901234567',
    });

    // Mock quotation creation
    mockPrisma.furnitureQuotation.create.mockImplementation(async ({ data }) => ({
      id: 'quotation-id',
      ...data,
      createdAt: new Date(),
    }));

    const service = new FurnitureService(mockPrisma as never);
    const result = await service.createQuotation(input);

    // Should have zero base price and total price
    expect(result.basePrice).toBe(0);
    expect(result.totalPrice).toBe(0);
    expect(JSON.parse(result.items)).toEqual([]);
    expect(JSON.parse(result.fees)).toEqual([]);
  });
});
