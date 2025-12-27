/**
 * SelectionCard Component
 * Requirements: 7.1 - Reusable selection card for various selection steps
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
export interface SelectionCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  imageUrl?: string | null;
  isSelected?: boolean;
  onClick: () => void;
}

export const SelectionCard = memo(function SelectionCard({
  title,
  subtitle,
  icon,
  imageUrl,
  isSelected,
  onClick,
}: SelectionCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        padding: '1rem 1.25rem',
        borderRadius: tokens.radius.md,
        background: isSelected ? `${tokens.color.primary}15` : tokens.color.surface,
        border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'all 0.2s ease',
      }}
    >
      {imageUrl ? (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: tokens.radius.sm,
            background: `url(${resolveMediaUrl(imageUrl)}) center/cover`,
            flexShrink: 0,
          }}
        />
      ) : icon ? (
        <i className={icon} style={{ fontSize: '1.5rem', color: tokens.color.primary }} />
      ) : (
        <i className="ri-building-line" style={{ fontSize: '1.5rem', color: tokens.color.primary }} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: tokens.color.text }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.8rem', color: tokens.color.muted }}>{subtitle}</div>
        )}
      </div>
      {isSelected && (
        <i className="ri-check-circle-fill" style={{ fontSize: '1.25rem', color: tokens.color.primary }} />
      )}
    </motion.div>
  );
});
