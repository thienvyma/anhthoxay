/**
 * Match Service Module
 *
 * Barrel export for match services. Provides backward compatible
 * MatchService class that composes all sub-services.
 *
 * **Feature: bidding-phase3-matching, bidding-phase4-communication**
 */

import { PrismaClient } from '@prisma/client';
import { MatchCrudService } from './crud.service';
import { MatchWorkflowService } from './workflow.service';
import { MatchEscrowService } from './escrow.service';
import type { MatchQuery, CancelMatchInput } from '../../schemas/match.schema';

// Re-export all types
export * from './types';

// Re-export individual services
export { MatchCrudService } from './crud.service';
export { MatchWorkflowService } from './workflow.service';
export { MatchEscrowService } from './escrow.service';

// ============================================
// BACKWARD COMPATIBLE MATCH SERVICE
// ============================================

/**
 * MatchService - Backward compatible class that composes all match sub-services
 *
 * This class maintains the same interface as the original MatchService
 * while delegating to the new focused service modules.
 */
export class MatchService {
  private crudService: MatchCrudService;
  private workflowService: MatchWorkflowService;
  private escrowService: MatchEscrowService;

  constructor(prisma: PrismaClient) {
    this.crudService = new MatchCrudService(prisma);
    this.workflowService = new MatchWorkflowService(prisma);
    this.escrowService = new MatchEscrowService(prisma);
  }

  // ============================================
  // WORKFLOW METHODS (BID SELECTION)
  // ============================================

  /**
   * Select a bid for a project (homeowner action)
   * NEW FLOW: Homeowner selects a PENDING bid → Project goes to PENDING_MATCH
   */
  selectBid(projectId: string, bidId: string, homeownerId: string) {
    return this.workflowService.selectBid(projectId, bidId, homeownerId);
  }

  /**
   * Admin approves a match (final step)
   * Creates escrow, fee transaction, and notifies both parties
   */
  approveMatch(projectId: string, adminId: string, note?: string) {
    return this.workflowService.approveMatch(projectId, adminId, note);
  }

  /**
   * Admin rejects a match
   * Reverts project to BIDDING_CLOSED, bid to REJECTED
   */
  rejectMatch(projectId: string, adminId: string, note: string) {
    return this.workflowService.rejectMatch(projectId, adminId, note);
  }

  // ============================================
  // CRUD METHODS (CONTACT REVEAL)
  // ============================================

  /**
   * Get match details by bid ID for contractor
   * Requirements: 9.1-9.5 - Contractor views match details for their selected bid
   */
  getMatchDetailsByBid(bidId: string, contractorId: string) {
    return this.crudService.getMatchDetailsByBid(bidId, contractorId);
  }

  /**
   * Get match details with contact information reveal
   * Requirements: 2.1-2.6 - Reveal contact info based on user role and project status
   */
  getMatchDetails(projectId: string, userId: string) {
    return this.crudService.getMatchDetails(projectId, userId);
  }

  // ============================================
  // WORKFLOW METHODS (PROJECT STATUS)
  // ============================================

  /**
   * Validate project status transition
   * Requirements: 11.1-11.6 - Define valid status transitions
   */
  validateProjectTransition(currentStatus: string, newStatus: string) {
    return this.workflowService.validateProjectTransition(currentStatus, newStatus);
  }

  /**
   * Start a matched project (transition to IN_PROGRESS)
   * Requirements: 11.6 - Allow transition to IN_PROGRESS status
   */
  startProject(projectId: string, homeownerId: string) {
    return this.workflowService.startProject(projectId, homeownerId);
  }

  /**
   * Complete a project
   * Requirements: 17.1, 17.2 - Confirm completion and release escrow
   */
  completeProject(projectId: string, homeownerId: string) {
    return this.workflowService.completeProject(projectId, homeownerId);
  }

  // ============================================
  // CRUD METHODS (CANCEL)
  // ============================================

  /**
   * Cancel a matched project
   * Requirements: 8.5, 11.5 - Handle escrow refund and fee cancellation
   */
  cancelMatch(projectId: string, userId: string, data: CancelMatchInput) {
    return this.crudService.cancelMatch(projectId, userId, data);
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  /**
   * List matched projects (admin)
   * Requirements: 10.1 - Return projects with MATCHED status
   */
  listMatches(query: MatchQuery) {
    return this.crudService.listMatches(query);
  }

  /**
   * Get match details for admin
   * Requirements: 10.2 - Return full details including both party info
   */
  getMatchDetailsAdmin(projectId: string) {
    return this.crudService.getMatchDetailsAdmin(projectId);
  }

  /**
   * Cancel match as admin
   * Requirements: 10.3 - Admin can cancel match
   */
  cancelMatchAdmin(projectId: string, adminId: string, data: CancelMatchInput) {
    return this.crudService.cancelMatchAdmin(projectId, adminId, data);
  }

  // ============================================
  // ESCROW METHODS
  // ============================================

  /**
   * Get escrow and fee summary for a match
   * Requirements: 10.2 - Return escrow and fee details for admin
   */
  getMatchFinancialSummary(projectId: string) {
    return this.escrowService.getMatchFinancialSummary(projectId);
  }

  /**
   * Validate that escrow is in HELD status
   * Requirements: 8.4 - Validate escrow status before operations
   */
  validateEscrowHeld(projectId: string) {
    return this.escrowService.validateEscrowHeld(projectId);
  }
}
