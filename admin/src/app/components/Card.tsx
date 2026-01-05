import { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../theme';
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
            y: -2,
            borderColor: tokens.color.borderHover,
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
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: isMobile ? tokens.radius.md : tokens.radius.lg,
        padding: isMobile ? 16 : 24,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s ease',
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
            marginBottom: isMobile ? 12 : 16,
            paddingBottom: isMobile ? 12 : 16,
            borderBottom: `1px solid ${tokens.color.border}`,
            gap: isMobile ? 12 : 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 10 : 12,
              minWidth: 0,
              flex: 1,
            }}
          >
            {icon && (
              <div
                style={{
                  width: isMobile ? 36 : 40,
                  height: isMobile ? 36 : 40,
                  borderRadius: tokens.radius.md,
                  background: `${tokens.color.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? 18 : 20,
                  color: tokens.color.primary,
                  flexShrink: 0,
                }}
              >
                <i className={icon} />
              </div>
            )}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              {title && (
                <h3
                  style={{
                    color: tokens.color.text,
                    fontSize: isMobile ? 15 : 17,
                    fontWeight: 600,
                    margin: 0,
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
                    fontSize: isMobile ? 12 : 13,
                    margin: '2px 0 0',
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

