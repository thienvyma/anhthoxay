/**
 * EditUserModal Component
 * Modal for editing existing user accounts
 * Requirements: 2.4
 */

import { useState } from 'react';
import { tokens } from '../../../../theme';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import type { EditUserModalProps, UserRole } from '../types';

export function EditUserModal({
  isOpen,
  user,
  onClose,
  formData,
  setFormData,
  onSubmit,
  saving,
  isMobile,
}: EditUserModalProps) {
  const [showPasswordField, setShowPasswordField] = useState(false);

  const handleClose = () => {
    setShowPasswordField(false);
    onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen && !!user}
      onClose={handleClose}
      title="Chỉnh sửa tài khoản"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Hủy
          </Button>
          <Button
            onClick={() => {
              const form = document.getElementById('edit-form') as HTMLFormElement;
              form?.requestSubmit();
            }}
            disabled={saving}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </>
      }
    >
      <form
        id="edit-form"
        onSubmit={onSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div
          style={{
            padding: 12,
            background: tokens.color.surfaceAlt,
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
            Email
          </div>
          <div style={{ color: tokens.color.text, fontWeight: 500 }}>
            {user?.email}
          </div>
        </div>
        <Input
          label="Họ tên"
          value={formData.name}
          onChange={(v) => setFormData({ ...formData, name: v })}
          required
          fullWidth
        />
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: 6,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Vai trò
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as UserRole })
            }
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 14,
              minHeight: '44px',
            }}
          >
            <option value="USER">Người dùng</option>
            <option value="HOMEOWNER">Chủ nhà</option>
            <option value="CONTRACTOR">Nhà thầu</option>
            <option value="WORKER">Thợ</option>
            <option value="MANAGER">Quản lý</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Password change section */}
        <div
          style={{
            borderTop: `1px solid ${tokens.color.border}`,
            paddingTop: 16,
            marginTop: 8,
          }}
        >
          {!showPasswordField ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPasswordField(true)}
              style={{ width: '100%' }}
            >
              <i className="ri-lock-password-line" style={{ marginRight: 8 }} />
              Đổi mật khẩu
            </Button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                label="Mật khẩu mới"
                type="password"
                autoComplete="new-password"
                value={formData.password || ''}
                onChange={(v) => setFormData({ ...formData, password: v })}
                placeholder="Để trống nếu không đổi"
                fullWidth
              />
              <p style={{ color: tokens.color.muted, fontSize: 12, margin: 0 }}>
                <i className="ri-information-line" style={{ marginRight: 4 }} />
                Mật khẩu phải có ít nhất 8 ký tự. Để trống nếu không muốn đổi.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowPasswordField(false);
                  setFormData({ ...formData, password: '' });
                }}
                style={{ alignSelf: 'flex-start' }}
              >
                Hủy đổi mật khẩu
              </Button>
            </div>
          )}
        </div>
      </form>
    </ResponsiveModal>
  );
}
