import { useState, memo, useMemo } from 'react';
import { tokens, resolveMediaUrl } from '@app/shared';

interface BlogImageThumbnailProps {
  src?: string;
  alt?: string;
  onClick?: () => void;
}

/**
 * Blog Content Image - Displays image with natural aspect ratio
 * Responsive, maintains quality, with lightbox support on click
 */
export const BlogImageThumbnail = memo(function BlogImageThumbnail({
  src,
  alt,
  onClick,
}: BlogImageThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = useMemo(() => resolveMediaUrl(src), [src]);

  if (!resolvedSrc || hasError) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: '24px 0',
          padding: '40px 20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.15)',
          borderRadius: '12px',
          textAlign: 'center',
          color: tokens.color.muted,
          fontSize: '14px',
        }}
      >
        <i className="ri-image-line" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.5 }} />
        Không thể tải ảnh
      </div>
    );
  }

  return (
    <figure
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.()}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        margin: '24px 0',
        padding: 0,
        cursor: onClick ? 'zoom-in' : 'default',
        borderRadius: '12px',
        overflow: 'hidden',
        border: isHovered
          ? `2px solid ${tokens.color.primary}80`
          : '1px solid rgba(255,255,255,0.1)',
        boxShadow: isHovered
          ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${tokens.color.primary}40`
          : '0 4px 16px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        background: 'rgba(0,0,0,0.2)',
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(12,12,16,0.8)',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: tokens.color.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}

      {/* Actual image - natural aspect ratio, no height limit */}
      <img
        src={resolvedSrc}
        alt={alt || 'Blog image'}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.4s ease',
          opacity: isLoaded ? 1 : 0,
        }}
      />

      {/* Hover overlay with zoom icon */}
      {onClick && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isHovered ? 'rgba(0,0,0,0.3)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              border: `2px solid ${tokens.color.primary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'scale(1)' : 'scale(0.8)',
              transition: 'all 0.3s ease',
              boxShadow: `0 4px 16px ${tokens.color.primary}40`,
            }}
          >
            <i className="ri-zoom-in-line" style={{ fontSize: '24px', color: 'white' }} />
          </div>
        </div>
      )}


    </figure>
  );
});
