# Stage 1: dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --only=production --ignore-scripts

# Stage 2: build
FROM node:20-alpine AS builder  
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --ignore-scripts
COPY app/ .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Stage 3: runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server/index.cjs"]
