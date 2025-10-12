import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { memo } from 'react';
import { ScrollSnapCarousel } from '../components/ScrollSnapCarousel';
import { useReducedMotion } from '../utils/useReducedMotion';
import { glassEffect } from '../styles/glassEffect';

interface TestimonialItem {
  name: string;
  text: string;
  avatarMediaId?: string;
  avatarUrl?: string;
  rating?: number;
  role?: string;
  location?: string;
  date?: string;
}

interface TestimonialsData {
  title?: string;
  items: TestimonialItem[];
  autoplay?: boolean;
  layout?: 'carousel' | 'grid';
}

export const EnhancedTestimonials = memo(function EnhancedTestimonials({ data }: { data: TestimonialsData }) {
  const shouldReduce = useReducedMotion();
  const title = data.title || 'What Our Guests Say';
  const layout = data.layout || 'carousel';

  const renderStars = (rating = 5) => {
    return (
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <i
            key={i}
            className={i < rating ? 'ri-star-fill' : 'ri-star-line'}
            style={{ color: i < rating ? tokens.color.accent : tokens.color.border, fontSize: 18 }}
          />
        ))}
      </div>
    );
  };

  const renderTestimonialCard = (item: TestimonialItem, index: number) => {
    const CardWrapper = shouldReduce ? 'div' : motion.div;
    const animationProps = shouldReduce ? {} : {
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: '-50px' },
      transition: { duration: 0.4, delay: Math.min(index * 0.08, 0.3) }, // Cap delay at 0.3s
    };
    
    return (
    <CardWrapper
      key={index}
      {...animationProps}
      style={{
        ...glassEffect({ variant: 'card' }),
        padding: 28,
        borderRadius: tokens.radius.lg,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Stars */}
      {renderStars(item.rating)}

      {/* Quote */}
      <blockquote
        style={{
          color: tokens.color.text,
          fontSize: 16,
          lineHeight: 1.7,
          fontStyle: 'italic',
          marginBottom: 20,
          flex: 1,
          position: 'relative',
        }}
      >
        <i
          className="ri-double-quotes-l"
          style={{
            position: 'absolute',
            top: -10,
            left: -10,
            fontSize: 40,
            color: tokens.color.primary,
            opacity: 0.3,
          }}
        />
        <span style={{ position: 'relative', zIndex: 1 }}>{item.text}</span>
      </blockquote>

      {/* Author Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            color: '#111',
          }}
        >
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt={item.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            item.name.charAt(0).toUpperCase()
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: tokens.color.text, fontWeight: 600, fontSize: 16 }}>{item.name}</div>
          <div style={{ color: tokens.color.muted, fontSize: 13 }}>
            {item.role && <span>{item.role}</span>}
            {item.location && <span> • {item.location}</span>}
          </div>
        </div>

        {item.date && (
          <div style={{ color: tokens.color.muted, fontSize: 12 }}>
            {new Date(item.date).toLocaleDateString('vi-VN')}
          </div>
        )}
      </div>
    </CardWrapper>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <section style={{ padding: '60px 0' }}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          fontSize: tokens.font.size.h2,
          fontFamily: tokens.font.display,
          color: tokens.color.primary,
          textAlign: 'center',
          marginBottom: 40,
        }}
      >
        {title}
      </motion.h2>

      {layout === 'carousel' ? (
        <ScrollSnapCarousel
          autoplay={data.autoplay}
          autoplayDelay={5000}
          showNavigation={data.items.length > 3}
          showPagination={true}
          slidesPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap={20}
        >
          {data.items.map((item, idx) => renderTestimonialCard(item, idx))}
        </ScrollSnapCarousel>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {data.items.map((item, idx) => renderTestimonialCard(item, idx))}
        </div>
      )}

      {/* Social Proof Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          marginTop: 48,
          padding: 32,
          background: `linear-gradient(135deg, rgba(245,211,147,0.1) 0%, rgba(239,182,121,0.05) 100%)`,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 24,
          textAlign: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily: tokens.font.display,
              color: tokens.color.primary,
            }}
          >
            4.8
          </div>
          <div style={{ color: tokens.color.muted, marginTop: 8 }}>Đánh giá trung bình</div>
          <div style={{ marginTop: 8 }}>{renderStars(5)}</div>
        </div>

        <div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily: tokens.font.display,
              color: tokens.color.primary,
            }}
          >
            500+
          </div>
          <div style={{ color: tokens.color.muted, marginTop: 8 }}>Khách hàng hài lòng</div>
        </div>

        <div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily: tokens.font.display,
              color: tokens.color.primary,
            }}
          >
            5
          </div>
          <div style={{ color: tokens.color.muted, marginTop: 8 }}>Năm kinh nghiệm</div>
        </div>
      </motion.div>
    </section>
    </div>
  );
});

