/**
 * ResponsiveModal Component
 * Modal that becomes full-screen on mobile
 *
 * Requirements: 4.1, 4.4, 12.4
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../../hooks/useResponsive';
import { tokens } from '../../app/../theme';

export interface ResponsiveModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Callback when modal should close */
  onClose: () => void;

  /** Modal title */
  title: string;

  /** Modal content */
  children: React.ReactNode;

  /** Footer content (buttons, etc.) */
  footer?: React.ReactNode;

  /** Modal size on desktop */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /** Full screen on mobile (default: true) */
  fullScreenMobile?: boolean;

  /** Show close button */
  showCloseButton?: boolean;

  /** Close on overlay click */
  closeOnOverlayClick?: boolean;

  /** Close on Escape key */
  closeOnEscape?: boolean;

  /** Additional CSS class for modal content */
  className?: string;

  /** Test ID for testing */
  testId?: string;
}

/**
 * Modal size widths (desktop)
 */
const SIZE_MAP: Record<string, string> = {
  sm: '400px',
  md: '500px',
  lg: '700px',
  xl: '900px',
  full: '95vw',
};

/**
 * Animation variants
 */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

const mobileModalVariants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0 },
};

/**
 * ResponsiveModal - A modal component that adapts to screen size
 *
 * @example
 * // Basic usage
 * <ResponsiveModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Edit User"
 * >
 *   <form>...</form>
 * </ResponsiveModal>
 *
 * @example
 * // With footer
 * <ResponsiveModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Confirm Delete"
 *   footer={
 *     <>
 *       <Button onClick={handleClose}>Cancel</Button>
 *       <Button onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   <p>Are you sure?</p>
 * </ResponsiveModal>
 */
export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  fullScreenMobile = true,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  testId,
}: ResponsiveModalProps) {
  const { isMobile, breakpoint } = useResponsive();

  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Add/remove event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  // Determine if should be full screen
  const isFullScreen = isMobile && fullScreenMobile;

  // Modal styles
  const modalStyle: React.CSSProperties = useMemo(() => {
    if (isFullScreen) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
      };
    }

    return {
      position: 'relative',
      width: SIZE_MAP[size] || SIZE_MAP.md,
      maxWidth: '95vw',
      maxHeight: '90vh',
      borderRadius: tokens.radius.lg,
      display: 'flex',
      flexDirection: 'column',
    };
  }, [isFullScreen, size]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={{ duration: tokens.motion.duration.fast }}
          onClick={handleOverlayClick}
          data-testid={testId ? `${testId}-overlay` : undefined}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: isFullScreen ? 'stretch' : 'center',
            justifyContent: 'center',
            zIndex: tokens.zIndex.modal,
            padding: isFullScreen ? 0 : tokens.space.md,
          }}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={isFullScreen ? mobileModalVariants : modalVariants}
            transition={{
              duration: tokens.motion.duration.normal,
              ease: tokens.motion.ease.outExpo,
            }}
            data-testid={testId}
            data-breakpoint={breakpoint}
            data-fullscreen={isFullScreen}
            className={className}
            style={{
              ...modalStyle,
              backgroundColor: tokens.color.surface,
              boxShadow: tokens.shadow.lg,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? tokens.space.md : tokens.space.lg,
                borderBottom: `1px solid ${tokens.color.border}`,
                flexShrink: 0,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: isMobile
                    ? tokens.font.size.lg
                    : tokens.font.size.xl,
                  fontWeight: tokens.font.weight.semibold,
                  color: tokens.color.text,
                }}
              >
                {title}
              </h2>

              {showCloseButton && (
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    minWidth: '44px',
                    minHeight: '44px',
                    padding: 0,
                    border: 'none',
                    borderRadius: tokens.radius.sm,
                    backgroundColor: 'transparent',
                    color: tokens.color.textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      tokens.color.surfaceHover;
                    e.currentTarget.style.color = tokens.color.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = tokens.color.textMuted;
                  }}
                >
                  <i className="ri-close-line" style={{ fontSize: '20px' }} />
                </button>
              )}
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: isMobile ? tokens.space.md : tokens.space.lg,
              }}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: tokens.space.sm,
                  padding: isMobile ? tokens.space.md : tokens.space.lg,
                  borderTop: `1px solid ${tokens.color.border}`,
                  flexShrink: 0,
                  flexDirection: isMobile ? 'column' : 'row',
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ResponsiveModal;
