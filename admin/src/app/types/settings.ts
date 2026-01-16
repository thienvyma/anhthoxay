// Settings-related type definitions (Settings, ServiceFee)

// ========== COMPANY SETTINGS ==========

/**
 * Company settings
 */
export interface CompanySettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  workingHours: string;
}

/**
 * Theme settings
 */
export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
}

/**
 * Social media settings
 */
export interface SocialSettings {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
}

// ========== SERVICE FEE TYPES ==========

/**
 * Service fee type enum
 */
export type ServiceFeeType = 'FIXED' | 'PERCENTAGE';

/**
 * Service fee entity
 */
export interface ServiceFee {
  id: string;
  name: string;
  code: string;
  type: ServiceFeeType;
  value: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========== NAVIGATION TYPES ==========

/**
 * Route type for navigation
 */
export type RouteType =
  | 'dashboard'
  | 'pages'
  | 'sections'
  | 'media'
  | 'blog-manager'
  | 'settings'
  | 'settings/api-keys'
  | 'leads'
  | 'pricing-config'
  | 'furniture'
  | 'users'
  | 'regions'
  | 'notification-templates'
  | 'api-keys'
  | 'rate-limits';
