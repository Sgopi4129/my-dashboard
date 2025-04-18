# Build stage
FROM node:18-alpine3.19 AS builder
WORKDIR /app
RUN npm install -g pnpm@10.8.1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Production stage
FROM node:18-alpine3.19
WORKDIR /app
RUN npm install -g pnpm@10.8.1
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["pnpm", "start"]