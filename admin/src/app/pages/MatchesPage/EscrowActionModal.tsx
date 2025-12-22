/**
 * Escrow Action Modal Component
 *
 * Modal for performing escrow actions (confirm, release, partial, refund, dispute).
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 12.4, 12.5**
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import type { MatchListItem, EscrowAction } from './types';
import { ESCROW_ACTIONS } from './types';

interface EscrowActionModalProps {
  show: boolean;
  match: MatchListItem | null;
  action: EscrowAction;
  amount: number;
  reason: string;
  saving: boolean;
  onAmountChange: (amount: number) => void;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const EscrowActionModal = memo(function EscrowActionModal({
  show,
  match,
  action,
  amount,
  reason,
  saving,
  onAmountChange,
  onReasonChange,
  onConfirm,
  onClose,
}: EscrowActionModalProps) {
  const config = ESCROW_ACTIONS[action];
  
  // Calculate remaining amount for partial release
  const remainingAmount = match ? match.escrow.amount : 0; // In real scenario, subtract releasedAmount

  return (
    <AnimatePresence>
      {show && match && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000 }}
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
                width: 'min(500px, 100%)',
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
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: tokens.radius.md,
                    background: `${config.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: config.color,
                    fontSize: 20,
                  }}
                >
                  <i className={config.icon} />
                </div>
                <div>
                  <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
                    {config.label}
                  </h3>
                  <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0' }}>
                    Escrow: {match.escrow.code}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: 24 }}>
                {/* Escrow Info */}
                <div
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>Công trình</div>
                      <div style={{ color: tokens.color.text, fontSize: 14 }}>{match.project.code}</div>
                    </div>
                    <div>
                      <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>Số tiền escrow</div>
                      <div style={{ color: tokens.color.primary, fontSize: 14, fontWeight: 600 }}>
                        {formatCurrency(match.escrow.amount)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>Chủ nhà</div>
                      <div style={{ color: tokens.color.text, fontSize: 14 }}>{match.homeowner.name}</div>
                    </div>
                    <div>
                      <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 2 }}>Nhà thầu</div>
                      <div style={{ color: tokens.color.text, fontSize: 14 }}>{match.contractor.name}</div>
                    </div>
                  </div>
                </div>

                {/* Confirmation Text */}
                <p style={{ color: tokens.color.text, fontSize: 14, marginBottom: 20 }}>
                  {config.confirmText}
                </p>

                {/* Amount Input (for partial release) */}
                {config.requiresAmount && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 8 }}>
                      Số tiền giải phóng (VNĐ) <span style={{ color: tokens.color.error }}>*</span>
                    </label>
                    <Input
                      type="number"
                      value={amount.toString()}
                      onChange={(v) => onAmountChange(Number(v))}
                      placeholder={`Tối đa: ${formatCurrency(remainingAmount)}`}
                      fullWidth
                    />
                    <div style={{ color: tokens.color.muted, fontSize: 12, marginTop: 4 }}>
                      Số tiền còn lại: {formatCurrency(remainingAmount)}
                    </div>
                  </div>
                )}

                {/* Reason Input (for refund and dispute) */}
                {config.requiresReason && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 8 }}>
                      Lý do <span style={{ color: tokens.color.error }}>*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => onReasonChange(e.target.value)}
                      placeholder={action === 'refund' ? 'Nhập lý do hoàn tiền...' : 'Nhập lý do tranh chấp...'}
                      style={{
                        width: '100%',
                        minHeight: 100,
                        padding: 12,
                        borderRadius: tokens.radius.md,
                        border: `1px solid ${tokens.color.border}`,
                        background: tokens.color.surface,
                        color: tokens.color.text,
                        fontSize: 14,
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}

                {/* Note Input (optional for confirm and release) */}
                {!config.requiresAmount && !config.requiresReason && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 8 }}>
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => onReasonChange(e.target.value)}
                      placeholder="Nhập ghi chú nếu cần..."
                      style={{
                        width: '100%',
                        minHeight: 80,
                        padding: 12,
                        borderRadius: tokens.radius.md,
                        border: `1px solid ${tokens.color.border}`,
                        background: tokens.color.surface,
                        color: tokens.color.text,
                        fontSize: 14,
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}

                {/* Warning for destructive actions */}
                {(action === 'refund' || action === 'dispute') && (
                  <div
                    style={{
                      padding: 12,
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: tokens.radius.md,
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444' }}>
                      <i className="ri-error-warning-line" />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {action === 'refund' 
                          ? 'Hành động này sẽ hoàn tiền cho chủ nhà và không thể hoàn tác.'
                          : 'Hành động này sẽ đánh dấu escrow là tranh chấp và cần xử lý thủ công.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: 24,
                  borderTop: `1px solid ${tokens.color.border}`,
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'flex-end',
                }}
              >
                <Button variant="secondary" onClick={onClose} disabled={saving}>
                  Hủy
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={saving}
                  style={{
                    background: config.color,
                    borderColor: config.color,
                  }}
                >
                  {saving ? (
                    <>
                      <motion.i
                        className="ri-loader-4-line"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ marginRight: 8 }}
                      />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className={config.icon} style={{ marginRight: 8 }} />
                      Xác nhận
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

// Helper function
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}
