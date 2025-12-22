/**
 * Match Service Types
 *
 * Shared types for match/bid selection management.
 *
 * **Feature: bidding-phase3-matching, bidding-phase4-communication**
 */

// ============================================
// TYPES
// ============================================

export interface ContactInfo {
  name: string;
  phone: string | null;
  email: string;
  address?: string;
}

export interface MatchDetails {
  project: {
    id: string;
    code: string;
    title: string;
    description: string;
    status: string;
    address?: string;
    area: number | null;
    budgetMin: number | null;
    budgetMax: number | null;
    timeline: string | null;
    matchedAt: Date | null;
  };
  bid: {
    id: string;
    code: string;
    price: number;
    timeline: string;
    proposal: string;
    status: string;
  };
  contractor?: ContactInfo;
  homeowner?: ContactInfo;
  escrow: {
    id: string;
    code: string;
    amount: number;
    releasedAmount: number;
    status: string;
  } | null;
  fee: {
    id: string;
    code: string;
    amount: number;
    status: string;
  } | null;
}

export interface MatchResult {
  project: {
    id: string;
    code: string;
    title: string;
    status: string;
    matchedAt: Date;
  };
  selectedBid: {
    id: string;
    code: string;
    price: number;
    status: string;
  };
  escrow: {
    id: string;
    code: string;
    amount: number;
    status: string;
  };
  feeTransaction: {
    id: string;
    code: string;
    amount: number;
    status: string;
  };
}

export interface MatchListResult {
  data: MatchListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MatchListItem {
  project: {
    id: string;
    code: string;
    title: string;
    status: string;
    matchedAt: Date | null;
  };
  homeowner: {
    id: string;
    name: string;
    email: string;
  };
  contractor: {
    id: string;
    name: string;
    email: string;
  };
  escrow: {
    id: string;
    code: string;
    amount: number;
    status: string;
  } | null;
  fee: {
    id: string;
    code: string;
    amount: number;
    status: string;
  } | null;
}

// ============================================
// VALID PROJECT STATUS TRANSITIONS
// ============================================

export const VALID_PROJECT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['OPEN', 'REJECTED'],
  REJECTED: ['PENDING_APPROVAL', 'CANCELLED'],
  OPEN: ['BIDDING_CLOSED', 'CANCELLED'],
  BIDDING_CLOSED: ['PENDING_MATCH', 'OPEN', 'CANCELLED'],
  PENDING_MATCH: ['MATCHED', 'BIDDING_CLOSED', 'CANCELLED'],
  MATCHED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// ============================================
// MATCH ERROR CLASS
// ============================================

export class MatchError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'MatchError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      PROJECT_NOT_FOUND: 404,
      BID_NOT_FOUND: 404,
      NOT_PROJECT_OWNER: 403,
      NOT_BID_OWNER: 403,
      NOT_INVOLVED: 403,
      INVALID_PROJECT_STATUS: 400,
      INVALID_BID_STATUS: 400,
      INVALID_PROJECT_STATUS_TRANSITION: 400,
      BID_NOT_FOR_PROJECT: 400,
      BID_NOT_SELECTED: 400,
      ALREADY_MATCHED: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
