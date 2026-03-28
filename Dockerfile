FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching.
COPY app/package*.json ./
RUN npm ci --legacy-peer-deps

# Build the frontend app.
COPY app/ ./
RUN npm run build

FROM nginx:1.27-alpine AS runner

# SPA routing support and lightweight static serving.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
