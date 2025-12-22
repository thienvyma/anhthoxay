/**
 * Match Table Component
 *
 * Displays list of matches in a table format.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 12.1**
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import type {
  MatchListItem,
  EscrowStatus,
  EscrowAction,
  MatchAction,
  ProjectStatus,
} from './types';
import {
  ESCROW_STATUS_COLORS,
  ESCROW_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
} from './types';

interface MatchTableProps {
  matches: MatchListItem[];
  loading: boolean;
  onViewDetail: (match: MatchListItem) => void;
  onEscrowAction: (match: MatchListItem, action: EscrowAction) => void;
  onMatchAction?: (match: MatchListItem, action: MatchAction) => void;
}

export const MatchTable = memo(function MatchTable({
  matches,
  loading,
  onViewDetail,
  onEscrowAction,
  onMatchAction,
}: MatchTableProps) {
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

  if (matches.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
        <i className="ri-link-unlink" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
        <p>Không tìm thấy match nào</p>
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
          <th style={thStyle}>Mã Công trình</th>
          <th style={thStyle}>Chủ nhà</th>
          <th style={thStyle}>Nhà thầu</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Escrow</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {matches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            onViewDetail={onViewDetail}
            onEscrowAction={onEscrowAction}
            onMatchAction={onMatchAction}
          />
        ))}
      </tbody>
    </table>
  );
});

// Table row component
const MatchRow = memo(function MatchRow({
  match,
  onViewDetail,
  onEscrowAction,
  onMatchAction,
}: {
  match: MatchListItem;
  onViewDetail: (match: MatchListItem) => void;
  onEscrowAction: (match: MatchListItem, action: EscrowAction) => void;
  onMatchAction?: (match: MatchListItem, action: MatchAction) => void;
}) {
  const projectStatus = match.project.status;
  const isPendingMatch = projectStatus === 'PENDING_MATCH';
  const escrowStatus = match.escrow?.status;

  // Determine available escrow actions based on status
  const getAvailableActions = (): EscrowAction[] => {
    if (!escrowStatus) return [];
    switch (escrowStatus) {
      case 'PENDING':
        return ['confirm'];
      case 'HELD':
        return ['release', 'partial', 'refund', 'dispute'];
      case 'PARTIAL_RELEASED':
        return ['release', 'refund', 'dispute'];
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions();

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
          {match.project.code}
        </span>
        <div style={{ color: tokens.color.muted, fontSize: 12, marginTop: 2 }}>
          {match.project.title.length > 30 
            ? match.project.title.substring(0, 30) + '...' 
            : match.project.title}
        </div>
        {match.project.matchedAt && (
          <div style={{ color: tokens.color.muted, fontSize: 11, marginTop: 2 }}>
            <i className="ri-time-line" style={{ marginRight: 4 }} />
            {new Date(match.project.matchedAt).toLocaleDateString('vi-VN')}
          </div>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ color: tokens.color.text }}>{match.homeowner.name}</div>
        <div style={{ color: tokens.color.muted, fontSize: 12 }}>{match.homeowner.email}</div>
        {match.homeowner.phone && (
          <div style={{ color: tokens.color.muted, fontSize: 12 }}>{match.homeowner.phone}</div>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ color: tokens.color.text }}>{match.contractor.name}</div>
        <div style={{ color: tokens.color.muted, fontSize: 12 }}>{match.contractor.email}</div>
        {match.contractor.companyName && (
          <div style={{ color: tokens.color.muted, fontSize: 12, fontStyle: 'italic' }}>
            {match.contractor.companyName}
          </div>
        )}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        <ProjectStatusBadge status={projectStatus} />
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        {escrowStatus ? (
          <>
            <EscrowBadge status={escrowStatus} />
            <div style={{ color: tokens.color.text, fontSize: 12, marginTop: 4 }}>
              {formatCurrency(match.escrow?.amount || 0)}
            </div>
          </>
        ) : (
          <span style={{ color: tokens.color.muted, fontSize: 12 }}>Chưa tạo</span>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <ActionButton
            icon="ri-eye-line"
            title="Xem chi tiết"
            onClick={() => onViewDetail(match)}
            color={tokens.color.primary}
          />
          {/* Show approve/reject buttons for PENDING_MATCH */}
          {isPendingMatch && onMatchAction && (
            <>
              <ActionButton
                icon="ri-check-line"
                title="Duyệt kết nối"
                onClick={() => onMatchAction(match, 'approve')}
                color="#22C55E"
                bgColor="rgba(34, 197, 94, 0.1)"
                borderColor="rgba(34, 197, 94, 0.3)"
              />
              <ActionButton
                icon="ri-close-line"
                title="Từ chối kết nối"
                onClick={() => onMatchAction(match, 'reject')}
                color="#EF4444"
                bgColor="rgba(239, 68, 68, 0.1)"
                borderColor="rgba(239, 68, 68, 0.3)"
              />
            </>
          )}
          {/* Show escrow actions for MATCHED projects */}
          {!isPendingMatch && availableActions.includes('confirm') && (
            <ActionButton
              icon="ri-check-double-line"
              title="Xác nhận đặt cọc"
              onClick={() => onEscrowAction(match, 'confirm')}
              color="#3B82F6"
              bgColor="rgba(59, 130, 246, 0.1)"
              borderColor="rgba(59, 130, 246, 0.3)"
            />
          )}
          {!isPendingMatch && availableActions.includes('release') && (
            <ActionButton
              icon="ri-hand-coin-line"
              title="Giải phóng"
              onClick={() => onEscrowAction(match, 'release')}
              color="#22C55E"
              bgColor="rgba(34, 197, 94, 0.1)"
              borderColor="rgba(34, 197, 94, 0.3)"
            />
          )}
        </div>
      </td>
    </tr>
  );
});

// Project status badge component
function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const color = PROJECT_STATUS_COLORS[status];
  const label = PROJECT_STATUS_LABELS[status];

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

// Escrow status badge component
function EscrowBadge({ status }: { status: EscrowStatus }) {
  const color = ESCROW_STATUS_COLORS[status];
  const label = ESCROW_STATUS_LABELS[status];

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
