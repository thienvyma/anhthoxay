/**
 * Types for ApiKeyDetailPanel component
 *
 * **Feature: admin-guide-api-keys**
 */

import type { ApiKey } from '../../../../api/api-keys';

/**
 * Props for ApiKeyDetailPanel component
 */
export interface ApiKeyDetailPanelProps {
  apiKey: ApiKey | null;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * Endpoint details for display
 */
export interface EndpointDetail {
  method: string;
  path: string;
  desc: string;
}

/**
 * Endpoint group details structure
 */
export interface EndpointGroupDetail {
  label: string;
  description: string;
  adminPage: string;
  icon: string;
  endpoints: EndpointDetail[];
}

/**
 * Result badge styling
 */
export interface ResultBadge {
  bg: string;
  color: string;
  label: string;
}

/**
 * Re-export types from api-keys
 */
export type { ApiKey, ApiKeyUsageLog, EndpointGroup } from '../../../../api/api-keys';
