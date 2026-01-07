/**
 * Landing Test Setup
 * Global test configuration for Landing app tests
 */

import { beforeAll, afterAll, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Setup JSDOM for DOM manipulation tests
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSDOM window type compatibility
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock ResizeObserver (used by some UI components)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_API_URL = 'http://localhost:3001';

// Global test hooks
beforeAll(async () => {
  // eslint-disable-next-line no-console -- Test setup logging
  console.info('🚀 Setting up Landing tests...');
});

afterAll(async () => {
  // eslint-disable-next-line no-console -- Test cleanup logging
  console.info('✅ Landing tests completed');
});


