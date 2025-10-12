// Type definitions for Landing app

export type RouteType = 'home' | 'menu' | 'about' | 'gallery' | 'contact' | 'blog' | 'test-hover';

export type SectionKind = 
  | 'HERO'
  | 'HERO_SIMPLE'
  | 'GALLERY'
  | 'FEATURED_MENU'
  | 'TESTIMONIALS'
  | 'CTA'
  | 'CALL_TO_ACTION' // Alias for CTA
  | 'RICH_TEXT'
  | 'BANNER'
  | 'STATS'
  | 'STATISTICS' // Alias for STATS
  | 'CONTACT_INFO'
  | 'RESERVATION_FORM'
  | 'SPECIAL_OFFERS'
  | 'GALLERY_SLIDESHOW'
  | 'FEATURED_BLOG_POSTS'
  | 'BLOG_LIST'
  | 'OPENING_HOURS'
  | 'SOCIAL_MEDIA'
  | 'FEATURES'
  | 'MISSION_VISION'
  | 'FAB_ACTIONS'
  | 'FOOTER_SOCIAL'
  | 'QUICK_CONTACT'
  | 'CORE_VALUES';

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
