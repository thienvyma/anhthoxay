import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { glassEffect } from '../styles/glassEffect';

interface ContactInfoData {
  title?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: Array<{ day: string; time: string }>;
  mapEmbedUrl?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
}

// Extract URL from iframe tag if data contains the whole iframe code
function extractMapUrl(input: string | undefined): string {
  if (!input) return '';
  const trimmed = input.trim();

  // If input contains iframe tag, extract src URL
  if (trimmed.includes('<iframe') && trimmed.includes('src=')) {
    const srcMatch = trimmed.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
  }

  // Otherwise return as-is
  return trimmed;
}

export const ContactInfo = memo(function ContactInfo({ data }: { data: ContactInfoData }) {
  // Default configuration with deep merge to preserve defaults
  const defaultData = {
    title: 'Liên Hệ & Địa Chỉ',
    address: '',
    phone: '',
    email: '',
    hours: [
      { day: 'Thứ 2 - Thứ 6', time: '10:00 - 22:00' },
      { day: 'Thứ 7 - Chủ nhật', time: '09:00 - 23:00' },
    ],
    mapEmbedUrl: '',
    socialLinks: [],
  };

  // Deep merge to ensure defaults are preserved
  const mergedData = {
    ...defaultData,
    ...data,
    // Special handling for arrays - only use custom if provided, else use defaults
    hours: data.hours && data.hours.length > 0 ? data.hours : defaultData.hours,
    socialLinks: data.socialLinks || defaultData.socialLinks,
    // Extract URL from iframe tag if needed
    mapEmbedUrl: extractMapUrl(data.mapEmbedUrl),
  };

  const hours = mergedData.hours;

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ padding: '60px 0' }}
      >
      <h2
        style={{
          fontSize: tokens.font.size.h2,
          fontFamily: tokens.font.display,
          color: tokens.color.primary,
          textAlign: 'center',
          marginBottom: 40,
        }}
      >
        {mergedData.title}
      </h2>

      <div
        className="contact-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 24,
        }}
      >
        {/* Contact Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          style={{
            ...glassEffect({ variant: 'strong' }),
            padding: 32,
            borderRadius: tokens.radius.lg,
          }}
        >
          <h3
            style={{
              fontSize: 24,
              color: tokens.color.primary,
              marginBottom: 24,
              fontWeight: 700,
            }}
          >
            Thông tin liên hệ
          </h3>

          <div style={{ display: 'grid', gap: 20 }}>
            {/* Address */}
            {mergedData.address && (
              <div style={{ display: 'flex', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: tokens.radius.md,
                    background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-map-pin-line" style={{ fontSize: 24, color: '#111' }} />
                </div>
                <div>
                  <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                    Địa chỉ
                  </div>
                  <div style={{ color: tokens.color.text, fontSize: 16 }}>{mergedData.address}</div>
                </div>
              </div>
            )}

            {/* Phone */}
            {mergedData.phone && (
              <div style={{ display: 'flex', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: tokens.radius.md,
                    background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-phone-line" style={{ fontSize: 24, color: '#111' }} />
                </div>
                <div>
                  <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                    Điện thoại
                  </div>
                  <a
                    href={`tel:${mergedData.phone}`}
                    style={{
                      color: tokens.color.text,
                      fontSize: 16,
                      textDecoration: 'none',
                    }}
                  >
                    {mergedData.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {mergedData.email && (
              <div style={{ display: 'flex', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: tokens.radius.md,
                    background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-mail-line" style={{ fontSize: 24, color: '#111' }} />
                </div>
                <div>
                  <div style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}>
                    Email
                  </div>
                  <a
                    href={`mailto:${mergedData.email}`}
                    style={{
                      color: tokens.color.text,
                      fontSize: 16,
                      textDecoration: 'none',
                    }}
                  >
                    {mergedData.email}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Opening Hours */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${tokens.color.border}` }}>
            <h4 style={{ color: tokens.color.primary, marginBottom: 16, fontSize: 18 }}>
              Giờ mở cửa
            </h4>
            <div style={{ display: 'grid', gap: 12 }}>
              {hours.map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: tokens.radius.md,
                  }}
                >
                  <span style={{ color: tokens.color.text }}>{h.day}</span>
                  <span style={{ color: tokens.color.accent, fontWeight: 600 }}>{h.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          {mergedData.socialLinks && mergedData.socialLinks.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: tokens.color.primary, marginBottom: 16, fontSize: 18 }}>
                Theo dõi chúng tôi
              </h4>
              <div style={{ display: 'flex', gap: 12 }}>
                {mergedData.socialLinks.map((link, idx) => (
                  <motion.a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#111',
                      fontSize: 20,
                      textDecoration: 'none',
                      boxShadow: tokens.shadow.sm,
                    }}
                  >
                    <i className={`ri-${link.platform}-line`} />
                  </motion.a>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          style={{
            borderRadius: tokens.radius.lg,
            overflow: 'hidden',
            border: `1px solid ${tokens.color.border}`,
            boxShadow: tokens.shadow.md,
            minHeight: 400,
          }}
        >
          {mergedData.mapEmbedUrl &&
          (mergedData.mapEmbedUrl.includes('google.com/maps/embed') ||
            mergedData.mapEmbedUrl.includes('google.com/maps/d/embed')) ? (
            <iframe
              src={mergedData.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 400 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                minHeight: 400,
                background: tokens.color.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 16,
                color: tokens.color.muted,
              }}
            >
              <i className="ri-map-2-line" style={{ fontSize: 48 }} />
              <div>Bản đồ sẽ được cập nhật sớm</div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
    </div>
  );
});

