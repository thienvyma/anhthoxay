/**
 * ResponsiveActionBar Component
 * Horizontal action bar that wraps on mobile
 *
 * Requirements: 12.1, 12.5
 */

import React from 'react';
import { tokens } from '@app/shared';
import { useResponsive } from '../../hooks/useResponsive';

export interface ResponsiveActionBarProps {
  children: React.ReactNode;
  /** Alignment: start, center, end, between */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Show border bottom */
  bordered?: boolean;
}

/**
 * ResponsiveActionBar - Action buttons that wrap on mobile
 *
 * @example
 * <ResponsiveActionBar justify="end">
 *   <Button variant="secondary">Cancel</Button>
 *   <Button>Save</Button>
 * </ResponsiveActionBar>
 */
export function ResponsiveActionBar({
  children,
  justify = 'end',
  className = '',
  style = {},
  bordered = false,
}: ResponsiveActionBarProps) {
  const { isMobile } = useResponsive();

  const justifyMap: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isMobile ? 8 : 12,
        justifyContent: justifyMap[justify],
        alignItems: 'center',
        ...(bordered && {
          paddingTop: isMobile ? 12 : 16,
          borderTop: `1px solid ${tokens.color.border}`,
        }),
        ...style,
      }}
    >
      {/* On mobile, make buttons full width if only 1-2 children */}
      {isMobile && React.Children.count(children) <= 2 ? (
        <div
          style={{
            display: 'flex',
            gap: 8,
            width: '100%',
          }}
        >
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
                  style: { ...((child as React.ReactElement<{ style?: React.CSSProperties }>).props.style || {}), flex: 1 },
                })
              : child
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default ResponsiveActionBar;
