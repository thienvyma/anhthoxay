/**
 * Bidding Settings Service
 *
 * Business logic for bidding configuration management.
 * BiddingSettings is a singleton model with id = "default".
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-4.2**
 */

import { PrismaClient } from '@prisma/client';
import type {
  UpdateBiddingSettingsInput,
  BiddingSettings,
  PublicBiddingSettings,
} from '../schemas/bidding-settings.schema';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_SETTINGS_ID = 'default';

// ============================================
// BIDDING SETTINGS SERVICE CLASS
// ============================================

export class BiddingSettingsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get full bidding settings (for admin)
   * Creates default settings if not exists
   */
  async get(): Promise<BiddingSettings> {
    let settings = await this.prisma.biddingSettings.findUnique({
      where: { id: DEFAULT_SETTINGS_ID },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.prisma.biddingSettings.create({
        data: { id: DEFAULT_SETTINGS_ID },
      });
    }

    return settings;
  }

  /**
   * Get public bidding settings (subset for public users)
   * Only returns fields that should be visible to public
   */
  async getPublic(): Promise<PublicBiddingSettings> {
    const settings = await this.get();

    return {
      maxBidsPerProject: settings.maxBidsPerProject,
      defaultBidDuration: settings.defaultBidDuration,
      minBidDuration: settings.minBidDuration,
      maxBidDuration: settings.maxBidDuration,
      escrowPercentage: settings.escrowPercentage,
      escrowMinAmount: settings.escrowMinAmount,
      winFeePercentage: settings.winFeePercentage, // Needed for contractors to see win fee preview
    };
  }

  /**
   * Update bidding settings (admin only)
   * Validates business rules before updating
   */
  async update(data: UpdateBiddingSettingsInput): Promise<BiddingSettings> {
    // Get current settings to validate against
    const current = await this.get();

    // Merge with current values for validation
    const merged = {
      minBidDuration: data.minBidDuration ?? current.minBidDuration,
      maxBidDuration: data.maxBidDuration ?? current.maxBidDuration,
      defaultBidDuration: data.defaultBidDuration ?? current.defaultBidDuration,
      escrowMinAmount: data.escrowMinAmount ?? current.escrowMinAmount,
      escrowMaxAmount: data.escrowMaxAmount !== undefined ? data.escrowMaxAmount : current.escrowMaxAmount,
    };

    // Validate business rules
    if (merged.minBidDuration > merged.maxBidDuration) {
      throw new BiddingSettingsError(
        'INVALID_DURATION',
        'Thời gian bid tối thiểu không được lớn hơn thời gian tối đa'
      );
    }

    if (merged.defaultBidDuration < merged.minBidDuration) {
      throw new BiddingSettingsError(
        'INVALID_DURATION',
        'Thời gian bid mặc định không được nhỏ hơn thời gian tối thiểu'
      );
    }

    if (merged.defaultBidDuration > merged.maxBidDuration) {
      throw new BiddingSettingsError(
        'INVALID_DURATION',
        'Thời gian bid mặc định không được lớn hơn thời gian tối đa'
      );
    }

    if (merged.escrowMaxAmount !== null && merged.escrowMinAmount > merged.escrowMaxAmount) {
      throw new BiddingSettingsError(
        'INVALID_ESCROW',
        'Số tiền đặt cọc tối thiểu không được lớn hơn số tiền tối đa'
      );
    }

    // Update settings
    return this.prisma.biddingSettings.update({
      where: { id: DEFAULT_SETTINGS_ID },
      data: {
        ...(data.maxBidsPerProject !== undefined && { maxBidsPerProject: data.maxBidsPerProject }),
        ...(data.defaultBidDuration !== undefined && { defaultBidDuration: data.defaultBidDuration }),
        ...(data.minBidDuration !== undefined && { minBidDuration: data.minBidDuration }),
        ...(data.maxBidDuration !== undefined && { maxBidDuration: data.maxBidDuration }),
        ...(data.escrowPercentage !== undefined && { escrowPercentage: data.escrowPercentage }),
        ...(data.escrowMinAmount !== undefined && { escrowMinAmount: data.escrowMinAmount }),
        ...(data.escrowMaxAmount !== undefined && { escrowMaxAmount: data.escrowMaxAmount }),
        ...(data.verificationFee !== undefined && { verificationFee: data.verificationFee }),
        ...(data.winFeePercentage !== undefined && { winFeePercentage: data.winFeePercentage }),
        ...(data.autoApproveHomeowner !== undefined && { autoApproveHomeowner: data.autoApproveHomeowner }),
        ...(data.autoApproveProject !== undefined && { autoApproveProject: data.autoApproveProject }),
      },
    });
  }
}

// ============================================
// BIDDING SETTINGS ERROR CLASS
// ============================================

export class BiddingSettingsError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'BiddingSettingsError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      INVALID_DURATION: 400,
      INVALID_ESCROW: 400,
      NOT_FOUND: 404,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
