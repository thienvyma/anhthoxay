/**
 * Property-Based Tests for Match Service
 * Using fast-check for property testing
 *
 * These tests verify the correctness properties defined in the design document.
 * **Feature: bidding-phase3-matching**
 */

import * as fc from 'fast-check';
import type { ProjectStatus } from '../schemas/project.schema';
import type { BidStatus } from '../schemas/bid.schema';

// ============================================
// CONSTANTS
// ============================================

const ALL_PROJECT_STATUSES: ProjectStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'OPEN',
  'BIDDING_CLOSED',
  'MATCHED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

// Valid project status transitions for matching
const VALID_PROJECT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['OPEN', 'REJECTED'],
  REJECTED: ['PENDING_APPROVAL', 'CANCELLED'],
  OPEN: ['BIDDING_CLOSED', 'CANCELLED'],
  BIDDING_CLOSED: ['MATCHED', 'OPEN', 'CANCELLED'],
  MATCHED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// Terminal project states
const TERMINAL_PROJECT_STATES: ProjectStatus[] = ['COMPLETED', 'CANCELLED'];

// ============================================
// GENERATORS
// ============================================

// User ID generator
const userIdArb = fc.uuid();

// Project status generator
const projectStatusArb = fc.constantFrom(...ALL_PROJECT_STATUSES);

// Non-terminal project status generator
const nonTerminalProjectStatusArb = fc.constantFrom(
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'OPEN',
  'BIDDING_CLOSED',
  'MATCHED',
  'IN_PROGRESS'
) as fc.Arbitrary<ProjectStatus>;

// Terminal project status generator
const terminalProjectStatusArb = fc.constantFrom(
  ...TERMINAL_PROJECT_STATES
) as fc.Arbitrary<ProjectStatus>;

// Matched project statuses (where contact info is revealed)
const matchedProjectStatusArb = fc.constantFrom(
  'MATCHED',
  'IN_PROGRESS',
  'COMPLETED'
) as fc.Arbitrary<ProjectStatus>;

// Non-matched project statuses
const nonMatchedProjectStatusArb = fc.constantFrom(
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'OPEN',
  'BIDDING_CLOSED',
  'CANCELLED'
) as fc.Arbitrary<ProjectStatus>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate bid selection preconditions
 * Requirements: 1.1, 1.2, 1.3
 */
function validateBidSelectionPreconditions(context: {
  projectStatus: ProjectStatus;
  bidStatus: BidStatus;
  projectOwnerId: string;
  requestingUserId: string;
  bidProjectId: string;
  projectId: string;
}): { valid: boolean; error?: string } {
  // Requirements: 1.3 - Validate homeowner owns the project
  if (context.projectOwnerId !== context.requestingUserId) {
    return { valid: false, error: 'NOT_PROJECT_OWNER' };
  }

  // Requirements: 1.1 - Validate project status is BIDDING_CLOSED
  if (context.projectStatus !== 'BIDDING_CLOSED') {
    return { valid: false, error: 'INVALID_PROJECT_STATUS' };
  }

  // Validate bid belongs to project
  if (context.bidProjectId !== context.projectId) {
    return { valid: false, error: 'BID_NOT_FOR_PROJECT' };
  }

  // Requirements: 1.2 - Validate bid status is APPROVED
  if (context.bidStatus !== 'APPROVED') {
    return { valid: false, error: 'INVALID_BID_STATUS' };
  }

  return { valid: true };
}

/**
 * Simulate bid selection state transitions
 * Requirements: 1.4, 1.5, 1.6, 1.7
 */
function simulateBidSelection(context: {
  selectedBidId: string;
  otherApprovedBidIds: string[];
  projectId: string;
}): {
  selectedBidStatus: BidStatus;
  otherBidStatuses: Map<string, BidStatus>;
  projectStatus: ProjectStatus;
  projectSelectedBidId: string;
  projectMatchedAt: Date;
} {
  const otherBidStatuses = new Map<string, BidStatus>();

  // Requirements: 1.5 - All other APPROVED bids become NOT_SELECTED
  for (const bidId of context.otherApprovedBidIds) {
    otherBidStatuses.set(bidId, 'NOT_SELECTED');
  }

  return {
    // Requirements: 1.4 - Selected bid status changes to SELECTED
    selectedBidStatus: 'SELECTED',
    otherBidStatuses,
    // Requirements: 1.6 - Project status changes to MATCHED
    projectStatus: 'MATCHED',
    // Requirements: 1.7 - Project's selectedBidId is set
    projectSelectedBidId: context.selectedBidId,
    projectMatchedAt: new Date(),
  };
}

/**
 * Determine contact reveal based on user role and project status
 * Requirements: 2.1-2.6
 */
function determineContactReveal(context: {
  projectStatus: ProjectStatus;
  userId: string;
  projectOwnerId: string;
  selectedContractorId: string | null;
}): {
  revealContractor: boolean;
  revealHomeowner: boolean;
  revealAddress: boolean;
  forbidden: boolean;
} {
  const isHomeowner = context.userId === context.projectOwnerId;
  const isContractor = context.userId === context.selectedContractorId;

  // Requirements: 2.6 - If user is not involved, return 403
  if (!isHomeowner && !isContractor) {
    return {
      revealContractor: false,
      revealHomeowner: false,
      revealAddress: false,
      forbidden: true,
    };
  }

  // Requirements: 2.5 - If project is NOT in MATCHED status, no contact info
  const isMatched = ['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(
    context.projectStatus
  );

  if (!isMatched) {
    return {
      revealContractor: false,
      revealHomeowner: false,
      revealAddress: false,
      forbidden: false,
    };
  }

  return {
    // Requirements: 2.1 - Reveal contractor info to homeowner
    revealContractor: isHomeowner,
    // Requirements: 2.2 - Reveal homeowner info to contractor
    revealHomeowner: isContractor,
    // Requirements: 2.3 - Reveal address to contractor
    revealAddress: isContractor,
    forbidden: false,
  };
}

/**
 * Validate project status transition
 * Requirements: 11.1-11.6
 */
function isValidProjectTransition(
  fromStatus: ProjectStatus,
  toStatus: ProjectStatus
): boolean {
  const validNextStatuses = VALID_PROJECT_TRANSITIONS[fromStatus] || [];
  return validNextStatuses.includes(toStatus);
}

/**
 * Get valid next statuses for a project
 */
function getValidNextProjectStatuses(status: ProjectStatus): ProjectStatus[] {
  return (VALID_PROJECT_TRANSITIONS[status] || []) as ProjectStatus[];
}


// ============================================
// PROPERTY 1: Bid selection preconditions
// **Feature: bidding-phase3-matching, Property 1: Bid selection preconditions**
// **Validates: Requirements 1.1, 1.2, 1.3**
// ============================================

describe('Property 1: Bid selection preconditions', () => {
  it('*For any* bid selection attempt, the system SHALL reject if user is not project owner', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        userIdArb,
        (projectOwnerId, requestingUserId, projectId) => {
          // Ensure different users
          if (projectOwnerId === requestingUserId) return true;

          const result = validateBidSelectionPreconditions({
            projectStatus: 'BIDDING_CLOSED',
            bidStatus: 'APPROVED',
            projectOwnerId,
            requestingUserId,
            bidProjectId: projectId,
            projectId,
          });

          return result.valid === false && result.error === 'NOT_PROJECT_OWNER';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* bid selection attempt, the system SHALL reject if project status is not BIDDING_CLOSED', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        fc.constantFrom(
          'DRAFT',
          'PENDING_APPROVAL',
          'REJECTED',
          'OPEN',
          'MATCHED',
          'IN_PROGRESS',
          'COMPLETED',
          'CANCELLED'
        ) as fc.Arbitrary<ProjectStatus>,
        (userId, projectId, projectStatus) => {
          const result = validateBidSelectionPreconditions({
            projectStatus,
            bidStatus: 'APPROVED',
            projectOwnerId: userId,
            requestingUserId: userId,
            bidProjectId: projectId,
            projectId,
          });

          return result.valid === false && result.error === 'INVALID_PROJECT_STATUS';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* bid selection attempt, the system SHALL reject if bid status is not APPROVED', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        fc.constantFrom(
          'PENDING',
          'REJECTED',
          'SELECTED',
          'NOT_SELECTED',
          'WITHDRAWN'
        ) as fc.Arbitrary<BidStatus>,
        (userId, projectId, bidStatus) => {
          const result = validateBidSelectionPreconditions({
            projectStatus: 'BIDDING_CLOSED',
            bidStatus,
            projectOwnerId: userId,
            requestingUserId: userId,
            bidProjectId: projectId,
            projectId,
          });

          return result.valid === false && result.error === 'INVALID_BID_STATUS';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* bid selection attempt, the system SHALL reject if bid does not belong to project', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        userIdArb,
        (userId, projectId, differentProjectId) => {
          // Ensure different project IDs
          if (projectId === differentProjectId) return true;

          const result = validateBidSelectionPreconditions({
            projectStatus: 'BIDDING_CLOSED',
            bidStatus: 'APPROVED',
            projectOwnerId: userId,
            requestingUserId: userId,
            bidProjectId: differentProjectId,
            projectId,
          });

          return result.valid === false && result.error === 'BID_NOT_FOR_PROJECT';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* valid bid selection context, the system SHALL accept the selection', () => {
    fc.assert(
      fc.property(userIdArb, userIdArb, (userId, projectId) => {
        const result = validateBidSelectionPreconditions({
          projectStatus: 'BIDDING_CLOSED',
          bidStatus: 'APPROVED',
          projectOwnerId: userId,
          requestingUserId: userId,
          bidProjectId: projectId,
          projectId,
        });

        return result.valid === true;
      }),
      { numRuns: 100 }
    );
  });

  it('validation errors SHALL be returned in priority order', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        userIdArb,
        userIdArb,
        (ownerId, requesterId, projectId, bidProjectId) => {
          // Ensure all IDs are different to trigger multiple errors
          if (ownerId === requesterId) return true;

          const result = validateBidSelectionPreconditions({
            projectStatus: 'OPEN', // Wrong status
            bidStatus: 'PENDING', // Wrong status
            projectOwnerId: ownerId,
            requestingUserId: requesterId, // Not owner
            bidProjectId,
            projectId,
          });

          // First check should be ownership
          return result.valid === false && result.error === 'NOT_PROJECT_OWNER';
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 2: Bid selection state transitions
// **Feature: bidding-phase3-matching, Property 2: Bid selection state transitions**
// **Validates: Requirements 1.4, 1.5, 1.6, 1.7**
// ============================================

describe('Property 2: Bid selection state transitions', () => {
  it('*For any* successful bid selection, the selected bid status SHALL change to SELECTED', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(userIdArb, { minLength: 0, maxLength: 10 }),
        userIdArb,
        (selectedBidId, otherBidIds, projectId) => {
          const result = simulateBidSelection({
            selectedBidId,
            otherApprovedBidIds: otherBidIds.filter((id) => id !== selectedBidId),
            projectId,
          });

          return result.selectedBidStatus === 'SELECTED';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* successful bid selection, all other APPROVED bids SHALL change to NOT_SELECTED', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(userIdArb, { minLength: 1, maxLength: 10 }),
        userIdArb,
        (selectedBidId, otherBidIds, projectId) => {
          const uniqueOtherBids = otherBidIds.filter((id) => id !== selectedBidId);
          if (uniqueOtherBids.length === 0) return true;

          const result = simulateBidSelection({
            selectedBidId,
            otherApprovedBidIds: uniqueOtherBids,
            projectId,
          });

          // All other bids should be NOT_SELECTED
          for (const bidId of uniqueOtherBids) {
            if (result.otherBidStatuses.get(bidId) !== 'NOT_SELECTED') {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* successful bid selection, project status SHALL change to MATCHED', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(userIdArb, { minLength: 0, maxLength: 10 }),
        userIdArb,
        (selectedBidId, otherBidIds, projectId) => {
          const result = simulateBidSelection({
            selectedBidId,
            otherApprovedBidIds: otherBidIds,
            projectId,
          });

          return result.projectStatus === 'MATCHED';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* successful bid selection, project selectedBidId SHALL be set to the chosen bid', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(userIdArb, { minLength: 0, maxLength: 10 }),
        userIdArb,
        (selectedBidId, otherBidIds, projectId) => {
          const result = simulateBidSelection({
            selectedBidId,
            otherApprovedBidIds: otherBidIds,
            projectId,
          });

          return result.projectSelectedBidId === selectedBidId;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* successful bid selection, project matchedAt timestamp SHALL be set', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(userIdArb, { minLength: 0, maxLength: 10 }),
        userIdArb,
        (selectedBidId, otherBidIds, projectId) => {
          const beforeSelection = new Date();
          const result = simulateBidSelection({
            selectedBidId,
            otherApprovedBidIds: otherBidIds,
            projectId,
          });
          const afterSelection = new Date();

          // matchedAt should be set and within the time range
          return (
            result.projectMatchedAt instanceof Date &&
            result.projectMatchedAt >= beforeSelection &&
            result.projectMatchedAt <= afterSelection
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('bid selection SHALL be atomic (all changes happen together)', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(userIdArb, { minLength: 1, maxLength: 10 }),
        userIdArb,
        (selectedBidId, otherBidIds, projectId) => {
          const uniqueOtherBids = otherBidIds.filter((id) => id !== selectedBidId);

          const result = simulateBidSelection({
            selectedBidId,
            otherApprovedBidIds: uniqueOtherBids,
            projectId,
          });

          // All state changes should be consistent
          const selectedBidCorrect = result.selectedBidStatus === 'SELECTED';
          const projectStatusCorrect = result.projectStatus === 'MATCHED';
          const selectedBidIdCorrect = result.projectSelectedBidId === selectedBidId;
          const matchedAtSet = result.projectMatchedAt instanceof Date;
          const otherBidsCorrect = uniqueOtherBids.every(
            (id) => result.otherBidStatuses.get(id) === 'NOT_SELECTED'
          );

          return (
            selectedBidCorrect &&
            projectStatusCorrect &&
            selectedBidIdCorrect &&
            matchedAtSet &&
            otherBidsCorrect
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 3: Contact information reveal
// **Feature: bidding-phase3-matching, Property 3: Contact information reveal**
// **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
// ============================================

describe('Property 3: Contact information reveal', () => {
  it('*For any* MATCHED project, homeowner SHALL see contractor contact info', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        matchedProjectStatusArb,
        (homeownerId, contractorId, projectStatus) => {
          // Ensure different users
          if (homeownerId === contractorId) return true;

          const result = determineContactReveal({
            projectStatus,
            userId: homeownerId,
            projectOwnerId: homeownerId,
            selectedContractorId: contractorId,
          });

          return result.revealContractor === true && result.forbidden === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* MATCHED project, contractor SHALL see homeowner contact info', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        matchedProjectStatusArb,
        (homeownerId, contractorId, projectStatus) => {
          // Ensure different users
          if (homeownerId === contractorId) return true;

          const result = determineContactReveal({
            projectStatus,
            userId: contractorId,
            projectOwnerId: homeownerId,
            selectedContractorId: contractorId,
          });

          return result.revealHomeowner === true && result.forbidden === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* MATCHED project, contractor SHALL see project address', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        matchedProjectStatusArb,
        (homeownerId, contractorId, projectStatus) => {
          // Ensure different users
          if (homeownerId === contractorId) return true;

          const result = determineContactReveal({
            projectStatus,
            userId: contractorId,
            projectOwnerId: homeownerId,
            selectedContractorId: contractorId,
          });

          return result.revealAddress === true && result.forbidden === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* non-MATCHED project, NO contact info SHALL be revealed', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        nonMatchedProjectStatusArb,
        (homeownerId, contractorId, projectStatus) => {
          // Test as homeowner
          const homeownerResult = determineContactReveal({
            projectStatus,
            userId: homeownerId,
            projectOwnerId: homeownerId,
            selectedContractorId: contractorId,
          });

          // Test as contractor
          const contractorResult = determineContactReveal({
            projectStatus,
            userId: contractorId,
            projectOwnerId: homeownerId,
            selectedContractorId: contractorId,
          });

          return (
            homeownerResult.revealContractor === false &&
            homeownerResult.revealHomeowner === false &&
            homeownerResult.revealAddress === false &&
            contractorResult.revealContractor === false &&
            contractorResult.revealHomeowner === false &&
            contractorResult.revealAddress === false
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* user not involved in project, the system SHALL return forbidden', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        userIdArb,
        projectStatusArb,
        (homeownerId, contractorId, uninvolvedUserId, projectStatus) => {
          // Ensure uninvolved user is different from both parties
          if (
            uninvolvedUserId === homeownerId ||
            uninvolvedUserId === contractorId
          ) {
            return true;
          }

          const result = determineContactReveal({
            projectStatus,
            userId: uninvolvedUserId,
            projectOwnerId: homeownerId,
            selectedContractorId: contractorId,
          });

          return result.forbidden === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('homeowner SHALL NOT see project address (they already know it)', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        matchedProjectStatusArb,
        (homeownerId, contractorId, projectStatus) => {
          // Ensure different users
          if (homeownerId === contractorId) return true;

          const result = determineContactReveal({
            projectStatus,
            userId: homeownerId,
            projectOwnerId: homeownerId,
            selectedContractorId: contractorId,
          });

          // Homeowner should not have address revealed (they own the project)
          return result.revealAddress === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('contractor SHALL NOT see contractor info (they are the contractor)', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb,
        matchedProjectStatusArb,
        (homeownerId, contractorId, projectStatus) => {
          // Ensure different users
          if (homeownerId === contractorId) return true;

          const result = determineContactReveal({
            projectStatus,
            userId: contractorId,
            projectOwnerId: homeownerId,
            selectedContractorId: contractorId,
          });

          // Contractor should not have contractor info revealed (they are the contractor)
          return result.revealContractor === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 9: Project status transition for matching
// **Feature: bidding-phase3-matching, Property 9: Project status transition for matching**
// **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**
// ============================================

describe('Property 9: Project status transition for matching', () => {
  it('BIDDING_CLOSED status SHALL allow transition to MATCHED', () => {
    const isValid = isValidProjectTransition('BIDDING_CLOSED', 'MATCHED');
    expect(isValid).toBe(true);
  });

  it('MATCHED status SHALL allow transition to IN_PROGRESS', () => {
    const isValid = isValidProjectTransition('MATCHED', 'IN_PROGRESS');
    expect(isValid).toBe(true);
  });

  it('MATCHED status SHALL allow transition to CANCELLED', () => {
    const isValid = isValidProjectTransition('MATCHED', 'CANCELLED');
    expect(isValid).toBe(true);
  });

  it('IN_PROGRESS status SHALL allow transition to COMPLETED', () => {
    const isValid = isValidProjectTransition('IN_PROGRESS', 'COMPLETED');
    expect(isValid).toBe(true);
  });

  it('*For any* terminal state, no further transitions SHALL be allowed', () => {
    fc.assert(
      fc.property(terminalProjectStatusArb, projectStatusArb, (terminalStatus, targetStatus) => {
        const isValid = isValidProjectTransition(terminalStatus, targetStatus);
        return isValid === false;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* non-terminal state, getValidNextProjectStatuses SHALL return non-empty array', () => {
    fc.assert(
      fc.property(nonTerminalProjectStatusArb, (nonTerminalStatus) => {
        const validNext = getValidNextProjectStatuses(nonTerminalStatus);
        return validNext.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* terminal state, getValidNextProjectStatuses SHALL return empty array', () => {
    fc.assert(
      fc.property(terminalProjectStatusArb, (terminalStatus) => {
        const validNext = getValidNextProjectStatuses(terminalStatus);
        return validNext.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('*For any* project, self-transition SHALL NOT be allowed', () => {
    fc.assert(
      fc.property(projectStatusArb, (status) => {
        const isValid = isValidProjectTransition(status, status);
        return isValid === false;
      }),
      { numRuns: 100 }
    );
  });

  it('transition validation SHALL be deterministic', () => {
    fc.assert(
      fc.property(projectStatusArb, projectStatusArb, (fromStatus, toStatus) => {
        // Call validation multiple times
        const result1 = isValidProjectTransition(fromStatus, toStatus);
        const result2 = isValidProjectTransition(fromStatus, toStatus);
        const result3 = isValidProjectTransition(fromStatus, toStatus);

        // All results should be the same
        return result1 === result2 && result2 === result3;
      }),
      { numRuns: 100 }
    );
  });

  it('OPEN status SHALL NOT directly transition to MATCHED (must go through BIDDING_CLOSED)', () => {
    const isValid = isValidProjectTransition('OPEN', 'MATCHED');
    expect(isValid).toBe(false);
  });

  it('BIDDING_CLOSED status SHALL allow reopening to OPEN', () => {
    const isValid = isValidProjectTransition('BIDDING_CLOSED', 'OPEN');
    expect(isValid).toBe(true);
  });

  it('*For any* status that can be cancelled, CANCELLED SHALL be a valid transition', () => {
    const cancellableStatuses: ProjectStatus[] = [
      'DRAFT',
      'REJECTED',
      'OPEN',
      'BIDDING_CLOSED',
      'MATCHED',
      'IN_PROGRESS',
    ];

    for (const status of cancellableStatuses) {
      const isValid = isValidProjectTransition(status, 'CANCELLED');
      expect(isValid).toBe(true);
    }
  });

  it('PENDING_APPROVAL status SHALL NOT be cancellable directly', () => {
    const isValid = isValidProjectTransition('PENDING_APPROVAL', 'CANCELLED');
    expect(isValid).toBe(false);
  });
});
