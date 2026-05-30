ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /repo

ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=1

ARG VITE_PUBLIC_SITE_URL
ARG VITE_GOOGLE_SITE_VERIFICATION
ARG VITE_GIT_COMMIT_HASH
ARG VITE_BUILD_TIMESTAMP
ARG GIT_SHA
ARG BUILD_TIMESTAMP

# Install dependencies first for better layer caching.
COPY package*.json ./
COPY app/package.json app/package.json
COPY api/package.json api/package.json
COPY cli/package.json cli/package.json
COPY contracts/package.json contracts/package.json
COPY scripts/package.json scripts/package.json
RUN --mount=type=cache,target=/root/.npm HUSKY=0 npm ci --include=dev --legacy-peer-deps

# Build prerequisites used by app prebuild script.
COPY scripts/ scripts/
COPY static/ static/
COPY CHANGELOG.md CHANGELOG.md

COPY docker/build-app.sh /usr/local/bin/build-app

# Build the frontend app.
COPY app/ app/
ENV NEXT_TELEMETRY_DISABLED=1
ENV VITE_PUBLIC_SITE_URL=${VITE_PUBLIC_SITE_URL}
ENV VITE_GOOGLE_SITE_VERIFICATION=${VITE_GOOGLE_SITE_VERIFICATION}
ENV VITE_GIT_COMMIT_HASH=${VITE_GIT_COMMIT_HASH}
ENV VITE_BUILD_TIMESTAMP=${VITE_BUILD_TIMESTAMP}
ENV GIT_SHA=${GIT_SHA}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN --mount=type=cache,target=/root/.npm chmod +x /usr/local/bin/build-app && /usr/local/bin/build-app

FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /repo/node_modules /app/node_modules
COPY --from=builder --chown=app:app /repo/app/dist /app/dist
COPY --from=builder --chown=app:app /repo/app/.api-dist /app/.api-dist
COPY --from=builder --chown=app:app /repo/app/server /app/server

ENV NODE_OPTIONS=--max-old-space-size=512

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const port=process.env.PORT||3000;fetch('http://127.0.0.1:'+port+'/health.json',{cache:'no-store'}).then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

USER app

CMD ["node", "server/index.cjs"]
