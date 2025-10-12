import { useState, useEffect, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { galleryAPI } from '../api';
import { OptimizedImage } from '../components/OptimizedImage';
import { AnimatedButton } from '../components/AnimatedButton';
import { useReducedMotion } from '../utils/useReducedMotion';
import { renderSection } from '../sections/render';
import { LazySection } from '../components/LazySection';
import type { PageData } from '../types';

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  tags: string | null;
  isFeatured: boolean;
  displayOrder: number;
}

const ITEMS_PER_PAGE = 12; // Show 12 images per page

export const GalleryPage = memo(function GalleryPage({ page }: { page?: PageData }) {
  const shouldReduce = useReducedMotion();
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [animatedCards, setAnimatedCards] = useState<Set<string>>(new Set());

  // Fetch gallery images with React Query (CACHE REUSE with Gallery section!)
  const { data: images = [], isLoading: loading } = useQuery({
    queryKey: ['gallery'],
    queryFn: galleryAPI.getImages,
  });

  // Parse tags (memoized to avoid recalculation)
  const allTags = useMemo(() => Array.from(
    new Set(
      images.flatMap(img => 
        img.tags ? img.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
      )
    )
  ), [images]);

  // Filter images by tag (memoized)
  const filteredImages = useMemo(() => 
    selectedTag === 'all'
      ? images
      : images.filter(img => 
          img.tags?.split(',').map((t: string) => t.trim()).includes(selectedTag)
        ),
    [images, selectedTag]
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedImages = filteredImages.slice(startIndex, endIndex);

  // Reset to page 1 when tag changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTag]);

  // Mark card as animated after animation completes (600ms)
  const handleCardAnimationEnd = (imageId: string) => {
    setAnimatedCards((prev) => new Set(prev).add(imageId));
  };

  // Fix image URL
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:4202${url}`;
  };

  // Lightbox navigation
  const openLightbox = (image: GalleryImage, index: number) => {
    setLightboxImage(image);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const nextImage = () => {
    const nextIndex = (lightboxIndex + 1) % filteredImages.length;
    setLightboxIndex(nextIndex);
    setLightboxImage(filteredImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = (lightboxIndex - 1 + filteredImages.length) % filteredImages.length;
    setLightboxIndex(prevIndex);
    setLightboxImage(filteredImages[prevIndex]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxImage) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, lightboxIndex]);

  return (
    <section style={{ 
      minHeight: '100vh',
      background: 'transparent',
      paddingTop: 80
    }}>
      {/* Render HeroSimple section from page data first */}
      {page?.sections && (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          {page.sections
            .filter((s) => s.kind === 'HERO_SIMPLE')
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((s) => {
              const rendered = renderSection(s);
              return rendered ? <div key={s.id}>{rendered}</div> : null;
            })}
        </div>
      )}

      {/* Tag Filters */}
      <div style={{ 
        maxWidth: 1400, 
        margin: '0 auto', 
        padding: '48px 24px 0'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            display: 'flex', 
            gap: 12, 
            justifyContent: 'center', 
            marginBottom: 48, 
            flexWrap: 'wrap',
          }}
        >
          <AnimatedButton
            onClick={() => setSelectedTag('all')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: selectedTag === 'all'
                ? 'linear-gradient(135deg, #F5D393, #EFB679)' 
                : 'rgba(255,255,255,0.05)',
              color: selectedTag === 'all' ? '#111' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Tất cả ({images.length})
          </AnimatedButton>

          {allTags.map((tag) => {
            const count = images.filter(i => i.tags?.includes(tag)).length;
            const isActive = selectedTag === tag;

            return (
              <AnimatedButton
                key={tag}
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive 
                    ? 'linear-gradient(135deg, #F5D393, #EFB679)' 
                    : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#111' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {tag} ({count})
              </AnimatedButton>
            );
          })}
        </motion.div>

        {/* Gallery Grid - Masonry Style */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 0',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <div style={{
              width: 48,
              height: 48,
              border: '3px solid rgba(245,211,147,0.2)',
              borderTopColor: '#F5D393',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p>Đang tải hình ảnh...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 0',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <i className="ri-gallery-line" style={{ fontSize: 64, marginBottom: 16, display: 'block' }} />
            <p style={{ fontSize: 18 }}>Chưa có hình ảnh nào</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
            paddingBottom: 48,
          }}>
            {paginatedImages.map((image, idx) => {
              const hasAnimated = animatedCards.has(image.id);
              return (
              <div
                key={image.id}
                onClick={() => openLightbox(image, startIndex + idx)}
                className={hasAnimated ? "gallery-card" : "gallery-card fade-in-up"}
                onAnimationEnd={() => handleCardAnimationEnd(image.id)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: 'rgba(12,12,16,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                  animationDelay: hasAnimated ? '0s' : `${Math.min(idx * 0.04, 0.4)}s`,
                }}
                >
                  {/* Image */}
                  <div 
                    className="gallery-card-image-wrapper"
                    style={{
                      aspectRatio: '4/3',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                    <OptimizedImage
                      src={getImageUrl(image.url)}
                      alt={image.alt || 'Gallery image'}
                      loading="lazy"
                      className="gallery-card-image"
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    />

                    {/* Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className="gallery-overlay">
                      <i className="ri-zoom-in-line" style={{ 
                        fontSize: 48, 
                        color: '#F5D393',
                      }} />
                    </div>

                    {/* Featured Badge */}
                    {image.isFeatured && (
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95))',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <i className="ri-star-fill" />
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  {(image.caption || image.alt) && (
                    <div style={{ padding: 16 }}>
                      {image.alt && (
                        <h3 style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#fff',
                          marginBottom: 4,
                        }}>
                          {image.alt}
                        </h3>
                      )}
                      {image.caption && (
                        <p style={{
                          fontSize: 14,
                          color: 'rgba(255,255,255,0.6)',
                          margin: 0,
                        }}>
                          {image.caption}
                        </p>
                      )}
                    </div>
                  )}
              </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredImages.length > ITEMS_PER_PAGE && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 60,
            paddingBottom: 100,
          }}>
            {/* Previous Button */}
            <button
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: currentPage === 1 
                  ? 'rgba(255,255,255,0.03)' 
                  : 'rgba(255,255,255,0.05)',
                color: currentPage === 1 
                  ? 'rgba(255,255,255,0.3)' 
                  : 'rgba(255,255,255,0.8)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = 'rgba(245,211,147,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(245,211,147,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
            >
              <i className="ri-arrow-left-s-line" />
              Trước
            </button>

            {/* Page Numbers */}
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: pageNum === currentPage 
                      ? '2px solid #F5D393' 
                      : '1px solid rgba(255,255,255,0.1)',
                    background: pageNum === currentPage 
                      ? 'linear-gradient(135deg, #F5D393, #EFB679)' 
                      : 'rgba(255,255,255,0.05)',
                    color: pageNum === currentPage ? '#111' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (pageNum !== currentPage) {
                      e.currentTarget.style.background = 'rgba(245,211,147,0.15)';
                      e.currentTarget.style.borderColor = 'rgba(245,211,147,0.4)';
                      e.currentTarget.style.color = '#F5D393';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pageNum !== currentPage) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }
                  }}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: currentPage === totalPages 
                  ? 'rgba(255,255,255,0.03)' 
                  : 'rgba(255,255,255,0.05)',
                color: currentPage === totalPages 
                  ? 'rgba(255,255,255,0.3)' 
                  : 'rgba(255,255,255,0.8)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = 'rgba(245,211,147,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(245,211,147,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
            >
              Sau
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.95)',
                zIndex: 9998,
              }}
            />

            {/* Lightbox Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
              }}
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="hover-scale-rotate"
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: 24,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                }}
              >
                <i className="ri-close-line" />
              </button>

              {/* Navigation Buttons */}
              {filteredImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="hover-nav-left"
                    style={{
                      position: 'absolute',
                      left: 20,
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontSize: 28,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className="ri-arrow-left-s-line" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="hover-nav-right"
                    style={{
                      position: 'absolute',
                      right: 20,
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontSize: 28,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className="ri-arrow-right-s-line" />
                  </button>
                </>
              )}

              {/* Image Container */}
              <div style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}>
                <motion.div
                  key={lightboxImage.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(85vh - 100px)',
                    borderRadius: 12,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  <OptimizedImage
                    src={getImageUrl(lightboxImage.url)}
                    alt={lightboxImage.alt || ''}
                    loading="eager"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 'calc(85vh - 100px)',
                      borderRadius: 12,
                    }}
                  />
                </motion.div>

                {/* Info */}
                {(lightboxImage.caption || lightboxImage.alt) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      textAlign: 'center',
                      maxWidth: 600,
                      padding: 20,
                      background: 'rgba(12,12,16,0.95)',
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {lightboxImage.alt && (
                      <h2 style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#F5D393',
                        marginBottom: 8,
                        fontFamily: 'Playfair Display, serif',
                      }}>
                        {lightboxImage.alt}
                      </h2>
                    )}
                    {lightboxImage.caption && (
                      <p style={{
                        fontSize: 16,
                        color: 'rgba(255,255,255,0.7)',
                        margin: 0,
                        lineHeight: 1.6,
                      }}>
                        {lightboxImage.caption}
                      </p>
                    )}
                    <div style={{
                      marginTop: 12,
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.5)',
                    }}>
                      {lightboxIndex + 1} / {filteredImages.length}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Render sections from page data */}
      {page?.sections && page.sections.length > 0 && (
        <div style={{ maxWidth: 1400, margin: '60px auto 0', padding: '0 24px' }}>
          {page.sections
            .filter((s) => 
              s.kind !== 'HERO_SIMPLE' && // Already rendered above
              s.kind !== 'FAB_ACTIONS' && 
              s.kind !== 'GALLERY' // Already showing gallery above
            )
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((s, index) => {
              const rendered = renderSection(s);
              if (!rendered) return null;
              
              const shouldLazy = index >= 2;
              
              return shouldLazy ? (
                <LazySection key={s.id} rootMargin="300px">
                  <div style={{ marginBottom: 40 }}>{rendered}</div>
                </LazySection>
              ) : (
                <div key={s.id} style={{ marginBottom: 40 }}>{rendered}</div>
              );
            })}
        </div>
      )}

      {/* CSS for hover effect */}
      <style>{`
        .gallery-overlay {
          opacity: 0;
        }
        *:hover > .gallery-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </section>
  );
});
