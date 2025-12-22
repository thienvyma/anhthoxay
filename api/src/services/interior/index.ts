// Types
export * from './types';

// Developer service
export * as developerService from './developer.service';
export { generateSlug } from './developer.service';

// Development service
export * as developmentService from './development.service';

// Building service
export * as buildingService from './building.service';
export {
  generateUnitCode,
  parseUnitCode,
  validateFloorRange,
  validateAxisLabels,
} from './building.service';

// Building Unit service
export * as buildingUnitService from './building-unit.service';

// Layout service
export * as layoutService from './layout.service';
export { validateRoomAreasSum } from './layout.service';

// Package service
export * as packageService from './package.service';
export { calculatePackageTotals } from './package.service';

// Surcharge service
export * as surchargeService from './surcharge.service';
export {
  evaluateSurchargeConditions,
  calculateSurchargeAmount,
} from './surcharge.service';

// Quote Settings service
export * as quoteSettingsService from './quote-settings.service';

// Room Type service
export * as roomTypeService from './room-type.service';

// Furniture service
export * as furnitureService from './furniture.service';
export { generateSlug as generateFurnitureSlug } from './furniture.service';

// Quote service
export * as quoteService from './quote.service';
export {
  calculateQuote,
  saveQuote,
  getQuoteById,
  getQuoteByCode,
  listQuotes,
  updateQuoteStatus,
  updateExpiredQuotes,
  exportQuotesToCSV,
  deleteQuote,
} from './quote.service';
