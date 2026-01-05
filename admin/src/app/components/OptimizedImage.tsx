import { useState, useEffect, useRef, CSSProperties } from 'react';
import { tokens } from '../../theme';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLImageElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLImageElement>) => void;
  loading?: 'lazy' | 'eager';
  blurDataURL?: string; // Optional blur placeholder
}

/**
 * Optimized Image Component
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Blur placeholder while loading
 * - Progressive loading
 * - Error handling with fallback
 */
export function OptimizedImage({
  src,
  alt,
  className,
  style,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave,
  loading = 'lazy',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading with better performance
  useEffect(() => {
    if (loading === 'eager' || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Use setTimeout to batch multiple image loads
            setTimeout(() => {
              setIsInView(true);
            }, 0);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '400px', // Load 400px before entering viewport for smoother experience
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder from dominant color - use tokens.color.background
  const defaultBlurDataURL =
    `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cfilter id="b"%3E%3CfeGaussianBlur stdDeviation="20"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" fill="%23${tokens.color.background.slice(1)}" filter="url(%23b)"/%3E%3C/svg%3E`;

  const placeholderSrc = blurDataURL || defaultBlurDataURL;

  return (
    <div
      ref={imgRef as React.RefObject<HTMLDivElement>}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: tokens.color.background,
        ...style,
      }}
      className={className}
    >
      {/* Blur Placeholder */}
      {!isLoaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${placeholderSrc}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Loading Shimmer */}
      {!isLoaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              `linear-gradient(90deg, transparent 0%, ${tokens.color.surfaceAlt} 50%, transparent 100%)`,
            animation: 'shimmer 2s infinite',
          }}
        />
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          decoding="async"
          fetchPriority={loading === 'eager' ? 'high' : 'low'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
            contentVisibility: 'auto',
            containIntrinsicSize: '1px 400px',
          }}
          loading={loading}
        />
      )}

      {/* Error Fallback */}
      {hasError && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: tokens.color.surfaceAlt,
            color: tokens.color.muted,
            fontSize: 14,
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <i className="ri-image-line" style={{ fontSize: 32 }} />
          <span style={{ fontSize: 12 }}>Failed to load</span>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

