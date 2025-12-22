/**
 * Draft Recovery Modal
 *
 * Shows when user returns to a form with an existing draft.
 * Options: Continue with draft, Start fresh
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 22.3, 22.4**
 */

import { motion, AnimatePresence } from 'framer-motion';
import { formatDraftTime } from '../services/draftStorage';

export interface DraftRecoveryModalProps {
  isOpen: boolean;
  savedAt: string | null;
  isExpired: boolean;
  onContinue: () => void;
  onStartFresh: () => void;
}

export function DraftRecoveryModal({
  isOpen,
  savedAt,
  isExpired,
  onContinue,
  onStartFresh,
}: DraftRecoveryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}
        onClick={onStartFresh}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#1a1a1f',
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            width: '100%',
            border: '1px solid #27272a',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: isExpired
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(245, 211, 147, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <i
              className={isExpired ? 'ri-time-line' : 'ri-draft-line'}
              style={{
                fontSize: 28,
                color: isExpired ? '#ef4444' : '#f5d393',
              }}
            />
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#e4e7ec',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {isExpired ? 'Bản nháp đã cũ' : 'Phát hiện bản nháp'}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: 14,
              color: '#a1a1aa',
              textAlign: 'center',
              marginBottom: 8,
              lineHeight: 1.5,
            }}
          >
            {isExpired
              ? 'Bản nháp của bạn đã quá 30 ngày. Bạn có muốn tiếp tục với bản nháp cũ hay bắt đầu mới?'
              : 'Bạn có một bản nháp chưa hoàn thành. Bạn muốn tiếp tục hay bắt đầu mới?'}
          </p>

          {/* Saved time */}
          {savedAt && (
            <p
              style={{
                fontSize: 12,
                color: '#71717a',
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              Lưu lần cuối: {formatDraftTime(savedAt)}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-secondary"
              onClick={onStartFresh}
              style={{ flex: 1 }}
            >
              <i className="ri-refresh-line" style={{ marginRight: 6 }} />
              Bắt đầu mới
            </button>
            <button
              className="btn btn-primary"
              onClick={onContinue}
              style={{ flex: 1 }}
            >
              <i className="ri-edit-line" style={{ marginRight: 6 }} />
              Tiếp tục
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
