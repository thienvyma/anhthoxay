// Type definitions for Admin Dashboard

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
}

export interface Section {
  id: string;
  kind: SectionKind;
  order: number;
  data: Record<string, unknown>;
  pageId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SectionKind = 
  | 'HERO'
  | 'HERO_SIMPLE'
  | 'GALLERY'
  | 'FEATURED_MENU'
  | 'TESTIMONIALS'
  | 'CTA'
  | 'CALL_TO_ACTION'
  | 'RICH_TEXT'
  | 'BANNER'
  | 'STATS'
  | 'CONTACT_INFO'
  | 'RESERVATION_FORM'
  | 'SPECIAL_OFFERS'
  | 'GALLERY_SLIDESHOW'
  | 'FEATURED_BLOG_POSTS'
  | 'OPENING_HOURS'
  | 'SOCIAL_MEDIA'
  | 'FEATURES'
  | 'MISSION_VISION'
  | 'FAB_ACTIONS'
  | 'FOOTER_SOCIAL'
  | 'QUICK_CONTACT'
  | 'CORE_VALUES';

export interface Page {
  id: string;
  slug: string;
  title: string;
  headerConfig?: string | Record<string, unknown>; // JSON string or parsed object
  footerConfig?: string | Record<string, unknown>; // JSON string or parsed object
  sections: Section[];
  _count?: { sections: number };
  createdAt: string;
  updatedAt: string;
}

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

export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  specialRequest: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: number | null;
  validFrom: string;
  validUntil: string;
  imageId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form Data Types
export interface HeroData {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
}

export interface FeaturedMenuData {
  title: string;
  subtitle?: string;
  items: MenuItem[];
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
  icon?: string;
  color?: string;
  _count?: { items: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: string | number;
  imageUrl: string;
  categoryId?: string;
  category?: MenuCategory;
  tags?: string[];  // Tags for filtering (e.g. "Healthy", "Spicy", "New")
  isVegetarian?: boolean;
  isSpicy?: boolean;
  popular?: boolean;
  available?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestimonialsData {
  title?: string;
  subtitle?: string;
  testimonials: TestimonialItem[];
  layout?: 'carousel' | 'grid';
}

export interface TestimonialItem {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  content: string;
  date?: string;
}

export interface CTAData {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

export interface StatsData {
  title?: string;
  subtitle?: string;
  stats: StatItem[];
}

export interface StatItem {
  icon: string;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  color?: string;
}

export interface GalleryData {
  title?: string;
  subtitle?: string;
  images: GalleryImage[];
}

export interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface ContactInfoData {
  phone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
  mapUrl?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
}

export interface RichTextData {
  html: string;
}

export interface BannerData {
  text: string;
  href?: string;
}

export interface OpeningHoursData {
  title?: string;
  subtitle?: string;
  schedule: Array<{
    day: string;
    hours: string;
    special?: boolean;
  }>;
  note?: string;
}

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
    name: string; // facebook, instagram, youtube, twitter, tiktok, etc
    url: string;
  }>;
  layout?: 'horizontal' | 'circular';
}

// Blog Types
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

// Settings Types
export interface RestaurantSettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  openingHours: string;
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface SocialSettings {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
}

// Navigation
export type RouteType = 
  | 'dashboard'
  | 'pages'
  | 'sections'
  | 'menu'
  | 'media'
  | 'reservations'
  | 'preview'
  | 'offers'
  | 'blog-categories'
  | 'blog-posts'
  | 'settings';
