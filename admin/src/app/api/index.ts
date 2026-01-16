// API Client Barrel Export - NỘI THẤT NHANH Admin Dashboard
// Re-exports all API modules for backward compatibility

// Client utilities
export { apiFetch, API_BASE } from './client';
export type { FetchOptions } from './client';

// Auth APIs
export { authApi, accountApi } from './auth';
export type { SessionInfo } from './auth';

// Content APIs
export {
  pagesApi,
  sectionsApi,
  mediaApi,
  blogCategoriesApi,
  blogPostsApi,
  blogCommentsApi,
  leadsApi,
  notificationTemplatesApi,
} from './content';
export type { NotificationTemplate, RenderedTemplate } from './content';

// Users APIs
export {
  usersApi,
  regionsApi,
} from './users';

// Settings APIs
export {
  settingsApi,
  serviceFeesApi,
  serviceCategoriesApi,
  unitPricesApi,
  materialsApi,
  materialCategoriesApi,
  formulasApi,
  googleSheetsApi,
} from './settings';
export type { ServiceFee, GoogleSheetsStatus } from './settings';

// Dashboard APIs
export { dashboardApi } from './dashboard';
export type {
  LeadsStats,
  BlogPostsStats,
  UsersStats,
  MediaStats,
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
  FurnitureFee,
  FurnitureQuotation,
  FurnitureQuotationItem,
  FurnitureQuotationFee,
} from './furniture';

// API Keys APIs
export { apiKeysApi } from './api-keys';
export type {
  ApiKey,
  ApiKeyScope,
  ApiKeyStatus,
  EndpointGroup,
  ApiKeyUsageLog,
  CreateApiKeyInput,
  UpdateApiKeyInput,
  ListApiKeysParams,
  CreateApiKeyResponse,
  TestApiKeyResult,
} from './api-keys';

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
