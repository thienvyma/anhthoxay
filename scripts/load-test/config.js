/**
 * Load Test Configuration
 * Shared configuration for all k6 load test scenarios
 */

// Base URL from environment or default
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:4202';

// Authentication token for protected endpoints
export const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Default thresholds for all tests
export const DEFAULT_THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  http_reqs: ['rate>100'],
};

// Strict thresholds for critical endpoints
export const STRICT_THRESHOLDS = {
  http_req_duration: ['p(95)<200', 'p(99)<500'],
  http_req_failed: ['rate<0.001'],
  http_reqs: ['rate>200'],
};

// Health check thresholds (must be very fast)
export const HEALTH_THRESHOLDS = {
  http_req_duration: ['p(95)<50', 'p(99)<100'],
  http_req_failed: ['rate<0.001'],
};

// Common headers
export const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (includeAuth && AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  return headers;
};

// Endpoint groups for testing
export const ENDPOINTS = {
  // Public endpoints (no auth required)
  public: {
    health: '/health/live',
    ready: '/health/ready',
    regions: '/api/regions',
    categories: '/service-categories',
    materials: '/materials',
    settings: '/settings',
    blogPosts: '/blog/posts',
  },
  
  // Protected endpoints (auth required)
  protected: {
    me: '/api/auth/me',
    leads: '/leads',
    users: '/api/users',
  },
};

// Virtual user scenarios
export const VU_SCENARIOS = {
  light: { vus: 10, duration: '1m' },
  normal: { vus: 50, duration: '5m' },
  heavy: { vus: 100, duration: '5m' },
  stress: { vus: 200, duration: '10m' },
  spike: {
    stages: [
      { duration: '1m', target: 50 },
      { duration: '30s', target: 200 },
      { duration: '1m', target: 200 },
      { duration: '30s', target: 50 },
      { duration: '1m', target: 50 },
    ],
  },
};
