// API Client Barrel Export - ANH THỢ XÂY Admin Dashboard
// Re-exports all API modules for backward compatibility

// Client utilities
export { apiFetch, API_BASE } from './client';
export type { FetchOptions } from './client';

// Auth APIs
export { authApi, accountApi } from './auth';
export type { SessionInfo } from './auth';

// Bidding APIs
export {
  projectsApi,
  bidsApi,
  escrowsApi,
  feesApi,
  matchesApi,
  disputesApi,
} from './bidding';

// Content APIs
export {
  pagesApi,
  sectionsApi,
  mediaApi,
  blogCategoriesApi,
  blogPostsApi,
  blogCommentsApi,
  leadsApi,
} from './content';

// Users APIs
export {
  usersApi,
  contractorsApi,
  regionsApi,
} from './users';

// Settings APIs
export {
  settingsApi,
  biddingSettingsApi,
  serviceFeesApi,
  serviceCategoriesApi,
  unitPricesApi,
  materialsApi,
  materialCategoriesApi,
  formulasApi,
  googleSheetsApi,
} from './settings';
export type { ServiceFee, GoogleSheetsStatus } from './settings';

// Communication APIs
export {
  notificationTemplatesApi,
  chatApi,
} from './communication';
export type { NotificationTemplate, RenderedTemplate } from './communication';

// Interior APIs
export {
  interiorDevelopersApi,
  interiorDevelopmentsApi,
  interiorBuildingsApi,
  interiorBuildingUnitsApi,
  interiorLayoutsApi,
  interiorPackagesApi,
  interiorSurchargesApi,
  interiorSettingsApi,
  interiorRoomTypesApi,
  interiorFurnitureCategoriesApi,
  interiorFurnitureItemsApi,
  interiorQuotesApi,
} from './interior';

// Interior Sync APIs
export { interiorSyncApi } from './interior-sync';
export type {
  SyncError,
  SheetSyncResult,
  PullResult,
  PushResult,
  ChangeType,
  PreviewRow,
  PreviewResult,
  SyncStatus,
  SyncDirection,
  SyncLogStatus,
  SyncLogEntry,
  SyncLogsResponse,
  SheetType,
} from './interior-sync';

// Dashboard APIs
export { dashboardApi } from './dashboard';
export type {
  LeadsStats,
  ProjectsStats,
  BidsStats,
  ContractorsStats,
  InteriorQuotesStats,
  BlogPostsStats,
  UsersStats,
  MediaStats,
  PendingProject,
  PendingBid,
  PendingContractor,
  PendingItems,
  DashboardStats,
  ActivityType,
  ActivityItem,
} from './dashboard';

// Backward compatible combined api export
export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const { authApi } = await import('./auth');
      return authApi.login(email, password);
    },
    logout: async () => {
      const { authApi } = await import('./auth');
      return authApi.logout();
    },
    me: async () => {
      const { authApi } = await import('./auth');
      return authApi.me();
    },
  },
};
