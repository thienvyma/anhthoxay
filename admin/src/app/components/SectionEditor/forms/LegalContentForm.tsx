/**
 * LegalContentForm Component
 * Form for LEGAL_CONTENT section type (Privacy Policy & Terms of Use)
 */

import { motion } from 'framer-motion';
import { tokens } from '../../../../theme';
import { InfoBanner, FormSection, SelectInput } from './shared';
import { Button } from '../../Button';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn } from './shared';
import { generateUniqueId } from '../utils';

interface LegalContentFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: tokens.radius.md,
  border: `1px solid ${tokens.color.border}`,
  background: tokens.color.background,
  color: tokens.color.text,
  fontSize: 14,
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 80,
  resize: 'vertical' as const,
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  color: tokens.color.text,
  fontSize: 13,
  fontWeight: 500 as const,
};

interface LegalItem {
  _id: string;
  title: string;
  description: string;
}

// Custom ArraySection for LegalContent with icon and title support
function LegalArraySection({
  title,
  icon,
  items,
  onAdd,
  onRemove,
  addLabel,
  renderItem,
}: {
  title: string;
  icon: string;
  items: LegalItem[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  addLabel: string;
  renderItem: (item: LegalItem, idx: number) => React.JSX.Element;
}) {
  return (
    <div
      style={{
        background: `${tokens.color.primary}08`,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className={icon} style={{ color: tokens.color.primary, fontSize: 16 }} />
          <label style={{ fontWeight: 600, fontSize: 14, color: tokens.color.text }}>
            {title}
          </label>
        </div>
        <Button size="small" onClick={onAdd} icon="ri-add-line">
          {addLabel}
        </Button>
      </div>
      {items.map((item, idx) => (
        <motion.div
          key={item._id || idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 12,
            background: tokens.color.surfaceAlt,
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.muted }}>
              #{idx + 1}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemove(idx)}
              style={{
                padding: 6,
                background: `${tokens.color.error}15`,
                border: `1px solid ${tokens.color.error}30`,
                borderRadius: tokens.radius.sm,
                color: tokens.color.error,
                cursor: 'pointer',
              }}
            >
              <i className="ri-delete-bin-line" />
            </motion.button>
          </div>
          {renderItem(item, idx)}
        </motion.div>
      ))}
      {items.length === 0 && (
        <div
          style={{
            color: tokens.color.muted,
            fontSize: 13,
            textAlign: 'center',
            padding: 16,
          }}
        >
          Chưa có mục nào. Nhấn "{addLabel}" để thêm mới.
        </div>
      )}
    </div>
  );
}

export function LegalContentForm({ data, updateField, addArrayItem, removeArrayItem }: LegalContentFormProps) {
  const documentType = (data.documentType as string) || 'privacy_policy';
  const privacyPolicy = (data.privacyPolicy as DataRecord) || {};
  const termsOfUse = (data.termsOfUse as DataRecord) || {};

  const updatePrivacyField = (field: string, value: unknown) => {
    updateField(`privacyPolicy.${field}`, value);
  };

  const updateTermsField = (field: string, value: unknown) => {
    updateField(`termsOfUse.${field}`, value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <InfoBanner
        icon="ri-shield-check-line"
        color="#10b981"
        title="Chính Sách & Điều Khoản"
        description="Tạo trang Privacy Policy và Terms of Use chuyên nghiệp cho doanh nghiệp. Nội dung mẫu đã được chuẩn bị sẵn, bạn chỉ cần điều chỉnh theo nhu cầu."
      />

      {/* Document Type Selection */}
      <FormSection icon="ri-file-list-3-line" title="Loại tài liệu">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { value: 'privacy_policy', label: 'Chính sách bảo mật (Privacy Policy)' },
            { value: 'terms_of_use', label: 'Điều khoản sử dụng (Terms of Use)' },
            { value: 'both', label: 'Cả hai (hiển thị dạng tabs)' },
          ].map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '10px 12px',
                background: documentType === opt.value ? `${tokens.color.primary}15` : tokens.color.surfaceAlt,
                border: `1px solid ${documentType === opt.value ? tokens.color.primary : tokens.color.border}`,
                borderRadius: tokens.radius.md,
              }}
            >
              <input
                type="radio"
                checked={documentType === opt.value}
                onChange={() => updateField('documentType', opt.value)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14, color: tokens.color.text }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </FormSection>

      {/* Company Information */}
      <FormSection icon="ri-building-line" title="Thông tin doanh nghiệp">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Tên công ty</label>
            <input
              type="text"
              value={(data.companyName as string) || ''}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="Nội Thất Nhanh"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email liên hệ</label>
            <input
              type="email"
              value={(data.companyEmail as string) || ''}
              onChange={(e) => updateField('companyEmail', e.target.value)}
              placeholder="contact@company.vn"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Số điện thoại</label>
            <input
              type="text"
              value={(data.companyPhone as string) || ''}
              onChange={(e) => updateField('companyPhone', e.target.value)}
              placeholder="+84 123 456 789"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Ngày hiệu lực</label>
            <input
              type="date"
              value={(data.effectiveDate as string) || ''}
              onChange={(e) => updateField('effectiveDate', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Địa chỉ công ty</label>
          <input
            type="text"
            value={(data.companyAddress as string) || ''}
            onChange={(e) => updateField('companyAddress', e.target.value)}
            placeholder="123 Đường ABC, Quận 1, TP. Hồ Chí Minh"
            style={inputStyle}
          />
        </div>
      </FormSection>

      {/* Privacy Policy Content */}
      {(documentType === 'privacy_policy' || documentType === 'both') && (
        <>
          <div style={{ 
            padding: '12px 16px', 
            background: `${tokens.color.info}15`, 
            borderRadius: tokens.radius.md,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <i className="ri-shield-user-line" style={{ color: tokens.color.info, fontSize: 20 }} />
            <span style={{ color: tokens.color.text, fontWeight: 600 }}>Chính Sách Bảo Mật (Privacy Policy)</span>
          </div>

          <FormSection icon="ri-file-text-line" title="Giới thiệu">
            <textarea
              value={(privacyPolicy.introduction as string) || ''}
              onChange={(e) => updatePrivacyField('introduction', e.target.value)}
              placeholder="Mô tả ngắn gọn về cam kết bảo mật của công ty..."
              style={textareaStyle}
            />
          </FormSection>

          <LegalArraySection
            title="Dữ liệu thu thập"
            icon="ri-database-2-line"
            items={(privacyPolicy.dataCollection as LegalItem[]) || []}
            onAdd={() => addArrayItem('privacyPolicy.dataCollection', { _id: generateUniqueId(), title: '', description: '' })}
            onRemove={(index) => removeArrayItem('privacyPolicy.dataCollection', index)}
            addLabel="Thêm loại dữ liệu"
            renderItem={(item: LegalItem, index: number) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updatePrivacyField(`dataCollection.${index}.title`, e.target.value)}
                  placeholder="Loại dữ liệu (VD: Thông tin cá nhân)"
                  style={inputStyle}
                />
                <textarea
                  value={item.description}
                  onChange={(e) => updatePrivacyField(`dataCollection.${index}.description`, e.target.value)}
                  placeholder="Mô tả chi tiết..."
                  style={{ ...textareaStyle, minHeight: 60 }}
                />
              </div>
            )}
          />

          <LegalArraySection
            title="Mục đích sử dụng dữ liệu"
            icon="ri-focus-3-line"
            items={(privacyPolicy.dataUsage as LegalItem[]) || []}
            onAdd={() => addArrayItem('privacyPolicy.dataUsage', { _id: generateUniqueId(), title: '', description: '' })}
            onRemove={(index) => removeArrayItem('privacyPolicy.dataUsage', index)}
            addLabel="Thêm mục đích"
            renderItem={(item: LegalItem, index: number) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updatePrivacyField(`dataUsage.${index}.title`, e.target.value)}
                  placeholder="Mục đích (VD: Cung cấp dịch vụ)"
                  style={inputStyle}
                />
                <textarea
                  value={item.description}
                  onChange={(e) => updatePrivacyField(`dataUsage.${index}.description`, e.target.value)}
                  placeholder="Mô tả chi tiết..."
                  style={{ ...textareaStyle, minHeight: 60 }}
                />
              </div>
            )}
          />

          <FormSection icon="ri-lock-line" title="Bảo vệ dữ liệu">
            <textarea
              value={(privacyPolicy.dataProtection as string) || ''}
              onChange={(e) => updatePrivacyField('dataProtection', e.target.value)}
              placeholder="Mô tả các biện pháp bảo mật được áp dụng..."
              style={textareaStyle}
            />
          </FormSection>

          <FormSection icon="ri-share-line" title="Chia sẻ dữ liệu">
            <textarea
              value={(privacyPolicy.dataSharing as string) || ''}
              onChange={(e) => updatePrivacyField('dataSharing', e.target.value)}
              placeholder="Chính sách chia sẻ dữ liệu với bên thứ ba..."
              style={textareaStyle}
            />
          </FormSection>

          <LegalArraySection
            title="Quyền của người dùng"
            icon="ri-user-settings-line"
            items={(privacyPolicy.userRights as LegalItem[]) || []}
            onAdd={() => addArrayItem('privacyPolicy.userRights', { _id: generateUniqueId(), title: '', description: '' })}
            onRemove={(index) => removeArrayItem('privacyPolicy.userRights', index)}
            addLabel="Thêm quyền"
            renderItem={(item: LegalItem, index: number) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updatePrivacyField(`userRights.${index}.title`, e.target.value)}
                  placeholder="Quyền (VD: Quyền truy cập)"
                  style={inputStyle}
                />
                <textarea
                  value={item.description}
                  onChange={(e) => updatePrivacyField(`userRights.${index}.description`, e.target.value)}
                  placeholder="Mô tả chi tiết..."
                  style={{ ...textareaStyle, minHeight: 60 }}
                />
              </div>
            )}
          />

          <FormSection icon="ri-cookie-line" title="Cookies">
            <textarea
              value={(privacyPolicy.cookies as string) || ''}
              onChange={(e) => updatePrivacyField('cookies', e.target.value)}
              placeholder="Chính sách sử dụng cookies..."
              style={textareaStyle}
            />
          </FormSection>
        </>
      )}

      {/* Terms of Use Content */}
      {(documentType === 'terms_of_use' || documentType === 'both') && (
        <>
          <div style={{ 
            padding: '12px 16px', 
            background: `${tokens.color.warning}15`, 
            borderRadius: tokens.radius.md,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: documentType === 'both' ? 16 : 0,
          }}>
            <i className="ri-file-list-2-line" style={{ color: tokens.color.warning, fontSize: 20 }} />
            <span style={{ color: tokens.color.text, fontWeight: 600 }}>Điều Khoản Sử Dụng (Terms of Use)</span>
          </div>

          <FormSection icon="ri-file-text-line" title="Giới thiệu">
            <textarea
              value={(termsOfUse.introduction as string) || ''}
              onChange={(e) => updateTermsField('introduction', e.target.value)}
              placeholder="Giới thiệu về điều khoản sử dụng..."
              style={textareaStyle}
            />
          </FormSection>

          <FormSection icon="ri-service-line" title="Mô tả dịch vụ">
            <textarea
              value={(termsOfUse.serviceDescription as string) || ''}
              onChange={(e) => updateTermsField('serviceDescription', e.target.value)}
              placeholder="Mô tả về dịch vụ cung cấp..."
              style={textareaStyle}
            />
          </FormSection>

          <LegalArraySection
            title="Nghĩa vụ người dùng"
            icon="ri-user-follow-line"
            items={(termsOfUse.userObligations as LegalItem[]) || []}
            onAdd={() => addArrayItem('termsOfUse.userObligations', { _id: generateUniqueId(), title: '', description: '' })}
            onRemove={(index) => removeArrayItem('termsOfUse.userObligations', index)}
            addLabel="Thêm nghĩa vụ"
            renderItem={(item: LegalItem, index: number) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateTermsField(`userObligations.${index}.title`, e.target.value)}
                  placeholder="Nghĩa vụ (VD: Thông tin chính xác)"
                  style={inputStyle}
                />
                <textarea
                  value={item.description}
                  onChange={(e) => updateTermsField(`userObligations.${index}.description`, e.target.value)}
                  placeholder="Mô tả chi tiết..."
                  style={{ ...textareaStyle, minHeight: 60 }}
                />
              </div>
            )}
          />

          <FormSection icon="ri-copyright-line" title="Sở hữu trí tuệ">
            <textarea
              value={(termsOfUse.intellectualProperty as string) || ''}
              onChange={(e) => updateTermsField('intellectualProperty', e.target.value)}
              placeholder="Quy định về bản quyền và sở hữu trí tuệ..."
              style={textareaStyle}
            />
          </FormSection>

          <LegalArraySection
            title="Giới hạn trách nhiệm"
            icon="ri-error-warning-line"
            items={(termsOfUse.liability as LegalItem[]) || []}
            onAdd={() => addArrayItem('termsOfUse.liability', { _id: generateUniqueId(), title: '', description: '' })}
            onRemove={(index) => removeArrayItem('termsOfUse.liability', index)}
            addLabel="Thêm điều khoản"
            renderItem={(item: LegalItem, index: number) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateTermsField(`liability.${index}.title`, e.target.value)}
                  placeholder="Điều khoản (VD: Giới hạn trách nhiệm)"
                  style={inputStyle}
                />
                <textarea
                  value={item.description}
                  onChange={(e) => updateTermsField(`liability.${index}.description`, e.target.value)}
                  placeholder="Mô tả chi tiết..."
                  style={{ ...textareaStyle, minHeight: 60 }}
                />
              </div>
            )}
          />

          <FormSection icon="ri-money-dollar-circle-line" title="Điều khoản thanh toán">
            <textarea
              value={(termsOfUse.paymentTerms as string) || ''}
              onChange={(e) => updateTermsField('paymentTerms', e.target.value)}
              placeholder="Quy định về thanh toán..."
              style={textareaStyle}
            />
          </FormSection>

          <FormSection icon="ri-close-circle-line" title="Chấm dứt dịch vụ">
            <textarea
              value={(termsOfUse.termination as string) || ''}
              onChange={(e) => updateTermsField('termination', e.target.value)}
              placeholder="Điều kiện chấm dứt tài khoản/dịch vụ..."
              style={textareaStyle}
            />
          </FormSection>

          <FormSection icon="ri-scales-3-line" title="Giải quyết tranh chấp">
            <textarea
              value={(termsOfUse.disputeResolution as string) || ''}
              onChange={(e) => updateTermsField('disputeResolution', e.target.value)}
              placeholder="Quy định về giải quyết tranh chấp..."
              style={textareaStyle}
            />
          </FormSection>

          <FormSection icon="ri-refresh-line" title="Thay đổi điều khoản">
            <textarea
              value={(termsOfUse.changes as string) || ''}
              onChange={(e) => updateTermsField('changes', e.target.value)}
              placeholder="Quy định về việc cập nhật điều khoản..."
              style={textareaStyle}
            />
          </FormSection>
        </>
      )}

      {/* Display Options */}
      <FormSection icon="ri-layout-line" title="Tùy chọn hiển thị">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {documentType === 'both' && (
            <SelectInput
              label="Kiểu hiển thị"
              value={(data.layout as string) || 'tabs'}
              onChange={(v) => updateField('layout', v)}
              options={[
                { value: 'tabs', label: 'Tabs (chuyển đổi giữa 2 tài liệu)' },
                { value: 'accordion', label: 'Accordion (mở rộng/thu gọn)' },
                { value: 'stacked', label: 'Xếp chồng (hiển thị cả 2)' },
              ]}
            />
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={(data.showTableOfContents as boolean) !== false}
              onChange={(e) => updateField('showTableOfContents', e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ color: tokens.color.text, fontSize: 14 }}>Hiển thị mục lục (Table of Contents)</span>
          </label>
        </div>
      </FormSection>
    </div>
  );
}
