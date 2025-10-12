import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { tokens } from '@app/shared';

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
  // Default config
  const defaultConfig: FooterConfig = {
    brand: {
      text: 'Restaurant',
      icon: 'ri-restaurant-2-fill',
      description:
        'Trải nghiệm ẩm thực tinh tế với không gian sang trọng và dịch vụ chuyên nghiệp.',
      awards: ['🏆', '⭐', '🎖️'],
    },
    quickLinks: [
      { label: 'Menu', href: '/menu' },
      { label: 'About', href: '/about' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Contact', href: '/contact' },
    ],
    newsletter: {
      enabled: true,
      title: 'Nhận ưu đãi',
      description: 'Đăng ký để nhận thông tin khuyến mãi mới nhất',
      placeholder: 'Email của bạn',
    },
    socialLinks: [
      { platform: 'facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' },
      { platform: 'instagram', url: 'https://instagram.com', icon: 'ri-instagram-fill' },
      { platform: 'youtube', url: 'https://youtube.com', icon: 'ri-youtube-fill' },
      { platform: 'twitter', url: 'https://twitter.com', icon: 'ri-twitter-fill' },
    ],
    copyright: {
      text: `© ${new Date().getFullYear()} Restaurant. All rights reserved.`,
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
      <div style={{ ...containerStyle, padding: 'clamp(40px, 8vw, 60px) clamp(16px, 4vw, 24px) 24px' }}>
        {/* Footer Content Grid - Optimized layout with logo in separate column */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: (brand?.imageUrl && brand.imageUrl.trim())
              ? 'minmax(200px, 280px) repeat(auto-fit, minmax(200px, 1fr))' 
              : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(24px, 6vw, 48px)',
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
                  padding: 24,
                  background: 'linear-gradient(135deg, rgba(245,211,147,0.08), rgba(59,130,246,0.05))',
                  borderRadius: 16,
                  border: '1px solid rgba(245,211,147,0.15)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src={`http://localhost:4202${brand.imageUrl}`}
                  alt={brand.text || 'Restaurant Logo'}
                  style={{
                    height: 70,
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
            <div>
              <div
                style={{
                  color: tokens.color.primary,
                  fontFamily: tokens.font.display,
                  fontSize: 28,
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {brand?.icon && <i className={brand.icon} />}
                {brand?.text}
              </div>

              <p
                style={{
                  color: tokens.color.muted,
                  lineHeight: 1.7,
                  marginBottom: 24,
                  fontSize: 14,
                }}
              >
                {brand?.description}
              </p>

              {brand?.awards && brand.awards.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: 12, 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}>
                  {brand.awards.map((award, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        width: 52,
                        height: 52,
                        background: 'rgba(245,211,147,0.12)',
                        borderRadius: tokens.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 26,
                        border: '1px solid rgba(245,211,147,0.25)',
                        boxShadow: '0 2px 8px rgba(245,211,147,0.08)',
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
            <div>
              <h4
                style={{
                  color: tokens.color.primary,
                  marginBottom: 20,
                  fontSize: 18,
                }}
              >
                Liên kết nhanh
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    style={{ textDecoration: 'none' }}
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      style={{
                        color: tokens.color.muted,
                        transition: 'color 0.2s',
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
            <div>
              <h4
                style={{
                  color: tokens.color.primary,
                  marginBottom: 20,
                  fontSize: 18,
                }}
              >
                {newsletter.title}
              </h4>
              <p
                style={{
                  color: tokens.color.muted,
                  marginBottom: 16,
                  fontSize: 14,
                }}
              >
                {newsletter.description}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder={newsletter.placeholder}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: 'rgba(255,255,255,0.05)',
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: tokens.radius.md,
                    background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                    color: '#111',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
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
          style={{
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: tokens.color.muted,
            fontSize: 14,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span>{copyright?.text}</span>
          {/* Social Links */}
          {socialLinks && socialLinks.length > 0 && (
            <div style={{ display: 'flex', gap: 16 }}>
              {socialLinks.map((social) => (
                <motion.a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, y: -2 }}
                  style={{
                    color: tokens.color.muted,
                    fontSize: 20,
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

