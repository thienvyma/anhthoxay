import { useState, useEffect, useRef, CSSProperties } from 'react';
import { resolveMediaUrl } from '@app/shared';

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
 * - Responsive images with srcset (WebP)
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading with better performance
  useEffect(() => {
    if (loading === 'eager' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Use RAF to batch DOM updates for better performance
        requestAnimationFrame(() => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        });
      },
      {
        rootMargin: '100px', // Reduced from 400px - load closer to viewport
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

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

  // Generate simple solid color placeholder (no blur for performance)
  const defaultBlurDataURL = '#0c0c10'; // Simple solid color, no SVG blur

  const placeholderColor = blurDataURL || defaultBlurDataURL;
  
  // Get full image URL
  const fullSrc = resolveMediaUrl(src);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0c0c10',
        ...style,
      }}
      className={className}
    >
      {/* Simple placeholder - no blur or shimmer for better performance */}
      {!isLoaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: placeholderColor,
          }}
        />
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <img
          src={fullSrc}
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
            background: 'rgba(12,12,16,0.8)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 14,
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <i className="ri-image-line" style={{ fontSize: 32 }} />
          <span style={{ fontSize: 12 }}>Failed to load</span>
        </div>
      )}
    </div>
  );
}

/**
 * CardImage - Specialized wrapper for card-style images
 * Pre-configured for blog cards, special offers, etc.
 */
export function CardImage({
  src,
  alt,
  className = '',
  ...props
}: Omit<OptimizedImageProps, 'loading'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      {...props}
    />
  );
}
