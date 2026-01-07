/**
 * Code Generator Tests
 * Tests code generation and validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseCode,
  isValidCode,
  isProjectCode,
  isBidCode,
  isEscrowCode,
  isFeeCode,
} from './code-generator';

describe('Code Generator Utilities', () => {
  describe('parseCode', () => {
    it('should parse valid project code', () => {
      const result = parseCode('PRJ-2024-001');

      expect(result).not.toBeNull();
      expect(result?.prefix).toBe('PRJ');
      expect(result?.year).toBe(2024);
      expect(result?.sequence).toBe(1);
    });

    it('should parse valid bid code', () => {
      const result = parseCode('BID-2024-042');

      expect(result).not.toBeNull();
      expect(result?.prefix).toBe('BID');
      expect(result?.year).toBe(2024);
      expect(result?.sequence).toBe(42);
    });

    it('should parse valid escrow code', () => {
      const result = parseCode('ESC-2024-100');

      expect(result).not.toBeNull();
      expect(result?.prefix).toBe('ESC');
      expect(result?.year).toBe(2024);
      expect(result?.sequence).toBe(100);
    });

    it('should parse valid fee code', () => {
      const result = parseCode('FEE-2024-999');

      expect(result).not.toBeNull();
      expect(result?.prefix).toBe('FEE');
      expect(result?.year).toBe(2024);
      expect(result?.sequence).toBe(999);
    });

    it('should return null for invalid format', () => {
      expect(parseCode('INVALID')).toBeNull();
      expect(parseCode('PRJ-2024')).toBeNull();
      expect(parseCode('PRJ-2024-1')).toBeNull(); // sequence must be 3 digits
      expect(parseCode('PRJ-24-001')).toBeNull(); // year must be 4 digits
      expect(parseCode('prj-2024-001')).toBeNull(); // prefix must be uppercase
    });

    it('should return null for empty string', () => {
      expect(parseCode('')).toBeNull();
    });

    it('should handle edge cases', () => {
      // Leading zeros in sequence
      const result = parseCode('PRJ-2024-001');
      expect(result?.sequence).toBe(1);

      // Max sequence
      const maxResult = parseCode('PRJ-2024-999');
      expect(maxResult?.sequence).toBe(999);
    });
  });

  describe('isValidCode', () => {
    it('should return true for valid codes', () => {
      expect(isValidCode('PRJ-2024-001')).toBe(true);
      expect(isValidCode('BID-2024-042')).toBe(true);
      expect(isValidCode('ESC-2024-100')).toBe(true);
      expect(isValidCode('FEE-2024-999')).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(isValidCode('INVALID')).toBe(false);
      expect(isValidCode('')).toBe(false);
      expect(isValidCode('PRJ-2024-1000')).toBe(false); // sequence > 999
    });

    it('should validate prefix when specified', () => {
      expect(isValidCode('PRJ-2024-001', 'PRJ')).toBe(true);
      expect(isValidCode('PRJ-2024-001', 'BID')).toBe(false);
      expect(isValidCode('BID-2024-001', 'BID')).toBe(true);
    });

    it('should reject unreasonable years', () => {
      expect(isValidCode('PRJ-2019-001')).toBe(false); // before 2020
      expect(isValidCode('PRJ-2101-001')).toBe(false); // after 2100
    });

    it('should reject invalid sequences', () => {
      expect(isValidCode('PRJ-2024-000')).toBe(false); // sequence < 1
    });
  });

  describe('isProjectCode', () => {
    it('should return true for valid project codes', () => {
      expect(isProjectCode('PRJ-2024-001')).toBe(true);
      expect(isProjectCode('PRJ-2025-999')).toBe(true);
    });

    it('should return false for non-project codes', () => {
      expect(isProjectCode('BID-2024-001')).toBe(false);
      expect(isProjectCode('ESC-2024-001')).toBe(false);
      expect(isProjectCode('FEE-2024-001')).toBe(false);
      expect(isProjectCode('INVALID')).toBe(false);
    });
  });

  describe('isBidCode', () => {
    it('should return true for valid bid codes', () => {
      expect(isBidCode('BID-2024-001')).toBe(true);
      expect(isBidCode('BID-2025-999')).toBe(true);
    });

    it('should return false for non-bid codes', () => {
      expect(isBidCode('PRJ-2024-001')).toBe(false);
      expect(isBidCode('ESC-2024-001')).toBe(false);
      expect(isBidCode('FEE-2024-001')).toBe(false);
      expect(isBidCode('INVALID')).toBe(false);
    });
  });

  describe('isEscrowCode', () => {
    it('should return true for valid escrow codes', () => {
      expect(isEscrowCode('ESC-2024-001')).toBe(true);
      expect(isEscrowCode('ESC-2025-999')).toBe(true);
    });

    it('should return false for non-escrow codes', () => {
      expect(isEscrowCode('PRJ-2024-001')).toBe(false);
      expect(isEscrowCode('BID-2024-001')).toBe(false);
      expect(isEscrowCode('FEE-2024-001')).toBe(false);
      expect(isEscrowCode('INVALID')).toBe(false);
    });
  });

  describe('isFeeCode', () => {
    it('should return true for valid fee codes', () => {
      expect(isFeeCode('FEE-2024-001')).toBe(true);
      expect(isFeeCode('FEE-2025-999')).toBe(true);
    });

    it('should return false for non-fee codes', () => {
      expect(isFeeCode('PRJ-2024-001')).toBe(false);
      expect(isFeeCode('BID-2024-001')).toBe(false);
      expect(isFeeCode('ESC-2024-001')).toBe(false);
      expect(isFeeCode('INVALID')).toBe(false);
    });
  });

  describe('Code format consistency', () => {
    const validCodes = [
      'PRJ-2024-001',
      'PRJ-2024-010',
      'PRJ-2024-100',
      'BID-2024-001',
      'BID-2024-042',
      'ESC-2024-001',
      'FEE-2024-001',
    ];

    validCodes.forEach((code) => {
      it(`should validate ${code}`, () => {
        expect(isValidCode(code)).toBe(true);
        expect(parseCode(code)).not.toBeNull();
      });
    });

    const invalidCodes = [
      '',
      'invalid',
      'PRJ2024001',
      'PRJ-2024-1',
      'PRJ-2024-01',
      'PRJ-24-001',
      'prj-2024-001',
      'PRJ-2024-0001',
      'PRJ-2024-abc',
      'PRJ-abcd-001',
    ];

    invalidCodes.forEach((code) => {
      it(`should reject ${code || '(empty string)'}`, () => {
        expect(isValidCode(code)).toBe(false);
      });
    });
  });
});
