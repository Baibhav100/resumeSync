# ============================================
# Server Dockerfile — Production (Coolify/Docker)
# Includes Puppeteer + Chromium support
# ============================================
FROM node:20-slim

WORKDIR /app

# Install Chromium + system deps for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to skip downloading Chromium (we installed it via apt)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose the API port
EXPOSE 5000

# Production start (uses node, not nodemon)
CMD ["node", "index.js"]
