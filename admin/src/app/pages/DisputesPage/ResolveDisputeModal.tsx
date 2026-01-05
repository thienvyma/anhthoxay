/**
 * Resolve Dispute Modal Component
 *
 * Modal for admin to resolve a dispute by choosing to refund homeowner
 * or release to contractor.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 16.4, 16.5**
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Button } from '../../components/Button';
import {
  RESOLUTION_TYPE_LABELS,
  type DisputeListItem,
  type Dispute,
  type DisputeResolutionType,
} from './types';

interface ResolveDisputeModalProps {
  show: boolean;
  dispute: DisputeListItem | null;
  detail: Dispute | null;
  saving: boolean;
  onConfirm: (resolution: DisputeResolutionType, note: string) => void;
  onClose: () => void;
}

export function ResolveDisputeModal({
  show,
  dispute,
  detail,
  saving,
  onConfirm,
  onClose,
}: ResolveDisputeModalProps) {
  const [resolution, setResolution] = useState<DisputeResolutionType>('REFUND_TO_HOMEOWNER');
  const [note, setNote] = useState('');

  if (!show || !dispute) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const remainingAmount = detail
    ? detail.escrow.amount - detail.escrow.releasedAmount
    : 0;

  const handleConfirm = () => {
    if (!note.trim()) {
      return;
    }
    onConfirm(resolution, note);
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
          zIndex: 1001,
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
            maxWidth: 500,
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
            }}
          >
            <div>
              <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
                Giải quyết Tranh chấp
              </h3>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
                {dispute.project.code}
              </p>
            </div>
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

          {/* Content */}
          <div style={{ padding: 24 }}>
            {/* Summary */}
            {detail && (
              <div
                style={{
                  background: tokens.color.surfaceAlt,
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                      Chủ nhà
                    </div>
                    <div style={{ color: tokens.color.text, fontSize: 14 }}>
                      {detail.homeowner.name}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                      Nhà thầu
                    </div>
                    <div style={{ color: tokens.color.text, fontSize: 14 }}>
                      {detail.contractor.name}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                      Số tiền escrow còn lại
                    </div>
                    <div style={{ color: tokens.color.primary, fontSize: 16, fontWeight: 600 }}>
                      {formatCurrency(remainingAmount)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                      Lý do tranh chấp
                    </div>
                    <div style={{ color: tokens.color.text, fontSize: 14 }}>
                      {detail.reason}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resolution Options */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  color: tokens.color.text,
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 12,
                }}
              >
                Chọn cách giải quyết <span style={{ color: tokens.color.error }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ResolutionOption
                  selected={resolution === 'REFUND_TO_HOMEOWNER'}
                  onSelect={() => setResolution('REFUND_TO_HOMEOWNER')}
                  icon="ri-refund-2-line"
                  label={RESOLUTION_TYPE_LABELS.REFUND_TO_HOMEOWNER}
                  description="Hoàn trả số tiền escrow còn lại cho chủ nhà"
                  color="#F59E0B"
                />
                <ResolutionOption
                  selected={resolution === 'RELEASE_TO_CONTRACTOR'}
                  onSelect={() => setResolution('RELEASE_TO_CONTRACTOR')}
                  icon="ri-hand-coin-line"
                  label={RESOLUTION_TYPE_LABELS.RELEASE_TO_CONTRACTOR}
                  description="Giải phóng số tiền escrow còn lại cho nhà thầu"
                  color={tokens.color.success}
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label
                style={{
                  display: 'block',
                  color: tokens.color.text,
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                Ghi chú giải quyết <span style={{ color: tokens.color.error }}>*</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập lý do và chi tiết giải quyết tranh chấp..."
                rows={4}
                style={{
                  width: '100%',
                  padding: 12,
                  background: tokens.color.surfaceAlt,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: `1px solid ${tokens.color.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={saving || !note.trim()}
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
                  Xác nhận giải quyết
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper Component
function ResolutionOption({
  selected,
  onSelect,
  icon,
  label,
  description,
  color,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: string;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        background: selected ? `${color}10` : tokens.color.surfaceAlt,
        border: `2px solid ${selected ? color : tokens.color.border}`,
        borderRadius: tokens.radius.md,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: tokens.radius.md,
          background: selected ? `${color}20` : tokens.color.surfaceHover,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: selected ? color : tokens.color.muted,
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        <i className={icon} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            color: selected ? color : tokens.color.text,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div style={{ color: tokens.color.muted, fontSize: 13 }}>{description}</div>
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: `2px solid ${selected ? color : tokens.color.border}`,
          background: selected ? color : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {selected && <i className="ri-check-line" style={{ color: '#fff', fontSize: 12 }} />}
      </div>
    </motion.button>
  );
}
