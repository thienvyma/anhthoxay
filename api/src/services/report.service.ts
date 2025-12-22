/**
 * Review Report Service
 *
 * Business logic for review report management including creating reports,
 * listing reports for admin, and resolving reports.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 19.1-19.4**
 */

import { PrismaClient } from '@prisma/client';
import { ReviewService } from './review';
import {
  type CreateReportInput,
  type ResolveReportInput,
  type ReportQuery,
  type ResolutionAction,
} from '../schemas/report.schema';

// ============================================
// TYPES
// ============================================

export interface ReportWithRelations {
  id: string;
  reviewId: string;
  reporterId: string;
  reason: string;
  description: string | null;
  status: string;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  review: {
    id: string;
    rating: number;
    comment: string | null;
    isPublic: boolean;
    isDeleted: boolean;
    project: {
      id: string;
      code: string;
      title: string;
    };
    reviewer: {
      id: string;
      name: string;
    };
    contractor: {
      id: string;
      name: string;
    };
  };
  reporter: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReportListResult {
  data: ReportWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// REPORT SERVICE CLASS
// ============================================

export class ReportService {
  private prisma: PrismaClient;
  private reviewService: ReviewService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.reviewService = new ReviewService(prisma);
  }


  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create a new report for a review
   * Requirements: 19.1, 19.2 - Report button with reason selection
   */
  async createReport(
    reviewId: string,
    reporterId: string,
    data: CreateReportInput
  ): Promise<ReportWithRelations> {
    // Check if review exists and is public
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReportError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    if (!review.isPublic || review.isDeleted) {
      throw new ReportError(
        'REVIEW_NOT_AVAILABLE',
        'Cannot report a hidden or deleted review',
        400
      );
    }

    // Check if user has already reported this review
    const existingReport = await this.prisma.reviewReport.findFirst({
      where: {
        reviewId,
        reporterId,
        status: 'PENDING', // Only check pending reports
      },
    });

    if (existingReport) {
      throw new ReportError(
        'ALREADY_REPORTED',
        'You have already reported this review',
        409
      );
    }

    // Prevent self-reporting (reviewer cannot report their own review)
    if (review.reviewerId === reporterId) {
      throw new ReportError(
        'CANNOT_REPORT_OWN_REVIEW',
        'You cannot report your own review',
        400
      );
    }

    // Create the report
    const report = await this.prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId,
        reason: data.reason,
        description: data.description ?? null,
        status: 'PENDING',
      },
      include: this.getReportInclude(),
    });

    return this.transformReport(report);
  }

  // ============================================
  // LIST OPERATIONS
  // ============================================

  /**
   * List reports (admin)
   * Requirements: 19.3 - Create moderation ticket for admin
   */
  async listReports(query: ReportQuery): Promise<ReportListResult> {
    const {
      reviewId,
      reporterId,
      reason,
      status,
      fromDate,
      toDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(reviewId && { reviewId }),
      ...(reporterId && { reporterId }),
      ...(reason && { reason }),
      ...(status && { status }),
      ...(fromDate && { createdAt: { gte: fromDate } }),
      ...(toDate && { createdAt: { lte: toDate } }),
    };

    const [reports, total] = await Promise.all([
      this.prisma.reviewReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getReportInclude(),
      }),
      this.prisma.reviewReport.count({ where }),
    ]);

    return {
      data: reports.map((r) => this.transformReport(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get report by ID
   */
  async getById(reportId: string): Promise<ReportWithRelations | null> {
    const report = await this.prisma.reviewReport.findUnique({
      where: { id: reportId },
      include: this.getReportInclude(),
    });

    if (!report) {
      return null;
    }

    return this.transformReport(report);
  }

  // ============================================
  // RESOLVE OPERATIONS
  // ============================================

  /**
   * Resolve a report (admin)
   * Requirements: 19.4 - Admin can hide, delete, or dismiss
   */
  async resolveReport(
    reportId: string,
    adminId: string,
    data: ResolveReportInput
  ): Promise<ReportWithRelations> {
    const report = await this.prisma.reviewReport.findUnique({
      where: { id: reportId },
      include: {
        review: true,
      },
    });

    if (!report) {
      throw new ReportError('REPORT_NOT_FOUND', 'Report not found', 404);
    }

    if (report.status !== 'PENDING') {
      throw new ReportError(
        'REPORT_ALREADY_RESOLVED',
        'Report has already been resolved',
        400
      );
    }

    // Perform the resolution action
    const resolution = data.resolution as ResolutionAction;
    
    await this.performResolutionAction(
      report.reviewId,
      adminId,
      resolution
    );

    // Update the report status
    const newStatus = resolution === 'dismiss' ? 'DISMISSED' : 'RESOLVED';
    
    const updatedReport = await this.prisma.reviewReport.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolution: data.note ? `${resolution}: ${data.note}` : resolution,
      },
      include: this.getReportInclude(),
    });

    // Also resolve any other pending reports for the same review if action was hide/delete
    if (resolution !== 'dismiss') {
      await this.prisma.reviewReport.updateMany({
        where: {
          reviewId: report.reviewId,
          status: 'PENDING',
          id: { not: reportId },
        },
        data: {
          status: 'RESOLVED',
          resolvedBy: adminId,
          resolvedAt: new Date(),
          resolution: `auto-resolved: ${resolution}`,
        },
      });
    }

    return this.transformReport(updatedReport);
  }

  /**
   * Perform the resolution action on the review
   */
  private async performResolutionAction(
    reviewId: string,
    adminId: string,
    action: ResolutionAction
  ): Promise<void> {
    switch (action) {
      case 'hide':
        // Hide the review (set isPublic to false)
        await this.reviewService.hide(reviewId, adminId);
        break;
      case 'delete':
        // Permanently delete the review
        await this.reviewService.adminDelete(reviewId, adminId);
        break;
      case 'dismiss':
        // Do nothing to the review, just dismiss the report
        break;
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get report statistics for admin dashboard
   */
  async getStats(): Promise<{
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    dismissedReports: number;
    reportsByReason: Record<string, number>;
    reportsThisMonth: number;
  }> {
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      reportsByReason,
      reportsThisMonth,
    ] = await Promise.all([
      this.prisma.reviewReport.count(),
      this.prisma.reviewReport.count({ where: { status: 'PENDING' } }),
      this.prisma.reviewReport.count({ where: { status: 'RESOLVED' } }),
      this.prisma.reviewReport.count({ where: { status: 'DISMISSED' } }),
      this.prisma.reviewReport.groupBy({
        by: ['reason'],
        _count: { reason: true },
      }),
      this.prisma.reviewReport.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)), // First day of current month
          },
        },
      }),
    ]);

    const reasonCounts: Record<string, number> = {
      spam: 0,
      offensive: 0,
      fake: 0,
      irrelevant: 0,
    };
    for (const item of reportsByReason) {
      reasonCounts[item.reason] = item._count.reason;
    }

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      reportsByReason: reasonCounts,
      reportsThisMonth,
    };
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get standard include for report queries
   */
  private getReportInclude() {
    return {
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          isPublic: true,
          isDeleted: true,
          project: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
          contractor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    };
  }

  /**
   * Transform report from Prisma to response format
   */
  private transformReport(report: {
    id: string;
    reviewId: string;
    reporterId: string;
    reason: string;
    description: string | null;
    status: string;
    resolvedBy: string | null;
    resolvedAt: Date | null;
    resolution: string | null;
    createdAt: Date;
    review: {
      id: string;
      rating: number;
      comment: string | null;
      isPublic: boolean;
      isDeleted: boolean;
      project: {
        id: string;
        code: string;
        title: string;
      };
      reviewer: {
        id: string;
        name: string;
      };
      contractor: {
        id: string;
        name: string;
      };
    };
    reporter: {
      id: string;
      name: string;
      email: string;
    };
  }): ReportWithRelations {
    return {
      id: report.id,
      reviewId: report.reviewId,
      reporterId: report.reporterId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      resolvedBy: report.resolvedBy,
      resolvedAt: report.resolvedAt,
      resolution: report.resolution,
      createdAt: report.createdAt,
      review: report.review,
      reporter: report.reporter,
    };
  }
}

// ============================================
// REPORT ERROR CLASS
// ============================================

export class ReportError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ReportError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      REVIEW_NOT_FOUND: 404,
      REPORT_NOT_FOUND: 404,
      REVIEW_NOT_AVAILABLE: 400,
      ALREADY_REPORTED: 409,
      CANNOT_REPORT_OWN_REVIEW: 400,
      REPORT_ALREADY_RESOLVED: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
