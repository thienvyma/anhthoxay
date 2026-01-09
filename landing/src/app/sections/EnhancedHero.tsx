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
      margin: '60px auto 0', // Reduced from 80px for mobile
      padding: '0 12px' 
    }}>
      <motion.section
        ref={ref}
        style={{
          position: 'relative',
          height: 'clamp(280px, 50vh, 600px)', // Responsive height: smaller on mobile
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

      {/* Animated Light Effect - White/Light color for contrast */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(600px circle at 20% 30%, rgba(255,255,255,0.08), transparent 50%)',
            'radial-gradient(600px circle at 80% 60%, rgba(255,255,255,0.10), transparent 50%)',
            'radial-gradient(600px circle at 50% 80%, rgba(255,255,255,0.06), transparent 50%)',
            'radial-gradient(600px circle at 20% 30%, rgba(255,255,255,0.08), transparent 50%)',
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          borderRadius: tokens.radius.xl,
          pointerEvents: 'none',
        }}
      />

      {/* Secondary Light Orb - Soft white glow */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(500px circle at 70% 20%, rgba(255,255,255,0.05), transparent 60%)',
            'radial-gradient(500px circle at 30% 70%, rgba(255,255,255,0.07), transparent 60%)',
            'radial-gradient(500px circle at 70% 20%, rgba(255,255,255,0.05), transparent 60%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          borderRadius: tokens.radius.xl,
          pointerEvents: 'none',
        }}
      />

      {/* Accent Light Streak - Moving highlight */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 3,
        }}
        style={{
          position: 'absolute',
          top: '20%',
          left: 0,
          width: '30%',
          height: '60%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
          zIndex: 0,
          borderRadius: tokens.radius.xl,
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />

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
            fontSize: 'clamp(26px, 5vw, 52px)',
            fontFamily: tokens.font.display,
            color: tokens.color.primary,
            marginBottom: 12,
            lineHeight: 1.15,
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
              fontSize: 'clamp(14px, 2vw, 18px)',
              color: tokens.color.text,
              marginBottom: 20,
              maxWidth: '700px',
              margin: '0 auto 20px',
              textShadow: '0 4px 16px rgba(0,0,0,0.7)',
              lineHeight: 1.5,
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
              gap: 8,
              background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
              color: '#111',
              padding: 'clamp(10px, 1.5vw, 14px) clamp(20px, 4vw, 32px)',
              borderRadius: tokens.radius.pill,
              fontSize: 'clamp(13px, 1.8vw, 16px)',
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

      {/* Scroll Indicator - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="desktop-only"
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: tokens.color.muted,
        }}
      >
        <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 }}>Scroll</span>
        <i
          className="ri-arrow-down-line"
          style={{ fontSize: 16 }}
        />
      </motion.div>
    </motion.section>
    </div>
  );
});

