/**
 * Skip Link Component
 * 
 * Provides a skip link for keyboard users to bypass navigation.
 * Requirements: 26.1 - Support full keyboard navigation
 * 
 * **Feature: bidding-phase6-portal**
 */

import { useCallback } from 'react';

interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId: string;
  /** Link text */
  children?: React.ReactNode;
}

/**
 * Skip link that becomes visible on focus
 * Allows keyboard users to skip directly to main content
 */
export function SkipLink({ targetId, children = 'Bỏ qua đến nội dung chính' }: SkipLinkProps) {
  const handleClick = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [targetId]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleClick(event);
      }
    },
    [handleClick]
  );

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-100%',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        background: 'var(--primary)',
        color: 'var(--bg-primary)',
        fontWeight: 600,
        fontSize: 14,
        borderRadius: '0 0 8px 8px',
        textDecoration: 'none',
        zIndex: 9999,
        transition: 'top 0.2s ease',
      }}
    >
      {children}
    </a>
  );
}

export default SkipLink;
