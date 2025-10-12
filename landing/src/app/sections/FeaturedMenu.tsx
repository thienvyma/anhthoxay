import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { useQuery } from '@tanstack/react-query';
import { menuAPI } from '../api';
import { useReducedMotion, getAnimationConfig } from '../utils/useReducedMotion';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string | null;
  category?: { name: string; slug: string; icon?: string } | null;
  tags: string | null;
  isVegetarian: boolean;
  isSpicy: boolean;
  popular: boolean;
  available: boolean;
}

interface FeaturedMenuData {
  title?: string;
  subtitle?: string;
  limit?: number; // Max items to show, default 6
  showOnlyPopular?: boolean; // Only show popular items
  autoPlayInterval?: number; // milliseconds, default 4000
  ctaText?: string; // CTA button text
  ctaLink?: string; // CTA button link
}

export const FeaturedMenu = memo(function FeaturedMenu({ data }: { data: FeaturedMenuData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  const shouldReduce = useReducedMotion();
  const animConfig = getAnimationConfig(shouldReduce);

  const limit = data.limit || 6;
  const showOnlyPopular = data.showOnlyPopular !== false;
  const autoPlayInterval = data.autoPlayInterval || 6000; // Increased from 4s to 6s

  // Fetch menu items with React Query
  const { data: allItems = [], isLoading: loading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: menuAPI.getItems,
  });

  // Filter and limit items
  const menuItems = useMemo(() => {
    // Filter: available items, optionally only popular
    let filtered = allItems.filter((item: MenuItem) => item.available);
    if (showOnlyPopular) {
      filtered = filtered.filter((item: MenuItem) => item.popular);
    }
    
    // Limit number of items
    return filtered.slice(0, limit);
  }, [allItems, showOnlyPopular, limit]);

  // Auto-play slideshow
  useEffect(() => {
    if (menuItems.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % menuItems.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [menuItems.length, autoPlayInterval, isPaused]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % menuItems.length);
  };

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
  };

  if (menuItems.length === 0) {
    return null;
  }

  const currentItem = menuItems[currentIndex];

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={shouldReduce ? {} : { opacity: 0, y: 40 }}
        whileInView={shouldReduce ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={animConfig.transition}
      >
      {/* Section Header */}
      {(data.title || data.subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {data.title && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{
                color: tokens.color.muted,
                maxWidth: 600,
                margin: '0 auto',
                fontSize: 16,
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
          maxWidth: 1200,
          margin: '0 auto',
          height: 600,
          borderRadius: tokens.radius.xl,
          overflow: 'hidden',
          background: tokens.color.surface,
          boxShadow: tokens.shadow.lg,
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        ref={slideRef}
      >
        {/* Current Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            {/* Image Side */}
            <div
              style={{
                flex: '0 0 60%',
                position: 'relative',
                backgroundImage: `url(${getImageUrl(currentItem.imageUrl)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Image Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, transparent 0%, rgba(19,19,22,0.95) 100%)',
                }}
              />

              {/* Badges - Simplified animation */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{ position: 'absolute', top: 24, left: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}
              >
                {currentItem.popular && (
                  <div
                    style={{
                      padding: '8px 16px',
                      background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                      color: '#111',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: tokens.radius.pill,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <i className="ri-fire-fill" />
                    Popular
                  </div>
                )}

                {currentItem.isVegetarian && (
                  <div
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(16, 185, 129, 0.9)',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: tokens.radius.pill,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <i className="ri-leaf-line" />
                    Chay
                  </div>
                )}

                {currentItem.isSpicy && (
                  <div
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: tokens.radius.pill,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <i className="ri-fire-line" />
                    Cay
                  </div>
                )}

                {currentItem.category && (
                  <div
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: tokens.color.text,
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: tokens.radius.pill,
                      border: `1px solid ${tokens.color.border}`,
                    }}
                  >
                    {currentItem.category.icon && <i className={currentItem.category.icon} style={{ marginRight: 6 }} />}
                    {currentItem.category.name}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Content Side */}
            <div
              style={{
                flex: '0 0 40%',
                padding: 48,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontSize: 36,
                  fontFamily: tokens.font.display,
                  fontWeight: 700,
                  color: tokens.color.primary,
                  marginBottom: 16,
                  lineHeight: 1.2,
                }}
              >
                {currentItem.name}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: 16,
                  color: tokens.color.muted,
                  lineHeight: 1.8,
                  marginBottom: 24,
                }}
              >
                {currentItem.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  fontSize: 48,
                  fontFamily: tokens.font.display,
                  fontWeight: 700,
                  color: tokens.color.primary,
                  marginBottom: 32,
                }}
              >
                {currentItem.price.toLocaleString('vi-VN')}đ
              </motion.div>

              {/* Tags */}
              {currentItem.tags && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 24,
                  }}
                >
                  {currentItem.tags.split(',').map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${tokens.color.border}`,
                        borderRadius: tokens.radius.sm,
                        fontSize: 12,
                        color: tokens.color.muted,
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* CTA Button */}
              {(data.ctaText || data.ctaLink) && (
                <motion.a
                  href={data.ctaLink || '#reservation'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '16px 32px',
                    background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                    color: '#111',
                    borderRadius: tokens.radius.pill,
                    fontSize: 16,
                    fontWeight: 700,
                    textDecoration: 'none',
                    alignSelf: 'flex-start',
                    boxShadow: tokens.shadow.md,
                  }}
                >
                  {data.ctaText || 'Đặt bàn ngay'}
                  <i className="ri-restaurant-2-line" />
                </motion.a>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {menuItems.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1, background: tokens.color.primary }}
              whileTap={{ scale: 0.9 }}
              onClick={goToPrevious}
              style={{
                position: 'absolute',
                left: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(11,12,15,0.85)',
                border: `2px solid ${tokens.color.border}`,
                color: tokens.color.text,
                fontSize: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.3s ease',
              }}
              aria-label="Previous dish"
            >
              <i className="ri-arrow-left-s-line" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, background: tokens.color.primary }}
              whileTap={{ scale: 0.9 }}
              onClick={goToNext}
              style={{
                position: 'absolute',
                right: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(11,12,15,0.85)',
                border: `2px solid ${tokens.color.border}`,
                color: tokens.color.text,
                fontSize: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.3s ease',
              }}
              aria-label="Next dish"
            >
              <i className="ri-arrow-right-s-line" />
            </motion.button>
          </>
        )}

        {/* Dots Indicator */}
        {menuItems.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 12,
              zIndex: 10,
            }}
          >
            {menuItems.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                whileHover={{ scale: 1.2 }}
                style={{
                  width: currentIndex === index ? 40 : 12,
                  height: 12,
                  borderRadius: tokens.radius.pill,
                  background: currentIndex === index ? tokens.color.primary : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Play/Pause Indicator */}
        {menuItems.length > 1 && (
          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.75)',
              borderRadius: tokens.radius.sm,
              color: tokens.color.muted,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 10,
            }}
          >
            <i className={isPaused ? 'ri-pause-line' : 'ri-play-line'} />
            {isPaused ? 'Paused' : 'Auto-play'}
          </div>
        )}
      </div>

      {/* Thumbnails Preview */}
      {menuItems.length > 1 && (
        <div
          style={{
            maxWidth: 1200,
            margin: '32px auto 0',
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            padding: '0 16px 16px',
            scrollbarWidth: 'thin',
          }}
        >
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => goToSlide(index)}
              style={{
                flex: '0 0 120px',
                height: 80,
                borderRadius: tokens.radius.md,
                overflow: 'hidden',
                border: currentIndex === index ? `3px solid ${tokens.color.primary}` : `2px solid ${tokens.color.border}`,
                background: `url(${getImageUrl(item.imageUrl)}) center/cover`,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                opacity: currentIndex === index ? 1 : 0.5,
                transform: currentIndex === index ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: currentIndex === index ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'white',
                  padding: 8,
                  textAlign: 'center',
                }}
              >
                {item.name}
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.section>
    </div>
  );
});

