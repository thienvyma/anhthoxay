/**
 * DropdownMenu Component
 * Dropdown menu item for sidebar navigation
 *
 * Requirements: 6.2, 6.5
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import type { RouteType } from '../../types';

interface DropdownMenuProps {
  icon: string;
  label: string;
  badge?: string;
  children: Array<{ route: RouteType; icon: string; label: string }>;
  isOpen: boolean;
  hasActiveChild: boolean;
  collapsed: boolean;
  currentRoute: RouteType;
  onToggle: () => void;
  onNavigate: (route: RouteType) => void;
}

export const DropdownMenu = memo(function DropdownMenu({
  icon,
  label,
  badge,
  children,
  isOpen,
  hasActiveChild,
  collapsed,
  currentRoute,
  onToggle,
  onNavigate,
}: DropdownMenuProps) {
  if (collapsed) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          marginBottom: 4,
          background: hasActiveChild
            ? `linear-gradient(90deg, ${tokens.color.warning}15, transparent)`
            : 'transparent',
          border: 'none',
          borderLeft: hasActiveChild
            ? `3px solid ${tokens.color.warning}`
            : '3px solid transparent',
          borderRadius: tokens.radius.md,
          color: hasActiveChild ? tokens.color.warning : tokens.color.muted,
          cursor: 'pointer',
          fontSize: 20,
          minHeight: '44px',
          position: 'relative',
        }}
        title={label}
      >
        <i className={icon} />
        {badge && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: tokens.color.warning,
            }}
          />
        )}
      </motion.button>
    );
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <motion.button
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: hasActiveChild
            ? `linear-gradient(90deg, ${tokens.color.warning}15, transparent)`
            : 'transparent',
          border: 'none',
          borderLeft: hasActiveChild
            ? `3px solid ${tokens.color.warning}`
            : '3px solid transparent',
          borderRadius: tokens.radius.md,
          color: hasActiveChild ? tokens.color.warning : tokens.color.muted,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: hasActiveChild ? 600 : 400,
          transition: 'all 0.2s',
          minHeight: '44px',
        }}
      >
        <i className={icon} style={{ fontSize: 20 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        {badge && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: tokens.radius.sm,
              background: `${tokens.color.warning}20`,
              color: tokens.color.warning,
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {badge}
          </span>
        )}
        <motion.i
          className="ri-arrow-down-s-line"
          animate={{ rotate: isOpen ? 180 : 0 }}
          style={{ fontSize: 18 }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', paddingLeft: 16 }}
          >
            {children.map((child) => {
              const isActive = currentRoute === child.route;
              return (
                <motion.button
                  key={child.route}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate(child.route)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    marginTop: 4,
                    background: isActive ? `${tokens.color.primary}10` : 'transparent',
                    border: 'none',
                    borderRadius: tokens.radius.sm,
                    color: isActive ? tokens.color.primary : tokens.color.muted,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 400,
                    transition: 'all 0.2s',
                    minHeight: '40px',
                  }}
                >
                  <i className={child.icon} style={{ fontSize: 16 }} />
                  <span>{child.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
