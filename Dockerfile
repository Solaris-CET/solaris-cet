FROM node:20-alpine AS builder
WORKDIR /app
COPY app/package*.json ./
RUN npm install --ignore-scripts
COPY app/ .
COPY scripts/ /scripts/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "server/index.cjs"]
