import { useState } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../theme';
import { Button } from './Button';
import { Input } from './Input';
import { IconPicker } from './IconPicker';

// Type definitions for header/footer config
interface NavLink {
  href: string;
  label: string;
  icon?: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface HeaderConfig {
  logo?: {
    text?: string;
    icon?: string;
    animateIcon?: boolean;
  };
  links?: NavLink[];
  ctaButton?: {
    text?: string;
    href?: string;
    icon?: string;
  };
  showMobileMenu?: boolean;
}

interface FooterConfig {
  brand?: {
    text?: string;
    icon?: string;
    description?: string;
    awards?: string[];
  };
  quickLinks?: Array<{ label: string; href: string }>;
  newsletter?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    placeholder?: string;
  };
  socialLinks?: SocialLink[];
  copyright?: {
    text?: string;
  };
}

type ConfigType = HeaderConfig | FooterConfig;

interface HeaderFooterEditorProps {
  type: 'header' | 'footer';
  config: ConfigType;
  onSave: (config: ConfigType) => void;
  onCancel: () => void;
}

export function HeaderFooterEditor({ type, config, onSave, onCancel }: HeaderFooterEditorProps) {
  const [data, setData] = useState(config || getDefaultConfig(type));

  function getDefaultConfig(t: 'header' | 'footer') {
    if (t === 'header') {
      return {
        logo: {
          text: 'Anh Thợ Xây',
          icon: 'ri-home-gear-line',
          animateIcon: true,
        },
        links: [
          { href: '/', label: 'Trang chủ', icon: 'ri-home-line' },
          { href: '/bao-gia', label: 'Báo giá', icon: 'ri-calculator-line' },
          { href: '/about', label: 'Giới thiệu', icon: 'ri-information-line' },
          { href: '/blog', label: 'Blog', icon: 'ri-article-line' },
          { href: '/contact', label: 'Liên hệ', icon: 'ri-map-pin-line' },
        ],
        ctaButton: {
          text: 'Nhận báo giá',
          href: '/bao-gia',
          icon: 'ri-calculator-line',
        },
        showMobileMenu: true,
      };
    } else {
      return {
        brand: {
          text: 'Anh Thợ Xây',
          icon: 'ri-home-gear-fill',
          description: 'Dịch vụ cải tạo nhà chuyên nghiệp, uy tín với hơn 10 năm kinh nghiệm.',
          awards: ['🏆', '⭐', '🎖️'],
        },
        quickLinks: [
          { label: 'Trang chủ', href: '/' },
          { label: 'Báo giá', href: '/bao-gia' },
          { label: 'Giới thiệu', href: '/about' },
          { label: 'Liên hệ', href: '/contact' },
        ],
        newsletter: {
          enabled: true,
          title: 'Nhận ưu đãi',
          description: 'Đăng ký để nhận thông tin khuyến mãi mới nhất',
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
    }
  }

  function updateField(path: string, value: unknown) {
    setData((prev) => {
      const keys = path.split('.');
      const updated = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>;
      let current: Record<string, unknown> = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
      return updated as ConfigType;
    });
  }

  function updateArrayItem(arrayPath: string, index: number, field: string, value: unknown) {
    setData((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>;
      const keys = arrayPath.split('.');
      let current: unknown = updated;
      for (const key of keys) {
        current = (current as Record<string, unknown>)[key];
      }
      if (current && Array.isArray(current) && current[index]) {
        (current[index] as Record<string, unknown>)[field] = value;
      }
      return updated as ConfigType;
    });
  }

  function addArrayItem(arrayPath: string, item: Record<string, unknown>) {
    setData((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>;
      const keys = arrayPath.split('.');
      let current: unknown = updated;
      for (const key of keys) {
        if (!(current as Record<string, unknown>)[key]) (current as Record<string, unknown>)[key] = [];
        current = (current as Record<string, unknown>)[key];
      }
      if (Array.isArray(current)) {
        current.push(item);
      }
      return updated as ConfigType;
    });
  }

  function removeArrayItem(arrayPath: string, index: number) {
    setData((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>;
      const keys = arrayPath.split('.');
      let current: unknown = updated;
      for (const key of keys) {
        current = (current as Record<string, unknown>)[key];
      }
      if (Array.isArray(current)) {
        current.splice(index, 1);
      }
      return updated as ConfigType;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: tokens.color.overlay,
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 24,
        overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: tokens.color.surface,
          backdropFilter: 'blur(24px)',
          borderRadius: tokens.radius.xl,
          border: `1px solid ${tokens.color.border}`,
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 24,
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `linear-gradient(135deg, ${tokens.color.primary}10, transparent)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: tokens.radius.md,
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#111',
              }}
            >
              <i className={type === 'header' ? 'ri-layout-top-line' : 'ri-layout-bottom-line'} />
            </div>
            <div>
              <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 700 }}>
                {type === 'header' ? 'Configure Header' : 'Configure Footer'}
              </h2>
              <p style={{ color: tokens.color.muted, fontSize: 14 }}>
                Customize your {type === 'header' ? 'header' : 'footer'} appearance
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            <i className="ri-close-line" style={{ fontSize: 20 }} />
          </Button>
        </div>

        {/* Form Content */}
        <div style={{ padding: 32, overflowY: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
          {type === 'header' ? (
            <HeaderForm data={data} updateField={updateField} updateArrayItem={updateArrayItem} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />
          ) : (
            <FooterForm data={data} updateField={updateField} updateArrayItem={updateArrayItem} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 24,
            borderTop: `1px solid ${tokens.color.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(data)}>
            <i className="ri-save-line" />
            Save Configuration
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface FormProps {
  data: ConfigType;
  updateField: (path: string, value: unknown) => void;
  updateArrayItem: (arrayPath: string, index: number, field: string, value: unknown) => void;
  addArrayItem: (arrayPath: string, item: Record<string, unknown>) => void;
  removeArrayItem: (arrayPath: string, index: number) => void;
}

function HeaderForm({ data, updateField, updateArrayItem, addArrayItem, removeArrayItem }: FormProps) {
  const headerData = data as HeaderConfig;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Logo Section */}
      <div>
        <h3 style={{ color: tokens.color.primary, fontSize: 18, marginBottom: 16, fontWeight: 600 }}>
          <i className="ri-image-line" /> Logo
        </h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <Input
            label="Logo Text"
            value={headerData.logo?.text || ''}
            onChange={(value) => updateField('logo.text', value)}
            placeholder="Anh Thợ Xây"
          />
          <IconPicker
            label="Icon"
            value={headerData.logo?.icon || ''}
            onChange={(value) => updateField('logo.icon', value)}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.color.text }}>
            <input
              type="checkbox"
              checked={headerData.logo?.animateIcon || false}
              onChange={(e) => updateField('logo.animateIcon', e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Animate Icon
          </label>
        </div>
      </div>

      {/* Navigation Links */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: tokens.color.primary, fontSize: 18, fontWeight: 600 }}>
            <i className="ri-links-line" /> Navigation Links
          </h3>
          <Button
            variant="secondary"
            onClick={() => addArrayItem('links', { href: '/', label: 'New Link', icon: 'ri-link' })}
          >
            <i className="ri-add-line" /> Add Link
          </Button>
        </div>
        {headerData.links?.map((link, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 12, padding: 16, background: tokens.color.surfaceAlt, borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.surfaceHover}` }}>
            <Input
              label="Label"
              value={link.label || ''}
              onChange={(value) => updateArrayItem('links', i, 'label', value)}
              placeholder="Trang chủ"
            />
            <Input
              label="Href"
              value={link.href || ''}
              onChange={(value) => updateArrayItem('links', i, 'href', value)}
              placeholder="/"
            />
            <IconPicker
              label="Icon"
              value={link.icon || ''}
              onChange={(value) => updateArrayItem('links', i, 'icon', value)}
            />
            <Button variant="danger" onClick={() => removeArrayItem('links', i)} style={{ marginTop: 26 }}>
              <i className="ri-delete-bin-line" />
            </Button>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div>
        <h3 style={{ color: tokens.color.primary, fontSize: 18, marginBottom: 16, fontWeight: 600 }}>
          <i className="ri-phone-line" /> CTA Button
        </h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <Input
            label="Button Text"
            value={headerData.ctaButton?.text || ''}
            onChange={(value) => updateField('ctaButton.text', value)}
            placeholder="Nhận báo giá"
          />
          <Input
            label="Button Href (tel:/mailto:/URL)"
            value={headerData.ctaButton?.href || ''}
            onChange={(value) => updateField('ctaButton.href', value)}
            placeholder="tel:+84123456789"
          />
          <IconPicker
            label="Button Icon"
            value={headerData.ctaButton?.icon || ''}
            onChange={(value) => updateField('ctaButton.icon', value)}
          />
        </div>
      </div>
    </div>
  );
}

function FooterForm({ data, updateField, updateArrayItem, addArrayItem, removeArrayItem }: FormProps) {
  const footerData = data as FooterConfig;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Brand Section */}
      <div>
        <h3 style={{ color: tokens.color.primary, fontSize: 18, marginBottom: 16, fontWeight: 600 }}>
          <i className="ri-building-line" /> Brand
        </h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <Input
            label="Brand Name"
            value={footerData.brand?.text || ''}
            onChange={(value) => updateField('brand.text', value)}
            placeholder="Anh Thợ Xây"
          />
          <IconPicker
            label="Icon"
            value={footerData.brand?.icon || ''}
            onChange={(value) => updateField('brand.icon', value)}
          />
          <Input
            label="Description"
            value={footerData.brand?.description || ''}
            onChange={(value) => updateField('brand.description', value)}
            placeholder="Dịch vụ cải tạo nhà chuyên nghiệp"
          />
          <Input
            label="Awards (comma-separated emojis or icon classes)"
            value={footerData.brand?.awards?.join(', ') || ''}
            onChange={(value) => updateField('brand.awards', value.split(',').map((s) => s.trim()))}
            placeholder="🏆, ⭐, 🎖️"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: tokens.color.primary, fontSize: 18, fontWeight: 600 }}>
            <i className="ri-links-line" /> Quick Links
          </h3>
          <Button
            variant="secondary"
            onClick={() => addArrayItem('quickLinks', { label: 'New Link', href: '/' })}
          >
            <i className="ri-add-line" /> Add Link
          </Button>
        </div>
        {footerData.quickLinks?.map((link, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 12, padding: 16, background: tokens.color.surfaceAlt, borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.surfaceHover}` }}>
            <Input
              label="Label"
              value={link.label || ''}
              onChange={(value) => updateArrayItem('quickLinks', i, 'label', value)}
              placeholder="Trang chủ"
            />
            <Input
              label="Href"
              value={link.href || ''}
              onChange={(value) => updateArrayItem('quickLinks', i, 'href', value)}
              placeholder="/"
            />
            <Button variant="danger" onClick={() => removeArrayItem('quickLinks', i)} style={{ marginTop: 26 }}>
              <i className="ri-delete-bin-line" />
            </Button>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <div>
        <h3 style={{ color: tokens.color.primary, fontSize: 18, marginBottom: 16, fontWeight: 600 }}>
          <i className="ri-mail-line" /> Newsletter
        </h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.color.text }}>
            <input
              type="checkbox"
              checked={footerData.newsletter?.enabled || false}
              onChange={(e) => updateField('newsletter.enabled', e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Enable Newsletter Section
          </label>
          {footerData.newsletter?.enabled && (
            <>
              <Input
                label="Title"
                value={footerData.newsletter?.title || ''}
                onChange={(value) => updateField('newsletter.title', value)}
                placeholder="Nhận ưu đãi"
              />
              <Input
                label="Description"
                value={footerData.newsletter?.description || ''}
                onChange={(value) => updateField('newsletter.description', value)}
                placeholder="Đăng ký để nhận thông tin khuyến mãi"
              />
              <Input
                label="Placeholder"
                value={footerData.newsletter?.placeholder || ''}
                onChange={(value) => updateField('newsletter.placeholder', value)}
                placeholder="Email của bạn"
              />
            </>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: tokens.color.primary, fontSize: 18, fontWeight: 600 }}>
            <i className="ri-share-line" /> Social Links
          </h3>
          <Button
            variant="secondary"
            onClick={() => addArrayItem('socialLinks', { platform: 'facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' })}
          >
            <i className="ri-add-line" /> Add Social
          </Button>
        </div>
        {footerData.socialLinks?.map((social, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 12, padding: 16, background: tokens.color.surfaceAlt, borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.surfaceHover}` }}>
            <Input
              label="Platform"
              value={social.platform || ''}
              onChange={(value) => updateArrayItem('socialLinks', i, 'platform', value)}
              placeholder="facebook"
            />
            <Input
              label="URL"
              value={social.url || ''}
              onChange={(value) => updateArrayItem('socialLinks', i, 'url', value)}
              placeholder="https://facebook.com"
            />
            <IconPicker
              label="Icon"
              value={social.icon || ''}
              onChange={(value) => updateArrayItem('socialLinks', i, 'icon', value)}
            />
            <Button variant="danger" onClick={() => removeArrayItem('socialLinks', i)} style={{ marginTop: 26 }}>
              <i className="ri-delete-bin-line" />
            </Button>
          </div>
        ))}
      </div>

      {/* Copyright */}
      <div>
        <h3 style={{ color: tokens.color.primary, fontSize: 18, marginBottom: 16, fontWeight: 600 }}>
          <i className="ri-copyright-line" /> Copyright
        </h3>
        <Input
          label="Copyright Text"
          value={footerData.copyright?.text || ''}
          onChange={(value) => updateField('copyright.text', value)}
          placeholder={`© ${new Date().getFullYear()} Anh Thợ Xây. All rights reserved.`}
        />
      </div>
    </div>
  );
}

