/**
 * Product Service Module
 *
 * Re-exports all product-related services
 *
 * **Feature: furniture-product-restructure**
 */

// Calculation utilities
export {
  calculateProductPrice,
  calculateVariantPrice,
  calculatePriceRange,
} from './calculation.service';

// CRUD operations for ProductBase
export {
  createProductBase,
  getProductBaseById,
  getProductBasesGrouped,
  getProductBasesForAdmin,
  updateProductBase,
  deleteProductBase,
  transformToProductBaseWithDetails,
} from './crud.service';

// Mapping operations
export {
  addProductMapping,
  removeProductMapping,
  getProductMappings,
  bulkCreateMappings,
} from './mapping.service';

// Variant operations
export {
  createVariant,
  updateVariant,
  deleteVariant,
  getVariantById,
} from './variant.service';
export type { VariantWithMaterial } from './variant.service';

// Legacy operations (READ-ONLY)
export {
  getProducts,
  getProductsGrouped,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from './legacy.service';
