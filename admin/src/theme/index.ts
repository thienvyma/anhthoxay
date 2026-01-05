/**
 * Admin Theme - Re-exports adminTokens as tokens for admin app
 * This allows admin components to import from local theme
 * and use light mode tokens without changing import paths
 */
export { adminTokens as tokens, type AdminTokens as Tokens } from '@app/shared';
