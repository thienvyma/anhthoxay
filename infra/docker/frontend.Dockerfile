# ============================================
# ANH THỢ XÂY - Frontend Dockerfile
# For Landing, Admin, Portal apps
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

ARG APP_NAME=landing
ARG VITE_API_URL=http://localhost:4202

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ${APP_NAME}/package.json ./${APP_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Debug: Print the API URL being used
RUN echo "Building ${APP_NAME} with VITE_API_URL=${VITE_API_URL}"

# Create .env file for Vite to read during build
# This ensures VITE_API_URL is available to Vite's env system
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env

# Set environment for build - MUST be before RUN build command
# Vite reads VITE_* env vars at build time
ENV VITE_API_URL=${VITE_API_URL}

# Build the app with explicit env var
RUN VITE_API_URL=${VITE_API_URL} pnpm nx build ${APP_NAME} --configuration=production

# Verify the build contains correct API URL (debug)
RUN echo "Checking built files for API URL..." && \
    grep -r "api.noithatnhanh.vn" dist/${APP_NAME}/ || echo "WARNING: Production API URL not found in build!"

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

ARG APP_NAME=landing

# Copy nginx config
COPY infra/docker/nginx.conf /etc/nginx/nginx.conf

# Copy built files
COPY --from=builder /app/dist/${APP_NAME} /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
