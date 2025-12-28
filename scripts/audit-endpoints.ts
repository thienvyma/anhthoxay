/**
 * Endpoint Authentication Audit Script
 *
 * This script parses all route files and generates a report of:
 * - All endpoints and their HTTP methods
 * - Authentication middleware presence
 * - Role requirements
 * - Rate limiting status
 *
 * Usage: npx ts-node scripts/audit-endpoints.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface EndpointInfo {
  file: string;
  method: string;
  path: string;
  hasAuth: boolean;
  hasRoleCheck: boolean;
  roles: string[];
  hasRateLimit: boolean;
  hasValidation: boolean;
  line: number;
}

interface AuditReport {
  totalEndpoints: number;
  protectedEndpoints: number;
  unprotectedEndpoints: number;
  publicEndpoints: EndpointInfo[];
  protectedWithoutAuth: EndpointInfo[];
  allEndpoints: EndpointInfo[];
}

const ROUTES_DIR = path.join(__dirname, '../api/src/routes');

// Patterns to detect HTTP methods
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

// Patterns that indicate public endpoints (no auth needed)
const PUBLIC_PATH_PATTERNS = [
  /^\/api\/auth\/(login|signup|refresh)/,
  /^\/api\/blog\/posts$/,
  /^\/api\/blog\/posts\/[^/]+$/,
  /^\/api\/blog\/posts\/[^/]+\/comments$/,
  /^\/api\/settings\/public/,
  /^\/api\/settings\/bidding$/,
  /^\/api\/regions/,
  /^\/api\/service-fees$/,
  /^\/api\/leads$/,
  /^\/api\/projects$/,
  /^\/api\/rankings$/,
  /^\/api\/rankings\/featured$/,
  /^\/api\/reviews\/contractors/,
  /^\/api\/unsubscribe/,
  /^\/health/,
  /^\/pages/,
  /^\/sections/,
  /^\/media/,
];

// Patterns that indicate protected endpoints (should have auth)
const PROTECTED_PATH_PATTERNS = [
  /^\/api\/admin/,
  /^\/api\/homeowner/,
  /^\/api\/contractor/,
  /^\/api\/user/,
  /^\/api\/users/,
  /^\/api\/notifications/,
  /^\/api\/chat/,
];

function parseRouteFile(filePath: string): EndpointInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const endpoints: EndpointInfo[] = [];
  const fileName = path.basename(filePath);

  // Track current route group/prefix
  let currentPrefix = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect route prefix from app.route() or similar
    const routeMatch = line.match(/\.route\(['"]([^'"]+)['"]\)/);
    if (routeMatch) {
      currentPrefix = routeMatch[1];
    }

    // Detect HTTP method calls
    for (const method of HTTP_METHODS) {
      // Match patterns like: .get('/', ...) or .post('/users', ...)
      const methodRegex = new RegExp(`\\.${method}\\(['"]([^'"]*)['"](,|\\))`);
      const match = line.match(methodRegex);

      if (match) {
        const routePath = match[1];
        const fullPath = currentPrefix + routePath;

        // Check for auth middleware in the same line or nearby lines
        const contextStart = Math.max(0, i - 2);
        const contextEnd = Math.min(lines.length, i + 5);
        const context = lines.slice(contextStart, contextEnd).join('\n');

        const hasAuth = /authenticate\(\)/.test(context);
        const hasRoleCheck = /requireRole\(/.test(context);
        const hasRateLimit = /rateLimiter\(/.test(context) || /rateLimit/.test(context);
        const hasValidation = /validate\(/.test(context) || /validateQuery\(/.test(context);

        // Extract roles if present
        const rolesMatch = context.match(/requireRole\(([^)]+)\)/);
        const roles: string[] = [];
        if (rolesMatch) {
          const rolesStr = rolesMatch[1];
          const roleMatches = rolesStr.match(/['"]([^'"]+)['"]/g);
          if (roleMatches) {
            roles.push(...roleMatches.map((r) => r.replace(/['"]/g, '')));
          }
        }

        endpoints.push({
          file: fileName,
          method: method.toUpperCase(),
          path: fullPath || '/',
          hasAuth,
          hasRoleCheck,
          roles,
          hasRateLimit,
          hasValidation,
          line: lineNum,
        });
      }
    }
  }

  return endpoints;
}

function isPublicEndpoint(endpoint: EndpointInfo): boolean {
  return PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(endpoint.path));
}

function shouldBeProtected(endpoint: EndpointInfo): boolean {
  return PROTECTED_PATH_PATTERNS.some((pattern) => pattern.test(endpoint.path));
}

function generateReport(): AuditReport {
  const routeFiles = fs.readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.routes.ts'));

  const allEndpoints: EndpointInfo[] = [];

  for (const file of routeFiles) {
    const filePath = path.join(ROUTES_DIR, file);
    const endpoints = parseRouteFile(filePath);
    allEndpoints.push(...endpoints);
  }

  const publicEndpoints = allEndpoints.filter((e) => isPublicEndpoint(e) && !e.hasAuth);
  const protectedWithoutAuth = allEndpoints.filter((e) => shouldBeProtected(e) && !e.hasAuth);
  const protectedEndpoints = allEndpoints.filter((e) => e.hasAuth);

  return {
    totalEndpoints: allEndpoints.length,
    protectedEndpoints: protectedEndpoints.length,
    unprotectedEndpoints: allEndpoints.length - protectedEndpoints.length,
    publicEndpoints,
    protectedWithoutAuth,
    allEndpoints,
  };
}

function printReport(report: AuditReport): void {
  console.log('\n========================================');
  console.log('   ENDPOINT AUTHENTICATION AUDIT');
  console.log('========================================\n');

  console.log(`Total Endpoints: ${report.totalEndpoints}`);
  console.log(`Protected (with auth): ${report.protectedEndpoints}`);
  console.log(`Unprotected: ${report.unprotectedEndpoints}`);

  if (report.protectedWithoutAuth.length > 0) {
    console.log('\n⚠️  CRITICAL: Protected endpoints WITHOUT authentication:');
    console.log('─'.repeat(60));
    for (const ep of report.protectedWithoutAuth) {
      console.log(`  ${ep.method.padEnd(7)} ${ep.path}`);
      console.log(`         File: ${ep.file}:${ep.line}`);
    }
  } else {
    console.log('\n✅ All protected endpoints have authentication middleware');
  }

  console.log('\n📋 Public Endpoints (no auth required):');
  console.log('─'.repeat(60));
  for (const ep of report.publicEndpoints.slice(0, 20)) {
    const rateLimit = ep.hasRateLimit ? '🔒' : '  ';
    console.log(`  ${rateLimit} ${ep.method.padEnd(7)} ${ep.path}`);
  }
  if (report.publicEndpoints.length > 20) {
    console.log(`  ... and ${report.publicEndpoints.length - 20} more`);
  }

  console.log('\n🔐 Protected Endpoints Summary:');
  console.log('─'.repeat(60));

  // Group by role
  const byRole: Record<string, EndpointInfo[]> = {};
  for (const ep of report.allEndpoints.filter((e) => e.hasAuth)) {
    const roleKey = ep.roles.length > 0 ? ep.roles.join(', ') : 'Authenticated (any role)';
    if (!byRole[roleKey]) byRole[roleKey] = [];
    byRole[roleKey].push(ep);
  }

  for (const [role, endpoints] of Object.entries(byRole)) {
    console.log(`\n  ${role}: ${endpoints.length} endpoints`);
    for (const ep of endpoints.slice(0, 5)) {
      console.log(`    ${ep.method.padEnd(7)} ${ep.path}`);
    }
    if (endpoints.length > 5) {
      console.log(`    ... and ${endpoints.length - 5} more`);
    }
  }

  console.log('\n========================================\n');
}

// Run the audit
const report = generateReport();
printReport(report);

// Export for programmatic use
export { generateReport, AuditReport, EndpointInfo };
