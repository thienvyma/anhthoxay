/**
 * PdfSettingsTab - Furniture PDF Configuration with Live Preview
 *
 * Feature: furniture-quotation
 * Allows customization of PDF quotation appearance with real-time preview
 */

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { furniturePdfSettingsApi } from '../../api/furniture';
import { PdfPreview } from './components/PdfPreview';
import type { PdfSettingsTabProps, FurniturePdfSettings, UpdatePdfSettingsInput } from './types';

// Default settings for new instances
const DEFAULT_SETTINGS: FurniturePdfSettings = {
  id: 'default',
  companyName: 'NỘI THẤT NHANH',
  companyTagline: 'Đối tác tin cậy cho ngôi nhà của bạn',
  companyLogo: null,
  documentTitle: 'BÁO GIÁ NỘI THẤT',
  primaryColor: '#F5D393',
  textColor: '#333333',
  mutedColor: '#666666',
  borderColor: '#E0E0E0',
  companyNameSize: 24,
  documentTitleSize: 18,
  sectionTitleSize: 12,
  bodyTextSize: 10,
  footerTextSize: 8,
  apartmentInfoTitle: 'THÔNG TIN CĂN HỘ',
  selectionTypeTitle: 'LOẠI LỰA CHỌN',
  productsTitle: 'SẢN PHẨM ĐÃ CHỌN',
  priceDetailsTitle: 'CHI TIẾT GIÁ',
  contactInfoTitle: 'THÔNG TIN LIÊN HỆ',
  totalLabel: 'TỔNG CỘNG',
  footerNote: 'Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm và điều kiện cụ thể.',
  footerCopyright: '© NỘI THẤT NHANH - Đối tác tin cậy cho ngôi nhà của bạn',
  contactPhone: null,
  contactEmail: null,
  contactAddress: null,
  contactWebsite: null,
  additionalNotes: null,
  validityDays: 30,
  showLayoutImage: true,
  showItemsTable: true,
  showFeeDetails: true,
  showContactInfo: false,
  showValidityDate: true,
  showQuotationCode: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ========== COMPONENT ==========
export function PdfSettingsTab({ pdfSettings: initialSettings, onRefresh }: PdfSettingsTabProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<FurniturePdfSettings>(initialSettings || DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState<string>('company');
  const [showPreview, setShowPreview] = useState(true);

  // Fetch settings on mount if not provided
  useEffect(() => {
    if (!initialSettings) {
      fetchSettings();
    }
  }, [initialSettings]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await furniturePdfSettingsApi.get();
      setSettings(data);
    } catch {
      toast.error('Không thể tải cài đặt PDF');
    } finally {
      setLoading(false);
    }
  };

  // Update field helper
  const updateField = useCallback(<K extends keyof UpdatePdfSettingsInput>(
    field: K,
    value: UpdatePdfSettingsInput[K]
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Save settings
  const handleSave = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = settings;
      await furniturePdfSettingsApi.update(updateData);
      toast.success('Đã lưu cài đặt PDF');
      onRefresh();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm('Bạn có chắc muốn khôi phục cài đặt mặc định?')) return;
    setLoading(true);
    try {
      const data = await furniturePdfSettingsApi.reset();
      setSettings(data);
      toast.success('Đã khôi phục cài đặt mặc định');
      onRefresh();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'company', label: 'Công ty', icon: 'ri-building-line' },
    { id: 'colors', label: 'Màu sắc', icon: 'ri-palette-line' },
    { id: 'fonts', label: 'Font chữ', icon: 'ri-font-size-2' },
    { id: 'titles', label: 'Tiêu đề', icon: 'ri-text' },
    { id: 'contact', label: 'Liên hệ', icon: 'ri-contacts-line' },
    { id: 'footer', label: 'Footer', icon: 'ri-file-text-line' },
    { id: 'display', label: 'Hiển thị', icon: 'ri-eye-line' },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ color: tokens.color.text, margin: 0, fontSize: 20, fontWeight: 600 }}>
            Cài đặt PDF Báo giá
          </h3>
          <p style={{ color: tokens.color.muted, margin: '4px 0 0', fontSize: 13 }}>
            Tùy chỉnh giao diện file PDF báo giá nội thất
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: showPreview ? tokens.color.primary : tokens.color.surfaceHover,
              color: showPreview ? '#111' : tokens.color.text,
              border: `1px solid ${showPreview ? tokens.color.primary : tokens.color.border}`,
              borderRadius: tokens.radius.md,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <i className={showPreview ? 'ri-eye-off-line' : 'ri-eye-line'} />
            {showPreview ? 'Ẩn Preview' : 'Hiện Preview'}
          </motion.button>
          <Button onClick={handleReset} disabled={loading} variant="outline">
            <i className="ri-refresh-line" /> Khôi phục mặc định
          </Button>
          <Button onClick={handleSave} loading={loading}>
            <i className="ri-save-line" /> Lưu thay đổi
          </Button>
        </div>
      </div>

      {/* Main Layout: Settings + Preview */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Settings Panel */}
        <div style={{ flex: showPreview ? '0 0 calc(100% - 424px)' : 1, minWidth: 0 }}>
          {/* Section Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {sections.map((section) => (
              <motion.button
                key={section.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: tokens.radius.md,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeSection === section.id ? tokens.color.primary : tokens.color.surface,
                  color: activeSection === section.id ? '#111' : tokens.color.text,
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                <i className={section.icon} />
                {section.label}
              </motion.button>
            ))}
          </div>

          {/* Section Content */}
          <Card style={{ minHeight: 300 }}>
            {activeSection === 'company' && (
              <SettingsSection title="Thông tin công ty" icon="ri-building-line">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                  <Input
                    label="Tên công ty"
                    value={settings.companyName}
                    onChange={(val) => updateField('companyName', val)}
                    placeholder="NỘI THẤT NHANH"
                    fullWidth
                  />
                  <Input
                    label="Slogan"
                    value={settings.companyTagline}
                    onChange={(val) => updateField('companyTagline', val)}
                    placeholder="Đối tác tin cậy..."
                    fullWidth
                  />
                  <Input
                    label="Logo URL"
                    value={settings.companyLogo || ''}
                    onChange={(val) => updateField('companyLogo', val || null)}
                    placeholder="https://..."
                    fullWidth
                  />
                  <Input
                    label="Tiêu đề tài liệu"
                    value={settings.documentTitle}
                    onChange={(val) => updateField('documentTitle', val)}
                    placeholder="BÁO GIÁ NỘI THẤT"
                    fullWidth
                  />
                </div>
              </SettingsSection>
            )}

            {activeSection === 'colors' && (
              <SettingsSection title="Màu sắc" icon="ri-palette-line">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <ColorInput label="Màu chính" value={settings.primaryColor} onChange={(val) => updateField('primaryColor', val)} />
                  <ColorInput label="Màu chữ" value={settings.textColor} onChange={(val) => updateField('textColor', val)} />
                  <ColorInput label="Màu phụ" value={settings.mutedColor} onChange={(val) => updateField('mutedColor', val)} />
                  <ColorInput label="Màu viền" value={settings.borderColor} onChange={(val) => updateField('borderColor', val)} />
                </div>
              </SettingsSection>
            )}

            {activeSection === 'fonts' && (
              <SettingsSection title="Kích thước font (pt)" icon="ri-font-size-2">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <NumberInput label="Tên công ty" value={settings.companyNameSize} onChange={(val) => updateField('companyNameSize', val)} min={12} max={48} />
                  <NumberInput label="Tiêu đề tài liệu" value={settings.documentTitleSize} onChange={(val) => updateField('documentTitleSize', val)} min={10} max={36} />
                  <NumberInput label="Tiêu đề section" value={settings.sectionTitleSize} onChange={(val) => updateField('sectionTitleSize', val)} min={8} max={24} />
                  <NumberInput label="Nội dung" value={settings.bodyTextSize} onChange={(val) => updateField('bodyTextSize', val)} min={6} max={18} />
                  <NumberInput label="Footer" value={settings.footerTextSize} onChange={(val) => updateField('footerTextSize', val)} min={6} max={14} />
                </div>
              </SettingsSection>
            )}

            {activeSection === 'titles' && (
              <SettingsSection title="Tiêu đề các phần" icon="ri-text">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                  <Input label="Thông tin căn hộ" value={settings.apartmentInfoTitle} onChange={(val) => updateField('apartmentInfoTitle', val)} fullWidth />
                  <Input label="Loại lựa chọn" value={settings.selectionTypeTitle} onChange={(val) => updateField('selectionTypeTitle', val)} fullWidth />
                  <Input label="Sản phẩm" value={settings.productsTitle} onChange={(val) => updateField('productsTitle', val)} fullWidth />
                  <Input label="Chi tiết giá" value={settings.priceDetailsTitle} onChange={(val) => updateField('priceDetailsTitle', val)} fullWidth />
                  <Input label="Thông tin liên hệ" value={settings.contactInfoTitle} onChange={(val) => updateField('contactInfoTitle', val)} fullWidth />
                  <Input label="Tổng cộng" value={settings.totalLabel} onChange={(val) => updateField('totalLabel', val)} fullWidth />
                </div>
              </SettingsSection>
            )}

            {activeSection === 'contact' && (
              <SettingsSection title="Thông tin liên hệ" icon="ri-contacts-line">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                  <Input label="Số điện thoại" value={settings.contactPhone || ''} onChange={(val) => updateField('contactPhone', val || null)} placeholder="0123 456 789" fullWidth />
                  <Input label="Email" value={settings.contactEmail || ''} onChange={(val) => updateField('contactEmail', val || null)} placeholder="contact@example.com" fullWidth />
                  <Input label="Địa chỉ" value={settings.contactAddress || ''} onChange={(val) => updateField('contactAddress', val || null)} placeholder="123 Đường ABC..." fullWidth />
                  <Input label="Website" value={settings.contactWebsite || ''} onChange={(val) => updateField('contactWebsite', val || null)} placeholder="https://..." fullWidth />
                </div>
              </SettingsSection>
            )}

            {activeSection === 'footer' && (
              <SettingsSection title="Nội dung Footer" icon="ri-file-text-line">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <TextArea label="Ghi chú cuối trang" value={settings.footerNote} onChange={(val) => updateField('footerNote', val)} rows={2} fullWidth />
                  <Input label="Copyright" value={settings.footerCopyright} onChange={(val) => updateField('footerCopyright', val)} fullWidth />
                  <TextArea label="Ghi chú bổ sung" value={settings.additionalNotes || ''} onChange={(val) => updateField('additionalNotes', val || null)} rows={3} fullWidth />
                  <NumberInput label="Thời hạn hiệu lực (ngày)" value={settings.validityDays} onChange={(val) => updateField('validityDays', val)} min={0} max={365} />
                </div>
              </SettingsSection>
            )}

            {activeSection === 'display' && (
              <SettingsSection title="Tùy chọn hiển thị" icon="ri-eye-line">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ToggleOption label="Hiển thị hình ảnh mặt bằng" checked={settings.showLayoutImage} onChange={(val) => updateField('showLayoutImage', val)} />
                  <ToggleOption label="Hiển thị bảng sản phẩm" checked={settings.showItemsTable} onChange={(val) => updateField('showItemsTable', val)} />
                  <ToggleOption label="Hiển thị chi tiết phí" checked={settings.showFeeDetails} onChange={(val) => updateField('showFeeDetails', val)} />
                  <ToggleOption label="Hiển thị thông tin liên hệ" checked={settings.showContactInfo} onChange={(val) => updateField('showContactInfo', val)} />
                  <ToggleOption label="Hiển thị ngày hiệu lực" checked={settings.showValidityDate} onChange={(val) => updateField('showValidityDate', val)} />
                  <ToggleOption label="Hiển thị mã báo giá" checked={settings.showQuotationCode} onChange={(val) => updateField('showQuotationCode', val)} />
                </div>
              </SettingsSection>
            )}
          </Card>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ width: 400, flexShrink: 0, position: 'sticky', top: 24 }}
          >
            <PdfPreview settings={settings} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ========== HELPER COMPONENTS ==========

function SettingsSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <i className={icon} style={{ fontSize: 18, color: tokens.color.primary }} />
        <h4 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, color: tokens.color.muted, fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 40,
            height: 40,
            padding: 0,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
            cursor: 'pointer',
            background: 'transparent',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.background,
            color: tokens.color.text,
            fontSize: 14,
            fontFamily: 'monospace',
          }}
        />
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, min = 0, max = 100 }: { label: string; value: number; onChange: (val: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, color: tokens.color.muted, fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{ flex: 1, cursor: 'pointer' }}
        />
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || min)}
          style={{
            width: 60,
            padding: '6px 8px',
            borderRadius: tokens.radius.sm,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.background,
            color: tokens.color.text,
            fontSize: 14,
            textAlign: 'center',
          }}
        />
      </div>
    </div>
  );
}

function ToggleOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: checked ? `${tokens.color.primary}10` : 'transparent',
        borderRadius: tokens.radius.md,
        border: `1px solid ${checked ? tokens.color.primary : tokens.color.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, cursor: 'pointer' }}
      />
      <span style={{ color: tokens.color.text, fontSize: 14 }}>{label}</span>
    </label>
  );
}

export default PdfSettingsTab;
