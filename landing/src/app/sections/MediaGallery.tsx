/**
 * Media Gallery Section
 * Displays all media images with pagination and enhanced lightbox
 */

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { tokens, resolveMediaUrl, API_URL } from '@app/shared';

interface MediaAsset {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
}

interface MediaGalleryData {
  title?: string;
  subtitle?: string;
  columns?: number;
  itemsPerPage?: number;
  showCaptions?: boolean;
}

export const MediaGallery = memo(function MediaGallery({
  data,
}: {
  data: MediaGalleryData;
}) {
  const [images, setImages] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [direction, setDirection] = useState(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const columns = data.columns || 3;
  const itemsPerPage = data.itemsPerPage || 12;
  const showCaptions = data.showCaptions !== false;

  // Fetch gallery images
  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/media/gallery?page=${page}&limit=${itemsPerPage}`
        );
        const json = await res.json();
        // API returns: { success: true, data: { items: [...], pagination: {...} } }
        const result = json.data || json;
        setImages(result.items || []);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
        }
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [page, itemsPerPage]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
    // Scroll to top of section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

  const openLightbox = useCallback((index: number) => {
    setSelectedIndex(index);
    setIsZoomed(false);
    setDirection(0);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
    setIsZoomed(false);
    document.body.style.overflow = '';
  }, []);

  const goToPrev = useCallback(() => {
    if (selectedIndex === null || images.length === 0) return;
    setDirection(-1);
    setIsZoomed(false);
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
  }, [selectedIndex, images.length]);

  const goToNext = useCallback(() => {
    if (selectedIndex === null || images.length === 0) return;
    setDirection(1);
    setIsZoomed(false);
    setSelectedIndex((selectedIndex + 1) % images.length);
  }, [selectedIndex, images.length]);

  const toggleZoom = useCallback(() => {
    setIsZoomed((prev) => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, closeLightbox, goToPrev, goToNext]);

  // Swipe handler
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isZoomed) return;
      const threshold = 50;
      if (info.offset.x > threshold) {
        goToPrev();
      } else if (info.offset.x < -threshold) {
        goToNext();
      }
    },
    [isZoomed, goToPrev, goToNext]
  );

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  if (loading && images.length === 0) {
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

  return (
    <section style={{ padding: '60px 0 80px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 12px' }}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            background: 'rgba(12,12,16,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            padding: 'clamp(32px, 6vw, 48px) clamp(20px, 4vw, 40px)',
          }}
        >
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

        {/* Gallery Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 16,
          }}
        >
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => openLightbox(index)}
              style={{
                position: 'relative',
                borderRadius: tokens.radius.md,
                overflow: 'hidden',
                cursor: 'pointer',
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <div style={{ paddingBottom: '75%', position: 'relative' }}>
                <img
                  src={resolveMediaUrl(image.url)}
                  alt={image.alt || ''}
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                />
                {/* Hover Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="gallery-overlay"
                >
                  <i
                    className="ri-zoom-in-line"
                    style={{ fontSize: 32, color: '#fff' }}
                  />
                </div>
              </div>
              {showCaptions && image.caption && (
                <div
                  style={{
                    padding: 12,
                    fontSize: 14,
                    color: tokens.color.text,
                    background: tokens.color.surface,
                  }}
                >
                  {image.caption}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: 48,
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              style={{
                padding: '10px 16px',
                borderRadius: tokens.radius.md,
                background:
                  page === 1 ? tokens.color.border : tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                color: page === 1 ? tokens.color.muted : tokens.color.text,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <i className="ri-arrow-left-s-line" />
              Trước
            </motion.button>

            <div
              style={{
                display: 'flex',
                gap: 4,
              }}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  // Add ellipsis
                  const showEllipsisBefore =
                    idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <span key={p} style={{ display: 'flex', gap: 4 }}>
                      {showEllipsisBefore && (
                        <span
                          style={{
                            padding: '10px 8px',
                            color: tokens.color.muted,
                          }}
                        >
                          ...
                        </span>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => goToPage(p)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: tokens.radius.md,
                          background:
                            p === page
                              ? tokens.color.primary
                              : tokens.color.surface,
                          border: `1px solid ${
                            p === page
                              ? tokens.color.primary
                              : tokens.color.border
                          }`,
                          color:
                            p === page ? '#111' : tokens.color.text,
                          cursor: 'pointer',
                          fontWeight: p === page ? 600 : 400,
                        }}
                      >
                        {p}
                      </motion.button>
                    </span>
                  );
                })}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              style={{
                padding: '10px 16px',
                borderRadius: tokens.radius.md,
                background:
                  page === totalPages
                    ? tokens.color.border
                    : tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                color:
                  page === totalPages
                    ? tokens.color.muted
                    : tokens.color.text,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Sau
              <i className="ri-arrow-right-s-line" />
            </motion.button>
          </div>
        )}

        {/* Enhanced Lightbox */}
        <AnimatePresence>
          {selectedImage && selectedIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              ref={constraintsRef}
              className="lightbox-overlay"
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.95)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(12px, 3vw, 24px)',
                overflow: 'hidden',
              }}
            >
              {/* Top Controls Bar */}
              <div
                className="lightbox-controls-top"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'clamp(8px, 2vw, 16px)',
                  zIndex: 10,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Image Counter */}
                <div
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: tokens.radius.pill,
                    color: '#fff',
                    fontSize: 'clamp(12px, 2vw, 14px)',
                    fontWeight: 500,
                  }}
                >
                  {selectedIndex + 1} / {images.length}
                </div>

                {/* Right buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Zoom Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleZoom}
                    className="lightbox-btn-zoom"
                    style={{
                      width: 'clamp(36px, 8vw, 44px)',
                      height: 'clamp(36px, 8vw, 44px)',
                      borderRadius: '50%',
                      background: isZoomed ? tokens.color.primary : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: isZoomed ? '#111' : '#fff',
                      cursor: 'pointer',
                      fontSize: 'clamp(16px, 3vw, 20px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className={isZoomed ? 'ri-zoom-out-line' : 'ri-zoom-in-line'} />
                  </motion.button>

                  {/* Close Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeLightbox}
                    style={{
                      width: 'clamp(36px, 8vw, 44px)',
                      height: 'clamp(36px, 8vw, 44px)',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 'clamp(18px, 3vw, 22px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className="ri-close-line" />
                  </motion.button>
                </div>
              </div>

              {/* Prev Button */}
              {images.length > 1 && (
                <motion.button
                  whileHover={{ scale: 1.1, x: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  className="lightbox-nav-btn"
                  style={{
                    position: 'absolute',
                    left: 'clamp(8px, 2vw, 16px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 'clamp(40px, 8vw, 48px)',
                    height: 'clamp(40px, 8vw, 48px)',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 'clamp(20px, 4vw, 24px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <i className="ri-arrow-left-s-line" />
                </motion.button>
              )}

              {/* Next Button */}
              {images.length > 1 && (
                <motion.button
                  whileHover={{ scale: 1.1, x: 2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="lightbox-nav-btn"
                  style={{
                    position: 'absolute',
                    right: 'clamp(8px, 2vw, 16px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 'clamp(40px, 8vw, 48px)',
                    height: 'clamp(40px, 8vw, 48px)',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 'clamp(20px, 4vw, 24px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <i className="ri-arrow-right-s-line" />
                </motion.button>
              )}

              {/* Image with swipe support */}
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={selectedIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  drag={!isZoomed ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={toggleZoom}
                  className="lightbox-image-wrapper"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                    width: '100%',
                    height: '100%',
                    padding: '56px 60px 100px',
                    boxSizing: 'border-box',
                  }}
                >
                  <motion.img
                    src={resolveMediaUrl(selectedImage.url)}
                    alt={selectedImage.alt || ''}
                    animate={{
                      scale: isZoomed ? 1.8 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    drag={isZoomed}
                    dragConstraints={constraintsRef}
                    className="lightbox-image"
                    style={{
                      maxWidth: isZoomed ? 'none' : 'calc(100vw - 120px)',
                      maxHeight: isZoomed ? 'none' : 'calc(100vh - 180px)',
                      objectFit: 'contain',
                      borderRadius: tokens.radius.md,
                      userSelect: 'none',
                      pointerEvents: 'auto',
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Bottom Controls: Caption + Thumbnails */}
              <div
                className="lightbox-controls-bottom"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: 'clamp(8px, 2vw, 16px)',
                  zIndex: 10,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div
                    className="lightbox-thumbnails"
                    style={{
                      display: 'flex',
                      gap: 'clamp(4px, 1vw, 8px)',
                      padding: 'clamp(6px, 1.5vw, 12px)',
                      background: 'rgba(0,0,0,0.6)',
                      borderRadius: tokens.radius.md,
                      maxWidth: '95vw',
                      overflowX: 'auto',
                    }}
                  >
                    {images.slice(0, 10).map((img, idx) => (
                      <motion.div
                        key={img.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setDirection(idx > selectedIndex ? 1 : -1);
                          setSelectedIndex(idx);
                          setIsZoomed(false);
                        }}
                        style={{
                          width: 'clamp(36px, 8vw, 48px)',
                          height: 'clamp(36px, 8vw, 48px)',
                          borderRadius: 6,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: idx === selectedIndex 
                            ? `2px solid ${tokens.color.primary}` 
                            : '2px solid transparent',
                          opacity: idx === selectedIndex ? 1 : 0.6,
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={resolveMediaUrl(img.url)}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </motion.div>
                    ))}
                    {images.length > 10 && (
                      <div
                        style={{
                          width: 'clamp(36px, 8vw, 48px)',
                          height: 'clamp(36px, 8vw, 48px)',
                          borderRadius: 6,
                          background: 'rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 'clamp(10px, 2vw, 12px)',
                          flexShrink: 0,
                        }}
                      >
                        +{images.length - 10}
                      </div>
                    )}
                  </div>
                )}

                {/* Caption */}
                {selectedImage.caption && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 24px)',
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: tokens.radius.md,
                      color: '#fff',
                      fontSize: 'clamp(12px, 2vw, 15px)',
                      maxWidth: '90vw',
                      textAlign: 'center',
                    }}
                  >
                    {selectedImage.caption}
                  </motion.div>
                )}
              </div>

              {/* Keyboard hint - desktop only */}
              <div
                className="keyboard-hint"
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 16,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                ← → để chuyển ảnh • ESC để đóng
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSS for hover effect */}
        <style>{`
          .gallery-overlay:hover {
            opacity: 1 !important;
          }
          
          .lightbox-overlay {
            touch-action: none;
          }
          
          .lightbox-thumbnails::-webkit-scrollbar {
            height: 4px;
          }
          
          .lightbox-thumbnails::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .lightbox-thumbnails::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
          }
          
          /* Lightbox image responsive */
          .lightbox-image-wrapper {
            padding: 56px 60px 100px !important;
          }
          
          .lightbox-image {
            max-width: calc(100vw - 120px) !important;
            max-height: calc(100vh - 180px) !important;
          }
          
          @media (max-width: 768px) {
            .gallery-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .keyboard-hint {
              display: none !important;
            }
            .lightbox-nav-btn {
              opacity: 0.7;
            }
            .lightbox-btn-zoom {
              display: none !important;
            }
            .lightbox-image-wrapper {
              padding: 50px 50px 90px !important;
            }
            .lightbox-image {
              max-width: calc(100vw - 100px) !important;
              max-height: calc(100vh - 160px) !important;
            }
          }
          
          @media (max-width: 480px) {
            .gallery-grid {
              grid-template-columns: 1fr !important;
            }
            .lightbox-image-wrapper {
              padding: 48px 40px 80px !important;
            }
            .lightbox-image {
              max-width: calc(100vw - 80px) !important;
              max-height: calc(100vh - 150px) !important;
            }
          }
        `}</style>
        </div>
      </div>
    </section>
  );
});

export default MediaGallery;
