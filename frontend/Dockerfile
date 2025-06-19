# Build stage
FROM node:18-alpine AS builder

# Set Node.js optimization flags for low-CPU environments
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=128"
ENV NODE_ENV=production

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
# Clear cache to save space and avoid memory issues
RUN npm install && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application without TypeScript checking for speed
# Use the fast build script that skips tsc
RUN npm run build:fast

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