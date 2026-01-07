import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { tokens, resolveMediaUrl } from '@app/shared';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface FooterConfig {
  brand?: {
    text?: string;
    icon?: string;
    imageUrl?: string;
    description?: string;
    awards?: string[]; // Emoji or icon classes
  };
  quickLinks?: FooterLink[];
  newsletter?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    placeholder?: string;
  };
  socialLinks?: FooterSocialLink[];
  copyright?: {
    text?: string;
  };
}

interface FooterProps {
  config?: FooterConfig;
}

export function Footer({ config }: FooterProps) {
  // Default config - ANH THỢ XÂY
  const defaultConfig: FooterConfig = {
    brand: {
      text: 'Anh Thợ Xây',
      icon: 'ri-building-2-fill',
      description:
        'Dịch vụ cải tạo nhà và căn hộ chuyên nghiệp. Báo giá minh bạch, thi công uy tín.',
      awards: ['🏗️', '⭐', '✅'],
    },
    quickLinks: [
      { label: 'Trang chủ', href: '/' },
      { label: 'Báo giá', href: '/bao-gia' },
      { label: 'Blog', href: '/blog' },
      { label: 'Chính sách', href: '/chinh-sach' },
    ],
    newsletter: {
      enabled: true,
      title: 'Nhận tư vấn',
      description: 'Đăng ký để nhận tư vấn và báo giá miễn phí',
      placeholder: 'Email của bạn',
    },
    socialLinks: [
      { platform: 'facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' },
      { platform: 'zalo', url: 'https://zalo.me', icon: 'ri-chat-3-fill' },
      { platform: 'youtube', url: 'https://youtube.com', icon: 'ri-youtube-fill' },
    ],
    copyright: {
      text: `© ${new Date().getFullYear()} Anh Thợ Xây. All rights reserved.`,
    },
  };

  const mergedConfig = { ...defaultConfig, ...config };
  const { brand, quickLinks, newsletter, socialLinks, copyright } = mergedConfig;

  const containerStyle = {
    maxWidth: 1400,
    margin: '0 auto',
  };

  return (
    <footer
      style={{
        marginTop: 80,
        background: 'rgba(11,12,15,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ ...containerStyle, padding: 'clamp(24px, 5vw, 60px) clamp(12px, 3vw, 24px) clamp(16px, 3vw, 24px)' }}>
        {/* Footer Content Grid - Optimized layout with logo in separate column */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: (brand?.imageUrl && brand.imageUrl.trim())
              ? 'minmax(160px, 240px) repeat(auto-fit, minmax(min(100%, 160px), 1fr))' 
              : 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: 'clamp(20px, 4vw, 40px)',
            marginBottom: 'clamp(24px, 6vw, 48px)',
          }}
          className="footer-grid"
        >
          {/* Logo Column - Dedicated column when logo exists */}
          {brand?.imageUrl && brand.imageUrl.trim() && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 24,
            }}>
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: 'clamp(16px, 3vw, 24px)',
                  background: 'linear-gradient(135deg, rgba(245,211,147,0.08), rgba(59,130,246,0.05))',
                  borderRadius: 16,
                  border: '1px solid rgba(245,211,147,0.15)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src={resolveMediaUrl(brand.imageUrl)}
                  alt={brand.text || 'Anh Thợ Xây Logo'}
                  style={{
                    height: 'clamp(50px, 8vw, 70px)', // Responsive: 50px mobile, 70px desktop
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    filter: 'brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.3) drop-shadow(0 4px 12px rgba(245,211,147,0.4))';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.2))';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </motion.div>

              {/* Awards Icons below logo */}
              {brand?.awards && brand.awards.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: 10, 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  {brand.awards.map((award, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      style={{
                        width: 48,
                        height: 48,
                        background: 'rgba(245,211,147,0.15)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        border: '1px solid rgba(245,211,147,0.3)',
                        boxShadow: '0 2px 12px rgba(245,211,147,0.15)',
                        cursor: 'default',
                      }}
                    >
                      {award.startsWith('ri-') ? (
                        <i className={award} style={{ color: tokens.color.primary }} />
                      ) : (
                        award
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Brand Info Column (only show when NO logo image) */}
          {!brand?.imageUrl && (
            <div className="footer-brand">
              <div
                style={{
                  color: tokens.color.primary,
                  fontFamily: tokens.font.display,
                  fontSize: 'clamp(20px, 4vw, 28px)',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {brand?.icon && <i className={brand.icon} />}
                {brand?.text}
              </div>

              <p
                style={{
                  color: tokens.color.muted,
                  lineHeight: 1.5,
                  marginBottom: 12,
                  fontSize: 'clamp(12px, 2vw, 14px)',
                }}
              >
                {brand?.description}
              </p>

              {brand?.awards && brand.awards.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}>
                  {brand.awards.map((award, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        width: 36,
                        height: 36,
                        background: 'rgba(245,211,147,0.12)',
                        borderRadius: tokens.radius.sm,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        border: '1px solid rgba(245,211,147,0.25)',
                        cursor: 'default',
                      }}
                    >
                      {award.startsWith('ri-') ? (
                        <i className={award} style={{ color: tokens.color.primary }} />
                      ) : (
                        award
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Links */}
          {quickLinks && quickLinks.length > 0 && (
            <div className="footer-links">
              <h4
                style={{
                  color: tokens.color.primary,
                  marginBottom: 12,
                  fontSize: 'clamp(11px, 2vw, 18px)',
                }}
              >
                Liên kết nhanh
              </h4>
              <div className="quick-links" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {quickLinks.map((link, index) => (
                  <Link
                    key={`footer-link-${link.href}-${index}`}
                    to={link.href}
                    style={{ textDecoration: 'none' }}
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      style={{
                        color: tokens.color.muted,
                        transition: 'color 0.2s',
                        fontSize: 'clamp(10px, 2vw, 14px)',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = tokens.color.text)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = tokens.color.muted)
                      }
                    >
                      → {link.label}
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter */}
          {newsletter?.enabled && (
            <div className="footer-newsletter">
              <h4
                style={{
                  color: tokens.color.primary,
                  marginBottom: 8,
                  fontSize: 'clamp(14px, 2vw, 18px)',
                }}
              >
                {newsletter.title}
              </h4>
              <p
                style={{
                  color: tokens.color.muted,
                  marginBottom: 10,
                  fontSize: 'clamp(11px, 2vw, 14px)',
                  lineHeight: 1.4,
                }}
              >
                {newsletter.description}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="email"
                  placeholder={newsletter.placeholder}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: 'rgba(255,255,255,0.05)',
                    color: tokens.color.text,
                    fontSize: 'clamp(12px, 2vw, 14px)',
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: tokens.radius.md,
                    background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                    color: '#111',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-send-plane-fill" />
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div
          className="footer-bottom"
          style={{
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: tokens.color.muted,
            fontSize: 'clamp(11px, 2vw, 14px)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span>{copyright?.text}</span>
          {/* Social Links */}
          {socialLinks && socialLinks.length > 0 && (
            <div style={{ display: 'flex', gap: 12 }}>
              {socialLinks.map((social, index) => (
                <motion.a
                  key={`footer-social-${social.platform}-${index}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, y: -2 }}
                  style={{
                    color: tokens.color.muted,
                    fontSize: 'clamp(16px, 3vw, 20px)',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = tokens.color.primary)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = tokens.color.muted)
                  }
                >
                  <i className={social.icon || `ri-${social.platform}-fill`} />
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

