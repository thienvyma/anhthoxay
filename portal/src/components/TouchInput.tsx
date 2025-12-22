/**
 * Touch-Optimized Input Components
 * 
 * Form components optimized for touch devices with:
 * - Larger touch targets (minimum 44x44px)
 * - Mobile-friendly inputs
 * - Better spacing for touch interaction
 * 
 * Requirements: 15.3 - Optimize forms for touch input
 */

import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
  forwardRef,
} from 'react';
import { useIsTouchDevice } from '../hooks/useResponsive';

// Minimum touch target size (44x44px per WCAG guidelines)
const TOUCH_TARGET_MIN = 44;
const TOUCH_PADDING = 14;
const DESKTOP_PADDING = 12;

export interface TouchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label for the input */
  label?: string;
  /** Error message */
  error?: string;
  /** Hint text */
  hint?: string;
  /** Is field required */
  required?: boolean;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Touch-optimized text input
 */
export const TouchInput = forwardRef<HTMLInputElement, TouchInputProps>(
  (
    {
      label,
      error,
      hint,
      required,
      leftIcon,
      rightIcon,
      size = 'md',
      fullWidth = true,
      className = '',
      style,
      disabled,
      ...props
    },
    ref
  ) => {
    const isTouch = useIsTouchDevice();

    // Calculate padding based on touch device and size
    const getPadding = () => {
      const basePadding = isTouch ? TOUCH_PADDING : DESKTOP_PADDING;
      switch (size) {
        case 'sm':
          return `${basePadding - 4}px ${basePadding}px`;
        case 'lg':
          return `${basePadding + 2}px ${basePadding + 4}px`;
        default:
          return `${basePadding}px ${basePadding + 2}px`;
      }
    };

    // Calculate min height for touch targets
    const getMinHeight = () => {
      if (!isTouch) return undefined;
      switch (size) {
        case 'sm':
          return 40;
        case 'lg':
          return 52;
        default:
          return TOUCH_TARGET_MIN;
      }
    };

    // Calculate font size
    const getFontSize = () => {
      // Use 16px minimum on mobile to prevent zoom on iOS
      const mobileMin = isTouch ? 16 : 14;
      switch (size) {
        case 'sm':
          return Math.max(13, mobileMin - 2);
        case 'lg':
          return Math.max(16, mobileMin);
        default:
          return mobileMin;
      }
    };

    return (
      <div
        className={`touch-input-wrapper ${className}`}
        style={{ width: fullWidth ? '100%' : 'auto' }}
      >
        {label && (
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#e4e7ec',
            }}
          >
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
          </label>
        )}

        <div style={{ position: 'relative' }}>
          {leftIcon && (
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#71717a',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            {...props}
            style={{
              width: '100%',
              padding: getPadding(),
              paddingLeft: leftIcon ? 40 : undefined,
              paddingRight: rightIcon ? 40 : undefined,
              minHeight: getMinHeight(),
              fontSize: getFontSize(),
              background: disabled ? '#1a1a1f' : '#1a1a1f',
              border: `1px solid ${error ? '#ef4444' : '#27272a'}`,
              borderRadius: 8,
              color: disabled ? '#71717a' : '#e4e7ec',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              cursor: disabled ? 'not-allowed' : 'text',
              // Prevent zoom on iOS
              WebkitTextSizeAdjust: '100%',
              // Better touch interaction
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              ...style,
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = '#f5d393';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 211, 147, 0.1)';
              }
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = '#27272a';
                e.currentTarget.style.boxShadow = 'none';
              }
              props.onBlur?.(e);
            }}
          />

          {rightIcon && (
            <div
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#71717a',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {(error || hint) && (
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: error ? '#ef4444' : '#71717a',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {error && <i className="ri-error-warning-line" style={{ fontSize: 14 }} />}
            {error || hint}
          </div>
        )}
      </div>
    );
  }
);

TouchInput.displayName = 'TouchInput';

/**
 * Touch-optimized textarea
 */
export interface TouchTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showCount?: boolean;
  maxLength?: number;
}

export const TouchTextarea = forwardRef<HTMLTextAreaElement, TouchTextareaProps>(
  (
    {
      label,
      error,
      hint,
      required,
      fullWidth = true,
      showCount = false,
      maxLength,
      className = '',
      style,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const isTouch = useIsTouchDevice();
    const charCount = typeof value === 'string' ? value.length : 0;

    const getPadding = () => {
      const basePadding = isTouch ? TOUCH_PADDING : DESKTOP_PADDING;
      return `${basePadding}px ${basePadding + 2}px`;
    };

    const getFontSize = () => {
      return isTouch ? 16 : 14;
    };

    return (
      <div
        className={`touch-textarea-wrapper ${className}`}
        style={{ width: fullWidth ? '100%' : 'auto' }}
      >
        {label && (
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#e4e7ec',
            }}
          >
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          disabled={disabled}
          value={value}
          maxLength={maxLength}
          {...props}
          style={{
            width: '100%',
            padding: getPadding(),
            fontSize: getFontSize(),
            background: disabled ? '#1a1a1f' : '#1a1a1f',
            border: `1px solid ${error ? '#ef4444' : '#27272a'}`,
            borderRadius: 8,
            color: disabled ? '#71717a' : '#e4e7ec',
            outline: 'none',
            resize: 'vertical',
            minHeight: 100,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            cursor: disabled ? 'not-allowed' : 'text',
            WebkitTextSizeAdjust: '100%',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            ...style,
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = '#f5d393';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 211, 147, 0.1)';
            }
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = '#27272a';
              e.currentTarget.style.boxShadow = 'none';
            }
            props.onBlur?.(e);
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          {(error || hint) && (
            <span
              style={{
                fontSize: 13,
                color: error ? '#ef4444' : '#71717a',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {error && <i className="ri-error-warning-line" style={{ fontSize: 14 }} />}
              {error || hint}
            </span>
          )}
          {showCount && maxLength && (
            <span
              style={{
                fontSize: 12,
                color: charCount >= maxLength ? '#ef4444' : '#71717a',
                marginLeft: 'auto',
              }}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TouchTextarea.displayName = 'TouchTextarea';

/**
 * Touch-optimized select
 */
export interface TouchSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const TouchSelect = forwardRef<HTMLSelectElement, TouchSelectProps>(
  (
    {
      label,
      error,
      hint,
      required,
      fullWidth = true,
      options,
      placeholder,
      className = '',
      style,
      disabled,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      size: _size, // Extract size to prevent passing to native select
      ...props
    },
    ref
  ) => {
    const isTouch = useIsTouchDevice();

    const getPadding = () => {
      const basePadding = isTouch ? TOUCH_PADDING : DESKTOP_PADDING;
      return `${basePadding}px ${basePadding + 2}px`;
    };

    const getMinHeight = () => {
      if (!isTouch) return undefined;
      return TOUCH_TARGET_MIN;
    };

    const getFontSize = () => {
      return isTouch ? 16 : 14;
    };

    return (
      <div
        className={`touch-select-wrapper ${className}`}
        style={{ width: fullWidth ? '100%' : 'auto' }}
      >
        {label && (
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#e4e7ec',
            }}
          >
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
          </label>
        )}

        <div style={{ position: 'relative' }}>
          <select
            ref={ref}
            disabled={disabled}
            {...props}
            style={{
              width: '100%',
              padding: getPadding(),
              paddingRight: 40,
              minHeight: getMinHeight(),
              fontSize: getFontSize(),
              background: disabled ? '#1a1a1f' : '#1a1a1f',
              border: `1px solid ${error ? '#ef4444' : '#27272a'}`,
              borderRadius: 8,
              color: disabled ? '#71717a' : '#e4e7ec',
              outline: 'none',
              appearance: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              ...style,
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = '#f5d393';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 211, 147, 0.1)';
              }
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = '#27272a';
                e.currentTarget.style.boxShadow = 'none';
              }
              props.onBlur?.(e);
            }}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#71717a',
            }}
          >
            <i className="ri-arrow-down-s-line" style={{ fontSize: 20 }} />
          </div>
        </div>

        {(error || hint) && (
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: error ? '#ef4444' : '#71717a',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {error && <i className="ri-error-warning-line" style={{ fontSize: 14 }} />}
            {error || hint}
          </div>
        )}
      </div>
    );
  }
);

TouchSelect.displayName = 'TouchSelect';

/**
 * Touch-optimized checkbox
 */
export interface TouchCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const TouchCheckbox = forwardRef<HTMLInputElement, TouchCheckboxProps>(
  ({ label, error, className = '', style, disabled, ...props }, ref) => {
    const isTouch = useIsTouchDevice();
    const checkboxSize = isTouch ? 24 : 20;

    return (
      <div className={`touch-checkbox-wrapper ${className}`}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: disabled ? 'not-allowed' : 'pointer',
            minHeight: isTouch ? TOUCH_TARGET_MIN : 'auto',
            padding: isTouch ? '8px 0' : '4px 0',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            ...style,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: checkboxSize,
              height: checkboxSize,
              flexShrink: 0,
            }}
          >
            <input
              ref={ref}
              type="checkbox"
              disabled={disabled}
              {...props}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                cursor: disabled ? 'not-allowed' : 'pointer',
                margin: 0,
              }}
            />
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 6,
                border: `2px solid ${error ? '#ef4444' : '#27272a'}`,
                background: props.checked ? '#f5d393' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {props.checked && (
                <i
                  className="ri-check-line"
                  style={{ fontSize: checkboxSize - 6, color: '#0b0c0f' }}
                />
              )}
            </div>
          </div>
          <span
            style={{
              fontSize: 14,
              color: disabled ? '#71717a' : '#e4e7ec',
            }}
          >
            {label}
          </span>
        </label>
        {error && (
          <div
            style={{
              marginTop: 4,
              marginLeft: checkboxSize + 12,
              fontSize: 13,
              color: '#ef4444',
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }
);

TouchCheckbox.displayName = 'TouchCheckbox';

/**
 * Touch-optimized button
 */
export interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      style,
      disabled,
      ...props
    },
    ref
  ) => {
    const isTouch = useIsTouchDevice();

    const getMinHeight = () => {
      if (!isTouch) {
        switch (size) {
          case 'sm':
            return 36;
          case 'lg':
            return 48;
          default:
            return 42;
        }
      }
      switch (size) {
        case 'sm':
          return 40;
        case 'lg':
          return 52;
        default:
          return TOUCH_TARGET_MIN;
      }
    };

    const getPadding = () => {
      switch (size) {
        case 'sm':
          return '8px 16px';
        case 'lg':
          return '14px 28px';
        default:
          return '12px 24px';
      }
    };

    const getFontSize = () => {
      switch (size) {
        case 'sm':
          return 13;
        case 'lg':
          return 16;
        default:
          return 14;
      }
    };

    const getColors = () => {
      switch (variant) {
        case 'primary':
          return {
            bg: '#f5d393',
            color: '#0b0c0f',
            hoverBg: '#e5c383',
            border: 'transparent',
          };
        case 'secondary':
          return {
            bg: 'transparent',
            color: '#e4e7ec',
            hoverBg: 'rgba(255, 255, 255, 0.05)',
            border: '#27272a',
          };
        case 'ghost':
          return {
            bg: 'transparent',
            color: '#a1a1aa',
            hoverBg: 'rgba(255, 255, 255, 0.05)',
            border: 'transparent',
          };
        case 'danger':
          return {
            bg: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            hoverBg: 'rgba(239, 68, 68, 0.25)',
            border: 'rgba(239, 68, 68, 0.3)',
          };
        default:
          return {
            bg: '#f5d393',
            color: '#0b0c0f',
            hoverBg: '#e5c383',
            border: 'transparent',
          };
      }
    };

    const colors = getColors();
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`touch-button ${className}`}
        {...props}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: getMinHeight(),
          padding: getPadding(),
          fontSize: getFontSize(),
          fontWeight: 600,
          background: colors.bg,
          color: colors.color,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
          transition: 'all 0.2s',
          width: fullWidth ? '100%' : 'auto',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          userSelect: 'none',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = colors.hoverBg;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = colors.bg;
          }
        }}
      >
        {loading ? (
          <i className="ri-loader-4-line spinner" style={{ fontSize: getFontSize() + 2 }} />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

export default TouchInput;
