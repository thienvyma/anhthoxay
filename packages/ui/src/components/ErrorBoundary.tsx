import React from 'react';
import { tokens } from '@app/shared';

/**
 * Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI to display when error occurs */
  fallback?: React.ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch render errors in React component tree
 * 
 * NOTE: This only catches errors during:
 * - Rendering
 * - Lifecycle methods
 * - Constructors of child components
 * 
 * It does NOT catch errors in:
 * - Event handlers (use try-catch)
 * - Async code (use try-catch or .catch())
 * - Server-side rendering
 * - Errors thrown in the error boundary itself
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultErrorFallback onRetry={this.handleRetry} error={this.state.error} />;
    }
    return this.props.children;
  }
}

/**
 * Props for DefaultErrorFallback component
 */
interface DefaultErrorFallbackProps {
  onRetry: () => void;
  error: Error | null;
}

/**
 * Default fallback UI displayed when an error is caught
 * Uses Vietnamese text as per requirements
 */
function DefaultErrorFallback({ onRetry, error }: DefaultErrorFallbackProps) {
  return (
    <div
      style={{
        padding: tokens.space.xl,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        backgroundColor: tokens.color.background,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
        margin: tokens.space.md,
      }}
    >
      <h2
        style={{
          color: tokens.color.text,
          fontSize: tokens.font.size.xl,
          fontWeight: tokens.font.weight.semibold,
          marginBottom: tokens.space.sm,
        }}
      >
        Đã xảy ra lỗi
      </h2>
      <p
        style={{
          color: tokens.color.textMuted,
          fontSize: tokens.font.size.base,
          marginBottom: tokens.space.md,
        }}
      >
        Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.
      </p>
      {error && (
        <pre
          style={{
            fontSize: tokens.font.size.sm,
            color: tokens.color.textMuted,
            backgroundColor: tokens.color.surface,
            padding: tokens.space.sm,
            borderRadius: tokens.radius.md,
            maxWidth: '100%',
            overflow: 'auto',
            marginBottom: tokens.space.md,
          }}
        >
          {error.message}
        </pre>
      )}
      <button
        onClick={onRetry}
        style={{
          padding: `${tokens.space.sm} ${tokens.space.lg}`,
          backgroundColor: tokens.color.primary,
          color: tokens.color.background,
          border: 'none',
          borderRadius: tokens.radius.md,
          fontSize: tokens.font.size.base,
          fontWeight: tokens.font.weight.medium,
          cursor: 'pointer',
          transition: `background-color ${tokens.motion.duration.sm}s`,
        }}
      >
        Thử lại
      </button>
    </div>
  );
}

export default ErrorBoundary;
