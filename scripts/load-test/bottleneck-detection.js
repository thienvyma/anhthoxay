/**
 * Bottleneck Detection Test
 * Identifies performance bottlenecks by testing individual components
 * 
 * Run: k6 run scripts/load-test/bottleneck-detection.js
 * With custom URL: k6 run -e BASE_URL=https://api.example.com scripts/load-test/bottleneck-detection.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { BASE_URL, getHeaders, ENDPOINTS } from './config.js';

// Component-specific metrics
const healthLatency = new Trend('health_latency');
const databaseLatency = new Trend('database_latency');
const cacheLatency = new Trend('cache_latency');
const staticLatency = new Trend('static_latency');
const complexLatency = new Trend('complex_latency');

const healthErrors = new Rate('health_errors');
const databaseErrors = new Rate('database_errors');
const cacheErrors = new Rate('cache_errors');
const staticErrors = new Rate('static_errors');
const complexErrors = new Rate('complex_errors');

const componentRequests = new Counter('component_requests');

// Bottleneck detection thresholds
const BOTTLENECK_THRESHOLDS = {
  health: 50,      // Health checks should be < 50ms
  cache: 100,      // Cached responses should be < 100ms
  database: 300,   // Database queries should be < 300ms
  static: 200,     // Static content should be < 200ms
  complex: 500,    // Complex operations should be < 500ms
};

export const options = {
  scenarios: {
    // Test each component separately
    health_check: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      exec: 'testHealthCheck',
      tags: { component: 'health' },
    },
    cached_endpoints: {
      executor: 'constant-vus',
      vus: 30,
      duration: '2m',
      startTime: '2m',
      exec: 'testCachedEndpoints',
      tags: { component: 'cache' },
    },
    database_endpoints: {
      executor: 'constant-vus',
      vus: 30,
      duration: '2m',
      startTime: '4m',
      exec: 'testDatabaseEndpoints',
      tags: { component: 'database' },
    },
    static_content: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      startTime: '6m',
      exec: 'testStaticContent',
      tags: { component: 'static' },
    },
    complex_operations: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      startTime: '8m',
      exec: 'testComplexOperations',
      tags: { component: 'complex' },
    },
  },
  thresholds: {
    'health_latency': [`p(95)<${BOTTLENECK_THRESHOLDS.health}`],
    'cache_latency': [`p(95)<${BOTTLENECK_THRESHOLDS.cache}`],
    'database_latency': [`p(95)<${BOTTLENECK_THRESHOLDS.database}`],
    'static_latency': [`p(95)<${BOTTLENECK_THRESHOLDS.static}`],
    'complex_latency': [`p(95)<${BOTTLENECK_THRESHOLDS.complex}`],
    'health_errors': ['rate<0.01'],
    'database_errors': ['rate<0.01'],
    'cache_errors': ['rate<0.01'],
    'static_errors': ['rate<0.01'],
    'complex_errors': ['rate<0.05'],
  },
};

// Test health check endpoints (should be fastest)
export function testHealthCheck() {
  const headers = getHeaders();
  
  const res = http.get(`${BASE_URL}${ENDPOINTS.public.health}`, { headers });
  
  const success = check(res, {
    'health status 200': (r) => r.status === 200,
    'health response fast': (r) => r.timings.duration < BOTTLENECK_THRESHOLDS.health,
  });
  
  healthLatency.add(res.timings.duration);
  healthErrors.add(!success);
  componentRequests.add(1, { component: 'health' });
  
  sleep(0.1);
}

// Test cached endpoints (regions, settings - should be fast due to caching)
export function testCachedEndpoints() {
  const headers = getHeaders();
  
  group('Cached Endpoints', () => {
    // Regions (typically cached)
    const regionsRes = http.get(`${BASE_URL}${ENDPOINTS.public.regions}`, { headers });
    const regionsOk = check(regionsRes, {
      'regions status 200': (r) => r.status === 200,
      'regions response fast': (r) => r.timings.duration < BOTTLENECK_THRESHOLDS.cache,
    });
    cacheLatency.add(regionsRes.timings.duration);
    cacheErrors.add(!regionsOk);
    componentRequests.add(1, { component: 'cache', endpoint: 'regions' });
    
    // Settings (typically cached)
    const settingsRes = http.get(`${BASE_URL}${ENDPOINTS.public.settings}`, { headers });
    const settingsOk = check(settingsRes, {
      'settings status 200': (r) => r.status === 200,
      'settings response fast': (r) => r.timings.duration < BOTTLENECK_THRESHOLDS.cache,
    });
    cacheLatency.add(settingsRes.timings.duration);
    cacheErrors.add(!settingsOk);
    componentRequests.add(1, { component: 'cache', endpoint: 'settings' });
  });
  
  sleep(0.2);
}

// Test database-heavy endpoints
export function testDatabaseEndpoints() {
  const headers = getHeaders();
  
  group('Database Endpoints', () => {
    // Categories (database query)
    const categoriesRes = http.get(`${BASE_URL}${ENDPOINTS.public.categories}`, { headers });
    const categoriesOk = check(categoriesRes, {
      'categories status 200': (r) => r.status === 200,
      'categories response acceptable': (r) => r.timings.duration < BOTTLENECK_THRESHOLDS.database,
    });
    databaseLatency.add(categoriesRes.timings.duration);
    databaseErrors.add(!categoriesOk);
    componentRequests.add(1, { component: 'database', endpoint: 'categories' });
    
    // Materials (database query with potential joins)
    const materialsRes = http.get(`${BASE_URL}${ENDPOINTS.public.materials}`, { headers });
    const materialsOk = check(materialsRes, {
      'materials status 200': (r) => r.status === 200,
      'materials response acceptable': (r) => r.timings.duration < BOTTLENECK_THRESHOLDS.database,
    });
    databaseLatency.add(materialsRes.timings.duration);
    databaseErrors.add(!materialsOk);
    componentRequests.add(1, { component: 'database', endpoint: 'materials' });
  });
  
  sleep(0.3);
}

// Test static content endpoints
export function testStaticContent() {
  const headers = getHeaders();
  
  group('Static Content', () => {
    // Blog posts (content delivery)
    const blogRes = http.get(`${BASE_URL}${ENDPOINTS.public.blogPosts}`, { headers });
    const blogOk = check(blogRes, {
      'blog status 200': (r) => r.status === 200,
      'blog response acceptable': (r) => r.timings.duration < BOTTLENECK_THRESHOLDS.static,
    });
    staticLatency.add(blogRes.timings.duration);
    staticErrors.add(!blogOk);
    componentRequests.add(1, { component: 'static', endpoint: 'blog' });
  });
  
  sleep(0.2);
}

// Test complex operations (multiple database queries, aggregations)
export function testComplexOperations() {
  const headers = getHeaders();
  
  group('Complex Operations', () => {
    // Readiness check (checks multiple dependencies)
    const readyRes = http.get(`${BASE_URL}${ENDPOINTS.public.ready}`, { headers });
    const readyOk = check(readyRes, {
      'ready status 200': (r) => r.status === 200,
      'ready response acceptable': (r) => r.timings.duration < BOTTLENECK_THRESHOLDS.complex,
    });
    complexLatency.add(readyRes.timings.duration);
    complexErrors.add(!readyOk);
    componentRequests.add(1, { component: 'complex', endpoint: 'ready' });
  });
  
  sleep(0.3);
}

export function handleSummary(data) {
  return {
    'stdout': bottleneckSummary(data),
    'scripts/load-test/results/bottleneck-summary.json': JSON.stringify(data, null, 2),
  };
}

function bottleneckSummary(data) {
  const { metrics } = data;
  
  let summary = '\n========== BOTTLENECK DETECTION SUMMARY ==========\n\n';
  
  // Component analysis
  const components = [
    { name: 'Health Check', latency: metrics.health_latency, errors: metrics.health_errors, threshold: BOTTLENECK_THRESHOLDS.health },
    { name: 'Cached Endpoints', latency: metrics.cache_latency, errors: metrics.cache_errors, threshold: BOTTLENECK_THRESHOLDS.cache },
    { name: 'Database Endpoints', latency: metrics.database_latency, errors: metrics.database_errors, threshold: BOTTLENECK_THRESHOLDS.database },
    { name: 'Static Content', latency: metrics.static_latency, errors: metrics.static_errors, threshold: BOTTLENECK_THRESHOLDS.static },
    { name: 'Complex Operations', latency: metrics.complex_latency, errors: metrics.complex_errors, threshold: BOTTLENECK_THRESHOLDS.complex },
  ];
  
  summary += '🔍 Component Analysis:\n\n';
  
  const bottlenecks = [];
  
  for (const comp of components) {
    const p95 = comp.latency?.values?.['p(95)'] || 0;
    const p99 = comp.latency?.values?.['p(99)'] || 0;
    const errorRate = (comp.errors?.values?.rate || 0) * 100;
    const isBottleneck = p95 > comp.threshold;
    
    const status = isBottleneck ? '⚠️' : '✅';
    summary += `${status} ${comp.name}:\n`;
    summary += `   p95: ${p95.toFixed(2)}ms (threshold: ${comp.threshold}ms)\n`;
    summary += `   p99: ${p99.toFixed(2)}ms\n`;
    summary += `   Error Rate: ${errorRate.toFixed(2)}%\n\n`;
    
    if (isBottleneck) {
      bottlenecks.push({
        name: comp.name,
        p95,
        threshold: comp.threshold,
        severity: p95 / comp.threshold,
      });
    }
  }
  
  // Bottleneck ranking
  if (bottlenecks.length > 0) {
    summary += '🚨 BOTTLENECKS DETECTED:\n\n';
    bottlenecks.sort((a, b) => b.severity - a.severity);
    
    for (let i = 0; i < bottlenecks.length; i++) {
      const b = bottlenecks[i];
      summary += `   ${i + 1}. ${b.name}\n`;
      summary += `      - p95 latency: ${b.p95.toFixed(2)}ms\n`;
      summary += `      - Threshold: ${b.threshold}ms\n`;
      summary += `      - Severity: ${(b.severity * 100).toFixed(0)}% over threshold\n\n`;
    }
    
    summary += '💡 Recommendations:\n';
    for (const b of bottlenecks) {
      if (b.name === 'Database Endpoints') {
        summary += '   - Consider adding database indexes\n';
        summary += '   - Review slow queries\n';
        summary += '   - Consider read replicas\n';
      } else if (b.name === 'Cached Endpoints') {
        summary += '   - Check Redis connection\n';
        summary += '   - Increase cache TTL\n';
        summary += '   - Review cache hit rate\n';
      } else if (b.name === 'Health Check') {
        summary += '   - Simplify health check logic\n';
        summary += '   - Use async dependency checks\n';
      } else if (b.name === 'Complex Operations') {
        summary += '   - Consider breaking into smaller operations\n';
        summary += '   - Add caching for aggregations\n';
        summary += '   - Use background jobs for heavy processing\n';
      }
    }
  } else {
    summary += '✅ NO BOTTLENECKS DETECTED\n';
    summary += '   All components are performing within acceptable thresholds.\n';
  }
  
  // Thresholds
  summary += '\n✅ Threshold Results:\n';
  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const status = threshold.ok ? '✓' : '✗';
    summary += `   ${status} ${name}\n`;
  }
  
  summary += '\n==================================================\n';
  
  return summary;
}
