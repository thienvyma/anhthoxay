# Load Testing Scripts

This directory contains k6 load testing scripts for the ANH THỢ XÂY API.

## Prerequisites

1. Install k6: https://k6.io/docs/getting-started/installation/

   ```bash
   # Windows (Chocolatey)
   choco install k6

   # macOS (Homebrew)
   brew install k6

   # Linux (apt)
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. Ensure the API is running:
   ```bash
   pnpm dev:api
   ```

## Test Scripts

### 1. Baseline Test (`baseline.js`)

Tests normal traffic patterns against public endpoints.

```bash
# Run with default settings (50 VUs, 5 minutes)
k6 run scripts/load-test/baseline.js

# Run with custom URL
k6 run -e BASE_URL=https://api.example.com scripts/load-test/baseline.js

# Run with more VUs
k6 run --vus 100 --duration 10m scripts/load-test/baseline.js
```

**Thresholds:**
- p95 latency < 500ms
- p99 latency < 1000ms
- Error rate < 1%
- Health check p95 < 50ms

### 2. Stress Test (`stress.js`)

Tests system behavior under increasing load to identify breaking point.

```bash
# Run stress test (ramps up to 500 VUs)
k6 run scripts/load-test/stress.js

# Run with custom URL
k6 run -e BASE_URL=https://api.example.com scripts/load-test/stress.js
```

**Stages:**
1. Warm up: 50 VUs for 2 minutes
2. Normal load: 100 VUs for 3 minutes
3. High load: 200 VUs for 3 minutes
4. Stress load: 300 VUs for 3 minutes
5. Breaking point: 400 VUs for 3 minutes
6. Maximum stress: 500 VUs for 2 minutes
7. Recovery: Ramp down to 0

### 3. Bottleneck Detection (`bottleneck-detection.js`)

Identifies performance bottlenecks by testing individual components.

```bash
# Run bottleneck detection
k6 run scripts/load-test/bottleneck-detection.js
```

**Components Tested:**
- Health checks (threshold: 50ms)
- Cached endpoints (threshold: 100ms)
- Database endpoints (threshold: 300ms)
- Static content (threshold: 200ms)
- Complex operations (threshold: 500ms)

## Configuration

Edit `config.js` to customize:

- `BASE_URL`: API base URL
- `AUTH_TOKEN`: JWT token for protected endpoints
- `DEFAULT_THRESHOLDS`: Default latency/error thresholds
- `ENDPOINTS`: Endpoint paths to test
- `VU_SCENARIOS`: Virtual user configurations

## Results

Test results are saved to `scripts/load-test/results/`:

- `*-summary.json`: Detailed metrics in JSON format
- `*-summary.csv`: Metrics in CSV format (when using metrics-reporter)
- `*-summary.html`: Visual HTML report (when using metrics-reporter)

## Interpreting Results

### Key Metrics

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| p95 Latency | < 200ms | 200-500ms | > 500ms |
| p99 Latency | < 500ms | 500-1000ms | > 1000ms |
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| Request Rate | > 100/s | 50-100/s | < 50/s |

### Bottleneck Indicators

1. **Database Bottleneck**: High latency on database endpoints
   - Solution: Add indexes, use read replicas, optimize queries

2. **Cache Bottleneck**: High latency on cached endpoints
   - Solution: Check Redis connection, increase cache TTL

3. **CPU Bottleneck**: High latency across all endpoints
   - Solution: Scale horizontally, optimize code

4. **Memory Bottleneck**: Increasing latency over time
   - Solution: Check for memory leaks, increase memory

## CI/CD Integration

Add to your CI pipeline:

```yaml
load-test:
  stage: test
  script:
    - k6 run --out json=results.json scripts/load-test/baseline.js
  artifacts:
    paths:
      - results.json
```

## Custom Scenarios

Create custom scenarios by importing from `config.js`:

```javascript
import { BASE_URL, getHeaders, ENDPOINTS } from './config.js';

export const options = {
  vus: 100,
  duration: '10m',
  thresholds: {
    http_req_duration: ['p(95)<300'],
  },
};

export default function () {
  // Your custom test logic
}
```
