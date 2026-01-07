/**
 * Vitest Workspace Configuration
 * Unified test runner for API and Admin apps
 */

import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'api',
      include: ['api/src/**/*.test.ts'],
      environment: 'node',
      setupFiles: ['./api/src/test-setup.ts'],
      globals: true,
    },
  },
  {
    test: {
      name: 'admin',
      include: ['admin/src/**/*.test.ts'],
      environment: 'jsdom',
      setupFiles: ['./admin/src/test-setup.ts'],
      globals: true,
    },
  },
  {
    test: {
      name: 'landing',
      include: ['landing/src/**/*.test.ts'],
      environment: 'jsdom',
      setupFiles: ['./landing/src/test-setup.ts'],
      globals: true,
    },
  },
]);