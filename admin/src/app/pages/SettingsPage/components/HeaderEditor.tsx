import { useCallback } from 'react';
import { tokens } from '../../../../theme';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { IconPicker } from '../../../components/IconPicker';
import { SortableList } from '../../../components/SortableList';
import type { HeaderConfig, HeaderNavItem } from '../types';
import { glass } from '../types';

interface HeaderEditorProps {
  headerConfig: HeaderConfig;
  onHeaderChange: (config: HeaderConfig) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function HeaderEditor({
  headerConfig,
  onHeaderChange,
  onSave,
  saving,
}: HeaderEditorProps) {
  // Navigation helpers
  const addNavItem = useCallback(() => {
    const newNav = [...(headerConfig.navigation || []), { label: 'Link mới', route: '/', icon: '', highlight: false }];
    onHeaderChange({ ...headerConfig, navigation: newNav });
  }, [headerConfig, onHeaderChange]);

  const removeNavItem = useCallback((index: number) => {
    const newNav = headerConfig.navigation?.filter((_, i) => i !== index) || [];
    onHeaderChange({ ...headerConfig, navigation: newNav });
  }, [headerConfig, onHeaderChange]);

  const updateNavItem = useCallback((index: number, field: string, value: string | boolean) => {
    const newNav = headerConfig.navigation?.map((item, i) =>
      i === index ? { ...item, [field]: field === 'highlight' ? value === 'true' || value === true : value } : item
    ) || [];
    onHeaderChange({ ...headerConfig, navigation: newNav });
  }, [headerConfig, onHeaderChange]);

  const reorderNavItems = useCallback((newItems: HeaderNavItem[]) => {
    onHeaderChange({ ...headerConfig, navigation: newItems });
  }, [headerConfig, onHeaderChange]);

  // CTA link helpers
  const addCTALink = useCallback(() => {
    const newLinks = [...(headerConfig.cta?.links || []), { text: 'Link mới', href: '/', icon: 'ri-link' }];
    onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, links: newLinks } });
  }, [headerConfig, onHeaderChange]);


  const updateCTALink = useCallback((index: number, field: string, value: string) => {
    const newLinks = headerConfig.cta?.links?.map((l, idx) => idx === index ? { ...l, [field]: value } : l) || [];
    onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, links: newLinks } });
  }, [headerConfig, onHeaderChange]);

  const removeCTALink = useCallback((index: number) => {
    const newLinks = headerConfig.cta?.links?.filter((_, idx) => idx !== index) || [];
    onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, links: newLinks } });
  }, [headerConfig, onHeaderChange]);

  return (
    <Card icon="ri-layout-top-2-line" title="Header Configuration" subtitle="Logo, navigation và CTA button">
      {/* Logo */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Logo</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <Input
            label="Text"
            value={headerConfig.logo?.text || ''}
            onChange={(v) => onHeaderChange({ ...headerConfig, logo: { ...headerConfig.logo, text: v } })}
            placeholder="Anh Thợ Xây"
            fullWidth
          />
          <IconPicker
            label="Icon"
            value={headerConfig.logo?.icon || ''}
            onChange={(v) => onHeaderChange({ ...headerConfig, logo: { ...headerConfig.logo, icon: v } })}
          />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
            Navigation Links
            <span style={{ color: tokens.color.muted, fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
              <i className="ri-draggable" style={{ marginRight: 4 }} />
              Kéo thả để sắp xếp
            </span>
          </h4>
          <Button variant="secondary" size="small" onClick={addNavItem}>
            <i className="ri-add-line" /> Thêm
          </Button>
        </div>
        {headerConfig.navigation && headerConfig.navigation.length > 0 ? (
          <SortableList
            items={headerConfig.navigation}
            getItemId={(_, index) => `nav-${index}`}
            onReorder={reorderNavItems}
            renderItem={(nav, i) => (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 12,
                background: nav.highlight ? 'rgba(245,211,147,0.1)' : glass.background,
                borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
                border: nav.highlight ? `1px solid ${tokens.color.primary}40` : 'none',
                borderLeft: 'none',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto auto',
                  gap: 8,
                  alignItems: 'center',
                }}>
                  <Input value={nav.label} onChange={(v) => updateNavItem(i, 'label', v)} placeholder="Label" fullWidth />
                  <Input value={nav.route} onChange={(v) => updateNavItem(i, 'route', v)} placeholder="/route" fullWidth />
                  <IconPicker 
                    value={nav.icon || ''} 
                    onChange={(v) => updateNavItem(i, 'icon', v)} 
                    allowEmpty
                    placeholder="Không có icon"
                  />
                  <Button variant="danger" size="small" onClick={() => removeNavItem(i)}>
                    <i className="ri-delete-bin-line" />
                  </Button>
                </div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  color: nav.highlight ? tokens.color.primary : tokens.color.muted, 
                  fontSize: 12,
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={nav.highlight || false}
                    onChange={(e) => updateNavItem(i, 'highlight', e.target.checked ? 'true' : '')}
                    style={{ width: 14, height: 14, accentColor: tokens.color.primary }}
                  />
                  <i className="ri-star-fill" style={{ fontSize: 12 }} />
                  Nổi bật (highlight) - Hiển thị khác biệt trên header
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
            Chưa có navigation link nào. Bấm "Thêm" để tạo mới.
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>CTA Button</h4>
        <p style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 12 }}>
          Nếu có nhiều hơn 1 link, nút sẽ hiển thị dạng dropdown. Nếu chỉ có 1 link, sẽ truy cập trực tiếp.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
          <Input
            label="Text hiển thị"
            value={headerConfig.cta?.text || ''}
            onChange={(v) => onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, text: v } })}
            placeholder="Báo giá ngay"
            fullWidth
          />
          <IconPicker
            label="Icon"
            value={headerConfig.cta?.link?.startsWith('ri-') ? headerConfig.cta.link : 'ri-price-tag-3-line'}
            onChange={(v) => onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, link: v } })}
          />
        </div>
        
        {/* CTA Links */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>Links trong CTA</span>
            <Button variant="secondary" size="small" onClick={addCTALink}>
              <i className="ri-add-line" /> Thêm link
            </Button>
          </div>
          {(headerConfig.cta?.links || []).map((link, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr auto',
              gap: 8,
              marginBottom: 8,
              padding: 12,
              background: glass.background,
              borderRadius: tokens.radius.md,
            }}>
              <Input 
                value={link.text} 
                onChange={(v) => updateCTALink(i, 'text', v)} 
                placeholder="Text" 
                fullWidth 
              />
              <Input 
                value={link.href} 
                onChange={(v) => updateCTALink(i, 'href', v)} 
                placeholder="/link" 
                fullWidth 
              />
              <IconPicker 
                value={link.icon || ''} 
                onChange={(v) => updateCTALink(i, 'icon', v)} 
              />
              <Button variant="danger" size="small" onClick={() => removeCTALink(i)}>
                <i className="ri-delete-bin-line" />
              </Button>
            </div>
          ))}
          {(!headerConfig.cta?.links || headerConfig.cta.links.length === 0) && (
            <div style={{ 
              padding: 16, 
              background: glass.background, 
              borderRadius: tokens.radius.md,
              textAlign: 'center',
              color: tokens.color.muted,
              fontSize: 13,
            }}>
              Chưa có link nào. Thêm ít nhất 1 link để nút CTA hoạt động.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={onSave} disabled={saving}>
          <i className={saving ? 'ri-loader-4-line' : 'ri-save-line'} />
          {saving ? 'Đang lưu...' : 'Lưu Header'}
        </Button>
      </div>
    </Card>
  );
}
