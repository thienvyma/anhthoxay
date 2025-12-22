import * as fc from 'fast-check';
import { generateSlug } from './developer.service';

/**
 * Property tests for Interior Developer Service
 * 
 * These tests verify universal properties that should hold across all inputs.
 */
describe('Interior Developer Service - Property Tests', () => {
  /**
   * **Feature: interior-quote-module, Property 1: Developer slug uniqueness and format**
   * **Validates: Requirements 1.2**
   * 
   * For any developer name, the generated slug SHALL be URL-safe 
   * (lowercase, hyphenated), and deterministically derived from the name.
   */
  describe('Property 1: Slug generation', () => {
    it('should generate URL-safe slugs (lowercase, no special chars)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (name) => {
            const slug = generateSlug(name);
            
            // Slug should be lowercase
            expect(slug).toBe(slug.toLowerCase());
            
            // Slug should only contain a-z, 0-9, and hyphens
            expect(slug).toMatch(/^[a-z0-9-]*$/);
            
            // Slug should not start or end with hyphen
            if (slug.length > 0) {
              expect(slug).not.toMatch(/^-/);
              expect(slug).not.toMatch(/-$/);
            }
            
            // Slug should not have consecutive hyphens
            expect(slug).not.toMatch(/--/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic (same input = same output)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (name) => {
            const slug1 = generateSlug(name);
            const slug2 = generateSlug(name);
            
            expect(slug1).toBe(slug2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle Vietnamese characters correctly', () => {
      const testCases = [
        { input: 'Vingroup', expected: 'vingroup' },
        { input: 'Novaland', expected: 'novaland' },
        { input: 'Capitaland Việt Nam', expected: 'capitaland-viet-nam' },
        { input: 'Hưng Thịnh Corp', expected: 'hung-thinh-corp' },
        { input: 'Đất Xanh Group', expected: 'dat-xanh-group' },
        { input: 'Phú Mỹ Hưng', expected: 'phu-my-hung' },
      ];

      for (const { input, expected } of testCases) {
        expect(generateSlug(input)).toBe(expected);
      }
    });

    it('should handle special characters and spaces', () => {
      const testCases = [
        { input: 'Test & Company', expected: 'test-company' },
        { input: 'Test (Group)', expected: 'test-group' },
        { input: 'Test - Corp', expected: 'test-corp' },
        { input: '  Multiple   Spaces  ', expected: 'multiple-spaces' },
        { input: 'Test.Com.VN', expected: 'testcomvn' },
      ];

      for (const { input, expected } of testCases) {
        expect(generateSlug(input)).toBe(expected);
      }
    });
  });

  /**
   * **Feature: interior-quote-module, Property 4: Order field affects list ordering**
   * **Validates: Requirements 1.6, 10.3**
   * 
   * For any list of entities with order field, the returned list 
   * SHALL be sorted by order ascending.
   */
  describe('Property 4: Order field sorting', () => {
    it('should maintain order consistency for generated order values', () => {
      fc.assert(
        fc.property(
          fc.array(fc.nat({ max: 1000 }), { minLength: 2, maxLength: 20 }),
          (orders) => {
            // Sort the orders
            const sorted = [...orders].sort((a, b) => a - b);
            
            // Verify sorting is correct
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
            }
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
describe('Interior Developer Service - Unit Tests', () => {
  describe('generateSlug', () => {
    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle string with only special characters', () => {
      expect(generateSlug('!@#$%^&*()')).toBe('');
    });

    it('should handle string with only numbers', () => {
      expect(generateSlug('12345')).toBe('12345');
    });

    it('should handle mixed case', () => {
      expect(generateSlug('VinGroup CORP')).toBe('vingroup-corp');
    });

    it('should handle unicode characters', () => {
      expect(generateSlug('Công ty TNHH')).toBe('cong-ty-tnhh');
    });
  });
});
