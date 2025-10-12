import { useState } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from './Button';
import { Input } from './Input';

interface HeaderFooterEditorProps {
  type: 'header' | 'footer';
  config: any;
  onSave: (config: any) => void;
  onCancel: () => void;
}

export function HeaderFooterEditor({ type, config, onSave, onCancel }: HeaderFooterEditorProps) {
  const [data, setData] = useState(config || getDefaultConfig(type));

  function getDefaultConfig(t: 'header' | 'footer') {
    if (t === 'header') {
      return {
        logo: {
          text: 'Restaurant',
          icon: 'ri-restaurant-2-line',
          animateIcon: true,
        },
        links: [
          { href: '/menu', label: 'Menu', icon: 'ri-restaurant-line' },
          { href: '/about', label: 'About', icon: 'ri-information-line' },
          { href: '/gallery', label: 'Gallery', icon: 'ri-image-line' },
          { href: '/blog', label: 'Blog', icon: 'ri-article-line' },
          { href: '/contact', label: 'Contact', icon: 'ri-map-pin-line' },
        ],
        ctaButton: {
          text: 'Đặt bàn ngay',
          href: 'tel:+84123456789',
          icon: 'ri-phone-line',
        },
        showMobileMenu: true,
      };
    } else {
      return {
        brand: {
          text: 'Restaurant',
          icon: 'ri-restaurant-2-fill',
          description: 'Trải nghiệm ẩm thực tinh tế với không gian sang trọng và dịch vụ chuyên nghiệp.',
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
    }
  }

  function updateField(path: string, value: any) {
    setData((prev: any) => {
      const keys = path.split('.');
      const updated = JSON.parse(JSON.stringify(prev));
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  }

  function updateArrayItem(arrayPath: string, index: number, field: string, value: any) {
    setData((prev: any) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const keys = arrayPath.split('.');
      let current = updated;
      for (const key of keys) {
        current = current[key];
      }
      if (current && Array.isArray(current) && current[index]) {
        current[index][field] = value;
      }
      return updated;
    });
  }

  function addArrayItem(arrayPath: string, item: any) {
    setData((prev: any) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const keys = arrayPath.split('.');
      let current = updated;
      for (const key of keys) {
        if (!current[key]) current[key] = [];
        current = current[key];
      }
      if (Array.isArray(current)) {
        current.push(item);
      }
      return updated;
    });
  }

  function removeArrayItem(arrayPath: string, index: number) {
    setData((prev: any) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const keys = arrayPath.split('.');
      let current = updated;
      for (const key of keys) {
        current = current[key];
      }
      if (Array.isArray(current)) {
        current.splice(index, 1);
      }
      return updated;
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
        background: 'rgba(0,0,0,0.8)',
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
          background: 'rgba(12,12,16,0.95)',
          backdropFilter: 'blur(24px)',
          borderRadius: tokens.radius.xl,
          border: '1px solid rgba(255,255,255,0.1)',
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
            borderBottom: '1px solid rgba(255,255,255,0.08)',
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
            borderTop: '1px solid rgba(255,255,255,0.08)',
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

function HeaderForm({ data, updateField, updateArrayItem, addArrayItem, removeArrayItem }: any) {
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
            value={data.logo?.text || ''}
            onChange={(e) => updateField('logo.text', e.target.value)}
            placeholder="Restaurant"
          />
          <Input
            label="Icon Class (Remix Icon)"
            value={data.logo?.icon || ''}
            onChange={(e) => updateField('logo.icon', e.target.value)}
            placeholder="ri-restaurant-2-line"
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.color.text }}>
            <input
              type="checkbox"
              checked={data.logo?.animateIcon || false}
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
        {data.links?.map((link: any, i: number) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 12, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Input
              label="Label"
              value={link.label || ''}
              onChange={(e) => updateArrayItem('links', i, 'label', e.target.value)}
              placeholder="Menu"
            />
            <Input
              label="Href"
              value={link.href || ''}
              onChange={(e) => updateArrayItem('links', i, 'href', e.target.value)}
              placeholder="/menu"
            />
            <Input
              label="Icon"
              value={link.icon || ''}
              onChange={(e) => updateArrayItem('links', i, 'icon', e.target.value)}
              placeholder="ri-restaurant-line"
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
            value={data.ctaButton?.text || ''}
            onChange={(e) => updateField('ctaButton.text', e.target.value)}
            placeholder="Đặt bàn ngay"
          />
          <Input
            label="Button Href (tel:/mailto:/URL)"
            value={data.ctaButton?.href || ''}
            onChange={(e) => updateField('ctaButton.href', e.target.value)}
            placeholder="tel:+84123456789"
          />
          <Input
            label="Button Icon"
            value={data.ctaButton?.icon || ''}
            onChange={(e) => updateField('ctaButton.icon', e.target.value)}
            placeholder="ri-phone-line"
          />
        </div>
      </div>
    </div>
  );
}

function FooterForm({ data, updateField, updateArrayItem, addArrayItem, removeArrayItem }: any) {
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
            value={data.brand?.text || ''}
            onChange={(e) => updateField('brand.text', e.target.value)}
            placeholder="Restaurant"
          />
          <Input
            label="Icon Class"
            value={data.brand?.icon || ''}
            onChange={(e) => updateField('brand.icon', e.target.value)}
            placeholder="ri-restaurant-2-fill"
          />
          <Input
            label="Description"
            value={data.brand?.description || ''}
            onChange={(e) => updateField('brand.description', e.target.value)}
            placeholder="Your restaurant description"
          />
          <Input
            label="Awards (comma-separated emojis or icon classes)"
            value={data.brand?.awards?.join(', ') || ''}
            onChange={(e) => updateField('brand.awards', e.target.value.split(',').map((s: string) => s.trim()))}
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
        {data.quickLinks?.map((link: any, i: number) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginBottom: 12, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Input
              label="Label"
              value={link.label || ''}
              onChange={(e) => updateArrayItem('quickLinks', i, 'label', e.target.value)}
              placeholder="Menu"
            />
            <Input
              label="Href"
              value={link.href || ''}
              onChange={(e) => updateArrayItem('quickLinks', i, 'href', e.target.value)}
              placeholder="/menu"
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
              checked={data.newsletter?.enabled || false}
              onChange={(e) => updateField('newsletter.enabled', e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Enable Newsletter Section
          </label>
          {data.newsletter?.enabled && (
            <>
              <Input
                label="Title"
                value={data.newsletter?.title || ''}
                onChange={(e) => updateField('newsletter.title', e.target.value)}
                placeholder="Nhận ưu đãi"
              />
              <Input
                label="Description"
                value={data.newsletter?.description || ''}
                onChange={(e) => updateField('newsletter.description', e.target.value)}
                placeholder="Đăng ký để nhận thông tin khuyến mãi"
              />
              <Input
                label="Placeholder"
                value={data.newsletter?.placeholder || ''}
                onChange={(e) => updateField('newsletter.placeholder', e.target.value)}
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
        {data.socialLinks?.map((social: any, i: number) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 12, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Input
              label="Platform"
              value={social.platform || ''}
              onChange={(e) => updateArrayItem('socialLinks', i, 'platform', e.target.value)}
              placeholder="facebook"
            />
            <Input
              label="URL"
              value={social.url || ''}
              onChange={(e) => updateArrayItem('socialLinks', i, 'url', e.target.value)}
              placeholder="https://facebook.com"
            />
            <Input
              label="Icon"
              value={social.icon || ''}
              onChange={(e) => updateArrayItem('socialLinks', i, 'icon', e.target.value)}
              placeholder="ri-facebook-fill"
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
          value={data.copyright?.text || ''}
          onChange={(e) => updateField('copyright.text', e.target.value)}
          placeholder={`© ${new Date().getFullYear()} Restaurant. All rights reserved.`}
        />
      </div>
    </div>
  );
}

