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
  } = data;

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
      {/* Background Image (if provided) */}
      {resolvedImageUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${resolvedImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            zIndex: 0,
          }}
        />
      )}

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 800,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        {/* Badge */}
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

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontFamily: tokens.font.display,
            color: tokens.color.primary,
            marginBottom: 16,
            fontWeight: 700,
          }}
        >
          {title}
        </motion.h2>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: 18,
              color: tokens.color.textMuted,
              marginBottom: features.length > 0 ? 40 : 32,
              lineHeight: 1.6,
            }}
          >
            {description}
          </motion.p>
        )}

        {/* Features */}
        {features.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 24,
              marginBottom: 40,
              textAlign: 'left',
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
          </motion.div>
        )}

        {/* CTA Button */}
        {ctaText && ctaLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.a
              href={ctaLink}
              onClick={(e) => handleLinkClick(e, ctaLink)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 32px',
                background: tokens.color.primary,
                color: '#111',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                border: 'none',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${tokens.color.primary}30`,
              }}
            >
              {ctaText}
              <i className="ri-arrow-right-line" />
            </motion.a>
          </motion.div>
        )}
      </div>
    </section>
  );
}
