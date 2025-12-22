// Content-related type definitions (Page, Section, BlogPost, Media)

// ========== SECTION TYPES ==========

/**
 * Section types - includes legacy types for backward compatibility
 */
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
  | 'INTERIOR_QUOTE'
  | 'INTERIOR_PRICING_TABLE'
  | 'INTERIOR_WIZARD'
  | 'ABOUT'
  | 'FAQ'
  // Legacy sections (kept for backward compatibility, not shown in UI)
  | 'GALLERY'
  | 'GALLERY_SLIDESHOW'
  | 'FEATURED_MENU'
  | 'RESERVATION_FORM'
  | 'SPECIAL_OFFERS'
  | 'OPENING_HOURS'
  | 'TEAM'
  | 'VIDEO';

/**
 * Section entity
 */
export interface Section {
  id: string;
  kind: SectionKind;
  order: number;
  data: Record<string, unknown>;
  pageId: string;
  createdAt?: string;
  updatedAt?: string;
}

// ========== PAGE TYPES ==========

/**
 * Page entity
 */
export interface Page {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  headerConfig?: string | Record<string, unknown>;
  footerConfig?: string | Record<string, unknown>;
  sections: Section[];
  _count?: { sections: number };
  createdAt: string;
  updatedAt: string;
}

// ========== MEDIA TYPES ==========

/**
 * Media asset entity
 */
export interface MediaAsset {
  id: string;
  url: string;
  alt: string | null;
  caption?: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  size?: number | null;
  isGalleryImage?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  tags?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ========== BLOG TYPES ==========

/**
 * Blog category entity
 */
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

/**
 * Blog post entity
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  categoryId: string;
  category?: BlogCategory;
  authorId: string;
  author?: {
    name: string;
    email: string;
  };
  tags: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
  };
}

/**
 * Blog comment entity
 */
export interface BlogComment {
  id: string;
  postId: string;
  post?: BlogPost;
  name: string;
  email: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'SPAM';
  createdAt: string;
  updatedAt: string;
}

// ========== SECTION DATA TYPES ==========

/**
 * Hero section data
 */
export interface HeroData {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
}

/**
 * Testimonials section data
 */
export interface TestimonialsData {
  title?: string;
  subtitle?: string;
  testimonials: TestimonialItem[];
  layout?: 'carousel' | 'grid';
}

/**
 * Testimonial item
 */
export interface TestimonialItem {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  content: string;
  date?: string;
}

/**
 * CTA section data
 */
export interface CTAData {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

/**
 * Stats section data
 */
export interface StatsData {
  title?: string;
  subtitle?: string;
  stats: StatItem[];
}

/**
 * Stat item
 */
export interface StatItem {
  icon: string;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  color?: string;
}

/**
 * Gallery section data
 */
export interface GalleryData {
  title?: string;
  subtitle?: string;
  images: GalleryImage[];
}

/**
 * Gallery image
 */
export interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
}

/**
 * Contact info section data
 */
export interface ContactInfoData {
  phone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
  mapUrl?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
}

/**
 * Rich text section data
 */
export interface RichTextData {
  html: string;
}

/**
 * Banner section data
 */
export interface BannerData {
  text: string;
  href?: string;
}

/**
 * Social media section data
 */
export interface SocialMediaData {
  title?: string;
  subtitle?: string;
  links: Array<{
    platform: string;
    url: string;
    icon: string;
  }>;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

/**
 * Features section data
 */
export interface FeaturesData {
  title?: string;
  subtitle?: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  layout?: 'grid' | 'list';
}

/**
 * Mission/Vision section data
 */
export interface MissionVisionData {
  title?: string;
  subtitle?: string;
  mission?: {
    icon: string;
    title: string;
    content: string;
  };
  vision?: {
    icon: string;
    title: string;
    content: string;
  };
}

/**
 * FAB action item
 */
export interface FABAction {
  icon: string;
  label: string;
  href: string;
  color: string;
}

/**
 * FAB actions section data
 */
export interface FABActionsData {
  mainIcon?: string;
  mainColor?: string;
  actions: FABAction[];
}

/**
 * Footer social section data
 */
export interface FooterSocialData {
  title?: string;
  subtitle?: string;
  platforms: Array<{
    name: string;
    url: string;
  }>;
  layout?: 'horizontal' | 'circular';
}

// ========== PRICING TYPES ==========

/**
 * Service category for pricing
 */
export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  coefficient: number;
  allowMaterials: boolean;
  materialCategoryIds: string[];
  formulaId: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Unit price for pricing
 */
export interface UnitPrice {
  id: string;
  category: string;
  name: string;
  price: number;
  tag: string;
  unit: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Material category
 */
export interface MaterialCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    materials: number;
  };
}

/**
 * Material item
 */
export interface Material {
  id: string;
  name: string;
  categoryId: string;
  category: MaterialCategory;
  imageUrl: string | null;
  price: number;
  unit: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Formula for pricing calculation
 */
export interface Formula {
  id: string;
  name: string;
  expression: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
