/**
 * KeyCreatedModal - API Key Created Success Modal
 *
 * Displays the full raw API key after creation with:
 * - Full key in monospace font
 * - One-click copy button
 * - Warning message that key is shown only once
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 10.3**
 */

import { useState } from 'react';
import { tokens } from '../../../../theme';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { useResponsive } from '../../../../hooks/useResponsive';

// ============================================
// TYPES
// ============================================

export interface KeyCreatedModalProps {
  isOpen: boolean;
  rawKey: string;
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

/**
 * KeyCreatedModal Component
 *
 * Shows the newly created API key with copy functionality.
 * Displays a warning that the key is only shown once.
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 10.3**
 */
export function KeyCreatedModal({ isOpen, rawKey, onClose }: KeyCreatedModalProps) {
  const { isMobile } = useResponsive();
  const [copied, setCopied] = useState(false);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = rawKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset copied state when modal closes
  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="API Key đã được tạo"
      size="md"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      footer={
        <Button
          onClick={handleClose}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          <i className="ri-check-line" style={{ marginRight: 8 }} />
          Đã lưu, đóng
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Success Icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i
              className="ri-key-2-fill"
              style={{
                fontSize: 32,
                color: tokens.color.success,
              }}
            />
          </div>
        </div>

        {/* Warning Message */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: 16,
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: tokens.radius.md,
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <i
            className="ri-error-warning-fill"
            style={{
              fontSize: 20,
              color: '#f59e0b',
              flexShrink: 0,
              marginTop: 2,
            }}
          />
          <div>
            <p
              style={{
                margin: 0,
                color: '#f59e0b',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Key này chỉ hiển thị một lần duy nhất!
            </p>
            <p
              style={{
                margin: '4px 0 0',
                color: tokens.color.muted,
                fontSize: 13,
              }}
            >
              Hãy sao chép và lưu trữ key này ở nơi an toàn. Bạn sẽ không thể xem lại key này sau khi đóng cửa sổ.
            </p>
          </div>
        </div>

        {/* API Key Display */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            API Key của bạn
          </label>
          <div
            style={{
              position: 'relative',
              background: tokens.color.surfaceAlt,
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 60px 16px 16px',
                fontFamily: 'monospace',
                fontSize: isMobile ? 11 : 13,
                color: tokens.color.text,
                wordBreak: 'break-all',
                lineHeight: 1.6,
                userSelect: 'all',
              }}
            >
              {rawKey}
            </div>
            <button
              onClick={handleCopy}
              title={copied ? 'Đã sao chép!' : 'Sao chép'}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: copied ? 'rgba(34, 197, 94, 0.2)' : tokens.color.surfaceHover,
                border: 'none',
                borderRadius: tokens.radius.sm,
                color: copied ? tokens.color.success : tokens.color.text,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = tokens.color.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = tokens.color.surfaceHover;
                }
              }}
            >
              <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} style={{ fontSize: 18 }} />
            </button>
          </div>
          {copied && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: tokens.color.success,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <i className="ri-check-double-line" />
              Đã sao chép vào clipboard!
            </p>
          )}
        </div>

        {/* Usage Instructions */}
        <div
          style={{
            padding: 16,
            background: tokens.color.surfaceAlt,
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          <p
            style={{
              margin: 0,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            <i className="ri-lightbulb-line" style={{ marginRight: 8, color: tokens.color.primary }} />
            Cách sử dụng
          </p>
          <p
            style={{
              margin: 0,
              color: tokens.color.muted,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Thêm header <code style={{ 
              background: tokens.color.surfaceAlt, 
              padding: '2px 6px', 
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 12,
            }}>X-API-Key: {rawKey.slice(0, 8)}...</code> vào các request API của bạn.
          </p>
        </div>
      </div>
    </ResponsiveModal>
  );
}
