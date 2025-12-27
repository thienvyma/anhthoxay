/**
 * Featured Slideshow Section
 * Displays featured media images in a slideshow/carousel
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
}

export const FeaturedSlideshow = memo(function FeaturedSlideshow({
  data,
}: {
  data: FeaturedSlideshowData;
}) {
  const [images, setImages] = useState<MediaAsset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const autoplay = data.autoplay !== false;
  const autoplayDelay = data.autoplayDelay || 5000;
  const showNavigation = data.showNavigation !== false;
  const showPagination = data.showPagination !== false;

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
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
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
    <section style={{ padding: '80px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        {(data.title || data.subtitle) && (
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {data.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{
                  fontSize: 'clamp(28px, 5vw, 42px)',
                  fontFamily: tokens.font.display,
                  color: tokens.color.primary,
                  marginBottom: 16,
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
                  fontSize: 'clamp(14px, 2vw, 18px)',
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
            borderRadius: tokens.radius.lg,
            overflow: 'hidden',
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          {/* Main Image */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%', // 16:9 aspect ratio
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
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '40px 24px 24px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  color: '#fff',
                  fontSize: 16,
                  textAlign: 'center',
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
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  <i className="ri-arrow-left-s-line" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goNext}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  <i className="ri-arrow-right-s-line" />
                </motion.button>
              </>
            )}
          </div>

          {/* Pagination Dots */}
          {showPagination && images.length > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                padding: 16,
                background: tokens.color.surface,
              }}
            >
              {images.map((_, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: index === currentIndex ? 24 : 10,
                    height: 10,
                    borderRadius: 5,
                    background:
                      index === currentIndex
                        ? tokens.color.primary
                        : tokens.color.border,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export default FeaturedSlideshow;
