/**
 * Match Detail Modal Component
 *
 * Displays full match information in a modal.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 12.3**
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from '../../components/Button';
import type { MatchListItem, MatchDetails, EscrowAction, EscrowStatus } from './types';
import { 
  ESCROW_STATUS_COLORS, 
  ESCROW_STATUS_LABELS, 
  FEE_STATUS_COLORS, 
  FEE_STATUS_LABELS,
  ESCROW_ACTIONS,
} from './types';

interface MatchDetailModalProps {
  show: boolean;
  match: MatchListItem | null;
  detail: MatchDetails | null;
  loading: boolean;
  onClose: () => void;
  onEscrowAction: (action: EscrowAction) => void;
}

export const MatchDetailModal = memo(function MatchDetailModal({
  show,
  match,
  detail,
  loading,
  onClose,
  onEscrowAction,
}: MatchDetailModalProps) {
  return (
    <AnimatePresence>
      {show && match && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998 }}
          />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: 'min(1000px, 100%)',
                maxHeight: '90vh',
                background: tokens.color.surface,
                borderRadius: tokens.radius.lg,
                border: `1px solid ${tokens.color.border}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <ModalHeader match={match} onClose={onClose} />

              {/* Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                {loading ? (
                  <LoadingState />
                ) : detail ? (
                  <MatchContent detail={detail} />
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Footer with Escrow Actions */}
              {detail && (
                <ModalFooter 
                  escrowStatus={detail.escrow.status as EscrowStatus} 
                  onClose={onClose} 
                  onEscrowAction={onEscrowAction} 
                />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

// Modal Header
function ModalHeader({ match, onClose }: { match: MatchListItem; onClose: () => void }) {
  return (
    <div
      style={{
        padding: 24,
        borderBottom: `1px solid ${tokens.color.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
            Chi tiết Match
          </h3>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              color: tokens.color.primary,
              background: `${tokens.color.primary}15`,
              padding: '4px 8px',
              borderRadius: tokens.radius.sm,
            }}
          >
            {match.project.code}
          </span>
        </div>
        <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
          {match.project.title}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: tokens.color.muted,
          cursor: 'pointer',
          fontSize: 20,
        }}
      >
        <i className="ri-close-line" />
      </button>
    </div>
  );
}

// Modal Footer with Escrow Actions
function ModalFooter({
  escrowStatus,
  onClose,
  onEscrowAction,
}: {
  escrowStatus: EscrowStatus;
  onClose: () => void;
  onEscrowAction: (action: EscrowAction) => void;
}) {
  // Determine available actions based on escrow status
  const getAvailableActions = (): EscrowAction[] => {
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
    <div
      style={{
        padding: 24,
        borderTop: `1px solid ${tokens.color.border}`,
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
      }}
    >
      <Button variant="secondary" onClick={onClose}>
        Đóng
      </Button>
      {availableActions.map((action) => {
        const config = ESCROW_ACTIONS[action];
        return (
          <Button
            key={action}
            variant="secondary"
            onClick={() => onEscrowAction(action)}
            style={{
              background: `${config.color}15`,
              borderColor: `${config.color}40`,
              color: config.color,
            }}
          >
            <i className={config.icon} style={{ marginRight: 8 }} />
            {config.label}
          </Button>
        );
      })}
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
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

// Empty State
function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
      <i className="ri-file-unknow-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
      <p>Không có thông tin match</p>
    </div>
  );
}

// Match Content
function MatchContent({ detail }: { detail: MatchDetails }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Two column layout for contacts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <HomeownerSection contact={detail.homeowner} />
        <ContractorSection contact={detail.contractor} />
      </div>
      
      <EscrowSection escrow={detail.escrow} />
      <FeeSection fee={detail.fee} />
      <ProjectSection project={detail.project} />
      <BidSection bid={detail.bid} />
    </div>
  );
}

// Section wrapper
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.color.border}`,
      }}
    >
      <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
        <i className={icon} style={{ marginRight: 8 }} />
        {title}
      </h4>
      {children}
    </div>
  );
}

// Homeowner Section
function HomeownerSection({ contact }: { contact: MatchDetails['homeowner'] }) {
  return (
    <Section icon="ri-home-heart-line" title="Thông tin Chủ nhà">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InfoItem label="Họ tên" value={contact.name} />
        <InfoItem label="Email" value={contact.email} copyable />
        <InfoItem label="Điện thoại" value={contact.phone} copyable />
        {contact.address && <InfoItem label="Địa chỉ" value={contact.address} />}
      </div>
    </Section>
  );
}

// Contractor Section
function ContractorSection({ contact }: { contact: MatchDetails['contractor'] }) {
  return (
    <Section icon="ri-building-2-line" title="Thông tin Nhà thầu">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InfoItem label="Họ tên" value={contact.name} />
        <InfoItem label="Email" value={contact.email} copyable />
        <InfoItem label="Điện thoại" value={contact.phone} copyable />
      </div>
    </Section>
  );
}

// Escrow Section
function EscrowSection({ escrow }: { escrow: MatchDetails['escrow'] }) {
  const color = ESCROW_STATUS_COLORS[escrow.status as EscrowStatus];
  const label = ESCROW_STATUS_LABELS[escrow.status as EscrowStatus];

  return (
    <Section icon="ri-safe-2-line" title="Thông tin Escrow">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã Escrow" value={escrow.code} />
        <div>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>Trạng thái</div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: tokens.radius.sm,
              background: `${color}20`,
              color: color,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        </div>
        <InfoItem label="Số tiền" value={formatCurrency(escrow.amount)} highlight />
        <InfoItem label="Đã giải phóng" value={formatCurrency(escrow.releasedAmount)} />
        <InfoItem label="Còn lại" value={formatCurrency(escrow.amount - escrow.releasedAmount)} highlight />
      </div>
    </Section>
  );
}

// Fee Section
function FeeSection({ fee }: { fee: MatchDetails['fee'] }) {
  const color = FEE_STATUS_COLORS[fee.status];
  const label = FEE_STATUS_LABELS[fee.status];

  return (
    <Section icon="ri-money-dollar-circle-line" title="Thông tin Phí">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã Phí" value={fee.code} />
        <InfoItem label="Loại" value={fee.type === 'WIN_FEE' ? 'Phí thắng thầu' : 'Phí xác minh'} />
        <div>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>Trạng thái</div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: tokens.radius.sm,
              background: `${color}20`,
              color: color,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        </div>
        <InfoItem label="Số tiền" value={formatCurrency(fee.amount)} highlight />
      </div>
    </Section>
  );
}

// Project Section
function ProjectSection({ project }: { project: MatchDetails['project'] }) {
  return (
    <Section icon="ri-building-line" title="Thông tin Công trình">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã công trình" value={project.code} />
        <InfoItem label="Tiêu đề" value={project.title} />
        <InfoItem label="Danh mục" value={project.category.name} />
        <InfoItem label="Khu vực" value={project.region.name} />
        <InfoItem label="Địa chỉ" value={project.address} />
        {project.area && <InfoItem label="Diện tích" value={`${project.area} m²`} />}
      </div>
      {project.description && (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>Mô tả</div>
          <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, whiteSpace: 'pre-wrap' }}>
            {project.description.length > 200 
              ? project.description.substring(0, 200) + '...' 
              : project.description}
          </p>
        </div>
      )}
    </Section>
  );
}

// Bid Section
function BidSection({ bid }: { bid: MatchDetails['bid'] }) {
  return (
    <Section icon="ri-auction-line" title="Thông tin Bid">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã Bid" value={bid.code} />
        <InfoItem label="Giá đề xuất" value={formatCurrency(bid.price)} highlight />
        <InfoItem label="Timeline" value={bid.timeline} />
      </div>
      {bid.proposal && (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>Đề xuất</div>
          <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, whiteSpace: 'pre-wrap' }}>
            {bid.proposal.length > 300 
              ? bid.proposal.substring(0, 300) + '...' 
              : bid.proposal}
          </p>
        </div>
      )}
    </Section>
  );
}

// Helper Components
function InfoItem({ 
  label, 
  value, 
  highlight = false,
  copyable = false,
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  copyable?: boolean;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <div>
      <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>{label}</div>
      <div 
        style={{ 
          color: highlight ? tokens.color.primary : tokens.color.text, 
          fontSize: 14,
          fontWeight: highlight ? 600 : 400,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {value}
        {copyable && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.color.muted,
              cursor: 'pointer',
              padding: 4,
            }}
            title="Sao chép"
          >
            <i className="ri-file-copy-line" style={{ fontSize: 14 }} />
          </motion.button>
        )}
      </div>
    </div>
  );
}

// Helper function
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}
