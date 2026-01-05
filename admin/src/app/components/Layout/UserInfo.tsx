/**
 * UserInfo Component
 * User information section in sidebar
 *
 * Requirements: 6.1, 6.5
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';

interface UserInfoProps {
  userEmail?: string;
  collapsed: boolean;
  isMobile: boolean;
  onLogout: () => void;
}

export const UserInfo = memo(function UserInfo({
  userEmail,
  collapsed,
  isMobile,
  onLogout,
}: UserInfoProps) {
  if (collapsed) return null;

  return (
    <div
      style={{
        padding: isMobile ? '12px' : '16px',
        borderTop: `1px solid ${tokens.color.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          minWidth: 36,
          borderRadius: '50%',
          background: tokens.color.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: '#111',
          fontWeight: 600,
        }}
      >
        {userEmail?.charAt(0).toUpperCase() || 'A'}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <div
          style={{
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {userEmail || 'Admin'}
        </div>
        <div style={{ color: tokens.color.muted, fontSize: 12 }}>Administrator</div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onLogout}
        style={{
          background: 'transparent',
          border: 'none',
          color: tokens.color.error,
          cursor: 'pointer',
          fontSize: 18,
          minWidth: '44px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Logout"
      >
        <i className="ri-logout-circle-line" />
      </motion.button>
    </div>
  );
});
