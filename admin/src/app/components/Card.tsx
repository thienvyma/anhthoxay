import { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { useResponsive } from '../../hooks/useResponsive';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
  hoverable?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
}

export function Card({
  children,
  title,
  subtitle,
  icon,
  actions,
  hoverable = false,
  style,
  onClick,
  className,
}: CardProps) {
  const { isMobile } = useResponsive();
  const Component = hoverable || onClick ? motion.div : 'div';
  const animationProps =
    hoverable || onClick
      ? {
          whileHover: {
            y: -6,
            boxShadow: '0 16px 48px rgba(245,211,147,0.15)',
            borderColor: 'rgba(245,211,147,0.3)',
          },
          transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 20,
          },
        }
      : {};

  return (
    <Component
      {...animationProps}
      onClick={onClick}
      className={className}
      style={{
        background: 'rgba(12,12,16,0.7)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${tokens.color.border}`,
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? 16 : 28,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        maxWidth: '100%',
        ...style,
      }}
    >
      {(title || subtitle || icon || actions) && (
        <div
          style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            marginBottom: isMobile ? 12 : 20,
            paddingBottom: isMobile ? 12 : 16,
            borderBottom: `1px solid ${tokens.color.border}`,
            gap: isMobile ? 12 : 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 10 : 14,
              minWidth: 0,
              flex: 1,
            }}
          >
            {icon && (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
                style={{
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                  borderRadius: isMobile ? '12px' : '14px',
                  background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? 18 : 22,
                  color: '#0b0c0f',
                  boxShadow: '0 4px 16px rgba(245,211,147,0.3)',
                  flexShrink: 0,
                }}
              >
                <i className={icon} />
              </motion.div>
            )}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              {title && (
                <h3
                  style={{
                    color: tokens.color.text,
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 700,
                    margin: 0,
                    letterSpacing: '-0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  style={{
                    color: tokens.color.muted,
                    fontSize: isMobile ? 12 : 14,
                    margin: '4px 0 0',
                    fontWeight: 400,
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
          {actions && (
            <div style={{ flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </Component>
  );
}

