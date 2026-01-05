// StatsCard Component - ANH THỢ XÂY Admin Dashboard
// Individual stats card with icon, label, value, and optional pending badge
//
// **Feature: admin-dashboard-enhancement**
// **Requirements: 1.1, 1.3, 1.4**

import { motion } from 'framer-motion';
import { tokens } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';

export interface StatsCardProps {
  /** Remix icon class name (e.g., 'ri-contacts-book-line') */
  icon: string;
  /** Label text displayed above the value */
  label: string;
  /** Numeric value to display */
  value: number;
  /** Color for the icon background and accent */
  color: string;
  /** Optional pending count to show as warning badge */
  pendingCount?: number;
  /** Click handler for navigation */
  onClick?: () => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * StatsCard displays a single statistic with icon, label, value, and optional pending badge.
 * Includes hover animation with Framer Motion.
 *
 * **Feature: admin-dashboard-enhancement**
 * **Requirements: 1.1, 1.3, 1.4**
 */
export function StatsCard({
  icon,
  label,
  value,
  color,
  pendingCount,
  onClick,
  loading = false,
}: StatsCardProps) {
  const hasPending = pendingCount !== undefined && pendingCount > 0;
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <div
        style={{
          padding: isMobile ? 12 : 20,
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                width: isMobile ? 60 : 100,
                height: 14,
                background: tokens.color.surfaceHover,
                borderRadius: tokens.radius.sm,
                marginBottom: 12,
              }}
            />
            <div
              style={{
                width: isMobile ? 40 : 60,
                height: isMobile ? 24 : 32,
                background: tokens.color.surfaceHover,
                borderRadius: tokens.radius.sm,
              }}
            />
          </div>
          <div
            style={{
              width: isMobile ? 40 : 56,
              height: isMobile ? 40 : 56,
              borderRadius: tokens.radius.md,
              background: tokens.color.surfaceAlt,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        padding: isMobile ? 12 : 20,
        background: tokens.color.surface,
        border: `1px solid ${hasPending ? `${color}60` : tokens.color.border}`,
        borderRadius: tokens.radius.lg,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'border-color 0.2s ease',
        boxShadow: tokens.shadow.sm,
      }}
    >
      {/* Pending Badge */}
      {hasPending && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            minWidth: isMobile ? 20 : 24,
            height: isMobile ? 20 : 24,
            padding: '0 6px',
            background: tokens.color.warning,
            borderRadius: tokens.radius.pill,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? 10 : 12,
            fontWeight: 700,
            color: '#111',
            boxShadow: `0 2px 8px ${tokens.color.warning}40`,
          }}
        >
          {pendingCount}
        </motion.div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              color: tokens.color.muted,
              fontSize: isMobile ? 11 : 14,
              marginBottom: isMobile ? 4 : 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
          <div
            style={{
              color: tokens.color.text,
              fontSize: isMobile ? 24 : 32,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {value.toLocaleString('vi-VN')}
          </div>
        </div>
        <div
          style={{
            width: isMobile ? 40 : 56,
            height: isMobile ? 40 : 56,
            borderRadius: tokens.radius.md,
            background: `${color}20`,
            border: `1px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? 20 : 26,
            color: color,
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          <i className={icon} />
        </div>
      </div>
    </motion.div>
  );
}
