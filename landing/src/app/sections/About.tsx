import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

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
  layout?: 'left' | 'right'; // Image position
}

export function About({ data }: { data: AboutData }) {
  const navigate = useNavigate();
  const {
    badge = 'Về Chúng Tôi',
    title = 'Nội Thất Nhanh - Đối Tác Tin Cậy',
    description = '',
    imageUrl = '',
    features = [],
    ctaText = '',
    ctaLink = '',
    layout = 'right',
  } = data;

  // Resolve image URL (handle relative paths from media upload)
  const resolvedImageUrl = imageUrl ? resolveMediaUrl(imageUrl) : '';

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
      if (link.startsWith('/')) {
        e.preventDefault();
        navigate(link);
      }
    },
    [navigate]
  );

  const hasImage = !!resolvedImageUrl;

  return (
    <section
      style={{
        position: 'relative',
        padding: 'clamp(60px, 10vw, 100px) clamp(16px, 5vw, 40px)',
        background: tokens.color.background,
        overflow: 'hidden',
      }}
    >
      {/* Subtle background decoration */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: layout === 'right' ? 0 : 'auto',
          left: layout === 'left' ? 0 : 'auto',
          width: '50%',
          height: '100%',
          background: `linear-gradient(${layout === 'right' ? '270deg' : '90deg'}, transparent, ${tokens.color.primary}05)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: hasImage
            ? 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))'
            : '1fr',
          gap: 'clamp(40px, 8vw, 80px)',
          alignItems: 'center',
        }}
      >
        {/* Content - order based on layout */}
        <motion.div
          initial={{ opacity: 0, x: layout === 'right' ? -30 : 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ order: layout === 'right' ? 1 : 2 }}
        >
          {badge && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                display: 'inline-block',
                padding: '8px 18px',
                background: `${tokens.color.primary}15`,
                color: tokens.color.primary,
                borderRadius: tokens.radius.pill,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
                letterSpacing: '0.5px',
              }}
            >
              {badge}
            </motion.span>
          )}

          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontFamily: tokens.font.display,
              fontWeight: 700,
              color: tokens.color.text,
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            {title}
          </h2>

          {description && (
            <p
              style={{
                fontSize: 'clamp(15px, 2vw, 17px)',
                color: tokens.color.textMuted,
                lineHeight: 1.8,
                marginBottom: features.length > 0 ? 36 : 28,
              }}
            >
              {description}
            </p>
          )}

          {/* Features list */}
          {features.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                marginBottom: 36,
              }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: tokens.radius.md,
                      background: `${tokens.color.primary}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className={feature.icon || 'ri-check-line'}
                      style={{ fontSize: 20, color: tokens.color.primary }}
                    />
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: tokens.color.text,
                        marginBottom: 6,
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
          )}

          {/* CTA Button */}
          {ctaText && ctaLink && (
            <motion.a
              href={ctaLink}
              onClick={(e) => handleLinkClick(e, ctaLink)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 32px',
                background: tokens.color.primary,
                color: '#111',
                borderRadius: tokens.radius.pill,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: `0 4px 20px ${tokens.color.primary}40`,
                transition: 'box-shadow 0.3s ease',
              }}
            >
              {ctaText}
              <i className="ri-arrow-right-line" style={{ fontSize: 18 }} />
            </motion.a>
          )}
        </motion.div>

        {/* Image */}
        {hasImage && (
          <motion.div
            initial={{ opacity: 0, x: layout === 'right' ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              order: layout === 'right' ? 2 : 1,
              position: 'relative',
            }}
          >
            {/* Decorative frame */}
            <div
              style={{
                position: 'absolute',
                top: -12,
                left: layout === 'right' ? -12 : 'auto',
                right: layout === 'left' ? -12 : 'auto',
                width: '100%',
                height: '100%',
                border: `2px solid ${tokens.color.primary}30`,
                borderRadius: tokens.radius.xl,
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'relative',
                borderRadius: tokens.radius.xl,
                overflow: 'hidden',
                boxShadow: tokens.shadow.lg,
              }}
            >
              <img
                src={resolvedImageUrl}
                alt={title}
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: 300,
                  maxHeight: 500,
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  // Hide image container if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />

              {/* Overlay gradient */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '30%',
                  background: `linear-gradient(to top, ${tokens.color.background}80, transparent)`,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
