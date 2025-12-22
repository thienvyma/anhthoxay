/**
 * Bids Page Types
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 11.1**
 */

import type { Bid, BidListItem, BidStatus } from '../../types';

export const STATUS_COLORS: Record<BidStatus, string> = {
  PENDING: '#F59E0B',
  APPROVED: '#10B981',
  REJECTED: '#EF4444',
  SELECTED: '#3B82F6',
  NOT_SELECTED: '#6B7280',
  WITHDRAWN: '#9CA3AF',
};

export const STATUS_LABELS: Record<BidStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  SELECTED: 'Được chọn',
  NOT_SELECTED: 'Không được chọn',
  WITHDRAWN: 'Đã rút',
};

export const TABS: Array<{ status: BidStatus | 'ALL'; label: string }> = [
  { status: 'ALL', label: 'Tất cả' },
  { status: 'PENDING', label: 'Chờ duyệt' },
  { status: 'APPROVED', label: 'Đã duyệt' },
  { status: 'REJECTED', label: 'Bị từ chối' },
  { status: 'SELECTED', label: 'Được chọn' },
  { status: 'WITHDRAWN', label: 'Đã rút' },
];

export type { Bid, BidListItem, BidStatus };
