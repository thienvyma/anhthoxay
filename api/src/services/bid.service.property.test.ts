/**
 * Property-Based Tests for Bid Service
 * Using fast-check for property testing
 *
 * These tests verify the correctness properties defined in the design document.
 * **Feature: bidding-phase2-core**
 */

import * as fc from 'fast-check';
import { parseCode, isValidCode } from '../utils/code-generator';
import type { BidStatus } from '../schemas/bid.schema';

// ============================================
// CONSTANTS
// ============================================

const ALL_BID_STATUSES: BidStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SELECTED',
  'NOT_SELECTED',
  'WITHDRAWN',
];

// Anonymous labels used in homeowner view
const ANONYMOUS_LABELS = [
  'Nhà thầu A', 'Nhà thầu B', 'Nhà thầu C', 'Nhà thầu D', 'Nhà thầu E',
  'Nhà thầu F', 'Nhà thầu G', 'Nhà thầu H', 'Nhà thầu I', 'Nhà thầu J',
  'Nhà thầu K', 'Nhà thầu L', 'Nhà thầu M', 'Nhà thầu N', 'Nhà thầu O',
  'Nhà thầu P', 'Nhà thầu Q', 'Nhà thầu R', 'Nhà thầu S', 'Nhà thầu T',
];

// Verification statuses for contractors
const VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;

// Project statuses
const PROJECT_STATUSES = [
  'DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'OPEN', 
  'BIDDING_CLOSED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
] as const;

// ============================================
// GENERATORS
// ============================================

// Bid status generator (used in type definitions)
const _bidStatusArb = fc.constantFrom(...ALL_BID_STATUSES);
void _bidStatusArb; // Suppress unused warning - kept for future use

// User ID generator
const userIdArb = fc.uuid();

// Bid code generator (valid format)
const bidCodeArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2100 }),
    fc.integer({ min: 1, max: 999 })
  )
  .map(([year, seq]) => `BID-${year}-${seq.toString().padStart(3, '0')}`);

// Project code generator
const projectCodeArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2100 }),
    fc.integer({ min: 1, max: 999 })
  )
  .map(([year, seq]) => `PRJ-${year}-${seq.toString().padStart(3, '0')}`);

// Price generator (positive, reasonable range) - use integer for large values
const priceArb = fc.integer({ min: 1000, max: 1000000000 });

// Timeline generator
const timelineArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

// Proposal generator
const proposalArb = fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0);

// Email generator
const emailArb = fc.emailAddress();

// Phone generator
const phoneArb = fc.stringMatching(/^0[0-9]{9}$/);

// Contractor name generator - distinctive names
const contractorNameArb = fc.string({ minLength: 5, maxLength: 50 })
  .filter((s) => s.trim().length >= 5 && !s.includes('@') && !s.includes('.'));

// Verification status generator (used in type definitions)
const _verificationStatusArb = fc.constantFrom(...VERIFICATION_STATUSES);
void _verificationStatusArb; // Suppress unused warning - kept for future use

// Project status generator (used in type definitions)
const _projectStatusArb = fc.constantFrom(...PROJECT_STATUSES);
void _projectStatusArb; // Suppress unused warning - kept for future use

// Valid date generator
const validDateArb = fc
  .integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
  .map((ts) => new Date(ts));

// Future date generator for bid deadlines
// Use a function to ensure Date.now() is evaluated at test time, not module load time
// Add a buffer of 1 hour to avoid race conditions
const futureDateArb = fc
  .integer({ min: 1, max: 30 * 24 }) // hours from now (1 hour to 30 days)
  .map((hoursFromNow) => new Date(Date.now() + hoursFromNow * 60 * 60 * 1000));

// Past date generator
const pastDateArb = fc
  .integer({ min: Date.parse('2020-01-01'), max: Date.now() - 1000 })
  .map((ts) => new Date(ts));


// ============================================
// PROPERTY 5: Bid code uniqueness
// **Feature: bidding-phase2-core, Property 5: Bid code uniqueness**
// **Validates: Requirements 6.1**
// ============================================

describe('Property 5: Bid code uniqueness', () => {
  it('*For any* set of sequentially generated bid codes, all codes SHALL be unique', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2100 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 2, max: 50 }),
        (year, startSeq, count) => {
          // Generate sequential codes (simulating what the code generator does)
          const codes: string[] = [];
          for (let i = 0; i < count; i++) {
            const seq = startSeq + i;
            if (seq > 999) break; // Don't exceed max sequence
            codes.push(`BID-${year}-${seq.toString().padStart(3, '0')}`);
          }
          
          // All sequentially generated codes should be unique
          const uniqueCodes = new Set(codes);
          return uniqueCodes.size === codes.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('bid codes SHALL follow the format BID-YYYY-NNN', () => {
    fc.assert(
      fc.property(bidCodeArb, (code) => {
        // Validate format using the parseCode utility
        const parsed = parseCode(code);
        if (!parsed) return false;

        // Check prefix
        if (parsed.prefix !== 'BID') return false;

        // Check year is valid
        if (parsed.year < 2020 || parsed.year > 2100) return false;

        // Check sequence is valid
        if (parsed.sequence < 1 || parsed.sequence > 999) return false;

        // Validate using isValidCode
        return isValidCode(code, 'BID');
      }),
      { numRuns: 100 }
    );
  });

  it('sequential bid codes SHALL have incrementing sequence numbers within the same year', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2100 }),
        fc.integer({ min: 1, max: 998 }),
        (year, startSeq) => {
          const code1 = `BID-${year}-${startSeq.toString().padStart(3, '0')}`;
          const code2 = `BID-${year}-${(startSeq + 1).toString().padStart(3, '0')}`;

          const parsed1 = parseCode(code1);
          const parsed2 = parseCode(code2);

          if (!parsed1 || !parsed2) return false;

          // Same year, sequence should increment by 1
          return (
            parsed1.year === parsed2.year &&
            parsed2.sequence === parsed1.sequence + 1
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('bid codes and project codes SHALL have different prefixes', () => {
    fc.assert(
      fc.property(bidCodeArb, projectCodeArb, (bidCode, projectCode) => {
        const parsedBid = parseCode(bidCode);
        const parsedProject = parseCode(projectCode);

        if (!parsedBid || !parsedProject) return false;

        // Prefixes should be different
        return parsedBid.prefix === 'BID' && parsedProject.prefix === 'PRJ';
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 6: Bid contractor uniqueness per project
// **Feature: bidding-phase2-core, Property 6: Bid contractor uniqueness per project**
// **Validates: Requirements 6.5, 7.5**
// ============================================

describe('Property 6: Bid contractor uniqueness per project', () => {
  // Simulate the unique constraint check
  interface BidRecord {
    projectId: string;
    contractorId: string;
  }

  function checkBidUniqueness(existingBids: BidRecord[], newBid: BidRecord): boolean {
    // Check if contractor already has a bid on this project
    return !existingBids.some(
      (bid) => bid.projectId === newBid.projectId && bid.contractorId === newBid.contractorId
    );
  }

  function simulateBidCreation(
    existingBids: BidRecord[],
    newBid: BidRecord
  ): { success: boolean; error?: string } {
    if (!checkBidUniqueness(existingBids, newBid)) {
      return { success: false, error: 'BID_ALREADY_EXISTS' };
    }
    return { success: true };
  }

  it('*For any* project, a contractor SHALL have at most one bid', () => {
    fc.assert(
      fc.property(
        userIdArb, // projectId
        userIdArb, // contractorId
        (projectId, contractorId) => {
          // First bid should succeed
          const existingBids: BidRecord[] = [];
          const firstBid = { projectId, contractorId };
          const result1 = simulateBidCreation(existingBids, firstBid);
          
          if (!result1.success) return false;
          
          // Add the first bid to existing bids
          existingBids.push(firstBid);
          
          // Second bid from same contractor on same project should fail
          const secondBid = { projectId, contractorId };
          const result2 = simulateBidCreation(existingBids, secondBid);
          
          return result2.success === false && result2.error === 'BID_ALREADY_EXISTS';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* contractor, they CAN bid on different projects', () => {
    fc.assert(
      fc.property(
        userIdArb, // projectId1
        userIdArb, // projectId2
        userIdArb, // contractorId
        (projectId1, projectId2, contractorId) => {
          // Skip if projects are the same
          if (projectId1 === projectId2) return true;

          const existingBids: BidRecord[] = [];
          
          // First bid on project1 should succeed
          const bid1 = { projectId: projectId1, contractorId };
          const result1 = simulateBidCreation(existingBids, bid1);
          if (!result1.success) return false;
          existingBids.push(bid1);
          
          // Second bid on project2 should also succeed (different project)
          const bid2 = { projectId: projectId2, contractorId };
          const result2 = simulateBidCreation(existingBids, bid2);
          
          return result2.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* project, different contractors CAN bid', () => {
    fc.assert(
      fc.property(
        userIdArb, // projectId
        userIdArb, // contractorId1
        userIdArb, // contractorId2
        (projectId, contractorId1, contractorId2) => {
          // Skip if contractors are the same
          if (contractorId1 === contractorId2) return true;

          const existingBids: BidRecord[] = [];
          
          // First contractor's bid should succeed
          const bid1 = { projectId, contractorId: contractorId1 };
          const result1 = simulateBidCreation(existingBids, bid1);
          if (!result1.success) return false;
          existingBids.push(bid1);
          
          // Second contractor's bid should also succeed (different contractor)
          const bid2 = { projectId, contractorId: contractorId2 };
          const result2 = simulateBidCreation(existingBids, bid2);
          
          return result2.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('uniqueness constraint SHALL be enforced by projectId AND contractorId combination', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            projectId: userIdArb,
            contractorId: userIdArb,
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (bids) => {
          // Create a set of unique combinations
          const combinations = new Set(
            bids.map((b) => `${b.projectId}:${b.contractorId}`)
          );
          
          // Simulate adding bids one by one
          const existingBids: BidRecord[] = [];
          let successCount = 0;
          
          for (const bid of bids) {
            const result = simulateBidCreation(existingBids, bid);
            if (result.success) {
              existingBids.push(bid);
              successCount++;
            }
          }
          
          // Number of successful bids should equal number of unique combinations
          return successCount === combinations.size;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 7: Bid creation validation
// **Feature: bidding-phase2-core, Property 7: Bid creation validation**
// **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
// ============================================

describe('Property 7: Bid creation validation', () => {
  // Simulate bid creation validation
  interface ContractorInfo {
    id: string;
    verificationStatus: typeof VERIFICATION_STATUSES[number];
  }

  interface ProjectInfo {
    id: string;
    status: typeof PROJECT_STATUSES[number];
    bidDeadline: Date | null;
    maxBids: number;
    currentBidCount: number;
  }

  interface BidCreationContext {
    contractor: ContractorInfo;
    project: ProjectInfo;
    existingBidFromContractor: boolean;
  }

  function validateBidCreation(
    context: BidCreationContext
  ): { valid: boolean; error?: string } {
    // Requirements 7.1 - Contractor must be VERIFIED
    if (context.contractor.verificationStatus !== 'VERIFIED') {
      return { valid: false, error: 'CONTRACTOR_NOT_VERIFIED' };
    }

    // Requirements 7.2 - Project must be OPEN
    if (context.project.status !== 'OPEN') {
      return { valid: false, error: 'BID_PROJECT_NOT_OPEN' };
    }

    // Requirements 7.3 - Deadline must not have passed
    if (!context.project.bidDeadline || context.project.bidDeadline <= new Date()) {
      return { valid: false, error: 'BID_DEADLINE_PASSED' };
    }

    // Requirements 7.4 - Check maxBids limit
    if (context.project.currentBidCount >= context.project.maxBids) {
      return { valid: false, error: 'BID_MAX_REACHED' };
    }

    // Requirements 7.5 - Contractor hasn't already bid
    if (context.existingBidFromContractor) {
      return { valid: false, error: 'BID_ALREADY_EXISTS' };
    }

    return { valid: true };
  }

  it('*For any* bid creation attempt, the system SHALL reject if contractor is not VERIFIED', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.constantFrom('PENDING', 'REJECTED') as fc.Arbitrary<typeof VERIFICATION_STATUSES[number]>,
        userIdArb,
        futureDateArb,
        fc.integer({ min: 1, max: 20 }),
        (contractorId, verificationStatus, projectId, deadline, maxBids) => {
          const context: BidCreationContext = {
            contractor: { id: contractorId, verificationStatus },
            project: {
              id: projectId,
              status: 'OPEN',
              bidDeadline: deadline,
              maxBids,
              currentBidCount: 0,
            },
            existingBidFromContractor: false,
          };

          const result = validateBidCreation(context);
          return result.valid === false && result.error === 'CONTRACTOR_NOT_VERIFIED';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* bid creation attempt, the system SHALL reject if project is not OPEN', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        fc.constantFrom(
          'DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'BIDDING_CLOSED', 
          'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
        ) as fc.Arbitrary<typeof PROJECT_STATUSES[number]>,
        futureDateArb,
        fc.integer({ min: 1, max: 20 }),
        (contractorId, projectId, projectStatus, deadline, maxBids) => {
          const context: BidCreationContext = {
            contractor: { id: contractorId, verificationStatus: 'VERIFIED' },
            project: {
              id: projectId,
              status: projectStatus,
              bidDeadline: deadline,
              maxBids,
              currentBidCount: 0,
            },
            existingBidFromContractor: false,
          };

          const result = validateBidCreation(context);
          return result.valid === false && result.error === 'BID_PROJECT_NOT_OPEN';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* bid creation attempt, the system SHALL reject if deadline has passed', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        pastDateArb,
        fc.integer({ min: 1, max: 20 }),
        (contractorId, projectId, pastDeadline, maxBids) => {
          const context: BidCreationContext = {
            contractor: { id: contractorId, verificationStatus: 'VERIFIED' },
            project: {
              id: projectId,
              status: 'OPEN',
              bidDeadline: pastDeadline,
              maxBids,
              currentBidCount: 0,
            },
            existingBidFromContractor: false,
          };

          const result = validateBidCreation(context);
          return result.valid === false && result.error === 'BID_DEADLINE_PASSED';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* bid creation attempt, the system SHALL reject if maxBids reached', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        futureDateArb,
        fc.integer({ min: 1, max: 20 }),
        (contractorId, projectId, deadline, maxBids) => {
          const context: BidCreationContext = {
            contractor: { id: contractorId, verificationStatus: 'VERIFIED' },
            project: {
              id: projectId,
              status: 'OPEN',
              bidDeadline: deadline,
              maxBids,
              currentBidCount: maxBids, // Already at max
            },
            existingBidFromContractor: false,
          };

          const result = validateBidCreation(context);
          return result.valid === false && result.error === 'BID_MAX_REACHED';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* valid bid creation context, the system SHALL accept the bid', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        futureDateArb,
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 19 }),
        (contractorId, projectId, deadline, maxBids, currentBidCount) => {
          // Ensure currentBidCount is less than maxBids
          const actualCurrentCount = Math.min(currentBidCount, maxBids - 1);

          const context: BidCreationContext = {
            contractor: { id: contractorId, verificationStatus: 'VERIFIED' },
            project: {
              id: projectId,
              status: 'OPEN',
              bidDeadline: deadline,
              maxBids,
              currentBidCount: actualCurrentCount,
            },
            existingBidFromContractor: false,
          };

          const result = validateBidCreation(context);
          return result.valid === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validation errors SHALL be returned in priority order', () => {
    // Test that validation checks happen in the correct order
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        pastDateArb,
        (contractorId, projectId, pastDeadline) => {
          // Context with multiple validation failures
          const context: BidCreationContext = {
            contractor: { id: contractorId, verificationStatus: 'PENDING' },
            project: {
              id: projectId,
              status: 'DRAFT',
              bidDeadline: pastDeadline,
              maxBids: 5,
              currentBidCount: 5,
            },
            existingBidFromContractor: true,
          };

          const result = validateBidCreation(context);
          
          // First check should be contractor verification
          return result.valid === false && result.error === 'CONTRACTOR_NOT_VERIFIED';
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 8: Homeowner bid view anonymization
// **Feature: bidding-phase2-core, Property 8: Homeowner bid view anonymization**
// **Validates: Requirements 9.2, 12.3**
// ============================================

describe('Property 8: Homeowner bid view anonymization', () => {
  // Simulate the full bid with contractor info
  interface FullBid {
    id: string;
    code: string;
    projectId: string;
    contractorId: string;
    price: number;
    timeline: string;
    proposal: string;
    attachments: Array<{ name: string; url: string; type: string }>;
    status: string;
    createdAt: Date;
    contractor: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      rating: number;
      totalProjects: number;
    };
  }

  // Anonymous bid for homeowner view
  interface AnonymousBid {
    id: string;
    code: string;
    anonymousName: string;
    contractorRating: number;
    contractorTotalProjects: number;
    price: number;
    timeline: string;
    proposal: string;
    attachments: Array<{ name: string; url: string; type: string }>;
    status: string;
    createdAt: string;
  }

  // Transform function (mirrors the service implementation)
  function transformToAnonymousBid(bid: FullBid, index: number): AnonymousBid {
    return {
      id: bid.id,
      code: bid.code,
      anonymousName: ANONYMOUS_LABELS[index] || `Nhà thầu ${index + 1}`,
      contractorRating: bid.contractor.rating,
      contractorTotalProjects: bid.contractor.totalProjects,
      price: bid.price,
      timeline: bid.timeline,
      proposal: bid.proposal,
      attachments: bid.attachments,
      status: bid.status,
      createdAt: bid.createdAt.toISOString(),
    };
  }

  // Generator for full bid with contractor info
  const fullBidArb = fc.record({
    id: userIdArb,
    code: bidCodeArb,
    projectId: userIdArb,
    contractorId: userIdArb,
    price: priceArb,
    timeline: timelineArb,
    proposal: proposalArb,
    attachments: fc.array(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        url: fc.webUrl(),
        type: fc.constantFrom('pdf', 'doc', 'docx', 'jpg', 'png'),
      }),
      { minLength: 0, maxLength: 5 }
    ),
    status: fc.constant('APPROVED'),
    createdAt: validDateArb,
    contractor: fc.record({
      id: userIdArb,
      name: contractorNameArb,
      email: emailArb,
      phone: fc.option(phoneArb, { nil: null }),
      rating: fc.float({ min: 0, max: 5, noNaN: true, noDefaultInfinity: true }),
      totalProjects: fc.integer({ min: 0, max: 1000 }),
    }),
  });

  it('*For any* bid displayed to a homeowner, the response SHALL NOT contain contractor name', () => {
    fc.assert(
      fc.property(fullBidArb, fc.integer({ min: 0, max: 19 }), (fullBid, index) => {
        const anonymousBid = transformToAnonymousBid(fullBid, index);
        
        // Anonymous bid should not have contractor name property
        const hasName = 'name' in anonymousBid;
        const hasContractorName = 'contractorName' in anonymousBid;
        
        // Check that contractor name doesn't appear in the response
        return !hasName && !hasContractorName;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* bid displayed to a homeowner, the response SHALL NOT contain contractor phone', () => {
    fc.assert(
      fc.property(fullBidArb, fc.integer({ min: 0, max: 19 }), (fullBid, index) => {
        const anonymousBid = transformToAnonymousBid(fullBid, index);
        
        // Anonymous bid should not have phone property
        const hasPhone = 'phone' in anonymousBid;
        const hasContractorPhone = 'contractorPhone' in anonymousBid;
        
        return !hasPhone && !hasContractorPhone;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* bid displayed to a homeowner, the response SHALL NOT contain contractor email', () => {
    fc.assert(
      fc.property(fullBidArb, fc.integer({ min: 0, max: 19 }), (fullBid, index) => {
        const anonymousBid = transformToAnonymousBid(fullBid, index);
        const anonymousBidStr = JSON.stringify(anonymousBid);
        
        // Email should never appear in anonymous response
        // Emails have @ symbol which makes them distinctive
        const containsEmail = anonymousBidStr.includes(fullBid.contractor.email);
        
        return !containsEmail;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* bid displayed to a homeowner, the response SHALL contain anonymous identifier', () => {
    fc.assert(
      fc.property(fullBidArb, fc.integer({ min: 0, max: 19 }), (fullBid, index) => {
        const anonymousBid = transformToAnonymousBid(fullBid, index);
        
        // Should have anonymousName
        const hasAnonymousName = 'anonymousName' in anonymousBid;
        
        // Anonymous name should be from the labels or follow the pattern
        const isValidAnonymousName = 
          ANONYMOUS_LABELS.includes(anonymousBid.anonymousName) ||
          /^Nhà thầu \d+$/.test(anonymousBid.anonymousName);
        
        return hasAnonymousName && isValidAnonymousName;
      }),
      { numRuns: 100 }
    );
  });

  it('anonymous bid SHALL preserve contractor rating and totalProjects', () => {
    fc.assert(
      fc.property(fullBidArb, fc.integer({ min: 0, max: 19 }), (fullBid, index) => {
        const anonymousBid = transformToAnonymousBid(fullBid, index);
        
        // Rating and totalProjects should be preserved
        const hasRating = anonymousBid.contractorRating === fullBid.contractor.rating;
        const hasTotalProjects = anonymousBid.contractorTotalProjects === fullBid.contractor.totalProjects;
        
        return hasRating && hasTotalProjects;
      }),
      { numRuns: 100 }
    );
  });

  it('anonymous bid SHALL preserve bid details (price, timeline, proposal)', () => {
    fc.assert(
      fc.property(fullBidArb, fc.integer({ min: 0, max: 19 }), (fullBid, index) => {
        const anonymousBid = transformToAnonymousBid(fullBid, index);
        
        // Bid details should be preserved
        const hasPrice = anonymousBid.price === fullBid.price;
        const hasTimeline = anonymousBid.timeline === fullBid.timeline;
        const hasProposal = anonymousBid.proposal === fullBid.proposal;
        const hasId = anonymousBid.id === fullBid.id;
        const hasCode = anonymousBid.code === fullBid.code;
        
        return hasPrice && hasTimeline && hasProposal && hasId && hasCode;
      }),
      { numRuns: 100 }
    );
  });

  it('anonymous bid SHALL NOT expose contractorId', () => {
    fc.assert(
      fc.property(fullBidArb, fc.integer({ min: 0, max: 19 }), (fullBid, index) => {
        const anonymousBid = transformToAnonymousBid(fullBid, index);
        
        // contractorId should not be in the response
        const hasContractorId = 'contractorId' in anonymousBid;
        
        return !hasContractorId;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* list of bids, each SHALL have a unique anonymous name', () => {
    fc.assert(
      fc.property(
        fc.array(fullBidArb, { minLength: 2, maxLength: 20 }),
        (bids) => {
          const anonymousBids = bids.map((bid, index) => transformToAnonymousBid(bid, index));
          
          // All anonymous names should be unique
          const names = anonymousBids.map((b) => b.anonymousName);
          const uniqueNames = new Set(names);
          
          return uniqueNames.size === names.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('anonymous names SHALL follow the pattern "Nhà thầu X" where X is A-T or a number', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 50 }), (index) => {
        const anonymousName = ANONYMOUS_LABELS[index] || `Nhà thầu ${index + 1}`;
        
        // Should match either "Nhà thầu A-T" or "Nhà thầu N"
        const isValidFormat = 
          /^Nhà thầu [A-T]$/.test(anonymousName) ||
          /^Nhà thầu \d+$/.test(anonymousName);
        
        return isValidFormat;
      }),
      { numRuns: 100 }
    );
  });
});

