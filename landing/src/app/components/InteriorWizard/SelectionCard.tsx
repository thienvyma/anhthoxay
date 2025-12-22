/**
 * SelectionCard - Reusable card component for wizard selections
 */

import { tokens } from '@app/shared';
import { motion } from 'framer-motion';

interface SelectionCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  isSelected: boolean;
  onClick: () => void;
  badge?: string;
}

export function SelectionCard({
  title,
  subtitle,
  imageUrl,
  isSelected,
  onClick,
  badge,
}: SelectionCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={isSelected ? 'glass-effect-card' : 'glass-effect-subtle'}
      style={{
        border: `2px solid ${isSelected ? tokens.color.primary : 'rgba(255,255,255,0.1)'}`,
        borderRadius: tokens.radius.lg,
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            background: tokens.color.primary,
            color: tokens.color.background,
            fontSize: '0.65rem',
            fontWeight: 600,
            padding: '0.25rem 0.5rem',
            borderRadius: tokens.radius.sm,
          }}
        >
          {badge}
        </span>
      )}

      {imageUrl ? (
        <div
          style={{
            width: '100%',
            height: '100px',
            borderRadius: tokens.radius.md,
            overflow: 'hidden',
            marginBottom: '0.75rem',
            background: tokens.color.surface,
          }}
        >
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            loading="lazy"
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100px',
            borderRadius: tokens.radius.md,
            marginBottom: '0.75rem',
            background: tokens.color.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i
            className="ri-building-line"
            style={{ fontSize: '2rem', color: tokens.color.textMuted }}
          />
        </div>
      )}

      <h3
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: tokens.color.text,
          margin: 0,
          textAlign: 'center',
        }}
      >
        {title}
      </h3>

      {subtitle && (
        <p
          style={{
            fontSize: '0.75rem',
            color: tokens.color.textMuted,
            margin: '0.25rem 0 0',
            textAlign: 'center',
          }}
        >
          {subtitle}
        </p>
      )}

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            bottom: '0.5rem',
            right: '0.5rem',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: tokens.color.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="ri-check-line" style={{ color: tokens.color.background, fontSize: '14px' }} />
        </motion.div>
      )}
    </motion.div>
  );
}

export default SelectionCard;
