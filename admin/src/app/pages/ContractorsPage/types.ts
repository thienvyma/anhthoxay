/**
 * Contractors Page Types
 *
 * **Feature: bidding-phase1-foundation**
 */

import type { Contractor, ContractorProfile } from '../../types';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export const STATUS_COLORS: Record<VerificationStatus, string> = {
  PENDING: '#F59E0B',
  VERIFIED: '#10B981',
  REJECTED: '#EF4444',
};

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Chờ duyệt',
  VERIFIED: 'Đã xác minh',
  REJECTED: 'Bị từ chối',
};

export const TABS: Array<{ status: VerificationStatus; label: string }> = [
  { status: 'PENDING', label: 'Chờ duyệt' },
  { status: 'VERIFIED', label: 'Đã xác minh' },
  { status: 'REJECTED', label: 'Bị từ chối' },
];

export type { Contractor, ContractorProfile };
