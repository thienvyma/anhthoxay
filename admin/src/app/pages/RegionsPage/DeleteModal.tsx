/**
 * Delete Modal Component
 *
 * Confirmation modal for deleting regions.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from '../../components/Button';
import type { Region } from './types';

interface DeleteModalProps {
  show: boolean;
  region: Region | null;
  saving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteModal = memo(function DeleteModal({
  show,
  region,
  saving,
  onConfirm,
  onClose,
}: DeleteModalProps) {
  return (
    <AnimatePresence>
      {show && region && (
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
                width: 'min(400px, 100%)',
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
                <h3 style={{ color: tokens.color.error, fontSize: 18, fontWeight: 600, margin: 0 }}>
                  <i className="ri-error-warning-line" style={{ marginRight: 8 }} />
                  Xác nhận xóa
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
                <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
                  Bạn có chắc muốn xóa khu vực{' '}
                  <strong style={{ color: tokens.color.text }}>{region.name}</strong>?
                </p>
                <p style={{ color: tokens.color.error, fontSize: 13, margin: '12px 0 0' }}>
                  <i className="ri-information-line" style={{ marginRight: 4 }} />
                  Lưu ý: Không thể xóa khu vực có khu vực con.
                </p>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: 24,
                  borderTop: `1px solid ${tokens.color.border}`,
                  display: 'flex',
                  gap: 12,
                }}
              >
                <Button variant="secondary" onClick={onClose} fullWidth>
                  Hủy
                </Button>
                <Button variant="danger" onClick={onConfirm} disabled={saving} fullWidth>
                  {saving ? 'Đang xóa...' : 'Xóa'}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});
