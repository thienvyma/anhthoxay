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

  const autoplay = data.autoplay !== false;
  const autoplayDelay = data.autoplayDelay || 5000;
  const showNavigation = data.showNavigation !== false;
  const showPagination = data.showPagination !== false;
  const showThumbnails = data.showThumbnails !== false;

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

  // Scroll thumbnail into view (desktop only)
  useEffect(() => {
    // Skip on mobile
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) return;

    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[currentIndex] as HTMLElement;
      if (thumbnail) {
        const container = thumbnailsRef.current;
        const scrollLeft =
          thumbnail.offsetLeft - container.offsetWidth / 2 + thumbnail.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

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
      <section className="fs-section" style={{ padding: '40px 16px', textAlign: 'center' }}>
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
    <section className="fs-section">
      <style>{`
        .fs-section {
          padding: 60px 0;
        }
        .fs-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .fs-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .fs-title {
          font-size: clamp(28px, 4vw, 38px);
          margin-bottom: 8px;
        }
        .fs-subtitle {
          font-size: 16px;
        }
        .fs-main-image {
          padding-bottom: 56.25%;
        }
        .fs-nav-btn {
          width: 48px;
          height: 48px;
          font-size: 26px;
        }
        .fs-nav-prev { left: 16px; }
        .fs-nav-next { right: 16px; }
        .fs-counter {
          top: 12px;
          right: 12px;
          padding: 6px 14px;
          font-size: 13px;
        }
        .fs-caption {
          padding: 40px 20px 16px;
          font-size: 15px;
        }
        /* Pagination - HIDDEN on desktop */
        .fs-pagination {
          display: none !important;
        }
        /* Thumbnails - VISIBLE on desktop */
        .fs-thumbnails {
          display: flex !important;
          gap: 8px;
          padding: 12px 16px;
          background: ${tokens.color.surface};
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .fs-thumbnails::-webkit-scrollbar {
          display: none;
        }
        .fs-thumb {
          width: 72px;
          height: 48px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.2s ease;
          flex-shrink: 0;
          padding: 0;
          background: ${tokens.color.background};
        }
        .fs-thumb:hover { opacity: 0.8; }
        .fs-thumb.active {
          border-color: ${tokens.color.primary};
          opacity: 1;
        }
        .fs-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        /* Progress - VISIBLE on desktop */
        .fs-progress {
          display: block;
        }
        
        /* ========== MOBILE STYLES ========== */
        @media (max-width: 767px) {
          .fs-section {
            padding: 32px 0;
          }
          .fs-container {
            padding: 0 12px;
          }
          .fs-header {
            margin-bottom: 20px;
          }
          .fs-title {
            font-size: 22px;
          }
          .fs-subtitle {
            font-size: 13px;
          }
          .fs-main-image {
            padding-bottom: 75%;
          }
          .fs-nav-btn {
            width: 36px;
            height: 36px;
            font-size: 20px;
          }
          .fs-nav-prev { left: 8px; }
          .fs-nav-next { right: 8px; }
          .fs-counter {
            top: 8px;
            right: 8px;
            padding: 4px 10px;
            font-size: 11px;
          }
          .fs-caption {
            padding: 24px 12px 12px;
            font-size: 13px;
          }
          /* Pagination - VISIBLE on mobile */
          .fs-pagination {
            display: flex !important;
          }
          /* Thumbnails - COMPLETELY HIDDEN on mobile */
          .fs-thumbnails {
            display: none !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
            visibility: hidden !important;
          }
          /* Progress - HIDDEN on mobile */
          .fs-progress {
            display: none !important;
          }
        }
      `}</style>

      <div className="fs-container">
        {/* Header */}
        {(data.title || data.subtitle) && (
          <div className="fs-header">
            {data.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="fs-title"
                style={{
                  fontFamily: tokens.font.display,
                  color: tokens.color.primary,
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
                className="fs-subtitle"
                style={{
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
            borderRadius: 16,
            overflow: 'hidden',
            background: tokens.color.surface,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Main Image */}
          <div
            className="fs-main-image"
            style={{
              position: 'relative',
              width: '100%',
              background: tokens.color.background,
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
                className="fs-caption"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                  color: '#fff',
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
                  className="fs-nav-btn fs-nav-prev"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Ảnh trước"
                >
                  <i className="ri-arrow-left-s-line" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goNext}
                  className="fs-nav-btn fs-nav-next"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                className="fs-counter"
                style={{
                  position: 'absolute',
                  background: 'rgba(0,0,0,0.6)',
                  borderRadius: 20,
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Pagination Dots - Mobile only via CSS */}
          {showPagination && images.length > 1 && (
            <div
              className="fs-pagination"
              style={{
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

          {/* Thumbnails - Desktop only via CSS */}
          {showThumbnails && images.length > 1 && (
            <div ref={thumbnailsRef} className="fs-thumbnails">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => goToSlide(index)}
                  className={`fs-thumb ${index === currentIndex ? 'active' : ''}`}
                  aria-label={`Xem ảnh ${index + 1}`}
                >
                  <img
                    src={resolveMediaUrl(img.url)}
                    alt={img.alt || `Slide ${index + 1}`}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress Indicator - Desktop only via CSS */}
        {autoplay && images.length > 1 && !isPaused && (
          <div
            className="fs-progress"
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
