/**
 * IP Blocking Validation Schemas
 *
 * Zod schemas for IP blocking API endpoints.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.3, 14.4, 14.5, 14.6**
 */

import { z } from 'zod';

/**
 * Schema for blocking an IP manually
 */
export const BlockIPSchema = z.object({
  ip: z.string().min(1, 'IP address is required'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  duration: z.number().int().positive().optional(), // Duration in milliseconds
});

/**
 * Schema for unblocking an IP
 */
export const UnblockIPSchema = z.object({
  ip: z.string().min(1, 'IP address is required'),
});

/**
 * Schema for updating IP blocking configuration
 */
export const UpdateConfigSchema = z.object({
  threshold: z.number().int().min(1).max(1000).optional(),
  window: z.number().int().min(60000).max(3600000).optional(), // 1 min to 1 hour
  blockDuration: z.number().int().min(60000).max(86400000).optional(), // 1 min to 24 hours
  emergencyThreshold: z.number().int().min(1).max(500).optional(),
  emergencyBlockDuration: z.number().int().min(60000).max(172800000).optional(), // 1 min to 48 hours
});

/**
 * Schema for query parameters when listing blocked IPs
 */
export const ListBlockedIPsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  emergencyOnly: z.coerce.boolean().optional(),
});

/**
 * Schema for updating emergency mode rate limit configuration
 * 
 * **Validates: Requirements 14.5, 14.6**
 */
export const UpdateEmergencyConfigSchema = z.object({
  /** Rate limit multiplier (0.1 to 1.0, e.g., 0.5 = 50% of normal limits) */
  rateLimitMultiplier: z.number().min(0.1).max(1.0).optional(),
  /** Window multiplier (1.0 to 10.0, e.g., 2 = 2x longer window) */
  windowMultiplier: z.number().min(1.0).max(10.0).optional(),
  /** Whether CAPTCHA is required for all forms in emergency mode */
  requireCaptcha: z.boolean().optional(),
  /** Additional patterns to block (user agents, etc.) */
  blockedPatterns: z.array(z.string()).optional(),
});

/**
 * Schema for updating suspicious pattern detection configuration
 * 
 * **Validates: Requirements 14.5**
 */
export const UpdateSuspiciousPatternConfigSchema = z.object({
  /** User agents to flag as suspicious */
  suspiciousUserAgents: z.array(z.string()).optional(),
  /** Request rate threshold per second to trigger pattern detection */
  rapidRequestThreshold: z.number().int().min(1).max(100).optional(),
  /** Time window for rapid request detection (ms) */
  rapidRequestWindow: z.number().int().min(100).max(10000).optional(),
  /** Whether to auto-enable emergency mode on attack detection */
  autoEmergencyMode: z.boolean().optional(),
  /** Number of suspicious IPs to trigger auto emergency mode */
  autoEmergencyThreshold: z.number().int().min(1).max(100).optional(),
});

/**
 * Schema for activating emergency mode
 * 
 * **Validates: Requirements 14.5, 14.6**
 */
export const ActivateEmergencyModeSchema = z.object({
  /** Reason for activating emergency mode */
  reason: z.string().min(1).max(500).optional(),
  /** Duration in milliseconds (optional, uses default if not provided) */
  duration: z.number().int().min(60000).max(86400000).optional(), // 1 min to 24 hours
});

/**
 * Schema for updating CAPTCHA challenge rate configuration
 * 
 * **Validates: Requirements 14.5, 14.6**
 */
export const UpdateCaptchaChallengeConfigSchema = z.object({
  /** Base challenge rate (0.0 to 1.0) - probability of requiring CAPTCHA */
  baseChallengeRate: z.number().min(0).max(1).optional(),
  /** Challenge rate in emergency mode (0.0 to 1.0) */
  emergencyChallengeRate: z.number().min(0).max(1).optional(),
  /** Challenge rate for suspicious IPs (0.0 to 1.0) */
  suspiciousChallengeRate: z.number().min(0).max(1).optional(),
  /** Whether to always require CAPTCHA in emergency mode */
  alwaysRequireInEmergency: z.boolean().optional(),
  /** Paths that always require CAPTCHA */
  alwaysRequirePaths: z.array(z.string()).optional(),
  /** Paths that never require CAPTCHA */
  neverRequirePaths: z.array(z.string()).optional(),
});

export type BlockIPInput = z.infer<typeof BlockIPSchema>;
export type UnblockIPInput = z.infer<typeof UnblockIPSchema>;
export type UpdateConfigInput = z.infer<typeof UpdateConfigSchema>;
export type ListBlockedIPsQuery = z.infer<typeof ListBlockedIPsQuerySchema>;
export type UpdateEmergencyConfigInput = z.infer<typeof UpdateEmergencyConfigSchema>;
export type UpdateSuspiciousPatternConfigInput = z.infer<typeof UpdateSuspiciousPatternConfigSchema>;
export type ActivateEmergencyModeInput = z.infer<typeof ActivateEmergencyModeSchema>;
export type UpdateCaptchaChallengeConfigInput = z.infer<typeof UpdateCaptchaChallengeConfigSchema>;
