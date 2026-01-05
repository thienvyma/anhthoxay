/**
 * Project Service
 *
 * Re-exports from refactored project module for backward compatibility.
 *
 * **Feature: bidding-phase2-core, codebase-refactor-large-files**
 * **Requirements: 2.1-2.6, 3.1-3.6, 4.1-4.5, 5.1-5.5, 7.5**
 */

// Re-export everything from the refactored module
export {
  // Main service class
  ProjectService,
  // Types
  type ProjectWithRelations,
  type PublicProject,
  type ProjectListResult,
  type PublicProjectListResult,
  type PrismaProjectRaw,
  // Constants
  PROJECT_STATUS_TRANSITIONS,
  PROJECT_ERROR_STATUS_MAP,
  // Helpers
  getProjectInclude,
  parseJsonArray,
  transformProject,
  ProjectError,
} from './project/index';
