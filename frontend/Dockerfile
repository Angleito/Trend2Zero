# Multi-stage build for optimal caching and size
FROM node:18-alpine AS dependencies

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy dependency files for better caching
COPY package.json package-lock.json ./
COPY packages.dhall spago.dhall ./

# Install npm dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Install PureScript toolchain
RUN npm install -g purescript@0.15.9 spago@0.21.0

# Install Spago dependencies
RUN spago install

# Build stage
FROM node:18-alpine AS build

WORKDIR /build

# Copy dependencies from previous stage
COPY --from=dependencies /build/node_modules ./node_modules
COPY --from=dependencies /build/.spago ./.spago
COPY --from=dependencies /build/output ./output

# Copy source code
COPY . .

# Build with optimizations
RUN npx spago build --purs-args "--jobs 4"
RUN npm run build

# Production stage
FROM nginx:alpine

# Install runtime dependencies
RUN apk add --no-cache curl

# Copy custom nginx config for SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # SPA routing \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
}' > /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /build/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]