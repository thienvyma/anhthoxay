/**
 * Approval Modal Component
 *
 * Confirmation modal for approving/rejecting bids.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 11.5, 11.6**
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Button } from '../../components/Button';
import type { BidListItem } from './types';

interface ApprovalModalProps {
  show: boolean;
  bid: BidListItem | null;
  action: 'approve' | 'reject';
  note: string;
  saving: boolean;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const ApprovalModal = memo(function ApprovalModal({
  show,
  bid,
  action,
  note,
  saving,
  onNoteChange,
  onConfirm,
  onClose,
}: ApprovalModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <AnimatePresence>
      {show && bid && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: tokens.color.overlay, zIndex: 10000 }}
          />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: 'min(450px, 100%)',
                background: tokens.color.surface,
                borderRadius: tokens.radius.lg,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: 24,
                  borderBottom: `1px solid ${tokens.color.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                </h3>
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

              {/* Content */}
              <div style={{ padding: 24 }}>
                <div
                  style={{
                    padding: 16,
                    background: tokens.color.surfaceAlt,
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: tokens.color.primary,
                        background: `${tokens.color.primary}15`,
                        padding: '2px 6px',
                        borderRadius: tokens.radius.sm,
                      }}
                    >
                      {bid.code}
                    </span>
                  </div>
                  <div style={{ color: tokens.color.text, fontWeight: 500 }}>
                    Công trình: {bid.project.title}
                  </div>
                  <div style={{ color: tokens.color.muted, fontSize: 13, marginTop: 4 }}>
                    Nhà thầu: {bid.contractor.name}
                  </div>
                  <div style={{ color: tokens.color.primary, fontSize: 14, fontWeight: 600, marginTop: 8 }}>
                    Giá đề xuất: {formatCurrency(bid.price)}
                  </div>
                </div>

                <p style={{ color: tokens.color.muted, fontSize: 14, margin: '0 0 16px' }}>
                  {action === 'approve'
                    ? 'Bạn có chắc muốn duyệt bid này? Bid sẽ được hiển thị cho chủ nhà xem xét.'
                    : 'Bạn có chắc muốn từ chối bid này? Vui lòng nhập lý do từ chối.'}
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      color: tokens.color.text,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {action === 'approve' ? 'Ghi chú (tùy chọn)' : 'Lý do từ chối *'}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => onNoteChange(e.target.value)}
                    placeholder={
                      action === 'approve'
                        ? 'Nhập ghi chú nếu cần...'
                        : 'Nhập lý do từ chối...'
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 14,
                      minHeight: 80,
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Button variant="secondary" onClick={onClose} fullWidth>
                    Hủy
                  </Button>
                  <Button
                    onClick={onConfirm}
                    disabled={saving}
                    fullWidth
                    style={action === 'reject' ? { background: tokens.color.error, borderColor: tokens.color.error } : undefined}
                  >
                    {saving ? 'Đang xử lý...' : action === 'approve' ? 'Duyệt' : 'Từ chối'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});
