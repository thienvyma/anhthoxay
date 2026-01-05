/**
 * Header Component
 * Top header bar with page title and actions
 *
 * Requirements: 6.1, 6.5
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import type { RouteType } from '../../types';
import type { MenuItem } from './types';

interface HeaderProps {
  currentRoute: RouteType;
  currentPageSlug?: string;
  menuItems: MenuItem[];
  isMobile: boolean;
  isTablet: boolean;
  onOpenMobileMenu: () => void;
}

export const Header = memo(function Header({
  currentRoute,
  currentPageSlug,
  menuItems,
  isMobile,
  isTablet,
  onOpenMobileMenu,
}: HeaderProps) {
  // Find label from menu items (including dropdown children)
  const getPageTitle = () => {
    for (const item of menuItems) {
      if (item.type === 'item' && item.route === currentRoute) {
        return item.label;
      }
      if (item.type === 'dropdown') {
        const child = item.children.find((c) => c.route === currentRoute);
        if (child) return child.label;
      }
    }
    return 'Dashboard';
  };

  return (
    <header
      style={{
        background: tokens.color.surface,
        borderBottom: `1px solid ${tokens.color.border}`,
        padding: isMobile ? '12px 16px' : '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: tokens.zIndex.sticky,
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 12 : 16,
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Mobile Menu Button */}
        {isMobile && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onOpenMobileMenu}
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.color.text,
              cursor: 'pointer',
              fontSize: 24,
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="ri-menu-line" />
          </motion.button>
        )}

        <h1
          style={{
            color: tokens.color.text,
            fontSize: isMobile ? 18 : isTablet ? 20 : 24,
            fontWeight: 600,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {getPageTitle()}
          {currentRoute === 'sections' && currentPageSlug && !isMobile && (
            <span
              style={{
                color: tokens.color.muted,
                fontSize: 16,
                fontWeight: 400,
                marginLeft: 8,
              }}
            >
              / {currentPageSlug}
            </span>
          )}
        </h1>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 8 : 12,
          flexShrink: 0,
        }}
      >
        {/* View Site Button */}
        <motion.a
          href="http://localhost:4200"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: isMobile ? '8px 12px' : '8px 16px',
            background: tokens.color.surfaceHover,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            color: tokens.color.text,
            textDecoration: 'none',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: '44px',
          }}
        >
          <i className="ri-external-link-line" />
          {!isMobile && <span>View Site</span>}
        </motion.a>
      </div>
    </header>
  );
});
