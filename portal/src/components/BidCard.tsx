/**
 * BidCard Component
 *
 * Reusable card component for displaying bid summary:
 * - Bid price and timeline
 * - Anonymized contractor info (for homeowner view)
 * - Status badge with color coding
 * - Project info (for contractor view)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 6.2, 10.1**
 */

import { motion } from 'framer-motion';
import type { Bid, BidStatus } from '../api';

export interface BidCardProps {
  bid: Bid;
  /** View mode: 'homeowner' shows anonymized contractor, 'contractor' shows project info */
  viewMode: 'homeowner' | 'contractor';
  /** Anonymized label for contractor (e.g., "Nhà thầu A") */
  anonymizedLabel?: string;
  /** Show project info (for contractor view) */
  showProject?: boolean;
  /** Show contact info (for selected bids) */
  showContactInfo?: boolean;
  /** Show actions (edit, withdraw, etc.) */
  showActions?: boolean;
  /** Is this bid selected for comparison */
  isSelectedForComparison?: boolean;
  /** Callback when comparison checkbox is toggled */
  onComparisonToggle?: (bidId: string) => void;
  /** Callback when edit is clicked */
  onEdit?: (bid: Bid) => void;
  /** Callback when withdraw is clicked */
  onWithdraw?: (bid: Bid) => void;
  /** Callback when view details is clicked */
  onViewDetails?: (bid: Bid) => void;
  /** Callback when contact is clicked */
  onContact?: (bid: Bid) => void;
  /** Is withdraw in progress */
  isWithdrawing?: boolean;
  /** Animation delay for staggered animations */
  animationDelay?: number;
  /** Variant: 'default' | 'compact' */
  variant?: 'default' | 'compact';
}

const STATUS_LABELS: Record<BidStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  SELECTED: 'Được chọn',
  NOT_SELECTED: 'Không được chọn',
  WITHDRAWN: 'Đã rút',
};

const STATUS_COLORS: Record<BidStatus, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#3b82f6',
  REJECTED: '#ef4444',
  SELECTED: '#22c55e',
  NOT_SELECTED: '#71717a',
  WITHDRAWN: '#71717a',
};

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Check if bid can be edited
 */
function canEditBid(bid: Bid): boolean {
  return bid.status === 'PENDING';
}

/**
 * Check if bid can be withdrawn
 */
function canWithdrawBid(bid: Bid): boolean {
  return bid.status === 'PENDING' || bid.status === 'APPROVED';
}

/**
 * Check if bid is selected
 */
function isSelectedBid(bid: Bid): boolean {
  return bid.status === 'SELECTED';
}

export function BidCard({
  bid,
  viewMode,
  anonymizedLabel,
  showProject = true,
  showContactInfo = false,
  showActions = true,
  isSelectedForComparison = false,
  onComparisonToggle,
  onEdit,
  onWithdraw,
  onViewDetails,
  onContact,
  isWithdrawing = false,
  animationDelay = 0,
  variant = 'default',
}: BidCardProps) {
  const isHomeownerView = viewMode === 'homeowner';
  const contractor = bid.contractor;

  // Get contractor display info
  const getContractorDisplay = (): { name: string; rating?: number; avatar?: string } => {
    if (isHomeownerView) {
      // Anonymized for homeowner before match
      return {
        name: anonymizedLabel || 'Nhà thầu',
        rating: contractor?.rating,
      };
    }
    // Full info for contractor view or after match
    return {
      name: contractor?.name || 'Nhà thầu',
      rating: contractor?.rating,
      avatar: contractor?.avatar,
    };
  };

  const contractorDisplay = getContractorDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="card"
      style={{
        padding: variant === 'compact' ? 16 : 20,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <span
          className="badge"
          style={{
            background: `${STATUS_COLORS[bid.status]}20`,
            color: STATUS_COLORS[bid.status],
          }}
        >
          {STATUS_LABELS[bid.status]}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onComparisonToggle && bid.status === 'APPROVED' && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontSize: 12,
                color: '#a1a1aa',
              }}
            >
              <input
                type="checkbox"
                checked={isSelectedForComparison}
                onChange={() => onComparisonToggle(bid.id)}
                style={{ cursor: 'pointer' }}
              />
              So sánh
            </label>
          )}
          <span style={{ fontSize: 12, color: '#71717a' }}>{bid.code}</span>
        </div>
      </div>

      {/* Contractor Info (for homeowner view) */}
      {isHomeownerView && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            padding: 12,
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#f5d393',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0b0c0f',
              fontWeight: 600,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {contractorDisplay.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e7ec' }}>
              {contractorDisplay.name}
            </div>
            {contractorDisplay.rating !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <i className="ri-star-fill" style={{ color: '#f59e0b', fontSize: 14 }} />
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>
                  {contractorDisplay.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Info (for contractor view) */}
      {!isHomeownerView && showProject && bid.project && (
        <div
          style={{
            padding: 12,
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#e4e7ec',
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {bid.project.title}
          </h3>
          <div style={{ fontSize: 12, color: '#71717a' }}>
            {bid.project.code} • {bid.project.region?.name || 'Chưa xác định'}
          </div>
        </div>
      )}

      {/* Bid Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>Giá đề xuất</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5d393' }}>
            {formatCurrency(bid.price)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>Thời gian</div>
          <div style={{ fontSize: 14, color: '#e4e7ec' }}>{bid.timeline}</div>
        </div>
      </div>

      {/* Proposal Preview */}
      {variant !== 'compact' && (
        <p
          style={{
            fontSize: 13,
            color: '#a1a1aa',
            marginBottom: 16,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.5,
            flex: 1,
          }}
        >
          {bid.proposal}
        </p>
      )}

      {/* Contact Info (for selected bids) */}
      {showContactInfo && isSelectedBid(bid) && (
        <ContactInfoSection bid={bid} viewMode={viewMode} />
      )}

      {/* Review Note (for rejected bids) */}
      {bid.status === 'REJECTED' && bid.reviewNote && (
        <div
          style={{
            padding: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#ef4444',
              marginBottom: 4,
            }}
          >
            Lý do từ chối
          </div>
          <div style={{ fontSize: 13, color: '#a1a1aa' }}>{bid.reviewNote}</div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px solid #27272a',
          marginTop: 'auto',
        }}
      >
        <span style={{ fontSize: 12, color: '#71717a' }}>{formatDate(bid.createdAt)}</span>

        {/* Actions */}
        {showActions && (
          <div style={{ display: 'flex', gap: 8 }}>
            {!isHomeownerView && canEditBid(bid) && onEdit && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => onEdit(bid)}
              >
                <i className="ri-edit-line" style={{ marginRight: 4 }} />
                Sửa
              </button>
            )}
            {!isHomeownerView && canWithdrawBid(bid) && onWithdraw && (
              <button
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: 13,
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
                onClick={() => onWithdraw(bid)}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? (
                  <i className="ri-loader-4-line spinner" />
                ) : (
                  <>
                    <i className="ri-close-line" style={{ marginRight: 4 }} />
                    Rút
                  </>
                )}
              </button>
            )}
            {isSelectedBid(bid) && onContact && (
              <button
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => onContact(bid)}
              >
                <i className="ri-chat-1-line" style={{ marginRight: 4 }} />
                Liên hệ
              </button>
            )}
            {onViewDetails && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => onViewDetails(bid)}
              >
                Chi tiết
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Contact Info Section for selected bids
 */
function ContactInfoSection({
  bid,
  viewMode,
}: {
  bid: Bid;
  viewMode: 'homeowner' | 'contractor';
}) {
  const isHomeownerView = viewMode === 'homeowner';

  // For homeowner: show contractor info
  // For contractor: show homeowner info
  const contactPerson = isHomeownerView ? bid.contractor : bid.project?.owner;

  if (!contactPerson) return null;

  return (
    <div
      style={{
        padding: 12,
        background: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid rgba(34, 197, 94, 0.2)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#22c55e',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <i className="ri-user-line" />
        {isHomeownerView ? 'Thông tin nhà thầu' : 'Thông tin chủ nhà'}
      </div>
      <div style={{ fontSize: 14, color: '#e4e7ec', marginBottom: 4 }}>
        {contactPerson.name}
      </div>
      {contactPerson.email && (
        <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 2 }}>
          <i className="ri-mail-line" style={{ marginRight: 6 }} />
          {contactPerson.email}
        </div>
      )}
      {contactPerson.phone && (
        <div style={{ fontSize: 13, color: '#a1a1aa' }}>
          <i className="ri-phone-line" style={{ marginRight: 6 }} />
          {contactPerson.phone}
        </div>
      )}
    </div>
  );
}

export default BidCard;
