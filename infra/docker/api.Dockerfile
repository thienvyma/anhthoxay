# ============================================
# NỘI THẤT NHANH - API Dockerfile
# Multi-stage build for production
# ============================================

# Stage 1: Build (Alpine for smaller build context)
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (bcrypt, sharp)
RUN apk add --no-cache python3 make g++ libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client for linux-musl-openssl-3.0.x (Alpine) and debian-openssl-3.0.x
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x,debian-openssl-3.0.x"
RUN pnpm db:generate

# Increase Node.js memory limit for build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build API with prune to generate proper package.json and pnpm-lock.yaml
RUN pnpm nx run api:prune

# Stage 2: Production (Debian-slim for OpenSSL compatibility with Prisma)
FROM node:20-slim AS runner

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs hono

# Copy built application
COPY --from=builder /app/dist/api ./

# Copy Prisma schema (needed for migrations)
COPY --from=builder /app/infra/prisma ./infra/prisma

# Copy Prisma client from node_modules
# The generated client is in node_modules/.pnpm/@prisma+client*/node_modules/.prisma
# We need to copy both @prisma/client and the generated .prisma folder
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy generated Prisma client (may be in different locations depending on pnpm version)
# Try multiple possible locations
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma ./node_modules/.prisma

# Install production dependencies using the pruned lockfile
RUN pnpm install --prod --no-frozen-lockfile

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
CMD ["node", "main.js"]
