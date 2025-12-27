/**
 * CreateUserModal Component
 * Modal for creating new user accounts
 * Requirements: 2.3
 */

import { tokens } from '@app/shared';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import type { CreateUserModalProps, UserRole } from '../types';

export function CreateUserModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  saving,
  isMobile,
}: CreateUserModalProps) {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo tài khoản mới"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Hủy
          </Button>
          <Button
            onClick={() => {
              const form = document.getElementById('create-form') as HTMLFormElement;
              form?.requestSubmit();
            }}
            disabled={saving}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
          </Button>
        </>
      }
    >
      <form
        id="create-form"
        onSubmit={onSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(v) => setFormData({ ...formData, email: v })}
          required
          fullWidth
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={formData.password}
          onChange={(v) => setFormData({ ...formData, password: v })}
          required
          fullWidth
        />
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
            <option value="WORKER">Thợ</option>
            <option value="MANAGER">Quản lý</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </form>
    </ResponsiveModal>
  );
}
