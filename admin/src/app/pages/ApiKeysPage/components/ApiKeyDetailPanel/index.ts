/**
 * ApiKeyDetailPanel - Re-exports for backward compatibility
 *
 * **Feature: admin-guide-api-keys**
 */

// Main component
export { ApiKeyDetailPanel } from './ApiKeyDetailPanel';
export type { ApiKeyDetailPanelProps } from './types';

// Section components (for advanced usage)
export { InfoSection } from './InfoSection';
export { ExpirationWarning } from './ExpirationWarning';
export { UsageStats } from './UsageStats';
export { UsageLogs } from './UsageLogs';
export { EndpointGroups } from './EndpointGroups';

// Utils (for external usage)
export {
  parseAllowedEndpoints,
  parseAllowedEndpointValues,
  getResultBadge,
  formatLogDate,
  getMethodBadgeColors,
} from './utils';

// Constants
export { ENDPOINT_GROUP_DETAILS, ENDPOINT_GROUP_LABELS } from './constants';

// Types
export type {
  ApiKey,
  ApiKeyUsageLog,
  EndpointGroup,
  EndpointDetail,
  EndpointGroupDetail,
  ResultBadge,
} from './types';
