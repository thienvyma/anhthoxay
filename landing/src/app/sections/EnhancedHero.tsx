import { motion, useScroll, useTransform } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { useRef, useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { shouldEnableParallax } from '../utils/deviceDetection';

interface HeroData {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundMediaId?: string;
  videoUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  cta?: { label: string; href: string };
  overlayOpacity?: number;
}

export const EnhancedHero = memo(function EnhancedHero({ data }: { data: HeroData }) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [enableParallax, setEnableParallax] = useState(false);
  
  // Check device capabilities on mount
  useEffect(() => {
    setEnableParallax(shouldEnableParallax());
  }, []);

  // Handle link click - use React Router for internal links
  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    if (link.startsWith('/')) {
      e.preventDefault();
      navigate(link);
    }
  }, [navigate]);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Reduced parallax intensity for better performance (50% → 20%)
  const y = useTransform(scrollYProgress, [0, 1], ['0%', enableParallax ? '20%' : '0%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.9, 0.7]);

  // Get CTA data from either cta object or individual fields
  const ctaLabel = data.cta?.label || data.ctaText;
  const ctaHref = data.cta?.href || data.ctaLink;

  // Fix image URL - prepend API URL if it's a relative path
  const imageUrl = resolveMediaUrl(data.imageUrl);

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '80px auto 0', // 80px top margin for spacing from header
      padding: '0 16px' 
    }}>
      <motion.section
        ref={ref}
        style={{
          position: 'relative',
          height: '60vh',
          minHeight: '400px',
          maxHeight: '700px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          isolation: 'isolate',
          borderRadius: 'clamp(12px, 2vw, 24px)',
        }}
      >
      {/* Parallax Background */}
      {data.videoUrl ? (
        <motion.video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '120%',
            objectFit: 'cover',
            zIndex: -2,
            y,
            willChange: 'transform',
            transform: 'translateZ(0)', // GPU acceleration
            borderRadius: tokens.radius.xl,
          }}
        >
          <source src={data.videoUrl} type="video/mp4" />
        </motion.video>
      ) : imageUrl ? (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '120%',
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -2,
            y,
            willChange: 'transform',
            transform: 'translateZ(0)', // GPU acceleration
            borderRadius: tokens.radius.xl,
          }}
        />
      ) : (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '120%',
            background: `linear-gradient(135deg, ${tokens.color.primary}40 0%, ${tokens.color.accent}60 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -2,
            y,
            willChange: 'transform',
            transform: 'translateZ(0)', // GPU acceleration
            borderRadius: tokens.radius.xl,
          }}
        />
      )}

      {/* Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, 
            rgba(0,0,0,${data.overlayOpacity || 0.5}) 0%, 
            rgba(0,0,0,${(data.overlayOpacity || 0.5) * 0.9}) 50%, 
            rgba(0,0,0,${(data.overlayOpacity || 0.5) * 1.1}) 100%)`,
          zIndex: -1,
          borderRadius: tokens.radius.xl,
        }}
      />

      {/* Content */}
      <motion.div
        style={{
          textAlign: 'center',
          maxWidth: '900px',
          padding: '0 clamp(16px, 4vw, 32px)',
          opacity,
          willChange: 'opacity',
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: tokens.motion.ease.outExpo }}
          style={{
            fontSize: 'clamp(32px, 6vw, 56px)',
            fontFamily: tokens.font.display,
            color: tokens.color.primary,
            marginBottom: 16,
            lineHeight: 1.1,
            textShadow: '0 8px 32px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {data.title}
        </motion.h1>

        {data.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: tokens.motion.ease.outExpo }}
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: tokens.color.text,
              marginBottom: 24,
              maxWidth: '700px',
              margin: '0 auto 24px',
              textShadow: '0 4px 16px rgba(0,0,0,0.7)',
            }}
          >
            {data.subtitle}
          </motion.p>
        )}

        {ctaLabel && ctaHref && (
          <motion.a
            href={ctaHref}
            onClick={(e) => handleLinkClick(e, ctaHref)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: tokens.motion.ease.outExpo }}
            whileHover={{ scale: 1.05, boxShadow: `0 20px 60px ${tokens.color.primary}60` }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
              color: '#111',
              padding: 'clamp(12px, 2vw, 14px) clamp(24px, 5vw, 36px)',
              borderRadius: tokens.radius.pill,
              fontSize: 'clamp(14px, 2vw, 16px)',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: `0 8px 32px ${tokens.color.primary}40`,
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            {ctaLabel}
            <i className="ri-arrow-right-line" style={{ marginLeft: 4 }} />
          </motion.a>
        )}
      </motion.div>

      {/* Scroll Indicator - Simplified without infinite animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: tokens.color.muted,
        }}
      >
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Scroll</span>
        <i
          className="ri-arrow-down-line"
          style={{ fontSize: 20 }}
        />
      </motion.div>
    </motion.section>
    </div>
  );
});

