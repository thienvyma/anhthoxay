import { z } from 'zod';

// ========== AUTH SCHEMAS ==========
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(5, 'Email too short'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ========== RESERVATION SCHEMAS ==========
export const createReservationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format').min(10, 'Phone number too short'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  partySize: z.number().int().min(1, 'Party size must be at least 1').max(50, 'Party size too large'),
  specialRequest: z.string().max(500, 'Special request too long').optional(),
});

export const updateReservationSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
});

// ========== PAGE SCHEMAS ==========
export const createPageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers and hyphens').min(1).max(100),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  headerConfig: z.string().optional(),
  footerConfig: z.string().optional(),
});

// ========== SECTION SCHEMAS ==========
export const createSectionSchema = z.object({
  kind: z.enum([
    'HERO', 'HERO_SIMPLE', 'GALLERY', 'FEATURED_MENU', 'TESTIMONIALS', 'CTA',
    'RICH_TEXT', 'BANNER', 'STATS', 'CONTACT_INFO', 'RESERVATION_FORM',
    'SPECIAL_OFFERS', 'GALLERY_SLIDESHOW', 'FEATURED_BLOG_POSTS',
    'OPENING_HOURS', 'SOCIAL_MEDIA', 'FEATURES', 'MISSION_VISION',
    'FAB_ACTIONS', 'FOOTER_SOCIAL', 'QUICK_CONTACT', 'CORE_VALUES'
  ]),
  data: z.record(z.string(), z.any()),
  order: z.number().int().min(0).optional(),
});

export const updateSectionSchema = z.object({
  data: z.record(z.string(), z.any()).optional(),
  order: z.number().int().min(0).optional(),
});

// ========== MENU SCHEMAS ==========
export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  price: z.number().positive('Price must be positive'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isVegetarian: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  popular: z.boolean().optional(),
  available: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const createMenuCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers and hyphens'),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  order: z.number().int().min(0).optional(),
});

// ========== BLOG SCHEMAS ==========
export const createBlogCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers and hyphens'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

export const createBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers and hyphens'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  content: z.string().min(1, 'Content is required'),
  featuredImage: z.string().url('Invalid image URL').optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Category is required'),
  tags: z.string().max(200).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const createBlogCommentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  content: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment too long'),
});

// ========== SPECIAL OFFER SCHEMAS ==========
export const createSpecialOfferSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  discount: z.number().int().min(0).max(100).optional(),
  validFrom: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  imageId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateSpecialOfferSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  discount: z.number().int().min(0).max(100).optional().nullable(),
  validFrom: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  imageId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ========== MEDIA SCHEMAS ==========
export const updateMediaSchema = z.object({
  alt: z.string().max(200, 'Alt text too long').optional(),
  caption: z.string().max(500, 'Caption too long').optional(),
  isGalleryImage: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  tags: z.string().max(200).optional(),
});

// ========== SETTINGS SCHEMAS ==========
export const updateSettingsSchema = z.object({
  value: z.any(),
});

// Helper type extraction
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

