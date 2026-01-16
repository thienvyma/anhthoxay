/**
 * Frontend-Backend API Connection Audit Script
 *
 * This script performs a comprehensive audit of API connections between
 * frontend apps (Landing and Admin) and the backend API.
 *
 * Features:
 * - Extracts all API endpoints called from frontend
 * - Extracts all API routes defined in backend
 * - Compares and identifies missing/orphan routes
 * - Generates detailed audit reports
 *
 * Usage: npx tsx scripts/audit-api-connections.ts
 *
 * **Feature: frontend-api-connection-audit**
 * **Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 27.1, 27.2, 27.3**
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FrontendEndpoint {
  endpoint: string;
  method: string;
  sourceFile: string;
  sourceLine: number;
  app: 'landing' | 'admin';
  apiModule: string;
  functionName: string;
}

export interface BackendRoute {
  route: string;
  method: string;
  sourceFile: string;
  sourceLine: number;
  hasAuth: boolean;
  hasRoleCheck: boolean;
  roles: string[];
  hasRateLimit: boolean;
  hasValidation: boolean;
  routePrefix: string;
}

export interface EndpointMatch {
  frontend: FrontendEndpoint;
  backend: BackendRoute | null;
  status: 'matched' | 'missing_backend' | 'method_mismatch';
}

export interface AuditResult {
  timestamp: string;
  summary: {
    totalFrontendEndpoints: number;
    totalBackendRoutes: number;
    matchedEndpoints: number;
    missingBackendRoutes: number;
    orphanBackendRoutes: number;
    methodMismatches: number;
  };
  landingApp: {
    endpoints: FrontendEndpoint[];
    byModule: Record<string, FrontendEndpoint[]>;
  };
  adminApp: {
    endpoints: FrontendEndpoint[];
    byModule: Record<string, FrontendEndpoint[]>;
  };
  backendRoutes: BackendRoute[];
  matches: EndpointMatch[];
  missingRoutes: {
    endpoint: string;
    method: string;
    calledFrom: string[];
    severity: 'critical' | 'high' | 'medium' | 'low';
    fixRecommendation: string;
  }[];
  orphanRoutes: {
    route: string;
    method: string;
    definedIn: string;
    recommendation: string;
  }[];
  methodMismatches: {
    endpoint: string;
    frontendMethod: string;
    backendMethod: string;
    sourceFile: string;
  }[];
}

// ============================================
// CONSTANTS
// ============================================

const PROJECT_ROOT = path.join(__dirname, '..');
const LANDING_API_DIR = path.join(PROJECT_ROOT, 'landing/src/app');
const ADMIN_API_DIR = path.join(PROJECT_ROOT, 'admin/src/app/api');
const BACKEND_ROUTES_DIR = path.join(PROJECT_ROOT, 'api/src/routes/firestore');

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// Patterns for public endpoints (expected to not have auth)
const PUBLIC_ENDPOINT_PATTERNS = [
  /^\/blog\/posts$/,
  /^\/blog\/posts\/[^/]+$/,
  /^\/blog\/categories$/,
  /^\/pages\/[^/]+$/,
  /^\/settings\/company$/,
  /^\/api\/furniture\//,
  /^\/api\/projects$/,
  /^\/api\/regions/,
  /^\/service-categories$/,
  /^\/unit-prices$/,
  /^\/materials$/,
  /^\/media\/gallery$/,
  /^\/media\/featured$/,
  /^\/leads$/,
  /^\/health/,
];

// Severity mapping for missing routes
const SEVERITY_PATTERNS: { pattern: RegExp; severity: 'critical' | 'high' | 'medium' | 'low' }[] = [
  { pattern: /^\/api\/admin\//, severity: 'critical' },
  { pattern: /^\/api\/auth\//, severity: 'critical' },
  { pattern: /^\/api\/users\//, severity: 'high' },
  { pattern: /^\/api\/furniture\/quotations/, severity: 'high' },
  { pattern: /^\/leads/, severity: 'medium' },
  { pattern: /^\/blog\//, severity: 'low' },
  { pattern: /^\/pages\//, severity: 'low' },
];


// ============================================
// FRONTEND ENDPOINT EXTRACTION
// ============================================

/**
 * Extract endpoints from a frontend API client file
 * Parses patterns like:
 * - apiFetch<T>('/endpoint', ...)
 * - fetch(`${API_URL}/endpoint`, ...)
 * - return apiFetch<T>(`/endpoint/${id}`, ...)
 *
 * **Requirements: 26.1, 27.1, 27.2, 27.3**
 */
function extractFrontendEndpoints(
  filePath: string,
  app: 'landing' | 'admin'
): FrontendEndpoint[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const endpoints: FrontendEndpoint[] = [];
  const fileName = path.basename(filePath, '.ts');

  // Track current function/method name
  let currentFunction = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track function names (for API module methods)
    const funcMatch = line.match(/^\s*(\w+):\s*(?:async\s*)?\([^)]*\)\s*(?:=>|{)/);
    if (funcMatch) {
      currentFunction = funcMatch[1];
    }

    // Also match arrow function assignments
    const arrowFuncMatch = line.match(/^\s*(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?:=>|{)/);
    if (arrowFuncMatch) {
      currentFunction = arrowFuncMatch[1];
    }

    // Pattern 1: apiFetch<T>('/endpoint', ...) - simple string
    const simpleApiFetchMatch = line.match(/apiFetch<[^>]+>\s*\(\s*'([^']+)'/);
    if (simpleApiFetchMatch) {
      const endpoint = normalizeEndpoint(simpleApiFetchMatch[1]);
      const method = extractMethodFromContext(lines, i);
      
      if (endpoint.startsWith('/') && !endpoint.includes('${')) {
        endpoints.push({
          endpoint,
          method,
          sourceFile: filePath,
          sourceLine: lineNum,
          app,
          apiModule: fileName,
          functionName: currentFunction,
        });
        continue;
      }
    }

    // Pattern 2: apiFetch<T>(`/endpoint/${id}`, ...) - template literal
    const templateApiFetchMatch = line.match(/apiFetch<[^>]+>\s*\(\s*`([^`]+)`/);
    if (templateApiFetchMatch) {
      let endpoint = templateApiFetchMatch[1];
      // Replace template variables with :param
      endpoint = endpoint.replace(/\$\{[^}]+\}/g, ':param');
      endpoint = normalizeEndpoint(endpoint);
      
      if (endpoint.startsWith('/')) {
        const method = extractMethodFromContext(lines, i);
        endpoints.push({
          endpoint,
          method,
          sourceFile: filePath,
          sourceLine: lineNum,
          app,
          apiModule: fileName,
          functionName: currentFunction,
        });
        continue;
      }
    }

    // Pattern 3: fetch(`${API_URL}/endpoint`, ...) or fetch(`${API_BASE}/endpoint`, ...)
    const fetchMatch = line.match(/fetch\s*\(\s*`\$\{(?:API_URL|API_BASE)\}([^`]+)`/);
    if (fetchMatch && !line.includes('apiFetch')) {
      let endpoint = fetchMatch[1];
      // Replace template variables with :param
      endpoint = endpoint.replace(/\$\{[^}]+\}/g, ':param');
      endpoint = normalizeEndpoint(endpoint);
      
      if (endpoint.startsWith('/')) {
        const method = extractMethodFromContext(lines, i);
        endpoints.push({
          endpoint,
          method,
          sourceFile: filePath,
          sourceLine: lineNum,
          app,
          apiModule: fileName,
          functionName: currentFunction,
        });
      }
    }
  }

  // Deduplicate endpoints (same endpoint+method from same file)
  const seen = new Set<string>();
  return endpoints.filter((ep) => {
    const key = `${ep.method}:${ep.endpoint}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Normalize endpoint path
 * - Remove query strings
 * - Normalize parameter patterns
 */
function normalizeEndpoint(endpoint: string): string {
  // Remove query string and anything after ?
  endpoint = endpoint.split('?')[0];
  // Remove template literal artifacts like ${query, ${queryString, etc.
  endpoint = endpoint.replace(/\$\{[^}]*$/g, '');
  // Remove trailing template expressions that look like query params
  endpoint = endpoint.replace(/\$\{query[^}]*\}$/gi, '');
  // Remove trailing slash
  endpoint = endpoint.replace(/\/$/, '');
  // Normalize :param patterns (e.g., :id, :slug, :projectId)
  endpoint = endpoint.replace(/:[a-zA-Z_]+/g, ':param');
  // Normalize ${...} patterns to :param
  endpoint = endpoint.replace(/\$\{[^}]+\}/g, ':param');
  // Fix patterns like /path:param to /path/:param
  endpoint = endpoint.replace(/([a-z])(:param)/gi, '$1/$2');
  // Clean up any double slashes
  endpoint = endpoint.replace(/\/+/g, '/');
  // Remove trailing :param if it's not preceded by /
  endpoint = endpoint.replace(/:param$/, '/:param').replace('//:param', '/:param');
  return endpoint;
}

/**
 * Extract HTTP method from context around the line
 */
function extractMethodFromContext(lines: string[], lineIndex: number): string {
  const contextStart = Math.max(0, lineIndex - 3);
  const contextEnd = Math.min(lines.length, lineIndex + 3);
  const context = lines.slice(contextStart, contextEnd).join('\n');

  // Check for explicit method in options
  if (/method:\s*['"]POST['"]/i.test(context)) return 'POST';
  if (/method:\s*['"]PUT['"]/i.test(context)) return 'PUT';
  if (/method:\s*['"]PATCH['"]/i.test(context)) return 'PATCH';
  if (/method:\s*['"]DELETE['"]/i.test(context)) return 'DELETE';

  // Default to GET
  return 'GET';
}

/**
 * Extract all endpoints from Landing app
 * **Requirements: 26.1, 27.1, 27.2, 27.3**
 */
function extractLandingEndpoints(): FrontendEndpoint[] {
  const endpoints: FrontendEndpoint[] = [];

  // Main API file
  const mainApiPath = path.join(LANDING_API_DIR, 'api.ts');
  if (fs.existsSync(mainApiPath)) {
    endpoints.push(...extractFrontendEndpoints(mainApiPath, 'landing'));
  }

  // Furniture API
  const furnitureApiPath = path.join(LANDING_API_DIR, 'api/furniture.ts');
  if (fs.existsSync(furnitureApiPath)) {
    endpoints.push(...extractFrontendEndpoints(furnitureApiPath, 'landing'));
  }

  return endpoints;
}

/**
 * Extract all endpoints from Admin app
 * **Requirements: 26.2, 27.4, 27.5, 27.6**
 */
function extractAdminEndpoints(): FrontendEndpoint[] {
  const endpoints: FrontendEndpoint[] = [];

  if (!fs.existsSync(ADMIN_API_DIR)) {
    console.warn(`Admin API directory not found: ${ADMIN_API_DIR}`);
    return endpoints;
  }

  // Get all .ts files in admin/src/app/api/
  const files = fs.readdirSync(ADMIN_API_DIR);
  
  for (const file of files) {
    if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      const filePath = path.join(ADMIN_API_DIR, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        endpoints.push(...extractFrontendEndpoints(filePath, 'admin'));
      }
    }
  }

  // Also check furniture subdirectory
  const furnitureDir = path.join(ADMIN_API_DIR, 'furniture');
  if (fs.existsSync(furnitureDir)) {
    const furnitureFiles = fs.readdirSync(furnitureDir);
    for (const file of furnitureFiles) {
      if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
        const filePath = path.join(furnitureDir, file);
        endpoints.push(...extractFrontendEndpoints(filePath, 'admin'));
      }
    }
  }

  return endpoints;
}


// ============================================
// BACKEND ROUTE EXTRACTION
// ============================================

/**
 * Parse main.ts to extract route mounting prefixes
 * Returns a map of route factory name to prefix
 */
function extractRoutePrefixes(): Map<string, string> {
  const prefixes = new Map<string, string>();
  const mainPath = path.join(PROJECT_ROOT, 'api/src/main.ts');
  
  if (!fs.existsSync(mainPath)) {
    console.warn(`Main.ts not found: ${mainPath}`);
    return prefixes;
  }

  const content = fs.readFileSync(mainPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    // Match patterns like: app.route('/api/admin/projects', createAdminProjectFirestoreRoutes());
    const routeMatch = line.match(/app\.route\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)(?:\(\))?/);
    if (routeMatch) {
      const prefix = routeMatch[1];
      const routeName = routeMatch[2];
      prefixes.set(routeName, prefix);
    }
  }

  return prefixes;
}

/**
 * Extract routes from a backend route file
 * Parses Hono route patterns like:
 * - app.get('/path', ...)
 * - app.post('/path', authenticate(), ...)
 * - .route('/prefix').get('/path', ...)
 *
 * **Requirements: 26.3, 26.4**
 */
function extractBackendRoutes(filePath: string, routePrefixes: Map<string, string>): BackendRoute[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const routes: BackendRoute[] = [];

  // Track current route prefix from .route() calls within the file
  let currentPrefix = '';
  
  // Track current function name to match with route prefixes from main.ts
  let currentFunctionName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect function definition to track which route factory we're in
    const funcMatch = line.match(/export\s+function\s+(\w+)/);
    if (funcMatch) {
      currentFunctionName = funcMatch[1];
      currentPrefix = ''; // Reset prefix for new function
    }

    // Detect route prefix from .route('/prefix') within the file
    const routeMatch = line.match(/\.route\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (routeMatch) {
      currentPrefix = routeMatch[1];
    }

    // Detect HTTP method calls
    for (const method of HTTP_METHODS) {
      const methodLower = method.toLowerCase();
      
      // Match patterns like: .get('/path', ...) or .get('/', ...)
      const methodRegex = new RegExp(`\\.${methodLower}\\s*\\(\\s*['"]([^'"]*)['"](\\s*,|\\s*\\))`);
      const match = line.match(methodRegex);

      if (match) {
        const routePath = match[1];
        
        // Get the base prefix from main.ts route mounting
        let basePrefix = '';
        if (currentFunctionName && routePrefixes.has(currentFunctionName)) {
          basePrefix = routePrefixes.get(currentFunctionName) || '';
        }
        
        // Combine: basePrefix + currentPrefix + routePath
        let fullPath = (basePrefix + currentPrefix + routePath).replace(/\/+/g, '/') || '/';
        fullPath = normalizeEndpoint(fullPath);

        // Check for middleware in the same line or nearby lines
        const contextStart = Math.max(0, i - 2);
        const contextEnd = Math.min(lines.length, i + 10);
        const context = lines.slice(contextStart, contextEnd).join('\n');

        const hasAuth = /firebaseAuth\s*\(\s*\)/.test(context) || /authenticate\s*\(\s*\)/.test(context);
        const hasRoleCheck = /requireRole\s*\(/.test(context);
        const hasRateLimit = /rateLimiter\s*\(/.test(context) || /rateLimit/.test(context);
        const hasValidation = /validate\s*\(/.test(context) || /validateQuery\s*\(/.test(context);

        // Extract roles if present
        const rolesMatch = context.match(/requireRole\s*\(\s*([^)]+)\s*\)/);
        const roles: string[] = [];
        if (rolesMatch) {
          const rolesStr = rolesMatch[1];
          const roleMatches = rolesStr.match(/['"]([^'"]+)['"]/g);
          if (roleMatches) {
            roles.push(...roleMatches.map((r) => r.replace(/['"]/g, '')));
          }
        }

        routes.push({
          route: fullPath,
          method,
          sourceFile: filePath,
          sourceLine: lineNum,
          hasAuth,
          hasRoleCheck,
          roles,
          hasRateLimit,
          hasValidation,
          routePrefix: basePrefix + currentPrefix,
        });
      }
    }
  }

  return routes;
}

/**
 * Extract all routes from backend
 * **Requirements: 26.3**
 */
function extractAllBackendRoutes(): BackendRoute[] {
  const routes: BackendRoute[] = [];

  if (!fs.existsSync(BACKEND_ROUTES_DIR)) {
    console.warn(`Backend routes directory not found: ${BACKEND_ROUTES_DIR}`);
    return routes;
  }

  // First, extract route prefixes from main.ts
  const routePrefixes = extractRoutePrefixes();
  console.log(`   Found ${routePrefixes.size} route prefixes in main.ts`);

  const files = fs.readdirSync(BACKEND_ROUTES_DIR);
  
  for (const file of files) {
    if (file.endsWith('.routes.ts')) {
      const filePath = path.join(BACKEND_ROUTES_DIR, file);
      routes.push(...extractBackendRoutes(filePath, routePrefixes));
    }
  }

  return routes;
}

// ============================================
// COMPARISON AND MATCHING
// ============================================

/**
 * Normalize route for comparison
 * Converts :param, :id, :slug etc. to a common pattern
 */
function normalizeRouteForComparison(route: string): string {
  return route
    .replace(/:[a-zA-Z_]+/g, ':param')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

/**
 * Check if two routes match (considering parameters)
 */
function routesMatch(frontendEndpoint: string, backendRoute: string): boolean {
  const normalizedFrontend = normalizeRouteForComparison(frontendEndpoint);
  const normalizedBackend = normalizeRouteForComparison(backendRoute);
  return normalizedFrontend === normalizedBackend;
}

/**
 * Find matching backend route for a frontend endpoint
 */
function findMatchingBackendRoute(
  endpoint: FrontendEndpoint,
  backendRoutes: BackendRoute[]
): BackendRoute | null {
  for (const route of backendRoutes) {
    if (routesMatch(endpoint.endpoint, route.route)) {
      return route;
    }
  }
  return null;
}

/**
 * Compare frontend endpoints with backend routes
 * **Requirements: 26.4, 26.5**
 */
function compareEndpoints(
  frontendEndpoints: FrontendEndpoint[],
  backendRoutes: BackendRoute[]
): {
  matches: EndpointMatch[];
  missingRoutes: AuditResult['missingRoutes'];
  orphanRoutes: AuditResult['orphanRoutes'];
  methodMismatches: AuditResult['methodMismatches'];
} {
  const matches: EndpointMatch[] = [];
  const missingRoutesMap = new Map<string, { endpoint: string; method: string; calledFrom: string[] }>();
  const methodMismatches: AuditResult['methodMismatches'] = [];
  const usedBackendRoutes = new Set<string>();

  // Check each frontend endpoint
  for (const frontend of frontendEndpoints) {
    const matchingBackend = findMatchingBackendRoute(frontend, backendRoutes);

    if (matchingBackend) {
      usedBackendRoutes.add(`${matchingBackend.method}:${matchingBackend.route}`);

      // Check method match
      if (frontend.method !== matchingBackend.method) {
        methodMismatches.push({
          endpoint: frontend.endpoint,
          frontendMethod: frontend.method,
          backendMethod: matchingBackend.method,
          sourceFile: frontend.sourceFile,
        });
        matches.push({
          frontend,
          backend: matchingBackend,
          status: 'method_mismatch',
        });
      } else {
        matches.push({
          frontend,
          backend: matchingBackend,
          status: 'matched',
        });
      }
    } else {
      // Missing backend route
      const key = `${frontend.method}:${frontend.endpoint}`;
      const existing = missingRoutesMap.get(key);
      if (existing) {
        existing.calledFrom.push(`${frontend.sourceFile}:${frontend.sourceLine}`);
      } else {
        missingRoutesMap.set(key, {
          endpoint: frontend.endpoint,
          method: frontend.method,
          calledFrom: [`${frontend.sourceFile}:${frontend.sourceLine}`],
        });
      }
      matches.push({
        frontend,
        backend: null,
        status: 'missing_backend',
      });
    }
  }

  // Find orphan backend routes
  const orphanRoutes: AuditResult['orphanRoutes'] = [];
  for (const route of backendRoutes) {
    const key = `${route.method}:${route.route}`;
    if (!usedBackendRoutes.has(key)) {
      // Check if any frontend endpoint matches (with different method)
      const hasAnyFrontendMatch = frontendEndpoints.some(
        (fe) => routesMatch(fe.endpoint, route.route)
      );

      orphanRoutes.push({
        route: route.route,
        method: route.method,
        definedIn: route.sourceFile,
        recommendation: getOrphanRecommendation(route.route, route.method, hasAnyFrontendMatch),
      });
    }
  }

  // Convert missing routes map to array with severity and fix recommendations
  const missingRoutes: AuditResult['missingRoutes'] = Array.from(missingRoutesMap.values()).map(
    (item) => ({
      ...item,
      severity: getSeverity(item.endpoint),
      fixRecommendation: getFixRecommendation(item.endpoint, item.method),
    })
  );

  return { matches, missingRoutes, orphanRoutes, methodMismatches };
}

/**
 * Check if endpoint is expected to be public
 */
function isPublicEndpoint(endpoint: string): boolean {
  return PUBLIC_ENDPOINT_PATTERNS.some((pattern) => pattern.test(endpoint));
}

/**
 * Get severity level for a missing route
 */
function getSeverity(endpoint: string): 'critical' | 'high' | 'medium' | 'low' {
  for (const { pattern, severity } of SEVERITY_PATTERNS) {
    if (pattern.test(endpoint)) {
      return severity;
    }
  }
  return 'medium';
}

/**
 * Generate fix recommendation for a missing route
 * **Requirements: 26.4, 26.5**
 */
function getFixRecommendation(endpoint: string, method: string): string {
  // Admin routes
  if (endpoint.startsWith('/api/admin/')) {
    const routeName = endpoint.replace('/api/admin/', '').split('/')[0];
    return `Create route handler in api/src/routes/firestore/${routeName}.firestore.routes.ts with ${method} handler and firebaseAuth() + requireRole('ADMIN') middleware`;
  }
  
  // Auth routes
  if (endpoint.startsWith('/api/auth/')) {
    return `Add ${method} handler to api/src/routes/firestore/auth.firestore.routes.ts with firebaseAuth() middleware`;
  }
  
  // User routes
  if (endpoint.startsWith('/api/users/')) {
    return `Add ${method} handler to api/src/routes/firestore/users.firestore.routes.ts with appropriate auth middleware`;
  }
  
  // Furniture routes
  if (endpoint.startsWith('/api/furniture/')) {
    return `Add ${method} handler to api/src/routes/firestore/furniture.firestore.routes.ts`;
  }
  
  // Blog routes
  if (endpoint.startsWith('/blog/')) {
    return `Add ${method} handler to api/src/routes/firestore/blog.firestore.routes.ts`;
  }
  
  // Pages routes
  if (endpoint.startsWith('/pages/')) {
    return `Add ${method} handler to api/src/routes/firestore/pages.firestore.routes.ts`;
  }
  
  // Settings routes
  if (endpoint.startsWith('/settings/')) {
    return `Add ${method} handler to api/src/routes/firestore/settings.firestore.routes.ts`;
  }
  
  // Media routes
  if (endpoint.startsWith('/media/')) {
    return `Add ${method} handler to api/src/routes/firestore/media.firestore.routes.ts`;
  }
  
  // Leads routes
  if (endpoint.startsWith('/leads')) {
    return `Add ${method} handler to api/src/routes/firestore/leads.firestore.routes.ts`;
  }
  
  // Integration routes
  if (endpoint.startsWith('/integrations/')) {
    return `Add ${method} handler to api/src/routes/firestore/settings.firestore.routes.ts (integrations section)`;
  }
  
  // Chat routes
  if (endpoint.startsWith('/api/chat/')) {
    return `Add ${method} handler to api/src/routes/firestore/chat.firestore.routes.ts`;
  }
  
  // Default
  return `Create appropriate route handler in api/src/routes/firestore/ with ${method} method`;
}

/**
 * Generate recommendation for orphan route
 * **Requirements: 26.4, 26.5**
 */
function getOrphanRecommendation(route: string, method: string, hasAnyFrontendMatch: boolean): string {
  if (hasAnyFrontendMatch) {
    return 'Route exists but method mismatch - verify frontend usage and align HTTP methods';
  }
  
  if (isPublicEndpoint(route)) {
    return 'Public endpoint - may be used by external clients or SSR. Document if intentional.';
  }
  
  // Check if it's a utility/internal route
  if (route.includes('/health') || route.includes('/metrics') || route.includes('/status')) {
    return 'Internal/monitoring endpoint - keep for system health checks';
  }
  
  // Check if it's a webhook or callback
  if (route.includes('/webhook') || route.includes('/callback')) {
    return 'Webhook/callback endpoint - may be called by external services';
  }
  
  return 'Consider removing if unused, or add frontend integration if needed';
}


// ============================================
// REPORT GENERATION
// ============================================

/**
 * Group endpoints by module
 */
function groupByModule(endpoints: FrontendEndpoint[]): Record<string, FrontendEndpoint[]> {
  const grouped: Record<string, FrontendEndpoint[]> = {};
  for (const endpoint of endpoints) {
    const key = endpoint.apiModule;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(endpoint);
  }
  return grouped;
}

/**
 * Generate the complete audit result
 * **Requirements: 26.4, 26.5**
 */
function generateAuditResult(): AuditResult {
  console.log('🔍 Starting API Connection Audit...\n');

  // Extract endpoints
  console.log('📱 Extracting Landing app endpoints...');
  const landingEndpoints = extractLandingEndpoints();
  console.log(`   Found ${landingEndpoints.length} endpoints\n`);

  console.log('🖥️  Extracting Admin app endpoints...');
  const adminEndpoints = extractAdminEndpoints();
  console.log(`   Found ${adminEndpoints.length} endpoints\n`);

  console.log('⚙️  Extracting Backend routes...');
  const backendRoutes = extractAllBackendRoutes();
  console.log(`   Found ${backendRoutes.length} routes\n`);

  // Combine all frontend endpoints
  const allFrontendEndpoints = [...landingEndpoints, ...adminEndpoints];

  // Compare
  console.log('🔄 Comparing endpoints...\n');
  const { matches, missingRoutes, orphanRoutes, methodMismatches } = compareEndpoints(
    allFrontendEndpoints,
    backendRoutes
  );

  const matchedCount = matches.filter((m) => m.status === 'matched').length;

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalFrontendEndpoints: allFrontendEndpoints.length,
      totalBackendRoutes: backendRoutes.length,
      matchedEndpoints: matchedCount,
      missingBackendRoutes: missingRoutes.length,
      orphanBackendRoutes: orphanRoutes.length,
      methodMismatches: methodMismatches.length,
    },
    landingApp: {
      endpoints: landingEndpoints,
      byModule: groupByModule(landingEndpoints),
    },
    adminApp: {
      endpoints: adminEndpoints,
      byModule: groupByModule(adminEndpoints),
    },
    backendRoutes,
    matches,
    missingRoutes,
    orphanRoutes,
    methodMismatches,
  };
}

/**
 * Print audit report to console
 */
function printReport(result: AuditResult): void {
  console.log('\n========================================');
  console.log('   FRONTEND-BACKEND API CONNECTION AUDIT');
  console.log('========================================\n');

  console.log('📊 SUMMARY');
  console.log('─'.repeat(50));
  console.log(`Total Frontend Endpoints: ${result.summary.totalFrontendEndpoints}`);
  console.log(`  - Landing App: ${result.landingApp.endpoints.length}`);
  console.log(`  - Admin App: ${result.adminApp.endpoints.length}`);
  console.log(`Total Backend Routes: ${result.summary.totalBackendRoutes}`);
  console.log(`Matched Endpoints: ${result.summary.matchedEndpoints}`);
  console.log(`Missing Backend Routes: ${result.summary.missingBackendRoutes}`);
  console.log(`Orphan Backend Routes: ${result.summary.orphanBackendRoutes}`);
  console.log(`Method Mismatches: ${result.summary.methodMismatches}`);

  // Missing routes
  if (result.missingRoutes.length > 0) {
    console.log('\n⚠️  MISSING BACKEND ROUTES');
    console.log('─'.repeat(50));
    
    const bySeverity = {
      critical: result.missingRoutes.filter((r) => r.severity === 'critical'),
      high: result.missingRoutes.filter((r) => r.severity === 'high'),
      medium: result.missingRoutes.filter((r) => r.severity === 'medium'),
      low: result.missingRoutes.filter((r) => r.severity === 'low'),
    };

    if (bySeverity.critical.length > 0) {
      console.log('\n🔴 CRITICAL:');
      for (const route of bySeverity.critical) {
        console.log(`  ${route.method.padEnd(7)} ${route.endpoint}`);
        console.log(`         Called from: ${route.calledFrom.slice(0, 2).join(', ')}${route.calledFrom.length > 2 ? '...' : ''}`);
        console.log(`         Fix: ${route.fixRecommendation}`);
      }
    }

    if (bySeverity.high.length > 0) {
      console.log('\n🟠 HIGH:');
      for (const route of bySeverity.high) {
        console.log(`  ${route.method.padEnd(7)} ${route.endpoint}`);
      }
    }

    if (bySeverity.medium.length > 0) {
      console.log('\n🟡 MEDIUM:');
      for (const route of bySeverity.medium.slice(0, 10)) {
        console.log(`  ${route.method.padEnd(7)} ${route.endpoint}`);
      }
      if (bySeverity.medium.length > 10) {
        console.log(`  ... and ${bySeverity.medium.length - 10} more`);
      }
    }

    if (bySeverity.low.length > 0) {
      console.log('\n🟢 LOW:');
      for (const route of bySeverity.low.slice(0, 5)) {
        console.log(`  ${route.method.padEnd(7)} ${route.endpoint}`);
      }
      if (bySeverity.low.length > 5) {
        console.log(`  ... and ${bySeverity.low.length - 5} more`);
      }
    }
  } else {
    console.log('\n✅ All frontend endpoints have matching backend routes!');
  }

  // Method mismatches
  if (result.methodMismatches.length > 0) {
    console.log('\n⚠️  METHOD MISMATCHES');
    console.log('─'.repeat(50));
    for (const mismatch of result.methodMismatches) {
      console.log(`  ${mismatch.endpoint}`);
      console.log(`    Frontend: ${mismatch.frontendMethod}, Backend: ${mismatch.backendMethod}`);
    }
  }

  // Orphan routes (limited output)
  if (result.orphanRoutes.length > 0) {
    console.log('\n📋 ORPHAN BACKEND ROUTES (not called from frontend)');
    console.log('─'.repeat(50));
    for (const route of result.orphanRoutes.slice(0, 15)) {
      console.log(`  ${route.method.padEnd(7)} ${route.route}`);
      console.log(`         ${route.recommendation}`);
    }
    if (result.orphanRoutes.length > 15) {
      console.log(`  ... and ${result.orphanRoutes.length - 15} more (see full report)`);
    }
  }

  // Landing app breakdown
  console.log('\n📱 LANDING APP ENDPOINTS BY MODULE');
  console.log('─'.repeat(50));
  for (const [module, endpoints] of Object.entries(result.landingApp.byModule)) {
    console.log(`  ${module}: ${endpoints.length} endpoints`);
  }

  // Admin app breakdown
  console.log('\n🖥️  ADMIN APP ENDPOINTS BY MODULE');
  console.log('─'.repeat(50));
  for (const [module, endpoints] of Object.entries(result.adminApp.byModule)) {
    console.log(`  ${module}: ${endpoints.length} endpoints`);
  }

  console.log('\n========================================\n');
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(result: AuditResult): string {
  let md = `# API Connection Audit Report

Generated: ${result.timestamp}

## Summary

| Metric | Count |
|--------|-------|
| Total Frontend Endpoints | ${result.summary.totalFrontendEndpoints} |
| Total Backend Routes | ${result.summary.totalBackendRoutes} |
| Matched Endpoints | ${result.summary.matchedEndpoints} |
| Missing Backend Routes | ${result.summary.missingBackendRoutes} |
| Orphan Backend Routes | ${result.summary.orphanBackendRoutes} |
| Method Mismatches | ${result.summary.methodMismatches} |

## Frontend Apps

### Landing App (${result.landingApp.endpoints.length} endpoints)

| Module | Endpoints |
|--------|-----------|
`;

  for (const [module, endpoints] of Object.entries(result.landingApp.byModule)) {
    md += `| ${module} | ${endpoints.length} |\n`;
  }

  md += `
### Admin App (${result.adminApp.endpoints.length} endpoints)

| Module | Endpoints |
|--------|-----------|
`;

  for (const [module, endpoints] of Object.entries(result.adminApp.byModule)) {
    md += `| ${module} | ${endpoints.length} |\n`;
  }

  // Missing routes
  if (result.missingRoutes.length > 0) {
    md += `
## ⚠️ Missing Backend Routes

These endpoints are called from frontend but have no matching backend route.

### Critical

| Method | Endpoint | Fix Recommendation |
|--------|----------|-------------------|
`;
    for (const route of result.missingRoutes.filter((r) => r.severity === 'critical')) {
      md += `| ${route.method} | \`${route.endpoint}\` | ${route.fixRecommendation} |\n`;
    }

    md += `
### High

| Method | Endpoint | Fix Recommendation |
|--------|----------|-------------------|
`;
    for (const route of result.missingRoutes.filter((r) => r.severity === 'high')) {
      md += `| ${route.method} | \`${route.endpoint}\` | ${route.fixRecommendation} |\n`;
    }

    md += `
### Medium/Low

| Method | Endpoint | Severity | Fix Recommendation |
|--------|----------|----------|-------------------|
`;
    for (const route of result.missingRoutes.filter((r) => r.severity === 'medium' || r.severity === 'low')) {
      md += `| ${route.method} | \`${route.endpoint}\` | ${route.severity} | ${route.fixRecommendation} |\n`;
    }
  }

  // Method mismatches
  if (result.methodMismatches.length > 0) {
    md += `
## ⚠️ Method Mismatches

| Endpoint | Frontend Method | Backend Method |
|----------|-----------------|----------------|
`;
    for (const mismatch of result.methodMismatches) {
      md += `| \`${mismatch.endpoint}\` | ${mismatch.frontendMethod} | ${mismatch.backendMethod} |\n`;
    }
  }

  // Orphan routes
  if (result.orphanRoutes.length > 0) {
    md += `
## 📋 Orphan Backend Routes

These routes exist in backend but are not called from frontend.

| Method | Route | Recommendation |
|--------|-------|----------------|
`;
    for (const route of result.orphanRoutes) {
      md += `| ${route.method} | \`${route.route}\` | ${route.recommendation} |\n`;
    }
  }

  md += `
## Recommendations

1. **Critical Missing Routes**: Implement these backend routes immediately
2. **Method Mismatches**: Align frontend and backend HTTP methods
3. **Orphan Routes**: Review and either document or remove unused routes
4. **High Priority**: Focus on authentication and admin endpoints first
`;

  return md;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main(): Promise<void> {
  try {
    const result = generateAuditResult();

    // Print to console
    printReport(result);

    // Save JSON report
    const jsonReportPath = path.join(PROJECT_ROOT, 'docs/API_AUDIT_REPORT.json');
    fs.mkdirSync(path.dirname(jsonReportPath), { recursive: true });
    fs.writeFileSync(jsonReportPath, JSON.stringify(result, null, 2));
    console.log(`📄 JSON report saved to: ${jsonReportPath}`);

    // Save Markdown report
    const mdReportPath = path.join(PROJECT_ROOT, 'docs/API_AUDIT_REPORT.md');
    fs.writeFileSync(mdReportPath, generateMarkdownReport(result));
    console.log(`📄 Markdown report saved to: ${mdReportPath}`);

    // Exit with error code if critical issues found
    const criticalCount = result.missingRoutes.filter((r) => r.severity === 'critical').length;
    if (criticalCount > 0) {
      console.log(`\n❌ Found ${criticalCount} critical missing routes!`);
      process.exit(1);
    }

    console.log('\n✅ Audit completed successfully!');
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();

// Export for programmatic use
export {
  extractLandingEndpoints,
  extractAdminEndpoints,
  extractAllBackendRoutes,
  compareEndpoints,
  generateAuditResult,
  generateMarkdownReport,
};
