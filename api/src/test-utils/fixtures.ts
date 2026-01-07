/**
 * Test Fixtures
 *
 * Provides factory functions for creating test data.
 * Each fixture returns a new object to avoid test pollution.
 *
 * **Feature: api-test-coverage**
 * **Requirements: 1.1, 2.1, 3.1**
 */

// Type definitions for fixtures (matching Prisma schema)
type Role = 'ADMIN' | 'MANAGER' | 'CONTRACTOR' | 'HOMEOWNER' | 'WORKER' | 'USER';
type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
type ProjectStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'OPEN' | 'BIDDING_CLOSED' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type BidStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SELECTED' | 'NOT_SELECTED' | 'WITHDRAWN';
type EscrowStatus = 'PENDING' | 'HELD' | 'PARTIAL_RELEASED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED';
type NotificationType = 'BID_RECEIVED' | 'BID_APPROVED' | 'BID_REJECTED' | 'BID_SELECTED' | 'BID_NOT_SELECTED' | 'PROJECT_APPROVED' | 'PROJECT_REJECTED' | 'ESCROW_HELD' | 'ESCROW_RELEASED' | 'NEW_MESSAGE';

// ============================================
// USER FIXTURES
// ============================================

export const userFixtures = {
  admin: (overrides: Record<string, unknown> = {}) => ({
    id: 'user-admin-1',
    email: 'admin@test.com',
    name: 'Admin User',
    phone: '0901234567',
    role: 'ADMIN' as Role,
    passwordHash: '$2a$10$hashedpassword',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  manager: (overrides: Record<string, unknown> = {}) => ({
    id: 'user-manager-1',
    email: 'manager@test.com',
    name: 'Manager User',
    phone: '0901234568',
    role: 'MANAGER' as Role,
    passwordHash: '$2a$10$hashedpassword',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  contractor: (overrides: Record<string, unknown> = {}) => ({
    id: 'user-contractor-1',
    email: 'contractor@test.com',
    name: 'Contractor User',
    phone: '0901234569',
    role: 'CONTRACTOR' as Role,
    passwordHash: '$2a$10$hashedpassword',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  homeowner: (overrides: Record<string, unknown> = {}) => ({
    id: 'user-homeowner-1',
    email: 'homeowner@test.com',
    name: 'Homeowner User',
    phone: '0901234570',
    role: 'HOMEOWNER' as Role,
    passwordHash: '$2a$10$hashedpassword',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  worker: (overrides: Record<string, unknown> = {}) => ({
    id: 'user-worker-1',
    email: 'worker@test.com',
    name: 'Worker User',
    phone: '0901234571',
    role: 'WORKER' as Role,
    passwordHash: '$2a$10$hashedpassword',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),
};

// ============================================
// CONTRACTOR PROFILE FIXTURES
// ============================================

export const contractorProfileFixtures = {
  verified: (overrides: Record<string, unknown> = {}) => ({
    id: 'profile-1',
    userId: 'user-contractor-1',
    description: 'Experienced contractor',
    experience: 5,
    specialties: ['Sơn', 'Ốp lát'],
    serviceAreas: ['region-1'],
    verificationStatus: 'VERIFIED' as VerificationStatus,
    submittedAt: new Date('2024-01-01'),
    verifiedAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  }),

  pending: (overrides: Record<string, unknown> = {}) => ({
    id: 'profile-2',
    userId: 'user-contractor-2',
    description: 'New contractor',
    experience: 2,
    specialties: ['Điện'],
    serviceAreas: ['region-1'],
    verificationStatus: 'PENDING' as VerificationStatus,
    submittedAt: new Date('2024-01-01'),
    verifiedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  rejected: (overrides: Record<string, unknown> = {}) => ({
    id: 'profile-3',
    userId: 'user-contractor-3',
    description: 'Rejected contractor',
    experience: 1,
    specialties: [] as string[],
    serviceAreas: [] as string[],
    verificationStatus: 'REJECTED' as VerificationStatus,
    submittedAt: new Date('2024-01-01'),
    verifiedAt: null,
    rejectionReason: 'Incomplete documents',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),
};

// ============================================
// PROJECT FIXTURES
// ============================================

export const projectFixtures = {
  draft: (overrides: Record<string, unknown> = {}) => ({
    id: 'project-draft-1',
    code: 'PRJ-2024-001',
    ownerId: 'user-homeowner-1',
    title: 'Draft Project',
    description: 'A draft project',
    categoryId: 'category-1',
    regionId: 'region-1',
    address: '123 Test Street',
    area: 100,
    budgetMin: 50000000,
    budgetMax: 100000000,
    status: 'DRAFT' as ProjectStatus,
    maxBids: 20,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  pendingApproval: (overrides: Record<string, unknown> = {}) => ({
    id: 'project-pending-1',
    code: 'PRJ-2024-002',
    ownerId: 'user-homeowner-1',
    title: 'Pending Approval Project',
    description: 'A project waiting for approval',
    categoryId: 'category-1',
    regionId: 'region-1',
    address: '456 Test Street',
    area: 150,
    budgetMin: 80000000,
    budgetMax: 150000000,
    status: 'PENDING_APPROVAL' as ProjectStatus,
    maxBids: 20,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  open: (overrides: Record<string, unknown> = {}) => ({
    id: 'project-open-1',
    code: 'PRJ-2024-003',
    ownerId: 'user-homeowner-1',
    title: 'Open Project',
    description: 'An open project accepting bids',
    categoryId: 'category-1',
    regionId: 'region-1',
    address: '789 Test Street',
    area: 200,
    budgetMin: 100000000,
    budgetMax: 200000000,
    status: 'OPEN' as ProjectStatus,
    maxBids: 20,
    bidDeadline: new Date('2024-02-01'),
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  }),

  biddingClosed: (overrides: Record<string, unknown> = {}) => ({
    id: 'project-closed-1',
    code: 'PRJ-2024-004',
    ownerId: 'user-homeowner-1',
    title: 'Bidding Closed Project',
    description: 'A project with closed bidding',
    categoryId: 'category-1',
    regionId: 'region-1',
    address: '101 Test Street',
    area: 250,
    budgetMin: 150000000,
    budgetMax: 300000000,
    status: 'BIDDING_CLOSED' as ProjectStatus,
    maxBids: 20,
    bidDeadline: new Date('2024-01-20'),
    publishedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
    ...overrides,
  }),

  matched: (overrides: Record<string, unknown> = {}) => ({
    id: 'project-matched-1',
    code: 'PRJ-2024-005',
    ownerId: 'user-homeowner-1',
    title: 'Matched Project',
    description: 'A project matched with contractor',
    categoryId: 'category-1',
    regionId: 'region-1',
    address: '202 Test Street',
    area: 300,
    budgetMin: 200000000,
    budgetMax: 400000000,
    status: 'MATCHED' as ProjectStatus,
    maxBids: 20,
    selectedBidId: 'bid-selected-1',
    matchedAt: new Date('2024-01-25'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-25'),
    ...overrides,
  }),

  completed: (overrides: Record<string, unknown> = {}) => ({
    id: 'project-completed-1',
    code: 'PRJ-2024-006',
    ownerId: 'user-homeowner-1',
    title: 'Completed Project',
    description: 'A completed project',
    categoryId: 'category-1',
    regionId: 'region-1',
    address: '303 Test Street',
    area: 350,
    budgetMin: 250000000,
    budgetMax: 500000000,
    status: 'COMPLETED' as ProjectStatus,
    maxBids: 20,
    selectedBidId: 'bid-selected-2',
    matchedAt: new Date('2024-01-25'),
    completedAt: new Date('2024-03-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-01'),
    ...overrides,
  }),
};

// ============================================
// BID FIXTURES
// ============================================

export const bidFixtures = {
  pending: (overrides: Record<string, unknown> = {}) => ({
    id: 'bid-pending-1',
    code: 'BID-2024-001',
    projectId: 'project-open-1',
    contractorId: 'user-contractor-1',
    price: 120000000,
    timeline: '3 tháng',
    proposal: 'Detailed proposal for the project',
    status: 'PENDING' as BidStatus,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    ...overrides,
  }),

  approved: (overrides: Record<string, unknown> = {}) => ({
    id: 'bid-approved-1',
    code: 'BID-2024-002',
    projectId: 'project-closed-1',
    contractorId: 'user-contractor-1',
    price: 180000000,
    timeline: '4 tháng',
    proposal: 'Approved proposal',
    status: 'APPROVED' as BidStatus,
    reviewedBy: 'user-admin-1',
    reviewedAt: new Date('2024-01-18'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-18'),
    ...overrides,
  }),

  selected: (overrides: Record<string, unknown> = {}) => ({
    id: 'bid-selected-1',
    code: 'BID-2024-003',
    projectId: 'project-matched-1',
    contractorId: 'user-contractor-1',
    price: 250000000,
    timeline: '5 tháng',
    proposal: 'Selected proposal',
    status: 'SELECTED' as BidStatus,
    reviewedBy: 'user-admin-1',
    reviewedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-25'),
    ...overrides,
  }),

  rejected: (overrides: Record<string, unknown> = {}) => ({
    id: 'bid-rejected-1',
    code: 'BID-2024-004',
    projectId: 'project-open-1',
    contractorId: 'user-contractor-2',
    price: 150000000,
    timeline: '3 tháng',
    proposal: 'Rejected proposal',
    status: 'REJECTED' as BidStatus,
    reviewedBy: 'user-admin-1',
    reviewedAt: new Date('2024-01-18'),
    reviewNote: 'Price too high',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-18'),
    ...overrides,
  }),

  withdrawn: (overrides: Record<string, unknown> = {}) => ({
    id: 'bid-withdrawn-1',
    code: 'BID-2024-005',
    projectId: 'project-open-1',
    contractorId: 'user-contractor-3',
    price: 130000000,
    timeline: '3 tháng',
    proposal: 'Withdrawn proposal',
    status: 'WITHDRAWN' as BidStatus,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-17'),
    ...overrides,
  }),
};

// ============================================
// ESCROW FIXTURES
// ============================================

export const escrowFixtures = {
  pending: (overrides: Record<string, unknown> = {}) => ({
    id: 'escrow-pending-1',
    code: 'ESC-2024-001',
    projectId: 'project-matched-1',
    bidId: 'bid-selected-1',
    homeownerId: 'user-homeowner-1',
    amount: 25000000,
    releasedAmount: 0,
    currency: 'VND',
    status: 'PENDING' as EscrowStatus,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    ...overrides,
  }),

  held: (overrides: Record<string, unknown> = {}) => ({
    id: 'escrow-held-1',
    code: 'ESC-2024-002',
    projectId: 'project-matched-2',
    bidId: 'bid-selected-2',
    homeownerId: 'user-homeowner-1',
    amount: 30000000,
    releasedAmount: 0,
    currency: 'VND',
    status: 'HELD' as EscrowStatus,
    confirmedBy: 'user-admin-1',
    confirmedAt: new Date('2024-01-26'),
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-26'),
    ...overrides,
  }),

  partialReleased: (overrides: Record<string, unknown> = {}) => ({
    id: 'escrow-partial-1',
    code: 'ESC-2024-003',
    projectId: 'project-inprogress-1',
    bidId: 'bid-selected-3',
    homeownerId: 'user-homeowner-1',
    amount: 40000000,
    releasedAmount: 20000000,
    currency: 'VND',
    status: 'PARTIAL_RELEASED' as EscrowStatus,
    confirmedBy: 'user-admin-1',
    confirmedAt: new Date('2024-01-26'),
    releasedBy: 'user-admin-1',
    releasedAt: new Date('2024-02-15'),
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-02-15'),
    ...overrides,
  }),

  released: (overrides: Record<string, unknown> = {}) => ({
    id: 'escrow-released-1',
    code: 'ESC-2024-004',
    projectId: 'project-completed-1',
    bidId: 'bid-selected-4',
    homeownerId: 'user-homeowner-1',
    amount: 50000000,
    releasedAmount: 50000000,
    currency: 'VND',
    status: 'RELEASED' as EscrowStatus,
    confirmedBy: 'user-admin-1',
    confirmedAt: new Date('2024-01-26'),
    releasedBy: 'user-admin-1',
    releasedAt: new Date('2024-03-01'),
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-03-01'),
    ...overrides,
  }),

  disputed: (overrides: Record<string, unknown> = {}) => ({
    id: 'escrow-disputed-1',
    code: 'ESC-2024-005',
    projectId: 'project-disputed-1',
    bidId: 'bid-selected-5',
    homeownerId: 'user-homeowner-1',
    amount: 35000000,
    releasedAmount: 0,
    currency: 'VND',
    status: 'DISPUTED' as EscrowStatus,
    confirmedBy: 'user-admin-1',
    confirmedAt: new Date('2024-01-26'),
    disputeReason: 'Quality issues',
    disputedBy: 'user-homeowner-1',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-02-20'),
    ...overrides,
  }),
};

// ============================================
// NOTIFICATION FIXTURES
// ============================================

export const notificationFixtures = {
  unread: (overrides: Record<string, unknown> = {}) => ({
    id: 'notification-1',
    userId: 'user-homeowner-1',
    type: 'BID_RECEIVED' as NotificationType,
    title: 'New Bid Received',
    content: 'You have received a new bid for your project',
    data: JSON.stringify({ projectId: 'project-open-1', bidId: 'bid-pending-1' }),
    isRead: false,
    readAt: null,
    createdAt: new Date('2024-01-16'),
    ...overrides,
  }),

  read: (overrides: Record<string, unknown> = {}) => ({
    id: 'notification-2',
    userId: 'user-homeowner-1',
    type: 'PROJECT_APPROVED' as NotificationType,
    title: 'Project Approved',
    content: 'Your project has been approved',
    data: JSON.stringify({ projectId: 'project-open-1' }),
    isRead: true,
    readAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    ...overrides,
  }),
};

// ============================================
// REVIEW FIXTURES
// ============================================

export const reviewFixtures = {
  published: (overrides: Record<string, unknown> = {}) => ({
    id: 'review-1',
    projectId: 'project-completed-1',
    reviewerId: 'user-homeowner-1',
    contractorId: 'user-contractor-1',
    rating: 5,
    comment: 'Excellent work!',
    qualityRating: 5,
    timelinessRating: 4,
    communicationRating: 5,
    valueRating: 4,
    isPublic: true,
    isDeleted: false,
    helpfulCount: 10,
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-02'),
    ...overrides,
  }),

  withResponse: (overrides: Record<string, unknown> = {}) => ({
    id: 'review-2',
    projectId: 'project-completed-2',
    reviewerId: 'user-homeowner-2',
    contractorId: 'user-contractor-1',
    rating: 4,
    comment: 'Good work overall',
    qualityRating: 4,
    timelinessRating: 4,
    communicationRating: 4,
    valueRating: 4,
    response: 'Thank you for your feedback!',
    respondedAt: new Date('2024-03-05'),
    isPublic: true,
    isDeleted: false,
    helpfulCount: 5,
    createdAt: new Date('2024-03-03'),
    updatedAt: new Date('2024-03-05'),
    ...overrides,
  }),
};

// ============================================
// RANKING FIXTURES
// ============================================

export const rankingFixtures = {
  topRanked: (overrides: Record<string, unknown> = {}) => ({
    id: 'ranking-1',
    contractorId: 'user-contractor-1',
    ratingScore: 90,
    projectsScore: 80,
    responseScore: 85,
    verificationScore: 100,
    totalScore: 88,
    rank: 1,
    previousRank: 2,
    isFeatured: true,
    featuredAt: new Date('2024-03-01'),
    totalProjects: 15,
    completedProjects: 12,
    totalReviews: 10,
    averageRating: 4.5,
    averageResponseTime: 12,
    calculatedAt: new Date('2024-03-01'),
    ...overrides,
  }),

  midRanked: (overrides: Record<string, unknown> = {}) => ({
    id: 'ranking-2',
    contractorId: 'user-contractor-2',
    ratingScore: 70,
    projectsScore: 50,
    responseScore: 60,
    verificationScore: 100,
    totalScore: 67,
    rank: 5,
    previousRank: 4,
    isFeatured: false,
    totalProjects: 8,
    completedProjects: 5,
    totalReviews: 4,
    averageRating: 3.5,
    averageResponseTime: 24,
    calculatedAt: new Date('2024-03-01'),
    ...overrides,
  }),
};

// ============================================
// BIDDING SETTINGS FIXTURE
// ============================================

export const biddingSettingsFixtures = {
  default: (overrides: Record<string, unknown> = {}) => ({
    id: 'default',
    maxBidsPerProject: 20,
    defaultBidDuration: 7,
    minBidDuration: 3,
    maxBidDuration: 30,
    escrowPercentage: 10,
    escrowMinAmount: 1000000,
    escrowMaxAmount: null,
    verificationFee: 500000,
    winFeePercentage: 5,
    autoApproveHomeowner: true,
    autoApproveProject: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),
};

// ============================================
// EXPORT ALL FIXTURES
// ============================================

export const fixtures = {
  user: userFixtures,
  contractorProfile: contractorProfileFixtures,
  project: projectFixtures,
  bid: bidFixtures,
  escrow: escrowFixtures,
  notification: notificationFixtures,
  review: reviewFixtures,
  ranking: rankingFixtures,
  biddingSettings: biddingSettingsFixtures,
};
