/**
 * Disputes Page Types
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 16.3**
 */

import type {
  DisputeListItem,
  Dispute,
  DisputeStatus,
  DisputeResolutionType,
} from '../../types';

export const DISPUTE_STATUS_COLORS: Record<DisputeStatus, string> = {
  OPEN: '#F59E0B',
  RESOLVED: '#22C55E',
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: 'Đang mở',
  RESOLVED: 'Đã giải quyết',
};

export const RESOLUTION_TYPE_LABELS: Record<DisputeResolutionType, string> = {
  REFUND_TO_HOMEOWNER: 'Hoàn tiền cho chủ nhà',
  RELEASE_TO_CONTRACTOR: 'Giải phóng cho nhà thầu',
};

export const TABS: Array<{ status: DisputeStatus | 'ALL'; label: string }> = [
  { status: 'ALL', label: 'Tất cả' },
  { status: 'OPEN', label: 'Đang mở' },
  { status: 'RESOLVED', label: 'Đã giải quyết' },
];

export type { DisputeListItem, Dispute, DisputeStatus, DisputeResolutionType };
