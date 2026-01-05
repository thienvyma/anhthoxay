// Settings-related type definitions (Settings, BiddingSettings, ServiceFee)

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

// ========== BIDDING SETTINGS ==========

/**
 * Bidding settings (singleton)
 * Controls bidding system configuration
 */
export interface BiddingSettings {
  id: string;
  maxBidsPerProject: number;
  defaultBidDuration: number;
  minBidDuration: number;
  maxBidDuration: number;
  escrowPercentage: number;
  escrowMinAmount: number;
  escrowMaxAmount: number | null;
  verificationFee: number;
  winFeePercentage: number;
  autoApproveHomeowner: boolean;
  autoApproveProject: boolean;
  createdAt: string;
  updatedAt: string;
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
  | 'contractors'
  | 'regions'
  | 'projects'
  | 'bids'
  | 'matches'
  | 'escrows'
  | 'fees'
  | 'disputes'
  | 'notification-templates'
  | 'chat'
  | 'bidding'
  | 'bidding-settings'
  | 'api-keys'
  | 'guide';
