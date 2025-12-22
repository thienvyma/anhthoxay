/**
 * LazyImage Component
 * 
 * Lazy loading image component using Intersection Observer API.
 * Features:
 * - Lazy loading with Intersection Observer
 * - Placeholder images while loading
 * - Blur-up effect for smooth transitions
 * - Error handling with fallback
 * - Responsive image support
 * 
 * Requirements: 15.4 - Lazy load images for performance
 */

import {
  useState,
  useEffect,
  useRef,
  type CSSProperties,
  type ImgHTMLAttributes,
} from 'react';

export interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Image source URL */
  src: string;
  /** Low-quality placeholder image (for blur-up effect) */
  placeholder?: string;
  /** Fallback image on error */
  fallback?: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Aspect ratio (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Object fit */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Object position */
  objectPosition?: string;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection observer */
  threshold?: number;
  /** Show loading skeleton */
  showSkeleton?: boolean;
  /** Border radius */
  borderRadius?: number | string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Additional wrapper styles */
  wrapperStyle?: CSSProperties;
  /** Additional wrapper className */
  wrapperClassName?: string;
}

// Default placeholder - a simple gray gradient
const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231a1a1f" width="400" height="300"/%3E%3C/svg%3E';

// Default fallback - an image icon
const DEFAULT_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231a1a1f" width="400" height="300"/%3E%3Cpath fill="%2327272a" d="M175 100h50v50h-50z"/%3E%3Cpath fill="%2327272a" d="M150 175l50-50 50 50 50-50 50 50v50H150z"/%3E%3C/svg%3E';

export function LazyImage({
  src,
  placeholder = DEFAULT_PLACEHOLDER,
  fallback = DEFAULT_FALLBACK,
  alt,
  aspectRatio,
  objectFit = 'cover',
  objectPosition = 'center',
  rootMargin = '100px',
  threshold = 0.1,
  showSkeleton = true,
  borderRadius = 8,
  onLoad,
  onError,
  wrapperStyle,
  wrapperClassName = '',
  className = '',
  style,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set up Intersection Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load immediately
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || hasError) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      setCurrentSrc(fallback);
      onError?.();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src, fallback, hasError, onLoad, onError]);

  // Calculate aspect ratio padding
  const getAspectRatioPadding = (): string | undefined => {
    if (!aspectRatio) return undefined;
    const [width, height] = aspectRatio.split('/').map(Number);
    if (width && height) {
      return `${(height / width) * 100}%`;
    }
    return undefined;
  };

  const aspectPadding = getAspectRatioPadding();

  return (
    <div
      ref={containerRef}
      className={`lazy-image-wrapper ${wrapperClassName}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius,
        backgroundColor: '#1a1a1f',
        ...(aspectPadding
          ? {
              paddingBottom: aspectPadding,
              height: 0,
            }
          : {}),
        ...wrapperStyle,
      }}
    >
      {/* Skeleton loader */}
      {showSkeleton && !isLoaded && !hasError && (
        <div
          className="lazy-image-skeleton skeleton-shimmer"
          style={{
            position: aspectPadding ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            width: '100%',
            height: aspectPadding ? '100%' : 'auto',
            aspectRatio: aspectPadding ? undefined : aspectRatio,
          }}
        />
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`lazy-image ${className}`}
        loading="lazy"
        decoding="async"
        style={{
          position: aspectPadding ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          width: '100%',
          height: aspectPadding ? '100%' : 'auto',
          objectFit,
          objectPosition,
          opacity: isLoaded || hasError ? 1 : 0,
          transition: 'opacity 0.3s ease, filter 0.3s ease',
          filter: isLoaded ? 'blur(0)' : 'blur(10px)',
          ...style,
        }}
        {...props}
      />
    </div>
  );
}

/**
 * LazyImageGallery Component
 * 
 * A gallery component that lazy loads multiple images
 */
export interface LazyImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    placeholder?: string;
  }>;
  columns?: number | { mobile?: number; tablet?: number; desktop?: number };
  gap?: number;
  aspectRatio?: string;
  onImageClick?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
}

export function LazyImageGallery({
  images,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = 12,
  aspectRatio = '1/1',
  onImageClick,
  className = '',
  style,
}: LazyImageGalleryProps) {
  const [gridColumns, setGridColumns] = useState(
    typeof columns === 'number' ? columns : columns.mobile || 2
  );

  // Update columns based on screen size
  useEffect(() => {
    if (typeof columns === 'number') {
      setGridColumns(columns);
      return;
    }

    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setGridColumns(columns.mobile || 2);
      } else if (width < 1024) {
        setGridColumns(columns.tablet || 3);
      } else {
        setGridColumns(columns.desktop || 4);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [columns]);

  return (
    <div
      className={`lazy-image-gallery ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {images.map((image, index) => (
        <div
          key={index}
          onClick={() => onImageClick?.(index)}
          style={{
            cursor: onImageClick ? 'pointer' : 'default',
          }}
        >
          <LazyImage
            src={image.src}
            alt={image.alt}
            placeholder={image.placeholder}
            aspectRatio={aspectRatio}
            borderRadius={8}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * useImagePreloader Hook
 * 
 * Preloads images in the background
 */
export function useImagePreloader(urls: string[]): {
  loaded: Set<string>;
  isLoading: boolean;
  progress: number;
} {
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (urls.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const loadedUrls = new Set<string>();

    const loadImage = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedUrls.add(url);
          setLoaded(new Set(loadedUrls));
          resolve();
        };
        img.onerror = () => {
          resolve(); // Don't fail on error, just skip
        };
        img.src = url;
      });
    };

    Promise.all(urls.map(loadImage)).then(() => {
      setIsLoading(false);
    });
  }, [urls]);

  const progress = urls.length > 0 ? (loaded.size / urls.length) * 100 : 100;

  return { loaded, isLoading, progress };
}

/**
 * useLazyLoad Hook
 * 
 * Generic lazy loading hook using Intersection Observer
 */
export function useLazyLoad<T extends HTMLElement>(
  options?: IntersectionObserverInit
): {
  ref: React.RefObject<T | null>;
  isInView: boolean;
} {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, isInView };
}

export default LazyImage;
