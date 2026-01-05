/**
 * EditApiKeyModal - Edit API Key Modal Component
 *
 * Form for editing existing API keys with:
 * - Tên (name) - editable
 * - Mô tả (description) - editable
 * - Quyền (scope) - editable
 * - Nhóm API (allowedEndpoints) - editable
 * - Thời hạn (expiresAt) - editable
 * - Key value - NOT editable (shown as masked)
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 18.4**
 */

import { useState, useEffect } from 'react';
import { tokens } from '../../../../theme';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input, TextArea } from '../../../components/Input';
import { useResponsive } from '../../../../hooks/useResponsive';
import { maskApiKeyPrefix, isExpiringSoon } from './ApiKeysList';
import type { ApiKey, ApiKeyScope, EndpointGroup, UpdateApiKeyInput } from '../../../api/api-keys';

// ============================================
// TYPES
// ============================================

export interface EditApiKeyModalProps {
  isOpen: boolean;
  apiKey: ApiKey | null;
  onClose: () => void;
  onSaved: (apiKey: ApiKey) => void;
  onSubmit: (id: string, data: UpdateApiKeyInput) => Promise<ApiKey>;
  saving?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Scope options with descriptions
 * **Validates: Requirements 15.1**
 */
const SCOPE_OPTIONS: Array<{ value: ApiKeyScope; label: string; description: string }> = [
  {
    value: 'READ_ONLY',
    label: 'Chỉ đọc',
    description: 'Chỉ có thể xem dữ liệu (GET requests)',
  },
  {
    value: 'READ_WRITE',
    label: 'Đọc-Ghi',
    description: 'Có thể xem và tạo/sửa dữ liệu (GET, POST, PUT)',
  },
  {
    value: 'FULL_ACCESS',
    label: 'Toàn quyền',
    description: 'Toàn quyền bao gồm xóa dữ liệu (GET, POST, PUT, DELETE)',
  },
];

/**
 * Endpoint group options
 * **Validates: Requirements 15.1**
 */
const ENDPOINT_GROUPS: Array<{
  value: EndpointGroup;
  label: string;
  description: string;
  icon: string;
}> = [
  { value: 'leads', label: 'Leads', description: 'Quản lý khách hàng tiềm năng', icon: 'ri-user-follow-line' },
  { value: 'blog', label: 'Blog', description: 'Quản lý bài viết', icon: 'ri-article-line' },
  { value: 'projects', label: 'Công trình', description: 'Quản lý dự án xây dựng', icon: 'ri-building-line' },
  { value: 'contractors', label: 'Nhà thầu', description: 'Quản lý nhà thầu', icon: 'ri-team-line' },
  { value: 'reports', label: 'Báo cáo', description: 'Xem thống kê và báo cáo', icon: 'ri-bar-chart-box-line' },
  {
    value: 'pricing',
    label: 'Cấu hình giá',
    description: 'Hạng mục, đơn giá, công thức',
    icon: 'ri-money-dollar-circle-line',
  },
  {
    value: 'furniture',
    label: 'Nội thất',
    description: 'Danh mục, vật dụng, dự án, báo giá nội thất',
    icon: 'ri-home-gear-line',
  },
  { value: 'media', label: 'Media', description: 'Hình ảnh và tệp tin', icon: 'ri-image-line' },
  { value: 'settings', label: 'Cài đặt', description: 'Cài đặt hệ thống', icon: 'ri-settings-3-line' },
];

/**
 * Expiration options
 * **Validates: Requirements 15.1**
 */
const EXPIRATION_OPTIONS: Array<{ value: string; label: string; days: number | null }> = [
  { value: 'never', label: 'Không giới hạn', days: null },
  { value: '30', label: '30 ngày', days: 30 },
  { value: '90', label: '90 ngày', days: 90 },
  { value: '365', label: '1 năm', days: 365 },
  { value: 'custom', label: 'Giữ nguyên', days: -1 }, // Special value for keeping current expiration
];

// ============================================
// HELPERS
// ============================================

/**
 * Parse allowed endpoints from JSON string
 */
function parseAllowedEndpoints(json: string): EndpointGroup[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Calculate expiration option from current expiresAt
 */
function getExpirationOption(expiresAt: string | null): string {
  if (!expiresAt) return 'never';
  return 'custom'; // If there's an expiration, show "Giữ nguyên" by default
}

// ============================================
// COMPONENT
// ============================================

/**
 * EditApiKeyModal Component
 *
 * Modal form for editing existing API keys.
 * Pre-fills form with current values and allows editing all fields except the key value.
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 15.1, 15.2, 15.3, 15.4**
 */
export function EditApiKeyModal({
  isOpen,
  apiKey,
  onClose,
  onSaved,
  onSubmit,
  saving = false,
}: EditApiKeyModalProps) {
  const { isMobile } = useResponsive();

  // Form state - initialized from apiKey
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<ApiKeyScope>('READ_ONLY');
  const [allowedEndpoints, setAllowedEndpoints] = useState<EndpointGroup[]>([]);
  const [expiration, setExpiration] = useState('custom');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when apiKey changes
  useEffect(() => {
    if (apiKey) {
      setName(apiKey.name);
      setDescription(apiKey.description || '');
      setScope(apiKey.scope);
      setAllowedEndpoints(parseAllowedEndpoints(apiKey.allowedEndpoints));
      setExpiration(getExpirationOption(apiKey.expiresAt));
      setErrors({});
    }
  }, [apiKey]);

  // Reset form when modal closes
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  // Toggle endpoint group
  const toggleEndpoint = (endpoint: EndpointGroup) => {
    setAllowedEndpoints((prev) =>
      prev.includes(endpoint)
        ? prev.filter((e) => e !== endpoint)
        : [...prev, endpoint]
    );
    // Clear endpoint error when user selects
    if (errors.allowedEndpoints) {
      setErrors((prev) => ({ ...prev, allowedEndpoints: '' }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation (3-100 chars)
    if (!name.trim()) {
      newErrors.name = 'Tên API key là bắt buộc';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Tên phải có ít nhất 3 ký tự';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Tên không được quá 100 ký tự';
    }

    // Endpoint groups validation
    if (allowedEndpoints.length === 0) {
      newErrors.allowedEndpoints = 'Phải chọn ít nhất 1 nhóm API';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !apiKey) return;

    // Calculate expiration date
    let expiresAt: string | null | undefined = undefined; // undefined means don't change
    if (expiration === 'never') {
      expiresAt = null;
    } else if (expiration !== 'custom') {
      const selectedExpiration = EXPIRATION_OPTIONS.find((opt) => opt.value === expiration);
      if (selectedExpiration?.days && selectedExpiration.days > 0) {
        const date = new Date();
        date.setDate(date.getDate() + selectedExpiration.days);
        expiresAt = date.toISOString();
      }
    }
    // If expiration === 'custom', expiresAt stays undefined (keep current)

    const updateData: UpdateApiKeyInput = {
      name: name.trim(),
      description: description.trim() || null,
      scope,
      allowedEndpoints,
    };

    // Only include expiresAt if it was changed
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt;
    }

    const updated = await onSubmit(apiKey.id, updateData);
    onSaved(updated);
  };

  if (!apiKey) return null;

  const isExpired = apiKey.status === 'EXPIRED';
  const expiringSoon = isExpiringSoon(apiKey.expiresAt);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Chỉnh sửa API Key"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={saving}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Hủy
          </Button>
          <Button
            onClick={() => {
              const form = document.getElementById('edit-api-key-form') as HTMLFormElement;
              form?.requestSubmit();
            }}
            disabled={saving}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {saving ? (
              <>
                <i className="ri-loader-4-line ri-spin" style={{ marginRight: 8 }} />
                Đang lưu...
              </>
            ) : (
              <>
                <i className="ri-save-line" style={{ marginRight: 8 }} />
                Lưu thay đổi
              </>
            )}
          </Button>
        </>
      }
    >
      <form
        id="edit-api-key-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        {/* Expired Key Warning Banner - Validates: Requirements 18.4 */}
        {isExpired && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 16px',
              borderRadius: tokens.radius.md,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <i
              className="ri-error-warning-line"
              style={{ fontSize: 20, color: tokens.color.error, flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  color: tokens.color.error,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                API key đã hết hạn
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  color: tokens.color.muted,
                  fontSize: 12,
                }}
              >
                Chọn thời hạn mới bên dưới để kích hoạt lại API key này.
              </p>
            </div>
          </div>
        )}

        {/* Expiring Soon Warning Banner */}
        {!isExpired && expiringSoon && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 16px',
              borderRadius: tokens.radius.md,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <i
              className="ri-alarm-warning-line"
              style={{ fontSize: 20, color: '#f59e0b', flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  color: '#f59e0b',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                API key sắp hết hạn
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  color: tokens.color.muted,
                  fontSize: 12,
                }}
              >
                Gia hạn thời gian sử dụng để tránh gián đoạn dịch vụ.
              </p>
            </div>
          </div>
        )}
        {/* Key Prefix (Read-only) - Validates: Requirements 15.2 */}
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
            API Key
          </label>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surfaceAlt,
              color: tokens.color.muted,
              fontSize: 14,
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i className="ri-lock-line" style={{ fontSize: 16 }} />
            <span>{maskApiKeyPrefix(apiKey.keyPrefix)}</span>
          </div>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 12,
              color: tokens.color.muted,
            }}
          >
            <i className="ri-information-line" style={{ marginRight: 4 }} />
            Giá trị API key không thể thay đổi
          </p>
        </div>

        {/* Name */}
        <Input
          label="Tên API Key"
          value={name}
          onChange={(v) => {
            setName(v);
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="VD: ChatGPT Integration"
          required
          fullWidth
          error={errors.name}
        />

        {/* Description */}
        <TextArea
          label="Mô tả"
          value={description}
          onChange={setDescription}
          placeholder="Mô tả mục đích sử dụng API key (tùy chọn)"
          rows={2}
          fullWidth
        />

        {/* Scope */}
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
            Quyền <span style={{ color: tokens.color.error }}>*</span>
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as ApiKeyScope)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surfaceAlt,
              color: tokens.color.text,
              fontSize: 14,
              minHeight: '44px',
              cursor: 'pointer',
            }}
          >
            {SCOPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Scope description */}
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 12,
              color: tokens.color.muted,
            }}
          >
            <i className="ri-information-line" style={{ marginRight: 4 }} />
            {SCOPE_OPTIONS.find((opt) => opt.value === scope)?.description}
          </p>
        </div>

        {/* Endpoint Groups */}
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
            Nhóm API được phép <span style={{ color: tokens.color.error }}>*</span>
          </label>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 12,
              background: tokens.color.surfaceAlt,
              borderRadius: tokens.radius.md,
              border: `1px solid ${errors.allowedEndpoints ? tokens.color.error : tokens.color.border}`,
            }}
          >
            {ENDPOINT_GROUPS.map((group) => (
              <label
                key={group.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: tokens.radius.sm,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  background: allowedEndpoints.includes(group.value)
                    ? 'rgba(245, 211, 147, 0.1)'
                    : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!allowedEndpoints.includes(group.value)) {
                    e.currentTarget.style.background = tokens.color.surfaceAlt;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = allowedEndpoints.includes(group.value)
                    ? 'rgba(245, 211, 147, 0.1)'
                    : 'transparent';
                }}
              >
                <input
                  type="checkbox"
                  checked={allowedEndpoints.includes(group.value)}
                  onChange={() => toggleEndpoint(group.value)}
                  style={{
                    width: 18,
                    height: 18,
                    marginTop: 2,
                    accentColor: tokens.color.primary,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <i
                  className={group.icon}
                  style={{
                    fontSize: 18,
                    color: allowedEndpoints.includes(group.value)
                      ? tokens.color.primary
                      : tokens.color.muted,
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: tokens.color.text, fontWeight: 500 }}>
                    {group.label}
                  </span>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 12,
                      color: tokens.color.muted,
                    }}
                  >
                    {group.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
          {errors.allowedEndpoints && (
            <div style={{ color: tokens.color.error, fontSize: 12, marginTop: 4 }}>
              <i className="ri-error-warning-line" style={{ marginRight: 4 }} />
              {errors.allowedEndpoints}
            </div>
          )}
        </div>

        {/* Expiration */}
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
            Thời hạn
          </label>
          <select
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surfaceAlt,
              color: tokens.color.text,
              fontSize: 14,
              minHeight: '44px',
              cursor: 'pointer',
            }}
          >
            {EXPIRATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Show current expiration info */}
          {apiKey.expiresAt && expiration === 'custom' && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: tokens.color.muted,
              }}
            >
              <i className="ri-calendar-line" style={{ marginRight: 4 }} />
              Hết hạn hiện tại:{' '}
              {new Date(apiKey.expiresAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          )}
          {expiration !== 'never' && expiration !== 'custom' && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: tokens.color.muted,
              }}
            >
              <i className="ri-calendar-line" style={{ marginRight: 4 }} />
              Key sẽ hết hạn vào:{' '}
              {(() => {
                const days = EXPIRATION_OPTIONS.find((opt) => opt.value === expiration)?.days;
                if (!days || days < 0) return '';
                const date = new Date();
                date.setDate(date.getDate() + days);
                return date.toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
              })()}
            </p>
          )}
          {expiration === 'never' && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: tokens.color.muted,
              }}
            >
              <i className="ri-infinity-line" style={{ marginRight: 4 }} />
              Key sẽ không có thời hạn
            </p>
          )}
        </div>
      </form>
    </ResponsiveModal>
  );
}
