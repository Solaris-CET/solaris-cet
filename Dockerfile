ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /repo

# Install dependencies first for better layer caching.
COPY package*.json ./
COPY app/package.json app/package.json
COPY api/package.json api/package.json
COPY contracts/package.json contracts/package.json
COPY scripts/package.json scripts/package.json
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev

# Build prerequisites used by app prebuild script.
COPY scripts/ scripts/
COPY static/ static/

# Build the frontend app.
COPY app/ app/
RUN --mount=type=cache,target=/root/.npm npm run build --workspace=app && npm run api:build --workspace=app && npm prune --omit=dev

FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /repo/node_modules /app/node_modules
COPY --from=builder --chown=app:app /repo/app/dist /app/dist
COPY --from=builder --chown=app:app /repo/app/.api-dist /app/.api-dist
COPY --from=builder --chown=app:app /repo/app/server /app/server

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const port=process.env.PORT||3000;fetch('http://127.0.0.1:'+port+'/health.json',{cache:'no-store'}).then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

USER app

CMD ["node", "server/index.cjs"]
