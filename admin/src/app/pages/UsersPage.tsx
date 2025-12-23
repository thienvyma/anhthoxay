/**
 * UsersPage - User Management
 * Responsive user management with table/card view
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { usersApi } from '../api';
import { useToast } from '../components/Toast';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useResponsive } from '../../hooks/useResponsive';
import {
  ResponsiveStack,
  ResponsiveModal,
  ResponsiveTable,
  TableColumn,
} from '../../components/responsive';
import type { UserAccount, UserSession } from '../types';

type UserRole = 'ADMIN' | 'MANAGER' | 'WORKER' | 'USER';

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#EF4444',
  MANAGER: '#F59E0B',
  WORKER: '#3B82F6',
  USER: '#10B981',
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Quản lý',
  WORKER: 'Thợ',
  USER: 'Người dùng',
};

export function UsersPage() {
  const toast = useToast();
  const { isMobile, breakpoint } = useResponsive();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'USER' as UserRole,
  });
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await usersApi.list({
        search: search || undefined,
        role: roleFilter || undefined,
        page,
        limit: 20,
      });
      setUsers(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.create(formData);
      toast.success('Tạo tài khoản thành công!');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', name: '', role: 'USER' });
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(
        error instanceof Error ? error.message : 'Tạo tài khoản thất bại'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      await usersApi.update(selectedUser.id, {
        name: formData.name,
        role: formData.role,
      });
      toast.success('Cập nhật tài khoản thành công!');
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: UserAccount) => {
    if (
      !confirm(
        `Xóa tài khoản "${user.name}" (${user.email})?\nHành động này không thể hoàn tác!`
      )
    )
      return;
    try {
      await usersApi.delete(user.id);
      toast.success('Đã xóa tài khoản');
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error instanceof Error ? error.message : 'Xóa thất bại');
    }
  };

  const handleBan = async (user: UserAccount) => {
    if (
      !confirm(
        `Ban tài khoản "${user.name}"?\nTất cả phiên đăng nhập sẽ bị thu hồi.`
      )
    )
      return;
    try {
      const result = await usersApi.ban(user.id);
      toast.success(result.message);
      loadUsers();
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error(error instanceof Error ? error.message : 'Ban thất bại');
    }
  };

  const handleViewSessions = async (user: UserAccount) => {
    setSelectedUser(user);
    try {
      const userSessions = await usersApi.getSessions(user.id);
      setSessions(userSessions);
      setShowSessionsModal(true);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Không thể tải danh sách phiên');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!selectedUser) return;
    try {
      await usersApi.revokeSession(selectedUser.id, sessionId);
      toast.success('Đã thu hồi phiên đăng nhập');
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Thu hồi thất bại');
    }
  };

  const openEditModal = (user: UserAccount) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowSessionsModal(false);
    setSelectedUser(null);
    setFormData({ email: '', password: '', name: '', role: 'USER' });
  };

  // Table columns definition
  const columns: TableColumn<UserAccount>[] = [
    {
      key: 'name',
      header: 'Tài khoản',
      priority: 1,
      render: (_, user) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${ROLE_COLORS[user.role]}, ${ROLE_COLORS[user.role]}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: tokens.color.text,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                color: tokens.color.muted,
                fontSize: 13,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      priority: 2,
      render: (_, user) => (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: tokens.radius.sm,
            background: `${ROLE_COLORS[user.role]}20`,
            color: ROLE_COLORS[user.role],
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {ROLE_LABELS[user.role]}
        </span>
      ),
    },
    {
      key: '_count',
      header: 'Sessions',
      hideOnMobile: true,
      align: 'center',
      render: (_, user) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewSessions(user);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: user._count?.sessions
              ? tokens.color.primary
              : tokens.color.muted,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            margin: '0 auto',
            minHeight: '44px',
          }}
        >
          <i className="ri-device-line" />
          {user._count?.sessions || 0}
        </button>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      hideOnMobile: true,
      render: (value) => (
        <span style={{ color: tokens.color.muted, fontSize: 13 }}>
          {new Date(value as string).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
  ];

  // Actions renderer
  const renderActions = (user: UserAccount) => (
    <div
      style={{
        display: 'flex',
        gap: 8,
        justifyContent: isMobile ? 'flex-start' : 'flex-end',
        flexWrap: 'wrap',
      }}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          openEditModal(user);
        }}
        title="Chỉnh sửa"
        style={{
          padding: 8,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.sm,
          color: tokens.color.primary,
          cursor: 'pointer',
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="ri-edit-line" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          handleBan(user);
        }}
        title="Ban (thu hồi sessions)"
        style={{
          padding: 8,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.sm,
          color: '#F59E0B',
          cursor: 'pointer',
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="ri-forbid-line" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(user);
        }}
        title="Xóa"
        style={{
          padding: 8,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.sm,
          color: tokens.color.error,
          cursor: 'pointer',
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="ri-delete-bin-line" />
      </motion.button>
    </div>
  );

  return (
    <div data-breakpoint={breakpoint}>
      {/* Header */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        align={isMobile ? 'stretch' : 'center'}
        justify="between"
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div>
          <h2
            style={{
              color: tokens.color.text,
              fontSize: isMobile ? 20 : 24,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Quản lý tài khoản
          </h2>
          <p
            style={{
              color: tokens.color.muted,
              fontSize: 14,
              margin: '4px 0 0',
            }}
          >
            {total} tài khoản trong hệ thống
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          <i className="ri-user-add-line" style={{ marginRight: 8 }} />
          Tạo tài khoản
        </Button>
      </ResponsiveStack>

      {/* Filters */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div style={{ flex: isMobile ? 'none' : '1 1 300px', maxWidth: isMobile ? '100%' : 400 }}>
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={setSearch}
            fullWidth
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '10px 16px',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            color: tokens.color.text,
            fontSize: 14,
            minWidth: isMobile ? '100%' : 150,
            minHeight: '44px',
          }}
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Quản lý</option>
          <option value="WORKER">Thợ</option>
          <option value="USER">Người dùng</option>
        </select>
      </ResponsiveStack>

      {/* Users Table/Cards */}
      <ResponsiveTable
        data={users}
        columns={columns}
        actions={renderActions}
        loading={loading}
        emptyMessage="Không tìm thấy tài khoản nào"
        getRowKey={(user) => user.id}
        onRowClick={openEditModal}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <ResponsiveStack
          direction={{ mobile: 'row', tablet: 'row', desktop: 'row' }}
          justify="center"
          gap={8}
          style={{ marginTop: 24 }}
        >
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <i className="ri-arrow-left-line" />
          </Button>
          <span
            style={{
              padding: '8px 16px',
              color: tokens.color.text,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <i className="ri-arrow-right-line" />
          </Button>
        </ResponsiveStack>
      )}

      {/* Create Modal */}
      <ResponsiveModal
        isOpen={showCreateModal}
        onClose={closeModals}
        title="Tạo tài khoản mới"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeModals}
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
          onSubmit={handleCreate}
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

      {/* Edit Modal */}
      <ResponsiveModal
        isOpen={showEditModal && !!selectedUser}
        onClose={closeModals}
        title="Chỉnh sửa tài khoản"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeModals}
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
          onSubmit={handleUpdate}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div
            style={{
              padding: 12,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
              Email
            </div>
            <div style={{ color: tokens.color.text, fontWeight: 500 }}>
              {selectedUser?.email}
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
              <option value="WORKER">Thợ</option>
              <option value="MANAGER">Quản lý</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </form>
      </ResponsiveModal>

      {/* Sessions Modal */}
      <ResponsiveModal
        isOpen={showSessionsModal && !!selectedUser}
        onClose={closeModals}
        title="Phiên đăng nhập"
        size="lg"
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
            {selectedUser?.name} ({selectedUser?.email})
          </p>
        </div>

        {sessions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: tokens.color.muted,
              padding: 40,
            }}
          >
            <i
              className="ri-device-line"
              style={{ fontSize: 48, display: 'block', marginBottom: 12 }}
            />
            <p>Không có phiên đăng nhập nào</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  padding: isMobile ? 12 : 16,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                }}
              >
                <ResponsiveStack
                  direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
                  justify="between"
                  align={isMobile ? 'stretch' : 'center'}
                  gap={12}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: tokens.color.text,
                        fontSize: 14,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: isMobile ? 'normal' : 'nowrap',
                      }}
                    >
                      <i className="ri-device-line" style={{ marginRight: 8 }} />
                      {session.userAgent || 'Unknown device'}
                    </div>
                    <div
                      style={{
                        color: tokens.color.muted,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      IP: {session.ipAddress || 'Unknown'}
                      <br />
                      Tạo: {new Date(session.createdAt).toLocaleString('vi-VN')}
                      <br />
                      Hết hạn: {new Date(session.expiresAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRevokeSession(session.id)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: tokens.radius.sm,
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      minHeight: '44px',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    Thu hồi
                  </motion.button>
                </ResponsiveStack>
              </div>
            ))}
          </div>
        )}
      </ResponsiveModal>
    </div>
  );
}
