/**
 * Dispute Detail Modal Component
 *
 * Displays full dispute information including project, bid, escrow details,
 * and contact info for both parties.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 16.3**
 */

import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Button } from '../../components/Button';
import {
  DISPUTE_STATUS_COLORS,
  DISPUTE_STATUS_LABELS,
  RESOLUTION_TYPE_LABELS,
  type DisputeListItem,
  type Dispute,
  type DisputeStatus,
  type DisputeResolutionType,
} from './types';

interface DisputeDetailModalProps {
  show: boolean;
  dispute: DisputeListItem | null;
  detail: Dispute | null;
  loading: boolean;
  onClose: () => void;
  onResolve: () => void;
}

export function DisputeDetailModal({
  show,
  dispute,
  detail,
  loading,
  onClose,
  onResolve,
}: DisputeDetailModalProps) {
  if (!show || !dispute) return null;

  const statusColor = DISPUTE_STATUS_COLORS[dispute.status as DisputeStatus];
  const statusLabel = DISPUTE_STATUS_LABELS[dispute.status as DisputeStatus];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: tokens.color.overlay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 24,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.border}`,
            width: '100%',
            maxWidth: 800,
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${tokens.color.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: tokens.color.surface,
              zIndex: 1,
            }}
          >
            <div>
              <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
                Chi tiết Tranh chấp
              </h3>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
                Escrow: {dispute.escrowCode}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  padding: '6px 16px',
                  borderRadius: tokens.radius.sm,
                  background: `${statusColor}20`,
                  color: statusColor,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {statusLabel}
              </span>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tokens.color.muted,
                  cursor: 'pointer',
                  fontSize: 24,
                }}
              >
                <i className="ri-close-line" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: 24 }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: `3px solid ${tokens.color.border}`,
                    borderTopColor: tokens.color.primary,
                    margin: '0 auto',
                  }}
                />
              </div>
            ) : detail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Dispute Info */}
                <Section title="Thông tin Tranh chấp" icon="ri-error-warning-line">
                  <InfoRow label="Người tạo" value={detail.raisedBy.name} />
                  <InfoRow
                    label="Vai trò"
                    value={detail.raisedBy.role === 'HOMEOWNER' ? 'Chủ nhà' : 'Nhà thầu'}
                  />
                  <InfoRow label="Lý do" value={detail.reason} fullWidth />
                  <InfoRow
                    label="Ngày tạo"
                    value={new Date(detail.createdAt).toLocaleString('vi-VN')}
                  />
                  {detail.resolution && (
                    <>
                      <InfoRow
                        label="Kết quả"
                        value={RESOLUTION_TYPE_LABELS[detail.resolution as DisputeResolutionType]}
                      />
                      <InfoRow label="Ghi chú giải quyết" value={detail.resolutionNote || '-'} fullWidth />
                      <InfoRow
                        label="Ngày giải quyết"
                        value={
                          detail.resolvedAt
                            ? new Date(detail.resolvedAt).toLocaleString('vi-VN')
                            : '-'
                        }
                      />
                    </>
                  )}
                </Section>

                {/* Project Info */}
                <Section title="Thông tin Công trình" icon="ri-building-4-line">
                  <InfoRow label="Mã công trình" value={detail.project.code} />
                  <InfoRow label="Tiêu đề" value={detail.project.title} />
                  <InfoRow label="Trạng thái" value={detail.project.status} />
                  <InfoRow label="Địa chỉ" value={detail.project.address} fullWidth />
                </Section>

                {/* Bid Info */}
                <Section title="Thông tin Bid" icon="ri-auction-line">
                  <InfoRow label="Mã bid" value={detail.bid.code} />
                  <InfoRow label="Giá đề xuất" value={formatCurrency(detail.bid.price)} />
                  <InfoRow label="Timeline" value={detail.bid.timeline} />
                  <InfoRow label="Trạng thái" value={detail.bid.status} />
                </Section>

                {/* Escrow Info */}
                <Section title="Thông tin Escrow" icon="ri-safe-2-line">
                  <InfoRow label="Mã escrow" value={detail.escrow.code} />
                  <InfoRow label="Số tiền" value={formatCurrency(detail.escrow.amount)} />
                  <InfoRow
                    label="Đã giải phóng"
                    value={formatCurrency(detail.escrow.releasedAmount)}
                  />
                  <InfoRow
                    label="Còn lại"
                    value={formatCurrency(detail.escrow.amount - detail.escrow.releasedAmount)}
                  />
                  <InfoRow label="Trạng thái" value={detail.escrow.status} />
                </Section>

                {/* Contact Info - Two columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {/* Homeowner */}
                  <Section title="Chủ nhà" icon="ri-home-4-line">
                    <InfoRow label="Tên" value={detail.homeowner.name} />
                    <InfoRow label="Email" value={detail.homeowner.email} />
                    <InfoRow label="Điện thoại" value={detail.homeowner.phone} />
                    {detail.homeowner.address && (
                      <InfoRow label="Địa chỉ" value={detail.homeowner.address} />
                    )}
                  </Section>

                  {/* Contractor */}
                  <Section title="Nhà thầu" icon="ri-building-2-line">
                    <InfoRow label="Tên" value={detail.contractor.name} />
                    <InfoRow label="Email" value={detail.contractor.email} />
                    <InfoRow label="Điện thoại" value={detail.contractor.phone} />
                  </Section>
                </div>
              </div>
            ) : (
              <div style={{ padding: 48, textAlign: 'center', color: tokens.color.muted }}>
                Không thể tải thông tin chi tiết
              </div>
            )}
          </div>

          {/* Footer */}
          {detail && dispute.status === 'OPEN' && (
            <div
              style={{
                padding: '16px 24px',
                borderTop: `1px solid ${tokens.color.border}`,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                position: 'sticky',
                bottom: 0,
                background: tokens.color.surface,
              }}
            >
              <Button variant="secondary" onClick={onClose}>
                Đóng
              </Button>
              <Button variant="primary" onClick={onResolve}>
                <i className="ri-check-double-line" style={{ marginRight: 8 }} />
                Giải quyết
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper Components
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: tokens.color.surfaceAlt,
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.color.border}`,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          color: tokens.color.primary,
          fontWeight: 600,
        }}
      >
        <i className={icon} />
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color: tokens.color.text, fontSize: 14 }}>{value}</div>
    </div>
  );
}
