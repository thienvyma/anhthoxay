import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

interface AboutData {
  badge?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  layout?: 'left' | 'right';
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
  const navigate = useNavigate();
  const {
    badge = 'Về Chúng Tôi',
    title = 'Nội Thất Nhanh - Đối Tác Tin Cậy',
    description = '',
    imageUrl = '',
    layout = 'right',
    features = [],
    ctaText = '',
    ctaLink = '',
  } = data;

  const resolvedImageUrl = imageUrl ? resolveMediaUrl(imageUrl) : '';
  const isImageLeft = layout === 'left';

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
      if (link.startsWith('/')) {
        e.preventDefault();
        navigate(link);
      }
    },
    [navigate]
  );

  return (
    <section
      style={{
        position: 'relative',
        padding: '100px 24px',
        margin: '80px 0',
        overflow: 'hidden',
        borderRadius: 24,
        background: `linear-gradient(135deg, ${tokens.color.primary}10, ${tokens.color.accent}05)`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 60,
          alignItems: 'center',
        }}
        className="about-grid"
      >
        {/* Content Column */}
        <motion.div
          initial={{ opacity: 0, x: isImageLeft ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ order: isImageLeft ? 2 : 1 }}
        >
          {/* Badge */}
          {badge && (
            <span
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
            </span>
          )}

          {/* Title */}
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontFamily: tokens.font.display,
              color: tokens.color.primary,
              marginBottom: 16,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              style={{
                fontSize: 16,
                color: tokens.color.textMuted,
                marginBottom: features.length > 0 ? 32 : 24,
                lineHeight: 1.7,
              }}
            >
              {description}
            </p>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginBottom: 32,
              }}
            >
              {features.map((feature, index) => (
                <div
                  key={feature._id || index}
                  style={{
                    display: 'flex',
                    gap: 12,
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
                    <i
                      className={feature.icon || 'ri-check-line'}
                      style={{ fontSize: 18, color: tokens.color.primary }}
                    />
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
                    <p
                      style={{
                        fontSize: 13,
                        color: tokens.color.muted,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Button */}
          {ctaText && ctaLink && (
            <motion.a
              href={ctaLink}
              onClick={(e) => handleLinkClick(e, ctaLink)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                background: tokens.color.primary,
                color: '#111',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {ctaText}
              <i className="ri-arrow-right-line" />
            </motion.a>
          )}
        </motion.div>

        {/* Image Column */}
        <motion.div
          initial={{ opacity: 0, x: isImageLeft ? -30 : 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ order: isImageLeft ? 1 : 2 }}
        >
          {resolvedImageUrl ? (
            <div
              style={{
                position: 'relative',
                borderRadius: tokens.radius.lg,
                overflow: 'hidden',
                aspectRatio: '4/3',
              }}
            >
              <img
                src={resolvedImageUrl}
                alt={title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                aspectRatio: '4/3',
                borderRadius: tokens.radius.lg,
                background: `${tokens.color.primary}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i
                className="ri-image-line"
                style={{ fontSize: 64, color: tokens.color.primary, opacity: 0.3 }}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .about-grid > div {
            order: unset !important;
          }
        }
      `}</style>
    </section>
  );
}
