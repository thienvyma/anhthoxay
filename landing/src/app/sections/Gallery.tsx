import { useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import { galleryAPI } from '../api';
import { useReducedMotion, getAnimationConfig } from '../utils/useReducedMotion';

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  isFeatured: boolean;
  displayOrder: number | null;
  tags: string | null;
}

interface GalleryData {
  title?: string;
  subtitle?: string;
  columns?: number; // 2, 3, or 4 columns, default 3
  limit?: number; // Max images to show, default 12
  showOnlyFeatured?: boolean; // Only show featured images
  filterByTag?: string; // Filter by specific tag
}

export const Gallery = memo(function Gallery({ data }: { data: GalleryData }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  const shouldReduce = useReducedMotion();
  const animConfig = getAnimationConfig(shouldReduce);

  const columns = data.columns || 3;
  const limit = data.limit || 12;
  const showOnlyFeatured = data.showOnlyFeatured || false;

  // Fetch gallery images with React Query
  const { data: allImages = [], isLoading: loading } = useQuery({
    queryKey: ['gallery'],
    queryFn: galleryAPI.getImages,
  });

  // Filter and sort images
  const images = useMemo(() => {
    let filtered = allImages;
    
    if (showOnlyFeatured) {
      filtered = filtered.filter((img: GalleryImage) => img.isFeatured);
    }
    
    if (data.filterByTag) {
      filtered = filtered.filter((img: GalleryImage) => 
        img.tags && img.tags.split(',').map(t => t.trim().toLowerCase()).includes(data.filterByTag!.toLowerCase())
      );
    }
    
    // Sort by display order, then slice
    const sorted = filtered.sort((a: GalleryImage, b: GalleryImage) => 
      (a.displayOrder || 999) - (b.displayOrder || 999)
    );
    
    return sorted.slice(0, limit);
  }, [allImages, showOnlyFeatured, data.filterByTag, limit]);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:4202${url}`;
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <i
          className="ri-loader-4-line spinner"
          style={{ fontSize: 40, color: tokens.color.primary }}
        />
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={shouldReduce ? {} : { opacity: 0, y: 40 }}
        whileInView={shouldReduce ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={animConfig.transition}
        style={{
          padding: '60px 20px',
          background: tokens.color.background,
        }}
      >
        {/* Header */}
        {(data.title || data.subtitle) && (
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            {data.title && (
              <motion.h2
                initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
                whileInView={shouldReduce ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={animConfig.transition}
                style={{
                  fontSize: tokens.font.size.h2,
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
                initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
                whileInView={shouldReduce ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={shouldReduce ? animConfig.transition : { delay: 0.1, ...animConfig.transition }}
                style={{
                  fontSize: 16,
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
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "50px" }}
          variants={
            shouldReduce
              ? { hidden: {}, visible: {} }
              : {
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }
          }
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${columns === 4 ? '280px' : columns === 2 ? '450px' : '350px'}, 1fr))`,
            gap: 20,
          }}
        >
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              variants={
                shouldReduce
                  ? { hidden: {}, visible: {} }
                  : {
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                    }
              }
              onClick={() => setSelectedImage(index)}
              onMouseEnter={() => setHoveredImage(index)}
              onMouseLeave={() => setHoveredImage(null)}
              className="gallery-section-card"
              style={{
                position: 'relative',
                aspectRatio: '1',
                overflow: 'hidden',
                borderRadius: tokens.radius.lg,
                cursor: 'pointer',
                border: `2px solid ${hoveredImage === index ? tokens.color.primary : tokens.color.border}`,
                transition: 'border-color 0.3s ease, transform 0.3s ease',
                transform: hoveredImage === index ? 'translateY(-4px)' : 'translateY(0)',
              }}
            >
              <img
                src={getImageUrl(image.url)}
                alt={image.alt || image.caption || `Gallery image ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                  transform: hoveredImage === index ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              
              {/* Hover Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                  opacity: hoveredImage === index ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 20,
                }}
              >
                {image.caption && (
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                    {image.caption}
                  </div>
                )}
                {image.tags && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {image.tags.split(',').slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '3px 8px',
                          background: 'rgba(245, 211, 147, 0.2)',
                          border: `1px solid ${tokens.color.primary}`,
                          borderRadius: tokens.radius.sm,
                          fontSize: 11,
                          color: tokens.color.primary,
                          fontWeight: 600,
                        }}
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* View Icon */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: hoveredImage === index ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  color: tokens.color.primary,
                  fontSize: 18,
                }}
              >
                <i className="ri-zoom-in-line" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.95)',
              zIndex: tokens.zIndex.modal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="hover-scale-rotate"
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                background: 'rgba(255,255,255,0.15)',
                border: `2px solid ${tokens.color.border}`,
                color: '#fff',
                fontSize: 28,
                width: 56,
                height: 56,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <i className="ri-close-line" />
            </button>

            {/* Image */}
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <OptimizedImage
                src={getImageUrl(images[selectedImage].url)}
                alt={images[selectedImage].alt || images[selectedImage].caption || 'Gallery image'}
                loading="eager"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: tokens.radius.lg,
                  boxShadow: tokens.shadow.lg,
                }}
              />
            </motion.div>

            {/* Image Info */}
            {(images[selectedImage].caption || images[selectedImage].tags) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.2 }}
                style={{
                  position: 'absolute',
                  bottom: 40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  maxWidth: 600,
                  padding: 24,
                  background: 'rgba(19, 19, 22, 0.95)',
                  borderRadius: tokens.radius.lg,
                  border: `1px solid ${tokens.color.border}`,
                  textAlign: 'center',
                }}
              >
                {images[selectedImage].caption && (
                  <div style={{ fontSize: 18, fontWeight: 600, color: tokens.color.primary, marginBottom: 12 }}>
                    {images[selectedImage].caption}
                  </div>
                )}
                {images[selectedImage].tags && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {images[selectedImage].tags!.split(',').map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(245, 211, 147, 0.15)',
                          border: `1px solid ${tokens.color.primary}`,
                          borderRadius: tokens.radius.pill,
                          fontSize: 13,
                          color: tokens.color.primary,
                          fontWeight: 600,
                        }}
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            {selectedImage > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(selectedImage - 1);
                }}
                className="hover-nav-left"
                style={{
                  position: 'absolute',
                  left: 24,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)',
                  border: `2px solid ${tokens.color.border}`,
                  color: '#fff',
                  fontSize: 32,
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="ri-arrow-left-s-line" />
              </button>
            )}

            {selectedImage < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(selectedImage + 1);
                }}
                className="hover-nav-right"
                style={{
                  position: 'absolute',
                  right: 24,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)',
                  border: `2px solid ${tokens.color.border}`,
                  color: '#fff',
                  fontSize: 32,
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="ri-arrow-right-s-line" />
              </button>
            )}

            {/* Image Counter */}
            <div
              style={{
                position: 'absolute',
                top: 24,
                left: 24,
                padding: '12px 20px',
                background: 'rgba(19, 19, 22, 0.95)',
                borderRadius: tokens.radius.pill,
                border: `1px solid ${tokens.color.border}`,
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {selectedImage + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.section>
    </div>
  );
});

