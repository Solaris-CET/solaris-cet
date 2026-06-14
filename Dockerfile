FROM node:20-alpine AS builder
WORKDIR /
COPY package*.json ./
COPY tsconfig*.json ./
COPY api/ /api/
RUN npm install --ignore-scripts
COPY app/ /app/
COPY scripts/ /scripts/
WORKDIR /app
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "server/index.cjs"]
