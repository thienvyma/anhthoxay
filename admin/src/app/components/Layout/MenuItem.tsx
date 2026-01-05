/**
 * MenuItem Component
 * Single menu item for sidebar navigation
 *
 * Requirements: 6.2, 6.5
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import type { RouteType } from '../../types';

interface MenuItemProps {
  route: RouteType;
  icon: string;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onNavigate: (route: RouteType) => void;
}

export const MenuItem = memo(function MenuItem({
  route,
  icon,
  label,
  isActive,
  collapsed,
  onNavigate,
}: MenuItemProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onNavigate(route)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '12px' : '12px 16px',
        marginBottom: 4,
        background: isActive
          ? `linear-gradient(90deg, ${tokens.color.primary}15, transparent)`
          : 'transparent',
        border: 'none',
        borderLeft: isActive
          ? `3px solid ${tokens.color.primary}`
          : '3px solid transparent',
        borderRadius: tokens.radius.md,
        color: isActive ? tokens.color.primary : tokens.color.muted,
        cursor: 'pointer',
        fontSize: 15,
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.2s',
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: '44px',
      }}
      title={collapsed ? label : undefined}
    >
      <i className={icon} style={{ fontSize: 20 }} />
      {!collapsed && <span>{label}</span>}
    </motion.button>
  );
});
