import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

interface HeroSimpleData {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  backgroundOverlay?: number; // 0-100
  textAlign?: 'left' | 'center' | 'right';
}

/**
 * Simple Hero Section for secondary pages (Contact, Menu, About, Gallery, Blog)
 * Lightweight alternative to EnhancedHero with cleaner design
 */
export function HeroSimple({ data }: { data: HeroSimpleData }) {
  const {
    title,
    subtitle,
    description,
    backgroundImage,
    backgroundOverlay = 60,
    textAlign = 'center',
  } = data;

  return (
    <section
      style={{
        position: 'relative',
        background: backgroundImage
          ? `linear-gradient(rgba(0,0,0,${backgroundOverlay / 100}), rgba(0,0,0,${backgroundOverlay / 100})), url(${backgroundImage})`
          : 'radial-gradient(1000px 400px at 50% 0%, rgba(245,211,147,0.08) 0%, transparent 70%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 'clamp(80px, 12vh, 120px)',
        paddingBottom: 'clamp(60px, 10vh, 100px)',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Gradient */}
      {!backgroundImage && (
        <motion.div
          animate={{
            background: [
              'radial-gradient(600px circle at 20% 30%, rgba(245,211,147,0.15), transparent 50%)',
              'radial-gradient(600px circle at 80% 70%, rgba(245,211,147,0.15), transparent 50%)',
              'radial-gradient(600px circle at 20% 30%, rgba(245,211,147,0.15), transparent 50%)',
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
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Content Container */}
      <div
        style={{
          position: 'relative',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          textAlign,
        }}
      >
        {/* Subtitle */}
        {subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'inline-block',
              padding: 'clamp(6px, 1vw, 8px) clamp(14px, 2vw, 20px)',
              background: 'rgba(245,211,147,0.1)',
              border: '1px solid rgba(245,211,147,0.3)',
              borderRadius: tokens.radius.pill,
              fontSize: 'clamp(11px, 1.5vw, 14px)',
              fontWeight: 600,
              color: tokens.color.primary,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            {subtitle}
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 3.5rem)',
            fontFamily: 'Playfair Display, serif',
            color: tokens.color.primary,
            marginBottom: description ? 16 : 0,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {title}
        </motion.h1>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.125rem)',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: 700,
              margin: textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0',
              lineHeight: 1.6,
            }}
          >
            {description}
          </motion.p>
        )}
      </div>

      {/* Bottom Fade */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          background: 'linear-gradient(to bottom, transparent, rgba(10,10,13,0.5))',
          pointerEvents: 'none',
        }}
      />
    </section>
  );
}

