// User-related type definitions

/**
 * Basic user type
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'WORKER' | 'USER';
}

/**
 * User account with additional metadata
 */
export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'WORKER' | 'USER';
  createdAt: string;
  updatedAt: string;
  _count?: {
    sessions: number;
    blogPosts: number;
  };
}

/**
 * User session information
 */
export interface UserSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

/**
 * Contractor verification status
 */
export type ContractorVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/**
 * Contractor list item for admin table view
 */
export interface Contractor {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  companyName: string | null;
  verificationStatus: ContractorVerificationStatus;
  verifiedAt: string | null;
  rating: number;
  totalProjects: number;
  createdAt: string;
  contractorProfile: {
    id: string;
    experience: number | null;
    specialties: string[];
    submittedAt: string | null;
  } | null;
}

/**
 * Contractor profile with full details
 */
export interface ContractorProfile {
  id: string;
  userId: string;
  description: string | null;
  experience: number | null;
  specialties: string[];
  serviceAreas: string[];
  portfolioImages: string[];
  certificates: Array<{ name: string; imageUrl: string; issuedDate?: string }>;
  idCardFront: string | null;
  idCardBack: string | null;
  businessLicenseImage: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    avatar: string | null;
    companyName: string | null;
    businessLicense: string | null;
    taxCode: string | null;
    verificationStatus: string;
    verifiedAt: string | null;
    verificationNote: string | null;
    rating: number;
    totalProjects: number;
    createdAt: string;
    badges?: Array<{
      id: string;
      badgeType: string;
      awardedAt: string;
    }>;
  };
}

/**
 * Customer lead from forms
 */
export interface CustomerLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  content: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED';
  source: string;
  quoteData: string | null;
  notes: string | null;
  statusHistory: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Status history entry for leads
 */
export interface StatusHistoryEntry {
  from: string;
  to: string;
  changedAt: string;
  changedBy?: string;
}

/**
 * Region for location management
 */
export interface Region {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Region tree node with children
 */
export interface RegionTreeNode extends Region {
  children: RegionTreeNode[];
}
