/**
 * Fees Page Types
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 13.1**
 */

import type { 
  FeeListItem, 
  FeeTransaction, 
  FeeStatus, 
  FeeType,
} from '../../types';

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

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  WIN_FEE: 'Phí thắng thầu',
  VERIFICATION_FEE: 'Phí xác minh',
};

export const FEE_TYPE_COLORS: Record<FeeType, string> = {
  WIN_FEE: '#3B82F6',
  VERIFICATION_FEE: '#8B5CF6',
};

export const TABS: Array<{ status: FeeStatus | 'ALL'; label: string }> = [
  { status: 'ALL', label: 'Tất cả' },
  { status: 'PENDING', label: 'Chờ thanh toán' },
  { status: 'PAID', label: 'Đã thanh toán' },
  { status: 'CANCELLED', label: 'Đã hủy' },
];

export type FeeAction = 'markPaid' | 'cancel';

export interface FeeActionConfig {
  action: FeeAction;
  label: string;
  icon: string;
  color: string;
  requiresReason?: boolean;
  confirmText: string;
}

export const FEE_ACTIONS: Record<FeeAction, FeeActionConfig> = {
  markPaid: {
    action: 'markPaid',
    label: 'Đánh dấu đã thanh toán',
    icon: 'ri-check-double-line',
    color: '#22C55E',
    confirmText: 'Xác nhận nhà thầu đã thanh toán phí này?',
  },
  cancel: {
    action: 'cancel',
    label: 'Hủy phí',
    icon: 'ri-close-circle-line',
    color: '#EF4444',
    requiresReason: true,
    confirmText: 'Hủy phí giao dịch này?',
  },
};

export type { FeeListItem, FeeTransaction, FeeStatus, FeeType };
