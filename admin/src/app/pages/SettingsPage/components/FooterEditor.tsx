import { useCallback } from 'react';
import { tokens } from '../../../../theme';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { IconPicker } from '../../../components/IconPicker';
import { SortableList } from '../../../components/SortableList';
import type { FooterConfig } from '../types';
import { glass } from '../types';

interface FooterEditorProps {
  footerConfig: FooterConfig;
  onFooterChange: (config: FooterConfig) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function FooterEditor({
  footerConfig,
  onFooterChange,
  onSave,
  saving,
}: FooterEditorProps) {
  // Quick links helpers
  const addQuickLink = useCallback(() => {
    const newLinks = [...(footerConfig.quickLinks || []), { label: 'Link mới', link: '/' }];
    onFooterChange({ ...footerConfig, quickLinks: newLinks });
  }, [footerConfig, onFooterChange]);

  const removeQuickLink = useCallback((index: number) => {
    const newLinks = footerConfig.quickLinks?.filter((_, i) => i !== index) || [];
    onFooterChange({ ...footerConfig, quickLinks: newLinks });
  }, [footerConfig, onFooterChange]);

  const updateQuickLink = useCallback((index: number, field: string, value: string) => {
    const newLinks = footerConfig.quickLinks?.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ) || [];
    onFooterChange({ ...footerConfig, quickLinks: newLinks });
  }, [footerConfig, onFooterChange]);

  const reorderQuickLinks = useCallback((newItems: Array<{ label: string; link: string }>) => {
    onFooterChange({ ...footerConfig, quickLinks: newItems });
  }, [footerConfig, onFooterChange]);

  // Social links helpers
  const addSocialLink = useCallback(() => {
    const newSocial = [...(footerConfig.social || []), { platform: 'Facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' }];
    onFooterChange({ ...footerConfig, social: newSocial });
  }, [footerConfig, onFooterChange]);


  const removeSocialLink = useCallback((index: number) => {
    const newSocial = footerConfig.social?.filter((_, i) => i !== index) || [];
    onFooterChange({ ...footerConfig, social: newSocial });
  }, [footerConfig, onFooterChange]);

  const updateSocialLink = useCallback((index: number, field: string, value: string) => {
    const newSocial = footerConfig.social?.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ) || [];
    onFooterChange({ ...footerConfig, social: newSocial });
  }, [footerConfig, onFooterChange]);

  const reorderSocialLinks = useCallback((newItems: Array<{ platform: string; url: string; icon: string }>) => {
    onFooterChange({ ...footerConfig, social: newItems });
  }, [footerConfig, onFooterChange]);

  return (
    <Card icon="ri-layout-bottom-2-line" title="Footer Configuration" subtitle="Brand, links và social media">
      {/* Brand */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Brand</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <Input
            label="Name"
            value={footerConfig.brand?.text || ''}
            onChange={(v) => onFooterChange({ ...footerConfig, brand: { ...footerConfig.brand, text: v } })}
            placeholder="Nội Thất Nhanh"
            fullWidth
          />
          <IconPicker
            label="Icon"
            value={footerConfig.brand?.icon || ''}
            onChange={(v) => onFooterChange({ ...footerConfig, brand: { ...footerConfig.brand, icon: v } })}
          />
        </div>
        <Input
          label="Tagline"
          value={footerConfig.brand?.tagline || ''}
          onChange={(v) => onFooterChange({ ...footerConfig, brand: { ...footerConfig.brand, tagline: v } })}
          placeholder="Dịch vụ cải tạo nhà chuyên nghiệp"
          fullWidth
          style={{ marginTop: 12 }}
        />
      </div>

      {/* Quick Links */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            Quick Links
            <span style={{ color: tokens.color.muted, fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
              <i className="ri-draggable" style={{ marginRight: 4 }} />
              Kéo thả để sắp xếp
            </span>
          </h4>
          <Button variant="secondary" size="small" onClick={addQuickLink}>
            <i className="ri-add-line" /> Thêm
          </Button>
        </div>
        {footerConfig.quickLinks && footerConfig.quickLinks.length > 0 ? (
          <SortableList
            items={footerConfig.quickLinks}
            getItemId={(_, index) => `quick-${index}`}
            onReorder={reorderQuickLinks}
            renderItem={(link, i) => (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: 8,
                padding: 12,
                background: glass.background,
                borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
                borderLeft: 'none',
              }}>
                <Input value={link.label} onChange={(v) => updateQuickLink(i, 'label', v)} placeholder="Label" fullWidth />
                <Input value={link.link} onChange={(v) => updateQuickLink(i, 'link', v)} placeholder="/link" fullWidth />
                <Button variant="danger" size="small" onClick={() => removeQuickLink(i)}>
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
            Chưa có quick link nào. Bấm "Thêm" để tạo mới.
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
          <Button variant="secondary" size="small" onClick={addSocialLink}>
            <i className="ri-add-line" /> Thêm
          </Button>
        </div>
        {footerConfig.social && footerConfig.social.length > 0 ? (
          <SortableList
            items={footerConfig.social}
            getItemId={(_, index) => `social-${index}`}
            onReorder={reorderSocialLinks}
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
                <Input value={social.platform} onChange={(v) => updateSocialLink(i, 'platform', v)} placeholder="Platform" fullWidth />
                <Input value={social.url} onChange={(v) => updateSocialLink(i, 'url', v)} placeholder="URL" fullWidth />
                <IconPicker value={social.icon} onChange={(v) => updateSocialLink(i, 'icon', v)} />
                <Button variant="danger" size="small" onClick={() => removeSocialLink(i)}>
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

      {/* Copyright */}
      <Input
        label="Copyright"
        value={footerConfig.copyright?.text || ''}
        onChange={(v) => onFooterChange({ ...footerConfig, copyright: { text: v } })}
        placeholder={`© ${new Date().getFullYear()} Nội Thất Nhanh`}
        fullWidth
        style={{ marginBottom: 24 }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={onSave} disabled={saving}>
          <i className={saving ? 'ri-loader-4-line' : 'ri-save-line'} />
          {saving ? 'Đang lưu...' : 'Lưu Footer'}
        </Button>
      </div>
    </Card>
  );
}
