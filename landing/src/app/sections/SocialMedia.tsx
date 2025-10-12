import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

interface SocialMediaData {
  title?: string;
  subtitle?: string;
  links: Array<{
    platform: string;
    url: string;
    icon: string;
  }>;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

export const SocialMedia = memo(function SocialMedia({ data }: { data: SocialMediaData }) {
  const layout = data.layout || 'horizontal';

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          padding: '60px 24px',
          background: `linear-gradient(135deg, ${tokens.color.surface} 0%, rgba(19,19,22,0.8) 100%)`,
          borderRadius: tokens.radius.xl,
          border: `1px solid ${tokens.color.border}`,
          textAlign: 'center',
        }}
      >
      {/* Header */}
      {(data.title || data.subtitle) && (
        <div style={{ marginBottom: 40 }}>
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
                fontSize: 16,
              }}
            >
              {data.subtitle}
            </motion.p>
          )}
        </div>
      )}

      {/* Social Links */}
      <div
        style={{
          display: 'flex',
          gap: layout === 'grid' ? 20 : 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
          ...(layout === 'vertical' && { flexDirection: 'column', alignItems: 'center' }),
          ...(layout === 'grid' && { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', maxWidth: 600, margin: '0 auto' }),
        }}
      >
        {data.links?.map((link, index) => (
          <motion.a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.15, y: -4, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: layout === 'grid' ? 64 : 56,
              height: layout === 'grid' ? 64 : 56,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#111',
              fontSize: layout === 'grid' ? 28 : 24,
              textDecoration: 'none',
              boxShadow: tokens.shadow.md,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow effect */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          />
          <i className={link.icon} style={{ position: 'relative', zIndex: 1 }} />
        </motion.a>
      ))}
    </div>
      </motion.section>
    </div>
  );
});

