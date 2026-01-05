import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '@app/shared';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { settingsApi, mediaApi } from '../../api';
import type { PromoSettings, PopupMedia } from './types';
import { glass } from './types';

interface PromoTabProps {
  settings: PromoSettings;
  onChange: (settings: PromoSettings) => void;
  onShowMessage: (message: string) => void;
  onError: (message: string) => void;
}

type DeviceType = 'desktop' | 'mobile';
type MediaType = 'image' | 'video';

export function PromoTab({ settings, onChange, onShowMessage, onError }: PromoTabProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

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

  const handleMediaUpload = useCallback(async (file: File, device: DeviceType) => {
    const setUploading = device === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    try {
      setUploading(true);
      const result = await mediaApi.uploadFile(file);
      const isVideo = file.type.startsWith('video/');
      
      const mediaKey = device === 'desktop' ? 'desktopMedia' : 'mobileMedia';
      onChange({
        ...settings,
        popup: {
          ...settings.popup,
          [mediaKey]: {
            type: isVideo ? 'video' : 'image',
            url: `${API_URL}${result.url}`,
            isExternal: false,
          } as PopupMedia,
        },
      });
      onShowMessage(`✅ ${isVideo ? 'Video' : 'Ảnh'} đã được upload!`);
    } catch (error) {
      console.error('Error uploading media:', error);
      onError('Upload thất bại.');
    } finally {
      setUploading(false);
    }
  }, [settings, onChange, onShowMessage, onError]);

  const handleExternalUrl = useCallback((url: string, device: DeviceType, type: MediaType) => {
    const mediaKey = device === 'desktop' ? 'desktopMedia' : 'mobileMedia';
    onChange({
      ...settings,
      popup: {
        ...settings.popup,
        [mediaKey]: {
          type,
          url,
          isExternal: true,
        } as PopupMedia,
      },
    });
  }, [settings, onChange]);

  const clearMedia = useCallback((device: DeviceType) => {
    const mediaKey = device === 'desktop' ? 'desktopMedia' : 'mobileMedia';
    onChange({
      ...settings,
      popup: {
        ...settings.popup,
        [mediaKey]: undefined,
      },
    });
  }, [settings, onChange]);

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
      {/* Popup Banner - For Landing Page */}
      <Card 
        icon="ri-window-line" 
        title="Popup Quảng Cáo (Landing)" 
        subtitle="Cửa sổ popup hiển thị trên trang Landing - Hỗ trợ ảnh/video riêng cho PC và Mobile"
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

        {/* Media Upload - Desktop & Mobile */}
        <div style={{ marginTop: 24 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 16,
            color: tokens.color.text,
            fontWeight: 500,
          }}>
            <i className="ri-image-line" />
            Media (Ảnh/Video)
          </div>
          
          <div style={{ 
            padding: 12, 
            background: 'rgba(245,211,147,0.1)', 
            border: '1px solid rgba(245,211,147,0.2)',
            borderRadius: tokens.radius.md,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.color.primary, fontSize: 13 }}>
              <i className="ri-information-line" />
              Tỉ lệ khuyến nghị: PC (16:9 ngang), Mobile (9:16 dọc). Hỗ trợ ảnh và video.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Desktop Media */}
            <MediaUploader
              label="PC / Desktop"
              icon="ri-computer-line"
              media={settings.popup.desktopMedia}
              uploading={uploadingDesktop}
              onUpload={(file) => handleMediaUpload(file, 'desktop')}
              onExternalUrl={(url, type) => handleExternalUrl(url, 'desktop', type)}
              onClear={() => clearMedia('desktop')}
              aspectHint="16:9 (ngang)"
            />

            {/* Mobile Media */}
            <MediaUploader
              label="Mobile"
              icon="ri-smartphone-line"
              media={settings.popup.mobileMedia}
              uploading={uploadingMobile}
              onUpload={(file) => handleMediaUpload(file, 'mobile')}
              onExternalUrl={(url, type) => handleExternalUrl(url, 'mobile', type)}
              onClear={() => clearMedia('mobile')}
              aspectHint="9:16 (dọc)"
            />
          </div>
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
        background: checked ? tokens.color.primary : tokens.color.surfaceHover,
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
          boxShadow: tokens.shadow.sm,
        }}
      />
    </motion.div>
  );
}

// Media Uploader Component
interface MediaUploaderProps {
  label: string;
  icon: string;
  media?: PopupMedia;
  uploading: boolean;
  onUpload: (file: File) => void;
  onExternalUrl: (url: string, type: MediaType) => void;
  onClear: () => void;
  aspectHint: string;
}

function MediaUploader({ label, icon, media, uploading, onUpload, onExternalUrl, onClear, aspectHint }: MediaUploaderProps) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState<MediaType>('video');

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onExternalUrl(urlInput.trim(), urlType);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  return (
    <div style={{
      padding: 16,
      background: glass.background,
      border: glass.border,
      borderRadius: tokens.radius.md,
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 12,
        color: tokens.color.text,
        fontWeight: 500,
      }}>
        <i className={icon} />
        {label}
        <span style={{ fontSize: 11, color: tokens.color.muted, fontWeight: 400 }}>({aspectHint})</span>
      </div>

      {media?.url ? (
        <div style={{ position: 'relative' }}>
          {media.type === 'video' ? (
            <video
              src={media.url}
              controls
              style={{ width: '100%', maxHeight: 150, borderRadius: tokens.radius.sm, background: '#000' }}
            />
          ) : (
            <img
              src={media.url}
              alt={label}
              style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: tokens.radius.sm }}
            />
          )}
          <div style={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            display: 'flex', 
            gap: 4,
          }}>
            <span style={{
              padding: '2px 8px',
              background: tokens.color.overlay,
              borderRadius: tokens.radius.sm,
              color: '#fff',
              fontSize: 10,
              textTransform: 'uppercase',
            }}>
              {media.type}
            </span>
            <Button variant="secondary" onClick={onClear} style={{ padding: 4, minWidth: 28 }}>
              <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
            </Button>
          </div>
        </div>
      ) : showUrlInput ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={urlType}
              onChange={(e) => setUrlType(e.target.value as MediaType)}
              style={{
                padding: '8px 12px',
                background: tokens.color.background,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.sm,
                color: tokens.color.text,
                fontSize: 13,
              }}
            >
              <option value="video">Video</option>
              <option value="image">Ảnh</option>
            </select>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Nhập URL..."
              style={{
                flex: 1,
                padding: '8px 12px',
                background: tokens.color.background,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.sm,
                color: tokens.color.text,
                fontSize: 13,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" onClick={handleUrlSubmit} style={{ flex: 1, padding: '6px 12px' }}>
              <i className="ri-check-line" /> Xác nhận
            </Button>
            <Button variant="secondary" onClick={() => setShowUrlInput(false)} style={{ padding: '6px 12px' }}>
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            border: `2px dashed ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <input
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
            {uploading ? (
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 24, color: tokens.color.primary }}
              />
            ) : (
              <>
                <i className="ri-upload-cloud-line" style={{ fontSize: 24, color: tokens.color.muted, marginBottom: 4 }} />
                <span style={{ color: tokens.color.muted, fontSize: 12 }}>Upload ảnh/video</span>
              </>
            )}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              color: tokens.color.muted,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <i className="ri-link" /> Hoặc nhập URL
          </button>
        </div>
      )}
    </div>
  );
}
