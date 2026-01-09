/**
 * Featured Slideshow Section
 * Displays featured media images in a beautiful slideshow/carousel
 * Optimized for both desktop and mobile with modern UI
 */

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl, API_URL } from '@app/shared';

interface MediaAsset {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
}

interface FeaturedSlideshowData {
  title?: string;
  subtitle?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  showNavigation?: boolean;
  showPagination?: boolean;
  showThumbnails?: boolean;
}

export const FeaturedSlideshow = memo(function FeaturedSlideshow({
  data,
}: {
  data: FeaturedSlideshowData;
}) {
  const [images, setImages] = useState<MediaAsset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  // Check mobile - set initial value from window
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const autoplay = data.autoplay !== false;
  const autoplayDelay = data.autoplayDelay || 5000;
  const showNavigation = data.showNavigation !== false;
  const showPagination = data.showPagination !== false;
  const showThumbnails = data.showThumbnails !== false;

  // Update mobile state on resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch featured images
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_URL}/media/featured`);
        const json = await res.json();
        setImages(json.data || json || []);
      } catch (error) {
        console.error('Failed to fetch featured images:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Autoplay
  useEffect(() => {
    if (!autoplay || images.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [autoplay, autoplayDelay, images.length, isPaused]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current && !isMobile) {
      const thumbnail = thumbnailsRef.current.children[currentIndex] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex, isMobile]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  if (loading) {
    return (
      <section style={{ padding: isMobile ? '40px 16px' : '80px 24px', textAlign: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
            margin: '0 auto',
          }}
        />
      </section>
    );
  }

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <section style={{ padding: isMobile ? '32px 0' : '60px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px' }}>
        {/* Header */}
        {(data.title || data.subtitle) && (
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 40 }}>
            {data.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{
                  fontSize: isMobile ? 22 : 'clamp(28px, 4vw, 38px)',
                  fontFamily: tokens.font.display,
                  color: tokens.color.primary,
                  marginBottom: 8,
                }}
              >
                {data.title}
              </motion.h2>
            )}
            {data.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                style={{
                  fontSize: isMobile ? 13 : 16,
                  color: tokens.color.muted,
                  maxWidth: 500,
                  margin: '0 auto',
                }}
              >
                {data.subtitle}
              </motion.p>
            )}
          </div>
        )}

        {/* Slideshow Container */}
        <div
          style={{
            position: 'relative',
            borderRadius: isMobile ? 12 : 16,
            overflow: 'hidden',
            background: tokens.color.surface,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Main Image */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: isMobile ? '4/3' : '16/9',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage.id}
                src={resolveMediaUrl(currentImage.url)}
                alt={currentImage.alt || ''}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </AnimatePresence>

            {/* Caption Overlay */}
            {currentImage.caption && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={`caption-${currentImage.id}`}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: isMobile ? '24px 12px 12px' : '40px 20px 16px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                  color: '#fff',
                  fontSize: isMobile ? 13 : 15,
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                {currentImage.caption}
              </motion.div>
            )}

            {/* Navigation Arrows */}
            {showNavigation && images.length > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goPrev}
                  style={{
                    position: 'absolute',
                    left: isMobile ? 8 : 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: isMobile ? 36 : 48,
                    height: isMobile ? 36 : 48,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? 20 : 26,
                    transition: 'background 0.2s',
                  }}
                  aria-label="Ảnh trước"
                >
                  <i className="ri-arrow-left-s-line" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goNext}
                  style={{
                    position: 'absolute',
                    right: isMobile ? 8 : 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: isMobile ? 36 : 48,
                    height: isMobile ? 36 : 48,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? 20 : 26,
                    transition: 'background 0.2s',
                  }}
                  aria-label="Ảnh tiếp"
                >
                  <i className="ri-arrow-right-s-line" />
                </motion.button>
              </>
            )}

            {/* Slide Counter Badge */}
            {images.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: isMobile ? 8 : 12,
                  right: isMobile ? 8 : 12,
                  padding: isMobile ? '4px 10px' : '6px 14px',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 20,
                  color: '#fff',
                  fontSize: isMobile ? 11 : 13,
                  fontWeight: 600,
                }}
              >
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Pagination Dots - Show on mobile only */}
          {showPagination && images.length > 1 && isMobile && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
                padding: '10px 12px',
                background: tokens.color.surface,
              }}
            >
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: index === currentIndex ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background:
                      index === currentIndex
                        ? tokens.color.primary
                        : `${tokens.color.muted}40`,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                  aria-label={`Đi đến ảnh ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Thumbnails - Desktop only (NOT rendered on mobile) */}
          {showThumbnails && images.length > 1 && !isMobile && (
            <div
              ref={thumbnailsRef}
              style={{
                display: 'flex',
                gap: 8,
                padding: '12px 16px',
                background: tokens.color.surface,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {images.map((img, index) => (
                <motion.button
                  key={img.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: 72,
                    height: 48,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: index === currentIndex 
                      ? `2px solid ${tokens.color.primary}` 
                      : '2px solid transparent',
                    cursor: 'pointer',
                    opacity: index === currentIndex ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    padding: 0,
                    background: tokens.color.border,
                  }}
                  aria-label={`Xem ảnh ${index + 1}`}
                >
                  <img
                    src={resolveMediaUrl(img.url)}
                    alt={img.alt || `Slide ${index + 1}`}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Progress Indicator - Desktop with autoplay */}
        {autoplay && images.length > 1 && !isMobile && !isPaused && (
          <div
            style={{
              marginTop: 12,
              height: 3,
              background: tokens.color.border,
              borderRadius: 2,
              overflow: 'hidden',
              maxWidth: 400,
              margin: '12px auto 0',
            }}
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: autoplayDelay / 1000, ease: 'linear' }}
              key={`progress-${currentIndex}`}
              style={{
                height: '100%',
                background: tokens.color.primary,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
});

export default FeaturedSlideshow;
