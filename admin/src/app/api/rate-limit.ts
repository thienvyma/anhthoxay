/**
 * Rate Limit API Client
 *
 * Handles rate limit monitoring and metrics API calls.
 *
 * **Feature: production-scalability**
 * **Requirements: 7.3, 7.5**
 */

import { apiFetch } from './client';

// ============================================
// TYPES
// ============================================

export interface EndpointViolationStats {
  path: string;
  count: number;
  uniqueIPs: number;
}

export interface IPViolationStats {
  ip: string;
  count: number;
}

export interface RateLimitMetrics {
  totalViolations: number;
  violationsByEndpoint: EndpointViolationStats[];
  topViolatingIPs: IPViolationStats[];
  lastHourViolations: number;
}

export interface RateLimitDashboard {
  summary: {
    totalViolations: number;
    lastHourViolations: number;
    uniqueEndpoints: number;
    uniqueIPs: number;
  };
  topViolatingIPs: IPViolationStats[];
  topViolatingEndpoints: EndpointViolationStats[];
  alertThreshold: {
    threshold: number;
    windowMinutes: number;
    description: string;
  };
}

export interface IPViolationCount {
  ip: string;
  violationCount: number;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get rate limit metrics for the last hour
 */
export async function getRateLimitMetrics(): Promise<RateLimitMetrics> {
  return apiFetch<RateLimitMetrics>('/api/admin/rate-limits/metrics');
}

/**
 * Get rate limit dashboard data
 */
export async function getRateLimitDashboard(): Promise<RateLimitDashboard> {
  return apiFetch<RateLimitDashboard>('/api/admin/rate-limits/dashboard');
}

/**
 * Get violation count for a specific IP
 */
export async function getViolationCountForIP(ip: string): Promise<IPViolationCount> {
  return apiFetch<IPViolationCount>(`/api/admin/rate-limits/violations/${encodeURIComponent(ip)}`);
}

// Export as namespace
export const rateLimitApi = {
  getMetrics: getRateLimitMetrics,
  getDashboard: getRateLimitDashboard,
  getViolationCountForIP,
};
