# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Set Node.js heap size to prevent memory issues during build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install security updates
RUN apk upgrade --no-cache

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user
RUN addgroup -g 1001 -S nginx-group
RUN adduser -S nginx-user -u 1001 -G nginx-group

# Change ownership
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html
RUN chown -R nginx-user:nginx-group /var/cache/nginx
RUN chown -R nginx-user:nginx-group /var/log/nginx
RUN chown -R nginx-user:nginx-group /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx-user:nginx-group /var/run/nginx.pid

USER nginx-user

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 