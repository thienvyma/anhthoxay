import React from 'react';
import type { SectionKind } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = Record<string, any>;

export function renderPreview(kind: SectionKind, data: DataRecord): React.JSX.Element {
  switch (kind) {
    case 'HERO':
      return (
        <div style={{ position: 'relative', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
          {data.imageUrl && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <img src={data.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
            </div>
          )}
          <div style={{ position: 'relative', textAlign: 'center', padding: 40, color: '#111', background: 'rgba(255,255,255,0.9)', borderRadius: 8, margin: 20 }}>
            {data.title && <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{data.title}</h1>}
            {data.subtitle && <p style={{ fontSize: 16, marginBottom: 20 }}>{data.subtitle}</p>}
            {data.ctaText && (
              <button style={{ padding: '12px 32px', background: '#f5d393', color: '#111', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600 }}>
                {data.ctaText}
              </button>
            )}
          </div>
        </div>
      );

    case 'HERO_SIMPLE':
      return (
        <div style={{ 
          position: 'relative', 
          minHeight: 250, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: data.textAlign === 'center' ? 'center' : data.textAlign === 'right' ? 'flex-end' : 'flex-start',
          overflow: 'hidden', 
          borderRadius: 8,
          background: data.backgroundImage 
            ? `linear-gradient(rgba(0,0,0,${(data.backgroundOverlay || 60) / 100}), rgba(0,0,0,${(data.backgroundOverlay || 60) / 100})), url(${data.backgroundImage})` 
            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          <div style={{ position: 'relative', textAlign: data.textAlign || 'center', padding: 40, maxWidth: 800 }}>
            {data.subtitle && (
              <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(245,211,147,0.15)', border: '1px solid rgba(245,211,147,0.3)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#f5d393', marginBottom: 16 }}>
                {data.subtitle}
              </div>
            )}
            {data.title && <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, color: '#f5d393' }}>{data.title}</h1>}
            {data.description && <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{data.description}</p>}
          </div>
        </div>
      );

    case 'CTA':
    case 'CALL_TO_ACTION':
      return (
        <div style={{ textAlign: 'center', padding: 60, background: 'linear-gradient(135deg, rgba(245, 211, 147, 0.15) 0%, rgba(239, 182, 121, 0.1) 100%)', borderRadius: 16, border: '1px solid rgba(245, 211, 147, 0.2)' }}>
          {data.title && <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, color: '#F5D393' }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 18, marginBottom: 32, color: 'rgba(255,255,255,0.7)' }}>{data.subtitle}</p>}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {data.primaryButton?.text && (
              <button style={{ padding: '16px 40px', background: 'linear-gradient(135deg, #F5D393, #EFB679)', color: '#111', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700 }}>
                {data.primaryButton.text}
              </button>
            )}
            {data.secondaryButton?.text && (
              <button style={{ padding: '16px 40px', background: 'transparent', color: '#F5D393', border: '2px solid #F5D393', borderRadius: 12, fontSize: 16, fontWeight: 700 }}>
                {data.secondaryButton.text}
              </button>
            )}
          </div>
        </div>
      );

    case 'RICH_TEXT':
      return (
        <div style={{ color: '#111', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: data.html || '<p style="color: #999">Chưa có nội dung...</p>' }} />
      );

    case 'BANNER':
      return (
        <div style={{ padding: 16, background: '#f5d393', color: '#111', textAlign: 'center', borderRadius: 8, fontWeight: 500 }}>
          {data.text || 'Nội dung thông báo'}
        </div>
      );

    case 'CONTACT_INFO':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16 }}>{data.title || 'Thông Tin Liên Hệ'}</h2>
          {data.phone && <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>📞 {data.phone}</p>}
          {data.email && <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>✉️ {data.email}</p>}
          {data.address && <p style={{ fontSize: 14, color: '#666' }}>📍 {data.address}</p>}
        </div>
      );

    case 'TESTIMONIALS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {(data.testimonials || []).slice(0, 2).map((t: DataRecord) => (
              <div key={t._id || t.name} style={{ background: '#fffbeb', borderRadius: 8, padding: 16, border: '1px solid #fde68a' }}>
                <div style={{ fontWeight: 600, color: '#111' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#78350F' }}>{t.role}</div>
                <p style={{ fontSize: 13, color: '#451a03', marginTop: 8 }}>{t.content}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'STATS':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            {(data.stats || []).map((stat: DataRecord) => (
              <div key={stat._id || stat.label} style={{ textAlign: 'center', padding: 16, background: '#fff', borderRadius: 8 }}>
                <i className={stat.icon} style={{ fontSize: 32, color: '#f5d393', marginBottom: 8, display: 'block' }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{stat.prefix}{stat.value}{stat.suffix}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'FEATURES':
    case 'CORE_VALUES':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {(data.features || data.values || []).map((item: DataRecord) => (
              <div key={item._id || item.title} style={{ padding: 16, background: '#fff', borderRadius: 8, textAlign: 'center' }}>
                <i className={item.icon} style={{ fontSize: 32, color: '#f5d393', marginBottom: 12, display: 'block' }} />
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>{item.title}</h4>
                <p style={{ fontSize: 13, color: '#666' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'FEATURED_BLOG_POSTS':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {Array.from({ length: data.limit || 3 }).map((_, idx) => (
              <div key={idx} style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: 120, background: 'linear-gradient(135deg, rgba(245,211,147,0.3), rgba(239,182,121,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-article-line" style={{ fontSize: 32, color: '#F5D393', opacity: 0.5 }} />
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ height: 12, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'MISSION_VISION':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 }}>{data.subtitle}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {data.mission && (
              <div style={{ padding: 20, background: '#fff', borderRadius: 8, borderLeft: '4px solid #f5d393' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <i className={data.mission.icon || 'ri-flag-line'} style={{ fontSize: 24, color: '#f5d393' }} />
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0 }}>{data.mission.title || 'Sứ Mệnh'}</h4>
                </div>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>{data.mission.content || 'Nội dung sứ mệnh...'}</p>
              </div>
            )}
            {data.vision && (
              <div style={{ padding: 20, background: '#fff', borderRadius: 8, borderLeft: '4px solid #3B82F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <i className={data.vision.icon || 'ri-eye-line'} style={{ fontSize: 24, color: '#3B82F6' }} />
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0 }}>{data.vision.title || 'Tầm Nhìn'}</h4>
                </div>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>{data.vision.content || 'Nội dung tầm nhìn...'}</p>
              </div>
            )}
          </div>
        </div>
      );

    case 'SOCIAL_MEDIA':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24, textAlign: 'center' }}>
          {data.title && <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{data.subtitle}</p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(data.links || []).map((link: DataRecord, idx: number) => (
              <div key={idx} style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <i className={link.icon || 'ri-link'} style={{ fontSize: 20, color: '#f5d393' }} />
              </div>
            ))}
            {(!data.links || data.links.length === 0) && (
              <>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-facebook-fill" style={{ fontSize: 20, color: '#1877F2' }} />
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-instagram-fill" style={{ fontSize: 20, color: '#E4405F' }} />
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-youtube-fill" style={{ fontSize: 20, color: '#FF0000' }} />
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'FOOTER_SOCIAL':
      return (
        <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 24, textAlign: 'center' }}>
          {data.title && <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f5d393', marginBottom: 12 }}>{data.title}</h3>}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {(data.platforms || []).map((p: DataRecord, idx: number) => (
              <div key={idx} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ri-${p.name}-fill`} style={{ fontSize: 18, color: '#fff' }} />
              </div>
            ))}
            {(!data.platforms || data.platforms.length === 0) && (
              <>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-facebook-fill" style={{ fontSize: 18, color: '#fff' }} />
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-youtube-fill" style={{ fontSize: 18, color: '#fff' }} />
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'QUICK_CONTACT':
      return (
        <div style={{ background: 'linear-gradient(135deg, #f5d393 0%, #efb679 100%)', borderRadius: 8, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16 }}>{data.title || 'Liên Hệ Nhanh'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111' }}>
                <i className="ri-phone-fill" style={{ fontSize: 18 }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{data.phone}</span>
              </div>
            )}
            {data.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111' }}>
                <i className="ri-mail-fill" style={{ fontSize: 18 }} />
                <span style={{ fontSize: 14 }}>{data.email}</span>
              </div>
            )}
            {data.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111' }}>
                <i className="ri-map-pin-fill" style={{ fontSize: 18 }} />
                <span style={{ fontSize: 14 }}>{data.address}</span>
              </div>
            )}
          </div>
        </div>
      );

    case 'FAB_ACTIONS':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Nút nổi góc màn hình</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'flex-end' }}>
            {(data.actions || []).map((action: DataRecord, idx: number) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: action.color || '#f5d393', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <i className={action.icon || 'ri-phone-fill'} style={{ fontSize: 18, color: '#fff' }} />
                </div>
                <span style={{ fontSize: 10, color: '#666' }}>{action.label}</span>
              </div>
            ))}
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: data.mainColor || '#f5d393', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              <i className={data.mainIcon || 'ri-customer-service-2-fill'} style={{ fontSize: 24, color: '#111' }} />
            </div>
          </div>
        </div>
      );

    case 'QUOTE_FORM': {
      const layoutStyle = data.layout === 'glass' 
        ? { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }
        : data.layout === 'simple'
        ? { background: 'transparent' }
        : { background: 'linear-gradient(135deg, rgba(245,211,147,0.1) 0%, rgba(239,182,121,0.05) 100%)', border: '1px solid rgba(245,211,147,0.2)' };
      
      const fields: { label: string; type: string }[] = [];
      if (data.showNameField !== false) fields.push({ label: 'Họ tên *', type: 'text' });
      if (data.showPhoneField !== false) fields.push({ label: 'Số điện thoại *', type: 'text' });
      if (data.showEmailField !== false) fields.push({ label: 'Email', type: 'text' });
      if (data.showAddressField === true) fields.push({ label: 'Địa chỉ', type: 'text' });
      if (data.showContentField !== false) fields.push({ label: 'Nội dung yêu cầu', type: 'textarea' });
      
      // Add custom fields
      if (data.customFields && Array.isArray(data.customFields)) {
        for (const cf of data.customFields) {
          fields.push({ label: `${cf.label}${cf.required ? ' *' : ''}`, type: cf.type || 'text' });
        }
      }

      return (
        <div style={{ borderRadius: 8, padding: 24, ...layoutStyle }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>{data.title || 'Đăng kí tư vấn'}</h3>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20, textAlign: 'center' }}>{data.subtitle || 'Điền thông tin để nhận báo giá nhanh chóng'}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fields.map((field, idx) => (
              <div key={idx}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{field.label}</label>
                <div style={{ height: field.type === 'textarea' ? 80 : 40, background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb' }} />
              </div>
            ))}
            <button style={{ padding: '12px 24px', background: data.buttonColor || '#f5d393', color: '#111', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, marginTop: 8 }}>
              {data.buttonText || 'Gửi Yêu Cầu'}
            </button>
          </div>
          {data.customFields && data.customFields.length > 0 && (
            <p style={{ fontSize: 11, color: '#999', marginTop: 12, textAlign: 'center' }}>
              + {data.customFields.length} trường tùy chỉnh
            </p>
          )}
        </div>
      );
    }

    case 'QUOTE_CALCULATOR':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title || 'Báo Giá & Dự Toán'}</h2>
            <p style={{ fontSize: 14, color: '#666' }}>{data.subtitle || 'Tính toán chi phí cải tạo nhà nhanh chóng và chính xác'}</p>
          </div>
          
          {/* Tab Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <button style={{ 
              padding: '10px 20px', 
              borderRadius: 8, 
              border: 'none', 
              background: data.defaultTab !== 'consultation' ? '#f5d393' : '#e5e7eb', 
              color: data.defaultTab !== 'consultation' ? '#111' : '#666',
              fontSize: 14, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <i className={data.calculatorTab?.icon || 'ri-calculator-line'} />
              {data.calculatorTab?.label || 'Dự Toán Nhanh'}
            </button>
            <button style={{ 
              padding: '10px 20px', 
              borderRadius: 8, 
              border: 'none', 
              background: data.defaultTab === 'consultation' ? '#f5d393' : '#e5e7eb', 
              color: data.defaultTab === 'consultation' ? '#111' : '#666',
              fontSize: 14, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <i className={data.consultationTab?.icon || 'ri-phone-line'} />
              {data.consultationTab?.label || 'Đăng Ký Tư Vấn'}
            </button>
          </div>
          
          {/* Content Box */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', maxWidth: data.maxWidth || 900, margin: '0 auto' }}>
            {data.defaultTab !== 'consultation' ? (
              <>
                {/* Calculator Preview */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5d393', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', fontWeight: 600 }}>1</div>
                    <span style={{ fontSize: 13, color: '#666' }}>Hạng mục</span>
                  </div>
                  <div style={{ width: 40, height: 2, background: '#e5e7eb' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontWeight: 600 }}>2</div>
                    <span style={{ fontSize: 13, color: '#999' }}>Diện tích</span>
                  </div>
                  <div style={{ width: 40, height: 2, background: '#e5e7eb' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontWeight: 600 }}>3</div>
                    <span style={{ fontSize: 13, color: '#999' }}>Kết quả</span>
                  </div>
                </div>
                
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 12 }}>Chọn hạng mục thi công</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['Sơn tường', 'Ốp lát gạch', 'Tháo dỡ'].map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 16px', background: idx === 0 ? 'rgba(245,211,147,0.1)' : '#f9fafb', border: `1px solid ${idx === 0 ? '#f5d393' : '#e5e7eb'}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <i className="ri-paint-brush-line" style={{ fontSize: 20, color: '#f5d393' }} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{item}</span>
                      </div>
                      <i className="ri-arrow-right-s-line" style={{ color: '#999' }} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Consultation Form Preview */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <i className="ri-customer-service-2-line" style={{ fontSize: 40, color: '#f5d393' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginTop: 8 }}>{data.consultationTab?.title || 'Đăng Ký Tư Vấn Trực Tiếp'}</h3>
                  <p style={{ fontSize: 13, color: '#666' }}>{data.consultationTab?.subtitle || 'Để lại thông tin, chúng tôi sẽ liên hệ bạn trong 24h'}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Họ tên *', 'Số điện thoại *', 'Email', 'Nội dung yêu cầu'].map((label, idx) => (
                    <div key={idx}>
                      <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</label>
                      <div style={{ height: idx === 3 ? 60 : 40, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                    </div>
                  ))}
                  <button style={{ padding: '12px 24px', background: '#f5d393', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, marginTop: 8 }}>
                    {data.consultationTab?.buttonText || 'Đăng Ký Tư Vấn'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'ABOUT':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
            <div>
              {data.badge && <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(245,211,147,0.2)', color: '#b45309', fontSize: 12, fontWeight: 600, borderRadius: 20, marginBottom: 12 }}>{data.badge}</span>}
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 12 }}>{data.title || 'Về Chúng Tôi'}</h2>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{data.description || 'Mô tả về công ty...'}</p>
            </div>
            <div style={{ height: 200, background: 'linear-gradient(135deg, rgba(245,211,147,0.3), rgba(239,182,121,0.2))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {data.imageUrl ? (
                <img src={data.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <i className="ri-building-2-line" style={{ fontSize: 48, color: '#f5d393', opacity: 0.5 }} />
              )}
            </div>
          </div>
        </div>
      );

    case 'FAQ':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data.items || []).slice(0, 3).map((item: DataRecord, idx: number) => (
              <div key={idx} style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>{item.question || 'Câu hỏi?'}</h4>
                  <i className="ri-arrow-down-s-line" style={{ fontSize: 18, color: '#666' }} />
                </div>
              </div>
            ))}
            {(!data.items || data.items.length === 0) && (
              <>
                <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Câu hỏi thường gặp 1?</h4>
                    <i className="ri-arrow-down-s-line" style={{ fontSize: 18, color: '#666' }} />
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Câu hỏi thường gặp 2?</h4>
                    <i className="ri-arrow-down-s-line" style={{ fontSize: 18, color: '#666' }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );

    case 'BLOG_LIST':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: 100, background: 'linear-gradient(135deg, rgba(245,211,147,0.3), rgba(239,182,121,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-article-line" style={{ fontSize: 24, color: '#F5D393', opacity: 0.5 }} />
                </div>
                <div style={{ padding: 12, flex: 1 }}>
                  <div style={{ height: 10, background: '#e5e7eb', borderRadius: 4, marginBottom: 6, width: '80%' }} />
                  <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'SERVICES':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {(data.services || data.features || []).map((item: DataRecord) => (
              <div key={item._id || item.title} style={{ padding: 16, background: '#fff', borderRadius: 8, textAlign: 'center' }}>
                <i className={item.icon} style={{ fontSize: 32, color: '#f5d393', marginBottom: 12, display: 'block' }} />
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>{item.title}</h4>
                <p style={{ fontSize: 13, color: '#666' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'INTERIOR_QUOTE':
      return (
        <div style={{ background: 'transparent', borderRadius: 8, padding: 24 }}>
          {/* Header - outside card */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <i className={data.headerIcon || 'ri-home-smile-fill'} style={{ fontSize: 28, color: '#f5d393' }} />
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F4F5', margin: 0 }}>{data.title || 'Báo Giá Nội Thất'}</h2>
            </div>
            <p style={{ fontSize: 14, color: '#A1A1AA' }}>{data.subtitle || 'Chọn căn hộ và gói nội thất để nhận báo giá chi tiết ngay lập tức'}</p>
          </div>
          
          {/* Content Box - Card wrapper with dark theme */}
          <div style={{ background: '#131316', borderRadius: 20, padding: 24, border: '1px solid #27272A', maxWidth: data.maxWidth || 900, margin: '0 auto' }}>
            {/* Wizard Steps Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid #27272A' }}>
              {['CĐT', 'Dự án', 'Tòa', 'Căn', 'MB', 'Gói', 'BG'].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    background: idx === 0 ? '#f5d393' : '#27272A', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: idx === 0 ? '#111' : '#A1A1AA',
                    fontSize: 11,
                    fontWeight: 600 
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: 10, color: idx === 0 ? '#F4F4F5' : '#A1A1AA' }}>{step}</span>
                  {idx < 6 && <div style={{ width: 16, height: 2, background: '#27272A' }} />}
                </div>
              ))}
            </div>
            
            {/* Step Content */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#F4F4F5', marginBottom: 12 }}>Chọn chủ đầu tư</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {['Vinhomes', 'Novaland', 'Capitaland'].map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '16px', 
                  background: idx === 0 ? 'rgba(245,211,147,0.1)' : '#1A1A1E', 
                  border: `1px solid ${idx === 0 ? '#f5d393' : '#27272A'}`, 
                  borderRadius: 8, 
                  textAlign: 'center' 
                }}>
                  <i className="ri-building-4-line" style={{ fontSize: 24, color: '#f5d393', marginBottom: 8, display: 'block' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#F4F4F5' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'INTERIOR_WIZARD':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <i className={data.headerIcon || 'ri-home-smile-fill'} style={{ fontSize: 28, color: '#f5d393' }} />
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: 0 }}>{data.title || 'Báo Giá Nội Thất'}</h2>
            </div>
            <p style={{ fontSize: 14, color: '#666' }}>{data.subtitle || 'Chọn căn hộ và gói nội thất để nhận báo giá chi tiết ngay lập tức'}</p>
          </div>
          
          {/* Wizard Steps Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['Dự án', 'Tòa nhà', 'Căn hộ', 'Mặt bằng', 'Gói', 'Kết quả'].map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: '50%', 
                  background: idx === 0 ? '#f5d393' : '#e5e7eb', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: idx === 0 ? '#111' : '#666',
                  fontSize: 12,
                  fontWeight: 600 
                }}>
                  {idx + 1}
                </div>
                <span style={{ fontSize: 11, color: idx === 0 ? '#111' : '#999' }}>{step}</span>
                {idx < 5 && <div style={{ width: 20, height: 2, background: '#e5e7eb' }} />}
              </div>
            ))}
          </div>
          
          {/* Content Box */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', maxWidth: data.maxWidth || 1200, margin: '0 auto' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 12 }}>Chọn dự án</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {['Vinhomes Grand Park', 'Masteri Thảo Điền', 'The Sun Avenue'].map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '16px', 
                  background: idx === 0 ? 'rgba(245,211,147,0.1)' : '#f9fafb', 
                  border: `1px solid ${idx === 0 ? '#f5d393' : '#e5e7eb'}`, 
                  borderRadius: 8, 
                  textAlign: 'center' 
                }}>
                  <i className="ri-building-2-line" style={{ fontSize: 24, color: '#f5d393', marginBottom: 8, display: 'block' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'INTERIOR_PRICING_TABLE':
      return (
        <div style={{ background: 'transparent', borderRadius: 8, padding: 24 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F4F5', marginBottom: 8 }}>{data.title || 'Bảng Báo Giá Nội Thất'}</h2>
            <p style={{ fontSize: 14, color: '#A1A1AA' }}>{data.subtitle || 'Chọn gói nội thất phù hợp với nhu cầu và ngân sách của bạn'}</p>
          </div>
          
          {/* Pricing Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)`, gap: 16 }}>
            {[
              { name: 'Cơ bản', tier: 'BASIC', price: '50,000,000', color: '#A1A1AA' },
              { name: 'Tiêu chuẩn', tier: 'STANDARD', price: '80,000,000', color: '#3B82F6', isPopular: true },
              { name: 'Cao cấp', tier: 'PREMIUM', price: '120,000,000', color: '#F59E0B' },
            ].slice(0, data.columns || 3).map((tier, idx) => (
              <div key={idx} style={{ 
                background: '#131316', 
                borderRadius: 20, 
                border: `2px solid ${tier.isPopular ? '#f5d393' : '#27272A'}`,
                overflow: 'hidden',
                position: 'relative'
              }}>
                {tier.isPopular && (
                  <div style={{ 
                    position: 'absolute', 
                    top: 12, 
                    right: 12, 
                    background: '#f5d393', 
                    color: '#111', 
                    fontSize: 10, 
                    fontWeight: 700, 
                    padding: '4px 8px', 
                    borderRadius: 20 
                  }}>
                    <i className="ri-star-fill" style={{ marginRight: 4 }} />
                    Phổ biến
                  </div>
                )}
                {/* Thumbnail placeholder */}
                <div style={{ height: 100, background: 'linear-gradient(135deg, rgba(245,211,147,0.15), rgba(239,182,121,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-home-smile-line" style={{ fontSize: 32, color: '#f5d393', opacity: 0.5 }} />
                </div>
                <div style={{ padding: 16 }}>
                  {/* Tier badge */}
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 4, 
                    padding: '4px 8px', 
                    background: `${tier.color}15`, 
                    color: tier.color, 
                    fontSize: 11, 
                    fontWeight: 600, 
                    borderRadius: 6, 
                    marginBottom: 8 
                  }}>
                    <i className="ri-home-line" />
                    {tier.tier === 'BASIC' ? 'Cơ bản' : tier.tier === 'STANDARD' ? 'Tiêu chuẩn' : 'Cao cấp'}
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#F4F4F5', margin: '0 0 8px' }}>{tier.name}</h4>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f5d393', marginBottom: 12 }}>
                    {tier.price}<span style={{ fontSize: 12, color: '#A1A1AA', fontWeight: 400 }}>đ</span>
                  </div>
                  {/* Features */}
                  {data.showFeatures !== false && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', fontSize: 12 }}>
                      {['Nội thất phòng khách', 'Nội thất phòng ngủ', 'Thiết bị bếp'].map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: '#F4F4F5', borderBottom: i < 2 ? '1px solid #27272A' : 'none' }}>
                          <i className="ri-check-line" style={{ color: '#34D399', fontSize: 14 }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* CTA */}
                  {data.showCta !== false && (
                    <button style={{ 
                      width: '100%', 
                      padding: '10px', 
                      background: tier.isPopular ? 'linear-gradient(135deg, #f5d393, #efb679)' : 'transparent', 
                      border: tier.isPopular ? 'none' : '1px solid #27272A', 
                      borderRadius: 12, 
                      color: tier.isPopular ? '#111' : '#F4F4F5', 
                      fontSize: 13, 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}>
                      {data.ctaText || 'Liên hệ tư vấn'}
                      <i className="ri-arrow-right-line" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <i className="ri-eye-off-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          Preview chưa có cho section {kind}
        </div>
      );
  }
}
