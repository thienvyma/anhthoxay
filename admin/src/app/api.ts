// API Client for Admin Dashboard - ANH THỢ XÂY
// This file re-exports from the modular api/ directory for backward compatibility

// Re-export everything from the modular API structure
export * from './api/index';

// Re-export client utilities
export { apiFetch, API_BASE } from './api/client';
export type { FetchOptions } from './api/client';

// Re-export Auth APIs
export { authApi, accountApi } from './api/auth';
export type { SessionInfo } from './api/auth';

// Re-export Bidding APIs
export {
  projectsApi,
  bidsApi,
  escrowsApi,
  feesApi,
  matchesApi,
  disputesApi,
} from './api/bidding';

// Re-export Content APIs
export {
  pagesApi,
  sectionsApi,
  mediaApi,
  blogCategoriesApi,
  blogPostsApi,
  blogCommentsApi,
  leadsApi,
} from './api/content';

// Re-export Users APIs
export {
  usersApi,
  contractorsApi,
  regionsApi,
} from './api/users';

// Re-export Settings APIs
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
} from './api/settings';
export type { ServiceFee, GoogleSheetsStatus } from './api/settings';

// Re-export Communication APIs
export {
  notificationTemplatesApi,
  chatApi,
} from './api/communication';
export type { NotificationTemplate, RenderedTemplate } from './api/communication';

// Re-export Furniture APIs
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
} from './api/furniture';
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
} from './api/furniture';
