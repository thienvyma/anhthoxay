/**
 * Matches Page Types
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 12.1**
 */

import type { 
  MatchListItem, 
  MatchDetails, 
  EscrowStatus, 
  FeeStatus,
  Escrow,
  FeeTransaction,
  Project,
  ProjectStatus,
} from '../../types';

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  DRAFT: '#71717a',
  PENDING_APPROVAL: '#f59e0b',
  REJECTED: '#ef4444',
  OPEN: '#3b82f6',
  BIDDING_CLOSED: '#8b5cf6',
  PENDING_MATCH: '#a855f7',
  MATCHED: '#22c55e',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#22c55e',
  CANCELLED: '#71717a',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  REJECTED: 'Bị từ chối',
  OPEN: 'Đang đấu giá',
  BIDDING_CLOSED: 'Hết hạn đấu giá',
  PENDING_MATCH: 'Chờ duyệt kết nối',
  MATCHED: 'Đã kết nối',
  IN_PROGRESS: 'Đang thi công',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const ESCROW_STATUS_COLORS: Record<EscrowStatus, string> = {
  PENDING: '#F59E0B',
  HELD: '#3B82F6',
  PARTIAL_RELEASED: '#8B5CF6',
  RELEASED: '#22C55E',
  REFUNDED: '#6B7280',
  DISPUTED: '#EF4444',
  CANCELLED: '#9CA3AF',
};

export const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  PENDING: 'Chờ đặt cọc',
  HELD: 'Đã giữ',
  PARTIAL_RELEASED: 'Đã giải phóng một phần',
  RELEASED: 'Đã giải phóng',
  REFUNDED: 'Đã hoàn tiền',
  DISPUTED: 'Tranh chấp',
  CANCELLED: 'Đã hủy',
};

export const FEE_STATUS_COLORS: Record<FeeStatus, string> = {
  PENDING: '#F59E0B',
  PAID: '#22C55E',
  CANCELLED: '#9CA3AF',
};

export const FEE_STATUS_LABELS: Record<FeeStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
};

export const TABS: Array<{ status: EscrowStatus | 'ALL' | 'PENDING_MATCH'; label: string }> = [
  { status: 'ALL', label: 'Tất cả' },
  { status: 'PENDING_MATCH', label: 'Chờ duyệt kết nối' },
  { status: 'PENDING', label: 'Chờ đặt cọc' },
  { status: 'HELD', label: 'Đã giữ' },
  { status: 'PARTIAL_RELEASED', label: 'Giải phóng một phần' },
  { status: 'DISPUTED', label: 'Tranh chấp' },
  { status: 'RELEASED', label: 'Đã giải phóng' },
];

export type EscrowAction = 'confirm' | 'release' | 'partial' | 'refund' | 'dispute';
export type MatchAction = 'approve' | 'reject';

export interface EscrowActionConfig {
  action: EscrowAction;
  label: string;
  icon: string;
  color: string;
  requiresAmount?: boolean;
  requiresReason?: boolean;
  confirmText: string;
}

export interface MatchActionConfig {
  action: MatchAction;
  label: string;
  icon: string;
  color: string;
  requiresNote?: boolean;
  confirmText: string;
}

export const MATCH_ACTIONS: Record<MatchAction, MatchActionConfig> = {
  approve: {
    action: 'approve',
    label: 'Duyệt kết nối',
    icon: 'ri-check-line',
    color: '#22C55E',
    confirmText: 'Duyệt kết nối này? Hệ thống sẽ tạo escrow và phí giao dịch.',
  },
  reject: {
    action: 'reject',
    label: 'Từ chối kết nối',
    icon: 'ri-close-line',
    color: '#EF4444',
    requiresNote: true,
    confirmText: 'Từ chối kết nối này? Dự án sẽ quay lại trạng thái BIDDING_CLOSED.',
  },
};

export const ESCROW_ACTIONS: Record<EscrowAction, EscrowActionConfig> = {
  confirm: {
    action: 'confirm',
    label: 'Xác nhận đặt cọc',
    icon: 'ri-check-double-line',
    color: '#3B82F6',
    confirmText: 'Xác nhận đã nhận tiền đặt cọc từ chủ nhà?',
  },
  release: {
    action: 'release',
    label: 'Giải phóng toàn bộ',
    icon: 'ri-hand-coin-line',
    color: '#22C55E',
    confirmText: 'Giải phóng toàn bộ tiền đặt cọc cho nhà thầu?',
  },
  partial: {
    action: 'partial',
    label: 'Giải phóng một phần',
    icon: 'ri-percent-line',
    color: '#8B5CF6',
    requiresAmount: true,
    confirmText: 'Giải phóng một phần tiền đặt cọc cho nhà thầu?',
  },
  refund: {
    action: 'refund',
    label: 'Hoàn tiền',
    icon: 'ri-refund-2-line',
    color: '#6B7280',
    requiresReason: true,
    confirmText: 'Hoàn tiền đặt cọc cho chủ nhà?',
  },
  dispute: {
    action: 'dispute',
    label: 'Đánh dấu tranh chấp',
    icon: 'ri-error-warning-line',
    color: '#EF4444',
    requiresReason: true,
    confirmText: 'Đánh dấu escrow này là tranh chấp?',
  },
};

export type { MatchListItem, MatchDetails, EscrowStatus, FeeStatus, Escrow, FeeTransaction, Project, ProjectStatus };
