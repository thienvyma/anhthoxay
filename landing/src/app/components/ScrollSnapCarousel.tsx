import { ReactNode, useRef, useState, useEffect } from 'react';
import { tokens } from '@app/shared';

interface ScrollSnapCarouselProps {
  children: ReactNode[];
  autoplay?: boolean;
  autoplayDelay?: number;
  showNavigation?: boolean;
  showPagination?: boolean;
  slidesPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: number;
}

/**
 * Lightweight CSS scroll-snap carousel
 * Replaces Swiper with native browser features (-120KB!)
 */
export function ScrollSnapCarousel({
  children,
  autoplay = false,
  autoplayDelay = 5000,
  showNavigation = true,
  showPagination = true,
  slidesPerView = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 20,
}: ScrollSnapCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = children.length;
  const slides = Array.from(children);

  // Detect current slide from scroll position
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const slideWidth = scrollContainer.clientWidth;
      const newIndex = Math.round(scrollLeft / slideWidth);
      setCurrentIndex(newIndex);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Autoplay logic
  useEffect(() => {
    if (!autoplay || isPaused || !scrollRef.current) return;

    const interval = setInterval(() => {
      goToSlide((currentIndex + 1) % totalSlides);
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [autoplay, autoplayDelay, currentIndex, isPaused, totalSlides]);

  const goToSlide = (index: number) => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const slideWidth = scrollContainer.clientWidth;
    scrollContainer.scrollTo({
      left: slideWidth * index,
      behavior: 'smooth',
    });
  };

  const goNext = () => {
    goToSlide((currentIndex + 1) % totalSlides);
  };

  const goPrev = () => {
    goToSlide((currentIndex - 1 + totalSlides) % totalSlides);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          gap,
          paddingBottom: showPagination ? 50 : 20,
          // Hide scrollbar
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        className="scroll-snap-carousel"
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              flex: '0 0 auto',
              width: `calc((100% - ${gap * (slidesPerView.mobile - 1)}px) / ${slidesPerView.mobile})`,
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
            className="carousel-slide"
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {showNavigation && totalSlides > slidesPerView.desktop && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous slide"
            style={{
              position: 'absolute',
              top: '50%',
              left: -20,
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surface,
              color: tokens.color.text,
              fontSize: 24,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tokens.color.primary;
              e.currentTarget.style.borderColor = tokens.color.primary;
              e.currentTarget.style.color = '#111';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = tokens.color.surface;
              e.currentTarget.style.borderColor = tokens.color.border;
              e.currentTarget.style.color = tokens.color.text;
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <i className="ri-arrow-left-s-line" />
          </button>

          <button
            onClick={goNext}
            aria-label="Next slide"
            style={{
              position: 'absolute',
              top: '50%',
              right: -20,
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surface,
              color: tokens.color.text,
              fontSize: 24,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tokens.color.primary;
              e.currentTarget.style.borderColor = tokens.color.primary;
              e.currentTarget.style.color = '#111';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = tokens.color.surface;
              e.currentTarget.style.borderColor = tokens.color.border;
              e.currentTarget.style.color = tokens.color.text;
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <i className="ri-arrow-right-s-line" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {showPagination && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            padding: '12px 20px',
          }}
        >
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: currentIndex === i ? 32 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                background:
                  currentIndex === i
                    ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`
                    : tokens.color.border,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                if (currentIndex !== i) {
                  e.currentTarget.style.background = tokens.color.muted;
                }
              }}
              onMouseLeave={(e) => {
                if (currentIndex !== i) {
                  e.currentTarget.style.background = tokens.color.border;
                }
              }}
            />
          ))}
        </div>
      )}

      {/* CSS for responsive slides & hide scrollbar */}
      <style>{`
        .scroll-snap-carousel::-webkit-scrollbar {
          display: none;
        }

        @media (min-width: 640px) {
          .carousel-slide {
            width: calc((100% - ${gap * (slidesPerView.tablet - 1)}px) / ${slidesPerView.tablet}) !important;
          }
        }

        @media (min-width: 1024px) {
          .carousel-slide {
            width: calc((100% - ${gap * (slidesPerView.desktop - 1)}px) / ${slidesPerView.desktop}) !important;
          }
        }
      `}</style>
    </div>
  );
}

