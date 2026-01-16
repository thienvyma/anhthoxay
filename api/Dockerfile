# Simple production Dockerfile
# Requires pre-built dist/api folder from local build

FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies for native modules (sharp needs these)
RUN apk add --no-cache vips-dev

# Install pnpm
RUN npm install -g pnpm@10

# Copy pre-built API files
COPY dist/api/package.json ./
COPY dist/api/pnpm-lock.yaml ./
COPY dist/api/main.js ./

# Install production dependencies
RUN pnpm install --prod

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD ["node", "main.js"]
