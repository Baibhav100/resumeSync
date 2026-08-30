# ============================================
# Client Dockerfile — Production (Coolify/Docker)
# React + Vite build served via Nginx
# ============================================

# Step 1: Build stage
FROM node:20-slim AS build
WORKDIR /app

# Install canvas/native module build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    make \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# VITE_API_BASE_URL is injected at build time via Coolify env vars
RUN npm run build

# Step 2: Production stage — serve with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config (SPA routing + compression)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]