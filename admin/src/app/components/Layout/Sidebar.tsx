/**
 * Sidebar Component
 * Desktop sidebar with navigation
 *
 * Requirements: 6.1, 6.5
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import type { RouteType } from '../../types';
import type { MenuItem as MenuItemType, ComingSoonItem } from './types';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './constants';
import { MenuItem } from './MenuItem';
import { DropdownMenu } from './DropdownMenu';
import { UserInfo } from './UserInfo';
import { ComingSoonSection } from './ComingSoonSection';

interface SidebarProps {
  collapsed: boolean;
  currentRoute: RouteType;
  menuItems: MenuItemType[];
  comingSoonItems: ComingSoonItem[];
  openDropdown: string | null;
  userEmail?: string;
  onNavigate: (route: RouteType) => void;
  onToggleDropdown: (label: string) => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export const Sidebar = memo(function Sidebar({
  collapsed,
  currentRoute,
  menuItems,
  comingSoonItems,
  openDropdown,
  userEmail,
  onNavigate,
  onToggleDropdown,
  onToggleSidebar,
  onLogout,
}: SidebarProps) {
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  // Check if any child route is active
  const isChildActive = (children: Array<{ route: RouteType }>) => {
    return children.some((child) => currentRoute === child.route);
  };

  // Render menu item (handles both types)
  const renderMenuItem = (item: MenuItemType) => {
    if (item.type === 'dropdown') {
      return (
        <DropdownMenu
          key={item.label}
          icon={item.icon}
          label={item.label}
          badge={item.badge}
          children={item.children}
          isOpen={openDropdown === item.label}
          hasActiveChild={isChildActive(item.children)}
          collapsed={collapsed}
          currentRoute={currentRoute}
          onToggle={() => onToggleDropdown(item.label)}
          onNavigate={onNavigate}
        />
      );
    }
    return (
      <MenuItem
        key={item.route}
        route={item.route}
        icon={item.icon}
        label={item.label}
        isActive={currentRoute === item.route}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarWidth }}
      style={{
        background: tokens.color.surface,
        borderRight: `1px solid ${tokens.color.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: tokens.zIndex.sticky,
        transition: 'width 0.3s ease',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '24px 16px' : '24px',
          borderBottom: `1px solid ${tokens.color.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: tokens.radius.md,
              background: tokens.color.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#111',
            }}
          >
            <i className="ri-admin-line" />
          </div>
          {!collapsed && (
            <div>
              <div
                style={{
                  color: tokens.color.text,
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                Admin
              </div>
              <div style={{ color: tokens.color.muted, fontSize: 12 }}>Dashboard</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.color.muted,
              cursor: 'pointer',
              fontSize: 20,
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="ri-menu-fold-line" />
          </motion.button>
        )}
      </div>

      {/* Menu Items */}
      <nav
        style={{
          flex: 1,
          padding: collapsed ? '12px 8px' : '12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div>{menuItems.map(renderMenuItem)}</div>
        <ComingSoonSection
          items={comingSoonItems}
          currentRoute={currentRoute}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </nav>

      {/* Collapse Button (when collapsed) */}
      {collapsed && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleSidebar}
          style={{
            padding: '16px',
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${tokens.color.border}`,
            color: tokens.color.muted,
            cursor: 'pointer',
            fontSize: 20,
            minHeight: '44px',
          }}
        >
          <i className="ri-menu-unfold-line" />
        </motion.button>
      )}

      {/* User Info */}
      <UserInfo
        userEmail={userEmail}
        collapsed={collapsed}
        isMobile={false}
        onLogout={onLogout}
      />
    </motion.aside>
  );
});
