/**
 * InteriorPricingTable - Static pricing table section for interior packages
 * Section kind: INTERIOR_PRICING_TABLE
 *
 * Displays a pricing table with title, description, and package tiers
 * Data is fetched from API or can be configured statically
 */

import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface PricingTier {
  id?: string;
  name: string;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'LUXURY';
  price: number;
  priceLabel?: string;
  description?: string;
  features: string[];
  isPopular?: boolean;
  ctaText?: string;
  ctaLink?: string;
  thumbnail?: string;
}

interface InteriorPricingTableData {
  title?: string;
  subtitle?: string;
  description?: string;
  tiers?: PricingTier[];
  fetchFromApi?: boolean;
  layoutId?: string;
  showFeatures?: boolean;
  showCta?: boolean;
  ctaText?: string;
  ctaLink?: string;
  columns?: 2 | 3 | 4;
}

interface InteriorPricingTableProps {
  data: InteriorPricingTableData;
}

const TIER_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  BASIC: { label: 'Cơ bản', color: tokens.color.textMuted, icon: 'ri-home-line' },
  STANDARD: { label: 'Tiêu chuẩn', color: tokens.color.info, icon: 'ri-home-2-line' },
  PREMIUM: { label: 'Cao cấp', color: tokens.color.warning, icon: 'ri-home-3-line' },
  LUXURY: { label: 'Sang trọng', color: tokens.color.primary, icon: 'ri-home-smile-line' },
};

export function InteriorPricingTable({ data }: InteriorPricingTableProps) {
  const {
    title = 'Bảng Báo Giá Nội Thất',
    subtitle = 'Chọn gói nội thất phù hợp với nhu cầu và ngân sách của bạn',
    description,
    tiers: staticTiers,
    fetchFromApi = false,
    layoutId,
    showFeatures = true,
    showCta = true,
    ctaText = 'Liên hệ tư vấn',
    ctaLink = '/noi-that',
    columns = 3,
  } = data;

  const [tiers, setTiers] = useState<PricingTier[]>(staticTiers || []);
  const [loading, setLoading] = useState(fetchFromApi);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fetchFromApi && layoutId) {
      fetchPackages();
    }
  }, [fetchFromApi, layoutId]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const url = layoutId
        ? `${API_URL}/api/interior/packages?layoutId=${layoutId}`
        : `${API_URL}/api/interior/packages?isFeatured=true&limit=4`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch packages');
      const json = await response.json();
      // Handle standardized response: { success: true, data: [...], meta: {...} }
      const data = json.data || json;
      const packages = Array.isArray(data) ? data : data.items || [];

      const transformedTiers: PricingTier[] = packages.map(
        (pkg: {
          id: string;
          name: string;
          tier: number;
          basePrice: number;
          shortDescription?: string;
          items?: Array<{ room: string; items: Array<{ name: string }> }>;
          thumbnail?: string;
          isFeatured?: boolean;
        }) => ({
          id: pkg.id,
          name: pkg.name,
          tier: getTierFromNumber(pkg.tier),
          price: pkg.basePrice,
          description: pkg.shortDescription,
          features: extractFeatures(pkg.items),
          thumbnail: pkg.thumbnail,
          isPopular: pkg.isFeatured,
        })
      );

      setTiers(transformedTiers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const getTierFromNumber = (tier: number): 'BASIC' | 'STANDARD' | 'PREMIUM' | 'LUXURY' => {
    const tierMap: Record<number, 'BASIC' | 'STANDARD' | 'PREMIUM' | 'LUXURY'> = {
      1: 'BASIC',
      2: 'STANDARD',
      3: 'PREMIUM',
      4: 'LUXURY',
    };
    return tierMap[tier] || 'BASIC';
  };

  const extractFeatures = (
    items?: Array<{ room: string; items: Array<{ name: string }> }>
  ): string[] => {
    if (!items || !Array.isArray(items)) return [];
    const features: string[] = [];
    items.forEach((room) => {
      if (room.items && Array.isArray(room.items)) {
        room.items.forEach((item) => {
          if (item.name && features.length < 6) {
            features.push(item.name);
          }
        });
      }
    });
    return features;
  };

  const sortedTiers = [...tiers].sort((a, b) => {
    const order = ['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY'];
    return order.indexOf(a.tier) - order.indexOf(b.tier);
  });

  return (
    <section
      style={{
        padding: 'clamp(3rem, 8vw, 5rem) 1rem',
        background: 'transparent',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 5vw, 3rem)' }}
        >
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: tokens.color.text,
              marginBottom: '0.75rem',
              fontFamily: tokens.font.display,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              color: tokens.color.textMuted,
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
          {description && (
            <p
              style={{
                fontSize: '0.9rem',
                color: tokens.color.textMuted,
                maxWidth: '800px',
                margin: '1rem auto 0',
                lineHeight: 1.7,
              }}
            >
              {description}
            </p>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <i
                className="ri-loader-4-line"
                style={{ fontSize: '2rem', color: tokens.color.primary }}
              />
            </motion.div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i
              className="ri-error-warning-line"
              style={{ fontSize: '2rem', color: tokens.color.error }}
            />
            <p style={{ color: tokens.color.error, marginTop: '0.5rem' }}>{error}</p>
          </div>
        )}

        {/* Pricing Table */}
        {!loading && !error && sortedTiers.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${columns === 2 ? '350px' : columns === 4 ? '250px' : '280px'}), 1fr))`,
              gap: 'clamp(1rem, 3vw, 1.5rem)',
            }}
          >
            {sortedTiers.map((tier, index) => (
              <PricingCard
                key={tier.id || index}
                tier={tier}
                index={index}
                showFeatures={showFeatures}
                showCta={showCta}
                defaultCtaText={ctaText}
                defaultCtaLink={ctaLink}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sortedTiers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <i
              className="ri-price-tag-3-line"
              style={{ fontSize: '3rem', color: tokens.color.textMuted }}
            />
            <p style={{ color: tokens.color.textMuted, marginTop: '1rem' }}>
              Chưa có gói báo giá nào
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

interface PricingCardProps {
  tier: PricingTier;
  index: number;
  showFeatures: boolean;
  showCta: boolean;
  defaultCtaText: string;
  defaultCtaLink: string;
}

function PricingCard({
  tier,
  index,
  showFeatures,
  showCta,
  defaultCtaText,
  defaultCtaLink,
}: PricingCardProps) {
  const config = TIER_CONFIG[tier.tier] || TIER_CONFIG.BASIC;
  const isPopular = tier.isPopular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, boxShadow: tokens.shadow.lg }}
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `2px solid ${isPopular ? tokens.color.primary : tokens.color.border}`,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: tokens.color.primary,
            color: '#111',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.35rem 0.75rem',
            borderRadius: tokens.radius.pill,
            zIndex: 1,
          }}
        >
          <i className="ri-star-fill" style={{ marginRight: '0.25rem' }} />
          Phổ biến
        </div>
      )}

      {/* Thumbnail */}
      {tier.thumbnail && (
        <div style={{ width: '100%', height: '160px', overflow: 'hidden' }}>
          <img
            src={resolveMediaUrl(tier.thumbnail)}
            alt={tier.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
        {/* Tier Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            background: `${config.color}15`,
            color: config.color,
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: tokens.radius.sm,
            marginBottom: '1rem',
          }}
        >
          <i className={config.icon} />
          {config.label}
        </div>

        {/* Name */}
        <h3
          style={{
            margin: '0 0 0.5rem',
            color: tokens.color.text,
            fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)',
            fontWeight: 700,
          }}
        >
          {tier.name}
        </h3>

        {/* Description */}
        {tier.description && (
          <p
            style={{
              margin: '0 0 1rem',
              color: tokens.color.textMuted,
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            {tier.description}
          </p>
        )}

        {/* Price */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span
              style={{
                color: tokens.color.primary,
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 700,
              }}
            >
              {tier.price.toLocaleString('vi-VN')}
            </span>
            <span style={{ color: tokens.color.textMuted, fontSize: '0.9rem' }}>đ</span>
          </div>
          {tier.priceLabel && (
            <span style={{ color: tokens.color.textMuted, fontSize: '0.75rem' }}>
              {tier.priceLabel}
            </span>
          )}
        </div>

        {/* Features */}
        {showFeatures && tier.features && tier.features.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
            {tier.features.slice(0, 6).map((feature, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.4rem 0',
                  color: tokens.color.text,
                  fontSize: '0.85rem',
                  borderBottom:
                    i < tier.features.length - 1 ? `1px solid ${tokens.color.border}` : 'none',
                }}
              >
                <i
                  className="ri-check-line"
                  style={{
                    color: tokens.color.success,
                    fontSize: '1rem',
                    flexShrink: 0,
                    marginTop: '0.1rem',
                  }}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA Button */}
        {showCta && (
          <motion.a
            href={tier.ctaLink || defaultCtaLink}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.875rem 1rem',
              background: isPopular
                ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`
                : 'transparent',
              border: isPopular ? 'none' : `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: isPopular ? '#111' : tokens.color.text,
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {tier.ctaText || defaultCtaText}
            <i className="ri-arrow-right-line" />
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}

export default InteriorPricingTable;
