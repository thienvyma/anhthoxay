/**
 * ApiKeysList - API Keys List Component
 *
 * Displays a table of API keys with columns: Tên, Trạng thái, Quyền, Lần dùng cuối, Ngày tạo
 * Shows keyPrefix with masking (first 8 chars + "...")
 * Includes toggle switch for status and action buttons (Test, Edit, Delete)
 * Highlights keys expiring within 7 days
 *
 * **Feature: admin-guide-api-keys, Property 1: API Key Masking**
 * **Validates: Requirements 9.1, 9.2, 9.3, 11.1, 18.1**
 */

import { tokens } from '../../../../theme';
import { Button } from '../../../components/Button';
import { useResponsive } from '../../../../hooks/useResponsive';
import type { ApiKey, ApiKeyStatus, ApiKeyScope } from '../../../api/api-keys';

// ============================================
// TYPES
// ============================================

export interface ApiKeysListProps {
  apiKeys: ApiKey[];
  onToggle: (id: string) => void;
  onDelete: (apiKey: ApiKey) => void;
  onTest: (apiKey: ApiKey) => void;
  onEdit: (apiKey: ApiKey) => void;
  onSelect?: (apiKey: ApiKey) => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Masks an API key prefix for display
 * Shows first 8 characters followed by "..."
 *
 * **Feature: admin-guide-api-keys, Property 1: API Key Masking**
 * **Validates: Requirements 9.2**
 *
 * @param keyPrefix - The key prefix to mask
 * @returns Masked key string (first 8 chars + "...")
 */
export function maskApiKeyPrefix(keyPrefix: string): string {
  if (!keyPrefix) return '...';
  // Show first 8 characters followed by "..."
  const visiblePart = keyPrefix.slice(0, 8);
  return `${visiblePart}...`;
}

/**
 * Gets status badge styling based on API key status
 * @param status - The API key status
 * @returns Object with bg color, text color, and label
 */
export function getStatusBadge(status: ApiKeyStatus): { bg: string; color: string; label: string } {
  const styles: Record<ApiKeyStatus, { bg: string; color: string; label: string }> = {
    ACTIVE: { bg: 'rgba(34, 197, 94, 0.15)', color: tokens.color.success, label: 'Hoạt động' },
    INACTIVE: { bg: 'rgba(156, 163, 175, 0.15)', color: tokens.color.muted, label: 'Tắt' },
    EXPIRED: { bg: 'rgba(239, 68, 68, 0.15)', color: tokens.color.error, label: 'Hết hạn' },
  };
  return styles[status];
}

/**
 * Gets human-readable scope label
 * @param scope - The API key scope
 * @returns Vietnamese label for the scope
 */
export function getScopeLabel(scope: ApiKeyScope): string {
  const labels: Record<ApiKeyScope, string> = {
    READ_ONLY: 'Chỉ đọc',
    READ_WRITE: 'Đọc-Ghi',
    FULL_ACCESS: 'Toàn quyền',
  };
  return labels[scope] || scope;
}

/**
 * Formats a date string for display
 * @param dateStr - ISO date string or null
 * @returns Formatted date string or "Chưa sử dụng"
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Chưa sử dụng';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Checks if an API key is expiring within 7 days
 *
 * **Validates: Requirements 18.1**
 *
 * @param expiresAt - Expiration date string or null
 * @returns true if key expires within 7 days
 */
export function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
}

/**
 * Gets the number of days until expiration
 *
 * **Validates: Requirements 18.2**
 *
 * @param expiresAt - Expiration date string or null
 * @returns Number of days until expiration, or null if no expiration
 */
export function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const expDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry;
}

/**
 * Formats expiration date for display with relative time
 *
 * **Validates: Requirements 18.2**
 *
 * @param expiresAt - Expiration date string or null
 * @returns Formatted expiration string
 */
export function formatExpirationDate(expiresAt: string | null): string {
  if (!expiresAt) return 'Không giới hạn';
  
  const expDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const dateStr = expDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  
  if (daysUntilExpiry < 0) {
    return `Đã hết hạn (${dateStr})`;
  } else if (daysUntilExpiry === 0) {
    return `Hết hạn hôm nay (${dateStr})`;
  } else if (daysUntilExpiry === 1) {
    return `Còn 1 ngày (${dateStr})`;
  } else if (daysUntilExpiry <= 7) {
    return `Còn ${daysUntilExpiry} ngày (${dateStr})`;
  }
  
  return dateStr;
}

// ============================================
// COMPONENT
// ============================================

/**
 * ApiKeysList Component
 *
 * Renders a responsive table/list of API keys with:
 * - Masked key prefix display (first 8 chars + "...")
 * - Status toggle switch
 * - Action buttons (Test, Edit, Delete)
 * - Expiration warning highlighting
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 9.1, 9.2, 9.3, 11.1, 18.1**
 */
export function ApiKeysList({
  apiKeys,
  onToggle,
  onDelete,
  onTest,
  onEdit,
  onSelect,
}: ApiKeysListProps) {
  const { isMobile } = useResponsive();

  if (apiKeys.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 48,
          color: tokens.color.muted,
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
        }}
      >
        <i className="ri-key-2-line" style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
        <p style={{ margin: 0 }}>Chưa có API key nào</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Table Header - Desktop only */}
      {!isMobile && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
            gap: 16,
            padding: '12px 20px',
            borderBottom: `1px solid ${tokens.color.border}`,
            background: tokens.color.surfaceAlt,
          }}
        >
          <div style={{ color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            Tên
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            Trạng thái
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            Quyền
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            Hết hạn
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            Lần dùng cuối
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            Ngày tạo
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            Thao tác
          </div>
        </div>
      )}

      {/* Table Body */}
      {apiKeys.map((apiKey) => {
        const statusBadge = getStatusBadge(apiKey.status);
        const expiringSoon = isExpiringSoon(apiKey.expiresAt);
        const daysUntilExpiry = getDaysUntilExpiry(apiKey.expiresAt);

        return (
          <div
            key={apiKey.id}
            onClick={() => onSelect?.(apiKey)}
            style={{
              display: isMobile ? 'block' : 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr 1fr 1fr auto',
              gap: 16,
              padding: '16px 20px',
              borderBottom: `1px solid ${tokens.color.border}`,
              background: expiringSoon ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
              cursor: onSelect ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (onSelect && !expiringSoon) {
                e.currentTarget.style.background = tokens.color.surfaceAlt;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = expiringSoon ? 'rgba(245, 158, 11, 0.05)' : 'transparent';
            }}
          >
            {/* Name & Key Prefix */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: tokens.color.text, fontWeight: 500 }}>
                  {apiKey.name}
                </span>
                {expiringSoon && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                    }}
                  >
                    <i className="ri-alarm-warning-line" style={{ marginRight: 2 }} />
                    Sắp hết hạn
                  </span>
                )}
              </div>
              <div
                style={{
                  color: tokens.color.muted,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  marginTop: 4,
                }}
              >
                {maskApiKeyPrefix(apiKey.keyPrefix)}
              </div>
            </div>

            {/* Status */}
            <div style={{ marginTop: isMobile ? 12 : 0 }}>
              {isMobile && (
                <span style={{ color: tokens.color.muted, fontSize: 12, marginRight: 8 }}>
                  Trạng thái:
                </span>
              )}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: statusBadge.bg,
                  color: statusBadge.color,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: statusBadge.color,
                  }}
                />
                {statusBadge.label}
              </span>
            </div>

            {/* Scope */}
            <div style={{ marginTop: isMobile ? 8 : 0, color: tokens.color.text, fontSize: 14 }}>
              {isMobile && (
                <span style={{ color: tokens.color.muted, fontSize: 12, marginRight: 8 }}>
                  Quyền:
                </span>
              )}
              {getScopeLabel(apiKey.scope)}
            </div>

            {/* Expiration Date - Validates: Requirements 18.2 */}
            <div
              style={{
                marginTop: isMobile ? 8 : 0,
                fontSize: 13,
                color: expiringSoon
                  ? '#f59e0b'
                  : daysUntilExpiry !== null && daysUntilExpiry < 0
                  ? tokens.color.error
                  : tokens.color.muted,
              }}
            >
              {isMobile && (
                <span style={{ color: tokens.color.muted, fontSize: 12, marginRight: 8 }}>
                  Hết hạn:
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {expiringSoon && <i className="ri-time-line" style={{ fontSize: 14 }} />}
                {daysUntilExpiry !== null && daysUntilExpiry < 0 && (
                  <i className="ri-error-warning-line" style={{ fontSize: 14 }} />
                )}
                {formatExpirationDate(apiKey.expiresAt)}
              </span>
            </div>

            {/* Last Used */}
            <div style={{ marginTop: isMobile ? 8 : 0, color: tokens.color.muted, fontSize: 13 }}>
              {isMobile && (
                <span style={{ color: tokens.color.muted, fontSize: 12, marginRight: 8 }}>
                  Lần dùng cuối:
                </span>
              )}
              {formatDate(apiKey.lastUsedAt)}
            </div>

            {/* Created At */}
            <div style={{ marginTop: isMobile ? 8 : 0, color: tokens.color.muted, fontSize: 13 }}>
              {isMobile && (
                <span style={{ color: tokens.color.muted, fontSize: 12, marginRight: 8 }}>
                  Ngày tạo:
                </span>
              )}
              {formatDate(apiKey.createdAt)}
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: isMobile ? 16 : 0,
                justifyContent: isMobile ? 'flex-start' : 'flex-end',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Toggle Switch */}
              <button
                onClick={() => onToggle(apiKey.id)}
                disabled={apiKey.status === 'EXPIRED'}
                title={apiKey.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  background:
                    apiKey.status === 'ACTIVE'
                      ? tokens.color.success
                      : tokens.color.border,
                  cursor: apiKey.status === 'EXPIRED' ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                  opacity: apiKey.status === 'EXPIRED' ? 0.5 : 1,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: apiKey.status === 'ACTIVE' ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                  }}
                />
              </button>

              {/* Test Button */}
              <span title="Test API Key">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => onTest(apiKey)}
                  style={{ padding: '6px 10px' }}
                >
                  <i className="ri-play-line" />
                </Button>
              </span>

              {/* Edit Button */}
              <span title="Chỉnh sửa">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => onEdit(apiKey)}
                  style={{ padding: '6px 10px' }}
                >
                  <i className="ri-edit-line" />
                </Button>
              </span>

              {/* Delete Button */}
              <span title="Xóa">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => onDelete(apiKey)}
                  style={{ padding: '6px 10px', color: tokens.color.error }}
                >
                  <i className="ri-delete-bin-line" />
                </Button>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
