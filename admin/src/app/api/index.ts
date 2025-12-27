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

// Dashboard APIs
export { dashboardApi } from './dashboard';
export type {
  LeadsStats,
  ProjectsStats,
  BidsStats,
  ContractorsStats,
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

// Furniture APIs
export {
  furnitureDevelopersApi,
  furnitureProjectsApi,
  furnitureBuildingsApi,
  furnitureLayoutsApi,
  furnitureApartmentTypesApi,
  furnitureCategoriesApi,
  furnitureProductsApi,
  furnitureCombosApi,
  furnitureFeesApi,
  furnitureDataApi,
  furnitureQuotationsApi,
} from './furniture';
export type {
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
  FurnitureLayout,
  FurnitureApartmentType,
  FurnitureCategory,
  FurnitureProduct,
  FurnitureCombo,
  FurnitureComboItem,
  FurnitureFee,
  FurnitureQuotation,
  FurnitureQuotationItem,
  FurnitureQuotationFee,
} from './furniture';

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
