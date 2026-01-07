/**
 * Baseline Load Test
 * Tests normal traffic patterns against public endpoints
 * 
 * Run: k6 run scripts/load-test/baseline.js
 * With custom URL: k6 run -e BASE_URL=https://api.example.com scripts/load-test/baseline.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { BASE_URL, DEFAULT_THRESHOLDS, HEALTH_THRESHOLDS, getHeaders, ENDPOINTS } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const apiDuration = new Trend('api_duration');
const requestsPerEndpoint = new Counter('requests_per_endpoint');

export const options = {
  vus: 50,
  duration: '5m',
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    'health_check_duration': ['p(95)<50', 'p(99)<100'],
    'api_duration': ['p(95)<500', 'p(99)<1000'],
    'errors': ['rate<0.01'],
  },
};

export default function () {
  const headers = getHeaders();
  
  group('Health Checks', () => {
    // Liveness probe
    const liveRes = http.get(`${BASE_URL}${ENDPOINTS.public.health}`, { headers });
    check(liveRes, {
      'liveness status 200': (r) => r.status === 200,
      'liveness has status': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'healthy' || body.status === 'ok';
        } catch {
          return false;
        }
      },
    });
    healthCheckDuration.add(liveRes.timings.duration);
    requestsPerEndpoint.add(1, { endpoint: 'health_live' });
    errorRate.add(liveRes.status !== 200);
    
    // Readiness probe
    const readyRes = http.get(`${BASE_URL}${ENDPOINTS.public.ready}`, { headers });
    check(readyRes, {
      'readiness status 200': (r) => r.status === 200,
    });
    healthCheckDuration.add(readyRes.timings.duration);
    requestsPerEndpoint.add(1, { endpoint: 'health_ready' });
    errorRate.add(readyRes.status !== 200);
  });
  
  sleep(0.5);
  
  group('Public API Endpoints', () => {
    // Regions endpoint
    const regionsRes = http.get(`${BASE_URL}${ENDPOINTS.public.regions}`, { headers });
    check(regionsRes, {
      'regions status 200': (r) => r.status === 200,
      'regions returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data) || Array.isArray(body);
        } catch {
          return false;
        }
      },
    });
    apiDuration.add(regionsRes.timings.duration);
    requestsPerEndpoint.add(1, { endpoint: 'regions' });
    errorRate.add(regionsRes.status !== 200);
    
    // Service categories endpoint
    const categoriesRes = http.get(`${BASE_URL}${ENDPOINTS.public.categories}`, { headers });
    check(categoriesRes, {
      'categories status 200': (r) => r.status === 200,
    });
    apiDuration.add(categoriesRes.timings.duration);
    requestsPerEndpoint.add(1, { endpoint: 'categories' });
    errorRate.add(categoriesRes.status !== 200);
    
    // Materials endpoint
    const materialsRes = http.get(`${BASE_URL}${ENDPOINTS.public.materials}`, { headers });
    check(materialsRes, {
      'materials status 200': (r) => r.status === 200,
    });
    apiDuration.add(materialsRes.timings.duration);
    requestsPerEndpoint.add(1, { endpoint: 'materials' });
    errorRate.add(materialsRes.status !== 200);
    
    // Settings endpoint
    const settingsRes = http.get(`${BASE_URL}${ENDPOINTS.public.settings}`, { headers });
    check(settingsRes, {
      'settings status 200': (r) => r.status === 200,
    });
    apiDuration.add(settingsRes.timings.duration);
    requestsPerEndpoint.add(1, { endpoint: 'settings' });
    errorRate.add(settingsRes.status !== 200);
  });
  
  sleep(1);
  
  group('Blog Endpoints', () => {
    // Blog posts list
    const postsRes = http.get(`${BASE_URL}${ENDPOINTS.public.blogPosts}`, { headers });
    check(postsRes, {
      'blog posts status 200': (r) => r.status === 200,
    });
    apiDuration.add(postsRes.timings.duration);
    requestsPerEndpoint.add(1, { endpoint: 'blog_posts' });
    errorRate.add(postsRes.status !== 200);
  });
  
  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'scripts/load-test/results/baseline-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  
  let summary = '\n========== BASELINE LOAD TEST SUMMARY ==========\n\n';
  
  // Request metrics
  summary += '📊 Request Metrics:\n';
  summary += `   Total Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `   Request Rate: ${(metrics.http_reqs?.values?.rate || 0).toFixed(2)}/s\n`;
  summary += `   Failed Requests: ${(metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(2)}%\n\n`;
  
  // Latency metrics
  summary += '⏱️ Latency Metrics:\n';
  summary += `   p50: ${(metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms\n`;
  summary += `   p95: ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   p99: ${(metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms\n`;
  summary += `   max: ${(metrics.http_req_duration?.values?.max || 0).toFixed(2)}ms\n\n`;
  
  // Health check metrics
  summary += '🏥 Health Check Latency:\n';
  summary += `   p95: ${(metrics.health_check_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   p99: ${(metrics.health_check_duration?.values?.['p(99)'] || 0).toFixed(2)}ms\n\n`;
  
  // API metrics
  summary += '🔌 API Latency:\n';
  summary += `   p95: ${(metrics.api_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   p99: ${(metrics.api_duration?.values?.['p(99)'] || 0).toFixed(2)}ms\n\n`;
  
  // Thresholds
  summary += '✅ Threshold Results:\n';
  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const status = threshold.ok ? '✓' : '✗';
    summary += `   ${status} ${name}\n`;
  }
  
  summary += '\n================================================\n';
  
  return summary;
}
