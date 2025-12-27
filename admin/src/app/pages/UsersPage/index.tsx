/**
 * UsersPage - User Management
 * Responsive user management with table/card view
 *
 * Requirements: 2.1, 2.7
 */

import { useState, useEffect, useCallback } from 'react';
import { tokens } from '@app/shared';
import { usersApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useResponsive } from '../../../hooks/useResponsive';
import { ResponsiveStack } from '../../../components/responsive';
import { UserTable, CreateUserModal, EditUserModal, SessionsModal } from './components';
import type { UserAccount, UserSession, UserFormData, UserRole } from './types';

const DEFAULT_FORM_DATA: UserFormData = {
  email: '',
  password: '',
  name: '',
  role: 'USER',
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
  const [formData, setFormData] = useState<UserFormData>(DEFAULT_FORM_DATA);
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
      setFormData(DEFAULT_FORM_DATA);
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
      role: user.role as UserRole,
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowSessionsModal(false);
    setSelectedUser(null);
    setFormData(DEFAULT_FORM_DATA);
  };

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
      <UserTable
        users={users}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onBan={handleBan}
        onViewSessions={handleViewSessions}
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
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={closeModals}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreate}
        saving={saving}
        isMobile={isMobile}
      />

      {/* Edit Modal */}
      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        onClose={closeModals}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdate}
        saving={saving}
        isMobile={isMobile}
      />

      {/* Sessions Modal */}
      <SessionsModal
        isOpen={showSessionsModal}
        user={selectedUser}
        sessions={sessions}
        onClose={closeModals}
        onRevokeSession={handleRevokeSession}
        isMobile={isMobile}
      />
    </div>
  );
}
