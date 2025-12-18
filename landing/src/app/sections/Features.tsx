import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { glassEffect } from '../styles/glassEffect';

interface FeaturesData {
  title?: string;
  subtitle?: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  layout?: 'grid' | 'list';
}

export const Features = memo(function Features({ data }: { data: FeaturesData }) {
  const layout = data.layout || 'grid';

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          padding: '60px 24px',
          background: 'radial-gradient(800px 400px at 50% 50%, rgba(245,211,147,0.05) 0%, transparent 70%)',
          borderRadius: tokens.radius.xl,
          border: `1px solid ${tokens.color.border}`,
        }}
      >
      {/* Header */}
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
                fontSize: 16,
                maxWidth: 600,
                margin: '0 auto',
              }}
            >
              {data.subtitle}
            </motion.p>
          )}
        </div>
      )}

      {/* Features */}
      <div
        className="features-grid"
        style={{
          display: layout === 'grid' ? 'grid' : 'flex',
          ...(layout === 'grid' && {
            // Responsive: 2 cols on tablet, 3-4 on desktop
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 20,
          }),
          ...(layout === 'list' && {
            flexDirection: 'column',
            gap: 20,
            maxWidth: 800,
            margin: '0 auto',
          }),
        }}
      >
        {data.features?.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            style={{
              ...glassEffect({ variant: 'card' }),
              padding: layout === 'grid' ? 28 : 24,
              borderRadius: tokens.radius.lg,
              textAlign: layout === 'grid' ? 'center' : 'left',
              transition: 'all 0.3s ease',
              cursor: 'default',
              ...(layout === 'list' && {
                display: 'flex',
                alignItems: 'flex-start',
                gap: 20,
              }),
            }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: index * 0.1 + 0.2 }}
              style={{
                fontSize: layout === 'grid' ? 40 : 36,
                color: tokens.color.primary,
                marginBottom: layout === 'grid' ? 16 : 0,
                display: layout === 'list' ? 'flex' : 'block',
                ...(layout === 'list' && {
                  width: 56,
                  height: 56,
                  borderRadius: tokens.radius.md,
                  background: `${tokens.color.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }),
              }}
            >
              <i className={feature.icon} />
            </motion.div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  fontSize: 18,
                  color: tokens.color.text,
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                {feature.title}
              </h4>
              <p
                style={{
                  fontSize: 14,
                  color: tokens.color.muted,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
    </div>
  );
});

