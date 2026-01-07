/**
 * Metrics Reporter
 * Utility module for generating detailed metrics reports
 * 
 * This module provides functions to format and export load test metrics
 * in various formats (JSON, CSV, HTML)
 */

/**
 * Calculate percentile from sorted array
 */
export function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format bytes in human-readable format
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Generate latency histogram
 */
export function generateHistogram(values, buckets = 10) {
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const bucketSize = (max - min) / buckets;
  
  const histogram = Array(buckets).fill(0);
  
  for (const value of values) {
    const bucketIndex = Math.min(
      Math.floor((value - min) / bucketSize),
      buckets - 1
    );
    histogram[bucketIndex]++;
  }
  
  return histogram.map((count, i) => ({
    range: `${formatDuration(min + i * bucketSize)} - ${formatDuration(min + (i + 1) * bucketSize)}`,
    count,
    percentage: ((count / values.length) * 100).toFixed(2),
  }));
}

/**
 * Generate detailed metrics report
 */
export function generateDetailedReport(data) {
  const { metrics } = data;
  
  return {
    summary: {
      totalRequests: metrics.http_reqs?.values?.count || 0,
      requestRate: metrics.http_reqs?.values?.rate || 0,
      failedRequests: metrics.http_req_failed?.values?.passes || 0,
      errorRate: (metrics.http_req_failed?.values?.rate || 0) * 100,
    },
    latency: {
      min: metrics.http_req_duration?.values?.min || 0,
      avg: metrics.http_req_duration?.values?.avg || 0,
      med: metrics.http_req_duration?.values?.med || 0,
      max: metrics.http_req_duration?.values?.max || 0,
      p50: metrics.http_req_duration?.values?.['p(50)'] || 0,
      p90: metrics.http_req_duration?.values?.['p(90)'] || 0,
      p95: metrics.http_req_duration?.values?.['p(95)'] || 0,
      p99: metrics.http_req_duration?.values?.['p(99)'] || 0,
    },
    throughput: {
      dataReceived: metrics.data_received?.values?.count || 0,
      dataSent: metrics.data_sent?.values?.count || 0,
      dataReceivedRate: metrics.data_received?.values?.rate || 0,
      dataSentRate: metrics.data_sent?.values?.rate || 0,
    },
    connections: {
      blocked: metrics.http_req_blocked?.values?.avg || 0,
      connecting: metrics.http_req_connecting?.values?.avg || 0,
      tlsHandshaking: metrics.http_req_tls_handshaking?.values?.avg || 0,
      sending: metrics.http_req_sending?.values?.avg || 0,
      waiting: metrics.http_req_waiting?.values?.avg || 0,
      receiving: metrics.http_req_receiving?.values?.avg || 0,
    },
    thresholds: Object.entries(data.thresholds || {}).map(([name, result]) => ({
      name,
      passed: result.ok,
    })),
  };
}

/**
 * Generate CSV report
 */
export function generateCSVReport(data) {
  const report = generateDetailedReport(data);
  
  let csv = 'Metric,Value\n';
  
  // Summary
  csv += `Total Requests,${report.summary.totalRequests}\n`;
  csv += `Request Rate (req/s),${report.summary.requestRate.toFixed(2)}\n`;
  csv += `Failed Requests,${report.summary.failedRequests}\n`;
  csv += `Error Rate (%),${report.summary.errorRate.toFixed(2)}\n`;
  
  // Latency
  csv += `Latency Min (ms),${report.latency.min.toFixed(2)}\n`;
  csv += `Latency Avg (ms),${report.latency.avg.toFixed(2)}\n`;
  csv += `Latency p50 (ms),${report.latency.p50.toFixed(2)}\n`;
  csv += `Latency p90 (ms),${report.latency.p90.toFixed(2)}\n`;
  csv += `Latency p95 (ms),${report.latency.p95.toFixed(2)}\n`;
  csv += `Latency p99 (ms),${report.latency.p99.toFixed(2)}\n`;
  csv += `Latency Max (ms),${report.latency.max.toFixed(2)}\n`;
  
  // Throughput
  csv += `Data Received (bytes),${report.throughput.dataReceived}\n`;
  csv += `Data Sent (bytes),${report.throughput.dataSent}\n`;
  
  return csv;
}

/**
 * Generate HTML report
 */
export function generateHTMLReport(data, testName = 'Load Test') {
  const report = generateDetailedReport(data);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${testName} Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .metric:last-child { border-bottom: none; }
    .metric-name { color: #666; }
    .metric-value { font-weight: bold; color: #333; }
    .good { color: #28a745; }
    .warning { color: #ffc107; }
    .bad { color: #dc3545; }
    .threshold { padding: 5px 10px; border-radius: 4px; margin: 5px 0; }
    .threshold.passed { background: #d4edda; color: #155724; }
    .threshold.failed { background: #f8d7da; color: #721c24; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 ${testName} Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    
    <div class="grid">
      <div class="card">
        <h2>📈 Summary</h2>
        <div class="metric">
          <span class="metric-name">Total Requests</span>
          <span class="metric-value">${report.summary.totalRequests.toLocaleString()}</span>
        </div>
        <div class="metric">
          <span class="metric-name">Request Rate</span>
          <span class="metric-value">${report.summary.requestRate.toFixed(2)} req/s</span>
        </div>
        <div class="metric">
          <span class="metric-name">Failed Requests</span>
          <span class="metric-value ${report.summary.failedRequests > 0 ? 'bad' : 'good'}">${report.summary.failedRequests}</span>
        </div>
        <div class="metric">
          <span class="metric-name">Error Rate</span>
          <span class="metric-value ${report.summary.errorRate > 1 ? 'bad' : report.summary.errorRate > 0.1 ? 'warning' : 'good'}">${report.summary.errorRate.toFixed(2)}%</span>
        </div>
      </div>
      
      <div class="card">
        <h2>⏱️ Latency</h2>
        <div class="metric">
          <span class="metric-name">p50</span>
          <span class="metric-value">${report.latency.p50.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">p90</span>
          <span class="metric-value">${report.latency.p90.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">p95</span>
          <span class="metric-value ${report.latency.p95 > 500 ? 'warning' : 'good'}">${report.latency.p95.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">p99</span>
          <span class="metric-value ${report.latency.p99 > 1000 ? 'bad' : report.latency.p99 > 500 ? 'warning' : 'good'}">${report.latency.p99.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">Max</span>
          <span class="metric-value">${report.latency.max.toFixed(2)}ms</span>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>🔌 Connection Breakdown</h2>
      <div class="grid">
        <div class="metric">
          <span class="metric-name">Blocked (waiting for connection)</span>
          <span class="metric-value">${report.connections.blocked.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">Connecting</span>
          <span class="metric-value">${report.connections.connecting.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">TLS Handshaking</span>
          <span class="metric-value">${report.connections.tlsHandshaking.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">Sending</span>
          <span class="metric-value">${report.connections.sending.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">Waiting (TTFB)</span>
          <span class="metric-value">${report.connections.waiting.toFixed(2)}ms</span>
        </div>
        <div class="metric">
          <span class="metric-name">Receiving</span>
          <span class="metric-value">${report.connections.receiving.toFixed(2)}ms</span>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>✅ Thresholds</h2>
      ${report.thresholds.map(t => `
        <div class="threshold ${t.passed ? 'passed' : 'failed'}">
          ${t.passed ? '✓' : '✗'} ${t.name}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Export metrics to multiple formats
 */
export function exportMetrics(data, testName = 'load-test') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `${testName}-${timestamp}`;
  
  return {
    [`scripts/load-test/results/${baseName}.json`]: JSON.stringify(generateDetailedReport(data), null, 2),
    [`scripts/load-test/results/${baseName}.csv`]: generateCSVReport(data),
    [`scripts/load-test/results/${baseName}.html`]: generateHTMLReport(data, testName),
  };
}
