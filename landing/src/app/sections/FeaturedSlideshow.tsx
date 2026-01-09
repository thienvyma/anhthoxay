/**
 * Featured Slideshow Section
 * Displays featured media images in a slideshow/carousel
 * Optimized for both desktop and mobile
 */

import { useState, useEffect, useCallback, memo } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  const autoplay = data.autoplay !== false;
  const autoplayDelay = data.autoplayDelay || 5000;
  const showNavigation = data.showNavigation !== false;
  const showPagination = data.showPagination !== false;
  const showThumbnails = data.showThumbnails !== false;

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
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
    if (!autoplay || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [autoplay, autoplayDelay, images.length]);

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
    <section style={{ padding: isMobile ? '40px 0' : '80px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
        {/* Header */}
        {(data.title || data.subtitle) && (
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 48 }}>
            {data.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{
                  fontSize: isMobile ? 24 : 'clamp(28px, 5vw, 42px)',
                  fontFamily: tokens.font.display,
                  color: tokens.color.primary,
                  marginBottom: 12,
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
                  fontSize: isMobile ? 14 : 'clamp(14px, 2vw, 18px)',
                  color: tokens.color.muted,
                  maxWidth: 600,
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
            borderRadius: isMobile ? tokens.radius.md : tokens.radius.lg,
            overflow: 'hidden',
            background: tokens.color.surface,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Main Image */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: isMobile ? '75%' : '56.25%', // 4:3 on mobile, 16:9 on desktop
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage.id}
                src={resolveMediaUrl(currentImage.url)}
                alt={currentImage.alt || ''}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={`caption-${currentImage.id}`}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: isMobile ? '32px 16px 16px' : '48px 24px 24px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                  color: '#fff',
                  fontSize: isMobile ? 14 : 16,
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                {currentImage.caption}
              </motion.div>
            )}

            {/* Navigation Arrows - Desktop */}
            {showNavigation && images.length > 1 && !isMobile && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1, background: 'rgba(245, 211, 147, 0.9)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goPrev}
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <i className="ri-arrow-left-s-line" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, background: 'rgba(245, 211, 147, 0.9)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goNext}
                  style={{
                    position: 'absolute',
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <i className="ri-arrow-right-s-line" />
                </motion.button>
              </>
            )}

            {/* Navigation Arrows - Mobile (smaller, semi-transparent) */}
            {showNavigation && images.length > 1 && isMobile && (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={goPrev}
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  <i className="ri-arrow-left-s-line" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={goNext}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  <i className="ri-arrow-right-s-line" />
                </motion.button>
              </>
            )}

            {/* Slide Counter - Mobile */}
            {isMobile && images.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  padding: '6px 12px',
                  background: 'rgba(0,0,0,0.6)',
                  borderRadius: 20,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Pagination Dots - Mobile only */}
          {showPagination && images.length > 1 && isMobile && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                background: tokens.color.surface,
              }}
            >
              {images.map((_, index) => (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: index === currentIndex ? 20 : 8,
                    height: 8,
                    borderRadius: 4,
                    background:
                      index === currentIndex
                        ? tokens.color.primary
                        : `${tokens.color.muted}50`,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}

          {/* Thumbnails - Desktop only */}
          {showThumbnails && images.length > 1 && !isMobile && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
                padding: '16px 24px',
                background: tokens.color.surface,
                borderTop: `1px solid ${tokens.color.border}`,
                overflowX: 'auto',
              }}
            >
              {images.map((img, index) => (
                <motion.button
                  key={img.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: 80,
                    height: 56,
                    borderRadius: tokens.radius.sm,
                    overflow: 'hidden',
                    border: index === currentIndex 
                      ? `3px solid ${tokens.color.primary}` 
                      : '3px solid transparent',
                    cursor: 'pointer',
                    opacity: index === currentIndex ? 1 : 0.6,
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                    padding: 0,
                    background: 'transparent',
                  }}
                >
                  <img
                    src={resolveMediaUrl(img.url)}
                    alt={img.alt || `Slide ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Progress Bar - Desktop */}
        {autoplay && images.length > 1 && !isMobile && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {images.map((_, index) => (
              <div
                key={index}
                style={{
                  width: 60,
                  height: 3,
                  borderRadius: 2,
                  background: tokens.color.border,
                  overflow: 'hidden',
                }}
              >
                {index === currentIndex && (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default FeaturedSlideshow;
