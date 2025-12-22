/**
 * ErrorMessage component for displaying user-friendly error messages
 * Requirements: 18.2 - Display user-friendly error message with retry button
 */

import { type ReactNode } from 'react';

export interface ErrorMessageProps {
  /** Error title */
  title?: string;
  /** Error message to display */
  message: string;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Custom retry button text */
  retryText?: string;
  /** Error type for styling */
  type?: 'error' | 'warning' | 'info';
  /** Additional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom icon */
  icon?: ReactNode;
  /** Full page error display */
  fullPage?: boolean;
}

export function ErrorMessage({
  title,
  message,
  onRetry,
  retryText = 'Thử lại',
  type = 'error',
  action,
  icon,
  fullPage = false,
}: ErrorMessageProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          iconBg: 'rgba(245, 158, 11, 0.15)',
          iconColor: '#f59e0b',
          defaultIcon: 'ri-alert-line',
        };
      case 'info':
        return {
          iconBg: 'rgba(59, 130, 246, 0.15)',
          iconColor: '#3b82f6',
          defaultIcon: 'ri-information-line',
        };
      default:
        return {
          iconBg: 'rgba(239, 68, 68, 0.15)',
          iconColor: '#ef4444',
          defaultIcon: 'ri-error-warning-line',
        };
    }
  };

  const styles = getTypeStyles();

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: fullPage ? '60px 24px' : '32px 24px',
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: styles.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        {icon || (
          <i
            className={styles.defaultIcon}
            style={{ fontSize: 28, color: styles.iconColor }}
          />
        )}
      </div>

      {/* Title */}
      {title && (
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#e4e7ec',
            marginBottom: 8,
          }}
        >
          {title}
        </h3>
      )}

      {/* Message */}
      <p
        style={{
          fontSize: 14,
          color: '#a1a1aa',
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        {message}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: '#f5d393',
              color: '#0b0c0f',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#e5c383')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#f5d393')}
          >
            <i className="ri-refresh-line" style={{ fontSize: 16 }} />
            {retryText}
          </button>
        )}

        {action && (
          <button
            onClick={action.onClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: '#1a1a1f',
              color: '#e4e7ec',
              border: '1px solid #27272a',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = '#3f3f46';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#1a1a1f';
              e.currentTarget.style.borderColor = '#27272a';
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#131316',
        border: '1px solid #27272a',
        borderRadius: 12,
      }}
    >
      {content}
    </div>
  );
}

// Inline error for smaller contexts
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: 8,
      }}
    >
      <i className="ri-error-warning-line" style={{ fontSize: 18, color: '#ef4444' }} />
      <span style={{ flex: 1, fontSize: 14, color: '#e4e7ec' }}>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f5d393',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <i className="ri-refresh-line" style={{ fontSize: 14 }} />
          Thử lại
        </button>
      )}
    </div>
  );
}

// Empty state component
export function EmptyState({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'rgba(245, 211, 147, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <i
          className={icon || 'ri-inbox-line'}
          style={{ fontSize: 28, color: '#f5d393' }}
        />
      </div>

      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#e4e7ec',
          marginBottom: 8,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 14,
          color: '#71717a',
          lineHeight: 1.5,
          marginBottom: action ? 20 : 0,
          maxWidth: 300,
        }}
      >
        {message}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#f5d393',
            color: '#0b0c0f',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
