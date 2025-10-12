import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from './Button';
import { Input, TextArea } from './Input';
import { ImagePickerModal } from './ImagePickerModal';
import { TemplatePicker } from './TemplatePicker';
import { ImageDropzone } from './ImageDropzone';
import { RichTextEditor } from './RichTextEditor';
import type { Section, SectionKind } from '../types';

// Utility to generate unique IDs for array items
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface SectionEditorProps {
  section: Section | null;
  kind: SectionKind;
  onSave: (data: unknown) => void | Promise<void>;
  onCancel: () => void;
}

export function SectionEditor({ section, kind, onSave, onCancel }: SectionEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true); // Enable preview by default
  const [imagePickerField, setImagePickerField] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  
  const wrappedOnCancel = () => {
    onCancel();
  };

  useEffect(() => {
    if (section?.data) {
      setFormData(section.data as Record<string, any>);
    } else {
      setFormData(getDefaultData(kind));
    }
  }, [section?.id, kind]);

  function getDefaultData(sectionKind: SectionKind): Record<string, any> {
    switch (sectionKind) {
      case 'HERO':
        return {
          title: 'Welcome to Our Restaurant',
          subtitle: 'Experience fine dining at its best',
          imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
          ctaText: 'Book Now',
          ctaLink: '/contact',
        };
      case 'HERO_SIMPLE':
        return {
          title: 'Liên Hệ',
          subtitle: 'Chúng tôi luôn sẵn sàng phục vụ',
          description: 'Hãy liên hệ với chúng tôi để đặt bàn hoặc biết thêm thông tin',
          backgroundImage: '',
          backgroundOverlay: 60,
          textAlign: 'center',
        };
      case 'GALLERY':
        return {
          title: 'Our Gallery',
          subtitle: 'Browse our beautiful space',
          columns: 3,
          limit: 12,
          showOnlyFeatured: false,
          filterByTag: '',
        };
      case 'FEATURED_MENU':
        return {
          title: 'Signature Dishes',
          subtitle: 'Taste our most popular creations',
          limit: 6,
          showOnlyPopular: true,
          autoPlayInterval: 4000,
          ctaText: 'Đặt bàn ngay',
          ctaLink: '#reservation',
        };
      case 'TESTIMONIALS':
        return {
          title: 'What Our Customers Say',
          subtitle: 'Real reviews from real people',
          testimonials: [
            {
              _id: generateUniqueId(),
              name: 'John Doe',
              role: 'Food Critic',
              avatar: 'https://i.pravatar.cc/150?img=1',
              rating: 5,
              content: 'Amazing experience! The food was exceptional.',
            },
          ],
        };
      case 'STATS':
        return {
          title: 'Our Achievements',
          subtitle: 'Numbers that speak for themselves',
          stats: [
            { _id: generateUniqueId(), icon: 'ri-award-line', value: 10, label: 'Awards', suffix: '+' },
            { _id: generateUniqueId(), icon: 'ri-user-smile-line', value: 5000, label: 'Happy Customers', suffix: '+' },
            { _id: generateUniqueId(), icon: 'ri-restaurant-line', value: 100, label: 'Dishes', suffix: '+' },
            { _id: generateUniqueId(), icon: 'ri-star-line', value: 4.9, label: 'Rating', prefix: '⭐' },
          ],
        };
      case 'CTA':
      case 'CALL_TO_ACTION':
        return {
          title: 'Ready to Experience Our Cuisine?',
          subtitle: 'Book a table now and taste the difference',
          primaryButton: { 
            text: 'Make a Reservation', 
            link: '/reservations' 
          },
          secondaryButton: { 
            text: 'View Menu', 
            link: '/menu' 
          },
        };
      case 'CONTACT_INFO':
        return {
          title: 'Liên Hệ & Địa Chỉ',
          phone: '+84 123 456 789',
          email: 'contact@restaurant.com',
          address: '123 Main St, City',
          hours: [
            { _id: generateUniqueId(), day: 'Thứ 2 - Thứ 6', time: '10:00 - 22:00' },
            { _id: generateUniqueId(), day: 'Thứ 7 - Chủ nhật', time: '09:00 - 23:00' },
          ],
          mapEmbedUrl: '',
          socialLinks: [
            { _id: generateUniqueId(), platform: 'facebook', url: 'https://facebook.com' },
            { _id: generateUniqueId(), platform: 'instagram', url: 'https://instagram.com' },
            { _id: generateUniqueId(), platform: 'youtube', url: 'https://youtube.com' },
          ],
        };
      case 'RESERVATION_FORM':
        return {
          title: 'Reserve Your Table',
          description: 'Book a table at our restaurant and enjoy an unforgettable dining experience',
          submitButtonText: 'Xác nhận đặt bàn',
          timeSlots: ['11:00', '12:00', '13:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
          maxPartySize: 12,
          fields: {
            name: { enabled: true, label: 'Họ tên', placeholder: '', required: true },
            email: { enabled: true, label: 'Email', placeholder: '', required: true },
            phone: { enabled: true, label: 'Số điện thoại', placeholder: '', required: true },
            date: { enabled: true, label: 'Ngày', placeholder: '', required: true },
            time: { enabled: true, label: 'Giờ', placeholder: 'Chọn giờ', required: true },
            partySize: { enabled: true, label: 'Số người', placeholder: '', required: true },
            specialRequest: { enabled: true, label: 'Yêu cầu đặc biệt (tùy chọn)', placeholder: 'Vị trí ưa thích, dị ứng thực phẩm, dịp đặc biệt...', required: false },
          },
        };
      case 'SPECIAL_OFFERS':
        return {
          title: 'Special Offers',
          subtitle: 'Limited time deals',
          offers: [],
        };
      case 'GALLERY_SLIDESHOW':
        return {
          title: 'Gallery Highlights',
          subtitle: 'Discover our ambiance',
          autoPlayInterval: 5000,
          showControls: true,
          showIndicators: true,
          limit: 10,
        };
      case 'FEATURED_BLOG_POSTS':
        return {
          title: 'Latest from Our Blog',
          subtitle: 'Stay updated with our stories',
          limit: 3,
        };
      case 'RICH_TEXT':
        return { content: '# Welcome\n\nStart writing your content here...' };
      case 'BANNER':
        return { text: 'Important announcement', href: '' };
      case 'OPENING_HOURS':
        return {
          title: 'Giờ mở cửa',
          subtitle: 'Chúng tôi luôn sẵn sàng đón bạn',
          schedule: [
            { _id: generateUniqueId(), day: 'Thứ 2 - Thứ 6', hours: '10:00 - 22:00' },
            { _id: generateUniqueId(), day: 'Thứ 7 - Chủ nhật', hours: '09:00 - 23:00' },
            { _id: generateUniqueId(), day: 'Ngày lễ', hours: '09:00 - 00:00', special: true }
          ],
          note: 'Đặt bàn trước để đảm bảo chỗ ngồi'
        };
      case 'SOCIAL_MEDIA':
        return {
          title: 'Kết nối với chúng tôi',
          subtitle: 'Theo dõi để cập nhật món mới',
          links: [
            { _id: generateUniqueId(), platform: 'facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' },
            { _id: generateUniqueId(), platform: 'instagram', url: 'https://instagram.com', icon: 'ri-instagram-fill' },
            { _id: generateUniqueId(), platform: 'youtube', url: 'https://youtube.com', icon: 'ri-youtube-fill' },
            { _id: generateUniqueId(), platform: 'tiktok', url: 'https://tiktok.com', icon: 'ri-tiktok-fill' }
          ],
          layout: 'horizontal'
        };
      case 'FEATURES':
        return {
          title: 'Giá trị cốt lõi',
          subtitle: 'Những gì chúng tôi mang đến',
          features: [
            { _id: generateUniqueId(), icon: 'ri-checkbox-circle-line', title: 'Chất Lượng', description: 'Cam kết nguyên liệu tươi ngon, chế biến chuẩn vị' },
            { _id: generateUniqueId(), icon: 'ri-heart-3-line', title: 'Tận Tâm', description: 'Phục vụ bằng cả trái tim, mang đến trải nghiệm tốt nhất' },
            { _id: generateUniqueId(), icon: 'ri-lightbulb-flash-line', title: 'Sáng Tạo', description: 'Không ngừng đổi mới, kết hợp truyền thống và hiện đại' },
            { _id: generateUniqueId(), icon: 'ri-user-smile-line', title: 'Khách Hàng', description: 'Luôn đặt sự hài lòng của khách hàng lên hàng đầu' }
          ],
          layout: 'grid'
        };
      case 'MISSION_VISION':
        return {
          title: 'Sứ mệnh & Tầm nhìn',
          subtitle: 'Định hướng phát triển của chúng tôi',
          mission: {
            icon: 'ri-target-line',
            title: 'Sứ Mệnh',
            content: 'Mang đến những trải nghiệm ẩm thực đẳng cấp, kết hợp hương vị truyền thống và hiện đại, phục vụ với tâm huyết và sự tận tâm cao nhất.'
          },
          vision: {
            icon: 'ri-eye-line',
            title: 'Tầm Nhìn',
            content: 'Trở thành điểm đến hàng đầu cho những ai yêu thích ẩm thực tinh tế, không gian sang trọng và dịch vụ chuyên nghiệp.'
          }
        };
      case 'CORE_VALUES':
        return {
          title: 'Giá Trị Cốt Lõi',
          subtitle: 'Những giá trị định hình thương hiệu của chúng tôi',
          values: [
            { _id: generateUniqueId(), icon: 'ri-checkbox-circle-line', title: 'Chất Lượng', description: 'Cam kết nguyên liệu tươi ngon, chế biến chuẩn vị' },
            { _id: generateUniqueId(), icon: 'ri-heart-3-line', title: 'Tận Tâm', description: 'Phục vụ bằng cả trái tim, mang đến trải nghiệm tốt nhất' },
            { _id: generateUniqueId(), icon: 'ri-lightbulb-flash-line', title: 'Sáng Tạo', description: 'Không ngừng đổi mới, kết hợp truyền thống và hiện đại' },
            { _id: generateUniqueId(), icon: 'ri-user-smile-line', title: 'Khách Hàng', description: 'Luôn đặt sự hài lòng của khách hàng lên hàng đầu' },
          ]
        };
      case 'FAB_ACTIONS':
        return {
          mainIcon: 'ri-customer-service-2-fill',
          mainColor: '#F5D393',
          actions: [
            { _id: generateUniqueId(), icon: 'ri-phone-fill', label: 'Gọi ngay', href: 'tel:+84123456789', color: '#10b981' },
            { _id: generateUniqueId(), icon: 'ri-calendar-fill', label: 'Đặt bàn', href: '/contact', color: '#f59e0b' },
            { _id: generateUniqueId(), icon: 'ri-map-pin-fill', label: 'Địa chỉ', href: '/contact', color: '#3b82f6' },
            { _id: generateUniqueId(), icon: 'ri-messenger-fill', label: 'Chat', href: 'https://m.me/your-page', color: '#8b5cf6' }
          ]
        };
      case 'FOOTER_SOCIAL':
        return {
          title: 'Kết Nối Với Chúng Tôi',
          subtitle: 'Theo dõi chúng tôi trên mạng xã hội',
          platforms: [
            { _id: generateUniqueId(), name: 'facebook', url: 'https://facebook.com' },
            { _id: generateUniqueId(), name: 'instagram', url: 'https://instagram.com' },
            { _id: generateUniqueId(), name: 'youtube', url: 'https://youtube.com' },
            { _id: generateUniqueId(), name: 'twitter', url: 'https://twitter.com' }
          ],
          layout: 'circular'
        };
      case 'QUICK_CONTACT':
        return {
          title: 'Hãy Liên Hệ Với Chúng Tôi',
          subtitle: 'Chúng tôi luôn sẵn sàng lắng nghe và phục vụ bạn',
          methods: [
            { _id: generateUniqueId(), icon: 'ri-phone-fill', title: 'ĐIỆN THOẠI', value: '+84 123 456 789', href: 'tel:+84123456789', color: '#10b981' },
            { _id: generateUniqueId(), icon: 'ri-mail-fill', title: 'EMAIL', value: 'info@restaurant.com', href: 'mailto:info@restaurant.com', color: '#3b82f6' },
            { _id: generateUniqueId(), icon: 'ri-map-pin-fill', title: 'ĐỊA CHỈ', value: '123 Đường ABC, Quận XYZ, TP.HCM', href: 'https://maps.google.com', color: '#f59e0b' },
            { _id: generateUniqueId(), icon: 'ri-time-fill', title: 'GIỜ MỞ CỬA', value: 'Thứ 2 - CN: 10:00 - 22:00', color: '#f5d393' }
          ]
        };
      default:
        return {};
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  }

  function updateField(path: string, value: any) {
    setFormData((prev) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        } else {
          // Preserve array type when cloning
          current[key] = Array.isArray(current[key]) 
            ? [...current[key]] 
            : { ...current[key] };
        }
        current = current[key];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }

  function addArrayItem(path: string, defaultItem: any) {
    setFormData((prev) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // Preserve array type when cloning
        current[key] = Array.isArray(current[key]) 
          ? [...current[key]] 
          : { ...current[key] };
        current = current[key];
      }

      const lastKey = keys[keys.length - 1];
      // Add unique _id to each new item for stable React keys
      const itemWithId = { ...defaultItem, _id: generateUniqueId() };
      current[lastKey] = [...(current[lastKey] || []), itemWithId];
      return newData;
    });
  }

  function removeArrayItem(path: string, index: number) {
    setFormData((prev) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // Preserve array type when cloning
        current[key] = Array.isArray(current[key]) 
          ? [...current[key]] 
          : { ...current[key] };
        current = current[key];
      }

      const lastKey = keys[keys.length - 1];
      current[lastKey] = [...current[lastKey]];
      current[lastKey].splice(index, 1);
      return newData;
    });
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          // Only close if clicking directly on backdrop, not from bubbled events
          if (e.target === e.currentTarget) {
            wrappedOnCancel();
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => {
            // Prevent modal content clicks from bubbling to backdrop
            e.stopPropagation();
          }}
          style={{
            width: showPreview ? 'min(1400px, 100%)' : 'min(900px, 100%)',
            height: 'min(90vh, 100%)',
            maxHeight: '90vh',
            background: 'rgba(20,21,26,0.98)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.lg,
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s ease',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 9999,
          }}
        >
        {/* Header - Enhanced for No-Code Users */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <i className={getSectionIcon(kind)} style={{ fontSize: 24, color: tokens.color.primary }} />
              <h3 style={{ color: tokens.color.text, fontSize: 22, fontWeight: 700, margin: 0 }}>
                {section ? 'Edit' : 'Create'} {kind.replace(/_/g, ' ')} Section
              </h3>
              <span style={{ 
                background: section ? 'rgba(245, 211, 147, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
                color: section ? tokens.color.primary : 'rgb(96, 165, 250)',
                padding: '4px 10px',
                borderRadius: tokens.radius.md,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                border: `1px solid ${section ? 'rgba(245, 211, 147, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              }}>
                {section ? 'Editing' : 'New'}
              </span>
            </div>
            <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              {getSectionDescription(kind)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {!section && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTemplatePicker(true);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: tokens.radius.md,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <i className="ri-sparkling-line" style={{ fontSize: '16px' }} />
                Use Template
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(!showPreview);
              }}
              style={{
                padding: '8px 16px',
                background: showPreview ? tokens.color.primary : 'rgba(255,255,255,0.05)',
                color: showPreview ? '#111' : tokens.color.text,
                border: `1px solid ${showPreview ? tokens.color.primary : tokens.color.border}`,
                borderRadius: tokens.radius.md,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className={showPreview ? 'ri-eye-off-line' : 'ri-eye-line'} />
              {showPreview ? 'Hide' : 'Show'} Preview
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                wrappedOnCancel();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: tokens.color.muted,
                cursor: 'pointer',
                fontSize: 24,
              }}
            >
              <i className="ri-close-line" />
            </motion.button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              flex: showPreview ? '0 0 50%' : 1,
              padding: 28,
              overflowY: 'auto',
              overflowX: 'hidden',
              background: 'rgba(0,0,0,0.1)',
            }}
          >
            {renderFormFields(kind, formData, updateField, addArrayItem, removeArrayItem, (field) => setImagePickerField(field))}
          </form>

          {/* Preview */}
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                flex: '0 0 50%',
                borderLeft: `1px solid ${tokens.color.border}`,
                padding: 24,
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ 
                marginBottom: 16, 
                color: tokens.color.muted, 
                fontSize: 13, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <i className="ri-eye-line" />
                Live Preview
              </div>
              <div
                style={{
                  background: '#fff',
                  borderRadius: tokens.radius.md,
                  padding: 32,
                  minHeight: 300,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
              >
                {(() => {
                  try {
                    return renderPreview(kind, formData);
                  } catch (error) {
                    return (
                      <div style={{ 
                        padding: 20, 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: tokens.radius.md,
                        color: '#991b1b',
                      }}>
                        <i className="ri-error-warning-line" style={{ marginRight: 8 }} />
                        Preview error: {(error as Error).message}
                      </div>
                    );
                  }
                })()}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 28px',
            borderTop: `1px solid ${tokens.color.border}`,
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)',
          }}
        >
          <div style={{ color: tokens.color.muted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ri-information-line" />
            Changes will be visible immediately on your site
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" onClick={wrappedOnCancel} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const fakeEvent = { preventDefault: () => { /* Prevent form submission */ } } as React.FormEvent;
                handleSubmit(fakeEvent);
              }}
              loading={saving}
              icon={section ? 'ri-save-line' : 'ri-add-line'}
            >
              {section ? 'Update Section' : 'Create Section'}
            </Button>
          </div>
        </div>
        </motion.div>
      </motion.div>

      {/* Image Picker Modal */}
      <AnimatePresence>
        {imagePickerField && (
          <ImagePickerModal
            currentUrl={formData[imagePickerField]}
            onSelect={(url) => {
              updateField(imagePickerField, url);
              setImagePickerField(null);
            }}
            onCancel={() => setImagePickerField(null)}
          />
        )}
      </AnimatePresence>

      {/* Template Picker */}
      {showTemplatePicker && (
        <TemplatePicker
          kind={kind}
          onSelect={(templateData) => {
            setFormData(templateData);
          }}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
    </>
  );
}

function getSectionDescription(kind: SectionKind): string {
  const descriptions: Record<SectionKind, string> = {
    HERO: 'Main banner with image, title, and call-to-action button',
    HERO_SIMPLE: 'Lightweight hero section for secondary pages',
    GALLERY: 'Beautiful image gallery with lightbox viewer',
    FEATURED_MENU: 'Highlight signature dishes with images and prices',
    TESTIMONIALS: 'Display customer reviews and feedback',
    STATS: 'Show impressive numbers and achievements',
    CTA: 'Call-to-action section to drive conversions',
    CALL_TO_ACTION: 'Call-to-action section with primary and secondary buttons',
    CONTACT_INFO: 'Show contact details and location',
    RESERVATION_FORM: 'Booking form for table reservations',
    SPECIAL_OFFERS: 'Promotional offers and limited-time deals',
    RICH_TEXT: 'Custom HTML content',
    BANNER: 'Announcement or notice banner',
    GALLERY_SLIDESHOW: 'Auto-playing slideshow from gallery images',
    FEATURED_BLOG_POSTS: 'Featured blog posts section',
    OPENING_HOURS: 'Display business hours and schedule',
    SOCIAL_MEDIA: 'Social media links with icons',
    FEATURES: 'Highlight key features or core values',
    MISSION_VISION: 'Company mission and vision statements',
    FAB_ACTIONS: 'Floating action buttons in bottom-right corner',
    FOOTER_SOCIAL: 'Social media links in footer section',
    QUICK_CONTACT: 'Quick contact cards with phone, email, address, hours',
    CORE_VALUES: 'Display core values and principles with icons',
  };
  return descriptions[kind] || '';
}

function getSectionIcon(kind: SectionKind): string {
const icons: Record<SectionKind, string> = {
    HERO: 'ri-image-2-fill',
    HERO_SIMPLE: 'ri-layout-top-fill',
    GALLERY: 'ri-gallery-fill',
    FEATURED_MENU: 'ri-restaurant-2-fill',
    TESTIMONIALS: 'ri-chat-quote-fill',
    STATS: 'ri-bar-chart-box-fill',
    CTA: 'ri-megaphone-fill',
    CALL_TO_ACTION: 'ri-megaphone-fill',
    CONTACT_INFO: 'ri-phone-fill',
    RESERVATION_FORM: 'ri-calendar-check-fill',
    SPECIAL_OFFERS: 'ri-price-tag-3-fill',
    RICH_TEXT: 'ri-file-text-fill',
    BANNER: 'ri-notification-badge-fill',
    GALLERY_SLIDESHOW: 'ri-slideshow-fill',
    FEATURED_BLOG_POSTS: 'ri-article-fill',
    OPENING_HOURS: 'ri-time-fill',
    SOCIAL_MEDIA: 'ri-share-fill',
    FEATURES: 'ri-star-fill',
    MISSION_VISION: 'ri-flag-fill',
    FAB_ACTIONS: 'ri-customer-service-fill',
    FOOTER_SOCIAL: 'ri-share-forward-fill',
    QUICK_CONTACT: 'ri-contacts-fill',
    CORE_VALUES: 'ri-heart-3-fill',
  };
  return icons[kind] || 'ri-layout-fill';
}

function renderPreview(kind: SectionKind, data: Record<string, any>) {
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
              <div style={{ 
                display: 'inline-block',
                padding: '6px 16px', 
                background: 'rgba(245,211,147,0.15)', 
                border: '1px solid rgba(245,211,147,0.3)',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                color: '#f5d393',
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
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
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: 'linear-gradient(135deg, rgba(245, 211, 147, 0.15) 0%, rgba(239, 182, 121, 0.1) 100%)',
          borderRadius: 16,
          border: '1px solid rgba(245, 211, 147, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(245, 211, 147, 0.1) 1px, transparent 0)',
            backgroundSize: '32px 32px',
            opacity: 0.5,
          }} />
          
          <div style={{ position: 'relative' }}>
            {data.title && (
              <h2 style={{ 
                fontSize: 36, 
                fontWeight: 700, 
                marginBottom: 16, 
                color: '#F5D393',
                fontFamily: 'Playfair Display, serif',
                lineHeight: 1.2,
              }}>
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p style={{ 
                fontSize: 18, 
                marginBottom: 32, 
                color: 'rgba(255,255,255,0.7)',
                maxWidth: 600,
                margin: '0 auto 32px',
                lineHeight: 1.6,
              }}>
                {data.subtitle}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {data.primaryButton?.text && (
                <button style={{ 
                  padding: '16px 40px', 
                  background: 'linear-gradient(135deg, #F5D393, #EFB679)',
                  color: '#111', 
                  border: 'none', 
                  borderRadius: 12, 
                  fontSize: 16, 
                  fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(245, 211, 147, 0.3)',
                  cursor: 'pointer',
                }}>
                  {data.primaryButton.text}
                </button>
              )}
              {data.secondaryButton?.text && (
                <button style={{ 
                  padding: '16px 40px', 
                  background: 'transparent',
                  color: '#F5D393', 
                  border: '2px solid #F5D393', 
                  borderRadius: 12, 
                  fontSize: 16, 
                  fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  {data.secondaryButton.text}
                </button>
              )}
            </div>
          </div>
        </div>
      );

    case 'RICH_TEXT':
      return (
        <div
          style={{ color: '#111', lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: data.html || '<p style="color: #999">No content yet...</p>' }}
        />
      );

    case 'BANNER':
      return (
        <div style={{ padding: 16, background: '#f5d393', color: '#111', textAlign: 'center', borderRadius: 8, fontWeight: 500 }}>
          {data.text || 'Banner text'}
        </div>
      );

    case 'CONTACT_INFO':
      // Merge with defaults similar to Landing
      const defaultContactData = {
        title: 'Liên Hệ & Địa Chỉ',
        address: '',
        phone: '',
        email: '',
        hours: [
          { day: 'Thứ 2 - Thứ 6', time: '10:00 - 22:00' },
          { day: 'Thứ 7 - Chủ nhật', time: '09:00 - 23:00' },
        ],
        mapEmbedUrl: '',
        socialLinks: [],
      };
      const mergedContactData = {
        ...defaultContactData,
        ...data,
        hours: (data.hours && data.hours.length > 0) ? data.hours : defaultContactData.hours,
        socialLinks: data.socialLinks || defaultContactData.socialLinks,
      };

      return (
        <div>
          {/* Title */}
          <h2
            style={{
              fontSize: 24,
              fontFamily: tokens.font.display,
              color: tokens.color.primary,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            {mergedContactData.title}
          </h2>

          {/* Two Column Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
            }}
          >
            {/* Left Column: Contact Details */}
            <div
              style={{
                background: `linear-gradient(135deg, ${tokens.color.surface} 0%, rgba(19,19,22,0.8) 100%)`,
                padding: 24,
                borderRadius: tokens.radius.lg,
                border: `1px solid ${tokens.color.border}`,
                boxShadow: tokens.shadow.md,
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  color: tokens.color.primary,
                  marginBottom: 20,
                  fontWeight: 700,
                }}
              >
                Thông tin liên hệ
              </h3>

              <div style={{ display: 'grid', gap: 16 }}>
                {/* Address */}
                {mergedContactData.address && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: tokens.radius.md,
                        background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <i className="ri-map-pin-line" style={{ fontSize: 20, color: '#111' }} />
                    </div>
                    <div>
                      <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 2 }}>
                        Địa chỉ
                      </div>
                      <div style={{ color: tokens.color.text, fontSize: 14 }}>{mergedContactData.address}</div>
                    </div>
            </div>
          )}

                {/* Phone */}
                {mergedContactData.phone && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: tokens.radius.md,
                        background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <i className="ri-phone-line" style={{ fontSize: 20, color: '#111' }} />
                    </div>
                    <div>
                      <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 2 }}>
                        Điện thoại
                      </div>
                      <div style={{ color: tokens.color.text, fontSize: 14 }}>{mergedContactData.phone}</div>
                    </div>
            </div>
          )}

                {/* Email */}
                {mergedContactData.email && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: tokens.radius.md,
                        background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <i className="ri-mail-line" style={{ fontSize: 20, color: '#111' }} />
                    </div>
                    <div>
                      <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 2 }}>
                        Email
                      </div>
                      <div style={{ color: tokens.color.text, fontSize: 14 }}>{mergedContactData.email}</div>
                    </div>
            </div>
          )}
              </div>

              {/* Opening Hours */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${tokens.color.border}` }}>
                <h4 style={{ color: tokens.color.primary, marginBottom: 12, fontSize: 16 }}>
                  Giờ mở cửa
                </h4>
                <div style={{ display: 'grid', gap: 10 }}>
                  {mergedContactData.hours.map((h: any) => (
                    <div
                      key={h._id || h.day}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: tokens.radius.md,
                      }}
                    >
                      <span style={{ color: tokens.color.text, fontSize: 13 }}>{h.day}</span>
                      <span style={{ color: tokens.color.accent, fontWeight: 600, fontSize: 13 }}>{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              {mergedContactData.socialLinks && mergedContactData.socialLinks.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ color: tokens.color.primary, marginBottom: 12, fontSize: 16 }}>
                    Theo dõi chúng tôi
                  </h4>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {mergedContactData.socialLinks.map((link: any) => (
                      <div
                        key={link._id || link.platform}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${tokens.color.primary} 0%, ${tokens.color.accent} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#111',
                          fontSize: 18,
                          boxShadow: tokens.shadow.sm,
                        }}
                      >
                        <i className={`ri-${link.platform}-line`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Map */}
            <div
              style={{
                borderRadius: tokens.radius.lg,
                overflow: 'hidden',
                border: `1px solid ${tokens.color.border}`,
                boxShadow: tokens.shadow.md,
                minHeight: 400,
              }}
            >
              {mergedContactData.mapEmbedUrl ? (
                <iframe
                  src={mergedContactData.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 400 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 400,
                    background: tokens.color.surface,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 12,
                    color: tokens.color.muted,
                  }}
                >
                  <i className="ri-map-2-line" style={{ fontSize: 40 }} />
                  <div style={{ fontSize: 14 }}>Bản đồ sẽ được cập nhật sớm</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );

    case 'TESTIMONIALS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{data.subtitle}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {(data.testimonials || []).slice(0, 2).map((testimonial: any) => (
              <div key={testimonial._id || testimonial.name} style={{ background: '#fffbeb', borderRadius: 8, padding: 16, border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {testimonial.avatar ? (
                    <img src={testimonial.avatar} alt={testimonial.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>
                      {testimonial.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{testimonial.name || 'Anonymous'}</div>
                    <div style={{ fontSize: 12, color: '#78350F' }}>{testimonial.role || 'Customer'}</div>
                  </div>
                </div>
                {testimonial.rating && (
                  <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <i key={idx} className={idx < testimonial.rating ? 'ri-star-fill' : 'ri-star-line'} style={{ color: '#F59E0B', fontSize: 14 }} />
                    ))}
                  </div>
                )}
                {testimonial.content && <p style={{ fontSize: 13, color: '#451a03', lineHeight: 1.6, margin: 0 }}>{testimonial.content}</p>}
              </div>
            ))}
          </div>
          {(data.testimonials || []).length > 2 && (
            <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
              + {data.testimonials.length - 2} more testimonials
            </div>
          )}
        </div>
      );

    case 'RESERVATION_FORM':
      // Default field configurations matching Landing page
      const defaultFieldsPreview = {
        name: { enabled: true, label: 'Họ tên', placeholder: '', required: true },
        email: { enabled: true, label: 'Email', placeholder: '', required: true },
        phone: { enabled: true, label: 'Số điện thoại', placeholder: '', required: true },
        date: { enabled: true, label: 'Ngày', placeholder: '', required: true },
        time: { enabled: true, label: 'Giờ', placeholder: 'Chọn giờ', required: true },
        partySize: { enabled: true, label: 'Số người', placeholder: '', required: true },
        specialRequest: { enabled: true, label: 'Yêu cầu đặc biệt (tùy chọn)', placeholder: 'Vị trí ưa thích, dị ứng thực phẩm, dịp đặc biệt...', required: false },
      };
      
      // Deep merge to preserve default field properties
      const fields = {
        ...defaultFieldsPreview,
        ...Object.fromEntries(
          Object.entries(data.fields || {}).map(([key, val]) => [
            key,
            { ...defaultFieldsPreview[key as keyof typeof defaultFieldsPreview], ...(typeof val === 'object' && val !== null ? val : {}) }
          ])
        )
      };
      
      return (
        <div style={{ 
          padding: 32, 
          background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.95) 0%, rgba(19, 19, 22, 0.8) 100%)',
          borderRadius: 12, 
          border: '1px solid rgba(245, 211, 147, 0.2)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}>
          {data.title && (
            <h2 style={{ 
              fontSize: 32, 
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700, 
              color: '#F5D393', 
              marginBottom: 12,
              textAlign: 'center'
            }}>
              {data.title}
            </h2>
          )}
          {data.description && (
            <p style={{ 
              fontSize: 14, 
              color: '#9ca3af', 
              marginBottom: 24,
              textAlign: 'center',
              maxWidth: 500,
              margin: '0 auto 24px'
            }}>
              {data.description}
            </p>
          )}
          
          <div style={{ maxWidth: 500, margin: '0 auto', display: 'grid', gap: 16 }}>
            {/* Name & Email Row */}
            {(fields.name?.enabled || fields.email?.enabled) && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: fields.name?.enabled && fields.email?.enabled ? '1fr 1fr' : '1fr',
                gap: 12 
              }}>
                {fields.name?.enabled && (
                  <div>
                    <div style={{ fontSize: 12, color: '#e5e7eb', marginBottom: 6, fontWeight: 500 }}>
                      {fields.name.label || 'Họ tên'}{fields.name.required !== false && ' *'}
            </div>
                    <div style={{ 
                      padding: 10, 
                      background: 'rgba(17, 24, 39, 0.6)', 
                      borderRadius: 8, 
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      {fields.name.placeholder || 'Your name...'}
            </div>
            </div>
                )}
                {fields.email?.enabled && (
                  <div>
                    <div style={{ fontSize: 12, color: '#e5e7eb', marginBottom: 6, fontWeight: 500 }}>
                      {fields.email.label || 'Email'}{fields.email.required !== false && ' *'}
            </div>
                    <div style={{ 
                      padding: 10, 
                      background: 'rgba(17, 24, 39, 0.6)', 
                      borderRadius: 8, 
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      {fields.email.placeholder || 'your@email.com'}
          </div>
                  </div>
                )}
              </div>
            )}

            {/* Phone */}
            {fields.phone?.enabled && (
              <div>
                <div style={{ fontSize: 12, color: '#e5e7eb', marginBottom: 6, fontWeight: 500 }}>
                  {fields.phone.label || 'Số điện thoại'}{fields.phone.required !== false && ' *'}
                </div>
                <div style={{ 
                  padding: 10, 
                  background: 'rgba(17, 24, 39, 0.6)', 
                  borderRadius: 8, 
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  fontSize: 13,
                  color: '#6b7280'
                }}>
                  {fields.phone.placeholder || '+84...'}
                </div>
              </div>
            )}

            {/* Date, Time, Party Size Row */}
            {(fields.date?.enabled || fields.time?.enabled || fields.partySize?.enabled) && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${[fields.date?.enabled, fields.time?.enabled, fields.partySize?.enabled].filter(Boolean).length}, 1fr)`,
                gap: 12 
              }}>
                {fields.date?.enabled && (
                  <div>
                    <div style={{ fontSize: 12, color: '#e5e7eb', marginBottom: 6, fontWeight: 500 }}>
                      {fields.date.label || 'Ngày'}{fields.date.required !== false && ' *'}
                    </div>
                    <div style={{ 
                      padding: 10, 
                      background: 'rgba(17, 24, 39, 0.6)', 
                      borderRadius: 8, 
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      {fields.date.placeholder || 'Select date...'}
                    </div>
                  </div>
                )}
                {fields.time?.enabled && (
                  <div>
                    <div style={{ fontSize: 12, color: '#e5e7eb', marginBottom: 6, fontWeight: 500 }}>
                      {fields.time.label || 'Giờ'}{fields.time.required !== false && ' *'}
                    </div>
                    <div style={{ 
                      padding: 10, 
                      background: 'rgba(17, 24, 39, 0.6)', 
                      borderRadius: 8, 
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      {fields.time.placeholder || 'Chọn giờ'}
                    </div>
                  </div>
                )}
                {fields.partySize?.enabled && (
                  <div>
                    <div style={{ fontSize: 12, color: '#e5e7eb', marginBottom: 6, fontWeight: 500 }}>
                      {fields.partySize.label || 'Số người'}{fields.partySize.required !== false && ' *'}
                    </div>
                    <div style={{ 
                      padding: 10, 
                      background: 'rgba(17, 24, 39, 0.6)', 
                      borderRadius: 8, 
                      border: '1px solid rgba(75, 85, 99, 0.5)',
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      2 người
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Special Request */}
            {fields.specialRequest?.enabled && (
              <div>
                <div style={{ fontSize: 12, color: '#e5e7eb', marginBottom: 6, fontWeight: 500 }}>
                  {fields.specialRequest.label || 'Yêu cầu đặc biệt'}{fields.specialRequest.required && ' *'}
                </div>
                <div style={{ 
                  padding: 10, 
                  background: 'rgba(17, 24, 39, 0.6)', 
                  borderRadius: 8, 
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  fontSize: 13,
                  color: '#6b7280',
                  minHeight: 60
                }}>
                  {fields.specialRequest.placeholder || 'Vị trí ưa thích, dị ứng thực phẩm...'}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button style={{ 
              marginTop: 8,
              width: '100%', 
              padding: '14px', 
              background: 'linear-gradient(135deg, #F5D393 0%, #E5C373 100%)', 
              color: '#1a1b1e', 
              border: 'none', 
              borderRadius: 8, 
              fontSize: 15, 
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 211, 147, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <i className="ri-calendar-check-line" style={{ fontSize: 18 }} />
              {data.submitButtonText || 'Xác nhận đặt bàn'}
          </button>
          </div>
        </div>
      );

    case 'OPENING_HOURS':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>{data.subtitle}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data.schedule || []).map((item: any) => (
              <div key={item._id || item.day} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: 12, 
                background: item.special ? '#fff7ed' : '#fff', 
                borderRadius: 6,
                border: `1px solid ${item.special ? '#fb923c' : '#ddd'}`
              }}>
                <span style={{ fontWeight: 600, color: '#111' }}>{item.day}</span>
                <span style={{ color: '#666' }}>{item.hours}</span>
              </div>
            ))}
          </div>
          {data.note && <p style={{ fontSize: 12, color: '#999', marginTop: 16, textAlign: 'center', fontStyle: 'italic' }}>💡 {data.note}</p>}
        </div>
      );

    case 'SOCIAL_MEDIA':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24, textAlign: 'center' }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>{data.subtitle}</p>}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            ...(data.layout === 'vertical' && { flexDirection: 'column', alignItems: 'center' })
          }}>
            {(data.links || []).map((link: any) => (
              <div key={link._id || link.platform} style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                background: '#f5d393',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111'
              }}>
                <i className={link.icon} style={{ fontSize: 24 }} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'FEATURES':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>{data.subtitle}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {(data.features || []).map((feature: any) => (
              <div key={feature._id || feature.title} style={{ padding: 16, background: '#fff', borderRadius: 8, textAlign: 'center', border: '1px solid #ddd' }}>
                <i className={feature.icon} style={{ fontSize: 32, color: '#f5d393', marginBottom: 12, display: 'block' }} />
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>{feature.title}</h4>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'MISSION_VISION':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>{data.subtitle}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {data.mission && (
              <div style={{ padding: 24, background: '#fff', borderRadius: 8, border: '1px solid #ddd' }}>
                <i className={data.mission.icon} style={{ fontSize: 36, color: '#f5d393', marginBottom: 12, display: 'block' }} />
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 12 }}>{data.mission.title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{data.mission.content}</p>
              </div>
            )}
            {data.vision && (
              <div style={{ padding: 24, background: '#fff', borderRadius: 8, border: '1px solid #ddd' }}>
                <i className={data.vision.icon} style={{ fontSize: 36, color: '#f5d393', marginBottom: 12, display: 'block' }} />
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 12 }}>{data.vision.title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{data.vision.content}</p>
              </div>
            )}
          </div>
        </div>
      );

    case 'CORE_VALUES':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>{data.subtitle}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {(data.values || []).map((value: any) => (
              <div key={value._id || value.title} style={{ padding: 16, background: '#fff', borderRadius: 8, textAlign: 'center', border: '1px solid #ddd' }}>
                <i className={value.icon} style={{ fontSize: 32, color: '#f5d393', marginBottom: 12, display: 'block' }} />
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>{value.title}</h4>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'FAB_ACTIONS':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 40, position: 'relative', minHeight: 300 }}>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>Preview: Floating buttons sẽ xuất hiện ở góc dưới bên phải</p>
          <div style={{ position: 'absolute', right: 20, bottom: 20, display: 'flex', flexDirection: 'column-reverse', gap: 12, alignItems: 'flex-end' }}>
            {data.actions?.map((action: any) => (
              <div
                key={action._id || action.label}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: action.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  position: 'relative'
                }}
                title={action.label}
              >
                <i className={action.icon} />
              </div>
            ))}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: data.mainColor || '#F5D393',
                color: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 8px 24px rgba(245,211,147,0.4)'
              }}
            >
              <i className={data.mainIcon || 'ri-customer-service-2-fill'} />
            </div>
          </div>
        </div>
      );

    case 'FOOTER_SOCIAL':
      return (
        <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 32, textAlign: 'center' }}>
          {data.title && <h3 style={{ fontSize: 24, fontWeight: 700, color: '#f5d393', marginBottom: 12 }}>{data.title}</h3>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#999', marginBottom: 24 }}>{data.subtitle}</p>}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {data.platforms?.map((platform: any) => (
              <div
                key={platform._id || platform.name}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: data.layout === 'circular' ? '50%' : '12px',
                  background: 'linear-gradient(135deg, #F5D393, #EFB679)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111',
                  fontSize: 24
                }}
                title={platform.name}
              >
                <i className={`ri-${platform.name}-fill`} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'QUICK_CONTACT':
      return (
        <div style={{ background: '#0B0B0C', borderRadius: 8, padding: 32 }}>
          {data.title && <h2 style={{ fontSize: 32, fontWeight: 700, color: '#f5d393', marginBottom: 12, textAlign: 'center' }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#999', marginBottom: 32, textAlign: 'center' }}>{data.subtitle}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {data.methods?.map((method: any) => (
              <div
                key={method._id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: `${method.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className={method.icon} style={{ fontSize: 24, color: method.color }} />
                </div>
                <h4 style={{ fontSize: 12, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{method.title}</h4>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{method.value}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'GALLERY':
      return (
        <div style={{ background: '#0B0B0C', borderRadius: 8, padding: 32 }}>
          {data.title && <h2 style={{ fontSize: 28, fontWeight: 700, color: '#F4F4F5', marginBottom: 8, textAlign: 'center', fontFamily: 'Playfair Display, serif' }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#A1A1AA', marginBottom: 24, textAlign: 'center' }}>{data.subtitle}</p>}
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)`,
            gap: 12,
          }}>
            {/* Mock gallery items */}
            {Array.from({ length: Math.min(data.limit || 6, 6) }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  aspectRatio: '1',
                  background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(239,182,121,0.2))',
                  borderRadius: 8,
                  border: '1px solid rgba(245,211,147,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <i className="ri-image-line" style={{ fontSize: 32, color: '#F5D393', opacity: 0.5 }} />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  padding: 8,
                  fontSize: 10,
                  color: '#F4F4F5',
                  textAlign: 'center',
                }}>
                  Gallery Image {idx + 1}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(59,130,246,0.1)', borderRadius: 6, border: '1px solid rgba(59,130,246,0.3)' }}>
            <p style={{ fontSize: 12, color: '#93C5FD', margin: 0, textAlign: 'center' }}>
              <i className="ri-information-line" style={{ marginRight: 4 }} />
              {data.showOnlyFeatured ? 'Showing only featured images' : 'Showing all images'}
              {data.filterByTag && ` filtered by "${data.filterByTag}"`}
              {' '}(max {data.limit || 12})
            </p>
          </div>
        </div>
      );

    case 'FEATURED_MENU':
      return (
        <div style={{ background: '#0B0B0C', borderRadius: 8, padding: 32 }}>
          {data.title && <h2 style={{ fontSize: 28, fontWeight: 700, color: '#F4F4F5', marginBottom: 8, textAlign: 'center', fontFamily: 'Playfair Display, serif' }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#A1A1AA', marginBottom: 24, textAlign: 'center' }}>{data.subtitle}</p>}
          
          {/* Mock slideshow preview */}
          <div style={{
            display: 'flex',
            gap: 16,
            background: '#131316',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(245,211,147,0.2)',
            minHeight: 300,
          }}>
            {/* Image side (60%) */}
            <div style={{
              flex: '0 0 60%',
              background: 'linear-gradient(135deg, rgba(245,211,147,0.3), rgba(239,182,121,0.3))',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className="ri-restaurant-2-line" style={{ fontSize: 64, color: '#F5D393', opacity: 0.5 }} />
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
              }}>
                {/* Mock dots */}
                {Array.from({ length: Math.min(data.limit || 6, 6) }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: idx === 0 ? '#F5D393' : 'rgba(255,255,255,0.3)',
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Content side (40%) */}
            <div style={{
              flex: 1,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6,
                background: 'rgba(245,211,147,0.2)',
                border: '1px solid rgba(245,211,147,0.4)',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 11,
                color: '#F5D393',
                marginBottom: 12,
                width: 'fit-content',
              }}>
                🔥 Popular
              </div>
              
              <h3 style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: '#F4F4F5', 
                marginBottom: 8,
                fontFamily: 'Playfair Display, serif',
              }}>
                Signature Dish Name
              </h3>
              
              <p style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.6, marginBottom: 16 }}>
                Delicious description of this amazing dish that will make your mouth water...
              </p>
              
              <div style={{ 
                fontSize: 28, 
                fontWeight: 700, 
                color: '#F5D393',
                marginBottom: 16,
                fontFamily: 'Playfair Display, serif',
              }}>
                250,000 ₫
              </div>
              
              <button style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #F5D393, #EFB679)',
                color: '#111',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                Đặt bàn ngay
              </button>
            </div>
          </div>
          
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(245,211,147,0.1)', borderRadius: 6, border: '1px solid rgba(245,211,147,0.3)' }}>
            <p style={{ fontSize: 12, color: '#F5D393', margin: 0, textAlign: 'center' }}>
              <i className="ri-information-line" style={{ marginRight: 4 }} />
              {data.showOnlyPopular !== false ? 'Showing only popular dishes' : 'Showing all available dishes'}
              {' '}(max {data.limit || 6})
              {' '}• Auto-play: {data.autoPlayInterval || 4000}ms
            </p>
          </div>
        </div>
      );

    case 'GALLERY_SLIDESHOW':
      return (
        <div style={{ background: '#0a0a0a', borderRadius: 12, padding: 24, border: '1px solid #222' }}>
          {/* Header */}
          {(data.title || data.subtitle) && (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {data.title && (
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#f5d393', marginBottom: 8 }}>
                  {data.title}
                </h2>
              )}
              {data.subtitle && (
                <p style={{ color: '#999', fontSize: 14 }}>{data.subtitle}</p>
              )}
            </div>
          )}

          {/* Mock Slideshow */}
          <div style={{
            position: 'relative',
            aspectRatio: '16/9',
            maxWidth: 800,
            margin: '0 auto',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#111',
            border: '1px solid #333',
          }}>
            {/* Mock Image */}
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a1d 0%, #0f0f10 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: 48,
            }}>
              <i className="ri-image-line" />
            </div>

            {/* Mock Caption */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 24px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              color: '#fff',
              fontSize: 14,
              textAlign: 'center',
            }}>
              Sample Gallery Image Caption
            </div>

            {/* Mock Controls */}
            {(data.showControls !== false) && (
              <>
                <div style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 20,
                }}>
                  <i className="ri-arrow-left-s-line" />
                </div>
                <div style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 20,
                }}>
                  <i className="ri-arrow-right-s-line" />
                </div>
              </>
            )}

            {/* Mock Indicators */}
            {(data.showIndicators !== false) && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 6,
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 20,
              }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: i === 0 ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === 0 ? '#f5d393' : 'rgba(255,255,255,0.4)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{
            marginTop: 16,
            padding: 10,
            background: 'rgba(245,211,147,0.1)',
            borderRadius: 6,
            fontSize: 11,
            color: '#999',
            textAlign: 'center',
          }}>
            <i className="ri-information-line" style={{ marginRight: 4 }} />
            Auto-play: {data.autoPlayInterval || 5000}ms • Limit: {data.limit || 10} images • Fetched from Gallery API
          </div>
        </div>
      );

    case 'FEATURED_BLOG_POSTS':
      return (
        <div style={{ background: '#0a0a0a', borderRadius: 8, padding: 24 }}>
          {/* Header */}
          {(data.title || data.subtitle) && (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {data.title && (
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#f5d393', marginBottom: 8 }}>
                  {data.title}
                </h2>
              )}
              {data.subtitle && (
                <p style={{ color: '#999', fontSize: 14 }}>{data.subtitle}</p>
              )}
            </div>
          )}

          {/* Mock Blog Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { title: '10 Món Ăn Đặc Sản Miền Bắc', date: '15 Oct 2025', category: 'Food' },
              { title: 'Bí Quyết Chọn Nguyên Liệu Tươi Ngon', date: '12 Oct 2025', category: 'Tips' },
              { title: 'Câu Chuyện Về Ẩm Thực Truyền Thống', date: '10 Oct 2025', category: 'Culture' },
            ].slice(0, data.limit || 3).map((post, idx) => (
              <div key={idx} style={{
                background: '#111',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid #222',
              }}>
                {/* Mock Image */}
                <div style={{
                  aspectRatio: '16/9',
                  background: 'linear-gradient(135deg, #1a1a1d 0%, #0f0f10 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#444',
                  fontSize: 32,
                }}>
                  <i className="ri-article-line" />
                </div>

                {/* Content */}
                <div style={{ padding: 16 }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: 'rgba(245,211,147,0.15)',
                    color: '#f5d393',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}>
                    {post.category}
                  </div>
                  <h3 style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: 8,
                    lineHeight: 1.4,
                  }}>
                    {post.title}
                  </h3>
                  <p style={{
                    fontSize: 11,
                    color: '#666',
                    marginBottom: 10,
                  }}>
                    <i className="ri-calendar-line" style={{ marginRight: 4 }} />
                    {post.date}
                  </p>
                  <div style={{
                    fontSize: 11,
                    color: '#f5d393',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    Đọc thêm
                    <i className="ri-arrow-right-line" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div style={{
            marginTop: 16,
            padding: 10,
            background: 'rgba(59,130,246,0.1)',
            borderRadius: 6,
            fontSize: 11,
            color: '#999',
            textAlign: 'center',
          }}>
            <i className="ri-information-line" style={{ marginRight: 4 }} />
            Showing {data.limit || 3} most recent blog posts • Fetched from Blog API
          </div>
        </div>
      );

    case 'SPECIAL_OFFERS':
      return (
        <div style={{ background: '#111', borderRadius: 8, padding: 24 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #f5d393 0%, #e8c170 100%)',
              color: '#111',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 12,
            }}>
              <i className="ri-fire-fill" />
              ƯU ĐÃI ĐẶC BIỆT
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#f5d393', marginBottom: 8 }}>
              {data.title || 'Khuyến Mãi Hấp Dẫn'}
            </h2>
            {data.subtitle && (
              <p style={{ color: '#999', fontSize: 14 }}>{data.subtitle}</p>
            )}
          </div>

          {/* Mock Offer Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { title: 'Giảm 30% Combo Gia Đình', discount: 30, desc: 'Áp dụng cho đơn hàng từ 4 người', timeLeft: 'Còn 3 ngày' },
              { title: 'Tặng Món Tráng Miệng', discount: null, desc: 'Miễn phí dessert khi đặt bàn online', timeLeft: 'Còn 5 giờ' },
            ].map((offer, idx) => (
              <div key={idx} style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #1a1a1d 0%, #131316 100%)',
                borderRadius: 12,
                border: '2px solid #f5d393',
                padding: 18,
              }}>
                {offer.discount && (
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: '#dc2626',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 700,
                  }}>
                    -{offer.discount}%
                  </div>
                )}
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f5d393', marginBottom: 6 }}>
                  {offer.title}
                </h3>
                <p style={{ color: '#ccc', fontSize: 12, marginBottom: 10, lineHeight: 1.4 }}>
                  {offer.desc}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  color: '#dc2626',
                  fontWeight: 600,
                  marginBottom: 10,
                }}>
                  <i className="ri-time-line" />
                  {offer.timeLeft}
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #f5d393 0%, #e8c170 100%)',
                  color: '#111',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  Đặt bàn ngay
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16,
            padding: 10,
            background: 'rgba(245,211,147,0.1)',
            borderRadius: 8,
            fontSize: 11,
            color: '#999',
            textAlign: 'center',
          }}>
            <i className="ri-information-line" style={{ marginRight: 4 }} />
            Offers are fetched automatically from API. These are preview examples.
          </div>
        </div>
      );

    case 'STATS':
      return (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
          {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>{data.title}</h2>}
          {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>{data.subtitle}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            {(data.stats || []).map((stat: any) => (
              <div key={stat._id || stat.label} style={{ textAlign: 'center', padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #ddd' }}>
                <i className={stat.icon} style={{ fontSize: 32, color: '#f5d393', marginBottom: 8, display: 'block' }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 }}>
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <i className="ri-eye-off-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          Preview not available for this section type
        </div>
      );
  }
}

function renderFormFields(
  kind: SectionKind,
  data: Record<string, any>,
  updateField: (path: string, value: any) => void,
  addArrayItem: (path: string, item: any) => void,
  removeArrayItem: (path: string, index: number) => void,
  onImagePick: (field: string) => void
) {
  switch (kind) {
    case 'HERO':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: tokens.radius.md,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-information-line" style={{ fontSize: 20, color: 'rgb(96, 165, 250)', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
                Hero Section Tips
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Upload any image size - it will be automatically optimized. Use high-quality photos for best results.
              </p>
            </div>
          </div>

          {/* Title Field */}
          <div>
            <Input 
              label="Title" 
              value={data.title || ''} 
              onChange={(v) => updateField('title', v)} 
              required 
              fullWidth 
            />
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: '4px 0 0', fontStyle: 'italic' }}>
              Main heading displayed on your banner
            </p>
          </div>

          {/* Subtitle Field */}
          <div>
            <TextArea 
              label="Subtitle" 
              value={data.subtitle || ''} 
              onChange={(v) => updateField('subtitle', v)} 
              fullWidth 
            />
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: '4px 0 0', fontStyle: 'italic' }}>
              Supporting text below the title
            </p>
          </div>
          
          {/* Image Upload Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            padding: 16,
          }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 8,
                color: tokens.color.text, 
                fontSize: 14, 
                fontWeight: 600,
                marginBottom: 4,
              }}>
                <i className="ri-image-line" style={{ fontSize: 18 }} />
                Background Image
              </label>
              <p style={{ color: tokens.color.muted, fontSize: 12, margin: 0 }}>
                Recommended: 1920x1080px • Automatically resized and compressed
              </p>
            </div>
            <ImageDropzone
              value={data.imageUrl}
              onChange={(url) => updateField('imageUrl', url)}
              onRemove={() => updateField('imageUrl', '')}
              height={180}
            />
          </div>

          {/* CTA Section */}
          <div style={{
            background: 'rgba(245, 211, 147, 0.05)',
            border: '1px solid rgba(245, 211, 147, 0.2)',
            borderRadius: tokens.radius.md,
            padding: 16,
          }}>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-cursor-line" style={{ fontSize: 18, color: tokens.color.primary }} />
              <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
                Call-to-Action Button
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input 
                label="Button Text" 
                value={data.ctaText || ''} 
                onChange={(v) => updateField('ctaText', v)} 
                placeholder="Book Now" 
                fullWidth 
              />
              <Input 
                label="Button Link" 
                value={data.ctaLink || ''} 
                onChange={(v) => updateField('ctaLink', v)} 
                placeholder="/reservations" 
                fullWidth 
              />
            </div>
          </div>
        </div>
      );

    case 'HERO_SIMPLE':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            borderRadius: tokens.radius.md,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-layout-top-line" style={{ fontSize: 20, color: '#fb923c', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
                Simple Hero Section
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Lightweight hero for secondary pages. Perfect for Contact, Menu, About, Gallery, Blog pages.
              </p>
            </div>
          </div>

          <Input 
            label="Title" 
            value={data.title || ''} 
            onChange={(v) => updateField('title', v)} 
            required 
            fullWidth 
            placeholder="Liên Hệ"
          />

          <Input 
            label="Subtitle (Badge)" 
            value={data.subtitle || ''} 
            onChange={(v) => updateField('subtitle', v)} 
            fullWidth 
            placeholder="Chúng tôi luôn sẵn sàng phục vụ"
          />

          <TextArea 
            label="Description" 
            value={data.description || ''} 
            onChange={(v) => updateField('description', v)} 
            fullWidth 
            placeholder="Hãy liên hệ với chúng tôi để đặt bàn hoặc biết thêm thông tin"
          />

          {/* Background Image */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            padding: 16,
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 8,
              color: tokens.color.text, 
              fontSize: 14, 
              fontWeight: 600,
              marginBottom: 8,
            }}>
              <i className="ri-image-line" style={{ fontSize: 18 }} />
              Background Image (Optional)
            </label>
            <ImageDropzone
              value={data.backgroundImage}
              onChange={(url) => updateField('backgroundImage', url)}
              onRemove={() => updateField('backgroundImage', '')}
              height={150}
            />
          </div>

          {/* Background Overlay */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
              Background Overlay (0-100)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={data.backgroundOverlay || 60}
              onChange={(e) => updateField('backgroundOverlay', parseInt(e.target.value))}
              style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: `linear-gradient(to right, transparent, rgba(0,0,0,${(data.backgroundOverlay || 60) / 100}))`,
                cursor: 'pointer',
              }}
            />
            <p style={{ color: tokens.color.muted, fontSize: 12, marginTop: 4 }}>
              Current: {data.backgroundOverlay || 60}% (darker = more overlay)
            </p>
          </div>

          {/* Text Align */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
              Text Alignment
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {['left', 'center', 'right'].map((align) => (
                <label key={align} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="textAlign"
                    checked={(data.textAlign || 'center') === align}
                    onChange={() => updateField('textAlign', align)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, color: tokens.color.text, textTransform: 'capitalize' }}>{align}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );

    case 'CTA':
    case 'CALL_TO_ACTION':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input 
            label="Title" 
            value={data.title || ''} 
            onChange={(v) => updateField('title', v)} 
            placeholder="Ready to Get Started?"
            required 
            fullWidth 
          />
          <TextArea 
            label="Subtitle" 
            value={data.subtitle || ''} 
            onChange={(v) => updateField('subtitle', v)} 
            placeholder="Join thousands of satisfied customers today"
            fullWidth 
          />

          {/* Primary Button */}
          <div style={{
            background: 'rgba(245, 211, 147, 0.05)',
            border: '1px solid rgba(245, 211, 147, 0.2)',
            borderRadius: tokens.radius.md,
            padding: 16,
          }}>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-arrow-right-circle-fill" style={{ fontSize: 18, color: tokens.color.primary }} />
              <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
                Primary Button
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input 
                label="Button Text" 
                value={data.primaryButton?.text || ''} 
                onChange={(v) => updateField('primaryButton.text', v)} 
                placeholder="Get Started" 
                fullWidth 
              />
              <Input 
                label="Button Link" 
                value={data.primaryButton?.link || ''} 
                onChange={(v) => updateField('primaryButton.link', v)} 
                placeholder="/signup" 
                fullWidth 
              />
            </div>
          </div>

          {/* Secondary Button */}
          <div style={{
            background: 'rgba(100, 116, 139, 0.05)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
            borderRadius: tokens.radius.md,
            padding: 16,
          }}>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-arrow-right-line" style={{ fontSize: 18, color: tokens.color.muted }} />
              <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
                Secondary Button (Optional)
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input 
                label="Button Text" 
                value={data.secondaryButton?.text || ''} 
                onChange={(v) => updateField('secondaryButton.text', v)} 
                placeholder="Learn More" 
                fullWidth 
              />
              <Input 
                label="Button Link" 
                value={data.secondaryButton?.link || ''} 
                onChange={(v) => updateField('secondaryButton.link', v)} 
                placeholder="/about" 
                fullWidth 
              />
            </div>
          </div>

          {/* Background Image (Optional) */}
          <div style={{ marginTop: 8 }}>
            <ImagePicker
              label="Background Image (Optional)"
              value={data.backgroundImage || ''}
              onChange={(url) => updateField('backgroundImage', url)}
              onPick={() => onImagePick('backgroundImage')}
              onRemove={() => updateField('backgroundImage', '')}
              height={180}
            />
          </div>
        </div>
      );

    case 'GALLERY':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: tokens.radius.md,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-gallery-line" style={{ fontSize: 20, color: '#06B6D4', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
                📸 Gallery Grid (Dynamic)
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Displays images from Gallery API with lightbox viewer. Images are managed in Media page.
              </p>
            </div>
          </div>

          <Input 
            label="Title" 
            value={data.title || ''} 
            onChange={(v) => updateField('title', v)} 
            fullWidth 
            placeholder="e.g. Our Gallery"
          />
          <TextArea 
            label="Subtitle" 
            value={data.subtitle || ''} 
            onChange={(v) => updateField('subtitle', v)} 
            fullWidth 
            placeholder="Optional subtitle"
          />
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
              Grid Columns
            </label>
            <select
              value={data.columns || 3}
              onChange={(e) => updateField('columns', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: 14,
              }}
            >
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
            </select>
          </div>

          <Input
            label="Max Images to Display"
            type="number"
            value={data.limit || 12}
            onChange={(v) => updateField('limit', parseInt(v) || 12)}
            placeholder="12"
            fullWidth
          />

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.showOnlyFeatured || false}
                onChange={(e) => updateField('showOnlyFeatured', e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ color: tokens.color.text, fontSize: 14 }}>
                Show only featured images
              </span>
            </label>
            <p style={{ color: tokens.color.muted, fontSize: 13, marginTop: 6, marginLeft: 26 }}>
              When enabled, only images marked as "Featured" in Media page will display
            </p>
          </div>

          <Input
            label="Filter by Tag (optional)"
            value={data.filterByTag || ''}
            onChange={(v) => updateField('filterByTag', v)}
            placeholder="e.g. interior, food, events"
            fullWidth
          />

          <div style={{
            padding: 16,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: tokens.radius.md,
          }}>
            <p style={{ color: tokens.color.text, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              <strong>💡 Tip:</strong> Gallery images are managed in <strong>Media</strong> page. 
              Upload images there and mark them for gallery display. This section will fetch and display them automatically.
            </p>
          </div>
        </div>
      );

    case 'FEATURED_MENU':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: tokens.radius.md,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-restaurant-2-line" style={{ fontSize: 20, color: '#EAB308', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
                🍽️ Featured Menu Slideshow (Dynamic)
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Auto-playing slideshow of popular dishes from Menu API. Menu items are managed in Menu page.
              </p>
            </div>
          </div>

          <Input 
            label="Title" 
            value={data.title || ''} 
            onChange={(v) => updateField('title', v)} 
            fullWidth 
            placeholder="e.g. Signature Dishes"
          />
          <TextArea 
            label="Subtitle" 
            value={data.subtitle || ''} 
            onChange={(v) => updateField('subtitle', v)} 
            fullWidth 
            placeholder="Optional subtitle"
          />

          <Input
            label="Max Dishes to Display"
            type="number"
            value={data.limit || 6}
            onChange={(v) => updateField('limit', parseInt(v) || 6)}
            placeholder="6"
            fullWidth
          />

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.showOnlyPopular !== false}
                onChange={(e) => updateField('showOnlyPopular', e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ color: tokens.color.text, fontSize: 14 }}>
                Show only popular dishes
              </span>
            </label>
            <p style={{ color: tokens.color.muted, fontSize: 13, marginTop: 6, marginLeft: 26 }}>
              When enabled, only dishes marked as "Popular" in Menu page will display
            </p>
          </div>

          <Input
            label="Auto-play Interval (ms)"
            type="number"
            value={data.autoPlayInterval || 4000}
            onChange={(v) => updateField('autoPlayInterval', parseInt(v) || 4000)}
            placeholder="4000"
            fullWidth
          />
          <p style={{ color: tokens.color.muted, fontSize: 13, marginTop: -12 }}>
            Time between slide transitions (default: 4000ms = 4 seconds)
          </p>

          {/* CTA Button Configuration */}
          <div style={{
            background: 'rgba(245, 211, 147, 0.05)',
            border: '1px solid rgba(245, 211, 147, 0.2)',
            borderRadius: tokens.radius.md,
            padding: 16,
          }}>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-cursor-line" style={{ fontSize: 18, color: tokens.color.primary }} />
              <label style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
                Call-to-Action Button
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input 
                label="Button Text" 
                value={data.ctaText || ''} 
                onChange={(v) => updateField('ctaText', v)} 
                placeholder="Đặt bàn ngay" 
                fullWidth 
              />
              <Input 
                label="Button Link" 
                value={data.ctaLink || ''} 
                onChange={(v) => updateField('ctaLink', v)} 
                placeholder="#reservation" 
                fullWidth 
              />
            </div>
          </div>

          <div style={{
            padding: 16,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: tokens.radius.md,
          }}>
            <p style={{ color: tokens.color.text, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              <strong>💡 Tip:</strong> Menu items are managed in <strong>Menu</strong> page. 
              Add dishes there and mark them as "Popular" and "Available" to display in this slideshow.
            </p>
          </div>
        </div>
      );

    case 'RICH_TEXT':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: tokens.radius.md,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-lightbulb-flash-line" style={{ fontSize: 20, color: '#a78bfa', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
                Rich Text Editor
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Use markdown for formatting. Preview updates in real-time. Perfect for blog posts, about pages, and custom content.
              </p>
            </div>
          </div>

          <RichTextEditor 
            label="Content" 
            value={data.content || data.html || ''} 
            onChange={(v) => updateField('content', v)} 
            rows={15}
            placeholder="# Your Title Here&#10;&#10;Write your content using markdown...&#10;&#10;## Features:&#10;- **Bold text**&#10;- _Italic text_&#10;- `code`&#10;- [Links](https://example.com)"
          />
        </div>
      );

    case 'BANNER':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Text" value={data.text || ''} onChange={(v) => updateField('text', v)} required fullWidth />
          <Input label="Link (optional)" value={data.href || ''} onChange={(v) => updateField('href', v)} fullWidth />
        </div>
      );

    case 'CONTACT_INFO':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section Title */}
          <Input label="Section Title" value={data.title || ''} onChange={(v) => updateField('title', v)} placeholder="Liên Hệ & Địa Chỉ" fullWidth />

          {/* Basic Contact Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Input label="Phone" value={data.phone || ''} onChange={(v) => updateField('phone', v)} placeholder="+84 123 456 789" fullWidth />
            <Input label="Email" value={data.email || ''} onChange={(v) => updateField('email', v)} placeholder="contact@restaurant.com" fullWidth />
          </div>
          <Input label="Address" value={data.address || ''} onChange={(v) => updateField('address', v)} placeholder="123 Main St, City" fullWidth />

          {/* Opening Hours */}
          <div style={{ 
            background: 'rgba(245, 211, 147, 0.1)', 
            border: '1px solid rgba(245, 211, 147, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontWeight: 600, fontSize: 14, color: tokens.color.text }}>
                <i className="ri-time-line" style={{ marginRight: 8 }} />
                Giờ mở cửa
              </label>
              <button
                type="button"
                onClick={() => addArrayItem('hours', { day: 'Thứ 2 - Thứ 6', time: '10:00 - 22:00' })}
                style={{
                  background: tokens.color.primary,
                  color: '#111',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: tokens.radius.sm,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <i className="ri-add-line" /> Thêm
              </button>
            </div>
            {(data.hours || []).map((hour: any, idx: number) => (
              <div key={hour._id || idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input
                  value={hour.day || ''}
                  onChange={(v) => updateField(`hours.${idx}.day`, v)}
                  placeholder="Thứ 2 - Thứ 6"
                  fullWidth
                />
                <Input
                  value={hour.time || ''}
                  onChange={(v) => updateField(`hours.${idx}.time`, v)}
                  placeholder="10:00 - 22:00"
                  fullWidth
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('hours', idx)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0 12px',
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                  }}
                >
                  <i className="ri-delete-bin-line" />
                </button>
              </div>
            ))}
            {(!data.hours || data.hours.length === 0) && (
              <div style={{ color: tokens.color.muted, fontSize: 13, textAlign: 'center', padding: 16 }}>
                Chưa có giờ mở cửa. Nhấn "Thêm" để thêm.
              </div>
            )}
          </div>

          {/* Map Embed URL */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: tokens.color.text, marginBottom: 8 }}>
              <i className="ri-map-2-line" style={{ marginRight: 8 }} />
              Google Maps Embed URL
            </label>
            <Input 
              value={data.mapEmbedUrl || ''} 
              onChange={(v) => updateField('mapEmbedUrl', v)} 
              placeholder="https://www.google.com/maps/embed?pb=..." 
              fullWidth 
            />
            <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 4 }}>
              💡 Hướng dẫn: Vào Google Maps → Share → Embed a map → Copy HTML → Lấy URL từ src="..."
            </div>
          </div>

          {/* Social Links */}
          <div style={{ 
            background: 'rgba(245, 211, 147, 0.1)', 
            border: '1px solid rgba(245, 211, 147, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontWeight: 600, fontSize: 14, color: tokens.color.text }}>
                <i className="ri-share-line" style={{ marginRight: 8 }} />
                Theo dõi chúng tôi
              </label>
              <button
                type="button"
                onClick={() => addArrayItem('socialLinks', { platform: 'facebook', url: 'https://facebook.com' })}
                style={{
                  background: tokens.color.primary,
                  color: '#111',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: tokens.radius.sm,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <i className="ri-add-line" /> Thêm
              </button>
            </div>
            {(data.socialLinks || []).map((link: any, idx: number) => (
              <div key={link._id || idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select
                  value={link.platform || 'facebook'}
                  onChange={(e) => updateField(`socialLinks.${idx}.platform`, e.target.value)}
                  style={{
                    background: tokens.color.surface,
                    color: tokens.color.text,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    padding: '8px 12px',
                    fontSize: 14,
                    minWidth: 140,
                  }}
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="zalo">Zalo</option>
                  <option value="messenger">Messenger</option>
                </select>
                <Input
                  value={link.url || ''}
                  onChange={(v) => updateField(`socialLinks.${idx}.url`, v)}
                  placeholder="https://..."
                  fullWidth
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('socialLinks', idx)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0 12px',
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                  }}
                >
                  <i className="ri-delete-bin-line" />
                </button>
              </div>
            ))}
            {(!data.socialLinks || data.socialLinks.length === 0) && (
              <div style={{ color: tokens.color.muted, fontSize: 13, textAlign: 'center', padding: 16 }}>
                Chưa có mạng xã hội. Nhấn "Thêm" để thêm.
              </div>
            )}
          </div>
        </div>
      );

    case 'TESTIMONIALS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: tokens.radius.md,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-chat-quote-line" style={{ fontSize: 20, color: '#F59E0B', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
                Testimonials Section
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Display customer reviews and feedback to build trust.
              </p>
            </div>
          </div>

          <Input label="Section Title" value={data.title || ''} onChange={(v) => updateField('title', v)} placeholder="What Our Customers Say" fullWidth />
          <TextArea label="Subtitle" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} placeholder="Real reviews from real people" fullWidth />

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            padding: 20,
          }}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ color: tokens.color.text, fontSize: 15, fontWeight: 600 }}>
                <i className="ri-message-3-line" style={{ marginRight: 8 }} />
                Testimonials ({data.testimonials?.length || 0})
              </label>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ display: 'inline-block' }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    addArrayItem('testimonials', { name: '', role: '', content: '', rating: 5, avatar: '' });
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#111',
                    border: 'none',
                    borderRadius: tokens.radius.md,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <i className="ri-add-line" />
                  Add Testimonial
                </button>
              </motion.div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(data.testimonials || []).map((testimonial: any, index: number) => (
                <motion.div
                  key={testimonial._id || `testimonial-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: 16,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ color: tokens.color.text, fontWeight: 600, fontSize: 14 }}>
                      Testimonial #{index + 1}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeArrayItem('testimonials', index);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: tokens.radius.sm,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <i className="ri-delete-bin-line" />
                      Remove
                    </motion.button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input
                        label="Name"
                        value={testimonial.name || ''}
                        onChange={(v) => updateField(`testimonials.${index}.name`, v)}
                        placeholder="John Doe"
                        fullWidth
                      />
                      <Input
                        label="Role/Title"
                        value={testimonial.role || ''}
                        onChange={(v) => updateField(`testimonials.${index}.role`, v)}
                        placeholder="Food Critic"
                        fullWidth
                      />
                    </div>
                    <TextArea
                      label="Review"
                      value={testimonial.content || ''}
                      onChange={(v) => updateField(`testimonials.${index}.content`, v)}
                      placeholder="Amazing experience! The food was exceptional..."
                      rows={3}
                      fullWidth
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                      <Input
                        label="Rating"
                        type="number"
                        value={testimonial.rating || 5}
                        onChange={(v) => updateField(`testimonials.${index}.rating`, parseInt(v) || 5)}
                        placeholder="5"
                        fullWidth
                      />
                      <Input
                        label="Avatar URL (optional)"
                        value={testimonial.avatar || ''}
                        onChange={(v) => updateField(`testimonials.${index}.avatar`, v)}
                        placeholder="https://..."
                        fullWidth
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'RESERVATION_FORM':
      // Initialize default field configurations if not present
      const defaultFields = {
        name: { enabled: true, label: 'Họ tên', placeholder: '', required: true },
        email: { enabled: true, label: 'Email', placeholder: '', required: true },
        phone: { enabled: true, label: 'Số điện thoại', placeholder: '', required: true },
        date: { enabled: true, label: 'Ngày', placeholder: '', required: true },
        time: { enabled: true, label: 'Giờ', placeholder: 'Chọn giờ', required: true },
        partySize: { enabled: true, label: 'Số người', placeholder: '', required: true },
        specialRequest: { enabled: true, label: 'Yêu cầu đặc biệt', placeholder: 'Vị trí ưa thích, dị ứng thực phẩm, dịp đặc biệt...', required: false },
      };

      // Merge default fields with custom fields to ensure all fields always exist
      const fields = {
        ...defaultFields,
        ...Object.fromEntries(
          Object.entries(data.fields || {}).map(([key, val]) => [
            key,
            { ...defaultFields[key as keyof typeof defaultFields], ...(typeof val === 'object' && val !== null ? val : {}) }
          ])
        )
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Info Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.15) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: tokens.radius.md,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-calendar-check-line" style={{ fontSize: 20, color: '#06B6D4', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
                📅 Reservation Form Section
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Customize your booking form fields, labels, and validation rules.
              </p>
            </div>
          </div>

          {/* Title & Description */}
          <div style={{ display: 'grid', gap: 16 }}>
          <Input 
            label="Form Title" 
            value={data.title || ''} 
            onChange={(v) => updateField('title', v)} 
              placeholder="Đặt Bàn Ngay"
            fullWidth 
          />
          
          <TextArea 
            label="Description" 
            value={data.description || ''} 
            onChange={(v) => updateField('description', v)} 
              placeholder="Vui lòng điền thông tin bên dưới. Chúng tôi sẽ xác nhận đặt bàn trong vòng 2 giờ."
              rows={2}
            fullWidth 
          />

            <Input 
              label="Submit Button Text" 
              value={data.submitButtonText || ''} 
              onChange={(v) => updateField('submitButtonText', v)} 
              placeholder="Xác nhận đặt bàn"
              fullWidth 
            />
          </div>

          {/* Form Settings */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            padding: 16,
          }}>
            <label style={{ color: tokens.color.text, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 12 }}>
              <i className="ri-settings-3-line" style={{ marginRight: 8 }} />
              General Settings
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Max Party Size"
                type="number"
                value={data.maxPartySize || 20}
                onChange={(v) => updateField('maxPartySize', parseInt(v) || 20)}
                placeholder="20"
                fullWidth
              />
              <Input
                label="Notification Email (optional)"
                value={data.notificationEmail || ''}
                onChange={(v) => updateField('notificationEmail', v)}
                placeholder="reservations@restaurant.com"
                fullWidth
              />
            </div>
          </div>

          {/* Time Slots */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>
                <i className="ri-time-line" style={{ marginRight: 8, color: '#06B6D4' }} />
                Available Time Slots
              </label>
              <Button
                variant="secondary"
                size="small"
                onClick={() => addArrayItem('timeSlots', '18:00')}
              >
                <i className="ri-add-line" />
                Add
              </Button>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
              gap: 10,
              marginBottom: 10,
            }}>
              {(data.timeSlots || []).map((slot: string, index: number) => (
                <div key={index} style={{
                  background: tokens.color.surface,
                  borderRadius: tokens.radius.md,
                  padding: 10,
                  border: `1px solid ${tokens.color.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <input
                    type="time"
                    value={slot || ''}
                    onChange={(e) => updateField(`timeSlots.${index}`, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
            fontSize: 13,
                      color: tokens.color.text,
                      background: tokens.color.background,
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: tokens.radius.sm,
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={() => removeArrayItem('timeSlots', index)}
                    style={{
                      padding: 4,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: tokens.color.error,
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: tokens.radius.sm,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>
              ))}
            </div>

            {(!data.timeSlots || data.timeSlots.length === 0) && (
              <div style={{
                padding: 12,
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: tokens.radius.md,
                color: tokens.color.muted,
                fontSize: 12,
                textAlign: 'center',
              }}>
                <i className="ri-error-warning-line" style={{ marginRight: 6, color: tokens.color.error }} />
                No time slots. Click "Add" to configure.
              </div>
            )}
          </div>

          {/* Form Fields Configuration */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, display: 'block', marginBottom: 12 }}>
              <i className="ri-list-check-3" style={{ marginRight: 8, color: '#06B6D4' }} />
              Form Fields Configuration
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(fields).map(([fieldKey, fieldConfig]: [string, any]) => {
                const fieldIcons: Record<string, string> = {
                  name: 'ri-user-line',
                  email: 'ri-mail-line',
                  phone: 'ri-phone-line',
                  date: 'ri-calendar-line',
                  time: 'ri-time-line',
                  partySize: 'ri-group-line',
                  specialRequest: 'ri-message-3-line',
                };

                return (
                  <div key={fieldKey} style={{
                    background: tokens.color.surface,
                    borderRadius: tokens.radius.md,
                    padding: 16,
                    border: `1px solid ${tokens.color.border}`,
                  }}>
                    {/* Field Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className={fieldIcons[fieldKey]} style={{ fontSize: 18, color: '#06B6D4' }} />
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
                          {fieldKey === 'name' && 'Họ tên'}
                          {fieldKey === 'email' && 'Email'}
                          {fieldKey === 'phone' && 'Số điện thoại'}
                          {fieldKey === 'date' && 'Ngày'}
                          {fieldKey === 'time' && 'Giờ'}
                          {fieldKey === 'partySize' && 'Số người'}
                          {fieldKey === 'specialRequest' && 'Yêu cầu đặc biệt'}
                        </h4>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={fieldConfig.enabled !== false}
                          onChange={(e) => updateField(`fields.${fieldKey}.enabled`, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 13, color: tokens.color.muted }}>Enabled</span>
                      </label>
                    </div>

                    {/* Field Settings */}
                    {fieldConfig.enabled !== false && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                        <Input
                          label="Label"
                          value={fieldConfig.label || ''}
                          onChange={(v) => updateField(`fields.${fieldKey}.label`, v)}
                          placeholder="Field label"
                          fullWidth
                        />
                        <Input
                          label="Placeholder"
                          value={fieldConfig.placeholder || ''}
                          onChange={(v) => updateField(`fields.${fieldKey}.placeholder`, v)}
                          placeholder="Placeholder text"
                          fullWidth
                        />
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          cursor: 'pointer',
                          padding: '8px 12px',
                          background: fieldConfig.required ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                          border: `1px solid ${fieldConfig.required ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                          borderRadius: tokens.radius.sm,
                          whiteSpace: 'nowrap',
                        }}>
                          <input
                            type="checkbox"
                            checked={fieldConfig.required !== false}
                            onChange={(e) => updateField(`fields.${fieldKey}.required`, e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: 12, fontWeight: 500, color: tokens.color.text }}>
                            Required
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Footer */}
          <div style={{
            padding: 12,
            background: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: tokens.radius.md,
            fontSize: 12,
            color: tokens.color.muted,
            lineHeight: 1.6,
          }}>
            <i className="ri-information-line" style={{ color: '#06B6D4', marginRight: 6 }} />
            Customize each field's label, placeholder, and validation. Disable fields you don't need.
          </div>
        </div>
      );

    case 'GALLERY_SLIDESHOW':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: tokens.radius.md,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-slideshow-line" style={{ fontSize: 20, color: '#06B6D4', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
                Gallery Slideshow
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Displays featured images from your Gallery. Upload images in Gallery → mark them as featured.
              </p>
            </div>
          </div>

          <Input 
            label="Title (optional)" 
            value={data.title || ''} 
            onChange={(v) => updateField('title', v)} 
            fullWidth 
          />
          <TextArea 
            label="Subtitle (optional)" 
            value={data.subtitle || ''} 
            onChange={(v) => updateField('subtitle', v)} 
            fullWidth 
          />
          <Input 
            label="Auto-play Interval (ms)" 
            type="number"
            value={data.autoPlayInterval || 5000} 
            onChange={(v) => updateField('autoPlayInterval', parseInt(v) || 5000)} 
            fullWidth 
          />
          <Input 
            label="Max Images to Show" 
            type="number"
            value={data.limit || 10} 
            onChange={(v) => updateField('limit', parseInt(v) || 10)} 
            fullWidth 
          />
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={data.showControls !== false}
                onChange={(e) => updateField('showControls', e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ color: tokens.color.text, fontSize: 14 }}>Show Navigation Controls</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={data.showIndicators !== false}
                onChange={(e) => updateField('showIndicators', e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ color: tokens.color.text, fontSize: 14 }}>Show Indicators</span>
            </label>
          </div>
        </div>
      );

    case 'FEATURED_BLOG_POSTS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: tokens.radius.md,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-article-line" style={{ fontSize: 20, color: '#8B5CF6', marginTop: 2 }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, margin: 0, fontWeight: 500, marginBottom: 4 }}>
                Featured Blog Posts
              </p>
              <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Shows blog posts marked as "Featured". Go to Blog Posts → Edit → Check "Featured on homepage".
              </p>
            </div>
          </div>

          <Input 
            label="Title (optional)" 
            value={data.title || ''} 
            onChange={(v) => updateField('title', v)} 
            fullWidth 
          />
          <TextArea 
            label="Subtitle (optional)" 
            value={data.subtitle || ''} 
            onChange={(v) => updateField('subtitle', v)} 
            fullWidth 
          />
          <Input 
            label="Max Posts to Show" 
            type="number"
            value={data.limit || 3} 
            onChange={(v) => updateField('limit', Math.min(parseInt(v) || 3, 6))} 
            fullWidth 
          />
          <div style={{
            padding: 12,
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: tokens.radius.md,
            fontSize: 13,
            color: tokens.color.muted,
            lineHeight: 1.6,
          }}>
            <i className="ri-information-line" style={{ color: '#8B5CF6', marginRight: 6 }} />
            Recommended: 3 posts for best layout. Maximum: 6 posts.
          </div>
        </div>
      );

    case 'OPENING_HOURS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-time-line" style={{ fontSize: 24, color: '#06B6D4', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                📅 Giờ Mở Cửa Section
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Hiển thị lịch mở cửa của nhà hàng. Có thể đánh dấu các ngày đặc biệt.
              </p>
            </div>
          </div>

          <Input label="Title" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Subtitle" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text }}>
                Schedule
              </label>
              <Button
                size="small"
                onClick={() => addArrayItem('schedule', { day: 'Thứ 2 - Thứ 6', hours: '10:00 - 22:00', special: false })}
                icon="ri-add-line"
              >
                Add Time Slot
              </Button>
            </div>
            {(data.schedule || []).map((item: any, index: number) => (
              <div key={item._id || index} style={{ 
                display: 'flex', 
                gap: 12, 
                marginBottom: 12, 
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`
              }}>
                <Input
                  label="Day"
                  value={item.day || ''}
                  onChange={(v) => updateField(`schedule.${index}.day`, v)}
                  placeholder="e.g. Thứ 2 - Thứ 6"
                  fullWidth
                />
                <Input
                  label="Hours"
                  value={item.hours || ''}
                  onChange={(v) => updateField(`schedule.${index}.hours`, v)}
                  placeholder="e.g. 10:00 - 22:00"
                  fullWidth
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: tokens.color.muted }}>
                    <input
                      type="checkbox"
                      checked={item.special || false}
                      onChange={(e) => updateField(`schedule.${index}.special`, e.target.checked)}
                    />
                    Special
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeArrayItem('schedule', index)}
                    style={{
                      padding: 8,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid rgba(239, 68, 68, 0.3)`,
                      borderRadius: tokens.radius.sm,
                      color: '#EF4444',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="ri-delete-bin-line" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>

          <TextArea label="Note (optional)" value={data.note || ''} onChange={(v) => updateField('note', v)} fullWidth placeholder="e.g. Đặt bàn trước để đảm bảo chỗ ngồi" />
        </div>
      );

    case 'SOCIAL_MEDIA':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-share-fill" style={{ fontSize: 24, color: '#8B5CF6', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                🔗 Social Media Section
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Hiển thị các link mạng xã hội với icons đẹp mắt.
              </p>
            </div>
          </div>

          <Input label="Title" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Subtitle" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: tokens.color.text }}>
              Layout
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {['horizontal', 'vertical', 'grid'].map((layout) => (
                <label key={layout} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="layout"
                    checked={data.layout === layout}
                    onChange={() => updateField('layout', layout)}
                  />
                  <span style={{ fontSize: 13, color: tokens.color.text, textTransform: 'capitalize' }}>{layout}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text }}>
                Social Links
              </label>
              <Button
                size="small"
                onClick={() => addArrayItem('links', { platform: 'facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' })}
                icon="ri-add-line"
              >
                Add Link
              </Button>
            </div>
            {(data.links || []).map((link: any, index: number) => (
              <div key={link._id || index} style={{ 
                display: 'flex', 
                gap: 12, 
                marginBottom: 12, 
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`
              }}>
                <Input
                  label="Platform"
                  value={link.platform || ''}
                  onChange={(v) => updateField(`links.${index}.platform`, v)}
                  placeholder="facebook"
                  fullWidth
                />
                <Input
                  label="URL"
                  value={link.url || ''}
                  onChange={(v) => updateField(`links.${index}.url`, v)}
                  placeholder="https://..."
                  fullWidth
                />
                <Input
                  label="Icon (RemixIcon)"
                  value={link.icon || ''}
                  onChange={(v) => updateField(`links.${index}.icon`, v)}
                  placeholder="ri-facebook-fill"
                  fullWidth
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeArrayItem('links', index)}
                  style={{
                    padding: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid rgba(239, 68, 68, 0.3)`,
                    borderRadius: tokens.radius.sm,
                    color: '#EF4444',
                    cursor: 'pointer',
                    alignSelf: 'flex-end',
                  }}
                >
                  <i className="ri-delete-bin-line" />
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      );

    case 'FEATURES':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-star-fill" style={{ fontSize: 24, color: '#F59E0B', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                ⭐ Features/Values Section
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Hiển thị các tính năng nổi bật hoặc giá trị cốt lõi của doanh nghiệp.
              </p>
            </div>
          </div>

          <Input label="Title" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Subtitle" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: tokens.color.text }}>
              Layout
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {['grid', 'list'].map((layout) => (
                <label key={layout} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="features-layout"
                    checked={data.layout === layout}
                    onChange={() => updateField('layout', layout)}
                  />
                  <span style={{ fontSize: 13, color: tokens.color.text, textTransform: 'capitalize' }}>{layout}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text }}>
                Features
              </label>
              <Button
                size="small"
                onClick={() => addArrayItem('features', { icon: 'ri-checkbox-circle-line', title: 'Feature', description: 'Description' })}
                icon="ri-add-line"
              >
                Add Feature
              </Button>
            </div>
            {(data.features || []).map((feature: any, index: number) => (
              <div key={feature._id || index} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 12, 
                marginBottom: 16, 
                padding: 16,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Input
                    label="Icon (RemixIcon)"
                    value={feature.icon || ''}
                    onChange={(v) => updateField(`features.${index}.icon`, v)}
                    placeholder="ri-checkbox-circle-line"
                    fullWidth
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeArrayItem('features', index)}
                    style={{
                      padding: 8,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid rgba(239, 68, 68, 0.3)`,
                      borderRadius: tokens.radius.sm,
                      color: '#EF4444',
                      cursor: 'pointer',
                      marginTop: 20,
                    }}
                  >
                    <i className="ri-delete-bin-line" />
                  </motion.button>
                </div>
                <Input
                  label="Title"
                  value={feature.title || ''}
                  onChange={(v) => updateField(`features.${index}.title`, v)}
                  placeholder="Feature title"
                  fullWidth
                />
                <TextArea
                  label="Description"
                  value={feature.description || ''}
                  onChange={(v) => updateField(`features.${index}.description`, v)}
                  placeholder="Feature description"
                  fullWidth
                />
              </div>
            ))}
          </div>
        </div>
      );

    case 'MISSION_VISION':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-flag-fill" style={{ fontSize: 24, color: '#10B981', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                🎯 Mission & Vision Section
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Hiển thị sứ mệnh và tầm nhìn của doanh nghiệp.
              </p>
            </div>
          </div>

          <Input label="Section Title" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Section Subtitle" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />

          {/* Mission */}
          <div style={{ 
            padding: 16,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`
          }}>
            <h4 style={{ color: tokens.color.primary, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              🎯 Mission (Sứ Mệnh)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                label="Mission Icon"
                value={data.mission?.icon || ''}
                onChange={(v) => updateField('mission.icon', v)}
                placeholder="ri-target-line"
                fullWidth
              />
              <Input
                label="Mission Title"
                value={data.mission?.title || ''}
                onChange={(v) => updateField('mission.title', v)}
                placeholder="Sứ Mệnh"
                fullWidth
              />
              <TextArea
                label="Mission Content"
                value={data.mission?.content || ''}
                onChange={(v) => updateField('mission.content', v)}
                placeholder="Describe your mission..."
                fullWidth
              />
            </div>
          </div>

          {/* Vision */}
          <div style={{ 
            padding: 16,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`
          }}>
            <h4 style={{ color: tokens.color.primary, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              👁️ Vision (Tầm Nhìn)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                label="Vision Icon"
                value={data.vision?.icon || ''}
                onChange={(v) => updateField('vision.icon', v)}
                placeholder="ri-eye-line"
                fullWidth
              />
              <Input
                label="Vision Title"
                value={data.vision?.title || ''}
                onChange={(v) => updateField('vision.title', v)}
                placeholder="Tầm Nhìn"
                fullWidth
              />
              <TextArea
                label="Vision Content"
                value={data.vision?.content || ''}
                onChange={(v) => updateField('vision.content', v)}
                placeholder="Describe your vision..."
                fullWidth
              />
            </div>
          </div>
        </div>
      );

    case 'CORE_VALUES':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.15) 100%)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-heart-3-fill" style={{ fontSize: 24, color: '#EC4899', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                💎 Core Values Section
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Hiển thị các giá trị cốt lõi, nguyên tắc hoạt động của doanh nghiệp.
              </p>
            </div>
          </div>

          <Input label="Section Title" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Section Subtitle" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />

          {/* Values List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text }}>
                Values
              </label>
              <motion.button
                type="button"
                onClick={() => addArrayItem('values', { _id: generateUniqueId(), icon: 'ri-star-line', title: 'New Value', description: 'Description...' })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 16px',
                  background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                  border: 'none',
                  borderRadius: tokens.radius.sm,
                  color: '#111',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className="ri-add-line" />
                Add Value
              </motion.button>
            </div>

            {(data.values || []).map((value: any, index: number) => (
              <div
                key={value._id || index}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  marginBottom: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.muted }}>
                    Value #{index + 1}
                  </span>
                  <motion.button
                    type="button"
                    onClick={() => removeArrayItem('values', index)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      padding: 8,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid rgba(239, 68, 68, 0.3)`,
                      borderRadius: tokens.radius.sm,
                      color: '#EF4444',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="ri-delete-bin-line" />
                  </motion.button>
                </div>
                <Input
                  label="Icon"
                  value={value.icon || ''}
                  onChange={(v) => updateField(`values.${index}.icon`, v)}
                  placeholder="ri-star-line"
                  fullWidth
                />
                <Input
                  label="Title"
                  value={value.title || ''}
                  onChange={(v) => updateField(`values.${index}.title`, v)}
                  placeholder="Value title"
                  fullWidth
                />
                <TextArea
                  label="Description"
                  value={value.description || ''}
                  onChange={(v) => updateField(`values.${index}.description`, v)}
                  placeholder="Value description"
                  fullWidth
                />
              </div>
            ))}
          </div>
        </div>
      );

    case 'FAB_ACTIONS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-customer-service-fill" style={{ fontSize: 24, color: '#8B5CF6', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                🔘 Floating Action Buttons
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Các nút floating góc dưới bên phải màn hình - Contact, Booking, Map, Chat...
              </p>
            </div>
          </div>

          <div style={{ 
            padding: 16,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`
          }}>
            <h4 style={{ color: tokens.color.primary, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              ⚙️ Main Button (Nút chính)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                label="Main Icon (RemixIcon class)"
                value={data.mainIcon || ''}
                onChange={(v) => updateField('mainIcon', v)}
                placeholder="ri-customer-service-2-fill"
                fullWidth
              />
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
                  Main Color
                </label>
                <input
                  type="color"
                  value={data.mainColor || '#F5D393'}
                  onChange={(e) => updateField('mainColor', e.target.value)}
                  style={{
                    width: '100%',
                    height: 42,
                    padding: 4,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ 
            padding: 16,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ color: tokens.color.primary, fontSize: 16, fontWeight: 600, margin: 0 }}>
                🎯 Action Buttons ({data.actions?.length || 0})
              </h4>
              <Button
                variant="primary"
                size="small"
                onClick={() => addArrayItem('actions', { icon: 'ri-phone-fill', label: 'New Action', href: '#', color: '#10b981' })}
              >
                <i className="ri-add-line" style={{ marginRight: 6 }} />
                Add Action
              </Button>
            </div>
            {data.actions?.map((action: any, index: number) => (
              <div
                key={action._id || index}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ color: tokens.color.text, fontWeight: 600 }}>Action {index + 1}</span>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => removeArrayItem('actions', index)}
                  >
                    <i className="ri-delete-bin-line" />
                  </Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <Input
                    label="Icon"
                    value={action.icon || ''}
                    onChange={(v) => updateField(`actions.${index}.icon`, v)}
                    placeholder="ri-phone-fill"
                    fullWidth
                  />
                  <Input
                    label="Label"
                    value={action.label || ''}
                    onChange={(v) => updateField(`actions.${index}.label`, v)}
                    placeholder="Gọi ngay"
                    fullWidth
                  />
                  <Input
                    label="Link/URL"
                    value={action.href || ''}
                    onChange={(v) => updateField(`actions.${index}.href`, v)}
                    placeholder="tel:+84123456789"
                    fullWidth
                  />
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
                      Color
                    </label>
                    <input
                      type="color"
                      value={action.color || '#10b981'}
                      onChange={(e) => updateField(`actions.${index}.color`, e.target.value)}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: 4,
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${tokens.color.border}`,
                        borderRadius: tokens.radius.md,
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'FOOTER_SOCIAL':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-share-fill" style={{ fontSize: 24, color: '#3B82F6', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                🔗 Footer Social Links
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Social media links hiển thị ở footer - Facebook, Instagram, YouTube...
              </p>
            </div>
          </div>

          <Input label="Section Title" value={data.title || ''} onChange={(v) => updateField('title', v)} fullWidth />
          <TextArea label="Subtitle" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} fullWidth />

          <div>
            <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 600 }}>
              Layout Style
            </label>
            <select
              value={data.layout || 'circular'}
              onChange={(e) => updateField('layout', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: 14,
              }}
            >
              <option value="circular">Circular (Tròn)</option>
              <option value="horizontal">Horizontal (Ngang)</option>
            </select>
          </div>

          <div style={{ 
            padding: 16,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ color: tokens.color.primary, fontSize: 16, fontWeight: 600, margin: 0 }}>
                📱 Social Platforms ({data.platforms?.length || 0})
              </h4>
              <Button
                variant="primary"
                size="small"
                onClick={() => addArrayItem('platforms', { name: 'facebook', url: 'https://facebook.com' })}
              >
                <i className="ri-add-line" style={{ marginRight: 6 }} />
                Add Platform
              </Button>
            </div>
            {data.platforms?.map((platform: any, index: number) => (
              <div
                key={platform._id || index}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ color: tokens.color.text, fontWeight: 600 }}>{platform.name || `Platform ${index + 1}`}</span>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => removeArrayItem('platforms', index)}
                  >
                    <i className="ri-delete-bin-line" />
                  </Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <Input
                    label="Platform Name"
                    value={platform.name || ''}
                    onChange={(v) => updateField(`platforms.${index}.name`, v)}
                    placeholder="facebook, instagram, youtube..."
                    fullWidth
                  />
                  <Input
                    label="URL"
                    value={platform.url || ''}
                    onChange={(v) => updateField(`platforms.${index}.url`, v)}
                    placeholder="https://facebook.com/yourpage"
                    fullWidth
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'QUICK_CONTACT':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-contacts-fill" style={{ fontSize: 24, color: '#10b981', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                📞 Quick Contact Cards
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Hiển thị thông tin liên hệ nhanh với glass morphism cards - điện thoại, email, địa chỉ, giờ mở cửa
              </p>
            </div>
          </div>

          <Input label="Section Title" value={data.title || ''} onChange={(v) => updateField('title', v)} placeholder="Hãy Liên Hệ Với Chúng Tôi" fullWidth />
          <TextArea label="Subtitle" value={data.subtitle || ''} onChange={(v) => updateField('subtitle', v)} placeholder="Chúng tôi luôn sẵn sàng lắng nghe và phục vụ bạn" fullWidth />

          <div style={{ 
            padding: 16,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ color: tokens.color.primary, fontSize: 16, fontWeight: 600, margin: 0 }}>
                📇 Contact Methods ({data.methods?.length || 0})
              </h4>
              <Button
                variant="primary"
                size="small"
                onClick={() => addArrayItem('methods', { icon: 'ri-phone-fill', title: 'ĐIỆN THOẠI', value: '+84 123 456 789', href: 'tel:+84123456789', color: '#10b981' })}
              >
                <i className="ri-add-line" style={{ marginRight: 6 }} />
                Add Method
              </Button>
            </div>
            {data.methods?.map((method: any, index: number) => (
              <div
                key={method._id || index}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ color: tokens.color.text, fontWeight: 600 }}>{method.title || `Method ${index + 1}`}</span>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => removeArrayItem('methods', index)}
                  >
                    <i className="ri-delete-bin-line" />
                  </Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <Input
                    label="Icon"
                    value={method.icon || ''}
                    onChange={(v) => updateField(`methods.${index}.icon`, v)}
                    placeholder="ri-phone-fill"
                    fullWidth
                  />
                  <Input
                    label="Title"
                    value={method.title || ''}
                    onChange={(v) => updateField(`methods.${index}.title`, v)}
                    placeholder="ĐIỆN THOẠI"
                    fullWidth
                  />
                  <Input
                    label="Value"
                    value={method.value || ''}
                    onChange={(v) => updateField(`methods.${index}.value`, v)}
                    placeholder="+84 123 456 789"
                    fullWidth
                  />
                  <Input
                    label="Link/URL (optional)"
                    value={method.href || ''}
                    onChange={(v) => updateField(`methods.${index}.href`, v)}
                    placeholder="tel:+84123456789"
                    fullWidth
                  />
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, color: tokens.color.text, fontWeight: 500 }}>
                      Color
                    </label>
                    <input
                      type="color"
                      value={method.color || '#10b981'}
                      onChange={(e) => updateField(`methods.${index}.color`, e.target.value)}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: 4,
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${tokens.color.border}`,
                        borderRadius: tokens.radius.md,
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'SPECIAL_OFFERS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 211, 147, 0.15) 0%, rgba(232, 193, 112, 0.15) 100%)',
            border: '1px solid rgba(245, 211, 147, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-fire-fill" style={{ fontSize: 24, color: '#f5d393', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                🔥 Special Offers Section
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Offers are automatically fetched from the Offers API. You can customize the section title and subtitle here.
                The actual offer content (discounts, validity, images) is managed through the Offers module.
              </p>
            </div>
          </div>

          {/* Title Input */}
          <Input
            label="Section Title"
            value={data.title || ''}
            onChange={(v) => updateField('title', v)}
            placeholder="Khuyến Mãi Hấp Dẫn"
            fullWidth
          />

          {/* Subtitle Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: tokens.color.text,
              marginBottom: 8,
            }}>
              Section Subtitle (optional)
            </label>
            <textarea
              value={data.subtitle || ''}
              onChange={(e) => updateField('subtitle', e.target.value)}
              placeholder="Nhận ưu đãi hấp dẫn khi đặt bàn hôm nay"
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                fontSize: 14,
                color: tokens.color.text,
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* How it works */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderLeft: `4px solid #3B82F6`,
            padding: 16,
            borderRadius: tokens.radius.md,
          }}>
            <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
              <i className="ri-information-line" style={{ marginRight: 6 }} />
              How it works
            </h4>
            <ul style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
              <li>This section displays active offers from your Offers database</li>
              <li>Each offer card shows: title, description, discount badge, countdown timer, and CTA button</li>
              <li>Offers are automatically filtered to show only active ones (based on validity dates)</li>
              <li>To manage offer content, use the <strong>Offers</strong> module in the admin panel</li>
            </ul>
          </div>
        </div>
      );

    case 'STATS':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: tokens.radius.md,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <i className="ri-bar-chart-fill" style={{ fontSize: 24, color: '#3B82F6', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: tokens.color.text, marginBottom: 8, fontSize: 15, fontWeight: 600 }}>
                📊 Statistics Section
              </h4>
              <p style={{ color: tokens.color.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Showcase impressive restaurant statistics - years in business, happy customers, dishes served, awards won, etc.
              </p>
            </div>
          </div>

          {/* Title */}
          <Input
            label="Section Title (optional)"
            value={data.title || ''}
            onChange={(v) => updateField('title', v)}
            placeholder="Our Achievements"
            fullWidth
          />

          {/* Subtitle */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: tokens.color.text,
              marginBottom: 8,
            }}>
              Section Subtitle (optional)
            </label>
            <textarea
              value={data.subtitle || ''}
              onChange={(e) => updateField('subtitle', e.target.value)}
              placeholder="Numbers that showcase our excellence"
              style={{
                width: '100%',
                minHeight: 60,
                padding: 12,
                fontSize: 14,
                color: tokens.color.text,
                background: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Stats Array */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>
                Statistics
              </label>
              <Button
                variant="secondary"
                size="small"
                onClick={() => addArrayItem('stats', { icon: 'ri-star-fill', value: '100', label: 'New Stat', prefix: '', suffix: '+' })}
              >
                <i className="ri-add-line" />
                Add Stat
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(data.stats || []).map((stat: any, index: number) => (
                <div key={index} style={{
                  background: tokens.color.surface,
                  borderRadius: tokens.radius.md,
                  padding: 16,
                  border: `1px solid ${tokens.color.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>Stat #{index + 1}</h4>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => removeArrayItem('stats', index)}
                    >
                      <i className="ri-delete-bin-line" />
                    </Button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <Input
                      label="Icon (Remix Icon class)"
                      value={stat.icon || ''}
                      onChange={(v) => updateField(`stats.${index}.icon`, v)}
                      placeholder="ri-star-fill"
                      fullWidth
                    />
                    <Input
                      label="Value"
                      value={stat.value || ''}
                      onChange={(v) => updateField(`stats.${index}.value`, v)}
                      placeholder="100"
                      fullWidth
                    />
                    <Input
                      label="Label"
                      value={stat.label || ''}
                      onChange={(v) => updateField(`stats.${index}.label`, v)}
                      placeholder="Happy Customers"
                      fullWidth
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <Input
                        label="Prefix"
                        value={stat.prefix || ''}
                        onChange={(v) => updateField(`stats.${index}.prefix`, v)}
                        placeholder="$, #"
                        fullWidth
                      />
                      <Input
                        label="Suffix"
                        value={stat.suffix || ''}
                        onChange={(v) => updateField(`stats.${index}.suffix`, v)}
                        placeholder="+, K, M"
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div style={{ color: tokens.color.muted, textAlign: 'center', padding: 40 }}>
          <i className="ri-code-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          Form editor for {kind} section is coming soon. Use JSON editor for now.
        </div>
      );
  }
}

