/**
 * DeleteApiKeyModal - Delete Confirmation Modal Component
 *
 * Displays a confirmation dialog before permanently deleting an API key.
 * Shows the key name and a warning about permanent deletion.
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 12.1, 12.4**
 */

import { tokens } from '../../../../theme';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { useResponsive } from '../../../../hooks/useResponsive';
import type { ApiKey } from '../../../api/api-keys';

// ============================================
// TYPES
// ============================================

export interface DeleteApiKeyModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The API key to delete */
  apiKey: ApiKey | null;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when deletion is confirmed */
  onConfirm: (apiKey: ApiKey) => void;
  /** Whether deletion is in progress */
  deleting?: boolean;
}

// ============================================
// COMPONENT
// ============================================

/**
 * DeleteApiKeyModal Component
 *
 * Confirmation modal for deleting an API key.
 * Shows key name in confirmation message and warning about permanent deletion.
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 12.1, 12.4**
 */
export function DeleteApiKeyModal({
  isOpen,
  apiKey,
  onClose,
  onConfirm,
  deleting = false,
}: DeleteApiKeyModalProps) {
  const { isMobile } = useResponsive();

  // Handle confirm deletion
  const handleConfirm = () => {
    if (apiKey && !deleting) {
      onConfirm(apiKey);
    }
  };

  if (!apiKey) return null;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xóa API Key"
      size="sm"
      closeOnOverlayClick={!deleting}
      closeOnEscape={!deleting}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={deleting}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={deleting}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {deleting ? (
              <>
                <i className="ri-loader-4-line ri-spin" style={{ marginRight: 8 }} />
                Đang xóa...
              </>
            ) : (
              <>
                <i className="ri-delete-bin-line" style={{ marginRight: 8 }} />
                Xóa vĩnh viễn
              </>
            )}
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'center' }}>
        {/* Warning Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <i
            className="ri-error-warning-line"
            style={{
              fontSize: 32,
              color: tokens.color.error,
            }}
          />
        </div>

        {/* Confirmation Message - Validates: Requirements 12.1 */}
        <p
          style={{
            color: tokens.color.text,
            fontSize: 16,
            margin: '0 0 8px',
            lineHeight: 1.5,
          }}
        >
          Bạn có chắc chắn muốn xóa API key
        </p>
        <p
          style={{
            color: tokens.color.primary,
            fontSize: 18,
            fontWeight: 600,
            margin: '0 0 20px',
            wordBreak: 'break-word',
          }}
        >
          "{apiKey.name}"?
        </p>

        {/* Warning Box - Validates: Requirements 12.4 */}
        <div
          style={{
            padding: 16,
            borderRadius: tokens.radius.md,
            background: 'rgba(239, 68, 68, 0.08)',
            border: `1px solid rgba(239, 68, 68, 0.2)`,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <i
              className="ri-alert-line"
              style={{
                fontSize: 20,
                color: tokens.color.error,
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <div>
              <p
                style={{
                  color: tokens.color.error,
                  fontSize: 14,
                  fontWeight: 600,
                  margin: '0 0 4px',
                }}
              >
                Cảnh báo
              </p>
              <p
                style={{
                  color: tokens.color.muted,
                  fontSize: 13,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Hành động này không thể hoàn tác. Tất cả các ứng dụng đang sử dụng API key này sẽ ngừng hoạt động ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
