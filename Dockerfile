FROM node:22-alpine AS builder

WORKDIR /repo

# Install dependencies first for better layer caching.
COPY package*.json ./
COPY app/package.json app/package.json
COPY api/package.json api/package.json
COPY contracts/package.json contracts/package.json
COPY scripts/package.json scripts/package.json
RUN npm ci

# Build prerequisites used by app prebuild script.
COPY scripts/ scripts/
COPY static/ static/

# Build the frontend app.
COPY app/ app/
RUN npm run build --workspace=app && npm run api:build --workspace=app && npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /repo/node_modules /app/node_modules
COPY --from=builder /repo/app/dist /app/dist
COPY --from=builder /repo/app/.api-dist /app/.api-dist
COPY --from=builder /repo/app/server /app/server

EXPOSE 3000

CMD ["node", "server/index.cjs"]
