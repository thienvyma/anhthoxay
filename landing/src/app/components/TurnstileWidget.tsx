/**
 * Cloudflare Turnstile CAPTCHA Widget Component
 *
 * A reusable CAPTCHA widget for form protection.
 *
 * **Feature: production-scalability**
 * **Validates: Requirements 3.5**
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

export interface TurnstileWidgetProps {
  /**
   * Callback when verification succeeds
   */
  onVerify: (token: string) => void;

  /**
   * Callback when verification fails
   */
  onError?: () => void;

  /**
   * Callback when token expires
   */
  onExpire?: () => void;

  /**
   * Widget theme
   * @default 'light'
   */
  theme?: 'light' | 'dark' | 'auto';

  /**
   * Widget size
   * @default 'normal'
   */
  size?: 'normal' | 'compact';

  /**
   * Additional CSS class name
   */
  className?: string;
}

// ============================================
// TURNSTILE SCRIPT LOADER
// ============================================

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded) {
      resolve();
      return;
    }

    loadCallbacks.push(resolve);

    if (scriptLoading) {
      return;
    }

    scriptLoading = true;

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      scriptLoading = false;
      console.error('Failed to load Turnstile script');
    };

    document.head.appendChild(script);
  });
}

// ============================================
// COMPONENT
// ============================================

/**
 * Turnstile CAPTCHA Widget
 *
 * Renders a Cloudflare Turnstile CAPTCHA widget for form protection.
 * Requires VITE_TURNSTILE_SITE_KEY environment variable to be set.
 *
 * @example
 * ```tsx
 * const [token, setToken] = useState<string | null>(null);
 *
 * <TurnstileWidget
 *   onVerify={setToken}
 *   onError={() => setToken(null)}
 *   onExpire={() => setToken(null)}
 * />
 *
 * <button disabled={!token}>Submit</button>
 * ```
 */
export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify]
  );

  const handleError = useCallback(() => {
    setError('CAPTCHA verification failed');
    onError?.();
  }, [onError]);

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  useEffect(() => {
    if (!siteKey) {
      console.warn('Turnstile site key not configured (VITE_TURNSTILE_SITE_KEY)');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initWidget = async () => {
      try {
        await loadTurnstileScript();

        if (!mounted || !containerRef.current) return;

        // Wait for turnstile to be available
        const turnstile = (window as unknown as { turnstile?: TurnstileAPI }).turnstile;
        if (!turnstile) {
          throw new Error('Turnstile not available');
        }

        // Remove existing widget if any
        if (widgetIdRef.current) {
          turnstile.remove(widgetIdRef.current);
        }

        // Render new widget
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: handleVerify,
          'error-callback': handleError,
          'expired-callback': handleExpire,
          theme,
          size,
        });

        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize Turnstile:', err);
        setError('Failed to load CAPTCHA');
        setIsLoading(false);
      }
    };

    initWidget();

    return () => {
      mounted = false;
      const turnstile = (window as unknown as { turnstile?: TurnstileAPI }).turnstile;
      if (widgetIdRef.current && turnstile) {
        turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, size, handleVerify, handleError, handleExpire]);

  // Don't render anything if site key is not configured (development mode)
  if (!siteKey) {
    return null;
  }

  return (
    <div className={`turnstile-widget ${className}`}>
      {isLoading && (
        <div className="turnstile-loading">
          <span>Loading CAPTCHA...</span>
        </div>
      )}
      {error && (
        <div className="turnstile-error">
          <span>{error}</span>
        </div>
      )}
      <div ref={containerRef} style={{ display: isLoading ? 'none' : 'block' }} />
    </div>
  );
}

// ============================================
// TURNSTILE API TYPES
// ============================================

interface TurnstileAPI {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'compact';
    }
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

export default TurnstileWidget;
