/**
 * ResponsivePageHeader Component
 * Consistent page header with title, subtitle, and actions
 *
 * Requirements: 12.1, 12.5
 */

import React from 'react';
import { tokens } from '@app/shared';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveStack } from './ResponsiveStack';

export interface ResponsivePageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Icon class (Remix Icon) */
  icon?: string;
  /** Action buttons/elements */
  actions?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * ResponsivePageHeader - Consistent page header layout
 *
 * @example
 * <ResponsivePageHeader
 *   title="Page Sections"
 *   subtitle="Drag to reorder"
 *   icon="ri-layout-grid-line"
 *   actions={<Button>Add Section</Button>}
 * />
 */
export function ResponsivePageHeader({
  title,
  subtitle,
  icon,
  actions,
  className = '',
  style = {},
}: ResponsivePageHeaderProps) {
  const { isMobile, isTablet } = useResponsive();

  return (
    <ResponsiveStack
      direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
      align={isMobile ? 'stretch' : 'center'}
      justify="between"
      gap={{ mobile: 12, tablet: 16, desktop: 20 }}
      className={className}
      style={{ marginBottom: isMobile ? 16 : 24, ...style }}
    >
      {/* Title Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {icon && (
          <div
            style={{
              width: isMobile ? 36 : 40,
              height: isMobile ? 36 : 40,
              borderRadius: tokens.radius.md,
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? 18 : 20,
              color: '#111',
              flexShrink: 0,
            }}
          >
            <i className={icon} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              fontSize: isMobile ? 18 : isTablet ? 20 : 24,
              fontWeight: 700,
              color: tokens.color.text,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                color: tokens.color.muted,
                fontSize: isMobile ? 12 : 14,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {actions && (
        <div
          style={{
            display: 'flex',
            gap: isMobile ? 8 : 12,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
    </ResponsiveStack>
  );
}

export default ResponsivePageHeader;
