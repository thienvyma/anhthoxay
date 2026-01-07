# ============================================
# ANH THỢ XÂY - API Dockerfile
# Multi-stage build for production
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build API
RUN pnpm nx build api --configuration=production

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# Copy built files
COPY --from=builder /app/dist/api ./dist/api
COPY --from=builder /app/infra/prisma ./infra/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy package files for production dependencies
COPY --from=builder /app/dist/api/package.json ./package.json
COPY --from=builder /app/dist/api/pnpm-lock.yaml ./pnpm-lock.yaml 2>/dev/null || true

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile 2>/dev/null || npm install --omit=dev

# Set ownership
RUN chown -R hono:nodejs /app

USER hono

# Environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start server
CMD ["node", "dist/api/main.js"]
