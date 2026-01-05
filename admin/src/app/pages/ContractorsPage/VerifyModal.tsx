/**
 * Verify Modal Component
 *
 * Confirmation modal for verifying/rejecting contractors.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Button } from '../../components/Button';
import type { Contractor } from './types';

interface VerifyModalProps {
  show: boolean;
  contractor: Contractor | null;
  action: 'VERIFIED' | 'REJECTED';
  note: string;
  saving: boolean;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const VerifyModal = memo(function VerifyModal({
  show,
  contractor,
  action,
  note,
  saving,
  onNoteChange,
  onConfirm,
  onClose,
}: VerifyModalProps) {
  return (
    <AnimatePresence>
      {show && contractor && (
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
                  {action === 'VERIFIED' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
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
                <p style={{ color: tokens.color.muted, fontSize: 14, margin: '0 0 16px' }}>
                  {action === 'VERIFIED'
                    ? `Bạn có chắc muốn xác minh nhà thầu "${contractor.name}"?`
                    : `Bạn có chắc muốn từ chối nhà thầu "${contractor.name}"?`}
                </p>

                {action === 'REJECTED' && (
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
                      Lý do từ chối
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => onNoteChange(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
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
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <Button variant="secondary" onClick={onClose} fullWidth>
                    Hủy
                  </Button>
                  <Button
                    onClick={onConfirm}
                    disabled={saving}
                    fullWidth
                    style={action === 'REJECTED' ? { background: tokens.color.error, borderColor: tokens.color.error } : undefined}
                  >
                    {saving ? 'Đang xử lý...' : action === 'VERIFIED' ? 'Xác minh' : 'Từ chối'}
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
