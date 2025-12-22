/**
 * Contractor Service
 *
 * Business logic for contractor profile management and verification.
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-2.1, REQ-2.2**
 */

import { PrismaClient } from '@prisma/client';
import type {
  CreateContractorProfileInput,
  UpdateContractorProfileInput,
  ListContractorsQuery,
  VerificationStatus,
} from '../schemas/contractor.schema';

// ============================================
// TYPES
// ============================================

export interface ContractorProfileWithUser {
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
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
    verifiedAt: Date | null;
    verificationNote: string | null;
    rating: number;
    totalProjects: number;
    createdAt: Date;
    badges?: Array<{
      id: string;
      badgeType: string;
      awardedAt: Date;
    }>;
  };
}

export interface ContractorListItem {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  companyName: string | null;
  verificationStatus: string;
  verifiedAt: Date | null;
  rating: number;
  totalProjects: number;
  createdAt: Date;
  contractorProfile: {
    id: string;
    experience: number | null;
    specialties: string[];
    submittedAt: Date | null;
  } | null;
}

// ============================================
// CONTRACTOR SERVICE CLASS
// ============================================

export class ContractorService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // PROFILE FUNCTIONS
  // ============================================

  /**
   * Get contractor profile by user ID
   */
  async getProfile(userId: string): Promise<ContractorProfileWithUser | null> {
    const profile = await this.prisma.contractorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            companyName: true,
            businessLicense: true,
            taxCode: true,
            verificationStatus: true,
            verifiedAt: true,
            verificationNote: true,
            rating: true,
            totalProjects: true,
            createdAt: true,
            badges: {
              select: {
                id: true,
                badgeType: true,
                awardedAt: true,
              },
              orderBy: { awardedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!profile) {
      return null;
    }

    return this.transformProfile(profile);
  }

  /**
   * Create or update contractor profile
   */
  async createOrUpdateProfile(
    userId: string,
    data: CreateContractorProfileInput | UpdateContractorProfileInput
  ): Promise<ContractorProfileWithUser> {
    // Check if user exists and is a contractor
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ContractorError('USER_NOT_FOUND', 'User not found');
    }

    if (user.role !== 'CONTRACTOR') {
      throw new ContractorError('NOT_CONTRACTOR', 'User is not a contractor');
    }

    // Prepare data for Prisma (convert arrays to JSON strings)
    const profileData = {
      description: data.description,
      experience: data.experience,
      specialties: data.specialties ? JSON.stringify(data.specialties) : undefined,
      serviceAreas: data.serviceAreas ? JSON.stringify(data.serviceAreas) : undefined,
      portfolioImages: data.portfolioImages ? JSON.stringify(data.portfolioImages) : undefined,
      certificates: data.certificates ? JSON.stringify(data.certificates) : undefined,
      idCardFront: data.idCardFront,
      idCardBack: data.idCardBack,
      businessLicenseImage: data.businessLicenseImage,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(profileData).filter(([, v]) => v !== undefined)
    );

    const profile = await this.prisma.contractorProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...cleanData,
      },
      update: cleanData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            companyName: true,
            businessLicense: true,
            taxCode: true,
            verificationStatus: true,
            verifiedAt: true,
            verificationNote: true,
            rating: true,
            totalProjects: true,
            createdAt: true,
          },
        },
      },
    });

    return this.transformProfile(profile);
  }

  /**
   * Submit profile for verification
   */
  async submitVerification(userId: string): Promise<{ success: boolean; message: string }> {
    // Check if user exists and is a contractor
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { contractorProfile: true },
    });

    if (!user) {
      throw new ContractorError('USER_NOT_FOUND', 'User not found');
    }

    if (user.role !== 'CONTRACTOR') {
      throw new ContractorError('NOT_CONTRACTOR', 'User is not a contractor');
    }

    // Check verification status
    if (user.verificationStatus === 'VERIFIED') {
      throw new ContractorError('ALREADY_VERIFIED', 'Contractor is already verified');
    }

    // Check if profile exists
    if (!user.contractorProfile) {
      throw new ContractorError('PROFILE_NOT_FOUND', 'Please create a profile first');
    }

    // Check required documents
    if (!user.contractorProfile.idCardFront || !user.contractorProfile.idCardBack) {
      throw new ContractorError('MISSING_DOCUMENTS', 'ID card images are required');
    }

    // Update submission timestamp and reset status to PENDING
    await this.prisma.$transaction([
      this.prisma.contractorProfile.update({
        where: { userId },
        data: { submittedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: 'PENDING',
          verificationNote: null,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Hồ sơ đã được gửi xét duyệt',
    };
  }

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  /**
   * List contractors with pagination and filtering
   */
  async listContractors(query: ListContractorsQuery): Promise<{
    data: ContractorListItem[];
    meta: { total: number; page: number; limit: number };
  }> {
    const { status, page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      role: 'CONTRACTOR',
      ...(status && { verificationStatus: status }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { companyName: { contains: search } },
        ],
      }),
    };

    const [contractors, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          companyName: true,
          verificationStatus: true,
          verifiedAt: true,
          rating: true,
          totalProjects: true,
          createdAt: true,
          contractorProfile: {
            select: {
              id: true,
              experience: true,
              specialties: true,
              submittedAt: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Transform data
    const data = contractors.map((c) => ({
      ...c,
      contractorProfile: c.contractorProfile
        ? {
            ...c.contractorProfile,
            specialties: this.parseJsonArray(c.contractorProfile.specialties),
          }
        : null,
    }));

    return {
      data,
      meta: { total, page, limit },
    };
  }

  /**
   * Get contractor by ID (for admin)
   */
  async getContractorById(id: string): Promise<ContractorProfileWithUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, role: 'CONTRACTOR' },
      include: {
        contractorProfile: true,
        badges: {
          select: {
            id: true,
            badgeType: true,
            awardedAt: true,
          },
          orderBy: { awardedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return null;
    }

    // If no profile, return user info with empty profile
    if (!user.contractorProfile) {
      return {
        id: '',
        userId: user.id,
        description: null,
        experience: null,
        specialties: [],
        serviceAreas: [],
        portfolioImages: [],
        certificates: [],
        idCardFront: null,
        idCardBack: null,
        businessLicenseImage: null,
        submittedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          companyName: user.companyName,
          businessLicense: user.businessLicense,
          taxCode: user.taxCode,
          verificationStatus: user.verificationStatus,
          verifiedAt: user.verifiedAt,
          verificationNote: user.verificationNote,
          rating: user.rating,
          totalProjects: user.totalProjects,
          createdAt: user.createdAt,
          badges: user.badges,
        },
      };
    }

    return this.transformProfile({
      ...user.contractorProfile,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        companyName: user.companyName,
        businessLicense: user.businessLicense,
        taxCode: user.taxCode,
        verificationStatus: user.verificationStatus,
        verifiedAt: user.verifiedAt,
        verificationNote: user.verificationNote,
        rating: user.rating,
        totalProjects: user.totalProjects,
        createdAt: user.createdAt,
        badges: user.badges,
      },
    });
  }

  /**
   * Verify contractor (approve or reject)
   */
  async verifyContractor(
    id: string,
    status: VerificationStatus,
    note?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id, role: 'CONTRACTOR' },
    });

    if (!user) {
      throw new ContractorError('CONTRACTOR_NOT_FOUND', 'Contractor not found');
    }

    // Update verification status
    await this.prisma.user.update({
      where: { id },
      data: {
        verificationStatus: status,
        verificationNote: note || null,
        ...(status === 'VERIFIED' ? { verifiedAt: new Date() } : {}),
      },
    });

    const message =
      status === 'VERIFIED'
        ? 'Nhà thầu đã được xác minh thành công'
        : 'Nhà thầu đã bị từ chối';

    return { success: true, message };
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Parse JSON string to array
   */
  private parseJsonArray(json: string | null): string[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Parse JSON string to certificate array
   */
  private parseCertificates(json: string | null): Array<{ name: string; imageUrl: string; issuedDate?: string }> {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Transform profile from Prisma to response format
   */
  private transformProfile(profile: {
    id: string;
    userId: string;
    description: string | null;
    experience: number | null;
    specialties: string | null;
    serviceAreas: string | null;
    portfolioImages: string | null;
    certificates: string | null;
    idCardFront: string | null;
    idCardBack: string | null;
    businessLicenseImage: string | null;
    submittedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
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
      verifiedAt: Date | null;
      verificationNote: string | null;
      rating: number;
      totalProjects: number;
      createdAt: Date;
      badges?: Array<{
        id: string;
        badgeType: string;
        awardedAt: Date;
      }>;
    };
  }): ContractorProfileWithUser {
    return {
      id: profile.id,
      userId: profile.userId,
      description: profile.description,
      experience: profile.experience,
      specialties: this.parseJsonArray(profile.specialties),
      serviceAreas: this.parseJsonArray(profile.serviceAreas),
      portfolioImages: this.parseJsonArray(profile.portfolioImages),
      certificates: this.parseCertificates(profile.certificates),
      idCardFront: profile.idCardFront,
      idCardBack: profile.idCardBack,
      businessLicenseImage: profile.businessLicenseImage,
      submittedAt: profile.submittedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      user: {
        ...profile.user,
        badges: profile.user.badges,
      },
    };
  }
}

// ============================================
// CONTRACTOR ERROR CLASS
// ============================================

export class ContractorError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ContractorError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      USER_NOT_FOUND: 404,
      CONTRACTOR_NOT_FOUND: 404,
      PROFILE_NOT_FOUND: 404,
      NOT_CONTRACTOR: 403,
      ALREADY_VERIFIED: 400,
      MISSING_DOCUMENTS: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
