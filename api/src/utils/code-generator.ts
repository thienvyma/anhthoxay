/**
 * Code Generator Utility
 * 
 * Generates unique sequential codes for Projects, Bids, Escrows, and Fee Transactions.
 * Format: PREFIX-YYYY-NNN (e.g., PRJ-2024-001, BID-2024-042, ESC-2024-001, FEE-2024-001)
 * 
 * **Feature: bidding-phase2-core, bidding-phase3-matching**
 * **Validates: Requirements 1.1, 6.1 (Phase 2), 3.1, 7.1 (Phase 3)**
 */

import type { PrismaClient } from '@prisma/client';

// ============================================
// Constants
// ============================================

const PROJECT_PREFIX = 'PRJ';
const BID_PREFIX = 'BID';
const ESCROW_PREFIX = 'ESC';
const FEE_PREFIX = 'FEE';

// ============================================
// Types
// ============================================

export interface CodeGeneratorResult {
  code: string;
  year: number;
  sequence: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get current year as 4-digit number
 */
function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Format sequence number with leading zeros (3 digits)
 * @param sequence - The sequence number
 * @returns Formatted string (e.g., "001", "042", "999")
 */
function formatSequence(sequence: number): string {
  return sequence.toString().padStart(3, '0');
}

/**
 * Build code string from components
 * @param prefix - Code prefix (PRJ or BID)
 * @param year - 4-digit year
 * @param sequence - Sequence number
 * @returns Formatted code (e.g., "PRJ-2024-001")
 */
function buildCode(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${formatSequence(sequence)}`;
}

/**
 * Parse a code string into its components
 * @param code - The code string to parse
 * @returns Parsed components or null if invalid
 */
export function parseCode(code: string): { prefix: string; year: number; sequence: number } | null {
  const match = code.match(/^([A-Z]+)-(\d{4})-(\d{3})$/);
  if (!match) {
    return null;
  }
  
  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  };
}



// ============================================
// Main Generator Functions
// ============================================

/**
 * Generate a unique project code
 * 
 * Uses database transaction to ensure concurrent safety.
 * Format: PRJ-YYYY-NNN (e.g., PRJ-2024-001)
 * 
 * @param prisma - Prisma client instance
 * @returns Generated code result with code, year, and sequence
 * 
 * @example
 * ```ts
 * const result = await generateProjectCode(prisma);
 * console.log(result.code); // "PRJ-2024-001"
 * ```
 */
export async function generateProjectCode(prisma: PrismaClient): Promise<CodeGeneratorResult> {
  const year = getCurrentYear();
  const prefix = PROJECT_PREFIX;
  
  // Use transaction with serializable isolation to handle concurrency
  // Query existing codes for current year and find the next sequence
  const result = await prisma.$transaction(async (tx) => {
    // Get all project codes for current year
    const existingProjects = await tx.project.findMany({
      where: {
        code: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      select: {
        code: true,
      },
      orderBy: {
        code: 'desc',
      },
      take: 1,
    });
    
    // Calculate next sequence
    let nextSequence = 1;
    if (existingProjects.length > 0) {
      const parsed = parseCode(existingProjects[0].code);
      if (parsed) {
        nextSequence = parsed.sequence + 1;
      }
    }
    
    return {
      code: buildCode(prefix, year, nextSequence),
      year,
      sequence: nextSequence,
    };
  });
  
  return result;
}

/**
 * Generate a unique bid code
 * 
 * Uses database transaction to ensure concurrent safety.
 * Format: BID-YYYY-NNN (e.g., BID-2024-001)
 * 
 * @param prisma - Prisma client instance
 * @returns Generated code result with code, year, and sequence
 * 
 * @example
 * ```ts
 * const result = await generateBidCode(prisma);
 * console.log(result.code); // "BID-2024-042"
 * ```
 */
export async function generateBidCode(prisma: PrismaClient): Promise<CodeGeneratorResult> {
  const year = getCurrentYear();
  const prefix = BID_PREFIX;
  
  // Use transaction with serializable isolation to handle concurrency
  // Query existing codes for current year and find the next sequence
  const result = await prisma.$transaction(async (tx) => {
    // Get all bid codes for current year
    const existingBids = await tx.bid.findMany({
      where: {
        code: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      select: {
        code: true,
      },
      orderBy: {
        code: 'desc',
      },
      take: 1,
    });
    
    // Calculate next sequence
    let nextSequence = 1;
    if (existingBids.length > 0) {
      const parsed = parseCode(existingBids[0].code);
      if (parsed) {
        nextSequence = parsed.sequence + 1;
      }
    }
    
    return {
      code: buildCode(prefix, year, nextSequence),
      year,
      sequence: nextSequence,
    };
  });
  
  return result;
}

/**
 * Generate a unique escrow code
 * 
 * Uses database transaction to ensure concurrent safety.
 * Format: ESC-YYYY-NNN (e.g., ESC-2024-001)
 * 
 * **Feature: bidding-phase3-matching, Property 4: Escrow code uniqueness**
 * **Validates: Requirements 3.1**
 * 
 * @param prisma - Prisma client instance
 * @returns Generated code result with code, year, and sequence
 * 
 * @example
 * ```ts
 * const result = await generateEscrowCode(prisma);
 * console.log(result.code); // "ESC-2024-001"
 * ```
 */
export async function generateEscrowCode(prisma: PrismaClient): Promise<CodeGeneratorResult> {
  const year = getCurrentYear();
  const prefix = ESCROW_PREFIX;
  
  // Use transaction with serializable isolation to handle concurrency
  // Query existing codes for current year and find the next sequence
  const result = await prisma.$transaction(async (tx) => {
    // Get all escrow codes for current year
    const existingEscrows = await tx.escrow.findMany({
      where: {
        code: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      select: {
        code: true,
      },
      orderBy: {
        code: 'desc',
      },
      take: 1,
    });
    
    // Calculate next sequence
    let nextSequence = 1;
    if (existingEscrows.length > 0) {
      const parsed = parseCode(existingEscrows[0].code);
      if (parsed) {
        nextSequence = parsed.sequence + 1;
      }
    }
    
    return {
      code: buildCode(prefix, year, nextSequence),
      year,
      sequence: nextSequence,
    };
  });
  
  return result;
}

/**
 * Generate a unique fee transaction code
 * 
 * Uses database transaction to ensure concurrent safety.
 * Format: FEE-YYYY-NNN (e.g., FEE-2024-001)
 * 
 * **Feature: bidding-phase3-matching, Property 8: Fee transaction creation**
 * **Validates: Requirements 7.1**
 * 
 * @param prisma - Prisma client instance
 * @returns Generated code result with code, year, and sequence
 * 
 * @example
 * ```ts
 * const result = await generateFeeCode(prisma);
 * console.log(result.code); // "FEE-2024-001"
 * ```
 */
export async function generateFeeCode(prisma: PrismaClient): Promise<CodeGeneratorResult> {
  const year = getCurrentYear();
  const prefix = FEE_PREFIX;
  
  // Use transaction with serializable isolation to handle concurrency
  // Query existing codes for current year and find the next sequence
  const result = await prisma.$transaction(async (tx) => {
    // Get all fee transaction codes for current year
    const existingFees = await tx.feeTransaction.findMany({
      where: {
        code: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      select: {
        code: true,
      },
      orderBy: {
        code: 'desc',
      },
      take: 1,
    });
    
    // Calculate next sequence
    let nextSequence = 1;
    if (existingFees.length > 0) {
      const parsed = parseCode(existingFees[0].code);
      if (parsed) {
        nextSequence = parsed.sequence + 1;
      }
    }
    
    return {
      code: buildCode(prefix, year, nextSequence),
      year,
      sequence: nextSequence,
    };
  });
  
  return result;
}

/**
 * Validate a code format
 * 
 * @param code - The code to validate
 * @param expectedPrefix - Expected prefix (PRJ, BID, ESC, or FEE)
 * @returns true if valid, false otherwise
 * 
 * @example
 * ```ts
 * isValidCode('PRJ-2024-001', 'PRJ'); // true
 * isValidCode('BID-2024-042', 'BID'); // true
 * isValidCode('ESC-2024-001', 'ESC'); // true
 * isValidCode('FEE-2024-001', 'FEE'); // true
 * isValidCode('INVALID', 'PRJ'); // false
 * ```
 */
export function isValidCode(code: string, expectedPrefix?: string): boolean {
  const parsed = parseCode(code);
  if (!parsed) {
    return false;
  }
  
  // Check prefix if specified
  if (expectedPrefix && parsed.prefix !== expectedPrefix) {
    return false;
  }
  
  // Validate year is reasonable (2020-2100)
  if (parsed.year < 2020 || parsed.year > 2100) {
    return false;
  }
  
  // Validate sequence is positive
  if (parsed.sequence < 1 || parsed.sequence > 999) {
    return false;
  }
  
  return true;
}

/**
 * Check if a code is a project code
 */
export function isProjectCode(code: string): boolean {
  return isValidCode(code, PROJECT_PREFIX);
}

/**
 * Check if a code is a bid code
 */
export function isBidCode(code: string): boolean {
  return isValidCode(code, BID_PREFIX);
}

/**
 * Check if a code is an escrow code
 */
export function isEscrowCode(code: string): boolean {
  return isValidCode(code, ESCROW_PREFIX);
}

/**
 * Check if a code is a fee transaction code
 */
export function isFeeCode(code: string): boolean {
  return isValidCode(code, FEE_PREFIX);
}

export default {
  generateProjectCode,
  generateBidCode,
  generateEscrowCode,
  generateFeeCode,
  parseCode,
  isValidCode,
  isProjectCode,
  isBidCode,
  isEscrowCode,
  isFeeCode,
};
