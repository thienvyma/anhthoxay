import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { useState, useEffect } from 'react';
import { offersAPI } from '../api';
import { glassEffect } from '../styles/glassEffect';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount?: number;
  validFrom: string;
  validUntil: string;
  imageId?: string;
  imageUrl?: string;
  isActive: boolean;
}

interface SpecialOffersData {
  title?: string;
  subtitle?: string;
  offers?: Offer[];
}

export const SpecialOffers = memo(function SpecialOffers({ data }: { data: SpecialOffersData }) {
  const [offers, setOffers] = useState<Offer[]>(data.offers || []);
  const [loading, setLoading] = useState(!data.offers);

  useEffect(() => {
    if (!data.offers) {
      // Fetch from API if not provided in section data
      offersAPI
        .getActive()
        .then((data) => {
          setOffers(data.filter((o: Offer) => o.isActive));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [data.offers]);

  const getTimeRemaining = (validUntil: string) => {
    const now = new Date().getTime();
    const end = new Date(validUntil).getTime();
    const diff = end - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Còn ${days} ngày`;
    if (hours > 0) return `Còn ${hours} giờ`;
    return 'Sắp hết hạn';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: tokens.color.muted }}>
        <i className="ri-loader-4-line" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (offers.length === 0) return null;

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ 
          padding: '60px 0',
        }}
      >
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
            color: '#111',
            padding: '8px 20px',
            borderRadius: tokens.radius.pill,
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          <i className="ri-fire-fill" />
          Ưu đãi đặc biệt
        </motion.div>

        <h2
          style={{
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontFamily: tokens.font.display,
            color: tokens.color.primary,
            marginBottom: 12,
            fontWeight: 700,
          }}
        >
          {data.title || 'Khuyến Mãi Hấp Dẫn'}
        </h2>

        {data.subtitle && (
          <p style={{ 
            color: tokens.color.muted, 
            maxWidth: 600, 
            margin: '0 auto',
            fontSize: 'clamp(14px, 2vw, 16px)',
            lineHeight: 1.7,
          }}>
            {data.subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
          alignItems: 'stretch', // Ensure all cards have equal height
        }}
      >
        {offers.map((offer, idx) => {
          const timeLeft = getTimeRemaining(offer.validUntil);

          return (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -8, boxShadow: tokens.shadow.lg }}
              style={{
                ...glassEffect({ variant: 'card' }),
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: tokens.radius.lg,
                overflow: 'hidden',
                border: `2px solid ${tokens.color.primary}`,
                transition: 'all 0.3s ease',
              }}
            >
              {/* Image */}
              {offer.imageUrl && (
                <div
                  style={{
                    height: 200,
                    background: `url(${offer.imageUrl}) center/cover`,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)',
                    }}
                  />
                </div>
              )}

              {/* Discount Badge */}
              {offer.discount && (
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: tokens.color.error,
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: tokens.radius.md,
                    fontSize: 24,
                    fontWeight: 700,
                    boxShadow: tokens.shadow.lg,
                    transform: 'rotate(3deg)',
                  }}
                >
                  -{offer.discount}%
                </div>
              )}

              {/* Content */}
              <div 
                style={{ 
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: tokens.color.primary,
                    marginBottom: 12,
                  }}
                >
                  {offer.title}
                </h3>

                <p style={{ color: tokens.color.text, marginBottom: 16, lineHeight: 1.6 }}>
                  {offer.description}
                </p>

                {/* Validity Period */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: tokens.radius.md,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 12, color: tokens.color.muted }}>
                    <i className="ri-calendar-line" style={{ marginRight: 6 }} />
                    {new Date(offer.validFrom).toLocaleDateString('vi-VN')} -{' '}
                    {new Date(offer.validUntil).toLocaleDateString('vi-VN')}
                  </div>

                  {timeLeft && (
                    <div
                      style={{
                        fontSize: 12,
                        color: tokens.color.error,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <i className="ri-time-line" />
                      {timeLeft}
                    </div>
                  )}
                </div>

                {/* CTA Button - Always at bottom */}
                <motion.a
                  href="#reservation"
                  aria-label={`Đặt bàn để nhận ưu đãi ${offer.title}`}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 8px 24px rgba(245,211,147,0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '16px 28px',
                    background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                    color: '#111',
                    borderRadius: tokens.radius.pill,
                    fontSize: 16,
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: 'auto', // Push button to bottom
                    boxShadow: '0 4px 12px rgba(245,211,147,0.2)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <span>Đặt bàn ngay</span>
                  <motion.i 
                    className="ri-arrow-right-line"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                </motion.a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
    </div>
  );
});

