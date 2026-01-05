/**
 * Utility functions for ApiKeyDetailPanel component
 *
 * **Feature: admin-guide-api-keys**
 */

import { tokens } from '../../../../../theme';
import type { EndpointGroup } from '../../../../api/api-keys';
import type { ResultBadge } from './types';
import { ENDPOINT_GROUP_LABELS } from './constants';

/**
 * Parses allowed endpoints from JSON string
 * @param allowedEndpoints - JSON string of endpoint groups
 * @returns Array of endpoint group labels
 */
export function parseAllowedEndpoints(allowedEndpoints: string): string[] {
  try {
    const endpoints: EndpointGroup[] = JSON.parse(allowedEndpoints);
    return endpoints.map((e) => ENDPOINT_GROUP_LABELS[e] || e);
  } catch {
    return [];
  }
}

/**
 * Parses allowed endpoints from JSON string and returns raw values
 * @param allowedEndpoints - JSON string of endpoint groups
 * @returns Array of endpoint group values
 */
export function parseAllowedEndpointValues(allowedEndpoints: string): EndpointGroup[] {
  try {
    return JSON.parse(allowedEndpoints) as EndpointGroup[];
  } catch {
    return [];
  }
}

/**
 * Gets result badge styling based on status code
 * @param statusCode - HTTP status code
 * @returns Object with bg color, text color, and label
 */
export function getResultBadge(statusCode: number): ResultBadge {
  if (statusCode >= 200 && statusCode < 300) {
    return { bg: 'rgba(34, 197, 94, 0.15)', color: tokens.color.success, label: 'Thành công' };
  }
  if (statusCode >= 400 && statusCode < 500) {
    return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'Lỗi client' };
  }
  return { bg: 'rgba(239, 68, 68, 0.15)', color: tokens.color.error, label: 'Lỗi' };
}

/**
 * Formats date for usage log display (shorter format)
 * @param dateStr - ISO date string
 * @returns Formatted date string
 */
export function formatLogDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Gets method badge color based on HTTP method
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @returns Object with background and text color
 */
export function getMethodBadgeColors(method: string): { bg: string; color: string } {
  switch (method) {
    case 'GET':
      return { bg: tokens.color.successBg, color: tokens.color.success };
    case 'POST':
      return { bg: tokens.color.infoBg, color: tokens.color.info };
    case 'PUT':
      return { bg: tokens.color.warningBg, color: tokens.color.warning };
    case 'DELETE':
      return { bg: tokens.color.errorBg, color: tokens.color.error };
    default:
      return { bg: tokens.color.surfaceHover, color: tokens.color.muted };
  }
}
