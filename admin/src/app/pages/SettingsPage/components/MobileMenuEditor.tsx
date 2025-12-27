import { useCallback } from 'react';
import { tokens } from '@app/shared';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { IconPicker } from '../../../components/IconPicker';
import { SortableList } from '../../../components/SortableList';
import { glass } from '../types';

// Mobile Menu Item Type
export interface MobileMenuItem {
  label: string;
  href: string;
  icon: string;
  highlight?: boolean;
}

// Mobile Menu Config Type
export interface MobileMenuConfig {
  items: MobileMenuItem[];
  showLogo: boolean;
  showCTA: boolean;
  ctaText: string;
  ctaLink: string;
  socialLinks: Array<{ platform: string; url: string; icon: string }>;
}

export const defaultMobileMenuConfig: MobileMenuConfig = {
  items: [
    { label: 'Trang chủ', href: '/', icon: 'ri-home-fill' },
    { label: 'Báo giá', href: '/bao-gia', icon: 'ri-calculator-fill' },
    { label: 'Nội thất', href: '/noi-that', icon: 'ri-home-smile-fill' },
    { label: 'Blog', href: '/blog', icon: 'ri-article-fill' },
    { label: 'Chính sách', href: '/chinh-sach', icon: 'ri-shield-check-fill' },
  ],
  showLogo: true,
  showCTA: true,
  ctaText: 'Liên hệ ngay',
  ctaLink: 'tel:+84123456789',
  socialLinks: [
    { platform: 'Facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' },
    { platform: 'Youtube', url: 'https://youtube.com', icon: 'ri-youtube-fill' },
    { platform: 'Tiktok', url: 'https://tiktok.com', icon: 'ri-tiktok-fill' },
  ],
};


interface MobileMenuEditorProps {
  mobileMenuConfig: MobileMenuConfig;
  onConfigChange: (config: MobileMenuConfig) => void;
  onSave: () => Promise<void>;
  onSyncFromHeader: () => void;
  saving: boolean;
}

export function MobileMenuEditor({
  mobileMenuConfig,
  onConfigChange,
  onSave,
  onSyncFromHeader,
  saving,
}: MobileMenuEditorProps) {
  // Menu item helpers
  const addMobileMenuItem = useCallback(() => {
    onConfigChange({
      ...mobileMenuConfig,
      items: [...mobileMenuConfig.items, { label: 'Link mới', href: '/', icon: '', highlight: false }],
    });
  }, [mobileMenuConfig, onConfigChange]);

  const removeMobileMenuItem = useCallback((index: number) => {
    onConfigChange({
      ...mobileMenuConfig,
      items: mobileMenuConfig.items.filter((_, i) => i !== index),
    });
  }, [mobileMenuConfig, onConfigChange]);

  const updateMobileMenuItem = useCallback((index: number, field: string, value: string | boolean) => {
    onConfigChange({
      ...mobileMenuConfig,
      items: mobileMenuConfig.items.map((item, i) => 
        i === index 
          ? { ...item, [field]: field === 'highlight' ? Boolean(value) : value } 
          : item
      ),
    });
  }, [mobileMenuConfig, onConfigChange]);

  const reorderMobileMenuItems = useCallback((newItems: MobileMenuItem[]) => {
    onConfigChange({ ...mobileMenuConfig, items: newItems });
  }, [mobileMenuConfig, onConfigChange]);

  // Social link helpers
  const addMobileSocialLink = useCallback(() => {
    onConfigChange({
      ...mobileMenuConfig,
      socialLinks: [...mobileMenuConfig.socialLinks, { platform: 'Facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' }],
    });
  }, [mobileMenuConfig, onConfigChange]);

  const removeMobileSocialLink = useCallback((index: number) => {
    onConfigChange({
      ...mobileMenuConfig,
      socialLinks: mobileMenuConfig.socialLinks.filter((_, i) => i !== index),
    });
  }, [mobileMenuConfig, onConfigChange]);

  const updateMobileSocialLink = useCallback((index: number, field: string, value: string) => {
    onConfigChange({
      ...mobileMenuConfig,
      socialLinks: mobileMenuConfig.socialLinks.map((item, i) => i === index ? { ...item, [field]: value } : item),
    });
  }, [mobileMenuConfig, onConfigChange]);

  const reorderMobileSocialLinks = useCallback((newItems: Array<{ platform: string; url: string; icon: string }>) => {
    onConfigChange({ ...mobileMenuConfig, socialLinks: newItems });
  }, [mobileMenuConfig, onConfigChange]);

  return (
    <Card icon="ri-smartphone-line" title="Mobile Menu Configuration" subtitle="Menu hiển thị trên điện thoại và tablet">
      {/* Sync Button */}
      <div style={{ marginBottom: 24, padding: 16, background: 'rgba(245,211,147,0.1)', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.primary}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
              <i className="ri-refresh-line" style={{ marginRight: 8 }} />
              Đồng bộ từ Header
            </p>
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: '4px 0 0' }}>
              Copy navigation links từ Header sang Mobile Menu
            </p>
          </div>
          <Button variant="secondary" size="small" onClick={onSyncFromHeader}>
            <i className="ri-refresh-line" /> Đồng bộ
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            Menu Items
            <span style={{ color: tokens.color.muted, fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
              <i className="ri-draggable" style={{ marginRight: 4 }} />
              Kéo thả để sắp xếp
            </span>
          </h4>
          <Button variant="secondary" size="small" onClick={addMobileMenuItem}>
            <i className="ri-add-line" /> Thêm
          </Button>
        </div>
        {mobileMenuConfig.items.length > 0 ? (
          <SortableList
            items={mobileMenuConfig.items}
            getItemId={(_, index) => `mobile-item-${index}`}
            onReorder={reorderMobileMenuItems}
            renderItem={(item, i) => (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 12,
                background: item.highlight ? 'rgba(245,211,147,0.1)' : glass.background,
                borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
                borderLeft: 'none',
                border: item.highlight ? `1px solid ${tokens.color.primary}40` : 'none',
                borderLeftWidth: 0,
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto auto',
                  gap: 8,
                  alignItems: 'center',
                }}>
                  <Input value={item.label} onChange={(v) => updateMobileMenuItem(i, 'label', v)} placeholder="Label" fullWidth />
                  <Input value={item.href} onChange={(v) => updateMobileMenuItem(i, 'href', v)} placeholder="/link" fullWidth />
                  <IconPicker 
                    value={item.icon || ''} 
                    onChange={(v) => updateMobileMenuItem(i, 'icon', v)} 
                    allowEmpty
                    placeholder="Không có icon"
                  />
                  <Button variant="danger" size="small" onClick={() => removeMobileMenuItem(i)}>
                    <i className="ri-delete-bin-line" />
                  </Button>
                </div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  color: item.highlight ? tokens.color.primary : tokens.color.muted, 
                  fontSize: 12,
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={item.highlight || false}
                    onChange={(e) => updateMobileMenuItem(i, 'highlight', e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: tokens.color.primary }}
                  />
                  <i className="ri-star-fill" style={{ fontSize: 12 }} />
                  Nổi bật (highlight) - Hiển thị khác biệt trên mobile menu
                </label>
              </div>
            )}
          />
        ) : (
          <div style={{ 
            padding: 24, 
            background: glass.background, 
            borderRadius: tokens.radius.md,
            textAlign: 'center',
            color: tokens.color.muted,
            fontSize: 13,
          }}>
            Chưa có menu item nào. Bấm "Thêm" để tạo mới.
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>CTA Button</h4>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.color.text, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={mobileMenuConfig.showCTA}
            onChange={(e) => onConfigChange({ ...mobileMenuConfig, showCTA: e.target.checked })}
            style={{ width: 18, height: 18 }}
          />
          Hiển thị nút CTA
        </label>
        {mobileMenuConfig.showCTA && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Input
              label="Text"
              value={mobileMenuConfig.ctaText}
              onChange={(v) => onConfigChange({ ...mobileMenuConfig, ctaText: v })}
              placeholder="Liên hệ ngay"
              fullWidth
            />
            <Input
              label="Link"
              value={mobileMenuConfig.ctaLink}
              onChange={(v) => onConfigChange({ ...mobileMenuConfig, ctaLink: v })}
              placeholder="tel:+84123456789"
              fullWidth
            />
          </div>
        )}
      </div>

      {/* Social Links */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            Social Links
            <span style={{ color: tokens.color.muted, fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
              <i className="ri-draggable" style={{ marginRight: 4 }} />
              Kéo thả để sắp xếp
            </span>
          </h4>
          <Button variant="secondary" size="small" onClick={addMobileSocialLink}>
            <i className="ri-add-line" /> Thêm
          </Button>
        </div>
        {mobileMenuConfig.socialLinks.length > 0 ? (
          <SortableList
            items={mobileMenuConfig.socialLinks}
            getItemId={(_, index) => `mobile-social-${index}`}
            onReorder={reorderMobileSocialLinks}
            renderItem={(social, i) => (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 8,
                padding: 12,
                background: glass.background,
                borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
                borderLeft: 'none',
              }}>
                <Input value={social.platform} onChange={(v) => updateMobileSocialLink(i, 'platform', v)} placeholder="Platform" fullWidth />
                <Input value={social.url} onChange={(v) => updateMobileSocialLink(i, 'url', v)} placeholder="URL" fullWidth />
                <IconPicker value={social.icon} onChange={(v) => updateMobileSocialLink(i, 'icon', v)} />
                <Button variant="danger" size="small" onClick={() => removeMobileSocialLink(i)}>
                  <i className="ri-delete-bin-line" />
                </Button>
              </div>
            )}
          />
        ) : (
          <div style={{ 
            padding: 24, 
            background: glass.background, 
            borderRadius: tokens.radius.md,
            textAlign: 'center',
            color: tokens.color.muted,
            fontSize: 13,
          }}>
            Chưa có social link nào. Bấm "Thêm" để tạo mới.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={onSave} disabled={saving}>
          <i className={saving ? 'ri-loader-4-line' : 'ri-save-line'} />
          {saving ? 'Đang lưu...' : 'Lưu Mobile Menu'}
        </Button>
      </div>
    </Card>
  );
}
