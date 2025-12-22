/**
 * Property-Based Tests for Contractor Directory
 * Using fast-check for property testing
 *
 * **Feature: bidding-phase6-portal, Property 10: Contractor Directory Verified Only**
 * **Validates: Requirements 14.1**
 *
 * Property 10: *For any* contractor directory listing, only contractors with
 * VERIFIED status should be displayed.
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';

// ============================================
// TYPES (matching api.ts and ContractorDirectoryPage.tsx)
// ============================================

type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

interface ContractorProfile {
  id: string;
  userId: string;
  description?: string;
  experience?: number;
  specialties?: string[];
  serviceAreas?: string[];
}

interface Contractor {
  id: string;
  name: string;
  email: string;
  verificationStatus: VerificationStatus;
  rating?: number;
  totalProjects?: number;
  profile?: ContractorProfile;
}

interface ContractorRanking {
  id: string;
  contractorId: string;
  contractor?: Contractor;
  totalScore: number;
  ratingScore: number;
  projectsScore: number;
  responseScore: number;
  verificationScore: number;
  rank?: number;
  isFeatured: boolean;
}

interface RankingQuery {
  page?: number;
  limit?: number;
  regionId?: string;
  specialty?: string;
}

interface RankingResult {
  data: ContractorRanking[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// CONTRACTOR DIRECTORY FILTER LOGIC (isolated for testing)
// ============================================

/**
 * Pure function that filters contractors for directory display.
 * Only VERIFIED contractors should be shown.
 *
 * Requirements: 14.1 - Only VERIFIED contractors in directory
 */
function filterContractorDirectory(
  allRankings: ContractorRanking[],
  query: RankingQuery = {}
): RankingResult {
  // CORE FILTER: Only VERIFIED contractors (Requirement 14.1)
  let filtered = allRankings.filter(
    (ranking) => ranking.contractor?.verificationStatus === 'VERIFIED'
  );

  // Apply region filter
  if (query.regionId) {
    const regionId = query.regionId;
    filtered = filtered.filter((ranking) =>
      ranking.contractor?.profile?.serviceAreas?.includes(regionId)
    );
  }

  // Apply specialty filter
  if (query.specialty) {
    const specialty = query.specialty;
    filtered = filtered.filter((ranking) =>
      ranking.contractor?.profile?.specialties?.includes(specialty)
    );
  }

  // Sort by total score (default)
  filtered.sort((a, b) => b.totalScore - a.totalScore);

  // Apply pagination
  const page = query.page || 1;
  const limit = query.limit || 12;
  const startIndex = (page - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    meta: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
}

// ============================================
// GENERATORS
// ============================================

// Verification status generator
const verificationStatusArb = fc.constantFrom<VerificationStatus>(
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

// Non-verified statuses
const nonVerifiedStatusArb = fc.constantFrom<VerificationStatus>('PENDING', 'REJECTED');

// Contractor profile generator
const contractorProfileArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  description: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
  experience: fc.option(fc.integer({ min: 1, max: 30 }), { nil: undefined }),
  specialties: fc.option(
    fc.array(fc.constantFrom('Sơn', 'Ốp lát', 'Điện', 'Nước', 'Xây dựng'), { minLength: 1, maxLength: 5 }),
    { nil: undefined }
  ),
  serviceAreas: fc.option(fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }), { nil: undefined }),
});

// Contractor generator
const contractorArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
  email: fc.emailAddress(),
  verificationStatus: verificationStatusArb,
  rating: fc.option(fc.float({ min: 0, max: 5 }), { nil: undefined }),
  totalProjects: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  profile: fc.option(contractorProfileArb, { nil: undefined }),
});

// Verified contractor
const verifiedContractorArb = contractorArb.map((c) => ({
  ...c,
  verificationStatus: 'VERIFIED' as VerificationStatus,
}));

// Non-verified contractor
const nonVerifiedContractorArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
  email: fc.emailAddress(),
  verificationStatus: nonVerifiedStatusArb,
  rating: fc.option(fc.float({ min: 0, max: 5 }), { nil: undefined }),
  totalProjects: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  profile: fc.option(contractorProfileArb, { nil: undefined }),
});

// Contractor ranking generator
const contractorRankingArb = fc.record({
  id: fc.uuid(),
  contractorId: fc.uuid(),
  contractor: fc.option(contractorArb, { nil: undefined }),
  totalScore: fc.integer({ min: 0, max: 100 }),
  ratingScore: fc.integer({ min: 0, max: 100 }),
  projectsScore: fc.integer({ min: 0, max: 100 }),
  responseScore: fc.integer({ min: 0, max: 100 }),
  verificationScore: fc.integer({ min: 0, max: 100 }),
  rank: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
  isFeatured: fc.boolean(),
});

// Ranking with verified contractor
const verifiedRankingArb = fc
  .tuple(contractorRankingArb, verifiedContractorArb)
  .map(([ranking, contractor]) => ({
    ...ranking,
    contractor,
    contractorId: contractor.id,
  }));

// Ranking with non-verified contractor
const nonVerifiedRankingArb = fc
  .tuple(contractorRankingArb, nonVerifiedContractorArb)
  .map(([ranking, contractor]) => ({
    ...ranking,
    contractor,
    contractorId: contractor.id,
  }));

// Ranking query generator
const rankingQueryArb = fc.record({
  page: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
  limit: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
  regionId: fc.option(fc.uuid(), { nil: undefined }),
  specialty: fc.option(fc.constantFrom('Sơn', 'Ốp lát', 'Điện', 'Nước', 'Xây dựng'), { nil: undefined }),
});

// ============================================
// PROPERTY 10: Contractor Directory Verified Only
// **Feature: bidding-phase6-portal, Property 10: Contractor Directory Verified Only**
// **Validates: Requirements 14.1**
// ============================================

describe('Property 10: Contractor Directory Verified Only', () => {
  it('*For any* contractor directory listing, only VERIFIED contractors should be displayed', () => {
    fc.assert(
      fc.property(
        fc.array(contractorRankingArb, { minLength: 0, maxLength: 50 }),
        rankingQueryArb,
        (rankings, query) => {
          const result = filterContractorDirectory(rankings, query);

          // CORE PROPERTY: All returned contractors must be VERIFIED
          const allVerified = result.data.every(
            (ranking) => ranking.contractor?.verificationStatus === 'VERIFIED'
          );

          return allVerified;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* ranking list, non-VERIFIED contractors should never appear in directory', () => {
    fc.assert(
      fc.property(
        fc.array(contractorRankingArb, { minLength: 1, maxLength: 50 }),
        (rankings) => {
          const result = filterContractorDirectory(rankings);

          // No non-VERIFIED contractors should appear
          const noNonVerified = result.data.every(
            (ranking) => ranking.contractor?.verificationStatus === 'VERIFIED'
          );

          // Count of results should match count of VERIFIED contractors
          const verifiedCount = rankings.filter(
            (r) => r.contractor?.verificationStatus === 'VERIFIED'
          ).length;
          const correctCount = result.meta.total === verifiedCount;

          return noNonVerified && correctCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* list with only non-VERIFIED contractors, directory should return empty results', () => {
    fc.assert(
      fc.property(
        fc.array(nonVerifiedRankingArb, { minLength: 1, maxLength: 30 }),
        (rankings) => {
          const result = filterContractorDirectory(rankings);

          return result.data.length === 0 && result.meta.total === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* list with only VERIFIED contractors, all should appear in directory', () => {
    fc.assert(
      fc.property(
        fc.array(verifiedRankingArb, { minLength: 1, maxLength: 30 }),
        (rankings) => {
          const result = filterContractorDirectory(rankings, { limit: 1000 });

          return result.meta.total === rankings.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* PENDING contractor, they should not appear in directory', () => {
    fc.assert(
      fc.property(
        fc.array(contractorRankingArb, { minLength: 1, maxLength: 30 }),
        (rankings) => {
          // Ensure some contractors are PENDING
          const rankingsWithPending = rankings.map((r, i) => ({
            ...r,
            contractor: r.contractor
              ? {
                  ...r.contractor,
                  verificationStatus: i % 2 === 0 ? 'PENDING' as VerificationStatus : r.contractor.verificationStatus,
                }
              : undefined,
          }));

          const result = filterContractorDirectory(rankingsWithPending);

          // No PENDING contractors should appear
          return result.data.every(
            (ranking) => ranking.contractor?.verificationStatus !== 'PENDING'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* REJECTED contractor, they should not appear in directory', () => {
    fc.assert(
      fc.property(
        fc.array(contractorRankingArb, { minLength: 1, maxLength: 30 }),
        (rankings) => {
          // Ensure some contractors are REJECTED
          const rankingsWithRejected = rankings.map((r, i) => ({
            ...r,
            contractor: r.contractor
              ? {
                  ...r.contractor,
                  verificationStatus: i % 2 === 0 ? 'REJECTED' as VerificationStatus : r.contractor.verificationStatus,
                }
              : undefined,
          }));

          const result = filterContractorDirectory(rankingsWithRejected);

          // No REJECTED contractors should appear
          return result.data.every(
            (ranking) => ranking.contractor?.verificationStatus !== 'REJECTED'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* filter combination, VERIFIED status filter should always apply', () => {
    fc.assert(
      fc.property(
        fc.array(contractorRankingArb, { minLength: 1, maxLength: 50 }),
        rankingQueryArb,
        (rankings, query) => {
          const result = filterContractorDirectory(rankings, query);

          // Regardless of other filters, all results must be VERIFIED
          return result.data.every(
            (ranking) => ranking.contractor?.verificationStatus === 'VERIFIED'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// ADDITIONAL FILTER TESTS
// ============================================

describe('Contractor Directory Filter Tests', () => {
  it('*For any* specialty filter, only VERIFIED contractors with that specialty should appear', () => {
    fc.assert(
      fc.property(
        fc.array(verifiedRankingArb, { minLength: 1, maxLength: 30 }),
        fc.constantFrom('Sơn', 'Ốp lát', 'Điện', 'Nước', 'Xây dựng'),
        (rankings, specialty) => {
          // Assign specialty to some contractors
          const rankingsWithSpecialty = rankings.map((r, i) => ({
            ...r,
            contractor: r.contractor
              ? {
                  ...r.contractor,
                  profile: {
                    ...r.contractor.profile,
                    id: r.contractor.profile?.id || r.id,
                    userId: r.contractor.profile?.userId || r.contractor.id,
                    specialties: i % 2 === 0 ? [specialty] : r.contractor.profile?.specialties,
                  },
                }
              : undefined,
          }));

          const result = filterContractorDirectory(rankingsWithSpecialty, { specialty });

          // All results must be VERIFIED AND have the specialty
          const allValid = result.data.every(
            (ranking) =>
              ranking.contractor?.verificationStatus === 'VERIFIED' &&
              ranking.contractor?.profile?.specialties?.includes(specialty)
          );

          return allValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* region filter, only VERIFIED contractors in that region should appear', () => {
    fc.assert(
      fc.property(
        fc.array(verifiedRankingArb, { minLength: 1, maxLength: 30 }),
        fc.uuid(),
        (rankings, regionId) => {
          // Assign region to some contractors
          const rankingsWithRegion = rankings.map((r, i) => ({
            ...r,
            contractor: r.contractor
              ? {
                  ...r.contractor,
                  profile: {
                    ...r.contractor.profile,
                    id: r.contractor.profile?.id || r.id,
                    userId: r.contractor.profile?.userId || r.contractor.id,
                    serviceAreas: i % 2 === 0 ? [regionId] : r.contractor.profile?.serviceAreas,
                  },
                }
              : undefined,
          }));

          const result = filterContractorDirectory(rankingsWithRegion, { regionId });

          // All results must be VERIFIED AND serve the region
          const allValid = result.data.every(
            (ranking) =>
              ranking.contractor?.verificationStatus === 'VERIFIED' &&
              ranking.contractor?.profile?.serviceAreas?.includes(regionId)
          );

          return allValid;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('Contractor Directory Edge Cases', () => {
  it('should handle empty ranking list', () => {
    fc.assert(
      fc.property(rankingQueryArb, (query) => {
        const result = filterContractorDirectory([], query);

        return result.data.length === 0 && result.meta.total === 0;
      }),
      { numRuns: 50 }
    );
  });

  it('should be deterministic - same input produces same output', () => {
    fc.assert(
      fc.property(
        fc.array(contractorRankingArb, { minLength: 1, maxLength: 20 }),
        rankingQueryArb,
        (rankings, query) => {
          const result1 = filterContractorDirectory(rankings, query);
          const result2 = filterContractorDirectory(rankings, query);

          const sameData = JSON.stringify(result1.data) === JSON.stringify(result2.data);
          const sameMeta = JSON.stringify(result1.meta) === JSON.stringify(result2.meta);

          return sameData && sameMeta;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('pagination should work correctly with VERIFIED filter', () => {
    fc.assert(
      fc.property(
        fc.array(verifiedRankingArb, { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        (rankings, page, limit) => {
          const result = filterContractorDirectory(rankings, { page, limit });

          // Page size should be correct
          const correctPageSize = result.data.length <= limit;

          // All results should still be VERIFIED
          const allVerified = result.data.every(
            (r) => r.contractor?.verificationStatus === 'VERIFIED'
          );

          return correctPageSize && allVerified;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle rankings without contractor data', () => {
    fc.assert(
      fc.property(
        fc.array(
          contractorRankingArb.map((r) => ({ ...r, contractor: undefined })),
          { minLength: 1, maxLength: 20 }
        ),
        (rankings) => {
          const result = filterContractorDirectory(rankings);

          // Should return empty since no contractor has VERIFIED status
          return result.data.length === 0 && result.meta.total === 0;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('results should be sorted by totalScore descending', () => {
    fc.assert(
      fc.property(
        fc.array(verifiedRankingArb, { minLength: 2, maxLength: 30 }),
        (rankings) => {
          const result = filterContractorDirectory(rankings, { limit: 1000 });

          // Check that results are sorted by totalScore descending
          for (let i = 1; i < result.data.length; i++) {
            if (result.data[i].totalScore > result.data[i - 1].totalScore) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
