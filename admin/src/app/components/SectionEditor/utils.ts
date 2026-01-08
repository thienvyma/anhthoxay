import type { SectionKind } from './types';

// Utility to generate unique IDs for array items
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getSectionDescription(kind: SectionKind): string {
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
    BLOG_LIST: 'Blog posts listing with filters',
    OPENING_HOURS: 'Display business hours and schedule',
    SOCIAL_MEDIA: 'Social media links with icons',
    FEATURES: 'Highlight key features or core values',
    MISSION_VISION: 'Company mission and vision statements',
    FAB_ACTIONS: 'Floating action buttons in bottom-right corner',
    FOOTER_SOCIAL: 'Social media links in footer section',
    QUICK_CONTACT: 'Quick contact cards with phone, email, address, hours',
    CORE_VALUES: 'Display core values and principles with icons',
    TEAM: 'Team members showcase with photos and roles',
    SERVICES: 'Services listing with descriptions',
    QUOTE_FORM: 'Quote calculator form for construction services',
    QUOTE_CALCULATOR: 'Quote calculator with 2 tabs: Quick estimate + Consultation form',
    ABOUT: 'About section with company information',
    FAQ: 'Frequently asked questions section',
    VIDEO: 'Video embed section',
    MARKETPLACE: 'Public marketplace showing open projects for contractors',
    FEATURED_SLIDESHOW: 'Slideshow of featured media images',
    MEDIA_GALLERY: 'Full media gallery with pagination and lightbox',
    VIDEO_SHOWCASE: 'Video showcase with autoplay support (YouTube, Vimeo, or direct URL)',
    FURNITURE_QUOTE: 'Step-by-step apartment selection and furniture quotation process',
    LEGAL_CONTENT: 'Privacy Policy & Terms of Use for business compliance',
  };
  return descriptions[kind] || '';
}

export function getSectionIcon(kind: SectionKind): string {
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
    BLOG_LIST: 'ri-list-check',
    OPENING_HOURS: 'ri-time-fill',
    SOCIAL_MEDIA: 'ri-share-fill',
    FEATURES: 'ri-star-fill',
    MISSION_VISION: 'ri-flag-fill',
    FAB_ACTIONS: 'ri-customer-service-fill',
    FOOTER_SOCIAL: 'ri-share-forward-fill',
    QUICK_CONTACT: 'ri-contacts-fill',
    CORE_VALUES: 'ri-heart-3-fill',
    TEAM: 'ri-team-fill',
    SERVICES: 'ri-service-fill',
    QUOTE_FORM: 'ri-file-list-3-fill',
    QUOTE_CALCULATOR: 'ri-calculator-fill',
    ABOUT: 'ri-information-fill',
    FAQ: 'ri-question-answer-fill',
    VIDEO: 'ri-video-fill',
    MARKETPLACE: 'ri-store-2-fill',
    FEATURED_SLIDESHOW: 'ri-slideshow-3-fill',
    MEDIA_GALLERY: 'ri-gallery-fill',
    VIDEO_SHOWCASE: 'ri-video-fill',
    FURNITURE_QUOTE: 'ri-sofa-fill',
    LEGAL_CONTENT: 'ri-shield-check-fill',
  };
  return icons[kind] || 'ri-layout-fill';
}
