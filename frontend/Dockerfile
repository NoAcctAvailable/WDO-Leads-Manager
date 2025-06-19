# Build stage
FROM node:18-alpine AS builder

# Set Node.js optimization flags for low-CPU environments with strict memory limits
ENV NODE_OPTIONS="--max-old-space-size=1536 --max-semi-space-size=64"
ENV UV_THREADPOOL_SIZE=2

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with timeout and memory optimizations
RUN npm config set fetch-timeout 60000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm install --include=dev --no-audit --no-fund && \
    npm cache clean --force

# Set NODE_ENV after dependencies are installed
ENV NODE_ENV=production

# Copy source code
COPY . .

# Build with timeout and memory monitoring
# Use timeout to prevent hanging builds
RUN timeout 300s npm run build:fast || \
    (echo "Build timed out, trying with reduced parallelism..." && \
     timeout 600s npm run build:fast) || \
    (echo "Build failed, trying simple build..." && \
     timeout 300s npx vite build --mode production)

# Production stage
FROM nginx:alpine AS production

# Install security updates
RUN apk upgrade --no-cache

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user
RUN addgroup -g 1001 -S nginx-group && \
    adduser -S nginx-user -u 1001 -G nginx-group

# Change ownership in a single layer to reduce image size
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html \
    /var/cache/nginx \
    /var/log/nginx \
    /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-group /var/run/nginx.pid

USER nginx-user

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 