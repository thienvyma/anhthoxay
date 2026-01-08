import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { resolveMediaUrl } from '@app/shared';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { settingsApi, mediaApi } from '../../api';
import type { CompanySettings, LogoItem, LogoPosition } from './types';
import { glass } from './types';

interface CompanyTabProps {
  settings: CompanySettings;
  onChange: (settings: CompanySettings) => void;
  onShowMessage: (message: string) => void;
  onError: (message: string) => void;
}

export function CompanyTab({ settings, onChange, onShowMessage, onError }: CompanyTabProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingAdminBg, setUploadingAdminBg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<LogoPosition | null>(null);

  // Logo position labels (removed 'quote' - deprecated)
  const logoPositions: { value: LogoPosition; label: string; icon: string; description: string }[] = [
    { value: 'header', label: 'Header', icon: 'ri-layout-top-line', description: 'Logo hiển thị trên header' },
    { value: 'footer', label: 'Footer', icon: 'ri-layout-bottom-line', description: 'Logo hiển thị ở footer' },
    { value: 'pdf', label: 'PDF / Báo giá', icon: 'ri-file-pdf-line', description: 'Logo trong file PDF báo giá' },
    { value: 'favicon', label: 'Favicon', icon: 'ri-window-line', description: 'Icon tab trình duyệt (32x32px)' },
  ];

  // Resolve background image URL
  const backgroundImageUrl = useMemo(() => {
    if (!settings.backgroundImage) return null;
    return resolveMediaUrl(settings.backgroundImage);
  }, [settings.backgroundImage]);

  // Resolve admin background image URL
  const adminBackgroundImageUrl = useMemo(() => {
    if (!settings.adminBackgroundImage) return null;
    return resolveMediaUrl(settings.adminBackgroundImage);
  }, [settings.adminBackgroundImage]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      await settingsApi.update('company', { value: settings });
      localStorage.setItem('companySettings', JSON.stringify(settings));
      onShowMessage('✅ Thông tin công ty đã được lưu!');
    } catch (error) {
      console.error('Error saving company settings:', error);
      onError('Lưu thông tin công ty thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [settings, onShowMessage, onError]);

  const handleBackgroundUpload = useCallback(async (file: File) => {
    try {
      setUploadingBg(true);
      const result = await mediaApi.uploadFile(file);

      const updatedSettings = { ...settings, backgroundImage: result.url };
      onChange(updatedSettings);

      // Save immediately
      await settingsApi.update('company', { value: updatedSettings });

      onShowMessage('✅ Hình nền đã được cập nhật!');
    } catch (error) {
      console.error('Error uploading background:', error);
      onError('Upload hình nền thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingBg(false);
    }
  }, [settings, onChange, onShowMessage, onError]);

  const handleRemoveBackground = useCallback(async () => {
    if (!confirm('Xóa hình nền trang web?')) return;

    try {
      setSaving(true);
      const updatedSettings = { ...settings, backgroundImage: '' };
      onChange(updatedSettings);

      await settingsApi.update('company', { value: updatedSettings });

      onShowMessage('✅ Đã xóa hình nền!');
    } catch (error) {
      console.error('Error removing background:', error);
      onError('Xóa hình nền thất bại.');
    } finally {
      setSaving(false);
    }
  }, [settings, onChange, onShowMessage, onError]);

  // Admin background handlers
  const handleAdminBackgroundUpload = useCallback(async (file: File) => {
    try {
      setUploadingAdminBg(true);
      const result = await mediaApi.uploadFile(file);

      const updatedSettings = { ...settings, adminBackgroundImage: result.url };
      onChange(updatedSettings);

      // Save immediately
      await settingsApi.update('company', { value: updatedSettings });

      onShowMessage('✅ Hình nền Admin đã được cập nhật!');
    } catch (error) {
      console.error('Error uploading admin background:', error);
      onError('Upload hình nền Admin thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingAdminBg(false);
    }
  }, [settings, onChange, onShowMessage, onError]);

  const handleRemoveAdminBackground = useCallback(async () => {
    if (!confirm('Xóa hình nền Admin?')) return;

    try {
      setSaving(true);
      const updatedSettings = { ...settings, adminBackgroundImage: '' };
      onChange(updatedSettings);

      await settingsApi.update('company', { value: updatedSettings });

      onShowMessage('✅ Đã xóa hình nền Admin!');
    } catch (error) {
      console.error('Error removing admin background:', error);
      onError('Xóa hình nền Admin thất bại.');
    } finally {
      setSaving(false);
    }
  }, [settings, onChange, onShowMessage, onError]);

  // Logo handlers
  const handleLogoUpload = useCallback(async (file: File, position: LogoPosition) => {
    try {
      setUploadingLogo(position);
      const result = await mediaApi.uploadFile(file);
      
      const currentLogos = settings.logos || [];
      const existingIndex = currentLogos.findIndex(l => l.position === position);
      
      const newLogo: LogoItem = {
        id: `logo-${position}-${Date.now()}`,
        name: file.name,
        url: result.url,
        position,
      };

      let updatedLogos: LogoItem[];
      if (existingIndex >= 0) {
        updatedLogos = [...currentLogos];
        updatedLogos[existingIndex] = newLogo;
      } else {
        updatedLogos = [...currentLogos, newLogo];
      }

      const updatedSettings = { ...settings, logos: updatedLogos };
      onChange(updatedSettings);
      await settingsApi.update('company', { value: updatedSettings });
      
      onShowMessage(`✅ Logo ${logoPositions.find(p => p.value === position)?.label} đã được cập nhật!`);
    } catch (error) {
      console.error('Error uploading logo:', error);
      onError('Upload logo thất bại.');
    } finally {
      setUploadingLogo(null);
    }
  }, [settings, onChange, onShowMessage, onError, logoPositions]);

  const handleRemoveLogo = useCallback(async (position: LogoPosition) => {
    const posLabel = logoPositions.find(p => p.value === position)?.label;
    if (!confirm(`Xóa logo ${posLabel}?`)) return;

    try {
      setSaving(true);
      const updatedLogos = (settings.logos || []).filter(l => l.position !== position);
      const updatedSettings = { ...settings, logos: updatedLogos };
      onChange(updatedSettings);
      await settingsApi.update('company', { value: updatedSettings });
      onShowMessage(`✅ Đã xóa logo ${posLabel}!`);
    } catch (error) {
      console.error('Error removing logo:', error);
      onError('Xóa logo thất bại.');
    } finally {
      setSaving(false);
    }
  }, [settings, onChange, onShowMessage, onError, logoPositions]);

  const getLogoForPosition = useCallback((position: LogoPosition): LogoItem | undefined => {
    return (settings.logos || []).find(l => l.position === position);
  }, [settings.logos]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Page Background */}
      <Card icon="ri-image-2-line" title="Hình Nền Trang Web" subtitle="Upload hình nền cho landing page">
        <div style={{ marginBottom: 12, fontSize: 13, color: tokens.color.muted }}>
          Khuyến nghị: 1920x1080px hoặc lớn hơn, ảnh chất lượng cao.
        </div>

        {settings.backgroundImage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Image Preview */}
            <div style={{ 
              borderRadius: tokens.radius.md, 
              overflow: 'hidden',
              border: `1px solid ${tokens.color.border}`,
            }}>
              <img
                src={backgroundImageUrl || settings.backgroundImage}
                alt="Page background"
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  console.error('Image load error:', settings.backgroundImage);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            {/* Delete Button - Outside image */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary" 
                onClick={handleRemoveBackground} 
                disabled={saving}
                style={{ 
                  background: tokens.color.errorBg,
                  borderColor: tokens.color.error,
                  color: tokens.color.error,
                }}
              >
                <i className="ri-delete-bin-line" /> Xóa hình nền
              </Button>
            </div>
          </div>
        ) : (
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            border: `2px dashed ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBackgroundUpload(file);
              }}
            />
            {uploadingBg ? (
              <i className="ri-loader-4-line" style={{ fontSize: 32, color: tokens.color.primary }} />
            ) : (
              <>
                <i className="ri-upload-cloud-2-line" style={{ fontSize: 32, color: tokens.color.muted, marginBottom: 8 }} />
                <span style={{ color: tokens.color.muted }}>Click để upload hình nền</span>
              </>
            )}
          </label>
        )}
      </Card>

      {/* Admin Background */}
      <Card icon="ri-admin-line" title="Hình Nền Admin Panel" subtitle="Upload hình nền cho trang quản trị">
        <div style={{ marginBottom: 12, fontSize: 13, color: tokens.color.muted }}>
          Khuyến nghị: 1920x1080px hoặc lớn hơn. Hình nền sẽ hiển thị mờ phía sau nội dung admin.
        </div>

        {settings.adminBackgroundImage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Image Preview */}
            <div style={{ 
              borderRadius: tokens.radius.md, 
              overflow: 'hidden',
              border: `1px solid ${tokens.color.border}`,
            }}>
              <img
                src={adminBackgroundImageUrl || settings.adminBackgroundImage}
                alt="Admin background"
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  console.error('Image load error:', settings.adminBackgroundImage);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            {/* Delete Button - Outside image */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary" 
                onClick={handleRemoveAdminBackground} 
                disabled={saving}
                style={{ 
                  background: tokens.color.errorBg,
                  borderColor: tokens.color.error,
                  color: tokens.color.error,
                }}
              >
                <i className="ri-delete-bin-line" /> Xóa hình nền
              </Button>
            </div>
          </div>
        ) : (
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            border: `2px dashed ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAdminBackgroundUpload(file);
              }}
            />
            {uploadingAdminBg ? (
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 32, color: tokens.color.primary }}
              />
            ) : (
              <>
                <i className="ri-upload-cloud-2-line" style={{ fontSize: 32, color: tokens.color.muted, marginBottom: 8 }} />
                <span style={{ color: tokens.color.muted }}>Click để upload hình nền Admin</span>
              </>
            )}
          </label>
        )}
      </Card>

      {/* Logo Management */}
      <Card icon="ri-image-line" title="Quản Lý Logo" subtitle="Upload logo cho các vị trí khác nhau trên website">
        <div style={{ 
          padding: 12, 
          background: 'rgba(245,211,147,0.1)', 
          border: '1px solid rgba(245,211,147,0.2)',
          borderRadius: tokens.radius.md,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.color.primary, fontSize: 13 }}>
            <i className="ri-information-line" />
            Upload logo riêng cho từng vị trí. Khuyến nghị: PNG trong suốt, tối thiểu 200px chiều rộng.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {logoPositions.map((pos) => {
            const logo = getLogoForPosition(pos.value);
            const isUploading = uploadingLogo === pos.value;
            
            return (
              <div
                key={pos.value}
                style={{
                  padding: 16,
                  background: glass.background,
                  border: glass.border,
                  borderRadius: tokens.radius.md,
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginBottom: 12,
                  color: tokens.color.text,
                  fontWeight: 500,
                }}>
                  <i className={pos.icon} style={{ fontSize: 18, color: tokens.color.primary }} />
                  {pos.label}
                </div>
                <div style={{ fontSize: 12, color: tokens.color.muted, marginBottom: 12 }}>
                  {pos.description}
                </div>

                {logo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                      padding: 12,
                      background: tokens.color.surfaceAlt,
                      borderRadius: tokens.radius.sm,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 80,
                    }}>
                      <img
                        src={resolveMediaUrl(logo.url)}
                        alt={`Logo ${pos.label}`}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: 60, 
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{ flex: 1 }}>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file, pos.value);
                          }}
                        />
                        <Button 
                          variant="secondary" 
                          style={{ width: '100%', padding: '6px 12px', fontSize: 12 }}
                          disabled={isUploading}
                        >
                          <i className={isUploading ? 'ri-loader-4-line' : 'ri-refresh-line'} />
                          Thay đổi
                        </Button>
                      </label>
                      <Button 
                        variant="secondary" 
                        onClick={() => handleRemoveLogo(pos.value)}
                        disabled={saving}
                        style={{ 
                          padding: '6px 12px',
                          fontSize: 12,
                          color: tokens.color.error,
                          borderColor: tokens.color.error,
                        }}
                      >
                        <i className="ri-delete-bin-line" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                    border: `2px dashed ${tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: 80,
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, pos.value);
                      }}
                    />
                    {isUploading ? (
                      <motion.i
                        className="ri-loader-4-line"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ fontSize: 24, color: tokens.color.primary }}
                      />
                    ) : (
                      <>
                        <i className="ri-upload-cloud-line" style={{ fontSize: 20, color: tokens.color.muted, marginBottom: 4 }} />
                        <span style={{ color: tokens.color.muted, fontSize: 11 }}>Upload logo</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Company Info */}
      <Card icon="ri-building-2-line" title="Thông Tin Công Ty" subtitle="Thông tin hiển thị trên website">
        <Input
          label="Tên công ty"
          value={settings.name}
          onChange={(value) => onChange({ ...settings, name: value })}
          placeholder="Nội Thất Nhanh"
          fullWidth
        />

        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
            Mô tả
          </label>
          <textarea
            value={settings.description}
            onChange={(e) => onChange({ ...settings, description: e.target.value })}
            placeholder="Mô tả ngắn về công ty..."
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
          <Input
            label="Số điện thoại"
            value={settings.phone}
            onChange={(value) => onChange({ ...settings, phone: value })}
            placeholder="0909 123 456"
            fullWidth
          />
          <Input
            label="Email"
            value={settings.email}
            onChange={(value) => onChange({ ...settings, email: value })}
            placeholder="contact@noithatnhanh.vn"
            fullWidth
          />
          <Input
            label="Website"
            value={settings.website}
            onChange={(value) => onChange({ ...settings, website: value })}
            placeholder="https://noithatnhanh.vn"
            fullWidth
          />
          <Input
            label="Giờ làm việc"
            value={settings.workingHours}
            onChange={(value) => onChange({ ...settings, workingHours: value })}
            placeholder="T2 - T7: 8:00 - 18:00"
            fullWidth
          />
        </div>

        <Input
          label="Địa chỉ"
          value={settings.address}
          onChange={(value) => onChange({ ...settings, address: value })}
          placeholder="123 Đường ABC, Quận 1, TP.HCM"
          fullWidth
          style={{ marginTop: 16 }}
        />

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <i className={saving ? 'ri-loader-4-line' : 'ri-save-line'} />
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
