/**
 * Media Gallery Section
 * Displays all media images with pagination
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
  const [selectedImage, setSelectedImage] = useState<MediaAsset | null>(null);

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

  const openLightbox = useCallback((image: MediaAsset) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
    document.body.style.overflow = '';
  }, []);

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
              onClick={() => openLightbox(image)}
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

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.9)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeLightbox}
                style={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 24,
                }}
              >
                <i className="ri-close-line" />
              </motion.button>
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={resolveMediaUrl(selectedImage.url)}
                alt={selectedImage.alt || ''}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: tokens.radius.md,
                }}
              />
              {selectedImage.caption && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '12px 24px',
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: tokens.radius.md,
                    color: '#fff',
                    fontSize: 16,
                    maxWidth: '80vw',
                    textAlign: 'center',
                  }}
                >
                  {selectedImage.caption}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSS for hover effect */}
        <style>{`
          .gallery-overlay:hover {
            opacity: 1 !important;
          }
          
          @media (max-width: 768px) {
            .gallery-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          
          @media (max-width: 480px) {
            .gallery-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
});

export default MediaGallery;
