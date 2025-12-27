import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { settingsApi, mediaApi } from '../../api';
import type { PromoSettings } from './types';
import { glass } from './types';

interface PromoTabProps {
  settings: PromoSettings;
  onChange: (settings: PromoSettings) => void;
  onShowMessage: (message: string) => void;
  onError: (message: string) => void;
}

export function PromoTab({ settings, onChange, onShowMessage, onError }: PromoTabProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      await settingsApi.update('promo', { value: settings });
      onShowMessage('✅ Cài đặt quảng cáo đã được lưu!');
    } catch (error) {
      console.error('Error saving promo settings:', error);
      onError('Lưu cài đặt thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [settings, onShowMessage, onError]);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setUploadingImage(true);
      const result = await mediaApi.uploadFile(file);

      onChange({
        ...settings,
        popup: { ...settings.popup, imageUrl: `${API_URL}${result.url}` },
      });
      onShowMessage('✅ Ảnh đã được upload!');
    } catch (error) {
      console.error('Error uploading image:', error);
      onError('Upload ảnh thất bại.');
    } finally {
      setUploadingImage(false);
    }
  }, [settings, onChange, onShowMessage, onError]);

  const updateAnnouncement = useCallback((field: string, value: string | boolean) => {
    onChange({
      ...settings,
      announcement: { ...settings.announcement, [field]: value },
    });
  }, [settings, onChange]);

  const updatePopup = useCallback((field: string, value: string | boolean | number) => {
    onChange({
      ...settings,
      popup: { ...settings.popup, [field]: value },
    });
  }, [settings, onChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Announcement - For User Page (Future) */}
      <Card 
        icon="ri-notification-badge-line" 
        title="Thông Báo (Trang User)" 
        subtitle="Thông báo hiển thị cho khách hàng đã đăng ký - Sẽ phát triển sau"
      >
        <div style={{
          padding: 16,
          background: 'rgba(245, 211, 147, 0.1)',
          border: '1px solid rgba(245, 211, 147, 0.3)',
          borderRadius: tokens.radius.md,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.color.primary }}>
            <i className="ri-information-line" />
            <span style={{ fontSize: 13 }}>
              Tính năng này sẽ hiển thị thông báo trên trang User (đang phát triển)
            </span>
          </div>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          background: glass.background,
          border: glass.border,
          borderRadius: tokens.radius.md,
          marginBottom: 16,
        }}>
          <div>
            <div style={{ color: tokens.color.text, fontWeight: 500 }}>Bật thông báo</div>
            <div style={{ color: tokens.color.muted, fontSize: 13 }}>Hiển thị thông báo khi trang User hoàn thành</div>
          </div>
          <ToggleSwitch 
            checked={settings.announcement.enabled} 
            onChange={(v) => updateAnnouncement('enabled', v)} 
          />
        </div>

        <Input
          label="Nội dung thông báo"
          value={settings.announcement.text}
          onChange={(v) => updateAnnouncement('text', v)}
          placeholder="🎉 Khuyến mãi đặc biệt..."
          fullWidth
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <Input
            label="Link (tùy chọn)"
            value={settings.announcement.link || ''}
            onChange={(v) => updateAnnouncement('link', v)}
            placeholder="/bao-gia"
            fullWidth
          />
          <Input
            label="Text nút"
            value={settings.announcement.linkText || ''}
            onChange={(v) => updateAnnouncement('linkText', v)}
            placeholder="Xem ngay"
            fullWidth
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
              Màu nền
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={settings.announcement.backgroundColor}
                onChange={(e) => updateAnnouncement('backgroundColor', e.target.value)}
                style={{ width: 40, height: 40, border: 'none', borderRadius: tokens.radius.sm, cursor: 'pointer' }}
              />
              <input
                type="text"
                value={settings.announcement.backgroundColor}
                onChange={(e) => updateAnnouncement('backgroundColor', e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: glass.background,
                  border: glass.border,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
              Màu chữ
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={settings.announcement.textColor}
                onChange={(e) => updateAnnouncement('textColor', e.target.value)}
                style={{ width: 40, height: 40, border: 'none', borderRadius: tokens.radius.sm, cursor: 'pointer' }}
              />
              <input
                type="text"
                value={settings.announcement.textColor}
                onChange={(e) => updateAnnouncement('textColor', e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: glass.background,
                  border: glass.border,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Popup Banner - For Landing Page */}
      <Card 
        icon="ri-window-line" 
        title="Popup Quảng Cáo (Landing)" 
        subtitle="Cửa sổ popup hiển thị trên trang Landing"
      >
        {/* Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          background: glass.background,
          border: glass.border,
          borderRadius: tokens.radius.md,
          marginBottom: 16,
        }}>
          <div>
            <div style={{ color: tokens.color.text, fontWeight: 500 }}>Bật popup</div>
            <div style={{ color: tokens.color.muted, fontSize: 13 }}>Hiển thị popup quảng cáo khi vào trang</div>
          </div>
          <ToggleSwitch 
            checked={settings.popup.enabled} 
            onChange={(v) => updatePopup('enabled', v)} 
          />
        </div>

        <Input
          label="Tiêu đề"
          value={settings.popup.title}
          onChange={(v) => updatePopup('title', v)}
          placeholder="Ưu đãi đặc biệt!"
          fullWidth
        />

        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
            Nội dung
          </label>
          <textarea
            value={settings.popup.content}
            onChange={(e) => updatePopup('content', e.target.value)}
            placeholder="Mô tả ưu đãi..."
            rows={3}
            style={{
              width: '100%',
              padding: 12,
              background: glass.background,
              border: glass.border,
              borderRadius: tokens.radius.md,
              color: tokens.color.text,
              fontSize: 14,
              resize: 'vertical',
            }}
          />
        </div>

        {/* Image Upload */}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
            Hình ảnh (tùy chọn)
          </label>
          {settings.popup.imageUrl ? (
            <div style={{ position: 'relative', borderRadius: tokens.radius.md, overflow: 'hidden' }}>
              <img
                src={settings.popup.imageUrl}
                alt="Popup banner"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
              />
              <Button
                variant="secondary"
                onClick={() => updatePopup('imageUrl', '')}
                style={{ position: 'absolute', top: 8, right: 8 }}
              >
                <i className="ri-delete-bin-line" />
              </Button>
            </div>
          ) : (
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              border: `2px dashed ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              cursor: 'pointer',
            }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              {uploadingImage ? (
                <i className="ri-loader-4-line" style={{ fontSize: 24, color: tokens.color.primary }} />
              ) : (
                <>
                  <i className="ri-image-add-line" style={{ fontSize: 24, color: tokens.color.muted, marginBottom: 8 }} />
                  <span style={{ color: tokens.color.muted, fontSize: 13 }}>Click để upload ảnh banner</span>
                </>
              )}
            </label>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <Input
            label="Text nút CTA"
            value={settings.popup.buttonText || ''}
            onChange={(v) => updatePopup('buttonText', v)}
            placeholder="Nhận ưu đãi"
            fullWidth
          />
          <Input
            label="Link nút"
            value={settings.popup.buttonLink || ''}
            onChange={(v) => updatePopup('buttonLink', v)}
            placeholder="/bao-gia"
            fullWidth
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
              Delay hiển thị (giây)
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={settings.popup.delaySeconds}
              onChange={(e) => updatePopup('delaySeconds', parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: glass.background,
                border: glass.border,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: 14,
              }}
            />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            background: glass.background,
            border: glass.border,
            borderRadius: tokens.radius.md,
            marginTop: 28,
          }}>
            <span style={{ color: tokens.color.text, fontSize: 14 }}>Chỉ hiện 1 lần/session</span>
            <ToggleSwitch 
              checked={settings.popup.showOnce} 
              onChange={(v) => updatePopup('showOnce', v)} 
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          <i className={saving ? 'ri-loader-4-line' : 'ri-save-line'} />
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </div>
    </motion.div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.div
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        background: checked ? tokens.color.primary : 'rgba(255,255,255,0.1)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute',
          top: 2,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
    </motion.div>
  );
}
