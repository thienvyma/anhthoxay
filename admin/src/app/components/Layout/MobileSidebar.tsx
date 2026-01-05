/**
 * MobileSidebar Component
 * Mobile slide-out menu
 *
 * Requirements: 6.1, 6.5
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import type { RouteType } from '../../types';
import type { MenuItem as MenuItemType, ComingSoonItem } from './types';
import { MOBILE_SIDEBAR_WIDTH } from './constants';
import { MenuItem } from './MenuItem';
import { DropdownMenu } from './DropdownMenu';
import { UserInfo } from './UserInfo';
import { ComingSoonSection } from './ComingSoonSection';

interface MobileSidebarProps {
  isOpen: boolean;
  currentRoute: RouteType;
  menuItems: MenuItemType[];
  comingSoonItems: ComingSoonItem[];
  openDropdown: string | null;
  userEmail?: string;
  onClose: () => void;
  onNavigate: (route: RouteType) => void;
  onToggleDropdown: (label: string) => void;
  onLogout: () => void;
}

export const MobileSidebar = memo(function MobileSidebar({
  isOpen,
  currentRoute,
  menuItems,
  comingSoonItems,
  openDropdown,
  userEmail,
  onClose,
  onNavigate,
  onToggleDropdown,
  onLogout,
}: MobileSidebarProps) {
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
          collapsed={false}
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
        collapsed={false}
        onNavigate={onNavigate}
      />
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: tokens.color.overlay,
              zIndex: tokens.zIndex.overlay,
            }}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -MOBILE_SIDEBAR_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: -MOBILE_SIDEBAR_WIDTH }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: MOBILE_SIDEBAR_WIDTH,
              background: tokens.color.surface,
              borderRight: `1px solid ${tokens.color.border}`,
              zIndex: tokens.zIndex.modal,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Mobile Header */}
            <div
              style={{
                padding: '16px',
                borderBottom: `1px solid ${tokens.color.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tokens.color.muted,
                  cursor: 'pointer',
                  fontSize: 24,
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="ri-close-line" />
              </motion.button>
            </div>

            {/* Mobile Menu Items */}
            <nav
              style={{
                flex: 1,
                padding: '12px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div>{menuItems.map(renderMenuItem)}</div>
              <ComingSoonSection
                items={comingSoonItems}
                currentRoute={currentRoute}
                collapsed={false}
                onNavigate={onNavigate}
              />
            </nav>

            {/* Mobile User Info */}
            <UserInfo userEmail={userEmail} collapsed={false} isMobile={true} onLogout={onLogout} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
