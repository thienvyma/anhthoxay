/**
 * Email Settings Tab - Tùy chỉnh nội dung email báo giá
 *
 * Cho phép admin tùy chỉnh:
 * - Tiêu đề email
 * - Nội dung greeting
 * - Nội dung chính
 * - Lưu ý
 * - CTA button
 * - Footer
 */

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { settingsApi } from '../../api';
import type { EmailSettings } from './types';
import { defaultEmailSettings, glass } from './types';

interface EmailSettingsTabProps {
  onShowMessage: (message: string) => void;
  onError: (message: string) => void;
}

export function EmailSettingsTab({ onShowMessage, onError }: EmailSettingsTabProps) {
  const [settings, setSettings] = useState<EmailSettings>(defaultEmailSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await settingsApi.get('email');
        if (result?.value && typeof result.value === 'object') {
          setSettings((prev) => ({ ...prev, ...(result.value as EmailSettings) }));
        }
      } catch (error) {
        console.error('Failed to fetch email settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      await settingsApi.update('email', { value: settings });
      onShowMessage('✅ Cài đặt email đã được lưu!');
    } catch (error) {
      console.error('Error saving email settings:', error);
      onError('Lưu cài đặt email thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [settings, onShowMessage, onError]);

  const handleReset = useCallback(() => {
    if (!confirm('Khôi phục cài đặt email về mặc định?')) return;
    setSettings(defaultEmailSettings);
    onShowMessage('Đã khôi phục cài đặt mặc định. Nhấn "Lưu" để áp dụng.');
  }, [onShowMessage]);

  const updateField = useCallback(<K extends keyof EmailSettings>(field: K, value: EmailSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 32, color: tokens.color.primary }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Info Banner */}
      <div style={{
        padding: 16,
        background: `${tokens.color.info}15`,
        border: `1px solid ${tokens.color.info}30`,
        borderRadius: tokens.radius.md,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <i className="ri-mail-settings-line" style={{ fontSize: 20, color: tokens.color.info, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 500, color: tokens.color.text, marginBottom: 4 }}>
            Tùy chỉnh nội dung Email báo giá
          </div>
          <div style={{ fontSize: 13, color: tokens.color.muted }}>
            Các cài đặt này áp dụng cho email gửi báo giá nội thất. Sử dụng biến <code style={{ 
              background: tokens.color.surfaceAlt, 
              padding: '2px 6px', 
              borderRadius: 4,
              fontSize: 12,
            }}>{'{{tên_biến}}'}</code> để chèn thông tin động.
          </div>
        </div>
      </div>

      {/* Subject & Brand */}
      <Card icon="ri-mail-line" title="Tiêu đề & Thương hiệu" subtitle="Cấu hình tiêu đề email và tên thương hiệu">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Input
            label="Tên thương hiệu"
            value={settings.brandName}
            onChange={(value) => updateField('brandName', value)}
            placeholder="NỘI THẤT NHANH"
            fullWidth
          />
          <Input
            label="Tagline"
            value={settings.tagline}
            onChange={(value) => updateField('tagline', value)}
            placeholder="Đối tác tin cậy cho ngôi nhà của bạn"
            fullWidth
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <Input
            label="Tiêu đề email"
            value={settings.subjectTemplate}
            onChange={(value) => updateField('subjectTemplate', value)}
            placeholder="[NỘI THẤT NHANH] Báo giá nội thất - Căn hộ {{unitNumber}}"
            fullWidth
          />
          <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 4 }}>
            Biến hỗ trợ: <code>{'{{unitNumber}}'}</code>
          </div>
        </div>
      </Card>

      {/* Greeting & Intro */}
      <Card icon="ri-chat-smile-2-line" title="Lời chào & Giới thiệu" subtitle="Nội dung mở đầu email">
        <Input
          label="Lời chào"
          value={settings.greetingTemplate}
          onChange={(value) => updateField('greetingTemplate', value)}
          placeholder="Xin chào {{leadName}},"
          fullWidth
        />
        <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 4, marginBottom: 16 }}>
          Biến hỗ trợ: <code>{'{{leadName}}'}</code>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
            Nội dung giới thiệu
          </label>
          <textarea
            value={settings.introText}
            onChange={(e) => updateField('introText', e.target.value)}
            placeholder="Cảm ơn bạn đã sử dụng dịch vụ báo giá nội thất..."
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
          <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 4 }}>
            Biến hỗ trợ: <code>{'{{brandName}}'}</code>
          </div>
        </div>
      </Card>

      {/* Info Box Labels */}
      <Card icon="ri-file-info-line" title="Thông tin căn hộ" subtitle="Nhãn hiển thị trong box thông tin">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Input
            label="Tiêu đề box"
            value={settings.infoBoxTitle}
            onChange={(value) => updateField('infoBoxTitle', value)}
            placeholder="📍 Thông tin căn hộ"
            fullWidth
          />
          <Input
            label="Nhãn Dự án"
            value={settings.labelProject}
            onChange={(value) => updateField('labelProject', value)}
            placeholder="Dự án"
            fullWidth
          />
          <Input
            label="Nhãn Tòa nhà"
            value={settings.labelBuilding}
            onChange={(value) => updateField('labelBuilding', value)}
            placeholder="Tòa nhà"
            fullWidth
          />
          <Input
            label="Nhãn Căn hộ"
            value={settings.labelUnit}
            onChange={(value) => updateField('labelUnit', value)}
            placeholder="Căn hộ"
            fullWidth
          />
          <Input
            label="Nhãn Loại căn hộ"
            value={settings.labelApartmentType}
            onChange={(value) => updateField('labelApartmentType', value)}
            placeholder="Loại căn hộ"
            fullWidth
          />
        </div>
      </Card>

      {/* Attachment & Note */}
      <Card icon="ri-attachment-line" title="Đính kèm & Lưu ý" subtitle="Thông báo về file đính kèm và lưu ý quan trọng">
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
            Thông báo file đính kèm
          </label>
          <textarea
            value={settings.attachmentNotice}
            onChange={(e) => updateField('attachmentNotice', e.target.value)}
            placeholder="Vui lòng xem file PDF đính kèm để biết chi tiết báo giá..."
            rows={2}
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

        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
            Lưu ý quan trọng
          </label>
          <textarea
            value={settings.disclaimerText}
            onChange={(e) => updateField('disclaimerText', e.target.value)}
            placeholder="Báo giá này chỉ mang tính chất tham khảo..."
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
      </Card>

      {/* CTA Section */}
      <Card icon="ri-cursor-line" title="Call-to-Action" subtitle="Nút kêu gọi hành động">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Input
            label="Câu hỏi CTA"
            value={settings.ctaQuestion}
            onChange={(value) => updateField('ctaQuestion', value)}
            placeholder="Bạn có câu hỏi hoặc cần tư vấn thêm?"
            fullWidth
          />
          <Input
            label="Text nút CTA"
            value={settings.ctaButtonText}
            onChange={(value) => updateField('ctaButtonText', value)}
            placeholder="Liên hệ ngay"
            fullWidth
          />
          <Input
            label="Link CTA"
            value={settings.ctaButtonLink}
            onChange={(value) => updateField('ctaButtonLink', value)}
            placeholder="https://noithatnhanh.vn/lien-he"
            fullWidth
          />
        </div>
      </Card>

      {/* Signature & Footer */}
      <Card icon="ri-edit-line" title="Chữ ký & Footer" subtitle="Phần kết thúc email">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Input
            label="Lời kết"
            value={settings.signatureClosing}
            onChange={(value) => updateField('signatureClosing', value)}
            placeholder="Trân trọng,"
            fullWidth
          />
          <Input
            label="Tên đội ngũ"
            value={settings.signatureTeam}
            onChange={(value) => updateField('signatureTeam', value)}
            placeholder="Đội ngũ tư vấn nội thất"
            fullWidth
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Input
            label="Copyright"
            value={settings.footerCopyright}
            onChange={(value) => updateField('footerCopyright', value)}
            placeholder="© {{year}} NỘI THẤT NHANH - Đối tác tin cậy cho ngôi nhà của bạn"
            fullWidth
          />
          <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 4 }}>
            Biến hỗ trợ: <code>{'{{year}}'}</code>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
          <Input
            label="Website"
            value={settings.footerWebsite}
            onChange={(value) => updateField('footerWebsite', value)}
            placeholder="noithatnhanh.vn"
            fullWidth
          />
          <Input
            label="Hotline"
            value={settings.footerHotline}
            onChange={(value) => updateField('footerHotline', value)}
            placeholder="1900-xxxx"
            fullWidth
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Input
            label="Lưu ý spam"
            value={settings.spamNotice}
            onChange={(value) => updateField('spamNotice', value)}
            placeholder="📧 Nếu bạn không thấy email này trong hộp thư đến..."
            fullWidth
          />
        </div>
      </Card>

      {/* Preview Toggle */}
      <Card icon="ri-eye-line" title="Xem trước" subtitle="Preview nội dung email với dữ liệu mẫu">
        <Button
          variant="secondary"
          onClick={() => setShowPreview(!showPreview)}
          style={{ marginBottom: showPreview ? 16 : 0 }}
        >
          <i className={showPreview ? 'ri-eye-off-line' : 'ri-eye-line'} />
          {showPreview ? 'Ẩn preview' : 'Xem preview'}
        </Button>

        {showPreview && (
          <div style={{
            padding: 16,
            background: '#ffffff',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            color: '#333',
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #F5D393 0%, #E8C078 100%)', 
              padding: 20, 
              textAlign: 'center',
              borderRadius: `${tokens.radius.md} ${tokens.radius.md} 0 0`,
              marginTop: -16,
              marginLeft: -16,
              marginRight: -16,
            }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{settings.brandName}</h2>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#555' }}>{settings.tagline}</p>
            </div>

            <div style={{ padding: '20px 0' }}>
              <p><strong>{settings.greetingTemplate.replace('{{leadName}}', 'Nguyễn Văn A')}</strong></p>
              <p>{settings.introText.replace('{{brandName}}', settings.brandName)}</p>

              <div style={{
                background: '#faf8f5',
                borderLeft: '4px solid #F5D393',
                padding: 16,
                margin: '20px 0',
                borderRadius: '0 8px 8px 0',
              }}>
                <h4 style={{ margin: '0 0 12px' }}>{settings.infoBoxTitle}</h4>
                <p style={{ margin: '4px 0' }}><strong>{settings.labelProject}:</strong> Vinhomes Grand Park</p>
                <p style={{ margin: '4px 0' }}><strong>{settings.labelBuilding}:</strong> S1.01</p>
                <p style={{ margin: '4px 0' }}><strong>{settings.labelUnit}:</strong> A-1201</p>
                <p style={{ margin: '4px 0' }}><strong>{settings.labelApartmentType}:</strong> 2PN</p>
              </div>

              <div style={{
                background: '#e8f4e8',
                border: '1px solid #c3e6c3',
                borderRadius: 8,
                padding: 12,
                margin: '20px 0',
              }}>
                <span style={{ marginRight: 8 }}>📎</span>
                <strong>File đính kèm:</strong> {settings.attachmentNotice}
              </div>

              <div style={{
                background: '#fff9e6',
                border: '1px solid #f0e6b8',
                borderRadius: 8,
                padding: 12,
                margin: '20px 0',
                fontStyle: 'italic',
                fontSize: 13,
              }}>
                <strong>⚠️ Lưu ý:</strong> {settings.disclaimerText}
              </div>

              <div style={{ textAlign: 'center', margin: '24px 0', padding: 16, background: '#faf8f5', borderRadius: 8 }}>
                <p style={{ margin: '0 0 12px', color: '#666' }}>{settings.ctaQuestion}</p>
                <span style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #F5D393 0%, #E8C078 100%)',
                  color: '#333',
                  padding: '10px 24px',
                  borderRadius: 20,
                  fontWeight: 600,
                }}>
                  {settings.ctaButtonText}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 24 }}>
                <p style={{ margin: '4px 0' }}>{settings.signatureClosing}</p>
                <p style={{ margin: '4px 0', color: '#d4a84b', fontWeight: 700 }}>{settings.brandName}</p>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#888' }}>{settings.signatureTeam}</p>
              </div>
            </div>

            <div style={{
              background: '#333',
              padding: 20,
              textAlign: 'center',
              borderRadius: `0 0 ${tokens.radius.md} ${tokens.radius.md}`,
              marginBottom: -16,
              marginLeft: -16,
              marginRight: -16,
            }}>
              <p style={{ margin: '4px 0', color: '#F5D393', fontSize: 12 }}>
                {settings.footerCopyright.replace('{{year}}', new Date().getFullYear().toString())}
              </p>
              <p style={{ margin: '4px 0', color: '#999', fontSize: 12 }}>
                Website: {settings.footerWebsite} | Hotline: {settings.footerHotline}
              </p>
              <p style={{ margin: '12px 0 0', color: '#999', fontSize: 11, fontStyle: 'italic', borderTop: '1px solid #444', paddingTop: 12 }}>
                {settings.spamNotice}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="secondary" onClick={handleReset}>
          <i className="ri-refresh-line" />
          Khôi phục mặc định
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          <i className={saving ? 'ri-loader-4-line' : 'ri-save-line'} />
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </div>
    </motion.div>
  );
}
