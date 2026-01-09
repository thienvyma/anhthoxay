import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

interface AboutData {
  badge?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  features?: Array<{
    _id?: string;
    icon: string;
    title: string;
    description: string;
  }>;
  ctaText?: string;
  ctaLink?: string;
}

export function About({ data }: { data: AboutData }) {
  const {
    badge = 'Về Chúng Tôi',
    title = 'Nội Thất Nhanh - Đối Tác Tin Cậy',
    description = '',
    imageUrl = '',
    features = [],
    ctaText = '',
    ctaLink = '',
  } = data;

  return (
    <section
      style={{
        padding: 'clamp(60px, 10vw, 100px) clamp(16px, 5vw, 40px)',
        background: tokens.color.background,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: imageUrl ? 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' : '1fr',
          gap: 'clamp(32px, 6vw, 60px)',
          alignItems: 'center',
        }}
      >
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {badge && (
            <span
              style={{
                display: 'inline-block',
                padding: '6px 16px',
                background: `${tokens.color.primary}15`,
                color: tokens.color.primary,
                borderRadius: tokens.radius.pill,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {badge}
            </span>
          )}

          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 700,
              color: tokens.color.text,
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {title}
          </h2>

          {description && (
            <p
              style={{
                fontSize: 'clamp(15px, 2vw, 17px)',
                color: tokens.color.muted,
                lineHeight: 1.7,
                marginBottom: features.length > 0 ? 32 : 24,
              }}
            >
              {description}
            </p>
          )}

          {/* Features list */}
          {features.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {features.map((feature, index) => (
                <motion.div
                  key={feature._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: tokens.radius.md,
                      background: `${tokens.color.primary}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <i className={feature.icon} style={{ fontSize: 18, color: tokens.color.primary }} />
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: tokens.color.text,
                        marginBottom: 4,
                      }}
                    >
                      {feature.title}
                    </h4>
                    <p style={{ fontSize: 14, color: tokens.color.muted, lineHeight: 1.5, margin: 0 }}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA Button */}
          {ctaText && ctaLink && (
            <motion.a
              href={ctaLink}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                background: tokens.color.primary,
                color: '#111',
                borderRadius: tokens.radius.md,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {ctaText}
              <i className="ri-arrow-right-line" />
            </motion.a>
          )}
        </motion.div>

        {/* Image */}
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img
              src={imageUrl}
              alt={title}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: tokens.radius.lg,
                objectFit: 'cover',
                boxShadow: tokens.shadow.md,
              }}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}
