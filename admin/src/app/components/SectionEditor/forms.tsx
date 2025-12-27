import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from '../Button';
import { Input, TextArea } from '../Input';
import { ImageDropzone } from '../ImageDropzone';
import { RichTextEditor } from '../RichTextEditor';
import { VisualBlockEditor } from '../VisualBlockEditor';
import { IconPicker } from '../IconPicker';
import type { SectionKind } from './types';
import { generateUniqueId } from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = Record<string, any>;
type UpdateFieldFn = (path: string, value: unknown) => void;
type AddArrayItemFn = (path: string, item: unknown) => void;
type RemoveArrayItemFn = (path: string, index: number) => void;
type OnImagePickFn = (field: string) => void;

export function renderFormFields(
  kind: SectionKind,
  data: DataRecord,
  updateField: UpdateFieldFn,
  addArrayItem: AddArrayItemFn,
  removeArrayItem: RemoveArrayItemFn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onImagePick: OnImagePickFn
): React.JSX.Element {
  switch (kind) {
    case 'HERO':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-information-line" color="#3B82F6" title="Hero Section" description="Banner chính của trang - hình ảnh sẽ được tự động tối ưu." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} required fullWidth />
          <TextArea label="Mô tả ngắn" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <ImageSection label="Hình nền" value={data.imageUrl} onChange={(url) => updateField('imageUrl', url)} />
          <CTASection data={data} updateField={updateField} />
        </div>
      );

    case 'HERO_SIMPLE':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-layout-top-line" color="#fb923c" title="Hero Đơn Giản" description="Hero nhẹ cho các trang phụ." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} required fullWidth />
          <Input label="Badge" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <TextArea label="Mô tả" value={data.description || ''} onChange={(v) => updateField('description', v)} fullWidth />
          <ImageSection label="Hình nền (tùy chọn)" value={data.backgroundImage} onChange={(url) => updateField('backgroundImage', url)} />
          <RangeInput label="Độ tối overlay" value={data.backgroundOverlay || 60} onChange={(v) => updateField('backgroundOverlay', v)} />
          <RadioGroup label="Căn chỉnh text" options={['left', 'center', 'right']} value={data.textAlign || 'center'} onChange={(v) => updateField('textAlign', v)} />
        </div>
      );

    case 'CTA':
    case 'CALL_TO_ACTION':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} required fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <ButtonSection label="Nút chính" data={data.primaryButton || {}} path="primaryButton" updateField={updateField} />
          <ButtonSection label="Nút phụ (tùy chọn)" data={data.secondaryButton || {}} path="secondaryButton" updateField={updateField} secondary />
        </div>
      );

    case 'RICH_TEXT':
      return (
        <RichTextSectionForm data={data} updateField={updateField} />
      );

    case 'BANNER':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nội dung thông báo" value={data.text || ''} onChange={(v) => updateField('text', v)} required fullWidth />
          <Input label="Link (tùy chọn)" value={data.href || ''} onChange={(v) => updateField('href', v)} fullWidth />
        </div>
      );

    case 'CONTACT_INFO':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Input label="Tiêu đề section" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Input label="Số điện thoại" value={data.phone || ''} onChange={(v) => updateField('phone', v)} fullWidth />
            <Input label="Email" value={data.email || ''} onChange={(v) => updateField('email', v)} fullWidth />
          </div>
          <Input label="Địa chỉ" value={data.address || ''} onChange={(v) => updateField('address', v)} fullWidth />
          <ArraySection
            label="Giờ làm việc"
            items={data.hours || []}
            onAdd={() => addArrayItem('hours', { _id: generateUniqueId(), day: 'Thứ 2 - Thứ 6', time: '08:00 - 18:00' })}
            onRemove={(idx) => removeArrayItem('hours', idx)}
            renderItem={(item, idx) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={item.day || ''} onChange={(v) => updateField(`hours.${idx}.day`, v)} placeholder="Thứ 2 - Thứ 6" fullWidth />
                <Input value={item.time || ''} onChange={(v) => updateField(`hours.${idx}.time`, v)} placeholder="08:00 - 18:00" fullWidth />
              </div>
            )}
          />
          <Input label="Google Maps Embed URL" value={data.mapEmbedUrl || ''} onChange={(v) => updateField('mapEmbedUrl', v)} fullWidth />
        </div>
      );

    case 'TESTIMONIALS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <InfoBanner icon="ri-chat-quote-line" color="#F59E0B" title="Đánh Giá Khách Hàng" description="Hiển thị phản hồi từ khách hàng." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <ArraySection
            label={`Đánh giá (${data.testimonials?.length || 0})`}
            items={data.testimonials || []}
            onAdd={() => addArrayItem('testimonials', { _id: generateUniqueId(), name: '', role: '', content: '', rating: 5, avatar: '' })}
            onRemove={(idx) => removeArrayItem('testimonials', idx)}
            renderItem={(item, idx) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Tên" value={item.name || ''} onChange={(v) => updateField(`testimonials.${idx}.name`, v)} fullWidth />
                  <Input label="Vai trò" value={item.role || ''} onChange={(v) => updateField(`testimonials.${idx}.role`, v)} placeholder="VD: Chủ nhà tại Quận 7" fullWidth />
                </div>
                <TextArea label="Nội dung đánh giá" value={item.content || ''} onChange={(v) => updateField(`testimonials.${idx}.content`, v)} rows={3} fullWidth />
                <Input label="Số sao (1-5)" type="number" value={item.rating || 5} onChange={(v) => updateField(`testimonials.${idx}.rating`, parseInt(v) || 5)} fullWidth />
              </div>
            )}
          />
        </div>
      );

    case 'STATS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-bar-chart-fill" color="#3B82F6" title="Thống Kê" description="Hiển thị các con số ấn tượng." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <ArraySection
            label="Số liệu"
            items={data.stats || []}
            onAdd={() => addArrayItem('stats', { _id: generateUniqueId(), icon: 'ri-star-fill', value: '100', label: 'Số liệu mới', suffix: '+' })}
            onRemove={(idx) => removeArrayItem('stats', idx)}
            renderItem={(item, idx) => (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <IconPicker label="Icon" value={item.icon || ''} onChange={(v) => updateField(`stats.${idx}.icon`, v)} />
                <Input label="Giá trị" value={item.value || ''} onChange={(v) => updateField(`stats.${idx}.value`, v)} fullWidth />
                <Input label="Nhãn" value={item.label || ''} onChange={(v) => updateField(`stats.${idx}.label`, v)} fullWidth />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Input label="Tiền tố" value={item.prefix || ''} onChange={(v) => updateField(`stats.${idx}.prefix`, v)} fullWidth />
                  <Input label="Hậu tố" value={item.suffix || ''} onChange={(v) => updateField(`stats.${idx}.suffix`, v)} fullWidth />
                </div>
              </div>
            )}
          />
        </div>
      );

    case 'FEATURES':
    case 'CORE_VALUES':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-star-fill" color="#F59E0B" title={kind === 'FEATURES' ? 'Dịch Vụ/Tính Năng' : 'Giá Trị Cốt Lõi'} description="Highlight các điểm nổi bật." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <ArraySection
            label={kind === 'FEATURES' ? 'Dịch vụ' : 'Giá trị'}
            items={data.features || data.values || []}
            onAdd={() => addArrayItem(kind === 'FEATURES' ? 'features' : 'values', { _id: generateUniqueId(), icon: 'ri-star-line', title: 'Mục mới', description: 'Mô tả...' })}
            onRemove={(idx) => removeArrayItem(kind === 'FEATURES' ? 'features' : 'values', idx)}
            renderItem={(item, idx) => {
              const path = kind === 'FEATURES' ? 'features' : 'values';
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <IconPicker label="Icon" value={item.icon || ''} onChange={(v) => updateField(`${path}.${idx}.icon`, v)} />
                  <Input label="Tiêu đề" value={item.title || ''} onChange={(v) => updateField(`${path}.${idx}.title`, v)} fullWidth />
                  <TextArea label="Mô tả" value={item.description || ''} onChange={(v) => updateField(`${path}.${idx}.description`, v)} fullWidth />
                </div>
              );
            }}
          />
        </div>
      );

    case 'FEATURED_BLOG_POSTS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-article-line" color="#8B5CF6" title="Bài Viết Nổi Bật" description="Hiển thị bài blog mới nhất từ hệ thống." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <Input label="Số bài hiển thị" type="number" value={data.limit || 3} onChange={(v) => updateField('limit', parseInt(v) || 3)} fullWidth />
        </div>
      );

    case 'MISSION_VISION':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-flag-line" color="#10B981" title="Sứ Mệnh & Tầm Nhìn" description="Giới thiệu sứ mệnh và tầm nhìn công ty." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <div style={{ background: 'rgba(245, 211, 147, 0.05)', border: '1px solid rgba(245, 211, 147, 0.2)', borderRadius: tokens.radius.md, padding: 16 }}>
            <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Sứ Mệnh</h4>
            <IconPicker label="Icon" value={data.mission?.icon || ''} onChange={(v) => updateField('mission.icon', v)} />
            <Input label="Tiêu đề" value={data.mission?.title || ''} onChange={(v) => updateField('mission.title', v)} placeholder="Sứ Mệnh" fullWidth style={{ marginTop: 12 }} />
            <TextArea label="Nội dung" value={data.mission?.content || ''} onChange={(v) => updateField('mission.content', v)} fullWidth style={{ marginTop: 12 }} />
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: tokens.radius.md, padding: 16 }}>
            <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Tầm Nhìn</h4>
            <IconPicker label="Icon" value={data.vision?.icon || ''} onChange={(v) => updateField('vision.icon', v)} />
            <Input label="Tiêu đề" value={data.vision?.title || ''} onChange={(v) => updateField('vision.title', v)} placeholder="Tầm Nhìn" fullWidth style={{ marginTop: 12 }} />
            <TextArea label="Nội dung" value={data.vision?.content || ''} onChange={(v) => updateField('vision.content', v)} fullWidth style={{ marginTop: 12 }} />
          </div>
        </div>
      );

    case 'SOCIAL_MEDIA':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-share-line" color="#E4405F" title="Mạng Xã Hội" description="Hiển thị các link mạng xã hội." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <ArraySection
            label="Social Links"
            items={data.links || []}
            onAdd={() => addArrayItem('links', { _id: generateUniqueId(), platform: 'Facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' })}
            onRemove={(idx) => removeArrayItem('links', idx)}
            renderItem={(item, idx) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input label="Tên nền tảng" value={item.platform || ''} onChange={(v) => updateField(`links.${idx}.platform`, v)} fullWidth />
                <Input label="URL" value={item.url || ''} onChange={(v) => updateField(`links.${idx}.url`, v)} fullWidth />
                <IconPicker label="Icon" value={item.icon || ''} onChange={(v) => updateField(`links.${idx}.icon`, v)} />
              </div>
            )}
          />
        </div>
      );

    case 'FOOTER_SOCIAL':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-share-forward-line" color="#6366F1" title="Footer Social" description="Social links hiển thị ở footer." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <ArraySection
            label="Nền tảng"
            items={data.platforms || []}
            onAdd={() => addArrayItem('platforms', { _id: generateUniqueId(), name: 'facebook', url: 'https://facebook.com' })}
            onRemove={(idx) => removeArrayItem('platforms', idx)}
            renderItem={(item, idx) => (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <Input label="Tên (facebook, youtube...)" value={item.name || ''} onChange={(v) => updateField(`platforms.${idx}.name`, v)} fullWidth />
                <Input label="URL" value={item.url || ''} onChange={(v) => updateField(`platforms.${idx}.url`, v)} fullWidth />
              </div>
            )}
          />
        </div>
      );

    case 'QUICK_CONTACT':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-contacts-fill" color="#F59E0B" title="Liên Hệ Nhanh" description="Card liên hệ nhanh với thông tin cơ bản." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} placeholder="Liên Hệ Nhanh" fullWidth />
          <Input label="Số điện thoại" value={data.phone || ''} onChange={(v) => updateField('phone', v)} fullWidth />
          <Input label="Email" value={data.email || ''} onChange={(v) => updateField('email', v)} fullWidth />
          <Input label="Địa chỉ" value={data.address || ''} onChange={(v) => updateField('address', v)} fullWidth />
        </div>
      );

    case 'FAB_ACTIONS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-customer-service-line" color="#EF4444" title="Nút Nổi (FAB)" description="Nút liên hệ nhanh góc màn hình." />
          <IconPicker label="Icon chính" value={data.mainIcon || ''} onChange={(v) => updateField('mainIcon', v)} />
          <Input label="Màu chính" value={data.mainColor || '#f5d393'} onChange={(v) => updateField('mainColor', v)} placeholder="#f5d393" fullWidth />
          <ArraySection
            label="Hành động"
            items={data.actions || []}
            onAdd={() => addArrayItem('actions', { _id: generateUniqueId(), icon: 'ri-phone-fill', label: 'Gọi ngay', href: 'tel:0123456789', color: '#10B981' })}
            onRemove={(idx) => removeArrayItem('actions', idx)}
            renderItem={(item, idx) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <IconPicker label="Icon" value={item.icon || ''} onChange={(v) => updateField(`actions.${idx}.icon`, v)} />
                  <Input label="Màu" value={item.color || ''} onChange={(v) => updateField(`actions.${idx}.color`, v)} placeholder="#10B981" fullWidth />
                </div>
                <Input label="Nhãn" value={item.label || ''} onChange={(v) => updateField(`actions.${idx}.label`, v)} fullWidth />
                <Input label="Link (tel:, mailto:, https://)" value={item.href || ''} onChange={(v) => updateField(`actions.${idx}.href`, v)} fullWidth />
              </div>
            )}
          />
        </div>
      );

    case 'QUOTE_FORM':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-calculator-line" color="#3B82F6" title="Form Báo Giá" description="Form để khách hàng yêu cầu báo giá. Dữ liệu sẽ được lưu vào Khách hàng tiềm năng." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} placeholder="Đăng kí tư vấn" fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} placeholder="Điền thông tin để nhận báo giá nhanh chóng" fullWidth />
          <Input label="Text nút gửi" value={data.buttonText || ''} onChange={(v) => updateField('buttonText', v)} placeholder="Gửi Yêu Cầu" fullWidth />
          
          {/* Form Fields Configuration */}
          <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: tokens.radius.md, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <i className="ri-list-settings-line" style={{ fontSize: 18, color: '#3B82F6' }} />
              <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Cấu hình trường dữ liệu</label>
            </div>
            
            {/* Default Fields Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={data.showNameField !== false} onChange={(e) => updateField('showNameField', e.target.checked)} />
                <span style={{ color: tokens.color.text, fontSize: 13 }}>Họ tên (bắt buộc)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={data.showPhoneField !== false} onChange={(e) => updateField('showPhoneField', e.target.checked)} />
                <span style={{ color: tokens.color.text, fontSize: 13 }}>Số điện thoại (bắt buộc)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={data.showEmailField !== false} onChange={(e) => updateField('showEmailField', e.target.checked)} />
                <span style={{ color: tokens.color.text, fontSize: 13 }}>Email</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={data.showContentField !== false} onChange={(e) => updateField('showContentField', e.target.checked)} />
                <span style={{ color: tokens.color.text, fontSize: 13 }}>Nội dung yêu cầu</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={data.showAddressField === true} onChange={(e) => updateField('showAddressField', e.target.checked)} />
                <span style={{ color: tokens.color.text, fontSize: 13 }}>Địa chỉ</span>
              </label>
            </div>
          </div>

          {/* Custom Fields */}
          <ArraySection
            label={`Trường tùy chỉnh (${data.customFields?.length || 0})`}
            items={data.customFields || []}
            onAdd={() => addArrayItem('customFields', { 
              _id: generateUniqueId(), 
              name: 'custom_field', 
              label: 'Trường mới', 
              type: 'text', 
              placeholder: '', 
              required: false 
            })}
            onRemove={(idx) => removeArrayItem('customFields', idx)}
            renderItem={(item, idx) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Tên field (key)" value={item.name || ''} onChange={(v) => updateField(`customFields.${idx}.name`, v)} placeholder="custom_field" fullWidth />
                  <Input label="Nhãn hiển thị" value={item.label || ''} onChange={(v) => updateField(`customFields.${idx}.label`, v)} placeholder="Nhãn" fullWidth />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>Loại trường</label>
                    <select
                      value={item.type || 'text'}
                      onChange={(e) => updateField(`customFields.${idx}.type`, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: tokens.radius.md,
                        border: `1px solid ${tokens.color.border}`,
                        background: tokens.color.surface,
                        color: tokens.color.text,
                        fontSize: 14,
                      }}
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Số</option>
                      <option value="email">Email</option>
                      <option value="tel">Điện thoại</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>
                  <Input label="Placeholder" value={item.placeholder || ''} onChange={(v) => updateField(`customFields.${idx}.placeholder`, v)} fullWidth />
                </div>
                {item.type === 'select' && (
                  <Input 
                    label="Các lựa chọn (phân cách bằng dấu phẩy)" 
                    value={item.options || ''} 
                    onChange={(v) => updateField(`customFields.${idx}.options`, v)} 
                    placeholder="Lựa chọn 1, Lựa chọn 2, Lựa chọn 3" 
                    fullWidth 
                  />
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={item.required || false} onChange={(e) => updateField(`customFields.${idx}.required`, e.target.checked)} />
                  <span style={{ color: tokens.color.text, fontSize: 13 }}>Bắt buộc</span>
                </label>
              </div>
            )}
          />

          {/* Form Style */}
          <div style={{ background: 'rgba(245, 211, 147, 0.05)', border: '1px solid rgba(245, 211, 147, 0.2)', borderRadius: tokens.radius.md, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className="ri-palette-line" style={{ fontSize: 18, color: tokens.color.primary }} />
              <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Giao diện</label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>Layout</label>
                <select
                  value={data.layout || 'card'}
                  onChange={(e) => updateField('layout', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.surface,
                    color: tokens.color.text,
                    fontSize: 14,
                  }}
                >
                  <option value="card">Card (có viền)</option>
                  <option value="simple">Đơn giản</option>
                  <option value="glass">Glass effect</option>
                </select>
              </div>
              <Input label="Màu nút" value={data.buttonColor || ''} onChange={(v) => updateField('buttonColor', v)} placeholder="#F5D393" fullWidth />
            </div>
          </div>

          {/* Success Message */}
          <Input label="Thông báo thành công" value={data.successMessage || ''} onChange={(v) => updateField('successMessage', v)} placeholder="Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm nhất." fullWidth />
        </div>
      );

    case 'ABOUT':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-building-2-line" color="#8B5CF6" title="Giới Thiệu" description="Section giới thiệu về công ty." />
          <Input label="Badge" value={data.badge || ''} onChange={(v) => updateField('badge', v)} placeholder="Về Chúng Tôi" fullWidth />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Mô tả" value={data.description || ''} onChange={(v) => updateField('description', v)} rows={4} fullWidth />
          <ImageSection label="Hình ảnh" value={data.imageUrl} onChange={(url) => updateField('imageUrl', url)} />
        </div>
      );

    case 'FAQ':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-question-line" color="#06B6D4" title="Câu Hỏi Thường Gặp" description="Danh sách FAQ accordion." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <ArraySection
            label="Câu hỏi"
            items={data.items || []}
            onAdd={() => addArrayItem('items', { _id: generateUniqueId(), question: 'Câu hỏi mới?', answer: 'Trả lời...' })}
            onRemove={(idx) => removeArrayItem('items', idx)}
            renderItem={(item, idx) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input label="Câu hỏi" value={item.question || ''} onChange={(v) => updateField(`items.${idx}.question`, v)} fullWidth />
                <TextArea label="Trả lời" value={item.answer || ''} onChange={(v) => updateField(`items.${idx}.answer`, v)} rows={3} fullWidth />
              </div>
            )}
          />
        </div>
      );

    case 'BLOG_LIST':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-file-list-line" color="#8B5CF6" title="Danh Sách Blog" description="Hiển thị danh sách bài viết với phân trang." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <Input label="Số bài mỗi trang" type="number" value={data.perPage || 6} onChange={(v) => updateField('perPage', parseInt(v) || 6)} fullWidth />
        </div>
      );

    case 'QUOTE_CALCULATOR':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-calculator-line" color="#F59E0B" title="Dự Toán & Tư Vấn" description="Section 2 tab: Dự toán nhanh + Đăng ký tư vấn. Dữ liệu hạng mục, vật dụng, đơn giá được lấy từ hệ thống." />
          
          {/* Shared Form Notice */}
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: tokens.radius.md, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <i className="ri-link" style={{ fontSize: 20, color: '#10B981', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>Tab Đăng Ký Tư Vấn sử dụng QUOTE_FORM chung</p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Nội dung form đăng ký tư vấn được đồng bộ từ section QUOTE_FORM. Khi chỉnh sửa QUOTE_FORM ở bất kỳ trang nào, tab tư vấn trong section này cũng sẽ tự động cập nhật.
              </p>
            </div>
          </div>
          
          {/* Header */}
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} placeholder="Báo Giá & Dự Toán" fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} placeholder="Tính toán chi phí cải tạo nhà nhanh chóng và chính xác" fullWidth />
          
          {/* Tab Configuration */}
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: tokens.radius.md, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <i className="ri-layout-column-line" style={{ fontSize: 18, color: '#F59E0B' }} />
              <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Cấu hình Tab</label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Calculator Tab */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, padding: 12, border: `1px solid ${tokens.color.border}` }}>
                <h5 style={{ color: tokens.color.text, fontSize: 13, fontWeight: 600, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ri-calculator-line" style={{ color: '#F59E0B' }} /> Tab Dự Toán
                </h5>
                <Input label="Nhãn tab" value={data.calculatorTab?.label || ''} onChange={(v) => updateField('calculatorTab.label', v)} placeholder="Dự Toán Nhanh" fullWidth />
                <div style={{ marginTop: 8 }}>
                  <IconPicker label="Icon" value={data.calculatorTab?.icon || ''} onChange={(v) => updateField('calculatorTab.icon', v)} />
                </div>
              </div>
              
              {/* Consultation Tab */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, padding: 12, border: `1px solid ${tokens.color.border}` }}>
                <h5 style={{ color: tokens.color.text, fontSize: 13, fontWeight: 600, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ri-phone-line" style={{ color: '#10B981' }} /> Tab Tư Vấn
                </h5>
                <Input label="Nhãn tab" value={data.consultationTab?.label || ''} onChange={(v) => updateField('consultationTab.label', v)} placeholder="Đăng Ký Tư Vấn" fullWidth />
                <div style={{ marginTop: 8 }}>
                  <IconPicker label="Icon" value={data.consultationTab?.icon || ''} onChange={(v) => updateField('consultationTab.icon', v)} />
                </div>
              </div>
            </div>
            
            {/* Default Tab */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>Tab mặc định</label>
              <select
                value={data.defaultTab || 'calculator'}
                onChange={(e) => updateField('defaultTab', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.surface,
                  color: tokens.color.text,
                  fontSize: 14,
                }}
              >
                <option value="calculator">Dự Toán Nhanh</option>
                <option value="consultation">Đăng Ký Tư Vấn</option>
              </select>
            </div>
          </div>
          
          {/* Options */}
          <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: tokens.radius.md, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className="ri-settings-3-line" style={{ fontSize: 18, color: '#3B82F6' }} />
              <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Tùy chọn</label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
              <input type="checkbox" checked={data.showMaterials !== false} onChange={(e) => updateField('showMaterials', e.target.checked)} />
              <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị bước chọn vật dụng (nếu hạng mục cho phép)</span>
            </label>
            <div style={{ marginTop: 12 }}>
              <Input label="Chiều rộng tối đa (px)" type="number" value={data.maxWidth || 900} onChange={(v) => updateField('maxWidth', parseInt(v) || 900)} fullWidth />
            </div>
          </div>
          
          {/* Disclaimer Text */}
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: tokens.radius.md, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className="ri-information-line" style={{ fontSize: 18, color: '#EF4444' }} />
              <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Ghi chú kết quả</label>
            </div>
            <TextArea 
              label="Nội dung ghi chú" 
              value={data.disclaimerText || '* Giá trên chỉ mang tính tham khảo. Liên hệ để được báo giá chính xác.'} 
              onChange={(v) => updateField('disclaimerText', v)} 
              placeholder="* Giá trên chỉ mang tính tham khảo. Liên hệ để được báo giá chính xác." 
              fullWidth 
            />
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: '8px 0 0', lineHeight: 1.4 }}>
              Nội dung này hiển thị bên dưới kết quả dự toán trên landing page.
            </p>
          </div>
        </div>
      );

    case 'SERVICES':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InfoBanner icon="ri-service-line" color="#F59E0B" title="Dịch Vụ" description="Danh sách các dịch vụ cung cấp." />
          <Input label="Tiêu đề" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Mô tả" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />
          <ArraySection
            label="Dịch vụ"
            items={data.services || []}
            onAdd={() => addArrayItem('services', { _id: generateUniqueId(), icon: 'ri-paint-brush-line', title: 'Dịch vụ mới', description: 'Mô tả dịch vụ...' })}
            onRemove={(idx) => removeArrayItem('services', idx)}
            renderItem={(item, idx) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <IconPicker label="Icon" value={item.icon || ''} onChange={(v) => updateField(`services.${idx}.icon`, v)} />
                <Input label="Tiêu đề" value={item.title || ''} onChange={(v) => updateField(`services.${idx}.title`, v)} fullWidth />
                <TextArea label="Mô tả" value={item.description || ''} onChange={(v) => updateField(`services.${idx}.description`, v)} fullWidth />
              </div>
            )}
          />
        </div>
      );

    case 'MARKETPLACE':
      return (
        <MarketplaceForm data={data} updateField={updateField} />
      );

    case 'FEATURED_SLIDESHOW':
      return (
        <FeaturedSlideshowForm data={data} updateField={updateField} />
      );

    case 'MEDIA_GALLERY':
      return (
        <MediaGalleryForm data={data} updateField={updateField} />
      );

    case 'VIDEO_SHOWCASE':
      return (
        <VideoShowcaseForm data={data} updateField={updateField} />
      );

    case 'FURNITURE_QUOTE':
      return (
        <FurnitureQuoteForm data={data} updateField={updateField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />
      );

    default:
      return (
        <div style={{ color: tokens.color.muted, textAlign: 'center', padding: 40 }}>
          <i className="ri-code-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          Form editor cho section {kind} đang được phát triển.
        </div>
      );
  }
}


// Helper Components
function InfoBanner({ icon, color, title, description }: { icon: string; color: string; title: string; description: string }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`, border: `1px solid ${color}50`, borderRadius: tokens.radius.md, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <i className={icon} style={{ fontSize: 20, color, marginTop: 2 }} />
      <div>
        <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>{title}</p>
        <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>
    </div>
  );
}

function ImageSection({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: 16 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
        <i className="ri-image-line" style={{ fontSize: 18 }} />
        {label}
      </label>
      <ImageDropzone value={value} onChange={onChange} onRemove={() => onChange('')} height={180} />
    </div>
  );
}

function CTASection({ data, updateField }: { data: DataRecord; updateField: UpdateFieldFn }) {
  return (
    <div style={{ background: 'rgba(245, 211, 147, 0.05)', border: '1px solid rgba(245, 211, 147, 0.2)', borderRadius: tokens.radius.md, padding: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="ri-cursor-line" style={{ fontSize: 18, color: tokens.color.primary }} />
        <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Nút Call-to-Action</label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Text nút" value={data.ctaText || ''} onChange={(v) => updateField('ctaText', v)} placeholder="Nhận Báo Giá" fullWidth />
        <Input label="Link" value={data.ctaLink || ''} onChange={(v) => updateField('ctaLink', v)} placeholder="/bao-gia" fullWidth />
      </div>
    </div>
  );
}

function ButtonSection({ label, data, path, updateField, secondary }: { label: string; data: DataRecord; path: string; updateField: UpdateFieldFn; secondary?: boolean }) {
  return (
    <div style={{ background: secondary ? 'rgba(100, 116, 139, 0.05)' : 'rgba(245, 211, 147, 0.05)', border: `1px solid ${secondary ? 'rgba(100, 116, 139, 0.2)' : 'rgba(245, 211, 147, 0.2)'}`, borderRadius: tokens.radius.md, padding: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className={secondary ? 'ri-arrow-right-line' : 'ri-arrow-right-circle-fill'} style={{ fontSize: 18, color: secondary ? tokens.color.muted : tokens.color.primary }} />
        <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{label}</label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Text nút" value={data.text || ''} onChange={(v) => updateField(`${path}.text`, v)} fullWidth />
        <Input label="Link" value={data.link || ''} onChange={(v) => updateField(`${path}.link`, v)} fullWidth />
      </div>
    </div>
  );
}

function RangeInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>{label} (0-100)</label>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(parseInt(e.target.value))} style={{ width: '100%', height: 6, borderRadius: 3, cursor: 'pointer' }} />
      <p style={{ color: tokens.color.muted, fontSize: 12, marginTop: 4 }}>Hiện tại: {value}%</p>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', gap: 12 }}>
        {options.map((opt) => (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="radio" checked={value === opt} onChange={() => onChange(opt)} style={{ cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: tokens.color.text, textTransform: 'capitalize' }}>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ArraySection({ label, items, onAdd, onRemove, renderItem }: { label: string; items: DataRecord[]; onAdd: () => void; onRemove: (idx: number) => void; renderItem: (item: DataRecord, idx: number) => React.JSX.Element }) {
  return (
    <div style={{ background: 'rgba(245, 211, 147, 0.1)', border: '1px solid rgba(245, 211, 147, 0.3)', borderRadius: tokens.radius.md, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <label style={{ fontWeight: 600, fontSize: 14, color: tokens.color.text }}>{label}</label>
        <Button size="small" onClick={onAdd} icon="ri-add-line">Thêm</Button>
      </div>
      {items.map((item, idx) => (
        <motion.div key={item._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.muted }}>#{idx + 1}</span>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onRemove(idx)} style={{ padding: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: tokens.radius.sm, color: '#EF4444', cursor: 'pointer' }}>
              <i className="ri-delete-bin-line" />
            </motion.button>
          </div>
          {renderItem(item, idx)}
        </motion.div>
      ))}
      {items.length === 0 && (
        <div style={{ color: tokens.color.muted, fontSize: 13, textAlign: 'center', padding: 16 }}>Chưa có mục nào. Nhấn "Thêm" để thêm mới.</div>
      )}
    </div>
  );
}


// Rich Text Section Form with Visual/Code toggle
function RichTextSectionForm({ data, updateField }: { data: DataRecord; updateField: UpdateFieldFn }) {
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');
  
  // Determine if content is JSON blocks or markdown
  const isBlocksFormat = (() => {
    try {
      const parsed = JSON.parse(data.content || data.html || '');
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner 
        icon="ri-magic-line" 
        color="#a78bfa" 
        title="Nội Dung Tùy Chỉnh" 
        description="Tạo nội dung đẹp mắt với Visual Editor hoặc viết Markdown trực tiếp." 
      />
      
      {/* Editor Mode Toggle */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        padding: 12,
        background: 'rgba(167, 139, 250, 0.1)',
        border: '1px solid rgba(167, 139, 250, 0.3)',
        borderRadius: tokens.radius.md,
      }}>
        <i className="ri-tools-line" style={{ color: '#a78bfa', fontSize: 18 }} />
        <span style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500, marginRight: 'auto' }}>
          Chế độ soạn thảo:
        </span>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', borderRadius: tokens.radius.md, padding: 4 }}>
          <button
            type="button"
            onClick={() => setEditorMode('visual')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 500,
              background: editorMode === 'visual' ? tokens.color.primary : 'transparent',
              color: editorMode === 'visual' ? '#111' : tokens.color.muted,
              border: 'none',
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-drag-drop-line" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setEditorMode('markdown')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 500,
              background: editorMode === 'markdown' ? tokens.color.primary : 'transparent',
              color: editorMode === 'markdown' ? '#111' : tokens.color.muted,
              border: 'none',
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-markdown-line" />
            Markdown
          </button>
        </div>
      </div>

      {/* Visual Block Editor */}
      {editorMode === 'visual' && (
        <VisualBlockEditor
          label="Nội dung (kéo thả để sắp xếp)"
          value={data.content || data.html || ''}
          onChange={(v) => updateField('content', v)}
        />
      )}

      {/* Markdown Editor */}
      {editorMode === 'markdown' && (
        <>
          {isBlocksFormat && (
            <div style={{
              padding: 12,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: tokens.radius.md,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <i className="ri-alert-line" style={{ color: '#F59E0B', fontSize: 18 }} />
              <span style={{ color: tokens.color.text, fontSize: 13 }}>
                Nội dung đang ở định dạng Visual Blocks. Chuyển sang Markdown sẽ mất cấu trúc blocks.
              </span>
            </div>
          )}
          <RichTextEditor 
            label="Nội dung Markdown" 
            value={isBlocksFormat ? '' : (data.content || data.html || '')} 
            onChange={(v) => updateField('content', v)} 
            rows={15} 
          />
        </>
      )}

      {/* Style Options */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        border: `1px solid ${tokens.color.border}`, 
        borderRadius: tokens.radius.md, 
        padding: 16 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <i className="ri-palette-line" style={{ fontSize: 18, color: tokens.color.primary }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Tùy chọn hiển thị</label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
              Chiều rộng tối đa
            </label>
            <select
              value={data.maxWidth || 'default'}
              onChange={(e) => updateField('maxWidth', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                color: tokens.color.text,
                fontSize: 14,
              }}
            >
              <option value="default">Mặc định (800px)</option>
              <option value="narrow">Hẹp (600px)</option>
              <option value="wide">Rộng (1000px)</option>
              <option value="full">Toàn màn hình</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
              Padding
            </label>
            <select
              value={data.padding || 'normal'}
              onChange={(e) => updateField('padding', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                color: tokens.color.text,
                fontSize: 14,
              }}
            >
              <option value="none">Không có</option>
              <option value="small">Nhỏ</option>
              <option value="normal">Bình thường</option>
              <option value="large">Lớn</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Marketplace Section Form
function MarketplaceForm({ data, updateField }: { data: DataRecord; updateField: UpdateFieldFn }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-store-2-line"
        color="#06b6d4"
        title="Sàn Giao Dịch"
        description="Hiển thị danh sách công trình đang tìm nhà thầu (OPEN status) để thu hút nhà thầu và chủ nhà tham gia nền tảng."
      />

      {/* Header */}
      <div
        style={{
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-text" style={{ fontSize: 18, color: '#06b6d4' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tiêu đề & Mô tả
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Tiêu đề"
            value={data.title || ''}
            onChange={(v) => updateField('title', v)}
            placeholder="Công trình đang tìm nhà thầu"
            fullWidth
          />
          <TextArea
            label="Mô tả"
            value={data.subtitle || ''}
            onChange={(v) => updateField('subtitle', v)}
            placeholder="Khám phá các dự án xây dựng đang chờ báo giá từ nhà thầu uy tín"
            rows={2}
            fullWidth
          />
        </div>
      </div>

      {/* Display Options */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-settings-3-line" style={{ fontSize: 18, color: '#3B82F6' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tùy chọn hiển thị
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input
            label="Số công trình hiển thị"
            type="number"
            value={data.limit || 6}
            onChange={(v) => updateField('limit', parseInt(v) || 6)}
            fullWidth
          />
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.showStats !== false}
                onChange={(e) => updateField('showStats', e.target.checked)}
              />
              <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị thống kê</span>
            </label>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div
        style={{
          background: 'rgba(245, 211, 147, 0.05)',
          border: '1px solid rgba(245, 211, 147, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-cursor-line" style={{ fontSize: 18, color: tokens.color.primary }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Nút Call-to-Action
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Input
            label="Text nút chính"
            value={data.ctaText || ''}
            onChange={(v) => updateField('ctaText', v)}
            placeholder="Xem tất cả công trình"
            fullWidth
          />
          <Input
            label="Link nút chính"
            value={data.ctaLink || ''}
            onChange={(v) => updateField('ctaLink', v)}
            placeholder="/portal/marketplace"
            fullWidth
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Text nút đăng ký"
            value={data.registerText || ''}
            onChange={(v) => updateField('registerText', v)}
            placeholder="Đăng ký làm nhà thầu"
            fullWidth
          />
          <Input
            label="Link nút đăng ký"
            value={data.registerLink || ''}
            onChange={(v) => updateField('registerLink', v)}
            placeholder="/portal/auth/register?type=contractor"
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}

// Featured Slideshow Section Form
function FeaturedSlideshowForm({ data, updateField }: { data: DataRecord; updateField: UpdateFieldFn }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-slideshow-3-line"
        color="#ec4899"
        title="Slideshow Nổi Bật"
        description="Hiển thị các hình ảnh được đánh dấu nổi bật trong Media Library dạng slideshow tự động."
      />

      {/* Header */}
      <div
        style={{
          background: 'rgba(236, 72, 153, 0.05)',
          border: '1px solid rgba(236, 72, 153, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-text" style={{ fontSize: 18, color: '#ec4899' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tiêu đề & Mô tả
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Tiêu đề (tùy chọn)"
            value={data.title || ''}
            onChange={(v) => updateField('title', v)}
            placeholder="Hình ảnh nổi bật"
            fullWidth
          />
          <TextArea
            label="Mô tả (tùy chọn)"
            value={data.subtitle || ''}
            onChange={(v) => updateField('subtitle', v)}
            placeholder="Những khoảnh khắc đáng nhớ"
            rows={2}
            fullWidth
          />
        </div>
      </div>

      {/* Slideshow Options */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-settings-3-line" style={{ fontSize: 18, color: '#3B82F6' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tùy chọn Slideshow
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.autoplay !== false}
              onChange={(e) => updateField('autoplay', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Tự động chuyển slide</span>
          </label>

          {data.autoplay !== false && (
            <Input
              label="Thời gian chuyển slide (ms)"
              type="number"
              value={data.autoplayDelay || 5000}
              onChange={(v) => updateField('autoplayDelay', parseInt(v) || 5000)}
              fullWidth
            />
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.showNavigation !== false}
              onChange={(e) => updateField('showNavigation', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị nút điều hướng (trái/phải)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.showPagination !== false}
              onChange={(e) => updateField('showPagination', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị chấm phân trang</span>
          </label>
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          background: 'rgba(245, 211, 147, 0.05)',
          border: '1px solid rgba(245, 211, 147, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ri-information-line" style={{ fontSize: 18, color: tokens.color.primary }} />
          <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0 }}>
            Hình ảnh được lấy từ Media Library với trạng thái "Nổi bật". Vào Media Library để đánh dấu ảnh nổi bật.
          </p>
        </div>
      </div>
    </div>
  );
}

// Media Gallery Section Form
function MediaGalleryForm({ data, updateField }: { data: DataRecord; updateField: UpdateFieldFn }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-gallery-line"
        color="#8b5cf6"
        title="Thư Viện Ảnh"
        description="Hiển thị toàn bộ ảnh trong Media Library với phân trang và lightbox xem chi tiết."
      />

      {/* Header */}
      <div
        style={{
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-text" style={{ fontSize: 18, color: '#8b5cf6' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tiêu đề & Mô tả
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Tiêu đề (tùy chọn)"
            value={data.title || ''}
            onChange={(v) => updateField('title', v)}
            placeholder="Thư viện ảnh"
            fullWidth
          />
          <TextArea
            label="Mô tả (tùy chọn)"
            value={data.subtitle || ''}
            onChange={(v) => updateField('subtitle', v)}
            placeholder="Khám phá bộ sưu tập hình ảnh của chúng tôi"
            rows={2}
            fullWidth
          />
        </div>
      </div>

      {/* Display Options */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-settings-3-line" style={{ fontSize: 18, color: '#3B82F6' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tùy chọn hiển thị
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
              Số cột
            </label>
            <select
              value={data.columns || 3}
              onChange={(e) => updateField('columns', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                color: tokens.color.text,
                fontSize: 14,
              }}
            >
              <option value={2}>2 cột</option>
              <option value={3}>3 cột</option>
              <option value={4}>4 cột</option>
            </select>
          </div>
          <Input
            label="Số ảnh mỗi trang"
            type="number"
            value={data.itemsPerPage || 12}
            onChange={(v) => updateField('itemsPerPage', parseInt(v) || 12)}
            fullWidth
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.showCaptions !== false}
              onChange={(e) => updateField('showCaptions', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị caption ảnh</span>
          </label>
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          background: 'rgba(245, 211, 147, 0.05)',
          border: '1px solid rgba(245, 211, 147, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ri-information-line" style={{ fontSize: 18, color: tokens.color.primary }} />
          <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0 }}>
            Hình ảnh được lấy từ Media Library. Vào Media Library để upload và quản lý ảnh.
          </p>
        </div>
      </div>
    </div>
  );
}

// Video Showcase Form
function VideoShowcaseForm({
  data,
  updateField,
}: {
  data: DataRecord;
  updateField: UpdateFieldFn;
}) {
  const videoSource = data.videoSource || 'url';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-video-line"
        color="#EF4444"
        title="Video Showcase"
        description="Hiển thị video tự động chạy. Hỗ trợ upload file hoặc link YouTube/Vimeo."
      />

      {/* Header */}
      <Input
        label="Tiêu đề (tùy chọn)"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        placeholder="Video Giới Thiệu"
        fullWidth
      />
      <TextArea
        label="Mô tả (tùy chọn)"
        value={data.subtitle || ''}
        onChange={(v) => updateField('subtitle', v)}
        placeholder="Khám phá quy trình làm việc chuyên nghiệp của chúng tôi"
        fullWidth
      />

      {/* Video Source Toggle */}
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-film-line" style={{ fontSize: 18, color: '#EF4444' }} />
          <label
            style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}
          >
            Nguồn Video
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => updateField('videoSource', 'url')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: videoSource === 'url' ? '#EF4444' : 'rgba(255,255,255,0.05)',
              color: videoSource === 'url' ? '#fff' : tokens.color.muted,
              border: `1px solid ${videoSource === 'url' ? '#EF4444' : tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-link" />
            Link URL
          </button>
          <button
            type="button"
            onClick={() => updateField('videoSource', 'youtube')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: videoSource === 'youtube' ? '#EF4444' : 'rgba(255,255,255,0.05)',
              color: videoSource === 'youtube' ? '#fff' : tokens.color.muted,
              border: `1px solid ${videoSource === 'youtube' ? '#EF4444' : tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-youtube-fill" />
            YouTube
          </button>
          <button
            type="button"
            onClick={() => updateField('videoSource', 'vimeo')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: videoSource === 'vimeo' ? '#EF4444' : 'rgba(255,255,255,0.05)',
              color: videoSource === 'vimeo' ? '#fff' : tokens.color.muted,
              border: `1px solid ${videoSource === 'vimeo' ? '#EF4444' : tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-vimeo-fill" />
            Vimeo
          </button>
          <button
            type="button"
            onClick={() => updateField('videoSource', 'upload')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: videoSource === 'upload' ? '#EF4444' : 'rgba(255,255,255,0.05)',
              color: videoSource === 'upload' ? '#fff' : tokens.color.muted,
              border: `1px solid ${videoSource === 'upload' ? '#EF4444' : tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-upload-cloud-line" />
            Upload
          </button>
        </div>

        {/* URL Input */}
        {videoSource === 'url' && (
          <Input
            label="URL Video (MP4, WebM)"
            value={data.videoUrl || ''}
            onChange={(v) => updateField('videoUrl', v)}
            placeholder="https://example.com/video.mp4"
            fullWidth
          />
        )}

        {/* YouTube Input */}
        {videoSource === 'youtube' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Input
              label="YouTube URL hoặc Video ID"
              value={data.youtubeId || ''}
              onChange={(v) => updateField('youtubeId', v)}
              placeholder="https://youtube.com/watch?v=xxxxx hoặc xxxxx"
              fullWidth
            />
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: 0 }}>
              Hỗ trợ: youtube.com/watch?v=ID, youtu.be/ID, hoặc chỉ Video ID
            </p>
          </div>
        )}

        {/* Vimeo Input */}
        {videoSource === 'vimeo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Input
              label="Vimeo URL hoặc Video ID"
              value={data.vimeoId || ''}
              onChange={(v) => updateField('vimeoId', v)}
              placeholder="https://vimeo.com/xxxxx hoặc xxxxx"
              fullWidth
            />
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: 0 }}>
              Hỗ trợ: vimeo.com/ID hoặc chỉ Video ID
            </p>
          </div>
        )}

        {/* Upload */}
        {videoSource === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Input
              label="URL Video đã upload"
              value={data.videoUrl || ''}
              onChange={(v) => updateField('videoUrl', v)}
              placeholder="Paste URL video sau khi upload"
              fullWidth
            />
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: 0 }}>
              Upload video lên hosting của bạn và paste URL vào đây. Hỗ trợ MP4, WebM.
            </p>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      <ImageSection
        label="Thumbnail (hiển thị trước khi video load)"
        value={data.thumbnail}
        onChange={(url) => updateField('thumbnail', url)}
      />

      {/* Playback Options */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-settings-3-line" style={{ fontSize: 18, color: tokens.color.primary }} />
          <label
            style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}
          >
            Tùy chọn phát
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.autoplay !== false}
              onChange={(e) => updateField('autoplay', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Tự động phát</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.loop !== false}
              onChange={(e) => updateField('loop', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Lặp lại</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.muted !== false}
              onChange={(e) => updateField('muted', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>
              Tắt tiếng (bắt buộc cho autoplay)
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.showControls === true}
              onChange={(e) => updateField('showControls', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Hiển thị controls</span>
          </label>
        </div>
      </div>

      {/* Layout Options */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-layout-line" style={{ fontSize: 18, color: tokens.color.primary }} />
          <label
            style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}
          >
            Bố cục
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                color: tokens.color.text,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Tỷ lệ khung hình
            </label>
            <select
              value={data.aspectRatio || '16:9'}
              onChange={(e) => updateField('aspectRatio', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                color: tokens.color.text,
                fontSize: 14,
              }}
            >
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="4:3">4:3 (Standard)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="21:9">21:9 (Cinematic)</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                color: tokens.color.text,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Chiều rộng tối đa
            </label>
            <select
              value={data.maxWidth || 'default'}
              onChange={(e) => updateField('maxWidth', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                color: tokens.color.text,
                fontSize: 14,
              }}
            >
              <option value="narrow">Hẹp (800px)</option>
              <option value="default">Mặc định (1000px)</option>
              <option value="wide">Rộng (1200px)</option>
              <option value="full">Toàn màn hình</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.roundedCorners !== false}
              onChange={(e) => updateField('roundedCorners', e.target.checked)}
            />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Bo góc video</span>
          </label>
        </div>
      </div>

      {/* Overlay Text */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-text" style={{ fontSize: 18, color: tokens.color.primary }} />
          <label
            style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}
          >
            Overlay Text (tùy chọn)
          </label>
        </div>

        <Input
          label="Text hiển thị trên video"
          value={data.overlayText || ''}
          onChange={(v) => updateField('overlayText', v)}
          placeholder="Chất lượng - Uy tín - Tận tâm"
          fullWidth
        />

        <div style={{ marginTop: 12 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 6,
              color: tokens.color.text,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Vị trí overlay
          </label>
          <select
            value={data.overlayPosition || 'center'}
            onChange={(e) => updateField('overlayPosition', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.surface,
              color: tokens.color.text,
              fontSize: 14,
            }}
          >
            <option value="top">Trên</option>
            <option value="center">Giữa</option>
            <option value="bottom">Dưới</option>
          </select>
        </div>
      </div>
    </div>
  );
}


// Furniture Quote Section Form
function FurnitureQuoteForm({
  data,
  updateField,
  addArrayItem,
  removeArrayItem,
}: {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem: AddArrayItemFn;
  removeArrayItem: RemoveArrayItemFn;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-sofa-line"
        color="#8b5cf6"
        title="Báo Giá Nội Thất"
        description="Quy trình step-by-step để khách hàng chọn căn hộ và nhận báo giá nội thất (combo hoặc custom)."
      />

      {/* Header */}
      <div
        style={{
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-text" style={{ fontSize: 18, color: '#8b5cf6' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Tiêu đề & Mô tả
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Tiêu đề"
            value={data.title || ''}
            onChange={(v) => updateField('title', v)}
            placeholder="Báo Giá Nội Thất"
            fullWidth
          />
          <TextArea
            label="Mô tả"
            value={data.subtitle || ''}
            onChange={(v) => updateField('subtitle', v)}
            placeholder="Chọn căn hộ và nhận báo giá nội thất phù hợp"
            rows={2}
            fullWidth
          />
        </div>
      </div>

      {/* Form Fields Configuration */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-list-settings-line" style={{ fontSize: 18, color: '#3B82F6' }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Cấu hình Form Thu Lead
          </label>
        </div>
        <p style={{ color: tokens.color.muted, fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
          Cấu hình các trường thông tin khách hàng cần thu thập trước khi chọn nội thất.
        </p>

        <ArraySection
          label={`Trường dữ liệu (${data.formFields?.length || 0})`}
          items={data.formFields || []}
          onAdd={() =>
            addArrayItem('formFields', {
              _id: generateUniqueId(),
              name: 'custom_field',
              label: 'Trường mới',
              type: 'text',
              placeholder: '',
              required: false,
            })
          }
          onRemove={(idx) => removeArrayItem('formFields', idx)}
          renderItem={(item, idx) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label="Tên field (key)"
                  value={item.name || ''}
                  onChange={(v) => updateField(`formFields.${idx}.name`, v)}
                  placeholder="phone"
                  fullWidth
                />
                <Input
                  label="Nhãn hiển thị"
                  value={item.label || ''}
                  onChange={(v) => updateField(`formFields.${idx}.label`, v)}
                  placeholder="Số điện thoại"
                  fullWidth
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      color: tokens.color.text,
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    Loại trường
                  </label>
                  <select
                    value={item.type || 'text'}
                    onChange={(e) => updateField(`formFields.${idx}.type`, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: tokens.radius.md,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.surface,
                      color: tokens.color.text,
                      fontSize: 14,
                    }}
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="phone">Điện thoại</option>
                    <option value="email">Email</option>
                    <option value="select">Dropdown</option>
                  </select>
                </div>
                <Input
                  label="Placeholder"
                  value={item.placeholder || ''}
                  onChange={(v) => updateField(`formFields.${idx}.placeholder`, v)}
                  placeholder="Nhập số điện thoại"
                  fullWidth
                />
              </div>
              {item.type === 'select' && (
                <Input
                  label="Các lựa chọn (phân cách bằng dấu phẩy)"
                  value={item.options || ''}
                  onChange={(v) => updateField(`formFields.${idx}.options`, v)}
                  placeholder="Lựa chọn 1, Lựa chọn 2, Lựa chọn 3"
                  fullWidth
                />
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={item.required || false}
                  onChange={(e) => updateField(`formFields.${idx}.required`, e.target.checked)}
                />
                <span style={{ color: tokens.color.text, fontSize: 13 }}>Bắt buộc</span>
              </label>
            </div>
          )}
        />
      </div>

      {/* Button & Messages */}
      <div
        style={{
          background: 'rgba(245, 211, 147, 0.05)',
          border: '1px solid rgba(245, 211, 147, 0.2)',
          borderRadius: tokens.radius.md,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <i className="ri-cursor-line" style={{ fontSize: 18, color: tokens.color.primary }} />
          <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
            Nút & Thông báo
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Text nút tiếp tục"
            value={data.buttonText || ''}
            onChange={(v) => updateField('buttonText', v)}
            placeholder="Tiếp tục"
            fullWidth
          />
          <Input
            label="Thông báo thành công"
            value={data.successMessage || ''}
            onChange={(v) => updateField('successMessage', v)}
            placeholder="Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm."
            fullWidth
          />
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: tokens.radius.md,
          padding: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <i className="ri-information-line" style={{ fontSize: 20, color: '#10B981', marginTop: 2 }} />
        <div>
          <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
            Dữ liệu nội thất được quản lý riêng
          </p>
          <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Dữ liệu dự án, căn hộ, sản phẩm nội thất và combo được quản lý trong trang{' '}
            <strong>Nội thất</strong> của Admin panel. Section này sẽ tự động lấy dữ liệu từ đó.
          </p>
        </div>
      </div>
    </div>
  );
}
