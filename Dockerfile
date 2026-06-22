ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /workspace
RUN npm i -g npm@10.8.1
COPY . .
RUN npm ci

FROM deps AS builder
WORKDIR /workspace
ARG VITE_GOOGLE_SITE_VERIFICATION
ENV VITE_GOOGLE_SITE_VERIFICATION=${VITE_GOOGLE_SITE_VERIFICATION}
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run app:build

FROM node:${NODE_VERSION}-alpine AS runner
RUN addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /workspace/app/dist ./dist
COPY --from=builder /workspace/app/.api-dist ./.api-dist
COPY --from=builder /workspace/app/server ./server
COPY --from=builder /workspace/node_modules ./node_modules
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "const port=process.env.PORT||3000;fetch('http://127.0.0.1:'+port+'/health.json',{cache:'no-store'}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
USER app
CMD ["node", "server/index.cjs"]
