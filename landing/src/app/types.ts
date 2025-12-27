// Type definitions for Landing app - ANH THỢ XÂY

export type RouteType = 'home' | 'bao-gia' | 'about' | 'contact' | 'blog' | 'chinh-sach';

export type SectionKind = 
  // ATH Core sections
  | 'HERO'
  | 'HERO_SIMPLE'
  | 'TESTIMONIALS'
  | 'CTA'
  | 'CALL_TO_ACTION'
  | 'RICH_TEXT'
  | 'BANNER'
  | 'STATS'
  | 'STATISTICS'
  | 'CONTACT_INFO'
  | 'FEATURED_BLOG_POSTS'
  | 'BLOG_LIST'
  | 'SOCIAL_MEDIA'
  | 'FEATURES'
  | 'SERVICES'
  | 'MISSION_VISION'
  | 'FAB_ACTIONS'
  | 'FOOTER_SOCIAL'
  | 'QUICK_CONTACT'
  | 'CORE_VALUES'
  | 'QUOTE_FORM'
  | 'QUOTE_CALCULATOR'
  | 'MARKETPLACE'
  | 'FEATURED_SLIDESHOW'
  | 'MEDIA_GALLERY'
  | 'VIDEO_SHOWCASE'
  | 'ABOUT'
  | 'FAQ'
  | 'FURNITURE_QUOTE'
  // Legacy sections (kept for backward compatibility)
  | 'GALLERY'
  | 'GALLERY_SLIDESHOW'
  | 'FEATURED_MENU'
  | 'RESERVATION_FORM'
  | 'SPECIAL_OFFERS'
  | 'OPENING_HOURS';

export interface Section {
  id: string;
  kind: SectionKind;
  order: number;
  data: Record<string, unknown>;
}

export interface PageData {
  id?: string;
  title?: string;
  slug?: string;
  isActive?: boolean; // Toggle to temporarily disable page
  headerConfig?: string | Record<string, unknown>; // JSON string or parsed object
  footerConfig?: string | Record<string, unknown>; // JSON string or parsed object
  sections?: Section[];
}

export interface PageMeta {
  title?: string;
  description?: string;
}

export interface FABAction {
  icon: string;
  label: string;
  href: string;
  color: string;
}

export interface FABActionsData {
  mainIcon?: string;
  mainColor?: string;
  actions: FABAction[];
}

export interface FooterSocialData {
  title?: string;
  subtitle?: string;
  platforms: Array<{
    name: string;
    url: string;
  }>;
  layout?: 'horizontal' | 'circular';
}

/**
 * Furniture quote form field configuration
 */
export interface FurnitureQuoteFormField {
  _id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'phone' | 'email' | 'select';
  placeholder?: string;
  required: boolean;
  options?: string; // Comma-separated options for select type
}

/**
 * Furniture quote section data
 */
export interface FurnitureQuoteData {
  title?: string;
  subtitle?: string;
  formFields: FurnitureQuoteFormField[];
  buttonText?: string;
  successMessage?: string;
}
