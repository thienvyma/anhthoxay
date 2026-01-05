/**
 * ComingSoonSection Component
 * Coming soon items section in sidebar
 *
 * Requirements: 6.1, 6.5
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import type { RouteType } from '../../types';
import type { ComingSoonItem } from './types';

interface ComingSoonSectionProps {
  items: ComingSoonItem[];
  currentRoute: RouteType;
  collapsed: boolean;
  onNavigate: (route: RouteType) => void;
}

export const ComingSoonSection = memo(function ComingSoonSection({
  items,
  currentRoute,
  collapsed,
  onNavigate,
}: ComingSoonSectionProps) {
  if (collapsed) {
    return (
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: `1px solid ${tokens.color.border}`,
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            background: 'transparent',
            borderRadius: tokens.radius.md,
            color: tokens.color.muted,
            fontSize: 20,
            minHeight: '44px',
            position: 'relative',
            opacity: 0.6,
          }}
          title="Coming Soon"
        >
          <i className="ri-rocket-line" />
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 12,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: tokens.color.warning,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 'auto',
        paddingTop: 24,
      }}
    >
      {/* Separator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1, height: 1, background: tokens.color.border }} />
        <span
          style={{
            padding: '4px 10px',
            borderRadius: tokens.radius.pill,
            background: `${tokens.color.warning}15`,
            color: tokens.color.warning,
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
          }}
        >
          <i className="ri-rocket-line" style={{ marginRight: 4 }} />
          Coming Soon
        </span>
        <div style={{ flex: 1, height: 1, background: tokens.color.border }} />
      </div>

      {/* Coming Soon Items */}
      {items.map((item) => {
        const isActive = currentRoute === item.route;
        return (
          <motion.button
            key={item.route}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(item.route)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              marginBottom: 4,
              background: isActive
                ? `linear-gradient(90deg, ${tokens.color.warning}10, transparent)`
                : 'transparent',
              border: 'none',
              borderLeft: isActive
                ? `3px solid ${tokens.color.warning}`
                : '3px solid transparent',
              borderRadius: tokens.radius.md,
              color: isActive ? tokens.color.warning : tokens.color.muted,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s',
              justifyContent: 'flex-start',
              minHeight: '40px',
              opacity: 0.7,
              position: 'relative',
            }}
            title={item.label}
          >
            <i className={item.icon} style={{ fontSize: 18 }} />
            <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
            <span
              style={{
                padding: '2px 6px',
                borderRadius: tokens.radius.sm,
                background: `${tokens.color.warning}15`,
                color: tokens.color.warning,
                fontSize: 9,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Soon
            </span>
          </motion.button>
        );
      })}
    </div>
  );
});
