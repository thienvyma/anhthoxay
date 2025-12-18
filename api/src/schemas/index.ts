/**
 * Zod Schemas Index
 *
 * Central export point for all validation schemas organized by domain.
 * Import schemas from this file for consistent validation across the API.
 *
 * **Feature: api-refactoring**
 * **Requirements: 5.4**
 */

// ============================================
// AUTH SCHEMAS
// ============================================
export {
  loginSchema,
  registerSchema,
  refreshSchema,
  changePasswordSchema,
  type LoginInput,
  type RegisterInput,
  type RefreshInput,
  type ChangePasswordInput,
} from './auth.schema';

// ============================================
// PAGE SCHEMAS
// ============================================
export {
  createPageSchema,
  updatePageSchema,
  createSectionSchema,
  updateSectionSchema,
  sectionKinds,
  type CreatePageInput,
  type UpdatePageInput,
  type CreateSectionInput,
  type UpdateSectionInput,
  type SectionKind,
} from './pages.schema';

// ============================================
// PRICING SCHEMAS
// ============================================
export {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  createUnitPriceSchema,
  updateUnitPriceSchema,
  createMaterialCategorySchema,
  updateMaterialCategorySchema,
  createMaterialSchema,
  updateMaterialSchema,
  createFormulaSchema,
  updateFormulaSchema,
  calculateQuoteSchema,
  type CreateServiceCategoryInput,
  type UpdateServiceCategoryInput,
  type CreateUnitPriceInput,
  type UpdateUnitPriceInput,
  type CreateMaterialCategoryInput,
  type UpdateMaterialCategoryInput,
  type CreateMaterialInput,
  type UpdateMaterialInput,
  type CreateFormulaInput,
  type UpdateFormulaInput,
  type CalculateQuoteInput,
} from './pricing.schema';

// ============================================
// LEADS SCHEMAS
// ============================================
export {
  createLeadSchema,
  updateLeadSchema,
  leadsQuerySchema,
  type CreateLeadInput,
  type UpdateLeadInput,
  type LeadsQueryInput,
} from './leads.schema';

// ============================================
// BLOG SCHEMAS
// ============================================
export {
  createBlogCategorySchema,
  updateBlogCategorySchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  blogPostFilterSchema,
  createBlogCommentSchema,
  type CreateBlogCategoryInput,
  type UpdateBlogCategoryInput,
  type CreateBlogPostInput,
  type UpdateBlogPostInput,
  type BlogPostFilter,
  type CreateBlogCommentInput,
} from './blog.schema';

// ============================================
// MEDIA SCHEMAS
// ============================================
export {
  updateMediaSchema,
  type UpdateMediaInput,
} from './media.schema';

// ============================================
// SETTINGS SCHEMAS
// ============================================
export {
  updateSettingsSchema,
  type UpdateSettingsInput,
} from './settings.schema';
