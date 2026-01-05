/**
 * ProductCard - Reusable product card component for grid display
 * Used in: FurnitureCatalogTab, MaterialsTab
 */

import { motion } from 'framer-motion';
import { resolveMediaUrl } from '@app/shared';
import { tokens } from '../../theme';

export interface ProductCardProps {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  unit?: string | null;
  category?: string | null;
  isActive?: boolean;
  badge?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProductCard({
  name,
  description,
  imageUrl,
  price,
  unit,
  category,
  isActive = true,
  badge,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' đ';
  const resolvedImage = imageUrl ? resolveMediaUrl(imageUrl) : null;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: tokens.shadow.md }}
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={onEdit}
    >
      {/* Image Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '75%', // 4:3 aspect ratio
          background: tokens.color.background,
          overflow: 'hidden',
        }}
      >
        {resolvedImage ? (
          <img
            src={resolvedImage}
            alt={name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.color.background,
            }}
          >
            <i className="ri-image-line" style={{ fontSize: 48, color: tokens.color.muted, opacity: 0.5 }} />
          </div>
        )}

        {/* Status Badge */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '4px 10px',
            borderRadius: tokens.radius.sm,
            background: isActive ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {isActive ? 'Hoạt động' : 'Ẩn'}
        </div>

        {/* Category Badge */}
        {category && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '4px 10px',
              borderRadius: tokens.radius.sm,
              background: tokens.color.overlay,
              color: '#fff',
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {category}
          </div>
        )}

        {/* Custom Badge */}
        {badge && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              padding: '4px 10px',
              borderRadius: tokens.radius.sm,
              background: `${tokens.color.primary}`,
              color: '#111',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {badge}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Title */}
        <h3
          style={{
            margin: 0,
            color: tokens.color.text,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p
            style={{
              margin: '6px 0 0',
              color: tokens.color.muted,
              fontSize: 12,
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </p>
        )}

        {/* Price */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              color: tokens.color.primary,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {formatPrice(price)}
          </span>
          {unit && (
            <span style={{ color: tokens.color.muted, fontSize: 12 }}>
              /{unit}
            </span>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            gap: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: tokens.color.surfaceHover,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              color: tokens.color.primary,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <i className="ri-edit-line" style={{ fontSize: 14 }} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            style={{
              padding: '8px 12px',
              background: tokens.color.errorBg,
              border: `1px solid ${tokens.color.error}40`,
              borderRadius: tokens.radius.sm,
              color: tokens.color.error,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Grid container for product cards
export function ProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}
