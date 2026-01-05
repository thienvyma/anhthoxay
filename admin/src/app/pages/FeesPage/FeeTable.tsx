/**
 * Fee Table Component
 *
 * Displays list of fee transactions in a table format.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 13.1**
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import type { FeeListItem, FeeStatus, FeeType, FeeAction } from './types';
import { 
  FEE_STATUS_COLORS, 
  FEE_STATUS_LABELS, 
  FEE_TYPE_COLORS,
  FEE_TYPE_LABELS,
} from './types';

interface FeeTableProps {
  fees: FeeListItem[];
  loading: boolean;
  onViewDetail: (fee: FeeListItem) => void;
  onFeeAction: (fee: FeeListItem, action: FeeAction, reason?: string) => void;
}

export const FeeTable = memo(function FeeTable({
  fees,
  loading,
  onViewDetail,
  onFeeAction,
}: FeeTableProps) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 32 }}
        />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (fees.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
        <i className="ri-money-dollar-circle-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
        <p>Không tìm thấy phí giao dịch nào</p>
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
          <th style={thStyle}>Mã Phí</th>
          <th style={thStyle}>Nhà thầu</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Loại</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Số tiền</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {fees.map((fee) => (
          <FeeRow
            key={fee.id}
            fee={fee}
            onViewDetail={onViewDetail}
            onFeeAction={onFeeAction}
          />
        ))}
      </tbody>
    </table>
  );
});

// Table row component
const FeeRow = memo(function FeeRow({
  fee,
  onViewDetail,
  onFeeAction,
}: {
  fee: FeeListItem;
  onViewDetail: (fee: FeeListItem) => void;
  onFeeAction: (fee: FeeListItem, action: FeeAction, reason?: string) => void;
}) {
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleMarkPaid = () => {
    onFeeAction(fee, 'markPaid');
  };

  const handleCancel = () => {
    if (cancelReason.trim()) {
      onFeeAction(fee, 'cancel', cancelReason);
      setShowCancelInput(false);
      setCancelReason('');
    }
  };

  return (
    <>
      <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
        <td style={{ padding: '12px 16px' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              color: tokens.color.primary,
              fontWeight: 500,
            }}
          >
            {fee.code}
          </span>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginTop: 2 }}>
            <i className="ri-building-line" style={{ marginRight: 4 }} />
            {fee.project.code}
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 11, marginTop: 2 }}>
            <i className="ri-time-line" style={{ marginRight: 4 }} />
            {new Date(fee.createdAt).toLocaleDateString('vi-VN')}
          </div>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ color: tokens.color.text }}>{fee.user.name}</div>
          <div style={{ color: tokens.color.muted, fontSize: 12 }}>{fee.user.email}</div>
          {fee.user.companyName && (
            <div style={{ color: tokens.color.muted, fontSize: 12, fontStyle: 'italic' }}>
              {fee.user.companyName}
            </div>
          )}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
          <TypeBadge type={fee.type} />
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
          <span style={{ color: tokens.color.text, fontWeight: 600, fontSize: 14 }}>
            {formatCurrency(fee.amount)}
          </span>
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
          <StatusBadge status={fee.status} />
        </td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <ActionButton
              icon="ri-eye-line"
              title="Xem chi tiết"
              onClick={() => onViewDetail(fee)}
              color={tokens.color.primary}
            />
            {fee.status === 'PENDING' && (
              <>
                <ActionButton
                  icon="ri-check-double-line"
                  title="Đánh dấu đã thanh toán"
                  onClick={handleMarkPaid}
                  color={tokens.color.success}
                  bgColor={tokens.color.successBg}
                  borderColor={`${tokens.color.success}50`}
                />
                <ActionButton
                  icon="ri-close-circle-line"
                  title="Hủy phí"
                  onClick={() => setShowCancelInput(!showCancelInput)}
                  color={tokens.color.error}
                  bgColor={tokens.color.errorBg}
                  borderColor={`${tokens.color.error}50`}
                />
              </>
            )}
          </div>
        </td>
      </tr>
      {/* Cancel reason input row */}
      {showCancelInput && (
        <tr style={{ background: tokens.color.errorBg }}>
          <td colSpan={6} style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Nhập lý do hủy phí..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                }}
                autoFocus
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                style={{
                  padding: '8px 16px',
                  background: tokens.color.error,
                  border: 'none',
                  borderRadius: tokens.radius.md,
                  color: '#fff',
                  cursor: cancelReason.trim() ? 'pointer' : 'not-allowed',
                  opacity: cancelReason.trim() ? 1 : 0.5,
                  fontSize: 14,
                }}
              >
                Xác nhận hủy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowCancelInput(false);
                  setCancelReason('');
                }}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.muted,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Hủy bỏ
              </motion.button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

// Fee status badge component
function StatusBadge({ status }: { status: FeeStatus }) {
  const color = FEE_STATUS_COLORS[status];
  const label = FEE_STATUS_LABELS[status];

  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: tokens.radius.sm,
        background: `${color}20`,
        color: color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// Fee type badge component
function TypeBadge({ type }: { type: FeeType }) {
  const color = FEE_TYPE_COLORS[type];
  const label = FEE_TYPE_LABELS[type];

  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: tokens.radius.sm,
        background: `${color}20`,
        color: color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// Action button component
function ActionButton({
  icon,
  title,
  onClick,
  color,
  bgColor = tokens.color.surfaceHover,
  borderColor = tokens.color.border,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  color: string;
  bgColor?: string;
  borderColor?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      style={{
        padding: 8,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: tokens.radius.sm,
        color,
        cursor: 'pointer',
      }}
    >
      <i className={icon} />
    </motion.button>
  );
}

// Helper function
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: tokens.color.muted,
  fontSize: 13,
  fontWeight: 500,
};
