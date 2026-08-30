# Step 1: Build Vite / React app using Node 20
FROM node:20-alpine AS build
WORKDIR /app

# Install native compilation libraries required by node-canvas
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    python3 \
    make

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Step 2: Serve static files with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]