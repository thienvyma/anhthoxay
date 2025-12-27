/**
 * UserTable Component
 * Displays users in a responsive table/card view
 * Requirements: 2.2
 */

import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import {
  ResponsiveTable,
  TableColumn,
} from '../../../../components/responsive';
import type { UserAccount, UserTableProps, UserRole } from '../types';
import { ROLE_COLORS, ROLE_LABELS } from '../types';

export function UserTable({
  users,
  loading,
  onEdit,
  onDelete,
  onBan,
  onViewSessions,
}: UserTableProps) {
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
              background: `linear-gradient(135deg, ${ROLE_COLORS[user.role as UserRole]}, ${ROLE_COLORS[user.role as UserRole]}80)`,
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
            background: `${ROLE_COLORS[user.role as UserRole]}20`,
            color: ROLE_COLORS[user.role as UserRole],
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {ROLE_LABELS[user.role as UserRole]}
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
            onViewSessions(user);
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

  // Actions renderer - Inline buttons for PC, optimized layout
  const renderActions = (user: UserAccount) => (
    <div
      style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      <motion.button
        whileHover={{ scale: 1.05, background: 'rgba(245, 211, 147, 0.1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(user);
        }}
        title="Chỉnh sửa"
        style={{
          padding: '6px 8px',
          background: 'transparent',
          border: 'none',
          borderRadius: tokens.radius.sm,
          color: tokens.color.primary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        <i className="ri-edit-line" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05, background: 'rgba(245, 158, 11, 0.1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onBan(user);
        }}
        title="Thu hồi tất cả sessions"
        style={{
          padding: '6px 8px',
          background: 'transparent',
          border: 'none',
          borderRadius: tokens.radius.sm,
          color: tokens.color.warning,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        <i className="ri-logout-circle-line" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(user);
        }}
        title="Xóa tài khoản"
        style={{
          padding: '6px 8px',
          background: 'transparent',
          border: 'none',
          borderRadius: tokens.radius.sm,
          color: tokens.color.error,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        <i className="ri-delete-bin-line" />
      </motion.button>
    </div>
  );

  return (
    <ResponsiveTable
      data={users}
      columns={columns}
      actions={renderActions}
      loading={loading}
      emptyMessage="Không tìm thấy tài khoản nào"
      getRowKey={(user) => user.id}
      onRowClick={onEdit}
    />
  );
}
