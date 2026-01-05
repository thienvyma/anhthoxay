/**
 * Fee Detail Modal Component
 *
 * Displays full fee transaction information in a modal.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 13.3**
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Button } from '../../components/Button';
import type { FeeListItem, FeeTransaction, FeeAction } from './types';
import { 
  FEE_STATUS_COLORS, 
  FEE_STATUS_LABELS, 
  FEE_TYPE_COLORS,
  FEE_TYPE_LABELS,
} from './types';

interface FeeDetailModalProps {
  show: boolean;
  fee: FeeListItem | null;
  detail: FeeTransaction | null;
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onFeeAction: (fee: FeeListItem, action: FeeAction, reason?: string) => void;
}

export const FeeDetailModal = memo(function FeeDetailModal({
  show,
  fee,
  detail,
  loading,
  saving,
  onClose,
  onFeeAction,
}: FeeDetailModalProps) {
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  const handleMarkPaid = () => {
    if (fee) {
      onFeeAction(fee, 'markPaid');
    }
  };

  const handleCancel = () => {
    if (fee && cancelReason.trim()) {
      onFeeAction(fee, 'cancel', cancelReason);
      setCancelReason('');
      setShowCancelForm(false);
    }
  };

  const handleClose = () => {
    setCancelReason('');
    setShowCancelForm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {show && fee && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, background: tokens.color.overlay, zIndex: 9998 }}
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
                width: 'min(800px, 100%)',
                maxHeight: '90vh',
                background: tokens.color.surface,
                borderRadius: tokens.radius.lg,
                border: `1px solid ${tokens.color.border}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <ModalHeader fee={fee} onClose={handleClose} />

              {/* Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                {loading ? (
                  <LoadingState />
                ) : detail ? (
                  <FeeContent detail={detail} />
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Footer with Actions */}
              {detail && detail.status === 'PENDING' && (
                <ModalFooter
                  showCancelForm={showCancelForm}
                  cancelReason={cancelReason}
                  saving={saving}
                  onCancelReasonChange={setCancelReason}
                  onShowCancelForm={() => setShowCancelForm(true)}
                  onHideCancelForm={() => {
                    setShowCancelForm(false);
                    setCancelReason('');
                  }}
                  onMarkPaid={handleMarkPaid}
                  onCancel={handleCancel}
                  onClose={handleClose}
                />
              )}

              {/* Footer for non-PENDING status */}
              {detail && detail.status !== 'PENDING' && (
                <div
                  style={{
                    padding: 24,
                    borderTop: `1px solid ${tokens.color.border}`,
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button variant="secondary" onClick={handleClose}>
                    Đóng
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

// Modal Header
function ModalHeader({ fee, onClose }: { fee: FeeListItem; onClose: () => void }) {
  const typeColor = FEE_TYPE_COLORS[fee.type];
  const typeLabel = FEE_TYPE_LABELS[fee.type];

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
            Chi tiết Phí
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
            {fee.code}
          </span>
          <span
            style={{
              fontSize: 12,
              color: typeColor,
              background: `${typeColor}15`,
              padding: '4px 8px',
              borderRadius: tokens.radius.sm,
              fontWeight: 600,
            }}
          >
            {typeLabel}
          </span>
        </div>
        <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
          Công trình: {fee.project.code}
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

// Modal Footer with Actions
function ModalFooter({
  showCancelForm,
  cancelReason,
  saving,
  onCancelReasonChange,
  onShowCancelForm,
  onHideCancelForm,
  onMarkPaid,
  onCancel,
  onClose,
}: {
  showCancelForm: boolean;
  cancelReason: string;
  saving: boolean;
  onCancelReasonChange: (value: string) => void;
  onShowCancelForm: () => void;
  onHideCancelForm: () => void;
  onMarkPaid: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  if (showCancelForm) {
    return (
      <div
        style={{
          padding: 24,
          borderTop: `1px solid ${tokens.color.border}`,
          background: tokens.color.errorBg,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500 }}>
            Lý do hủy phí
          </label>
        </div>
        <input
          type="text"
          placeholder="Nhập lý do hủy phí..."
          value={cancelReason}
          onChange={(e) => onCancelReasonChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            color: tokens.color.text,
            fontSize: 14,
            marginBottom: 16,
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onHideCancelForm} disabled={saving}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            onClick={onCancel}
            disabled={!cancelReason.trim() || saving}
            style={{ background: tokens.color.error }}
          >
            {saving ? (
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <i className="ri-close-circle-line" style={{ marginRight: 8 }} />
                Xác nhận hủy
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        borderTop: `1px solid ${tokens.color.border}`,
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
      }}
    >
      <Button variant="secondary" onClick={onClose}>
        Đóng
      </Button>
      <Button
        variant="secondary"
        onClick={onShowCancelForm}
        style={{
          background: tokens.color.errorBg,
          borderColor: `${tokens.color.error}50`,
          color: tokens.color.error,
        }}
      >
        <i className="ri-close-circle-line" style={{ marginRight: 8 }} />
        Hủy phí
      </Button>
      <Button
        variant="primary"
        onClick={onMarkPaid}
        disabled={saving}
        style={{ background: tokens.color.success }}
      >
        {saving ? (
          <motion.i
            className="ri-loader-4-line"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            <i className="ri-check-double-line" style={{ marginRight: 8 }} />
            Đánh dấu đã thanh toán
          </>
        )}
      </Button>
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
      <p>Không có thông tin phí</p>
    </div>
  );
}

// Fee Content
function FeeContent({ detail }: { detail: FeeTransaction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <FeeInfoSection detail={detail} />
      <ContractorSection detail={detail} />
      <ProjectSection detail={detail} />
      <BidSection detail={detail} />
      {detail.status !== 'PENDING' && <PaymentSection detail={detail} />}
    </div>
  );
}

// Section wrapper
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        background: tokens.color.surfaceAlt,
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

// Fee Info Section
function FeeInfoSection({ detail }: { detail: FeeTransaction }) {
  const statusColor = FEE_STATUS_COLORS[detail.status];
  const statusLabel = FEE_STATUS_LABELS[detail.status];
  const typeColor = FEE_TYPE_COLORS[detail.type];
  const typeLabel = FEE_TYPE_LABELS[detail.type];

  return (
    <Section icon="ri-money-dollar-circle-line" title="Thông tin Phí">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã Phí" value={detail.code} />
        <div>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>Loại phí</div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: tokens.radius.sm,
              background: `${typeColor}20`,
              color: typeColor,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {typeLabel}
          </span>
        </div>
        <div>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>Trạng thái</div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: tokens.radius.sm,
              background: `${statusColor}20`,
              color: statusColor,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {statusLabel}
          </span>
        </div>
        <InfoItem label="Số tiền" value={formatCurrency(detail.amount)} highlight />
        <InfoItem label="Ngày tạo" value={new Date(detail.createdAt).toLocaleString('vi-VN')} />
      </div>
    </Section>
  );
}

// Contractor Section
function ContractorSection({ detail }: { detail: FeeTransaction }) {
  return (
    <Section icon="ri-building-2-line" title="Thông tin Nhà thầu">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Họ tên" value={detail.user.name} />
        <InfoItem label="Email" value={detail.user.email} copyable />
        {detail.user.phone && <InfoItem label="Điện thoại" value={detail.user.phone} copyable />}
        {detail.user.companyName && <InfoItem label="Công ty" value={detail.user.companyName} />}
      </div>
    </Section>
  );
}

// Project Section
function ProjectSection({ detail }: { detail: FeeTransaction }) {
  return (
    <Section icon="ri-building-4-line" title="Thông tin Công trình">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã công trình" value={detail.project.code} />
        <InfoItem label="Tiêu đề" value={detail.project.title} />
      </div>
    </Section>
  );
}

// Bid Section
function BidSection({ detail }: { detail: FeeTransaction }) {
  return (
    <Section icon="ri-auction-line" title="Thông tin Bid">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InfoItem label="Mã Bid" value={detail.bid.code} />
        <InfoItem label="Giá đề xuất" value={formatCurrency(detail.bid.price)} highlight />
      </div>
    </Section>
  );
}

// Payment Section (for PAID or CANCELLED status)
function PaymentSection({ detail }: { detail: FeeTransaction }) {
  if (detail.status === 'PAID') {
    return (
      <Section icon="ri-checkbox-circle-line" title="Thông tin Thanh toán">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {detail.paidAt && (
            <InfoItem label="Ngày thanh toán" value={new Date(detail.paidAt).toLocaleString('vi-VN')} />
          )}
          {detail.paidBy && <InfoItem label="Xác nhận bởi" value={detail.paidBy} />}
        </div>
      </Section>
    );
  }

  if (detail.status === 'CANCELLED') {
    return (
      <Section icon="ri-close-circle-line" title="Thông tin Hủy">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {detail.cancelledAt && (
            <InfoItem label="Ngày hủy" value={new Date(detail.cancelledAt).toLocaleString('vi-VN')} />
          )}
          {detail.cancelledBy && <InfoItem label="Hủy bởi" value={detail.cancelledBy} />}
          {detail.cancelReason && <InfoItem label="Lý do" value={detail.cancelReason} />}
        </div>
      </Section>
    );
  }

  return null;
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
