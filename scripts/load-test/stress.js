/**
 * Stress Test
 * Tests system behavior under increasing load to identify breaking point
 * 
 * Run: k6 run scripts/load-test/stress.js
 * With custom URL: k6 run -e BASE_URL=https://api.example.com scripts/load-test/stress.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { BASE_URL, getHeaders, ENDPOINTS } from './config.js';

// Custom metrics for stress testing
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const throughput = new Counter('throughput');
const activeVUs = new Gauge('active_vus');
const breakingPointVUs = new Gauge('breaking_point_vus');

// Track when errors start occurring
let firstErrorVU = 0;
let hasRecordedBreakingPoint = false;

export const options = {
  // Ramp-up stress test stages
  stages: [
    { duration: '2m', target: 50 },   // Warm up
    { duration: '3m', target: 100 },  // Normal load
    { duration: '3m', target: 200 },  // High load
    { duration: '3m', target: 300 },  // Stress load
    { duration: '3m', target: 400 },  // Breaking point search
    { duration: '2m', target: 500 },  // Maximum stress
    { duration: '2m', target: 0 },    // Recovery
  ],
  thresholds: {
    // More lenient thresholds for stress testing
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.1'], // Allow up to 10% errors
    'errors': ['rate<0.15'],
  },
};

export default function () {
  const headers = getHeaders();
  const currentVUs = __VU;
  
  activeVUs.add(currentVUs);
  
  group('Stress Test - Mixed Workload', () => {
    // Health check (lightweight)
    const healthRes = http.get(`${BASE_URL}${ENDPOINTS.public.health}`, { 
      headers,
      timeout: '10s',
    });
    
    const healthOk = check(healthRes, {
      'health check ok': (r) => r.status === 200,
    });
    
    responseTime.add(healthRes.timings.duration);
    throughput.add(1);
    
    if (!healthOk && !hasRecordedBreakingPoint) {
      firstErrorVU = currentVUs;
      hasRecordedBreakingPoint = true;
      breakingPointVUs.add(currentVUs);
    }
    
    errorRate.add(!healthOk);
    
    // Regions (cached endpoint)
    const regionsRes = http.get(`${BASE_URL}${ENDPOINTS.public.regions}`, { 
      headers,
      timeout: '30s',
    });
    
    const regionsOk = check(regionsRes, {
      'regions ok': (r) => r.status === 200,
    });
    
    responseTime.add(regionsRes.timings.duration);
    throughput.add(1);
    errorRate.add(!regionsOk);
    
    // Categories (database query)
    const categoriesRes = http.get(`${BASE_URL}${ENDPOINTS.public.categories}`, { 
      headers,
      timeout: '30s',
    });
    
    const categoriesOk = check(categoriesRes, {
      'categories ok': (r) => r.status === 200,
    });
    
    responseTime.add(categoriesRes.timings.duration);
    throughput.add(1);
    errorRate.add(!categoriesOk);
    
    // Materials (potentially larger response)
    const materialsRes = http.get(`${BASE_URL}${ENDPOINTS.public.materials}`, { 
      headers,
      timeout: '30s',
    });
    
    const materialsOk = check(materialsRes, {
      'materials ok': (r) => r.status === 200,
    });
    
    responseTime.add(materialsRes.timings.duration);
    throughput.add(1);
    errorRate.add(!materialsOk);
    
    // Blog posts (content endpoint)
    const blogRes = http.get(`${BASE_URL}${ENDPOINTS.public.blogPosts}`, { 
      headers,
      timeout: '30s',
    });
    
    const blogOk = check(blogRes, {
      'blog posts ok': (r) => r.status === 200,
    });
    
    responseTime.add(blogRes.timings.duration);
    throughput.add(1);
    errorRate.add(!blogOk);
  });
  
  // Variable sleep based on load - simulate realistic user behavior
  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  return {
    'stdout': stressSummary(data),
    'scripts/load-test/results/stress-summary.json': JSON.stringify(data, null, 2),
  };
}

function stressSummary(data) {
  const { metrics } = data;
  
  let summary = '\n========== STRESS TEST SUMMARY ==========\n\n';
  
  // Breaking point analysis
  summary += '🔥 Breaking Point Analysis:\n';
  if (firstErrorVU > 0) {
    summary += `   First errors at: ~${firstErrorVU} VUs\n`;
  } else {
    summary += `   No breaking point detected (system handled all load)\n`;
  }
  summary += `   Max VUs tested: ${metrics.vus?.values?.max || 0}\n\n`;
  
  // Request metrics
  summary += '📊 Request Metrics:\n';
  summary += `   Total Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `   Peak Request Rate: ${(metrics.http_reqs?.values?.rate || 0).toFixed(2)}/s\n`;
  summary += `   Total Throughput: ${metrics.throughput?.values?.count || 0}\n`;
  summary += `   Error Rate: ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\n\n`;
  
  // Latency under stress
  summary += '⏱️ Latency Under Stress:\n';
  summary += `   p50: ${(metrics.response_time?.values?.['p(50)'] || 0).toFixed(2)}ms\n`;
  summary += `   p95: ${(metrics.response_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   p99: ${(metrics.response_time?.values?.['p(99)'] || 0).toFixed(2)}ms\n`;
  summary += `   max: ${(metrics.response_time?.values?.max || 0).toFixed(2)}ms\n\n`;
  
  // HTTP metrics
  summary += '🌐 HTTP Metrics:\n';
  summary += `   Blocked (waiting for connection): ${(metrics.http_req_blocked?.values?.avg || 0).toFixed(2)}ms avg\n`;
  summary += `   Connecting: ${(metrics.http_req_connecting?.values?.avg || 0).toFixed(2)}ms avg\n`;
  summary += `   TLS handshake: ${(metrics.http_req_tls_handshaking?.values?.avg || 0).toFixed(2)}ms avg\n`;
  summary += `   Sending: ${(metrics.http_req_sending?.values?.avg || 0).toFixed(2)}ms avg\n`;
  summary += `   Waiting (TTFB): ${(metrics.http_req_waiting?.values?.avg || 0).toFixed(2)}ms avg\n`;
  summary += `   Receiving: ${(metrics.http_req_receiving?.values?.avg || 0).toFixed(2)}ms avg\n\n`;
  
  // Recommendations
  summary += '💡 Recommendations:\n';
  const errorRateValue = (metrics.errors?.values?.rate || 0) * 100;
  const p99Latency = metrics.response_time?.values?.['p(99)'] || 0;
  
  if (errorRateValue > 5) {
    summary += `   ⚠️ High error rate (${errorRateValue.toFixed(2)}%) - consider scaling or optimizing\n`;
  }
  if (p99Latency > 2000) {
    summary += `   ⚠️ High p99 latency (${p99Latency.toFixed(0)}ms) - investigate slow queries\n`;
  }
  if (firstErrorVU > 0 && firstErrorVU < 200) {
    summary += `   ⚠️ Breaking point at ${firstErrorVU} VUs - consider horizontal scaling\n`;
  }
  if (errorRateValue < 1 && p99Latency < 1000) {
    summary += `   ✅ System performed well under stress\n`;
  }
  
  // Thresholds
  summary += '\n✅ Threshold Results:\n';
  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const status = threshold.ok ? '✓' : '✗';
    summary += `   ${status} ${name}\n`;
  }
  
  summary += '\n=============================================\n';
  
  return summary;
}
