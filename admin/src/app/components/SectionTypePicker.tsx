import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import type { SectionKind } from '../types';

interface SectionTypePickerProps {
  onSelect: (type: SectionKind) => void;
  onCancel: () => void;
}

const sectionTypes: Array<{
  type: SectionKind;
  icon: string;
  label: string;
  description: string;
  color: string;
  example: string;
}> = [
  {
    type: 'HERO',
    icon: 'ri-image-2-line',
    label: 'Hero Banner',
    description: 'Large banner with image, title, and call-to-action button',
    color: '#f59e0b',
    example: 'Perfect for homepage header',
  },
  {
    type: 'HERO_SIMPLE',
    icon: 'ri-layout-top-line',
    label: 'Simple Hero',
    description: 'Lightweight hero section for secondary pages',
    color: '#fb923c',
    example: 'Contact, Menu, About pages',
  },
  {
    type: 'GALLERY',
    icon: 'ri-gallery-line',
    label: 'Photo Gallery',
    description: 'Beautiful image gallery with lightbox viewer',
    color: '#06b6d4',
    example: 'Showcase your restaurant ambiance',
  },
  {
    type: 'FEATURED_MENU',
    icon: 'ri-restaurant-2-line',
    label: 'Featured Menu',
    description: 'Highlight your signature dishes with images and prices',
    color: '#f59e0b',
    example: 'Best sellers, chef specials',
  },
  {
    type: 'TESTIMONIALS',
    icon: 'ri-chat-quote-line',
    label: 'Testimonials',
    description: 'Customer reviews and ratings to build trust',
    color: '#8b5cf6',
    example: 'Show 3-6 reviews',
  },
  {
    type: 'STATS',
    icon: 'ri-bar-chart-box-line',
    label: 'Statistics',
    description: 'Impressive numbers and achievements',
    color: '#10b981',
    example: 'Years, customers, rating',
  },
  {
    type: 'CTA',
    icon: 'ri-flashlight-line',
    label: 'Call to Action',
    description: 'Encourage visitors to take action (book, order, visit)',
    color: '#f59e0b',
    example: 'Drive conversions',
  },
  {
    type: 'CONTACT_INFO',
    icon: 'ri-map-pin-line',
    label: 'Contact Info',
    description: 'Address, phone, email, and business hours',
    color: '#6366f1',
    example: 'Footer or contact page',
  },
  {
    type: 'RESERVATION_FORM',
    icon: 'ri-calendar-check-line',
    label: 'Reservation Form',
    description: 'Table booking form for customers',
    color: '#10b981',
    example: 'Essential for bookings',
  },
  {
    type: 'SPECIAL_OFFERS',
    icon: 'ri-price-tag-3-line',
    label: 'Special Offers',
    description: 'Promotional offers and limited-time deals',
    color: '#ec4899',
    example: 'Happy hour, seasonal promotions',
  },
  {
    type: 'RICH_TEXT',
    icon: 'ri-file-text-line',
    label: 'Rich Text',
    description: 'Custom content with formatting and HTML',
    color: '#64748b',
    example: 'About us, policies',
  },
  {
    type: 'BANNER',
    icon: 'ri-megaphone-line',
    label: 'Announcement Banner',
    description: 'Top bar for important notices or alerts',
    color: '#f97316',
    example: 'COVID notice, events',
  },
  {
    type: 'GALLERY_SLIDESHOW',
    icon: 'ri-slideshow-line',
    label: 'Gallery Slideshow',
    description: 'Auto-playing slideshow from gallery images',
    color: '#06b6d4',
    example: 'Featured gallery photos on homepage',
  },
  {
    type: 'FEATURED_BLOG_POSTS',
    icon: 'ri-article-line',
    label: 'Featured Blog Posts',
    description: 'Show featured blog posts (max 3)',
    color: '#8b5cf6',
    example: 'Latest articles on homepage',
  },
  {
    type: 'OPENING_HOURS',
    icon: 'ri-time-line',
    label: 'Opening Hours',
    description: 'Display business hours and schedule',
    color: '#14b8a6',
    example: 'Weekly schedule, special hours',
  },
  {
    type: 'SOCIAL_MEDIA',
    icon: 'ri-share-line',
    label: 'Social Media Links',
    description: 'Social media icons and links',
    color: '#a855f7',
    example: 'Facebook, Instagram, TikTok',
  },
  {
    type: 'FEATURES',
    icon: 'ri-star-line',
    label: 'Features / Values',
    description: 'Highlight key features or core values',
    color: '#3b82f6',
    example: 'Quality, Service, Innovation',
  },
  {
    type: 'MISSION_VISION',
    icon: 'ri-flag-line',
    label: 'Mission & Vision',
    description: 'Company mission and vision statements',
    color: '#0ea5e9',
    example: 'About us page',
  },
  {
    type: 'FAB_ACTIONS',
    icon: 'ri-customer-service-2-fill',
    label: 'Floating Action Buttons',
    description: 'Fixed corner buttons for quick actions (call, chat, booking)',
    color: '#f5d393',
    example: 'Always visible on all pages',
  },
  {
    type: 'FOOTER_SOCIAL',
    icon: 'ri-share-forward-line',
    label: 'Footer Social Links',
    description: 'Social media links for footer section',
    color: '#64748b',
    example: 'Footer social icons',
  },
  {
    type: 'QUICK_CONTACT',
    icon: 'ri-contacts-line',
    label: 'Quick Contact Cards',
    description: 'Quick contact info cards with glass morphism',
    color: '#10b981',
    example: 'Phone, Email, Address, Hours',
  },
  {
    type: 'CORE_VALUES',
    icon: 'ri-heart-3-line',
    label: 'Core Values',
    description: 'Display core values and principles',
    color: '#ec4899',
    example: 'Quality, Innovation, Customer Focus',
  },
];

export function SectionTypePicker({ onSelect, onCancel }: SectionTypePickerProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onCancel();
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
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
            e.stopPropagation();
          }}
          style={{
            width: '100%',
            maxWidth: 1200,
            height: '90vh',
            maxHeight: '90vh',
            background: tokens.color.background,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.lg,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
        {/* Header */}
        <div
          style={{
            padding: 24,
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>
              Choose Section Type
            </h2>
            <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
              Select the type of content you want to add to your page
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: tokens.color.text,
              fontSize: 20,
            }}
          >
            <i className="ri-close-line" />
          </motion.button>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {sectionTypes.map((section, index) => (
              <motion.div
                key={section.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, boxShadow: `0 8px 24px ${section.color}40` }}
                onClick={() => onSelect(section.type)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.lg,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Color accent */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: section.color,
                  }}
                />

                {/* Icon */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: tokens.radius.md,
                    background: `${section.color}20`,
                    border: `1px solid ${section.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <i className={section.icon} style={{ fontSize: 28, color: section.color }} />
                </div>

                {/* Label */}
                <h3
                  style={{
                    color: tokens.color.text,
                    fontSize: 18,
                    fontWeight: 600,
                    margin: '0 0 8px',
                  }}
                >
                  {section.label}
                </h3>

                {/* Description */}
                <p
                  style={{
                    color: tokens.color.muted,
                    fontSize: 14,
                    lineHeight: 1.5,
                    margin: '0 0 12px',
                  }}
                >
                  {section.description}
                </p>

                {/* Example */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: section.color,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <i className="ri-lightbulb-line" />
                  {section.example}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer tip */}
        <div
          style={{
            padding: 16,
            borderTop: `1px solid ${tokens.color.border}`,
            background: 'rgba(245,211,147,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <i className="ri-information-line" style={{ color: tokens.color.primary, fontSize: 20 }} />
          <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0 }}>
            💡 <strong>Tip:</strong> You can reorder sections anytime by dragging them in the Sections page
          </p>
        </div>
        </motion.div>
      </motion.div>
    </>
  );
}

