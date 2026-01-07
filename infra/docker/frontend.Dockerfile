# ============================================
# ANH THỢ XÂY - Frontend Dockerfile
# For Landing, Admin, Portal apps
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

ARG APP_NAME=landing
ARG VITE_API_URL

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ${APP_NAME}/package.json ./${APP_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set environment for build
ENV VITE_API_URL=${VITE_API_URL}

# Build the app
RUN pnpm nx build ${APP_NAME} --configuration=production

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
