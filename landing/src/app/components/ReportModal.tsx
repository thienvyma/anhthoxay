/**
 * Report Modal Component
 *
 * Modal for reporting inappropriate reviews with reason selection.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 19.1, 19.2 - Report button with reason selection**
 */

import { useState } from 'react';
import { tokens } from '@app/shared';

// ============================================
// TYPES
// ============================================

export type ReportReason = 'spam' | 'offensive' | 'fake' | 'irrelevant';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, description?: string) => Promise<void>;
  isLoading?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const REPORT_REASONS: Array<{ value: ReportReason; label: string; description: string }> = [
  {
    value: 'spam',
    label: 'Spam',
    description: 'Nội dung quảng cáo hoặc không liên quan',
  },
  {
    value: 'offensive',
    label: 'Nội dung xúc phạm',
    description: 'Ngôn ngữ thô tục, xúc phạm hoặc đe dọa',
  },
  {
    value: 'fake',
    label: 'Đánh giá giả mạo',
    description: 'Đánh giá không thực từ người không sử dụng dịch vụ',
  },
  {
    value: 'irrelevant',
    label: 'Không liên quan',
    description: 'Nội dung không liên quan đến dịch vụ nhà thầu',
  },
];

// ============================================
// COMPONENT
// ============================================

export function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Vui lòng chọn lý do báo cáo');
      return;
    }

    setError(null);
    try {
      await onSubmit(selectedReason, description.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedReason(null);
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflow: 'auto',
          border: `1px solid ${tokens.color.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: `1px solid ${tokens.color.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i
              className="ri-flag-line"
              style={{ color: '#FF4444', fontSize: 20 }}
            />
            <h3
              style={{
                color: tokens.color.text,
                fontSize: 18,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Báo cáo đánh giá
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.color.muted,
              fontSize: 24,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          <p
            style={{
              color: tokens.color.textMuted,
              fontSize: 14,
              margin: '0 0 20px 0',
            }}
          >
            Vui lòng chọn lý do bạn muốn báo cáo đánh giá này. Chúng tôi sẽ xem
            xét và xử lý trong thời gian sớm nhất.
          </p>

          {/* Reason Selection - Requirements: 19.2 */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 500,
                display: 'block',
                marginBottom: 12,
              }}
            >
              Lý do báo cáo <span style={{ color: '#FF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: 12,
                    background:
                      selectedReason === reason.value
                        ? 'rgba(255,68,68,0.1)'
                        : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      selectedReason === reason.value
                        ? 'rgba(255,68,68,0.3)'
                        : tokens.color.border
                    }`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    style={{
                      marginTop: 2,
                      accentColor: '#FF4444',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        color: tokens.color.text,
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {reason.label}
                    </div>
                    <div
                      style={{
                        color: tokens.color.textMuted,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {reason.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description (Optional) */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 500,
                display: 'block',
                marginBottom: 8,
              }}
            >
              Mô tả thêm (tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cung cấp thêm chi tiết về lý do báo cáo..."
              maxLength={500}
              style={{
                width: '100%',
                minHeight: 100,
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: 8,
                color: tokens.color.text,
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div
              style={{
                color: tokens.color.muted,
                fontSize: 11,
                textAlign: 'right',
                marginTop: 4,
              }}
            >
              {description.length}/500
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: 12,
                background: 'rgba(255,68,68,0.1)',
                border: '1px solid rgba(255,68,68,0.3)',
                borderRadius: 8,
                color: '#FF4444',
                fontSize: 13,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="ri-error-warning-line" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '16px 20px',
            borderTop: `1px solid ${tokens.color.border}`,
          }}
        >
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: 8,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedReason}
            style={{
              padding: '10px 20px',
              background: '#FF4444',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: isLoading || !selectedReason ? 'not-allowed' : 'pointer',
              opacity: isLoading || !selectedReason ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isLoading && (
              <i
                className="ri-loader-4-line"
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              />
            )}
            Gửi báo cáo
          </button>
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ReportModal;
