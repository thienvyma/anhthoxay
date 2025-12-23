/**
 * ResponsivePageContainer Component for Portal
 * Wrapper component that prevents horizontal scroll and provides consistent page layout
 *
 * Requirements: 2.3 - Single-column layout on mobile
 */

import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

export interface ResponsivePageContainerProps {
  children: React.ReactNode;
  /** Maximum width on desktop (default: 1400px) */
  maxWidth?: number;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Disable max-width constraint */
  fullWidth?: boolean;
}

/**
 * ResponsivePageContainer - Prevents horizontal scroll and provides consistent page layout
 *
 * @example
 * <ResponsivePageContainer>
 *   <PageHeader />
 *   <PageContent />
 * </ResponsivePageContainer>
 */
export function ResponsivePageContainer({
  children,
  maxWidth = 1400,
  className = '',
  style = {},
  fullWidth = false,
}: ResponsivePageContainerProps) {
  const { isMobile } = useResponsive();

  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: fullWidth ? '100%' : maxWidth,
    margin: '0 auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    // No horizontal padding on mobile - Layout already handles it
    ...style,
  };

  return (
    <div
      className={className}
      style={containerStyle}
      data-responsive-container
      data-mobile={isMobile}
    >
      {children}
    </div>
  );
}

export default ResponsivePageContainer;
