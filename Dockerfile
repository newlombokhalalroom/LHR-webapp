# Stage 1: Build
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build

# Stage 2: Run
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output /app/.output

EXPOSE 3001
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]