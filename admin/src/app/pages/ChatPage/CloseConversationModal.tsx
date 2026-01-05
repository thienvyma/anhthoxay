/**
 * Close Conversation Modal
 *
 * Modal for closing a conversation with optional reason.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 14.4 - Prevent further messages
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';

interface CloseConversationModalProps {
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}

export const CloseConversationModal = memo(function CloseConversationModal({
  onClose,
  onConfirm,
}: CloseConversationModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm(reason || undefined);
    } finally {
      setLoading(false);
    }
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
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.border}`,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            maxWidth: 450,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
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
                background: tokens.color.errorBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="ri-chat-off-line" style={{ fontSize: 20, color: tokens.color.error }} />
            </div>
            <div>
              <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
                Đóng cuộc hội thoại
              </h3>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: '2px 0 0' }}>
                Hành động này không thể hoàn tác
              </p>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: 24 }}>
            <p style={{ color: tokens.color.muted, fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
              Sau khi đóng, các bên sẽ không thể gửi tin nhắn mới trong cuộc hội thoại này. Bạn có thể
              nhập lý do đóng (tùy chọn).
            </p>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: tokens.color.text,
                  marginBottom: 8,
                }}
              >
                Lý do (tùy chọn)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do đóng cuộc hội thoại..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: tokens.color.background,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Hủy
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: tokens.color.error,
                border: 'none',
                borderRadius: tokens.radius.md,
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {loading ? (
                <>
                  <motion.i
                    className="ri-loader-4-line"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <i className="ri-check-line" />
                  Đóng hội thoại
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
