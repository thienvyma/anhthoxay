/**
 * Bid Table Component
 *
 * Displays list of bids in a table format.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 11.1, 11.6**
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import type { BidListItem, BidStatus } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './types';

interface BidTableProps {
  bids: BidListItem[];
  loading: boolean;
  onViewDetail: (bid: BidListItem) => void;
  onApprove: (bid: BidListItem) => void;
  onReject: (bid: BidListItem) => void;
}

export const BidTable = memo(function BidTable({
  bids,
  loading,
  onViewDetail,
  onApprove,
  onReject,
}: BidTableProps) {
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

  if (bids.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
        <i className="ri-auction-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
        <p>Không tìm thấy bid nào</p>
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
          <th style={thStyle}>Mã</th>
          <th style={thStyle}>Công trình</th>
          <th style={thStyle}>Nhà thầu</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Giá đề xuất</th>
          <th style={thStyle}>Timeline</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {bids.map((bid) => (
          <BidRow
            key={bid.id}
            bid={bid}
            onViewDetail={onViewDetail}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </tbody>
    </table>
  );
});

// Table row component
const BidRow = memo(function BidRow({
  bid,
  onViewDetail,
  onApprove,
  onReject,
}: {
  bid: BidListItem;
  onViewDetail: (bid: BidListItem) => void;
  onApprove: (bid: BidListItem) => void;
  onReject: (bid: BidListItem) => void;
}) {
  const canApprove = bid.status === 'PENDING';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
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
          {bid.code}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ color: tokens.color.text, fontWeight: 500 }}>{bid.project.title}</div>
        <div style={{ color: tokens.color.muted, fontSize: 12, marginTop: 2 }}>
          <span style={{ fontFamily: 'monospace' }}>{bid.project.code}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ color: tokens.color.text }}>{bid.contractor.name}</div>
        <div style={{ color: tokens.color.muted, fontSize: 12 }}>
          {bid.contractor.companyName || bid.contractor.email}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: '#F59E0B',
            }}
          >
            <i className="ri-star-fill" />
            {bid.contractor.rating.toFixed(1)}
          </span>
          <span style={{ fontSize: 12, color: tokens.color.muted }}>
            • {bid.contractor.totalProjects} dự án
          </span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <span style={{ color: tokens.color.text, fontWeight: 600 }}>
          {formatCurrency(bid.price)}
        </span>
      </td>
      <td style={{ padding: '12px 16px', color: tokens.color.muted }}>
        {bid.timeline}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        <StatusBadge status={bid.status} />
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <ActionButton
            icon="ri-eye-line"
            title="Xem chi tiết"
            onClick={() => onViewDetail(bid)}
            color={tokens.color.primary}
          />
          {canApprove && (
            <>
              <ActionButton
                icon="ri-check-line"
                title="Duyệt"
                onClick={() => onApprove(bid)}
                color="#10B981"
                bgColor="rgba(16, 185, 129, 0.1)"
                borderColor="rgba(16, 185, 129, 0.3)"
              />
              <ActionButton
                icon="ri-close-line"
                title="Từ chối"
                onClick={() => onReject(bid)}
                color="#EF4444"
                bgColor="rgba(239, 68, 68, 0.1)"
                borderColor="rgba(239, 68, 68, 0.3)"
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

// Status badge component
function StatusBadge({ status }: { status: BidStatus }) {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

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
  bgColor = 'rgba(255,255,255,0.05)',
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

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: tokens.color.muted,
  fontSize: 13,
  fontWeight: 500,
};
