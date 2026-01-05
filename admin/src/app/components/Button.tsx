import React, { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../theme';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  iconRight?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  type = 'button',
  className,
}: ButtonProps) {
  const variants = {
    primary: {
      background: tokens.color.primary,
      color: '#111',
      border: 'none',
    },
    secondary: {
      background: tokens.color.surfaceHover,
      color: tokens.color.text,
      border: `1px solid ${tokens.color.border}`,
    },
    danger: {
      background: tokens.color.error,
      color: '#fff',
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      color: tokens.color.text,
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: tokens.color.text,
      border: `1px solid ${tokens.color.border}`,
    },
  };

  const sizes = {
    small: { padding: '6px 12px', fontSize: 13 },
    medium: { padding: '10px 18px', fontSize: 14 },
    large: { padding: '12px 24px', fontSize: 15 },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <motion.button
      type={type}
      whileHover={!disabled && !loading ? { opacity: 0.9 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && !loading && onClick) {
          onClick(e);
        }
      }}
      disabled={disabled || loading}
      className={className}
      style={{
        ...variantStyle,
        ...sizeStyle,
        borderRadius: tokens.radius.md,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: disabled || loading ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'opacity 0.15s ease, background 0.15s ease',
        ...style,
      }}
    >
      {loading && (
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {!loading && icon && <i className={icon} />}
      {children}
      {!loading && iconRight && <i className={iconRight} />}
    </motion.button>
  );
}

