/**
 * CreateApiKeyModal - Create API Key Modal Component
 *
 * Form for creating new API keys with:
 * - Tên (name) - required, 3-100 chars
 * - Mô tả (description) - optional
 * - Quyền (scope) - dropdown with descriptions
 * - Nhóm API (allowedEndpoints) - checkboxes
 * - Thời hạn (expiresAt) - dropdown
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 10.1, 10.4, 10.5**
 */

import { useState } from 'react';
import { tokens } from '../../../../theme';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input, TextArea } from '../../../components/Input';
import { useResponsive } from '../../../../hooks/useResponsive';
import type { ApiKeyScope, EndpointGroup, CreateApiKeyInput } from '../../../api/api-keys';

// ============================================
// TYPES
// ============================================

export interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (rawKey: string) => void;
  onSubmit: (data: CreateApiKeyInput) => Promise<void>;
  saving?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Scope options with descriptions
 * **Validates: Requirements 10.4**
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
 * Endpoint group options - simplified for create modal
 * Detailed endpoints are shown in ApiKeyDetailPanel
 * **Validates: Requirements 10.5**
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
  { value: 'reports', label: 'Báo cáo', description: 'Xem thống kê tổng quan', icon: 'ri-bar-chart-box-line' },
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
 * **Validates: Requirements 10.1**
 */
const EXPIRATION_OPTIONS: Array<{ value: string; label: string; days: number | null }> = [
  { value: 'never', label: 'Không giới hạn', days: null },
  { value: '30', label: '30 ngày', days: 30 },
  { value: '90', label: '90 ngày', days: 90 },
  { value: '365', label: '1 năm', days: 365 },
];

// ============================================
// COMPONENT
// ============================================

/**
 * CreateApiKeyModal Component
 *
 * Modal form for creating new API keys with validation.
 *
 * **Feature: admin-guide-api-keys**
 * **Validates: Requirements 10.1, 10.4, 10.5**
 */
export function CreateApiKeyModal({
  isOpen,
  onClose,
  onSubmit,
  saving = false,
}: CreateApiKeyModalProps) {
  const { isMobile } = useResponsive();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<ApiKeyScope>('READ_ONLY');
  const [allowedEndpoints, setAllowedEndpoints] = useState<EndpointGroup[]>(['leads']);
  const [expiration, setExpiration] = useState('never');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  const handleClose = () => {
    setName('');
    setDescription('');
    setScope('READ_ONLY');
    setAllowedEndpoints(['leads']);
    setExpiration('never');
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

    if (!validate()) return;

    // Calculate expiration date
    let expiresAt: string | undefined = undefined;
    const selectedExpiration = EXPIRATION_OPTIONS.find((opt) => opt.value === expiration);
    if (selectedExpiration?.days) {
      const date = new Date();
      date.setDate(date.getDate() + selectedExpiration.days);
      expiresAt = date.toISOString();
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      scope,
      allowedEndpoints,
      expiresAt,
    });
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo API Key mới"
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
              const form = document.getElementById('create-api-key-form') as HTMLFormElement;
              form?.requestSubmit();
            }}
            disabled={saving}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {saving ? (
              <>
                <i className="ri-loader-4-line ri-spin" style={{ marginRight: 8 }} />
                Đang tạo...
              </>
            ) : (
              <>
                <i className="ri-key-2-line" style={{ marginRight: 8 }} />
                Tạo API Key
              </>
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-api-key-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
      >
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
            {ENDPOINT_GROUPS.map((group) => {
              const isSelected = allowedEndpoints.includes(group.value);
              return (
                <label
                  key={group.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    border: `1px solid ${isSelected ? tokens.color.primary : 'transparent'}`,
                    background: isSelected ? 'rgba(245, 211, 147, 0.05)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = tokens.color.surfaceAlt;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected
                      ? 'rgba(245, 211, 147, 0.05)'
                      : 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
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
                      color: isSelected ? tokens.color.primary : tokens.color.muted,
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
              );
            })}
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
          {expiration !== 'never' && (
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
                if (!days) return '';
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
        </div>
      </form>
    </ResponsiveModal>
  );
}
