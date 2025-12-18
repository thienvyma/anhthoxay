/**
 * ANH THỢ XÂY API - Main Entry Point
 *
 * This file handles:
 * - Environment setup
 * - Middleware configuration
 * - Route mounting
 * - Server startup
 *
 * **Feature: api-refactoring**
 * **Requirements: 1.1, 1.4**
 */

import { hostname } from 'os';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { PrismaClient, User } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Middleware imports
import { rateLimit } from './middleware';
import { securityHeaders } from './middleware/security-headers';
import { correlationId } from './middleware/correlation-id';
import { errorHandler } from './middleware/error-handler';
import { createCorsMiddleware } from './config/cors';

// Route imports
import { createAuthRoutes } from './routes/auth.routes';
import { createPagesRoutes, createSectionsRoutes } from './routes/pages.routes';
import { createMediaRoutes } from './routes/media.routes';
import { createLeadsRoutes } from './routes/leads.routes';
import { createPricingRoutes } from './routes/pricing.routes';
import { createBlogRoutes } from './routes/blog.routes';
import { createSettingsRoutes } from './routes/settings.routes';
import { createIntegrationsRoutes } from './routes/integrations.routes';

// Service imports
import { AuthService } from './services/auth.service';

// ============================================
// ENVIRONMENT SETUP
// ============================================

function findProjectRoot(startPath: string): string {
  let currentPath = startPath;
  while (currentPath !== path.dirname(currentPath)) {
    if (
      fs.existsSync(path.join(currentPath, '.env')) ||
      fs.existsSync(path.join(currentPath, 'infra', 'prisma', 'schema.prisma'))
    ) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  return startPath;
}

const projectRoot = findProjectRoot(process.cwd());
const envPath = path.join(projectRoot, '.env');

// Set DATABASE_URL to correct absolute path
const dbPath = path.join(projectRoot, 'infra', 'prisma', 'dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

// Load other env vars from .env file
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && match[1] !== 'DATABASE_URL') {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
}

console.log('🔧 ANH THỢ XÂY API Starting...');
console.log('📁 Project root:', projectRoot);
console.log('🗄️ DATABASE_URL:', process.env.DATABASE_URL);

// ============================================
// APP INITIALIZATION
// ============================================

const prisma = new PrismaClient();
const app = new Hono<{ Variables: { user?: User; correlationId: string } }>();
const authService = new AuthService(prisma);

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Security Headers (must be before other middleware)
app.use('*', securityHeaders());

// Correlation ID middleware (for request tracing)
app.use('*', correlationId());

// CORS (using new config module)
app.use('*', createCorsMiddleware());

// JWT Auth Middleware - Attach user to context from Bearer token (with blacklist check)
app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const isBlacklisted = await authService.isBlacklisted(token);
    if (!isBlacklisted) {
      const { payload, error } = authService.verifyAccessTokenWithError(token);
      if (payload && !error) {
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (user) {
          c.set('user', user);
        }
      }
    }
  }
  await next();
});

// Rate limiting
app.use('/api/auth/login', rateLimit({ windowMs: 1 * 60 * 1000, max: 20 }));
app.use('/leads', rateLimit({ windowMs: 60 * 1000, max: 30 }));
app.use('*', rateLimit({ windowMs: 60 * 1000, max: 200 }));

// ============================================
// HEALTH CHECK & ROOT
// ============================================

app.get('/health', (c) => c.json({ ok: true, service: 'ath-api', host: hostname() }));

app.get('/', (c) =>
  c.json({
    ok: true,
    message: 'Anh Thợ Xây API',
    endpoints: ['/health', '/api/auth/login', '/pages/:slug', '/service-categories', '/materials', '/leads'],
  })
);

// ============================================
// ROUTE MOUNTING
// ============================================

// Auth routes
app.route('/api/auth', createAuthRoutes(prisma));

// Pages & Sections routes
app.route('/pages', createPagesRoutes(prisma));
app.route('/sections', createSectionsRoutes(prisma));

// Media routes
app.route('/media', createMediaRoutes(prisma));

// Leads routes
app.route('/leads', createLeadsRoutes(prisma));

// Pricing routes (service-categories, unit-prices, materials, formulas, calculate-quote)
const pricingRoutes = createPricingRoutes(prisma);
app.route('/', pricingRoutes);

// Blog routes
app.route('/blog', createBlogRoutes(prisma));

// Settings routes
app.route('/settings', createSettingsRoutes(prisma));

// Integrations routes
app.route('/integrations', createIntegrationsRoutes(prisma));

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.onError(errorHandler());

// ============================================
// START SERVER
// ============================================

const port = parseInt(process.env.PORT || '4202', 10);
console.log(`🚀 Starting server on port ${port}...`);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`✅ ANH THỢ XÂY API running at http://localhost:${info.port}`);
});

export default app;
